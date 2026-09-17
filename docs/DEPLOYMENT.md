# Factora — Deployment

**Status:** `PROPOSED` (no deployment performed yet)

## Target Architecture

- **Host**: Vercel (single Next.js serverless app).
- **Database**: Neon (serverless PostgreSQL), pooled connection.
- **Domain**: `factoraa.com` reserved for production (see Domain below). **Not yet live.**

> Note: The domain `factoraa.com` is the planned production URL. It is **not configured and not live** — do not claim otherwise.

## Required Environment Variables (Vercel)

| Var | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://user:pass@ep-….aws.neon.tech/db?sslmode=require` | Drizzle + postgres-js |
| `AUTH_SECRET` | `openssl rand -base64 32` output | Auth.js session signing |
| `AUTH_URL` | `https://factoraa.com` | canonical URL |
| `NEXT_PUBLIC_APP_URL` | `https://factoraa.com` | metadata base |
| `NEXT_PUBLIC_APP_NAME` | `Factora` | branding |
| `NEXT_PUBLIC_BUSINESS_STATE` | `Uttar Pradesh` | GST context |
| `NEXT_PUBLIC_BUSINESS_STATE_CODE` | `09` | GST code |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin creds | one-time seed |

## Migration Strategy

- Migrations are generated locally (`npm run db:generate`) and checked into `drizzle/`.
- Apply in CI/release step with `npm run db:migrate` (uses Neon password access) — **before** new serverless functions deploy, or run from a trusted runner with the production DB.
- Never run `db:push` against production.
- Backups: Neon Point-in-Time Restore (enable at Neon level).

## Low Data-loss & Zero-Downtime Notes

- Table changes are additive in V1; destructive ops (drops/renames) require a separate reviewed plan.
- Long-running data migrations avoided in serverless; use Neon-run scripts or a trusted runner.

## File Storage on Deploy

- V1 stores uploaded documents on the **local filesystem** of each serverless function — **this does not persist across functions/regions**.
- **V1 deployment must therefore use an object store (S3/R2 with URL signing) for any production uploads, or accept ephemeral storage for development only.**
- See [FILE-STORAGE.md](./FILE-STORAGE.md) for the full decision and migration path.

## CI/CD

- No CI/CD/config files exist yet. Recommended (proposed):
  - GitHub Actions (or Vercel native) running: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run test:run`, `npm run build`.
  - Auto-deploy previews on PR; promote to production on main after approving migrations.
- No Docker/K8s in scope.

## Domain Configuration Checklist (when user is ready)

- [ ] Point `factoraa.com` A/AAAA or CNAME to Vercel.
- [ ] Register domain in Vercel project; create `factoraa.com` + `www.factoraa.com` aliases.
- [ ] Enable HTTPS/TLS (Vercel auto-provisions).
- [ ] Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://factoraa.com`.
- [ ] Seed production admin; force password change.
- [ ] Smoke-test login, invoice PDF generation, and a sample production batch.

## Rollback Plan

- Git history + additive migrations: roll back a bad release by deploying the previous commit (new additive migration already applied is safe).
- Data rollbacks use Neon PITR (tested per incident).

## Seeding

```bash
npm run db:generate
npm run db:migrate
npm run db:seed   # creates admin@factoraa.com (README of script for password)
```