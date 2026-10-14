import { WeComAdapter } from "./wecom.js";
export interface OpenKfMessage {
    msgid: string;
    open_kfid: string;
    external_userid: string;
    send_time: number;
    origin: number;
    msgtype: string;
    text?: {
        content: string;
    };
    image?: {
        media_id: string;
    };
    voice?: {
        media_id: string;
    };
    event?: {
        event_type: string;
        open_kfid: string;
        external_userid: string;
    };
}
export declare class WeChatCustomerServiceAdapter {
    private wecom;
    constructor(wecom: WeComAdapter);
    /**
     * Syncs inbound customer service messages.
     */
    syncMessages(openKfId?: string, cursor?: string, tokenParam?: string, limit?: number): Promise<{
        next_cursor: string;
        has_more: number;
        msg_list: OpenKfMessage[];
    }>;
    /**
     * Sends customer service message to external WeChat user.
     */
    sendMessage(openKfId: string, externalUserId: string, content: string, msgType?: string): Promise<{
        msgid: string;
    }>;
}
