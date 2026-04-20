---
name: dependency-analysis
description: "Dependency graph construction, phase grouping, critical path analysis, and circular dependency resolution for task decomposition. Use when the Dependency Mapper needs to analyze cross-task relationships, produce execution order graphs, or detect and resolve dependency problems."
---

# Dependency Analysis — Execution Order and Parallelism

Use this skill when building dependency graphs for decomposed task sets.

---

## Dependency Types

### Data Dependency

Task B uses something that Task A creates (type, function, module, file).

```
S01/T01 creates: src/shared/__tests__/helpers/mock-claude.ts
S01/T03 imports: ../helpers/mock-claude

Edge: S01/T01 → S01/T03 (data: mock-claude helper)
```

### File Conflict

Two tasks modify the same file. They must be sequential to avoid merge conflicts.

```
S04/T02 modifies: src/council-console-server/server.ts (add routes)
S04/T03 modifies: src/council-console-server/server.ts (add middleware)

Edge: S04/T02 → S04/T03 (file conflict: server.ts)
```

**Resolution**: order by logical dependency (routes before middleware that uses them).

### Cross-Story Dependency

A task in Story B assumes something from Story A exists.

```
S02/T01 creates: CouncilConsole.Server.csproj (.NET project)
S04/T01 creates: controllers in CouncilConsole.Server

Edge: S02/T01 → S04/T01 (cross-story: project must exist before adding controllers)
```

### Test Dependency

Test task needs the implementation it's testing to exist.

```
S01/T02 creates: config-loader.test.ts
S01/T02 tests: config-loader.ts (which already exists)

No edge needed — the module under test already exists in the codebase.
```

But:
```
S02/T02 creates: ConfigLoader.cs
S02/T03 creates: ConfigLoaderTests.cs (tests ConfigLoader.cs)

Edge: S02/T02 → S02/T03 (test dependency)
```

---

## Graph Construction Algorithm

1. **Inventory**: list all tasks with their creates/modifies/reads sets
2. **Edge detection**: for each pair of tasks, check all dependency types
3. **Transitive reduction**: remove edges that are implied by transitivity (A→B→C means A→C is redundant)
4. **Phase grouping**: tasks with no incoming edges form Phase 1; remove them, repeat for Phase 2, etc.
5. **Critical path**: the longest chain of sequential tasks (determines minimum execution time)

---

## Phase Grouping

### Rules

1. **Phase 1**: all tasks with zero incoming dependencies
2. **Phase N+1**: all tasks whose dependencies are ALL in Phase N or earlier
3. Tasks in the same phase CAN run in parallel
4. Tasks in different phases MUST run sequentially (Phase 1 before Phase 2, etc.)

### Example

```
Dependencies:
  S01/T01 → S01/T02
  S01/T01 → S02/T01
  S02/T01 → S02/T02
  S01/T02 → S04/T01

Phase 1: S01/T01 (no deps)
Phase 2: S01/T02, S02/T01 (both depend only on Phase 1)
Phase 3: S02/T02, S04/T01 (depend on Phase 2)
```

---

## Common Patterns in Council Console Tasks

### Foundation pattern

Story 01 (test infrastructure) is almost always Phase 1 — everything else depends on having tests.

```
Phase 1: S01/T01 (setup Vitest)
Phase 1: S02/T01 (create .NET scaffold)  ← independent of S01
Phase 2: S01/T02 (write config tests) — needs Vitest
Phase 2: S02/T02 (port config-loader) — needs .NET scaffold
Phase 3: everything else
```

### Shared types pattern

If multiple stories need the same types, extract type creation into the earliest task.

```
S02/T01 creates: CouncilConfig.cs, RunStatus.cs
S03/T01 uses: CouncilConfig.cs
S04/T01 uses: RunStatus.cs

→ S02/T01 is in Phase 1; S03/T01 and S04/T01 are in Phase 2
```

### Parallel stories pattern

Stories that touch different packages can run entirely in parallel.

```
S01 touches: src/shared/ (TS tests)
S02 touches: src/CouncilConsole.Server/ (.NET)
S03 touches: src/council-console-server/shim/ (JS)

→ S01, S02, S03 first tasks are all Phase 1
```

---

## Circular Dependency Resolution

### Detection

If you can reach a task from itself by following dependency edges, there's a cycle.

### Common causes and fixes

| Cause | Example | Fix |
|-------|---------|-----|
| **Mutual type dependency** | A defines TypeX using TypeY; B defines TypeY using TypeX | Extract both types into a shared Task 0 |
| **Test + implementation interleave** | Implementation needs test helper; test helper needs the implementation | Create test helper first (mock-based, no real impl dependency) |
| **Feature + config** | Feature needs new config field; config validator needs to know about the feature | Add config field first (with validator), then implement feature |

### Resolution template

```
BEFORE (circular):
  S01/T03 → S02/T01 (needs shared types)
  S02/T01 → S01/T03 (needs test infrastructure)

AFTER (resolved):
  NEW S00/T01: Create shared types + test infrastructure
  S01/T03 → S00/T01
  S02/T01 → S00/T01
```

---

## Execution Order Document Format

```markdown
# Execution Order

## Overview

- **Total tasks**: {N}
- **Phases**: {N}
- **Critical path length**: {N} tasks
- **Maximum parallelism**: {N} tasks in Phase {M}

## Phase Diagram

### Phase 1 — Foundation (no dependencies)
| Task ID | Story | Title | Creates |
|---------|-------|-------|---------|
| S01/T01 | Test Suite | Setup Vitest | vitest.config.ts, mock helpers |
| S02/T01 | .NET Scaffold | Create solution | .sln, .csproj |

### Phase 2 — Core Implementation (depends on Phase 1)
| Task ID | Story | Title | Depends on | Creates |
|---------|-------|-------|-----------|---------|
| S01/T02 | Test Suite | Config loader tests | S01/T01 | config-loader.test.ts |
| S02/T02 | .NET Scaffold | Port ConfigLoader | S02/T01 | ConfigLoader.cs |

...

## Critical Path

S01/T01 → S01/T02 → S01/T03 → S04/T02 → S04/T05

{N} sequential tasks — minimum {N} Claude Code invocations regardless of parallelism.

## Parallel Execution Opportunities

- Phase 1: {N} tasks can run simultaneously
- Phase 2: {N} tasks, {M} are independent
- Total time savings vs sequential: ~{percent}%
```
