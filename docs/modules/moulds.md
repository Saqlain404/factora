# Factora — Moulds

**Status:** PROPOSED

## Purpose

The moulds module tracks injection-mould tooling through its lifecycle from requirement to active production. A batch may only run on a mould in the `Active` state, so this module gates production eligibility. Whether moulds are customer-owned or factory-owned affects billing and is an open question.

## Responsibilities

- Maintain mould master (name, code, product link, status, supplier, cost).
- Enforce the strict status flow Required → Ordered → Received → Trial → Active (DEC-015).
- Gate production: only `Active` moulds may be used on a batch.
- Record lifecycle dates (received_at, active_at) for traceability.

## Entities (planned tables)

- `moulds` — id, code, name, product_id, status, supplier_id, cost, received_at, active_at, owner, notes, created_at, updated_at.
- Status enum `mould_status`: `required`, `ordered`, `received`, `trial`, `active` (no other values).

## Related workflows

- `../workflows/mould-lifecycle.md`
- `../workflows/produce-batch.md`

## Inputs

- Mould creation data and lifecycle events.
- Supplier and cost details (for mould allocation in costing).
- Product association (optional until confirmed).

## Outputs

- Mould records with valid lifecycle status used by production batches.
- Blocked-transition errors from the domain function `advanceMouldStatus` (R07).
- Mould ownership/status signals for dispatch of mould-related work.

## Validation rules

- `code` unique, required.
- `name` required.
- `status` must be one of the five enum values only.
- Transitions must follow Required → Ordered → Received → Trial → Active; anything else fails domain validation.
- A batch cannot reference a mould whose status is not `active`.
- `cost` >= 0 when set.

## Approved business rules

- **DEC-015** (APPROVED) — Mould statuses flow strictly; batches run only on `Active` moulds.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-17 — mould ownership (customer-owned vs factory-owned) and whether mould development is billed to customers.

## Future extensions (PROPOSED)

- Mould maintenance/repair records and sub-states (require user approval per DEC-015 note).
- Mould amortization policy feeding `batch_costs` (see OQ-14).
- Mould photos and teardown attachments (object storage).

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs