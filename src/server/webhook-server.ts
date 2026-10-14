import { createServer, IncomingMessage, ServerResponse, Server } from "node:http";
import { URL } from "node:url";
import { PluginConfig } from "../types.js";
import { checkSignature } from "../crypto/signature.js";
import { WXBizMsgCrypt } from "../crypto/wx-crypto.js";
import { parseInboundMessage, parseWeChatXml } from "../utils/xml.js";
import { WeChatAgentBridge } from "../agent/bridge.js";

export class WeChatWebhookServer {
  private server: Server | null = null;
  private crypt: WXBizMsgCrypt | null = null;

  constructor(
    private config: PluginConfig,
    private bridge: WeChatAgentBridge
  ) {
    if (config.wechat.token && config.wechat.aesKey && config.wechat.appId) {
      this.crypt = new WXBizMsgCrypt(
        config.wechat.token,
        config.wechat.aesKey,
        config.wechat.appId
      );
    }
  }

  /**
   * Starts HTTP webhook listener.
   */
  public async start(): Promise<number> {
    const port = this.config.wechat.webhookPort || 3000;
    const host = this.config.wechat.webhookHost || "0.0.0.0";

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res));
      this.server.on("error", reject);
      this.server.listen(port, host, () => {
        console.log(`[WeChatWebhookServer] Listening on http://${host}:${port}`);
        console.log(`[WeChatWebhookServer] Webhook endpoint: ${this.config.wechat.webhookPath || "/wechat/webhook"}`);
        resolve(port);
      });
    });
  }

  /**
   * Stops HTTP server.
   */
  public async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise(resolve => {
      this.server!.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = reqUrl.pathname;
    const webhookPath = this.config.wechat.webhookPath || "/wechat/webhook";

    // Health check endpoint
    if (pathname === "/health" || pathname === "/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          timestamp: Date.now(),
          appId: this.config.wechat.appId ? `${this.config.wechat.appId.slice(0, 6)}***` : "unset",
          hasAesKey: Boolean(this.config.wechat.aesKey),
        })
      );
      return;
    }

    if (pathname !== webhookPath) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    // GET: WeChat server verification
    if (req.method === "GET") {
      this.handleVerification(reqUrl, res);
      return;
    }

    // POST: WeChat message callback
    if (req.method === "POST") {
      await this.handleMessageCallback(req, reqUrl, res);
      return;
    }

    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  }

  private handleVerification(reqUrl: URL, res: ServerResponse): void {
    const signature = reqUrl.searchParams.get("signature") || reqUrl.searchParams.get("msg_signature") || "";
    const timestamp = reqUrl.searchParams.get("timestamp") || "";
    const nonce = reqUrl.searchParams.get("nonce") || "";
    const echostr = reqUrl.searchParams.get("echostr") || "";

    const token = this.config.wechat.token;
    if (checkSignature(token, timestamp, nonce, signature)) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(echostr);
    } else {
      console.warn("[WeChatWebhookServer] Verification signature mismatch:", { signature, timestamp, nonce });
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Invalid signature");
    }
  }

  private async handleMessageCallback(
    req: IncomingMessage,
    reqUrl: URL,
    res: ServerResponse
  ): Promise<void> {
    let rawBody = "";
    req.on("data", chunk => {
      rawBody += chunk;
      if (rawBody.length > 5 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const msgSignature = reqUrl.searchParams.get("msg_signature");
        const timestamp = reqUrl.searchParams.get("timestamp") || "";
        const nonce = reqUrl.searchParams.get("nonce") || "";

        let plaintextXml = rawBody;
        let isEncrypted = false;

        // Check if message is encrypted
        if (msgSignature && this.crypt) {
          const parsedWrapper = parseWeChatXml(rawBody);
          if (parsedWrapper.Encrypt) {
            plaintextXml = this.crypt.decryptMsg(
              msgSignature,
              timestamp,
              nonce,
              parsedWrapper.Encrypt
            );
            isEncrypted = true;
          }
        }

        const inboundMsg = parseInboundMessage(plaintextXml);
        const replyXml = await this.bridge.handleInboundMessage(inboundMsg);

        if (!replyXml || replyXml.trim() === "") {
          // Return success or empty string to stop WeChat retries
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("success");
          return;
        }

        if (isEncrypted && this.crypt) {
          // Encrypt passive reply in secure mode
          const encryptedReply = this.crypt.encryptMsg(replyXml, timestamp, nonce);
          res.writeHead(200, { "Content-Type": "application/xml" });
          res.end(encryptedReply.xml);
        } else {
          // Plain passive reply
          res.writeHead(200, { "Content-Type": "application/xml" });
          res.end(replyXml);
        }
      } catch (err) {
        console.error("[WeChatWebhookServer] Error processing message callback:", err);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("success");
      }
    });
  }
}
