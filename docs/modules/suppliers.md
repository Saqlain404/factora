# Factora — Suppliers

**Status:** PROPOSED

## Purpose

The suppliers module is the master record for vendors supplying resin, additives, master-batch and consumables. It holds the vendor's GST registration and contact details so purchase orders and receipts carry consistent party data. It is the starting point of the procure-to-pay flow that feeds raw-material stock.

## Responsibilities

- Maintain supplier master records (name, contact, GSTIN, address).
- Provide supplier defaults (currency, expected lead behaviour, status) used when creating purchase orders.
- Link supplier activity to purchase orders, receipts and payments to vendors.

## Entities (planned tables)

- `suppliers` — id, code, name, contact_person, phone, email, address, gstin, status, notes, created_at, updated_at.

## Related workflows

- `../workflows/procure-to-pay.md`

## Inputs

- Vendor details: legal name, contact, GSTIN, address.
- GST registration data used on purchase-side documents.

## Outputs

- Supplier records referenced by `purchase_orders` and `purchase_receipts`.
- Vendor GSTIN/address shown on purchase documents.
- The reconciled party list for supplier-ledger reporting (future).

## Validation rules

- `name` required, non-empty.
- `gstin` matches the Indian GSTIN format when provided.
- `code` unique when used as the display key.
- `status` from a fixed set (e.g. active / inactive) — exact values PROPOSED.

## Approved business rules

- No approved DEC directly governs supplier master data. Supplier stock-in uses the approved `PURCHASE_RECEIPT` ledger type — **DEC-020** (APPROVED).

## Open questions

- `../OPEN-QUESTIONS.md` OQ-06 — whether every purchase receipt requires a PO.
- `../OPEN-QUESTIONS.md` OQ-07 — supplier bill (bill no./date) matching against purchase receipts.

## Future extensions (PROPOSED)

- Per-supplier rate contracts and rate history (feeds OQ-10 valuation).
- Supplier outstanding balances and purchase payment tracking.
- GST credit matching against supplier bills (OQ-07).

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs