---
name: story-writing
description: "User stories, INVEST principles, acceptance criteria, and epic decomposition for Council Console topics. Use this skill whenever the Product Analyst (or any agent) needs to write, review, or decompose requirements for console UI, console server API, webhook server, log-viewer, or shared module features. Also use when evaluating whether acceptance criteria are specific enough, when decomposing a large topic into stories, or when validating that stories follow INVEST and cover the right user roles (console operator, platform maintainer, GitLab integrator, developer)."
---

# Story Writing — User Stories and Requirements

Use this skill to ground requirements analysis in structured, proven formats. All examples below are from the **Council Console** domain — the TypeScript apps under `council-console/`.

---

## User Story Format

Every user story follows this structure:

```
As a [role],
I want [capability],
So that [benefit].
```

### Rules

- **Role** must be specific to the council-console domain: "console operator", "platform maintainer", "GitLab integrator", "developer extending the stack" — not generic "user" or "admin"
- **Capability** describes a single action the user wants to perform
- **Benefit** explains the value — what problem does this solve or what outcome does the user gain?
- A story without a clear benefit is a task, not a story — rephrase or merge it

### Good example

```
As a console operator,
I want the WebSocket stream to automatically reconnect with exponential backoff when the connection drops,
So that I don't lose visibility into a running council when there's a brief network interruption.
```

### Bad example

```
As a user,                                    ← too vague — which role?
I want WebSocket reconnection to work,        ← too vague — what behavior specifically?
So that the system is more reliable.           ← no concrete benefit stated
```

---

## INVEST Principles

Every story should satisfy all six criteria. Use this as a validation checklist.

### I — Independent

Stories should be implementable in any order. Minimize dependencies between stories.

- **Good**: "Add WebSocket reconnection to the console UI" and "Add run history page" can be built in either order
- **Bad**: "Add RunStatus type to shared module" is not a story — it's a technical task with no user value. Fold it into the first story that needs the type
- **When dependencies are unavoidable**: make them explicit ("This story requires the `/council/run/:runId/result` endpoint to exist because the UI reads the outcome from it")

### N — Negotiable

Stories are not contracts — the details (how) are negotiable while the intent (what and why) is fixed.

- The story describes the goal; the team decides implementation details
- Acceptance criteria define the boundaries, not the implementation
- Technical constraints belong in the Architect's analysis, not in the story itself (e.g., "use Fastify inject" is an implementation choice, not a requirement)

### V — Valuable

Every story must deliver identifiable value to a specific user or stakeholder.

- **Valuable**: "As a console operator, I want to see which round the council is on during a live run, so that I can estimate how close it is to finishing"
- **Not valuable on its own**: "Add round parsing logic to stream-speaker.ts" — this is infrastructure. Bundle it with the operator-facing story that needs it
- **Test**: can you explain to a non-technical stakeholder why this story matters? If not, it's not a story

### E — Estimable

The team should be able to estimate the effort required.

- Stories must be clear enough that a developer can roughly size the work
- If a story can't be estimated, it's too vague — decompose it or add a research spike
- Acceptance criteria help estimation by bounding the scope (e.g., "supports up to 50 concurrent WebSocket connections" bounds the performance work)

### S — Small

A story should be completable within a single sprint iteration (typically 1-5 days of work).

- **Too large**: "Implement full GitLab webhook integration with session management" — this is an epic
- **Right size**: "Detect 'Council' label added to a GitLab issue and create a session" — concrete, bounded
- **Too small**: "Add `topicSlug` field to the Run interface" — this is a task, not a story

### T — Testable

Every story must have verifiable acceptance criteria that a tester can check.

- If you can't write a test for a criterion, the criterion is too vague
- Acceptance criteria define the pass/fail boundary
- Both happy path and key error scenarios should be covered

---

## Acceptance Criteria

### Format Options

**Given/When/Then** (preferred for behavioral criteria):

```
Given the console server is running and a valid config exists at
  "council-models/hub-and-spoke-console/council.config.json"
When I POST /council/start with topic "Add retry logic" and that configPath
Then the server responds 201 with:
  - runId: a UUID string
  - streamUrl: "/council/stream/{runId}"
  - speakers: ["Coordinator", "Product Analyst", "Architect", "QA Strategist"]
And a WebSocket connection to /council/stream/{runId} starts receiving log lines
```

**Checklist format** (for simpler validations):

```
Acceptance Criteria:
- [ ] POST /council/start with missing topic returns 400 with { error: "topic is required" }
- [ ] POST /council/start with nonexistent configPath returns 400 with ConfigError message
- [ ] WebSocket /council/stream/:runId sends catch-up lines for an already-running council
- [ ] When the council finishes, WebSocket sends { type: "done", status: "decision" }
- [ ] GET /council/run/:runId/result returns the decision.md content and round files
```

### Acceptance Criteria Quality Rules

| Rule | Good | Bad |
|------|------|-----|
| **Specific** | "Returns HTTP 404 with body `{ error: 'Run not found' }`" | "Handles missing runs" |
| **Measurable** | "WebSocket delivers lines within 500ms of Claude emitting them" | "Streaming is fast enough" |
| **Testable** | "Given a council that exits with no outcome files, When the server retries with sonnet-4, Then findings.md is generated as fallback" | "Fallback works correctly" |
| **Complete** | Covers happy path + at least 2 error scenarios | Only describes the happy path |
| **Independent** | Each criterion can be verified on its own | Criteria depend on execution order |

### Council Console — specific criteria patterns

Because the council-console stack involves WebSockets, async processes, and file-based outcomes, acceptance criteria often need to specify:

**For API routes:**
- HTTP status code + response JSON shape (name the fields)
- Error response format (`{ error: string }`)
- Reference the actual route path (e.g., `POST /council/start`, not "the start endpoint")

**For WebSocket behavior:**
- Message types expected (`{ type: "line" }`, `{ type: "done" }`, `{ type: "error" }`)
- Ordering guarantees (catch-up before live, lines in append order)
- Connection lifecycle (what happens on reconnect, on run already finished)

**For config resolution:**
- Paths relative to council-console root (e.g., `council-models/hub-and-spoke-console/council.config.json`)
- Error messages on invalid config (surface `ConfigError` text, not generic 500)

**For outcome detection:**
- Which file in `council-log/{topicSlug}/` determines the status
- Fallback behavior when no outcome file exists

### Minimum Per Story

- At least **2 acceptance criteria** per story (one happy path, one error/edge)
- Preferably **3-5 criteria** covering: happy path, input validation, error handling, edge cases
- For complex stories: up to 8 criteria, but consider splitting the story if more are needed

---

## Epic Decomposition

When a topic is too large for a single story, decompose it into an epic with multiple stories.

### Decomposition Strategy

1. **Identify the user roles**: who interacts with this feature? (operator, maintainer, integrator, developer)
2. **Map the workflows**: what are the main user flows from start to finish?
3. **Split by capability**: each distinct action the user performs is a story candidate
4. **Validate independence**: can each story deliver value on its own?
5. **Order by value**: which stories deliver the most value earliest?

### Decomposition Patterns

| Pattern | When to use | Council Console example |
|---------|------------|------------------------|
| **By workflow step** | Feature has a clear sequence | Launch council → Stream output → View result → Export decision |
| **By user role** | Different roles have different needs | Operator launches from UI, integrator triggers via webhook, maintainer configures Docker |
| **By data variation** | Different inputs require different handling | Hub-and-spoke config, adversarial-debate config, parallel-investigation config |
| **By CRUD operation** | Simple data management features | List runs, view run detail, stop a running council, delete old runs |
| **By happy path / edge case** | Core flow first, then error handling | Launch council (happy) → Handle config not found → Handle Claude process crash → Fallback report |

### Example: "Add run history and filtering" epic decomposition

```
Epic: Allow operators to browse and filter past council runs

Story 1: View run history
  As a console operator, I want to see a list of past council runs with their
  topic, status, and timestamp, so that I can find a previous deliberation result.

Story 2: Filter runs by status
  As a console operator, I want to filter the run list by outcome (decision,
  rejection, escalation, error), so that I can quickly find successful councils
  or investigate failures.

Story 3: View run detail with round logs
  As a console operator, I want to click on a past run and see the decision.md
  content plus each round's log, so that I can review the deliberation process.

Story 4: Search runs by topic
  As a console operator, I want to search runs by topic text, so that I can
  find a specific deliberation without scrolling through the full list.
```

### Decomposition Anti-Patterns

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| **Technical slicing** ("Add RunStatus type", "Create WebSocket route", "Wire stream-speaker") | No story delivers user value alone | Slice by user capability instead — each story includes all layers needed |
| **Too thin** ("Add `topicSlug` field to Run") | Not a story — it's a task | Fold into the story that needs topicSlug |
| **Too thick** ("Implement complete webhook integration") | Can't be estimated or completed in one iteration | Decompose using the patterns above |
| **Dependent chain** (Story 2 can't start until Story 1 is 100% done) | Blocks parallel work | Re-slice to maximize independence; if unavoidable, make dependency explicit |

---

## Cross-package impact awareness

Council Console stories often span multiple packages. When writing stories, note which packages are affected — this helps the Architect and QA Strategist assess impact.

| Change type | Likely packages affected |
|-------------|------------------------|
| New API route | `council-console-server` + `council-console-ui` (API client) |
| WebSocket protocol change | `council-console-server` + `council-console-ui` (useRunStream hook) |
| New shared utility | `shared/` + both servers that import it |
| Config schema change | `shared/config-loader.ts` + all configs in `council-models/` |
| GitLab webhook change | `webhook-server` + `log-viewer` (if session shape changes) |
| Docker/deployment change | Dockerfiles in `src/` + `docker-compose.yml` |

Don't let cross-package awareness leak into story text (that's the Architect's domain), but do ensure acceptance criteria cover the **operator-visible outcome** across the full flow, not just one package.

---

## Roles in the Council Console domain

When writing stories, use these specific roles — never generic "user" or "admin".

| Role | Who they are | What they care about | Example story focus |
|------|-------------|---------------------|---------------------|
| **Console operator** | Runs councils from the browser UI | Clear topic entry, config path selection, live stream visibility, error messages, result readability | "I want to see which speakers have responded in the current round" |
| **Platform maintainer** | Owns Docker, compose, deployment | Image size, env vars, service wiring, port conflicts, reproducible builds | "I want a single `docker compose up` to start all four services" |
| **GitLab integrator** | Configures webhooks and manages sessions | Reliable webhook delivery, session correlation with issues, token security | "I want the webhook to post a structured comment on the GitLab issue when the council finishes" |
| **Developer extending the stack** | Works in `council-console/src/` | API contracts, TypeScript types, shared module boundaries, local dev ergonomics | "I want `pnpm typecheck` to validate all packages without starting any servers" |

---

## Story Writing Checklist

Before finalizing a set of stories, verify:

- [ ] Every story follows "As a [specific council-console role], I want [action], So that [benefit]"
- [ ] Every story satisfies INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- [ ] Every story has at least 2 acceptance criteria (happy path + error scenario)
- [ ] Acceptance criteria are specific: HTTP status codes, JSON field names, WebSocket message types, file paths
- [ ] No story is a technical task disguised as a story (e.g., "Add type to shared module")
- [ ] The set of stories covers the full scope of the epic/topic
- [ ] Edge cases are covered — config errors, WebSocket drops, missing outcome files, process crashes
- [ ] Dependencies between stories are explicit where they exist
- [ ] Stories are ordered by value delivery (most valuable first)
- [ ] Each story can be completed within a single sprint iteration
- [ ] Cross-package impact is acknowledged (which packages does this story touch?)
