# council-plugin

A **Claude Code / Cowork plugin** for convening a **Council of Agents** --
business or technical -- using **Agent Teams** as the runtime.

Describe what you need. The plugin handles pattern selection, agent
composition, file generation, and launch. No pre-existing agents or
skills required.

> *"Make me a Council of Agents to analyze this public tender so I can
> write a proposal"* -- and the system does the rest.

## Quick start

### Cowork (desktop / web)

Install the plugin through Cowork's plugin management UI. The wizard skill appears in the skill palette and can be invoked through conversation.

### CLI

```bash
claude --plugin-dir .
```

Skills are namespaced by plugin name, e.g. `/council-plugin:council-wizard`.

## What it does

A conversational **wizard** walks through 5 phases: scenario intake, pattern selection, agent composition, HITL confirmation, and artifact generation. The output is a set of `.claude/agents/*.md` files that Agent Teams runs natively -- no custom runtime.

The plugin ships with **7 orchestration patterns** (hub-and-spoke, swarm, adversarial-debate, map-reduce, plan-execute-verify, ensemble-voting, builder-validator), **18 personas** (12 business + 6 tech), **3 interaction protocols**, and **6 output templates**.

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

- `.claude/agents/coordinator.md`, `.claude/agents/<slug>.md` -- agent files (Agent Teams native path)
- `council/config.md` -- council metadata (pattern, topic, agents, settings)
- `council/domain-context.md` -- scenario/project knowledge with labeled sections
- `Sessions/<slug>/round-*.md` -- round logs, final output, optional `escalation.md`
- `Docs/INDEX.md` -- auto-generated document index (if `Docs/` has content)
- `.claude/skills/council-<slug>/SKILL.md` -- optional per-agent domain skills

## Limits (first release)

- One **active** council session per project at a time.
- Closing Claude mid-session **dissolves** the team; use **`council-resume`** with file state.
- All agents share **one model** (Opus) on Agent Teams.
- Default **`max_rounds` = 4** (up to 6 in `council/config.md`).
- Keep `Docs/` roughly **under ~100 files** to limit context use.

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
