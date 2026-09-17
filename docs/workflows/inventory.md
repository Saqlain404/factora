# Factora — Workflow: Inventory

**Status:** `PROPOSED`

## Purpose

Provide a single, auditable stock record: every movement is a typed row in the `inventory_ledger` with a computed `balance_after` (DATABASE integrity rule 1), only the approved DEC-020 types may fire, negative stock is forbidden (R11), and corrections (`ADJUSTMENT`) require a note and an authorized user. The adjustment authorization level (P-007) is PROPOSED.

## Trigger

Any stock movement: an automatic post from an upstream workflow (procurement receipt, production consumption/output, dispatch) or a manual correction.

## Actors

- Storekeeper — records receipts, dispatches, and adjustment requests.
- Production system — posts consumption/output automatically at completion.
- Admin — second-step authorization for adjustments (P-007, PROPOSED).
- System — computes balances, enforces allowed types.

## Preconditions

- A stock entity exists (raw material or finished product).
- An upstream record exists where the movement is workflow-driven.
- `inventory_ledger` is the sole source of truth; no separately edited stock counters.

## Steps

1. **System** — receives a movement from an upstream workflow (procurement/production/dispatch) or a manual `ADJUSTMENT` request. **System** — validates that the type is within DEC-020 (`PURCHASE_RECEIPT`, `PRODUCTION_CONSUMPTION`, `PRODUCTION_OUTPUT`, `DISPATCH`, `ADJUSTMENT`); anything else is rejected.
2. **(PROPOSED) Admin** — authorizes an `ADJUSTMENT` (2-step: requester + admin) and supplies a note; the required level is P-007.
3. **System** — computes `balance_after` in the same transaction as the movement; the domain function rejects any result below zero (R11).
4. **System** — appends the ledger row with type, qty (±), reference, note, user, and timestamp.
5. **System** — displays current stock as the last `balance_after` per item.

## Data effects

- `inventory_ledger` — one row per movement; `balance_after` is authoritative.
- `raw_materials` (and finished products) — no separate counters; stock is derived from the ledger.
- Upstream records (`purchase_receipts`, `production_batches`, dispatch) — referenced by the movement row.

## Inventory effects

Fires only the approved DEC-020 types:

- `PURCHASE_RECEIPT` (+) — supplier receipt (procurement workflow).
- `PRODUCTION_CONSUMPTION` (−) — raw material consumed at batch completion.
- `PRODUCTION_OUTPUT` (+) — finished goods from a batch.
- `DISPATCH` (−) — finished goods shipped.
- `ADJUSTMENT` (±) — authorized correction.
- `PRODUCTION_RETURN` — reserved, unusable until the user decides (DEC-020).

## Financial effects

- Stock valuation derives from movement quantity × material rate (valuation method OQ-10, PROPOSED).
- `ADJUSTMENT` can write on/off stock value; it requires authorization + note (P-007, PROPOSED).

## Possible failures & handling

- Unknown ledger type — rejected (DEC-020).
- Debit producing a negative balance (R11) — blocked at the DB CHECK and domain level; surface the conflicting movement.
- `ADJUSTMENT` without a note or authorization (P-007) — blocked.
- Two concurrent movements on one item — serialized in a transaction; correctness of `balance_after` preserved.

## Status changes

- Ledger rows are immutable events, not lifecycle-managed records; they carry no workflow status.
- Material/stock records: `APPROVED` (master data); may be `BLOCKED` for a hold if a correction is under investigation (PROPOSED).

## Audit requirements

- Each row records type, qty, `balance_after`, reference, `user_id`, and `at` (DATABASE integrity rule 9).
- Adjustments record requester, note, and authorizing admin (P-007, PROPOSED).

## Related documents

- Modules: `../modules/inventory.md`, `../modules/raw-materials.md`, `../modules/procurement.md`, `../modules/production.md`, `../modules/dispatch.md`.
- Decisions: DEC-020; rules R11/R12 in `../BUSINESS-RULES.md`; integrity rules in `../DATABASE.md`.
- Open questions: `../OPEN-QUESTIONS.md` OQ-08, OQ-09, OQ-10; proposal P-007 in `../DECISIONS.md`.

## Future extensions

- Reclaim/write-off/return-to-supplier ledger types — require a new DEC (DEC-020 reversal path, PROPOSED).
- Batch-level serial/lot tracking of movements (PROPOSED).