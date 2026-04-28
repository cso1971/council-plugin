# Protocol: Deliberative Voting

> Structured rounds with voting. Each round, all teammates analyze the topic and vote. The Coordinator synthesizes responses, checks for consensus, and either concludes or composes a revised proposal for the next round.

---

## Configuration

- **max-rounds**: 4
- **vote-options**: PROPOSE, OBJECT, APPROVE, ABSTAIN, REJECT

---

## Vote Semantics

| Vote | Meaning | Effect |
|------|---------|--------|
| **APPROVE** | The current proposal is acceptable from my perspective | Counts toward consensus |
| **OBJECT** | I have a substantive concern that must be addressed | Blocks consensus; triggers a new round |
| **PROPOSE** | I suggest an alternative approach | Treated as implicit OBJECT to the current proposal; the alternative is included in the next round's revised proposal |
| **ABSTAIN** | This topic falls outside my expertise area | Excluded from consensus calculation |
| **REJECT** | The topic is too ambiguous, contradictory, or incomplete to deliberate meaningfully | If 2+ participants vote REJECT in any round, the Coordinator stops and writes `rejection.md` |

### Response Quality Rules

- **Be specific**: cite concrete patterns, files, schemas, or acceptance criteria — not vague concerns
- **Be actionable**: every OBJECT must include what would resolve it; every PROPOSE must include the alternative
- **Stay in your lane**: analyze from your own expertise area; defer to other roles on their domain
- **Reference skills**: use the domain knowledge from `.claude/skills/` to ground your analysis
- **REJECT vs PROPOSE**: vote REJECT when the topic itself is ambiguous and you would need to guess user intent to proceed. Vote PROPOSE when the topic is clear but you disagree with the approach. If you find yourself writing "could mean A or B", that is a REJECT. Every REJECT must include the specific ambiguity and a clarification question for the requester

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

---

## Consensus Rules

1. **Consensus** = all non-abstaining participants vote `APPROVE`
2. Any `OBJECT` triggers a new round with a revised proposal that addresses the objection
3. `PROPOSE` = suggests an alternative (treated as implicit `OBJECT` to the current proposal)
4. **Rejection** = if 2 or more non-abstaining participants vote `REJECT` in any round, the Coordinator stops the deliberation immediately and writes `rejection.md` with the ambiguities and clarification questions. The council must NOT interpret ambiguous topics on behalf of the requester
5. **Maximum rounds** per topic: as configured above
6. If no consensus after maximum rounds: Coordinator produces a summary of all positions for human decision

---

## Escalation Rules

| Condition | Action |
|-----------|--------|
| All non-abstaining participants vote APPROVE | Consensus reached — write `decision.md` |
| 2+ participants vote REJECT | Topic rejected — write `rejection.md` with ambiguities and clarification questions; stop immediately |
| OBJECT or PROPOSE present after round | New round with revised proposal |
| Final round ends without consensus | Coordinator writes `escalation.md` summarizing all positions; human decides |
| Same objection raised 2+ rounds without progress | Coordinator flags the deadlock, may ask specific participants to propose a compromise |

---

## Deliberative Cycle

### Round 1: Broadcast the Topic

Send the topic to all teammates simultaneously. Each must respond using the mandatory response format above.

### After Each Round: Synthesize and Evaluate

Once all teammates have responded, the Coordinator MUST:

1. **List each participant's vote and key points** — no response may be omitted or downplayed
2. **Check for rejection**: if 2+ non-abstaining participants voted REJECT → stop immediately, write rejection
3. **Identify areas of agreement** — where participants converge
4. **Identify outstanding objections** — each OBJECT and PROPOSE with the stated resolution condition
5. **Check for consensus**: all non-abstaining participants vote APPROVE
6. **If consensus reached** → write decision
7. **If no consensus** → compose a **revised proposal** that explicitly addresses each objection, then broadcast the next round

### Revised Proposal Format

```
## Revised Proposal — Round {N+1}

### Changes from previous round
- [What changed and why, referencing specific objections]

### Current proposal
[The updated proposal incorporating feedback]

### Open questions
[Anything that needs specific input from a particular role]
```

---

## Output Formats

All output files go in `Sessions/{{TOPIC_SLUG}}/`. Create the directory if it doesn't exist.

### After Every Round — Individual Response Files

Before writing the round synthesis, write each teammate's response to a separate file:
`Sessions/{{TOPIC_SLUG}}/round-{n}-{role-slug}.md`

Use the teammate's kebab-case role slug. Each file uses YAML frontmatter + full verbatim response:

```markdown
---
round: {N}
role: {role-slug}
vote: {VOTE}
---

{Full response as received — do not summarize or truncate}
```

### After Every Round — Round Synthesis

Write `Sessions/{{TOPIC_SLUG}}/round-{n}.md`:

```markdown
# Round {N} — {{TOPIC}}

## Responses

### [Persona 1]
**Vote**: ...
**Reasoning**: ...
**Details**: ...

### [Persona 2]
**Vote**: ...
**Reasoning**: ...
**Details**: ...

### [Persona 3]
**Vote**: ...
**Reasoning**: ...
**Details**: ...

## Coordinator Synthesis

**Consensus**: Yes / No
**Agreements**: ...
**Outstanding objections**: ...
**Revised proposal for next round** (if applicable): ...
```

### On Consensus — `decision.md`

Write `Sessions/{{TOPIC_SLUG}}/decision.md` with the structure below. **You MUST** normalize all user stories, acceptance criteria, and tests into these fixed schemas. Use stable IDs: `US-###`, `AC-US###-##`, `T-###`; each test lists **Related acceptance criteria** by criterion ID. If a field is unknown, write `TBD` with a one-line note.

```markdown
# Decision — {{TOPIC}}

**Reached at**: Round {N}
**Participants**: [list with votes]

## Agreed Proposal

[Short narrative — 1–3 paragraphs; free-form. Everything below is structured.]

## User stories

### US-001 — [short title]

- **ID**: US-001
- **Title**: [concise title, same as heading]
- **Actor**: [primary user or system role]
- **Goal**: [one clear intent]
- **Business value**: [why it matters]
- **Dependencies**: [or `None`]
- **Assumptions**: [or `None`]
- **Risks**: [or `None identified`]

#### Acceptance criteria (US-001)

##### AC-US001-01

- **Criterion ID**: AC-US001-01
- **Description**: [testable behavior or rule]
- **Preconditions**: [or `None`]
- **Expected outcome**: [observable result]
- **Priority**: [Must | Should | Could | Won't — or P1 | P2 | P3 | P4]

[…repeat per story and criterion…]

## Architectural Decisions

[Key decisions; link to story IDs when scoped, e.g. `(see US-001)`.]

## Tests

### T-001

- **Test ID**: T-001
- **Scenario**: [Given/When/Then or clear scenario]
- **Type**: [unit | integration | contract | e2e | load — as appropriate]
- **Preconditions**: [or `None`]
- **Expected result**: [assertions, HTTP codes, events, DB state]
- **Related acceptance criteria**: [e.g. `AC-US001-01`, `AC-US001-02`]

[…repeat per test…]

## Deliberation Summary

[Brief history: rounds, changes, objections resolved]
```

### On Rejection (2+ REJECT votes) — `rejection.md`

```markdown
# Rejection — {{TOPIC}}

**Round**: {N}
**Outcome**: Topic rejected — insufficient clarity for deliberation
**REJECT votes**: [list of participants who voted REJECT with their specific concern]

## Ambiguities Identified

[Each ambiguity flagged by participants. For each one:
- What is ambiguous or contradictory in the topic
- Why it matters (what different interpretations would lead to very different implementations)
- Which participant(s) flagged it]

## Clarification Questions

[Concrete, numbered questions that the requester must answer before the council can deliberate.
Each question should be specific enough that a one-sentence answer resolves the ambiguity.]

## Recommendation

[What the requester should do: rephrase the topic with the answers included,
provide more context, break it into smaller topics, etc.]
```

### On Escalation (no consensus after max rounds) — `escalation.md`

```markdown
# Escalation — {{TOPIC}}

**Rounds completed**: {max-rounds}
**Consensus**: Not reached

## Summary of Positions

### [Persona 1]
[Final position and unresolved concerns]

### [Persona 2]
[Final position and unresolved concerns]

### [Persona 3]
[Final position and unresolved concerns]

## Areas of Agreement
[What the council does agree on]

## Unresolved Disagreements
[Specific points where participants could not converge, with each side's argument]

## Coordinator Recommendation
[Your recommendation for the human decision-maker, based on the strength of arguments]
```

---

## Behavioral Rules (Coordinator)

- **Neutrality**: you do not vote. You moderate, synthesize, and facilitate. Never favor one participant's position over another.
- **Completeness**: every participant's response must be fully represented in round logs. Do not summarize away dissent.
- **Transparency**: when composing a revised proposal, explicitly state which objection each change addresses.
- **Efficiency**: if all participants APPROVE in Round 1, do not force additional rounds. Write the decision immediately.
- **Rejection duty**: if 2+ participants vote REJECT, do NOT attempt to interpret the ambiguity or push the team to choose an interpretation. Stop the cycle immediately and write `rejection.md`. The council must not guess user intent.
- **Escalation awareness**: if you detect a circular argument (same objection restated without new information), intervene and ask for a concrete compromise proposal.
- **Structured decision output**: when writing `decision.md`, populate **User stories** (with nested **Acceptance criteria** per story) and **Tests** using the field lists in the On Consensus template — no ad-hoc alternate formats.

---

## Console Reporting (optional)

When enabled, each teammate sends multiple HTTP POSTs per round to a Report URL for live progress updates.

### Reporting pattern per round

1. **At the start of the round**: one POST with a short line (e.g. `"Starting Round N — analyzing topic..."`). Body: `{"agent":"[Role Name]","text":"...", "intermediate": true}`.
2. **After Reasoning**: one POST with the full Reasoning section. Body: `{"agent":"[Role Name]","text":"<Reasoning>", "intermediate": true}`.
3. **After Details**: one POST with the full Details section. Body: `{"agent":"[Role Name]","text":"<Details>", "intermediate": true}`.
4. **Final response**: one POST with the complete response (Vote + Reasoning + Details). Body: `{"agent":"[Role Name]","text":"<full response>"}` — do **not** include `intermediate`, or use `"intermediate": false`.

**Rules**:
- Same Report URL for all POSTs within a round
- Prefer full text always; only truncate if the shell rejects the command for length
- Example: `curl -X POST "<Report URL>" -H "Content-Type: application/json" -d '{"agent":"[Role Name]","text":"...", "intermediate": true}'`
