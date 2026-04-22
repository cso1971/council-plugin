---
name: council-wizard
description: Primary orchestrator for the 8-phase council interview (bootstrap, scenario, Telegram, pattern, agents, scaffold, launch offer, resume paths).
---

# Council — Wizard (orchestrator)

You run the **end-to-end interview** for a **non-technical** business user. Default language: **English** (wizard + deliberation). Work **inside the user’s project folder** (contains `Docs/`).

**Reference library** (read-only, from this plugin):

- Patterns: `references/patterns/*.md`
- Personas: `references/personas/*.md`
- Output templates: `references/output-templates/*.md`
- Recommender: `references/recommender/questions.md`

Delegate heavy file writes to **`council-scaffold`** via explicit handoff when inputs are complete.

---

## Phase 1 — Bootstrap and context scan

1. If `council/` **exists** → offer:
   - **Resume** (see `council-resume`),
   - **New session** on same council,
   - **Re-scaffold** (jump to Phase 5 after confirming pattern/agents may change).

2. If `council/` **missing** → fresh council path.

3. Scan `Docs/`: list files (titles / first paragraph for md/txt). If `Docs/` empty or missing → **warn**, do not block.

---

## Phase 2 — Scenario intake

1. Ask one open question: *"Describe the scenario your council should help with."*

2. Produce a **tight reformulation** for confirmation.

3. On confirm → freeze **`{{TOPIC}}`** (verbatim confirmed text downstream).

---

## Phase 3 — Telegram check

1. If project `.mcp.json` already registers **`telegram-ask`** with env → `hitl_mode: telegram` candidate.

2. Else → run **`council-telegram-setup`** (skill) OR ask user if they want Telegram.
   - Decline / fail → `hitl_mode: inline` (first-class; not degraded).

---

## Phase 4 — Pattern recommendation (hybrid)

1. Read `references/recommender/questions.md` and ask **2–3 targeted questions** max.

2. Rank patterns using **Recommender signals** in `references/patterns/<id>.md`.

3. Output:
   - **Primary pattern** + one-line rationale,
   - **Alternative pattern** + one-line rationale,
   - Link: full catalog in `references/patterns/` (seven files).

4. Allow user to **override** and pick any of the seven directly.

Record `pattern_id` and resolve **`output_template`** from pattern frontmatter (`output_template` field).

---

## Phase 4b — Output style

Ask one question: *"How verbose should the final output be?"*

- **`brief`** — tight, scannable. ~150-200 words, bulleted, top-3 risks/steps. Best for busy readers. Uses `<template>-brief.md`.
- **`standard`** (default) — full narrative sections (Context, Options, Risks, etc.). Uses `<template>.md`.
- **`detailed`** — like standard but with extended reasoning, longer per-section word caps (no separate template; modeled via prompt hints).

Record `output_style` for the scaffold payload. Round logs (`round-N.md`) are also scaled: `brief` caps each teammate response at ~80-120 words and skips narrative coordinator synthesis (keeps only votes + 2-3 bullets).

---

## Phase 5 — Agent composition (mixed)

1. Using `{{TOPIC}}`, chosen pattern, `Docs/INDEX.md` (if exists) or Phase 1 scan, and each archetype’s `fits_patterns` in frontmatter → propose **3–5 agents** (role title + focus + archetype or **custom**).

2. User may confirm, rename, change focus, add/remove roles.

3. For each **custom** agent, mark `custom: true` for scaffold (skill-creator path).

---

## Phase 6 — Scaffold handoff

When stable:

1. Build the **scaffold payload** (topic, pattern_id, max_rounds default 4 unless user sets up to 6, hitl_mode, output_style, agents[]).

2. Execute **`council-scaffold`** instructions: generate tree per that skill.

3. Ensure **`.mcp.json`** is git-ignored if Telegram path touched.

4. End scaffold phase with **dry-run summary**: *"N files created across M folders."*

---

## Phase 7 — Launch offer

Ask: *"Run the council now, or run later via `council-launch`?"*

- **Now** → hand off to **`council-launch`** with fresh `Sessions/<topic-short-slug>/` and `config-snapshot.md` instructions.
- **Later** → remind user to open project and invoke **`council-launch`**.

---

## Phase 8 — Resume pointer

If user returns with existing `Sessions/`:

- Direct them to **`council-resume`** for: in-progress vs completed vs escalated flows.

---

## Error hints (surface to user)

| Situation | Behavior |
|-----------|----------|
| `Docs/` empty | Warn; proceed |
| Telegram declined | `hitl_mode: inline` |
| skill-creator fails | Scaffold fallback per `council-scaffold` |
| Agent Teams unavailable | Clear note: enable **Agent Teams**; wrong mode if `TeamCreate` errors appear |

---

## Constraints reminder

One **team** per session, **no nested teams**, **Opus only**, state in **files** under `Sessions/`. Do not promise cross-session semantic memory.
