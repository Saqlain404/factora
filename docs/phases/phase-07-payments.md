# Factora — Phase 07: Payments

**Status:** `PROPOSED`

## Business purpose

Money is tracked, not processed. Factora records every payment a customer makes (cash / UPI / bank transfer) against an invoice, blocks overpayment outright (DEC-012), computes due dates from the per-customer credit period snapshot (DEC-018), and surfaces receivables so the owner knows who owes what and how old the debt is. No payment gateway in V1 (DEC-019) — there is no PCI surface and no online collection.

## Scope

**In scope**

- Payment records: customer, invoice, amount, method (cash/UPI/bank), date/received date, note.
- Overpayment block: a payment may not exceed the invoice's outstanding balance (DEC-012).
- Partial payments against an invoice; multiple payments per invoice.
- Receivables view: invoice totals, paid amounts, outstanding balance, due date, days overdue.
- Aging view (e.g. current / over 30 / 60 / 90) to guide collection.

**Out of scope**

- Payment gateway / online payment processing (DEC-019).
- Refunds, credit notes, advance payments creating a customer credit balance (DEC-012 reversal path needs a new decision).
- TDS, interest on late payments, or write-offs — add only with user approval.
- Card/bank data storage (no PCI), per DEC-019.

## Current state

Nothing built yet. No `payments` tables/actions exist. Invoices from Phase 06 provide the outstanding balances; invoice `paid/total` state is a prerequisite read.

## Features / user stories

- As an accountant, I can record a payment received against an invoice, so receivables decrease accurately.
- As an accountant, I can record partial payments, so a customer who pays in installments is tracked correctly.
- As an accountant, I can never enter an overpayment — Factora blocks any amount above the outstanding balance (DEC-012).
- As an owner, I can view a receivables list with due dates and overdue age, so I know what to chase (DEC-018 due date).
- As an admin, I can see every payment's method and received date, so the cash book is audit-friendly.
- As the business, I have no online payment processing in V1, so there is no PCI compliance burden (DEC-019).

## Database changes

New Drizzle table (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `payments` | `id`, `invoice_id` FK NOT NULL, `customer_id` FK NOT NULL, `amount` numeric NOT NULL (> 0), `method` NOT NULL (`cash` | `upi` | `bank_transfer` | `cheque`), `payment_date` NOT NULL, `received_at` NOT NULL, `note`, `created_by` FK | amount > 0 CHECK; overpayment guard enforced in domain/action |

Usage: outstanding = invoice `total` − Σ `payments.amount` on that invoice. No new enum is strictly required (method can be an enum or text with a fixed set — enum preferred). Additive only; no destructive changes. Optionally a computed receivables read-model (query/view, no table) for aging.

## Server actions / APIs

- `recordPayment` — validates amount > 0 and amount <= outstanding balance (DEC-012); inserts row; revalidates invoice status (→ partially_paid / paid).
- `listReceivables` — per invoice: total, paid, outstanding, due_date, overdue days.
- `receivablesAging` — buckets receivables by current/30/60/90+.
- `listPayments` / `getPayment` — audit/read queries.

## UI pages & components

- `app/(dashboard)/payments/` — payment list + record-payment form (invoice selector, amount with max-outstanding hint, method).
- Receivables page: per-invoice totals/paid/outstanding/due-date + overdue badges.
- Aging view: buckets current / 30 / 60 / 90+.
- Invoice detail shows payment history and remaining balance.

## Validation & business rules

- Zod: positive `amount`; valid `method` from the fixed set; date sanity (payment_date not in the future beyond tolerance, receivable_date set).
- Overpayment blocked at domain level (DEC-012 / R04) and double-checked in the action: amount must be `<= invoice.total − sum(previous payments)`.
- Exact-balance payment allowed (R04 test: "payment > invoice balance rejected; exact-balance allowed").
- Invoice status transitions on payment: issued → partially_paid → paid (per DATABASE.md).
- Due date comes from the invoice's snapshotted credit period (DEC-018), not recomputed from the customer master.

## Edge cases

- Payment over outstanding → blocked with a clear message showing the max allowed (DEC-012).
- Zero/negative payment → Zod rejects.
- Second concurrent payment near the balance → serialize in a transaction so two "exact balance" payments cannot both pass (R11-style guard).
- Payment recorded to a cancelled invoice → blocked unless cancellation policy (OQ-05) says otherwise.
- Advance/credit balance the customer wants to hold → not supported in V1; requires a new decision (DEC-012 reversal path).
- Invoice with discount or partial dispatch → outstanding recomputed from totals; payments always reference a single invoice.

## Tests

- Domain: R04 overpayment rejection + exact-balance allowance (from TESTING.md); invoice status transitions; due-date aging math.
- Zod: payment schema fail cases (negative amount, invalid method).
- Actions (mock DB): `recordPayment` transactional concurrent-payment guard; cancelled-invoice block.
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] A payment above an invoice's outstanding balance is blocked with a clear error.
- [ ] Exact-balance payment marks the invoice `paid`; partial payments keep it `partially_paid`.
- [ ] Receivables list shows outstanding, due date (credit-period snapshot), and overdue days (DEC-018).
- [ ] Aging report buckets receivables into current / 30 / 60 / 90+.
- [ ] No payment gateway, card, or bank details are stored (DEC-019).
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 06 invoices (totals, status, due date).
- Phase 03 customers (identity for the receivables view).
- No blocking OQs remain for core recording; cancellation interplay waits on OQ-05.

## Risks

- Concurrency: simultaneous payments near the balance require a row-locked transaction to enforce DEC-012 safely.
- Overpayment policy is strict by design (DEC-012); if the customer later wants credit balances, a new decision is required (reversal path documented).
- Aging expectations vary by accountant — the bucket boundaries should be configurable or confirmed during UAT.
- Payment method list may grow (cheque/NEFT variants) — keep it an extendable enum with additive friction.

## Questions requiring approval

- OQ-05 — invoice cancellation/credit-note policy (payment interplay on cancelled invoices).
- Any future allowance of customer credit balances would be a NEW decision (not in DECISIONS today).

## Definition of done

- [ ] Zod schema written and unit-tested (fail cases included).
- [ ] domain.ts rule functions unit-tested (overpayment guard, status transitions, aging).
- [ ] DB migration added (additive): `payments` table.
- [ ] Server Actions validate + write (`recordPayment`, receivables/aging queries).
- [ ] UI pages/components render + wired (record-payment form, receivables table, aging view).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (payments module doc, receivables workflow).