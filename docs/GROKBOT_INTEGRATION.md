# Grokbot 插件体系集成与加载规范

本插件严格按照 Grokbot（Grok Bot / Cursor Plugins 核心体系架构）标准进行构建，全面满足插件市场规范与运行时装载要求。

---

## 1. 插件目录与元数据规范

Grokbot 插件装载器（`PluginComponentDiscovery` 与 `loader.ts`）通过标准文件树与清单索引插件全部功能。

```
wechat/
├── .cursor-plugin/
│   ├── plugin.json         # 核心插件描述清单 (Plugin Manifest)
│   └── marketplace.json    # 插件市场注册清单 (Marketplace Manifest)
├── plugin.json             # 根目录兼容清单 (双路径发现适配)
├── .mcp.json               # Model Context Protocol (MCP) 服务配置
├── skills/                 # 技能定义目录
│   └── wechat/
│       └── SKILL.md        # YAML Frontmatter + Agent 操作技能指导
├── agents/                 # 智能体定义目录
│   └── wechat-agent.md     # 专用智能体 (包含 Prompt、模型继承与工具声明)
├── commands/               # 命令扩展目录
│   └── wechat.md           # 交互命令 /wechat [status|send|server|menu]
├── rules/                  # 行为规则目录
│   └── wechat-rules.md     # 微信交互长度、格式与安全约束准则
├── hooks/                  # 生命周期钩子
│   └── hooks.json          # SessionStart 自动化状态探针
├── scripts/                # 钩子与自动化脚本
│   └── check-wechat-status.js
└── dist/                   # 编译后的执行文件 (MCP Server & Webhook Server)
```

---

## 2. Grokbot 插件装载机理

### 2.1 清单发现与验证
Grokbot 启动时，按以下优先级查找清单文件：
1. `.cursor-plugin/plugin.json`
2. `.claude-plugin/plugin.json`
3. `plugin.json`

清单严格遵循 `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` 规范。插件名称 `wechat` 匹配 `^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$` Kebab-Case 命名约束。

### 2.2 变量解析与安全隔离
插件清单中声明的 `variables` 会在用户配置后由 Grokbot 的 `mcp-placeholder-variables.ts` 自动进行变量替换：
```json
{
  "command": "node",
  "args": ["dist/mcp/index.js"],
  "env": {
    "WECHAT_APP_ID": "${WECHAT_APP_ID}",
    "WECHAT_APP_SECRET": "${WECHAT_APP_SECRET}",
    "WECHAT_TOKEN": "${WECHAT_TOKEN}",
    "WECHAT_AES_KEY": "${WECHAT_AES_KEY}"
  }
}
```
敏感凭据标注 `writeOnly: true`，防止在前端界面或导出日志中泄漏。

### 2.3 组件自动注册
- **Skills**：加载 `skills/wechat/SKILL.md`，Agent 在遇到微信相关关键词（如 `wechat`, `weixin`, `公众号`, `企业微信`）时自动激活技能。
- **Agents**：注册 `@wechat-agent` 专属智能体，具备专门的模型系统提示词以及微信专用 MCP 工具集合。
- **Commands**：注册 `/wechat` 斜杠命令，支持用户快速查询运行状态、发送测试消息或管理菜单。
- **Rules**：注入 `wechat-rules.md` 中的格式与 5 秒时延限制准则，指导所有 Agent 严格遵守微信协议限制。
- **Hooks**：在会话启动（`SessionStart`）时调用状态探针，预警缺失的配置项。
- **MCP Server**：通过 Stdio JSON-RPC 2.0 运行 `dist/mcp/index.js`，向 Grokbot 注册全套微信生态工具。

---

## 3. 在 Grokbot 中使用此插件

### 3.1 变量配置
在 Grokbot 插件配置中填写：
- `WECHAT_APP_ID`: 微信公众号 AppID
- `WECHAT_APP_SECRET`: 微信公众号 AppSecret
- `WECHAT_TOKEN`: 开发者自定义的验证 Token
- `WECHAT_AES_KEY`: 43位 EncodingAESKey (安全模式)

### 3.2 启动 Webhook 服务
```bash
npm run server
```
将本地端口（默认 3000）通过反向代理（如 Nginx、Caddy 或 Cloudflare Tunnel）映射至外网 HTTPS 域名，并在微信公众平台填写配置。

### 3.3 与智能体互动
直接在 Grokbot 聊天框输入：
> “使用 `@wechat-agent` 查询粉丝列表，并向 OpenID `oABC-12345` 发送一条欢迎消息。”
> 
> 或者键入 `/wechat status` 检查当前微信连接状态。
