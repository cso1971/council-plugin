---
name: council-resume
description: Re-opens prior council sessions from Sessions/ — completed, in-progress (resume round), or escalated — and rebuilds kickoff context.
---

# Council — Resume

Operate on **`Sessions/<slug>/`** as source of truth. Read **`council/config.md`** for council-wide settings.

---

## Discovery

1. List `Sessions/*/` directories.

2. For each slug, detect state:
   - **Completed** — final output file exists AND either `config-snapshot.md` has `devils_advocate: false` OR `devils-advocate-review.md` exists in the session folder.
   - **Phase 2 pending** — final output file exists AND `config-snapshot.md` has `devils_advocate: true` (or field absent) AND no `devils-advocate-review.md` exists. Phase 1 is done; the Devil's Advocate review has not run yet.
   - **In-progress** — `round-*.md` exists, no final output.
   - **Escalated** — `escalation.md` exists.

   Final output files: `decision.md`, `findings.md`, `recommendation.md`, `analysis-report.md`, `plan-and-verification.md`, `draft-and-review.md` — whichever matches `config-snapshot.md` / council pattern.

3. If `round-*.md` partial / corrupted (mid-write) → flag **partial round**; offer **discard last partial** or **manual fix** before resume.

---

## Branch A — Completed session

- Determine the final output file: if `<output-basename>-after-devils-review.md` exists in the session folder, that is the final version; otherwise the Phase 1 output is final.
- Show short summary from the final output file (Executive summary section if present).
- If `devils-advocate-review.md` exists: briefly surface how many challenges were raised and how many were accepted (from the Summary section of the audit file).
- Offer: **new session** on same council (new slug from new topic) → user should run **`council-launch`** after updating topic in `council/config.md` **or** re-run **`council-wizard`** from Phase 1 for a fresh topic.

---

## Branch D — Phase 2 pending

Phase 1 deliberation is complete. The Devil's Advocate review has not run yet.

1. Show the Executive summary from the Phase 1 output file.
2. Explain: *"The Devil's Advocate review is pending. A dedicated reviewer will challenge the Phase 1 output. A new file will be created for the reviewed version — the original is never overwritten."*
3. Offer:
   - **Resume the Devil's Advocate review** — you will become exclusively the Coordinator (same identity transition as `council-launch`): read `.claude/agents/coordinator.md`, substitute `{{TOPIC}}` and `{{TOPIC_SLUG}}` from `config-snapshot.md`, prepend a resume preamble (session path, Phase 1 output filename, post-DA output filename convention, "proceed from Step 4 — skip Steps 1–3"), then **discard all prior context and operate exclusively as the coordinator** starting from Step 4. Call `TeamCreate` to create `council-<topic-slug>` and add the Devil's Advocate as the sole teammate.
   - **Skip the review** — mark as complete as-is; append *"Devil's Advocate review: skipped by operator."* to the Phase 1 output's Deliberation trail.

---

## Branch B — In-progress session

1. Find highest `round-N.md` **N**.

2. Offer:
   - **Resume at Round N+1** — you will become exclusively the Coordinator (same identity transition as `council-launch`): read `.claude/agents/coordinator.md`, substitute `{{TOPIC}}` and `{{TOPIC_SLUG}}` from `config-snapshot.md`, prepend a resume preamble (session path, output filename, round history: read `round-1.md` … `round-N.md` and individual `round-N-<role-slug>.md` files for full context, "continue from Round N+1 — do not restart"), then **discard all prior context and operate exclusively as the coordinator**. Call `TeamCreate` to create `council-<topic-slug>` and spawn teammates.
   - **Discard session** — archive folder optional (user consent); do not delete without confirmation.

3. Remind: **no native teammate resume** — file-based context only.

---

## Branch C — Escalated session

- Surface `escalation.md` summary to user.
- Offer: new session with **adjusted scenario** (re-run **`council-wizard`** from Phase 2) or different pattern (from Phase 2); the wizard's Phase 5 regenerates all artifacts.

---

## Runtime detection

Before performing any identity transition (Branches B or D), check whether `TeamCreate` is available:

- **Agent Teams available**: proceed as documented — call `TeamCreate` to create the council team and spawn teammates.
- **Agent Teams not available**: inform the user:

  > "Agent Teams is not available in this session. Resuming in subagent fallback mode — teammates will be spawned as individual subagents."

  Then proceed with the identity transition using the `Agent` tool to spawn each teammate (same as in `council-launch` fallback mode). All session files and HITL checkpoints work identically.

---

## Safety

Never print secrets from configuration files. Inline HITL is the standard interaction mode for resumed sessions.
