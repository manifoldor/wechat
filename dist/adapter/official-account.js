import { TtlCache } from "../utils/cache.js";
import { buildPassiveReplyXml } from "../utils/xml.js";
export class WeChatOfficialAccountAdapter {
    config;
    tokenCache = new TtlCache(7000);
    constructor(config) {
        this.config = config;
    }
    /**
     * Retrieves or refreshes WeChat global access_token.
     */
    async getAccessToken(forceRefresh = false) {
        const cacheKey = `token_${this.config.appId}`;
        if (!forceRefresh) {
            const cached = this.tokenCache.get(cacheKey);
            if (cached)
                return cached;
        }
        if (!this.config.appId || !this.config.appSecret) {
            throw new Error("Cannot get access_token: WECHAT_APP_ID or WECHAT_APP_SECRET is not configured");
        }
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(this.config.appId)}&secret=${encodeURIComponent(this.config.appSecret)}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch access_token: HTTP ${res.status} ${res.statusText}`);
        }
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`WeChat token error (${data.errcode}): ${data.errmsg}`);
        }
        if (!data.access_token) {
            throw new Error("WeChat token response missing access_token");
        }
        const ttl = Math.max((data.expires_in || 7200) - 300, 60);
        this.tokenCache.set(cacheKey, data.access_token, ttl);
        return data.access_token;
    }
    /**
     * Sends custom service (active customer service) message to user.
     */
    async sendCustomServiceMessage(toUser, content, msgType = "text") {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`;
        const payload = {
            touser: toUser,
            msgtype: msgType,
            text: {
                content,
            },
        };
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`sendCustomServiceMessage error (${data.errcode}): ${data.errmsg}`);
        }
        return true;
    }
    /**
     * Retrieves user profile by openid.
     */
    async getUserInfo(openId, lang = "zh_CN") {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${encodeURIComponent(openId)}&lang=${lang}`;
        const res = await fetch(url);
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`getUserInfo error (${data.errcode}): ${data.errmsg}`);
        }
        return data;
    }
    /**
     * Creates a temporary QR code with scene parameter.
     */
    async createQrCode(sceneStr, expireSeconds = 2592000) {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${token}`;
        const payload = {
            expire_seconds: expireSeconds,
            action_name: "QR_STR_SCENE",
            action_info: {
                scene: {
                    scene_str: sceneStr,
                },
            },
        };
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`createQrCode error (${data.errcode}): ${data.errmsg}`);
        }
        const ticket = data.ticket || "";
        return {
            ticket,
            expire_seconds: data.expire_seconds || expireSeconds,
            url: data.url || "",
            qrUrl: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`,
        };
    }
    /**
     * Retrieves custom menu config.
     */
    async getMenu() {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${token}`;
        const res = await fetch(url);
        return (await res.json());
    }
    /**
     * Publishes custom menu.
     */
    async createMenu(menuData) {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(menuData),
        });
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`createMenu error (${data.errcode}): ${data.errmsg}`);
        }
        return true;
    }
    /**
     * Builds XML string for immediate passive reply.
     */
    buildPassiveReply(toUser, fromUser, content) {
        const reply = {
            ToUserName: toUser,
            FromUserName: fromUser,
            CreateTime: Math.floor(Date.now() / 1000),
            MsgType: "text",
            Content: content,
        };
        return buildPassiveReplyXml(reply);
    }
}
//# sourceMappingURL=official-account.js.map