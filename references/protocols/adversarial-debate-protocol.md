# Protocol: Adversarial Debate

> Structured debate with opposing advocates and a neutral moderator. Advocates present positions with evidence, rebut each other directly, then the moderator synthesizes a final recommendation.

---

## Configuration

- **max-rounds**: 4
- **vote-options**: FAVOR_A, FAVOR_B, SPLIT, ABSTAIN
- **moderator-label**: RECOMMENDATION

---

## Vote Semantics

| Vote | Who | Meaning | Effect |
|------|-----|---------|--------|
| **FAVOR_A** | Advocate / Analyst | Position A is stronger based on evidence | Recorded in round log; informs moderator verdict |
| **FAVOR_B** | Advocate / Analyst | Position B is stronger based on evidence | Recorded in round log; informs moderator verdict |
| **SPLIT** | Advocate / Analyst | Neither position clearly wins; trade-offs are balanced | Signals moderator to weigh carefully; moderator must still issue a recommendation |
| **ABSTAIN** | Advocate / Analyst | Cannot assess — outside area of expertise | Excluded from tally |
| **RECOMMENDATION** | Moderator only | Final synthesized verdict after all debate rounds | Triggers output document |

### Response Quality Rules

- **Advocates** MUST cite concrete evidence (files, data, prior art, risks, cost analysis) — not opinions
- **Advocates** MUST directly address the opposing position's strongest argument in rebuttals — not strawmen
- **Analysts** (if present) MUST remain neutral; assess evidence quality, not advocate for a side
- **Moderator** does NOT advocate; they moderate, probe, synthesize, and issue the final recommendation
- **SPLIT** must include what additional information would break the tie
- **ABSTAIN** must include why the topic falls outside the role's expertise

---

## Response Format (mandatory for ALL participants)

### Advocate / Analyst format (all rounds except final moderator verdict):

```markdown
## [Role Name] — Round {N}

**Vote**: FAVOR_A | FAVOR_B | SPLIT | ABSTAIN

**Position**:
[The case being argued — what you support and why, from your domain expertise]

**Evidence**:
[Concrete citations: files, metrics, architectural constraints, prior decisions, risk data.
Be specific — no assertions without backing.]

**Counter-argument**:
[Address the opposing position's strongest argument from the previous round.
In Round 1 opening statements, address the anticipated strongest counter-argument instead.]
```

### Moderator format (final round verdict):

```markdown
## Moderator — Round {N} Verdict

**Vote**: RECOMMENDATION

**Verdict Summary**:
[One-sentence statement of the recommended position or path forward]

**Reasoning**:
[How you weighed the evidence from both sides. Reference specific arguments from specific rounds.
Do not take sides on opinion — only weigh evidence quality and relevance.]

**Residual Risks**:
[What could go wrong with the recommendation. What conditions would invalidate it.]
```

---

## Consensus Rules

1. **Resolution** = the moderator issues a RECOMMENDATION after debate rounds complete — there is no vote-based consensus
2. The moderator's RECOMMENDATION is the terminal outcome of the protocol
3. If both advocates vote FAVOR_A or both vote FAVOR_B (convergence), the moderator MAY issue a RECOMMENDATION early without completing remaining rounds
4. If an advocate explicitly concedes their position mid-debate, the moderator may terminate early and issue a RECOMMENDATION
5. **SPLIT majority**: if all non-abstaining advocates vote SPLIT, the moderator MUST still issue a RECOMMENDATION with explicit reasoning for the chosen direction, plus a "conditions for revisiting" note
6. **Maximum rounds** per topic: as configured above
7. If max rounds are reached without early termination, the moderator issues a RECOMMENDATION regardless of advocate positions
8. If the moderator cannot recommend either position (irreconcilable factual conflict), write `escalation.md`

---

## Escalation Rules

| Condition | Action |
|-----------|--------|
| Advocates converge (both favor same position) | Moderator issues early RECOMMENDATION — write `recommendation.md` |
| Debate completes (max rounds or moderator ready) | Moderator issues RECOMMENDATION — write `recommendation.md` |
| One advocate concedes | Moderator issues early RECOMMENDATION — write `recommendation.md` |
| Factual deadlock (advocates cite contradictory facts) | Type B HITL: `ask_operator` for clarifying data before continuing |
| Moderator cannot recommend (irreconcilable conflict) | Write `escalation.md` with both positions and trade-offs for human decision |

---

## Deliberative Cycle

### Round 1: Opening Statements

Send the topic to all advocates simultaneously. Each presents their initial position with evidence (no opponent response to rebut yet — address the anticipated strongest counter-argument). Moderator observes and may pose clarifying questions to both sides.

### Round 2: Rebuttals

Each advocate responds directly to the opposing position's Round 1 arguments. Must address the strongest points made, not strawmen. Moderator identifies areas of factual agreement and documents remaining disputes.

### Round 3+ (if configured): Cross-Examination

Moderator poses specific questions to each advocate about weaknesses in their position or gaps in their evidence. Advocates respond. **Peer messaging between advocates is enabled** for direct challenges and clarifications.

### Final Round: Moderator Verdict Draft

Moderator synthesizes all rounds into a RECOMMENDATION. Before writing the final output:

**Type C HITL checkpoint**: `ask_operator` with options **approve** / **revise: [feedback]** / **stop** for the moderator verdict summary. Proceed to write `recommendation.md` only after operator approval.

### After Each Round: Coordinator Synthesis (non-final rounds)

1. List each participant's vote and key arguments — no response omitted
2. Identify points of factual agreement between advocates
3. Identify remaining disputes and specific evidence gaps
4. Frame the next round's focus: what questions need resolution and for whom

---

## Output Formats

All output files go in `Sessions/{{TOPIC_SLUG}}/`. Create the directory if it doesn't exist.

### After Every Round — Individual Response Files

Before writing the round synthesis, write each participant's response to a separate file:
`Sessions/{{TOPIC_SLUG}}/round-{n}-{role-slug}.md`

Use the participant's kebab-case role slug. Each file uses YAML frontmatter + full verbatim response:

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

## Advocate Positions

### [Advocate A Role]
**Vote**: ...
**Position**: ...
**Evidence**: ...
**Counter-argument**: ...

### [Advocate B Role]
**Vote**: ...
**Position**: ...
**Evidence**: ...
**Counter-argument**: ...

### [Analyst Role] (if present)
**Vote**: ...
**Assessment**: ...

## Moderator Round Summary

**Areas of factual agreement**: ...
**Remaining disputes**: ...
**Evidence gaps identified**: ...
**Focus for next round** (if applicable): ...
```

### On Recommendation — `recommendation.md`

Write `Sessions/{{TOPIC_SLUG}}/recommendation.md` using the recommendation output template:

```markdown
# Recommendation — {{TOPIC}}

**Reached at**: Round {N}
**Moderator**: [Role Name]
**Participants**: [list with final votes]

## Executive Summary

[One paragraph — the recommended position and the single most decisive factor]

## Context

[The decision that was debated — what the council was asked to assess]

## Position A

[Summary of Position A's strongest arguments and supporting evidence]

## Position B

[Summary of Position B's strongest arguments and supporting evidence]

## Moderator Verdict

[Full moderator reasoning — how evidence from both sides was weighed.
Reference specific rounds and arguments.]

## Recommendation

[The recommended position or path forward, stated concisely]

## Risks and Mitigations

[Risks with the recommendation; conditions that would invalidate it; mitigations]

## Open Questions

[Unresolved questions that the recommendation does not address — for future consideration]

## Next Steps

[Concrete actions following from the recommendation]

## Deliberation Trail

[Summary of rounds: what shifted between rounds, key evidence exchanges, how the moderator reached the verdict]
```

### On Escalation — `escalation.md`

Write `Sessions/{{TOPIC_SLUG}}/escalation.md`:

```markdown
# Escalation — {{TOPIC}}

**Rounds completed**: {N}
**Outcome**: Moderator unable to issue recommendation — human decision required

## Position A — Final State

[Position A's strongest arguments and supporting evidence after all rounds]

## Position B — Final State

[Position B's strongest arguments and supporting evidence after all rounds]

## Areas of Agreement

[Specific points both advocates agreed on during the debate]

## Irreconcilable Disagreements

[Specific factual or value conflicts that could not be resolved, with each side's argument]

## Why No Recommendation Was Possible

[The specific conflict or missing information that prevented the moderator from recommending]

## What Would Help

[What additional information, analysis, or authority would allow a decision to be made]
```

---

## Behavioral Rules (Coordinator)

- **Neutrality**: the moderator does not take a side. Probe both positions with equal rigor.
- **Fairness**: ensure equal speaking opportunity for both advocates across rounds.
- **Evidence focus**: redirect emotional or opinion-based arguments back to concrete evidence. Ask for citations.
- **Completeness**: every advocate's argument must be fully represented in round logs. Do not summarize away nuance.
- **Transparency**: when issuing RECOMMENDATION, explicitly state which evidence from each side was most persuasive and why.
- **Peer messaging**: enable direct advocate-to-advocate messaging for rebuttals and cross-examination rounds.
- **Early termination**: if both advocates converge or one concedes, do not force additional rounds. Issue RECOMMENDATION immediately.
- **HITL before finalizing**: always use the Type C checkpoint before writing `recommendation.md`. Do not skip it.
- **Structured output**: when writing `recommendation.md`, populate all sections above — no ad-hoc formats.

---

## Console Reporting (optional)

When enabled, each participant sends multiple HTTP POSTs per round to a Report URL for live progress updates.

### Reporting pattern per round

1. **At the start of the round**: one POST with a short line (e.g. `"Starting Round N — building argument..."`). Body: `{"agent":"[Role Name]","text":"...", "intermediate": true}`.
2. **After Position**: one POST with the Position section. Body: `{"agent":"[Role Name]","text":"<Position>", "intermediate": true}`.
3. **After Evidence**: one POST with the Evidence section. Body: `{"agent":"[Role Name]","text":"<Evidence>", "intermediate": true}`.
4. **Final response**: one POST with the complete response (Vote + Position + Evidence + Counter-argument). Body: `{"agent":"[Role Name]","text":"<full response>"}` — do **not** include `intermediate`, or use `"intermediate": false`.

For the moderator's final verdict: report the Verdict Summary as intermediate, then the full RECOMMENDATION as the final non-intermediate POST.

**Rules**:
- Same Report URL for all POSTs within a round
- Prefer full text always; only truncate if the shell rejects the command for length
- Example: `curl -X POST "<Report URL>" -H "Content-Type: application/json" -d '{"agent":"[Role Name]","text":"...", "intermediate": true}'`
