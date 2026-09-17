# Factora — Business Rules

**Status:** `IN_PROGRESS`

This page records **approved** business rules (what the user decided) and the open ones. Rules must not be invented — see [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md) for anything not yet decided.

## Approved Business Rules

Each approved rule cites the decision (DEC-### — see [DECISIONS.md](./DECISIONS.md)) that locked it in.

### 1. Business location & GST (DEC-009)
- Business state: **Uttar Pradesh**, GST code **09**.
- Invoice tax behavior derives from this (intra-state CGST+SGST split; inter-state IGST — see Open Questions for rate confirmation).

### 2. Costing (DEC-010)
- Costing is **manually entered per batch** (material, labour, electricity, mould allocation, other).
- No automatic costing engine.

### 3. Rejected material (DEC-011)
- Rejected material produced is **absorbed/lost** — treated as cost of the batch, **not** returned to inventory automatically.
- (Applies to finished/batch rejects; raw-material wastage policy is separate — unresolved.)

### 4. Overpayment (DEC-012)
- **Blocked** — a payment that would make the customer's total paid exceed the invoice amount cannot be recorded.

### 5. Dispatch (DEC-013)
- **Partial dispatch is supported** — an order/invoice can be dispatched across multiple shipments.

### 6. Invoice numbers (DEC-014)
- Sequential: `INV-001`, `INV-002`, … generated safely (no gaps/duplicates at issuance).

### 7. Mould lifecycle (DEC-015)
- Strict status flow: `Required → Ordered → Received → Trial → Active`.
- A batch can only run on a mould with status `Active`.

### 8. Machine tracking (DEC-016)
- **Every production batch is assigned exactly one machine** (recorded and displayed).

### 9. Production for stock (DEC-017)
- A batch may be created **without a customer order** ("for stock").

### 10. Credit period (DEC-018)
- Credit period is **configurable per customer**; shown/snapshotted on orders and invoices.

### 11. Raw-material reservation and consumption (DEC-020)
- At batch start: planned consumption is **reserved** (does not reduce physical stock but blocks availability).
- At completion: unit BOM quantity is **consumed** for actual `ok_qty`; any difference between planned and consumed is handled by explicit rules (reject absorbing, wastage policy under review).
- Negative stock is never allowed.

## Rule: "No invented rules"
Anything not listed above is `PROPOSED` or `UNDEFINED` until the user confirms it. Undefined items are collected in [OPEN-QUESTIONS.md](./OPEN-QUESTIONS.md).

## Normalized Rule Catalog

The catalog below marks each rule's status. Approval means **the user explicitly decided**; the rest are for the user to review.

| # | Rule | Status |
| --- | --- | --- |
| R01 | GST state = Uttar Pradesh (code 09) | **APPROVED** |
| R02 | Manual per-batch costing | **APPROVED** |
| R03 | Rejected material absorbed/lost, not re-added | **APPROVED** |
| R04 | Overpayment blocked | **APPROVED** |
| R05 | Partial dispatch supported | **APPROVED** |
| R06 | Sequential invoice numbers INV-### | **APPROVED** |
| R07 | Mould flow Required→Ordered→Received→Trial→Active | **APPROVED** |
| R08 | One machine per batch (mandatory) | **APPROVED** |
| R09 | Production for stock allowed | **APPROVED** |
| R10 | Credit period per customer | **APPROVED** |
| R11 | Negative stock forbidden | **APPROVED** |
| R12 | Reserve at start, consume actual at completion | **APPROVED** |
| R13 | Invoice shows CGST+SGST split (intra-state) | PROPOSED |
| R14 | Batch output requires mould status = active | PROPOSED |
| R15 | Order status transitions | PROPOSED |
| R16 | Reserved-but-unused material return policy | PROPOSED |
| R17 | Wastage/extra consumption allocation per batch | PROPOSED |
| R18 | Purchase receipts require PO immaterial in V1? Supplier bill/invoice matching | PROPOSED |
| R19 | Invoice cancellation / credit note policy | PROPOSED |
| R20 | Stock adjustment authorization level | PROPOSED |
| R21 | QC hold decision workflow (quality data) | PROPOSED |

## Where Rules Live in Code

Each approved rule must have a single home in the codebase:

| Rule | Code location (planned) |
| --- | --- |
| R11 negative stock | DB CHECK + `domain.ts` pure function on ledger |
| R04 overpayment | `modules/payments/domain.ts` |
| R07 mould flow | `modules/moulds/domain.ts` |
| R06 invoice numbering | `modules/invoicing/...` transaction |
| All rules | `domain.ts` pure functions + unit tests |