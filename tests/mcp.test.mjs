import test from "node:test";
import assert from "node:assert/strict";
import { getMcpToolDefinitions, McpToolExecutor } from "../dist/mcp/tools.js";
import { WeChatOfficialAccountAdapter } from "../dist/adapter/official-account.js";
import { WeComAdapter } from "../dist/adapter/wecom.js";

test("getMcpToolDefinitions returns complete set of WeChat Agent tools", () => {
  const tools = getMcpToolDefinitions();
  const toolNames = tools.map(t => t.name);

  assert.ok(toolNames.includes("wechat_send_text"));
  assert.ok(toolNames.includes("wechat_send_markdown"));
  assert.ok(toolNames.includes("wechat_send_custom_service_msg"));
  assert.ok(toolNames.includes("wechat_get_user_info"));
  assert.ok(toolNames.includes("wechat_create_qrcode"));
  assert.ok(toolNames.includes("wechat_manage_menu"));
  assert.ok(toolNames.includes("wechat_get_token"));

  for (const tool of tools) {
    assert.ok(tool.description);
    assert.equal(tool.inputSchema.type, "object");
    assert.ok(tool.inputSchema.properties);
  }
});

test("MCP server handles JSON-RPC 2.0 initialize and tools/list requests over stdio", async () => {
  const { spawn } = await import("node:child_process");
  const child = spawn("node", ["dist/mcp/index.js"], {
    stdio: ["pipe", "pipe", "ignore"],
  });

  try {
    const responses = [];
    child.stdout.on("data", chunk => {
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          responses.push(JSON.parse(line));
        } catch {}
      }
    });

    // Send initialize
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {},
      }) + "\n"
    );

    // Send tools/list
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }) + "\n"
    );

    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 500));

    const initRes = responses.find(r => r.id === 1);
    assert.ok(initRes, "Missing initialize response");
    assert.equal(initRes.result.serverInfo.name, "wechat-mcp");

    const toolsRes = responses.find(r => r.id === 2);
    assert.ok(toolsRes, "Missing tools/list response");
    assert.ok(Array.isArray(toolsRes.result.tools));
    assert.ok(toolsRes.result.tools.some(t => t.name === "wechat_send_text"));
  } finally {
    child.kill();
  }
});
