import { PluginConfig } from "../types.js";
import { WeChatAgentBridge } from "../agent/bridge.js";
export declare class WeChatWebhookServer {
    private config;
    private bridge;
    private server;
    private crypt;
    constructor(config: PluginConfig, bridge: WeChatAgentBridge);
    /**
     * Starts HTTP webhook listener.
     */
    start(): Promise<number>;
    /**
     * Stops HTTP server.
     */
    stop(): Promise<void>;
    private handleRequest;
    private handleVerification;
    private handleMessageCallback;
}
