# Factora — Phase 00: Discovery & Decisions

**Status:** `IN_PROGRESS` (documentation largely done; live decision log and open-questions list remain)

## Business purpose

Before any code, capture how the first customer actually runs their business and lock down the decisions that shape every later phase. Factora is built as a commercial product (one product, many customers) but every structural choice is validated against the first customer's real injection-moulding operation in Uttar Pradesh. This phase documents the business, records binding decisions in [DECISIONS.md](../DECISIONS.md), normalizes approved rules in [BUSINESS-RULES.md](../BUSINESS-RULES.md), and captures what is still unknown in [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

## Scope

**In scope**

- Document the first customer's business model (make-to-order injection moulding, customer-owned moulds, factory supplies resin + labour + machine).
- Record approved decisions as DEC-001…DEC-020 in [DECISIONS.md](../DECISIONS.md).
- Normalize approved business rules and their code-home into [BUSINESS-RULES.md](../BUSINESS-RULES.md).
- Track every unresolved item as an open question (OQ) with the phase it blocks.
- Capture product identity, stack, architecture, database, security, testing, deployment, and file-storage strategies (the docs under `docs/`).

**Out of scope**

- Any application code (no features are built in this phase).
- Any database migration.
- Any deployment, DNS, or environment configuration.
- Inventing business rules the user has not shared — unknown items stay as open questions.

## Current state

- [PRODUCT.md](../PRODUCT.md) describes the first customer business model: make-to-order injection moulding, customer-owned moulds, factory provides resin + labour + machine time, GST state Uttar Pradesh (code `09`), manual per-batch costing, rejected material absorbed/lost.
- [DECISIONS.md](../DECISIONS.md) records 20 approved decisions (DEC-001…DEC-020) and 12 proposals (P-001…P-012) awaiting approval.
- [BUSINESS-RULES.md](../BUSINESS-RULES.md) carries the normalized rule catalog (R01…R21) distinguishing APPROVED from PROPOSED.
- [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) tracks OQ-01…OQ-25 with the phase each one blocks.
- Supporting strategy docs exist: ARCHITECTURE, DATABASE, SECURITY, TESTING, DEPLOYMENT, FILE-STORAGE, plus the docs README.
- No application code, schema, or deployment exists yet from this phase.

## Features / user stories

- As an operator, I can explain how a typical order runs from customer request to dispatch so the software matches the real workflow.
- As an owner, I can confirm costing is entered manually per batch, so no automatic costing engine is built (DEC-010).
- As an owner, I can confirm rejected material is treated as a cost of the batch, so no automatic re-stock of scrap is built (DEC-011).
- As an operator, I can record one machine per production batch, so machine-level traceability is possible (DEC-016).
- As an owner, I can produce for stock without a customer order, so forward building is supported (DEC-017).
- As an accountant, I can rely on sequential invoice numbers and GST behavior derived from the UP state code (DEC-009, DEC-014).
- As a product team, I can look up any approved or proposed rule in one place, so nothing is invented silently.

## Database changes

None. This phase produces no schema; the first migration arrives with the phase-01/02 foundation work.

## Server actions / APIs

None. Documentation-only phase.

## UI pages & components

None. Documentation-only phase.

## Validation & business rules

- Rule: "no invented rules" — anything not in [BUSINESS-RULES.md](../BUSINESS-RULES.md) is `PROPOSED` or `UNDEFINED` until the user confirms it.
- Approved rules captured: R01 (GST state UP/code 09), R02 (manual costing), R03 (reject absorbed/lost), R04 (overpayment blocked), R05 (partial dispatch), R06 (sequential INV-###), R07 (mould flow), R08 (one machine per batch), R09 (production for stock), R10 (credit period per customer), R11 (negative stock forbidden), R12 (reserve at start / consume actual at completion).
- Proposed rules stay flagged (R13…R21) pending user approval.

## Edge cases

- A proposed rule is easy to mistake for approved — the catalog must always mark status explicitly.
- Customer-owned moulds raise a billing question (does the factory bill mould development?) that cannot be decided without the user (OQ-17).
- Whether POs are mandatory before receipts, and whether supplier bills are matched, change the procurement design (OQ-06, OQ-07).
- The CGST/SGST split for intra-state UP invoices is specified only as a proposal (P-001 / OQ-01).
- The production domain must be `factoraa.com` with the product name **Factora** — the extra "a" appears only in the domain.

## Tests

- No code in this phase, so no automated tests.
- Verification is a documentation review: decisions carry IDs, rules cite decisions, and every open question names the phase it blocks.

## Acceptance criteria

- [ ] [DECISIONS.md](../DECISIONS.md) records all approved decisions with ID, date, rationale, impact, and reversal.
- [ ] Proposals and open questions are explicitly marked as not-decided.
- [ ] [BUSINESS-RULES.md](../BUSINESS-RULES.md) catalog marks each rule APPROVED vs PROPOSED.
- [ ] Every OQ states why it matters and which phase it blocks.
- [ ] [PRODUCT.md](../PRODUCT.md) names the product **Factora** and the first customer's business model accurately.
- [ ] No business rule was invented — unknowns are tracked, not assumed.

## Dependencies

- Access to the user for decisions and clarifications (primary dependency of this phase).

## Risks

- Unresolved open questions that later block whole phases (quality is already BLOCKED by OQ-13/OQ-20).
- A decision being made implicitly in code later without a DEC entry (mitigated by the decision log + DoD checklist).
- Documenting assumption as fact — mitigated by the "no invented rules" rule and statuses.

## Questions requiring approval

- All open questions remain live: OQ-01…OQ-25 (see [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md)).
- All proposals await approval: P-001…P-012 (see [DECISIONS.md](../DECISIONS.md)).

## Definition of done

- [ ] Double-check the decision log is updated (schema + zod tests + domain tests not applicable to a docs-only phase).
- [ ] All downstream docs cite DEC ids, never invent rules.
- [ ] Open questions list is current and each entry names the blocked phase.
- [ ] Docs updated (this phase's output IS the docs).
- [ ] `npm run test:run`, `npm run lint`, and `npx tsc --noEmit` remain green (no code changes expected).