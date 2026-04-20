# Council Console — focal context

Use this as a quick anchor; full protocol and stack detail live in `CLAUDE.md` and `.claude/skills/`.

## What this council is for

Deliberations target **Council Console** only: the console API (Fastify or .NET), React/Vite UI, log viewer, Dockerfiles under `src/`, and bundled definitions under `council-models/`.

## Layout (under `council-console/`)

| Area | Path | Role |
|------|------|------|
| Console API + WebSocket | `src/council-console-server/` | Runs councils, streams output (default port 8002). |
| Console UI | `src/council-console-ui/` | Vite/React (default port 3003). |
| .NET Console (optional) | `src/council-console-server-dotnet/` | Alternative API + static log viewer (~8002). |
| Log viewer | `src/log-viewer/` | Session log UI (default port 3001). |
| Bundled council defs | `council-models/` | This tree and sibling models. |

## Paths and `additionalDirs`

Use **`council-console/`** as the project root for mental models and examples. This model’s `council.config.json` adds **`../../`** (the `council-console/` root) so agents can read real app and model source. Typical **Config path** in the UI: `council-models/hub-and-spoke-console/council.config.json`.
