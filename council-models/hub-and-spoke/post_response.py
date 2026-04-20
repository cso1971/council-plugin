import json, subprocess

response = """## Product Analyst — Round 2 Response

**Vote**: APPROVE

**Reasoning**:
The revised proposal has fully resolved the five QA objections from Round 1. The domain model is now explicit and complete: all required fields are named with their types and constraints; the lifecycle is defined as a concrete state machine (Draft → Active → Terminated) with a clearly distinguished computed state (Expired); the binding semantics are unambiguous (optional reference, creation-time validation only, no retroactive effect on existing orders); and the cardinality rule is precisely stated (one customer → many contracts, multiple Active contracts permitted simultaneously). Every implicit assumption from Round 1 has been made explicit. The open questions raised (MassTransit event for RAG, order detail depth) are scoped to Architect and do not affect the functional completeness of the user stories — they concern implementation details that do not change what the user can or cannot do.

The four user stories from Round 1 are retained and refined below. The lifecycle AC now covers the specific transitions and validation rules from the revised proposal; the order-creation AC now explicitly covers the nullable dropdown, the three-part validation rule (existence + CustomerId match + Active + non-expired), and the historical-reference behavior; and a new story (US-004) on order detail display is added to close the open question on depth of display (answer: ContractNumber only, as stated in the revised proposal).

**Details**:

---

### US-001 — Contract Management (CRUD)

**As a** sales operator,
**I want** to create, view, update, and manage contracts for a customer,
**so that** I can track the commercial agreements that govern orders placed by that customer.

**Acceptance Criteria:**

**AC-US001-01 — Create contract with all required fields**
- Given a valid customerId and all required fields (ContractNumber, Title, StartDate, EndDate > StartDate, CurrencyCode), when a POST /api/contracts request is submitted, then a new contract is persisted in schema `contracts` with Status = Draft and CreatedAt/UpdatedAt timestamps set.

**AC-US001-02 — EndDate must be after StartDate**
- Given a request where EndDate <= StartDate, when the contract creation is submitted, then the API returns HTTP 422 with a validation error specifying the date constraint violation.

**AC-US001-03 — Retrieve contracts by customer**
- Given one or more contracts exist for a customerId, when GET /api/contracts?customerId={guid} is called, then all contracts for that customer are returned (any status), with all fields including a computed isExpired flag when EndDate < today.

**AC-US001-04 — Update contract metadata**
- Given a contract in Draft status, when a PATCH/PUT request updates Title, PaymentTerms, Notes, or date fields, then the changes are persisted and UpdatedAt is refreshed.

**AC-US001-05 — ContractNumber is unique per customer**
- Given a contract already exists for a customer with ContractNumber C-2024-001, when a second contract for the same customer is submitted with the same ContractNumber, then the API returns HTTP 409 Conflict.

---

### US-002 — Contract Lifecycle Transitions

**As a** sales operator,
**I want** to activate and terminate contracts through explicit state transitions,
**so that** only commercially valid contracts can be referenced on new orders.

**Acceptance Criteria:**

**AC-US002-01 — Activate a Draft contract**
- Given a contract with Status = Draft, when POST /api/contracts/{id}/activate is called, then the contract transitions to Status = Active and UpdatedAt is updated.

**AC-US002-02 — Terminate an Active contract**
- Given a contract with Status = Active, when POST /api/contracts/{id}/terminate is called (with optional reason in the request body), then the contract transitions to Status = Terminated and UpdatedAt is updated.

**AC-US002-03 — Invalid transitions are rejected**
- Given a contract with Status = Terminated, when POST /api/contracts/{id}/activate is called, then the API returns HTTP 422 with an error indicating the transition is not permitted from the current status.

**AC-US002-04 — Expired is computed, not stored**
- Given a contract with Status = Active and EndDate < today, when the contract is retrieved via GET, then the response includes a computed field isExpired=true; the stored Status remains Active. The contract does NOT appear in the Active and non-expired list used for order-creation dropdowns.

**AC-US002-05 — Draft contracts are not selectable on orders**
- Given a contract with Status = Draft (regardless of dates), when the order-creation endpoint requests eligible contracts for a customerId, then Draft contracts are excluded from the result.

---

### US-003 — Contract Selection on Order Creation

**As a** user creating an order,
**I want** to optionally associate the order with an active, non-expired contract for the selected customer,
**so that** orders can be linked to their governing commercial agreement at the time of creation.

**Acceptance Criteria:**

**AC-US003-01 — Contract dropdown is optional (nullable)**
- Given the order creation form with a customer selected, when no contract is chosen from the dropdown, then the order is created successfully with ContractId = null; no validation error is raised.

**AC-US003-02 — Only Active and non-expired contracts appear in the dropdown**
- Given a customer has contracts in Draft, Active (non-expired), Active (expired), and Terminated status, when the order creation form loads for that customer, then only the Active and non-expired contract(s) appear in the dropdown.

**AC-US003-03 — Ordering.Api validates ContractId at creation time (three-part rule)**
- Given a ContractId is provided on order creation, when Ordering.Api calls Contracts.Api to validate it, then the validation passes only if ALL three conditions hold: (a) the contract exists, (b) the contract CustomerId matches the order CustomerId, and (c) the contract has Status = Active and EndDate >= today. If any condition fails, the API returns HTTP 400 with a specific error message.

**AC-US003-04 — Terminated or expired contract after order creation has no effect**
- Given an order was created with ContractId X (valid at creation time), when contract X is subsequently terminated or expires, then the order retains ContractId X unchanged; no retroactive update or error occurs.

**AC-US003-05 — ContractId from a different customer is rejected**
- Given a ContractId that belongs to Customer B, when an order is created for Customer A with that ContractId, then Ordering.Api returns HTTP 400 indicating the contract does not belong to the specified customer.

---

### US-004 — Contract Display on Order Detail

**As a** user viewing an order,
**I want** to see the ContractNumber associated with the order (when one exists),
**so that** I can identify which commercial agreement was in effect when the order was placed.

**Acceptance Criteria:**

**AC-US004-01 — Order detail shows ContractNumber when ContractId is set**
- Given an order with a non-null ContractId, when the order detail page is loaded in Angular, then the ContractNumber (retrieved from Contracts.Api using the stored ContractId) is displayed in the order detail view.

**AC-US004-02 — Order detail handles missing contract gracefully**
- Given an order with a non-null ContractId but the contract no longer exists (deleted or data issue), when the order detail page is loaded, then the UI displays a fallback (e.g., the ContractId as a reference, or "Contract not found") without an error.

**AC-US004-03 — Order detail shows no contract section when ContractId is null**
- Given an order with ContractId = null, when the order detail page is loaded, then no contract field or section is shown in the UI.

---

### Note on Open Questions

The two open questions in the revised proposal are addressed from the Product Analyst perspective:

- **RAG indexing via MassTransit (ContractCreated event)**: not a user-visible requirement; deferred to Architect. No user story needed at this stage.
- **Order detail depth**: US-004 specifies ContractNumber only (as stated in the revised proposal). Full contract detail (Title, dates, terms) can be a future story if stakeholders request it.

All four stories are complete, all acceptance criteria are concrete and testable, edge cases and error scenarios are covered. The proposal is ready for implementation."""

payload = json.dumps({"agent": "Product Analyst", "text": response})

result = subprocess.run(
    ["curl", "-s", "-X", "POST",
     "http://localhost:8002/council/run/5adcc93e-65bc-4f32-8202-0ec384766050/agent-log",
     "-H", "Content-Type: application/json",
     "-d", payload],
    capture_output=True, text=True
)
print("stdout:", result.stdout)
print("stderr:", result.stderr)
print("returncode:", result.returncode)
