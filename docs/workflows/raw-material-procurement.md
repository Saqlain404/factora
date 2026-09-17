# Factora — Workflow: Raw Material Procurement

**Status:** `PROPOSED`

## Purpose

Keep raw-material stock within safe limits: detect reorder need from the stock position, raise an indent, purchase from a supplier, receive into stock with a `PURCHASE_RECEIPT` ledger entry, and refresh the material's rate. Whether a PO is mandatory before receipt (OQ-06), supplier-bill matching (OQ-07), and the valuation/rate policy (OQ-10) remain open.

## Trigger

The stock position for a raw material is at or below its minimum stock level, or the storekeeper/operations requests replenishment.

## Actors

- Storekeeper / production user — reviews stock, raises the indent, records the receipt.
- Purchase manager — authorizes the purchase order, selects the supplier.
- System — computes stock positions, enforces ledger rules.
- Supplier — supplies the material (external).

## Preconditions

- `raw_materials` master exists with unit, minimum stock, HSN/GST rate.
- `suppliers` master exists.
- Current stock position available from the last ledger balance (DATABASE integrity rule 1).

## Steps

1. **Storekeeper** — opens the stock position; the system highlights materials at/below minimum from the last ledger `balance_after`.
2. **(PROPOSED) Storekeeper** — raises an indent for items and quantities. An `indent` record table is not yet approved; treat it as a request resolved into a PO.
3. **Purchase manager** — raises a purchase order to a supplier with items, quantity, and rate. **System** — records the PO. Whether a PO is mandatory before any receipt is OQ-06 (PROPOSED).
4. **(PROPOSED) System** — validates the receipt against the PO if mandatory (OQ-06); otherwise direct receipts are allowed (PROPOSED).
5. **Storekeeper** — records the receipt: qty, rate, supplier bill no/date. **System** — on validation:
   - writes `PURCHASE_RECEIPT` (+) ledger row(s) with a computed `balance_after` (DEC-020);
   - updates the material's current rate/valuation per the policy in OQ-10 (PROPOSED; moving-average vs FIFO vs latest unresolved);
   - links the supplier bill for matching if captured (OQ-07, PROPOSED).
6. **System** — recomputes the stock position; the reorder flag clears when stock is above minimum.

## Data effects

- `purchase_orders`, `purchase_receipts` — inserted.
- `inventory_ledger` — `PURCHASE_RECEIPT` rows, one or more per receipt line.
- `raw_materials` — current rate/stock valuation updated (method open, OQ-10).
- (If applicable) supplier bill cross-reference (OQ-07, PROPOSED).

## Inventory effects

- `PURCHASE_RECEIPT` (+) — the only DEC-020 ledger type fired here.

## Financial effects

- Creates the purchase cost basis for the raw material; consumed cost flows to batches via DEC-010 manual costing (rate at consumption — PROPOSED).
- Supplier payable is reflected if the bill is recorded/matched (OQ-07, PROPOSED).

## Possible failures & handling

- Receipt exceeding the PO quantity — warn/block unless allowed (PROPOSED; OQ-06).
- Supplier-bill mismatch vs receipt (OQ-07) — flag for the purchase manager; do not block stock-in.
- Unknown material or supplier — block until the master is created.
- Rate absent at receipt — warn; default to the current rate (PROPOSED).

## Status changes

- PO record: `PROPOSED` → `APPROVED` → `IN_PROGRESS` (partially received) → `COMPLETED`; `PROPOSED` status set until the PO policy (OQ-06) is resolved.
- Raw-material record: unchanged by procurement.

## Audit requirements

- Indent raiser, PO authorizer, receipt recorder, and timestamps tracked per document.
- Supplier bill no/date captured when available (OQ-07).

## Related documents

- Modules: `../modules/procurement.md`, `../modules/raw-materials.md`, `../modules/suppliers.md`, `../modules/inventory.md`.
- Decisions: DEC-020 (ledger types); rules R11/R12 in `../BUSINESS-RULES.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-06, OQ-07, OQ-10.

## Future extensions

- Automatic reorder suggestions from minimum-stock thresholds (PROPOSED).
- Supplier-bill matching with two/three-way match (PROPOSED, OQ-07).
- Value-at-receipt journaling and GST credit tracking (PROPOSED).