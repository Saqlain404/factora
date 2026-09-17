# Factora — File Storage

**Status:** `APPROVED` (decision), `IN_PROGRESS` (implementation deferred)

## Decision (DEC-020)

- **V1: documents/assets stored on the local filesystem** (backend upload dir, e.g. `./uploads` via a shared storage module), keyed by `uploads/<entity>/<uuid>.<ext>`.
- Rationale: simplicity, no vendor dependence for development, offline work.
- Storage location is configurable (`UPLOADS_DIR`).

## Critical Caveat

Serverless (Vercel) filesystem is **ephemeral** and per-instance. Local filesystem storage **only works for single-instance local development or a self-hosted server**.

- **For production on Vercel, uploads must move to object storage (S3/R2) with pre-signed URLs.**
- The module boundary is designed so only the storage backend changes (a `StorageBackend` interface), i.e. swapping local → S3/R2 is a contained change.

## File Types & Constraints

- Invoice PDFs are generated with `@react-pdf/renderer` (proposed) and could be stored on upload or generated on-the-fly.
- Uploaded documents (quality reports, supplier bills, receipts):
  - Allowed extensions: `pdf`, `jpg`, `jpeg`, `png` (extend later per business need).
  - Max size: 10 MB (configurable).
  - Filename stored on server is a UUID; original name kept in DB metadata.
  - Avatar/logo handling is out of scope until brand approval.

## Module Interface (planned)

```ts
interface StorageBackend {
  save(buffer, meta: { entity, id, ext }): Promise<{ key: string }>;
  read(key): Promise<Buffer>;
  delete(key): Promise<void>;
  exists(key): Promise<boolean>;
}
```

- `LocalStorageBackend` for dev.
- `S3StorageBackend` (presigned) for production.
- DB reference: `attachments` table (entity_type, entity_id, key, filename, mime, size, uploaded_by, uploaded_at).

## Open Questions

- Do attachments need OCR/thumbnails? (No currently.)
- Which entities get attachments first (invoices, purchase receipts, QC docs)? Ask user.