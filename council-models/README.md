# Council models

Snapshots of **council definitions** (protocol, config, agents, local skills, log layout) bundled under **`council-console/council-models/`**.

## Location policy

**Decision:** Keep all bundled council models here under `council-console/council-models/<model-name>/`. Do **not** place them under `council-console/src/council-models/` unless the repo later runs an explicit whole-tree migration (Docker, docs, and `additionalDirs` would all need updating).

**Rationale:** Runnable apps live in `src/`; council definitions stay a sibling folder under `council-console/` for clarity.

| Folder | Pattern |
|--------|---------|
| [`hub-and-spoke/`](hub-and-spoke/) | Deliberative default — Coordinator + Product Analyst + Architect + QA Strategist; voting and consensus (`decision.md` / `rejection.md` / `escalation.md`). Domain/skills may point outside this repo (see that folder’s `council.config.json`). |
| [`hub-and-spoke-console/`](hub-and-spoke-console/) | Same hub-and-spoke pattern, scoped **only to Council Console**; `additionalDirs` is **`../../`** (council-console root). |
| [`adversarial-debate/`](adversarial-debate/) | Two architects, debate protocol, `recommendation.md` (bundled snapshot). |
| [`parallel-investigation/`](parallel-investigation/) | Three investigators, swarm + P2P evidence, `findings.md` (bundled snapshot). |
| [`story-refinement-pipeline/`](story-refinement-pipeline/) | **Two-stage pipeline** — refines deliberation output into Claude Code task prompts. Stage 1 (`stage-1-refinery/`): Story Analyst + Code Archaeologist + Acceptance Gate → self-contained stories. Stage 2 (`stage-2-decomposer/`): Prompt Engineer + Dependency Mapper + Test Verifier → atomic `claude --prompt-file` tasks with execution graph. |

These trees are **self-contained copies** for use from Council Console; refresh or adjust `additionalDirs` when your checkout layout differs.

## Config path and `additionalDirs`

- **`hub-and-spoke-console/`**: use a config path relative to **`council-console/`**, e.g. `council-models/hub-and-spoke-console/council.config.json`, when your launcher resolves paths from that root.
- **`hub-and-spoke/`**: `additionalDirs` may reference other monorepo folders (e.g. a sample backend); paths are always **relative to the directory that contains** `council.config.json`.

## Example (hub-and-spoke-console)

When the runtime project root is **`council-console/`**:

```text
council-models/hub-and-spoke-console/council.config.json
```

**Council Console UI**: set **Config path** to the same string.

**Note:** `additionalDirs` in `hub-and-spoke/council.config.json` uses `../../../distributed-playground` (relative to `council-console/council-models/hub-and-spoke/`). **`hub-and-spoke-console/`** uses only `../../` (council-console root). Other models keep `additionalDirs` from their originals; adjust if your directory layout changes.
