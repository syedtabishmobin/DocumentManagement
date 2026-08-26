# Phase 1 Deployment, Rollback, and Repair Standard

| Field | Value |
|---|---|
| Document ID | `OPS-DEP-001` |
| Version | `0.1` |
| Status | **DRAFT — architecture, security, privacy, operations, data, and quality approval required** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |
| Primary trace | `ARCH-P1-005`, `019`–`032`, `039`–`045`, `ADR-ARCH-002`, `ADR-ARCH-004`, `SEC-P1-030`, `NFR-P1-005`, `016`–`021`, `026`–`043` |

## 1. Purpose and boundary

This standard defines release deployment, compatible data evolution, verification, containment, rollback, forward repair, and reconciliation. It selects no deployment topology, runtime, orchestrator, database, queue, rollout method, migration tool, or cloud product. “Rollback” means selecting a prior compatible release/configuration or reversing a reversible infrastructure change; it never means rewriting immutable domain/audit history or restoring deleted/stale authority.

Build/promotion evidence comes from [`OPS-CICD-001`](02-ci-cd.md), infrastructure from [`OPS-IAC-001`](03-infrastructure-as-code.md), secrets/configuration from [`OPS-SEC-001`](04-secrets-and-configuration.md), and restore restrictions from [`OPS-DR-001`](06-backup-and-disaster-recovery.md).

## 2. Deployment and release manifest

A deployment manifest binds: release/candidate and artifact digests; source/build provenance; target environment/infrastructure generation; API/event/schema/reference/configuration/policy/prompt/tool/model/adapter/parser versions; migration/backfill/projection plan; supported compatibility window; secret/key references; capability/route decisions; current incident/drift state; expected consumers/workers; pre/post gates; rollout/containment method; audit/change approvals; and rollback/forward-repair/runbook references.

The deployment is a durable state machine with at least proposed, approved, applying, migrating, verifying, contained, rolling back, forward-repairing, completed, failed, and reconciliation-required outcomes as applicable. It must never report success because an artifact was merely started.

## 3. Expand, migrate, contract model

| Phase | Required behavior |
|---|---|
| Expand | Add compatible schema/API/event/configuration capacity first; old readers/writers remain safe; no meaning or authority silently changes. |
| Migrate | Move/backfill/rebuild through checkpointed, idempotent, observable work with exact source/target revisions, deletion/authorization policy, and reconciliation. |
| Contract | Remove old shape/decoder/field/index only after all supported producers/consumers, replay/restore paths, retained data, and rollback plans no longer require it under approved policy. |

Destructive one-step change is prohibited unless a separately approved exceptional plan proves no retained/replay/rollback consumer, no data/evidence loss, and a safe forward-repair path.

## 4. Stable deployment rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-DEP-P1-001` | Every deployment MUST reference one immutable approved release candidate, exact environment/infrastructure/configuration generations, migration/compatibility plan, decision state, and accountable change authority. |
| `OPS-DEP-P1-002` | The artifact digest deployed MUST equal the promoted candidate digest; environment-specific rebuild, mutable tag substitution, or unrecorded binary patch invalidates approval and requires containment. |
| `OPS-DEP-P1-003` | Preflight MUST verify target identity/class, infrastructure and configuration drift, route/residency eligibility, secret/key versions, backup/recovery readiness, incident state, capacity policy, and applicable NFR/control evidence. |
| `OPS-DEP-P1-004` | Deployment orchestration MUST persist truthful state, attempt, actor/workload, approval, progress, partial/unknown outcome, verification, and repair so interruption cannot make the change disappear or appear complete. |
| `OPS-DEP-P1-005` | Request, approval, execution, privileged state/secret access, and verification duties MUST be separated by consequence; application/model/event input cannot authorize deployment. |
| `OPS-DEP-P1-006` | The change set MUST enumerate application, infrastructure, schema, data, event, API, configuration, policy, prompt/tool/model, adapter/route, projection, cache, secret/key, telemetry, backup, and runbook impacts. |
| `OPS-DEP-P1-007` | All mapped CI/CD gates, risks, waivers, recovery evidence, compatibility proofs, and open-decision checks MUST pass before deployment; missing evidence is blocked, not “unknown success.” |
| `OPS-DEP-P1-008` | A deployment MUST NOT activate any capability, connector/channel, continuity/recovery path, source/profile, clinical disposition, score, retention duration, processor, region, or failover route that lacks its approved decision and contract. |
| `OPS-DEP-P1-009` | Any chosen rollout method MUST preserve current authorization, workspace isolation, schema compatibility, event ordering/idempotency, audit, deletion fences, and route policy throughout mixed-version operation. |
| `OPS-DEP-P1-010` | Persistent schema change MUST use compatible expand, migrate, and contract phases unless an approved evidence-backed exception demonstrates equal safety; new code MUST tolerate the declared old shape before it is deployed. |
| `OPS-DEP-P1-011` | During a compatibility window, every active application/worker, migration, replay decoder, restore reader, and administrative tool MUST declare accepted schema/configuration versions and fail safely on unknown security/consequence fields. |
| `OPS-DEP-P1-012` | Transitional dual read/write or translation MAY exist only under a versioned mapping with one canonical owner, deterministic precedence, idempotency, divergence detection, privacy/deletion lineage, and a bounded retirement policy reference. |
| `OPS-DEP-P1-013` | Backfill/migration/rebuild MUST use stable job identity, exact source/target generations, checkpoints, idempotency, concurrency guards, safe counts/digests, retry/repair states, and current authorization/deletion/residency checks. |
| `OPS-DEP-P1-014` | Migration MUST be resumable after interruption and safe under duplicate/reordered work. A retry cannot create duplicate facts, versions, events, effects, grants, exports, or purge acknowledgements. |
| `OPS-DEP-P1-015` | Old columns/shapes/decoders/events/configuration/projections MUST NOT be contracted until consumer watermarks, retained replay/restore obligations, audit/evidence needs, and rollback policy prove they are no longer required. No duration is invented under `DEC-039`. |
| `OPS-DEP-P1-016` | A backup is not a migration strategy. Before an irreversible data change, the plan MUST prove compatible restore or forward reconstruction and explain why restore would not reintroduce stale authorization, deletion, vulnerable code, or ineligible placement. |
| `OPS-DEP-P1-017` | API deployment MUST preserve `API-STD-001` version, error, idempotency, concurrency, job, authorization, and minimal-disclosure contracts for every supported client; breaking change requires a new supported major and migration plan. |
| `OPS-DEP-P1-018` | Event deployment MUST preserve immutable published schemas, stable `EVT-P1-*` meaning, aggregate order, at-least-once/idempotent handling, old/new producer-consumer compatibility, retained decoders, and dead-letter/replay repair. |
| `OPS-DEP-P1-019` | Configuration/policy deployment MUST use immutable approved packages and consumer compatibility acknowledgements. Publication or `EVT-P1-031` alone does not grant activation; stale or missing consequential config fails closed. |
| `OPS-DEP-P1-020` | Derived-store change/rebuild MUST create a new generation, validate source/config/policy/deletion watermarks, authorization, coverage and integrity, then cut over atomically/safely; mixed or partial generations remain unavailable or explicitly stale. |
| `OPS-DEP-P1-021` | Deployment MUST preserve committed aggregate/outbox/audit obligations and publisher/consumer checkpoints. Stopping or replacing a worker cannot lose, mutate, invent, or mark a pending event applied. |
| `OPS-DEP-P1-022` | Queue/backlog, dead-letter, replay, scheduler, and workflow changes MUST preserve event bytes/IDs, subscriptions/scopes, causation/correlation, attempt/replay identity, ordering/gaps, retry policy, and visible reconciliation state. |
| `OPS-DEP-P1-023` | Current authorization epoch, quarantine/security suspension, cancellation, source health, approval/effect digest, residency eligibility, and authoritative deletion fence MUST be checked during migration, replay, rebuild, verification, and cutover. |
| `OPS-DEP-P1-024` | External calls/effects MUST be drained, paused, reconciled, or safely handed over using exact idempotency/reconciliation identity. Deployment retry or timeout MUST NOT repeat an unknown real-world effect. |
| `OPS-DEP-P1-025` | Verification MUST cover service and control health, API/event compatibility, migration counts/digests, audit/outbox gaps, authorization/deletion propagation, projection/backlog state, route placement, telemetry hygiene, cost, and user-safe degraded behavior. |
| `OPS-DEP-P1-026` | Incremental exposure, canaries, dark evaluation, or staged activation MAY reduce blast radius but MUST use synthetic or authorized minimum data and MUST NOT replace contract, security, privacy, deletion, residency, accessibility, AI, performance, or recovery gates. |
| `OPS-DEP-P1-027` | A safe rollback requires a retained approved artifact/configuration, backward-compatible persisted state/events, eligible routes, compatible secrets/keys, and evidence that returning will not restore a known vulnerability, revoked authority, purged data, or unsafe behavior. |
| `OPS-DEP-P1-028` | Rollback is prohibited when it would resurrect deleted data, reverse an irreversible external effect, lose append-only history, use an incompatible schema/event, restore stale authorization/configuration, re-enable a vulnerable path, or enter an ineligible region/processor. |
| `OPS-DEP-P1-029` | When rollback is unsafe, forward repair MUST create additive corrective state/configuration/schema, reconcile each affected item, preserve original evidence, and keep the capability contained/degraded until verification passes. |
| `OPS-DEP-P1-030` | A zero-tolerance failure or active exploit MUST trigger immediate containment or affected-capability disablement, preserve evidence, prevent further consequence, and enter the incident process before availability optimization. |
| `OPS-DEP-P1-031` | Deployment, migration, cutover, rollback, repair, containment, and verification MUST emit immutable privacy-safe evidence tied to exact artifacts/configuration/state and per-step outcomes; raw content or secrets are prohibited. |
| `OPS-DEP-P1-032` | Deployment and repair MUST preserve `DEC-038`, `DEC-039`, and `DEC-040`: no user-authority recovery, no invented deletion/backup duration or false completion, and no automatic or assumed cross-region/processor failover. |

## 5. Rollback versus forward-repair decision matrix

| Situation | Required default |
|---|---|
| Stateless/reversible application defect; persisted contracts remain compatible | Contain, then select a verified retained release if all current policy and route gates pass |
| Additive configuration defect | Select a retained compatible eligible package or publish an additive corrected version; retain the faulty publication/audit history |
| Data migration partially applied | Stop writers/workers as needed, resume/reconcile by checkpoint, or forward-repair; do not restore an older database over newer committed truth |
| Published event/API/schema consumed externally | Preserve published contract; deploy compatible decoder/producer repair or new version; never rewrite prior event/schema bytes |
| Consequential external effect unknown/partial | Reconcile provider/real-world state before retry, reversal, compensation, or closure |
| Security vulnerability or credential compromise | Contain/disable, revoke/rotate, assess exposure, deploy verified repair; do not roll back to another vulnerable or stale-authority release |
| Deletion/residency fence conflict | Keep blocked; forward-repair placement/lineage/consumer state. Rollback/failover cannot bypass the fence |

## 6. Completion evidence

A deployment is complete only when the exact desired artifact/configuration is active, migrations and projections reach declared reconciled state, required consumers/watermarks are compatible, current authorization/deletion/residency controls pass, required audit/outbox evidence has no unexplained gap, health/SLIs report valid data, and no stop-ship condition remains. Availability alone is not completion.
