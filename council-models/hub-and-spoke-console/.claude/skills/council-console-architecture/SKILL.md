---
name: council-console-architecture
description: "Council Console full-stack architecture — Fastify console server, React/Vite UIs, webhook server, log viewer, and shared modules under council-console/. Use this skill whenever designing, reviewing, or modifying APIs, WebSocket streaming, run lifecycle, config resolution, outcome detection, shared utilities (config-loader, prompt-composer, claude-launcher, stream-speaker), package boundaries, env/config layout, or Docker for these apps. Also use when discussing how council runs are launched, how speakers are attributed in streams, or how fallback/retry logic works."
---

# Council Console — Architecture

Ground architectural analysis in how the console stack is laid out **inside `council-console/`** only. This is the single product boundary — all paths in configs, docs, and API requests resolve relative to this tree.

## Repo layout

```
council-console/
├── src/
│   ├── council-console-server/     ← Fastify API (port 8002)
│   │   └── src/
│   │       ├── server.ts           ← Routes, WebSocket, config loading
│   │       ├── config.ts           ← PORT, CONSOLE_SERVER_URL env vars
│   │       ├── run-manager.ts      ← Run CRUD, in-memory state, subscriber fan-out
│   │       └── council-run.ts      ← Claude spawning, stream parsing, outcome detection, fallback
│   │
│   ├── council-console-ui/         ← Vite + React (port 3003)
│   │   └── src/
│   │       ├── App.tsx             ← Header (topic, config, launch) + 4-panel grid
│   │       ├── api.ts              ← startCouncil(), getRunResult(), WS URL builder
│   │       ├── useRunStream.ts     ← WebSocket hook, batches lines by speaker
│   │       └── components/
│   │           └── ConsolePanel.tsx ← Per-speaker output panel, auto-scroll
│   │
│   ├── webhook-server/             ← Fastify webhook + sessions (port 8001)
│   │   └── src/
│   │       ├── server.ts           ← Health, POST /webhook/gitlab, sessions routes
│   │       ├── config.ts           ← GitLab tokens, SESSIONS_DIR
│   │       ├── session-manager.ts  ← Session CRUD, in-memory + disk persistence
│   │       ├── sessions-routes.ts  ← REST + WebSocket session streaming
│   │       └── webhook-handler.ts  ← Detect "Council" label, spawn council
│   │
│   ├── log-viewer/                 ← React + TanStack Query (port 3001)
│   │   └── src/
│   │       ├── App.tsx             ← Session list sidebar + detail
│   │       ├── api.ts              ← Fetch sessions from webhook server
│   │       ├── useSessionStream.ts ← WebSocket streaming hook
│   │       ├── parseCouncilState.ts← Round/vote marker parser
│   │       └── components/
│   │           ├── SessionList.tsx  ← Status badges (Decision/Rejection/Escalation)
│   │           └── SessionDetail.tsx← Round progress, vote summary, log output
│   │
│   └── shared/                     ← Shared utilities (imported by both servers)
│       ├── config-loader.ts        ← Load & validate council.config.json
│       ├── prompt-composer.ts      ← Compose Coordinator prompt, topicSlug generation
│       ├── claude-launcher.ts      ← Spawn `claude` CLI with Team Agents
│       └── stream-speaker.ts       ← Parse stream events → speaker attribution
│
└── council-models/                 ← Bundled council definitions
    ├── hub-and-spoke-console/      ← This model (deliberative council)
    ├── hub-and-spoke/              ← Deliberative (distributed-playground domain)
    ├── adversarial-debate/         ← Debate protocol
    └── parallel-investigation/     ← Investigation protocol
```

## Console server — API contracts

### Routes

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| GET | `/health` | Health check | 200 `{ status: "ok" }` |
| POST | `/council/start` | Launch a council run | 201 `{ runId, streamUrl, speakers }` |
| GET | `/council/runs` | List all runs (metadata) | 200 `Run[]` |
| POST | `/council/run/:runId/agent-log` | Agent real-time reporting | 200 |
| GET | `/council/run/:runId/result` | Fetch outcome files | 200 `{ outcome, mainFile, rounds }` |
| WS | `/council/stream/:runId` | Live log stream | WebSocket |

### POST /council/start — request and response

```
Request body:
{
  "topic": "Add WebSocket reconnection with exponential backoff",
  "configPath": "council-models/hub-and-spoke-console/council.config.json"
}

Response (201):
{
  "runId": "uuid",
  "streamUrl": "/council/stream/uuid",
  "speakers": ["Coordinator", "Product Analyst", "Architect", "QA Strategist"]
}
```

The `configPath` is resolved relative to the **council-console** project root (see Config Resolution below). Speakers are extracted from the config's `agents.teammates[].name` plus "Coordinator".

### GET /council/run/:runId/result

```
Response (200):
{
  "outcome": "decision" | "rejection" | "escalation" | "completed",
  "mainFile": { "name": "decision.md", "content": "..." },
  "rounds": [
    { "name": "round-1.md", "content": "..." }
  ]
}
```

Returns the outcome files from `council-log/{topicSlug}/`. The `mainFile` is the canonical outcome (decision.md, rejection.md, escalation.md, or findings.md).

## Run lifecycle

### Core types (run-manager.ts)

```typescript
type RunStatus = "running" | "decision" | "rejection" | "escalation" | "completed" | "error"

interface LogLine {
  ts: string;        // ISO timestamp
  speaker: string;   // Attributed speaker name
  text: string;      // Content
  intermediate?: boolean;  // Step-by-step intermediate outputs (rendered smaller in UI)
}
```

### State machine

```
POST /council/start
      │
      ▼
  [running] ── appendLine() ──→ fan-out to WS subscribers
      │
      ▼  (Claude process exits)
  [outcome detection]
      │
  ┌───┼───────┬────────────┬──────────┐
  ▼   ▼       ▼            ▼          ▼
decision  rejection  escalation  completed  error
```

A `Run` holds lines in memory, fans out to WebSocket subscribers via callback, and transitions to a terminal status when the Claude process exits. Maximum **50 runs** in memory (LRU eviction by `startedAt`).

### WebSocket protocol (/council/stream/:runId)

Clients receive JSON messages of three types:

```
{ "type": "line", "ts": "...", "speaker": "Architect", "text": "...", "intermediate"?: true }
{ "type": "done", "status": "decision", "finishedAt": "..." }
{ "type": "error", "message": "..." }
```

New connections receive **catch-up** (all existing lines) before switching to live streaming.

## Config resolution

This is a critical design flow — understanding it prevents path resolution bugs.

```
1. PROJECT_ROOT = council-console/  (resolved from src/council-console-server/)

2. configPath from API request (e.g. "council-models/hub-and-spoke-console/council.config.json")
   → resolved relative to PROJECT_ROOT

3. basePath = directory containing the config file
   → e.g. council-console/council-models/hub-and-spoke-console/

4. Agent prompt files (e.g. "agents/coordinator.md")
   → resolved relative to basePath

5. additionalDirs (e.g. ["../../"])
   → resolved relative to basePath → gives access to council-console/ root
   → passed as --add-dir flags to claude CLI
```

### council.config.json shape

```json
{
  "maxRounds": 4,
  "teammateMode": "in-process",
  "model": "claude-sonnet-4-20250514",
  "requirePlanApproval": true,
  "agents": {
    "coordinator": { "promptFile": "agents/coordinator.md" },
    "teammates": [
      { "name": "Product Analyst", "promptFile": "agents/product-analyst.md" },
      { "name": "Architect", "promptFile": "agents/architect.md" },
      { "name": "QA Strategist", "promptFile": "agents/qa-strategist.md" }
    ]
  },
  "logDir": "council-log",
  "additionalDirs": ["../../"]
}
```

The config-loader validates all fields and throws `ConfigError` with descriptive messages on invalid input. `additionalDirs` gives agents read access to files outside the model directory.

## Outcome detection and fallback (council-run.ts)

After the Claude process exits, the server looks for outcome files in `council-log/{topicSlug}/`:

```
Priority order:
1. decision.md       → status: "decision"
2. rejection.md      → status: "rejection"
3. escalation.md     → status: "escalation"
4. recommendation.md → status: "decision"
5. findings.md       → status: "decision" (if written by coordinator)
```

### Retry logic

If exit code is 0 but **no outcome file** is found:
1. **Retry once** with `claude-sonnet-4` (the outcome file path is included in the prompt, so this gives the coordinator another shot)
2. If still no outcome → **fallback report generation**

### Fallback report generation

When no canonical outcome file exists after retry, `council-run.ts` writes:

**findings.md** — structured summary:
- Executive summary (last 6 Coordinator non-intermediate lines)
- Peer-to-Peer Communications (extracts "To Investigator X:" messages from run.lines)
- Hypotheses Explored (grouped by speaker, non-intermediate outputs only)

**fallback.md** — full transcript of all run.lines (technical audit trail)

This ensures **no council run leaves zero artifacts** — the operator always has visibility into what happened.

## Shared utilities (src/shared/)

These modules are imported by both the console server and webhook server. Understanding their boundaries prevents accidental duplication.

### config-loader.ts

Loads and validates `council.config.json`. Exports `loadConfig(configPath)` and the `CouncilConfig` type. Throws `ConfigError` on validation failure with descriptive messages (missing fields, wrong types).

### prompt-composer.ts

Reads the coordinator template and interpolates:
- `{{TOPIC}}` — the deliberation topic
- `{{TOPIC_SLUG}}` — URL-safe slug for log directory naming
- `{{TEAMMATES_TABLE}}` — formatted teammate list

Reads each teammate's spawn prompt file and wraps it in `<spawn-prompt name="...">` tags, appended to the coordinator prompt.

**Topic slug generation** (`toSlug()`): normalizes text, removes accents, truncates to **80 chars + 8-char SHA256 hash** for uniqueness. Example: `"Add WebSocket reconnection with exponential backoff"` → `add-websocket-reconnection-with-exponential-backoff-a1b2c3d4`

**Council Console preamble**: when `runId` and `consoleServerUrl` are provided (launched from Console UI), a mandatory preamble is appended that:
- Forces immediate teammate spawning (no greeting)
- Instructs coordinator to write round-N.md + outcome files to the log directory
- Marks the run as non-interactive (plan approval treated as granted)

### claude-launcher.ts

Spawns the `claude` CLI subprocess with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Key behaviors:
- **Windows**: builds a single shell command with escaped args (avoids Node DEP0190 warning)
- **Unix**: normal spawn with args array
- Passes the composed prompt via **stdin**
- Streams JSON events from stdout via async iterable (line-by-line readline)
- Collects stderr and exit code
- Adds `--add-dir` flags from config's `additionalDirs`
- Uses `--dangerously-skip-permissions` (trusted environment)

### stream-speaker.ts

Heuristic-based speaker attribution for Claude stream events. The stream from `claude` CLI outputs generic JSON events — this module attributes each event to a specific speaker (Coordinator, Product Analyst, etc.).

Detection strategies (in priority order):
1. Markdown headers in text (`## ProductAnalyst`, `### Architect`)
2. Metadata fields (`event.agent`, `event.source`, `event.role`)
3. Tool use/result block parsing
4. Stateful `currentSpeaker` tracking across consecutive blocks

Exports `createStreamSpeaker()` which returns a stateful parser, and `detectSpeakerFromLine()` for one-off detection.

## UI architecture

### Console UI (port 3003)

**Layout**: Header bar (topic input, config path, Launch button, status badge) + 4-panel grid (2x2), one panel per speaker.

**Key patterns**:
- `useRunStream()` manages WebSocket lifecycle and batches incoming lines by speaker
- `ConsolePanel` auto-scrolls to bottom on new lines
- 7-color palette for speaker identification
- Intermediate steps (lines with `intermediate: true`) rendered with smaller/indented styling
- Result panel appears on completion, showing the outcome file content with collapsible round logs

### Log Viewer (port 3001)

**Stack**: React 18 + TanStack Query v5 (auto-refresh every 5s)

- Session list sidebar with council-specific status badges (Decision/Rejection/Escalation)
- Session detail with round progress bar and vote summary
- Real-time streaming via WebSocket to webhook server
- `parseCouncilState.ts` extracts round markers and vote tallies from log lines

## Ports and environment

| Service | Port | Env var |
|---------|------|---------|
| Console server | 8002 | `PORT` |
| Console UI | 3003 | Vite dev server |
| Webhook server | 8001 | `PORT` |
| Log viewer | 3001 | Vite dev server |

Console server env: `PORT`, `CONSOLE_SERVER_URL` (for self-referencing in agent prompts).
Webhook server env: `GITLAB_TOKEN`, `GITLAB_BOT_TOKEN`, `GITLAB_API_URL`, `ANTHROPIC_API_KEY`, `TRIGGER_LABEL`, `PORT`, `SESSIONS_DIR`, `COUNCIL_CONFIG_PATH`, `CLAUDE_TIMEOUT_MINUTES`.

## Module boundaries and import rules

- **Shared utilities** (`src/shared/`) are imported by both servers — changes here affect both.
- **Console server** and **webhook server** are independent — they don't import from each other.
- **UI apps** are fully decoupled from servers (communicate only via HTTP/WebSocket).
- All packages use **ESM** (`"type": "module"` in package.json).
- Prefer explicit imports over barrel files. Keep cross-package surface area minimal.

## Docker considerations

- Dockerfiles live under `src/webhook-server/` and `src/log-viewer/`.
- Console server and UI don't have Dockerfiles yet (run locally or need to be added).
- COPY/mount paths must stay inside `council-console/` — the build context is this tree.
- `council-models/` must be accessible at runtime for config and prompt resolution.
- The `claude` CLI must be installed in containers that run council processes.

## Consistency principles

- **One obvious place** for cross-cutting behavior: run state in `run-manager.ts`, env in `config.ts`, path resolution in `config-loader.ts`.
- **Document ports and env vars** when adding services.
- **TypeScript ESM** across all packages under `src/`.
- **Preserve observable ordering** in run lines — WebSocket subscribers must see lines in append order.
- **Fail loudly** on config errors — `ConfigError` with descriptive messages rather than silent defaults.
