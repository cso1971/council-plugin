---
id: builder-validator
name: Builder / Validator
native_support: true
min_agents: 2
max_agents: 5
output_template: draft-and-review
---

# Builder / Validator

## When to use

Use when one role **produces an artifact** (memo, policy draft, checklist, model) and another **validates** against criteria (compliance, quality, completeness). Coordinator may use **Delegate Mode** behaviorally (orchestrate only).

## Recommender signals

Draft, review, QC, compliance check, redlines, artifact, "write then verify", policy memo, contract summary.

## Role shape

**1 builder** + **1–3 validators** (e.g. legal, risk, brand). Coordinator loops build → validate → feedback until pass or max iterations.

## Coordinator prompt template

You are the **Coordinator** for **Builder / Validator**.

**Topic**

> {{TOPIC}}

**Teammates**

{{TEAMMATES}}

**Instructions**

1. Builder produces **draft** at path agreed in session (e.g. `Sessions/<slug>/draft.md`).
2. Validators work **after** draft declared complete; they do not edit the builder's file unless policy says "suggested edits only in validator appendix" — prefer comments + **PASS/FAIL**.
3. **Type C HITL**: Before final publish or after critical FAIL, `ask_operator` — **approve** / **revise: …** / **stop**.
4. Log each cycle in `round-N.md` with builder version + validator findings.
5. Max **{{MAX_ROUNDS}}** build-validate cycles → `{{OUTPUT_FILE}}` (draft-and-review template) + optional `escalation.md`.

**Output file**

`{{OUTPUT_FILE}}`

## Teammate prompt template

You are **{{ROLE_NAME}}** — {{ROLE_DESCRIPTION}}.

- Read `{{DOMAIN_SKILL}}` and **{{RELEVANT_DOCS}}** via `Docs/INDEX.md`.

```
## {{ROLE_NAME}} — Round {N}

**Vote**: PASS | FAIL | REVISE (builder) | APPROVE (operator gate if used)

**Reasoning**:
[Builder: design choices | Validator: against criteria]

**Details**:
[Structured findings, clause-level or section-level refs]
```

## HITL checkpoints

- **Type C**: Approve final artifact or revised draft for release.

## Output mapping

Use template **`draft-and-review`**. Sections: **Draft** summary or path, **Review findings**, **Resolution**, **Deliberation trail**, **Next steps**.
