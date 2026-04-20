---
name: council-telegram-setup
description: Five-step guided setup for Telegram Human-in-the-Loop via telegram-ask MCP (.mcp.json, token safety, roundtrip test).
---

# Council — Telegram setup (`telegram-ask`)

Use this skill when the user project **lacks** `telegram-ask` in `.mcp.json` and the wizard (or user) wants **Telegram** for HITL checkpoints (`ask_operator`).

**Security**: Never commit tokens. Never write tokens into `council/config.md`. Add `.mcp.json` to `.gitignore` (scaffold does this). Warn the user not to paste tokens into git or screenshots.

---

## Step 1 — Create bot (BotFather)

1. In Telegram, open **@BotFather**.
2. Run `/newbot`, choose name and username, copy the **HTTP API token**.

Ask the user to paste the token **only in this private session** (not into tracked files except the final `.mcp.json`, which must be git-ignored).

---

## Step 2 — Validate token (`getMe`)

Run (or instruct the user to run in a terminal):

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/getMe"
```

- If `"ok": true`, continue.
- If not, reject the token and return to Step 1.

---

## Step 3 — Discover `chat_id`

1. User sends **any message** to the new bot (open the bot chat, say `hello`).
2. User opens in browser (replace `<TOKEN>`):

`https://api.telegram.org/bot<TOKEN>/getUpdates`

Or uses `curl` to fetch `getUpdates`.

3. From the JSON, extract `result[0].message.chat.id` (or the latest message’s `chat.id`). That integer is **TELEGRAM_CHAT_ID**.

If empty array, user has not messaged the bot yet.

---

## Step 4 — Write `.mcp.json` in the **user project root**

Use **`node`** to run the bundled MCP server (adjust paths to the **absolute** install location of this plugin/repo):

```json
{
  "mcpServers": {
    "telegram-ask": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH_TO_REPO>/mcp/telegram-ask/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "<paste token here>",
        "TELEGRAM_CHAT_ID": "<paste chat id here>",
        "ASK_TIMEOUT_SECONDS": "600"
      }
    }
  }
}
```

Ensure `.gitignore` contains:

```
.mcp.json
```

---

## Step 5 — Roundtrip test

1. Restart Claude Code / reload MCP servers so `telegram-ask` is active.
2. Call tool **`ask_operator`** with a short message, e.g. `Reply YES to confirm council Telegram setup.`
3. Success: user replies in Telegram and the tool returns that text. **Timeout** → re-check chat id, bot blocked, or firewall; see `mcp/telegram-ask/README.md` if present.

**Dry-run / tests**: set `TELEGRAM_ASK_DRY_RUN=1` and optional `TELEGRAM_ASK_STUB_QUEUE` (JSON string array of canned replies) in `env` for automated runs without Telegram.

---

## Failure fallback

If the user declines Telegram or setup fails → set `hitl_mode: inline` in `council/config.md` during scaffold and use **chat-based** HITL with the same message contract as Telegram.
