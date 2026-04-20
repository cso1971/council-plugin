/**
 * Smoke: MCP telegram-ask in dry-run — verifies stdio handshake and ask_operator.
 * Run: node scripts/telegram-mcp-dry-smoke.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const serverPath = path.join(root, "mcp", "telegram-ask", "index.js");

function send(proc, obj) {
  proc.stdin.write(JSON.stringify(obj) + "\n");
}

async function readLine(proc) {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (chunk) => {
      buf += chunk.toString();
      const idx = buf.indexOf("\n");
      if (idx !== -1) {
        proc.stdout.off("data", onData);
        resolve(buf.slice(0, idx));
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", (c) => process.stderr.write(c));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0 && code !== null) reject(new Error("server exited " + code));
    });
  });
}

const proc = spawn("node", [serverPath], {
  cwd: path.join(root, "mcp", "telegram-ask"),
  env: {
    ...process.env,
    TELEGRAM_ASK_DRY_RUN: "1",
    TELEGRAM_ASK_STUB_QUEUE: JSON.stringify(["pong"]),
  },
  stdio: ["pipe", "pipe", "pipe"],
});

send(proc, {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "dry-smoke", version: "0.0.1" },
  },
});

const line1 = await readLine(proc);
const res1 = JSON.parse(line1);
if (!res1.result) throw new Error("initialize failed: " + line1);

send(proc, {
  jsonrpc: "2.0",
  method: "notifications/initialized",
});

send(proc, {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: { name: "ask_operator", arguments: { message: "ping" } },
});

const line2 = await readLine(proc);
const res2 = JSON.parse(line2);
const text = res2.result?.content?.[0]?.text;
if (text !== "pong") throw new Error("unexpected tool result: " + line2);

proc.kill();
console.log("telegram-mcp-dry-smoke: OK");
