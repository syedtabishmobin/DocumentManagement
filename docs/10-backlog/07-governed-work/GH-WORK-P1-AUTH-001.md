# GH-WORK-P1-AUTH-001 — transactional durable workspace authority persistence

Authoritative work record: [GitHub Issue #2](https://github.com/syedtabishmobin/DocumentManagement/issues/2)

## Evidence-backed disposition

| Area | Disposition | Evidence and consequence |
|---|---|---|
| Workspace/owner/subject/membership/grant/epoch model and policy | `REUSE` | Revision `7b62573` already has separate logical identities, explicit grants, creation receipts, deny-by-default evaluation and recovery fences. |
| Persistence/application seam | `REFACTOR` | `LocalStore` previously owned file I/O directly; it now accepts a provider-neutral transaction persistence port while preserving controller/client behavior. |
| PostgreSQL durability, migration and outbox evidence | `EXTEND` | `ADR-ARCH-004` requires transactional audit/event coupling and `ADR-ARCH-007` selects PostgreSQL Flexible Server. |
| Cosmos SDK and Bicep declarations | `REPLACE_SELECTIVELY` | No runtime code used Cosmos, and its declaration contradicted the accepted managed-service ADR. Historical deployed-resource evidence is retained. |
| Existing local identity/session, web and Flutter behavior | `REUSE` | Out of scope and regression protected; no provider activation or client behavior is redefined. |

No Product Authority decision is required. Exact paid SKU and production activation remain explicit release inputs under `ADR-ARCH-007` and are not selected by this work.

## Acceptance and evidence map

| ID | Criterion | Implementation evidence | Verification owner/status |
|---|---|---|---|
| `AUTH-DUR-AC-01` | Approved adapter contract and canonical invariants | `workspace-state.ts`, `postgres-workspace.persistence.ts`, `0001_workspace_authority.sql`, `ADR-ARCH-004/007` | Developer evidence implemented; independent architecture/data review pending |
| `AUTH-DUR-AC-02` | Atomic creation, stable replay, conflicting-key failure | Serializable transaction, unique hashed receipt, correlated audit/outbox; PostgreSQL-compatible and real-service integration tests | Developer tests implemented; CI run pending PR |
| `AUTH-DUR-AC-03` | Concurrent creation/update and optimistic concurrency | Per-workspace storage revisions, compare-and-update, bounded serialization retry, cross-connection CI test | Developer tests implemented; independent concurrency retest pending |
| `AUTH-DUR-AC-04` | Restart/interruption causes no partial/fabricated/cross-workspace authority | New adapter instance reload plus thrown-operation rollback and invariant counts | Developer tests implemented; independent resilience retest pending |
| `AUTH-DUR-AC-05` | Current membership/grant/epoch remains deny by default | Existing policy reused; durable reload and foreign-workspace negative tests | Developer regression implemented; security QA pending |
| `AUTH-DUR-AC-06` | Versioned, idempotent synthetic migration with verification and repair | Immutable SQL/checksums, explicit synthetic import, source-digest ledger, count/invariant verification, forward-repair policy | Developer tests implemented; migration QA pending |
| `AUTH-DUR-AC-07` | Content-minimized durable audit/event evidence | Dedicated outbox table; IDs/type/revision/correlation only; audit/outbox committed together | Developer tests implemented; security/privacy review pending |
| `AUTH-DUR-AC-08` | Developer tests and independent QA | Unit/integration suites and CI PostgreSQL 17 service | Developer portion implemented; independent QA deliberately not self-attested |
| `AUTH-DUR-AC-09` | Repository, infrastructure, migration and security gates pass | `pnpm verify`, Bicep compile, PostgreSQL CI integration | Local gate and PR CI evidence to be linked |
| `AUTH-DUR-AC-10` | Status, traceability, operations and residual work truthful | This map, `OPS-PG-AUTH-001`, onboarding/status/remaining-work/IaC updates | Implemented in change; PR/Issue links pending |

## Independent QA history

The first independent review of candidate `6f25df79d9cb3925d30eaf4ca90f6e568464b36b` failed and blocked approval and merge. The assurance task recorded four evidence-backed defects against Issue #2 and PR #4:

- [Issue #5](https://github.com/syedtabishmobin/DocumentManagement/issues/5): cross-workspace nested authority records were accepted by invariant verification (`AUTH-DUR-AC-01`, `03`, `04`, `06`).
- [Issue #6](https://github.com/syedtabishmobin/DocumentManagement/issues/6): a foreign-workspace membership could authorize after durable reload (`AUTH-DUR-AC-04`, `05`).
- [Issue #7](https://github.com/syedtabishmobin/DocumentManagement/issues/7): non-local profiles allowed TLS without server-certificate verification (`AUTH-DUR-AC-09`).
- [Issue #8](https://github.com/syedtabishmobin/DocumentManagement/issues/8): a digest replay could report verified reuse after target corruption (`AUTH-DUR-AC-06`, `10`).

The remediation candidate strengthens persisted graph invariants, requires membership workspace scope during authorization, requires `verify-full` TLS outside local development, prevents connection-string TLS overrides, revalidates replay state and retained migration evidence, and records `REPAIR_REQUIRED` instead of false success. Developer unit, regression and PostgreSQL-service tests cover the reported reproductions, concurrency and transaction rollback. The defects remain open and PR #4 remains blocked until the independent assurance task retests the exact new commit and records its result.

## Release boundary

This increment does not complete `STORY-P1-001`–`003`, `039` or `040`. External identity, delegated grants, field/edge/search/result authorization, production database provisioning, Azure conformance, backup/restore, performance, independent QA and release gates remain open. PostgreSQL runtime activation and real customer data remain prohibited.
