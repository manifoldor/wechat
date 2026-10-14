import { createHash } from "node:crypto";

/**
 * Calculates SHA-1 hash for WeChat signature verification.
 */
export function calcSignature(token: string, timestamp: string, nonce: string): string {
  const sorted = [token, timestamp, nonce].sort().join("");
  return createHash("sha1").update(sorted).digest("hex");
}

/**
 * Verifies if incoming GET request from WeChat server matches token.
 */
export function checkSignature(
  token: string,
  timestamp: string,
  nonce: string,
  signature: string
): boolean {
  if (!token || !timestamp || !nonce || !signature) {
    return false;
  }
  const expected = calcSignature(token, timestamp, nonce);
  return expected.toLowerCase() === signature.toLowerCase();
}

/**
 * Calculates WeChat Message Signature for encrypted payload (WXBizMsgCrypt).
 */
export function calcMsgSignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypt: string
): string {
  const sorted = [token, timestamp, nonce, encrypt].sort().join("");
  return createHash("sha1").update(sorted).digest("hex");
}

/**
 * Verifies WeChat Message Signature for encrypted payload.
 */
export function checkMsgSignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypt: string,
  msgSignature: string
): boolean {
  if (!token || !timestamp || !nonce || !encrypt || !msgSignature) {
    return false;
  }
  const expected = calcMsgSignature(token, timestamp, nonce, encrypt);
  return expected.toLowerCase() === msgSignature.toLowerCase();
}
