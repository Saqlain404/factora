# Factora — Invoicing

**Status:** PROPOSED

## Purpose

The invoicing module issues GST-compliant invoices to customers with sequential `INV-001, INV-002, …` numbers. Given the business state of Uttar Pradesh (GST code 09), invoices split tax as CGST+SGST intra-state and IGST inter-state (split/rates proposed). PDFs are rendered in-process with @react-pdf/renderer.

## Responsibilities

- Issue invoices with sequential, gap-free, duplicate-free numbers (DEC-014).
- Compute totals, discounts and GST splits from line items.
- Render invoice PDFs via @react-pdf/renderer (DEC-006) and store via the storage backend.
- Link invoices to orders/dispatches (partial invoicing follows partial dispatch, DEC-013).
- Derive due dates from the snapshotted credit period (DEC-018).

## Entities (planned tables)

- `invoices` — id, invoice_no, customer_id, order_id (nullable), invoice_date, due_date, subtotal, discount, taxable, cgst, sgst, igst, total, status.
- `invoice_items` — id, invoice_id, product_id, description, hsn, quantity, rate, gst_rate, amount.
- `invoice_number_sequence` — current issued number, used transactionally to issue `INV-###`.

## Related workflows

- `../workflows/invoice-and-collect.md`
- `../workflows/order-to-fulfilment.md`

## Inputs

- Customer master (GSTIN, state, credit period snapshot).
- Dispatched quantities and product/HSN/GST data.
- Confirmed tax split (proposed: CGST+SGST for UP intra-state).

## Outputs

- Issued invoices and PDFs.
- Sequential invoice numbers with uniqueness guaranteed.
- Receivables and due dates for payments and reports.

## Validation rules

- `invoice_no` unique; generated sequentially in a transaction (no gaps/duplicates).
- `customer_id` required; customer GSTIN/state drives tax treatment.
- At least one `invoice_item`; quantity numeric > 0; rate >= 0.
- Tax split: intra-state (UP) CGST+SGST, inter-state IGST — rates pending OQ-01/OQ-02 (PROPOSED).
- `total` = taxable + taxes; overpayment never possible here (payments module enforces DEC-012).
- PDF generation must not fail the invoice issuance (transactional or retried — PROPOSED).

## Approved business rules

- **DEC-014** (APPROVED) — Sequential invoice numbers `INV-001`, `INV-002`, … issued transactionally.
- **DEC-009** (APPROVED) — Business state Uttar Pradesh (GST code 09); invoice tax behaviour derives from it.
- **DEC-006** (APPROVED) — Invoices rendered as PDF with @react-pdf/renderer.
- **DEC-018** (APPROVED, indirect) — Due date computed from the order/customer credit-period snapshot.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-01 — intra-state rates: CGST 2.5% + SGST 2.5% or per-HSN rates.
- `../OPEN-QUESTIONS.md` OQ-02 — inter-state IGST handling and rate source.
- `../OPEN-QUESTIONS.md` OQ-03 — discount on invoice: shown or hidden, pre/post GST.
- `../OPEN-QUESTIONS.md` OQ-04 — accountant-required invoice layout fields (e-invoice QR/IRN likely unnecessary).
- `../OPEN-QUESTIONS.md` OQ-05 — cancellation / credit-note policy for returns.
- `../DECISIONS.md` P-001 (PROPOSED) — CGST+SGST split for intra-state / IGST for inter-state.

## Future extensions (PROPOSED)

- Credit notes and invoice cancellation (P-006 / OQ-05).
- Per-financial-year invoice numbering on the same generator (DEC-014 note).
- E-invoice IRN / QR integration if the client scales (OQ-04).

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs