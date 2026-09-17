# Factora — Open Questions

**Status:** `OPEN`

Tracked questions that need the user's answer before the related work can be considered approved. Decisions are recorded in [DECISIONS.md](./DECISIONS.md).

## 1. GST / Invoicing

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-01 | Intra-state (UP) invoices: CGST 2.5% + SGST 2.5%, or other rates per product HSN? | Invoice line items + totals | Invoicing phase |
| OQ-02 | Inter-state: confirm IGST handling and rate source | Multi-state dispatch (few cases?) | Invoicing phase |
| OQ-03 | Do discount amounts appear on invoice, and are they pre- or post-GST? | Invoice maths | Invoicing phase |
| OQ-04 | Invoice layout fields required by the accountant? (e.g., e-invoice QR, IRN — likely NOT needed at this scale) | PDF template finalization | PDF template |
| OQ-05 | Invoice cancellation / credit-note policy if a customer returns goods? | Rare but blocking decision | Invoicing |

## 2. Raw Material / Procurement

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-06 | Does a purchase require a PO first, or can receipts be entered without PO (simplify)? | Procurement module shape | Procurement |
| OQ-07 | Supplier bill (bill no./date) matching against purchase receipts — required or optional? | Supplier ledger, GST credit matching | Procurement |
| OQ-08 | ~~Wastage folded into actual consumption / reject absorption~~ | — | Production — **RESOLVED — see DEC-024** |
| OQ-09 | ~~Reserved-but-unused material auto-returns to stock (bookkeeping; never deducted at start)~~ | — | Production — **RESOLVED — see DEC-024** |
| OQ-10 | Rate updates: when a new purchase price differs from current rate, is the stock valued at moving average, FIFO, or latest? | Costing & stock value | Inventory/Costing |

## 3. Production / Batch

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-11 | ~~plan_qty manual, prefilled from order when linked~~ | — | Production — **RESOLVED — see DEC-023** |
| OQ-12 | ~~Zero-or-one order per batch; many batches per order~~ | — | Production — **RESOLVED — see DEC-023** |
| OQ-13 | Is an in-process QC hold/release step required, or is QC only reporting (no gating)? | Quality module scope | Quality phase |
| OQ-14 | ~~batch_costs = material, labour, electricity, mould allocation, other = total~~ | — | Production — **RESOLVED — see DEC-025** |

## 4. Dispatch / Packing

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-15 | Is a packing list / packing slip record needed (counts, cartons, vehicle) or just a dispatch note? | Packing module scope | Packing |
| OQ-16 | Who confirms dispatch (challan/lr details, transporter)? Which fields on the dispatch note? | Dispatch form | Dispatch |

## 5. Moulds

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-17 | Mould tracking: customer-owned vs factory-owned billing/reimbursement — does the factory bill mould development to customers? | Mould masters + invoices | Mould module |

## 6. Product / BOM

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-18 | Is the BOM per product fixed, or does a product sometimes vary material per order? | BOM versioning | BOM module |
| OQ-19 | HSN codes + GST rates per item — does the customer have a list, or will we use generic codes? | Seed data | BOM/Products |

## 7. Quality

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-20 | What QC parameters exist (dimension, weight, visual)? Is reject recorded at batch level only, or per-part-sample? | Quality schema | Quality phase |

## 8. Reports / Dashboard

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-21 | Which reports does the owner actually want day-1 (stock, pending orders, party outstanding, batch-wise costing, production summary)? | Reports priorities | Reports phase |
| OQ-22 | Dashboard KPIs (low-stock alerts, open dispatch, receivables) — confirm the list. | Dashboard widgets | Dashboard phase |

## 9. Deployment & Admin

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-23 | Confirm production domain is `factoraa.com` and the deployment timeline for Vercel. | DNS/env | Deployment |
| OQ-24 | Role structure: admin / manager / user — confirm who has each permission. | Roles UI | Permissions |

## 10. Product / Brand

| # | Question | Why it matters | Blocks |
| --- | --- | --- | --- |
| OQ-25 | Are brand colors/logo approved, or keep temporary text-based identity? | Branding assets | UI polish (not feature) |

## How to Resolve

For each OQ: the user gives a definitive answer → create a `DEC-###` entry (or amend existing) in [DECISIONS.md](./DECISIONS.md), update the relevant docs, then update this file's status to `RESOLVED — see DEC-###`.