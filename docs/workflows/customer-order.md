# Factora — Workflow: Customer Order

**Status:** `PROPOSED`

## Purpose

Capture a customer's purchase request as an order, run a credit check against the customer's configured payment terms, confirm the order, and drive it through fulfilment (production and/or dispatch), invoicing, and payment. The credit-period snapshot (DEC-018) and fulfilment behaviour (DEC-013, DEC-017) are approved; order and invoice status transitions remain open (P-002).

## Trigger

A customer places a purchase request (verbal, email, or phone) for finished products.

## Actors

- Sales/operator — captures and confirms the order.
- Manager — approves the order and its credit posture.
- System — validates rules, tracks status, links downstream documents.
- (Later) Production supervisor — picks the order up for manufacture.

## Preconditions

- Customer master exists (state, GSTIN, `credit_period_days` set — DEC-018).
- Products ordered exist with a rate (and, if to be manufactured, an Active mould + BOM).
- (For dispatch-from-stock) finished-goods stock exists.

## Steps

1. **Operator** — captures the order: customer, order date, line items (product, qty, rate), requested delivery date. **System** — creates `orders` + `order_items`; snapshots the customer's `credit_period_days` onto the order (DEC-018).
2. **(PROPOSED) System** — computes the expected due date from invoice date + credit period and flags the order if the customer has overdue outstanding. Blocking on a credit limit is not approved (no credit-limit rule exists yet).
3. **Manager** — confirms the order. **System** — advances order status (transition set per P-002 is PROPOSED). The confirmed order becomes a valid source for production (DEC-017) and dispatch (DEC-013).
4. **Production supervisor** — optionally creates one or more production batches against order items, or links for-stock batches (DEC-017). **System** — reserves/consumes raw material per the batch rules (see the production workflow).
5. **Storekeeper** — dispatches all or part of the order quantity across one or more shipment dates (DEC-013). **System** — tracks running dispatched totals per line.
6. **Accountant** — issues the invoice from order/dispatch (see the invoicing workflow). **System** — applies the DEC-018 credit period to compute the due date.
7. **Operator** — records the customer payment against the invoice. **System** — blocks overpayment (DEC-012) and updates the outstanding.

## Data effects

- `customers` — read (credit period for the snapshot).
- `orders`, `order_items` — inserted at capture.
- `production_batches` — optional linkage (DEC-017).
- `invoices`, dispatch records, `payments` — downstream records reference the order.

## Inventory effects

None fire at order capture itself. Downstream:

- `PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT` — via production (see the production workflow).
- `DISPATCH` — via dispatch onto finished-goods stock (see the dispatch workflow).

## Financial effects

- Order confirmation does not post money; it commits a sales-pipeline quantity.
- Invoicing later creates the receivable; the captured credit period sets the due date (DEC-018).
- Payments reduce receivables; overpayment is blocked (DEC-012).

## Possible failures & handling

- No Active mould for a make-to-order product (DEC-015) — block batch creation until the mould is Activated.
- Insufficient finished-goods stock for dispatch — block the dispatch step; allow partial dispatch (DEC-013).
- Missing product rate or customer credit period — warn/block confirmation.
- Order quantity larger than the batch plan (OQ-11/OQ-12) — surface and require a manual plan (PROPOSED).
- Overpayment attempt at the payment step — blocked (DEC-012).

## Status changes

- Order record: `PROPOSED` → `APPROVED` → `IN_PROGRESS` → `COMPLETED`; `BLOCKED` on a credit hold or unavailable mould. The concrete order-transition set (P-002) is `PROPOSED`.
- Invoice record status follows the invoicing status set (`PROPOSED` until approved).

## Audit requirements

- Capture user + timestamp for creation, confirmation, and any later status change.
- Credit-period snapshot retained at order level; any override must record who/when (policy PROPOSED).

## Related documents

- Modules: `../modules/orders.md`, `../modules/customers.md`, `../modules/production.md`, `../modules/dispatch.md`, `../modules/invoicing.md`, `../modules/payments.md`.
- Decisions: DEC-012 (overpayment), DEC-013 (partial dispatch), DEC-017 (production for stock), DEC-018 (credit period) — `../DECISIONS.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-11, OQ-12 (order/batch planning); P-002 in `../DECISIONS.md`.

## Future extensions

- Credit limit per customer with automatic order hold (PROPOSED).
- Delivery-schedule tracking with per-date commitments (PROPOSED).
- Order amendment / cancellation policy (PROPOSED).