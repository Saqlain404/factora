# Factora — Production

**Status:** PROPOSED

## Purpose

The production module manages production batches: what is made, on which machine and mould, from which materials, and what was produced vs rejected. It implements reservation at batch start, consumption at completion, reject absorption, and the option to produce for stock without a customer order.

## Responsibilities

- Create and run production batches (batch_no, product, machine, mould, order link).
- Reserve planned BOM material at batch start; consume actual usage at completion (DEC-020 / R12).
- Apply reject absorption: rejected output is a cost of the batch, not re-added to inventory (DEC-011).
- Enforce one machine per batch (DEC-016) and only `Active` moulds (DEC-015).
- Allow batches with no linked order (produce-for-stock, DEC-017).

## Entities (planned tables)

- `production_batches` — id, batch_no, order_id (nullable → for-stock), product_id, machine_id, mould_id, plan_qty, ok_qty, rejected_qty, status, started_at, completed_at, user_id.
- `batch_materials` — id, batch_id, raw_material_id, planned_qty, reserved_at, consumed_qty, consumed_at.
- Batch status enum: `in_progress`, `completed`, `cancelled` (finalize with user).

## Related workflows

- `../workflows/produce-batch.md`
- `../workflows/reserve-and-consume.md`

## Inputs

- Product, BOM, machine, mould and optional order data.
- Plan quantity and material reservation at start.
- Actual `ok_qty` / `rejected_qty` and consumption at completion.

## Outputs

- Batch records and material consumption ledger entries (`PRODUCTION_CONSUMPTION`).
- Finished-product stock input via `PRODUCTION_OUTPUT` (finished-goods module).
- Cost basis for the costing module (`batch_costs`).

## Validation rules

- `batch_no` unique, required.
- `machine_id` required (mandatory, DEC-016).
- `mould_id` required and mould status must be `active` (DEC-015).
- `order_id` optional (for-stock allowed, DEC-017); when present must reference an existing order.
- `plan_qty`, `ok_qty`, `rejected_qty` integers >= 0.
- Reservation happens at batch start; consumption at completion posts `PRODUCTION_CONSUMPTION`.
- Completion cannot post consumption that would make stock negative (DEC-020).
- Batch transitions (start → complete/cancel) validated by domain functions.

## Approved business rules

- **DEC-011** (APPROVED) — Rejected material is absorbed/lost; cost goes to the batch, nothing is re-added to inventory.
- **DEC-015** (APPROVED) — Batches run only on `Active` moulds.
- **DEC-016** (APPROVED) — Exactly one machine per batch.
- **DEC-017** (APPROVED) — Production for stock allowed (nullable `order_id`).
- **DEC-020** (APPROVED) — Reserved at start, consumed at completion, via approved ledger types; negative stock forbidden.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-08 — wastage beyond BOM per batch.
- `../OPEN-QUESTIONS.md` OQ-09 — reserved-but-unused material at completion.
- `../OPEN-QUESTIONS.md` OQ-11 — what drives planned qty (order, capacity, manual).
- `../OPEN-QUESTIONS.md` OQ-12 — order-to-batch and batch-to-order splitting.
- `../OPEN-QUESTIONS.md` OQ-13 — in-process QC hold/release gating.
- `../DECISIONS.md` P-003 / P-004 (PROPOSED) — unused reservation and wastage allocation.

## Future extensions (PROPOSED)

- QC-linked completion (hold/release) once OQ-13 is decided.
- Reclaim flow for unused material (`PRODUCTION_RETURN`) after approval.
- Machine-wise production calendar and scheduling (no MRP in V1).

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs