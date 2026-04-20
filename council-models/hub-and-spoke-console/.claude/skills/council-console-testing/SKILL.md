---
name: council-console-testing
description: "Testing strategy for Council Console — TypeScript services (Fastify), .NET console server, React/Vite UIs, WebSockets, and shared utilities under council-console/. Use this skill whenever proposing, designing, writing, or reviewing tests for any council-console package: council-console-server, council-console-server-dotnet, council-console-ui, log-viewer, or shared modules (config-loader, prompt-composer, claude-launcher, stream-speaker). Also use when discussing test infrastructure setup (Vitest, Testing Library, mocking strategies), acceptance criteria with testable assertions, or test coverage priorities."
---

# Council Console — Testing Strategy

## Current state

The council-console project has **no test infrastructure** — no test files, no test scripts, no testing library dependencies. The main packages (`council-console-server`, `council-console-server-dotnet`, `council-console-ui`, `log-viewer`) and the shared modules are untested. Any testing proposal needs to include framework setup.

## Recommended stack

| Layer | Framework | Why |
|-------|-----------|-----|
| Unit + Integration | **Vitest** | TypeScript-native, fast, same ecosystem as Vite (used by both UIs). Single framework across all packages. |
| HTTP integration | **Fastify `inject()`** | Built-in, no extra dependency. Simulates HTTP requests without starting a server. |
| WebSocket | **ws** client in tests | Test WebSocket routes by connecting a real client to an injected Fastify instance or the .NET test host. |
| React components/hooks | **Vitest + @testing-library/react** | Standard for React 18. Test behavior, not implementation. |
| E2E | **Playwright** (when adopted) | Cross-browser, good WebSocket support. Add only when the unit/integration layer is solid. |

Follow **whatever the package already uses** once tests exist — don't introduce a second framework without strong justification.

## Test pyramid priorities

The project has ~30 source files with rich business logic. Focus testing effort where bugs are most costly and logic is most complex.

### Tier 1 — High value, pure logic (test first)

These are pure functions with no I/O — fast to test, high ROI.

**config-loader.ts** — validation is the gatekeeper for the entire system:
- `loadConfig()` with valid JSON → returns typed `CouncilConfig`
- Missing required fields (maxRounds, model, agents) → throws `ConfigError` with descriptive message
- Wrong types (maxRounds as string, agents as array) → `ConfigError`
- Empty teammates array → `ConfigError`
- File not found → `ConfigError` (not raw ENOENT)
- Malformed JSON → `ConfigError` with parse error detail

**prompt-composer.ts** — template interpolation and slug generation:
- `toSlug()` basic: `"Add WebSocket reconnection"` → `add-websocket-reconnection-{8-char-hash}`
- `toSlug()` accented chars: `"Aggiungere notifiche"` → normalized, no accents
- `toSlug()` long text: truncates to 80 chars + 8-char SHA256 hash (max 89 total)
- `toSlug()` special chars: strips non-alphanumeric, collapses hyphens
- `composePrompt()` interpolates `{{TOPIC}}`, `{{TOPIC_SLUG}}`, `{{TEAMMATES_TABLE}}`
- Teammate spawn prompts wrapped in `<spawn-prompt name="...">` tags
- Council Console preamble appended only when `runId` + `consoleServerUrl` provided

**stream-speaker.ts** — heuristic speaker attribution:
- Detects `## ProductAnalyst` markdown headers → speaker "Product Analyst"
- Detects `### Architect` → speaker "Architect"
- Detects `**Name**:` bold label patterns
- Detects spawn tag references
- `currentSpeaker` persists across consecutive lines without new markers
- Falls back to "Coordinator" when no marker found
- Tool use blocks: `[tool_call]` truncated appropriately

**parseCouncilState.ts** — round and vote extraction from log lines:
- Round number extraction from marker lines (regex-based)
- Vote detection: APPROVE, OBJECT, PROPOSE, ABSTAIN, REJECT (case-insensitive)
- Agent name matching from known list
- Duplicate vote filtering (same agent per round)
- Current/max round tracking

### Tier 2 — Stateful logic, needs mocks

**run-manager.ts** — Run class state machine:
- `appendLine()` adds to lines array and notifies all subscribers
- Subscriber error → auto-unsubscribe (doesn't crash the run)
- `finish()` transitions from "running" to terminal status (idempotent — second call is no-op)
- `runManager.createRun()` generates UUID runId, extracts speakers from config
- MAX_RUNS=50 cap with FIFO eviction by `startedAt`

**session-manager.ts** — persistence layer:
- `Session.appendLine()` schedules debounced flush (2s timer, single outstanding)
- `Session.finish()` sets terminal status + immediate disk flush
- `SessionManager.listSessions()` merges in-memory + disk (de-duplicated)
- JSON serialization/deserialization round-trip fidelity
- Process kill with SIGTERM and promise resolution

**council-run.ts** — outcome detection and fallback:
- `detectOutcome()` priority: decision.md → rejection.md → escalation.md → recommendation.md → findings.md
- Exit code 0 but no outcome files → retry once with `claude-sonnet-4`
- Retry also fails → `writeFallbackFindings()` generates findings.md + fallback.md
- Fallback findings: executive summary (last 6 Coordinator lines), P2P communications ("To Investigator X:" regex), hypotheses by speaker
- Status mapping: found outcome file → corresponding RunStatus; no file after retry → "completed"

**webhook-handler.ts** — GitLab trigger detection:
- `detectCouncilTrigger()`: compares `changes.labels.previous` vs `current` → detects added "Council" label
- Label removed → no trigger
- Non-issue webhook → no trigger
- `buildGitLabComment()` formats outcome, round count, and status into structured Markdown

### Tier 3 — Integration (Fastify inject)

**Console server routes** (server.ts):
- `POST /council/start` with valid topic + configPath → 201 with `{ runId, streamUrl, speakers }`
- `POST /council/start` missing topic → 400 with error body
- `POST /council/start` with nonexistent config path → 400 with `ConfigError` message
- `GET /council/runs` → returns array of run metadata (no log lines)
- `GET /council/run/:runId/result` → reads outcome files from council-log directory
- `GET /council/run/:invalidId/result` → 404

**Webhook server routes** (sessions-routes.ts):
- `GET /sessions` → lists in-memory + disk sessions
- `GET /sessions/:id` with valid ID → session metadata
- `POST /sessions/:id/stop` → kills process, marks as "error"
- `GET /sessions/:id/stream` (WebSocket) → catch-up existing lines then live streaming

### Tier 4 — UI and E2E (add later)

**React hooks** (useRunStream.ts, useSessionStream.ts):
- Connect to valid WebSocket URL → state transitions: connecting → running → done/error
- Incoming `{ type: "line" }` → grouped by speaker in `linesBySpeaker` state
- Incoming `{ type: "done" }` → status transitions to terminal
- WebSocket error → status transitions to "error"
- Cleanup on unmount or runId change

**Components** (ConsolePanel.tsx, SessionDetail.tsx):
- Panel auto-scrolls to bottom on new lines
- Intermediate lines (`intermediate: true`) rendered with smaller/indented styling
- Status badges show correct colors per RunStatus

**E2E** (only when unit/integration layer is solid):
- Launch council from UI → panels populate → result displayed
- Session list updates in real-time via polling

## Mock strategy

| Dependency | How to mock | Used by |
|------------|-------------|---------|
| `node:child_process` (spawn) | Vitest `vi.mock()` or manual stub returning fake ChildProcess | claude-launcher tests |
| `node:fs/promises` | Vitest `vi.mock()` — control readFile/writeFile/mkdir responses | config-loader, session-manager, council-run |
| `node:crypto` (randomUUID) | Deterministic stub for predictable runIds | run-manager |
| `fetch` (GitLab API) | `vi.fn()` or msw | webhook-handler (comment posting, bot username detection) |
| Claude CLI subprocess | Mock claude-launcher module — return controlled async iterable of stream events | council-run, webhook-handler |
| WebSocket server | Use real Fastify `inject()` + ws client in test | streaming route tests |
| Time/timers | `vi.useFakeTimers()` | debounced flush in session-manager |

The key boundary to mock is `claude-launcher` — it spawns an external process that costs API tokens. Everything downstream of the launcher (stream processing, outcome detection, fallback) can be tested by feeding controlled events through the launcher's async iterable interface.

## Testability design principles

- **Inject dependencies** (clock, filesystem, spawn) in new code over static singletons — enables fast tests without I/O.
- **Contract test** the Claude launcher boundary: mock the subprocess, test that the caller handles all event types (assistant, tool_use, tool_result, error, exit).
- **Don't mock what you own** — test Fastify routes with `inject()`, not by mocking the router. Test React hooks with Testing Library, not by inspecting internal state.
- **Integration tests behind a flag** for anything that spawns real subprocesses.

## Acceptance criteria quality

When writing stories or proposals that include test scenarios:

- Name the **HTTP status code** and **JSON fields** expected (e.g., "returns 201 with `runId` string and `speakers` array")
- For WebSocket behavior, specify the **event sequence** or minimum observable properties (e.g., "client receives at least one `{ type: 'line' }` before `{ type: 'done' }`")
- For state transitions, name the **before** and **after** states (e.g., "Run transitions from 'running' to 'decision' when decision.md is found")
- For error cases, specify the **error type** and **message content** (e.g., "throws ConfigError containing 'maxRounds must be a number'")

## Anti-patterns to avoid

- **Brittle E2E for every story** — use the pyramid: many unit/fast integration, few full-stack. E2E tests that spawn real Claude processes are slow, flaky, and expensive.
- **Testing React implementation details** — don't assert on internal state or hook return shapes. Test what the user sees (rendered output, DOM events).
- **Flaky timing-dependent WebSocket tests** — always await on a known message (`{ type: "done" }`) rather than using setTimeout. Use `vi.useFakeTimers()` for debounce logic.
- **Mocking too deep** — don't mock `fs.readFileSync` inside `config-loader.ts` and then test that `loadConfig` calls `readFileSync`. Test `loadConfig` with a real temp file or mock at the module boundary.
- **Snapshot tests for dynamic output** — council log content varies by run. Assert on structure (has headings, has vote markers) not exact content.
