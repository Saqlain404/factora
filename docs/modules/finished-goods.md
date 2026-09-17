# Factora — Finished Goods

**Status:** PROPOSED

## Purpose

The finished-goods module tracks stock of produced finished products, kept distinct from raw-material inventory. Finished stock increases on batch completion (`PRODUCTION_OUTPUT`) and decreases on dispatch (`DISPATCH`). It is the quantity basis for dispatches and invoices.

## Responsibilities

- Maintain finished-product stock positions separate from raw-material ledger.
- Post `PRODUCTION_OUTPUT` (+) at batch completion and `DISPATCH` (−) on dispatch.
- Prevent finished-stock negative balances (same rule as raw stock).
- Provide available-to-dispatch quantities for the dispatch module.

## Entities (planned tables)

- `finished_goods_ledger` — id, product_id, type, qty (signed), reference, balance_after, note, user_id, created_at.
- Allowed types here: `PRODUCTION_OUTPUT` (+), `DISPATCH` (−), `ADJUSTMENT` (±, authorized, with note).

## Related workflows

- `../workflows/produce-batch.md`
- `../workflows/dispatch-and-pack.md`
- `../workflows/stock-adjustment.md`

## Inputs

- Batch completion events (ok_qty) → `PRODUCTION_OUTPUT`.
- Dispatch events (qty per product) → `DISPATCH`.
- Authorized corrections → `ADJUSTMENT`.

## Outputs

- Finished-stock balances and movement history.
- Available-to-dispatch quantities.
- Stock input for reports and dashboard.

## Validation rules

- `type` in {`PRODUCTION_OUTPUT`, `DISPATCH`, `ADJUSTMENT`} only.
- `balance_after` computed in-transaction and always >= 0.
- `PRODUCTION_OUTPUT` uses batch `ok_qty`; rejects do not enter stock (DEC-011).
- `DISPATCH` cannot exceed available finished stock.
- `ADJUSTMENT` requires a note and authorized user (P-007).

## Approved business rules

- **DEC-020** (APPROVED) — Finished output enters stock via `PRODUCTION_OUTPUT`; outbound movement uses `DISPATCH`; negative stock is forbidden.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-05 — customer returns and credit notes (affects stock-in on returns).
- `../DECISIONS.md` P-006 (PROPOSED) — invoice cancellation / credit-note policy.

## Future extensions (PROPOSED)

- Claims/reclaim of customer-returned goods (needs new DEC).
- Expiry/batch-lot traceability per finished product.
- Object-storage photos of finished products.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs