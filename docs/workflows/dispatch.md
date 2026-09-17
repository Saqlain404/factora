# Factora — Workflow: Dispatch

**Status:** `PROPOSED`

## Purpose

Ship finished goods against an order/invoice physically: pick the goods, record a dispatch note, and post `DISPATCH` ledger entries so stock and receivable quantities stay correct. Partial dispatch across multiple shipments is explicitly supported (DEC-013). Transporter/LR field details (OQ-16) and packing records (OQ-15) remain open.

## Trigger

An order is ready to ship (in whole or in part) and storekeeping is instructed to hand over finished goods.

## Actors

- Storekeeper — picks goods, records the dispatch.
- Sales/operator — prepares the dispatch note, coordinates the transporter.
- System — posts ledger rows, tracks partial totals.

## Preconditions

- Order confirmed; dispatch quantities not yet fully shipped.
- Finished-goods stock available for the requested amount.
- (Optional) an invoice issued against which dispatch is noted.

## Steps

1. **Sales/operator** — selects the order/invoice and line items to ship. **System** — shows pending (ordered − already dispatched) per line using running totals (DEC-013).
2. **Storekeeper** — records dispatch quantities per line. **System** — validates against pending quantity and available finished-goods stock.
3. **Storekeeper** — records dispatch note details: date, reference. **System** — creates the dispatch note record.
4. **(PROPOSED) Storekeeper** — captures transporter/LR/challan details and driver fields once the field set is agreed (OQ-16); otherwise they remain free-text notes.
5. **(PROPOSED) System** — records a packing list (counts, cartons, vehicle) if packing records are required (OQ-15).
6. **System** — posts `DISPATCH` (−) ledger rows per item with computed `balance_after`; negative stock is forbidden (R11). Running dispatched totals update; partial states persist until a line's quantity is complete (DEC-013).

## Data effects

- Dispatch-note records and (PROPOSED) packing records — inserted.
- `inventory_ledger` — `DISPATCH` (−) rows.
- `orders` / `invoices` — dispatched quantities and partial-status totals updated.

## Inventory effects

- `DISPATCH` (−) — finished-goods stock; the only DEC-020 type fired here.

## Financial effects

- Dispatched quantities become the invoice basis if invoicing follows dispatch.
- Outstanding quantities underpin order status (P-002) and receivables aging.

## Possible failures & handling

- Insufficient finished-goods stock — block; allow partial dispatch (DEC-013) or route to production.
- Over-dispatch beyond the pending quantity — blocked.
- Negative stock on `DISPATCH` — blocked (R11).
- No remaining pending quantity — block further dispatch for that line.
- Transporter/LR details incomplete — warn only while OQ-16 is open (PROPOSED).

## Status changes

- Dispatch note: `PROPOSED` → `APPROVED` → `COMPLETED`; `BLOCKED` if stock or authorization fails.
- Order record: `IN_PROGRESS`/partially dispatched → dispatched, per P-002 (PROPOSED set).

## Audit requirements

- Storekeeper who recorded the dispatch, date/time, and LR/transporter fields when captured (OQ-16).
- Ledger rows carry the reference to the dispatch note and the acting user (DATABASE integrity rule 9).

## Related documents

- Modules: `../modules/dispatch.md`, `../modules/inventory.md`, `../modules/orders.md`, `../modules/invoicing.md`, `../modules/packing.md`.
- Decisions: DEC-013 (partial dispatch), DEC-020 (ledger types); rule R11 in `../BUSINESS-RULES.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-15, OQ-16.

## Future extensions

- Packing-list integration and barcoding (PROPOSED, OQ-15).
- e-way bill capture and logistics tracking links (PROPOSED).
- Proof-of-delivery timestamps (PROPOSED).