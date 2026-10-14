import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { calcMsgSignature, checkMsgSignature } from "./signature.js";
/**
 * Standard WeChat Message Encryption/Decryption implementation (WXBizMsgCrypt).
 * Compatible with WeChat Official Accounts and WeCom (Enterprise WeChat).
 */
export class WXBizMsgCrypt {
    token;
    encodingAesKey;
    appId;
    key;
    iv;
    constructor(token, encodingAesKey, appId) {
        this.token = token;
        this.encodingAesKey = encodingAesKey;
        this.appId = appId;
        if (!encodingAesKey || encodingAesKey.length !== 43) {
            throw new Error("Invalid EncodingAESKey: must be 43 base64 characters");
        }
        this.key = Buffer.from(encodingAesKey + "=", "base64");
        if (this.key.length !== 32) {
            throw new Error("Invalid AES key length: decoded key must be 32 bytes");
        }
        this.iv = this.key.subarray(0, 16);
    }
    /**
     * Encrypts plaintext XML message.
     *
     * @param xmlText The plaintext XML string
     * @returns Base64 encoded ciphertext
     */
    encrypt(xmlText) {
        const random16 = randomBytes(16);
        const msgBuffer = Buffer.from(xmlText, "utf-8");
        const lenBuffer = Buffer.alloc(4);
        lenBuffer.writeUInt32BE(msgBuffer.length, 0);
        const appIdBuffer = Buffer.from(this.appId, "utf-8");
        const rawBuffer = Buffer.concat([random16, lenBuffer, msgBuffer, appIdBuffer]);
        const paddedBuffer = this.pkcs7Pad(rawBuffer);
        const cipher = createCipheriv("aes-256-cbc", this.key, this.iv);
        cipher.setAutoPadding(false);
        const encrypted = Buffer.concat([cipher.update(paddedBuffer), cipher.final()]);
        return encrypted.toString("base64");
    }
    /**
     * Decrypts ciphertext and verifies AppId.
     *
     * @param encrypt Base64 encoded ciphertext
     * @returns Plaintext XML string
     */
    decrypt(encrypt) {
        const cipherBuffer = Buffer.from(encrypt, "base64");
        const decipher = createDecipheriv("aes-256-cbc", this.key, this.iv);
        decipher.setAutoPadding(false);
        const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
        const unpadded = this.pkcs7Unpad(decrypted);
        // Byte layout: 16-byte random + 4-byte msgLen + msgContent + appId
        const msgLen = unpadded.readUInt32BE(16);
        const msgContent = unpadded.subarray(20, 20 + msgLen).toString("utf-8");
        const fromAppId = unpadded.subarray(20 + msgLen).toString("utf-8");
        if (this.appId && fromAppId !== this.appId) {
            throw new Error(`AppID mismatch: expected "${this.appId}", received "${fromAppId}"`);
        }
        return msgContent;
    }
    /**
     * Verifies message signature and decrypts the XML content.
     */
    decryptMsg(msgSignature, timestamp, nonce, encrypt) {
        if (!checkMsgSignature(this.token, timestamp, nonce, encrypt, msgSignature)) {
            throw new Error("Signature verification failed for encrypted message");
        }
        return this.decrypt(encrypt);
    }
    /**
     * Encrypts plaintext XML and produces the complete encrypted XML envelope with signature.
     */
    encryptMsg(replyXml, timestamp, nonce) {
        const ts = timestamp || Math.floor(Date.now() / 1000).toString();
        const nc = nonce || Math.floor(Math.random() * 1000000000).toString();
        const encrypt = this.encrypt(replyXml);
        const msgSignature = calcMsgSignature(this.token, ts, nc, encrypt);
        const xml = [
            "<xml>",
            `<Encrypt><![CDATA[${encrypt}]]></Encrypt>`,
            `<MsgSignature><![CDATA[${msgSignature}]]></MsgSignature>`,
            `<TimeStamp>${ts}</TimeStamp>`,
            `<Nonce><![CDATA[${nc}]]></Nonce>`,
            "</xml>",
        ].join("");
        return {
            encrypt,
            msgSignature,
            timestamp: ts,
            nonce: nc,
            xml,
        };
    }
    /**
     * PKCS#7 padding to 32-byte block size.
     */
    pkcs7Pad(buffer) {
        const blockSize = 32;
        const padding = blockSize - (buffer.length % blockSize);
        const padBuffer = Buffer.alloc(padding, padding);
        return Buffer.concat([buffer, padBuffer]);
    }
    /**
     * PKCS#7 unpadding for 32-byte block size.
     */
    pkcs7Unpad(buffer) {
        const padding = buffer[buffer.length - 1];
        if (padding < 1 || padding > 32) {
            throw new Error("Invalid PKCS#7 padding value");
        }
        for (let i = buffer.length - padding; i < buffer.length; i++) {
            if (buffer[i] !== padding) {
                throw new Error("Corrupted PKCS#7 padding");
            }
        }
        return buffer.subarray(0, buffer.length - padding);
    }
}
//# sourceMappingURL=wx-crypto.js.map