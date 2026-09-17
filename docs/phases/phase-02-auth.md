# Factora — Phase 02: Auth & Access

**Status:** `IN_PROGRESS`

## Business purpose

Secure the product so only authorized people can see or change manufacturing data. Every page behind the login requires a valid session, passwords are stored hashed, and the seed admin must change the default password before real use. Roles (`admin` / `manager` / `user`) exist in the data model now; granular permission enforcement ships later (Phase 11, P-012).

## Scope

**In scope**

- Auth.js v5 (NextAuth) Credentials provider: email + password, bcrypt hashing.
- Login page and sign-in flow; logout.
- Route guarding via Next 16 `proxy` (`src/proxy.ts`); session exposure through `src/lib/auth.ts`.
- Session JWT carrying `id`, `name`, `email`, `role`; dashboard renders only for authenticated users.
- `user_role` enum (`admin` / `manager` / `user`) stored on `users`; role chosen at user creation.
- Seed admin with a mandatory password-change requirement on first login.
- Client `SessionProvider` wiring and server-side re-checks in writes.

**Out of scope**

- Role/permission enforcement beyond "any logged-in user" — matrix and enforcement are Phase 11 (P-012, OQ-24).
- User management UI (invite/disable users) — deferred with permissions.
- Password reset by email flow, OAuth/SSO, 2FA — not in V1.
- Multi-tenancy / sign-up — single tenant, admin-provisioned users only.

## Current state

- **Already built:**
  - NextAuth v5 (beta) integration: `src/lib/auth.ts` (handlers, auth, signIn, signOut), `src/lib/auth.config.ts` (credentials + bcryptjs verify), `src/app/api/auth/[...nextauth]/route.ts`.
  - Session JWT with `role` and `userId`; session `user` augmented with `id` and `role`.
  - `src/proxy.ts` guard: redirects unauthenticated users to `/login`, authenticated users away from login, lets `/api/auth` and the public route pass.
  - Login page under `(auth)/login`; `(dashboard)` layout with `providers.tsx` (SessionProvider), sidebar, top-bar.
  - Auth schema + migration `drizzle/0000_whole_doomsday.sql`: `users`, `accounts`, `sessions`, `verification_tokens`, `user_role` enum.
  - `src/scripts/seed-admin.ts` — creates `admin@factoraa.com` (placeholder) with bcrypt hash, role `admin`.
  - Error/404 pages.
- DB not yet connected (`DATABASE_URL` placeholder) — auth flow cannot fully run end-to-end until the DB is reachable.

## Features / user stories

- As a user, I can log in with my email and password, so I can access the Factora dashboard.
- As a user, I can log out, so I can leave a shared machine securely.
- As a user, I am redirected to `/login` when I hit a protected page unauthenticated, so the app never renders data without a session.
- As an admin, I am blocked from the login page once signed in and directed to the dashboard.
- As a seed admin, I must change the default password on first login, so the placeholder credential cannot linger.
- As a user, my server action writes re-verify my session server-side, so auth never trusts the client.

## Database changes

- Existing (migration `0000_whole_doomsday.sql`):
  - `users`: `id` PK, `name` NOT NULL, `email` NOT NULL UNIQUE, `email_verified`, `hashed_password` nullable, `image`, `role` `user_role` NOT NULL DEFAULT `user`, `created_at` NOT NULL, `updated_at` NOT NULL.
  - `accounts`, `sessions`, `verification_tokens` (Auth.js adapter tables; `accounts.user_id` and `sessions.user_id` FK to `users`, cascade delete).
- Additive migration planned for this phase:
  - `users.must_change_password` `boolean` NOT NULL DEFAULT `true` — forces the admin password change on first login.
- No destructive changes.

## Server actions / APIs

- `signIn` (from Auth.js) — official login entry; validates credentials, issues session.
- `signOut` (from Auth.js) — ends the session.
- `changePassword` — validates current password, enforces minimum strength (Zod), updates `hashed_password`, clears `must_change_password`.
- (Deferred to Phase 11) `createUser` / `updateRole` — user administration with role selection.

## UI pages & components

- `app/(auth)/login/page.tsx` — email/password form (React Hook Form + Zod), error display, loading state.
- `app/(dashboard)/layout.tsx` + `providers.tsx` — SessionProvider + app shell (sidebar, top-bar) that only renders when a session exists.
- `components/layout/top-bar.tsx` — session user name/role, sign-out action.
- Planned: password-change screen shown on first login when `must_change_password` is true (modal or forced redirect).
- `app/error.tsx`, `app/not-found.tsx` — graceful failures.

## Validation & business rules

- Zod schema for login input (valid email, non-empty password) and password change (min length 8; new password required; DEC-008 credentials + bcrypt).
- Session strategy: JWT (DEC-008 impact; `SessionProvider` for client).
- Route guard: unauthenticated → `/login`; authenticated + auth page → `/dashboard` (implemented in `src/proxy.ts`).
- Seed admin policy (SECURITY.md, seed script): placeholder `admin@factoraa.com`, bcrypt + cost factor 12, must change password.
- Every server action re-reads the session via `src/lib/auth.ts` — never trust the browser (SECURITY.md).
- Default role `user` (`user_role` enum); role rows never exceed the enum values.

## Edge cases

- Seed admin runs twice → must be idempotent (script already checks existing email).
- Admin skips password change → blocked from normal navigation or warned persistently until changed.
- Session expiry → user hits `/login` on next protected route visit; re-login required.
- Disabled/unknown user tries login → generic "invalid credentials" (no user enumeration).
- `AUTH_SECRET` missing/unset → Auth.js refuses to sign cookies; fail loudly in dev.
- Multiple rapid login attempts → rate limiting considered (no decision yet; track as risk).

## Tests

- Unit/domain: password-strength and change logic; credential verification (bcrypt compare) happy + failure cases.
- Zod schemas: login and change-password schemas reject malformed input (empty email, short password).
- Action tests (mock DB): `changePassword` rejects when current password wrong; clears `must_change_password` on success only.
- Baseline remains green: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] Login with seeded admin credentials opens the dashboard; wrong credentials show an inline error.
- [ ] Unauthenticated users are redirected to `/login` for every `(dashboard)` route.
- [ ] Logged-in users visiting `/login` are redirected to `/dashboard`.
- [ ] Seed admin is forced to change the default password before normal use.
- [ ] `users.*` and Auth.js tables created by `0000_whole_doomsday.sql`; `must_change_password` added additively.
- [ ] Passwords stored only as bcrypt hashes; `AUTH_SECRET` set locally.
- [ ] `npm run test:run`, `npm run lint`, `npx tsc --noEmit` pass.

## Dependencies

- Phase 01 foundation (Next 16 shell, proxy convention, Drizzle).
- A reachable `DATABASE_URL` to run migrations + seed end-to-end.

## Risks

- Auth.js v5 is beta — behavior can shift between versions; pin and test.
- No DB connected yet, so the full login round-trip is unverified until deployment phase.
- Credential-only auth limits security tooling (no 2FA) — accepted for V1.
- Seed password lives in the seed script; leaks are mitigated by the forced change.

## Questions requiring approval

- OQ-24 — confirm who holds each role (admin / manager / user) before Phase 11.
- P-012 — permissions matrix proposal (this phase keeps "any authenticated user", enforcement is later).

## Definition of done

- [ ] Zod schema written and unit-tested (fail cases included).
- [ ] domain.ts rule functions unit-tested (password policy, credential verify).
- [ ] DB migration added (additive): `users.must_change_password`.
- [ ] Server Actions validate + write (signIn/signOut/changePassword).
- [ ] UI pages/components render + wired (login, forced password change).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (SECURITY/DEPLOYMENT/phase notes as needed).