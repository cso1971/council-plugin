---
name: code-archaeology
description: "Strategies for reading, extracting, and presenting source code excerpts from the Council Console codebase. Use when the Code Archaeologist needs to trace type chains, compute test vectors, detect stale references, or produce self-contained code blocks for story refinement."
---

# Code Archaeology — Source Code Extraction

Use this skill when reading Council Console source files to produce self-contained code excerpts for story refinement.

---

## Extraction Strategy

### 1. Complete Function Extraction

Never extract partial functions. When a story references "lines 248-274", extract the **entire function** that contains those lines.

```
BAD:  Lines 248-274 of council-run.ts (function body without signature or closing)
GOOD: The complete detectOutcome() function (lines 240-285) including its return type
```

### 2. Type Chain Resolution

When extracting a function, identify every type it uses and include those too.

```typescript
// If extracting this function:
export async function startCouncilRun(options: LaunchOptions, config: CouncilConfig): Promise<RunResult> { ... }

// You MUST also extract:
// - LaunchOptions (from claude-launcher.ts)
// - CouncilConfig (from config-loader.ts)
// - RunResult (from council-run.ts or run-manager.ts)
// Include them ABOVE the function in the same code block
```

### 3. Dependency Depth Limit

Follow type chains up to **2 levels deep**. Beyond that, describe the type in a comment.

```typescript
// Level 0: the function itself
// Level 1: its parameter types and return type
// Level 2: types used BY those types
// Level 3+: describe in a comment: "// AgentConfig contains name: string, promptFile: string"
```

---

## Council Console — Key File Map

### Shared Modules (`src/shared/`)

| File | Key exports | Used by |
|------|-------------|---------|
| `config-loader.ts` | `loadConfig(path): CouncilConfig`, `ConfigError`, `CouncilConfig` interface | Console server, webhook handler |
| `prompt-composer.ts` | `composePrompt(config, topic, options?)`, `toSlug(text)` | Console server, webhook handler |
| `claude-launcher.ts` | `launchClaude(options): AsyncIterable<ClaudeStreamEvent>`, `LaunchOptions` | Console server, webhook handler |
| `stream-speaker.ts` | `StreamSpeaker` class, `attributeSpeaker(line, speakers)` | Console server (run streaming) |

### Console Server (`src/council-console-server/`)

| File | Key exports | Role |
|------|-------------|------|
| `server.ts` | Fastify app, route registration, startup | HTTP + WS entry point |
| `run-manager.ts` | `Run` class, `RunManager`, `RunStatus` enum | State machine for council runs |
| `council-run.ts` | `startCouncilRun()`, `detectOutcome()`, `writeFallbackFindings()` | Orchestrates a single council execution |

### Webhook Server (`src/webhook-server/`)

| File | Key exports | Role |
|------|-------------|------|
| `server.ts` | Fastify app, webhook route | HTTP entry point |
| `webhook-handler.ts` | `detectCouncilTrigger()`, `handleWebhook()` | GitLab event processing |
| `session-manager.ts` | `Session` class, `SessionManager` | In-memory + disk persistence |
| `sessions-routes.ts` | REST + WebSocket routes for sessions | API for log viewer |
| `config.ts` | Environment configuration | Env var parsing |

---

## Test Vector Computation

### Strategy: Static Trace

For pure functions, trace the logic manually through the source code:

1. Read the function implementation
2. Apply the input value step by step
3. Record each intermediate result
4. Document the derivation in the "Derivation" column

### Example: Computing `toSlug()` vectors

```
Input: "Voglio migrare Council Console Server a .NET 10"

Step 1 — toLowerCase():
  "voglio migrare council console server a .net 10"

Step 2 — normalize (remove accents):
  "voglio migrare council console server a .net 10"  (no accents in this input)

Step 3 — replace non-alphanumeric with hyphens:
  "voglio-migrare-council-console-server-a--net-10"

Step 4 — collapse multiple hyphens:
  "voglio-migrare-council-console-server-a-net-10"

Step 5 — trim leading/trailing hyphens:
  "voglio-migrare-council-console-server-a-net-10"

Step 6 — truncate to 80 chars:
  "voglio-migrare-council-console-server-a-net-10" (48 chars, no truncation)

Step 7 — append 8-char SHA256 hash:
  SHA256("voglio-migrare-council-console-server-a-net-10") = compute...
  Take first 8 chars of hex digest

Final: "voglio-migrare-council-console-server-a-net-10-{8chars}"
```

### When static tracing isn't possible

If the logic is too complex to trace manually (e.g., depends on crypto or external state), document:
- What the function does
- What inputs are needed
- A suggested approach for computing the value (e.g., "run `node -e 'require(./src/shared/prompt-composer).toSlug("...")'`")

---

## Stale Reference Detection

### How to detect

1. Read the file at the path mentioned in the story
2. Go to the line range mentioned
3. Compare the code at those lines with what the story describes
4. If they differ, the reference is stale

### How to report

```markdown
#### Stale reference: Story {NN}, {description}

- **Story says**: "`council-run.ts:248` — `detectOutcome()` function"
- **Current state**: `detectOutcome()` is now at line 263 (lines 248-260 are now `writeFallbackFindings()`)
- **Cause**: file was modified after the deliberation
- **Updated excerpt**: [provide current code at current line numbers]
```

---

## Code Excerpt Format

Always use this format for code excerpts:

```typescript
// Source: {relative-path-from-council-console}:{start-line}-{end-line}
// Dependencies: {type} ({file}:{lines}), {type} ({file}:{lines})
// Last verified: {date or "current at time of extraction"}

{code}
```

Group related excerpts under descriptive headings:

```markdown
### Config loading and validation

```typescript
// Source: src/shared/config-loader.ts:12-35
export interface CouncilConfig { ... }
```

```typescript
// Source: src/shared/config-loader.ts:40-78
export function loadConfig(configPath: string): CouncilConfig { ... }
```
```

---

## Common Pitfalls

- **Don't assume imports are obvious**: if the function uses `readFile` from `node:fs/promises`, mention it
- **Don't skip error types**: if a function throws `ConfigError`, include the `ConfigError` class definition
- **Don't truncate long functions**: better to include the full function than a summary. The implementer needs the real code
- **Don't guess values**: if you can't compute a test vector, say so and explain why — don't make up a value
