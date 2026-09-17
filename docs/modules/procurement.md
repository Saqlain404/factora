# Factora — Procurement

**Status:** IN_PROGRESS

## Purpose

The procurement module manages how raw material is bought from suppliers: purchase orders and the receipts that bring stock in. Whether a PO is mandatory before a receipt, and whether supplier bills are matched against receipts, are open questions that shape this module.

## Responsibilities

- Create and track purchase orders (supplier, items, quantities, rates).
- Record purchase receipts that post `PURCHASE_RECEIPT` ledger entries (+ stock).
- Carry rate/GST data on receipts (proposed, P-005) for stock valuation and GST credit.
- Feed supplier and inventory records used by reports.

## Entities (planned tables)

- `purchase_orders` — id, po_no, supplier_id, status, order_date, expected_date, notes.
- `purchase_order_items` — id, po_id, raw_material_id, quantity, rate.
- `purchase_receipts` — id, receipt_no, po_id (nullable per OQ-06), supplier_id, raw_material_id, quantity, rate, gst, received_at, bill_no, bill_date (per OQ-07).

## Related workflows

- `../workflows/procure-to-pay.md`

## Inputs

- Supplier master and raw-material master references.
- PO details and receipt data (quantity, rate, date).
- Supplier bill/invoice details (optional per OQ-07).

## Outputs

- Purchase orders and receipts with clear status.
- `PURCHASE_RECEIPT` ledger movements (stock increase).
- Rate/HSN data carried forward for valuation and GST credit.

## Validation rules

- `po_no` unique, required.
- `supplier_id` required, must exist.
- Receipt `quantity` numeric > 0; `rate` numeric >= 0.
- `received_at` required.
- If PO linkage is enforced (pending OQ-06), receipt quantity cannot exceed the PO line's open quantity (PROPOSED).
- A receipt posts exactly one `PURCHASE_RECEIPT` ledger row in the same transaction.

## Approved business rules

- **DEC-020** (APPROVED) — Stock-in from a supplier receipt uses the `PURCHASE_RECEIPT` ledger type; stock positions must never go negative.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-06 — is a PO required before a receipt, or may receipts be entered directly.
- `../OPEN-QUESTIONS.md` OQ-07 — supplier bill number/date matching against receipts.
- `../DECISIONS.md` P-005 (PROPOSED) — receipts carry rate/GST; supplier bill matching.

## Future extensions (PROPOSED)

- Supplier-level receipt approvals and partial receipts against a PO.
- GST credit matching against supplier bills (OQ-07).
- Documents (PO PDF, bills) stored via object storage (DEC-004).

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs