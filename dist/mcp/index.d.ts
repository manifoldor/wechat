#!/usr/bin/env node
/**
 * Model Context Protocol (MCP) Server for WeChat integration.
 * Communicates via JSON-RPC 2.0 over Stdio (standard input/output).
 */
declare function startMcpServer(): Promise<void>;
export { startMcpServer };
