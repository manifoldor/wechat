import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { checkSignature, calcSignature } from "../dist/crypto/signature.js";
import { WXBizMsgCrypt } from "../dist/crypto/wx-crypto.js";

// Helper to generate a valid 43-character base64 EncodingAESKey dynamically for testing
function generateTestAesKey() {
  return Buffer.from(randomBytes(32)).toString("base64").slice(0, 43);
}

test("checkSignature validates official WeChat token signatures", () => {
  const token = "mock_test_token";
  const timestamp = "1700000000";
  const nonce = "987654321";

  const expectedSig = calcSignature(token, timestamp, nonce);
  assert.ok(checkSignature(token, timestamp, nonce, expectedSig));
  assert.ok(!checkSignature(token, timestamp, nonce, "invalid_signature"));
});

test("WXBizMsgCrypt encrypts and decrypts messages symmetrically", () => {
  const token = "mock_test_token";
  const encodingAesKey = generateTestAesKey();
  const appId = "wx_mock_test_appid";

  const crypt = new WXBizMsgCrypt(token, encodingAesKey, appId);
  const originalXml = "<xml><ToUserName>wx_mock_test_appid</ToUserName><Content>Hello Encrypted World</Content></xml>";

  const ciphertext = crypt.encrypt(originalXml);
  assert.ok(ciphertext);
  assert.notEqual(ciphertext, originalXml);

  const decrypted = crypt.decrypt(ciphertext);
  assert.equal(decrypted, originalXml);
});

test("WXBizMsgCrypt verifies msg_signature and wraps encrypted envelope", () => {
  const token = "mock_test_token";
  const encodingAesKey = generateTestAesKey();
  const appId = "wx_mock_test_appid";

  const crypt = new WXBizMsgCrypt(token, encodingAesKey, appId);
  const plainReply = "<xml><Content>Agent Secure Reply</Content></xml>";

  const envelope = crypt.encryptMsg(plainReply);
  assert.ok(envelope.encrypt);
  assert.ok(envelope.msgSignature);
  assert.ok(envelope.xml.includes("<Encrypt><![CDATA["));

  const decrypted = crypt.decryptMsg(
    envelope.msgSignature,
    envelope.timestamp,
    envelope.nonce,
    envelope.encrypt
  );
  assert.equal(decrypted, plainReply);
});
