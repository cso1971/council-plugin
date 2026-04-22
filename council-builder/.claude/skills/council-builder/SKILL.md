---
name: council-builder
description: Interactive wizard to scaffold a Council of Agents for structured multi-persona deliberation
disable-model-invocation: true
---

# Council Builder Wizard

You are running the **council-builder** skill — an interactive wizard that generates the files needed to run a Council of Agents using Claude Code Agent Teams.

**You generate files. You do NOT run the council.**

The wizard produces:
- `.claude/agents/*.md` files (coordinator + persona teammates)
- A `## Council Protocol` section for `CLAUDE.md`

All source material is in this skill's directory: `.claude/skills/council-builder/`.

---

## Phase 1 — Gather Domain Context

Ask the user:

> What project is this council for? Describe the architecture, tech stack, and key domain concepts — or point me to a domain context file.

Then:

1. If the user points to an existing file, read it and confirm it's suitable.
2. If a file already exists in `.claude/skills/council-builder/domain-contexts/` that matches the project, offer to reuse it.
3. If the user describes the project verbally, compose a domain context file following the section structure in `.claude/skills/council-builder/domain-contexts/_context-template.md`. Save it to `.claude/skills/council-builder/domain-contexts/{project-slug}.md`. Show the user the draft and confirm before saving.

The domain context file must have labeled sections (`## overview`, `## services`, etc.). Each persona declares which sections it needs. Not every section is required — include only those relevant to the project.

---

## Phase 2 — Select Protocol

1. Read all files in `.claude/skills/council-builder/protocols/` (skip files starting with `_`).
2. Present available protocols with their one-line descriptions.
3. User picks one. Default: **deliberative-voting**.
4. Ask for overrides:
   - Max rounds? (read the default from the protocol's `Configuration` section)
   - Any other protocol-level settings to override?

---

## Phase 3 — Select Personas

1. Read all files in `.claude/skills/council-builder/persona-library/` (skip files starting with `_`).
2. Present available personas in a table:

   | Persona | Focus |
   |---------|-------|
   | [name] | [one-line description from the `>` quote after the title] |

3. **Suggest a default team** of 3-4 personas based on the project context. For example:
   - A backend-heavy project → Architect, Product Analyst, QA Strategist
   - A user-facing project → Product Analyst, UX Designer, QA Strategist
   - A security-sensitive project → Architect, Security Engineer, QA Strategist
4. User confirms, adds, removes, or requests a custom persona.
5. If the user wants a **custom persona**: read `.claude/skills/council-builder/persona-library/_custom-template.md` and walk the user through filling each section interactively. Save to `.claude/skills/council-builder/persona-library/{name}.md`.

---

## Phase 4 — Configure

1. **Domain skills**: for each selected persona, ask:
   > Does [Persona Name] have a domain-specific skill to reference? (e.g., `.claude/skills/dotnet-architecture/SKILL.md`)

   Only ask if `.claude/skills/` contains skill directories beyond `council-builder`. If no other skills exist, skip this step.

2. **Console reporting**: ask:
   > Include console reporting? (HTTP POST progress updates for live monitoring)

   Default: no.

3. **Council log path**: ask:
   > Output path for council logs?

   Default: `council-log/`.

---

## Phase 5 — Generate Files

### 5a. Generate Persona Agent Files

For each selected persona:

1. Read the persona library file: `.claude/skills/council-builder/persona-library/{name}.md`
2. Read the persona template: `.claude/skills/council-builder/templates/persona.md.hbs`
3. Read the domain context file selected in Phase 1
4. Read the selected protocol file from Phase 2
5. Assemble the final agent file by filling the template:

   **From the persona library file**, extract:
   - `{{ROLE_NAME}}` — the name after "# Persona: "
   - `{{ROLE_DESCRIPTION_SHORT}}` — the one-line description from the `>` blockquote
   - `{{IDENTITY_BLOCK}}` — content of the "## Identity" section
   - `{{COMPETENCIES}}` — content of the "## Core Competencies" section
   - `{{BEHAVIOR_RULES}}` — content of the "## Behavior in the Council" section (the numbered steps)
   - `{{CARE_ABOUT}}` — content of the "## What You Care About" section
   - `{{DEFER_TO}}` — content of the "## What You Defer to Others" section
   - `{{VOTE_GUIDELINES_TABLE}}` — content of the "## Vote Guidelines" section
   - `{{QUALITY_CHECKLIST}}` — content of the "## Quality Checklist" section
   - The `domain-context-sections` declaration from the HTML comment

   **From the protocol file**, extract:
   - `{{VOTE_OPTIONS}}` — from the Configuration section
   - `{{RESPONSE_FORMAT_EXAMPLE}}` — from the Response Format section, with `[Role Name]` replaced by the actual role name. Use the reasoning placeholder text appropriate to this role's expertise area.
   - `{{CONSOLE_REPORTING}}` — the Console Reporting section (if enabled in Phase 4; otherwise leave empty)

   **From the domain context file**, extract:
   - `{{DOMAIN_CONTEXT_BLOCK}}` — only the sections declared in `domain-context-sections`. Format as a "## Context: {Project Name}" section with each sub-section included.

   **From Phase 4 configuration**:
   - `{{DOMAIN_SKILL_REF}}` — if a skill was specified, format as:
     ```
     ## Domain Skill

     Load and use the **{Skill Name}** skill at `{skill-path}` for grounded analysis relevant to your expertise area.
     ```
     If no skill, leave this variable empty.

6. Write the assembled file to `.claude/agents/{name}.md`

### 5b. Generate Coordinator Agent File

1. Read the coordinator template: `.claude/skills/council-builder/templates/coordinator.md.hbs`
2. Read the selected protocol file
3. Generate the template variables:

   **`{{TEAMMATES_TABLE}}`** — from selected personas:
   ```markdown
   | Role | File | Responsibility |
   |------|------|----------------|
   | {Role Name} | `agents/{name}.md` | {one-line description} |
   ```

   **From the protocol file**, extract:
   - `{{MAX_ROUNDS}}` — from Configuration
   - `{{VOTE_OPTIONS}}` — from Configuration
   - `{{CONSENSUS_RULE}}` — from Consensus Rules (the consensus condition)
   - `{{REJECTION_RULE}}` — from Consensus Rules (the rejection condition)
   - `{{OUTPUT_FORMATS}}` — the entire "Output Formats" section from the protocol
   - `{{BEHAVIORAL_RULES}}` — the entire "Behavioral Rules" section from the protocol

   **`{{CONTEXT_REFERENCES}}`** — generated list:
   ```markdown
   - Teammates have access to domain skills in `.claude/skills/` for grounded analysis:
     - {Role 1} → `{skill-path-1}` (if configured)
     - {Role 2} → `{skill-path-2}` (if configured)
   - The project architecture and domain context are documented in `CLAUDE.md` under "Council Protocol".
   ```

4. Write to `.claude/agents/coordinator.md`

### 5c. Generate CLAUDE.md Protocol Section

1. Read the protocol section template: `.claude/skills/council-builder/templates/claude-md-protocol-section.md.hbs`
2. Read the selected protocol file
3. Generate the template variables:

   **`{{PARTICIPANTS_TABLE}}`** — include the Coordinator + all selected personas:
   ```markdown
   | Role | Type | Responsibility |
   |------|------|----------------|
   | **Coordinator** | Lead Agent | Moderates the deliberative cycle, spawns teammates, synthesizes responses, detects consensus |
   | **{Role 1}** | Teammate | {description} |
   ```

   **From the protocol file**, extract:
   - `{{DELIBERATIVE_CYCLE}}` — the cycle description (diagram + steps)
   - `{{RESPONSE_FORMAT}}` — the mandatory response format
   - `{{VOTE_SEMANTICS}}` — the vote semantics table
   - `{{QUALITY_RULES}}` — the response quality rules
   - `{{CONSENSUS_RULES}}` — the full consensus rules section
   - `{{ESCALATION_RULES}}` — the escalation rules table
   - `{{COUNCIL_LOG_FORMAT}}` — the council log format table and round log structure

   **`{{SKILLS_TABLE}}`** — from Phase 4 configuration:
   ```markdown
   | Skill | Path | Used by |
   |-------|------|---------|
   | {Skill Name} | `{path}` | {Role} |
   ```

4. If `CLAUDE.md` exists in the project root:
   - Check if it already has a `## Council Protocol` section
   - If yes: **replace** that section with the new one
   - If no: **append** the new section at the end
5. If `CLAUDE.md` does not exist: create it with a minimal header and the protocol section

---

## Phase 6 — Summary

Present the user with:

1. **Generated files** — list every file created with its full path:
   ```
   Created:
     .claude/agents/coordinator.md
     .claude/agents/{persona-1}.md
     .claude/agents/{persona-2}.md
     .claude/agents/{persona-3}.md
     CLAUDE.md (updated — added ## Council Protocol section)
   ```

2. **Teammates table** — the same table written into the coordinator file

3. **Usage instructions**:
   ```
   To run the council:

   1. Ensure Claude Code Agent Teams is enabled:
      Set "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": true in .claude/settings.json

   2. Start Claude Code in your project directory

   3. Tell the coordinator your topic:
      "Run the council on: [describe your feature, design question, or topic]"

   The coordinator will spawn the team, moderate the deliberation, and produce
   output files in council-log/{topic-slug}/.
   ```
