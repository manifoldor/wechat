import { TtlCache } from "../utils/cache.js";
export class WeComAdapter {
    config;
    tokenCache = new TtlCache(7000);
    constructor(config) {
        this.config = config;
    }
    /**
     * Retrieves or refreshes WeCom access_token.
     */
    async getAccessToken(forceRefresh = false) {
        const cacheKey = `wecom_token_${this.config.corpId}`;
        if (!forceRefresh) {
            const cached = this.tokenCache.get(cacheKey);
            if (cached)
                return cached;
        }
        if (!this.config.corpId || !this.config.corpSecret) {
            throw new Error("Cannot get WeCom token: WECOM_CORP_ID or WECOM_CORP_SECRET is not configured");
        }
        const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(this.config.corpId)}&corpsecret=${encodeURIComponent(this.config.corpSecret)}`;
        const res = await fetch(url);
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`WeCom token error (${data.errcode}): ${data.errmsg}`);
        }
        if (!data.access_token) {
            throw new Error("WeCom token response missing access_token");
        }
        const ttl = Math.max((data.expires_in || 7200) - 300, 60);
        this.tokenCache.set(cacheKey, data.access_token, ttl);
        return data.access_token;
    }
    /**
     * Sends enterprise application message to specific user(s).
     */
    async sendAppMessage(toUser, content, msgType = "text") {
        const token = await this.getAccessToken();
        const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`;
        const agentId = this.config.agentId;
        if (!agentId) {
            throw new Error("WECOM_AGENT_ID is required to send enterprise app messages");
        }
        const payload = {
            touser: toUser,
            agentid: agentId,
            msgtype: msgType,
            safe: 0,
            enable_id_trans: 0,
            enable_duplicate_check: 0,
        };
        if (msgType === "markdown") {
            payload.markdown = { content };
        }
        else {
            payload.text = { content };
        }
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`WeCom sendAppMessage error (${data.errcode}): ${data.errmsg}`);
        }
        return true;
    }
    /**
     * Pushes message directly via WeCom group bot Webhook.
     */
    async sendBotWebhookMessage(content, msgType = "markdown", webhookUrl) {
        const targetUrl = webhookUrl || this.config.botWebhook;
        if (!targetUrl) {
            throw new Error("WECOM_BOT_WEBHOOK is not configured");
        }
        const payload = {
            msgtype: msgType,
        };
        if (msgType === "markdown") {
            payload.markdown = { content };
        }
        else {
            payload.text = { content };
        }
        const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`WeCom bot webhook error (${data.errcode}): ${data.errmsg}`);
        }
        return true;
    }
}
//# sourceMappingURL=wecom.js.map