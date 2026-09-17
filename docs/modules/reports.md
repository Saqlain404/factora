# Factora — Reports

**Status:** PROPOSED

## Purpose

The reports module produces operational summaries over the module data already collected (stock, orders, dispatch, payments, costing). It adds no new source data of its own. The day-1 report list is an open question, so priorities are settled before the module is built.

## Responsibilities

- Define and run business reports over existing module data.
- Serve the owner's day-1 priorities once confirmed (OQ-21).
- Provide exportable outputs (CSV/print; PDF/PROPOSED later).
- Keep report definitions read-only — no writes to source data.

## Entities (planned tables)

- No new tables planned; reports are read-only views/queries over existing tables.
- Optional `report_definitions` (id, name, query key, params, enabled) if reports become configurable (PROPOSED).

## Related workflows

- Cross-cutting; consumes all module data. No dedicated workflow file yet (PROPOSED).

## Inputs

- Data from customers, orders, inventory, production, costing, dispatch, invoicing, payments, expenses.
- Confirmed report list and filters (OQ-21).

## Outputs

- Report outputs (tables/counts) and exports.
- Scheduled/summary views for management review.

## Validation rules

- Read-only access to source data (no mutations from report runs).
- Report parameters validated with Zod (dates, filters).
- Candidate day-1 reports (PROPOSED until confirmed): stock position, pending orders, party-wise outstanding, batch-wise costing, production summary, low-stock.

## Approved business rules

- None currently — no DEC governs the reports set; the report list is an open question.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-21 — which reports the owner actually wants day-1 (stock, pending orders, party outstanding, batch-wise costing, production summary).
- `../DECISIONS.md` P-009 — reports set and dashboard KPI list.

## Future extensions (PROPOSED)

- Scheduled email reports and dashboard export.
- PDF report generation with @react-pdf/renderer (aligned with DEC-006).
- GST filing previews (GSTR-1 style) — out of V1 scope, verify compliance first.

## Definition of done

- [ ] Report list confirmed (OQ-21/P-009)
- [ ] Query layer (read-only)
- [ ] Zod validation for report params + tests
- [ ] Domain rule tests
- [ ] Vercel-safe generation (no heavy jobs)
- [ ] UI
- [ ] Docs