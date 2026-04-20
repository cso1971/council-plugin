# CVI Codebase Exploration — Council Protocol

## Project Context

You are part of a council of agents performing systematic exploration of a **LabWindows/CVI legacy codebase**. The codebase is a C-based test & measurement application built with National Instruments' CVI framework.

**Objective:** Produce a structured, quantitative report that serves as the baseline for a migration plan from LabWindows/CVI to a Web application (backend .NET + frontend Angular).

**Codebase under analysis:** Available via `additionalDirs` — the repo root contains `.c`, `.h`, `.prj`, `.cws`, and `.uir` files from a LabWindows/CVI project (iMeazure — a DAQ application integrating multiple GPIB instruments: SR830/SR850 lock-in amplifier, Agilent E5062A VNA, E4402B spectrum analyzer, Lakeshore 340 temperature controller, Keithley 2000 DMM, Agilent 33220A function generator).

---

## Convergent Analysis Protocol

This council operates in **two phases**, not iterative deliberation rounds.

### Phase 1 — Parallel Exploration

**Participants:** 6 analyst agents (C Topology Mapper, Instrument Lock-in Analyst, Code Quality Archaeologist, Interface Surface Analyst, Test Observability Auditor, Hardware Abstraction Analyst)

**Rules:**
- Each analyst examines the codebase **independently** from their specialized perspective
- Analysts do **NOT** communicate with each other during Phase 1
- Each analyst produces a structured report saved to `council-log/report-{agent-name}.md`
- All analysts use the report format defined below

### Phase 2 — Adversarial Synthesis

**Participants:** Coordinator + Devil's Advocate

**Sequence:**
1. Coordinator receives the 6 analyst reports
2. Coordinator performs 5 synthesis operations: cross-reference, contradiction detection, gap analysis, confidence consolidation, risk matrix
3. Devil's Advocate receives the 6 reports + Coordinator's draft synthesis
4. Devil's Advocate challenges conclusions, contests confidence levels, identifies biases
5. Coordinator integrates challenges into the final consolidated report

---

## Report Format (Phase 1 — All Analysts)

Every analyst MUST use this exact structure:

```
## {Agent Name} — Exploration Report

### Executive Summary
[3-5 lines: principal findings from your area of expertise]

### Detailed Findings
[Structured analysis by area, with code evidence — cite file:line]

### Confidence Assessment
| Finding | Confidence | Evidence Type |
|---------|-----------|---------------|
| [finding description] | High/Medium/Low | structural/inferential/assumption |

### Migration Impact
[Specific implications for migration to Web app (backend .NET + frontend Angular)]

### Open Questions
[Questions requiring human input or cross-analysis with other agents]
```

**Confidence levels:**
- **High:** Based on structural evidence (file presence/absence, verified function calls, explicit `#include` chains)
- **Medium:** Based on reasonable inference (recognized patterns, naming conventions, consistent behavior)
- **Low:** Based on assumptions (inferred code intent, implicit architectural choices)

---

## Coordinator Output Format (Phase 2)

The Coordinator produces `council-log/consolidated-report.md` with:

```
# Consolidated Codebase Exploration Report

## Executive Summary
[Key findings across all dimensions, 10-15 lines]

## Cross-Reference Analysis
[Findings confirmed by multiple agents]

## Contradiction Log
| Agent A | Claim A | Agent B | Claim B | Resolution |
|---------|---------|---------|---------|------------|

## Gap Analysis
[Areas not covered by any analyst, with recommendations]

## Consolidated Findings
[Merged findings organized by topic, with confidence levels]

## Risk Matrix
| Area | Risk Level | Impact | Confidence | Owning Agent |
|------|-----------|--------|------------|--------------|

## Migration Roadmap
[Suggested migration order based on risk matrix, dependencies, and effort estimates]

## Devil's Advocate Challenges Integrated
[How the final report addresses the Devil's Advocate's challenges]
```

---

## Devil's Advocate Output Format (Phase 2)

The Devil's Advocate produces `council-log/devils-advocate-review.md` with:

```
# Devil's Advocate Review

## Challenged Findings
[For each challenged finding:]
### Finding: [description]
- **Original conclusion:** [what the analyst/coordinator concluded]
- **Challenge:** [why this conclusion may be wrong or overconfident]
- **Evidence gap:** [what evidence would be needed to confirm]
- **What-if scenario:** [alternative interpretation or risk scenario]
- **Recommended action:** [verify/downgrade confidence/investigate further]

## Bias Analysis
[Patterns of systematic over- or under-estimation across agents]

## Missing Perspectives
[Angles that no agent considered]
```

---

## Skills Available

The following domain knowledge skills are available. Use `/skill-name` to consult them.

| Skill | What it contains | Recommended for |
|-------|-----------------|-----------------|
| `cvi-domain-knowledge` | NI-VISA, NI-488.2, NI-DAQmx, NI-Serial, CVI UI, threading, utility API reference | All agents |
| `scpi-instrument-catalog` | SCPI commands for SR830, E5062A, E4402B, Lakeshore 340, Keithley 2000, 33220A | Instrument Lock-in Analyst, Hardware Abstraction Analyst, Interface Surface Analyst |
| `cvi-project-structure` | `.prj`/`.cws`/`.uir` file formats, callback conventions, entry points | C Topology Mapper, Code Quality Archaeologist |
| `cvi-antipatterns-calibration` | Calibrated thresholds: what is normal CVI vs what is a real problem | Code Quality Archaeologist, Test Observability Auditor |
| `migration-target-context` | CVI → Web app (.NET + Angular) pattern mapping with complexity ratings | All agents (for Migration Impact section) |

---

## Critical Context for All Agents

### What makes CVI different from modern codebases
- **No modules:** No namespaces, no packages, no formal module system. Just `.c`/`.h` files and `#include`.
- **No dependency graph:** No `package.json`, no `.csproj`, no manifest. Dependencies are implicit in `#include` chains and linker settings.
- **Binary UI files:** `.uir` files are binary. Analyze via generated `.h` headers and `CVICALLBACK` function search.
- **Hardware coupling is the dominant dimension:** The most important architectural characteristic is how tightly the code is coupled to physical instruments.
- **Thresholds are different:** CC 25 is normal. 500-line functions are common. Globals are standard. Calibrate your judgment accordingly — consult `cvi-antipatterns-calibration`.

### Citing evidence
Always cite specific files and line numbers when reporting findings. Use the format `filename.c:123` or `filename.h:45-67` for ranges. Vague claims without code evidence should be assigned Low confidence.
