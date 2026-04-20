# Council of Agents — Shared Context

> This file is loaded by ALL agents (Coordinator + teammates).
> It defines the project context, deliberation protocol, and rules that every participant must follow.

@CONTEXT.md

---

## Project Context

The **distributed-playground** is a .NET 9 microservices sandbox built with bounded contexts. It serves as the domain reference for Council deliberations.

### Architecture Overview

| Service | Port | Schema | Status |
|---------|------|--------|--------|
| Gateway (YARP) | 5000 | — | Operational — routes all API traffic |
| Ordering API | 5001 | `ordering` | Operational — full order workflow |
| Invoicing API | 5002 | `invoicing` | **Placeholder** — needs implementation |
| Customers API | 5003 | `customers` | Operational — customer profiles |
| AI.Processor | 5010 | — | Operational — Ollama + Semantic Kernel |
| Orchestrator | 5020 | — | Operational — workflow coordination |
| Projections | 5030 | — | Operational — read-model projections |

### Technical Stack

- **.NET 9** with ASP.NET Core minimal APIs / controllers
- **Entity Framework Core** — one DbContext per bounded context, dedicated PostgreSQL schema
- **MassTransit** over RabbitMQ — inter-service messaging and events
- **YARP** — reverse proxy gateway routing to all APIs
- **PostgreSQL** — shared instance, schema-per-context isolation
- **xUnit** — unit and integration tests (WebApplicationFactory for integration)

### Bounded Context Pattern

Each bounded context follows the same structure:

```
Services/{Context}/
├── Controllers/        # API endpoints
├── Domain/             # Entities, value objects, domain events
├── Infrastructure/     # DbContext, EF configurations, consumers
└── Program.cs          # Service host configuration
```

---

## Deliberation Protocol

### Participants

| Role | Type | Responsibility |
|------|------|----------------|
| **Coordinator** | Lead Agent | Moderates the deliberative cycle, spawns teammates, synthesizes responses, detects consensus |
| **Product Analyst** | Teammate | Analyzes requirements, proposes user stories with acceptance criteria, validates functional completeness |
| **Architect** | Teammate | Analyzes architectural impact, verifies consistency with existing patterns, identifies cross-context dependencies |
| **QA Strategist** | Teammate | Evaluates testability, proposes test plans, identifies edge cases and critical scenarios |

### Deliberative Cycle

```
[Topic arrives]
       │
       ▼
[Coordinator spawns team and broadcasts topic]
       │
       ▼
[Round N: each participant analyzes and responds]
       │
       ▼
[Coordinator synthesizes responses]
       │
       ▼
   Consensus?
  ╱           ╲
YES             NO
 │               │
 ▼               ▼
[decision.md]   [Operator Confirmation via Telegram]
                       │
                 ┌─────┼──────────┐
                 │     │          │
              "continue"  "stop"  feedback / timeout
                 │     │          │
                 │     ▼          │
                 │  [escalation   │
                 │   .md]         │
                 ▼                ▼
           [Revised proposal → Round N+1]
            (max 4 rounds, then human escalation)
```

1. **Coordinator** broadcasts the topic to all teammates
2. Each teammate responds with their analysis in the mandatory format (see below)
3. **Coordinator** synthesizes responses, checks for consensus
4. If consensus: writes `decision.md`
5. If no consensus: composes a revised proposal addressing objections
6. **Operator Confirmation**: Coordinator sends a round summary via Telegram (`ask_operator`) and waits for the operator's reply — "continue" proceeds, "stop" ends the deliberation, free-text feedback is incorporated into the revised proposal, timeout proceeds automatically
7. Broadcasts the next round (with operator feedback if provided)
8. Repeat until consensus or maximum rounds reached

---

## Response Format (mandatory for ALL participants)

Every response from a teammate MUST follow this exact structure:

```markdown
## [Role Name] — Round {N} Response

**Vote**: PROPOSE | OBJECT | APPROVE | ABSTAIN | REJECT

**Reasoning**:
[Analysis from your area of expertise. Reference specific architectural patterns,
acceptance criteria, test strategies, or domain constraints as appropriate.]

**Details**:
[Specifics — user stories, identified risks, test criteria, architectural decisions,
dependency analysis, etc. Be concrete and actionable.]
```

### Vote Semantics

| Vote | Meaning | Effect |
|------|---------|--------|
| **APPROVE** | The current proposal is acceptable from my perspective | Counts toward consensus |
| **OBJECT** | I have a substantive concern that must be addressed | Blocks consensus; triggers a new round |
| **PROPOSE** | I suggest an alternative approach | Treated as implicit OBJECT to the current proposal; the alternative is included in the next round's revised proposal |
| **ABSTAIN** | This topic falls outside my expertise area | Excluded from consensus calculation |
| **REJECT** | The topic is too ambiguous, contradictory, or incomplete to deliberate meaningfully | If 2+ participants vote REJECT in any round, the Coordinator attempts Telegram clarification via `ask_operator` (Step 2c); writes `rejection.md` only if clarification fails |

### Response Quality Rules

- **Be specific**: cite concrete patterns, files, schemas, or acceptance criteria — not vague concerns
- **Be actionable**: every OBJECT must include what would resolve it; every PROPOSE must include the alternative
- **Stay in your lane**: analyze from your own expertise area; defer to other roles on their domain
- **Reference skills**: use the domain knowledge from `.claude/skills/` to ground your analysis
- **REJECT vs PROPOSE**: vote REJECT when the topic itself is ambiguous and you would need to guess user intent to proceed. Vote PROPOSE when the topic is clear but you disagree with the approach. If you find yourself writing "could mean A or B", that is a REJECT. Every REJECT must include the specific ambiguity and a clarification question for the requester

---

## Consensus Rules

1. **Consensus** = all non-abstaining participants vote `APPROVE`
2. Any `OBJECT` triggers a new round with a revised proposal that addresses the objection
3. `PROPOSE` = suggests an alternative (treated as implicit `OBJECT` to the current proposal)
4. **Rejection** = if 2 or more non-abstaining participants vote `REJECT` in any round, the Coordinator first attempts to resolve the ambiguity by calling the `ask_operator` MCP tool (Telegram) to ask the operator for clarification (Step 2c). If the operator replies with clarifications, the Coordinator composes a Revised Proposal and continues to the next round. Only if the operator replies "abort", the tool times out, or the tool is unavailable does the Coordinator write `rejection.md`. The council must NOT interpret ambiguous topics on behalf of the requester
5. **Operator confirmation** = after each non-consensus round (where no rejection occurred), the Coordinator sends a round summary via Telegram (`ask_operator`, Step 2b) and waits for the operator to confirm continuation. The operator can reply "continue" (proceed), "stop" (end deliberation), or provide free-text feedback to incorporate into the next round's revised proposal. On timeout or tool unavailable, proceed automatically
6. **Maximum 4 rounds** per topic
7. If no consensus after maximum rounds: Coordinator produces a summary of all positions for human decision

### Coordinator Responsibilities per Round

After collecting all responses, the Coordinator MUST:

1. **List each participant's vote and key points** — no response may be omitted or downplayed
2. **Check for rejection**: if 2+ participants voted REJECT, proceed to **Step 2c** (Clarification via Telegram using `ask_operator` MCP tool). Only write `rejection.md` if clarification fails or is unavailable
3. **Identify areas of agreement** — where participants converge
4. **Identify outstanding objections** — each OBJECT and PROPOSE with the stated resolution condition
5. **Compose a revised proposal** (if no consensus) that explicitly addresses each objection
6. **Declare consensus** (if all non-abstaining votes are APPROVE) and write the decision
7. **Request operator confirmation** (if no consensus and no rejection): send a round summary via Telegram (`ask_operator`) and wait for the operator to reply "continue", "stop", or provide feedback — see **Step 2b** in `coordinator.md`

---

## Escalation Rules

| Condition | Action |
|-----------|--------|
| All non-abstaining participants vote APPROVE | Consensus reached — write `decision.md` |
| 2+ participants vote REJECT | Coordinator invokes `ask_operator` MCP tool (Telegram) to request clarification from the operator (Step 2c). If clarification received → Revised Proposal for next round. If operator replies "abort", timeout, or tool unavailable → write `rejection.md` with ambiguities and clarification questions |
| OBJECT or PROPOSE present after round | Coordinator sends round summary via Telegram for **operator confirmation** (Step 2b): "continue" → new round with revised proposal; "stop" → write `escalation.md`; free-text → incorporate feedback into revised proposal; timeout → proceed automatically |
| Round 4 ends without consensus | Coordinator writes `escalation.md` summarizing all positions; human decides |
| Same objection raised 2+ rounds without progress | Coordinator flags the deadlock, may ask specific participants to propose a compromise |

---

## Council Log Format

All deliberation output goes in `council-log/{topic-slug}/`:

| File | When | Content |
|------|------|---------|
| `round-{n}.md` | After each round | All participant responses with votes, Coordinator synthesis |
| `decision.md` | On consensus | Final agreed proposal with all details |
| `rejection.md` | On 2+ REJECT votes after Step 2c fails or is unavailable | Ambiguities identified, clarification questions for the requester |
| `escalation.md` | On max rounds without consensus | Summary of positions, open disagreements, recommendation for human |

### Round Log Structure

```markdown
# Round {N} — {Topic}

## Responses

### Product Analyst
**Vote**: ...
**Reasoning**: ...
**Details**: ...

### Architect
**Vote**: ...
**Reasoning**: ...
**Details**: ...

### QA Strategist
**Vote**: ...
**Reasoning**: ...
**Details**: ...

## Coordinator Synthesis

**Consensus**: Yes / No
**Agreements**: ...
**Outstanding objections**: ...
**Revised proposal for next round** (if applicable): ...
```

---

## Domain Skills Reference

Teammates should leverage the domain skills in `.claude/skills/` for grounded analysis:

| Skill | Path | Used by |
|-------|------|---------|
| .NET Architecture | `.claude/skills/dotnet-architecture/SKILL.md` | Architect |
| Testing Strategy | `.claude/skills/testing-strategy/SKILL.md` | QA Strategist |
| Story Writing | `.claude/skills/story-writing/SKILL.md` | Product Analyst |
