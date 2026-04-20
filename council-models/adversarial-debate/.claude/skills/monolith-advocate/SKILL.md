# Monolith Advocate — Monolithic / Monorepo Architecture

> Domain knowledge for arguing in favor of a monolithic or monorepo-oriented approach.
> Use this skill to ground your position with concrete trade-offs, patterns, and evidence.

---

## When to Prefer a Monolith or Monorepo

- **Time-to-market**: single codebase, single deploy, single pipeline. No cross-service versioning or contract evolution upfront.
- **Operational simplicity**: one process to run, one place to look for logs and metrics, one database (or one schema) to backup and migrate.
- **ACID and transactions**: when the topic involves operations that span multiple aggregates and need strong consistency, a monolith keeps everything in one process and one DB — no distributed transactions or eventual consistency to reason about.
- **Refactoring and code sharing**: move code between modules without publishing APIs or events. Shared libraries, shared domain types, refactor with one deploy.
- **Small team or single domain**: one team owning one product often gets more speed from a monolith than from managing many services.

---

## Evidence and Patterns

### Modular Monolith

- One deployable, but **modules** (or namespaces) with clear boundaries. No direct DB access across modules; use in-process interfaces or events. Same discipline as microservices, without the operational cost.
- Easier to **extract a service later** if one module truly needs independent scale or team ownership — the boundary is already there.

### Monorepo with Clear Boundaries

- Multiple projects in one repo (e.g. one solution, multiple projects). Shared contracts, shared tooling, single CI. Deploy can still be one artifact (monolith) or multiple (multi-project monorepo with separate deployables). The advocate argues for **starting** with one artifact and splitting only when justified.

### "Start with a Monolith" (Fowler, etc.)

- Many systems never need to become microservices. A well-structured monolith can scale vertically and handle moderate load. Split when you hit real limits: team size, deploy frequency, or scaling needs that are clearly per-context.

### When the Monolith Is Enough

- Single team, single product, no need for independent scaling of subsystems. No need for different tech stacks per area. Requirement for simple deployment and debugging.

---

## Trade-offs to Acknowledge (Honest Advocacy)

- **Global scaling**: you scale the whole application. If one part is hot (e.g. order processing), you scale everything. A microservices approach would scale only that part.
- **Coupling**: if boundaries are not respected (e.g. direct DB access across modules, shared mutable state), the monolith becomes a big ball of mud. Advocate for **modular** monolith with strict boundaries.
- **Single deploy**: a bad deploy affects the whole system. Mitigations: feature flags, canary, good tests. For some organizations, many small services mean many small deploys and smaller blast radius — acknowledge that.

---

## When Microservices Are Justified (Pragmatic Criteria)

- Multiple **teams** owning different parts of the system and needing independent release cycles.
- Clear **scaling** needs that affect only a subset of the system (e.g. order processing at 10x the rest).
- **Regulatory or organizational** requirements for isolation (e.g. payment in a separate deployable).
- Acknowledge these in the debate so the recommendation can be balanced: the goal is to choose the right approach for the **given topic and context**, not to insist on monolith when the context clearly favors distribution.

---

## How to Use This Skill in the Debate

- Cite **time-to-market** and **simplicity** when the topic is a new feature or a small team.
- Cite **transactions** and **ACID** when the topic involves cross-entity consistency.
- Cite **modular monolith** and **extract later** when the other side pushes for microservices early — argue that boundaries can be drawn in code first, then split when needed.
- Always acknowledge the **trade-offs** above and when **microservices are justified** so the Coordinator can produce a balanced recommendation.
