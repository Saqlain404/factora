# Factora — Phase 09: Branding & Deployment

**Status:** `PROPOSED`

## Business purpose

Get Factora from the developer's machine into the customer's hands: verify the brand identity, deploy to Vercel with a Neon PostgreSQL, harden the environment configuration, and establish backups before the customer starts entering real data. The production domain `factoraa.com` is planned but **not live** (OQ-23); branding is text-based until the user approves colors/logo (OQ-25).

## Scope

**In scope**

- Text-based brand identity (name Factora, default styling) until logo/colors are approved (OQ-25).
- Deployment of the Next.js app to Vercel (DEC-005); Neon PostgreSQL provisioned (DEC-003).
- Runtime environment validation with Zod (`src/config/env.ts`); env var hardening.
- Secrets management on Vercel (`AUTH_SECRET`, `DATABASE_URL`, admin seed vars); `.env.local` discipline.
- Migrations: generate + apply to Neon before release; `db:seed` to create the production admin.
- Backups: Neon Point-in-Time Restore enabled; backup/restore drill documented (deep drill in Phase 13).
- Post-deploy smoke tests: login, invoice PDF generation, and a sample production batch.

**Out of scope**

- Object storage — V1 on Vercel must not depend on the ephemeral function filesystem for uploads; storage decisions live in Phase 12 (DEC-004 caveat).
- Domain final cutover/certificate setup if the user supplies a different domain.
- CI/CD automation files (proposed, not yet created — recommended in this phase per DEPLOYMENT.md).
- Anything resembling a claim of GST compliance — see Phase 13 and PRODUCT.md constraints.

## Current state

- Nothing deployed. Local dev only.
- `DATABASE_URL` is a placeholder; DB not connected.
- No CI/CD config files exist (DEPLOYMENT.md marks CI/CD as PROPOSED).
- Docs (DEPLOYMENT.md) define target architecture, env vars, migration strategy, and domain checklist but no action has been taken.
- Brand identity is name-only (`Factora`); no logo/colors approved.

## Features / user stories

- As a user, I can open `factoraa.com` (once live) and see the Factora branded login, so the product has a real address (OQ-23).
- As an admin, the app validates my environment variables at startup, so a misconfigured deployment fails early with a clear message.
- As an admin, migrations run against Neon before new code ships, so schema and code never drift apart.
- As an owner, I can log in with the production admin and get forced to change the seed password, so default credentials never leak (Phase 02).
- As an owner, my data is protected by Neon Point-in-Time Restore, so a bad edit is not permanent.
- As a team, a smoke script confirms login + PDF + a sample batch after deploy, so releases are verifiable.

## Database changes

- No new application tables in this phase.
- Operational concern: the first **real** application of migration `0000_whole_doomsday.sql` on Neon, plus any additive migrations accumulated before deploy (auth `must_change_password`, etc.).
- No destructive operations on production; only `db:migrate` (never `db:push`).

## Server actions / APIs

- None new. This phase wires infrastructure: env config module (`src/config/env.ts`) validating all vars with Zod (planned in ARCHITECTURE.md/SECURITY.md), deployment-time migration + seed scripts.

## UI pages & components

- Branding-only touches until approved: metadata (name, description, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`), default login/dashboard presentation.
- Post-approval (OQ-25): logo asset, color tokens in Tailwind v4 theme, favicon/og image.

## Validation & business rules

- Env validation: Zod schema requires `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_BUSINESS_STATE`/`_CODE` (UP/09), plus optional admin seed vars (DEPLOYMENT.md table).
- Secrets: only Vercel env vars and local `.env.local`; never committed or logged (SECURITY.md).
- Migration rules: `npm run db:generate` locally, checked into `drizzle/`; apply with `db:migrate` before release; `db:push` prohibited on production (DEPLOYMENT.md).
- Backups: Neon PITR enabled at the platform level; a documented restore drill.
- Domain: `factoraa.com` not claimed live until DNS/aliasing actually done (OQ-23; PRODUCT.md constraint: do not claim the domain is live).

## Edge cases

- Deploy precedes migration → app starts but schema missing; run migrations before code release in the release process.
- A missing `AUTH_SECRET` on Vercel → Auth.js fails to sign cookies; env validation catches it at boot.
- `.env.local` committed by accident → safe by trust policy but git-ignore enforced.
- Seed script run twice → idempotent (existing-email guard) so re-runs are safe.
- Filesystem-only uploads on Vercel → ephemeral per instance; production uploads must wait for Phase 12 object storage (DEC-004 caveat).
- Brand assets arrive mid-phase → keep the identity swap additive (metadata + theme tokens).

## Tests

- Env-validation unit test for `src/config/env.ts`: missing/invalid vars fail; valid set passes.
- No feature tests change in this phase; the deploy smoke checklist is manual.
- CI parity: `npm run test:run`, `npm run lint`, `npx tsc --noEmit` must pass on the CI runner the same as locally.

## Acceptance criteria

- [ ] Vercel project deploys `main`; previews auto-deploy on PRs (CI recommended).
- [ ] Neon database provisioned; migration `0000…` + accumulated additive migrations applied.
- [ ] Production admin seeded and first-login password change verified.
- [ ] `src/config/env.ts` validates all runtime env vars; misconfig fails boot loudly.
- [ ] Domain readiness confirmed by the user (OQ-23); `factoraa.com` not claimed live without user confirmation.
- [ ] Brand identity is Factora; token-level branding applied only after OQ-25 approval.
- [ ] Neon PITR enabled; restore drill documented (executed drill in Phase 13).

## Dependencies

- Phase 01/02 codebase ready to ship (no DB-dependent features beyond auth).
- User-provided Neon project / Vercel account access and env var values.
- OQ-23 (domain confirmation) and OQ-25 (brand assets) before final branding copy.

## Risks

- Shipping to production with the placeholder `DATABASE_URL` → all auth/data calls fail; blocked by env validation.
- Ephemeral Vercel filesystem silently losing uploads (DEC-004) if any upload feature ships before Phase 12.
- Assuming `factoraa.com` is live when it is not → explicitly not claimed (OQ-23).
- Deployment is first real exposure to serverless limits (cold starts, connection pooling with Neon) — smoke-test early.
- CI is still PROPOSED — without it, migrations + deploy get manual and error-prone.

## Questions requiring approval

- OQ-23 — confirm production domain `factoraa.com` and the Vercel deployment timeline.
- OQ-25 — are brand colors/logo approved, or keep the text-based identity?
- ARCHITECTURE.md CI recommendation (GitHub Actions/Vercel) — produce CI config in this phase.

## Definition of done

- [ ] Zod schema written and unit-tested (env validation schema + fail cases).
- [ ] domain.ts rule functions unit-tested — not applicable (no domain rules this phase).
- [ ] DB migration added (additive) — no app tables; migrations applied to Neon as accumulated.
- [ ] Server Actions validate + write — none new; auth/seed flows verified on deploy.
- [ ] UI pages/components render + wired — branded login/dashboard per approval.
- [ ] `npx tsc --noEmit` and `npm run lint` pass in CI/local.
- [ ] Docs updated (DEPLOYMENT.md live-state, backups, and env notes).