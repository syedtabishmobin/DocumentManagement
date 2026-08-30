# GH-WORK-P1-AUTHZ-002 — current resource, field, edge, and action authorization

Authoritative work record: [GitHub Issue #46](https://github.com/syedtabishmobin/DocumentManagement/issues/46)

## Evidence-backed implementation disposition

| Area | Disposition | Evidence and consequence |
|---|---|---|
| Existing explicit-grant evaluator and workspace aggregate | `EXTEND` | The evaluator already denied absent membership/grant, expiry, export shortcuts and cross-workspace access. Version `0.2` adds explicit field/edge scope, deny precedence, grant revision and current-epoch fences without replacing the provider-neutral boundary. |
| Derived/direct output authorization | `REFACTOR` | Document detail/artifact, deterministic assistant output and dashboard projections now use candidate/output fences and suppress protected fields/edges rather than treating container access as blanket disclosure. |
| Current effect authorization | `REFACTOR` | Document, fact, subject/person, membership, task, deletion/restore, export, recovery and canonical grant effects reauthorize the exact grant/revision/policy/epoch inside the durable mutation. A queued effect cannot use a known-stale allow. |
| Bounded decision execution | `REFACTOR` | Dashboard input/output decisions are evaluated in bounded transactional batches, retaining per-decision audit/outbox evidence without one persistence transaction per projected item. Numeric availability/latency targets remain provisional and are not claimed by this local evidence. |
| Canonical `API-P1-112`–`API-P1-115` routes | `EXTEND` | The approved OpenAPI paths existed without an implementation. The bounded Phase 1 implementation adds authorized collection/get, homogeneous known-resource creation and revision-guarded revocation with opaque pagination and command replay. |
| Durable authorization evidence | `EXTEND` | Additive canonical migration `0002_authorization_decision_evidence.sql` carries policy version, epoch, phase and safe reason in the PostgreSQL authority outbox. Raw values, prompts and document content are excluded. |
| Advanced grants, guest redemption and independent delegation | `REUSE` future boundary | Those semantics remain governed by `STORY-P1-039`; this work accepts only an active member identity, one purpose, known homogeneous resources and `allow_onward_delegation=false`. |

No Product Authority decision is required. `ADR-ARCH-003`, `AUTH-P1-001`–`035` and the approved Phase 1 scope already select current authoritative reauthorization and fail-closed uncertainty.

## Acceptance and developer evidence map

| ID | Criterion | Implementation evidence | Current status |
|---|---|---|---|
| `AC-STORY-P1-003-01` | Container access does not disclose an unauthorized sensitive value, edge, path or effect while authorized information remains usable. | `authorization.policy.test.ts` resource/field/edge/action and deny-precedence matrix; `local.store.test.ts` restricted-member document metadata with unavailable preview and empty facts/edges; protected artifact denial; authorized broad-scope recovery. | Developer evidence PASS; independent QA required. |
| `AC-STORY-P1-003-02` | Revocation or epoch change before output/effect blocks or minimizes the result and records propagation evidence. | Reusable exact `AuthorizationFence`; candidate/output/effect checks; bounded grant revoke advances epoch; stale queued output and task effect deny; unchanged task state proves no post-fence effect; audit/outbox records policy/epoch/phase/reason; file, PostgreSQL-compatible and real-PostgreSQL integration tests. | Developer evidence PASS locally; real PostgreSQL/protected CI and independent QA required. |
| `API-P1-112`–`115` | List/create/get/revoke bounded grants under current authorization. | `access-grant.controller.test.ts` covers create/replay/conflict, bounded response, pagination, get, revision-guarded revoke/replay/stale command and stale cursor invalidation. | Developer HTTP conformance PASS; independent black-box retest required. |
| Migration / rollback / repair | Additive interpretation changes preserve old decoder behavior without broadening unproven grants. | Legacy grants gain wildcard field/edge scope only when an active owner binding proves the same grantor/grantee owner; every other missing legacy scope becomes empty and fails closed. Onward delegation remains false. Migration checksum/verify tests remain active. | Developer evidence PASS; independent migration retest required. |

`TEST-PERF-P1-001` and `TEST-PERF-P1-006` remain draft release tests. This increment proves deterministic fail-closed semantics, zero post-fence output/effect in its synthetic cases, and bounded dashboard decision transactions; it does not claim the provisional monthly availability or production convergence percentiles.

## Explicit completion boundary

This record does not claim Stage, BA, UAT, `FEAT-P1-002`, either parent outcome, or product completion. Future search/vector/graph/AI/connector consumers must adopt and independently prove the shared current-policy fence in their own governed stories. Independent QA must review the exact candidate, negative and edge cases, prior Story P1-001/P1-002 regressions, real PostgreSQL execution, protected CI, privacy-safe evidence and the absence of a hidden grant/relationship shortcut before Issue #46 can be DEV-accepted.
