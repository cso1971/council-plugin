# Troubleshooting — Distributed Playground

> Domain knowledge for investigating intermittent failures, latency, and misconfigurations in the distributed-playground. Use this skill to ground evidence with concrete locations, config keys, and observability points.

---

## Architecture Quick Reference

| Component | Port | Role |
|-----------|------|------|
| Gateway (YARP) | 5000 | Reverse proxy, JWT validation (Keycloak), CORS |
| Ordering API | 5001 | Orders, PostgreSQL schema `ordering`, MassTransit |
| Invoicing API | 5002 | Invoices, schema `invoicing`, consumers for OrderDelivered |
| Customers API | 5003 | Customers, schema `customers` |
| AI.Processor | 5010 | RAG, Qdrant, Ollama |
| Orchestrator | 5020 | Semantic Kernel, Ollama |
| Projections | 5030 | CQRS read model, Redis |
| PostgreSQL | 5432 | Shared instance, schema-per-context |
| RabbitMQ | 5672 / 15672 | Message broker |
| Qdrant | 6333 / 6334 | Vector store |
| Redis | 6379 | Cache, projections |
| Keycloak | 8180 | IdP, realm `playground`, clients `playground-api`, `ordering-web` |

---

## Auth / SAML / Timing (Investigator SAML)

- **Keycloak**: Realm config, client settings, redirect URIs, token lifetime. Clock skew between IdP and API can cause intermittent validation failures.
- **Gateway**: JWT validation middleware order; audience (`playground-api`, `ordering-web`, `account`); public vs protected routes.
- **ordering-web**: Authorization Code + PKCE; `keycloak.init()`, nonce/session; use `http://localhost:4200` (not 127.0.0.1).
- **Where to look**: Gateway logs for 401/403; Keycloak event log; token `exp`/`nbf`/`iat`; system time on Gateway vs Keycloak.

---

## Gateway / YARP (Investigator YARP)

- **YARP config**: Route definitions, clusters, destinations, timeouts, health checks. Often in `appsettings.json` or dedicated config file.
- **Proxy behavior**: Connection pooling to backends, retry, load balancing. Under load, exhausted connections or timeouts can cause intermittent failures.
- **Middleware order**: CORS → Auth → Proxy. Errors in one step can manifest as latency or 5xx downstream.
- **Where to look**: Gateway access logs, response times per route; backend health endpoints; connection limits and timeout settings.

---

## Data Layer (Investigator Data)

- **PostgreSQL**: Connection pool size (e.g. Npgsql), long-running queries, locks. Schema-per-context: `ordering`, `invoicing`, `customers`. Connection exhaustion under load → intermittent timeouts.
- **Qdrant**: RPC timeouts, collection size, embedding latency. AI.Processor indexes orders/customers; search at chat time can spike latency.
- **Redis**: StackExchange.Redis, connection timeout, key expiry. Projections service writes aggregates; read path for stats.
- **Where to look**: EF Core logging; PostgreSQL `pg_stat_activity`; Qdrant metrics; Redis latency; connection pool settings in each API.

---

## Observability

- **Logs**: Each service logs to stdout; level in appsettings (Default, Microsoft.AspNetCore).
- **Tracing**: OpenTelemetry → Jaeger (e.g. port 16686) for distributed traces across Gateway and APIs.
- **Metrics**: RabbitMQ Management (15672); custom metrics if implemented (e.g. `/api/metrics/rabbitmq` in Ordering).

Use this skill to cite concrete files, config keys, or code paths when stating evidence for or against a hypothesis.
