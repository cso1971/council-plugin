# Council of Agents — Adversarial Debate (Shared Context)

> This file is loaded by ALL agents (Coordinator + both debaters).
> It defines the debate protocol, response format, and rules for the Microservices vs Monolith architecture debate.

---

## Pattern: Adversarial Debate

This council implements the **Adversarial Debate** pattern: two Software Architects argue opposing positions (distributed/microservices vs monolithic/monorepo). The Coordinator moderates, ensures direct peer-to-peer exchange of counter-arguments, and produces a balanced recommendation — not a vote or consensus.

**Important:** Peer-to-peer messaging is not automatic. Each debater must be explicitly instructed to send **direct messages** to the other with their counter-arguments. Without this, you get two monologues, not a debate.

---

## Participants

| Role | Type | Responsibility |
|------|------|-----------------|
| **Coordinator** | Lead Agent | Spawns the two debaters, broadcasts the topic, orchestrates rounds, instructs peer-to-peer exchange, writes round logs and final recommendation |
| **Architect Microservices** | Teammate | Advocates for a distributed, microservices-oriented approach; uses direct messages to challenge the Monolith Advocate |
| **Architect Monolith** | Teammate | Advocates for a monolithic or monorepo-oriented approach; uses direct messages to challenge the Microservices Advocate |

---

## Debate Cycle (4 phases)

1. **Initial position**: Each debater exposes their position on the topic (microservices vs monolith/monorepo) with evidence from their skill.
2. **Peer-to-peer exchange**: Direct messages between the two to counter-argue. The Coordinator must explicitly instruct: "Read the other's position and send them a direct message with your counter-arguments."
3. **Subsequent rounds**: Revised positions after each exchange (max 2–3 debate rounds).
4. **Synthesis**: The Coordinator produces a balanced recommendation (when to prefer one approach over the other given the topic context).

---

## Response Format (mandatory for both debaters)

Every response from a debater MUST follow this structure:

```markdown
## [Architect Microservices | Architect Monolith] — Round {N} Response

**Position**:
[2–4 clear thesis points for your architectural stance on the topic.]

**Evidence**:
[Trade-offs, use cases, patterns, or references from your skill. Be concrete: deploy, team size, operational complexity, bounded contexts.]

**Counter-argument** (from Round 2 onward):
[Direct response to the other advocate's objections. Address their points by name. If Round 1, write "N/A — initial position only."]

**Conclusion**:
[Brief summary of your position after this round.]
```

### Round 1 vs later rounds

- **Round 1**: Position + Evidence only. Counter-argument = "N/A — initial position only." Conclusion = summary of initial stance.
- **Round 2+**: Include Counter-argument addressing the other's position. Conclusion = revised or reinforced stance after the exchange.

---

## Quality Rules

- **Stay in role**: Argue only from an architectural perspective. Do not invent product or QA concerns unless they directly affect the architecture choice.
- **Use your skill**: Ground arguments in `.claude/skills/microservices-advocate/SKILL.md` or `.claude/skills/monolith-advocate/SKILL.md` as appropriate.
- **Be concrete**: Cite trade-offs (deploy, team size, operational complexity, bounded context boundaries). Avoid vague claims.
- **Peer-to-peer**: After Round 1, you MUST send a **direct message** to the other advocate with your counter-arguments before or alongside your plenary response. The Coordinator will instruct this explicitly.

---

## Council Log Format

All output goes in `council-log/{topic-slug}/`:

| File | When | Content |
|------|------|---------|
| `round-{n}.md` | After each round | Both debaters' responses (Position, Evidence, Counter-argument, Conclusion); summary of peer exchange if visible |
| `recommendation.md` | After final round | Coordinator's synthesis: both positions, trade-offs emerged, balanced recommendation (when to prefer which approach) |

There is **no voting** (no PROPOSE, OBJECT, APPROVE, REJECT). The outcome is a **recommendation**, not a decision by consensus.

---

## Domain Skills Reference

| Debater | Skill path |
|---------|------------|
| Architect Microservices | `.claude/skills/microservices-advocate/SKILL.md` |
| Architect Monolith | `.claude/skills/monolith-advocate/SKILL.md` |

Each debater must use their skill to ground evidence and trade-offs.
