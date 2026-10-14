import { WeChatInboundMessage, WeChatPassiveReply } from "../types.js";

/**
 * Parses WeChat XML string to key-value object.
 * Extracts leaf tags, supporting CDATA and plain text values.
 */
export function parseWeChatXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!xml || typeof xml !== "string") {
    return result;
  }

  // Matches leaf tags: <TagName><![CDATA[...]]> or <TagName>...</TagName>
  // Notice the content inside tag can be CDATA or text without unescaped '<'
  const tagRegex = /<([a-zA-Z0-9_]+)>((?:<!\[CDATA\[[\s\S]*?\]\]>|[^<])*)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(xml)) !== null) {
    const tagName = match[1];
    let content = match[2].trim();

    // Check if wrapped in CDATA
    const cdataMatch = /^<!\[CDATA\[([\s\S]*?)\]\]>$/i.exec(content);
    if (cdataMatch) {
      content = cdataMatch[1];
    }

    result[tagName] = content;
  }

  return result;
}

/**
 * Parses and typed-casts WeChat inbound message.
 */
export function parseInboundMessage(xml: string): WeChatInboundMessage {
  const parsed = parseWeChatXml(xml);
  const createTime = parseInt(parsed.CreateTime || "0", 10) || Math.floor(Date.now() / 1000);

  return {
    ToUserName: parsed.ToUserName || "",
    FromUserName: parsed.FromUserName || "",
    CreateTime: createTime,
    MsgType: (parsed.MsgType || "text") as WeChatInboundMessage["MsgType"],
    MsgId: parsed.MsgId,
    Content: parsed.Content,
    PicUrl: parsed.PicUrl,
    MediaId: parsed.MediaId,
    Format: parsed.Format,
    Recognition: parsed.Recognition,
    ThumbMediaId: parsed.ThumbMediaId,
    Location_X: parsed.Location_X,
    Location_Y: parsed.Location_Y,
    Scale: parsed.Scale,
    Label: parsed.Label,
    Title: parsed.Title,
    Description: parsed.Description,
    Url: parsed.Url,
    Event: parsed.Event,
    EventKey: parsed.EventKey,
    Ticket: parsed.Ticket,
    Latitude: parsed.Latitude,
    Longitude: parsed.Longitude,
    Precision: parsed.Precision,
  };
}

/**
 * Builds XML for passive reply.
 */
export function buildPassiveReplyXml(reply: WeChatPassiveReply): string {
  const lines: string[] = ["<xml>"];
  lines.push(`<ToUserName><![CDATA[${reply.ToUserName}]]></ToUserName>`);
  lines.push(`<FromUserName><![CDATA[${reply.FromUserName}]]></FromUserName>`);
  lines.push(`<CreateTime>${reply.CreateTime}</CreateTime>`);
  lines.push(`<MsgType><![CDATA[${reply.MsgType}]]></MsgType>`);

  if (reply.MsgType === "text" && reply.Content !== undefined) {
    lines.push(`<Content><![CDATA[${reply.Content}]]></Content>`);
  } else if (reply.MsgType === "image" && reply.MediaId) {
    lines.push("<Image>");
    lines.push(`<MediaId><![CDATA[${reply.MediaId}]]></MediaId>`);
    lines.push("</Image>");
  } else if (reply.MsgType === "voice" && reply.MediaId) {
    lines.push("<Voice>");
    lines.push(`<MediaId><![CDATA[${reply.MediaId}]]></MediaId>`);
    lines.push("</Voice>");
  } else if (reply.MsgType === "news" && reply.Articles && reply.Articles.length > 0) {
    lines.push(`<ArticleCount>${reply.Articles.length}</ArticleCount>`);
    lines.push("<Articles>");
    for (const art of reply.Articles) {
      lines.push("<item>");
      lines.push(`<Title><![CDATA[${art.Title}]]></Title>`);
      lines.push(`<Description><![CDATA[${art.Description}]]></Description>`);
      lines.push(`<PicUrl><![CDATA[${art.PicUrl}]]></PicUrl>`);
      lines.push(`<Url><![CDATA[${art.Url}]]></Url>`);
      lines.push("</item>");
    }
    lines.push("</Articles>");
  }

  lines.push("</xml>");
  return lines.join("\n");
}
