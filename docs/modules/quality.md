# Factora — Quality

**Status:** BLOCKED

## Purpose

The quality module records in-process QC results and rejects on production batches. It is currently blocked because there is no client QC specification to design against, and it is unclear whether QC only reports results or actually gates production.

## Responsibilities

- (Planned) Record QC parameters and results per production batch.
- (Planned) Track rejected quantity and reject reasons on batches.
- (Planned) Surface rejects and defect data to costing and reports.

## Entities (planned tables)

- `batch_quality_entries` — id, batch_id, parameter, result, unit, checked_at, checked_by.
- `reject_reasons` — id, batch_id, reason, rejected_qty (or per-sample results per OQ-20).
- (Schema is deferred until the QC spec is provided.)

## Related workflows

- `../workflows/produce-batch.md`

## Inputs

- Batch identity and QC measurements (parameter, sample, result, timestamp).
- Reject counts at batch or per-part-sample level (per OQ-20).

## Outputs

- QC results and reject tallies per batch.
- Input to batch cost (`rejected_qty` affects batch cost per DEC-011).

## Validation rules

- (Deferred) `batch_id` required, must exist.
- (Deferred) `rejected_qty` integer >= 0 and consistent with batch `rejected_qty`.
- (Deferred) Parameter set depends on OQ-20; no parameters defined yet.

## Approved business rules

- **DEC-011** (APPROVED, indirect) — Rejected material produced is absorbed/lost as a batch cost; it is not re-added to inventory automatically.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-13 — is in-process QC a hold/release gate or reporting only.
- `../OPEN-QUESTIONS.md` OQ-20 — which QC parameters exist and whether rejects are batch-level or per-part-sample.
- `../DECISIONS.md` P-008 (PROPOSED) — QC hold/release decision workflow.

## Future extensions (PROPOSED)

- Parameter checklists and pass/fail rules per product.
- QC hold/release workflow (depends on OQ-13/P-008).
- Attachments for defect photos (object storage).

## Definition of done

- [ ] Unblocked: client QC spec confirmed (OQ-13/OQ-20 answered)
- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs