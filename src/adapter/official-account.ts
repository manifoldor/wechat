import { WeChatConfig, WeChatPassiveReply } from "../types.js";
import { TtlCache } from "../utils/cache.js";
import { buildPassiveReplyXml } from "../utils/xml.js";

export interface WeChatApiError {
  errcode: number;
  errmsg: string;
}

export class WeChatOfficialAccountAdapter {
  private tokenCache = new TtlCache<string>(7000);

  constructor(private config: WeChatConfig) {}

  /**
   * Retrieves or refreshes WeChat global access_token.
   */
  public async getAccessToken(forceRefresh = false): Promise<string> {
    const cacheKey = `token_${this.config.appId}`;
    if (!forceRefresh) {
      const cached = this.tokenCache.get(cacheKey);
      if (cached) return cached;
    }

    if (!this.config.appId || !this.config.appSecret) {
      throw new Error("Cannot get access_token: WECHAT_APP_ID or WECHAT_APP_SECRET is not configured");
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(
      this.config.appId
    )}&secret=${encodeURIComponent(this.config.appSecret)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch access_token: HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      errcode?: number;
      errmsg?: string;
    };

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
  public async sendCustomServiceMessage(
    toUser: string,
    content: string,
    msgType: "text" = "text"
  ): Promise<boolean> {
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

    const data = (await res.json()) as WeChatApiError;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`sendCustomServiceMessage error (${data.errcode}): ${data.errmsg}`);
    }

    return true;
  }

  /**
   * Retrieves user profile by openid.
   */
  public async getUserInfo(openId: string, lang = "zh_CN"): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${encodeURIComponent(
      openId
    )}&lang=${lang}`;

    const res = await fetch(url);
    const data = (await res.json()) as Record<string, unknown> & WeChatApiError;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`getUserInfo error (${data.errcode}): ${data.errmsg}`);
    }
    return data;
  }

  /**
   * Creates a temporary QR code with scene parameter.
   */
  public async createQrCode(
    sceneStr: string,
    expireSeconds = 2592000
  ): Promise<{ ticket: string; expire_seconds: number; url: string; qrUrl: string }> {
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

    const data = (await res.json()) as {
      ticket?: string;
      expire_seconds?: number;
      url?: string;
    } & WeChatApiError;

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
  public async getMenu(): Promise<Record<string, unknown>> {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${token}`;
    const res = await fetch(url);
    return (await res.json()) as Record<string, unknown>;
  }

  /**
   * Publishes custom menu.
   */
  public async createMenu(menuData: Record<string, unknown>): Promise<boolean> {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menuData),
    });
    const data = (await res.json()) as WeChatApiError;
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`createMenu error (${data.errcode}): ${data.errmsg}`);
    }
    return true;
  }

  /**
   * Builds XML string for immediate passive reply.
   */
  public buildPassiveReply(
    toUser: string,
    fromUser: string,
    content: string
  ): string {
    const reply: WeChatPassiveReply = {
      ToUserName: toUser,
      FromUserName: fromUser,
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: "text",
      Content: content,
    };
    return buildPassiveReplyXml(reply);
  }
}
