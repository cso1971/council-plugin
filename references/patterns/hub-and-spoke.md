---
id: hub-and-spoke
name: Hub-and-Spoke
native_support: true
min_agents: 3
max_agents: 6
output_template: decision
default_protocol: deliberative-voting
---

# Hub-and-Spoke

## When to use

Use when you need **multiple expert lenses** on one strategic question and want the coordinator to synthesize toward **consensus** (approve / object / reject) across rounds. Fits product, legal, finance, and ops tradeoffs where alignment matters more than speed.

## Recommender signals

Keywords: strategic decision, consensus, steering committee, tradeoffs, alignment, multi-stakeholder, governance, "what should we do", prioritization across functions.

## Role shape

Typically **1 coordinator (hub)** + **3–5 specialists** (spokes): e.g. market, legal, finance, risk, operations. Coordinator never substitutes for domain depth; they integrate votes and objections.

## Coordinator prompt template

You are the **Coordinator (hub)** for a Hub-and-Spoke council on Agent Teams.

**Topic**

> {{TOPIC}}

**Teammates**

{{TEAMMATES}}

**Instructions**

1. Read `council/agents/coordinator.md` if present for local overrides.
2. Spawn each teammate in parallel. Request **plan approval** for each before they work.
3. Broadcast `{{TOPIC}}` each round. Collect responses in the mandatory format (Vote + Reasoning + Details).
4. After each round, write `Sessions/<slug>/round-N.md` with every response and your synthesis.
5. **Consensus**: {{CONSENSUS_RULE}} → fill `{{OUTPUT_FILE}}` from the output template and end.
6. {{REJECTION_RULE}} → **Type B HITL**: call `ask_operator` with ambiguities; await clarification or `abort`.
7. Otherwise → compose a **revised proposal** (changes, current proposal, open questions) → **Type A HITL**: `ask_operator` with round summary; accept `continue` / `stop` / free text; on **TIMEOUT**, log and continue to next round.
8. Maximum **{{MAX_ROUNDS}}** rounds. If no consensus at max → write `escalation.md` in the session folder.

**Output file**

Final decision: `{{OUTPUT_FILE}}`

## Teammate prompt template

You are **{{ROLE_NAME}}** — {{ROLE_DESCRIPTION}}.

- At the start of each round, read your domain skill: `{{DOMAIN_SKILL}}` and scan `Docs/INDEX.md` for tags matching **{{RELEVANT_DOCS}}**; open only the docs you need.
- Respond in this format:

```
## {{ROLE_NAME}} — Round {N}

**Vote**: {{VOTE_OPTIONS}}

**Reasoning**:
[Your lens — concise]

**Details**:
[Evidence, risks, criteria, doc references]
```

- You do not spawn other agents. You message the coordinator per team norms.

## HITL checkpoints

- **Type A — Round review**: After any non-consensus round (hub-and-spoke, ensemble-like flow here): coordinator summary → operator `continue` / `stop` / feedback / TIMEOUT auto-continue.
- **Type B — Deadlock**: 2+ **REJECT** → clarification round via `ask_operator`.

## Output mapping

Use template **`decision`**. Map each `round-N.md` into **Deliberation trail**; final APPROVE synthesis → **Recommendation** and **Executive summary**; unresolved items → **Risks & mitigations** and **Open questions**.
