# Council Plugin -- Design & Specification

**Status**: Authoritative reference for the unified system
**Date**: 2026-04-22
**Source**: Unification of council-plugin (System A) and council-builder (System B)

---

## 1. Overview

Council Plugin is a **Claude Code / Cowork plugin** that lets any user -- business or technical -- convene a **Council of Agents** through conversation. The user describes what they need; the plugin handles pattern selection, agent composition, file generation, and launch. No pre-existing agents or skills required.

> *"Make me a Council of Agents to analyze this public tender so I can write a proposal"* -- and the system does the rest.

**Primary target**: Claude Cowork (desktop/web). Inline HITL is the interaction mode. The wizard flow is optimized for Cowork's chat interface. CLI remains fully supported but is not the assumed default.

**Runtime**: Agent Teams. The plugin generates files; Agent Teams runs them. No custom runtime.

### 1.1 Target users

- **Business users**: product managers, legal operations professionals, strategy consultants, founders -- people who need multiple expert perspectives on a decision without writing agent configs.
- **Technical users**: engineers, architects, QA leads, security engineers -- people running structured technical reviews, design critiques, or multi-perspective analyses in a codebase context.

Both groups share the same plugin. The wizard detects the scenario domain (business / tech / mixed) and adapts persona proposals, domain context, and output templates accordingly.

Prerequisite: access to Claude Cowork (desktop/web) or Claude Code CLI, and a project folder with relevant documents or code.

### 1.2 Non-goals (first release)

- Custom pattern authoring by end users (templates are predefined).
- Patterns not natively supported by Agent Teams (⚠️ workaround or ❌ unsupported).
- Cross-session semantic memory or RAG over documents (agents read files on demand per session).
- Multi-model cost optimization (Agent Teams uses a single Opus model per session).
- Scheduling or unattended council execution (each session is interactive).
- Multi-language output (English only in first release).
- Cross-council shared knowledge bases.

### 1.3 Agent Teams constraints

The plugin is designed to work **with** these constraints, not around them:

- No nested teams -- only the lead (coordinator) agent orchestrates; teammates cannot spawn sub-teams.
- No session resumption at the platform level -- teams are ephemeral; all state lives in the project filesystem.
- Teammates have reduced tools -- no `AgentTool`, `TeamCreate/Delete`, `Cron*` available to teammates.
- Single model across all agents (Opus).
- One team per session -- a project runs one council at a time.
- Native Plan Approval and Delegate Mode are available and used for HITL without custom tooling.

---

## 2. Architecture

### 2.1 Plugin repository layout

```
council-plugin/                              (this repo, installed as plugin)
  CLAUDE.md                                  project instructions for Claude Code
  plugin.json
  .claude-plugin/plugin.json                 canonical plugin manifest
  README.md
  skills/
    council-wizard/SKILL.md                  unified 5-phase wizard
    council-launch/SKILL.md                  compose Agent Teams kickoff
    council-resume/SKILL.md                  re-open prior sessions
  references/
    patterns/                                7 pattern files (topology + prompts)
      hub-and-spoke.md
      swarm.md
      adversarial-debate.md
      map-reduce.md
      plan-execute-verify.md
      ensemble-voting.md
      builder-validator.md
    protocols/                               interaction rule definitions
      deliberative-voting.md                 default protocol
      adversarial-debate-protocol.md         debate-specific rules
      convergent-investigation.md            hypothesis-driven investigation
      _custom-template.md                    user extension schema
    personas/                                unified persona library (19 entries)
      # Business personas (12)
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
      # Tech personas (6)
      architect.md
      product-analyst.md
      qa-strategist.md
      security-engineer.md
      devops-engineer.md
      ux-designer.md
      # System personas (1) -- fixed, non-customizable
      devils-advocate.md
      _custom-template.md                    user extension schema
    output-templates/                        6 templates + brief variants
    recommender/
      questions.md                           extended pattern recommender
    templates/                               generation skeletons
      coordinator.md.tmpl                    coordinator agent template
      teammate.md.tmpl                       persona agent template
      domain-context.md.tmpl                 domain context template
      devils-advocate-review.md              Step 4 instructions injected via {{DEVILS_ADVOCATE_PHASE}}
  scripts/
    validate-references.mjs                  extended for new directories
  council-models/                            reference examples (not used by runtime)
  docs/
    SPEC.md                                  this document
    TODO.md                                  implementation backlog
    UNIFICATION-PLAN.md                      historical merge plan
    PATTERNS.md                              15-pattern catalog in Italian (reference only)
```

### 2.2 Generated user-project layout

When the wizard runs in a user project, it generates:

```
<user-project>/
  .claude/
    agents/                                  CANONICAL agent location
      coordinator.md                         lead agent (Agent Teams reads this)
      <role-slug>.md                         one per teammate
      devils-advocate.md                     system reviewer (generated if devils_advocate: true)
    skills/                                  OPTIONAL per-agent domain skills
      council-<role-slug>/SKILL.md           only when deep domain grounding needed
  council/
    config.md                                council metadata (YAML frontmatter)
    domain-context.md                        scenario/project knowledge
  Docs/                                      business documents (if applicable)
    INDEX.md                                 auto-generated index
  Sessions/<topic-slug>/
    config-snapshot.md                       frozen config at launch time
    round-1.md ... round-N.md               round logs
    <output>.md                              final output (decision|findings|...)
    escalation.md                            if no consensus after max rounds
    devils-advocate-review.md                challenge + resolution audit (if Phase 2 ran)
```

Key difference from the pre-unification layout: agent files live at `.claude/agents/` (Agent Teams native discovery path) instead of `council/agents/`.

### 2.3 Three-layer composition model

Every generated agent file is assembled from three independent layers:

```
Agent File = Protocol Layer + Persona Layer + Domain Context Layer
```

**Protocol Layer** (from `references/protocols/*.md`):
- Vote semantics, response format, consensus rules, escalation behavior
- Shared identically across all agents in a council
- Independent of topology (pattern)
- Embedded directly in agent files, NOT injected into CLAUDE.md

**Persona Layer** (from `references/personas/*.md` or dynamically generated):
- Role identity, core competencies, behavior rules
- Care/defer boundaries, vote guidelines, quality checklist
- Project-agnostic and reusable across councils
- Library entries serve as seeds; custom personas generated to match scenarios

**Domain Context Layer** (from `council/domain-context.md`, filtered per persona):
- Project/scenario-specific knowledge
- Labeled sections (overview, services, tech-stack, etc.)
- Each persona declares which sections it needs via `domain-context-sections`
- Business and tech section vocabularies coexist in the same file

The templates (`references/templates/*.tmpl`) define the structural skeleton and injection points for each layer. The `.tmpl` extension is a convention marker -- the actual "rendering" is done by Claude reading the template and filling it in, not by a template engine.

### 2.4 Runtime model (Agent Teams on Cowork & CLI)

The plugin generates static files. Agent Teams is the only runtime:

1. **Wizard** generates `.claude/agents/*.md`, `council/config.md`, `council/domain-context.md`, and optional skills
2. **Agent Teams** discovers agents from `.claude/agents/`, spawns coordinator as lead
3. **Coordinator** reads its agent file, spawns teammates, runs the deliberative cycle (Phase 1)
4. **Teammates** respond using the protocol format embedded in their agent files
5. **Round logs** and **final output draft** are written to `Sessions/<slug>/`
6. **Coordinator** runs the Devil's Advocate review (Phase 2) if enabled: spawns the Devil's Advocate, feeds it the Phase 1 output, consolidates challenges, overwrites the final output with the consolidated version, writes `devils-advocate-review.md`

The same generated artifacts work identically on Cowork and CLI. No runtime differences.

---

## 3. Persona System

### 3.1 Unified persona file format

All 19 library personas and any dynamically generated personas follow this structure:

**YAML frontmatter:**

```yaml
---
id: <slug>
name: <Display Name>
category: business | tech | cross-functional
domains: [keyword1, keyword2, ...]
fits_patterns: [pattern-id, ...]
domain-context-sections: [overview, ...]
---
```

| Field | Purpose |
|-------|---------|
| `id` | Kebab-case slug, used as filename and agent file name |
| `name` | Human-readable display name |
| `category` | `business`, `tech`, or `cross-functional` |
| `domains` | Keywords for scenario matching (from System A) |
| `fits_patterns` | Pattern IDs where this persona fits naturally (from System A) |
| `domain-context-sections` | Which sections of the domain context file this persona needs (from System B) |

**Mandatory sections** (all required for library entries):

1. **Role description** -- 2-3 lines, project-agnostic summary of what this persona does
2. **Identity** -- expertise paragraph establishing the persona's professional identity and role guarantee
3. **Core Competencies** -- 5-7 bulleted capabilities
4. **Behavior in the Council** -- numbered steps the persona follows when receiving a topic
5. **What You Care About** -- bulleted priorities and values
6. **What You Defer to Others** -- what falls outside this persona's scope, with role references
7. **Vote Guidelines** -- table mapping situations to vote choices (APPROVE, OBJECT, PROPOSE, ABSTAIN, REJECT)
8. **Quality Checklist** -- 7-10 verifiable checks the persona runs before responding
9. **Baseline skill template** -- optional fenced SKILL.md for deep domain skill generation
10. **Customization slots** -- `{{VARIABLE}}` markers for scenario-specific adaptation

### 3.2 Persona catalog (18 entries)

**Business personas (12)** -- from System A, enriched with System B structured sections:

| ID | Name | Domains |
|----|------|---------|
| `market-analyst` | Market Analyst | market, competition, positioning, TAM |
| `legal-advisor` | Legal Advisor | legal, contracts, regulation, liability |
| `financial-controller` | Financial Controller | finance, cost, budget, pricing, margin |
| `compliance-officer` | Compliance Officer | compliance, regulation, audit, policy |
| `brand-strategist` | Brand Strategist | brand, marketing, positioning, messaging |
| `hr-partner` | HR Partner | HR, talent, organization, culture |
| `risk-officer` | Risk Officer | risk, mitigation, contingency, exposure |
| `operations-expert` | Operations Expert | operations, logistics, supply chain, process |
| `customer-advocate` | Customer Advocate | customer, UX, satisfaction, retention |
| `data-analyst` | Data Analyst | data, analytics, metrics, KPI |
| `pm-facilitator` | PM Facilitator | project, scope, roadmap, stakeholder |
| `moderator-neutral` | Moderator (Neutral) | facilitation, synthesis, mediation |

**Tech personas (6)** -- from System B, enriched with System A metadata:

| ID | Name | Domains |
|----|------|---------|
| `architect` | Architect | architecture, system design, integration, patterns |
| `product-analyst` | Product Analyst | requirements, user stories, acceptance criteria |
| `qa-strategist` | QA Strategist | testing, quality, edge cases, test strategy |
| `security-engineer` | Security Engineer | security, threat modeling, auth, data protection |
| `devops-engineer` | DevOps Engineer | deployment, CI/CD, infrastructure, observability |
| `ux-designer` | UX Designer | user experience, interaction design, accessibility |

Note: `pm-facilitator` (business) and `product-analyst` (tech) are distinct roles. PM Facilitator focuses on scope, roadmap, success metrics, and stakeholder alignment. Product Analyst focuses on user stories, acceptance criteria, INVEST principles, and requirements decomposition.

**System personas (1)** -- fixed, non-customizable; used only by the plugin itself:

| ID | Name | Role |
|----|------|------|
| `devils-advocate` | Devil's Advocate | Post-deliberation reviewer spawned by the coordinator in Phase 2 |

The Devil's Advocate is not a council participant. It is never listed in the `agents` section of `council/config.md` and never appears in the `{{TEAMMATES_TABLE}}` in the coordinator. It is spawned only during Step 4 (post-deliberation review) if `devils_advocate: true`. Its persona is pedantic by design: it challenges every conclusion for contradictions, errors, vague language, unstated assumptions, and unspecified elements.

### 3.3 Domain context sections vocabulary

Business and tech personas use overlapping but distinct domain context sections:

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

The wizard generates only the sections relevant to the scenario's domain (business, tech, or mixed).

### 3.4 Dynamic generation strategy

When the user describes their scenario, Claude:

1. **Analyzes** the scenario to identify domain (business/tech/mixed), key perspectives needed, tension structure, and stakeholders.
2. **Matches** each needed perspective against the 18 library personas using `domains` and `fits_patterns` metadata.
3. **For matches**: loads the persona file, adapts customization slots and identity to the scenario.
4. **For gaps** (e.g., "customs regulations expert for EU agricultural imports"): generates a full persona following the unified format, using `_custom-template.md` as the structural schema.
5. **Before generating**: checks `.claude/agents/` for existing agent files. If a prior council left agents that match, offers to reuse (with optional modifications).

Every generated persona -- library-based or custom -- must include all mandatory sections. The generation template (`references/templates/teammate.md.tmpl`) enforces this by requiring injection points for each section.

### 3.5 Custom persona template

`references/personas/_custom-template.md` provides a blank schema with comments explaining each section. Users or Claude can copy it to create new personas. Custom personas follow the same format as library entries and are validated by the same rules.

---

## 4. Pattern & Protocol System

### 4.1 Pattern files (topology)

Seven pattern files in `references/patterns/`, each defining:

| Section | Content |
|---------|---------|
| YAML frontmatter | `id`, `name`, `native_support`, `min_agents`, `max_agents`, `output_template`, `default_protocol` |
| When to use | Scenario description |
| Recommender signals | Keywords for matching |
| Role shape | Typical team composition |
| Coordinator prompt template | With `{{PROTOCOL_VARIABLES}}` placeholders |
| Teammate prompt template | With `{{PROTOCOL_VARIABLES}}` placeholders |
| HITL checkpoints | Type A (round review), Type B (deadlock), Type C (plan approval) |
| Output mapping | Which output template to use and how to fill it |

The critical design: coordinator and teammate prompt templates use protocol variable placeholders (`{{VOTE_OPTIONS}}`, `{{CONSENSUS_RULE}}`, `{{REJECTION_RULE}}`, `{{OUTPUT_FORMATS}}`, `{{RESPONSE_FORMAT_EXAMPLE}}`, `{{BEHAVIORAL_RULES}}`) instead of embedding specific vote semantics. Protocol injection happens at generation time.

### 4.2 Protocol files (interaction rules)

Directory `references/protocols/` with standalone protocol definitions:

**`deliberative-voting.md`** (default, migrated from System B):
- Vote options: PROPOSE, OBJECT, APPROVE, ABSTAIN, REJECT
- Response format: `## [Role] -- Round {N} Response` + Vote + Reasoning + Details
- Consensus: all non-abstaining vote APPROVE
- Rejection: 2+ REJECT -> stop, write rejection.md
- Escalation: max rounds without consensus -> escalation.md
- Behavioral rules for coordinator (neutrality, completeness, transparency, efficiency)
- Output paths use `Sessions/<slug>/` (not `council-log/`)

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

**`_custom-template.md`** (from System B):
- Schema for user-defined protocols with all required sections
- Includes comments explaining each section's purpose

### 4.3 Pattern-protocol pairings

Each pattern declares a `default_protocol` in its frontmatter:

| Pattern | Default Protocol | Rationale |
|---------|-----------------|-----------|
| hub-and-spoke | deliberative-voting | Multi-specialist consensus requires structured votes |
| swarm | convergent-investigation | Parallel hypotheses need evidence-based convergence |
| adversarial-debate | adversarial-debate-protocol | Binary debate has its own structure |
| map-reduce | deliberative-voting | Aggregation phase benefits from vote-based synthesis |
| plan-execute-verify | deliberative-voting | Approval gates map to APPROVE/OBJECT votes |
| ensemble-voting | deliberative-voting | Independent voting is the core mechanic |
| builder-validator | deliberative-voting | Validation feedback maps to APPROVE/OBJECT |

The wizard uses the default protocol without prompting. Non-default combinations are an advanced feature, not surfaced in the wizard flow.

### 4.4 Generation templates & variable reference

Three template files in `references/templates/`:

**`coordinator.md.tmpl`** -- generates `.claude/agents/coordinator.md`:

| Variable | Source | Filled at |
|----------|--------|-----------|
| `{{TOPIC}}` | Left as literal | Runtime (council launch) |
| `{{TOPIC_SLUG}}` | Left as literal | Runtime (council launch) |
| `{{TEAMMATES_TABLE}}` | Generated from selected personas | Generation time |
| `{{MAX_ROUNDS}}` | Protocol config (default 4) | Generation time |
| `{{VOTE_OPTIONS}}` | Protocol file | Generation time |
| `{{CONSENSUS_RULE}}` | Protocol file | Generation time |
| `{{REJECTION_RULE}}` | Protocol file | Generation time |
| `{{OUTPUT_FORMATS}}` | Protocol file (round/decision/rejection/escalation templates) | Generation time |
| `{{BEHAVIORAL_RULES}}` | Protocol file | Generation time |
| `{{CONTEXT_REFERENCES}}` | Generated list of skill references per persona | Generation time |
| `{{DEVILS_ADVOCATE_PHASE}}` | Full contents of `references/templates/devils-advocate-review.md` (if `devils_advocate: true`) or empty string (if `devils_advocate: false`) | Generation time |

**`teammate.md.tmpl`** -- generates `.claude/agents/<slug>.md`:

| Variable | Source | Filled at |
|----------|--------|-----------|
| `{{ROLE_NAME}}` | Persona library or generated | Generation time |
| `{{ROLE_DESCRIPTION_SHORT}}` | One-line, for coordinator's teammates table | Generation time |
| `{{IDENTITY_BLOCK}}` | Persona library (Identity section) | Generation time |
| `{{COMPETENCIES}}` | Persona library (Core Competencies) | Generation time |
| `{{BEHAVIOR_RULES}}` | Persona library (Behavior in the Council) | Generation time |
| `{{CARE_ABOUT}}` | Persona library (What You Care About) | Generation time |
| `{{DEFER_TO}}` | Persona library (What You Defer to Others) | Generation time |
| `{{VOTE_OPTIONS}}` | Protocol file | Generation time |
| `{{RESPONSE_FORMAT_EXAMPLE}}` | Generated from protocol + role name | Generation time |
| `{{VOTE_GUIDELINES_TABLE}}` | Persona library (Vote Guidelines) | Generation time |
| `{{DOMAIN_SKILL_REF}}` | Optional -- only if a matching skill exists | Generation time |
| `{{DOMAIN_CONTEXT_BLOCK}}` | Assembled from domain context sections | Generation time |
| `{{QUALITY_CHECKLIST}}` | Persona library (Quality Checklist) | Generation time |
| `{{CONSOLE_REPORTING}}` | Protocol (if enabled) | Generation time |

**`domain-context.md.tmpl`** -- generates `council/domain-context.md`:
- Section structure with labeled headers
- Comments indicating which personas typically need each section
- Both business and tech section vocabularies included

---

## 5. Wizard Flow (5 phases)

The 8-phase wizard (System A) and 6-phase wizard (System B) merge into a streamlined 5-phase conversational flow. Phases are logical steps, not mandatory sequential gates -- Claude can collapse multiple phases in a single response when the user's intent is clear enough.

### Phase 1 -- Scenario Intake and Context Discovery

1. **Existing council check**: if `council/config.md` exists, offer:
   - Resume (delegates to `council-resume`)
   - New session on same council
   - Re-scaffold (jump to Phase 5 after confirming pattern/agents may change)

2. **Open question**: *"What do you want a council to help you with?"*

3. **Reformulation**: Claude produces a tight reformulation for confirmation. Confirmed text becomes `{{TOPIC}}`.

4. **Context discovery** (automatic, based on scenario):
   - If `Docs/` present: scan and index business documents -> `Docs/INDEX.md`
   - If in a codebase: scan project structure (`README.md`, `CLAUDE.md`, key files) for tech context
   - If neither: ask the user to describe their project/domain

5. **Generate** `council/domain-context.md` with labeled sections relevant to the scenario.

### Phase 2 -- Pattern and Protocol Selection

1. Claude uses the scenario, domain context, and the extended recommender to select a pattern.

2. Ask **2-3 targeted questions** from the recommender tree (extended to cover all 7 patterns).

3. Present **primary + alternative** pattern with rationale, referencing recommender signals from pattern files.

4. Protocol defaults based on the chosen pattern's `default_protocol`. User can override.

5. Configure: `max_rounds` (default from protocol), `output_style` (brief/standard/detailed).

### Phase 3 -- Agent Composition

1. Using `{{TOPIC}}`, chosen pattern, domain context, and the full persona library (18 entries), Claude proposes **3-5 agents**.

2. For each: role title, focus, whether it maps to a library persona or is custom, and the reasoning.

3. User confirms, renames, adjusts focus, adds, removes, or requests custom agents.

4. **Reuse check**: scan `.claude/agents/` for existing agent files from prior councils. Offer to reuse with modifications.

5. For each agent: ask if they need a domain-specific skill (only if relevant skills exist or the persona has a baseline skill template).

### Phase 4 -- HITL Confirmation

Inline HITL is the only interaction mode. The coordinator asks checkpoint questions directly in the chat session. No setup required.

Confirm to the user that checkpoints will appear inline during the council run and that Plan Approval (native Agent Teams) is always available.

**Devil's Advocate review (Phase 2)**: The wizard confirms that a Devil's Advocate review is enabled by default. The user may opt out (not recommended). The review is fixed and non-customizable. The opt-out decision is recorded as `devils_advocate: true | false` in `council/config.md`.

### Phase 5 -- Generate and Launch Offer

Generate all artifacts:

- `council/config.md` (YAML frontmatter: pattern, topic, max_rounds, output_style, `devils_advocate`, agents list, protocol, setup_date)
- `council/domain-context.md` (if not already present from Phase 1)
- `.claude/agents/coordinator.md` (assembled from pattern template + protocol + teammates table; `{{DEVILS_ADVOCATE_PHASE}}` filled from `references/templates/devils-advocate-review.md` if `devils_advocate: true`, or empty if false)
- `.claude/agents/devils-advocate.md` (if `devils_advocate: true`; assembled from `teammate.md.tmpl` using the `devils-advocate` persona and same protocol as council; NOT listed in `{{TEAMMATES_TABLE}}`)
- `.claude/agents/<slug>.md` per teammate (assembled from three-layer composition: protocol + persona + domain context)
- `Docs/INDEX.md` (if `Docs/` has content)
- `Sessions/` directory
- Optional: `.claude/skills/council-<slug>/SKILL.md` per agent that declared a domain skill

Summary: *"Council scaffolded -- N files created across M folders."* List all generated files.

Launch offer: *"Run the council now, or run later via council-launch?"*
- If now: hand off to `council-launch`
- If later: point to `council-launch` and `council-resume` for future use

### Collapsed flow example

For a clear request like *"Make me a council to analyze this public tender so I can write a proposal"*, Claude can collapse Phases 1-3 into a single response:

> I'll set up a **builder-validator** council for your tender analysis. The pattern fits because you need an artifact (proposal draft) validated for compliance.
>
> **Proposed team (4 agents):**
>
> | Agent | Focus | Source |
> |-------|-------|--------|
> | Legal Advisor | Contract terms, regulatory compliance | Library |
> | Financial Controller | Cost structure, pricing, margin analysis | Library |
> | Market Analyst | Competitive positioning, market context | Library |
> | Compliance Officer | Tender requirements checklist, formal compliance | Library |
>
> **Pattern**: builder-validator (Legal Advisor + Financial Controller draft; Market Analyst + Compliance Officer validate)
> **Protocol**: deliberative-voting (default)
> **HITL**: inline
>
> Want me to adjust the team, or should I generate the council?

One confirmation and the wizard jumps to Phase 5.

---

## 6. Session Lifecycle

### 6.1 Scaffold (Phase 5 of wizard)

Writes all artifacts. No separate skill invocation needed. The `council-scaffold` skill is absorbed into the wizard's Phase 5. Scaffold logic is mechanical file generation -- users never invoke it independently.

### 6.2 Launch (`council-launch` skill)

- Reads `council/config.md` and `.claude/agents/*.md` (canonical path).
- Verifies preconditions: all referenced files exist, protocol variables resolved.
- Creates `Sessions/<topic-slug>/` with `config-snapshot.md` (frozen config copy).
- Composes the Agent Teams kickoff prompt:
  - Topic, pattern, coordinator instructions (from `.claude/agents/coordinator.md`)
  - Teammate list with spawn instructions
  - Inline HITL checkpoint behavior
  - Output paths and template reference
  - Execution constraints (max rounds, consensus/rejection rules)
  - Output style (brief/standard/detailed) and its implications

### 6.3 Run (Agent Teams native)

No custom runtime. Agent Teams orchestrates:

**Phase 1 -- Deliberation:**
1. Coordinator spawns teammates (reads `.claude/agents/*.md`; does NOT spawn `devils-advocate.md` yet)
2. Teammates respond using protocol format
3. Coordinator writes `round-N.md` after each round
4. Inline HITL checkpoints per pattern type
5. Consensus check -> Phase 1 output file written, or escalation after max rounds

**Phase 2 -- Devil's Advocate Review** (if `devils_advocate: true` in config and Phase 1 reached output):
6. Coordinator asks operator inline: proceed with Devil's Advocate review or skip?
7. If proceed: coordinator spawns `devils-advocate.md`, feeds it the Phase 1 output + topic
8. Devil's Advocate challenges the output across 5 categories: contradictions, errors, vagueness, unstated assumptions, unspecified elements
9. Coordinator addresses each challenge (accept/partially-accept/dismiss with reasoning)
10. Coordinator overwrites the output file with the consolidated final version
11. Coordinator writes `Sessions/<slug>/devils-advocate-review.md` (challenge + resolution audit)
12. Coordinator appends Devil's Advocate Review subsection to the Deliberation trail

### 6.4 Resume (`council-resume` skill)

- Discovers `Sessions/*/` directories
- Detects state:
  - **Completed**: final output exists AND either `config-snapshot.md` has `devils_advocate: false` OR `devils-advocate-review.md` exists
  - **Phase 2 pending**: final output exists AND `config-snapshot.md` has `devils_advocate: true` AND no `devils-advocate-review.md` -- Phase 1 is done, Devil's Advocate review not yet run
  - **In-progress**: `round-*.md` exists, no final output
  - **Escalated**: `escalation.md` exists
- For **Phase 2 pending**: surfaces Phase 1 summary, offers resume Devil's Advocate review or skip
- For in-progress: offers resume at Round N+1 with compact context packet
- For completed: optionally shows DA challenge summary if `devils-advocate-review.md` exists; offers new session on same council
- For escalated: offers re-scaffold with adjusted scenario (wizard Phase 2+)
- Handles partial/corrupted rounds (flag, offer discard)

---

## 7. HITL Integration

### 7.1 Inline (Cowork/CLI)

The coordinator asks checkpoint questions directly in the chat session. Works natively in both Cowork and CLI. No setup required.

On Cowork, inline HITL is the natural mode -- the user is already in a conversational interface.

### 7.2 Plan Approval (native)

Agent Teams native feature. Teammate actions require coordinator approval. Always available. No configuration needed.

### 7.3 Checkpoint types

| Type | Trigger | Behavior |
|------|---------|----------|
| **Type A -- Round review** | After any non-consensus round | Coordinator summary -> operator `continue` / `stop` / feedback / TIMEOUT auto-continue |
| **Type B -- Clarification on deadlock** | 2+ REJECT votes | Ambiguities + clarification request via HITL |
| **Type C -- Plan/artifact approval** | For plan-execute-verify and builder-validator patterns | Approve / revise / stop |
| **Type DA -- Devil's Advocate gate** | After Phase 1 output is written, before Phase 2 begins | Coordinator asks: proceed with review or skip? Reply `yes` / `skip` |

---

## 8. Cowork-First Design

### 8.1 Plugin installation

**Cowork (desktop/web)**: Install the plugin through Cowork's plugin management UI. The plugin appears in the skill palette and can be invoked through conversation.

**CLI**: `claude --plugin-dir .` from the plugin repository, or install as a managed plugin.

Both paths result in the same skills being available. Generated artifacts are identical.

### 8.2 File access model

Cowork's project model maps to a local folder. The plugin reads from and writes to this folder:

- `references/` (read-only, from the plugin): patterns, personas, protocols, templates
- `council/`, `.claude/agents/`, `Sessions/`, `Docs/` (read-write, in the user project): generated artifacts

No remote file access or cloud storage assumptions. Everything is local files.

### 8.3 HITL: inline rationale

Cowork users are already in a chat interface. Inline HITL is zero-setup and matches the interaction model. The coordinator asks checkpoint questions directly in the active session; the user replies in the same conversation.

### 8.4 Wizard UX in Cowork chat

The 5-phase wizard maps naturally to Cowork conversation turns:

1. User describes scenario -> Phase 1 (one turn)
2. Claude asks recommender questions -> Phase 2 (1-2 turns)
3. Claude proposes team -> Phase 3 (one turn + optional adjustments)
4. HITL confirmation -> Phase 4 (one turn, typically immediate)
5. Generate + launch offer -> Phase 5 (one turn)

For clear requests, Phases 1-3 collapse into a single turn (see collapsed flow example in section 5).

### 8.5 No CLI-only assumptions

Generated artifacts make no CLI assumptions:

- No shell-specific paths or terminal-only instructions in agent files
- No references to environment variables that only exist in CLI sessions
- Agent files reference relative paths (`council/domain-context.md`, `.claude/agents/*.md`)
- HITL messages use business-friendly language, not CLI prompts

---

## 9. Skills Reference

| Skill | Purpose | Invocation |
|-------|---------|------------|
| `council-wizard` | 5-phase conversational wizard: scenario intake, pattern selection, agent composition, HITL confirmation, generation | Primary entry point |
| `council-launch` | Compose Agent Teams kickoff prompt from generated artifacts | After wizard or manual config |
| `council-resume` | Re-open prior sessions: completed, in-progress, or escalated | When `Sessions/` has existing data |

Note: `council-scaffold` (System A) is removed as a standalone skill. Its logic is absorbed into `council-wizard` Phase 5.

---

## 10. Validation & Testing

### Validation script

`scripts/validate-references.mjs` checks:

- **Patterns** (`references/patterns/*.md`): required frontmatter fields (`id`, `name`, `native_support`, `min_agents`, `max_agents`, `output_template`, `default_protocol`), required headings (When to use, Recommender signals, Role shape, Coordinator prompt template, Teammate prompt template, HITL checkpoints, Output mapping)
- **Personas** (`references/personas/*.md`): required frontmatter fields (`id`, `name`, `category`, `domains`, `fits_patterns`, `domain-context-sections`), all 10 mandatory sections present
- **Protocols** (`references/protocols/*.md`): required sections (Configuration, Vote Semantics, Response Format, Consensus Rules, Escalation Rules, Deliberative Cycle, Output Formats, Behavioral Rules)
- **Templates** (`references/templates/*.tmpl`): required template variables present
- **Output templates** (`references/output-templates/*.md`): existing checks preserved

### Test commands

```bash
npm install
npm run validate:references    # schema + heading validation
```

### End-to-end verification checklist

- `grep -r "role-archetypes"` returns only hits in `docs/` (TODO.md, UNIFICATION-PLAN.md -- historical migration context)
- `grep -r "council-scaffold"` returns only hits in `docs/` (SPEC.md, TODO.md, UNIFICATION-PLAN.md -- historical reference)
- `grep -r "council/agents/"` returns only hits in `docs/` and `council-models/`
- All pattern files have `default_protocol` in frontmatter
- No pattern file contains hardcoded vote option lists (all use `{{...}}` protocol placeholders)
- Both `plugin.json` files have `"name": "council-plugin"`

---

## 11. Design Decisions (resolved)

### Q1: Should `council-scaffold` remain a separate skill?

**Decision**: No -- absorbed into wizard Phase 5.

The scaffold logic is mechanical file generation. Users never invoke it independently. The wizard's Phase 1 already offers re-scaffold as an entry point when `council/config.md` exists. Removing the separate skill eliminates a handoff point that complicated the flow.

### Q2: Should the `CLAUDE.md` protocol injection be preserved?

**Decision**: No -- embed protocol rules directly in agent files.

Writing to `CLAUDE.md` risks conflicting with the user's own project-level instructions. Making agent files self-contained is safer and more portable. The protocol layer is injected into each agent file at generation time via the templates.

### Q3: How rich should dynamic agent generation be?

**Decision**: Full dynamic generation with quality checklist enforcement.

Claude generates full persona definitions (identity, competencies, behavior, vote guidelines, quality checklist) from scratch when no library persona fits. The `_custom-template.md` serves as the structural guide. The generation template (`teammate.md.tmpl`) enforces all mandatory sections. Quality depends on Claude's reasoning about domain expertise -- the library personas serve as exemplars of depth and structure.

### Q4: Should the recommender be AI-driven or rule-based?

**Decision**: Hybrid -- decision tree as starting point, Claude adjusts based on scenario.

The recommender question tree provides structure and predictability. Claude uses recommender signals from pattern files and the scenario description to adjust the ranking. This combines reproducibility (same questions, same routing logic) with flexibility (Claude can recognize when scenario nuances favor a different pattern).

### Q5: Protocol composability -- feature or foot-gun?

**Decision**: Default protocol pairings; non-default is advanced.

Each pattern declares a `default_protocol`. The wizard uses it without prompting. Custom combinations are documented as an advanced feature but not surfaced in the wizard flow. This prevents nonsensical pairings (e.g., adversarial-debate-protocol on ensemble-voting topology) while allowing expert users to experiment.

### Q6: What happens to `council-builder/PROMPT.md`?

**Decision**: Extract essentials into wizard + templates; delete the source directory.

The critical content from PROMPT.md (three-layer composition model, template variable system, generation quality criteria) is captured in this SPEC (sections 2.3, 4.4) and in the template files themselves. The `council-builder/` directory has been deleted; all useful content was migrated into `references/` by earlier tasks.

### Q7: Language considerations

**Decision**: Italian document kept as internal reference.

`docs/PATTERNS.md` (in Italian) is retained as-is under `docs/`. It's an internal reference document for the 15-pattern catalog, not user-facing. The plugin's user-facing content is English.

### Q8: Persona naming -- `product-analyst` vs `pm-facilitator`

**Decision**: Both names kept. They serve distinct roles.

- `pm-facilitator` (business, category: business): PM as facilitator -- scope, roadmap, success metrics, stakeholder alignment
- `product-analyst` (tech, category: tech): PM as analyst -- user stories, acceptance criteria, INVEST principles, requirements decomposition

The category field (`business` vs `tech`) and the distinct domain keywords disambiguate them. Both can coexist in a mixed council.

---

## 12. Error Handling and Fallbacks

| Failure mode | Handling |
|---|---|
| `Docs/` missing or empty | Warn, allow user to proceed with scenario-only context |
| Skill-creator invocation fails | Retry with a more explicit brief; on second failure, fall back to copying the nearest archetype persona with a note "manual refinement recommended" |
| Required scaffold file missing at launch | Stop with an explicit error referencing the wizard |
| Session crash mid-round (Claude Code closed) | Partial round file may remain; `council-resume` detects incomplete rounds and offers discard or resume |
| Agent Teams tool unavailability (e.g., `TeamCreate`) | Surface a clear error: wrong Claude Code mode or plan; suggest the user enable Agent Teams |

---

## 13. Out of Scope / Roadmap

Items explicitly deferred from the first release:

- **Custom pattern authoring** -- users defining their own topology files beyond the 7 built-in patterns.
- **Additional native patterns** -- expanding beyond the 7 Agent Teams-supported patterns (⚠️ workaround and ❌ unsupported patterns from `docs/PATTERNS.md`).
- **Multi-language output** -- deliberation and output templates in languages other than English.
- **Persistent semantic memory** -- RAG or vector search over `Docs/` across council sessions.
- **Scheduled / unattended councils** -- running a council without an interactive operator present.
- **Cross-council shared knowledge** -- a shared knowledge base spanning multiple council projects.
