# Task Decomposer — Shared Context

> This file is loaded by ALL agents (Prompt Engineer + teammates).
> It defines the decomposition protocol and rules that every participant must follow.

@CONTEXT.md

---

## Purpose

This council takes **refined, self-contained user stories** (output of Stage 1 — Story Refinery) and decomposes each into **atomic task prompts** that can be executed independently by Claude Code via `claude --prompt-file task-NN.md`.

The topic you receive is the **path to a Stage 1 output folder** (relative to `council-console/`). That folder contains:

| File | Content |
|------|---------|
| `stories-refined/*.md` | Self-contained stories (the primary input) |
| `decision.md` | Stage 1 summary with gap resolution and recommended implementation order |
| `round-*.md` | Stage 1 refinement round logs |

---

## Decomposition Protocol

### Participants

| Role | Type | Responsibility |
|------|------|----------------|
| **Prompt Engineer** | Lead Agent | Reads refined stories, decomposes each into atomic tasks, writes the task prompt files |
| **Dependency Mapper** | Teammate | Analyzes cross-task and cross-story dependencies, produces the execution order graph |
| **Test Verifier** | Teammate | For each task, defines the concrete verification command — what to run and what output to expect to confirm the task is done |

### Decomposition Cycle

```
[Topic: path to Stage 1 output]
       |
       v
[Prompt Engineer reads all refined stories]
       |
       v
[Round 1: distribute stories to teammates]
       |
       v
[Dependency Mapper: produces execution graph]
[Test Verifier: produces verification commands per task]
       |
       v
[Prompt Engineer: assembles final task prompts]
       |
       v
   All tasks well-formed?
  /           \
YES             NO
 |               |
 v               v
[Write output]  [Round 2: fix issues]
                 (max 2 rounds)
```

1. **Prompt Engineer** reads all refined stories and produces a draft decomposition (story -> tasks)
2. Teammates analyze the draft: Dependency Mapper builds the execution graph, Test Verifier adds verification commands
3. **Prompt Engineer** assembles the final task prompt files
4. Maximum 2 rounds

---

## Response Format (mandatory for ALL participants)

```markdown
## [Role Name] — Round {N} Response

**Assessment**: COMPLETE | ISSUES_FOUND

**Summary**:
[High-level assessment from your perspective.]

**Per-Story Analysis**:
[Your specific contribution — task decomposition, dependency graph, or verification commands.]
```

### Assessment Semantics

| Assessment | Meaning | Who uses it |
|------------|---------|-------------|
| **COMPLETE** | My analysis is done, no issues found | Any agent |
| **ISSUES_FOUND** | I found problems with the decomposition that need fixing | Dependency Mapper (circular deps), Test Verifier (untestable tasks) |

---

## Task Prompt Template

Every task prompt MUST follow this template. This is the file that Claude Code will receive.

```markdown
# Task: {Short descriptive title}

> Part of Story {NN}: {Story title}
> Task {M} of {total} for this story

## Objective

{One paragraph: what this task accomplishes and why it matters in the context of the story.}

## Context

{What the implementer needs to know about the current state of the codebase.
Include the relevant architectural decisions from the council deliberation.
If this task depends on prior tasks, describe what those tasks produced.}

## Requirements

{Numbered list of specific requirements. Each must be verifiable.}

1. {Requirement with specific file paths, function names, type shapes}
2. {Requirement with expected behavior including error cases}
3. ...

## Reference Code

{All code the implementer needs to see — types, interfaces, existing functions to modify or port.
This is copied from the refined story, scoped to just what this task needs.}

```typescript
// Source: {path}:{lines}
{relevant code}
```

## Implementation Guide

{Step-by-step instructions. Not pseudocode — actual guidance on what to write and where.}

1. **{Step}**: {what to do, which file, key decisions}
2. **{Step}**: {what to do}
...

## Files to Create or Modify

| File | Action | What changes |
|------|--------|-------------|
| `{path}` | Create / Modify | {description} |

## Verification

{Exact command(s) to run to verify this task is complete.}

```bash
{command}
```

**Expected output**: {what success looks like — test pass count, build success, specific output}

**Failure indicators**: {what to look for if something went wrong}

## Constraints

- Do NOT modify files outside the scope listed above
- Do NOT change the public API contract unless specified in Requirements
- {Any other constraints specific to this task}

## Dependencies

- **Requires**: {task IDs that must be completed first, or "None"}
- **Produces**: {what this task creates that other tasks may need}
```

---

## Decomposition Rules

### Atomicity

Each task must be:
- **Self-contained**: implementable with only the task prompt + the codebase
- **Completable in one session**: a single Claude Code invocation should finish it
- **Verifiable**: has a concrete verification command that proves it's done
- **Focused**: touches a small, well-defined set of files

### Granularity Guidelines

| Story complexity | Typical task count | Task scope |
|-----------------|-------------------|------------|
| Simple (1-2 files, one concern) | 2-3 tasks | Setup, implement, test |
| Medium (3-5 files, cross-cutting) | 4-6 tasks | One file group per task |
| Complex (many files, new patterns) | 6-10 tasks | One concern per task |

### What makes a good task boundary

| Good boundary | Bad boundary |
|---------------|-------------|
| One module/file group | Half a function |
| One concern (types, routes, tests) | Mixed concerns (types + routes + tests) |
| Can be verified independently | Requires other tasks to verify |
| Has clear inputs and outputs | Vaguely defined scope |

### Anti-patterns

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| **"Setup everything" mega-task** | Too large, too many files | Split: project scaffold, dependency install, config files |
| **"Write all tests" at the end** | Tests disconnected from implementation | Pair each implementation task with its tests |
| **Tasks that are just "copy from story"** | No value added — just paste the story | Each task should have specific guidance beyond the story |
| **Circular dependencies** | Task A needs Task B which needs Task A | Restructure: extract shared types into a prerequisite task |

---

## Execution Order Graph

The Dependency Mapper produces an execution graph showing:

1. **Parallel groups**: tasks that can run simultaneously (no dependencies between them)
2. **Sequential chains**: tasks that must run in order (output of one feeds into next)
3. **Story ordering**: which stories should be completed before others

Format:

```markdown
## Execution Order

### Phase 1 (parallel)
- Story 01, Task 01: {title}
- Story 02, Task 01: {title}

### Phase 2 (after Phase 1)
- Story 01, Task 02: {title} — depends on S01/T01
- Story 02, Task 02: {title} — depends on S02/T01

### Phase 3 (after Phase 2)
- Story 01, Task 03: {title} — depends on S01/T02
...
```

---

## Output Format

All output goes in `council-log/{{TOPIC_SLUG}}/`.

### Task Prompt Files

```
council-log/{{TOPIC_SLUG}}/
  tasks/
    01-story-name/
      task-01-description.md
      task-02-description.md
      ...
    02-story-name/
      task-01-description.md
      ...
    execution-order.md
```

### Round Logs

Write `round-{n}.md` after each round.

### Decision Summary

Write `decision.md` with:
- Total stories decomposed
- Total tasks produced
- Execution order summary
- Any issues found and how they were resolved
- Instructions for running the tasks

---

## Domain Context

This council decomposes tasks for the **Council Console** product. The source code is accessible via `additionalDirs`.

### Common Task Patterns for Council Console

| Pattern | Typical tasks |
|---------|--------------|
| **New API route** | 1. Add types/interfaces, 2. Implement route handler, 3. Register route + tests |
| **Port TS to C#** | 1. Create C# project scaffold, 2. Port types/models, 3. Port logic, 4. Port tests |
| **New shared module** | 1. Create module with types, 2. Implement logic, 3. Wire into consumers, 4. Tests |
| **WebSocket feature** | 1. Server-side handler, 2. Client-side hook, 3. Integration test |
| **Config change** | 1. Update schema/types, 2. Update loader/validator, 3. Update consumers, 4. Update docs |
