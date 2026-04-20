# Council pattern recommender — question tree

Use **after** the user confirms their scenario (`{{TOPIC}}`). Ask **at most three** questions (Q1 required; Q2–Q3 conditional). Map answers to **recommender signals** in `references/patterns/*.md`.

**Output to the user**: **one primary pattern** + **one alternative**, each with a **one-line rationale**, plus a link: *"See the full catalog: `references/patterns/` (7 native patterns)."*

---

## Q1 — Outcome shape (required)

**Ask:** *Is your main goal a **single decision** everyone aligns on, a **parallel investigation** into an unclear problem, or a **structured plan with approval gates**?*

| Answer bucket | Primary signals | Typical primary pattern | Typical alternative |
|---------------|-----------------|-------------------------|----------------------|
| A — Single decision / alignment | strategic decision, consensus, steering | `hub-and-spoke` | `ensemble-voting` (if groupthink is a concern) |
| B — Unclear cause / hypotheses | hypothesis, investigation, evidence | `swarm` | `map-reduce` (if slices already known) |
| C — Plan then execute with controls | compliance, approval gate, regulated | `plan-execute-verify` | `builder-validator` |

---

## Q2 — Conflict shape (ask if Q1 = A or unclear)

**Ask:** *Is the tension mostly **binary** (two real options) with advocates, or **multi-way** tradeoffs across functions?*

| Answer | Signals | Primary | Alternative |
|--------|---------|---------|---------------|
| Binary / polarized | binary, debate, A vs B | `adversarial-debate` | `hub-and-spoke` |
| Multi-way tradeoffs | tradeoffs, alignment | `hub-and-spoke` | `ensemble-voting` |

---

## Q3 — Work structure (ask if Q1 = B or C, or user mentioned segments)

**Ask:** *Is the work naturally **parallel slices** (regions, units, doc batches), or **one artifact** that must be **drafted then checked**?*

| Answer | Signals | Primary | Alternative |
|--------|---------|---------|-------------|
| Parallel slices | segments, roll-up, aggregate | `map-reduce` | `swarm` |
| Draft + quality / compliance check | draft, QC, redlines | `builder-validator` | `plan-execute-verify` |

---

## Tie-breakers (if two patterns score equally)

1. Prefer **native simplicity** for the user's stated cadence: investigation → `swarm` before `map-reduce` unless segments are explicit.
2. If **human approval** dominates → `plan-execute-verify` over `builder-validator`.
3. If **independent scoring** appears in scenario → `ensemble-voting`.

---

## Keyword assist (optional, first release)

If the user's scenario text matches keywords in a pattern's **Recommender signals** section strongly, bump that pattern **+1** in ranking — still present **primary + alternative** with rationale.
