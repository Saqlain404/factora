# Factora — Phase 12: Storage & Attachments

**Status:** `PROPOSED`

## Business purpose

Factora needs to attach documents to records: supplier bills, purchase receipts, quality reports, and invoice PDFs. The storage decision is already APPROVED (DEC-004): filesystem storage for V1 behind a `StorageBackend` interface that swaps cleanly to S3/R2 for production. This phase implements the attachments module and makes the hard caveat explicit — serverless Vercel filesystems are ephemeral, so production uploads require object storage (S3/R2, per FILE-STORAGE.md).

## Scope

**In scope**

- `attachments` table: entity_type, entity_id, key, filename, mime, size, uploaded_by, uploaded_at.
- `StorageBackend` interface (`save`, `read`, `delete`, `exists`) with `LocalStorageBackend` for local dev (DEC-004).
- Upload validation: allowed extensions (`pdf`, `jpg`, `jpeg`, `png`), 10 MB max, server-side UUID keys, original name kept in DB metadata (FILE-STORAGE.md).
- Attach/detach flows for approved entities (pending FILE-STORAGE.md question: which entities first).
- Download/serve attachment endpoints with auth.
- `S3StorageBackend` (presigned) implementation for production deploys.

**Out of scope**

- OCR, thumbnails, previews (explicitly no, FILE-STORAGE.md).
- Avatar/brand-logo upload until brand approval (OQ-25).
- Invoice PDF persistence is optional/deferred — PDFs may be generated on demand (DEC-006) or stored once object storage exists.
- Any storage feature claiming durability on the ephemeral Vercel filesystem in production.

## Current state

Nothing built yet. The decision (DEC-004) and module interface (`StorageBackend`) are documented in FILE-STORAGE.md; no storage module, attachments table, or upload code exists. Local `./uploads` dir concept is planned but not created.

## Features / user stories

- As a storekeeper, I can attach a supplier bill PDF to a purchase receipt, so documents live with the transaction.
- As an accountant, I can attach a receipt image to an expense, so claims are verifiable.
- As a QC operator (when quality unblocks), I can attach a quality report to a batch, so inspection evidence is stored.
- As an admin, only `.pdf/.jpg/.jpeg/.png` files up to 10 MB are accepted, so malicious or oversized uploads are rejected (SECURITY.md).
- As a user, I can download an attachment only when authenticated, so documents stay private.
- As a developer, swapping local → S3/R2 changes only the backend class, so production storage swaps are contained (DEC-004).

## Database changes

New Drizzle table (additive migration):

| Table | Key columns | Constraints |
| --- | --- | --- |
| `attachments` | `id` (UUID key), `entity_type` NOT NULL (e.g. `invoice` | `purchase_receipt` | `expense` | `batch`), `entity_id` NOT NULL, `filename` NOT NULL, `mime_type` NOT NULL, `size_bytes` NOT NULL (> 0), `storage_key` NOT NULL UNIQUE, `uploaded_by` FK NOT NULL, `uploaded_at` NOT NULL | size CHECK; storage_key UNIQUE; mime within allowed set |

No changes to existing tables. The storage backend's local path structure: `uploads/<entity>/<uuid>.<ext>` (FILE-STORAGE.md). Additive only.

## Server actions / APIs

- `uploadAttachment` — validates file (ext + size), saves via backend, inserts `attachments` row; returns attachment id.
- `deleteAttachment` — removes row + backend file (soft vs hard delete per policy).
- `getAttachment` / `listAttachments(entityType, entityId)` — read queries.
- Download route handler (protected) — `read()` from backend, streams with correct mime/headers.
- Storage injection: a storage factory returning `LocalStorageBackend` (dev) or `S3StorageBackend` (production) from env (DEPLOYMENT.md).

## UI pages & components

- Attachment control (`components/attachments/`) reused across entities: upload button, file list with size/type, download and delete.
- Entity detail pages (purchase receipt, expense, batch, invoice) integrate the attachment control.
- Attachment download uses a protected route handler, not the public filesystem path.

## Validation & business rules

- Zod: entity_type in the approved set; file extension + mimetype in `pdf/jpg/jpeg/png`; size <= 10 MB (FILE-STORAGE.md).
- Server-side only file checks — never trust the client-declared mime (SECURITY.md).
- Original filename safe-stored as metadata only; physical name is a server UUID (FILE-STORAGE.md).
- Auth: every upload/read/delete requires a session; write actions re-verify (Phase 02 guard + Phase 11 authz when live).
- Production rule: do not rely on the ephemeral Vercel filesystem for durable storage — S3/R2 backend is mandatory at deploy (DEPLOYMENT.md).

## Edge cases

- Uploading a >10 MB or disallowed extension → rejected with a typed error before backend write.
- Same filename uploaded twice → unique `storage_key`/UUID prevents collisions.
- Deleting an attachment referenced by an entity → soft-delete flag preferred to preserve audit links.
- Transient backend write succeeds but DB insert fails → orphan file cleanup (best-effort in action).
- Missing `UPLOADS_DIR` when using local backend → default with an explicit env error in production.
- Download of a nonexistent/storage-key-missing file → 404 with a typed error, no stack trace (SECURITY.md).

## Tests

- Domain/unit: attachment validation (ext + size + mime) fail cases; `LocalStorageBackend` save/read/delete round-trip on a temp dir.
- Zod: upload schema rejects bad types/oversize.
- Actions (mock DB + temp FS): upload writes row + file; delete removes both best-effort; download returns bytes.
- Backend contract tests: same suite runs against `LocalStorageBackend` and (mocked) `S3StorageBackend`.
- Run: `npm run test:run`, `npm run lint`, `npx tsc --noEmit`.

## Acceptance criteria

- [ ] `attachments` table + additive migration committed.
- [ ] `StorageBackend` interface implemented; local backend passes the shared contract suite.
- [ ] Upload accepts only `pdf/jpg/jpeg/png` ≤ 10 MB.
- [ ] Downloads/upload/deletes are auth-protected; downloads stream correct mime.
- [ ] Production build selects object backend via env; ephemeral FS is never implied durable.
- [ ] S3/R2 backend implemented (or production storage documented as pending) before any upload reaches production.
- [ ] Tests above pass; lint + tsc green.

## Dependencies

- Phase 02 auth (session for upload/download protection).
- Phase 11 permissions if per-role upload control is desired.
- Deployment phase to decide the production object store (S3 vs R2) and env wiring.
- Deferred only where noted: quality reports wait for Phase 10.

## Risks

- Shipping local-only storage to Vercel production silently loses documents (DEC-004 caveat) — the single biggest risk; gate production uploads on the object backend.
- File-type validation gaps (magic-byte vs extension) — extension + advisory size checks are the approved baseline; document residual risk.
- Orphaned files when DB and backend diverge — an orphan-cleanup task is recommended in Phase 13 hardening.
- Attachment entities list still unconfirmed (FILE-STORAGE.md question) — start with invoices + purchase receipts + expenses.

## Questions requiring approval

- Which entities get attachments first (invoices, purchase receipts, QC docs)? — open in FILE-STORAGE.md (no OQ id yet; log one if needed).
- S3 vs R2 as the production backend (Vercel-adjacent) — confirm at deployment.
- Soft vs hard attachment delete policy — propose soft delete.

## Definition of done

- [ ] Zod schema written and unit-tested (upload validation fail cases).
- [ ] domain.ts rule functions unit-tested (backend contract + validation logic).
- [ ] DB migration added (additive): `attachments` table.
- [ ] Server Actions validate + write (upload/delete/download).
- [ ] UI pages/components render + wired (attachment list + upload control on target entities).
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Docs updated (FILE-STORAGE.md implementation state, module doc).