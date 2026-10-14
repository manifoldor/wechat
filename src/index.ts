#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { WeChatOfficialAccountAdapter } from "./adapter/official-account.js";
import { WeComAdapter } from "./adapter/wecom.js";
import { WeChatCustomerServiceAdapter } from "./adapter/openkf.js";
import { WeChatAgentBridge } from "./agent/bridge.js";
import { WeChatWebhookServer } from "./server/webhook-server.js";
import { WXBizMsgCrypt } from "./crypto/wx-crypto.js";
import { checkSignature, calcSignature } from "./crypto/signature.js";
import { startMcpServer } from "./mcp/index.js";

export * from "./types.js";
export * from "./config.js";
export * from "./crypto/wx-crypto.js";
export * from "./crypto/signature.js";
export * from "./utils/xml.js";
export * from "./utils/cache.js";
export * from "./adapter/official-account.js";
export * from "./adapter/wecom.js";
export * from "./adapter/openkf.js";
export * from "./agent/bridge.js";
export * from "./agent/session.js";
export * from "./server/webhook-server.js";
export * from "./mcp/tools.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  const config = loadConfig();
  const officialAccount = new WeChatOfficialAccountAdapter(config.wechat);
  const wecom = new WeComAdapter(config.wecom);
  const bridge = new WeChatAgentBridge(config, officialAccount, wecom);
  const server = new WeChatWebhookServer(config, bridge);

  switch (command) {
    case "server": {
      console.log("[grokbot:wechat] Starting WeChat Webhook Server...");
      await server.start();
      break;
    }

    case "mcp": {
      await startMcpServer();
      break;
    }

    case "status": {
      console.log("=== Grokbot WeChat Plugin Status ===");
      console.log(`WeChat AppID:       ${config.wechat.appId ? config.wechat.appId.slice(0, 6) + "******" : "Not configured"}`);
      console.log(`WeChat Token:       ${config.wechat.token ? "Configured" : "Not configured"}`);
      console.log(`EncodingAESKey:     ${config.wechat.aesKey ? "Configured (43 chars)" : "Not configured"}`);
      console.log(`WeCom CorpID:       ${config.wecom.corpId ? config.wecom.corpId.slice(0, 6) + "******" : "Not configured"}`);
      console.log(`Webhook Port:       ${config.wechat.webhookPort}`);
      console.log(`Webhook Path:       ${config.wechat.webhookPath}`);
      console.log(`Passive Timeout:    ${config.passiveReplyTimeoutMs}ms`);
      break;
    }

    case "send": {
      const toUser = args[1];
      const content = args[2];
      if (!toUser || !content) {
        console.error("Usage: grokbot-wechat send <toUser/openId> <content>");
        process.exit(1);
      }
      console.log(`[grokbot:wechat] Sending message to ${toUser}...`);
      try {
        await officialAccount.sendCustomServiceMessage(toUser, content);
        console.log("Message sent successfully via Official Account custom service.");
      } catch (err) {
        console.warn(`Official Account send failed (${err}), attempting WeCom...`);
        try {
          await wecom.sendAppMessage(toUser, content);
          console.log("Message sent successfully via WeCom.");
        } catch (wecomErr) {
          console.error("Failed to send message via both channels:", wecomErr);
          process.exit(1);
        }
      }
      break;
    }

    case "help":
    default: {
      console.log(`Grokbot WeChat Plugin CLI

Usage:
  grokbot-wechat server              Start the Webhook HTTP listener
  grokbot-wechat mcp                 Start Model Context Protocol (MCP) server
  grokbot-wechat status              Display current connection and configuration state
  grokbot-wechat send <user> <msg>   Send active message to WeChat user
`);
      break;
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  main().catch(err => {
    console.error("[grokbot:wechat] Fatal error:", err);
    process.exit(1);
  });
}
