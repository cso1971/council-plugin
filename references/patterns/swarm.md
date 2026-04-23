---
id: swarm
name: Swarm / Parallel Investigation
native_support: true
min_agents: 2
max_agents: 5
output_template: findings
default_protocol: convergent-investigation
---

# Swarm / Parallel Investigation

## When to use

Use when the situation is **ambiguous** and you want **parallel hypotheses** investigated independently, then merged into evidence-backed findings. Best for diagnostics, post-mortems, "what really happened", and exploratory research.

## Recommender signals

Keywords: hypothesis, parallel tracks, root cause, investigation, evidence, unknown cause, incident, diagnosis, "several explanations", compare scenarios.

## Role shape

**1 coordinator** + **2–4 investigators**, each assigned a **distinct hypothesis or workstream**. Optional light peer messaging when one finding supports or refutes another (per Agent Teams native parallel task pattern).

## Coordinator prompt template

You are the **Coordinator** for a **Swarm / Parallel Investigation** council.

**Topic**

> {{TOPIC}}

**Teammates (each owns one hypothesis or track)**

{{TEAMMATES}}

**Instructions**

1. Spawn all investigators **in parallel** with no cross-dependencies for the first pass.
2. In Round 1, each investigates **only their track**, cites `Docs/` where relevant via `Docs/INDEX.md`, and reports **Vote** as {{VOTE_OPTIONS}} for their own hypothesis.
3. After Round 1, you may allow **brief peer messages** only if instructed in `council/config.md` — otherwise investigators read only files, not each other's drafts, until you publish a combined round file.
4. Write `Sessions/<slug>/round-N.md` each round with all contributions.
5. {{CONSENSUS_RULE}} → proceed to **Reduce** phase.
6. {{REJECTION_RULE}}
7. **Reduce** phase: you produce a single **findings** narrative: hypotheses tested, evidence map, conclusion, residual uncertainty.
8. **Type A HITL** after major synthesis beats: `ask_operator` — continue / refine scope / stop. **TIMEOUT** → continue with explicit note in `round-N.md`.
9. Max **{{MAX_ROUNDS}}** rounds. If still inconclusive → `escalation.md` with ranked hypotheses and data gaps.

**Output file**

`{{OUTPUT_FILE}}` (findings template)

## Teammate prompt template

You are **{{ROLE_NAME}}** — {{ROLE_DESCRIPTION}}.

- Read `{{DOMAIN_SKILL}}` and `Docs/INDEX.md`; use **{{RELEVANT_DOCS}}** tags to choose documents.
- Stay on **your assigned hypothesis/track** unless the coordinator reassigns.
- Response format:

```
## {{ROLE_NAME}} — Round {N}

**Vote** (hypothesis status): {{VOTE_OPTIONS}}

**Reasoning**:
[What you tested and why]

**Details**:
[Evidence, doc refs, what would falsify/support the hypothesis]
```

## HITL checkpoints

- **Type A**: After initial parallel pass and after coordinator reduce — operator can narrow scope or request another parallel wave.

## Output mapping

Use template **`findings`**. Populate **Hypotheses tested**, **Evidence**, **Conclusion**, and **Deliberation trail** from rounds; **Open questions** lists experiments or data still needed.
