import { PluginConfig, WeChatInboundMessage } from "../types.js";
import { WeChatOfficialAccountAdapter } from "../adapter/official-account.js";
import { WeComAdapter } from "../adapter/wecom.js";
import { SessionManager } from "./session.js";
export type AgentHandlerFn = (prompt: string, userId: string, history: Array<{
    role: string;
    content: string;
}>) => Promise<string>;
export declare class WeChatAgentBridge {
    private config;
    private officialAccount;
    private wecom;
    private msgIdCache;
    private sessionManager;
    private agentHandler;
    constructor(config: PluginConfig, officialAccount: WeChatOfficialAccountAdapter, wecom: WeComAdapter, customAgentHandler?: AgentHandlerFn);
    /**
     * Sets or overrides the AI Agent execution handler.
     */
    setAgentHandler(handler: AgentHandlerFn): void;
    /**
     * Processes inbound WeChat message with automatic deduplication,
     * 4.5s race condition for passive reply, and async fallback via custom service API.
     *
     * @returns XML string if passive reply ready within 4.5s; otherwise empty string ("").
     */
    handleInboundMessage(msg: WeChatInboundMessage): Promise<string>;
    /**
     * Handles WeChat events (subscribe, unsubscribe, click, etc.).
     */
    private handleEvent;
    getSessionManager(): SessionManager;
}
