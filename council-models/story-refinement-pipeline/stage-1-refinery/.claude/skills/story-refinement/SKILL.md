---
name: story-refinement
description: "Story gap analysis, refinement strategies, and self-containment patterns for transforming draft council deliberation stories into implementation-ready documents. Use when the Story Analyst needs to identify gaps, prioritize refinement work, or assemble final stories from teammate contributions."
---

# Story Refinement — Gap Analysis and Assembly

Use this skill when analyzing deliberation output and producing refined, self-contained stories.

---

## Gap Analysis Framework

When reading a draft story, systematically check for these gap categories:

### 1. Code Reference Gaps

**Pattern**: story mentions source code but doesn't include it.

| Signal | Example | What's needed |
|--------|---------|---------------|
| File + line reference | "see `council-run.ts:248-274`" | Full function body inlined |
| Type name without definition | "uses `CouncilConfig` interface" | Complete type/interface definition |
| Algorithm description without code | "the toSlug function normalizes and hashes" | Actual implementation |
| "Similar to" comparison | "similar to how session-manager.ts handles it" | The actual session-manager code for comparison |

**Resolution**: assign to Code Archaeologist with specific file paths and line ranges.

### 2. Test Vector Gaps

**Pattern**: story has test tables with incomplete data.

| Signal | Example | What's needed |
|--------|---------|---------------|
| Placeholder values | `<compute>`, `TBD`, `...` | Actual computed values |
| Missing edge cases | Only happy path vectors | Boundary conditions, error inputs |
| No expected errors | Missing error message text | Exact error messages from source |

**Resolution**: assign to Code Archaeologist to trace logic and compute values.

### 3. Acceptance Criteria Gaps

**Pattern**: criteria are vague or incomplete.

| Signal | Example | What's needed |
|--------|---------|---------------|
| Vague error handling | "handles errors gracefully" | Specific HTTP status + error body |
| Missing edge cases | Only happy path criteria | Error scenarios, boundary conditions |
| No WebSocket specifics | "streaming works" | Message types, ordering, lifecycle |
| No file paths | "writes the output" | Exact file path pattern |

**Resolution**: fill from `decision.md` architectural decisions + source code patterns.

### 4. Implementation Task Gaps

**Pattern**: tasks are too high-level to act on.

| Signal | Example | What's needed |
|--------|---------|---------------|
| No file names | "update the relevant module" | Specific file to create/modify |
| No approach specified | "implement retry logic" | Which retry strategy, what triggers it |
| Missing steps | "port the TypeScript to C#" | Step-by-step: what maps to what |
| No test guidance | Task without verification | How to verify the task is done |

**Resolution**: fill from source code analysis + architectural decisions.

### 5. Missing Stories

**Pattern**: `decision.md` describes work that has no expanded story.

**Detection**: compare the story list in `decision.md` with files in `stories/`. Any story mentioned in the decision but without an expanded `.md` file is missing.

**Resolution**: generate the missing story using:
- The summary in `decision.md`
- Relevant sections from round logs (where the story was discussed)
- Code Archaeologist's excerpts from the relevant source files

---

## Refinement Priority

When multiple gaps exist, prioritize:

1. **Missing stories** — highest priority, they represent entire unrefined work items
2. **Missing code references** — without these, the story is not self-contained
3. **Incomplete test vectors** — implementer can't verify their work
4. **Vague acceptance criteria** — can lead to wrong implementation
5. **High-level tasks** — less critical if criteria and code are solid

---

## Story Assembly Checklist

When assembling a refined story from teammate contributions:

- [ ] User story follows "As a [specific role], I want [capability], So that [benefit]"
- [ ] Context section links to the council decision and explains why this story exists
- [ ] ALL code excerpts from Code Archaeologist are inlined with source annotations
- [ ] ALL test vectors have actual values (no placeholders)
- [ ] Acceptance criteria are specific (HTTP codes, JSON fields, file paths, error messages)
- [ ] Implementation tasks name specific files and approaches
- [ ] Dependencies on other stories are explicit with reasons
- [ ] Packages affected are listed
- [ ] Acceptance Gate's feedback is addressed (all Critical checks pass)
- [ ] Known Gaps section exists if any gaps couldn't be resolved

---

## Numbering Convention

- Preserve original story numbers from the deliberation (01, 02, ...)
- New stories (generated for missing items) get the next sequential number
- If the deliberation had stories 01-05 and you generate 2 new ones, they become 06 and 07
- Never renumber existing stories — downstream references may depend on them

---

## Story Independence Assessment

For each story, evaluate:

| Question | If YES | If NO |
|----------|--------|-------|
| Can this story be implemented without any other story being done first? | Mark as independent | List explicit dependencies |
| Does this story modify files that another story also modifies? | Note the overlap for dependency-mapper in Stage 2 | Mark as independent |
| Does this story produce artifacts (types, interfaces, config) that other stories consume? | It's a foundation story — should be implemented first | Normal priority |
