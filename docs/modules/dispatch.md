# Factora — Dispatch

**Status:** PROPOSED

## Purpose

The dispatch module records outbound movement of finished goods to customers. Partial dispatch is supported, so an order may ship across multiple dispatch notes and dates. Dispatch is the trigger for `DISPATCH` ledger movement and the basis for invoicing dispatched quantities.

## Responsibilities

- Create dispatch notes against an order (and later an invoice/range).
- Support partial dispatch: track cumulative dispatched vs ordered per line (DEC-013).
- Post `DISPATCH` (−) finished-stock ledger movements.
- Record dispatch metadata (date, vehicle/transporter — fields per OQ-16).
- Provide dispatched quantities to invoicing.

## Entities (planned tables)

- `dispatches` — id, dispatch_no, order_id, customer_id, dispatched_at, status, challan_no, transporter, vehicle_no, driver, remarks.
- `dispatch_items` — id, dispatch_id, product_id, quantity.

## Related workflows

- `../workflows/dispatch-and-pack.md`
- `../workflows/order-to-fulfilment.md`
- `../workflows/invoice-and-collect.md`

## Inputs

- Order and order-item references.
- Finished-stock availability.
- Physical dispatch details (date, transporter, challan/LR).

## Outputs

- Dispatch notes with itemized quantities.
- `DISPATCH` ledger movements (finished-goods module).
- Cumulative dispatch status per order line (feeds invoicing).

## Validation rules

- `dispatch_no` unique, required.
- `order_id` and `customer_id` required.
- At least one `dispatch_item`; `quantity` integer > 0.
- Cumulative dispatched per line must not exceed ordered quantity (otherwise over-dispatch; PROPOSED until confirmed).
- Dispatch cannot exceed available finished stock (negative stock forbidden).
- Transporter/vehicle fields included per OQ-16.

## Approved business rules

- **DEC-013** (APPROVED) — Partial dispatch is supported; an order can be dispatched across multiple shipments.
- **DEC-020** (APPROVED, indirect) — Outbound goods post `DISPATCH` ledger movement.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-16 — who confirms dispatch, and which fields (challan/LR details, transporter) appear on the dispatch note.
- `../DECISIONS.md` P-011 (PROPOSED) — packing-list record scope (physical side of dispatch).

## Future extensions (PROPOSED)

- Dispatch against invoice numbers (invoice-wise dispatch).
- Docket/waybill attachment scans (object storage).
- Return-dispatch (goods return) handling — needs a new DEC.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs