# Phase 1 Backup and Disaster-Recovery Standard

| Field | Value |
|---|---|
| Document ID | `OPS-DR-001` |
| Version | `0.2` |
| Status | **APPROVED IMPLEMENTATION BASELINE — service RPO/RTO/cadence targets remain provisional** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `ARCH-P1-026`–`032`, `039`–`055`, `SEC-P1-009`–`012`, `027`–`037`, `NFR-P1-026`–`032`, `048`, `DEC-038`, `DEC-049`–`054` |

## 1. Purpose, authority, and provisional status

This document defines the Azure Phase 1 backup classes, recovery objectives, protected backup manifests, restore/failover gates, and exercise evidence. `ADR-ARCH-007` selects Azure and Bicep; exact service tiers and customer-facing RPO/RTO promises remain release decisions.

All general service objectives below are copied from [`ARCH-NFR-001`](../02-architecture/05-non-functional-requirements.md) and remain **PROVISIONAL**. `DEC-038` still blocks user/account/workspace recovery design. `DEC-049` approves Australia East as primary and only approved Australian paired-region recovery routes; `DEC-050` means backups contain ciphertext and wrapped keys, not an operator plaintext recovery path; and `DEC-053` approves the exact document Trash deadline and final-purge contract.

Infrastructure restore follows [`OPS-IAC-001`](03-infrastructure-as-code.md), secret/key recovery follows [`OPS-SEC-001`](04-secrets-and-configuration.md), deployment/serviceability follows [`OPS-DEP-001`](05-deployment-rollback-and-repair.md), recovery telemetry follows [`OPS-OBS-001`](07-observability.md), and exercise evidence follows [`ENG-TST-001`](../08-engineering/06-testing-standards.md).

## 2. Provisional objective register

| NFR | Provisional planning target; not yet approved | Operations interpretation |
|---|---|---|
| `NFR-P1-026` | `RPO 0` after success acknowledgement for accepted originals and consequential canonical transitions | A success cannot precede the durable/recoverable original, fact/rule resolution, approval, consequential outcome, deletion fence, and required audit obligation |
| `NFR-P1-027` | `RPO ≤5 minutes` for other mutable operational/domain state after a declared regional/service disaster | Compare restored aggregate/workflow revisions and make lost/replayed derived state explicit and repairable |
| `NFR-P1-028` | `RPO 0` for required security/consequential audit; gap detection `≤5 minutes`, reconciliation begins `≤30 minutes` | Audit outage blocks/leaves work incomplete; restored audit/outbox checkpoints must reconcile before service |
| `NFR-P1-029` | Authorization/deletion enforcement `≤1 hour`; authenticated core read/write and original access `≤4 hours` | RTO ends only after integrity, policy, deletion, audit, schema, key, and residency service gates pass |
| `NFR-P1-030` | Metadata/full-text search `≤8 hours`; semantic/vector, graph, comparison, readiness, and conversation projections `≤24 hours` | Rebuild into new validated generations; canonical fallback remains truthful while derivatives are unavailable/stale |
| `NFR-P1-031` | Backup control checks daily, sampled restore monthly, full DR quarterly; `100%` of scheduled exercises completed or escalated | Cadence and threshold remain provisional and require owners to approve population, evidence, and release consequence |
| `NFR-P1-032` | `100%` of recovery/owner-transfer routes denied under approved `DEC-038` | Infrastructure/data restore never transfers human identity, workspace ownership, factors, keys, grants, or private-resource authority |

No RPO/RTO target permits unsafe restore, stale authorization, missing audit, deletion resurrection, or ineligible placement. If a target cannot be met safely, the service/capability remains unavailable or explicitly degraded.

## 3. Backup class and eligibility matrix

| Data role/class | Authority and draft objective class | Backup/rebuild contract | Restore/service gate |
|---|---|---|---|
| Accepted original artifacts | Put-once authoritative evidence; `NFR-P1-026` provisional RPO 0 | Integrity-preserving encrypted backup/replication with exact artifact/version/digest and deletion lineage | Digest/integrity, workspace, key, placement, lifecycle/fence, audit |
| Consequential canonical state | Facts/rules, approval/action outcomes, deletion fences, required security transitions; `NFR-P1-026` provisional RPO 0 | Transaction/checkpoint plus event/audit reconciliation; additive history preserved | Aggregate revision/invariants, current policy, fence/tombstone, schema/config, audit |
| Other mutable domain/workflow state | `NFR-P1-027` provisional RPO ≤5 minutes | Versioned checkpoint and replay/repair; missing state remains visible | Revision/count, accepted-work state, idempotency, outbox/event/audit reconciliation |
| Outbox, events, scheduler/workflow checkpoints | Durable obligations under `ADR-ARCH-004` | Preserve immutable event bytes/IDs/order and subscription/checkpoint state; at-least-once replay safe | Schema decoder, aggregate gaps, duplicate/reorder, current policy/fence, DLQ/repair |
| Audit/provenance | Append-only evidence; `NFR-P1-028` provisional RPO 0 for required classes | Independently integrity-verifiable encrypted backup with checkpoints/gap evidence | Integrity chain, sequence/gaps, schema, residency, access/minimization, domain reconciliation |
| Configuration, policy, schemas, reference data, release manifests | Immutable versions required to interpret/recover state | Retain every version required by supported/replayable/restorable data and artifacts | Integrity/signature, compatibility, effective state, decision fences, consumer readiness |
| Search/vector/graph/comparison/conversation projections | Rebuildable derivatives; provisional RTO under `NFR-P1-030` | Backup only when approved policy/cost/residency justifies it; canonical rebuild remains required | New generation, source/policy/deletion watermarks, authorization, coverage, freshness |
| Caches, transient exports, temporary processing | Non-authoritative and minimized | Excluded or short-lived only under approved policy; never the sole recoverable source | Recreate only after authorization/fence; expired/revoked/deleted items stay absent |
| Wrapped document keys and protected recovery material | Customer-controlled key authority under `ADR-ARCH-008` | Preserve only ciphertext, wrapped key envelopes and approved recovery ciphertext; platform backup cannot reconstruct a customer recovery secret | Envelope version/status, customer authorization, route, crypto-vector compatibility, no operator plaintext path and no `DEC-038` bypass |
| Infrastructure/configuration state | Desired/observed environment evidence | Protected declarative state plus source/provenance; no raw secret output | Environment identity, drift, policy, route, compatible release and least privilege |

The implemented matrix MUST further enumerate every canonical aggregate, artifact store, derivative, export, connector copy, event/dead-letter store, audit store, telemetry store, configuration registry, infrastructure state, secret/key role, replica, backup generation, and DR copy. An omitted data role is not implicitly protected or exempt.

## 4. Stable backup and recovery rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-DR-P1-001` | Every authoritative, derived, operational, audit, configuration, secret/key, infrastructure, telemetry, export, connector, replica, backup, and DR data role MUST be inventoried with owner, classification, purpose, workspace/reference scope, authority/rebuildability, RPO/RTO class, retention/deletion lineage, key, and residency route. |
| `OPS-DR-P1-002` | Azure backup and recovery mechanisms MUST remain behind versioned manifests and portable application contracts. Dev/stage use synthetic data in the current subscription; production uses a separately approved subscription and Australia-only approved routes. |
| `OPS-DR-P1-003` | Backup write/read/restore, key custody, production administration, deletion acknowledgement, and service-release authority MUST be least-privileged and separated; backups are not a support browsing path. |
| `OPS-DR-P1-004` | Backup data and manifests MUST be encrypted in transit/at rest, integrity-protected, access-controlled, classified, and auditable under key domains separated from ordinary application authority. |
| `OPS-DR-P1-005` | Each backup generation MUST record safe data-role/scope, source/checkpoint revisions, time bounds, schema/configuration/release versions, integrity/count evidence, encryption/key reference, placement/route, deletion watermark, prior/base dependency, and verification state. |
| `OPS-DR-P1-006` | Backup completeness MUST be reconciled against registered data roles and producer checkpoints. A successful backup job without application-level integrity, gap, placement, deletion, and recoverability evidence is not a successful backup control. |
| `OPS-DR-P1-007` | Accepted originals and consequential canonical transitions MUST satisfy the provisional `NFR-P1-026` RPO-0 evidence before success acknowledgement; backup alone cannot compensate for an acknowledgement issued before durable authority/outbox/audit obligations. |
| `OPS-DR-P1-008` | Other mutable domain/operational state MUST be measured against the provisional `NFR-P1-027` RPO; lost, replayed, duplicated, or reconstructed state MUST be explicit and reconciled by aggregate/workflow revision. |
| `OPS-DR-P1-009` | Required security/consequential audit MUST satisfy provisional `NFR-P1-028`; audit unavailable blocks/leaves work incomplete, and backup/restore MUST preserve independent integrity checkpoints and detectable gaps. |
| `OPS-DR-P1-010` | Derived projections MUST remain rebuildable from retained authoritative records and versioned transforms. A projection backup MUST NOT become independent truth or bypass source authorization, freshness, deletion, or rebuild validation. |
| `OPS-DR-P1-011` | Backup validation MUST cover original digests, aggregate revisions/invariants, event/outbox/audit reconciliation, schema/configuration availability, key usability, deletion lineage, placement, safe counts, and sampled application-level reads without ordinary content leakage. |
| `OPS-DR-P1-012` | Retention, backup frequency, residual, and audit-minimization rules MUST be versioned policy. User-deleted document content has the approved 30-calendar-day Trash deadline; any longer legally required content retention is a production blocker unless explicitly approved and disclosed. |
| `OPS-DR-P1-013` | The authoritative deletion fence/tombstone and its generation MUST be protected at least as strongly as the data it denies and MUST be available to every backup, replay, rebuild, restore, connector, cache, and serviceability gate. |
| `OPS-DR-P1-014` | Backup copies containing deletion-fenced lineage remain unavailable to ordinary access and restore. At the 30-day deadline, the key envelope and every serviceable artifact are purged or cryptographically destroyed; immutable content-free deletion evidence may remain under approved policy. A per-role acknowledgement alone cannot mark `DeletionCase` complete. |
| `OPS-DR-P1-015` | Restore MUST begin in an isolated non-serviceable environment with explicit restore identity, source generation, scope, target, reason, approvers, policy versions, expected RPO/RTO, and per-gate evidence. |
| `OPS-DR-P1-016` | Before materialization or activation, restore MUST apply current deletion fences/tombstones, authorization/security policy, quarantine, consent/purpose, schema/configuration, and processing/residency eligibility—not only the historical state inside the backup. |
| `OPS-DR-P1-017` | Restored identity, membership, owner, grant, session, factor, key, and recovery records MUST NOT grant serviceable authority until current authorization and `DEC-038` rules pass; infrastructure recovery is not account/workspace recovery. |
| `OPS-DR-P1-018` | Failover is permitted only through the approved Australian route matrix in `DEC-049`. Availability cannot create a cross-border exception; an ineligible or unknown route remains unavailable. |
| `OPS-DR-P1-019` | Key/secret recovery MUST use separately approved custody, identity, purpose, version/status, route, quorum/duty separation where required, audit, rotation/disable, and post-recovery verification; insecure key fallback is prohibited. |
| `OPS-DR-P1-020` | Every schema, decoder, migration, configuration, policy, prompt/tool/model/adapter, and release version required to interpret retained backup/event/audit data MUST remain available or have a tested lossless migration/forward-repair path. |
| `OPS-DR-P1-021` | Incremental/differential backup dependency chains MUST be complete, ordered, integrity-verified, and restorable without an unavailable/expired base. Chain repair cannot fabricate a checkpoint or hide missing committed data. |
| `OPS-DR-P1-022` | Recovery-point selection MUST consider incident/compromise time, schema/configuration compatibility, authorization/deletion state, external effects, event/audit continuity, and residency. The newest point is not automatically the safest point. |
| `OPS-DR-P1-023` | Partial restore, missing role, incompatible decoder, key failure, audit gap, stale fence, route ineligibility, or unverifiable integrity MUST remain a visible blocked/partial/reconciliation state; it MUST NOT be labelled recovered. |
| `OPS-DR-P1-024` | Backup control checks, sampled restores, and full DR exercises MUST be scheduled and evidenced against provisional `NFR-P1-031`; missed or failed exercises are escalated and block release when `ARCH-NFR-001` requires. |
| `OPS-DR-P1-025` | Minimum safe-core recovery MUST be timed against provisional `NFR-P1-029`; the clock ends at service capability passing policy, integrity, deletion, residency, schema, key, and audit gates, not infrastructure startup. |
| `OPS-DR-P1-026` | Rebuildable-capability recovery MUST be timed against provisional `NFR-P1-030`; queries remain explicit unavailable/stale/partial and use canonical fallback only where the owning contract permits. |
| `OPS-DR-P1-027` | Recovery verification MUST include cross-workspace isolation, current authorization, original integrity, event/order/idempotency, audit gaps, configuration/version, deletion resurrection, route/egress, secret/key, external-effect reconciliation, capacity/backlog, telemetry hygiene, and user-safe degradation. |
| `OPS-DR-P1-028` | A restored environment becomes serviceable only through an approved deployment/release transition proving compatible artifact/configuration, consumer watermarks, health/SLIs, current fences/policy, eligible route, and no stop-ship finding. |
| `OPS-DR-P1-029` | Failback/reintegration MUST use the same compatibility, migration, event, idempotency, authorization, deletion, residency, audit, and external-effect reconciliation gates as ordinary deployment; bidirectional merge is never assumed safe. |
| `OPS-DR-P1-030` | Recovery exercises and incidents MUST produce immutable privacy-safe timelines/manifests with objective timestamps, expected/actual RPO/RTO, gaps, control outcomes, decisions, owners, remediation, and retest; ordinary reports contain no raw household content or secrets. |
| `OPS-DR-P1-031` | Production backup/restore testing MUST NOT copy customer content into local/shared/pre-production environments. Exercises use synthetic data or isolated approved recovery inputs with equal access, purpose, residency, deletion, and evidence controls. |
| `OPS-DR-P1-032` | No backup, restore, replica, snapshot, key, failover, or DR mechanism may close `DEC-038`, bypass customer-controlled encryption, extend the `DEC-053` Trash deadline, or use a route outside `DEC-049`. Unknown state keeps the affected recovery path disabled. |

## 5. Restore gate sequence

1. Declare incident/recovery scope and prevent unsafe writes/effects.
2. Authenticate/authorize recovery actors and validate source generation, integrity, keys, placement, and chain.
3. Restore infrastructure and data into an isolated environment.
4. apply current schema/configuration/policy plus deletion fences/tombstones before any service access;
5. reconcile originals, aggregate revisions, outbox/events/workflows, audit/checkpoints, external effects, and deletion roles;
6. rebuild and validate projections in new generations;
7. run security/privacy/residency/compatibility/functional/performance and telemetry gates;
8. obtain independent service-release approval, then expose only capabilities whose gates pass; and
9. retain explicit residual/repair state and conduct after-action remediation/retest.

## 6. Definition of recovered

“Recovered” is capability-specific and evidence-backed. It never means only that infrastructure is running or a backup command returned success. Any missing integrity, authority, fence, audit, placement, compatibility, or reconciliation evidence keeps the affected capability blocked or explicitly degraded.
