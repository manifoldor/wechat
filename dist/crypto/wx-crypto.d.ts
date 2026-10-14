/**
 * Standard WeChat Message Encryption/Decryption implementation (WXBizMsgCrypt).
 * Compatible with WeChat Official Accounts and WeCom (Enterprise WeChat).
 */
export declare class WXBizMsgCrypt {
    readonly token: string;
    readonly encodingAesKey: string;
    readonly appId: string;
    private key;
    private iv;
    constructor(token: string, encodingAesKey: string, appId: string);
    /**
     * Encrypts plaintext XML message.
     *
     * @param xmlText The plaintext XML string
     * @returns Base64 encoded ciphertext
     */
    encrypt(xmlText: string): string;
    /**
     * Decrypts ciphertext and verifies AppId.
     *
     * @param encrypt Base64 encoded ciphertext
     * @returns Plaintext XML string
     */
    decrypt(encrypt: string): string;
    /**
     * Verifies message signature and decrypts the XML content.
     */
    decryptMsg(msgSignature: string, timestamp: string, nonce: string, encrypt: string): string;
    /**
     * Encrypts plaintext XML and produces the complete encrypted XML envelope with signature.
     */
    encryptMsg(replyXml: string, timestamp?: string, nonce?: string): {
        encrypt: string;
        msgSignature: string;
        timestamp: string;
        nonce: string;
        xml: string;
    };
    /**
     * PKCS#7 padding to 32-byte block size.
     */
    private pkcs7Pad;
    /**
     * PKCS#7 unpadding for 32-byte block size.
     */
    private pkcs7Unpad;
}
