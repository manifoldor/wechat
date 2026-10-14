import { WeComAdapter } from "./wecom.js";

export interface OpenKfMessage {
  msgid: string;
  open_kfid: string;
  external_userid: string;
  send_time: number;
  origin: number;
  msgtype: string;
  text?: { content: string };
  image?: { media_id: string };
  voice?: { media_id: string };
  event?: { event_type: string; open_kfid: string; external_userid: string };
}

export class WeChatCustomerServiceAdapter {
  constructor(private wecom: WeComAdapter) {}

  /**
   * Syncs inbound customer service messages.
   */
  public async syncMessages(
    openKfId?: string,
    cursor?: string,
    tokenParam?: string,
    limit = 100
  ): Promise<{ next_cursor: string; has_more: number; msg_list: OpenKfMessage[] }> {
    const token = tokenParam || (await this.wecom.getAccessToken());
    const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token=${token}`;

    const payload: Record<string, unknown> = {
      cursor: cursor || "",
      limit,
    };
    if (openKfId) {
      payload.open_kfid = openKfId;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      errcode?: number;
      errmsg?: string;
      next_cursor: string;
      has_more: number;
      msg_list: OpenKfMessage[];
    };

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`OpenKF syncMessages error (${data.errcode}): ${data.errmsg}`);
    }

    return {
      next_cursor: data.next_cursor || "",
      has_more: data.has_more || 0,
      msg_list: data.msg_list || [],
    };
  }

  /**
   * Sends customer service message to external WeChat user.
   */
  public async sendMessage(
    openKfId: string,
    externalUserId: string,
    content: string,
    msgType = "text"
  ): Promise<{ msgid: string }> {
    const token = await this.wecom.getAccessToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${token}`;

    const payload: Record<string, unknown> = {
      touser: externalUserId,
      open_kfid: openKfId,
      msgtype: msgType,
      text: {
        content,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      errcode?: number;
      errmsg?: string;
      msgid: string;
    };

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`OpenKF sendMessage error (${data.errcode}): ${data.errmsg}`);
    }

    return { msgid: data.msgid };
  }
}
