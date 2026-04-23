---
id: ensemble-voting
name: Ensemble / Voting
native_support: true
min_agents: 3
max_agents: 7
output_template: decision
default_protocol: deliberative-voting
---

# Ensemble / Voting

## When to use

Use when you want **independent opinions first**, then aggregation — to reduce **groupthink**. Each voter forms their view **before** seeing others' votes (isolation protocol via coordinator instructions and file discipline).

## Recommender signals

Independent scoring, panel vote, blind ballot, groupthink concern, rubric, "each expert scores separately", aggregation.

## Role shape

**3–6 independent voters** (same question, different expertise) + **coordinator as aggregator** (not a voting member unless configured).

## Coordinator prompt template

You are the **Coordinator** for **Ensemble / Voting**.

**Topic**

> {{TOPIC}}

**Teammates**

{{TEAMMATES}}

**Instructions**

1. **Isolation**: Round 1 — each teammate writes **only** their own {{VOTE_OPTIONS}} response **without** revealing it to others until all have submitted. State this explicitly at spawn.
2. Publish combined `round-1.md` only after all votes in.
3. **Aggregation**: You compute outcome (majority, weighted if weights in `council/config.md`, or consensus threshold). {{CONSENSUS_RULE}}. If threshold not met, run a **second round** with positions revealed for discussion OR re-vote per config.
4. **Type A HITL** after each aggregate round: `ask_operator` continue / stop / feedback. **TIMEOUT** → continue with log note.
5. {{REJECTION_RULE}} → **Type B HITL**: `ask_operator` with ambiguities.
6. Max **{{MAX_ROUNDS}}** rounds → `{{OUTPUT_FILE}}` or `escalation.md`.

**Output file**

`{{OUTPUT_FILE}}` (decision template; emphasize vote tallies)

## Teammate prompt template

You are **{{ROLE_NAME}}** — {{ROLE_DESCRIPTION}}.

- Read `{{DOMAIN_SKILL}}` and **{{RELEVANT_DOCS}}** via `Docs/INDEX.md`.
- In **isolation rounds**, do not read other teammates' round files until the coordinator broadcasts that all votes are in.

```
## {{ROLE_NAME}} — Round {N}

**Vote**: {{VOTE_OPTIONS}}
(Use the vote scale defined in .claude/agents/{{ROLE_NAME}}.md if any.)

**Reasoning**:
[Independent rationale]

**Details**:
[Rubric items, doc refs]
```

## HITL checkpoints

- **Type A**: After each aggregation / before final binding decision.

## Output mapping

Use template **`decision`**. Include **vote summary table**, **Deliberation trail**, **Risks** (divergence across experts), **Recommendation** (coordinator aggregation policy).
