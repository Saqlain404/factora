# Factora — Database

**Status:** `IN_PROGRESS` (auth tables only built so far: migration `drizzle/0000_whole_doomsday.sql`)

## Strategy

- PostgreSQL (Neon, serverless) + Drizzle ORM.
- Schema is defined in TypeScript under `src/modules/<module>/schema.ts` and migrated with Drizzle Kit.
- Integrity constraints (FKs, CHECK, enums) live in the database; business rules that need domain logic live in `domain.ts`.
- No multi-tenancy in V1: all data belongs to the single tenant. Tables are designed to allow an `orgId` (or derived scoping) later without redesigning the core.

## Conceptual Model

```
customers 1───n orders 1───n order_items n───1 products
products 1───0..1 moulds
products 1───n bom_items n───1 raw_materials
moulds (lifecycle: Required → Ordered → Received → Trial → Active)
machines (master)
raw_materials 1───n raw_material_stock_ledger
suppliers 1───n purchase_orders 1───n purchase_receipts n───1 raw_materials
orders 1───n production_batches n───1 products, machines, moulds
production_batches n───n raw_materials (reserved_at_start, consumed_at_completion)
production_batches 1───n batch_costs (manual costing)
customers 1───n invoices
orders 1───n invoices (partial dispatch/invoicing allowed)
invoices 1───n payments (overpayment blocked)
expenses (manual records)
users, accounts, sessions (Auth.js)
```

## Entities (to be built, in build order)

| Entity | Table | Key attributes |
| --- | --- | --- |
| User | `users` ✅ built | email, name, role (enum `user_role`) |
| Account / Session / VerificationToken | `accounts`, `sessions`, `verification_tokens` ✅ built | Auth.js tables |
| Raw Material | `raw_materials` | name, unit, HSN, current rate, minimum stock, GST rate, status |
| Supplier | `suppliers` | name, contact, GSTIN, address |
| Product | `products` | name, code, unit, mould_id, HSN, GST rate, selling price |
| Mould | `moulds` | name, status (`required/ordered/received/trial/active`), supplier, cost, received_at, active_at |
| Machine | `machines` | code, name, capacity, status |
| Customer | `customers` | name, contact, GSTIN, state, credit_period_days |
| Order | `orders` | order_no, customer_id, order_date, status, credit period snapshot |
| Order Item | `order_items` | order_id, product_id, quantity, rate, discount |
| BOM Item | `bom_items` | product_id, raw_material_id, qty_per_unit |
| Stock Ledger (raw material) | `inventory_ledger` | raw_material_id, type (enum), qty (+/-), reference, balance_after, note, user, at |
| Purchase Order | `purchase_orders` | supplier_id, status, items |
| Purchase Receipt | `purchase_receipts` | po_id, raw_material_id, qty, rate, received_at |
| Production Batch | `production_batches` | batch_no, order_id? (nullable → stock), product_id, machine_id, mould_id, plan_qty, ok_qty, rejected_qty, status, started_at, completed_at |
| Batch Material Reservation | `batch_materials` | batch_id, raw_material_id, planned_qty, reserved_at, consumed_qty, consumed_at |
| Batch Cost | `batch_costs` | batch_id, material_cost, labour_cost, electricity_cost, mould_alloc, other, total (manual entry) |
| Invoice | `invoices` | customer_id, order_id?, invoice_no (sequential INV-###), date, items, tax, totals, status |
| Payment | `payments` | customer_id, invoice_id, amount, method, date, received_at |
| Expense | `expenses` | date, category, amount, note, receipt? |
| Document Attachment | `attachments` | entity_type, entity_id, file_path, filename, mime, size (later) |

## Inventory Movement Types (approved list — only these for V1)

| type | debit/credit | meaning |
| --- | --- | --- |
| `PURCHASE_RECEIPT` | + | stock in from supplier receipt |
| `PRODUCTION_CONSUMPTION` | − | raw material consumed (at batch completion; planned qty reserved at start) |
| `PRODUCTION_OUTPUT` | + | finished product entered (distinct from raw material stock) |
| `PRODUCTION_RETURN` | + | unused material returned from a batch (blocked until user approves policy) |
| `DISPATCH` | − | finished product moved out on dispatch |
| `ADJUSTMENT` | ± | stock correction, requires note + authorized user |

**Do not add** types beyond this list without explicit user approval (e.g. no automatically-invented wastage/returns).

## Data-Integrity Rules (binding)

1. Every raw-material stock movement is a ledger row with a computed `balance_after`; the current stock is the last ledger balance, never a separately edited counter.
2. Negative stock is **forbidden** at the database level (CHECK) and at the domain level.
3. Raw material is **reserved** at batch start (planned) and **consumed** at completion with actual usage. Reserved-but-unused logic requires user decision (see OPEN-QUESTIONS).
4. Duplicate string IDs (order numbers, invoice numbers, batch numbers, product codes) are unique-constrained; generated from a strict sequence per business rule.
5. Invoice numbers are sequential `INV-001`, `INV-002`, … unique, generated in a transaction to prevent gaps/duplicates (or handled per DECISIONS).
6. A batch can optionally link to an order, or be "for stock" (`order_id NULL`). If linked to an order, its output applies to that order's fulfilment.
7. Every production batch requires exactly one machine and one mould (mould status `active`).
8. Paid amount per invoice can never exceed the invoice total minus discounts (overpayment is blocked).
9. Ownership/linking: approvals and user attribution recorded via `user_id` where meaningful.

## Enums

Planned enums (Drizzle `pgEnum`):

| Enum | Values |
| --- | --- |
| `user_role` ✅ | `admin`, `manager`, `user` |
| `mould_status` | `required`, `ordered`, `received`, `trial`, `active` (no other values) |
| `inventory_transaction_type` | see approved list above |
| `order_status` | pending/open, in_production, partially_dispatched, dispatched, invoiced/closed |
| `batch_status` | in_progress, completed, cancelled |
| `invoice_status` | draft, issued, partially_paid, paid, cancelled |

(Order/batch/invoice status value sets are tied to open questions and workflow docs — finalize with the user before building.)

## Migration Workflow

- `npm run db:generate` — generate SQL migration from schema.
- `npm run db:migrate` — apply migrations (needs real `DATABASE_URL`).
- `npm run db:push` — dev-only, no history (avoid on shared DB).
- `npm run db:seed` — create initial admin (uses `src/scripts/seed-admin.ts`).

## Explicitly Out of Scope for Schema

- Multiple business entities inside one DB (no multi-tenant).
- Any tables for: payroll/HR, full accounting ledger, production scheduling/MRP.
- Automatic costing (no costing formula tables in V1 — costs are manual per batch).