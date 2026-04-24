<!-- Reference template: devils-advocate-review.md
     This file contains the Step 4 coordinator instructions for the Devil's Advocate review phase.
     The wizard reads this file and substitutes its content for {{DEVILS_ADVOCATE_PHASE}} in coordinator.md.tmpl
     when devils_advocate: true in council/config.md.
     When devils_advocate: false, {{DEVILS_ADVOCATE_PHASE}} is replaced with an empty string.
-->

## Step 4 — Devil's Advocate Review

Phase 1 deliberation is complete. Before finalising, run the Devil's Advocate review.

---

### 4.1 — HITL Checkpoint: proceed or skip

Ask the operator inline:

> **Devil's Advocate review**: a dedicated reviewer will challenge the Phase 1 output for contradictions, errors, vague language, unstated assumptions, and unspecified elements. Proceed? Reply **yes** to run the review or **skip** to finalise as-is.

- If the operator replies **skip**: finalise the Phase 1 output file as written. Append a one-line note to the Deliberation trail: *"Devil's Advocate review: skipped by operator."* Stop here — do not proceed to 4.2.
- If the operator replies **yes** (or any affirmative): proceed to 4.2.

---

### 4.2 — Spawn the Devil's Advocate

Spawn one additional teammate from `.claude/agents/devils-advocate.md`. Use its file content as the teammate's system instructions. Request **plan approval** before the teammate acts.

The Devil's Advocate does not receive the original topic broadcast. It receives only what you send it in 4.3.

---

### 4.3 — Feed the Phase 1 output

Send the Devil's Advocate the following:

1. The **original topic**: `{{TOPIC}}`
2. The **complete contents** of the Phase 1 output file (`Sessions/{{TOPIC_SLUG}}/<output-filename>.md`)

Instruct it to review the output and respond with a structured challenge list following its persona guidelines.

---

### 4.4 — Collect the challenge

Wait for the Devil's Advocate's response. It will produce either:

- **OBJECT** + a numbered challenge list (category, quoted passage, explanation per issue)
- **APPROVE** + a brief confirmation that no substantive issues were found

If **APPROVE**: proceed to 4.5 (no amendments needed). If **OBJECT**: proceed to 4.5 with the challenge list.

---

### 4.5 — Consolidate: address each challenge

For every issue in the challenge list, decide:

- **Accept**: the issue is valid and material — amend the relevant section of the Phase 1 output
- **Partially accept**: the issue is partially valid — make a targeted clarification
- **Dismiss**: the issue is not applicable or is editorial only — record the reason

Rewrite the output file (`Sessions/{{TOPIC_SLUG}}/<output-filename>.md`) incorporating all accepted and partially accepted amendments. This overwrites the Phase 1 draft with the consolidated, final version.

---

### 4.6 — Write the audit artifact

Write `Sessions/{{TOPIC_SLUG}}/devils-advocate-review.md` with the following structure:

```
# Devil's Advocate Review — {{TOPIC}}

**Phase 1 output reviewed**: <output filename>
**Verdict**: OBJECT (N issues found) | APPROVE (no substantive issues)

## Challenges

### Challenge N: <brief title>
**Category**: contradiction | assumption | vagueness | error | unspecified-element | completeness-gap
**Reference**: <quoted passage or section name>
**Issue**: <explanation>
**Resolution**: accepted | partially-accepted | dismissed
**Resolution detail**: <how the coordinator addressed this, or why dismissed>

[repeat for each challenge]

## Summary
**Challenges raised**: N  
**Accepted**: N  
**Partially accepted**: N  
**Dismissed**: N  
```

If the Devil's Advocate voted APPROVE, write a brief confirmation audit artifact with zero challenges.

---

### 4.7 — Update the Deliberation trail

Append a **Devil's Advocate Review** subsection to the `## Deliberation trail` section of the final output file:

```
### Devil's Advocate Review
Verdict: OBJECT (N issues) | APPROVE  
Challenges accepted: N | Partially accepted: N | Dismissed: N  
Audit: Sessions/{{TOPIC_SLUG}}/devils-advocate-review.md
```

The output file is now finalised.
