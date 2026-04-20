# Story Refinery — Shared Context

> This file is loaded by ALL agents (Story Analyst + teammates).
> It defines the refinement protocol and rules that every participant must follow.

@CONTEXT.md

---

## Purpose

This council takes the **output of a deliberative council** (round logs, decision.md, findings.md, and draft stories) and refines it into **self-contained, implementation-ready user stories**. Each refined story must contain all the information a developer (or Claude Code) needs to implement it without reading any other document.

The topic you receive is the **path to a deliberation output folder** (relative to `council-console/`). That folder contains:

| File | Content |
|------|---------|
| `round-{n}.md` | Each round's votes, reasoning, and coordinator synthesis |
| `decision.md` | The agreed proposal, user stories summary, architectural decisions, test strategy |
| `findings.md` | Executive summary of key insights |
| `stories/*.md` | Draft stories (may be incomplete — your job is to refine them) |

---

## Refinement Protocol

### Participants

| Role | Type | Responsibility |
|------|------|----------------|
| **Story Analyst** | Lead Agent | Reads all deliberation output, identifies gaps in existing stories and missing stories, coordinates the refinement cycle |
| **Code Archaeologist** | Teammate | Reads the actual source code referenced by the stories and produces the missing code excerpts, interfaces, function signatures, and test vectors that stories need to be self-contained |
| **Acceptance Gate** | Teammate | Validates each story against self-containment criteria: can this story be implemented by Claude Code without needing to read anything else? |

### Refinement Cycle

```
[Topic: path to deliberation output]
       |
       v
[Story Analyst reads all files, produces gap analysis]
       |
       v
[Round 1: distribute gap analysis to teammates]
       |
       v
[Code Archaeologist: fills code gaps]
[Acceptance Gate: validates completeness]
       |
       v
[Story Analyst: assembles refined stories]
       |
       v
   All stories COMPLETE?
  /           \
YES             NO
 |               |
 v               v
[Write output]  [Round 2 with remaining gaps]
                 (max 2 rounds)
```

1. **Story Analyst** reads all deliberation output files and existing stories, produces a gap analysis listing what each story is missing
2. Each teammate responds with their analysis and contributions
3. **Story Analyst** assembles the refined stories based on teammate contributions
4. If all stories pass the Acceptance Gate, write the output
5. If gaps remain, run a second round focused on the remaining gaps
6. Maximum 2 rounds — refinement, not debate

---

## Response Format (mandatory for ALL participants)

Every response from a teammate MUST follow this exact structure:

```markdown
## [Role Name] — Round {N} Response

**Assessment**: COMPLETE | GAPS_FOUND | ENRICHED

**Summary**:
[High-level assessment of the stories' readiness from your perspective.]

**Per-Story Analysis**:
[For each story, your specific contribution — code excerpts, validation results, or gap identification.]
```

### Assessment Semantics

| Assessment | Meaning | Who uses it |
|------------|---------|-------------|
| **COMPLETE** | All stories I've reviewed are self-contained and ready | Acceptance Gate (validation passed) |
| **GAPS_FOUND** | I've identified specific gaps that must be filled | Acceptance Gate (validation failed), Story Analyst (missing stories) |
| **ENRICHED** | I've produced the missing code excerpts, interfaces, or test vectors | Code Archaeologist (filling gaps) |

### Quality Rules

- **Inline everything**: when providing code excerpts, include the full function/interface/type — not just a file path and line reference
- **Be specific**: "the story needs the ComposePrompt implementation" is not enough — provide the actual implementation or a precise specification
- **Self-containment test**: for each story, ask "can Claude Code implement this with ONLY this document?" If not, what's missing?
- **No new architecture**: you are refining existing decisions, not redesigning. If you find an architectural issue, note it but don't change the agreed approach
- **Preserve story identity**: don't merge or split stories unless the Acceptance Gate flags a specific INVEST violation

---

## Consensus Rules (adapted for refinement)

1. **Done** = Acceptance Gate assesses all stories as COMPLETE
2. Any **GAPS_FOUND** triggers a targeted round focused only on the identified gaps
3. **Maximum 2 rounds** — if gaps persist after round 2, the Story Analyst writes the best available output with explicit "KNOWN GAPS" sections in affected stories
4. There is no REJECT/OBJECT/APPROVE here — this is refinement, not debate

---

## Output Format

All output goes in `council-log/{{TOPIC_SLUG}}/`.

### After Every Round

Write `council-log/{{TOPIC_SLUG}}/round-{n}.md` with the standard structure (each participant's response + Story Analyst synthesis).

### Final Output

Write refined stories to `council-log/{{TOPIC_SLUG}}/stories-refined/`:

```
stories-refined/
  01-story-name.md
  02-story-name.md
  ...
  NN-story-name.md
```

Each refined story MUST follow this template:

```markdown
# Story {NN}: {Title}

## User Story

As a [role],
I want [capability],
So that [benefit].

## Context

[Why this story exists, what deliberation decision it implements, and any architectural constraints from the council decision.]

## Acceptance Criteria

- [ ] [Specific, testable criterion with HTTP status codes, JSON fields, etc.]
- [ ] [Error scenario criterion]
- [ ] ...

## Reference Code

[All source code that the implementer needs to see — inlined, not referenced by path.
This includes: TypeScript functions being ported, interfaces, type definitions,
existing test patterns, configuration schemas.]

### {Source file 1 purpose}

```typescript
// From: {original-path}:{line-range}
{full function/interface/type code}
```

### {Source file 2 purpose}

```typescript
{full function/interface/type code}
```

## Implementation Tasks

1. **{Task title}** — {description with enough detail to implement}
   - Files to create/modify: {list}
   - Key implementation notes: {specifics}

2. **{Task title}** — ...

## Test Vectors

[Concrete input/output pairs for the key logic in this story.]

| Input | Expected Output | Notes |
|-------|----------------|-------|
| {value} | {value} | {why} |

## Dependencies

- **Requires**: [stories that must be implemented first, if any]
- **Blocks**: [stories that depend on this one]
- **Packages affected**: [list of packages this story touches]

## Known Gaps (if any)

[Anything that could not be resolved during refinement. Each gap includes what's missing and a suggested approach for the implementer.]
```

Also write `council-log/{{TOPIC_SLUG}}/decision.md` summarizing the refinement outcome:
- How many stories were refined
- How many gaps were found and filled
- Any known gaps that remain
- The recommended implementation order

---

## Domain Context

This council refines stories for the **Council Console** product — TypeScript apps under `council-console/`. The agents have access to the actual source code via `additionalDirs`.

### Source Code Locations

| Module | Path (from council-console root) | Key files |
|--------|----------------------------------|-----------|
| Console Server | `src/council-console-server/` | `server.ts`, `council-run.ts`, `run-manager.ts` |
| Console UI | `src/council-console-ui/` | `App.tsx`, `useRunStream.ts`, `ConsolePanel.tsx` |
| Webhook Server | `src/webhook-server/` | `server.ts`, `webhook-handler.ts`, `session-manager.ts` |
| Log Viewer | `src/log-viewer/` | `App.tsx`, `SessionDetail.tsx` |
| Shared Modules | `src/shared/` | `config-loader.ts`, `prompt-composer.ts`, `claude-launcher.ts`, `stream-speaker.ts` |

### Agent Access

All agents can read source code files directly. When a story references a file or line range, the Code Archaeologist should read the actual file and inline the relevant code into the refined story.
