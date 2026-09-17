# Factora — Phase 08: Expenses & Reports

**Status:** `PROPOSED`

## Business purpose

Running the business means knowing where money comes from (receivables) and where it is spent (expenses), and seeing both at a glance. This phase adds manual expense recording with defined categories and delivers day-1 reports the owner actually needs — stock positions, pending orders, party outstanding, batch-wise costing, and production summaries — plus a dashboard of operational KPIs. The report/KPI list is itself pending approval (OQ-21, OQ-22, P-009; expense categories P-010).

## Scope

**In scope**

- Expense records: date, category, amount, note, optional receipt link.
- Expense categories seeded from an approved list (P-010; confirmed list pending approval).
- Reports (subset pending OQ-21): stock summary, pending orders, party outstanding, batch-wise costing, production summary, raw material consumption.
- Dashboard KPIs (subset pending OQ-22): low-stock alerts, open dispatch, receivables, recent production.
- Read-only reporting queries across existing modules — reports never write data.

**Out of scope**

- Automatic costing engine (DEC-010) — costing reports read manual `batch_costs`.
- Payroll/HR, fixed-asset accounting, and a general ledger (PRODUCT.md V1 exclusions).
- Real-time/multi-tenant analytics; heavy BI tooling.
- Any new inventory transaction types (DEC-020 closure).

## Current state

Nothing built yet. The dashboard shell renders with no KPI widgets; no `expenses` table, categories, report queries, or chart components exist.

## Features / user stories

- As an owner, I can record an expense on any day with a category and note, so non-production outflows are visible.
- As an owner, I can browse expenses by category and date range, so monthly spend is reviewable.
- As an owner, I can see a stock summary report (raw material balances + finished stock + low-stock flags), so shortages are visible before production stalls.
- As an owner, I can see pending orders and the open dispatch quantity, so I know what has to ship.
- As an owner, I can see party outstanding with age, so collections are prioritized (Phase 07 data).
- As an owner, I can see batch-wise costing, so profitable vs unprofitable jobs are identifiable (DEC-010 manual data).
- As an owner, I can open the dashboard and see low-stock alerts, open dispatch, receivables, and recent production at a glance (pending OQ-22 KPI list).

## Database changes

New Drizzle table (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `expenses` | `id`, `expense_date` NOT NULL, `category` NOT NULL (from approved category set), `amount` numeric NOT NULL (> 0), `note`, `receipt_attachment_id` FK nullable, `created_by` FK, `created_at` NOT NULL | amount > 0 CHECK; category CHECK/list |

Optionally an `expense_categories` small table or a TS constant keyed by P-010 approval (table is the safer choice if categories are user-editable — defer to approval). No other new tables: reports are queries over existing `raw_materials`, `inventory_ledger`, `production_batches`, `batch_costs`, `orders`, `invoices`, `payments`, `dispatch_notes`, `customers`, `products`.

## Server actions / APIs

- `createExpense` / `updateExpense` / `archiveExpense` — expense CRUD with validated category + positive amount.
- `reportStockSummary` — balances incl. low-stock flags (min_stock_qty vs balance).
- `reportPendingOrders` — open orders with remaining dispatch quantities.
- `reportPartyOutstanding` — aggregated receivables with age buckets (reuses Phase 07 reads).
- `reportBatchCosting` — per batch: costs + ok_qty + unit cost (summary of `batch_costs`).
- `reportProductionSummary` — qty produced per product/machine/time range.
- `dashboardKpis` — low-stock count, open dispatch, receivables total, recent batches.
- All read-only (no writes except expense CRUD).

## UI pages & components

- `app/(dashboard)/expenses/` — list + create/edit form (date, category select, amount, note), range filter.
- `app/(dashboard)/reports/` — report router page linking the approved reports (`OQ-21` list).
- Report pages: `stock-summary`, `pending-orders`, `party-outstanding`, `batch-costing`, `production-summary`.
- Dashboard page (`/dashboard` currently a shell) — KPI cards + charts (Recharts proposed) per OQ-22.
- Shared: data table (exists), KPI card, chart component (add Recharts — noted PROPOSED in ARCHITECTURE.md).

## Validation & business rules

- Zod: positive `amount`, required `expense_date`, category within the approved set, optional bounded note.
- Reports derive data exclusively from the ledger/batch/cost tables — no business rules embedded in components (ARCHITECTURE.md).
- Reminder: costing remains manual (DEC-010) — `batch_costs.total` is the source, never auto-computed.
- Low-stock uses `raw_materials.min_stock_qty` vs current ledger balance (Phase 03/04 data).
- No new inventory movement types (DEC-020) and no signature-changing rules introduced by a reporting phase.

## Edge cases

- Expense with a future date → warn (allow only within a tolerance).
- Category renamed or added after invoices exist → keep the set additive; archived categories retain history.
- Stock report showing zero raw material for an unused master → show placeholder balance, not an error.
- Aging buckets with zero payments → still display "unpaid" with days since due date.
- Chart with no data in range → empty-state message instead of a blank component.
- Report underlying structure renamed later → keep report queries in one module to limit breakage.

## Tests

- Domain: aggregation helper math (sums, averages, aging buckets on fixture data).
- Zod: expense schema fail cases (negative amount, unknown category).
- Actions (mock DB): `createExpense` writes correctly; report queries return fixture-shaped rows for stock/pending/outstanding/costing.
- Dashboard KPI selector returns sane zeros for empty data.
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] Expense records are CRUD-able with an approved category set (post P-010).
- [ ] Approved day-1 reports render correct data from existing modules (post OQ-21).
- [ ] Dashboard shows the approved KPI set (post OQ-22) rather than an empty shell.
- [ ] Reports are read-only; expenses are the only new write path.
- [ ] Costing reports read manual `batch_costs` (DEC-010 respected).
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 03-07 modules for report data (masters, inventory, batches/costs, invoices, payments, dispatch).
- Approval of P-009/P-010 and answers to OQ-21/OQ-22 before building the final report/KPI/category lists.

## Risks

- Building reports before the KPI list (OQ-21/OQ-22) is approved risks building the wrong widgets — confirm lists first.
- Expense categories chosen ad hoc (P-010) get locked into seed data — settle the set early.
- Report speed over serverless at larger data volumes — keep queries narrow (time-range filtered); refactor only if measured slow.
- Recharts (proposed) adds a dependency not yet approved — confirm with the stack decision.

## Questions requiring approval

- OQ-21 — which reports does the owner want day-1 (stock, pending orders, party outstanding, batch-wise costing, production summary)? (P-009)
- OQ-22 — dashboard KPIs list (low-stock alerts, open dispatch, receivables) — confirm. (P-009)
- P-010 — expenses category list (seed data).
- ARCHITECTURE.md note: Recharts is PROPOSED — confirm before chart components ship.

## Definition of done

- [ ] Zod schema written and unit-tested (fail cases included).
- [ ] domain.ts rule functions unit-tested (aggregation/aging math).
- [ ] DB migration added (additive): `expenses` table (+ category seed if approved).
- [ ] Server Actions validate + write (expense CRUD) + read-only report queries.
- [ ] UI pages/components render + wired (expenses, reports, dashboard KPIs).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (expenses/reports/dashboard module docs).