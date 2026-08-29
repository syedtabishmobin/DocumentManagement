# ADR-ARCH-010 — Thirty-Day Document Recovery and Purge

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-010` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 28 August 2026 |
| Decision scope | Document Trash, restore authorization, purge deadline, Azure soft delete, crypto-shredding, backups, and deletion evidence |
| Decision owners | Product owner, privacy/legal, security, architecture, operations, and quality |
| Supersedes | The open production document cooling-off duration in `DEC-039`; local immediate-purge behavior remains valid for the local profile |

## Context

The product owner requires deleted documents to remain recoverable in the application for 30 days and to be removed after that window. Document recovery is distinct from account or workspace-ownership recovery. Azure Blob soft delete protects only the artifact; Doculyra must coordinate metadata, derivatives, keys, events, backups, and restore behavior.

## Decision drivers and traceability

- Decisions: `DEC-005`, `DEC-033`, `DEC-039`, `DEC-050`, `DEC-053`.
- Requirements: `REQ-P1-DOC-003`, `REQ-P1-TRUST-004`, `REQ-P1-TRUST-007`–`008`.
- Architecture/operations: `ADR-ARCH-002`–`004`, `ADR-ARCH-008`, `OPS-DR-001`, `PRIV-DATA-001`, `AUD-PROV-001`.

## Decision

### 1. Deletion acceptance

An authorized delete request creates an immutable deletion case and durable fence before success is returned. The server records `deleted_at` and `purge_due_at = deleted_at + 30 calendar days` in UTC. The item enters restricted `TRASHED` state and disappears from ordinary retrieval, preview, search, graph, AI, share, export, notification, and connector paths.

### 2. Recovery window

Until `purge_due_at`, an actor with current restore authority may request restoration after step-up authentication. Restore validates current workspace membership, grants, key availability, quarantine, consent, and conflict state; it cannot use historical authority. Restoration creates an audit event, reactivates the artifact, and rebuilds derivatives from authoritative encrypted inputs where required.

### 3. Artifact lifecycle

The encrypted original is an immutable blob. Production artifact storage uses 30-day Azure Blob soft delete. Application-level immutable versions avoid indefinite storage-version retention. The service cannot read a soft-deleted blob until an authorized restoration first reactivates it.

### 4. Final purge

At or after `purge_due_at`, an idempotent purge workflow:

1. permanently denies restore and advances the deletion fence;
2. destroys live document/recovery key envelopes and records crypto-shred evidence;
3. purges canonical sensitive metadata and every registered derivative, cache, index, graph, thumbnail, conversation, export, connector copy, and temporary object;
4. verifies or awaits the Azure artifact retention expiry;
5. retains only content-minimized tombstone/audit fields needed to prove the request, authority, timings, scope, outcomes, and residual backup generations; and
6. marks completion only when every required data-role acknowledgement is final.

### 5. Backup and replay safety

The deletion ledger and current fence are restored before any historical data becomes serviceable. Backup restore, event replay, projection rebuild, connector resynchronization, or a late callback cannot reactivate a purged item. A backup containing historical ciphertext remains inaccessible and is tracked until expiry; destroyed live key envelopes and the current ledger prevent ordinary recovery.

### 6. Exceptions

Account deletion, workspace deletion, archived documents, lawful retention, disputes, and security/incident preservation are separate governed states. Phase 1 does not silently apply a legal hold. Any future hold must have an explicit authority, notice/visibility rule, scope, review/expiry, access restriction, and product-owner/legal approval.

## Explicit non-decisions

This ADR does not set account-deletion timing, statutory audit retention, or customer-contract terms. It does not permit operators to browse Trash or backups.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| Immediate production purge | Minimal retention | Prevents recovery from accidental deletion. |
| Indefinite Trash | Maximum recovery | Conflicts with the explicit 30-day promise and privacy minimization. |
| Blob soft delete alone | Simple | Leaves database, keys, indexes, graph, AI state, exports, and restore/replay paths inconsistent. |
| Blob versioning with indefinite versions | Rich history | Can retain previous versions beyond the promised window without additional lifecycle work. |

## Consequences

- Users receive a clear, recoverable 30-day Trash.
- Final deletion is a distributed workflow rather than one storage call.
- Backups require current-fence reconciliation and truthful residual reporting.
- Storage soft-delete capacity remains billable during the recovery window.

## Validation before release

1. Delete immediately denies all ordinary and derived access, including negative cross-workspace cases.
2. Authorized restore succeeds before expiry; stale, unauthorized, conflicted, or post-expiry restore fails closed.
3. Time-boundary, duplicate, retry, partial-failure, worker outage, late-event, backup restore, projection rebuild, and connector resync tests pass.
4. Per-role purge evidence proves no content-bearing audit/log residue and no key-based recovery after completion.
5. User-facing timestamps, timezone presentation, warnings, and finality copy pass accessibility review.

## Open-decision fences

Account/workspace recovery remains unavailable under approved `DEC-038`; document restore cannot supersede that decision. Production backup retention and any lawful-hold policy require final legal/privacy review before customer terms are published.

## Revisit and supersession triggers

Revisit after legal/privacy review, changes to Azure lifecycle behavior, a deletion incident, enterprise legal-hold scope, or a requirement to shorten/extend the customer recovery window.
