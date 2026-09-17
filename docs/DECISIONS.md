# Factora — Decision Log

**Purpose:** Binding record of the user's decisions. Anything in this file marked `APPROVED` is agreed; `PROPOSED` entries are suggestions awaiting the user; `DEPRECATED` entries are superseded.

## Decision Format

Each entry has: **ID**, **Date**, **Decision**, **Status**, **Rationale**, **Impact** (what it unlocks/affects), **Reversal** (how to undo if a later decision changes it).

## Index

| ID | Topic | Status |
| --- | --- | --- |
| DEC-001 | Product/brand name — Factora | APPROVED |
| DEC-002 | Technology stack (Next.js + TS + Tailwind + shadcn/ui) | APPROVED |
| DEC-003 | Database — PostgreSQL (Neon) + Drizzle ORM | APPROVED |
| DEC-004 | File storage — local filesystem V1 | APPROVED |
| DEC-005 | Deployment — Vercel | APPROVED |
| DEC-006 | PDF generation — @react-pdf/renderer | APPROVED |
| DEC-007 | Testing — Vitest | APPROVED |
| DEC-008 | Authentication — Auth.js v5 Credentials | APPROVED |
| DEC-009 | Business state — Uttar Pradesh (GST code 09) | APPROVED |
| DEC-010 | Costing — manual per batch | APPROVED |
| DEC-011 | Rejected material — absorbed/lost | APPROVED |
| DEC-012 | Overpayment — blocked | APPROVED |
| DEC-013 | Dispatch — partial supported | APPROVED |
| DEC-014 | Invoice numbering — sequential INV-### | APPROVED |
| DEC-015 | Mould workflow — Required→Ordered→Received→Trial→Active | APPROVED |
| DEC-016 | Machine tracking — mandatory per batch | APPROVED |
| DEC-017 | Production for stock — allowed | APPROVED |
| DEC-018 | Credit period — configurable per customer | APPROVED |
| DEC-019 | Payment gateway — none in V1 (tracked only) | APPROVED |
| DEC-020 | Inventory movement types — approved allowed set | APPROVED |
| DEC-021 | Purchase receipts require a confirmed PO | APPROVED |
| DEC-022 | Receipt bill information optional | APPROVED |
| DEC-023 | Batch plan qty manual/prefilled + order linking (OQ-11/12) | APPROVED |
| DEC-024 | Batch wastage+unused material handling; `PRODUCTION_RETURN` added (OQ-08/09) | APPROVED |
| DEC-025 | Manual batch costing — 5 fields = total (OQ-14) | APPROVED |

---

## DEC-001 — Product/Brand Name
- **Date:** 2026-09-10
- **Decision:** Product is named **Factora** (package id `factora`). Production domain for URLs is **factoraa.com** (note the extra "a" only in the domain, not the product name).
- **Status:** APPROVED
- **Rationale:** A distinct product identity separate from the project's prior nickname "MfgERP".
- **Impact:** All branding, metadata, seed admin email placeholder use Factora.
- **Reversal:** User must approve any future product-name change.

## DEC-002 — Technology Stack (Core)
- **Date:** 2026-09-09
- **Decision:** Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui (Base UI variant) + Zod + React Hook Form.
- **Status:** APPROVED
- **Rationale:** Fast iteration, component reusability, Vercel-friendly, TS safety.
- **Impact:** Foundation of all implementation.
- **Reversal:** Formal ADR required; very costly post-Phase-1.

## DEC-003 — Database & ORM
- **Date:** 2026-09-09
- **Decision:** PostgreSQL on **Neon** (serverless); **Drizzle ORM** + postgres-js.
- **Status:** APPROVED
- **Rationale:** Serverless-friendly, typed schema from TS, cheap at small scale.
- **Impact:** Schema defined in `src/modules/<module>/schema.ts`.
- **Reversal:** Switching ORM/DB is additive-risk high; document first.

## DEC-004 — File Storage
- **Date:** 2026-09-09
- **Decision:** Documents stored on **local filesystem** for V1 (dev), abstracted behind a storage backend that can be swapped for S3/R2 on production.
- **Status:** APPROVED
- **Rationale:** Simplicity in development; no vendor lock for dev/trial.
- **Impact:** See [FILE-STORAGE.md](./FILE-STORAGE.md) — production must use object storage (ephemeral serverless FS).
- **Reversal:** Swap `StorageBackend`; additive.

## DEC-005 — Deployment Target
- **Date:** 2026-09-09
- **Decision:** Deploy on **Vercel** (single Next.js serverless app) with Neon DB.
- **Status:** APPROVED
- **Rationale:** Zero-ops, previews on PRs, native Next 16 support.
- **Impact:** No Docker/K8s; serverless-friendly code only.
- **Reversal:** Repackage to a VPS only if platform limits are hit.

## DEC-006 — PDF Generation
- **Date:** 2026-09-09
- **Decision:** Use **@react-pdf/renderer** for GST invoice PDFs.
- **Status:** APPROVED
- **Rationale:** React-compatible templates, deterministic output, same-layout reuse.
- **Impact:** Invoice PDFs rendered in-process; can be stored via storage backend.
- **Reversal:** Swap renderer if PDF compliance issues arise; low risk.

## DEC-007 — Testing Framework
- **Date:** 2026-09-09
- **Decision:** **Vitest** + jsdom for unit/component tests.
- **Status:** APPROVED
- **Rationale:** Fast, TS-native, consistent with Vite-driven tooling.
- **Impact:** See [TESTING.md](./TESTING.md).
- **Reversal:** Add Playwright later for E2E; no reversal needed.

## DEC-008 — Authentication
- **Date:** 2026-09-09
- **Decision:** **Auth.js v5 (NextAuth) with Credentials provider** (email + password, bcrypt).
- **Status:** APPROVED
- **Rationale:** Covers credentials for a single-tenant product; extensible.
- **Impact:** `src/lib/auth.ts`, `src/proxy.ts`; `user_role` enum in DB.
- **Reversal:** Layer OAuth/SSO later without removing credentials.

## DEC-009 — First Customer Business Location & GST
- **Date:** 2026-09-09
- **Decision:** Business in **Uttar Pradesh**, GST state code **09**. Invoice tax behavior for intra-state (CGST+SGST) / inter-state (IGST) derives from this.
- **Status:** APPROVED
- **Rationale:** First customer's registered location.
- **Impact:** Tax splits, addresses, rates on invoices.
- **Reversal:** Only per customer registration change (multi-state handled later).

## DEC-010 — Product Costing
- **Date:** 2026-09-09
- **Decision:** Costing is **manually entered per batch** (no automatic costing engine in V1).
- **Status:** APPROVED
- **Rationale:** Client's costing data is work-department based; manual entry is safest and transparent.
- **Impact:** Batch has a `batch_costs` record; no costing formula tables.
- **Reversal:** A later costing engine would add formulas on top of existing manual input (additive).

## DEC-011 — Rejected (Scrap) Material Handling
- **Date:** 2026-09-09
- **Decision:** Rejected/defective material is treated as **absorbed/lost** — the production loss is a cost of the batch, **not** re-added to inventory automatically.
- **Status:** APPROVED
- **Rationale:** Matches the client's plant-floor reality (scrap is not returned).
- **Impact:** Rejects flow into batch quality/cost; no auto stock-in.
- **Reversal:** A future reclaim flow would be an additional inventory transaction type (blocked until user approves).

## DEC-012 — Overpayment Handling
- **Date:** 2026-09-09
- **Decision:** **Block overpayments.** A recorded payment may not exceed the outstanding balance on an invoice.
- **Status:** APPROVED
- **Rationale:** Avoids negative balances; clear books.
- **Impact:** `payments/domain.ts` enforces it; UI hides/shows warnings.
- **Reversal:** Allow-credit decision documented separately.

## DEC-013 — Dispatch Behavior
- **Date:** 2026-09-09
- **Decision:** **Partial dispatch supported.** An order/invoice can be dispatched across multiple shipments/dates.
- **Status:** APPROVED
- **Rationale:** Real dispatch rarely ships one full invoice in one go.
- **Impact:** Dispatch records link to order/invoice with partial quantities; running totals everywhere.
- **Reversal:** Restricting to full-ship-only would be a simplification (docs update required).

## DEC-014 — Invoice Numbering Scheme
- **Date:** 2026-09-09
- **Decision:** **Sequential invoice numbers**: `INV-001`, `INV-002`, … generated without gaps/duplicates at issue time (transactionally).
- **Status:** APPROVED
- **Rationale:** Standard Indian invoice expectation; simple + auditable.
- **Impact:** Unique constraint + issuance transaction.
- **Reversal:** Per-period (financial-year) numbering would extend the same generator.

## DEC-015 — Mould Lifecycle
- **Date:** 2026-09-09
- **Decision:** Mould statuses flow strictly: **Required → Ordered → Received → Trial → Active**. A batch runs only on an `Active` mould.
- **Status:** APPROVED
- **Rationale:** Reflects how the client acquires and qualifies moulds.
- **Impact:** Domain function `transitMould` governs transitions; blocked transitions return errors.
- **Reversal:** Add sub-states only if client adds engineering steps.

## DEC-016 — Machine Tracking
- **Date:** 2026-09-09
- **Decision:** **Every production batch is assigned exactly one machine** (mandatory), recorded and displayed.
- **Status:** APPROVED
- **Rationale:** Machine is a required axis of production traceability.
- **Impact:** `production_batches.machine_id` NOT NULL; machine master needed early.
- **Reversal:** Multi-machine batches would need a junction table (later).

## DEC-017 — Production for Stock
- **Date:** 2026-09-09
- **Decision:** Production batches may be created **without a linked customer order** (produce-for-stock).
- **Status:** APPROVED
- **Rationale:** Client may build ahead of demand.
- **Impact:** `production_batches.order_id` is nullable.
- **Reversal:** Requiring an order for all batches is a narrow policy flip.

## DEC-018 — Customer Credit Period
- **Date:** 2026-09-09
- **Decision:** **Credit period is configurable per customer** (days); default remains, snapshot onto order/invoice.
- **Status:** APPROVED
- **Rationale:** Different customers get different payment terms.
- **Impact:** `customers.credit_period_days`; invoices compute due date.
- **Reversal:** Global-only credit terms would ignore per-customer value.

## DEC-019 — Payment Gateway
- **Date:** 2026-09-09
- **Decision:** **No payment gateway in V1.** Payments are recorded/tracked by the operator (cash/UPI/bank), not processed in-app.
- **Status:** APPROVED
- **Rationale:** First customer pays via normal banking; no online collections needed.
- **Impact:** `payments` table only; no PCI concerns.
- **Reversal:** Add Razorpay/etc. later behind a provider abstraction.

## DEC-021 — Purchase Receipts Require a Confirmed PO
- **Date:** 2026-09-11
- **Decision:** A purchase receipt may only be recorded against a **confirmed or received** purchase order; on full receipt the PO auto-transitions to `closed`, otherwise to `received`.
- **Status:** APPROVED
- **Rationale:** Receipts must always trace to a supplier order; keeps the procurement loop auditable.
- **Impact:** Receipt-entry UI only lists confirmed/received POs with outstanding quantity.
- **Reversal:** Allowing PO-less receipts (OQ-06) would relax this; requires a new DEC.

## DEC-022 — Receipt Bill Information Optional
- **Date:** 2026-09-11
- **Decision:** Supplier bill number and bill date on a purchase receipt are **optional** fields. GST credit matching against supplier bills is deferred (OQ-07/P-005).
- **Status:** APPROVED
- **Rationale:** The first customer does not always have a bill ready at goods-in; the PO + receipt pair is the primary record.
- **Impact:** `purchase_receipts.bill_no` / `bill_date` nullable; UI marks them optional.
- **Reversal:** Making bills mandatory would flip `ACCEPTED`-style; additive per P-005.

## DEC-023 — Production Batch Plan & Order Linking
- **Date:** 2026-09-11
- **Decision:** `plan_qty` on a production batch is **manually entered**, prefilled from the linked order's remaining quantity when one is selected (OQ-11). A batch carries zero-or-one `order_id`; one order may be fulfilled across **many batches** (OQ-12). Batch lifecycle statuses: `in_progress` → `completed` | `cancelled`. Order linking is wired as a nullable column now; the orders module and its picker arrive in a later phase.
- **Status:** APPROVED
- **Rationale:** Supervisors enter what the floor will run; order data (once built) improves defaults without blocking for-stock batches (DEC-017).
- **Impact:** `production_batches.plan_qty` NOT NULL (> 0), `order_id` nullable text (FK + picker pending Orders phase).
- **Reversal:** Changing the plan-qty driver or moving to a `batch→order_items` junction is a new DEC.

## DEC-024 — Batch Wastage & Unused Material Handling
- **Date:** 2026-09-11
- **Decision:** (OQ-08) Wastage/extra consumption beyond the BOM is **folded into actual consumption** — batch completion records the real `consumed_qty` per material; the plan-vs-actual difference is absorbed into batch cost (DEC-011). (OQ-09) Reserved-but-unused material **auto-returns to stock**: reservation is bookkeeping only (no ledger movement at start, per R12/DEC-020), so unused material is simply not consumed at completion and remains available; the leftover is marked `returned_at` on `batch_materials`. `PRODUCTION_RETURN` is **added to the approved ledger type set** (extends DEC-020) for genuine in-kind returns/reclaim and is accepted by the enum, but batch flows do not post it in V1 because reservations never deduct stock — posting a return there would double-credit inventory.
- **Status:** APPROVED
- **Rationale:** Matches plant-floor reality (scrap absorbed, nothing stranded, no double-counted inventory).
- **Impact:** `inventory_transaction_type` enum gains `PRODUCTION_RETURN` (additive); `batch_materials` gains `returned_at`.
- **Reversal:** A physical hold/reservation ledger model (or reclaim after consumption) is a new DEC.

## DEC-025 — Manual Batch Costing Fields
- **Date:** 2026-09-11
- **Decision:** Per DEC-010, each batch carries one manual `batch_costs` row with **material, labour, electricity, mould allocation, other** = `total`; all fields non-negative, `total` recomputed as the component sum (OQ-14).
- **Status:** APPROVED
- **Rationale:** DEC-010 chose manual costing; the five fields match the plant's spend categories.
- **Impact:** `batch_costs` table; UI cost form recomputes total live; no automatic costing engine.
- **Reversal:** Changing the field set is a new DEC once plant data confirms a better breakdown.

## DEC-020 — Inventory Movement Types (Allowed Set)
- **Date:** 2026-09-09
- **Decision:** V1 inventory ledger allowed types: `PURCHASE_RECEIPT`, `PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT`, `DISPATCH`, `ADJUSTMENT`. (`PRODUCTION_RETURN` reserved pending user decision.)
- **Status:** APPROVED
- **Rationale:** Covers procurement, production, dispatch, correction with the approved business rules.
- **Impact:** Ledger enum; everything outside this list is out of scope.
- **Reversal:** New types (reclaim, write-off, return to supplier) require user approval ⇒ new DEC entry.

---

## Phase 3 Build Status (Master Data)
- **Date:** 2026-09-10
- **Status:** IN_PROGRESS — code-complete.
- **Built:** six masters (customers, suppliers, raw-materials, products, moulds, machines) as Drizzle tables + additive migration `0001_large_namor.sql`; Zod input schemas + unit tests; server actions (create/update/archive per master + `advanceMouldStatus` for the DEC-015 lifecycle); UI routes under `app/(dashboard)/` with Base UI shadcn tables and RHF+Zod form dialogs.
- **Verified:** 48 tests pass; `npx tsc --noEmit`, `npm run lint`, `next build` green.
- **Open:** live DB smoke-test on attach; mould-development billing to customers still open (OQ-17); HSN/GST seed source (OQ-19).

## Phase 4 Build Status (Procurement & BOM)
- **Date:** 2026-09-11
- **Status:** IN_PROGRESS — code-complete.
- **Built:** BOM definitions (`bom_items`); procurement loop (`purchase_orders`, `purchase_order_items`, `purchase_receipts`, `purchase_order_status` enum); inventory ledger (`inventory_ledger`, DEC-020 types, `inventory_transaction_type` enum) — additive migration `0002_last_zemo.sql`. Zip same-logic in `applyLedgerMovement` (R11 says balance can never go negative; qty signed), race-safe via `pg_advisory_xact_lock`.
- **Server actions:** `createBomItem`/`updateBomItem`/`deleteBomItem`, `createPurchaseOrder`/`confirmPurchaseOrder`/`recordPurchaseReceipt` (transactional + ledger), `adjustStock` (requires note). Read queries: PO list/detail, `listConfirmedOrdersWithItems`, receipts list, `getStockBalances`, `getLedgerHistory`.
- **UI:** `/bom` editor (product Select + line rows), `/procurement/purchase-orders` (list, `/new` RHF form, `[id]` detail with confirm + outstanding), `/procurement/receipts` (list + `/new` with PO selector and outstanding lines), `/inventory/raw-materials` (stock table + low badge + Adjust dialog) and `[id]` ledger history.
- **Verified:** 76 tests pass (12 files); `npx tsc --noEmit`, `npm run lint`, `next build` green.
- **Open:** supplier-bill matching deferred (OQ-07/P-005), rate valuation engine deferred (OQ-10), stock-adjustment authorization level deferred (P-007), live DB smoke-test on attach.

## Phase 5 Build Status (Frontend UI/UX Revamp)
- **Date:** 2026-09-11
- **Status:** IN_PROGRESS — frontend-only revamp complete; no schema/business-logic/API-contract changes.
- **Built:** App shell (sticky header with breadcrumb + ⌘K command palette + collapsible sidebar; dead links to `/orders`, `/production`, `/dispatch`, `/invoices`, `/payments`, `/reports` removed). Real-data dashboard (attention items, inventory health, recent receipts, master-data counts, four MetricCards). Shared patterns (PageHeader, MetricCard, StatusBadge with dot/icon+label and status maps in `src/components/status/definitions.ts`, DataTable with search/filter/sort/pagination/loading/empty states, EmptyState, ConfirmDialog). All master-data, BOM, procurement (PO list/new/detail, receipts list/new) and inventory (stock table, ledger history) pages rebuilt on those patterns; PO `/new` now honours `?material=` prefill from the dashboard low-stock action. Login/error/not-found/global-error pages restyled. Dark tokens defined in `globals.css`, light mode only (per instruction).
- **Verified:** 76 tests pass (12 files); `npx tsc --noEmit`, `npm run lint`, `next build` green.
- **Open:** dashboard KPI set + charting remain PROPOSED (OQ-22/P-009); live DB smoke-test on attach.

## Proposed / Awaiting Approval

These are **not** decisions; they are candidates for the user to approve or reject.

| ID | Proposal | Needs approval for |
| --- | --- | --- |
| P-001 | Invoice shows CGST + SGST split for intra-state (UP), IGST for inter-state | GST rate handling on invoice line items |
| P-002 | Order status flow: Open → In Production → (Partial) Dispatched → Invoiced/Closed | Order lifecycle UI + notifications |
| P-003 | ~~Reserved-but-unused material policy on batch completion~~ — **superseded by DEC-024 (auto-return)** | Inventory adjustment behavior |
| P-004 | ~~Wastage/extra-consumption allocation per batch~~ — **superseded by DEC-024 (fold into actual consumption)** | Cost/tolerance rules |
| P-005 | Purchase receipts to carry rate/GST; supplier bill matching | Procurement module design |
| P-006 | Invoice cancellation / credit note policy | Invoicing module design |
| P-007 | Stock adjustment authorization level (admin 2-step) | Safety controls |
| P-008 | In-process QC hold/release decision workflow | Quality module design |
| P-009 | Reports set & dashboard KPI list | Reports/dashboard phase |
| P-010 | Expenses category list | Expenses module seed data |
| P-011 | Packing-list record for physical dispatch | Packing module scope |
| P-012 | Permissions matrix (admin/manager/user) | AuthZ implementation |