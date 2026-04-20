# Task Decomposer — Focal Context

Use this as a quick anchor; full protocol lives in `CLAUDE.md` and `.claude/skills/`.

## What this council does

Takes **refined stories** from Stage 1 (Story Refinery) and decomposes each into **atomic task prompts** that Claude Code can execute independently via `claude --prompt-file task.md`.

This is NOT a deliberative council. This is a decomposition pipeline: read stories, split into tasks, map dependencies, add verification.

## Layout

| Area | Path | Role |
|------|------|------|
| Stage 1 (previous) | `council-models/story-refinement-pipeline/stage-1-refinery/` | Story refinement (runs before this stage) |
| This model | `council-models/story-refinement-pipeline/stage-2-decomposer/` | Task decomposition agents + skills |
| Source code | `src/` (via additionalDirs) | The actual codebase for reference |
| Refined stories | Provided as topic | The Stage 1 output folder |

## How the topic works

The **topic** string is the **path** (relative to `council-console/`) to the Stage 1 output folder. Example:

```
council-models/story-refinement-pipeline/stage-1-refinery/council-log/refine-voglio-migrare-abcd1234
```

The Prompt Engineer reads that folder to find `stories-refined/*.md` and `decision.md`.

## Key design constraint

Each task prompt must be **usable with `claude --prompt-file`**. This means:
- Self-contained (all context in the file)
- No assumptions about prior conversation
- Includes verification commands
- Names specific files to create/modify
