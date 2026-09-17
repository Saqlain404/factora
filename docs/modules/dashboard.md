# Factora — Dashboard

**Status:** IN_PROGRESS (dashboard rebuilt 2026-09-11)

**Built so far (Phase 5 revamp):** read-only aggregation of real module data — greeting + today's date, four MetricCards (Low stock, Awaiting stock-in, Draft POs, Active POs) linking to list pages, a "Needs attention" list (low stock, draft POs, outstanding POs with contextual actions), "Inventory health" progress bars vs minimum, "Recent purchases" receipts, and "Master data" count tiles. No invented/demo figures.

## Purpose

The dashboard gives the owner an at-a-glance operational view: what needs attention today (low stock, open dispatch, outstanding receivables) alongside simple production and sales figures. It is a read-only shell today; the KPI set is an open question and will be confirmed before widgets are finalized.

## Responsibilities

- Present a summary view of operational state (KPIs, alerts).
- Surface attention items: low-stock, open dispatch, receivables, in-progress batches.
- Link through to the relevant module pages for details.
- Remain read-only — no writes from the dashboard.

## Entities (planned tables)

- No new tables planned; the dashboard aggregates existing module data.
- Optional `dashboard_preferences` (user_id, layout, chosen KPI set) if personalization is wanted (PROPOSED).

## Related workflows

- Cross-cutting; consumes all module data. No dedicated workflow file yet (PROPOSED).

## Inputs

- Aggregated data: inventory balances, batches in progress, open orders/dispatch, receivable totals, recent payments/expenses.

## Outputs

- KPI tiles and alert lists rendered in the app shell.
- Navigation targets into module pages.

## Validation rules

- Read-only across all source modules.
- KPI widgets only use confirmed data sources (aligned with OQ-22).
- Server-side calculation with Zod-validated params (date ranges).

## Approved business rules

- None currently — no DEC governs the dashboard; the KPI set is an open question.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-22 — dashboard KPI list (low-stock alerts, open dispatch, receivables — confirm).
- `../DECISIONS.md` P-009 — reports set and dashboard KPI list.

## Future extensions (PROPOSED)

- Customizable widget layout and saved preferences.
- Charting (Recharts, conditional per ARCHITECTURE.md).
- Real-time refresh (out of scope for serverless V1 without job queues).

## Definition of done

- [ ] KPI set confirmed (OQ-22/P-009)
- [ ] Read-only aggregation queries
- [ ] Zod validation for query params + tests
- [ ] Domain rule tests
- [ ] UI shell widgets
- [ ] Docs