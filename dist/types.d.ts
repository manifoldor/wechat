/**
 * WeChat Plugin Type Definitions
 */
export interface WeChatConfig {
    appId: string;
    appSecret: string;
    token: string;
    aesKey?: string;
    webhookPort?: number;
    webhookHost?: string;
    webhookPath?: string;
}
export interface WeComConfig {
    corpId?: string;
    corpSecret?: string;
    agentId?: string | number;
    botWebhook?: string;
    token?: string;
    aesKey?: string;
}
export interface PluginConfig {
    wechat: WeChatConfig;
    wecom: WeComConfig;
    passiveReplyTimeoutMs: number;
    sessionContextLimit: number;
}
export type WeChatMsgType = "text" | "image" | "voice" | "video" | "shortvideo" | "location" | "link" | "event";
export interface WeChatInboundMessage {
    ToUserName: string;
    FromUserName: string;
    CreateTime: number;
    MsgType: WeChatMsgType;
    MsgId?: string;
    Content?: string;
    PicUrl?: string;
    MediaId?: string;
    Format?: string;
    Recognition?: string;
    ThumbMediaId?: string;
    Location_X?: string;
    Location_Y?: string;
    Scale?: string;
    Label?: string;
    Title?: string;
    Description?: string;
    Url?: string;
    Event?: string;
    EventKey?: string;
    Ticket?: string;
    Latitude?: string;
    Longitude?: string;
    Precision?: string;
    [key: string]: unknown;
}
export interface WeChatEncryptedInbound {
    ToUserName: string;
    Encrypt: string;
}
export interface WeChatPassiveReply {
    ToUserName: string;
    FromUserName: string;
    CreateTime: number;
    MsgType: "text" | "image" | "voice" | "video" | "music" | "news";
    Content?: string;
    MediaId?: string;
    Articles?: Array<{
        Title: string;
        Description: string;
        PicUrl: string;
        Url: string;
    }>;
}
export interface UserSession {
    userId: string;
    channel: "official_account" | "wecom" | "openkf";
    lastActive: number;
    history: Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: number;
    }>;
}
export interface AgentResponse {
    replyText: string;
    mode: "sync_passive" | "async_custom_service";
    mediaId?: string;
    executionTimeMs: number;
}
