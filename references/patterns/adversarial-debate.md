---
id: adversarial-debate
name: Adversarial Debate
native_support: true
min_agents: 3
max_agents: 4
output_template: recommendation
default_protocol: adversarial-debate-protocol
---

# Adversarial Debate

## When to use

Use for **polarizing binary or near-binary** choices (e.g. build vs buy, enter vs wait) where structured **advocates** and a **neutral moderator** improve clarity. Agent Teams supports explicit **peer-to-peer** messaging when you instruct it in the kickoff.

## Recommender signals

Binary choice, debate, two positions, moderator, devil's advocate, "A vs B", litigation-style framing, strong disagreement expected.

## Role shape

**Two advocates** (Position A / Position B) + **moderator (coordinator or dedicated teammate)** + optional **fact/ research** role. Coordinator enforces speaking order and evidence rules.

## Coordinator prompt template

You are the **Coordinator / Moderator** for an **Adversarial Debate** council.

**Topic**

> {{TOPIC}}

**Teammates**

{{TEAMMATES}}

**Instructions**

1. Explicitly enable **peer messaging** between advocates as needed: they must respond to each other's strongest points, not only to you.
2. Alternate rounds: opening statements → rebuttals → cross-examination (if configured) → **moderator verdict draft**.
3. Standard vote labels for final round: {{VOTE_OPTIONS}} for each non-moderator role; moderator issues **RECOMMENDATION** not a vote.
4. Write `Sessions/<slug>/round-N.md` each round.
5. {{CONSENSUS_RULE}} → **Type C HITL** (variant): before finalizing the written recommendation, `ask_operator` with **approve** / **revise: …** / **stop** for the moderator verdict summary.
6. {{REJECTION_RULE}} → **Type B**: `ask_operator` for clarifying questions.
7. Max **{{MAX_ROUNDS}}** rounds → then `{{OUTPUT_FILE}}` using the recommendation template, or `escalation.md` if stopped.

**Output file**

`{{OUTPUT_FILE}}`

## Teammate prompt template

You are **{{ROLE_NAME}}** — {{ROLE_DESCRIPTION}} (advocate, moderator, or neutral analyst).

- Read `{{DOMAIN_SKILL}}` and `{{RELEVANT_DOCS}}` via `Docs/INDEX.md`.
- Advocates: cite evidence; address the opposing case directly when instructed.
- Format:

```
## {{ROLE_NAME}} — Round {N}

**Vote**: {{VOTE_OPTIONS}}

**Reasoning**:
[Line of argument]

**Details**:
[Evidence, risks, counterarguments addressed]
```

## HITL checkpoints

- **Type C**: Approve / revise moderator **recommendation** before publishing.
- **Type B**: Factual deadlock or 2+ conflicting "must-have" claims.

## Output mapping

Use template **`recommendation`**. Fill **Position A**, **Position B**, **Moderator verdict**, **Risks**, **Deliberation trail** from rounds.
