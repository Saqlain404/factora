# Factora — Phase 11: Permissions

**Status:** `PROPOSED`

## Business purpose

Today every logged-in user can do everything. This phase turns the stored `user_role` (`admin` / `manager` / `user`) into enforced permission checks, so the owner can trust who can delete records, approve adjustments, issue invoices, and manage master data. The exact role matrix is a proposal (P-012) awaiting the user's confirmation (OQ-24); nothing is enforced until that matrix is approved.

## Scope

**In scope**

- Role/permission matrix for `admin`, `manager`, `user` (P-012; exact split per OQ-24).
- Server-side enforcement in every write path (Server Actions) based on session role.
- Route-level enforcement on top of the existing `proxy` auth guard (e.g. admin-only pages).
- Read-only role policies (do all roles see all data? pending matrix).
- Optional: user administration (create users, assign role, disable) to make roles usable.

**Out of scope**

- OAuth/SSO/2FA (not in V1).
- Per-record/ownership permissions (single tenant, team-wide roles).
- UI-level hiding as a security control — UI hides for ergonomics; the server always enforces.

## Current state

- `user_role` enum exists (`admin` | `manager` | `user`) in migration `0000_whole_doomsday.sql`.
- Session JWT carries `role` and `userId`; `src/lib/auth.ts` exposes them; `src/proxy.ts` only checks "is logged in" — no role checks.
- Seed admin is created with role `admin`.
- No role rules, matrices, or enforcement code exist.

## Features / user stories

- As an admin, I can create users and assign them `admin` / `manager` / `user` roles, so access matches responsibilities (pending OQ-24 / P-012).
- As a manager, I am blocked from admin-only actions (e.g. stock adjustments without authorization per P-007), so controls survive accidental clicks.
- As a user, I can use my daily flows but cannot alter master data or cancel invoices, so record ownership is preserved.
- As an owner, a forbidden action returns a typed authorization error instead of a silent partial write, so nothing slips through.
- As a user, UI menus reflect what I can do, so I do not see dead buttons (ergonomic layer only).

## Database changes

- No new tables required if the matrix is a static policy (TS constants + domain functions).
- If the matrix must be editable, add a `permissions`/`role_permission` table (deferred — only if OQ-24 demands configurability).
- Possibly additive: `users.disabled_at` timestamp (nullable) if user disablement is approved.
- No destructive changes.

## Server actions / APIs

- `authorize(role, action)` — pure helper consulted at the top of every write action.
- `createUser` / `updateUserRole` / `disableUser` — admin user management (pending scope).
- Enforcement additions: gate existing actions (archive masters, adjust stock, invoice issuance, cancel, payment record) against the approved matrix.

## UI pages & components

- Admin area: `app/(dashboard)/admin/users/` — user list, role change, disable (pending scope).
- Menu filtering in `components/layout/sidebar.tsx` and `top-bar.tsx` based on session role.
- Forbidden-state component (`403` message) for blocked routes/actions.

## Validation & business rules

- Authorization is server-side only: every Server Action re-reads the session and calls `authorize` (SECURITY.md — never trust the client).
- Matrix (proposed, pending P-012/OQ-24):
  - `admin` — full access incl. user management, stock adjustments, master data, invoice management.
  - `manager` — daily ops (orders, production, dispatch, invoicing) minus user management and high-risk adjust/delete.
  - `user` — read + assigned daily flows (production entry, dispatch entry) as confirmed.
- Adjust authorization follows P-007 (2-step for admin once approved).
- A forbidden action throws/returns a typed authorization error; no partial writes (SECURITY.md fail-closed).

## Edge cases

- Role changed while a user has an active session → JWT role is stale until re-login; force re-login or accept freshness on next sync (design decision needed).
- Seed admin demoted to `user` accidentally → recovery path: a disabled second admin or a documented rescue seed.
- A `user` opens an admin-only route directly by URL → route guard returns 403 regardless of UI hiding.
- All users blocked (e.g. sole admin demoted) → lockout scenario documented in deployment/hardening.
- Disabled user with existing open orders/batches → records stay, user cannot sign in.

## Tests

- Domain: `authorize` matrix unit tests — every (role, action) pair; denial default for unknown actions.
- Actions (mock DB): a `manager`/`user` calling an admin action receives an authorization error before any DB write.
- Route-level tests optional (integration) once E2E exists (Phase 13).
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] Approved role matrix (P-012/OQ-24) is implemented as pure functions + enforced in all write actions.
- [ ] Admin-only routes return 403 for managers/users server-side.
- [ ] UI hides what the role cannot do (ergonomic), while server still enforces.
- [ ] User management (create/role/disable) exists if approved (OQ-24 scope).
- [ ] JWT role staleness on role change is handled (documented policy).
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 02 auth (session role, proxy).
- All write actions from Phases 03-08 exist to attach authorization to.
- Approval of P-012 (matrix) and OQ-24 (who holds which role).

## Risks

- Enforcing a guessed matrix breaks daily users immediately — must follow the approved matrix.
- UI-only hiding would be false security; the enforce-in-action rule prevents this.
- Stale JWT roles cause surprising denials right after a role change — handle deliberately.
- If the customer later wants per-record permissions (e.g. area managers), a `role_permission` table may be needed — keep matrix centralized for a clean swap.

## Questions requiring approval

- P-012 — permissions matrix (admin/manager/user) — approve the specific grid.
- OQ-24 — confirm who holds each role in practice.
- P-007 — stock adjustment authorization level (touches this matrix's risk rows).

## Definition of done

- [ ] Zod schema written and unit-tested (user-role input schemas; fail cases included).
- [ ] domain.ts rule functions unit-tested (authorize matrix).
- [ ] DB migration added (additive) — none unless user-disablement/role-permission tables approved.
- [ ] Server Actions validate + write (authz gate on every action, user management).
- [ ] UI pages/components render + wired (admin users page, menu filtering, 403 state).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (SECURITY.md AuthZ section, permissions module doc).