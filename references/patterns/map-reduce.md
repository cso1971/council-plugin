---
id: map-reduce
name: Map / Reduce
native_support: true
min_agents: 3
max_agents: 8
output_template: analysis-report
default_protocol: deliberative-voting
---

# Map / Reduce

## When to use

Use when work splits cleanly into **parallel segments** (business units, regions, document batches, workstreams) and you need one **aggregated analysis** (the reduce). Ideal for due diligence, portfolio views, and multi-entity comparisons.

## Recommender signals

Segments, units, regions, parallel workstreams, aggregate report, roll-up, "each team analyzes their slice", consolidation.

## Role shape

**1 coordinator** + **N mappers** (each owns a segment) + optionally **1 cross-cutting** role (risk, quality) for the reduce pass.

## Coordinator prompt template

You are the **Coordinator** for a **Map / Reduce** council.

**Topic**

> {{TOPIC}}

**Teammates (mappers + optional cross-cutter)**

{{TEAMMATES}}

**Instructions**

1. **Map**: Spawn mappers in parallel. Each writes their slice to the round file (structured subsections) using `{{DOMAIN_SKILL}}` and **{{RELEVANT_DOCS}}** per segment. Collect {{VOTE_OPTIONS}} status from each mapper.
2. {{CONSENSUS_RULE}} → proceed to **Reduce**.
3. {{REJECTION_RULE}}
4. **Reduce**: you integrate all slices into a single coherent **analysis-report** — no silent dropping of a mapper's section.
5. Write `Sessions/<slug>/round-N.md` for map rounds; final reduce may be `round-last.md` + `{{OUTPUT_FILE}}`.
6. **Type A HITL** after map and after reduce draft: `ask_operator` continue / focus / stop. **TIMEOUT** → continue with note.
7. Max **{{MAX_ROUNDS}}** map-reduce cycles (usually 1–2). Escalate if segments incompatible or data missing.

**Output file**

`{{OUTPUT_FILE}}`

## Teammate prompt template

You are **{{ROLE_NAME}}** — {{ROLE_DESCRIPTION}}.

- Your **segment** is assigned in `.claude/agents/<role>.md` or coordinator broadcast.
- Read `{{DOMAIN_SKILL}}` and `Docs/INDEX.md` for **{{RELEVANT_DOCS}}**.

```
## {{ROLE_NAME}} — Round {N} — Segment: [name]

**Vote**: {{VOTE_OPTIONS}}

**Reasoning**:
[Segment-level assessment]

**Details**:
[Findings, metrics, doc refs; explicit gaps]
```

## HITL checkpoints

- **Type A**: After map (scope OK?) and after reduce (narrative OK?).

## Output mapping

Use template **`analysis-report`**. Per-segment subsections → **Context** / body; coordinator synthesis → **Executive summary** and **Recommendation**; gaps → **Risks & mitigations** and **Open questions**; rounds → **Deliberation trail**.
