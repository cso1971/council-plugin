# Deliberative council (hub-and-spoke)

This folder is a **self-contained copy** of the default deliberative council: **Coordinator** plus **Product Analyst**, **Architect**, and **QA Strategist** in a classic hub-and-spoke pattern (teammates report to the Coordinator; voting and consensus follow `CLAUDE.md`).

It mirrors the layout of the other models under [`council-models/`](../) (`adversarial-debate/`, `parallel-investigation/`): `CLAUDE.md`, `council.config.json`, `agents/`, `.claude/skills/`, `council-log/`.

## Layout

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Shared protocol: response format, votes, consensus, operator confirmation gate, `council-log/` outcomes (`decision.md`, `rejection.md`, `escalation.md`). |
| `council.config.json` | Team composition, `logDir`, `additionalDirs` (points at monorepo `distributed-playground/`), `requireOperatorConfirmation`. |
| `.mcp.json` | MCP server registration for `telegram-ask` (`ask_operator` tool). |
| `agents/*.md` | Coordinator + teammate spawn prompts. |
| `.claude/skills/` | Domain skills (dotnet-architecture, testing-strategy, story-writing). |
| `council-log/` | Run output (empty except `.gitkeep` until you run a topic). |

## Run

From `council-of-agents-web/` (config paths are resolved from that project root):

```powershell
pnpm council -- --config ../council-console/council-models/hub-and-spoke/council.config.json --topic "Your topic here"
```

**Council Console**: set **Config path** to `../council-console/council-models/hub-and-spoke/council.config.json`.

The canonical copy at [`council-of-agents-web/`](../../../council-of-agents-web/) (`./council.config.json`, `./agents/`, root `CLAUDE.md`) is unchanged; this tree lives under [`council-console/council-models/`](../../) for bundling with Council Console.

## Operator Confirmation via Telegram

This model includes a **human-in-the-loop confirmation gate** at every round. After each round where consensus is not yet reached, the Coordinator sends a summary to the Council Operator via Telegram and waits for a reply:

| Operator reply | Effect |
|----------------|--------|
| `continue` / `ok` / `yes` / `go` / `proceed` | Proceed to the next round |
| `stop` / `abort` / `end` | End the deliberation and write `escalation.md` |
| Free-text feedback | Feedback is incorporated into the revised proposal for the next round |
| *(timeout / no reply)* | Proceed automatically (operator assumed unavailable) |

### Prerequisites

The `ask_operator` MCP tool requires the `telegram-ask` server (registered in `.mcp.json`). Set the following environment variables:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Chat ID where the bot sends messages (your personal or group chat) |

If the env vars are missing or the MCP server is not configured, the confirmation step is skipped and the deliberation proceeds automatically (same behavior as before this feature).

See the main [Council of Agents README](../../../council-of-agents-web/README.md) for prerequisites and CLI options.
