# Domain Context: Distributed Playground

> .NET 9 microservices sandbox built with bounded contexts

---

## overview

The **distributed-playground** is a .NET 9 microservices sandbox. It demonstrates bounded context patterns, event-driven communication, and service-oriented architecture using a real-world-ish domain: order management with customers, invoicing, and AI-assisted operations.

The system manages **orders** (Ordering API), **customers** (Customers API), and **invoicing** (Invoicing API — currently a placeholder). Users interact through an **Angular frontend** and an **API Gateway** (YARP). There is also an **AI chat assistant** that uses RAG to answer questions about orders and customers.

---

## services

| Service | Port | Schema | Key Components |
|---------|------|--------|----------------|
| Gateway (YARP) | 5000 | — | Reverse proxy, JWT validation, Swagger aggregation |
| Ordering API | 5001 | `ordering` | Order aggregate, order workflow (Created→Shipped→Delivered→Completed), MassTransit events |
| Invoicing API | 5002 | `invoicing` | Invoice generation on `OrderDelivered`, REST CRUD, `InvoiceGenerated` event |
| Customers API | 5003 | `customers` | Customer CRUD, soft-delete, MassTransit events |
| AI.Processor | 5010 | — | Ollama + Semantic Kernel |
| Orchestrator | 5020 | — | Workflow coordination |
| Projections | 5030 | — | Read-model projections |

---

## tech-stack

- **.NET 9** — ASP.NET Core minimal APIs / controllers
- **Entity Framework Core** — one DbContext per bounded context, dedicated PostgreSQL schema
- **MassTransit** over RabbitMQ — inter-service events and commands
- **YARP** — reverse proxy gateway routing to all APIs
- **PostgreSQL** — shared instance, schema-per-context isolation
- **xUnit** — unit and integration tests (WebApplicationFactory for integration)
- **Angular** — frontend (separate project)

---

## bounded-context-pattern

Every bounded context follows this structure:

```
Services/{Context}/
├── Controllers/        # API endpoints
├── Domain/             # Entities, value objects, domain events
├── Infrastructure/     # DbContext, EF configurations, consumers
└── Program.cs          # Service host configuration
```

Key conventions:
- One DbContext per bounded context with a dedicated PostgreSQL schema
- Controllers use constructor injection for dependencies
- Domain entities encapsulate business rules; value objects are immutable
- Infrastructure contains EF configurations, MassTransit consumers, and repository implementations

---

## cross-context-integration

- **Ordering → Customers**: `CustomerId` reference (logical, no physical FK between schemas)
- **Ordering → Invoicing**: order workflow publishes events (e.g., `OrderDelivered`) that Invoicing should consume
- All events go through MassTransit over RabbitMQ
- Events are fire-and-forget; consumers must handle duplicates (idempotency) and out-of-order delivery
- No direct database queries across schemas — communication is exclusively through events

---

## docker-infrastructure

Every application service has a corresponding **Dockerfile** in `infra/dockerfiles/` and a **service definition** in `infra/docker-compose.yml`. These artifacts **must be kept aligned** with code changes.

### Dockerfile Pattern (multi-stage build)

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY *.sln .
COPY src/Shared/Contracts/*.csproj src/Shared/Contracts/
COPY src/Shared/Common/*.csproj src/Shared/Common/
COPY src/Services/{Service}/*.csproj src/Services/{Service}/
# ... all project references needed for restore

RUN dotnet restore src/Services/{Service}/{Service}.csproj
COPY src/Shared/ src/Shared/
COPY src/Services/{Service}/ src/Services/{Service}/
RUN dotnet publish src/Services/{Service}/{Service}.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
...
```

### When Dockerfiles Must Be Updated

| Change | Required Dockerfile Update |
|--------|---------------------------|
| New project reference added | Add `COPY {new-project}/*.csproj {new-project}/` before restore, and `COPY {new-project}/ {new-project}/` before publish |
| New service created | Create a new `{Service}.Dockerfile`; add service definition in `docker-compose.yml` |
| Port changed in `launchSettings.json` | Update `ports:` mapping in `docker-compose.yml` |
| New environment variable required | Add to `environment:` in `docker-compose.yml` |
| New service dependency | Add `depends_on:` entry in `docker-compose.yml` |
| New NuGet package with native dependencies | May need `RUN apt-get install` in runtime stage |

### Common Pitfall: `--no-restore`

Do **NOT** use `--no-restore` on `dotnet publish`. Transitive analyzer packages may fail to resolve when restore and publish happen in separate steps. Always let `dotnet publish` perform its own restore.

### Existing Dockerfiles

| Service | Dockerfile | Compose service |
|---------|-----------|-----------------|
| Ordering API | `infra/dockerfiles/Ordering.Api.Dockerfile` | `ordering-api` |
| Invoicing API | `infra/dockerfiles/Invoicing.Api.Dockerfile` | `invoicing-api` |
| Customers API | `infra/dockerfiles/Customers.Api.Dockerfile` | `customers-api` |
| Gateway | `infra/dockerfiles/Gateway.Dockerfile` | `gateway` |
| AI Processor | `infra/dockerfiles/AI.Processor.Dockerfile` | `ai-processor` |
| Orchestrator API | `infra/dockerfiles/Orchestrator.Api.Dockerfile` | `orchestrator-api` |
| Projections | `infra/dockerfiles/Projections.Dockerfile` | `projections-api` |
| Ordering Web | `infra/dockerfiles/ordering-web.Dockerfile` | `ordering-web` |

---

## order-workflow

The order workflow has defined state transitions:

```
Created → Shipped → Delivered → Invoiced → Completed
                                    ↘ Cancelled (from multiple states)
```

Key rules:
- Only delivered orders can be invoiced
- Invalid state transitions must be rejected
- State changes publish domain events via MassTransit
- The `OrderDelivered` event triggers the invoicing flow

---

## user-roles

The system serves several user types:

- **Operators** — manage orders (create, update status, view history), manage customers
- **Finance/Accounting staff** — view and manage invoices, track order-to-invoice flow
- **Customers** — (future) self-service order tracking, profile management
- **Administrators** — system configuration, user management
- **AI assistant users** — ask natural-language questions about orders and customers

---

## testing-landscape

### Testing Stack

- **xUnit** — test framework
- **WebApplicationFactory** — integration testing of ASP.NET Core APIs
- **MassTransit Test Harness** — testing consumers and event publishing in isolation
- **EF Core InMemory / SQLite** — fast database tests without PostgreSQL dependency

### Key Testing Dimensions

| Dimension | What to test | Risk level |
|-----------|-------------|------------|
| **Domain logic** | Entity state transitions, value object validation, business rules | High — core correctness |
| **API endpoints** | HTTP contracts, request validation, response shapes, error codes | Medium — integration surface |
| **MassTransit consumers** | Event handling, idempotency, error queues, message format | High — async = hard to debug |
| **Cross-context flows** | Order → Invoice event chain, data consistency across schemas | High — distributed = complex |
| **Database** | Schema creation, migrations, constraint enforcement, concurrent writes | Medium — data integrity |
| **Gateway routing** | YARP routes to new endpoints, auth requirements | Low — config-level |

### Common Edge Cases

- **Duplicate events**: MassTransit may redeliver a message — consumers must be idempotent
- **Out-of-order events**: `OrderDelivered` might arrive before the consumer has processed `OrderCreated`
- **Missing references**: an invoice references an order that doesn't exist in the invoicing schema (cross-context eventual consistency)
- **Concurrent operations**: two requests try to invoice the same order simultaneously
- **Partial failures**: invoice created in DB but event publication fails (or vice versa)
