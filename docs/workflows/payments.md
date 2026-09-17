# Factora — Workflow: Payments

**Status:** `PROPOSED`

## Purpose

Record money received against invoices without processing it in-app (DEC-019): validate against the invoice outstanding, apply the amount, and keep receivables in sync. Overpayment is blocked (DEC-012). The invoice status set in use is PROPOSED.

## Trigger

The customer pays an invoice (cash, UPI, or bank transfer), or an advance the operator wants to allocate.

## Actors

- Operator/accountant — records the receipt.
- System — validates outstanding, applies the payment, updates receivables.

## Preconditions

- Invoice issued (record exists with total and outstanding).
- Customer master and payment method captured.
- No payment gateway — recording only (DEC-019).

## Steps

1. **Operator** — records a payment: customer, invoice(s), amount, method (cash/UPI/bank), date, reference (UTR/cheque no). **System** — opens the crossover of applicable invoices.
2. **System** — validates that the invoice outstanding ≥ amount applied; cumulative paid may never exceed the invoice total minus discounts (overpayment blocked, DEC-012). The rule lives in `modules/payments/domain.ts`.
3. **(PROPOSED) System** — handles a payment larger than a single invoice: apportionment across multiple invoices per the operator's allocation; excess on any invoice is blocked (DEC-012) and any unallocated surplus becomes a customer advance (advance policy PROPOSED).
4. **System** — applies the amount to the invoice(s): updates paid totals, recomputes outstanding = total − discounts − paid.
5. **System** — refreshes receivables/aging using the due date from the credit-period snapshot (DEC-018).

## Data effects

- `payments` — inserted rows.
- `invoices` — paid total / outstanding updated.

## Inventory effects

None. Payments post no DEC-020 ledger type.

## Financial effects

- Receivables reduce by the applied amount.
- Overpayment is impossible by construction (DEC-012).
- Aging reflects due dates from DEC-018 credit terms.

## Possible failures & handling

- Amount exceeding invoice outstanding (DEC-012) — blocked; the operator is told the exact outstanding.
- Payment against an already paid/full invoice — blocked.
- Unknown customer or wrong invoice link — blocked until corrected.
- Unallocated surplus → customer advance — PROPOSED until a policy is approved.

## Status changes

- Payment record: `PROPOSED` → `APPROVED` → `COMPLETED` once fully applied; `BLOCKED` on validation failure.
- Invoice record: moves toward `COMPLETED` (paid) when outstanding reaches zero; the `partial/paid` enum states are PROPOSED (see `../DATABASE.md`).

## Audit requirements

- Recording operator + timestamp, method, and reference (UTR/cheque/live-charge) on each payment.
- Payment↔invoice application is fully traceable (DATABASE integrity rule 9).

## Related documents

- Modules: `../modules/payments.md`, `../modules/invoicing.md`, `../modules/customers.md`, `../modules/orders.md`.
- Decisions: DEC-012 (overpayment), DEC-018 (credit period), DEC-019 (no gateway) — `../DECISIONS.md`.
- Open questions: none block payments; the invoice-status set is tied to `../OPEN-QUESTIONS.md` and `../DATABASE.md` (PROPOSED).

## Future extensions

- Customer advance ledger and auto-allocation (PROPOSED).
- Payment gateway behind a provider abstraction (DEC-019 reversal path, PROPOSED).
- Supplier payment recording (bills payable) (PROPOSED).