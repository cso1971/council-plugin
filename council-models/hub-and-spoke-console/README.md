# Deliberative council — Council Console scope

Hub-and-spoke council (Coordinator + Product Analyst + Architect + QA Strategist) with **domain context, agents, and skills** aimed only at **`council-console`** (Fastify/React/webhook/log-viewer and `council-models/`).

Same protocol as [`hub-and-spoke/`](../hub-and-spoke/) (`CLAUDE.md` voting, `council-log/` outcomes). This variant frames **Council Console** as a **standalone** product tree.

## Layout

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Shared protocol + Council Console project context |
| `CONTEXT.md` | Short focal anchor (`@CONTEXT.md` from `CLAUDE.md`) |
| `council.config.json` | Team, `logDir`, `additionalDirs` → **`council-console/`** root only |
| `agents/*.md` | Coordinator + teammates |
| `.claude/skills/` | `council-console-architecture`, `webhook-session-flow`, `council-console-testing`, `story-writing` |
| `council-log/` | Run output (see `.gitkeep`) |

## Run

Use whatever launcher you run against **Council Console**; point it at this config with a path **relative to the `council-console/` root**, for example:

```text
council-models/hub-and-spoke-console/council.config.json
```

**Council Console UI**: set **Config path** to that value when the server’s project root is `council-console/`.

## `additionalDirs`

Paths are relative to this folder (the directory containing `council.config.json`):

- `../../` — **`council-console/`** repository root (`src/`, `council-models/`, etc.)
