# Domain Context: [Project Name]

> [One-line project description]

<!--
  This file provides the project-specific domain knowledge that personas need.
  Each section has a label. Personas declare which sections they need via
  domain-context-sections in their library file.

  Not every section is required — include only those relevant to your project.
  You may add custom sections; just give them a clear label and document which
  personas should receive them.
-->

---

## overview

<!-- Brief project description — ALL personas get this section.
     What is the project? What problem does it solve? What are its main capabilities? -->

[Project description here]

---

## services

<!-- Service inventory — typically needed by Architect, QA Strategist, DevOps Engineer, Security Engineer.
     Use a table: Service | Port | Schema/DB | Key Components -->

| Service | Port | Schema | Key Components |
|---------|------|--------|----------------|
| [Service 1] | [port] | [schema] | [description] |
| [Service 2] | [port] | [schema] | [description] |

---

## tech-stack

<!-- Technology list — ALL personas get this section.
     List frameworks, languages, databases, messaging systems, etc. -->

- **[Language/Framework]** — [usage]
- **[Database]** — [usage]
- **[Messaging]** — [usage]

---

## bounded-context-pattern

<!-- Code organization patterns — typically needed by Architect.
     Show folder structure, naming conventions, key architectural patterns. -->

[Describe the codebase organization pattern]

---

## cross-context-integration

<!-- How parts of the system communicate — typically needed by Architect, QA Strategist, Security Engineer.
     Event flows, API calls, shared data, message contracts. -->

[Describe inter-service or inter-module communication]

---

## docker-infrastructure

<!-- Container and deployment infrastructure — typically needed by Architect, DevOps Engineer.
     Dockerfiles, compose files, build patterns, deployment topology. -->

[Describe container/deployment infrastructure]

---

## order-workflow

<!-- Key domain workflows and state machines — typically needed by ALL personas.
     Rename this section to match your domain (e.g., "payment-workflow", "user-lifecycle"). -->

[Describe key workflows with state transitions]

---

## user-roles

<!-- Who uses the system — typically needed by Product Analyst, UX Designer.
     List user types, their goals, and their level of access. -->

[Describe user types and their roles]

---

## testing-landscape

<!-- Testing infrastructure and patterns — typically needed by QA Strategist.
     Test frameworks, test dimensions, known edge cases, risk areas. -->

[Describe testing tools, patterns, and known challenges]
