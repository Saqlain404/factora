# Factora — Phase 10: Quality & Packing

**Status:** `BLOCKED`
**Blocked by:** No quality spec from the customer (OQ-13, OQ-20); no packing/scoping decision (OQ-15, P-011).

## Business purpose

Quality and packing are on the roadmap but cannot be scoped yet. The customer has not shared an in-process QC specification — whether QC gates production (hold/release) or is only reporting, and which parameters (dimension, weight, visual) and sampling level apply — so building a schema would be guessing. Similarly, whether a formal packing list/slip (cartons, counts, vehicle) is required beyond a dispatch note has not been confirmed. This phase exists to restate what must be decided before any quality or packing work starts.

## Scope

**In scope (once unblocked)**

- Quality module: parameters, sample/part records, batch-level or per-part reject recording, and (per OQ-13) hold/release workflow.
- Packing module: packing list/record tied to dispatch (per OQ-15 / P-011).

**Out of scope (until approved)**

- Any quality or packing tables/actions/UI while BLOCKED.
- Automatic reclaim of rejected material (DEC-011 keeps rejects absorbed/lost; `PRODUCTION_RETURN` remains reserved) — a second decision would be required.
- Any expansion of the DEC-020 inventory transaction types for packing/returns.

## Current state

Nothing built yet. Quality and packing are referenced only as planned modules in ARCHITECTURE.md/PRODUCT.md and as open questions (OQ-13, OQ-15, OQ-16, OQ-20). Production (Phase 05) currently records `rejected_qty` at batch level as the only quality-adjacent data point, per DEC-011.

## Features / user stories

- As a QC operator (once unblocked), I can record inspection results against a batch, so reject reasons are attributable (subject to OQ-13/OQ-20).
- As a supervisor (once unblocked), I can place a batch on QC hold or release it, if the customer confirms a gating workflow (OQ-13 / P-008).
- As a dispatcher (once unblocked), I can record packing details (cartons, counts, vehicle) before dispatch, if the customer confirms a packing list is needed (OQ-15 / P-011).
- As an owner, I know exactly why a batch's `rejected_qty` occurred, so process issues are visible.

## Database changes

None until unblocked. When approved, expected tables (pending answers):

| Table | Key columns (tentative) | Notes |
| --- | --- | --- |
| `quality_checks` | `batch_id` FK, `parameter`, `value`, `result` (pass/fail), `checked_by` FK, `checked_at` NOT NULL | depends on OQ-13 (per-part vs batch) + OQ-20 (parameter list) |
| `packing_lists` | `dispatch_note_id` FK, `cartons`, `counts`, `vehicle`, `notes` | only if P-011 approved (OQ-15) |

No migration is generated while BLOCKED — adding speculative tables would violate the no-invented-rules policy.

## Server actions / APIs

- None until unblocked.
- Once approved: QC record/hold/release actions (per OQ-13) and packing-list create/attach (per OQ-15) — designed at unblock time to reuse existing patterns (Zod-validated actions + additive migration).

## UI pages & components

- None until unblocked. Tentative: QC entry screen on the batch detail page; packing section on the dispatch note form.
- Do not allocate UI work until the module scope is approved.

## Validation & business rules

- Keep DEC-011: rejected material is absorbed/lost; a future reclaim flow is a new decision with a new `PRODUCTION_RETURN`-type approval (DEC-020 reserved).
- Hold/release workflow (if approved) must not break the approved batch lifecycle (in_progress/completed/cancelled) — design a compatible transition.
- Packing must stay consistent with partial dispatch (DEC-013) if a packing list locks quantities.

## Edge cases

- QC hold meets an order deadline with no release in time → prod/ops decision point; workflow must define an escalation default.
- Rejects measured per-part-sample vs batch-level changes schema shape entirely (OQ-20) — do not pre-build.
- A packing list that disagrees with the dispatch note quantity → must reconcile or block at dispatch.
- Quality data on completed batches (already absorbed as cost) cannot be "un-rejected" without a new inventory decision (DEC-011).

## Tests

- None until unblocked.
- On unblock, mirror the standard DoD: ontology/Zod/domain/action tests for the approved QC and packing rules (parameter validity, hold/release transitions, packing-vs-dispatch qty match).

## Acceptance criteria

- [ ] User answered OQ-13 (is QC gating or reporting-only?) and OQ-20 (parameter list + sampling).
- [ ] User answered OQ-15/P-011 (is a packing list required? which fields?).
- [ ] Work restarts from the approved scope; speculative schema avoided.
- [ ] `rejected_qty` continues to follow DEC-011 unchanged until a new decision.

## Dependencies

- Answers to OQ-13, OQ-15, OQ-16, OQ-20 (and P-008/P-011) from the customer.
- Phase 05 production batches (the QC subject) and Phase 06 dispatch notes (the packing subject).

## Risks

- Building a QC schema without a spec produces the wrong model and locks the customer into our guess.
- A hold/release gating decision changes production completion behavior (Phase 05) — late changes ripple backwards.
- Packing is scope creep if the customer only needs a dispatch note — confirming P-011 prevents over-build.
- Reclaim wishes would expand the approved ledger type set (DEC-020) — a separate approval is mandatory.

## Questions requiring approval

- OQ-13 — in-process QC hold/release required, or reporting-only? (P-008)
- OQ-15 — packing list/slip record needed, or just a dispatch note? (P-011)
- OQ-16 — who confirms dispatch (challan/LR details, transporter) and which fields?
- OQ-20 — QC parameters and per-part vs batch-level recording.

## Definition of done

- [ ] Schema + Zod tests — not applicable while BLOCKED (no speculative schema).
- [ ] domain tests — not applicable while BLOCKED.
- [ ] Migration (additive) — none while BLOCKED.
- [ ] Actions — none while BLOCKED.
- [ ] UI — none while BLOCKED.
- [ ] `npx tsc --noEmit` and `npm run lint` stay green (no code touched).
- [ ] Docs updated — phase page marks unblocking prerequisites once the answers arrive.