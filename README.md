# council-skill

Claude Code **plugin** for convening an ad-hoc **Council of Agents** on **business** scenarios (non-coding), using **Agent Teams** as the only runtime. State lives in the **user project** (`council/`, `Sessions/`, `Docs/`, `.claude/skills/`).

Design reference: [docs/superpowers/specs/2026-04-15-council-skill-design.md](docs/superpowers/specs/2026-04-15-council-skill-design.md). Agent Teams constraints: [agent-interaction-patterns.md](agent-interaction-patterns.md).

## Layout

| Path | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin manifest (canonical for Claude Code) |
| `plugin.json` | Duplicate manifest metadata (repo/spec alignment) |
| `skills/` | Plugin skills: wizard, telegram setup, scaffold, launch, resume |
| `references/` | Patterns (7), role archetypes (12), output templates, recommender |
| `mcp/telegram-ask/` | Minimal Node MCP server: tool `ask_operator` |
| `council-models/` | Legacy coding-oriented examples (not used by the plugin runtime) |

## Try locally

```bash
claude --plugin-dir .
```

Skills are namespaced by plugin name, e.g. `/council-skill:council-wizard` (see [Claude Code plugins](https://code.claude.com/docs/en/plugins)).

## User project artifacts (generated)

- `council/config.md`, `council/agents/*.md`
- `Sessions/<slug>/round-*.md`, final output, optional `escalation.md`, `telegram-log.md`
- `Docs/INDEX.md`
- `.claude/skills/<slug>/SKILL.md` per teammate
- Optional `.mcp.json` for Telegram (**git-ignore**; never store tokens in `council/config.md`)

## Telegram MCP

1. Follow `skills/council-telegram-setup/SKILL.md`.
2. Point `.mcp.json` at `mcp/telegram-ask/index.js` with `node` and env vars `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, optional `ASK_TIMEOUT_SECONDS` (default **600**).
3. Install deps: `cd mcp/telegram-ask && npm install`.

**Dry-run / tests**: set `TELEGRAM_ASK_DRY_RUN=1` and optional `TELEGRAM_ASK_STUB_QUEUE` to a JSON array of canned reply strings in the MCP server `env`.

## Limits (first release)

- One **active** council session per project at a time.
- Closing Claude mid-session **dissolves** the team; use **`council-resume`** with file state.
- All agents share **one model** (Opus) on Agent Teams.
- Default **`max_rounds` = 4** (up to 6 in `council/config.md`).
- Keep `Docs/` roughly **under ~100 files** to limit context use.

## Validation

```bash
npm install
npm run validate:references
npm run test:telegram-mcp-dry
```

`validate:references` checks pattern and archetype frontmatter, required headings, coordinator/teammate placeholders, and output templates. `test:telegram-mcp-dry` runs the `telegram-ask` MCP server with `TELEGRAM_ASK_DRY_RUN=1` and a stub reply queue.

## License

See repository policy (add a `LICENSE` file if distributing).
