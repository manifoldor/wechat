import { WeComConfig } from "../types.js";
export declare class WeComAdapter {
    private config;
    private tokenCache;
    constructor(config: WeComConfig);
    /**
     * Retrieves or refreshes WeCom access_token.
     */
    getAccessToken(forceRefresh?: boolean): Promise<string>;
    /**
     * Sends enterprise application message to specific user(s).
     */
    sendAppMessage(toUser: string, content: string, msgType?: "text" | "markdown"): Promise<boolean>;
    /**
     * Pushes message directly via WeCom group bot Webhook.
     */
    sendBotWebhookMessage(content: string, msgType?: "text" | "markdown", webhookUrl?: string): Promise<boolean>;
}
