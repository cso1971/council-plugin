# CVI Codebase Exploration — Agent Team Orchestration

## Team Composition

| Agent | Role | Phase | Prompt |
|-------|------|-------|--------|
| Coordinator | Orchestrator + Synthesis | Phase 2 | `agents/coordinator.md` |
| C Topology Mapper | Structural analysis | Phase 1 | `agents/c-topology-mapper.md` |
| Instrument Lock-in Analyst | Platform dependency analysis | Phase 1 | `agents/instrument-lockin-analyst.md` |
| Code Quality Archaeologist | Quality and debt assessment | Phase 1 | `agents/code-quality-archaeologist.md` |
| Interface Surface Analyst | Integration surface mapping | Phase 1 | `agents/interface-surface-analyst.md` |
| Test Observability Auditor | Testability assessment | Phase 1 | `agents/test-observability-auditor.md` |
| Hardware Abstraction Analyst | Hardware coupling analysis | Phase 1 | `agents/hardware-abstraction-analyst.md` |
| Devil's Advocate | Challenge and verify | Phase 2 | `agents/devils-advocate.md` |

## Orchestration Flow

The Coordinator is the orchestrating agent. It runs the following sequence:

### Phase 1 — Parallel Exploration

The Coordinator spawns 6 analyst agents **in parallel**. Each analyst:
1. Reads `CLAUDE.md` for shared protocol and context
2. Accesses the CVI codebase via `additionalDirs` (repo root)
3. Consults relevant skills from `.claude/skills/`
4. Produces a structured report saved to `council-log/report-{agent-name}.md`
5. Terminates after writing its report

**Spawn configuration:**
```
spawn: c-topology-mapper
  prompt: agents/c-topology-mapper.md
  output: council-log/report-c-topology-mapper.md

spawn: instrument-lockin-analyst
  prompt: agents/instrument-lockin-analyst.md
  output: council-log/report-instrument-lockin-analyst.md

spawn: code-quality-archaeologist
  prompt: agents/code-quality-archaeologist.md
  output: council-log/report-code-quality-archaeologist.md

spawn: interface-surface-analyst
  prompt: agents/interface-surface-analyst.md
  output: council-log/report-interface-surface-analyst.md

spawn: test-observability-auditor
  prompt: agents/test-observability-auditor.md
  output: council-log/report-test-observability-auditor.md

spawn: hardware-abstraction-analyst
  prompt: agents/hardware-abstraction-analyst.md
  output: council-log/report-hardware-abstraction-analyst.md
```

**Wait:** All 6 analysts must complete before Phase 2 begins.

### Phase 2 — Adversarial Synthesis

**Step 1:** The Coordinator reads all 6 reports from `council-log/` and performs its 5 synthesis operations (cross-reference, contradiction detection, gap analysis, confidence consolidation, risk matrix).

**Step 2:** The Coordinator produces a draft synthesis.

**Step 3:** The Coordinator spawns the Devil's Advocate:
```
spawn: devils-advocate
  prompt: agents/devils-advocate.md
  input: council-log/report-*.md + draft synthesis
  output: council-log/devils-advocate-review.md
```

**Step 4:** The Coordinator reads the Devil's Advocate review, integrates valid challenges, and produces the final consolidated report:
```
output: council-log/consolidated-report.md
```

## Execution

### Prerequisites
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable set
- tmux installed and available in PATH
- Anthropic API key configured

### Run
```bash
cd ai-dlc/council-console/council-models/cvi-codebase-exploration
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

The Coordinator will start automatically as the main agent and orchestrate the two phases. Each analyst appears in its own tmux pane during Phase 1.

### Output
All reports are saved to `council-log/`:
- 6 individual analyst reports
- 1 Devil's Advocate review
- 1 consolidated report (final deliverable)
