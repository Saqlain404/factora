# Factora — Machines

**Status:** PROPOSED

## Purpose

The machines module is the master list of injection-moulding machines in the plant. Every production batch is assigned exactly one machine, which makes the machine master a mandatory dependency of the production module. Machine capacity and status support batch planning and simple production tracking.

## Responsibilities

- Maintain machine master (code, name, capacity, status).
- Provide the machine reference required on every production batch (DEC-016).
- Display machine usage context on batches for traceability.

## Entities (planned tables)

- `machines` — id, code, name, capacity, unit, status, notes, created_at, updated_at.
- Referenced by `production_batches.machine_id` (NOT NULL).

## Related workflows

- `../workflows/produce-batch.md`

## Inputs

- Machine master data (code, name, capacity, status).
- Assignment of a machine on each batch creation.

## Outputs

- Machine list used by batch forms and production records.
- Machine identity rendered on batch/daily production views.

## Validation rules

- `code` unique, required.
- `name` required.
- `capacity` numeric > 0 when set; unit PROPOSED (e.g. tonnes/clamping force).
- `status` from a fixed set (e.g. operational / maintenance) — exact values PROPOSED.

## Approved business rules

- **DEC-016** (APPROVED) — Every production batch is assigned exactly one machine (mandatory, recorded and displayed).

## Open questions

- `../OPEN-QUESTIONS.md` OQ-14 — whether electricity cost is tracked per machine or per job (influences costing integration).

## Future extensions (PROPOSED)

- Machine-wise production summary and downtime logging.
- Multi-machine batch linking (would need a junction table; not in V1).
- Preventive-maintenance scheduling.

## Definition of done

- [ ] Schema (Drizzle)
- [ ] Zod validation schemas + tests
- [ ] Domain rule tests
- [ ] Migration (Drizzle Kit)
- [ ] Server Actions
- [ ] UI
- [ ] Docs