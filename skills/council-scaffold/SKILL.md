---
name: council-scaffold
description: Writes council/ layout, per-agent prompts, Docs/INDEX.md, .claude settings and domain skills from archetypes or skill-creator briefs.
---

# Council — Scaffold

You generate **project-level** artifacts so **Claude Code Agent Teams** can run natively. Do **not** invent a custom runtime.

**Inputs** (from wizard or user):

- Confirmed **`{{TOPIC}}`** (scenario text, English default).
- **`pattern_id`** — one of: `hub-and-spoke`, `swarm`, `adversarial-debate`, `map-reduce`, `plan-execute-verify`, `ensemble-voting`, `builder-validator`.
- **`max_rounds`** — integer 4–6 (default **4**).
- **`hitl_mode`** — `telegram` | `inline`.
- **`output_style`** — `brief` | `standard` | `detailed` (default **`standard`**). Controls length of `round-N.md` and final output template selection.
- **Agents list**: for each agent: `slug` (dirname), `role_title`, `archetype_id` **or** `custom: true`, `focus`, `relevant_doc_tags`, optional `customization` map for archetype slots (e.g. `GEOGRAPHY`, `INDUSTRY_FOCUS`).
- **Plugin root path** where `references/` lives (read-only source).

---

## Per-agent skills (`.claude/skills/<slug>/SKILL.md`)

### Archetype path

1. Open `references/role-archetypes/<archetype_id>.md`.
2. Extract the **Baseline skill (SKILL.md template)** fenced block.
3. Replace `{{...}}` slots using scenario + `customization` map + sensible defaults.
4. Write `.claude/skills/<slug>/SKILL.md`.

### Custom path (skill-creator)

1. Build a **structured brief** for the skill-creator:

   - Role title, focus, expected output sections.
   - Tags from `Docs/INDEX.md` to prioritize.
   - Pattern constraints (vote format, isolation if ensemble, etc.).

2. Invoke skill-creator per product norms; land output at `.claude/skills/<slug>/SKILL.md`.

3. **Failure handling** (per design spec): if skill-creator fails twice, copy the **closest archetype** baseline from `references/role-archetypes/pm-facilitator.md` (or nearest fit), prepend a markdown note: *"Manual refinement recommended (skill-creator failed)."*

---

## Files to create or merge

### 1. `.claude/` directory

Create `.claude/skills/` (the parent for per-agent skill folders). **Do not** write a `settings.json` — Claude Code auto-discovers skills under `.claude/skills/` with no configuration. Only create `settings.json` if the user's Claude Code version requires it (document the specific key here when verified; do not write `{}` as a placeholder).

### 2. `council/config.md`

Front matter (YAML) + body:

```yaml
---
pattern: <pattern_id>
topic: "<verbatim topic>"
max_rounds: <n>
hitl_mode: telegram | inline
output_style: brief | standard | detailed
setup_date: <ISO date>
agents:
  - slug: <slug>
    role: <role_title>
    skill_path: .claude/skills/<slug>/SKILL.md
    archetype: <id or custom>
---
```

Body: short human-readable summary of scenario, operator instructions, output template name (from pattern), session slug convention.

**Never** store Telegram token or `chat_id` here.

### 3. `council/agents/coordinator.md`

- Load pattern’s **Coordinator prompt template** from `references/patterns/<pattern_id>.md`.
- Substitute `{{TOPIC}}`, `{{TEAMMATES}}`, `{{MAX_ROUNDS}}`, `{{OUTPUT_FILE}}` (e.g. `Sessions/<topic-slug>/decision.md` — match output template type).
- Include pointers to teammate files.

**`{{TEAMMATES}}`**: markdown list/table of each teammate with **name** and **path** `council/agents/<slug>.md`.

### 4. `council/agents/<slug>.md` (per teammate)

- Load pattern’s **Teammate prompt template** from the same pattern file.
- Substitute `{{ROLE_NAME}}`, `{{ROLE_DESCRIPTION}}`, `{{DOMAIN_SKILL}}` (path `.claude/skills/<slug>/SKILL.md`), `{{RELEVANT_DOCS}}` (tags or explicit doc names).

### 5. `Docs/INDEX.md`

If `Docs/` missing, create it. For each business document under `Docs/` (pdf not parsed inline — add stub entry; md/txt — skim title + first ~80 words):

- Two-line summary + **tags** line (comma-separated).

If no docs, write a warning header but still create INDEX with note *"No indexed documents"*.

### 6. `.gitignore` (project root)

Ensure entries include:

```
.mcp.json
```

Merge without removing unrelated ignores.

### 7. `Sessions/` directory

Create empty `Sessions/` (or add `.gitkeep` if required by tooling).

---

## Closing message

Report: **"Scaffold complete — N files created across M folders."** List top-level paths touched.

---

## Launch handoff

Tell the user they may run **`council-launch`** next (or the wizard offers it) with `Sessions/<topic-short-slug>/` as the session folder name derived from the topic (kebab-case, max ~48 chars).
