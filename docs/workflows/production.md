# Factora — Workflow: Production

**Status:** `PROPOSED`

## Purpose

Run a batch from plan to finished goods: create the batch (one machine — DEC-016, Active mould only — DEC-015, optional order — DEC-017), reserve planned raw material at start (R12), run the machine, and on completion record good/rejected output, consume actual material, post finished-goods output, and capture manual costing (DEC-010). Reserved-but-unused material (OQ-09) and wastage policy (OQ-08) remain open.

## Trigger

An approved, confirmed order line needs manufacture, or management decides to produce for stock (DEC-017).

## Actors

- Production supervisor — creates and completes the batch, records output counts.
- Operator — executes the run, reports counts.
- Storekeeper — supports material handoff/reservation.
- System — reserves, consumes, and posts ledger rows.

## Preconditions

- Product master + BOM exist.
- Assigned mould status is `Active` (DEC-015).
- Machine master exists and is available; exactly one machine per batch (DEC-016).
- Raw-material stock sufficient for planned consumption (reservation in stock).
- Optional: an approved order to link (DEC-017).

## Steps

1. **Production supervisor** — creates the batch: product, planned qty (driver pending OQ-11, PROPOSED), machine (DEC-016), mould (must be `Active`, DEC-015), optional order link (DEC-017). **System** — creates `production_batches`; validates mould/machine; sets status `IN_PROGRESS` at start.
2. **System** — at batch start, reserves planned quantities in `batch_materials` (planned_qty, reserved_at) per R12 (APPROVED). Reservation blocks availability but does not reduce physical stock.
3. **Operator** — runs the batch on the assigned machine; logs start/ongoing activity.
4. **Production supervisor** — completes the batch, recording `ok_qty` and `rejected_qty`. **System** — rejected quantity is treated as absorbed/lost cost of the batch (DEC-011); rejected units are not re-added to stock automatically.
5. **System** — consumes actual material used, writing `PRODUCTION_CONSUMPTION` (−) ledger rows with `balance_after`; negative stock is forbidden (R11, DB CHECK + domain).
6. **System** — posts finished goods with `PRODUCTION_OUTPUT` (+) ledger rows against the product's finished-goods stock.
7. **(PROPOSED) System** — handles reserved-but-unused material: return to stock automatically vs keep as adjustment is unresolved (OQ-09); the `PRODUCTION_RETURN` ledger type remains reserved and unused (DEC-020).
8. **(PROPOSED) System** — records extra/wastage consumption beyond BOM if any, subject to policy (OQ-08).
9. **Production supervisor/manager** — enters manual batch costs: material, labour, electricity, mould allocation, other; total (DEC-010). **System** — saves `batch_costs`.

## Data effects

- `production_batches` — created, started, completed; status transitions.
- `batch_materials` — reservation (`reserved_at`) and consumption (`consumed_qty`, `consumed_at`).
- `inventory_ledger` — consumption (−) and output (+) rows.
- `batch_costs` — manual costing record (DEC-010).
- `orders` — fulfilment quantities updated if order-linked (DEC-017).

## Inventory effects

- `PRODUCTION_CONSUMPTION` (−) — raw materials, at completion.
- `PRODUCTION_OUTPUT` (+) — finished goods.
- `PRODUCTION_RETURN` — NOT used (reserved pending OQ-09/decision).
- `ADJUSTMENT` — only for an authorized correction in stock (P-007, PROPOSED).

## Financial effects

- Batch cost recorded manually (DEC-010); the cost basis of finished output derives from it (finished-goods valuation PROPOSED).
- Rejected units are absorbed as batch cost (DEC-011), never auto-returned to inventory.
- Consumed raw-material value enters stock/cost per the material rate in force (valuation method OQ-10, PROPOSED).

## Possible failures & handling

- Mould not `Active` (DEC-015) — block batch creation.
- Machine already allocated to a live batch — block or warn (single-machine rule, DEC-016).
- Insufficient stock to reserve — block start; route to procurement.
- Consumption pushing the balance below zero (R11) — block; flag the actual-usage anomaly.
- Completion reported without the required consumption — block until ledger rows are coherent (OQ-08/OQ-09 open).

## Status changes

- Batch record: `PROPOSED` (plan) → `IN_PROGRESS` (start, reservation) → `COMPLETED` (completion + costing); `BLOCKED` on any validation failure; cancellation/`DEPRECATED` policy is PROPOSED.
- Order record: fulfilment status advances per P-002 (PROPOSED set).

## Audit requirements

- Batch creator, starter, and completer with timestamps.
- Who recorded ok/rejected counts and costing figures.
- Reservation/consumption rows carry the batch link and user where meaningful (DATABASE integrity rule 9).

## Related documents

- Modules: `../modules/production.md`, `../modules/bom.md`, `../modules/machines.md`, `../modules/moulds.md`, `../modules/inventory.md`, `../modules/costing.md`, `../modules/orders.md`.
- Decisions: DEC-010, DEC-011, DEC-015, DEC-016, DEC-017, DEC-020; rule R12 in `../BUSINESS-RULES.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-08, OQ-09, OQ-11, OQ-12, OQ-14.

## Future extensions

- Auto-return of reserved-but-unused material once OQ-09 is resolved (PROPOSED).
- QC hold/release gating (OQ-13, PROPOSED).
- Automated costing engine layered on manual input (DEC-010 reversal path, PROPOSED).