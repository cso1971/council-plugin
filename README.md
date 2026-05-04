# council-plugin

A **Claude Code / Cowork plugin** for convening a **Council of Agents** --
business or technical -- using **Agent Teams** as the primary runtime
(with automatic subagent fallback).

Describe what you need. The plugin handles pattern selection, agent
composition, file generation, and launch. No pre-existing agents or
skills required.

> *"Make me a Council of Agents to analyze this public tender so I can
> write a proposal"* -- and the system does the rest.

## Overview

Council Plugin brings structured multi-agent deliberation to any project through a conversational wizard. You describe what you need; the wizard selects an orchestration pattern, proposes expert agents, assembles the council, and generates the files. Agent Teams runs them -- no custom runtime, no pre-existing agents required.

**Who it's for:**

- **Business users** -- product managers, legal ops professionals, strategy consultants, founders. Get multiple expert perspectives on a decision without writing any configuration.
- **Technical users** -- engineers, architects, QA leads, security engineers. Run structured design reviews, threat models, or multi-perspective code analyses in a codebase context.

The wizard detects the scenario domain (business / tech / mixed) and adapts its persona proposals, domain context, and output format accordingly. Both groups use the same plugin and the same skills.

**What it ships with:** 7 orchestration patterns, 18 personas (12 business + 6 tech), 3 interaction protocols, and 6 output templates.

**How it works:** every generated agent file is assembled from three layers -- a protocol layer (voting rules, consensus criteria), a persona layer (role identity, competencies, behavior), and a domain skill reference. Each agent also gets a dedicated SKILL.md containing its domain knowledge, generated via skill-creator. The agent file holds only behavior and context; domain knowledge lives in the SKILL. Agent Teams (or subagents as fallback) discovers the generated files at `.claude/agents/` and runs them.

### How the plugin is organized

```
skills/           Entry points -- wizard, launch, resume
references/
  patterns/       7 orchestration topologies (hub-and-spoke, swarm, adversarial-debate, ...)
  personas/       18 expert roles (12 business + 6 tech) + custom template
  protocols/      Interaction rules: voting semantics, consensus, response format
  templates/      Generation skeletons that assemble the three layers into agent files
  output-templates/  Templates for the council's final deliverable
  recommender/    Question tree that helps the wizard pick the right pattern
```

The `skills/` directory contains the three entry points you invoke:

| Skill | When to use |
|-------|-------------|
| `council-wizard` | Starting point -- sets up a new council from scratch |
| `council-launch` | Kicks off a council after the wizard has generated the files |
| `council-resume` | Reopens a completed, in-progress, or escalated session |

The `references/` directories are read by the wizard at generation time. Patterns define the team topology. Personas provide role identity. Protocols govern deliberation. Templates stitch all three together into the final `.claude/agents/*.md` files.

## Getting Started

### Prerequisites

- Claude Cowork (desktop or web) **or** Claude Code CLI
- A project folder with relevant documents or code (the wizard will scan it for context)
- **skill-creator plugin** (recommended) -- used to generate agent domain skills. If not installed, the wizard falls back to archetype templates and notifies you.

### Install

**Cowork (desktop / web)**

Install the plugin through Cowork's plugin management UI. The wizard skill appears in the skill palette and can be invoked through conversation.

**CLI**

```bash
claude --plugin-dir .
```

Skills are namespaced by plugin name, e.g. `/council-plugin:council-wizard`.

### First use

Invoke the wizard and describe your goal in plain language:

```
/council-plugin:council-wizard
```

> *"I need a council to analyze this public tender and help me write a proposal."*

The wizard guides you through 5 phases: scenario intake, pattern selection, agent composition, HITL confirmation, and generation. Each phase is a distinct interaction step -- the wizard may be concise for clear requests, but it will always complete every phase.

**What gets generated** in your project:

- `.claude/agents/coordinator.md` and `.claude/agents/<role>.md` -- agent files (behavior, rules, context)
- `.claude/skills/council-<role>/SKILL.md` -- one per agent, containing domain knowledge (generated via skill-creator)
- `council/config.md` -- council metadata (pattern, topic, agents, settings)
- `council/domain-context.md` -- project knowledge assembled from your documents or codebase
- `Sessions/<topic-slug>/` -- round logs and final output land here during the run

See [User project artifacts](#user-project-artifacts-generated) for the full list.

## Layout

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions for Claude Code |
| `.claude-plugin/plugin.json` | Plugin manifest (canonical for Claude Code) |
| `plugin.json` | Duplicate manifest metadata (repo/spec alignment) |
| `skills/` | Plugin skills: wizard, launch, resume |
| `references/patterns/` | 7 orchestration pattern files (topology + prompts) |
| `references/personas/` | 18 persona files (12 business + 6 tech) |
| `references/protocols/` | 3 interaction protocols + custom template |
| `references/templates/` | Generation skeletons (coordinator, teammate, domain context) |
| `references/output-templates/` | 6 output templates + brief variants |
| `references/recommender/` | Pattern recommender question tree |
| `scripts/` | Validation and test scripts |
| `council-models/` | Reference example councils (not used by runtime) |
| `docs/` | Design specs (`SPEC.md`), implementation backlog (`TODO.md`), archived material |

## Skills

| Skill | Purpose |
|-------|---------|
| `council-wizard` | 5-phase conversational wizard: scenario, pattern, agents, HITL confirmation, generation |
| `council-launch` | Compose Agent Teams kickoff from generated artifacts |
| `council-resume` | Re-open prior sessions (completed, in-progress, or escalated) |

## User project artifacts (generated)

The wizard generates these files in the user's project:

- `.claude/agents/coordinator.md`, `.claude/agents/<slug>.md` -- agent files (behavior, rules, context only)
- `.claude/skills/council-<slug>/SKILL.md` -- **one per agent** — domain knowledge generated via skill-creator (or archetype fallback)
- `council/config.md` -- council metadata (pattern, topic, agents, settings)
- `council/domain-context.md` -- scenario/project knowledge with labeled sections
- `Sessions/<slug>/round-*.md` -- round logs, final output, optional `escalation.md`
- `Docs/INDEX.md` -- auto-generated document index (if `Docs/` has content)

## Limits (first release)

- One **active** council session per project at a time.
- Closing Claude mid-session **dissolves** the team; use **`council-resume`** with file state.
- All agents share **one model** (Opus) on Agent Teams.
- Default **`max_rounds` = 4** (up to 6 in `council/config.md`).
- Keep `Docs/` roughly **under ~100 files** to limit context use.
- **Agent Teams** is the preferred runtime. If unavailable, the plugin automatically falls back to subagent mode using the `Agent` tool — deliberation is identical but responses arrive sequentially.

## Validation

```bash
npm install
npm run validate:references
```

`validate:references` checks pattern, persona, protocol, and template schemas -- frontmatter, required headings, coordinator/teammate placeholders, and output templates.

## Design reference

- [docs/SPEC.md](docs/SPEC.md) -- authoritative design and specification
- [docs/UNIFICATION-PLAN.md](docs/UNIFICATION-PLAN.md) -- historical merge plan (council-plugin + council-builder)
- [docs/PATTERNS.md](docs/PATTERNS.md) -- 15-pattern catalog with Agent Teams compatibility

## License

See repository policy (add a `LICENSE` file if distributing).
