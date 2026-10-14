export class WeChatCustomerServiceAdapter {
    wecom;
    constructor(wecom) {
        this.wecom = wecom;
    }
    /**
     * Syncs inbound customer service messages.
     */
    async syncMessages(openKfId, cursor, tokenParam, limit = 100) {
        const token = tokenParam || (await this.wecom.getAccessToken());
        const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token=${token}`;
        const payload = {
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
        const data = (await res.json());
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
    async sendMessage(openKfId, externalUserId, content, msgType = "text") {
        const token = await this.wecom.getAccessToken();
        const url = `https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token=${token}`;
        const payload = {
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
        const data = (await res.json());
        if (data.errcode && data.errcode !== 0) {
            throw new Error(`OpenKF sendMessage error (${data.errcode}): ${data.errmsg}`);
        }
        return { msgid: data.msgid };
    }
}
//# sourceMappingURL=openkf.js.map