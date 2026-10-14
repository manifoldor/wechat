/**
 * Manages conversational session context for WeChat users.
 */
export class SessionManager {
    sessionTtlMs;
    contextLimit;
    sessions = new Map();
    constructor(sessionTtlMs = 30 * 60 * 1000, contextLimit = 10) {
        this.sessionTtlMs = sessionTtlMs;
        this.contextLimit = contextLimit;
    }
    getOrCreateSession(userId, channel = "official_account") {
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
        }
        else {
            session.lastActive = now;
        }
        return session;
    }
    appendMessage(userId, role, content) {
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
    getContextHistory(userId) {
        const session = this.sessions.get(userId);
        if (!session)
            return [];
        return session.history.map(item => ({
            role: item.role,
            content: item.content,
        }));
    }
    clearSession(userId) {
        return this.sessions.delete(userId);
    }
}
//# sourceMappingURL=session.js.map