# Protocol: Convergent Investigation

> Parallel hypothesis investigation with evidence-based convergence. Investigators each own a hypothesis, gather evidence independently, then the coordinator synthesizes findings through iterative reduce rounds.

---

## Configuration

- **max-rounds**: 4
- **vote-options**: SUPPORTED, WEAK, REFUTED, INCONCLUSIVE

---

## Vote Semantics

| Vote | Meaning | Effect |
|------|---------|--------|
| **SUPPORTED** | Evidence strongly supports this hypothesis | Hypothesis advances to findings as a confirmed conclusion |
| **WEAK** | Some evidence exists but is insufficient or contradictory | Hypothesis is deprioritized; may need more investigation or be noted with low confidence |
| **REFUTED** | Evidence contradicts this hypothesis | Hypothesis is eliminated from findings as a ruled-out alternative |
| **INCONCLUSIVE** | Unable to gather enough evidence to assess this hypothesis | Hypothesis remains open; may trigger additional round or be listed as a data gap |

### Response Quality Rules

- **Cite concrete evidence** for every hypothesis status claim — files, data, logs, metrics, prior art, test results
- **State falsification criteria**: what specific evidence would change your SUPPORTED to REFUTED, or resolve an INCONCLUSIVE
- **Stay on your assigned hypothesis** unless the coordinator explicitly reassigns you
- **Note cross-hypothesis impacts**: if your investigation reveals evidence relevant to another investigator's hypothesis, flag it explicitly in the Cross-hypothesis notes section
- **INCONCLUSIVE must be specific**: state exactly what data, access, or analysis is missing and why it matters

---

## Response Format (mandatory for ALL participants)

```markdown
## [Role Name] — Round {N}

**Vote** (hypothesis status): SUPPORTED | WEAK | REFUTED | INCONCLUSIVE

**Hypothesis**:
[The specific claim you are investigating — restate it clearly each round]

**Evidence**:
[Concrete findings with citations: files, data, observations, measurements.
What you found and where. Be specific.]

**Falsification criteria**:
[What evidence would change your assessment. What would make SUPPORTED become REFUTED,
or what would resolve an INCONCLUSIVE. If REFUTED, state what evidence contradicted it.]

**Cross-hypothesis notes** (if applicable):
[Evidence you found that is relevant to another investigator's hypothesis.
Name the hypothesis and the evidence explicitly.]
```

---

## Consensus Rules

1. **Convergence** = all hypotheses have reached a non-INCONCLUSIVE status (SUPPORTED, WEAK, or REFUTED)
2. Convergence triggers the coordinator to write the findings document
3. **Partial convergence**: if at least one hypothesis is SUPPORTED and all others are REFUTED or WEAK, the coordinator may write findings immediately — no need to wait for INCONCLUSIVE hypotheses to resolve if the supported hypothesis is clear
4. **All REFUTED**: if every hypothesis is REFUTED, the coordinator writes findings noting that all hypotheses were eliminated — the conclusion is that the investigated causes are not responsible; suggest new hypotheses
5. If some hypotheses remain INCONCLUSIVE after a round, the coordinator may: (a) assign focused investigation for another round, (b) enable peer messaging for cross-hypothesis evidence exchange, or (c) accept INCONCLUSIVE and document as data gaps in findings
6. **Maximum rounds** per topic: as configured above
7. If no convergence after max rounds: coordinator writes `escalation.md` with ranked hypotheses and explicit data gaps

---

## Escalation Rules

| Condition | Action |
|-----------|--------|
| All hypotheses reach non-INCONCLUSIVE status | Full convergence — write `findings.md` |
| 1+ SUPPORTED, rest REFUTED or WEAK | Partial convergence — write `findings.md` with confidence levels |
| All hypotheses REFUTED | No hypothesis survived — write `findings.md` noting elimination; suggest new hypotheses |
| Max rounds with INCONCLUSIVE remaining | Write `escalation.md` with ranked hypotheses and data gaps |
| New hypothesis emerges mid-investigation | Coordinator may reassign an investigator or open a new round |
| Scope too broad after Round 1 | Type A HITL: `ask_operator` to narrow scope or add investigators |

---

## Deliberative Cycle

### Round 1: Parallel Investigation

Spawn all investigators **in parallel with no cross-dependencies**. Each investigates only their assigned hypothesis. No cross-talk in Round 1 unless configuration explicitly enables peer messaging from the start.

### After Each Round: Coordinator Reduce

Once all investigators have responded, the Coordinator MUST:

1. **List each investigator's hypothesis, status, and key evidence** — no response omitted
2. **Identify cross-hypothesis connections**: evidence from one investigator that impacts another's hypothesis
3. **Check for convergence**: are all hypotheses non-INCONCLUSIVE?
4. **If converged** → write findings document
5. **If not converged** → identify which hypotheses need more work; enable peer messaging if helpful; compose focused questions for INCONCLUSIVE investigators; broadcast next round
6. **Type A HITL checkpoint** after major synthesis beats: `ask_operator` — continue / refine scope / stop. **TIMEOUT** → continue with an explicit note in the round file.

### Subsequent Rounds: Focused Investigation

Investigators refine based on coordinator feedback. May receive cross-hypothesis evidence from peers. Focus narrows:
- **SUPPORTED hypotheses**: deepen evidence — what would increase confidence further?
- **WEAK hypotheses**: seek decisive evidence — what single test or data point would resolve this?
- **INCONCLUSIVE hypotheses**: try a new angle — what is a feasible path to evidence given current access?

### Final Reduce Phase: Findings Synthesis

Coordinator produces a single findings narrative: hypotheses tested, evidence map, conclusion, residual uncertainty. **Type A HITL** before finalizing: `ask_operator` — approve / refine scope. Write `findings.md` only after checkpoint.

---

## Output Formats

All output files go in `Sessions/{{TOPIC_SLUG}}/`. Create the directory if it doesn't exist.

<!-- ROUND_ARTIFACT_FORMATS_START -->

### After Every Round — Round Synthesis

Write `Sessions/{{TOPIC_SLUG}}/round-{n}.md`:

```markdown
# Round {N} — {{TOPIC}}

## Investigator Reports

### [Investigator 1 Role] — [Hypothesis 1]
**Vote**: ...
**Hypothesis**: ...
**Evidence**: ...
**Falsification criteria**: ...
**Cross-hypothesis notes**: ...

### [Investigator 2 Role] — [Hypothesis 2]
**Vote**: ...
**Hypothesis**: ...
**Evidence**: ...
**Falsification criteria**: ...
**Cross-hypothesis notes**: ...

[…repeat per investigator…]

## Coordinator Synthesis

**Convergence check**: [Yes / No — which hypotheses remain INCONCLUSIVE]
**Cross-hypothesis connections**: [Evidence from one investigator that affects another's hypothesis]
**Hypothesis status summary**:
- [Hypothesis 1]: SUPPORTED / WEAK / REFUTED / INCONCLUSIVE — [one-line reason]
- [Hypothesis 2]: ...
**Next round focus** (if applicable): [Which hypotheses need more work and what specific questions]
```

<!-- ROUND_ARTIFACT_FORMATS_END -->

<!-- FINAL_OUTPUT_FORMATS_START -->

### On Convergence — `findings.md`

Write `Sessions/{{TOPIC_SLUG}}/findings.md` using the findings output template:

```markdown
# Findings — {{TOPIC}}

**Reached at**: Round {N}
**Participants**: [list of investigators with final hypothesis status]

## Executive Summary

[One paragraph — the main conclusion and most decisive evidence]

## Context

[What was investigated — the original question and why these hypotheses were formed]

## Hypotheses Tested

### [Hypothesis 1] — [Final Status: SUPPORTED / WEAK / REFUTED]

- **Assigned to**: [Investigator Role]
- **Hypothesis**: [The specific claim investigated]
- **Status**: [Final vote]
- **Evidence summary**: [Key evidence that determined this status]
- **Confidence**: [High / Medium / Low — based on evidence quality and completeness]

[…repeat per hypothesis…]

## Evidence

[Evidence map: the most important findings across all investigators, with citations.
Group by theme or by hypothesis as appropriate.]

## Conclusion

[The answer to the original question, grounded in the evidence above.
What the investigation found, and what it rules out.]

## Risks and Mitigations

[Residual uncertainty; what could invalidate the conclusion; recommended safeguards]

## Open Questions

[Questions that remain unanswered — data gaps, untested hypotheses, experiments still needed]

## Next Steps

[Concrete actions following from the findings]

## Deliberation Trail

[Summary of rounds: how the investigation evolved, what shifted, how convergence was reached]
```

### On Escalation — `escalation.md`

Write `Sessions/{{TOPIC_SLUG}}/escalation.md`:

```markdown
# Escalation — {{TOPIC}}

**Rounds completed**: {max-rounds}
**Convergence**: Not reached — INCONCLUSIVE hypotheses remain

## Hypothesis Status at Escalation

| Hypothesis | Investigator | Status | Evidence Quality |
|------------|--------------|--------|-----------------|
| [H1] | [Role] | SUPPORTED / WEAK / REFUTED / INCONCLUSIVE | High / Medium / Low |
| [H2] | [Role] | ... | ... |

## Data Gaps Preventing Resolution

[For each INCONCLUSIVE hypothesis:
- What data or access is missing
- Why it matters for the conclusion
- Whether it is feasibly obtainable]

## Ranked Hypotheses (by evidence strength)

1. [Most likely hypothesis and why]
2. [Second most likely]
3. ...

## Cross-Hypothesis Insights

[Any relationships between hypotheses discovered during investigation]

## Coordinator Recommendation

[Your recommendation for the human: which hypothesis to act on given current evidence,
what to investigate next, and under what conditions you would revisit this conclusion]
```

<!-- FINAL_OUTPUT_FORMATS_END -->

---

## Behavioral Rules (Coordinator)

- **Neutrality**: do not favor any hypothesis. Let evidence drive convergence, not prior beliefs.
- **Completeness**: every investigator's evidence must be fully represented in round logs. Do not omit inconvenient findings.
- **Transparency**: when writing findings, trace every conclusion back to specific evidence from specific rounds.
- **Efficiency**: if all hypotheses converge in Round 1, do not force additional rounds. Write findings immediately.
- **Evidence over authority**: a hypothesis is SUPPORTED or REFUTED by evidence, not by how many investigators agree or how senior the investigator is.
- **Peer exchange facilitation**: when one investigator's evidence is relevant to another's hypothesis, actively surface the connection in the round synthesis and enable peer messaging for the next round.
- **Escalation awareness**: if an investigator reports the same INCONCLUSIVE status with no new evidence for 2+ rounds, flag the stall. Recommend scope narrowing, hypothesis replacement, or external data acquisition.
- **HITL before finalizing**: always use the Type A checkpoint before writing `findings.md`. Do not skip it.
- **Structured output**: when writing `findings.md`, populate all sections above — no ad-hoc formats.

---

## Console Reporting (optional)

When enabled, each investigator sends multiple HTTP POSTs per round to a Report URL for live progress updates.

### Reporting pattern per round

1. **At the start of the round**: one POST with a short line (e.g. `"Starting Round N — investigating hypothesis..."`). Body: `{"agent":"[Role Name]","text":"...", "intermediate": true}`.
2. **After Evidence**: one POST with the Evidence section. Body: `{"agent":"[Role Name]","text":"<Evidence>", "intermediate": true}`.
3. **After Falsification criteria**: one POST with the Falsification criteria section. Body: `{"agent":"[Role Name]","text":"<Falsification criteria>", "intermediate": true}`.
4. **Final response**: one POST with the complete response (Vote + Hypothesis + Evidence + Falsification + Cross-hypothesis). Body: `{"agent":"[Role Name]","text":"<full response>"}` — do **not** include `intermediate`, or use `"intermediate": false`.

**Rules**:
- Same Report URL for all POSTs within a round
- Prefer full text always; only truncate if the shell rejects the command for length
- Example: `curl -X POST "<Report URL>" -H "Content-Type: application/json" -d '{"agent":"[Role Name]","text":"...", "intermediate": true}'`
