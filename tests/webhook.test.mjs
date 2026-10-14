import test from "node:test";
import assert from "node:assert/strict";
import { WeChatWebhookServer } from "../dist/server/webhook-server.js";
import { WeChatAgentBridge } from "../dist/agent/bridge.js";
import { WeChatOfficialAccountAdapter } from "../dist/adapter/official-account.js";
import { WeComAdapter } from "../dist/adapter/wecom.js";
import { calcSignature } from "../dist/crypto/signature.js";
import { parseWeChatXml } from "../dist/utils/xml.js";

test("WeChatWebhookServer handles GET verification and POST message callback", async () => {
  const testPort = 13000 + Math.floor(Math.random() * 5000);
  const testToken = "test_token_123456";

  const config = {
    wechat: {
      appId: "wx_test_app",
      appSecret: "wx_test_secret",
      token: testToken,
      webhookPort: testPort,
      webhookHost: "127.0.0.1",
      webhookPath: "/wechat/webhook",
    },
    wecom: {},
    passiveReplyTimeoutMs: 3000,
    sessionContextLimit: 5,
  };

  const officialAccount = new WeChatOfficialAccountAdapter(config.wechat);
  const wecom = new WeComAdapter(config.wecom);
  const bridge = new WeChatAgentBridge(
    config,
    officialAccount,
    wecom,
    async (prompt, userId) => `Echo: ${prompt}`
  );

  const server = new WeChatWebhookServer(config, bridge);
  await server.start();

  try {
    // 1. Test /health
    const healthRes = await fetch(`http://127.0.0.1:${testPort}/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.status, "healthy");

    // 2. Test GET verification
    const timestamp = "1700000000";
    const nonce = "123456";
    const echostr = "grokbot_verification_success";
    const signature = calcSignature(testToken, timestamp, nonce);

    const getUrl = `http://127.0.0.1:${testPort}/wechat/webhook?signature=${signature}&timestamp=${timestamp}&nonce=${nonce}&echostr=${echostr}`;
    const getRes = await fetch(getUrl);
    assert.equal(getRes.status, 200);
    const getText = await getRes.text();
    assert.equal(getText, echostr);

    // 3. Test POST message callback
    const postXml = `
      <xml>
        <ToUserName><![CDATA[gh_test_bot]]></ToUserName>
        <FromUserName><![CDATA[user_openai_123]]></FromUserName>
        <CreateTime>1700000001</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[ping]]></Content>
        <MsgId>999888777111</MsgId>
      </xml>
    `;

    const postUrl = `http://127.0.0.1:${testPort}/wechat/webhook?signature=${signature}&timestamp=${timestamp}&nonce=${nonce}`;
    const postRes = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: postXml,
    });

    assert.equal(postRes.status, 200);
    const replyBody = await postRes.text();
    const replyParsed = parseWeChatXml(replyBody);

    assert.equal(replyParsed.ToUserName, "user_openai_123");
    assert.equal(replyParsed.FromUserName, "gh_test_bot");
    assert.equal(replyParsed.Content, "Echo: ping");

    // 4. Test encrypted message callback
    const encodingAesKey = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    const secureConfig = {
      ...config,
      wechat: {
        ...config.wechat,
        aesKey: encodingAesKey,
      },
    };
    const secureCrypt = new (await import("../dist/crypto/wx-crypto.js")).WXBizMsgCrypt(
      testToken,
      encodingAesKey,
      "wx_test_app"
    );
    const secureServer = new WeChatWebhookServer(secureConfig, bridge);
    const securePort = testPort + 1;
    secureConfig.wechat.webhookPort = securePort;
    await secureServer.start();

    try {
      const encryptedXml = postXml.replace("999888777111", "999888777222");
      const encryptedEnvelope = secureCrypt.encryptMsg(encryptedXml, timestamp, nonce);
      const securePostUrl = `http://127.0.0.1:${securePort}/wechat/webhook?msg_signature=${encryptedEnvelope.msgSignature}&timestamp=${timestamp}&nonce=${nonce}`;
      const secureRes = await fetch(securePostUrl, {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: encryptedEnvelope.xml,
      });

      assert.equal(secureRes.status, 200);
      const encReplyBody = await secureRes.text();
      const encReplyParsed = parseWeChatXml(encReplyBody);
      assert.ok(encReplyParsed.Encrypt);

      const decryptedReply = secureCrypt.decrypt(encReplyParsed.Encrypt);
      const finalReplyParsed = parseWeChatXml(decryptedReply);
      assert.equal(finalReplyParsed.Content, "Echo: ping");
    } finally {
      await secureServer.stop();
    }
  } finally {
    await server.stop();
  }
});
