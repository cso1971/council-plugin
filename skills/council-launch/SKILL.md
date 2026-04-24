---
name: council-launch
description: Launches the council via Agent Teams -- prepares the session folder, resolves runtime variables, and starts the team with the coordinator as lead.
---

# Council — Launch (Agent Teams)

You **launch** the council. Verify preconditions, prepare the session folder, resolve runtime variables, then start an Agent Teams session by calling `TeamCreate` with the coordinator as lead. Assume **no memory** from the wizard.

---

## Preconditions (verify)

- `council/config.md` exists.
- `.claude/agents/coordinator.md` exists.
- At least one `.claude/agents/<slug>.md` teammate file exists.
- For each agent, `.claude/skills/<slug>/SKILL.md` exists **or** coordinator text embeds skill path and tells teammates to read it.
- Pattern file exists at `references/patterns/<pattern_id>.md` (read coordinator/teammate templates if you need to echo constraints).
- If `council/config.md` has `devils_advocate: true` (or field is absent, which defaults to true): `.claude/agents/devils-advocate.md` must exist.

If any file is missing → **stop** with explicit error listing every missing path and *"Re-run council-wizard to regenerate the missing files."*

If Agent Teams tools (e.g. `TeamCreate`) are unavailable → **stop** with: *"Agent Teams is not available. Check that you are using a Claude Code plan or mode that includes Agent Teams, then try again."*

---

## Session folder

1. Derive `<topic-short-slug>` from `council/config.md` `topic` (kebab-case, alphanumeric + hyphens, max ~48 chars).

2. Target: `Sessions/<topic-short-slug>/`.

3. **Before team work starts**, write **`Sessions/<topic-short-slug>/config-snapshot.md`** — frozen copy of `council/config.md` (audit / reproducibility). This snapshot preserves the `devils_advocate` flag so `council-resume` can detect Phase 2 state.

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

   This path and template are included in the launch preamble so the coordinator knows the required headings and word caps.

---

## Resolve and Launch

1. **Read `council/config.md`** — extract `topic`, `pattern`, `max_rounds`, `output_style`, `devils_advocate` (defaults to `true` if absent), and the `agents` list.

2. **Derive `<topic-slug>`** — same kebab-case slug used for the session folder above.

3. **Read `.claude/agents/coordinator.md`** and substitute the two runtime variables:
   - `{{TOPIC}}` → verbatim topic string from config
   - `{{TOPIC_SLUG}}` → the derived slug

4. **Compose a launch preamble** to prepend to the resolved coordinator instructions:

   ```
   ## Session Context (injected at launch)
   - Session path: Sessions/<topic-slug>/
   - Output file: Sessions/<topic-slug>/<output-filename>.md
   - Output template: <resolved-template-path>
   - Output style: <brief|standard|detailed>
     - brief: teammate responses ≤120 words; round-N.md is a vote table + 3-5 bullets; final output uses the -brief.md template with its word caps.
     - standard: full narrative sections; coordinator synthesis includes agreements/objections/revised-proposal prose; final output uses the base template.
     - detailed: like standard but encourage extended reasoning; same base template.
   ```

5. **Call `TeamCreate`** with:
   - Team name: `council-<topic-slug>`
   - Lead agent instructions: launch preamble + resolved coordinator instructions (from steps 3–4)

6. **Done.** The coordinator is now the lead agent and will proceed from Step 1 (spawn teammates) as described in `.claude/agents/coordinator.md`.

---

## HITL

All HITL checkpoints are inline — the coordinator asks the operator directly in the active session. No additional setup required.

---

## Limits (echo briefly)

One council session active per project; closing Claude dissolves team — use **`council-resume`**; **Opus** for all agents; keep `Docs/` under ~100 files for practical context.
