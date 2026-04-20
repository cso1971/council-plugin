# Story Refinery — Focal Context

Use this as a quick anchor; full protocol lives in `CLAUDE.md` and `.claude/skills/`.

## What this council does

Takes **deliberation output** (rounds, decision, findings, draft stories) from a hub-and-spoke council and refines it into **self-contained stories** that can be used as implementation prompts.

This is NOT a deliberative council — there is no voting, no consensus-seeking. This is a refinement pipeline: read, analyze, enrich, validate.

## Layout

| Area | Path | Role |
|------|------|------|
| This model | `council-models/story-refinement-pipeline/stage-1-refinery/` | Story refinement agents + skills |
| Stage 2 (next) | `council-models/story-refinement-pipeline/stage-2-decomposer/` | Task decomposition (runs after this stage) |
| Source code | `src/` (via additionalDirs) | The actual codebase that stories reference |
| Deliberation output | Provided as topic | The council-log folder to refine |

## How the topic works

The **topic** string is interpreted as a **path** (relative to `council-console/`) pointing to a deliberation output folder. Example:

```
council-models/hub-and-spoke-console/council-log/voglio-migrare-council-console-server-a-net-10
```

The Story Analyst reads that folder to find `decision.md`, `findings.md`, `round-*.md`, and `stories/*.md`.

## Key difference from hub-and-spoke

| Aspect | Hub-and-spoke | This model |
|--------|---------------|------------|
| Goal | Reach agreement | Fill gaps in existing stories |
| Rounds | Up to 4 (debate) | Up to 2 (refinement) |
| Vote types | APPROVE/OBJECT/REJECT | COMPLETE/GAPS_FOUND/ENRICHED |
| Output | decision.md + draft stories | stories-refined/*.md (self-contained) |
| Agent focus | Domain expertise | Code reading + validation |
