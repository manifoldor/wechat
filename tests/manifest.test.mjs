import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const KEBAB_CASE_PATTERN = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;

test("plugin.json adheres to Grokbot plugin specification", async () => {
  const content = await readFile(resolve(process.cwd(), ".cursor-plugin/plugin.json"), "utf-8");
  const manifest = JSON.parse(content);

  assert.equal(typeof manifest.name, "string");
  assert.ok(KEBAB_CASE_PATTERN.test(manifest.name), "Plugin name must be kebab-case");
  assert.equal(manifest.name, "wechat");
  assert.ok(manifest.displayName);
  assert.ok(manifest.version);
  assert.ok(manifest.description);

  // Author
  assert.ok(manifest.author);
  assert.ok(manifest.author.name);

  // Variables Schema
  assert.ok(manifest.variables);
  assert.equal(manifest.variables.type, "object");
  assert.ok(manifest.variables.properties);
  assert.ok(manifest.variables.required);
  for (const reqProp of manifest.variables.required) {
    assert.ok(
      reqProp in manifest.variables.properties,
      `Required property ${reqProp} must be defined in properties`
    );
  }

  // Component paths
  assert.ok(manifest.skills);
  assert.ok(manifest.agents);
  assert.ok(manifest.commands);
  assert.ok(manifest.rules);
  assert.ok(manifest.hooks);
  assert.ok(manifest.mcpServers);
});

test("marketplace.json conforms to marketplace schema", async () => {
  const content = await readFile(resolve(process.cwd(), ".cursor-plugin/marketplace.json"), "utf-8");
  const marketplace = JSON.parse(content);

  assert.ok(marketplace.name);
  assert.ok(marketplace.owner);
  assert.ok(Array.isArray(marketplace.plugins));
  assert.ok(marketplace.plugins.length > 0);

  const entry = marketplace.plugins[0];
  assert.equal(entry.name, "wechat");
  assert.ok(entry.source);
  assert.ok(entry.description);
});

test(".mcp.json defines valid MCP servers", async () => {
  const content = await readFile(resolve(process.cwd(), ".mcp.json"), "utf-8");
  const config = JSON.parse(content);

  assert.ok(config.mcpServers);
  assert.ok(config.mcpServers.wechat);
  assert.ok(config.mcpServers.wechat.command);
  assert.ok(Array.isArray(config.mcpServers.wechat.args));
});
