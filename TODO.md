# Council Plugin -- Implementation Backlog

Ordered migration tasks for the unified council-plugin. Each task has acceptance criteria and dependency tracking. Reference: [SPEC.md](SPEC.md) for design details, [UNIFICATION-PLAN.md](UNIFICATION-PLAN.md) for historical context.

---

## Dependency graph

```mermaid
graph TD
    T01[T01: Rename role-archetypes to personas] --> T02[T02: Migrate tech personas]
    T01 --> T03[T03: Enrich business personas]
    T02 --> T09
    T03 --> T09
    T04[T04: Create protocols/] --> T06[T06: Add default_protocol to patterns]
    T04 --> T07[T07: Parameterize pattern templates]
    T05[T05: Create templates/] --> T09
    T06 --> T07
    T07 --> T09[T09: Rewrite council-wizard SKILL.md]
    T08[T08: Extend recommender] --> T09
    T09 --> T10[T10: Remove council-scaffold]
    T09 --> T11[T11: Update council-launch paths]
    T09 --> T12[T12: Update council-resume]
    T13[T13: Update plugin.json manifests]
    T14[T14: Extend validate-references.mjs] --> T18
    T01 --> T14
    T04 --> T14
    T05 --> T14
    T15[T15: Archive council-builder/]
    T16[T16: Rewrite README.md]
    T17[T17: Create SPEC.md]
    T10 --> T18[T18: End-to-end verification]
    T11 --> T18
    T12 --> T18
    T13 --> T18
    T15 --> T18
    T16 --> T18
```

---

## Tasks

### T01: Rename `references/role-archetypes/` to `references/personas/`

**Description**: Rename the directory and update all internal references across skill files, scripts, and documentation.

**Files**:
- `references/role-archetypes/` -> `references/personas/`
- All files that reference `role-archetypes` or `references/role-archetypes`

**Acceptance criteria**:
- [ ] `references/personas/` exists with all 12 business persona files
- [ ] `references/role-archetypes/` no longer exists
- [ ] `grep -r "role-archetypes" --include="*.md" --include="*.mjs" --include="*.json"` returns 0 hits in non-archived files
- [ ] `git mv` used to preserve history

**Depends on**: none

---

### T02: Migrate 6 tech personas from council-builder to `references/personas/`

**Description**: Copy the 6 tech personas and the custom template from `council-builder/.claude/skills/council-builder/persona-library/` into `references/personas/`. Adapt each to the unified format: add YAML frontmatter with `domains`, `fits_patterns`, `category: tech`, and `domain-context-sections`.

**Files**:
- Source: `council-builder/.claude/skills/council-builder/persona-library/` (architect, product-analyst, qa-strategist, security-engineer, devops-engineer, ux-designer, _custom-template)
- Target: `references/personas/`

**Acceptance criteria**:
- [ ] 6 tech persona files exist in `references/personas/`
- [ ] `references/personas/_custom-template.md` exists
- [ ] Each tech persona has valid YAML frontmatter with all required fields: `id`, `name`, `category: tech`, `domains`, `fits_patterns`, `domain-context-sections`
- [ ] All 10 mandatory sections present in each persona (see SPEC.md section 3.1)
- [ ] Domain-specific content (e.g., distributed-playground references) stripped from persona files
- [ ] `validate-references` passes after T14

**Depends on**: T01

---

### T03: Enrich 12 business personas with unified format sections

**Description**: For each business persona in `references/personas/`, add the structured sections from the unified format: Identity, Core Competencies, Behavior in the Council, What You Care About, What You Defer to Others, Vote Guidelines, Quality Checklist, and `domain-context-sections` in frontmatter. Existing content (Role description, Baseline skill template, Typical questions, Customization slots) is preserved.

**Files**:
- All 12 files in `references/personas/` with `category: business`

**Acceptance criteria**:
- [ ] All 12 business personas have all 10 mandatory sections from the unified format
- [ ] `category: business` in frontmatter for each
- [ ] `domain-context-sections` added to each persona's frontmatter, matching the vocabulary in SPEC.md section 3.3
- [ ] Existing content (Role description, Baseline skill, Typical questions, Customization slots) preserved
- [ ] `validate-references` passes after T14

**Depends on**: T01

---

### T04: Create `references/protocols/` with 3 protocols + custom template

**Description**: Create the protocols directory with standalone protocol definitions. Migrate `deliberative-voting.md` from council-builder (updating output paths from `council-log/` to `Sessions/`). Create `adversarial-debate-protocol.md` and `convergent-investigation.md` as new protocols derived from their respective patterns. Migrate `_custom-template.md` from council-builder.

**Files**:
- `references/protocols/deliberative-voting.md` -- migrated from `council-builder/.claude/skills/council-builder/protocols/deliberative-voting.md`
- `references/protocols/adversarial-debate-protocol.md` -- new
- `references/protocols/convergent-investigation.md` -- new
- `references/protocols/_custom-template.md` -- migrated from `council-builder/.claude/skills/council-builder/protocols/_custom-template.md`

**Acceptance criteria**:
- [ ] 4 files exist in `references/protocols/`
- [ ] `deliberative-voting.md` has all sections from the council-builder version (Configuration, Vote Semantics, Response Format, Consensus Rules, Escalation Rules, Deliberative Cycle, Output Formats, Behavioral Rules)
- [ ] All output paths reference `Sessions/` not `council-log/`
- [ ] `adversarial-debate-protocol.md` defines Position/Evidence/Counter-argument structure with FAVOR_A, FAVOR_B, SPLIT labels
- [ ] `convergent-investigation.md` defines SUPPORTED, WEAK, REFUTED, INCONCLUSIVE hypothesis votes
- [ ] `_custom-template.md` has comments explaining each required section

**Depends on**: none

---

### T05: Create `references/templates/` with generation skeletons

**Description**: Create the templates directory with generation skeletons migrated from council-builder. Rename `.hbs` to `.tmpl`. Add a domain context template from council-builder's `_context-template.md`. Do NOT include a CLAUDE.md injection template (protocol goes in agent files per SPEC.md section 2.3).

**Files**:
- `references/templates/coordinator.md.tmpl` -- from `council-builder/.claude/skills/council-builder/templates/coordinator.md.hbs`
- `references/templates/teammate.md.tmpl` -- from `council-builder/.claude/skills/council-builder/templates/persona.md.hbs`
- `references/templates/domain-context.md.tmpl` -- from `council-builder/.claude/skills/council-builder/domain-contexts/_context-template.md`

**Acceptance criteria**:
- [ ] 3 template files exist in `references/templates/`
- [ ] No `.hbs` references remain in any non-archived file
- [ ] No CLAUDE.md injection template exists
- [ ] `coordinator.md.tmpl` contains all variables from SPEC.md section 4.4 coordinator table
- [ ] `teammate.md.tmpl` contains all variables from SPEC.md section 4.4 teammate table
- [ ] `domain-context.md.tmpl` includes both business and tech section vocabularies

**Depends on**: none

---

### T06: Add `default_protocol` frontmatter to all 7 pattern files

**Description**: Each pattern in `references/patterns/` gets `default_protocol: <id>` in its YAML frontmatter, per the pairing table in SPEC.md section 4.3.

**Files**:
- `references/patterns/hub-and-spoke.md` -- `default_protocol: deliberative-voting`
- `references/patterns/swarm.md` -- `default_protocol: convergent-investigation`
- `references/patterns/adversarial-debate.md` -- `default_protocol: adversarial-debate-protocol`
- `references/patterns/map-reduce.md` -- `default_protocol: deliberative-voting`
- `references/patterns/plan-execute-verify.md` -- `default_protocol: deliberative-voting`
- `references/patterns/ensemble-voting.md` -- `default_protocol: deliberative-voting`
- `references/patterns/builder-validator.md` -- `default_protocol: deliberative-voting`

**Acceptance criteria**:
- [ ] All 7 pattern files have `default_protocol` in YAML frontmatter
- [ ] Values match SPEC.md section 4.3 table exactly
- [ ] `validate-references` checks this field after T14

**Depends on**: T04

---

### T07: Parameterize pattern coordinator/teammate templates with protocol variables

**Description**: In each pattern's coordinator and teammate prompt templates, replace hardcoded vote semantics with protocol variable placeholders: `{{VOTE_OPTIONS}}`, `{{CONSENSUS_RULE}}`, `{{REJECTION_RULE}}`, `{{RESPONSE_FORMAT}}`, `{{BEHAVIORAL_RULES}}`. This decouples patterns from specific protocol details.

**Files**:
- All 7 files in `references/patterns/`

**Acceptance criteria**:
- [ ] No pattern file contains hardcoded vote option lists (e.g., `PROPOSE | OBJECT | APPROVE | ABSTAIN | REJECT` as literal text in templates)
- [ ] All coordinator prompt templates use `{{VOTE_OPTIONS}}`, `{{CONSENSUS_RULE}}`, `{{REJECTION_RULE}}`
- [ ] All teammate prompt templates use `{{VOTE_OPTIONS}}`
- [ ] Existing recommender signals, HITL checkpoints, and output mapping sections unchanged

**Depends on**: T04, T06

---

### T08: Extend recommender questions for broader pattern coverage

**Description**: Update `references/recommender/questions.md` to cover adversarial-debate and builder-validator more explicitly. Ensure the question tree can route to all 7 patterns without dead ends.

**Files**:
- `references/recommender/questions.md`

**Acceptance criteria**:
- [ ] Recommender question tree can route to all 7 patterns
- [ ] No pattern is unreachable from any answer path
- [ ] adversarial-debate and builder-validator have explicit routing (not just tie-breaker mentions)
- [ ] Still limited to 2-3 questions maximum

**Depends on**: none

---

### T09: Rewrite `skills/council-wizard/SKILL.md` to unified 5-phase flow

**Description**: Rewrite the wizard skill to implement the 5-phase flow from SPEC.md section 5. The wizard handles both business and tech scenarios, references the unified directory structure, and absorbs scaffold logic into Phase 5. No reference to `council-scaffold` as a separate skill.

**Files**:
- `skills/council-wizard/SKILL.md`

**Acceptance criteria**:
- [ ] SKILL.md has exactly 5 phases matching SPEC.md section 5
- [ ] Phase 1: scenario intake + context discovery (business docs OR codebase scan)
- [ ] Phase 2: pattern + protocol selection (hybrid recommender)
- [ ] Phase 3: agent composition (library match + dynamic generation)
- [ ] Phase 4: HITL config (inline default, Telegram optional)
- [ ] Phase 5: generate all artifacts + launch offer (scaffold logic embedded)
- [ ] References `references/personas/`, `references/protocols/`, `references/templates/`
- [ ] No reference to `council-scaffold` as a separate skill
- [ ] Agent files generated at `.claude/agents/` not `council/agents/`
- [ ] Works for both business and tech scenarios (not "non-technical" only)
- [ ] Cowork-first language (inline HITL as default)

**Depends on**: T02, T03, T05, T07, T08

---

### T10: Remove `skills/council-scaffold/SKILL.md`

**Description**: Delete the scaffold skill file. Its logic is now in wizard Phase 5 (SPEC.md section 6.1).

**Files**:
- `skills/council-scaffold/SKILL.md` -- delete
- `skills/council-scaffold/` directory -- delete

**Acceptance criteria**:
- [ ] `skills/council-scaffold/` does not exist
- [ ] No other skill file references `council-scaffold`
- [ ] `grep -r "council-scaffold" --include="*.md"` returns only hits in `docs/archived/`, SPEC.md, TODO.md, and UNIFICATION-PLAN.md

**Depends on**: T09

---

### T11: Update `skills/council-launch/SKILL.md` paths

**Description**: Update agent file paths from `council/agents/` to `.claude/agents/` throughout the launch skill.

**Files**:
- `skills/council-launch/SKILL.md`

**Acceptance criteria**:
- [ ] No reference to `council/agents/` in the file
- [ ] All agent paths use `.claude/agents/`
- [ ] Precondition checks reference `.claude/agents/coordinator.md` and `.claude/agents/<slug>.md`
- [ ] Kickoff prompt structure references `.claude/agents/` paths

**Depends on**: T09

---

### T12: Update `skills/council-resume/SKILL.md` for consistency

**Description**: Verify and update session paths and agent references to be consistent with the new layout defined in SPEC.md section 6.4.

**Files**:
- `skills/council-resume/SKILL.md`

**Acceptance criteria**:
- [ ] Paths consistent with SPEC.md section 6.4
- [ ] Agent file references use `.claude/agents/` if mentioned
- [ ] Session detection logic matches the output file names from all patterns
- [ ] No stale references to old paths

**Depends on**: T09

---

### T13: Update `plugin.json` manifests

**Description**: Update both plugin manifest files to reflect the unified identity: name -> `council-plugin`, description mentions business + tech + Cowork, keywords include `cowork`.

**Files**:
- `plugin.json`
- `.claude-plugin/plugin.json`

**Acceptance criteria**:
- [ ] Both files have `"name": "council-plugin"`
- [ ] Description mentions both business and technical users
- [ ] Description mentions Cowork
- [ ] Keywords array includes `"cowork"`
- [ ] Keywords array includes both `"business"` and `"tech"`

**Depends on**: none

---

### T14: Extend `scripts/validate-references.mjs`

**Description**: Add validation for new directories and update references from `role-archetypes` to `personas`.

**Files**:
- `scripts/validate-references.mjs`

**Acceptance criteria**:
- [ ] Validates `references/personas/` (renamed from `role-archetypes`): required frontmatter fields (`id`, `name`, `category`, `domains`, `fits_patterns`, `domain-context-sections`), all 10 mandatory sections present
- [ ] Validates `references/protocols/` (new): required sections (Configuration, Vote Semantics, Response Format, Consensus Rules, Escalation Rules, Deliberative Cycle, Output Formats, Behavioral Rules)
- [ ] Validates `references/templates/` (new): required template variables present per SPEC.md section 4.4
- [ ] Validates `default_protocol` field in pattern frontmatter
- [ ] No reference to `role-archetypes` in the script
- [ ] `npm run validate:references` passes on valid files and fails on missing required sections

**Depends on**: T01, T04, T05

---

### T15: Archive `council-builder/` to `docs/archived/council-builder/`

**Description**: Move the entire `council-builder/` directory to `docs/archived/council-builder/` as reference material. Preserve history with `git mv`.

**Files**:
- `council-builder/` -> `docs/archived/council-builder/`

**Acceptance criteria**:
- [ ] `council-builder/` no longer exists at repo root
- [ ] Content preserved under `docs/archived/council-builder/`
- [ ] `PROMPT.md` and `README.md` present in archive
- [ ] `git mv` used to preserve history

**Depends on**: none

---

### T16: Rewrite `README.md`

**Description**: Rewrite the README for the unified plugin identity. See SPEC.md for the authoritative design reference. Key changes: no "business-only" framing, Cowork as first quick-start option, 4 skills (scaffold removed), layout table updated for new directories, agent paths at `.claude/agents/`, plugin name `council-plugin`.

**Files**:
- `README.md`

**Acceptance criteria**:
- [ ] No mention of "non-technical" as exclusive audience
- [ ] Mentions Cowork as primary target
- [ ] Layout table matches SPEC.md section 2.1 (personas, protocols, templates directories)
- [ ] Skills table shows 4 skills (wizard, launch, resume, telegram-setup)
- [ ] Agent paths use `.claude/agents/` not `council/agents/`
- [ ] Plugin name is `council-plugin` not `council-skill`
- [ ] Quick-start for both Cowork and CLI
- [ ] Links to SPEC.md as design reference

**Depends on**: none

---

### T17: Create `SPEC.md`

**Description**: Create the authoritative design and specification document for the unified system. Covers architecture, persona system, pattern/protocol system, wizard flow, session lifecycle, HITL integration, Cowork-first design, and resolved design decisions.

**Files**:
- `SPEC.md`

**Acceptance criteria**:
- [ ] File exists with all sections from the outline in the implementation plan
- [ ] Resolves all 8 open questions from UNIFICATION-PLAN.md section 12
- [ ] Cowork mentioned throughout as primary target
- [ ] Three-layer composition model documented
- [ ] Complete template variable reference
- [ ] All pattern-protocol pairings documented

**Depends on**: none

**Status**: DONE (this file)

---

### T18: End-to-end manual verification

**Description**: Run all validation commands and verify the migration is complete with no stale references.

**Files**: none (verification only)

**Acceptance criteria**:
- [ ] `npm run validate:references` passes
- [ ] `npm run test:telegram-mcp-dry` passes
- [ ] `grep -r "role-archetypes" --include="*.md" --include="*.mjs" --include="*.json"` returns only hits in `docs/archived/`
- [ ] `grep -r "council-scaffold" --include="*.md"` returns only hits in `docs/archived/`, SPEC.md, TODO.md, and UNIFICATION-PLAN.md
- [ ] `grep -r "council/agents/" --include="*.md"` returns only hits in `docs/archived/` and `council-models/`
- [ ] All pattern files have `default_protocol` in frontmatter
- [ ] Both `plugin.json` files have `"name": "council-plugin"`

**Depends on**: T10, T11, T12, T13, T14, T15, T16

---

## Suggested implementation order

Tasks with no dependencies can be started in parallel. A practical ordering:

**Wave 1** (no dependencies -- can all run in parallel):
- T04: Create protocols/
- T05: Create templates/
- T08: Extend recommender
- T13: Update plugin.json manifests
- T15: Archive council-builder/
- T17: Create SPEC.md (DONE)

**Wave 2** (depends on T01 or Wave 1 items):
- T01: Rename role-archetypes to personas
- T06: Add default_protocol to patterns (needs T04)

**Wave 3** (depends on Wave 2):
- T02: Migrate tech personas (needs T01)
- T03: Enrich business personas (needs T01)
- T07: Parameterize pattern templates (needs T04, T06)
- T14: Extend validate-references.mjs (needs T01, T04, T05)
- T16: Rewrite README.md (no hard dependency, but best after structure is finalized)

**Wave 4** (depends on Wave 3):
- T09: Rewrite council-wizard SKILL.md (needs T02, T03, T05, T07, T08)

**Wave 5** (depends on T09):
- T10: Remove council-scaffold
- T11: Update council-launch paths
- T12: Update council-resume

**Wave 6** (final):
- T18: End-to-end verification (needs T10, T11, T12, T13, T14, T15, T16)
