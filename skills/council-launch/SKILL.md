---
name: council-launch
description: Composes the Agent Teams kickoff prompt from council/config.md and .claude/agents/ files; defines round logging, HITL, and output paths (no custom runtime).
---

# Council — Launch (Agent Teams kickoff)

You **do not** execute a runtime. You **compose** a single, **self-contained** natural-language instruction the user pastes into **Claude Code Agent Teams** (lead session). Assume **no memory** from the wizard.

---

## Preconditions (verify)

- `council/config.md` exists.
- `.claude/agents/coordinator.md` exists.
- At least one `.claude/agents/<slug>.md` teammate file exists.
- For each agent, `.claude/skills/<slug>/SKILL.md` exists **or** coordinator text embeds skill path and tells teammates to read it.
- Pattern file exists at `references/patterns/<pattern_id>.md` (read coordinator/teammate templates if you need to echo constraints).

If any file is missing → **stop** with explicit error listing every missing path and *"Re-run council-wizard to regenerate the missing files."*

If Agent Teams tools (e.g. `TeamCreate`) are unavailable → **stop** with: *"Agent Teams is not available. Check that you are using a Claude Code plan or mode that includes Agent Teams, then try again."*

---

## Session folder

1. Derive `<topic-short-slug>` from `council/config.md` `topic` (kebab-case, alphanumeric + hyphens, max ~48 chars).

2. Target: `Sessions/<topic-short-slug>/`.

3. **Before team work starts**, write **`Sessions/<topic-short-slug>/config-snapshot.md`** — frozen copy of `council/config.md` (audit / reproducibility).

4. Resolve **final output filename** from pattern `output_template` mapping:

   - `decision` → e.g. `decision.md`
   - `findings` → `findings.md`
   - `recommendation` → `recommendation.md`
   - `analysis-report` → `analysis-report.md`
   - `plan-and-verification` → `plan-and-verification.md`
   - `draft-and-review` → `draft-and-review.md`

   Full path: `Sessions/<topic-short-slug>/<filename>`. Filename is the same regardless of `output_style` — only the **template content** switches.

5. Resolve **template file** by `output_style` from `council/config.md` (default `standard`):

   - `brief` → `references/output-templates/<output_template>-brief.md`
   - `standard` | `detailed` → `references/output-templates/<output_template>.md`

   Embed or attach the resolved template into the kickoff so the team sees the required headings and word caps.

---

## Kickoff prompt structure (must include all)

Produce a markdown block the user can copy.

1. **Topic** — verbatim from config.
2. **Pattern** — id + one sentence what it implies for orchestration.
3. **Coordinator** — instruct lead to read `.claude/agents/coordinator.md` and follow it literally.
4. **Teammates** — bullet list: display name + `.claude/agents/<slug>.md` path; say: spawn **in parallel** per pattern, **plan approval** for each teammate before substantive work (Agent Teams native).
5. **HITL mode** — inline: ask user in chat with prompt text / expected replies (`continue`, `stop`, `approve`, `revise: …`, etc.).
6. **Paths** — `Sessions/<slug>/round-N.md` for each round synthesis; final output path; `escalation.md` if max rounds without consensus.
7. **Execution constraints** — `max_rounds` from config; consensus = all APPROVE (non-abstaining) unless pattern file defines variant; **2+ REJECT** → Type B; else Type A round review; plan/artifact gates → Type C per pattern docs.
8. **Vote + Reasoning + Details** — require standard teammate response format from coordinator template.
9. **Tooling guardrail** — teammates must **not** use disallowed team tools; only lead orchestrates.
10. **Output style** — state the `output_style` from config and its implications:
    - `brief`: each teammate response ≤120 words; coordinator synthesis in `round-N.md` is a vote table + 3-5 bullets (no narrative); final output uses the `-brief.md` template verbatim with its word caps.
    - `standard`: full narrative sections per response; coordinator synthesis includes agreements/objections/revised-proposal prose; final output uses the base template.
    - `detailed`: like `standard` but encourage extended reasoning and per-section depth; same base template.

---

## Round cycle (document inside kickoff)

1. Teammates respond (parallel where applicable).
2. Coordinator writes `round-N.md` with all responses + synthesis.
3. Apply consensus / REJECT / else revised proposal + HITL.
4. At `max_rounds` without consensus → `escalation.md`.

---

## Operator message formats (HITL)

Use business-friendly summaries.

---

## Limits (echo briefly)

One council session active per project; closing Claude dissolves team — use **`council-resume`**; **Opus** for all agents; keep `Docs/` under ~100 files for practical context.
