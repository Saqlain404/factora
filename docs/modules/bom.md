# Factora — BOM

**Status:** IN_PROGRESS

## Purpose

The BOM (bill of materials) module defines what raw materials and what quantity of each are needed to produce one unit of a finished product. It is the source for planned consumption, which is reserved at batch start and consumed at completion under the approved ledger rules.

## Responsibilities

- Define per-product BOM lines: product → raw material + quantity per unit.
- Provide planned quantities for batch material reservation.
- Support the reservation/consumption flow (reserve at start, consume actual at completion).
- Own BOM data used by production, costing and inventory planning.

## Entities (planned tables)

- `bom_items` — id, product_id, raw_material_id, qty_per_unit, created_at, updated_at.
- Constraint: one (product_id, raw_material_id) pair is unique.

## Related workflows

- `../workflows/reserve-and-consume.md`
- `../workflows/produce-batch.md`

## Inputs

- Product master and raw-material master references.
- Yield/usage data per unit (provisional; varies per OQ-18/OQ-08).

## Outputs

- Planned per-batch BOM requirement (plan_qty × qty_per_unit).
- Consumption basis for `PRODUCTION_CONSUMPTION` ledger entries.

## Validation rules

- `product_id` required, must exist.
- `raw_material_id` required, must exist.
- `qty_per_unit` numeric > 0 (unit consistent with raw material unit — kg/bag).
- Duplicate (product, raw material) line rejected.
- A product must have at least one BOM line before it can be planned in production (PROPOSED).

## Approved business rules

- **DEC-020** (APPROVED) — Raw material is reserved at batch start and consumed at completion via the approved ledger types; BOM defines the planned quantity.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-08 — wastage beyond BOM folded into consumption or recorded separately.
- `../OPEN-QUESTIONS.md` OQ-09 — reserved-but-unused material at batch completion.
- `../OPEN-QUESTIONS.md` OQ-18 — fixed vs order-varying BOM (drives versioning).
- `../OPEN-QUESTIONS.md` OQ-19 — HSN/GST source.

## Future extensions (PROPOSED)

- BOM versioning and effective-dating (depends on OQ-18).
- Multi-level BOM (not expected for resin + additive in V1).
- Yield/standard-loss factors per product.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs