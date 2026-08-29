# Canonical workspace authority migrations

These migrations implement the PostgreSQL persistence adapter selected by `ADR-ARCH-007`. Apply them with `pnpm --filter @document-management/api persistence:migrate` using a migration identity; the API runtime verifies applied versions and does not receive schema-owner permissions.

Rules:

- Files are immutable after merge. Corrections use a new forward migration.
- The runner records the SHA-256 digest of every applied file and refuses checksum drift.
- Local JSON import is explicit, synthetic-only, idempotent by source digest, and followed by invariant verification. Digest replay revalidates the current target and marks corrupt or incomplete evidence `REPAIR_REQUIRED` rather than reporting verified reuse.
- Rollback does not delete accepted authority/audit/outbox state. Use forward repair and restore evidence.
- Production provisioning and activation remain disabled until the open SKU, identity, network, backup, and release inputs are approved.
