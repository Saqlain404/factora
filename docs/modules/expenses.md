# Factora — Expenses

**Status:** PROPOSED

## Purpose

The expenses module records non-production operating spend (rent, utilities, fuel, admin, etc.) as manual entries. It is intentionally simple in V1: date, category, amount, note. Expense categories have no approved list yet, so the seed category list is an open item before this module is finalized.

## Responsibilities

- Record manual operating-expense entries (date, category, amount, note).
- Categorize spend with a defined category list (list pending approval — P-010).
- Capture optional receipt reference/attachment for audit.
- Provide expense totals for reports/dashboard by month and category.

## Entities (planned tables)

- `expenses` — id, expense_date, category, amount, note, receipt_ref, user_id, created_at.
- `expense_categories` — id, name, active (seed list pending approval).

## Related workflows

- No dedicated workflow yet; expenses are cross-cutting period-close data (PROPOSED).

## Inputs

- Manual expense details entered by the operator.
- Optional receipt notes/attachments.
- Category reference (once the list is approved).

## Outputs

- Expense records and category totals.
- Monthly expense summaries for reports/dashboard.
- Audit trail (who entered, when).

## Validation rules

- `expense_date` required; `amount` numeric > 0.
- `category` required; must belong to the active category list.
- `note` optional; `receipt_ref` optional.
- Category list values are not hard-coded as approved rules until the user confirms.

## Approved business rules

- None currently — no DEC governs expenses; the module is proposed and awaits the category list decision.

## Open questions

- `../DECISIONS.md` P-010 — the expenses category list awaits approval (`OQ → P-010`; there is no dedicated OQ id for expense categories, so this is tracked as a proposal).
- `../OPEN-QUESTIONS.md` OQ-25 (indirect) — branding only; no effect on expenses besides UI.

## Future extensions (PROPOSED)

- Object-storage receipt attachments (DEC-004 backend).
- Monthly period-close and profit-and-loss style summaries (no GL in V1).
- Approval workflow for large expenses.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs