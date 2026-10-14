#!/usr/bin/env node

import * as readline from "node:readline";
import { loadConfig } from "../config.js";
import { WeChatOfficialAccountAdapter } from "../adapter/official-account.js";
import { WeComAdapter } from "../adapter/wecom.js";
import { getMcpToolDefinitions, McpToolExecutor } from "./tools.js";

/**
 * Model Context Protocol (MCP) Server for WeChat integration.
 * Communicates via JSON-RPC 2.0 over Stdio (standard input/output).
 */
async function startMcpServer() {
  const config = loadConfig();
  const officialAccount = new WeChatOfficialAccountAdapter(config.wechat);
  const wecom = new WeComAdapter(config.wecom);
  const toolExecutor = new McpToolExecutor(officialAccount, wecom);
  const toolDefinitions = getMcpToolDefinitions();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const sendResponse = (response: Record<string, unknown>) => {
    process.stdout.write(JSON.stringify(response) + "\n");
  };

  rl.on("line", async line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let request: {
      jsonrpc?: string;
      id?: string | number | null;
      method?: string;
      params?: Record<string, unknown>;
    };

    try {
      request = JSON.parse(trimmed);
    } catch (err) {
      sendResponse({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      });
      return;
    }

    const { id, method, params } = request;

    // Handle notifications (no id)
    if (id === undefined || id === null) {
      if (method === "notifications/initialized") {
        return;
      }
    }

    try {
      switch (method) {
        case "initialize": {
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              serverInfo: {
                name: "wechat-mcp",
                version: "1.0.0",
              },
              capabilities: {
                tools: {},
              },
            },
          });
          break;
        }

        case "ping": {
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {},
          });
          break;
        }

        case "tools/list": {
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {
              tools: toolDefinitions,
            },
          });
          break;
        }

        case "tools/call": {
          const toolName = params?.name as string;
          const toolArgs = (params?.arguments as Record<string, unknown>) || {};

          try {
            const output = await toolExecutor.executeTool(toolName, toolArgs);
            sendResponse({
              jsonrpc: "2.0",
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: typeof output === "string" ? output : JSON.stringify(output, null, 2),
                  },
                ],
                isError: false,
              },
            });
          } catch (toolError) {
            sendResponse({
              jsonrpc: "2.0",
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: `Tool execution error: ${
                      toolError instanceof Error ? toolError.message : String(toolError)
                    }`,
                  },
                ],
                isError: true,
              },
            });
          }
          break;
        }

        default: {
          sendResponse({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          });
          break;
        }
      }
    } catch (err) {
      sendResponse({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
        },
      });
    }
  });

  process.stderr.write("[wechat-mcp] Server initialized and ready for JSON-RPC connections.\n");
}

if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  startMcpServer().catch(err => {
    process.stderr.write(`[wechat-mcp] Fatal error: ${err}\n`);
    process.exit(1);
  });
}

export { startMcpServer };
