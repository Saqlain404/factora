# Factora — Costing

**Status:** PROPOSED

## Purpose

The costing module records manual cost entries per production batch — there is no automatic costing engine in V1. Rejected material is absorbed into the batch cost, since that loss is not re-added to inventory. Cost fields are proposed and must be validated against what the plant actually tracks.

## Responsibilities

- Record manual cost lines per batch (material, labour, electricity, mould allocation, other).
- Compute and display a per-batch cost total and per-unit cost (ok-qty basis).
- Attribute reject losses to the batch cost (DEC-011).
- Provide batch-wise costing output for reports.

## Entities (planned tables)

- `batch_costs` — id, batch_id, material_cost, labour_cost, electricity_cost, mould_alloc, other, total, entered_by, entered_at.
- Relation: one batch has one manual `batch_costs` record (per DEC-010); fields provisional pending OQ-14.

## Related workflows

- `../workflows/produce-batch.md`

## Inputs

- Batch identity and `ok_qty` / `rejected_qty`.
- Manual cost figures from the plant.
- Material consumption from the ledger (optional cross-check).

## Outputs

- Manual batch cost records and totals.
- Per-unit cost (total ÷ ok_qty) for insight.
- Input to production-summary and batch-wise costing reports.

## Validation rules

- `batch_id` required, unique per batch.
- All cost fields numeric >= 0; missing fields default to 0 (proposed).
- `total` computed as the sum of components (proposed), accepted/overridable only by the user.
- Cost entry is manual only — no formulas or auto-computation engine (DEC-010).
- Reject quantity is accounted into batch cost, not into inventory (DEC-011).

## Approved business rules

- **DEC-010** (APPROVED) — Costing is manually entered per batch; no automatic costing engine.
- **DEC-011** (APPROVED, indirect) — Rejected material is absorbed/lost as a cost of the batch.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-14 — which costing fields are actually available in the plant (electricity per machine/per job, mould amortization policy).

## Future extensions (PROPOSED)

- Material-rate-based auto-suggestion for material cost (still manual approval).
- Automatic costing engine on top of existing manual input (per DEC-010 reversal note).
- Standard vs actual cost variance reporting.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs