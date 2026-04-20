---
name: dotnet-architecture
description: ".NET 9 microservices architecture for the distributed-playground codebase. Use this skill whenever analyzing, designing, or reviewing .NET bounded contexts, MassTransit consumers, EF Core schemas, YARP gateway routing, cross-context integration, or Docker infrastructure in the distributed-playground project. Also use when proposing new services, endpoints, domain entities, or architectural changes to the existing system."
---

# .NET Architecture — Distributed Playground

Domain knowledge about the distributed-playground .NET 9 microservices codebase.
Use this skill to ground architectural analysis in concrete patterns, conventions, and structures from the real codebase.

> For the complete listing of all MassTransit commands, events, value objects, and enums with exact property names and types, read `references/contracts.md`.

---

## Services Overview

| Service | Port | Schema | Key Responsibility |
|---------|------|--------|-------------------|
| Gateway (YARP) | 5000 | — | Reverse proxy, JWT validation (Keycloak), Swagger aggregation |
| Ordering.Api | 5001 | `ordering` | Order lifecycle: create, process, ship, deliver, invoice, cancel |
| Invoicing.Api | 5002 | `invoicing` | Invoice generation on delivery, CRUD, cancellation |
| Customers.Api | 5003 | `customers` | Customer profiles, CRUD, soft-delete |
| AI.Processor | 5010 | — | RAG (Qdrant + Ollama), embedding, chat with projections context |
| Orchestrator.Api | 5020 | — | Semantic Kernel + Ollama, plugin-based chat, MassTransit commands |
| Projections | 5030 | — | CQRS read model: order events → Redis dimensional aggregations |

All services are operational and fully implemented.

---

## Bounded Context Pattern

Every bounded context follows this project layout:

```
src/Services/{Context}.Api/
├── Consumers/         # MassTransit command/event consumers
├── Domain/            # Entities, value objects, enums
├── Endpoints/         # Minimal API endpoint definitions + DTOs
├── Infrastructure/    # DbContext, EF configurations, repositories
├── Services/          # Domain services, repository interfaces
├── Clients/           # HTTP clients to other contexts (if needed)
├── Migrations/        # EF Core migrations
├── Program.cs         # Host configuration (DI, middleware, MassTransit, EF, OpenTelemetry)
└── appsettings.json   # Connection strings, service URLs, feature flags
```

Key conventions:
- One project per bounded context, one executable per service
- Minimal APIs (not controllers) — defined in `Endpoints/` as static extension methods
- Rich domain entities with behavior (not anemic DTOs)
- Repository pattern: interface in `Services/`, implementation in `Infrastructure/`
- Application-generated GUIDs for entity IDs (not database-generated)

---

## Domain Entities

### Order (Ordering.Api)

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | Application-generated |
| CustomerId | Guid | Logical reference to Customers context (no FK) |
| CustomerReference | string? | Customer's own reference (e.g., PO number) |
| Priority | OrderPriority | Enum: High(1), Medium(2), Low(3) — stored as int in DB |
| Status | OrderStatus | Created → InProgress → Shipped → Delivered → Invoiced; Cancelled from any pre-Invoice state |
| Lines | List\<OrderLine\> | Products with quantity, price, tax, discount |
| ShippingAddress | ShippingAddress | Owned value object (inline columns) |
| Subtotal / TotalTax / GrandTotal | decimal | Computed from Lines (excluded from EF mapping) |

**State machine**: Status transitions validated at domain level (`EnsureStatus` guards). Each transition publishes an event. Cancel allowed from any state except Invoiced.

### Invoice (Invoicing.Api)

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | Application-generated |
| OrderId | Guid | Unique — one invoice per order |
| CustomerId | Guid | Logical reference |
| TotalAmount | decimal(18,4) | Invoice amount |
| Status | InvoiceStatus | Draft(0) → Sent(1) → Paid(2); Cancelled(99) |
| GeneratedAt | DateTime | Auto-set on creation |

Created automatically when `OrderDelivered` event is consumed (idempotent: checks if invoice exists first). Publishes `InvoiceGenerated` event, which Ordering.Api consumes to update Order status to Invoiced.

### Customer (Customers.Api)

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | Application-generated |
| CompanyName, DisplayName | string | Required identification |
| Email, Phone | string | Contact info |
| TaxId, VatNumber | string | Fiscal identifiers |
| BillingAddress, ShippingAddress | PostalAddress | Owned value objects |
| IsActive | bool | Computed: `CancelledAt == null` |
| CancelledAt, CancellationReason | — | Soft-delete fields |

---

## Entity Framework Core Conventions

### Schema Isolation

Each DbContext sets its default schema — all share one PostgreSQL instance:

| Context | DbContext | Schema | Migrations |
|---------|-----------|--------|------------|
| Ordering | `OrderingDbContext` | `ordering` | SQL script (`create-ordering-schema.sql`) via `just db-ordering` |
| Invoicing | `InvoicingDbContext` | `invoicing` | EF Core migrations (InitialCreate) |
| Customers | `CustomersDbContext` | `customers` | EF Core migrations (InitialCreate + AddCustomerCancellation) |

New contexts should use the EF Core migration approach.

### Entity Configuration Patterns

- Owned types for value objects: `builder.OwnsOne(o => o.ShippingAddress)` — columns inline
- Computed properties (Subtotal, GrandTotal) excluded via `.Ignore()`
- Indexes on: CustomerId, Status, CreatedAt, Email, OrderId (unique for invoices)
- Cascade delete for child collections (OrderLine deleted when Order deleted)
- Enums stored as backing `int` — serialized/deserialized by EF Core automatically

---

## MassTransit Patterns

### Registration (Program.cs)

```csharp
builder.Services.AddMassTransit(x =>
{
    x.AddConsumers(typeof(Program).Assembly);  // auto-discover all consumers
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("localhost", "/", h => { h.Username("guest"); h.Password("guest"); });
        cfg.ConfigureEndpoints(context);       // auto-configure queues from consumer names
    });
});
```

### Consumer Pattern

Each consumer handles one command or event, performs the domain operation, persists, and optionally publishes new events:

```csharp
public class CreateOrderConsumer : IConsumer<CreateOrder>
{
    public async Task Consume(ConsumeContext<CreateOrder> context)
    {
        // 1. Validate (e.g., check customer exists via HTTP client)
        // 2. Map command to domain entity
        // 3. Persist via repository/DbContext
        // 4. Publish event(s) via context.Publish<OrderCreated>(...)
    }
}
```

### Queue Naming (automatic from class name)

- `CreateOrderConsumer` → queue `create-order`
- `OrderDeliveredConsumer` → queue `order-delivered`
- Error queue: `{queue-name}_error`

### Commands vs Events

| Type | Purpose | Delivery | Naming | Example |
|------|---------|----------|--------|---------|
| **Command** | Request an action | `Send` to specific queue | Imperative | `CreateOrder`, `ShipOrder`, `GenerateInvoice` |
| **Event** | Notify something happened | `Publish` to all subscribers | Past tense | `OrderCreated`, `OrderDelivered`, `InvoiceGenerated` |

### Idempotent Consumer Pattern

Consumers that may receive duplicate messages check before acting:
- `OrderDeliveredConsumer` checks if invoice for OrderId already exists
- `GenerateInvoiceConsumer` same idempotency check
- This handles MassTransit retry and redelivery safely

### Contract Summary (11 commands, 10 events)

| Namespace | Commands | Events |
|-----------|----------|--------|
| Ordering | CreateOrder, StartOrderProcessing, ShipOrder, DeliverOrder, InvoiceOrder, CancelOrder | OrderCreated, OrderStatusChanged, OrderShipped, OrderDelivered, OrderCancelled, OrderCompleted |
| Customers | CreateCustomer, UpdateCustomer, CancelCustomer | CustomerCreated, CustomerUpdated, CustomerCancelled |
| Invoicing | GenerateInvoice | InvoiceGenerated |
| Orchestrator | RequestOrchestration | — |

For exact property names and types, read `references/contracts.md`.

---

## YARP Gateway Configuration

Routes defined in `Gateway/appsettings.json` under `ReverseProxy`.

### Existing Routes

| Route | Path | Cluster (port) | Auth |
|-------|------|-----------------|------|
| ordering | `/api/orders/{**catch-all}` | :5001 | Public |
| invoicing | `/api/invoices/{**catch-all}` | :5002 | Public |
| customers | `/api/customers/{**catch-all}` | :5003 | Public |
| ai | `/api/ai/{**catch-all}` | :5010 | Public |
| orchestrator | `/api/orchestrator/{**catch-all}` | :5020 | JWT |
| projections | `/api/projections/{**catch-all}` | :5030 | Public |
| ordering-metrics | `/api/metrics/{**catch-all}` | :5001 | Public |
| *-swagger | `/{service}/swagger/{**catch-all}` | respective | Public |

Auth: JWT Bearer via Keycloak (realm `playground`). Routes with `Metadata.Public = "true"` skip authentication.

### Adding a New Bounded Context

When adding a new service, you need:
1. A new cluster definition pointing to the service port
2. Route(s) for API endpoints (`/api/{resource}/{**catch-all}`)
3. Swagger route (`/{service}/swagger/{**catch-all}`) with `PathRemovePrefix` transform
4. Decide auth: `Metadata.Public = "true"` or JWT Bearer

---

## Cross-Context Integration

### Current Integrations

| From → To | Mechanism | Purpose |
|-----------|-----------|---------|
| Ordering → Customers | HTTP (ICustomersApiClient) | Validate CustomerId exists before order creation |
| Ordering ← Invoicing | MassTransit event (InvoiceGenerated) | Update Order status to Invoiced, set InvoiceId |
| Invoicing ← Ordering | MassTransit event (OrderDelivered) | Auto-generate invoice on delivery |
| AI.Processor ← All | MassTransit events + HTTP | Consume domain events, fetch data for Qdrant indexing |
| AI.Processor → Projections | HTTP | Fetch stats for RAG context enrichment |
| Orchestrator → Ordering, Customers | HTTP + MassTransit (IBus) | Read data via HTTP, send commands via IBus |
| Projections ← Ordering | MassTransit events | Consume order events, project to Redis |

### Integration Rules

- **No cross-schema database queries** — bounded contexts communicate only via events and HTTP
- **Logical references only** — `Order.CustomerId` refers to `Customer.Id`, no physical FK
- **Events for async side effects** — state changes propagate to interested contexts
- **HTTP for synchronous validation** — verify data in another context before proceeding
- **IBus (singleton) for command sending** from non-request-scoped code (e.g., Semantic Kernel plugins)

---

## Projections (CQRS Read Model)

The Projections service consumes all order events and projects dimensional aggregations into Redis.

### Events Consumed

OrderCreated, OrderStatusChanged, OrderShipped, OrderDelivered, OrderCancelled, OrderCompleted

### Redis Structure

9 dimensions: status, currency, customer-ref, shipping-method, created-month, created-year, delivered-month, delivered-year, product. Each dimension stores count + subtotal + grandTotal per value.

Order snapshots stored as `order:{id}:snapshot` for cross-event lookups. Last updated timestamp in `last-updated` key.

### Endpoints

- `GET /api/projections/stats` — all dimensions
- `GET /api/projections/stats/{dimension}` — single dimension
- `POST /api/projections/flush` — reset all projections

---

## Program.cs Boilerplate

Every service follows this host configuration structure:

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. EF Core (if persistence needed)
builder.Services.AddDbContext<XxxDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. MassTransit + RabbitMQ
builder.Services.AddMassTransit(x => { /* auto-discover consumers, configure RabbitMQ */ });

// 3. Application services
builder.Services.AddScoped<IXxxRepository, XxxRepository>();

// 4. OpenTelemetry (all services trace to Jaeger via OTLP)
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter());

// 5. Swagger + CORS + Health checks
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(...);
builder.Services.AddHealthChecks();

// 6. JSON serialization: enums as PascalCase strings
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();
app.UseSwagger(); app.UseSwaggerUI(); app.UseCors();
app.MapXxxEndpoints();
app.MapHealthChecks("/health");
app.Run();
```

---

## Docker Infrastructure

| Container | Port | Profile | Purpose |
|-----------|------|---------|---------|
| PostgreSQL 16 | 5432 | infra | Single instance, schema-per-context |
| RabbitMQ | 5672 / 15672 | infra | AMQP + Management UI |
| Qdrant | 6333 / 6334 | infra | Vector DB for RAG |
| Redis 7 | 6379 | infra | CQRS projections read model |
| Jaeger | 16686 / 4317 | infra | Distributed tracing (OTLP) |
| Keycloak | 8180 | infra | IdP — realm `playground` |
| Ollama | 11434 | ollama | Local LLM (llama3.2 + nomic-embed-text) |

All .NET services + Gateway + Angular frontend have Dockerfiles in `infra/dockerfiles/` and run under the `full` profile. Network: `playground-network`.

### When to Update Docker Artifacts

| Change | Update Required |
|--------|----------------|
| New service/project | New Dockerfile + docker-compose entry + YARP route |
| New project reference | Dockerfile COPY + restore layers |
| New port | docker-compose ports + YARP cluster |
| New env variable | docker-compose environment section |
| New infra dependency | docker-compose service under infra profile |

Dockerfile pattern: multi-stage (`sdk` for restore+publish, `aspnet` for runtime). Never use `--no-restore` in `dotnet publish` — it skips NuGet package restore and breaks the build.

---

## Frontend (Angular 17)

Port 4200, auth via Keycloak (Authorization Code + PKCE).

**Pages**: Order list, Order detail (with workflow actions), Order create, Customer list/create/detail, Projections dashboard, AI Chat (RAG / Semantic Kernel selector).

**Models**: `OrderPriority` type ('High' | 'Medium' | 'Low'), `OrderStatus` enum (0-4, 99), full Order/OrderLine/Customer interfaces.

All API calls go through Gateway (:5000). Bearer token attached via Angular HTTP interceptor.
