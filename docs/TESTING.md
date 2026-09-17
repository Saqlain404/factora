# Factora — Testing Strategy

**Status:** `IN_PROGRESS`

## Approach

- **Vitest** + **jsdom** (already configured) for unit + component tests.
- Business rules live in pure `domain.ts` functions — these are the primary test target (fast, no DB).
- All approved rules in [BUSINESS-RULES.md](./BUSINESS-RULES.md) get a unit test.
- DB-integration tests are added later once a real/test database is available (defer to deployment phase).

## Test Layers

| Layer | Tool | Coverage target |
| --- | --- | --- |
| Pure domain logic | Vitest | `modules/*/domain.ts` — every approved rule |
| Validation schemas | Vitest | Zod error cases in `schemas.ts` |
| React components | Vitest + jsdom (`@testing-library/react` if added) | critical forms, dashboard widgets |
| Server Actions | Vitest (mock DB) | action contracts: happy + Zod-failure paths |
| E2E | deferred (optional Playwright later) | auth flow, critical user journeys |

## Rule-to-Test Map (required)

Every row in BUSINESS-RULES.md marked **APPROVED** and implemented must have a test. Minimum set (binding):

| Rule | Test scenario |
| --- | --- |
| R11 negative stock | ledger suffix push that would go below 0 is rejected |
| R04 overpayment | payment > invoice balance rejected; exact-balance allowed |
| R06 sequential numbering | two issues in a row → INV-001, INV-002, no duplicates |
| R07 mould flow | only valid transitions; batch on non-active mould blocked |
| R09 for-stock batch | batch with `order_id` null is allowed |
| R12 reserve/consume | planned qty reserved; ok_qty consumed at completion |
| R02 manual costing | total = sum components; all inputs validated |

## Commands

```bash
npm run test:run        # run Vitest once
npm run test:watch      # interactive watch
npm run lint            # ESLint + Prettier check
```

## Definition of Done (DoD) for a feature

1. Zod schema written and unit-tested (fail cases included).
2. `domain.ts` rule functions unit-tested.
3. DB migration added (`npm run db:generate`) — no destructive changes.
4. Server Action collects data correctly + validates; no unvalidated writes.
5. UI page/components render + wire to action.
6. `npx tsc --noEmit` and lint pass.
7. Docs updated (module/workflow/phase) as needed.

## Current Test Baseline

- `src/lib/__tests__/utils.test.ts` — 3 passing tests (cn, formatDate, formatNumber as present).
- Run with `npm run test:run`.