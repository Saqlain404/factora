# Factora — Phase 13: Production Hardening

**Status:** `PROPOSED`

## Business purpose

The last phase moves Factora from "feature-complete" to "trustworthy in production." It adds end-to-end test coverage, reviews performance on the serverless stack, proves restoration works, and audits the two things regulators and auditors care about: GST invoice correctness (a **review**, not a compliance claim) and the decision log. Hardening is about confidence before (and while) the customer runs real revenue through the system.

## Scope

**In scope**

- E2E tests (Playwright optional, proposed in DEC-007/TESTING.md) for critical journeys: login, order→batch→dispatch→invoice→payment, and authz denials.
- Load/scale review: Neon pooling, cold starts, large ledger growth, report query performance.
- Backup & restore drills: Neon Point-in-Time Restore exercised (DEPLOYMENT.md enablement from Phase 09), documented runbook.
- GST compliance review: **review**, not a claim — validated invoice math/templates against UP/09 rules; explicit "no compliance claim made" note (PRODUCT.md constraint).
- Decision-log audit: every DEC/P proposed/approved entry reviewed for accuracy, OQ status updated, phase docs aligned.
- Docs check: modules/workflows/phases consistent with shipped code.

**Out of scope**

- New business features.
- Claiming GST compliance certification or tax advice.
- Re-architecture (still single Next.js serverless app + Neon, per DEC-005/DEC-003).
- Anything that contradicts a DEC without a new decision.

## Current state

Nothing built yet. Baseline: Vitest unit tests exist (utils + per-module as phases land); no E2E suite, no load review, no backup drill, no compliance review, no decision-log audit performed. Docs mark CI/CD as PROPOSED.

## Features / user stories

- As a team, an E2E suite runs the full order→invoice journey, so regressions in the critical money path are caught before release.
- As an owner, I can execute a restore drill from a Neon PITR snapshot, so data loss is provably recoverable.
- As an accountant, a GST review report documents how invoice totals/tax splits are computed, so the system is auditable even without a formal compliance claim.
- As a maintainer, a load review notes where the serverless model will strain (pooling, cold starts, report queries), so we fix hot spots with evidence.
- As a team, a decision-log audit confirms every P is approved/rejected and every OQ is resolved or still explicitly open.

## Database changes

- No production schema changes expected.
- Review-only concerns: index coverage on `inventory_ledger`, `production_batches`, `invoices`, `payments` for report/aging queries; confirm CHECK/enum enforcement matches rules. Any index addition is an additive migration.

## Server actions / APIs

- None new. Verified/enabled: migration idempotency, seed re-run safety, env validation (Phase 09), and action-level authz (Phase 11).

## UI pages & components

- No new pages. E2E may introduce test-only fixtures and selectors (data-testid where helpful).

## Validation & business rules

- Audit re-confirms every approved rule maps to implemented-enforced code (BUSINESS-RULES.md rule-to-code table) and every PROPOSED rule remains flagged.
- GST review scope: verify invoice math against DEC-009 (UP/09) and the resolved OQ-01 tax split; produce a review note; make no compliance claim (PRODUCT.md).
- Backup policy: PITR enabled + drill dated; restore runbook committed to docs.
- E2E must not hit production data — dedicated test database (Neon branching) with seeded fixtures.

## Edge cases

- E2E flakiness against real Neon — isolate with a branch/test DB; pin data fixtures.
- A restore drill that "passes" but restores to a stale point → verify timestamps and row counts in the runbook.
- GST rates changed mid-financial-year → review assumes the approved inputs; rate history must come from a decided policy (OQ-19).
- Ledger grows large enough to slow balances → index + report-query review; only additive fixes.
- A DEC found wrong in audit → correct via a new entry (never silent edit).
- Playwright not yet approved → E2E scope depends on the user approving it (proposed in DEC-007 reasoning).

## Tests

- Playwright E2E (pending approval): login→master→batch→dispatch→invoice→payment; authz denial; invoice numbering sequence.
- Load smoke: batch-issue N invoices, measure numbering + PDF generation times; review Neon pool sizing.
- Restore drill: scripted PITR restore of a seed DB + data-integrity assertions.
- Existing Vitest suites stay green: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.
- CI runs lint + typecheck + unit tests on PR (from Phase 09 CI work).

## Acceptance criteria

- [ ] E2E coverage of the critical order→invoice path passes against a test DB (or approved alternative).
- [ ] Load review documented with measured numbers and any additive index fixes applied.
- [ ] Neon Point-in-Time Restore drill executed; runbook committed and dated.
- [ ] GST review note documents invoice math; explicitly states no compliance claim is made.
- [ ] Decision-log audit complete: P entries approved/rejected; OQ statuses current; docs match code.
- [ ] CI+unit+lint green in CI and locally.

## Dependencies

- Completed functional phases (03-08) with their writes/queries.
- Phase 09 deployment + env validation + Neon PITR enabling.
- Phase 11 authz enforced before auth-related E2E writable.
- User approval for Playwright (E2E) and any report-index additions.

## Risks

- "Hardening" expanding into new features — scope is strictly verification + fixes.
- Compliance review being mistaken for a certification — the review explicitly makes no claim.
- E2E against production data → dedicated branch/test DB mandatory.
- Backup drill skipped → strongest data-loss mitigation is untested; prioritize over load polish.
- Decision-log drift if new DECs/OQs keep arriving mid-audit — schedule a close-out window.

## Questions requiring approval

- Playwright for E2E — approve adding it (proposed under DEC-007 reasoning).
- Any remaining unresolved OQ-01…OQ-25 must be resolved, or explicitly parked with a dated note, before this phase closes.
- Confirm no new inventory transaction types / scope creep enters during hardening (DEC-020 lock).

## Definition of done

- [ ] Test plan executed (unit + E2E) with results recorded.
- [ ] Migration review clean; any index changes are additive and migration-checked.
- [ ] Load review + backup-drill + GST-review + decision-log-audit notes all committed.
- [ ] Server Actions verified: writes validate, authz holds, no partial writes observed.
- [ ] UI verified in E2E journeys; no dead buttons in role-filtered menus.
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (hardening report, runbook, compliance-review note, DECISIONS/OQ statuses).