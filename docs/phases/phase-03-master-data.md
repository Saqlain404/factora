# Factora — Phase 03: Master Data

**Status:** `IN_PROGRESS` — core build complete; final acceptance review pending.
**Build state:** Users/suppliers/raw-materials/products/moulds/machines implemented end-to-end (schemas, migration, queries, server actions, UI). See "Current state" below.

## Business purpose

Master data is the vocabulary every other module speaks. Without reliable customers, suppliers, products, raw materials, moulds, and machines, orders, procurement, production, and invoicing cannot exist. This phase builds the six masters that carry the approved business rules: per-customer credit period (DEC-018), strict mould lifecycle (DEC-015), and the machine master required by per-batch machine tracking (DEC-016).

## Scope

**In scope**

- **Customers**: contact details, GST state, address, per-customer credit period (DEC-018). Seeds invoicing/payments later.
- **Suppliers**: contact, GSTIN, address. Seeds procurement (Phase 04).
- **Raw materials**: name, unit of measure (bags/kg), HSN code, current rate, GST rate, minimum stock level. Seeds inventory (Phase 04/05).
- **Products**: name, code, unit, HSN, GST rate, selling price, link to mould. Seeds orders/BOM/invoicing.
- **Moulds**: full lifecycle `Required → Ordered → Received → Trial → Active` (DEC-015).
- **Machines**: code, name, capacity, status. Mandatory one-machine-per-batch reference (DEC-016).
- Crud + soft archive for all masters; unique codes/names enforced.

**Out of scope**

- BOM definitions (Phase 04), purchase orders/receipts (Phase 04).
- Customer orders, production batches, dispatch, invoicing, payments (later phases).
- Mould development billing/reimbursement to customers — unresolved (OQ-17).
- HSN/GST rate seed data beyond what the customer provides (OQ-19).

## Current state

Built. Six Drizzle tables + `mould_status` enum (migration `drizzle/0001_large_namor.sql`, additive); Zod schemas + tests (48 tests / 8 files green); server actions (create/update/archive per master, `advanceMouldStatus` for mould lifecycle, all auth-checked + `revalidatePath`); UI at `app/(dashboard)/{customers,suppliers,raw-materials,products,moulds,machines}` with Base UI shadcn tables + RHF form dialogs (`components/master-data/*-form-dialog.tsx`). Mould page shows lifecycle stepper + "Next Step" transition button. Validation: tsc, lint, tests, `next build` all green (2026-09-10). DB is not attached yet — migrations are additive and ready to apply on first deploy.

## Features / user stories

- As an admin, I can create and update customers with their own credit period, so invoices compute correct due dates per customer (DEC-018).
- As an admin, I can add suppliers with GSTIN and address, so purchase orders reference clean supplier records (Phase 04 dependency).
- As an admin, I can define raw materials with unit, HSN, current rate, and minimum stock, so procurement and inventory have a base (Phase 04/05 dependencies).
- As an admin, I can create products with their owning mould, so orders and BOMs attach to one consistent product record.
- As an operator, I can advance a mould through `Required → Ordered → Received → Trial → Active`, so the strict lifecycle is enforced from day one (DEC-015).
- As a manager, I can maintain the machine list, so every future production batch can be assigned exactly one machine (DEC-016).
- As any user, I only see archived records when explicitly searching, so active lists stay clean.

## Database changes

New Drizzle tables (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `customers` | `id`, `name` NOT NULL, `code` UNIQUE, `contact_phone`, `email`, `gstin`, `state` NOT NULL (default UP/09), `state_code`, `address`, `credit_period_days` NOT NULL (default 30, DEC-018), `notes`, `archived_at` | unique code, soft archive |
| `suppliers` | `id`, `name` NOT NULL, `code` UNIQUE, `contact_phone`, `email`, `gstin`, `address`, `notes`, `archived_at` | soft archive |
| `raw_materials` | `id`, `name` NOT NULL, `code` UNIQUE, `unit` NOT NULL, `hsn_code`, `current_rate` numeric >= 0, `gst_rate`, `min_stock_qty`, `notes`, `archived_at` | non-negative rate CHECK |
| `products` | `id`, `name` NOT NULL, `code` UNIQUE, `unit` NOT NULL, `mould_id` (nullable FK `moulds`), `hsn_code`, `gst_rate`, `selling_price`, `notes`, `archived_at` | unique code |
| `moulds` | `id`, `name` NOT NULL, `code` UNIQUE, `status` `mould_status` NOT NULL, `supplier_id` FK, `cost` numeric >= 0, `received_at`, `trial_at`, `active_at`, `notes`, `archived_at` | `mould_status` enum, non-negative cost CHECK |
| `machines` | `id`, `code` UNIQUE NOT NULL, `name` NOT NULL, `capacity` numeric, `notes`, `archived_at` | unique code |

Enum added: `mould_status` (`required`, `ordered`, `received`, `trial`, `active` — DEC-015). Soft archive is a nullable `archived_at` timestamp (no hard deletes). No destructive changes.

## Server actions / APIs

- `createCustomer` / `updateCustomer` / `archiveCustomer` — customer CRUD incl. `credit_period_days`.
- `createSupplier` / `updateSupplier` / `archiveSupplier` — supplier CRUD.
- `createRawMaterial` / `updateRawMaterial` / `archiveRawMaterial` — raw material CRUD incl. rate/HSN.
- `createProduct` / `updateProduct` / `archiveProduct` — product CRUD incl. mould link.
- `createMould` / `updateMould` / `archiveMould` / `advanceMouldStatus` — CRUD + lifecycle transition (DEC-015 domain function; `advanceMouldStatus` stamps `received_at`/`trial_at`/`active_at`).
- `createMachine` / `updateMachine` / `archiveMachine` — machine CRUD.
- All actions validate with Zod before write; reads go through `queries.ts` helpers.

## UI pages & components

- `app/(dashboard)/customers/` — list + create/edit form (credit period field), archive action.
- `app/(dashboard)/suppliers/` — list + create/edit form.
- `app/(dashboard)/raw-materials/` — list + form (unit, HSN, rate, min stock).
- `app/(dashboard)/products/` — list + form (mould selector, HSN, GST rate, price).
- `app/(dashboard)/moulds/` — list + form + lifecycle stepper (five statuses) + "Next Step" action.
- `app/(dashboard)/machines/` — list + form (capacity).
- Shared components: shadcn/Base UI table, `components/master-data/*-form-dialog.tsx` (RHF + Zod via `typedZodResolver`), `components/master-data/form-field.tsx`, status badge.

## Validation & business rules

- Zod schemas per master: required name/code/unit; numeric fields `>= 0`; GSTIN format when supplied; email format when supplied.
- Mould transitions only along DEC-015: `Required → Ordered → Received → Trial → Active`; backward/skip transitions rejected by `advanceMouldStatus` via the domain function (R07).
- Machine is a pure master here; its mandatory-per-batch rule (DEC-016/R08) is enforced at Phase 05 batch creation.
- Customer credit period defaults per DEC-018; value is snapshotted onto orders/invoices later (Phase 06).
- Archiving is soft (status/deleted-at), never hard delete, to keep history for orders/invoices.
- No invented rules: mould development billing, HSN/GST rate sources, and BOM behavior stay open until approved.

## Edge cases

- A customer with open invoices is archived → invoices must still render; archive only hides from active lists.
- A product whose mould is not yet Active cannot be batch-produced later — product creation itself is allowed (enforcement at batch time).
- Two masters with the same human name → unique business `code` prevents ambiguity.
- Empty/min-stock raw material (quantity 0) is valid to create; negative is rejected.
- GSTIN format differences (15-char alphanumeric) → accept only well-formed values when provided.
- Editing a mould already used by batches → lifecycle fields (`active_at`) append-only; core identifiers immutable.

## Tests

- Domain: mould lifecycle unit tests — every valid transition; every invalid/skip/backward transition rejected (R07 map in TESTING.md; `src/modules/moulds/domain.ts`).
- Zod: per-master schema fail cases (missing code, negative rate, bad GSTIN).
- Actions: create/update happy + Zod-failure paths (mocked DB).
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [x] Six masters CRUD-able through UI with server-side Zod validation.
- [x] Mould lifecycle enforces DEC-015 transitions; UI reflects current status.
- [x] Customers carry per-customer `credit_period_days` (default 30).
- [x] Machine master exists with unique codes (prepares DEC-016).
- [x] Unique business codes enforced across all masters.
- [x] Archive (soft via `archived_at`) prevents hard deletes that would break history.
- [x] Tests pass; lint + tsc green (48 tests / 8 files).

## Definition of done

- [x] Zod schema written and unit-tested (fail cases included).
- [x] domain.ts rule functions unit-tested (mould lifecycle).
- [x] DB migration added (additive): six masters + `mould_status` enum.
- [x] Server Actions validate + write (create/update/archive/advance).
- [x] UI pages/components render + wired (pending live DB run-through).
- [x] `npx tsc --noEmit` and `npm run lint` pass.
- [x] Docs updated (module docs for customers/suppliers/raw-materials/products/moulds/machines).