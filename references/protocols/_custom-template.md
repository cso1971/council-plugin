# Protocol: [Your Protocol Name]

> [One-line description of how this protocol works]

---

## Configuration

<!-- Define protocol-level settings. The wizard reads these during generation. -->

- **max-rounds**: [number — how many rounds before escalation]
- **vote-options**: [comma-separated list of valid votes]

---

## Vote Semantics

<!-- Define each vote option, its meaning, and its effect on the cycle.
     Use a table for clarity. -->

| Vote | Meaning | Effect |
|------|---------|--------|
| **[VOTE_1]** | [What it means] | [How it affects consensus] |
| **[VOTE_2]** | [What it means] | [How it affects consensus] |

### Response Quality Rules

<!-- Rules that apply to ALL participants when responding. -->

- [Rule 1]
- [Rule 2]

---

## Response Format (mandatory for ALL participants)

<!-- The exact structure every teammate response must follow. -->

```markdown
## [Role Name] — Round {N} Response

[Define the mandatory sections here]
```

---

## Consensus Rules

<!-- How consensus is determined, what blocks it, when to stop. -->

1. **Consensus** = [define what counts as consensus]
2. [Additional rules]

---

## Escalation Rules

<!-- What happens at each termination condition. -->

| Condition | Action |
|-----------|--------|
| [Condition 1] | [Action] |
| [Condition 2] | [Action] |

---

## Deliberative Cycle

<!-- Step-by-step cycle description for the Coordinator. -->

### Round 1
[How the first round works]

### After Each Round
[What the Coordinator does after collecting responses]

### Revised Proposal Format
[Structure for revised proposals between rounds]

---

## Output Formats

<!-- Templates for all output documents. Use {{TOPIC}} and {{TOPIC_SLUG}} as runtime placeholders. -->

### Individual Response Files — `Sessions/{{TOPIC_SLUG}}/round-{n}-{role-slug}.md`

Before writing the round synthesis, write each participant's response to a separate file. Use the participant's kebab-case role slug. Each file:

```markdown
---
round: {N}
role: {role-slug}
vote: {VOTE}
---

{Full response as received — do not summarize or truncate}
```

### Round Log — `Sessions/{{TOPIC_SLUG}}/round-{n}.md`

```markdown
[Round log template]
```

### On Consensus — `Sessions/{{TOPIC_SLUG}}/decision.md`

```markdown
[Decision document template]
```

### On Early Termination — `Sessions/{{TOPIC_SLUG}}/[termination-type].md`

```markdown
[Termination document template]
```

---

## Behavioral Rules (Coordinator)

<!-- Rules governing Coordinator behavior during the cycle. -->

- [Rule 1]
- [Rule 2]

---

## Console Reporting (optional)

<!-- If your protocol supports live progress reporting, describe the pattern here. -->

[Reporting pattern description]
