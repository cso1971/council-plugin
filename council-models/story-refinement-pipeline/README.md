# Story Refinement Pipeline

Two-stage council pipeline that transforms **deliberation output** (rounds, decision, findings) into **implementation-ready Claude Code prompts**.

## Why a pipeline, not a single council

The deliberative council (hub-and-spoke) answers "what should we build and why?". This pipeline answers "how exactly, in enough detail that Claude Code can implement each piece autonomously?". These are different problems requiring different agent skills — one needs debate and consensus, the other needs analysis, code reading, and prompt engineering.

## Stages

| Stage | Council model | Input | Output |
|-------|---------------|-------|--------|
| **Stage 1 — Story Refinery** | `stage-1-refinery/` | A `council-log/{topic}/` folder with rounds, decision, findings, and draft stories | Refined, self-contained stories in `stories-refined/` — each with all code references inlined, acceptance criteria validated, missing stories generated |
| **Stage 2 — Task Decomposer** | `stage-2-decomposer/` | The `stories-refined/` folder from Stage 1 | Per-story `tasks/` folders with atomic `.md` prompts ready for `claude --prompt-file` |

## How to run

### Stage 1 — Refine stories

**Topic format**: path to the deliberation output folder, relative to `council-console/`.

```
council-models/hub-and-spoke-console/council-log/voglio-migrare-council-console-server-a-net-10
```

**Config path** (in Console UI or CLI):
```
council-models/story-refinement-pipeline/stage-1-refinery/council.config.json
```

Stage 1 reads the deliberation output at the path you provide as topic, reads the actual source code referenced by the stories, and produces refined stories with all gaps filled.

**Output**: `council-log/{topic-slug}/stories-refined/NN-story-name.md`

### Stage 2 — Decompose into tasks

**Topic format**: path to the Stage 1 output folder (the `council-log/{slug}/` from Stage 1 that contains `stories-refined/`).

```
council-models/story-refinement-pipeline/stage-1-refinery/council-log/{slug-from-stage-1}
```

**Config path**:
```
council-models/story-refinement-pipeline/stage-2-decomposer/council.config.json
```

Stage 2 reads the refined stories and produces atomic task prompts, each designed to be a self-contained Claude Code prompt.

**Output**: `council-log/{topic-slug}/tasks/NN-story-name/task-NN-description.md` + `execution-order.md`

## Final output structure

After both stages, you get:

```
stage-2-decomposer/council-log/{slug}/
  decision.md                           <-- Stage 2 summary
  tasks/
    01-characterization-test-suite/
      task-01-setup-vitest.md           <-- Claude Code prompt
      task-02-http-endpoint-tests.md
      task-03-websocket-tests.md
      ...
    02-dotnet-scaffold/
      task-01-create-solution.md
      task-02-port-config-loader.md
      ...
    execution-order.md                  <-- Dependency graph + run sequence
```

Each `task-NN-*.md` is designed to be run with:
```bash
claude --prompt-file task-01-setup-vitest.md
```

## Differences from deliberative councils

| Aspect | Hub-and-spoke (deliberative) | Story Refinement Pipeline |
|--------|------------------------------|--------------------------|
| **Goal** | Reach consensus on what to build | Produce implementation-ready prompts |
| **Protocol** | Voting rounds (APPROVE/OBJECT/REJECT) | Analysis rounds (COMPLETE/GAPS_FOUND/ENRICHED) |
| **Max rounds** | 4 | 2 (stories are input, not debated) |
| **Output** | decision.md + draft stories | Refined stories (Stage 1) or task prompts (Stage 2) |
| **Agent skills** | Domain expertise (architecture, QA, product) | Code reading, prompt engineering, dependency analysis |
