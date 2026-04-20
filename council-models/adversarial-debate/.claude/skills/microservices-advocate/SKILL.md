# Microservices Advocate — Distributed Architecture

> Domain knowledge for arguing in favor of a distributed, microservices-oriented approach.
> Use this skill to ground your position with concrete trade-offs, patterns, and evidence.

---

## When to Prefer a Distributed Approach

- **Bounded contexts** are clearly separated and owned by different teams or domains (e.g. Ordering, Invoicing, Customers). Each context has its own data, lifecycle, and deployment.
- **Team autonomy**: multiple teams need to ship independently without stepping on each other's deploy pipeline or codebase.
- **Independent scaling**: one part of the system (e.g. order processing) must scale without scaling the rest (e.g. customer CRUD).
- **Heterogeneous tech**: different contexts may justify different stacks (e.g. .NET for core, Python for ML) or different release cadences.
- **Blast radius**: a failure or a bad deploy in one service should not bring down the whole system.

---

## Evidence and Patterns

### Domain-Driven Design (DDD)

- Bounded contexts map to services. One service = one or a few cohesive contexts. Clear APIs (REST, events) at the boundary.
- Ubiquitous language stays within the context; integration via well-defined events and contracts (e.g. MassTransit, schema-per-context).

### Event-Driven Integration

- Services communicate via events (e.g. `OrderDelivered` → Invoicing consumes and generates invoice). Loose coupling, no direct DB access across contexts.
- Resilience: circuit breaker, retry, dead-letter queues. One service down does not block others from progressing when using async messaging.

### Operational Ownership

- Each service has a clear owner. Deploy, monitor, and scale per service. Metrics and logs are scoped to the service.
- Observability (tracing, metrics) is required and can be implemented per service (e.g. OpenTelemetry).

### Example: distributed-playground

- **YARP** gateway routes to Ordering, Invoicing, Customers. Each API is a separate process.
- **MassTransit** over RabbitMQ for events; one DbContext per context, dedicated PostgreSQL schema (e.g. `ordering`, `invoicing`, `customers`). No cross-schema FKs.
- Scaling: run more instances of the hot service (e.g. Ordering) without touching Invoicing or Customers.

---

## Trade-offs to Acknowledge (Honest Advocacy)

- **Operational complexity**: more services → more deploy pipelines, more monitoring, more network and failure modes. Requires good DevOps and observability.
- **Overkill for small teams or simple domains**: if one team owns everything and the domain is simple, a monolith can be faster to build and run. Microservices shine when you have multiple teams or clear domain boundaries that justify separate lifecycles.
- **Data consistency**: cross-context operations are eventually consistent (events). If the topic requires strong ACID across what would be multiple services, say so and note that a modular monolith might be simpler for that case.

---

## How to Use This Skill in the Debate

- Cite **bounded context** and **ownership** when the topic implies multiple domains or teams.
- Cite **scaling** and **blast radius** when the topic mentions load or reliability.
- Cite **event-driven** and **contracts** when the topic involves integration between areas.
- Always acknowledge the **trade-offs** above so the recommendation can be balanced; the goal is not to "win" but to make the right choice for the given context.
