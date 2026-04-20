#!/usr/bin/env node
/**
 * MCP server: telegram-ask
 * Tool: ask_operator(message: string) -> string
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ASK_TIMEOUT_SECONDS (default 600)
 * Dry-run: TELEGRAM_ASK_DRY_RUN=1, optional TELEGRAM_ASK_STUB_QUEUE (JSON array of strings)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TIMEOUT_SEC = Math.max(1, parseInt(process.env.ASK_TIMEOUT_SECONDS || "600", 10));
const DRY = process.env.TELEGRAM_ASK_DRY_RUN === "1" || process.env.TELEGRAM_ASK_DRY_RUN === "true";

let stubQueue = [];
if (DRY && process.env.TELEGRAM_ASK_STUB_QUEUE) {
  try {
    stubQueue = JSON.parse(process.env.TELEGRAM_ASK_STUB_QUEUE);
    if (!Array.isArray(stubQueue)) stubQueue = [];
  } catch {
    stubQueue = [];
  }
}

function api(path, params = {}) {
  const u = new URL(`https://api.telegram.org/bot${TOKEN}/${path}`);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return fetch(u.toString());
}

async function sendMessage(text) {
  const res = await api("sendMessage", {
    chat_id: CHAT_ID,
    text,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "sendMessage failed");
  return data.result;
}

async function getUpdates({ offset, timeoutSec, limit } = {}) {
  const params = {
    timeout: String(Math.min(50, Math.max(0, timeoutSec ?? 0))),
    allowed_updates: JSON.stringify(["message"]),
  };
  if (offset !== undefined && offset !== null) params.offset = String(offset);
  if (limit !== undefined) params.limit = String(limit);
  const res = await api("getUpdates", params);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "getUpdates failed");
  return data.result || [];
}

async function askOperatorReal(message) {
  // Prime offset BEFORE sending: offset=-1 with timeout=0 returns at most the
  // last pre-existing update without long-polling. Setting offset = last+1
  // guarantees we only receive messages the user sends *after* our prompt.
  // sentAt remains as a secondary filter for robustness.
  let offset = 0;
  const primed = await getUpdates({ offset: -1, timeoutSec: 0, limit: 1 });
  for (const u of primed) {
    if (u.update_id >= offset) offset = u.update_id + 1;
  }

  const sent = await sendMessage(message);
  const sentAt = sent.date;
  const sentId = sent.message_id;
  const deadline = Date.now() + TIMEOUT_SEC * 1000;

  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now();
    const pollSec = Math.min(50, Math.max(1, Math.ceil(remainingMs / 1000)));
    const updates = await getUpdates({ offset, timeoutSec: pollSec });
    for (const upd of updates) {
      offset = upd.update_id + 1;
      const msg = upd.message;
      if (!msg || !msg.chat || String(msg.chat.id) !== String(CHAT_ID)) continue;
      if (msg.from?.is_bot) continue;
      if (!msg.text) continue;
      if (msg.date < sentAt - 1) continue;
      const replyTo = msg.reply_to_message?.message_id;
      if (replyTo != null && replyTo !== sentId) continue;
      return msg.text;
    }
  }
  return "TIMEOUT";
}

async function askOperatorDryRun(message) {
  if (stubQueue.length > 0) return String(stubQueue.shift());
  return `[DRY-RUN] Acknowledged: ${message.slice(0, 200)}`;
}

const server = new McpServer({
  name: "telegram-ask",
  version: "0.1.0",
});

server.registerTool(
  "ask_operator",
  {
    description:
      "Send a message to the configured Telegram chat and block until the operator replies or ASK_TIMEOUT_SECONDS elapses (returns TIMEOUT).",
    inputSchema: {
      message: z.string().min(1).describe("Message to send to the operator chat."),
    },
  },
  async ({ message }) => {
    try {
      if (DRY) {
        const text = await askOperatorDryRun(message);
        return { content: [{ type: "text", text }] };
      }
      if (!TOKEN || !CHAT_ID) {
        return {
          content: [
            {
              type: "text",
              text: "ERROR: Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID for telegram-ask MCP.",
            },
          ],
          isError: true,
        };
      }
      const text = await askOperatorReal(message);
      return { content: [{ type: "text", text }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `ERROR: ${e?.message || e}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
