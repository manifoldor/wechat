export function loadConfig(overrides) {
    const wechatAppId = process.env.WECHAT_APP_ID || "";
    const wechatAppSecret = process.env.WECHAT_APP_SECRET || "";
    const wechatToken = process.env.WECHAT_TOKEN || "wechat_agent_token";
    const wechatAesKey = process.env.WECHAT_AES_KEY || "";
    const wecomCorpId = process.env.WECOM_CORP_ID || "";
    const wecomCorpSecret = process.env.WECOM_CORP_SECRET || "";
    const wecomAgentId = process.env.WECOM_AGENT_ID || "";
    const wecomBotWebhook = process.env.WECOM_BOT_WEBHOOK || "";
    const webhookPort = parseInt(process.env.WECHAT_WEBHOOK_PORT || "3000", 10);
    const webhookHost = process.env.WECHAT_WEBHOOK_HOST || "0.0.0.0";
    const webhookPath = process.env.WECHAT_WEBHOOK_PATH || "/wechat/webhook";
    const passiveReplyTimeoutMs = parseInt(process.env.AGENT_PASSIVE_REPLY_TIMEOUT_MS || "4500", 10);
    const sessionContextLimit = parseInt(process.env.AGENT_SESSION_CONTEXT_LIMIT || "10", 10);
    return {
        wechat: {
            appId: wechatAppId,
            appSecret: wechatAppSecret,
            token: wechatToken,
            aesKey: wechatAesKey,
            webhookPort,
            webhookHost,
            webhookPath,
            ...(overrides?.wechat || {}),
        },
        wecom: {
            corpId: wecomCorpId,
            corpSecret: wecomCorpSecret,
            agentId: wecomAgentId,
            botWebhook: wecomBotWebhook,
            token: wechatToken,
            aesKey: wechatAesKey,
            ...(overrides?.wecom || {}),
        },
        passiveReplyTimeoutMs: overrides?.passiveReplyTimeoutMs ?? passiveReplyTimeoutMs,
        sessionContextLimit: overrides?.sessionContextLimit ?? sessionContextLimit,
    };
}
//# sourceMappingURL=config.js.map