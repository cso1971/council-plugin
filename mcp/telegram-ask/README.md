# telegram-ask MCP server

Stdio MCP server exposing **`ask_operator(message)`** → sends `message` to the configured Telegram chat, long-polls `getUpdates` until a user reply or **`ASK_TIMEOUT_SECONDS`** (default **600**), then returns reply text or **`TIMEOUT`**.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes (unless dry-run) | Bot API token |
| `TELEGRAM_CHAT_ID` | Yes | Target chat id |
| `ASK_TIMEOUT_SECONDS` | No | Default `600` |
| `TELEGRAM_ASK_DRY_RUN` | No | Set to `1` for tests without Telegram |
| `TELEGRAM_ASK_STUB_QUEUE` | No | JSON array of strings; each `ask_operator` shifts one reply |

## Run

```bash
npm install
node index.js
```

Wire from project `.mcp.json` as in `skills/council-telegram-setup/SKILL.md`.
