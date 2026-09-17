# Factora — Phase 05: Production Batches

**Status:** `PROPOSED`

## Business purpose

Production is the heart of the platform. A batch takes a product, a BOM, exactly one operating machine, and an **Active** mould, reserves the planned raw material at start, and consumes actual material at completion. Output enters finished stock, rejected material is absorbed as a cost of the batch (DEC-011), batches may run for stock (DEC-017), and every batch carries manual costing (DEC-010). This is where the plant floor talks to the books.

## Scope

**In scope**

- Production batch creation: product, one machine (DEC-016), one Active mould (DEC-015), optional order link (DEC-017), plan quantity.
- Reserve-at-start / consume-at-completion (R12): `PRODUCTION_CONSUMPTION` and `PRODUCTION_OUTPUT` ledger entries (DEC-020).
- Batch completion: `ok_qty`, `rejected_qty`, actual consumption, finished-goods output.
- Rejected material absorbed/lost (DEC-011) — reported on the batch, never auto re-stocked.
- Manual per-batch costing (DEC-010): material/labour/electricity/mould allocation/other on `batch_costs`.
- Batch status lifecycle (in_progress / completed / cancelled) and on-screen machine/mould traceability.

**Out of scope**

- Automatic costing engine (DEC-010 explicitly kills it).
- Reclaim or return of unused/rejected material (`PRODUCTION_RETURN` reserved pending user decision, DEC-020).
- Production planning/scheduling (MRP/APS) — order-aware tracking only.
- In-process QC gating (BLOCKED — OQ-13).
- Rate-valuation engine (OQ-10) — costing stays manual.

## Current state

Nothing built yet. Prerequisites from earlier phases: BOM (`bom_items`), raw material + finished product masters, `inventory_ledger` with the approved type enum, machines, moulds with lifecycle. None of the production tables/actions exist.

## Features / user stories

- As a production supervisor, I can create a batch for a product on one machine and one Active mould, so every batch is traceable (DEC-015, DEC-016).
- As a supervisor, I can start a batch to reserve planned raw material, so availability is committed but physical stock is untouched (R12).
- As a supervisor, I can record a batch without a customer order, so we can build for stock (DEC-017).
- As a supervisor, I can complete a batch with `ok_qty`, consumed material, and rejects, so finished stock increases and raw material decreases accurately.
- As a production operator, I see the rejected quantity counted into the batch cost, so scrap stays priced into the job and is not auto-returned (DEC-011).
- As a supervisor, I can enter the batch costs manually (material/labour/electricity/mould/other), so the batch has a full cost summary (DEC-010).
- As a manager, I can view batch history per machine and per mould, so plant-floor traceability is continuous.

## Database changes

New Drizzle tables (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `production_batches` | `id`, `batch_no` UNIQUE NOT NULL, `order_id` FK nullable (for-stock, DEC-017), `product_id` FK NOT NULL, `machine_id` FK NOT NULL (DEC-016), `mould_id` FK NOT NULL, `plan_qty` NOT NULL (> 0), `ok_qty` (>= 0), `rejected_qty` (>= 0), `status` `batch_status` NOT NULL (in_progress/completed/cancelled), `started_at`, `completed_at` | machine NOT NULL; qty CHECKs; batch no unique |
| `batch_materials` | `id`, `batch_id` FK NOT NULL, `raw_material_id` FK NOT NULL, `planned_qty` NOT NULL (> 0), `reserved_at`, `consumed_qty`, `consumed_at` | planned > 0 CHECK |
| `batch_costs` | `id`, `batch_id` FK UNIQUE NOT NULL, `material_cost`, `labour_cost`, `electricity_cost`, `mould_alloc`, `other`, `total` NOT NULL, `entered_by` FK, `entered_at` | total = component sum (DEC-010); non-negative CHECKs |

Ledger usage in this phase (DEC-020): `PRODUCTION_CONSUMPTION` (− raw material, at completion with actual `consumed_qty`), `PRODUCTION_OUTPUT` (+ finished product for `ok_qty`). `PRODUCTION_RETURN` stays unused until approved. Enum `batch_status` added. No destructive changes.

## Server actions / APIs

- `createBatch` — creates batch with plan, validates machine + Active mould + BOM availability.
- `startBatch` — reserves planned material per BOM (writes `batch_materials` reservations; no ledger movement yet).
- `completeBatch` — consumes actual material, writes `PRODUCTION_CONSUMPTION` + `PRODUCTION_OUTPUT`, records `ok_qty`/`rejected_qty`, stores manual costs; all in one transaction.
- `cancelBatch` — closes a not-started/not-completed batch (reservation released without a ledger change).
- `recordBatchCosts` — manual costing entry (DEC-010); recomputes total.
- `getBatch` / `listBatches` — queries incl. machine/mould/product joins.

## UI pages & components

- `app/(dashboard)/production/batches/` — batch list with machine/mould/qty/status columns.
- `app/(dashboard)/production/batches/new` — create form (product, order optional, machine, mould, plan qty).
- Batch detail page: start-button (reserve), completion form (ok/rejected qty + actual consumption + costs), cancel action.
- `batch-costs` inline form on batch detail (manual costing, DEC-010).
- Status badges for the batch lifecycle; per-batch material reservation/consumption readout.

## Validation & business rules

- Zod: positive `plan_qty`; non-negative `ok_qty`/`rejected_qty`; costs >= 0 and `total` = sum (DEC-010 / R02).
- Mould must be `active` before any batch runs (DEC-015 / R07 domain test).
- Exactly one machine per batch, mandatory (DEC-016 / R08).
- Batch may have `order_id` NULL (DEC-017 / R09).
- Rejects: absorbed/lost — no auto stock-in; counted into batch cost (DEC-011 / R03).
- Reserve at start, consume actual at completion (DEC-020 / R12); planned-vs-consumed difference handled per OQ-08/OQ-09 (P-003, P-004).
- Negative stock never possible after consumption (R11).
- Finishing `ok_qty` moves into finished stock via `PRODUCTION_OUTPUT` (DEC-020).

## Edge cases

- Completing a batch whose consumption would drive a raw material negative → blocked (R11); supervisor must record a purchase first.
- Reserved-but-unused material on completion → currently stays as a pending decision (OQ-09 / P-003); no auto-return until approved.
- Extra consumption beyond BOM (wastage) → recorded how? Fold into absorbed reject per OQ-08 (P-004).
- Batch cancelled after reservation → reservation voided, no ledger movement; unused reservation must not strand stock.
- One order spans multiple batches, or one batch spans multiple orders → pending OQ-12 (batch links `order_id` singular for now).
- Completion entered twice → idempotency guard (status transition only from in_progress).

## Tests

- Domain: mould-not-active blocks batch creation (R07); one-machine enforced (R08); for-stock allowed (R09); reserve-then-consume math (R12); reject absorbed and not re-added (R03); manual cost total = sum (R02).
- Zod: batch/batch-material/cost schemas fail cases.
- Actions (mock DB): `completeBatch` warms transaction, writes two ledger rows + costs; negative-stock consumption rejected.
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] Batch creation requires one machine and a mould in `active` status.
- [ ] `startBatch` reserves planned BOM material; stock balance unchanged.
- [ ] `completeBatch` consumes actual material and books `ok_qty` output as `PRODUCTION_OUTPUT`.
- [ ] Rejected qty is shown and absorbed into batch cost, never auto re-stocked (DEC-011).
- [ ] Batch without an order allowed (for-stock, DEC-017).
- [ ] Manual cost entry with recomputed total on `batch_costs` (DEC-010).
- [ ] No batch can push any ledger balance below zero (R11).
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 03 masters (products, machines, moulds Active lifecycle, raw materials).
- Phase 04 BOM + `inventory_ledger` + ledger enum.
- Answers to OQ-08/OQ-09/OQ-11/OQ-12/OQ-14 to finalize consumption/costing behavior.

## Risks

- The planned-vs-consumed difference policy (OQ-08/OQ-09) is the main correctness risk — shipping a default silently would violate "no invented rules".
- Rejects absorbed means real scrap losses hit cost visibility; if the client later wants reclaim, it is a new DEC (DEC-011 reversal path).
- Costing fields depend on plant data (OQ-14) — wrong fields mean rework in `batch_costs`.
- Multi-order batch linking (OQ-12) may force a `batch → order_items` join later instead of a single `order_id`.

## Questions requiring approval

- OQ-08 — wastage/extra consumption recording (P-004).
- OQ-09 — reserved-but-unused return policy (P-003).
- OQ-11 — what drives `plan_qty` on a batch (order qty, machine capacity, manual).
- OQ-12 — order ↔ batch multiplicity.
- OQ-14 — which costing fields exist on the plant floor.
- P-003, P-004, P-008 (QC hold interplay) — as applicable.

## Definition of done

- [ ] Zod schema written and unit-tested (fail cases included).
- [ ] domain.ts rule functions unit-tested (mould-active gate, one-machine, reserve/consume, reject absorb, cost total).
- [ ] DB migration added (additive): `production_batches`, `batch_materials`, `batch_costs`, `batch_status` enum.
- [ ] Server Actions validate + write (create/start/complete/cancel, record costs).
- [ ] UI pages/components render + wired (batch list, batch form, start/complete flow, cost entry).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (production module, workflow doc).