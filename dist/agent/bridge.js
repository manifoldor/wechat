import { SessionManager } from "./session.js";
import { TtlCache } from "../utils/cache.js";
export class WeChatAgentBridge {
    config;
    officialAccount;
    wecom;
    msgIdCache = new TtlCache(60);
    sessionManager;
    agentHandler;
    constructor(config, officialAccount, wecom, customAgentHandler) {
        this.config = config;
        this.officialAccount = officialAccount;
        this.wecom = wecom;
        this.sessionManager = new SessionManager(30 * 60 * 1000, config.sessionContextLimit);
        this.agentHandler =
            customAgentHandler ||
                (async (prompt, userId) => {
                    return `[Grokbot Agent] 已收到消息：“${prompt}”。智能体正在接入运行中。`;
                });
    }
    /**
     * Sets or overrides the AI Agent execution handler.
     */
    setAgentHandler(handler) {
        this.agentHandler = handler;
    }
    /**
     * Processes inbound WeChat message with automatic deduplication,
     * 4.5s race condition for passive reply, and async fallback via custom service API.
     *
     * @returns XML string if passive reply ready within 4.5s; otherwise empty string ("").
     */
    async handleInboundMessage(msg) {
        const dedupeKey = msg.MsgId || `${msg.FromUserName}_${msg.CreateTime}`;
        if (this.msgIdCache.has(dedupeKey)) {
            // WeChat retry detected: return empty string to acknowledge receipt
            return "";
        }
        this.msgIdCache.set(dedupeKey, true, 60);
        const fromUser = msg.FromUserName;
        const toUser = msg.ToUserName;
        // Handle Events
        if (msg.MsgType === "event") {
            return this.handleEvent(msg);
        }
        // Handle Text or Voice Recognition
        const userPrompt = (msg.Content || msg.Recognition || "").trim();
        if (!userPrompt) {
            return this.officialAccount.buildPassiveReply(fromUser, toUser, "收到多媒体消息。目前智能体支持文本及语音转文字对话。");
        }
        // Save user message to context history
        this.sessionManager.appendMessage(fromUser, "user", userPrompt);
        const history = this.sessionManager.getContextHistory(fromUser);
        const startTime = Date.now();
        const timeoutMs = this.config.passiveReplyTimeoutMs;
        // Execute Agent reasoning with timeout race
        let agentPromiseResolved = false;
        const agentExecutionPromise = this.agentHandler(userPrompt, fromUser, history).then(async (answer) => {
            agentPromiseResolved = true;
            this.sessionManager.appendMessage(fromUser, "assistant", answer);
            // If passive timeout already expired, send via Custom Service API asynchronously
            if (Date.now() - startTime >= timeoutMs) {
                try {
                    await this.officialAccount.sendCustomServiceMessage(fromUser, answer);
                }
                catch (err) {
                    console.error(`[WeChatAgentBridge] Failed to send async custom service message to ${fromUser}:`, err);
                }
            }
            return answer;
        });
        const timeoutPromise = new Promise(resolve => {
            setTimeout(() => resolve(null), timeoutMs);
        });
        const result = await Promise.race([agentExecutionPromise, timeoutPromise]);
        if (result !== null) {
            // Success within 4.5s: return passive reply XML directly
            return this.officialAccount.buildPassiveReply(fromUser, toUser, result);
        }
        else {
            // Timed out: return empty string immediately to satisfy WeChat 5-second requirement.
            // The background promise will dispatch response via Customer Service API.
            return "";
        }
    }
    /**
     * Handles WeChat events (subscribe, unsubscribe, click, etc.).
     */
    handleEvent(msg) {
        const fromUser = msg.FromUserName;
        const toUser = msg.ToUserName;
        const event = (msg.Event || "").toUpperCase();
        switch (event) {
            case "SUBSCRIBE": {
                const welcomeText = "您好！欢迎关注。我是基于 Grokbot 的智能助手，您可以直接在此与我对话交流。";
                return this.officialAccount.buildPassiveReply(fromUser, toUser, welcomeText);
            }
            case "UNSUBSCRIBE": {
                this.sessionManager.clearSession(fromUser);
                return "";
            }
            case "CLICK": {
                const eventKey = msg.EventKey || "";
                const replyText = `您点击了菜单按钮 [${eventKey}]。智能体正在为您服务。`;
                return this.officialAccount.buildPassiveReply(fromUser, toUser, replyText);
            }
            default:
                return "";
        }
    }
    getSessionManager() {
        return this.sessionManager;
    }
}
//# sourceMappingURL=bridge.js.map