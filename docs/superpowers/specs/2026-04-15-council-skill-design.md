# Council Skill — Design

**Date**: 2026-04-15
**Status**: Design approved; ready for implementation planning
**Owner**: soliman.christian@gmail.com

## Problem statement

Non-technical users need a way to convene an ad-hoc "Council of Agents" for
business decisions, investigations, or analyses (non-coding scenarios) — without
writing configuration files, agent prompts, or MCP servers by hand.

Today's assets in this repository (`council-models/hub-and-spoke`, `adversarial-debate`,
`parallel-investigation`, `story-refinement-pipeline`) are **coding-oriented**
deliberation protocols designed to run via the external **Council Console** app.
We want to generalize the pattern, move the runtime onto **Claude Code Agent
Teams** (including Claude Desktop Cowork), and package it as a user-friendly
skill/plugin.

## Goals

- Let a non-technical user scaffold and run a council in a project folder that
  contains business documents under `Docs/`.
- Support **7 multi-agent patterns** at first release, all natively supported by
  Claude Code Agent Teams (per `agent-interaction-patterns.md`).
- Generate per-agent domain skills on demand via Claude Code's skill-creator,
  mixed with a library of reusable role archetypes.
- Keep humans in the loop via **Telegram** (preferred) or inline chat fallback.
- Keep state durable in the project filesystem — no custom runtime; rely on
  Agent Teams' native orchestration.

## Non-goals (first release)

- Custom pattern authoring by end users (templates are predefined).
- Patterns flagged as ⚠️ workaround or ❌ unsupported in Claude Code Agent Teams.
- Cross-session semantic memory / RAG over Docs (agents read files on demand).
- Multi-model cost optimization (Agent Teams uses a single Opus model).
- Scheduling / unattended execution (each session is interactive).

## Target users

A business user (product manager, legal operations, strategy consultant,
founder) with:

- Access to Claude Code or Claude Desktop Cowork
- A project folder with a `Docs/` subfolder containing relevant business
  documents (PDF, markdown, text)
- A scenario that benefits from multiple expert perspectives
- Willingness to configure a Telegram bot once (guided)

## Constraints inherited from Claude Code Agent Teams

From `agent-interaction-patterns.md`:

- No nested teams — only the lead (coordinator) orchestrates
- No session resumption — teams are ephemeral; state lives in files
- Teammates have reduced tools (no `AgentTool`, `TeamCreate/Delete`, `Cron*`)
- Single model across all agents (Opus)
- One team per session
- Native Plan Approval and Delegate Mode available for HITL

The design works **with** these constraints, not around them.

---

## High-level approach

A Claude Code **plugin** named `council-skill` containing:

1. A primary orchestrator skill (`council-wizard`) that runs the interview flow
2. Four secondary skills (`council-telegram-setup`, `council-scaffold`,
   `council-launch`, `council-resume`) callable independently
3. Three reference libraries under `references/`: patterns, personas,
   output-templates
4. No custom runtime — the plugin generates prompts and files that Claude Code
   Agent Teams executes natively

The plugin is installed **user-level** once. Each user project gets its own
**project-level** `.claude/skills/` with domain skills generated for that
specific scenario.

---

## Architecture

### Plugin repository layout

```
council-skill/                          (this repo — installed as plugin)
├── plugin.json
├── README.md
├── skills/
│   ├── council-wizard/SKILL.md         primary — flow controller only
│   ├── council-telegram-setup/SKILL.md 5-step Telegram onboarding
│   ├── council-scaffold/SKILL.md       writes files in user project
│   ├── council-launch/SKILL.md         composes Agent Teams kickoff prompt
│   └── council-resume/SKILL.md         re-opens prior Sessions
└── references/
    ├── patterns/                       1 file per pattern (7 total)
    │   ├── hub-and-spoke.md
    │   ├── swarm.md
    │   ├── adversarial-debate.md
    │   ├── map-reduce.md
    │   ├── plan-execute-verify.md
    │   ├── ensemble-voting.md
    │   └── builder-validator.md
    ├── personas/                       10-12 reusable business roles
    │   ├── market-analyst.md
    │   ├── legal-advisor.md
    │   ├── financial-controller.md
    │   ├── compliance-officer.md
    │   ├── brand-strategist.md
    │   ├── hr-partner.md
    │   ├── risk-officer.md
    │   ├── operations-expert.md
    │   ├── customer-advocate.md
    │   ├── data-analyst.md
    │   ├── pm-facilitator.md
    │   └── moderator-neutral.md
    ├── output-templates/               business-English, per pattern
    │   ├── decision.md                 (hub-and-spoke, ensemble-voting)
    │   ├── findings.md                 (swarm)
    │   ├── recommendation.md           (adversarial-debate)
    │   ├── analysis-report.md          (map-reduce)
    │   ├── plan-and-verification.md    (plan-execute-verify)
    │   └── draft-and-review.md         (builder-validator)
    └── recommender/
        └── questions.md                2-3 question decision tree
```

### Generated user project layout

```
<user-project>/
├── .claude/
│   ├── settings.json                   enables local skill discovery
│   └── skills/<slug>/SKILL.md          one per agent domain skill
├── .mcp.json                           telegram-ask MCP server (git-ignored)
├── .gitignore                          includes .mcp.json
├── Docs/
│   ├── <user business docs>
│   └── INDEX.md                        generated: 2-line summary + tags per doc
├── council/
│   ├── config.md                       pattern, scenario, agent↔skill map, hitl_mode
│   └── agents/
│       ├── coordinator.md
│       └── <role>.md                   one per teammate
└── Sessions/<topic-short-slug>/
    ├── config-snapshot.md              frozen copy of council/config.md at launch
    ├── round-1.md, round-2.md, ...
    ├── <output>.md                     decision | findings | recommendation | ...
    ├── escalation.md                   if no consensus at max_rounds
    └── telegram-log.md                 chronology of HITL exchanges (optional)
```

**Key choice**: plugin is user-level (installed once); generated artifacts are
project-level (portable with the project folder).

---

## Reference library schemas

### Pattern file (`references/patterns/<pattern>.md`)

Frontmatter fields: `id`, `name`, `native_support`, `min_agents`, `max_agents`,
`output_template`.

Sections:
- **When to use** — 2-3 lines of business-language fit criteria
- **Recommender signals** — keywords / intents used by the recommender
- **Role shape** — typical team composition (archetype count and type)
- **Coordinator prompt template** — markdown with placeholders `{{TOPIC}}`,
  `{{TEAMMATES}}`, `{{MAX_ROUNDS}}`, `{{OUTPUT_FILE}}`; includes voting protocol,
  consensus check, revised proposal format, HITL calls via `ask_operator`,
  escalation path
- **Teammate prompt template** — generic per-pattern; placeholders
  `{{ROLE_NAME}}`, `{{ROLE_DESCRIPTION}}`, `{{DOMAIN_SKILL}}`,
  `{{RELEVANT_DOCS}}`; defines response format (Vote + Reasoning + Details)
- **HITL checkpoints** — list of Telegram interaction points for this pattern
- **Output mapping** — which output-template applies and how round contents
  flow into template fields

### Role archetype file (`references/personas/<role>.md`)

Frontmatter fields: `id`, `name`, `domains`, `fits_patterns`.

Sections:
- **Role description** — 2-3 lines: who the role is and what lens it brings
- **Baseline skill (SKILL.md template)** — copied into
  `<project>/.claude/skills/<slug>/SKILL.md` during scaffold; includes
  - How the role processes an incoming topic
  - Which doc tags it typically seeks in `Docs/INDEX.md`
  - Output shape (sections, metrics, structure)
  - Reference frameworks as checklists (Porter / TAM-SAM-SOM / etc.)
- **Typical questions answered** — drives recommender matching
- **Customization slots** — prompts for scenario-specific tuning
  (target geography, industry, time horizon, primary KPIs)

### Output template (`references/output-templates/<template>.md`)

Business-English markdown with `{{TOPIC}}`, `{{DATE}}`, `{{PATTERN}}`, etc.
Shared sections across templates: Executive summary, Context, Recommendation,
Risks & mitigations, Open questions, Next steps, Deliberation trail. Pattern-
specific sections vary (e.g., Swarm uses Hypotheses tested / Evidence /
Conclusion; Adversarial uses Position A / Position B / Moderator verdict).

---

## Supported patterns (first release)

All ✅ natively supported in Claude Code Agent Teams.

| # | Pattern | Typical business use |
|---|---|---|
| 1 | Hub-and-Spoke | Multi-perspective strategic decision with consensus |
| 2 | Swarm / Parallel Investigation | Diagnosis with multiple parallel hypotheses |
| 3 | Adversarial Debate | Polarizing binary choice (build vs buy, etc.) |
| 4 | Map / Reduce | Due diligence across segments / documents / units |
| 5 | Plan / Execute / Verify | Regulated workflows with human approval gate |
| 6 | Ensemble / Voting | Independent opinion aggregation (avoids groupthink) |
| 7 | Builder / Validator | Produce an artifact + compliance/quality check |

Patterns ⚠️ (workaround) and ❌ (unsupported) are roadmap, not first release.

---

## Wizard flow (end-to-end)

Eight phases, implemented across the orchestrator and four secondary skills.

### Phase 1 — Bootstrap & context scan

- Detect whether `<project>/council/` already exists → offer resume / new
  session on same council / re-scaffold
- Index `Docs/` lightly (titles, first paragraphs) to prime the recommender
- Warn (but do not block) if `Docs/` is empty

### Phase 2 — Scenario intake

- Single open question: *"Describe the scenario your council should help with."*
- Claude produces a **reformulation for confirmation**; confirmed text becomes
  `{{TOPIC}}` downstream
- Output language: **English by default** (both wizard and deliberation)

### Phase 3 — Telegram check

- If `<project>/.mcp.json` lacks `telegram-ask` → invoke
  `council-telegram-setup` (details in the Telegram section)
- If user declines Telegram → record `hitl_mode: "inline"` in the eventual
  `council/config.md`; HITL checkpoints will render in the Claude Code chat

### Phase 4 — Pattern recommendation (hybrid)

- Ask **2-3 targeted questions** drawn from `recommender_signals` across the
  pattern files
- Return **1 recommended pattern + 1 alternative**, each with a one-line
  rationale
- Offer an escape link to the full 7-pattern catalog for users who want to
  choose directly

### Phase 5 — Agent composition (mixed archetype + custom)

- Using scenario + chosen pattern + `Docs/INDEX.md` content + each archetype's
  `fits_patterns`, Claude proposes 3-5 agents with role + focus
- User can confirm, rename, change focus, add custom roles, or remove
- Each proposed agent is either an **archetype match** (reuses baseline skill)
  or **custom** (triggers skill-creator)

### Phase 6 — Scaffold (`council-scaffold`)

For each confirmed agent:
- Archetype → copy baseline SKILL.md into `.claude/skills/<slug>/`, substitute
  customization slots with scenario values
- Custom → invoke **skill-creator** with a structured brief (role, focus,
  relevant docs, expected output), land result in `.claude/skills/<slug>/`

Then generate:
- `.claude/settings.json` (local skill auto-discovery)
- `council/config.md` (pattern, scenario, agent↔skill map, max_rounds,
  hitl_mode)
- `council/agents/coordinator.md` and `council/agents/<role>.md` per teammate
  (pattern templates with placeholders substituted)
- `Docs/INDEX.md` (2 lines + tags per file, generated from doc content)
- Add `.mcp.json` to `.gitignore` if missing
- Empty `Sessions/` directory

End with a dry-run summary: "N files created across M folders."

### Phase 7 — Launch offer

After scaffold, ask the user: *"Run the council now, or run later via
`council-launch`?"* (per D5 option C).

### Phase 8 — Resume (`council-resume`)

Future sessions in the same project offer:
- Continue an in-progress session (re-read prior rounds, resume at Round N+1)
- Start a new session on the existing council (new topic-slug)
- Re-scaffold (jump back to Phase 5)

---

## Telegram integration (`council-telegram-setup`)

### Five-step guided setup

1. **BotFather** — user creates a bot in Telegram, pastes token
2. **Token validation** — skill calls `getMe`; rejects on invalid token
3. **Discover chat_id** — user sends any message to the bot; pastes the
   `getUpdates` JSON; skill extracts `message.chat.id`
4. **Write `.mcp.json`** — registers the `telegram-ask` MCP server with
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ASK_TIMEOUT_SECONDS` (default 600)
5. **Roundtrip test** — invokes `ask_operator` with a confirmation message;
   success on any non-timeout reply

### `telegram-ask` MCP server

Exposes `ask_operator(message: string) -> string`: sends `message` to the
configured chat, blocks until a reply arrives (or timeout), returns reply text
or `TIMEOUT`. First release: embedded minimal Node script in the plugin;
npm-published companion package is a follow-up.

### HITL checkpoint types

Defined per pattern in each pattern file's "HITL checkpoints" section.

- **Type A — Round review** (hub-and-spoke, ensemble-voting): after each
  non-consensus round, coordinator posts a business-friendly summary and awaits
  `continue` / `stop` / free-text feedback / TIMEOUT (auto-continue)
- **Type B — Clarification on deadlock**: on 2+ REJECT votes, coordinator
  surfaces ambiguities and awaits clarification or `abort`
- **Type C — Plan approval** (plan-execute-verify, builder-validator):
  coordinator posts the plan/artifact and awaits `approve` / `revise: <text>` /
  `stop`

### Inline fallback

If `hitl_mode: "inline"`, checkpoints render in the Claude Code chat instead
of Telegram. Same message formats; same reply parsing. First-class option —
not a degraded mode.

### Security

- `.mcp.json` is added to `.gitignore` by the scaffold
- `council-telegram-setup` explicitly warns against sharing tokens
- `council/config.md` records `hitl_mode` and setup date — never token or
  chat_id

---

## Runtime (`council-launch`)

### Core principle

The plugin is **not** a custom runtime. `council-launch` composes a natural-
language **kickoff prompt** that Claude Code interprets as an Agent Teams
instruction. All orchestration, parallelism, messaging, and plan approval
flow through Agent Teams native mechanisms.

### Kickoff prompt structure

Auto-contained — Claude needs no memory from the wizard session:

- Topic (from Phase 2, verbatim)
- Pattern identifier + pointer to `council/agents/coordinator.md`
- Coordinator instruction: read coordinator.md, spawn the listed teammates in
  parallel, request plan approval for each, then broadcast the topic
- Teammates list: each with name + pointer to its `council/agents/<role>.md`
- HITL mode (telegram / inline)
- Output destinations (`Sessions/<slug>/round-N.md`, final output file,
  escalation file)
- Execution constraints: `max_rounds`, round-review checkpoint rule, reject
  checkpoint rule
- Embedded inline copy of the output template

### Round cycle

1. Teammates respond in standard format (Vote + Reasoning + Details)
2. Coordinator writes `Sessions/<slug>/round-N.md` (all responses + synthesis)
3. Consensus check:
   - All APPROVE → write final output from template → close session
   - 2+ REJECT → Type B checkpoint
   - Otherwise → compose revised proposal → Type A checkpoint → next round
4. At `round == max_rounds` without consensus → write `escalation.md`

### Domain skill consumption

Each teammate's system prompt instructs it to consult its domain SKILL.md at
the start of each round. Claude Code auto-discovers skills in
`.claude/skills/` — no additional wiring.

### State & resume

`Sessions/<slug>/` is the source of truth. `council-resume` handles:

1. **Completed session** (final output present) → show result, offer new
   session on same council
2. **In-progress session** (rounds written, no final output) → offer resume
   from Round N+1 (re-reads prior rounds into kickoff prompt as context) or
   discard
3. **Escalated session** (`escalation.md` present) → show escalation, offer
   new session with adjusted scenario

Each launch also writes `config-snapshot.md` — a frozen copy of
`council/config.md` — for audit and reproducibility.

### Explicit limits (documented in README)

- One council session per project at a time
- Closing Claude Code mid-session dissolves the team; use `council-resume`
- All agents share one model (Opus)
- Default max_rounds = 4; configurable up to 6 in `council/config.md`
- `Docs/` should contain fewer than ~100 files to avoid context bloat during
  the reading phase

---

## Error handling and fallbacks

| Failure mode | Handling |
|---|---|
| `Docs/` missing or empty | Warn, allow user to proceed with scenario-only |
| Telegram setup declined or failed | Fall back to `hitl_mode: "inline"` |
| Telegram `ask_operator` timeout at runtime | Auto-continue to next round; log note in `round-N.md` |
| skill-creator invocation fails | Retry with more explicit brief; on 2nd failure, fall back to copying archetype with note "manual refinement recommended" |
| Required scaffold file missing at launch | Stop with explicit error referencing the wizard |
| Session Claude Code crash mid-round | Partial round file may remain; `council-resume` detects and offers discard/resume |
| Agent Teams reports tool unavailability (`TeamCreate`) | Surface clear error: wrong Claude Code mode; suggest user enable Agent Teams |

---

## Testing strategy

- **Reference content validation**: each pattern file and archetype file is
  validated against its schema (frontmatter required fields, section headings,
  placeholder set) at plugin-build time
- **Wizard dry-run tests**: simulate each phase with canned user inputs;
  verify scaffold produces the expected file tree
- **Pattern smoke tests**: for each of the 7 patterns, run one end-to-end
  council on a minimal scenario (e.g., "should our team adopt a 4-day
  workweek?") with Docs/ containing 2-3 sample documents; verify round logs
  and final output files materialize and match template structure
- **Telegram integration test**: stub the `telegram-ask` server in dry-run
  mode (returns canned replies on a queue); verify each HITL checkpoint type
  is triggered correctly
- **Resume test**: kill a session after Round 2; verify `council-resume`
  reconstructs context and continues at Round 3

---

## Open questions for implementation

- MCP server packaging: embed as Node script in v1 vs publish npm companion —
  decide during implementation based on user-facing install simplicity
- Recommender algorithm: simple keyword match + ranking is sufficient for
  first release; revisit if confusion/mismatches emerge in usage
- Role archetype count: 10-12 is the starting target; final list may grow
  slightly based on coverage review during implementation

---

## Out of scope / roadmap

- Custom template authoring (D9 continuation)
- Patterns beyond the 7 native (M2/M3 milestones from clarifying Q9)
- Multi-language output (currently English-only)
- Persistent semantic memory across sessions
- Scheduled/unattended councils
- Cross-council shared knowledge bases

## Milestones (implementation sequencing — informal)

1. Pattern and archetype reference library (content only, no code)
2. Output templates
3. `council-telegram-setup` skill + minimal `telegram-ask` MCP script
4. `council-scaffold` skill
5. `council-wizard` skill (the orchestrator glue)
6. `council-launch` skill
7. `council-resume` skill
8. Plugin packaging (`plugin.json`, README, install docs)
9. Smoke tests across the 7 patterns

Each milestone stands alone and can be tested independently.
