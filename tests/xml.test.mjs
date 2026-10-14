import test from "node:test";
import assert from "node:assert/strict";
import { parseWeChatXml, parseInboundMessage, buildPassiveReplyXml } from "../dist/utils/xml.js";

test("parseWeChatXml handles CDATA and normal text correctly", () => {
  const xml = `
    <xml>
      <ToUserName><![CDATA[to_user_123]]></ToUserName>
      <FromUserName><![CDATA[from_user_456]]></FromUserName>
      <CreateTime>1348831860</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[Hello WeChat Agent]]></Content>
      <MsgId>1234567890123456</MsgId>
    </xml>
  `;

  const parsed = parseWeChatXml(xml);
  assert.equal(parsed.ToUserName, "to_user_123");
  assert.equal(parsed.FromUserName, "from_user_456");
  assert.equal(parsed.CreateTime, "1348831860");
  assert.equal(parsed.MsgType, "text");
  assert.equal(parsed.Content, "Hello WeChat Agent");
  assert.equal(parsed.MsgId, "1234567890123456");
});

test("parseInboundMessage properly typecasts fields", () => {
  const xml = `
    <xml>
      <ToUserName><![CDATA[gh_test]]></ToUserName>
      <FromUserName><![CDATA[openid_abc]]></FromUserName>
      <CreateTime>1700000000</CreateTime>
      <MsgType><![CDATA[event]]></MsgType>
      <Event><![CDATA[subscribe]]></Event>
      <EventKey><![CDATA[qrscene_123]]></EventKey>
    </xml>
  `;

  const msg = parseInboundMessage(xml);
  assert.equal(msg.ToUserName, "gh_test");
  assert.equal(msg.FromUserName, "openid_abc");
  assert.equal(msg.CreateTime, 1700000000);
  assert.equal(msg.MsgType, "event");
  assert.equal(msg.Event, "subscribe");
  assert.equal(msg.EventKey, "qrscene_123");
});

test("buildPassiveReplyXml generates valid passive reply envelope", () => {
  const replyXml = buildPassiveReplyXml({
    ToUserName: "user1",
    FromUserName: "bot1",
    CreateTime: 123456,
    MsgType: "text",
    Content: "Reply from Grokbot Agent",
  });

  assert.ok(replyXml.includes("<ToUserName><![CDATA[user1]]></ToUserName>"));
  assert.ok(replyXml.includes("<FromUserName><![CDATA[bot1]]></FromUserName>"));
  assert.ok(replyXml.includes("<CreateTime>123456</CreateTime>"));
  assert.ok(replyXml.includes("<MsgType><![CDATA[text]]></MsgType>"));
  assert.ok(replyXml.includes("<Content><![CDATA[Reply from Grokbot Agent]]></Content>"));
});
