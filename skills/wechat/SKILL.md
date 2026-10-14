---
name: wechat
description: 微信生态对接与开发技能，包含微信公众号开发、企业微信对接、微信客服OpenKF、加解密算法、被动即时回复与异步客服消息推送
globs:
  - "**/*wechat*"
  - "**/*weixin*"
  - "**/*wecom*"
alwaysApply: false
---

# WeChat Agent Integration Skill

本技能为 Grokbot Agent 提供对接微信生态（微信公众号、企业微信、微信客服）的核心知识与接口操作指引。

## 1. 核心架构与协议规范

### 1.1 Webhook 接入与签名验证
微信在开发者配置服务器 URL 时，会发送 `GET` 请求进行接入校验：
- **请求参数**：`signature`, `timestamp`, `nonce`, `echostr`
- **校验算法**：
  1. 将 `token`、`timestamp`、`nonce` 三个参数进行字典序排序。
  2. 将三个参数字符串拼接成一个字符串并进行 SHA-1 散列加密。
  3. 将加密后的字符串与 `signature` 进行比对。
  4. 若一致，原样返回 `echostr` 内容，接入成功。

### 1.2 消息加解密（安全模式 / 兼容模式）
采用官方 `WXBizMsgCrypt` 算法：
- **对称加密**：AES-256-CBC 算法，填充模式为 PKCS#7。
- **密钥生成**：`EncodingAESKey` 为 43 字符的 Base64 编码，解码后为 32 字节的 AES Key。
- **IV 向量**：取 AES Key 的前 16 字节。
- **消息结构**：
  `PlainText = 16字节随机串 + 4字节网络字节序正文长度 + 正文明文 + AppID/CorpID + PKCS7Padding`
- **签名校验**：`msg_signature = SHA1(sort([Token, Timestamp, Nonce, Encrypt]))`

### 1.3 5秒超时与双模响应机制（Agent 专属设计）
微信服务器在向开发者服务器推送事件/消息后，**必须在 5 秒内获得 HTTP 响应**。若大模型 Agent 推理耗时超过 5 秒，微信会自动重试 3 次，导致重复调用或报错。

**解决方案（双模响应）**：
1. **快速通道（被动响应 Passive Reply）**：
   - 若 Agent 在 4.5 秒内完成推理，直接以 XML 结构体返回被动回复内容。
2. **异步通道（客服消息推送 Active Custom Service Push）**：
   - 若 Agent 4.5 秒内未完成，Webhook 立即返回 `success` 或空字符串（阻止微信重试）。
   - Agent 后台继续推理，完成后调用客服消息接口（`POST /cgi-bin/message/custom/send`）主动将回复推送给用户的 OpenID。

## 2. 常用 API 与调用规范

### 2.1 凭证管理（Access Token）
- 接口地址：`GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={APPSECRET}`
- 有效期为 7200 秒，系统必须进行内存或 Redis 缓存，并在过期前 5 分钟提前刷新。

### 2.2 消息交互接口
- **发送客服文本消息**：
  ```json
  POST https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token={ACCESS_TOKEN}
  {
    "touser": "OPENID",
    "msgtype": "text",
    "text": {
      "content": "回答内容"
    }
  }
  ```
- **企业微信群机器人 Webhook**：
  ```json
  POST https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key={KEY}
  {
    "msgtype": "markdown",
    "markdown": {
      "content": "### 智能助手通知\n实时数据已更新。"
    }
  }
  ```

### 2.3 用户上下文与会话管理
- 用户唯一标识：通过 `FromUserName`（OpenID）关联 Agent 会话 ID。
- 防重幂等：缓存处理中的 `MsgId`，过期时间 60 秒。
