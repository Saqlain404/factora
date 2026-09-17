# Factora — Orders

**Status:** PROPOSED

## Purpose

The orders module captures customer orders and their line items (product, quantity, rate, discount). It carries a snapshot of the customer's credit period and drives fulfilment — production, dispatch, invoicing and collection. Orders may be partially fulfilled because partial dispatch is supported.

## Responsibilities

- Create and maintain customer orders with order items.
- Snapshot the customer's credit period onto the order (DEC-018).
- Track order status through the fulfilment lifecycle (transition set PROPOSED, P-002).
- Link orders to optional production batches and one or more invoices/dispatches.

## Entities (planned tables)

- `orders` — id, order_no, customer_id, order_date, status, credit_period_days (snapshot), notes, created_at, updated_at.
- `order_items` — id, order_id, product_id, quantity, rate, discount.

## Related workflows

- `../workflows/order-to-fulfilment.md`

## Inputs

- Customer details and per-customer credit terms.
- Product, quantity, rate and discount per line.
- Dispatch/production progress used to derive status.

## Outputs

- Order records and line items consumed by production, dispatch and invoicing.
- Scheduled/due dates derived from the credit-period snapshot.
- Fulfilment status signals (proposed set: Open → In Production → (Partial) Dispatched → Invoiced/Closed).

## Validation rules

- `order_no` unique, required.
- `customer_id` required, must exist.
- At least one `order_item` required; `quantity` integer > 0.
- `rate` numeric >= 0; `discount` numeric >= 0 and <= rate (per-line, PRE/POST GST per OQ-03).
- `credit_period_days` snapshotted from the customer at order time.

## Approved business rules

- **DEC-018** (APPROVED) — Credit period is captured per customer and snapshotted onto the order.
- **DEC-013** (APPROVED, indirect) — An order may be dispatched across multiple shipments, so order fulfilment is quantity-tracking based.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-12 — can one order span multiple batches and can one batch cover multiple orders.
- `../OPEN-QUESTIONS.md` OQ-03 — discount display and pre/post-GST treatment on invoices.
- `../DECISIONS.md` P-002 (PROPOSED) — order status flow and transitions.

## Future extensions (PROPOSED)

- Order confirmation/acknowledgement PDFs.
- Delivery-date tracking and dispatch planning.
- Revision/history of order lines and rate negotiation.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs