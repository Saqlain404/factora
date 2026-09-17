# Factora — Architecture

**Status:** `IN_PROGRESS`

## Stack Decision Record

| Layer | Choice | Status |
| --- | --- | --- |
| Framework | Next.js (App Router) with Turbopack | **APPROVED** |
| Language | TypeScript | **APPROVED** |
| Styling | Tailwind CSS | **APPROVED** |
| UI components | shadcn/ui (Base UI variant) | **APPROVED** |
| Database | PostgreSQL (serverless) on Neon | **APPROVED** |
| ORM | Drizzle ORM + postgres-js | **APPROVED** |
| Validation | Zod (shared schema), React Hook Form on forms | **APPROVED** |
| Auth | Auth.js v5 (NextAuth) credentials provider | **APPROVED** |
| Testing | Vitest + jsdom | **APPROVED** |
| PDF invoicing | @react-pdf/renderer | **PROPOSED** |
| Charts | Recharts (conditional) | **PROPOSED** |
| File storage | Local filesystem V1, object storage later | **APPROVED** (see FILE-STORAGE.md) |
| Deploy target | Vercel | **APPROVED** |
| Payment gateway | none in V1 (payments tracked, not processed) | **APPROVED** |

## High-Level Architecture

```
Browser ──► Next.js App Router (Vercel, serverless)
                 │
                 ├── Server Components (data fetch)
                 ├── Server Actions / Route Handlers (writes, validated by Zod)
                 ├── Auth.js v5 session (src/proxy.ts guards routes)
                 │
                 └── Drizzle ORM ──► PostgreSQL (Neon, serverless, pooled)

Local filesystem storage (V1) for uploaded documents (Server Nodes)
    └── Migration path: S3/R2 when deployed (see FILE-STORAGE.md)
```

Single Next.js application. No separate API service. Server Actions are the primary write path; Route Handlers reserved for webhook/export/download use cases.

## Module Boundaries

Factora is organized into the following source module areas (code layout mirrors these):

| Module | Responsibility |
| --- | --- |
| `auth` | Sign-in/sign-out session machinery (Auth.js v5) |
| `customers` | Customer master data, credit period |
| `suppliers` | Supplier master data, purchase/vendor defaults |
| `products` | Finished product master data, links to mould + BOM |
| `raw-materials` | Raw material master data, rate history, stock |
| `moulds` | Mould master + lifecycle: Required → Ordered → Received → Trial → Active |
| `machines` | Machine master data |
| `orders` | Customer orders, order items |
| `bom` | BOM definitions: product → raw material + qty per unit |
| `inventory` | Stock levels, transactions, adjustments |
| `procurement` | Supplier purchase requests/POs and receipts |
| `production` | Batches, reservations, consumption, completion |
| `quality` | In-process QC (blocked; no spec) |
| `packing` | Packing details (blocked; no concrete spec yet) |
| `dispatch` | Outbound movement, partial dispatch, delivery notes |
| `invoicing` | GST invoice generation (sequential INV-###) + PDF |
| `payments` | Payment receipts, overpayment blocking |
| `costing` | Manual per-batch costing, batch cost summary |
| `expenses` | Expense records and categorization |
| `reports` | Reports (later phase) |
| `dashboard` | Operational dashboard (shell exists) |

## Business Logic Location

- Business rules live in **one place per module**, with a pure-function core when possible, so identical rules can be unit-tested.
- Drizzle schema files (`src/modules/<module>/schema.ts`) define the DB shape.
- Server Actions (`src/modules/<module>/actions/...`) are the single write path and **always** validate input with Zod before touching the DB.
- No business rules are embedded in UI components.

This makes the rules testable in isolation (see [TESTING.md](./TESTING.md)).

## Code Layout

```
src/
  app/                     # Next.js App Router routes
    (auth)/                #   public routes (login)
    (dashboard)/           #   authenticated routes
  components/
    layout/                #   sidebar, top bar, shell
    ui/                    #   shadcn/ui primitives
  lib/
    auth.ts                #   Auth.js v5 server config
    auth.config.ts         #   credentials + bcrypt verify
    db/
      index.ts             #   Drizzle client (postgres-js)
    utils.ts               #   cn(...), helpers
    __tests__/
  modules/
    <module>/
      schema.ts            #   Drizzle table definitions
      schemas.ts           #   Zod validation schemas (shared)
      actions/             #   Server Actions
      domain.ts            #   pure business-rule functions
      queries.ts           #   read helpers
  proxy.ts                 #   Next.js 16 route guard (auth middleware)
  scripts/
    seed-admin.ts          #   creates initial admin user
  config/env.ts            #   (to be added) runtime env validation (Zod)
```

## Route Group Conventions

| Route group | Purpose |
| --- | --- |
| `(auth)` | Public routes: login, (future) error pages |
| `(dashboard)` | Authenticated app: sidebar layout, all feature pages |

## Request Lifecycle (example: create a production batch)

1. `(dashboard)` page renders Server Component reading batches via `queries`.
2. User submits form → Server Action.
3. Server Action validates with Zod; runs pure domain rules; then DB transaction via Drizzle.
4. On failure, returns typed errors to the form; on success, revalidates the route.
5. Auth.js session is available in the action via `src/lib/auth.ts`.

## Guarding Routes (Next.js 16 `proxy`)

Auth-required routes are protected by `src/proxy.ts` (the Next 16 replacement for `middleware.ts`). Public routes are unrouted. Session exists server-side via `src/lib/auth.ts`; client pages use the NextAuth client (`SessionProvider` under `src/app/(dashboard)/providers.tsx`).

## Data Integrity Approach

- **Database level**: foreign keys, `CHECK` constraints, enums where the allowed values are fixed.
- **Domain level**: pure functions in `domain.ts` testable without DB.
- **Action level**: Zod validation before every write.

## Non-Goals

- No microservices
- No Redis/cache layer
- No Kubernetes
- No multi-tenancy in V1 (single tenant; model keeps `orgId`-less but generalization-friendly design)
- No background job queue in V1 (all work happens synchronously in serverless)

## Compatibility Notes

- Current build is Next.js **16.3.4** (Turbopack). Uses the `proxy` convention rather than `middleware`.
- Tailwind CSS **v4** (CSS-first configuration) and shadcn/ui **Base UI variant**.
- NextAuth **v5 (beta)**: `Auth()` from `src/lib/auth.ts`; `provider` in `src/proxy.ts`.