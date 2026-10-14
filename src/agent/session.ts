import { UserSession } from "../types.js";

/**
 * Manages conversational session context for WeChat users.
 */
export class SessionManager {
  private sessions = new Map<string, UserSession>();

  constructor(
    private sessionTtlMs: number = 30 * 60 * 1000,
    private contextLimit: number = 10
  ) {}

  public getOrCreateSession(
    userId: string,
    channel: UserSession["channel"] = "official_account"
  ): UserSession {
    let session = this.sessions.get(userId);
    const now = Date.now();

    if (!session || now - session.lastActive > this.sessionTtlMs) {
      session = {
        userId,
        channel,
        lastActive: now,
        history: [],
      };
      this.sessions.set(userId, session);
    } else {
      session.lastActive = now;
    }

    return session;
  }

  public appendMessage(
    userId: string,
    role: "user" | "assistant",
    content: string
  ): void {
    const session = this.getOrCreateSession(userId);
    session.history.push({
      role,
      content,
      timestamp: Date.now(),
    });

    if (session.history.length > this.contextLimit * 2) {
      session.history = session.history.slice(-this.contextLimit * 2);
    }
  }

  public getContextHistory(userId: string): Array<{ role: string; content: string }> {
    const session = this.sessions.get(userId);
    if (!session) return [];
    return session.history.map(item => ({
      role: item.role,
      content: item.content,
    }));
  }

  public clearSession(userId: string): boolean {
    return this.sessions.delete(userId);
  }
}
