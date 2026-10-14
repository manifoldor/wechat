---
name: wechat
description: 微信管理与交互控制命令
argument-hint: "[status|send|server|menu|token]"
---

执行微信插件的运维与交互控制命令。

### 可用子命令：
1. **状态检查 (`/wechat status`)**：
   - 检查微信公众号与企业微信当前连接状态、已配置变量及 Access Token 有效期。
2. **主动发送消息 (`/wechat send <toUser> <text>`)**：
   - 通过微信客服或企业微信向指定 OpenID / 外部联系人主动发送消息。
3. **Webhook 服务控制 (`/wechat server [start|stop|restart]`)**：
   - 启动、停止或重启本地接收微信消息的回调服务器。
4. **自定义菜单管理 (`/wechat menu [get|sync]`)**：
   - 查询当前微信公众号菜单，或将本地菜单配置推送到微信线上。
5. **获取/刷新凭据 (`/wechat token [refresh]`)**：
   - 查看或强制刷新当前缓存的微信全局 Access Token。
