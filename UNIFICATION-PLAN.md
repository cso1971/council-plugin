# Unification Plan: council-plugin + council-builder

**Status**: Draft for discussion
**Date**: 2026-04-21

---

## 1. Executive Summary

This repo contains two overlapping systems that scaffold "Councils of Agents" for Claude Code Agent Teams:

- **council-plugin** (the main plugin) -- a 5-skill suite targeting non-technical business users, with 7 orchestration patterns, 12 business role archetypes, output templates, Telegram HITL, and a full session lifecycle (launch/resume).
- **council-builder** (under `council-builder/`) -- a standalone `.claude` skill targeting software development teams, with 6 tech personas, a deliberative-voting protocol, and an elegant three-layer composition model (Protocol + Persona + Domain Context).

Both generate files that Agent Teams runs natively. Neither implements a custom runtime. They share the same fundamental architecture -- scaffold artifacts, let Agent Teams orchestrate -- but diverge in audience, persona libraries, wizard flow, protocol handling, artifact paths, and session management.

**Goal of unification**: A single Claude Code / Cowork plugin that provides a wizard-like experience for any user -- business or technical -- to describe what they need and have Claude generate a complete council on-the-fly. No pre-existing agents or skills required. The user says *"Can you make me a Council of Agents to analyze this public tender so that I can write a proposal"* and the system handles pattern selection, agent composition, file generation, and launch.

---

## 2. Current State -- Side-by-Side Comparison

| Dimension | council-plugin (System A) | council-builder (System B) |
|-----------|--------------------------|---------------------------|
| **Target audience** | Non-technical business users | Software development teams |
| **Entry point** | `skills/council-wizard/SKILL.md` (8-phase) | `council-builder/.claude/skills/council-builder/SKILL.md` (6-phase) |
| **Skills** | 5: wizard, launch, resume, scaffold, telegram-setup | 1 monolithic wizard |
| **Persona library** | 12 business archetypes in `references/role-archetypes/` | 6 tech personas in `persona-library/` |
| **Persona format** | YAML frontmatter + role description + baseline SKILL.md template + typical questions + customization slots | Identity + competencies + behavior rules + care/defer + vote guidelines table + quality checklist + `domain-context-sections` declaration |
| **Pattern library** | 7 patterns in `references/patterns/` with coordinator/teammate prompt templates, HITL checkpoints, recommender signals | None (pattern logic is implicit in protocol) |
| **Protocol system** | Embedded in pattern templates (vote format, consensus rules hardcoded per pattern) | Standalone `protocols/deliberative-voting.md` with explicit vote semantics, consensus rules, escalation, output formats |
| **Recommender** | 3-question decision tree in `references/recommender/questions.md` | None |
| **Output templates** | 6 templates + brief variants in `references/output-templates/` | Output formats defined inside protocol file |
| **Domain context** | `Docs/INDEX.md` (auto-indexed business documents) | Rich labeled sections with per-persona filtering via `domain-context-sections` |
| **Generation templates** | None (prompt templates live inside pattern files) | `.hbs` template files: `coordinator.md.hbs`, `persona.md.hbs`, `claude-md-protocol-section.md.hbs` |
| **HITL** | Telegram MCP (`mcp/telegram-ask/`) + inline chat fallback | None |
| **Session management** | Full lifecycle: scaffold -> launch -> run -> resume via `Sessions/<slug>/` | None |
| **Agent file location** | `council/agents/*.md` (custom path) | `.claude/agents/*.md` (Agent Teams native) |
| **Skill generation** | `.claude/skills/<slug>/SKILL.md` per agent (from archetype baselines) | None (all knowledge embedded in agent files) |
| **Protocol injection** | None | Writes `## Council Protocol` section into `CLAUDE.md` |
| **Config artifact** | `council/config.md` (YAML frontmatter + body) | None (config is implicit in generated files) |
| **Validation** | `scripts/validate-references.mjs` checks pattern/archetype schemas | None |
| **Example councils** | 6 in `council-models/` (reference only) | 1 domain context (`distributed-playground.md`) |

### Strengths to Preserve

**From council-plugin:**
- Complete session lifecycle (launch, resume, state detection)
- Rich pattern library with recommender signals and HITL checkpoint types
- Output templates (professional, stakeholder-ready)
- Telegram HITL integration
- Plugin manifest structure (`.claude-plugin/plugin.json`)
- Validation scripts
- Business persona breadth (12 archetypes covering market, legal, finance, compliance, brand, HR, risk, ops, customer, data, PM, moderator)

**From council-builder:**
- Three-layer composition model (Protocol + Persona + Domain Context) -- cleanest separation of concerns
- Explicit protocol files with vote semantics, consensus rules, response format
- Per-persona domain context filtering (`domain-context-sections` declarations)
- Richer persona structure (identity, competencies, behavior, vote guidelines, quality checklist, care/defer)
- Generation templates with clear variable injection points
- `.claude/agents/` as artifact location (matches Agent Teams native discovery)
- Tech persona depth (architect, product-analyst, qa-strategist, security-engineer, devops-engineer, ux-designer)

---

## 3. Design Principles

### 3.1 Three-layer composition as the unified generation model

Every generated agent file is assembled from three independent layers:

```
Agent File = Protocol Layer + Persona Layer + Domain Context Layer
```

- **Protocol**: Interaction rules (vote semantics, response format, consensus, escalation). Shared by all agents in a council. Independent of topology.
- **Persona**: Role identity, competencies, behavior, vote guidelines, quality checklist. Project-agnostic. Reusable across councils.
- **Domain Context**: Project/scenario-specific knowledge. Filtered per persona based on declared section needs.

This is council-builder's model, generalized to work for both business and tech scenarios. council-plugin's approach of embedding protocol rules inside pattern templates is replaced by explicit protocol references.

### 3.2 Dynamic agent generation as primary path

The persona library (18 entries) serves as a **seed catalog** -- inspiration and structural reference. The primary generation mode is dynamic: Claude reads the user's scenario and synthesizes custom persona definitions tailored to the need. Library personas are matched and adapted when they fit; fully custom personas are generated from scratch when they don't.

This addresses the user's core requirement: *"The user should not need to have pre-existing agents or skills, instead Claude will ask the user what he wants to do and will generate suitable agents and skills."*

### 3.3 `.claude/agents/` as canonical agent file location

Agent Teams natively discovers agent files from `.claude/agents/`. System A wrote to `council/agents/` which required explicit file path references in the kickoff prompt. The unified system writes directly to where Agent Teams looks, eliminating the indirection.

### 3.4 Pattern = topology, Protocol = interaction rules

**Patterns** define the team structure and orchestration flow: who talks to whom, in what order, with what checkpoints. They map to output templates and declare HITL checkpoint types.

**Protocols** define how agents interact within that structure: vote options, response format, consensus mechanics, escalation rules. They are independent of topology.

These compose: a pattern declares a `default_protocol`, but the user can override. Example: hub-and-spoke (topology) + deliberative-voting (protocol) is the default, but hub-and-spoke + convergent-investigation (protocol) could work for a research-oriented hub.

### 3.5 Five-phase conversational wizard

The 8-phase wizard (System A) and 6-phase wizard (System B) merge into a streamlined 5-phase flow. Phases are logical steps, not mandatory sequential gates -- Claude can collapse multiple phases in a single response when the user's intent is clear enough.

---

## 4. Unified Architecture

### 4.1 Plugin repository layout

```
council-plugin/                              (this repo, installed as plugin)
  plugin.json
  .claude-plugin/plugin.json                 canonical plugin manifest
  README.md
  UNIFICATION-PLAN.md                        this document
  agent-interaction-patterns.md              15-pattern catalog (reference)
  skills/
    council-wizard/SKILL.md                  unified 5-phase wizard
    council-launch/SKILL.md                  compose Agent Teams kickoff
    council-resume/SKILL.md                  re-open prior sessions
    council-telegram-setup/SKILL.md          Telegram onboarding
  references/
    patterns/                                7 pattern files (topology + prompts)
      hub-and-spoke.md
      swarm.md
      adversarial-debate.md
      map-reduce.md
      plan-execute-verify.md
      ensemble-voting.md
      builder-validator.md
    protocols/                               NEW -- interaction rule definitions
      deliberative-voting.md                 default (from council-builder)
      adversarial-debate-protocol.md         debate-specific rules
      convergent-investigation.md            hypothesis-driven investigation
      _custom-template.md                    user extension schema
    personas/                                RENAMED from role-archetypes
      # Business personas (from System A, reformatted)
      market-analyst.md
      legal-advisor.md
      financial-controller.md
      compliance-officer.md
      brand-strategist.md
      hr-partner.md
      risk-officer.md
      operations-expert.md
      customer-advocate.md
      data-analyst.md
      pm-facilitator.md
      moderator-neutral.md
      # Tech personas (from System B)
      architect.md
      product-analyst.md
      qa-strategist.md
      security-engineer.md
      devops-engineer.md
      ux-designer.md
      _custom-template.md                   user extension schema
    output-templates/                        6 templates + brief variants (unchanged)
    recommender/
      questions.md                           extended for 9+ patterns
    templates/                               NEW -- generation skeletons
      coordinator.md.tmpl                    coordinator agent template
      teammate.md.tmpl                       persona agent template
  mcp/
    telegram-ask/                            MCP server (unchanged)
  scripts/
    validate-references.mjs                  extended for new directories
  council-models/                            inert examples (reference only)
  docs/                                      design specs, archived material
```

Key changes:
- `role-archetypes/` renamed to `personas/` -- clearer terminology
- `protocols/` added as a new reference directory
- `templates/` added with generation skeletons (from council-builder's `.hbs` files, renamed to `.tmpl`)
- `council-scaffold` skill **absorbed** into the wizard's Phase 5 (see section 7)
- council-builder content either migrated into the appropriate reference directory or archived under `docs/`

### 4.2 Generated user project layout

```
<user-project>/
  .claude/
    agents/                                  CANONICAL agent location
      coordinator.md                         lead agent (Agent Teams reads this)
      <role-slug>.md                         one per teammate
    skills/                                  OPTIONAL per-agent domain skills
      council-<role-slug>/SKILL.md           only when deep domain grounding needed
  .mcp.json                                  git-ignored (Telegram config)
  council/
    config.md                                council metadata (YAML frontmatter)
    domain-context.md                        scenario/project knowledge
  Docs/                                      business documents (if applicable)
    INDEX.md                                 auto-generated index
  Sessions/<topic-slug>/
    config-snapshot.md                       frozen config at launch time
    round-1.md ... round-N.md               round logs
    <output>.md                             final output (decision|findings|...)
    escalation.md                           if no consensus after max rounds
    telegram-log.md                         if Telegram HITL used
```

vs. current System A layout -- the key change is `council/agents/` -> `.claude/agents/`.

---

## 5. Unified Persona System

### 5.1 Shared persona file format

All 18 personas adopt a unified structure combining the best of both systems:

```yaml
---
id: <slug>
name: <Display Name>
category: business | tech | cross-functional
domains: [keyword1, keyword2, ...]                    # from System A
fits_patterns: [pattern-id, ...]                      # from System A
domain-context-sections: [overview, ...]              # from System B
---
```

**Sections** (all mandatory for library entries):

1. **Role description** (2-3 lines, project-agnostic) -- from System A
2. **Identity** (expertise paragraph, role guarantee) -- from System B
3. **Core competencies** (bulleted, 5-7 items) -- from System B
4. **Behavior in the council** (numbered steps) -- from System B
5. **What you care about** / **What you defer** -- from System B
6. **Vote guidelines** (table: situation -> vote choice) -- from System B
7. **Quality checklist** (7-10 verifiable checks) -- from System B
8. **Baseline skill template** (optional fenced SKILL.md) -- from System A
9. **Typical questions answered** -- from System A
10. **Customization slots** (`{{VARIABLE}}` markers) -- from System A

The 12 business personas gain the structured sections from System B (identity, competencies, behavior, vote guidelines, quality checklist). The 6 tech personas gain the metadata fields from System A (domains, fits_patterns) and optional baseline skill templates.

### 5.2 Domain context sections for business personas

Business personas need domain context sections too, but the section vocabulary differs from tech:

| Section | Used by (business) | Used by (tech) |
|---------|---------------------|-----------------|
| `overview` | All | All |
| `stakeholders` | pm-facilitator, customer-advocate, hr-partner | product-analyst, ux-designer |
| `market-landscape` | market-analyst, brand-strategist | -- |
| `regulatory-environment` | legal-advisor, compliance-officer | security-engineer |
| `financial-context` | financial-controller, risk-officer | -- |
| `operational-context` | operations-expert | devops-engineer |
| `documents-index` | All business personas | -- |
| `services` | -- | architect, qa-strategist, devops-engineer, security-engineer |
| `tech-stack` | -- | All tech |
| `bounded-context-pattern` | -- | architect |
| `cross-context-integration` | -- | architect, qa-strategist, security-engineer |
| `docker-infrastructure` | -- | architect, devops-engineer |
| `testing-landscape` | -- | qa-strategist |

The unified domain context template includes both vocabularies. The wizard generates only the sections relevant to the scenario's domain (business, tech, or mixed).

### 5.3 Dynamic generation strategy

When the user describes their scenario, Claude:

1. **Analyzes** the scenario to identify domain (business/tech/mixed), key perspectives needed, tension structure, and stakeholders.
2. **Matches** each needed perspective against the 18 library personas using `domains` and `fits_patterns` metadata.
3. **For matches**: loads the persona file, adapts customization slots and identity to the scenario.
4. **For gaps** (e.g., "customs regulations expert for EU agricultural imports"): generates a full persona following the unified format, using `_custom-template.md` as the structural schema.
5. **Before generating**: checks `.claude/agents/` for existing agent files. If a prior council left agents that match, offers to reuse (with optional modifications).

Every generated persona -- library-based or custom -- must include all mandatory sections. The generation template (`references/templates/teammate.md.tmpl`) enforces this by requiring injection points for each section.

### 5.4 Skill generation

Optional and secondary. When a persona needs deep domain grounding beyond what the domain context provides:

- Claude generates `.claude/skills/council-<role-slug>/SKILL.md` using the persona's baseline skill template (if present) or synthesizes one from the scenario description.
- Generated skills are namespaced with `council-` to avoid conflicts with the user's own skills.
- For library personas with existing baseline skill templates (e.g., market-analyst has a TAM/SAM/SOM analysis skill), the template is extracted and customized.
- For custom personas, Claude generates a skill following the same structural pattern.

Skill generation is offered during agent composition, not forced. Most scenarios work fine with domain context embedded directly in the agent file.

---

## 6. Unified Pattern and Protocol System

### 6.1 Pattern files (topology)

The 7 existing pattern files in `references/patterns/` gain a new frontmatter field:

```yaml
default_protocol: deliberative-voting
```

Pattern files continue to define:
- When to use (scenario description)
- Recommender signals (keywords for matching)
- Role shape (typical team composition)
- Coordinator prompt template (with `{{PROTOCOL_VARIABLES}}` instead of hardcoded vote rules)
- Teammate prompt template (similarly parameterized)
- HITL checkpoint types (Type A: round review, Type B: deadlock clarification, Type C: plan approval)
- Output template mapping

The critical change: coordinator and teammate prompt templates within pattern files now use protocol variable placeholders (`{{VOTE_OPTIONS}}`, `{{CONSENSUS_RULE}}`, `{{REJECTION_RULE}}`, `{{RESPONSE_FORMAT}}`, `{{BEHAVIORAL_RULES}}`) instead of embedding specific vote semantics. Protocol injection happens at generation time.

### 6.2 Protocol files (interaction rules)

New directory `references/protocols/` with standalone protocol definitions:

**`deliberative-voting.md`** (migrated from council-builder):
- Vote options: PROPOSE, OBJECT, APPROVE, ABSTAIN, REJECT
- Response format: `## [Role] -- Round {N} Response` + Vote + Reasoning + Details
- Consensus: all non-abstaining vote APPROVE
- Rejection: 2+ REJECT -> stop, write rejection.md
- Escalation: max rounds without consensus -> escalation.md
- Behavioral rules for coordinator (neutrality, completeness, transparency, efficiency)

**`adversarial-debate-protocol.md`** (new, derived from adversarial-debate pattern):
- No voting per se -- Position/Evidence/Counter-argument structure
- Labels: FAVOR_A, FAVOR_B, SPLIT
- Moderator verdict after structured debate rounds
- Suitable for binary choice scenarios

**`convergent-investigation.md`** (new, derived from swarm pattern):
- Hypothesis status votes: SUPPORTED, WEAK, REFUTED, INCONCLUSIVE
- Evidence-based structure per round
- Peer-to-peer evidence exchange (where Agent Teams supports it)
- Convergence toward findings document

**`_custom-template.md`** (from council-builder):
- Schema for user-defined protocols with all required sections

### 6.3 Default pattern-protocol pairings

| Pattern | Default Protocol | Rationale |
|---------|-----------------|-----------|
| hub-and-spoke | deliberative-voting | Multi-specialist consensus requires structured votes |
| swarm | convergent-investigation | Parallel hypotheses need evidence-based convergence |
| adversarial-debate | adversarial-debate-protocol | Binary debate has its own structure |
| map-reduce | deliberative-voting | Aggregation phase benefits from vote-based synthesis |
| plan-execute-verify | deliberative-voting | Approval gates map to APPROVE/OBJECT votes |
| ensemble-voting | deliberative-voting | Independent voting is the core mechanic |
| builder-validator | deliberative-voting | Validation feedback maps to APPROVE/OBJECT |

Advanced users could override the default, but the wizard uses it without prompting.

---

## 7. Unified Wizard Flow

The unified wizard consolidates the 8 phases (System A) and 6 phases (System B) into 5 conversational phases. Phases are logical steps, not rigid gates -- Claude can collapse them when the user's intent is clear.

### Phase 1 -- Scenario Intake and Context Discovery

Combines: System A Phase 1 (bootstrap) + Phase 2 (scenario intake) + System B Phase 1 (gather context).

1. **Existing council check**: if `council/config.md` exists, offer resume / new session / re-scaffold.
2. **Open question**: *"What do you want a council to help you with?"*
3. **Reformulation**: Claude produces a tight reformulation for confirmation. Confirmed text becomes `{{TOPIC}}`.
4. **Context discovery** (automatic, based on scenario):
   - If `Docs/` present: scan and index business documents -> `Docs/INDEX.md`
   - If in a codebase: scan project structure (`README.md`, `CLAUDE.md`, key files) for tech context
   - If neither: ask the user to describe their project/domain
5. **Generate** `council/domain-context.md` with labeled sections relevant to the scenario.

### Phase 2 -- Pattern and Protocol Selection

Combines: System A Phase 4 (pattern recommendation) + System B Phase 2 (select protocol).

1. Claude uses the scenario, domain context, and the extended recommender to select a pattern.
2. Ask **2-3 targeted questions** from the recommender tree (extended to cover 9 natively-supported patterns).
3. Present **primary + alternative** pattern with rationale, referencing recommender signals from pattern files.
4. Protocol defaults based on the chosen pattern's `default_protocol`. User can override.
5. Configure: `max_rounds` (default from protocol), `output_style` (brief/standard/detailed).

### Phase 3 -- Agent Composition

Combines: System A Phase 5 (agent selection within wizard) + System B Phase 3 (select personas) + Phase 4 (configure).

1. Using `{{TOPIC}}`, chosen pattern, domain context, and the full persona library (18 entries), Claude proposes **3-5 agents**.
2. For each: role title, focus, whether it maps to a library persona or is custom, and the reasoning.
3. User confirms, renames, adjusts focus, adds, removes, or requests custom agents.
4. **Reuse check**: scan `.claude/agents/` for existing agent files from prior councils. Offer to reuse with modifications.
5. For each agent: ask if they need a domain-specific skill (only if `.claude/skills/` has existing skills beyond council ones, or if the persona has a baseline skill template).

### Phase 4 -- HITL Configuration

From: System A Phase 3 (Telegram check).

1. Check for existing `.mcp.json` with `telegram-ask` registered.
2. Offer: Telegram setup (delegates to `council-telegram-setup`) or inline fallback.
3. Record `hitl_mode` in config.
4. Decline / fail -> `hitl_mode: inline` (first-class, not degraded).

### Phase 5 -- Generate and Launch Offer

Combines: System A Phase 6-7 (scaffold + launch offer) + System B Phase 5-6 (generate + summary). Absorbs the separate `council-scaffold` skill.

Generate all artifacts:
- `council/config.md` (YAML frontmatter: pattern, topic, max_rounds, hitl_mode, output_style, agents list, protocol, setup_date)
- `council/domain-context.md` (if not already present from Phase 1)
- `.claude/agents/coordinator.md` (assembled from pattern template + protocol + teammates table)
- `.claude/agents/<slug>.md` per teammate (assembled from three-layer composition: protocol + persona + domain context)
- `Docs/INDEX.md` (if `Docs/` has content)
- `.gitignore` update (ensure `.mcp.json` is ignored)
- `Sessions/` directory
- Optional: `.claude/skills/council-<slug>/SKILL.md` per agent that declared a domain skill

Summary: *"Council scaffolded -- N files created across M folders."* List all generated files.

Launch offer: *"Run the council now, or run later via council-launch?"*
- If now: hand off to `council-launch`.
- If later: point to `council-launch` and `council-resume` for future use.

### Collapsed flow example

For a clear request like *"Make me a council to analyze this public tender so I can write a proposal"*, Claude can collapse Phases 1-3 into a single response:

> I'll set up a **builder-validator** council for your tender analysis. The pattern fits because you need an artifact (proposal draft) validated for compliance.
>
> **Proposed team (4 agents):**
> | Agent | Focus | Source |
> |-------|-------|--------|
> | Legal Advisor | Contract terms, regulatory compliance | Library |
> | Financial Controller | Cost structure, pricing, margin analysis | Library |
> | Market Analyst | Competitive positioning, market context | Library |
> | Compliance Officer | Tender requirements checklist, formal compliance | Library |
>
> **Pattern**: builder-validator (Legal Advisor + Financial Controller draft; Market Analyst + Compliance Officer validate)
> **Protocol**: deliberative-voting (default)
> **HITL**: inline (no Telegram detected)
>
> Want me to adjust the team, or should I generate the council?

One confirmation and the wizard jumps to Phase 5.

---

## 8. Session Lifecycle

### Scaffold (Phase 5 of wizard)

Writes all artifacts. No separate skill invocation needed.

### Launch (`council-launch` skill)

Updated from System A:
- Reads `council/config.md` and `.claude/agents/*.md` (new path).
- Verifies preconditions (all referenced files exist, protocol variables resolved).
- Creates `Sessions/<topic-slug>/` with `config-snapshot.md` (frozen config copy).
- Composes the Agent Teams kickoff prompt:
  - Topic, pattern, coordinator instructions (from `.claude/agents/coordinator.md`)
  - Teammate list with spawn instructions
  - HITL mode and checkpoint behavior
  - Output paths and template reference
  - Execution constraints (max rounds, consensus/rejection rules)

### Run (Agent Teams native)

No custom runtime. Agent Teams orchestrates:
- Coordinator spawns teammates (reads `.claude/agents/*.md`)
- Teammates respond using protocol format
- Coordinator writes `round-N.md` after each round
- HITL checkpoints per pattern type (Telegram or inline)
- Consensus check -> final output, or escalation after max rounds

### Resume (`council-resume` skill)

Unchanged from System A:
- Discovers `Sessions/*/` directories
- Detects state: completed (final output exists), in-progress (rounds but no output), escalated (`escalation.md` exists)
- For in-progress: offers resume at Round N+1
- For completed: offers new session on same council
- For escalated: offers re-scaffold with adjusted scenario

---

## 9. HITL Integration

Three mechanisms, unchanged from System A:

| Mechanism | Source | When |
|-----------|--------|------|
| **Telegram** (`hitl_mode: telegram`) | `mcp/telegram-ask/` MCP server | `ask_operator(message)` sends to Telegram, long-polls for reply (600s timeout). TIMEOUT auto-continues. |
| **Inline** (`hitl_mode: inline`) | Native Claude Code chat | Coordinator asks directly in the chat session. Same message formats and reply parsing. |
| **Plan Approval** | Agent Teams native | Teammate actions require coordinator approval. Always available regardless of `hitl_mode`. |

HITL checkpoint types from System A are preserved:
- **Type A -- Round review**: after non-consensus rounds (summary + continue/stop/feedback)
- **Type B -- Clarification on deadlock**: on 2+ REJECT votes (ambiguities + clarification request)
- **Type C -- Plan/artifact approval**: for plan-execute-verify and builder-validator (approve/revise/stop)

---

## 10. What to Keep / Merge / Drop

### Keep as-is

| Item | Source | Path |
|------|--------|------|
| Plugin manifest | System A | `plugin.json`, `.claude-plugin/plugin.json` |
| 7 pattern files | System A | `references/patterns/*.md` |
| 6 output templates + briefs | System A | `references/output-templates/*.md` |
| Telegram MCP server | System A | `mcp/telegram-ask/` |
| `council-launch` skill | System A | `skills/council-launch/SKILL.md` (updated paths) |
| `council-resume` skill | System A | `skills/council-resume/SKILL.md` |
| `council-telegram-setup` skill | System A | `skills/council-telegram-setup/SKILL.md` |
| Validation scripts | System A | `scripts/validate-references.mjs` |
| Example councils | System A | `council-models/` (inert reference) |

### Merge (take best of both)

| Item | What changes |
|------|-------------|
| **Wizard skill** | Rewrite `skills/council-wizard/SKILL.md` to unified 5-phase flow |
| **Persona library** | 12 business archetypes reformatted to unified structure; 6 tech personas gain System A metadata; all 18 in `references/personas/` |
| **Pattern files** | Gain `default_protocol` frontmatter; vote semantics replaced with protocol variable references |
| **Recommender** | Extended to cover 9 natively-supported patterns (from 7) |
| **Domain context model** | System B's labeled sections + per-persona filtering applied to both business and tech scenarios |
| **Generation templates** | System B's templates migrated to `references/templates/`, renamed `.hbs` -> `.tmpl` |

### Drop

| Item | Reason |
|------|--------|
| `council-builder/` as separate skill directory | Absorbed into unified plugin |
| `council-scaffold` as separate skill | Absorbed into wizard Phase 5 |
| `.hbs` template extension | No Handlebars runtime involved; renamed to `.tmpl` |
| `council-log/` output path (System B) | Unified to `Sessions/<slug>/` |
| `CLAUDE.md` protocol injection (System B) | Protocol rules embedded in agent files instead; avoids `CLAUDE.md` conflicts |
| `council/agents/` path (System A) | Replaced by `.claude/agents/` (Agent Teams native) |

---

## 11. Migration Path

### Step 1 -- Restructure references directory

- Rename `references/role-archetypes/` to `references/personas/`
- Add the 6 tech personas from `council-builder/.claude/skills/council-builder/persona-library/` to `references/personas/`, adapted to unified format
- Create `references/protocols/` with:
  - `deliberative-voting.md` migrated from `council-builder/.claude/skills/council-builder/protocols/`
  - `adversarial-debate-protocol.md` (new, extracted from adversarial-debate pattern)
  - `convergent-investigation.md` (new, extracted from swarm pattern)
  - `_custom-template.md` migrated from council-builder
- Create `references/templates/` with:
  - `coordinator.md.tmpl` migrated from `council-builder/.claude/skills/council-builder/templates/coordinator.md.hbs`
  - `teammate.md.tmpl` migrated from `council-builder/.claude/skills/council-builder/templates/persona.md.hbs`
- Update the 12 business personas to unified format (add identity, competencies, behavior, vote guidelines, quality checklist, domain-context-sections)

### Step 2 -- Unify the wizard skill

- Rewrite `skills/council-wizard/SKILL.md` to the 5-phase flow described in section 7
- Remove `skills/council-scaffold/SKILL.md` (its logic moves into Phase 5 of the wizard)

### Step 3 -- Update pattern files

- Add `default_protocol:` to each pattern's YAML frontmatter
- Replace hardcoded vote semantics in coordinator/teammate templates with protocol variable placeholders
- Verify recommender signals still work with the extended recommender

### Step 4 -- Update launch and resume skills

- Update `skills/council-launch/SKILL.md` to read agent files from `.claude/agents/` instead of `council/agents/`
- Verify `skills/council-resume/SKILL.md` is consistent with new session paths

### Step 5 -- Update plugin manifest and validation

- Update `plugin.json` description and keywords for both business and tech audiences
- Extend `scripts/validate-references.mjs` to validate `protocols/`, `personas/` (new name), and `templates/`

### Step 6 -- Archive council-builder

- Move `council-builder/` to `docs/archived/council-builder/` as reference material
- Retain `council-builder/PROMPT.md` and `council-builder/README.md` in the archive for historical context

### Step 7 -- Update documentation

- Rewrite `README.md` for the unified plugin
- Update any references to old paths in design specs

---

## 12. Open Questions

### Q1: Should `council-scaffold` remain a separate skill?

**Proposed answer**: No -- absorb into wizard Phase 5.

**Argument for keeping it**: Separate skills enable re-scaffolding without re-running the full wizard (e.g., after editing config manually). The wizard already handles this via Phase 1 bootstrap detection ("re-scaffold" option).

**Argument for absorbing**: The scaffold logic is mechanical file generation. Users never invoke it independently. The wizard's Phase 1 already offers re-scaffold as an entry point. Keeping it separate adds a handoff point that complicates the flow.

**Decision needed**: Does anyone use `council-scaffold` independently today?

### Q2: Should the `CLAUDE.md` protocol injection be preserved?

**Proposed answer**: No -- embed protocol rules directly in agent files.

**Argument for keeping**: Shared protocol rules in `CLAUDE.md` ensure all agents (including the coordinator) follow the same rules from a single source of truth. Easier to update one file than N agent files.

**Argument against**: Writing to `CLAUDE.md` risks conflicting with the user's own project-level instructions. Making agent files self-contained is safer and more portable. The coordinator file already references the protocol.

**Decision needed**: Is there a use case where agents need to discover protocol rules from `CLAUDE.md` rather than having them embedded?

### Q3: How rich should dynamic agent generation be?

The plan proposes that Claude generates full persona definitions (identity, competencies, behavior, vote guidelines, quality checklist) from scratch when no library persona fits. This is ambitious -- the quality of generated personas depends heavily on Claude's ability to reason about what a domain expert would care about.

**Conservative option**: Only match from the library. If no match, ask the user to describe the agent's focus and generate a minimal agent file (role description + behavior rules only).

**Ambitious option**: Generate full personas from scratch, including vote guidelines and quality checklists, using the `_custom-template.md` as a structural guide.

**Decision needed**: What quality bar do we expect for generated personas? Should they match library entry depth?

### Q4: Should the recommender be AI-driven or rule-based?

The current recommender is a decision tree (3 questions -> pattern). The unified system could:

**Option A**: Keep the decision tree, extend it to cover 9 patterns. Predictable, debuggable, but rigid.

**Option B**: Let Claude reason directly about pattern fit using the pattern files' recommender signals and the scenario description. More flexible, but less predictable.

**Option C**: Hybrid -- use the decision tree as a starting point, let Claude adjust based on scenario keywords and recommender signals. This is what System A's wizard already does informally.

**Decision needed**: How important is recommendation reproducibility?

### Q5: Protocol composability -- feature or foot-gun?

Making protocols independent of patterns enables combinations like hub-and-spoke + convergent-investigation. This is powerful but could produce nonsensical results (e.g., adversarial-debate-protocol on an ensemble-voting topology).

**Proposed approach**: Each pattern declares a `default_protocol`. The wizard uses the default without prompting. Custom combinations are documented as an advanced feature, not surfaced in the wizard flow.

**Decision needed**: Should the wizard ever suggest non-default protocol pairings?

### Q6: What happens to `council-builder/PROMPT.md`?

This 810-line document is the most detailed specification of the three-layer composition model, template variable system, and generation quality criteria. It's too detailed to include in a SKILL.md file.

**Options**:
- Archive it under `docs/` as reference material
- Extract the essential generation instructions into the wizard SKILL.md and template files
- Keep it as a separate reference document that the wizard SKILL.md points to

**Decision needed**: How much of PROMPT.md's detail should survive in the unified wizard?

### Q7: Language considerations

`agent-interaction-patterns.md` is in Italian. The unified plugin defaults to English. Should the Italian document be translated, kept as-is (internal reference only), or maintained in both languages?

### Q8: Persona naming -- `product-analyst` vs `pm-facilitator`

Both exist in the unified library. They serve different roles:
- `pm-facilitator` (business): PM as facilitator -- scope, roadmap, success metrics, stakeholder alignment
- `product-analyst` (tech): PM as analyst -- user stories, acceptance criteria, INVEST principles, requirements decomposition

**Decision needed**: Are the names clear enough to avoid confusion? Should one be renamed?

---

## Appendix A: Pattern Compatibility Matrix

From `agent-interaction-patterns.md` (15 patterns, Agent Teams compatibility):

| Pattern | Category | Support | In unified plugin? |
|---------|----------|---------|---------------------|
| Hub-and-Spoke | Hierarchical | Native | Yes (pattern file) |
| Sequential Pipeline | Hierarchical | Workaround | No (first release) |
| Hierarchical Decomposition | Hierarchical | Not supported | No |
| Adversarial Debate | Peer-to-Peer | Native | Yes (pattern file) |
| Collaborative Refinement | Peer-to-Peer | Workaround | No (first release) |
| Swarm / Parallel Investigation | Peer-to-Peer | Native | Yes (pattern file) |
| Negotiation / Interface Contract | Peer-to-Peer | Native | No (first release, niche) |
| Builder / Validator | Quality Control | Native | Yes (pattern file) |
| Plan / Execute / Verify | Quality Control | Native | Yes (pattern file) |
| Critic / Refine Loop | Quality Control | Workaround | No (first release) |
| Specialist Router | Specialized | Workaround | No (first release) |
| Map / Reduce | Specialized | Native | Yes (pattern file) |
| Ensemble / Voting | Specialized | Native | Yes (pattern file) |
| Memory-Augmented Agent | Specialized | Not supported | No |
| Human-in-the-Loop | Specialized | Native | Yes (via HITL integration) |

The 7 natively-supported patterns with dedicated pattern files are included. Negotiation/Interface Contract is native but too niche for the first release.

---

## Appendix B: Unified Persona Format Example

Showing how a business persona (market-analyst) would look in the unified format:

```yaml
---
id: market-analyst
name: Market Analyst
category: business
domains: [market, competition, positioning, TAM, pricing, demand]
fits_patterns: [hub-and-spoke, map-reduce, ensemble-voting, swarm]
domain-context-sections: [overview, market-landscape, stakeholders, documents-index]
---
```

```markdown
# Market Analyst

## Role description

Frames **market structure**, **competitive dynamics**, and **customer demand**
for the scenario. Surfaces evidence from internal and external context documents
and states assumptions explicitly.

## Identity

You are an expert in **market analysis and competitive intelligence**, with deep
knowledge of industry dynamics, customer segmentation, and strategic positioning.
You think in terms of market forces, competitive moats, and demand signals. You
are the guardian of evidence-based market reasoning.

Your role is to ensure that every proposal is grounded in market reality, accounts
for competitive dynamics, and quantifies opportunity where possible.

## Core Competencies

- Sizing markets (TAM/SAM/SOM) with explicit assumption labeling
- Mapping competitive landscapes and identifying strategic gaps
- Analyzing customer demand signals and segmentation
- Evaluating pricing and positioning strategies
- Identifying market risks and entry barriers
- Distinguishing facts (from documents) from inferences

## Behavior in the Council

1. **Scan context**: read relevant documents from `Docs/INDEX.md` tagged market,
   competition, customer, strategy, or matching `{{INDUSTRY_FOCUS}}`
2. **Frame the market**: market size, growth trajectory, key players, dynamics
3. **Assess competitive position**: strengths, weaknesses, gaps in the market
4. **Evaluate implications**: what the market data means for the decision at hand
5. **State assumptions**: separate documented facts from inferred positions
6. **Identify what would change your view**: key uncertainties and triggers

## What You Care About

- Evidence over opinion -- cite documents, data, comparable markets
- Explicit assumption labeling (approximate figures marked as such)
- Competitive context for every recommendation
- Market timing and window of opportunity
- Customer perspective grounded in segmentation

## What You Defer to Others

- Legal and regulatory feasibility (defer to Legal Advisor / Compliance Officer)
- Financial modeling and cost structure (defer to Financial Controller)
- Operational execution capacity (defer to Operations Expert)

## Vote Guidelines

| Situation | Vote |
|-----------|------|
| Proposal is well-grounded in market evidence | APPROVE |
| Market data contradicts or is missing for a key assumption | OBJECT |
| Alternative positioning or market approach warranted | PROPOSE |
| Topic has no market dimension | ABSTAIN |
| Topic is too vague to assess market implications | REJECT |

## Quality Checklist

- [ ] Market sizing included with explicit methodology
- [ ] Competitive landscape mapped (key players identified)
- [ ] Customer segment implications addressed
- [ ] Pricing/positioning implications considered
- [ ] Facts from documents separated from inferences
- [ ] Key assumptions explicitly stated
- [ ] What-would-change-my-view identified

## Baseline skill template

(fenced SKILL.md for optional deep domain skill generation -- from System A)

## Typical questions answered

- What is the market opportunity?
- Who are the key competitors and what are their strengths?
- Is the proposed positioning defensible?
- What does the demand data suggest about timing?

## Customization slots

- `{{INDUSTRY_FOCUS}}` -- specific industry or vertical
- `{{GEOGRAPHY}}` -- target market geography
- `{{TIME_HORIZON}}` -- analysis time frame
```

---

## Appendix C: File Inventory -- What Moves Where

| Current location | Action | New location |
|-----------------|--------|-------------|
| `references/role-archetypes/*.md` | Rename dir, reformat files | `references/personas/*.md` |
| `council-builder/.../persona-library/*.md` | Migrate, adapt format | `references/personas/*.md` |
| `council-builder/.../protocols/deliberative-voting.md` | Migrate | `references/protocols/deliberative-voting.md` |
| `council-builder/.../protocols/_custom-template.md` | Migrate | `references/protocols/_custom-template.md` |
| `council-builder/.../templates/coordinator.md.hbs` | Migrate, rename | `references/templates/coordinator.md.tmpl` |
| `council-builder/.../templates/persona.md.hbs` | Migrate, rename | `references/templates/teammate.md.tmpl` |
| `council-builder/.../templates/claude-md-protocol-section.md.hbs` | Drop | (protocol embedded in agent files instead) |
| `council-builder/.../domain-contexts/_context-template.md` | Migrate | `references/templates/domain-context.md.tmpl` |
| `council-builder/.../domain-contexts/distributed-playground.md` | Archive | `docs/archived/council-builder/domain-contexts/` |
| `council-builder/PROMPT.md` | Archive | `docs/archived/council-builder/PROMPT.md` |
| `council-builder/README.md` | Archive | `docs/archived/council-builder/README.md` |
| `skills/council-scaffold/SKILL.md` | Drop (absorbed) | Logic moves into wizard Phase 5 |
| `skills/council-wizard/SKILL.md` | Rewrite | `skills/council-wizard/SKILL.md` (5-phase) |
| `skills/council-launch/SKILL.md` | Update paths | `skills/council-launch/SKILL.md` |
| `skills/council-resume/SKILL.md` | Verify paths | `skills/council-resume/SKILL.md` |
| `references/patterns/*.md` | Update frontmatter | `references/patterns/*.md` |
| `references/recommender/questions.md` | Extend | `references/recommender/questions.md` |
| `scripts/validate-references.mjs` | Extend | `scripts/validate-references.mjs` |
