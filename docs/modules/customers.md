# Factora — Customers

**Status:** PROPOSED

## Purpose

The customers module is the master record for every party buying finished goods from Factora. It stores legal, GST and billing details plus the per-customer credit terms that flow into orders and invoices. Customer state and GSTIN drive whether an invoice is intra-state (UP, CGST+SGST) or inter-state (IGST).

## Responsibilities

- Maintain customer master records (name, contact, addresses, GSTIN, state).
- Store the per-customer credit period that is snapshotted onto orders and invoices (DEC-018).
- Provide the party list used by orders, dispatch, invoicing and payments.
- Capture the registered state used to derive tax behaviour (state code 09 = Uttar Pradesh, DEC-009).

## Entities (planned tables)

- `customers` — id, code, name, contact_person, phone, email, billing_address, shipping_address, state, gstin, credit_period_days, status, created_at, updated_at.

## Related workflows

- `../workflows/onboarding-customer.md`
- `../workflows/order-to-fulfilment.md`
- `../workflows/invoice-and-collect.md`

## Inputs

- Business details: legal name, contact, GSTIN, registered state, addresses.
- Credit terms (payment window in days) per customer.
- Operator-entered master data; optionally an uploaded GST registration certificate.

## Outputs

- Verified customer records consumed by orders, dispatch, invoicing and payments.
- Billing/shipping addresses and GSTIN rendered on GST invoice PDFs.
- Due dates on invoices, computed from the snapshotted credit period.

## Validation rules

- `name` required, non-empty.
- `gstin` matches the Indian GSTIN format (15 characters: state code, PAN, entity code, check digit) when provided.
- `state` required; used to compute intra-state vs inter-state treatment.
- `credit_period_days` integer >= 0 (0 means no credit).
- `code` unique when used as the display key.

## Approved business rules

- **DEC-018** (APPROVED) — Credit period is configurable per customer and snapshotted onto orders/invoices.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-02 — inter-state (IGST) handling and rate source for customers outside Uttar Pradesh.

## Future extensions (PROPOSED)

- Multiple billing/shipping addresses and branch-level GSTIN per customer.
- Multi-state tax handling beyond the first customer's state (DEC-009).
- Payment terms history/audit trail.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs