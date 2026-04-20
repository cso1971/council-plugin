---
name: acceptance-validation
description: "Self-containment validation checklist and 'blind implementer' testing for AI-ready user stories. Use when the Acceptance Gate needs to validate whether stories contain everything Claude Code needs for autonomous implementation — inlined code, complete test vectors, specific acceptance criteria, and unambiguous implementation tasks."
---

# Acceptance Validation — Self-Containment for AI Implementation

Use this skill when validating whether a user story is ready to be used as a Claude Code implementation prompt.

---

## The Core Question

> "If Claude Code receives ONLY this story document as its prompt, can it produce correct, complete code?"

Every check in this skill derives from this question. A story passes if the answer is unambiguously "yes". A story fails if Claude Code would need to search, guess, or make assumptions.

---

## Self-Containment Checklist

### Critical Checks (all must pass)

#### C1: All referenced code is inlined

**Pass**: every function, type, and interface mentioned in the story has its full implementation included in a code block within the story.

**Fail examples**:
- "See `config-loader.ts` for the `CouncilConfig` type" — type not shown
- "The `toSlug()` function (described above)" — but no code block above
- "Similar to how `session-manager.ts` handles flush" — no code shown

**What "fixed" looks like**: the actual TypeScript code is in a fenced code block with source annotation.

#### C2: All types/interfaces are defined

**Pass**: every type, interface, enum, and class used in implementation tasks or acceptance criteria is defined in the story.

**Fail examples**:
- Implementation task says "create a `RunResult` type" but doesn't define its shape
- Acceptance criteria mentions `{ type: "done", status: "decision" }` but the full message schema isn't shown
- Code excerpt uses `LaunchOptions` but the type is not included

**What "fixed" looks like**: complete type definition with all fields, their types, and optionality.

#### C3: Test vectors have actual values

**Pass**: every row in every test table has concrete input and expected output values.

**Fail examples**:
- Expected output column says `<compute>`
- Empty cells in the test table
- "Expected: the correct hash" — what hash exactly?

**What "fixed" looks like**: `toSlug("Add WebSocket reconnection")` -> `"add-websocket-reconnection-a1b2c3d4"` with derivation.

#### C4: Acceptance criteria are testable

**Pass**: each criterion can be verified with a specific command, assertion, or observable outcome.

**Fail examples**:
- "The system handles errors gracefully" — what errors? what behavior?
- "Performance is acceptable" — what threshold?
- "The config is validated" — what validations? what errors on failure?

**What "fixed" looks like**: "POST /council/start with missing `configPath` returns 400 with body `{ error: 'configPath is required' }`"

#### C5: Implementation tasks name specific files

**Pass**: each task says which files to create or modify, by path relative to project root.

**Fail examples**:
- "Update the server to handle the new route" — which file?
- "Add tests" — where? what test file?
- "Modify the relevant handler" — which handler?

**What "fixed" looks like**: "Create `src/council-console-server/__tests__/routes.test.ts`" or "Modify `src/shared/config-loader.ts`"

#### C6: Error scenarios are covered

**Pass**: for each happy-path criterion, there's at least one error/edge case criterion.

**Fail examples**:
- Only describes what happens when everything works
- Mentions "invalid input" without specifying what invalid means
- No WebSocket disconnect handling for streaming features

**What "fixed" looks like**: paired criteria — "returns 201 on success" AND "returns 400 when topic is empty" AND "returns 400 when configPath doesn't exist"

---

### Important Checks (should pass, document if not)

#### I1: Dependencies are explicit

Each dependency on another story states: which story, what it provides, and why it's needed.

**Pass**: "Requires Story 01 (Characterization Test Suite) because this story's acceptance criteria assume the test infrastructure exists"

**Fail**: "Should be implemented after the test setup" — which story? why?

#### I2: Packages affected are listed

The story names every `council-console/src/` package it touches.

#### I3: No architectural ambiguity

The story prescribes ONE implementation approach, not "you could do A or B".

**Fail**: "Consider using either a Map or an object literal for the cache" — pick one.

#### I4: Code excerpts have source annotations

Every code block includes the source file path and line range for traceability.

#### I5: INVEST compliance

| Principle | Check |
|-----------|-------|
| Independent | Can be implemented without other stories being done first (or dependencies are explicit) |
| Negotiable | Describes what and why, not how (implementation details are guidance, not requirements) |
| Valuable | Delivers identifiable value to a named role |
| Estimable | Scope is clear enough to estimate effort |
| Small | Can be completed in a single focused session (1-3 days equivalent) |
| Testable | All acceptance criteria can be verified |

---

## The Blind Implementer Test

For each story, write a brief narrative from Claude Code's perspective:

```
"I received this story as my only context. Here's what I'd do:

1. I'd create {file} because task 1 tells me to...
2. I'd implement {function} using the reference code in the story...
3. I'd get stuck at {point} because {what's missing}...
4. I'd need to search for {thing} because it's not in the story..."
```

Any "get stuck" or "need to search" point is a gap.

---

## Common Failure Patterns in Council Console Stories

| Pattern | Why it happens | How to catch it |
|---------|---------------|-----------------|
| **Assumed toSlug knowledge** | Implementer is expected to "know" the slug algorithm | Check if toSlug implementation is inlined |
| **Missing ConfigError class** | Stories reference config validation but don't include the error type | Search for "ConfigError" in the story — if mentioned, must be defined |
| **WebSocket protocol gaps** | Story describes "streaming" without message format | Check for `{ type: "line" }`, `{ type: "done" }`, `{ type: "error" }` definitions |
| **Implicit Fastify patterns** | Story assumes knowledge of Fastify inject(), route registration | Check if the testing approach is described |
| **Missing .NET equivalents** | For migration stories: TypeScript shown but C# implementation not specified | Check that both source (TS) and target (C#) are present |
| **Outcome detection priority** | Story references outcome file scanning without the priority order | Check for: decision.md -> rejection.md -> escalation.md -> ... |

---

## Scoring Template

For each story, produce a score card:

```
Story NN: {Title}
Critical: {passed}/{total} — {PASS if 6/6, FAIL otherwise}
Important: {passed}/{total}
Blind implementer: {PASS if no stuck points, FAIL otherwise}
Overall: {PASS or FAIL}
Gaps: {numbered list of specific gaps}
```

A story is COMPLETE only when:
- All 6 Critical checks pass
- Blind implementer test passes
- Important checks either pass or have documented exceptions
