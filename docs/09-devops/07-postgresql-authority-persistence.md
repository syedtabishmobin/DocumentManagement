# PostgreSQL workspace authority persistence operations

| Field | Value |
|---|---|
| Document ID | `OPS-PG-AUTH-001` |
| Status | **IMPLEMENTED ADAPTER — provider activation and production provisioning gated** |
| Scope | Workspace aggregate state, creation receipts, authority audit/outbox, migrations, synthetic import, verification and forward repair |
| Primary authority | `ADR-ARCH-004`, `ADR-ARCH-006`, `ADR-ARCH-007`, `DEC-041`, `DEC-049`, `DEC-050`, `DEC-054` |

## Boundary and disposition

The existing workspace, owner binding, subject, identity link, membership, grant, authorization epoch, creation receipt and deny-by-default policy model is reused. The application store now depends on a provider-neutral persistence port. The PostgreSQL adapter stores each workspace aggregate in one independently revisioned JSONB row and stores idempotency receipts, content-minimized authority outbox events, migration history and import evidence in dedicated relational tables.

The physical aggregate mapping preserves the existing logical record identities and one-workspace transaction boundary without leaking PostgreSQL/provider types into contracts or policy. Updates use serializable transactions and compare-and-update storage revisions. Creation receipts are unique by actor identity and hashed idempotency key. A concurrent receipt conflict rolls back the losing aggregate and replays against the committed result.

The unused Cosmos SDK and Cosmos Bicep declaration were selectively replaced because `ADR-ARCH-007` already selects Azure Database for PostgreSQL Flexible Server. The historical deployed Cosmos resource is not deleted by this repository change; Azure retirement requires a live dependency check and separately authorised deployment operation.

## Profiles and activation

The default and current Azure synthetic preview remain on the file adapter:

```text
DM_AUTHORITY_STORE=file
```

PostgreSQL is fail-closed and requires explicit configuration:

```text
DM_AUTHORITY_STORE=postgres
DM_POSTGRES_URL=<injected secret connection value>
DM_POSTGRES_TLS=verify-full
DM_POSTGRES_MIGRATIONS=verify
```

`DM_POSTGRES_URL` is a secret. It must enter through an approved deployment identity/Key Vault route and must never be committed, printed, placed in Bicep parameters, or copied into Issues. The runtime identity receives data-operation permissions only and verification mode performs no DDL. A distinct migration identity applies DDL. TLS defaults to certificate verification; `require` without certificate authentication and `disabled` are both rejected outside the local profile. TLS query parameters in the connection URL cannot override the explicit mode.

PostgreSQL infrastructure and runtime activation remain disabled until exact SKU/capacity, managed identity/database administration, private networking, firewall/egress, backup/restore, monitoring, cost and release evidence are approved. No real customer data is authorised by the adapter's existence.

## Migration and verification commands

Run from the repository root with the required values injected into the process environment:

```bash
pnpm --filter @document-management/api persistence:migrate
pnpm --filter @document-management/api persistence:verify
```

The migration runner obtains a PostgreSQL transaction advisory lock, applies immutable ordered SQL files from `migrations/canonical/`, records each SHA-256 digest, and rejects checksum drift. The normal API runtime uses `verify` mode and refuses to start against missing or changed migrations.

An explicit synthetic-only local import is available for governed development migration exercises:

```bash
pnpm --filter @document-management/api persistence:import-local
```

The import refuses the production profile or a non-synthetic data policy, requires an empty target, validates authority invariants, records source digest/count evidence, and is idempotent by source digest. Exact replay returns `ALREADY_APPLIED_AND_VERIFIED` only after revalidating the current target and retained evidence; corruption or incomplete evidence marks the run `REPAIR_REQUIRED` and fails. Legitimate later additions remain valid when invariants hold and retained counts do not regress. A legacy file without one explicit owner binding, owner membership and owner grant must first pass the existing local legacy-claim path; the importer will not fabricate repair state.

## Failure, rollback and repair

- No workspace creation success is returned until workspace aggregate, creation receipt, required audit and outbox event commit together.
- A thrown operation, connection loss, optimistic revision conflict or receipt collision rolls back the transaction. Serialization/deadlock conflicts have a bounded three-attempt retry budget.
- Workspace deletion is not implemented by this adapter and cannot occur through state reconciliation.
- Applied migration files are not edited or rolled back destructively. Use an additive forward migration and retain prior migration/check evidence.
- Import is forward-only. Restore the target from approved backup or create a reviewed forward-repair migration; never copy authority rows manually.
- Outbox publication is deliberately not activated by this increment. Pending events remain durable and visible for the later governed publisher/Service Bus work.

## Evidence and limitations

Developer tests cover PostgreSQL-compatible schema/migration execution, atomic state/receipt/outbox persistence, stable replay and conflicting-key failure, concurrent commands, restart, rollback on interruption, synthetic import deduplication, invariant checks and cross-workspace denial. CI additionally runs the adapter against an ephemeral PostgreSQL 17 service.

This is not independent QA, Stage evidence, performance/capacity evidence, backup/restore proof, Azure managed-identity conformance, or production approval. The current store still includes preview document/task state in the workspace aggregate, and the file artifact route remains synthetic-only. Those boundaries must be split and validated by later governed work before production activation.
