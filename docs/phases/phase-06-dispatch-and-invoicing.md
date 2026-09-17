# Factora — Phase 06: Dispatch & Invoicing

**Status:** `PROPOSED` (CGST/SGST split is the one open blocking item — OQ-01)

## Business purpose

Getting goods out the door and getting paid start with legally recognizable paperwork. Dispatch supports partial shipments across dates (DEC-013); deliveries deplete finished stock via the `DISPATCH` ledger type (DEC-020). Invoices are GST-compliant for the UP business (state code `09`, DEC-009), numbered sequentially without gaps or duplicates (`INV-001`…, DEC-014), carry the customer's credit period snapshot (DEC-018), and render as PDFs (DEC-006). Invoice line tax behaviour depends on the pending CGST/SGST decision (OQ-01 / P-001).

## Scope

**In scope**

- Dispatch notes: date, customer/order, products+qty, partial supported (DEC-013).
- Finished-goods stock deduction via `DISPATCH` ledger entries at dispatch time.
- Invoice creation from an order (or direct), with sequential `INV-###` numbers issued transactionally (DEC-014).
- GST line items driven by UP/09 (intra-state CGST+SGST split, inter-state IGST) once OQ-01/OQ-02 are settled.
- PDF invoice generation with @react-pdf/renderer (DEC-006); view/download.
- Invoice status (draft/issued/partially paid/paid/cancelled) per DATABASE.md.

**Out of scope**

- Payment recording/aging — Phase 07.
- E-invoice IRN/QR and cancellation/credit-note policy — pending OQ-04/OQ-05 (P-006).
- Discount handling rules — pending OQ-03.
- Packing lists — BLOCKED (OQ-15).
- Multi-state / multi-location registration — single UP business in V1.

## Current state

Nothing built yet. No dispatch, invoice, or PDF code exists; the `DISPATCH` ledger type is defined only in the planned enum (DEC-020). Finished-product stock (`PRODUCTION_OUTPUT`) arrives with Phase 05.

## Features / user stories

- As a dispatcher, I can create a dispatch note for part of an order's quantity, so partial shipments are tracked across multiple dates (DEC-013).
- As a dispatcher, I can see how much of an order has shipped and how much remains, so pending-dispatch is always visible.
- As a storekeeper, a dispatch deducts finished stock automatically through the ledger, so stock never drifts from dispatch (DEC-020).
- As an accountant, I can issue an invoice that gets the next sequential number automatically, so numbering has no gaps or duplicates (DEC-014).
- As an accountant, I can generate and download a GST invoice PDF, so bills can be printed or emailed (DEC-006).
- As an accountant, invoice due date reflects the customer's credit period snapshot, so receivables are predictable (DEC-018).
- As a user, I can view which batches/orders a delivery covers, so traceability from invoice back to production exists.

## Database changes

New Drizzle tables (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `dispatch_notes` | `id`, `dispatch_no` UNIQUE NOT NULL, `order_id` FK nullable, `customer_id` FK NOT NULL, `dispatch_date` NOT NULL, `vehicle_/lr_details`, `transporter`, `status`, `created_by` FK | unique dispatch no |
| `dispatch_items` | `id`, `dispatch_note_id` FK NOT NULL, `product_id` FK NOT NULL, `qty` NOT NULL (> 0), `from_batch_id` FKNullable | qty > 0 CHECK |
| `invoices` | `id`, `invoice_no` UNIQUE NOT NULL (`INV-###`), `customer_id` FK NOT NULL, `order_id` FK nullable, `invoice_date` NOT NULL, `due_date` NOT NULL, `credit_period_days` snapshot NOT NULL, `status` NOT NULL (draft/issued/partial/paid/cancelled), `total_before_tax`, `cgst`, `sgst`, `igst`, `total` NOT NULL, `cancelled_at` | unique invoice no; due >= date; snapshot per DEC-018 |
| `invoice_items` | `id`, `invoice_id` FK NOT NULL, `product_id` FK NOT NULL, `description`, `qty` NOT NULL (> 0), `rate` NOT NULL (>= 0), `hsn_code`, `discount`, `taxable`, `tax_splits` (cgst/sgst/igst) | qty/rate CHECKs |

Ledger usage: `DISPATCH` (−) written per dispatch item. Treated entirely as additive. GST rate fields structured so OQ-01 (rate split per HSN) can be seeded without schema changes.

## Server actions / APIs

- `createDispatchNote` — validates stock availability + partial qty, writes items + `DISPATCH` ledger rows (transaction).
- `getOrderDispatchProgress` — shipped vs remaining per order (DEC-013 reads).
- `issueInvoice` — transactional next number (`INV-###`), snapshots credit period (DEC-018), computes tax per OQ-01, sets status issued.
- `generateInvoicePdf` — renders PDF via @react-pdf/renderer (DEC-006); returns download/view.
- `cancelInvoice` — allowed only per OQ-05 / P-006 (proposed; blocked until approved).
- `getInvoice` / `listInvoices` — reads incl. PDF link and payment state.

## UI pages & components

- `app/(dashboard)/dispatch/` — dispatch note list + create form (partial qty per order/view remaining).
- Order detail: dispatch progress summary (shipped vs remaining) per DEC-013.
- `app/(dashboard)/invoices/` — invoice list with status; issue flow triggering next `INV-###`.
- Invoice detail: line items, GST/totals, due date, download-PDF and PDF preview.
- PDF template component rendered by @react-pdf/renderer (DEC-006).

## Validation & business rules

- Zod: postive qty on dispatch items; rate/vals >= 0; invoice items complete; customer present.
- Partial dispatch allowed in unlimited shipments (DEC-013 / R05); dispatch qty never exceeds remaining order qty.
- Sequential invoice numbers, no gaps/duplicates, generated in a transaction at issue time (DEC-014 / R06 — the R06 test in TESTING.md covers INV-001 → INV-002).
- GST behaviour derives from state code 09 = UP (DEC-009 / R01): intra-state CGST+SGST split (pending OQ-01 / P-001), inter-state IGST (pending OQ-02).
- Credit period snapshotted from customer to invoice; due date = invoice + credit days (DEC-018).
- `DISPATCH` ledger entries keep finished stock non-negative (R11).
- No emission of e-invoice IRN/QR until OQ-04 decides it.

## Edge cases

- Two invoices issued in parallel → numbering transaction serializes; no duplicate `INV-###` (R06).
- Dispatch exceeds remaining order qty → rejected; partial remainder shown.
- Dispatch after invoice, or invoice after dispatch — order of operations per workflow docs; the checklist must define the primary flow.
- Inter-state customer (non-UP) → IGST path pending OQ-02; without an answer, block or use CGST+SGST default? (needs approval).
- Cancelling an issued invoice with payments → data-integrity question, needs OQ-05 / P-006.
- Discount before/after GST → per OQ-03; keep `discount` field staging the data until decided.

## Tests

- Domain: sequential numbering R06 (two issues → INV-001, INV-002, no duplicates) from TESTING.md; partial dispatch R05 max-qty checks; credit-period due-date computation (DEC-018).
- Zod: dispatch, invoice, invoice-item schemas fail cases (zero qty, negative rate).
- PDF: deterministic rendering smoke test for a fixed invoice payload (DEC-006).
- Actions (mock DB): `issueInvoice` unique-number transaction; `createDispatchNote` writes `DISPATCH` rows and blocks over-dispatch.
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] Dispatch notes support partial quantities; running totals shown per order.
- [ ] Dispatch writes `DISPATCH` ledger entries and cannot over-dispatch an order.
- [ ] Invoice issuance assigns sequential, unique `INV-###` numbers atomically.
- [ ] Invoice due date derived from customer credit period snapshot.
- [ ] GST lines (CGST+SGST intra-state / IGST inter-state) render once OQ-01/OQ-02 answered.
- [ ] GST invoice PDF downloads correctly via @react-pdf/renderer.
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 03 customers + credit period (DEC-018); Phase 03 products.
- Phase 05 finished-product stock (`PRODUCTION_OUTPUT`) available to be dispatched.
- Approval of OQ-01 (CGST split) before tax math is finalized; OQ-02, OQ-03, OQ-04, OQ-05 otherwise.

## Risks

- Tax-split answer changes the invoice math and PDF — schema is additive-proof, but tests/Pdf change in place (do not finalize PDF before OQ-01).
- PDF compliance expectations (IRN/QR, mandatory invoice fields) could outgrow V1 — OQ-04 gates scope.
- Invoice cancellation without an approved policy can corrupt receivable state — OQ-05/P-006.
- Dispatch-before-invoice vs invoice-before-dispatch inconsistency in books — requires the workflow doc + checklist to be authoritative.

## Questions requiring approval

- OQ-01 — intra-state (UP) CGST 2.5% + SGST 2.5% or per-HSN rates (P-001).
- OQ-02 — inter-state IGST handling and rate source.
- OQ-03 — discount display and pre/post-GST arithmetic.
- OQ-04 — invoice layout fields (e-invoice QR / IRN needed?).
- OQ-05 — invoice cancellation / credit-note policy (P-006).
- P-002 — order status flow (Open → In Production → Partially Dispatched → Invoiced/Closed).

## Definition of done

- [ ] Zod schema written and unit-tested (fail cases included).
- [ ] domain.ts rule functions unit-tested (sequential numbering, partial dispatch, due-date).
- [ ] DB migration added (additive): `dispatch_notes`, `dispatch_items`, `invoices`, `invoice_items`.
- [ ] Server Actions validate + write (dispatch, issue invoice, PDF, queries).
- [ ] UI pages/components render + wired (dispatch form, invoice list/detail, PDF view).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (dispatch/invoicing module docs, workflow).