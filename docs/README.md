# Factora — Documentation

> Factora is a manufacturing operations and management platform that helps manufacturers manage customer orders, moulds, raw materials, production, inventory, quality, dispatch, GST invoicing, payments, and business operations in one place.

This directory is the single source of truth for how Factora works and how it will be built.

## Product Identity

| Item | Value |
| --- | --- |
| Product/brand name | Factora |
| Intended production domain | `factoraa.com` (configure future DNS/deployment) |
| Package identifier | `factora` |

Do **not** rename the product to "Factoraa". The domain contains an extra "a" only; the product is **Factora**.

## Documentation Statuses

Every decision, feature, and phase uses one of these statuses:

| Status | Meaning |
| --- | --- |
| `PROPOSED` | Recommended but not yet approved |
| `APPROVED` | Explicitly approved by the user |
| `IN_PROGRESS` | Work is being performed now |
| `BLOCKED` | Waiting on an external decision (e.g., client paperwork) |
| `COMPLETED` | Work is done and validated |
| `DEPRECATED` | Superseded by a newer decision |

## Reading Order

1. **Get oriented**: [PRODUCT.md](./PRODUCT.md) — what Factora is and the first customer's business.
2. **Decisions**: [DECISIONS.md](./DECISIONS.md) — binding decisions only.
3. **Open questions**: [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md) — what is still unresolved.
4. **Business rules**: [BUSINESS-RULES.md](./BUSINESS-RULES.md) — approved vs proposed rules.
5. **Technical design**: [ARCHITECTURE.md](./ARCHITECTURE.md), [DATABASE.md](./DATABASE.md).
6. **Modules**: [modules/](./modules/) — one doc per product module.
7. **Workflows**: [workflows/](./workflows/) — step-by-step workflow breakdowns.
8. **Phases**: [phases/](./phases/) — the implementation roadmap.

## Index

### Core documents

| Document | Purpose |
| --- | --- |
| [PRODUCT.md](./PRODUCT.md) | Product vision, first customer business model, commercial principle |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, stack decision record, code layout |
| [DATABASE.md](./DATABASE.md) | Conceptual data model and data-integrity rules |
| [BUSINESS-RULES.md](./BUSINESS-RULES.md) | Approved business rules and their intent |
| [SECURITY.md](./SECURITY.md) | Security principles and controls |
| [TESTING.md](./TESTING.md) | Test strategy and coverage priorities |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment plan (Vercel + Neon), domain configuration |
| [FILE-STORAGE.md](./FILE-STORAGE.md) | Document/file storage strategy |
| [DECISIONS.md](./DECISIONS.md) | Binding decision log |
| [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md) | Unresolved questions requiring the user |

### Modules ([modules/](./modules/))

Customers, Suppliers, Products, Raw Materials, Moulds, Machines, Orders, BOM, Inventory, Procurement, Production, Quality, Finished Goods, Packing, Dispatch, Invoicing, Payments, Costing, Expenses, Reports, Dashboard.

### Workflows ([workflows/](./workflows/))

Customer Order, Mould Procurement, Raw Material Procurement, Production, Inventory, Dispatch, Invoicing, Payments.

### Phases ([phases/](./phases/))

Phase 00 Discover — Phase 13 Production Hardening.