import { WeChatOfficialAccountAdapter } from "../adapter/official-account.js";
import { WeComAdapter } from "../adapter/wecom.js";
export interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };
}
export declare function getMcpToolDefinitions(): McpToolDefinition[];
export declare class McpToolExecutor {
    private officialAccount;
    private wecom;
    constructor(officialAccount: WeChatOfficialAccountAdapter, wecom: WeComAdapter);
    executeTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
