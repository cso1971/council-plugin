# Council pattern recommender — question tree

Use **after** the user confirms their scenario (`{{TOPIC}}`). Ask **at most three** questions (Q1 and Q2 required; Q3 conditional). Map answers to **recommender signals** in `references/patterns/*.md`.

**Output to the user**: **one primary pattern** + **one alternative**, each with a **one-line rationale**, plus a link: *"See the full catalog: `references/patterns/` (7 native patterns)."*

---

## Q1 — Outcome shape (required)

**Ask:** *Is your main goal a **single decision** everyone aligns on, a **parallel investigation** into an unclear problem, or producing a **checked artifact** (draft, deliverable, or plan with validation)?*

| Answer bucket | Primary signals | Provisional primary | Provisional alternative |
|---------------|-----------------|---------------------|-------------------------|
| A — Single decision / alignment | strategic decision, consensus, steering, prioritization | `hub-and-spoke` | `ensemble-voting` (if groupthink is a concern) |
| B — Unclear cause / hypotheses | hypothesis, investigation, evidence, root cause | `swarm` | `map-reduce` (if slices already known) |
| C — Checked artifact / deliverable | draft, review, QC, compliance check, plan sign-off | `builder-validator` | `plan-execute-verify` (if formal gates dominate) |

> Results are provisional until Q2 is answered.

---

## Q2 — Tension shape (required)

**Ask:** *Is there a **strong binary tension** — two clear opposing positions with advocates — or is the work more about **convergence across multiple perspectives**?*

| Answer | Override logic | Resulting primary | Resulting alternative |
|--------|---------------|-------------------|-----------------------|
| Binary / polarized | Override Q1 provisional → `adversarial-debate` becomes primary | `adversarial-debate` | Q1's provisional primary |
| Multi-way / convergent | Keep Q1 provisional | Q1's provisional primary | Q1's provisional alternative |

If Q2 = **binary**, recommendation is final (no Q3 needed).

If Q2 = **multi-way** and Q1 = **A**, recommendation is final (no Q3 needed).

If Q2 = **multi-way** and Q1 = **B** or **C**, or the user mentioned explicit segments → ask Q3.

---

## Q3 — Work decomposition (conditional)

**Ask when**: Q2 = multi-way AND (Q1 = B or C, or user mentioned segments/slices).

**Ask:** *Is the work naturally **parallel slices** (regions, units, doc batches) that roll up into one report, or **one artifact** that must be **drafted then reviewed**?*

| Answer | Signals | Primary | Alternative |
|--------|---------|---------|-------------|
| Parallel slices | segments, roll-up, aggregate | `map-reduce` | `swarm` |
| Draft + quality / compliance check | draft, QC, redlines | `builder-validator` | `plan-execute-verify` |

---

## Reachability matrix

All 7 patterns are reachable with no dead ends:

| Path | Primary | Alternative |
|------|---------|-------------|
| Q1=A → Q2=Binary | `adversarial-debate` | `hub-and-spoke` |
| Q1=A → Q2=Multi-way | `hub-and-spoke` | `ensemble-voting` |
| Q1=B → Q2=Binary | `adversarial-debate` | `swarm` |
| Q1=B → Q2=Multi-way → Q3=Parallel | `map-reduce` | `swarm` |
| Q1=B → Q2=Multi-way → Q3=Draft+check | `builder-validator` | `plan-execute-verify` |
| Q1=C → Q2=Binary | `adversarial-debate` | `builder-validator` |
| Q1=C → Q2=Multi-way | `builder-validator` | `plan-execute-verify` |

---

## Tie-breakers (if two patterns score equally)

1. Prefer **native simplicity** for the user's stated cadence: investigation → `swarm` before `map-reduce` unless segments are explicit.
2. If **human approval gates** dominate → `plan-execute-verify` over `builder-validator`.
3. If **independent scoring** appears in scenario → `ensemble-voting`.
4. If keyword signals for `ensemble-voting` or `map-reduce` appear strongly but the Q1/Q2 path did not surface them, bump that pattern **+1** via keyword assist — they have fewer direct paths than other patterns.

---

## Keyword assist (optional, first release)

If the user's scenario text matches keywords in a pattern's **Recommender signals** section strongly, bump that pattern **+1** in ranking — still present **primary + alternative** with rationale.
