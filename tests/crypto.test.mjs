import test from "node:test";
import assert from "node:assert/strict";
import { checkSignature, calcSignature } from "../dist/crypto/signature.js";
import { WXBizMsgCrypt } from "../dist/crypto/wx-crypto.js";

test("checkSignature validates official WeChat token signatures", () => {
  const token = "my_secret_token";
  const timestamp = "1700000000";
  const nonce = "987654321";

  const expectedSig = calcSignature(token, timestamp, nonce);
  assert.ok(checkSignature(token, timestamp, nonce, expectedSig));
  assert.ok(!checkSignature(token, timestamp, nonce, "invalid_signature"));
});

test("WXBizMsgCrypt encrypts and decrypts messages symmetrically", () => {
  const token = "test_token";
  // 43 base64 characters
  const encodingAesKey = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
  const appId = "wx1234567890abcdef";

  const crypt = new WXBizMsgCrypt(token, encodingAesKey, appId);
  const originalXml = "<xml><ToUserName>wx1234567890abcdef</ToUserName><Content>Hello Encrypted World</Content></xml>";

  const ciphertext = crypt.encrypt(originalXml);
  assert.ok(ciphertext);
  assert.notEqual(ciphertext, originalXml);

  const decrypted = crypt.decrypt(ciphertext);
  assert.equal(decrypted, originalXml);
});

test("WXBizMsgCrypt verifies msg_signature and wraps encrypted envelope", () => {
  const token = "test_token";
  const encodingAesKey = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
  const appId = "wx1234567890abcdef";

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
