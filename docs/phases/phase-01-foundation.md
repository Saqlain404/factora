# Factora — Phase 01: Foundation

**Status:** `IN_PROGRESS`

## Business purpose

Establish a clean, CI-ready foundation every later phase builds on: the chosen stack wired up correctly, predictable scripts, a consistent module layout, and the product renamed to **Factora** (package id `factora`). A solid foundation keeps later modules (master data, production, invoicing) cheap to add and consistent to maintain.

## Scope

**In scope**

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui (Base UI variant) project scaffold.
- Drizzle ORM + postgres-js wiring, migration workflow (`db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:seed`), and the initial auth-schema migration.
- Vitest + jsdom test setup with `test` / `test:run` scripts.
- ESLint, Prettier, and TypeScript strictness configured; `lint` / `format` scripts.
- Rename the project to Factora (package name `factora`), document code layout conventions.

**Out of scope**

- Feature modules (master data, production, invoicing, …) — later phases.
- Database connectivity — `DATABASE_URL` remains a placeholder until the deployment phase.
- Authentication behavior — that is Phase 02; the schema and script exist here.
- Any deployment, DNS, or real environment configuration.

## Current state

- Next.js **16.3.4** (Turbopack) app; App Router; TypeScript; Tailwind **v4** (CSS-first); shadcn/ui **Base UI variant**.
- `package.json` named `factora` with scripts: `dev`, `build`, `start`, `lint`, `test`, `test:run`, `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`, `format`.
- `drizzle.config.ts`, `vitest.config.mts`, `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json` present.
- Drizzle schema split per module under `src/modules/` (auth module schema present); migration `drizzle/0000_whole_doomsday.sql` generated (auth tables + `user_role` enum).
- `src/lib/db/index.ts` Drizzle client; `src/lib/utils.ts` helpers with a Vitest test file.
- App shell exists: login page, dashboard layout/page, sidebar/top-bar.
- Project renamed to Factora.
- `DATABASE_URL` is a placeholder — the DB has not been connected or migrated yet.

## Features / user stories

- As a developer, I can run `npm run test:run` to execute the Vitest suite once, so CI and local checks are identical.
- As a developer, I can run `npm run lint` and `npx tsc --noEmit`, so style and type regressions are caught before commit.
- As a developer, I can run `npm run db:generate && npm run db:migrate`, so schema changes are versioned and applied safely.
- As a developer, I can add a new module under `src/modules/<module>/` with a known layout (schema, schemas, domain, actions, queries), so later phases follow one pattern.
- As a developer, I can start the app with `npm run dev` and see the renamed Factora shell render.

## Database changes

- No new tables in this phase beyond what foundation wiring requires.
- Existing migration `0000_whole_doomsday.sql` (already generated) contains: `users`, `accounts`, `sessions`, `verification_tokens`, `user_role` enum (`admin|manager|user`).
- Key constraints in that migration: `users.email` NOT NULL + UNIQUE, `users.role` NOT NULL DEFAULT `user`, FKs from `accounts`/`sessions` to `users` (cascade on delete), `sessions.session_token` UNIQUE.
- Applying the migration to a real database is deferred until `DATABASE_URL` exists (Phase 02 hand-off / deployment phase).
- No destructive changes: this and all future migrations are additive.

## Server actions / APIs

- None yet. The first write endpoints arrive with Phase 02 (auth) and later phases.

## UI pages & components

- App shell already built under `src/app/`:
  - `(auth)` route group with login page, `(dashboard)` route group with layout/page.
  - `components/layout/`: `sidebar.tsx`, `top-bar.tsx`, `providers.tsx`.
  - `components/ui/`: shadcn/ui primitives (button, card, input, dialog, table, etc.).
  - `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `favicon.ico`, `icon.svg`.
- Foundation phase keeps this shell; feature pages belong to later phases.

## Validation & business rules

- No business rules are implemented in the foundation phase (no domain logic yet).
- Env-var validation with Zod at startup (`src/config/env.ts`) is planned but not yet written — treat as proposed until landed.
- Rule applies from Phase 02 on: every write path validates with Zod (DEC-002 stack rule; SECURITY.md).

## Edge cases

- `DATABASE_URL` unset or a placeholder must fail loudly in scripts (`db:migrate`, `db:seed`) with a clear message rather than a cryptic error.
- The `user_role` enum must be applied before any user insert; a missing migration at runtime would crash auth seeding.
- Turbopack vs Webpack differences in Next 16 — build and dev should use the same config surface.
- The seed admin script already exists (phase 02 concern) but must not run until the DB is reachable.
- Node/Next 16 compatibility constraints affect dependency upgrades — pin versions.

## Tests

- Vitest + jsdom configured.
- Current baseline: `src/lib/__tests__/utils.test.ts` — 3 passing tests (cn, formatDate, formatNumber as present).
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.
- Foundation verification is script-level: tests, lint, and typecheck must pass from a clean checkout.

## Acceptance criteria

- [ ] `npm run test:run` passes from a clean install.
- [ ] `npm run lint` and `npx tsc --noEmit` pass with no errors.
- [ ] `npm run build` succeeds (Turbopack, Next 16.3.4).
- [ ] Package name is `factora` (product **Factora**, never "Factoraa").
- [ ] Drizzle config produces migrations under `drizzle/`; migration `0000_whole_doomsday.sql` is committed.
- [ ] Module layout documented and followed (schema/schemas/domain/actions/queries).
- [ ] App shell renders locally with `npm run dev`.

## Dependencies

- Phase 00 outputs (decision log, architecture, database, testing docs) — already available.
- A real `DATABASE_URL` (project placeholder is fine to proceed; applying migrations is deferred).

## Risks

- No actual DB connected yet, so schema correctness is only validated by `drizzle-kit` generate, not runtime.
- Next.js 16 (Turbopack) conventions differ from older docs (proxy vs middleware) — must follow the installed version's docs.
- No git repo detected in the worktree; untracked scaffolding state increases rework risk until version control is initialized.
- Upgrading shared dependencies late can invalidate the foundation (freeze after this phase).

## Questions requiring approval

- None blocking — all decisions needed already exist (DEC-001, DEC-002, DEC-003, DEC-005, DEC-007).
- Pending related items for later phases: none specific to foundation.

## Definition of done

- [ ] Zod schema written and unit-tested — not applicable (no feature schemas yet).
- [ ] domain.ts rule functions unit-tested — not applicable (no domain modules yet).
- [ ] DB migration added (additive) — foundation migration exists and is committed.
- [ ] Server Action validates + writes — none yet (Phase 02).
- [ ] UI page/components render + wired — shell renders.
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (architecture/code-layout notes match the tree).