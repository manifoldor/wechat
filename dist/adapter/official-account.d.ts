import { WeChatConfig } from "../types.js";
export interface WeChatApiError {
    errcode: number;
    errmsg: string;
}
export declare class WeChatOfficialAccountAdapter {
    private config;
    private tokenCache;
    constructor(config: WeChatConfig);
    /**
     * Retrieves or refreshes WeChat global access_token.
     */
    getAccessToken(forceRefresh?: boolean): Promise<string>;
    /**
     * Sends custom service (active customer service) message to user.
     */
    sendCustomServiceMessage(toUser: string, content: string, msgType?: "text"): Promise<boolean>;
    /**
     * Retrieves user profile by openid.
     */
    getUserInfo(openId: string, lang?: string): Promise<Record<string, unknown>>;
    /**
     * Creates a temporary QR code with scene parameter.
     */
    createQrCode(sceneStr: string, expireSeconds?: number): Promise<{
        ticket: string;
        expire_seconds: number;
        url: string;
        qrUrl: string;
    }>;
    /**
     * Retrieves custom menu config.
     */
    getMenu(): Promise<Record<string, unknown>>;
    /**
     * Publishes custom menu.
     */
    createMenu(menuData: Record<string, unknown>): Promise<boolean>;
    /**
     * Builds XML string for immediate passive reply.
     */
    buildPassiveReply(toUser: string, fromUser: string, content: string): string;
}
