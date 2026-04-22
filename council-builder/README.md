# Council Builder

A **Claude Code skill** that scaffolds a [Council of Agents](../council-of-agents-web/) — a multi-persona deliberation protocol using Claude Code Agent Teams.

The skill is an interactive wizard: it does **not** run the council. It generates `.claude/agents/*.md` files, injects protocol rules into `CLAUDE.md`, and produces supporting artifacts so you can then launch the council natively via Agent Teams.

## Installation

Copy the `.claude/skills/council-builder/` directory into your project:

```bash
cp -r .claude/skills/council-builder /path/to/your-project/.claude/skills/council-builder
```

## Usage

1. Start Claude Code in your project directory
2. Run the wizard: `/council-builder`
3. Follow the interactive prompts (6 phases):
   - **Gather context** — describe your project or point to a domain context file
   - **Select protocol** — pick a deliberation protocol (default: deliberative voting)
   - **Select personas** — choose 3-4 team members from the library
   - **Configure** — domain skills, console reporting, log path
   - **Generate** — the wizard creates all agent files
   - **Summary** — review generated files and get usage instructions

## Architecture

The skill uses a three-layer composition model:

```
Generated agent file = Protocol + Persona (role) + Domain Context
```

- **Protocol** (`protocols/`) — how the council operates: vote semantics, consensus rules, output formats
- **Persona** (`persona-library/`) — who each agent is: identity, competencies, behavior rules (project-agnostic)
- **Domain Context** (`domain-contexts/`) — project-specific knowledge: architecture, tech stack, services

Templates in `templates/` define the structural skeleton and injection points.

## Persona Library

| Persona | Focus |
|---------|-------|
| Architect | Software architecture and system design |
| Product Analyst | Requirements analysis and user story writing |
| QA Strategist | Quality assurance and test strategy |
| Security Engineer | Threat modeling and application security |
| DevOps Engineer | Deployment, CI/CD, and operational readiness |
| UX Designer | User experience and interaction design |

### Adding a Custom Persona

Copy `persona-library/_custom-template.md` to `persona-library/{your-persona}.md` and fill in each section.

### Adding a Custom Protocol

Copy `protocols/_custom-template.md` to `protocols/{your-protocol}.md` and fill in each section.

### Adding a Domain Context

Copy `domain-contexts/_context-template.md` to `domain-contexts/{your-project}.md` and fill in each section. The wizard can also create this interactively.

## File Structure

```
.claude/skills/council-builder/
├── SKILL.md                              # Wizard entry point
├── templates/
│   ├── coordinator.md.hbs                # Coordinator agent template
│   ├── persona.md.hbs                    # Persona agent template
│   └── claude-md-protocol-section.md.hbs # CLAUDE.md protocol section template
├── protocols/
│   ├── deliberative-voting.md            # Default protocol
│   └── _custom-template.md              # Template for new protocols
├── persona-library/
│   ├── architect.md
│   ├── product-analyst.md
│   ├── qa-strategist.md
│   ├── security-engineer.md
│   ├── devops-engineer.md
│   ├── ux-designer.md
│   └── _custom-template.md              # Template for new personas
└── domain-contexts/
    ├── distributed-playground.md          # Reference domain context
    └── _context-template.md              # Template for new contexts
```

## Running the Council (after generation)

1. Enable Agent Teams:
   ```json
   // .claude/settings.json
   { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": true }
   ```
2. Start Claude Code
3. Tell the coordinator your topic:
   ```
   Run the council on: [describe your feature, design question, or topic]
   ```

The coordinator spawns the team, moderates structured voting rounds, and writes output to `council-log/{topic-slug}/`.
