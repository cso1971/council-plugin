---
name: prompt-crafting
description: "Techniques for writing effective Claude Code task prompts — self-contained, atomic, verifiable implementation instructions. Use when the Prompt Engineer needs to decompose stories into tasks, write task prompt files, or evaluate whether a task prompt is complete enough for autonomous Claude Code execution."
---

# Prompt Crafting — Writing Claude Code Task Prompts

Use this skill when decomposing refined stories into atomic task prompts for `claude --prompt-file`.

---

## What makes a good Claude Code prompt

Claude Code receives a task prompt as its ONLY context (besides the codebase it can read). The prompt must:

1. **State the objective clearly** — one paragraph, no ambiguity
2. **Provide all context** — architectural decisions, why this change matters
3. **Include reference code** — types, interfaces, existing functions to modify
4. **Give specific instructions** — file paths, function names, approach decisions
5. **Define verification** — how to know the task is complete
6. **Set boundaries** — what NOT to touch

---

## Decomposition Heuristics

### When to split a story into tasks

| Signal | Action |
|--------|--------|
| Story touches 3+ files in different packages | One task per package group |
| Story has setup + implementation + tests | Separate tasks (or setup+implement, then tests) |
| Story creates new infrastructure (project, config, deps) | Infrastructure is task 1, usage is task 2+ |
| Story has an independent preparatory step | Prep step is its own task |
| Story has sequential steps where each can be verified | One task per verifiable step |

### When NOT to split

| Signal | Keep together |
|--------|--------------|
| Creating a type and immediately using it in the same file | One task |
| Adding a route handler + its test (small scope) | One task |
| Changing a config value and updating one consumer | One task |

### Typical decomposition patterns

**Pattern A: Scaffold → Implement → Test**
```
task-01: Create project scaffold (files, deps, config)
task-02: Implement core logic (types + functions)
task-03: Add tests (unit + integration)
```

**Pattern B: Types → Logic → Integration**
```
task-01: Define types and interfaces
task-02: Implement business logic using those types
task-03: Wire into the application (routes, consumers)
task-04: Integration tests
```

**Pattern C: Port (TS → C#)**
```
task-01: Create C# project + models matching TS types
task-02: Port pure functions (with parity test vectors)
task-03: Port stateful logic (adapting to C# patterns)
task-04: Wire into ASP.NET app
task-05: Port/adapt tests
```

---

## Task Prompt Structure Guide

### Objective section

One paragraph. Template:
> "This task [creates/modifies/ports] [what] in [which package] to [achieve what]. This is part of Story {NN} ({title}), which [broader context from the council decision]."

**Good**: "This task creates the Vitest test infrastructure for the console server package, including the test config, mock helpers for Claude subprocess, and initial test suite for the config-loader module. This is part of Story 01 (Characterization Test Suite), which establishes a test safety net before the .NET migration begins."

**Bad**: "Set up tests."

### Context section

Include:
- What exists today (relevant parts of the codebase state)
- What the council decided (architectural decisions relevant to this task)
- What previous tasks in this story have done (if this isn't task 01)

Do NOT include:
- Full history of the deliberation (irrelevant at task level)
- Other stories' context (irrelevant to this task)

### Requirements section

Numbered list. Each requirement must be:
- **Observable**: you can see the result (a file exists, a test passes, an endpoint responds)
- **Specific**: names files, functions, types, status codes
- **Bounded**: says what's in scope AND what's out of scope

### Reference Code section

Include ONLY the code relevant to THIS task. If the story has 5 code blocks and this task needs 2, include only those 2.

Format each block with source annotation:
```typescript
// Source: src/shared/config-loader.ts:12-35
// This is the TypeScript interface your C# model must match
export interface CouncilConfig {
  maxRounds: number;
  // ...
}
```

### Implementation Guide section

Be prescriptive but not rigid. Good pattern:

```
1. **Create the test file**: `src/shared/__tests__/config-loader.test.ts`
   - Import `loadConfig` from `../config-loader`
   - Create a `tmp` directory helper for test fixtures
   - Group tests by behavior: "valid config", "invalid config", "missing file"

2. **Write valid config tests**: verify that `loadConfig()` with a well-formed JSON
   returns a typed `CouncilConfig` with all fields populated
   - Use the test vectors from the Reference Code section
   - Assert on each field individually (not snapshot)
```

### Constraints section

Always include:
- "Do NOT modify files outside the scope listed in 'Files to Create or Modify'"
- Any API contract constraints ("Do NOT change the response shape of existing endpoints")
- Any convention constraints ("Follow existing patterns in the codebase for test file naming")

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Task prompt is just the story copy-pasted | Narrow scope to this task's concern only |
| Reference code includes everything from the story | Include only code relevant to this task |
| "Implement the feature" without specifics | Name files, functions, types, approach |
| No verification section | Every task needs `Verification:` with exact command |
| Overlapping file scope with another task | One task per file group — coordinate via Dependencies |
| Assumptions about runtime state | Include Prerequisites in verification |
