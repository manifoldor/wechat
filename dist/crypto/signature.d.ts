/**
 * Calculates SHA-1 hash for WeChat signature verification.
 */
export declare function calcSignature(token: string, timestamp: string, nonce: string): string;
/**
 * Verifies if incoming GET request from WeChat server matches token.
 */
export declare function checkSignature(token: string, timestamp: string, nonce: string, signature: string): boolean;
/**
 * Calculates WeChat Message Signature for encrypted payload (WXBizMsgCrypt).
 */
export declare function calcMsgSignature(token: string, timestamp: string, nonce: string, encrypt: string): string;
/**
 * Verifies WeChat Message Signature for encrypted payload.
 */
export declare function checkMsgSignature(token: string, timestamp: string, nonce: string, encrypt: string, msgSignature: string): boolean;
