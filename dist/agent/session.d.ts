import { UserSession } from "../types.js";
/**
 * Manages conversational session context for WeChat users.
 */
export declare class SessionManager {
    private sessionTtlMs;
    private contextLimit;
    private sessions;
    constructor(sessionTtlMs?: number, contextLimit?: number);
    getOrCreateSession(userId: string, channel?: UserSession["channel"]): UserSession;
    appendMessage(userId: string, role: "user" | "assistant", content: string): void;
    getContextHistory(userId: string): Array<{
        role: string;
        content: string;
    }>;
    clearSession(userId: string): boolean;
}
