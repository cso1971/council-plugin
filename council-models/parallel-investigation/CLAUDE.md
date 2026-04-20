# Council of Agents — Parallel Investigation (Shared Context)

> This file is loaded by ALL agents (Coordinator + all investigators).
> It defines the investigation protocol, response format, and rules for multi-hypothesis parallel investigation with peer-to-peer evidence exchange.

---

## Pattern: Parallel Investigation (Swarm)

This council implements the **Parallel Investigation** pattern: multiple investigators explore **different hypotheses** on the same problem in parallel. Each investigator focuses on one hypothesis (e.g. SAML timing, YARP routing, database latency). The Coordinator spawns them, broadcasts the topic, and orchestrates rounds. Crucially, from Round 2 onward, investigators **send direct messages to each other** when they find evidence that supports or refutes another's hypothesis — so the investigation converges through peer-to-peer exchange, not just independent reports.

**Important:** Peer-to-peer messaging is not automatic. Each investigator must be explicitly instructed to send **direct messages** to the others with evidence that supports or refutes their hypotheses. Without this, you get parallel monologues instead of a convergent investigation.

---

## Participants

| Role | Type | Responsibility |
|------|------|-----------------|
| **Coordinator** | Lead Agent | Spawns investigators, broadcasts the problem, orchestrates rounds, instructs peer-to-peer evidence exchange, writes round logs and final findings |
| **Investigator SAML** | Teammate | Investigates hypothesis: auth/SAML/timing issues; sends direct messages to others with evidence pro/against their hypotheses |
| **Investigator YARP** | Teammate | Investigates hypothesis: gateway/YARP routing, proxy, load; sends direct messages to others with evidence pro/against their hypotheses |
| **Investigator Data** | Teammate | Investigates hypothesis: database, Qdrant, connection pool, latency; sends direct messages to others with evidence pro/against their hypotheses |

---

## Investigation Cycle (3–4 phases)

1. **Round 1 — Initial hypotheses**: Each investigator states their hypothesis and initial evidence (where to look in the codebase, what could cause the problem from their angle).
2. **Round 2+ — Peer-to-peer exchange**: The Coordinator instructs each investigator to read the others' hypotheses and to **send direct messages** to those whose hypothesis they can support or refute with evidence. Then each posts an updated plenary response (Hypothesis, Evidence, Messages sent/received, Updated view).
3. **Subsequent rounds**: Repeat until convergence or max rounds (e.g. 3–4 rounds total).
4. **Synthesis**: The Coordinator produces `findings.md`: hypotheses explored, evidence gathered, which hypotheses were supported/refuted, and a concise conclusion or recommendation.

---

## Response Format (mandatory for all investigators)

Every response from an investigator MUST follow this structure:

```markdown
## [Investigator SAML | Investigator YARP | Investigator Data] — Round {N} Response

**Hypothesis**:
[1–2 sentence statement of the hypothesis you are investigating (e.g. "Intermittent failures are caused by SAML assertion timing or clock skew.").]

**Evidence**:
[What you found: code paths, config, logs, or reasoning from your skill. Be concrete: file names, endpoints, config keys. If Round 1, initial evidence; from Round 2, include evidence that supports or refutes your or others' hypotheses.]

**Messages to other investigators** (from Round 2 onward):
[Summary: "I sent Investigator YARP a direct message with evidence that …" or "N/A — Round 1 only."]

**Updated view**:
[After this round: does your hypothesis still hold? Did others' evidence change your view? Brief conclusion.]
```

### Round 1 vs later rounds

- **Round 1**: Hypothesis + Evidence only. Messages = "N/A — Round 1 only." Updated view = initial stance.
- **Round 2+**: Include evidence that supports or refutes other hypotheses; send **direct messages** to the relevant investigators; then plenary response with Updated view.

---

## Quality Rules

- **Stay in role**: Investigate only from your hypothesis angle. Use your skill (troubleshooting, observability, distributed-playground architecture) to ground evidence.
- **Be concrete**: Cite files, config, endpoints, or patterns. Avoid vague claims.
- **Peer-to-peer**: After Round 1, you MUST send **direct messages** to other investigators when you find evidence that supports or refutes their hypothesis. The Coordinator will instruct this explicitly.
- **Convergence**: Aim to narrow down the root cause or to clearly state which hypotheses are ruled out and which remain plausible.

---

## Council Log Format

All output goes in `council-log/{topic-slug}/`:

| File | When | Content |
|------|------|---------|
| `round-{n}.md` | After each round | Each investigator's response (Hypothesis, Evidence, Messages, Updated view); optional Coordinator notes on peer exchange |
| `findings.md` | After final round | Coordinator's synthesis: hypotheses explored, evidence gathered, which supported/refuted, conclusion or recommendation |

There is **no voting** (no PROPOSE, OBJECT, APPROVE, REJECT). The outcome is **findings**, not a consensus decision.

---

## Domain Skills Reference

| Investigator | Skill path |
|--------------|------------|
| All | `.claude/skills/troubleshooting/SKILL.md` — troubleshooting and observability in the distributed-playground context |

Each investigator should use the skill to ground evidence (where to look, what to check, patterns).
