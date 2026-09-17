# Factora — Products

**Status:** PROPOSED

## Purpose

The products module is the finished-goods master. Each finished product links to the mould it is produced with and to a BOM that defines its raw-material consumption. Product codes, units, HSN and GST rate feed order items, production batches and invoices.

## Responsibilities

- Maintain finished-product master (name, code, unit, selling price, status).
- Link each product to exactly one mould (the tooling that produces it).
- Link each product to a BOM (defined in the BOM module) used for reservation and consumption.
- Carry HSN and GST-rate fields used by invoicing (rates themselves are an open question).

## Entities (planned tables)

- `products` — id, code, name, unit, mould_id, hsn, gst_rate, selling_price, status, created_at, updated_at.
- Relations: `products.mould_id` → `moulds.id`; BOM lines in `bom_items` (BOM module).

## Related workflows

- `../workflows/order-to-fulfilment.md`
- `../workflows/produce-batch.md`
- `../workflows/mould-lifecycle.md`

## Inputs

- Product master data and unit of measure.
- Mould selection and BOM definition.
- HSN and GST-rate data (provisional until OQ-19 is resolved).

## Outputs

- Product records consumed by `order_items`, `production_batches` and `invoice_items`.
- HSN/GST surfaced on invoice line items.
- BOM linkage that drives material reservation.

## Validation rules

- `code` unique, required.
- `name` required.
- `unit` required (e.g. pcs); unit set PROPOSED.
- `mould_id` required and must reference an existing mould.
- `gst_rate` numeric in a plausible range (0–28, proposed) when set.
- `selling_price` >= 0.

## Approved business rules

- **DEC-015** (APPROVED, indirect) — A product's mould must reach `Active` before production can run.
- **DEC-020** (APPROVED, indirect) — BOM-defined raw material is reserved/consumed through the approved ledger types.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-18 — whether BOM is fixed per product or can vary per order.
- `../OPEN-QUESTIONS.md` OQ-19 — HSN codes and GST rates per item (customer list vs generic).

## Future extensions (PROPOSED)

- Product images and data-sheet attachments (object-storage backed, DEC-004).
- Product variants and BOM versioning (depends on OQ-18).
- Alternate moulds per product.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs