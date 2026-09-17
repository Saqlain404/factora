# Factora — Workflow: Mould Procurement

**Status:** `APPROVED`

## Purpose

Bring a mould from need to production-ready use, strictly through Required → Ordered → Received → Trial → Active (DEC-015). A mould only becomes usable in production batches once `Active` (DEC-015). Mould billing to the customer remains an open question (OQ-17).

## Trigger

A product requires mould tooling that does not yet exist, or engineering flags a new tool needed; the mould is logged as `Required`.

## Actors

- Mould owner (manager) — raises the requirement, orders, activates.
- Supplier — fabricates/delivers the mould.
- Production supervisor — coordinates trial runs.
- System — enforces transition rules (DEC-015).

## Preconditions

- Supplier master exists (or one is created at order time).
- Product to be moulded is defined (or being defined).
- A mould record exists in status `Required` (or is created here).

## Steps

1. **Mould owner** — raises the requirement: product, mould name, expected supplier candidate. **System** — creates the mould record in status `Required` (DEC-015).
2. **Mould owner** — issues the order to the supplier: cost, delivery milestone. **System** — transitions the mould to `Ordered` (DEC-015); records the supplier and agreed cost. *(Whether the factory bills mould development to the customer — OQ-17 — is PROPOSED.)*
3. **Mould owner / storekeeper** — records receipt when the tool arrives: date, supplier bill/challan references. **System** — transitions the mould to `Received` (DEC-015); stores attachments.
4. **Production supervisor** — runs the trial moulding, records trial notes and sample results. **System** — transitions the mould to `Trial` (DEC-015); stores the trial notes with user + timestamp.
5. **Mould owner** — approves the trial outcome. **System** — transitions the mould to `Active` (DEC-015), sets `active_at`. The mould is now usable in production batches.

## Data effects

- `moulds` — status transitions and stamps (`received_at`, `active_at`), supplier, cost.
- `attachments` — trial notes/reports linked to the mould.
- `invoices` — only if mould development is billed to the customer (OQ-17, PROPOSED).

## Inventory effects

None. Mould acquisition does not consume or create stock in the `inventory_ledger`; no DEC-020 ledger type fires. Mould cost is instead captured as a manual cost item on later batches (DEC-010).

## Financial effects

- Mould procurement cost is recorded on the mould and amortized as a manual `batch_costs` allocation per batch (DEC-010).
- Direct billing of mould development to the customer is unresolved (OQ-17).

## Possible failures & handling

- Invalid transition (e.g., skipping `Received`, or `Active` before `Trial`) — blocked by the domain function `transitMould` (DEC-015).
- Batch creation targeting a non-`Active` mould — blocked (DEC-015).
- Supplier delay — keep mould `Ordered`; flag the record as `BLOCKED` if the delay needs attention.
- Failed trial — the mould stays `Trial`; re-test or send back for supplier rework (rework policy PROPOSED).

## Status changes

- Domain enum `mould_status` (fixed by DEC-015): `required → ordered → received → trial → active`.
- Record status semantics: `PROPOSED` while `Required`/`Ordered`, `IN_PROGRESS` at `Trial`, `APPROVED` once `Active`, `BLOCKED` for supplier/trial delays.

## Audit requirements

- Every transition records who did it and when; `received_at` and `active_at` are stamped.
- Trial notes carry user + timestamp.
- Supplier/cost fields changed only by authorised roles, with an audit trail.

## Related documents

- Modules: `../modules/moulds.md`, `../modules/suppliers.md`, `../modules/production.md`, `../modules/invoicing.md` (possible mould billing — OQ-17).
- Decisions: DEC-010 (mould allocation as batch cost), DEC-015 (mould lifecycle) — `../DECISIONS.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-17.

## Future extensions

- Mould billing/reimbursement to the customer per OQ-17 (PROPOSED).
- Maintenance / rework history and sub-states (PROPOSED).
- Mould shot-count tracking to drive amortization (PROPOSED).