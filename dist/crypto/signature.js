import { createHash } from "node:crypto";
/**
 * Calculates SHA-1 hash for WeChat signature verification.
 */
export function calcSignature(token, timestamp, nonce) {
    const sorted = [token, timestamp, nonce].sort().join("");
    return createHash("sha1").update(sorted).digest("hex");
}
/**
 * Verifies if incoming GET request from WeChat server matches token.
 */
export function checkSignature(token, timestamp, nonce, signature) {
    if (!token || !timestamp || !nonce || !signature) {
        return false;
    }
    const expected = calcSignature(token, timestamp, nonce);
    return expected.toLowerCase() === signature.toLowerCase();
}
/**
 * Calculates WeChat Message Signature for encrypted payload (WXBizMsgCrypt).
 */
export function calcMsgSignature(token, timestamp, nonce, encrypt) {
    const sorted = [token, timestamp, nonce, encrypt].sort().join("");
    return createHash("sha1").update(sorted).digest("hex");
}
/**
 * Verifies WeChat Message Signature for encrypted payload.
 */
export function checkMsgSignature(token, timestamp, nonce, encrypt, msgSignature) {
    if (!token || !timestamp || !nonce || !encrypt || !msgSignature) {
        return false;
    }
    const expected = calcMsgSignature(token, timestamp, nonce, encrypt);
    return expected.toLowerCase() === msgSignature.toLowerCase();
}
//# sourceMappingURL=signature.js.map