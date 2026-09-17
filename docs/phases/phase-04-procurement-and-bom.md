# Factora — Phase 04: Procurement & BOM

**Status:** `IN_PROGRESS` — code-complete; pending module-doc updates and live smoke-test.

## Business purpose

Two prerequisites for production: the **BOM** (what raw material makes one unit of a product) and a **procurement loop** (buy resin/additives from suppliers and bring it into stock). Purchases enter inventory only through approved ledger movements (`PURCHASE_RECEIPT`, DEC-020), stock can never go negative (R11), and costs are valuated consistently (valuation method is still an open question OQ-10). This phase also boots the core inventory ledger that all later stock activity uses.

## Scope

**In scope**

- **BOM definitions**: product → raw material + quantity per unit; revision tracking where approved (OQ-18).
- **Purchase orders**: supplier, status, ordered items; whether a PO is mandatory before receipt is pending OQ-06.
- **Purchase receipts**: quantity, rate, received date; optional supplier bill linkage per OQ-07.
- **Inventory ledger**: `inventory_ledger` with approved types from DEC-020 (`PURCHASE_RECEIPT` used here; `ADJUSTMENT` included for corrections).
- **Stock availability**: running `balance_after` per movement; current stock = last ledger balance; negative stock forbidden.

**Out of scope**

- Production reservation/consumption (`PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT`) — Phase 05.
- Dispatch of finished goods (`DISPATCH`) — Phase 06.
- Any ledger type outside the DEC-020 approved set.
- Rate-valuation engine (FIFO/Avg/latest) — pending OQ-10.
- Supplier due/payment tracking — payments phase.

## Current state

Implemented (see Phase-4 Build Status in DECISIONS.md):
- Drizzle schema: `bom_items`, `purchase_orders`, `purchase_order_items`, `purchase_receipts`, `inventory_ledger` + `purchase_order_status` and `inventory_transaction_type` enums; additive migration `0002_last_zemo.sql`.
- Domain: `applyLedgerMovement` enforces R11 (no negative balance), unit-tested.
- Server actions: `createBomItem` / `updateBomItem` / `deleteBomItem` (not `listBom` — reads go through `queries.ts`), `createPurchaseOrder`, `confirmPurchaseOrder`, `recordPurchaseReceipt` (transactional, uses `pg_advisory_xact_lock` for movement races), `adjustStock`.
- Queries: PO list/detail, `listConfirmedOrdersWithItems`, purchase receipts, stock balances (`getStockBalances`), ledger history + balance.
- UI: BOM editor (`/bom`), PO list + new PO form + detail view (confirm + outstanding columns), receipts list + new-receipt form (PO selector, outstanding lines), inventory stock table + adjust dialog + per-material ledger history. Sidebar wired with Procurement/Operations/Finance groups.

Your Phase-4 decisions (DEC-021..DEC-025) and Rule additions (R12) are recorded in DECISIONS.md / BUSINESS-RULES.md; open items deferred to later phases (rate valuation OQ-10, supplier-bill matching OQ-07, authorization P-007).

## Features / user stories

- As a manager, I can define a BOM for a product (raw material + qty per unit), so production can plan and reserve consumption (Phase 05 dependency).
- As a manager, I can create a purchase order against a supplier with items and quantities, so suppliers can be dispatched against a paper trail (pending OQ-06).
- As a storekeeper, I can record a purchase receipt against a PO, so stock increases by exactly the received quantity.
- As a storekeeper, I can optionally record supplier bill number/date/received date and the GST/rate on a receipt, so GST credit matching is possible later (pending OQ-07).
- As a storekeeper, I can view the live stock balance of any raw material with movement history, so availability is always a single source of truth.
- As an admin, I can make a stock adjustment with a required note, so corrections are recorded and attributable (authorization level pending P-007).
- As any user, I can never drive stock below zero, so the ledger can never show a negative balance (R11).

## Database changes

New Drizzle tables (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `bom_items` | `id`, `product_id` FK NOT NULL, `raw_material_id` FK NOT NULL, `qty_per_unit` numeric NOT NULL (> 0), `effective_from`, `rev` | composite unique product+raw material+rev; qty > 0 CHECK |
| `purchase_orders` | `id`, `po_no` NOT NULL UNIQUE, `supplier_id` FK NOT NULL, `status` NOT NULL (proposed: draft/confirmed/received/closed), `order_date` NOT NULL, `notes` | unique po number |
| `purchase_order_items` | `id`, `po_id` FK NOT NULL, `raw_material_id` FK NOT NULL, `qty` NOT NULL (> 0), `rate`, `gst_rate` | qty > 0 CHECK |
| `purchase_receipts` | `id`, `po_id` FK (nullable pending OQ-06), `raw_material_id` FK NOT NULL, `qty` NOT NULL (> 0), `rate` NOT NULL (>= 0), `gst_rate`, `bill_no`, `bill_date`, `received_at` NOT NULL, `created_by` FK | qty CHECK, rate CHECK |
| `inventory_ledger` | `id`, `item_type` NOT NULL (raw_material|product), `raw_material_id` FK (nullable), `product_id` FK (nullable), `type` `inventory_transaction_type` NOT NULL, `qty` numeric NOT NULL (+/-), `balance_after` NOT NULL, `reference_type`, `reference_id`, `note`, `user_id`, `created_at` | non-null balance; CHECK no negative balance; enum from DEC-020 |

NEW enum: `inventory_transaction_type` = `PURCHASE_RECEIPT | PRODUCTION_CONSUMPTION | PRODUCTION_OUTPUT | DISPATCH | ADJUSTMENT` (DEC-020; `PRODUCTION_RETURN` reserved pending user decision). No destructive changes.

## Server actions / APIs

- `createBomItem` / `updateBomItem` / `listBom` — BOM maintenance (qty-per-unit validation).
- `createPurchaseOrder` / `updatePurchaseOrder` / `receivePurchaseOrder` — PO lifecycle; receipt creates ledger rows.
- `recordPurchaseReceipt` — handles stock-in (+`PURCHASE_RECEIPT`), computes `balance_after`, refuses if the ledger would go negative.
- `adjustStock` — manual `ADJUSTMENT` with mandatory note; authorization level per P-007 (proposed).
- `getStockBalance` / `getLedgerHistory` — read-only queries.
- All write actions validate with Zod; ledger writes run inside a DB transaction.

## UI pages & components

- `app/(dashboard)/bom/` — BOM editor per product (raw material + qty-per-unit rows, revision display).
- `app/(dashboard)/procurement/purchase-orders/` — PO list + create/edit form (items grid).
- `app/(dashboard)/procurement/receipts/` — purchase receipt entry with PO selector and bill fields.
- `app/(dashboard)/inventory/raw-materials/` — stock balance list with live `balance_after` + full ledger history table.
- Shared: data table (exists), dialog forms, status badge, low-stock indicator.

## Validation & business rules

- Zod: BOM `qty_per_unit > 0`; PO/items positive quantities; receipts positive qty + non-negative rate; adjustment requires a note.
- Ledger rules (DATABASE.md binding): every movement is a row with computed `balance_after`; stock = last balance; negative stock forbidden at DB (CHECK) and domain level (R11).
- Only `PURCHASE_RECEIPT` and `ADJUSTMENT` are usable in this phase (DEC-020); other enum values arrive with their phases.
- PO-mandatory-before-receipt and supplier-bill matching follow OQ-06/OQ-07 once answered (P-005).
- No ledger type outside the approved DEC-020 set may be written.

## Edge cases

- Receiving more than the PO quantity → decide at UI level (warn vs block) until OQ-06 settles the rule.
- Receipt that would make balance negative → blocked by domain + DB CHECK (R11).
- Duplicate PO number → unique constraint fails with a typed error.
- Zero-quantity or negative receipt → Zod rejects before the transaction opens.
- A BOM revision changes mid-order → snapshots needed; resolved with OQ-18 (BOM versioning).
- Rate change on a new purchase → stock value handling pending OQ-10 (no valuation engine in V1).

## Tests

- Domain: ledger push fails when `balance_after < 0` (R11 test from TESTING.md); receipt computes balance correctly; adjustment requires a note.
- Zod: BOM, PO, receipt, adjustment schemas fail cases.
- Actions (mock DB): `recordPurchaseReceipt` writes one ledger row transactionally; negative-balance receipt rejected.
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] BOM can be defined/updated per product with the current revision visible.
- [ ] Purchase order creation records supplier + items (PO number unique).
- [ ] Purchase receipt creates a `PURCHASE_RECEIPT` ledger row and updates `balance_after`.
- [ ] Stock below zero cannot be written at domain or DB level (R11).
- [ ] `inventory_ledger` history view shows every movement with user + timestamp.
- [ ] Only DEC-020 approved types are usable.
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 03 masters (suppliers, raw materials, products) — FKs referenced.
- DEC-020 approved ledger type set.
- Answers to OQ-06, OQ-07, OQ-10 to finalize PO/receipt rules and valuation.

## Risks

- Venturing beyond the approved ledger types would silently violate DEC-020 — guarded by enum + rule tests.
- Without OQ-10, stock is valued at receipt rates only; a later valuation decision may need a corrective `ADJUSTMENT`.
- Supplier bill matching (OQ-07 / P-005) if added late could reshape the receipt table — keep bill fields additive.
- BOM without versioning (OQ-18) makes mid-order changes hard to trace.

## Questions requiring approval

- OQ-06 — is a PO mandatory before a receipt can be entered?
- OQ-07 — is supplier bill (bill no./date) matching required or optional? (P-005)
- OQ-08 — is raw-material wastage recorded separately or folded into reject absorption?
- OQ-10 — stock valuation: moving average, FIFO, or latest purchased rate?
- P-007 — stock adjustment authorization level (admin 2-step?).

## Definition of done

- [ ] Zod schema written and unit-tested (fail cases included).
- [ ] domain.ts rule functions unit-tested (negative-stock guard, balance computation).
- [ ] DB migration added (additive): BOM + procurement + `inventory_ledger` + `inventory_transaction_type` enum.
- [ ] Server Actions validate + write (PO, receipt, adjustment, BOM).
- [ ] UI pages/components render + wired (BOM editor, PO + receipt flows, stock ledger view).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (procurement/BOM/inventory module docs).