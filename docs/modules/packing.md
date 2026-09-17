# Factora — Packing

**Status:** BLOCKED

## Purpose

The packing module would record the physical packing details of a dispatch (cartons, counts, weight, vehicle). It is blocked because it is not yet decided whether a packing-list/packing-slip record is needed at all, or whether a simple dispatch note is sufficient.

## Responsibilities

- (Planned) Record packing-list details per dispatch (items, cartons, weights).
- (Planned) Capture vehicle and loading details where applicable.
- (Planned) Reference the dispatch note so goods-out matches physical movement.

## Entities (planned tables)

- `packing_lists` — id, packing_no, dispatch_id, carton_count, gross_weight, net_weight, loaded_at, notes.
- `packing_list_items` — id, packing_list_id, product_id, quantity.
- (Deferred until OQ-15 is answered.)

## Related workflows

- `../workflows/dispatch-and-pack.md`

## Inputs

- Dispatch note references and item quantities.
- Physical carton/weight data confirmed at loading.

## Outputs

- Packing-list records linked to dispatches (if decided).
- Physical-completeness input for dispatch confirmation.

## Validation rules

- (Deferred) `dispatch_id` required; `quantity` integer > 0.
- (Deferred) Packing list quantities consistent with the dispatch note.

## Approved business rules

- **DEC-013** (APPROVED, indirect) — Each dispatch is one shipment of a partially-dispatchable order; a packing list, if built, must reference a specific dispatch.

## Open questions

- `../OPEN-QUESTIONS.md` OQ-15 — is a packing-list/packing-slip record (counts, cartons, vehicle) needed, or just a dispatch note.
- `../DECISIONS.md` P-011 (PROPOSED) — packing-list record scope for physical dispatch.

## Future extensions (PROPOSED)

- Barcode/QR per carton and label printing.
- Truck/vehicle capacity planning.

## Definition of done

- [ ] Unblocked: packing-list decision confirmed (OQ-15)
- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs