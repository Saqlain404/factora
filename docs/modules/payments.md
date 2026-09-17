# Factora — Payments

**Status:** PROPOSED

## Purpose

The payments module records money received against invoices. It has no payment gateway in V1 — payment is recorded as it happens (cash, UPI, bank). Overpayment is blocked so a recorded payment can never exceed the invoice's outstanding balance.

## Responsibilities

- Record payments against invoices (amount, method, date, reference).
- Enforce overpayment blocking (DEC-012): payment amount ≤ outstanding balance.
- Track payment status on invoices (unpaid / partially paid / fully paid).
- Support only tracked, non-processed payments in V1 (DEC-019).

## Entities (planned tables)

- `payments` — id, customer_id, invoice_id, amount, method, payment_date, reference_no, received_at, user_id, notes.
- Method enum: `cash`, `upi`, `bank` (proposed; confirm with client).

## Related workflows

- `../workflows/invoice-and-collect.md`

## Inputs

- Invoice reference and outstanding balance.
- Payment details entered by the operator.

## Outputs

- Payment records and invoice payment status.
- Receivables/outstanding balances for reports and dashboard.
- Blocked-payment errors when an amount exceeds the outstanding balance.

## Validation rules

- `amount` numeric > 0.
- `invoice_id` required, must exist.
- `amount` <= invoice outstanding balance — otherwise the payment is rejected (DEC-012).
- `method` from the fixed set (cash / upi / bank).
- `payment_date` required; `received_at` defaults to server time.
- No card/PAN data captured (out of scope, DEC-019).

## Approved business rules

- **DEC-012** (APPROVED) — Overpayment is blocked; a payment may not exceed the outstanding balance on the invoice.
- **DEC-019** (APPROVED) — No payment gateway in V1; payments are recorded/tracked (cash/UPI/bank), not processed.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-05 (indirect) — credit-note/cancellation policy affects outstanding balances on returned goods.
- `../DECISIONS.md` P-006 (PROPOSED) — invoice cancellation / credit-note policy interplay with receipts.

## Future extensions (PROPOSED)

- Payment gateway (Razorpay etc.) behind a provider abstraction (per DEC-019).
- Payment receipts (PDF) and auto-reconciliation against bank statements.
- Early-payment and overdue fee handling (needs new DEC).

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs