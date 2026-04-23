# council-plugin

A **Claude Code / Cowork plugin** for convening a **Council of Agents** -- business or technical -- using **Agent Teams** as the runtime.

Describe what you need. The plugin handles pattern selection, agent composition, file generation, and launch. No pre-existing agents or skills required.

> *"Make me a Council of Agents to analyze this public tender so I can write a proposal"* -- and the system does the rest.

## Context

- `README.md` is a good starting point to understand what we want to build. 
- `docs/` folder contains many additional documents worth reading.

### Must reads

- `SPEC.md` - This is the north-star. The ultimate specification of the plugin
- `TODO.md` - This is the list of tasks to complete the plugin. Review it to plan in advance when you make changes.

### Optional reads

- `UNIFICATION-PLAN.md` - This is the original unification plan. It is an historical document useful only if you need historical context
- `PATTERNS.md` - Is a human-only reference guide in italian. You can safely ignore this file.

## Requirements

- This plugin is Claude Cowork first. It **must** work with Claude Cowork
- Human in the Loop is important. The plugin must support it via native Claude Cowork interaction mechanisms.

## Bookkeeping

- If you finish a task from `docs/TODO.md` you have to mark it as completed
- It is your duty to keep `README.md` and `docs/*` documentation up-to-date if you make changes