import { WeChatInboundMessage, WeChatPassiveReply } from "../types.js";
/**
 * Parses WeChat XML string to key-value object.
 * Extracts leaf tags, supporting CDATA and plain text values.
 */
export declare function parseWeChatXml(xml: string): Record<string, string>;
/**
 * Parses and typed-casts WeChat inbound message.
 */
export declare function parseInboundMessage(xml: string): WeChatInboundMessage;
/**
 * Builds XML for passive reply.
 */
export declare function buildPassiveReplyXml(reply: WeChatPassiveReply): string;
