# Factora — Workflow: Invoicing

**Status:** `PROPOSED`

## Purpose

Generate the customer invoice from an order/dispatch, assign a sequential number `INV-###` transactionally with no gaps or duplicates (DEC-014), compute GST line items for a UP-based business (DEC-009), render a PDF via @react-pdf/renderer (DEC-006), and record totals so later payments are guarded against overpayment (DEC-012). The CGST/SGST split (OQ-01) and the credit-note policy (OQ-05) remain open.

## Trigger

Ordered/dispatched goods are ready to bill, or the accountant issues an invoice at the agreed billing cadence.

## Actors

- Accountant — selects lines, issues the invoice, verifies the PDF.
- System — numbers, computes tax, renders/stores the PDF.
- (Later) Payments module — applies money against the invoice.

## Preconditions

- Order confirmed; dispatch recorded (or direct-from-order if the module decision allows).
- Products carry HSN + GST rate (list pending OQ-19; PROPOSED).
- Customer GSTIN, state, and `credit_period_days` known (DEC-018).

## Steps

1. **Accountant** — selects order/dispatch and line items with qty, rate, discount. **System** — builds draft invoice lines. Discount positioning pre/post-GST is OQ-03 (PROPOSED).
2. **(PROPOSED) System** — computes tax: intra-state (UP) → CGST + SGST split; inter-state → IGST. The split rates and exact treatment are OQ-01/OQ-02 (PROPOSED; direction from DEC-009).
3. **System** — issues the invoice: assigns a sequential `INV-001`, `INV-002`, … number (`INV-###` style) inside a single transaction with a unique constraint — no gaps/duplicates (DEC-014).
4. **System** — snapshots the customer's credit period onto the invoice to derive the due date (DEC-018).
5. **System** — renders the GST invoice PDF via @react-pdf/renderer (DEC-006) and stores it through the storage backend (DEC-004).
6. **System** — records invoice totals (subtotal, tax, grand total, outstanding). Subsequent payments are validated so the paid amount never exceeds the total (DEC-012).

## Data effects

- `invoices`, `invoice_items` — created.
- Invoice-number generator/constraint — consumed atomically (DEC-014).
- `attachments`/storage — the PDF is stored via the storage backend (DEC-004).
- `payments` — later rows reference the invoice.

## Inventory effects

None direct — stock already moved via the dispatch workflow (`DISPATCH`, DEC-020); invoicing alone posts no ledger type.

## Financial effects

- Creates the receivable and due date (DEC-018).
- Captures the GST split per DEC-009/state (rates open at OQ-01).
- Enables payment application with the overpayment guard (DEC-012).

## Possible failures & handling

- Numbering collision at issuance — retried/blocked inside the issuing transaction (DEC-014).
- Missing product HSN/GST rate — warn/block until populated (OQ-19).
- Invoice-to-dispatch quantity mismatch — block or flag per module rules.
- Overpayment against the invoice — blocked at payment time (DEC-012).
- Cancellation/credit note (OQ-05) — not implemented until the policy is set (PROPOSED).

## Status changes

- Invoice record: `PROPOSED` (draft) → `APPROVED` (issued) → `IN_PROGRESS` (partially paid) → `COMPLETED` (paid); `DEPRECATED` only once a cancellation policy exists (OQ-05, PROPOSED).
- Concrete `invoice_status` enum values (`draft/issued/partially_paid/paid/cancelled`) — PROPOSED (see `../DATABASE.md`).

## Audit requirements

- Issuing user + issue timestamp; the sequential number is logged.
- PDF generation/version tracking.
- Edits after issuance require notation (who/when) — policy PROPOSED.

## Related documents

- Modules: `../modules/invoicing.md`, `../modules/orders.md`, `../modules/dispatch.md`, `../modules/payments.md`, `../modules/customers.md`, `../modules/products.md`.
- Decisions: DEC-006 (PDF), DEC-009 (state/GST), DEC-012 (overpayment), DEC-014 (numbering), DEC-018 (credit period) — `../DECISIONS.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-01, OQ-02, OQ-03, OQ-04, OQ-05, OQ-19.

## Future extensions

- Per-state tax on branch expansion; e-invoice/IRN support (PROPOSED, OQ-04).
- Credit notes once a policy is set (PROPOSED, OQ-05).
- Financial-year-segment numbering layered on the DEC-014 generator (PROPOSED).