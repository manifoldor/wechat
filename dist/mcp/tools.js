export function getMcpToolDefinitions() {
    return [
        {
            name: "wechat_send_text",
            description: "向微信用户发送文本消息（自动选用公众号客服消息或企业微信应用消息）",
            inputSchema: {
                type: "object",
                properties: {
                    toUser: {
                        type: "string",
                        description: "接收消息的微信用户 OpenID 或企业微信成员账号",
                    },
                    content: {
                        type: "string",
                        description: "需要发送的文本内容（建议不超过 2048 字节）",
                    },
                    channel: {
                        type: "string",
                        enum: ["official_account", "wecom"],
                        description: "渠道类型：official_account (公众号客服) 或 wecom (企业微信)",
                    },
                },
                required: ["toUser", "content"],
            },
        },
        {
            name: "wechat_send_markdown",
            description: "发送 Markdown 富文本格式消息（主要用于企业微信自建应用或群机器人）",
            inputSchema: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "Markdown 格式文本内容（支持标题、加粗、颜色标签、超链接）",
                    },
                    toUser: {
                        type: "string",
                        description: "企业微信成员账号（发送至个人时填写）",
                    },
                    useWebhook: {
                        type: "boolean",
                        description: "是否推送到已配置的企业微信群机器人 Webhook",
                    },
                },
                required: ["content"],
            },
        },
        {
            name: "wechat_send_custom_service_msg",
            description: "通过微信公众号客服消息接口主动推送消息给用户（用户需在48小时内有交互）",
            inputSchema: {
                type: "object",
                properties: {
                    openId: {
                        type: "string",
                        description: "用户的微信 OpenID",
                    },
                    content: {
                        type: "string",
                        description: "推送的文本正文",
                    },
                },
                required: ["openId", "content"],
            },
        },
        {
            name: "wechat_get_user_info",
            description: "根据微信用户 OpenID 获取其公开信息（昵称、城市、性别、头像、关注状态等）",
            inputSchema: {
                type: "object",
                properties: {
                    openId: {
                        type: "string",
                        description: "用户的微信 OpenID",
                    },
                    lang: {
                        type: "string",
                        description: "语言代码，默认为 zh_CN",
                        default: "zh_CN",
                    },
                },
                required: ["openId"],
            },
        },
        {
            name: "wechat_create_qrcode",
            description: "生成微信带参数的临时二维码（用于渠道引流、用户身份绑定或特定场景触达）",
            inputSchema: {
                type: "object",
                properties: {
                    sceneStr: {
                        type: "string",
                        description: "场景值字符串（1-64字符）",
                    },
                    expireSeconds: {
                        type: "integer",
                        description: "二维码有效期（秒），最大不超过 2592000（30天），默认 2592000",
                        default: 2592000,
                    },
                },
                required: ["sceneStr"],
            },
        },
        {
            name: "wechat_manage_menu",
            description: "管理微信公众号自定义菜单（支持查询当前菜单结构或推送发布新菜单）",
            inputSchema: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["get", "create"],
                        description: "操作类型：get (获取菜单) 或 create (创建并发布菜单)",
                    },
                    menuData: {
                        type: "object",
                        description: "创建菜单时的菜单结构 JSON（当 action 为 create 时必须提供）",
                    },
                },
                required: ["action"],
            },
        },
        {
            name: "wechat_get_token",
            description: "获取或强制刷新微信全局 Access Token 状态与有效期",
            inputSchema: {
                type: "object",
                properties: {
                    forceRefresh: {
                        type: "boolean",
                        description: "是否强制向微信服务器发起刷新",
                        default: false,
                    },
                },
            },
        },
    ];
}
export class McpToolExecutor {
    officialAccount;
    wecom;
    constructor(officialAccount, wecom) {
        this.officialAccount = officialAccount;
        this.wecom = wecom;
    }
    async executeTool(name, args) {
        switch (name) {
            case "wechat_send_text": {
                const toUser = String(args.toUser || "");
                const content = String(args.content || "");
                const channel = args.channel || "official_account";
                if (channel === "wecom") {
                    await this.wecom.sendAppMessage(toUser, content, "text");
                    return { success: true, channel: "wecom", toUser };
                }
                else {
                    await this.officialAccount.sendCustomServiceMessage(toUser, content);
                    return { success: true, channel: "official_account", toUser };
                }
            }
            case "wechat_send_markdown": {
                const content = String(args.content || "");
                const toUser = args.toUser ? String(args.toUser) : undefined;
                const useWebhook = Boolean(args.useWebhook);
                if (useWebhook || !toUser) {
                    await this.wecom.sendBotWebhookMessage(content, "markdown");
                    return { success: true, target: "bot_webhook" };
                }
                else {
                    await this.wecom.sendAppMessage(toUser, content, "markdown");
                    return { success: true, target: toUser };
                }
            }
            case "wechat_send_custom_service_msg": {
                const openId = String(args.openId || "");
                const content = String(args.content || "");
                await this.officialAccount.sendCustomServiceMessage(openId, content);
                return { success: true, openId };
            }
            case "wechat_get_user_info": {
                const openId = String(args.openId || "");
                const lang = String(args.lang || "zh_CN");
                return await this.officialAccount.getUserInfo(openId, lang);
            }
            case "wechat_create_qrcode": {
                const sceneStr = String(args.sceneStr || "");
                const expireSeconds = Number(args.expireSeconds) || 2592000;
                return await this.officialAccount.createQrCode(sceneStr, expireSeconds);
            }
            case "wechat_manage_menu": {
                const action = String(args.action || "get");
                if (action === "create") {
                    const menuData = args.menuData || {};
                    await this.officialAccount.createMenu(menuData);
                    return { success: true, message: "Menu updated successfully" };
                }
                else {
                    return await this.officialAccount.getMenu();
                }
            }
            case "wechat_get_token": {
                const forceRefresh = Boolean(args.forceRefresh);
                const token = await this.officialAccount.getAccessToken(forceRefresh);
                return {
                    success: true,
                    tokenPreview: `${token.slice(0, 10)}...${token.slice(-6)}`,
                    message: "Access token is valid and active",
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
//# sourceMappingURL=tools.js.map