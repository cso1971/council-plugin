---
name: council-wizard
description: 5-phase council wizard -- scenario intake, pattern selection, agent composition, HITL confirmation, generate and launch.
---

# Council — Wizard

You run the **end-to-end council setup** for any user (business or technical). Default language: **English**. Work **inside the user's project folder**. Optimised for Cowork; CLI is also supported.

Phases are **logical steps, not mandatory sequential gates**. When the user's intent is clear, collapse Phases 1–3 into a single response and jump to Phase 4.

**Reference library** (read-only, from this plugin):

- Patterns: `references/patterns/*.md` (7 patterns — frontmatter: `id`, `default_protocol`, `output_template`, `min_agents`, `max_agents`)
- Personas: `references/personas/*.md` (18 library personas + `_custom-template.md`)
- Protocols: `references/protocols/*.md` (3 protocols + `_custom-template.md`)
- Output templates: `references/output-templates/*.md` (12 files — 6 types × brief/standard)
- Generation templates: `references/templates/coordinator.md.tmpl`, `references/templates/teammate.md.tmpl`, `references/templates/domain-context.md.tmpl`
- Recommender: `references/recommender/questions.md`

---

## Phase 1 — Scenario Intake and Context Discovery

1. **Existing council check**: if `council/config.md` exists → offer:
   - **Resume** (delegate to `council-resume`),
   - **New session** on same council,
   - **Re-scaffold** (jump to Phase 5 after confirming pattern/agents may change).

2. Ask one open question: *"What do you want a council to help you with?"*

3. Produce a **tight reformulation** for confirmation. On confirm → freeze **`{{TOPIC}}`** (verbatim confirmed text used in all downstream templates).

4. **Context discovery** (automatic, based on scenario domain):
   - If `Docs/` is present and has content → scan and index business documents → produce `Docs/INDEX.md` (for each file: two-line summary + tags). If `Docs/` is empty or missing → **warn**, do not block.
   - If in a codebase → scan project structure (`README.md`, `CLAUDE.md`, key source files) for tech context.
   - If neither → ask the user to describe their project or domain.

5. Generate **`council/domain-context.md`** using `references/templates/domain-context.md.tmpl` as the structural schema. Fill only the labeled sections relevant to the scenario's domain (business sections, tech sections, or both). Each persona's `domain-context-sections` frontmatter field declares which sections it will need later.

---

## Phase 2 — Pattern and Protocol Selection

1. Read `references/recommender/questions.md`. Ask **2–3 targeted questions** max (Q1 and Q2 required; Q3 conditional per recommender logic).

2. Rank patterns using **Recommender signals** in each `references/patterns/<id>.md`.

3. Present:
   - **Primary pattern** + one-line rationale,
   - **Alternative pattern** + one-line rationale.
   - Full catalog: `references/patterns/` (7 patterns).

4. Allow the user to **override** and pick any of the seven directly.

5. **Protocol**: defaults from the chosen pattern's `default_protocol` frontmatter field. Read protocol details from `references/protocols/<protocol-id>.md`. User can override.

6. **Configure**:
   - `max_rounds` — default from protocol (typically 4); user may set 4–6.
   - `output_style` — `brief` / `standard` (default) / `detailed`.
     - `brief`: tight, scannable (~150–200 words, bulleted, top-3 risks/steps). Uses `<template>-brief.md`.
     - `standard`: full narrative sections. Uses `<template>.md`.
     - `detailed`: like standard but with extended reasoning (no separate template; modelled via prompt hints).

---

## Phase 3 — Agent Composition

1. Using `{{TOPIC}}`, chosen pattern, `council/domain-context.md`, and the full persona library (read each persona's `fits_patterns` and `category` frontmatter) → propose **3–5 agents** (role title + focus + library persona ID or `custom` + reasoning).

2. User may confirm, rename, change focus, add or remove roles.

3. **Reuse check**: scan `.claude/agents/` for existing agent files from prior councils. If found, offer to reuse with optional modifications.

4. **Domain-specific skills**: for each agent backed by a library persona, check whether that persona file contains a "Baseline skill (SKILL.md template)" fenced block. If it does, ask the user whether this agent needs a domain-specific skill generated. Only ask if relevant.

---

## Phase 4 — HITL Confirmation

Inline HITL is the **only** interaction mode. No configuration is needed.

Confirm to the user that:
- Coordinator checkpoint questions will appear **inline** in the chat session during the council run.
- **Plan Approval** (native Agent Teams feature) is always available for teammate actions.

---

## Phase 5 — Generate and Launch Offer

Generate all artifacts in order. Agent files go to **`.claude/agents/`** — not `council/agents/`.

### 1. `council/config.md`

YAML frontmatter + human-readable body:

```yaml
---
pattern: <pattern_id>
protocol: <protocol_id>
topic: "<verbatim topic>"
max_rounds: <n>
output_style: brief | standard | detailed
setup_date: <ISO date>
agents:
  - slug: <slug>
    role: <role_title>
    skill_path: .claude/skills/council-<slug>/SKILL.md
    archetype: <id or custom>
---
```

Body: short human-readable summary of the scenario, output template name (from pattern's `output_template` frontmatter), session slug convention (kebab-case, max ~48 chars).

### 2. `council/domain-context.md`

If not already generated in Phase 1, generate now using `references/templates/domain-context.md.tmpl`. Fill labeled sections from the scenario context.

### 3. `.claude/agents/coordinator.md`

Assemble from `references/templates/coordinator.md.tmpl`. Substitute generation-time variables:

| Variable | Source |
|---|---|
| `{{TEAMMATES_TABLE}}` | Markdown table: name + path `.claude/agents/<slug>.md` per teammate |
| `{{MAX_ROUNDS}}` | From config |
| `{{VOTE_OPTIONS}}` | From chosen protocol file |
| `{{CONSENSUS_RULE}}` | From chosen protocol file |
| `{{REJECTION_RULE}}` | From chosen protocol file |
| `{{OUTPUT_FORMATS}}` | Round/decision/rejection/escalation templates from protocol file |
| `{{BEHAVIORAL_RULES}}` | From chosen protocol file |
| `{{CONTEXT_REFERENCES}}` | Generated list of skill references per persona |

Leave `{{TOPIC}}` and `{{TOPIC_SLUG}}` as **runtime literals** (filled at launch).

### 4. `.claude/agents/<slug>.md` per teammate

Assemble from `references/templates/teammate.md.tmpl`. Three-layer composition:

**Protocol layer** (from `references/protocols/<protocol-id>.md`):
- `{{VOTE_OPTIONS}}`, `{{RESPONSE_FORMAT_EXAMPLE}}`, `{{CONSOLE_REPORTING}}`

**Persona layer** (from `references/personas/<archetype-id>.md`):
- `{{ROLE_NAME}}`, `{{ROLE_DESCRIPTION_SHORT}}`, `{{IDENTITY_BLOCK}}`, `{{COMPETENCIES}}`, `{{BEHAVIOR_RULES}}`, `{{CARE_ABOUT}}`, `{{DEFER_TO}}`, `{{VOTE_GUIDELINES_TABLE}}`, `{{QUALITY_CHECKLIST}}`

**Domain layer** (from `council/domain-context.md`, filtered by persona's `domain-context-sections` frontmatter):
- `{{DOMAIN_SKILL_REF}}` — path to domain skill if one is generated; otherwise omit.
- `{{DOMAIN_CONTEXT_BLOCK}}` — assembled from only the sections this persona declared it needs.

### 5. `Docs/INDEX.md`

If `Docs/` has content and INDEX was not already created in Phase 1. For each document: two-line summary + tags. If no docs, write a warning header with *"No indexed documents"*.

### 6. `Sessions/` directory

Create empty (or add `.gitkeep`).

### 7. Optional: `.claude/skills/council-<slug>/SKILL.md` per agent with a domain skill

**Archetype path**: open `references/personas/<archetype-id>.md`, extract the "Baseline skill (SKILL.md template)" fenced block, substitute `{{...}}` slots using scenario + customisation map + sensible defaults.

**Custom path (skill-creator)**: build a structured brief (role title, focus, expected output sections, doc tags from INDEX, pattern constraints such as vote format). Invoke skill-creator; land output at `.claude/skills/council-<slug>/SKILL.md`.

**Failure handling**: if skill-creator fails → retry with a more explicit brief. On second failure → copy the closest archetype baseline from `references/personas/`, prepend: *"Manual refinement recommended (skill-creator failed)."*

---

### Closing

Report: **"Council scaffolded — N files created across M folders."** List all generated file paths.

**Launch offer**: *"Run the council now, or run later via council-launch?"*

- **Now** → hand off to `council-launch` with `Sessions/<topic-short-slug>/` (kebab-case, max ~48 chars).
- **Later** → remind the user to invoke `council-launch`. Point to `council-resume` for returning to in-progress or completed sessions.

---

## Collapsed flow

For a clear request such as *"Make me a council to analyse this public tender so I can write a proposal"*, collapse Phases 1–3 into a single response:

> I'll set up a **builder-validator** council for your tender analysis. The pattern fits because you need an artifact (proposal draft) validated for compliance.
>
> **Proposed team (4 agents):**
>
> | Agent | Focus | Source |
> |-------|-------|--------|
> | Legal Advisor | Contract terms, regulatory compliance | Library |
> | Financial Controller | Cost structure, pricing, margin analysis | Library |
> | Market Analyst | Competitive positioning, market context | Library |
> | Compliance Officer | Tender requirements checklist, formal compliance | Library |
>
> **Pattern**: builder-validator · **Protocol**: deliberative-voting (default) · **HITL**: inline
>
> Want me to adjust the team, or should I generate the council?

One confirmation → jump to Phase 5.

---

## Error handling

| Situation | Behaviour |
|---|---|
| `Docs/` missing or empty | Warn; allow proceed with scenario-only context |
| Skill-creator fails | Retry with explicit brief; on second failure copy nearest archetype with "Manual refinement recommended" note |
| Agent Teams unavailable (`TeamCreate` errors) | Clear error: wrong Claude Code mode or plan; suggest the user enable Agent Teams |
| Required scaffold file missing at launch | Stop with an explicit error and reference the wizard |

---

## Constraints reminder

One **team** per session, **no nested teams**, **Opus model** for Agent Teams, state in **files** under `Sessions/`. Do not promise cross-session semantic memory. Use relative paths in all generated artifacts.
