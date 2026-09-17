# Factora — Product

**Status:** `IN_PROGRESS`

## What is Factora?

Factora is a manufacturing operations and management platform built for a first customer in Uttar Pradesh, India. It helps a plastics/injection-moulding manufacturer run their daily operations in one place: customers, orders, moulds, raw material, production, inventory, dispatch, GST invoicing, and payments.

## Product Vision

One system that a small-to-mid-size Indian manufacturer can run their entire business from:

- **Know their orders** — what the customer ordered, delivery dates, and order status.
- **Know their moulds** — which mould is required, ordered, received, in trial, or active.
- **Know their production** — what was produced, on which machine, from which batch, and what it cost.
- **Know their inventory** — what is on hand, what is consumed, and what is finished.
- **Get paid** — GST-compliant invoices and clear payment tracking.

Factora is designed as a **commercial product**, not a one-off internal tool; however, every structural decision is validated first against the first customer's real business.

## First Customer Business Model (Source of Truth for V1)

The first customer is an injection-moulding manufacturer in Uttar Pradesh (GST state code `09`).

Approved characteristics of this business:

- **Make-to-order**: production happens against customer orders, but *production for stock* is allowed.
- **Customer-specific parts**: parts are made from **customer-owned moulds**; the factory supplies the plastic/resin material, labour, and machine time.
- **Resin-based moulding**: raw material is principally polymer resin (e.g., polypropylene, ABS, HDPE), purchased in bags by weight, and sometimes additional additives/masterbatch.
- **Machines**: injection-moulding machines. Every production batch is assigned to one machine.
- **Bill of materials (BOM)**: each product specifies the resin and other raw materials per unit so consumption can be planned and reserved.
- **Invoicing/GST**: registered business under GST; invoices must be GST-compliant; business state Uttar Pradesh (GST code `09`).
- **Costing**: costing is entered manually per batch (no automatic costing engine in V1).
- **Rejections**: rejected material produced is treated as absorbed/lost — it is not automatically returned to inventory.

## Commercial Product Principle

- **One product, many customers.** Factora is built as a product, not a bespoke fling.
- **No multi-tenancy in V1.** The system is delivered as a single-tenant deployment for the first customer.
- **Generalization on demand.** Every time a feature is added, we ask: "If a fourth customer had this requirement, would the shape still be right?" The model is designed so a future multi-tenant rollout does not require a rewrite.

## Design Constraints (Binding)

These constraints come from master instructions and are **binding**:

- Do not invent business rules that the user has not shared.
- Do not implement multi-tenancy, Redis, Kubernetes, or microservices.
- Do not claim the domain is live, and do not claim full GST compliance — the system implements rules for the first customer's state (UP); verify compliance before production use.
- Every feature must be buildable with PostgreSQL + Drizzle ORM and a single Next.js serverless deployment on Vercel.

## Feature Namespaces

| Namespace | Business domain | Phase |
| --- | --- | --- |
| Auth & Access | Login, roles, permissions | Phase 1 (shell now), enforcement later |
| Master Data | Customers, suppliers, products, raw materials, moulds, machines | Phase 1 |
| Sales | Customer orders, dispatch, invoicing, payments | Phase 6 |
| Manufacturing | BOM, production, costing, expenses | Phase 4-5 |
| Inventory | Raw material procurement, stock, adjustments | Phase 3-5 |
| Quality | In-process quality | Later phase (blocked — no client QC spec yet) |
| Reports & Dashboard | Insights | Later phase |

## Not in Scope (V1)

- Multi-tenancy/user subscriptions
- Automatic costing engine (costs are manually entered per batch)
- Automatic deduction/credit notes (pending); returns/credit-note handling is an open question
- Inventory transaction types beyond the approved list (see [DATABASE.md](./DATABASE.md))
- Production planning/scheduling (MRP/APS); only order-aware production tracking
- Payroll/HR
- General ledger / full accounting (only GST invoice + payment tracking)

## Key Terms Glossary

| Term | Meaning |
| --- | --- |
| Mould | Injection-mould tooling, usually customer-owned, required per product |
| BOM | Bill of materials — what raw materials make one unit of a product |
| Batch | One production run against a BOM for one product |
| Production for stock | Manufacturing without a linked customer order |
| Reserve | Setting raw material aside at batch start (planned consumption) |
| Consume | Booking actual raw material usage at batch completion |
| GST | Goods and Services Tax (India) — state code `09` = Uttar Pradesh |