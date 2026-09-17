# Factora — Inventory

**Status:** IN_PROGRESS

## Purpose

The inventory module is the single ledger for raw-material stock. Every movement is a ledger row with a computed `balance_after`; stock is the last balance, never a separately edited counter. Only the approved movement types are allowed, and negative stock is forbidden.

## Responsibilities

- Maintain the raw-material stock ledger with a computed `balance_after` per row.
- Enforce the approved ledger type set (DEC-020) — reject any other type.
- Prevent negative stock at the database and domain level.
- Provide the source of truth for stock positions consumed by procurement, production and reports.

## Entities (planned tables)

- `inventory_ledger` — id, raw_material_id, type, qty (signed), reference (entity type + id), balance_after, note, user_id, created_at.
- Type enum `inventory_transaction_type`:
  - `PURCHASE_RECEIPT` (+)
  - `PRODUCTION_CONSUMPTION` (−)
  - `PRODUCTION_OUTPUT` (+ finished product output — handled in finished-goods stock)
  - `DISPATCH` (−)
  - `ADJUSTMENT` (±, note + authorized user required)
  - `PRODUCTION_RETURN` reserved/undecided — not active in V1.

## Related workflows

- `../workflows/procure-to-pay.md`
- `../workflows/reserve-and-consume.md`
- `../workflows/stock-adjustment.md`
- `../workflows/dispatch-and-pack.md`

## Inputs

- Ledger events from purchase receipts, batch completion (consumption), adjustments and dispatch.
- BOM planned consumption for reservation.

## Outputs

- Current stock balances and movement history.
- Reservation state and availability signals for production planning.
- Low-stock / stock-position views for reports and dashboard.

## Validation rules

- `type` must be one of the approved enum values.
- `qty` sign matches the type's direction (enforced by domain + CHECK).
- `balance_after` computed within the same transaction as the movement — never entered manually.
- `balance_after` >= 0 (negative stock forbidden: DB CHECK + domain).
- `ADJUSTMENT` requires a note and an authorized user (authorization level PROPOSED, P-007).
- New ledger types beyond the approved set are rejected.

## Approved business rules

- **DEC-020** (APPROVED) — Allowed ledger types are exactly `PURCHASE_RECEIPT`, `PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT`, `DISPATCH`, `ADJUSTMENT`; `PRODUCTION_RETURN` reserved. Negative stock is forbidden. Raw material is reserved at batch start and consumed at completion.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-09 — reserved-but-unused material return policy.
- `../OPEN-QUESTIONS.md` OQ-10 — valuation method (moving average vs FIFO vs latest).
- `../DECISIONS.md` P-003 (PROPOSED) — unused reservation handling on batch completion.
- `../DECISIONS.md` P-007 (PROPOSED) — 2-step authorization for adjustments.

## Future extensions (PROPOSED)

- Reclaim/return flow (`PRODUCTION_RETURN`) once the user approves (per DEC-011 note).
- Supplier return and write-off movement types (need new DEC).
- Valuation engine (moving average/FIFO) pending OQ-10.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs