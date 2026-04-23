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
   - **Completed** — final output file exists (`decision.md`, `findings.md`, `recommendation.md`, `analysis-report.md`, `plan-and-verification.md`, or `draft-and-review.md` — whichever matches `config-snapshot.md` / council pattern).
   - **In-progress** — `round-*.md` exists, no final output.
   - **Escalated** — `escalation.md` exists.

3. If `round-*.md` partial / corrupted (mid-write) → flag **partial round**; offer **discard last partial** or **manual fix** before resume.

---

## Branch A — Completed session

- Show short summary from final output (Executive summary section if present).
- Offer: **new session** on same council (new slug from new topic) → user should run **`council-launch`** after updating topic in `council/config.md` **or** re-run **`council-wizard`** from Phase 1 for a fresh topic.

---

## Branch B — In-progress session

1. Find highest `round-N.md` **N**.

2. Offer:
   - **Resume at Round N+1** — compose a **compact context packet** for Agent Teams: topic from `config-snapshot.md`, pattern id, embedded excerpts from `round-1..N.md` (or instruct lead to read those files), explicit *"Continue deliberation; do not restart from Round 1."*
   - **Discard session** — archive folder optional (user consent); do not delete without confirmation.

3. Remind: **no native teammate resume** — file-based context only.

---

## Branch C — Escalated session

- Surface `escalation.md` summary to user.
- Offer: new session with **adjusted scenario** (re-run **`council-wizard`** from Phase 2) or different pattern (from Phase 2); the wizard's Phase 5 regenerates all artifacts.

---

## Safety

Never print secrets from configuration files. Inline HITL is the standard interaction mode for resumed sessions.
