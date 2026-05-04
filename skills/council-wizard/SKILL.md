---
name: council-wizard
description: 5-phase council wizard -- scenario intake, pattern selection, agent composition, HITL confirmation, generate and launch.
---

# Council — Wizard

You run the **end-to-end council setup** for any user (business or technical). Default language: **English**. Work **inside the user's project folder**. Optimised for Cowork; CLI is also supported.

Phases are **mandatory sequential steps**. Every invocation must go through all 5 phases in order. Phases may be concise when the user's intent is clear, but each must be a distinct interaction step — none may be skipped.

**Reference library** (read-only, from this plugin):

- Patterns: `references/patterns/*.md` (7 patterns — frontmatter: `id`, `default_protocol`, `output_template`, `min_agents`, `max_agents`)
- Personas: `references/personas/*.md` (19 library personas + `_custom-template.md`)
- Protocols: `references/protocols/*.md` (3 protocols + `_custom-template.md`)
- Output templates: `references/output-templates/*.md` (12 files — 6 types × brief/standard)
- Generation templates: `references/templates/coordinator.md.tmpl`, `references/templates/teammate.md.tmpl`, `references/templates/domain-context.md.tmpl`
- Devil's Advocate review template: `references/templates/devils-advocate-review.md`
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

---

## Phase 4 — HITL Confirmation

Inline HITL is the **only** interaction mode. No configuration is needed.

Confirm to the user that:
- Coordinator checkpoint questions will appear **inline** in the chat session during the council run.
- **Plan Approval** (native Agent Teams feature) is always available for teammate actions.

### Devil's Advocate review (Phase 2)

The **Devil's Advocate review** is enabled by default for all councils. After the council reaches its conclusion, a dedicated Devil's Advocate agent challenges the output for contradictions, errors, vague language, unstated assumptions, and unspecified elements. The coordinator then consolidates the challenges into the final output.

- This phase is **fixed and non-customizable**: the user cannot change the Devil's Advocate persona, add reviewers, or modify the review protocol.
- The user **may opt out**: ask *"Skip the Devil's Advocate review? (not recommended)"* and record their answer.
- Default if the user does not answer: **enabled**.

Set `devils_advocate: true` (default) or `devils_advocate: false` (opt-out) for use in Phase 5.

---

## Phase 5 — Generate and Launch Offer

Generate all artifacts in order. Agent files go to **`.claude/agents/`**.

### 1. `council/config.md`

YAML frontmatter + human-readable body:

```yaml
---
pattern: <pattern_id>
protocol: <protocol_id>
topic: "<verbatim topic>"
max_rounds: <n>
output_style: brief | standard | detailed
devils_advocate: true | false
setup_date: <ISO date>
agents:
  - slug: <slug>
    role: <role_title>
    skill_path: .claude/skills/council-<slug>/SKILL.md
    archetype: <id or custom>
---
```

`devils_advocate` defaults to `true`. Set to `false` only if the user explicitly opted out in Phase 4.

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
| `{{ROUND_ARTIFACT_FORMATS}}` | Round synthesis template from protocol file — content between `<!-- ROUND_ARTIFACT_FORMATS_START -->` and `<!-- ROUND_ARTIFACT_FORMATS_END -->` markers in the `## Output Formats` section |
| `{{OUTPUT_FORMATS}}` | Final output templates from protocol file — content between `<!-- FINAL_OUTPUT_FORMATS_START -->` and `<!-- FINAL_OUTPUT_FORMATS_END -->` markers in the `## Output Formats` section |
| `{{BEHAVIORAL_RULES}}` | From chosen protocol file |
| `{{CONTEXT_REFERENCES}}` | Generated list of skill references per persona |
| `{{DEVILS_ADVOCATE_PHASE}}` | If `devils_advocate: true`: full contents of `references/templates/devils-advocate-review.md`. If `devils_advocate: false`: empty string (omit the section entirely). |

Leave `{{TOPIC}}` and `{{TOPIC_SLUG}}` as **runtime literals** (filled at launch).

### 4. `.claude/agents/devils-advocate.md` (conditional)

If `devils_advocate: true` in config: assemble from `references/templates/teammate.md.tmpl` using the three-layer composition model with `references/personas/devils-advocate.md` as the persona layer.

- **Protocol layer**: same protocol as the rest of the council.
- **Persona layer**: from `references/personas/devils-advocate.md` (fixed, non-customizable).
- **Domain layer**: only the `overview` section from `council/domain-context.md` (per the persona's `domain-context-sections` frontmatter).

Do **not** include the Devil's Advocate in `{{TEAMMATES_TABLE}}`. It is not a Phase 1 participant — the coordinator spawns it only during Step 4 (post-deliberation review).

If `devils_advocate: false`: skip this step entirely. Do not generate the file.

### 5. `.claude/agents/<slug>.md` per teammate

Assemble from `references/templates/teammate.md.tmpl`. Three-layer composition:

**Protocol layer** (from `references/protocols/<protocol-id>.md`):
- `{{VOTE_OPTIONS}}`, `{{RESPONSE_FORMAT_EXAMPLE}}`, `{{CONSOLE_REPORTING}}`

**Persona layer** (from `references/personas/<archetype-id>.md`):
- `{{ROLE_NAME}}`, `{{ROLE_DESCRIPTION_SHORT}}`, `{{IDENTITY_BLOCK}}`, `{{COMPETENCIES}}`, `{{BEHAVIOR_RULES}}`, `{{CARE_ABOUT}}`, `{{DEFER_TO}}`, `{{VOTE_GUIDELINES_TABLE}}`, `{{QUALITY_CHECKLIST}}`

**Domain layer**:
- `{{DOMAIN_SKILL_REF}}` — **mandatory** reference to `.claude/skills/council-<slug>/SKILL.md`. This is always populated; the skill file is generated in step 8 below.

### 6. `Docs/INDEX.md`

If `Docs/` has content and INDEX was not already created in Phase 1. For each document: two-line summary + tags. If no docs, write a warning header with *"No indexed documents"*.

### 7. `Sessions/` directory

Create empty (or add `.gitkeep`).

### 8. `.claude/skills/council-<slug>/SKILL.md` per agent (mandatory)

Every agent **must** have a corresponding SKILL.md generated. The domain knowledge for each agent lives exclusively in its SKILL, not in the agent file.

Build a **structured brief** for each agent: role title, focus areas, relevant `council/domain-context.md` sections (filtered by this persona's `domain-context-sections` frontmatter), doc tags from `Docs/INDEX.md`, pattern constraints (vote format, output expectations).

**Primary path (skill-creator available)**: invoke skill-creator with the structured brief. Land output at `.claude/skills/council-<slug>/SKILL.md`.

**Failure handling**: if skill-creator fails → retry once with a more explicit brief. On second failure → fall back to simple skill creation (see below).

**Fallback path (skill-creator not available or failed twice)**: inform the user explicitly:

> *"The skill-creator plugin is not available (or failed). Skills will be created from archetype templates."*

Then:
- **Library persona**: open `references/personas/<archetype-id>.md`, extract the "Baseline skill (SKILL.md template)" fenced block, substitute `{{...}}` slots using scenario + customisation map + sensible defaults.
- **Custom agent (no archetype baseline)**: write a minimal SKILL.md directly using the structured brief as the skill body.

Land the result at `.claude/skills/council-<slug>/SKILL.md`. In all cases, the skill file **must** be created — the path differs, the outcome is the same.

---

### Closing

Report: **"Council scaffolded — N files created across M folders."** List all generated file paths.

**Launch offer**: *"Run the council now, or run later via council-launch?"*

- **Now** → hand off to `council-launch` with `Sessions/<topic-short-slug>/` (kebab-case, max ~48 chars).
- **Later** → remind the user to invoke `council-launch`. Point to `council-resume` for returning to in-progress or completed sessions.

---

## Error handling

| Situation | Behaviour |
|---|---|
| `Docs/` missing or empty | Warn; allow proceed with scenario-only context |
| skill-creator fails | Retry with explicit brief; on second failure fall back to archetype template or minimal SKILL.md. Inform user. |
| skill-creator not available | Inform user explicitly: *"skill-creator plugin not available — using archetype templates."* Proceed with simple skill creation. |
| Agent Teams unavailable (`TeamCreate` not available) | Inform user; coordinator falls back to subagent mode using the `Agent` tool. Deliberation proceeds identically. |
| Required scaffold file missing at launch | Stop with an explicit error and reference the wizard |

---

## Constraints reminder

One **team** per session, **no nested teams**, **Opus model** for Agent Teams, state in **files** under `Sessions/`. Do not promise cross-session semantic memory. Use relative paths in all generated artifacts.
