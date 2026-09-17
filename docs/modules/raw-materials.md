# Factora — Raw Materials

**Status:** PROPOSED

## Purpose

The raw-materials module is the master for polymer resin and other inputs (additives, master-batch) that go into production. It defines unit, rate, HSN and minimum-stock thresholds, and its stock position is served by the inventory ledger. Procurement and production both consume this master.

## Responsibilities

- Maintain raw-material master (name, code, unit, HSN, current rate, minimum stock, GST rate, status).
- Provide the reference data against which inventory ledger movements are posted.
- Expose rate and minimum-stock fields for stock-level alerts and valuation.
- Feed BOM items (reservation/consumption) and purchase receipts.

## Entities (planned tables)

- `raw_materials` — id, code, name, unit, hsn, current_rate, minimum_stock, gst_rate, status, created_at, updated_at.
- Stock position derives from `inventory_ledger` (inventory module), never a separately edited counter.

## Related workflows

- `../workflows/procure-to-pay.md`
- `../workflows/reserve-and-consume.md`
- `../workflows/stock-adjustment.md`

## Inputs

- Raw-material master details (unit, HSN, rate).
- Ledger movements from purchase receipts, production consumption and adjustments.
- BOM quantities for reservation planning.

## Outputs

- Raw-material list and current stock balances.
- Rate information used for purchase receipts and costing.
- Low-stock signals based on `minimum_stock`.

## Validation rules

- `code` unique, required.
- `name` required.
- `unit` required; proposed set includes `kg`, `bag` (confirm with client).
- `current_rate` numeric >= 0.
- `minimum_stock` numeric >= 0.
- `hsn` required (8-digit) — values are an open question (OQ-19).
- Stock can never go negative (enforced at DB CHECK and domain level).

## Approved business rules

- **DEC-020** (APPROVED) — Only the approved ledger types move raw-material stock; `PURCHASE_RECEIPT`, `PRODUCTION_CONSUMPTION`, `DISPATCH`, `ADJUSTMENT`. Negative stock is forbidden. `PRODUCTION_RETURN` is reserved pending a decision.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-08 — extra consumption beyond BOM: recorded separately or folded into reject absorption.
- `../OPEN-QUESTIONS.md` OQ-09 — reserved-but-unused material at batch completion.
- `../OPEN-QUESTIONS.md` OQ-10 — moving average vs FIFO vs latest-rate valuation.
- `../OPEN-QUESTIONS.md` OQ-19 — HSN/GST-rate source.

## Future extensions (PROPOSED)

- Rate history table feeding valuation (OQ-10) and costing.
- Reclaim/return flow (`PRODUCTION_RETURN`) once approved.
- Object-storage backed specification (MSDS/TDS) attachments.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs