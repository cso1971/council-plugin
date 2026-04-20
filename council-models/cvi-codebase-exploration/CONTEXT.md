# CVI Codebase Exploration — Quick Reference

## Focal Scope

Systematic exploration of a LabWindows/CVI legacy codebase to produce a structured baseline for migration to a Web application (backend .NET + frontend Angular).

## Layout

| Path | Purpose |
|------|---------|
| `council.config.json` | Council-console server configuration |
| `AGENTS.md` | Claude Code CLI team orchestration |
| `CLAUDE.md` | Convergent Analysis protocol + shared CVI context |
| `agents/` | 8 agent prompts (6 analysts + Coordinator + Devil's Advocate) |
| `.claude/skills/` | 5 domain knowledge skills |
| `council-log/` | Output directory for reports |

## additionalDirs

`../../../../` resolves to the repo root, giving agents access to the LabWindows/CVI source files (`.c`, `.h`, `.prj`, `.cws`, `.uir`).

## Protocol

- **Phase 1 — Parallel Exploration:** 6 analysts independently examine the codebase from different perspectives. No inter-agent communication.
- **Phase 2 — Adversarial Synthesis:** Coordinator cross-references reports, Devil's Advocate challenges conclusions, Coordinator produces consolidated report.
