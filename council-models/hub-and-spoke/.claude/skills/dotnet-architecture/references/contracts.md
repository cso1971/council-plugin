# Shared/Contracts — Full Reference

> Complete listing of all MassTransit commands, events, value objects, and enums.
> Read this file when you need exact property names, types, or namespaces.

---

## Commands (11 total)

### Ordering Commands (`Contracts.Commands.Ordering`)

| Command | Key Properties |
|---------|---------------|
| `CreateOrder` | CustomerId (Guid), Priority (OrderPriority enum), CurrencyCode, ShippingAddress, Lines (OrderLineItem[]) |
| `StartOrderProcessing` | OrderId, Notes? |
| `ShipOrder` | OrderId, TrackingNumber, Carrier, EstimatedDeliveryDate |
| `DeliverOrder` | OrderId, ReceivedBy, DeliveryNotes |
| `InvoiceOrder` | OrderId, InvoiceId? |
| `CancelOrder` | OrderId, CancellationReason |

### Customer Commands (`Contracts.Commands.Customers`)

| Command | Key Properties |
|---------|---------------|
| `CreateCustomer` | CompanyName, Email, DisplayName, Phone, TaxId, VatNumber, BillingAddress, ShippingAddress, PreferredLanguage, PreferredCurrency, Notes |
| `UpdateCustomer` | CustomerId + all nullable fields (partial update) |
| `CancelCustomer` | CustomerId, CancellationReason |

### Invoicing Commands (`Contracts.Commands.Invoicing`)

| Command | Key Properties |
|---------|---------------|
| `GenerateInvoice` | OrderId, CustomerId, Amount |

### Orchestrator Commands (`Contracts.Commands.Orchestrator`)

| Command | Key Properties |
|---------|---------------|
| `RequestOrchestration` | Prompt, CorrelationId? |

---

## Events (10 total)

### Ordering Events (`Contracts.Events.Ordering`)

| Event | Key Properties |
|-------|---------------|
| `OrderCreated` | OrderId, CustomerId, CustomerReference, CurrencyCode, TotalAmount, ShippingAddress, Lines[], CreatedAt |
| `OrderStatusChanged` | OrderId, PreviousStatus (OrderStatus enum), NewStatus (OrderStatus enum) |
| `OrderShipped` | OrderId |
| `OrderDelivered` | OrderId, CustomerId, GrandTotal, DeliveredAt, ReceivedBy, DeliveryNotes |
| `OrderCancelled` | OrderId |
| `OrderCompleted` | OrderId |

### Customer Events (`Contracts.Events.Customers`)

| Event | Key Properties |
|-------|---------------|
| `CustomerCreated` | CustomerId, CompanyName, DisplayName, Email, CreatedAt |
| `CustomerUpdated` | CustomerId + updated fields |
| `CustomerCancelled` | CustomerId |

### Invoicing Events (`Contracts.Events.Invoicing`)

| Event | Key Properties |
|-------|---------------|
| `InvoiceGenerated` | InvoiceId, OrderId, CustomerId, Amount, GeneratedAt |

---

## Value Objects

### OrderLineItem (Contracts.Commands.Ordering)

| Property | Type | Notes |
|----------|------|-------|
| LineNumber | int | Sequential within order |
| ProductCode | string | Product identifier |
| Description | string | Human-readable description |
| Quantity | decimal | Amount ordered |
| UnitOfMeasure | string | e.g., "pcs", "kg" |
| UnitPrice | decimal | Price per unit |
| DiscountPercent | decimal | Line-level discount |
| TaxPercent | decimal | Tax rate |
| *LineTotal* | decimal | Computed: Quantity * UnitPrice * (1 - Discount) |
| *TaxAmount* | decimal | Computed: LineTotal * TaxPercent |
| *LineTotalWithTax* | decimal | Computed: LineTotal + TaxAmount |

### ShippingAddress (Contracts.Commands.Ordering)

RecipientName, AddressLine1, AddressLine2, City, StateOrProvince, PostalCode, CountryCode, PhoneNumber, Notes

### PostalAddress (Contracts.Commands.Customers)

StreetLine1, StreetLine2, City, StateOrProvince, PostalCode, CountryCode

---

## Enums

### OrderStatus (`Contracts.Enums`)

| Value | Int | Notes |
|-------|-----|-------|
| Created | 0 | Initial state |
| InProgress | 1 | Processing started |
| Shipped | 2 | In transit |
| Delivered | 3 | Received by customer |
| Invoiced | 4 | Invoice generated |
| Cancelled | 99 | Cancelled from any pre-Invoice state |

### OrderPriority (`Contracts.Enums`)

| Value | Int | Notes |
|-------|-----|-------|
| High | 1 | Most urgent |
| Medium | 2 | Default |
| Low | 3 | Least urgent |

### InvoiceStatus (Invoicing.Api domain)

| Value | Int | Notes |
|-------|-----|-------|
| Draft | 0 | Auto-generated, not yet sent |
| Sent | 1 | Sent to customer |
| Paid | 2 | Payment received |
| Cancelled | 99 | Cancelled with reason |
