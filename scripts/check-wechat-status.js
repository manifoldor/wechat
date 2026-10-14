#!/usr/bin/env node

/**
 * WeChat Plugin Status & Health Check Script
 * Automatically triggered on Grokbot SessionStart hook.
 */

const appId = process.env.WECHAT_APP_ID;
const token = process.env.WECHAT_TOKEN;
const wecomCorpId = process.env.WECOM_CORP_ID;

console.log("[grokbot:wechat] Initializing WeChat Plugin Hook...");

if (!appId && !wecomCorpId) {
  console.log("[grokbot:wechat] Notice: No WeChat credentials found. Configure WECHAT_APP_ID or WECOM_CORP_ID in plugin variables to enable full integration.");
} else {
  if (appId) {
    console.log(`[grokbot:wechat] Official Account AppID configured: ${appId.slice(0, 6)}****** (Token: ${token ? "Set" : "Missing"})`);
  }
  if (wecomCorpId) {
    console.log(`[grokbot:wechat] WeCom CorpID configured: ${wecomCorpId.slice(0, 6)}******`);
  }
}

process.exit(0);
