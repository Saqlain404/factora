# Factora — Security

**Status:** `IN_PROGRESS`

## Threat Model (V1)

| Asset | Risk | Primary control |
| --- | --- | --- |
| User session | Account takeover | Auth.js v5 credentials, bcrypt, secure cookie |
| Database | Data exfiltration | PostgreSQL on Neon (TLS), least-privilege service user |
| Business data (orders, invoices, payments) | Unauthorized read/write | Route guard (`src/proxy.ts`), server-side auth checks, Zod validation |
| Uploaded documents | Malicious file | Extension + size whitelist on upload (V1 filesystem) |
| Secrets (AUTH_SECRET, DATABASE_URL) | Leakage | `.env.local` only, Vercel env vars, never logged/committed |

## AuthN & AuthZ

- **AuthN**: Auth.js v5 credentials provider. Passwords stored as bcrypt hashes (`bcryptjs`).
- Initial admin seeded via `src/scripts/seed-admin.ts` (`admin@factoraa.com` placeholder) — **must change the default password before real use**.
- **AuthZ**: every authenticated route is guarded by `src/proxy.ts`; session retrieved via `auth()` from `src/lib/auth.ts` inside Server Components/Actions. Write actions re-verify server-side — never trust the client.
- Role enforcement (`admin`/`manager`/`user`) is deferred to the permissions phase; the `user_role` enum exists in the schema.

## Secrets & Configuration

- `AUTH_SECRET`: generate with `openssl rand -base64 32`; store in Vercel env; never commit.
- `DATABASE_URL`: Neon connection string; use pooled connection (`?sslmode=require`); auto-commit only via migrations.
- `.env.example` shows required vars; `.env.local` holds real values locally (git-ignored).
- Planned: `src/config/env.ts` validating all env vars with Zod at startup.

## Data Protection

- All DB connections over TLS (Neon requires it).
- At rest: provided by Neon serverless Postgres.
- In transit: HTTPS on Vercel; HSTS config recommended at the platform level.

## Input Validation

- **Every write** path (Server Action) validates with Zod before touching the DB.
- Schemas live in `src/modules/<module>/schemas.ts` and are shared with client forms where useful.
- Unhandled Zod errors fail closed (no partial writes).

## Session & Cookie Security

- Auth.js v5 defaults: httpOnly, sameSite cookies; set `AUTH_URL` correctly.
- Logout available; password change prompt recommended for the seed admin.

## Auditability

- Inventory ledger rows record user + timestamp per movement.
- Key state changes (invoice issuance, batch completion, adjustment) record who and when.

## Explicit Non-Goals (V1)

- No multi-tenant isolation (single tenant).
- No payments processing (no card/Bank data stored).
- No role-based UI beyond planned permissions phase.
- No self-hosted PKI, SSO, 2FA (out of scope unless requested).