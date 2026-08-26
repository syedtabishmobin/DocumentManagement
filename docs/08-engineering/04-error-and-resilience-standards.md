# Phase 1 Error and Resilience Standards

| Field | Value |
|---|---|
| Document ID | `ENG-ERR-001` |
| Version | `0.1` |
| Status | **DRAFT — mechanism- and provider-neutral** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |
| Primary inputs | `API-STD-001`, `API-EVT-001`, proposed `ADR-ARCH-004`, `ARCH-NFR-001`, security/privacy/audit contracts |

## 1. Purpose and safety stance

This document defines truthful error, retry, concurrency, async consistency, replay, dead-letter, degradation, and repair behavior. It does not select libraries, protocols beyond existing API/event contracts, queue/workflow products, backoff durations, retry counts, circuit thresholds, timeout values, or operational products. Such values require capability-specific evidence and approved configuration; unset consequential values disable or safely bound the route.

A fail-closed result may be secure while still counting as unavailable. Resilience never means fabricating success, returning stale data as current, weakening authorization, crossing an ineligible region, skipping audit, releasing quarantine, repeating an unknown external effect, or resurrecting deleted data.

## 2. Error model

Every failure is represented in three separately owned views:

| View | Purpose | Permitted contents |
|---|---|---|
| Caller problem | Safe stable machine code, title, status, correlation, invalid-field safe pointers, retry/concurrency guidance where valid | No protected existence, provider/internal topology, stack, content, credentials, or unrestricted URL |
| Domain/workflow outcome | Exact owning state/revision, reason class, next allowed action, retry/cancel/repair/coverage/limitation state | Safe references and codes; never silently maps another owner's result to success |
| Restricted operational evidence | Root-cause class, component/contract versions, attempt, dependency, safe diagnostics, owner/repair | Minimized, access/residency/retention/deletion governed; raw content only in a separately approved restricted workflow |

Stable safe error classes are:

- `INVALID_REQUEST` — closed-schema, semantic, supported-size/type, or precondition input failure;
- `UNAUTHENTICATED` — no current valid identity/session;
- `FORBIDDEN` — authenticated but denied without confirming protected existence;
- `RESTRICTED` — a minimal-disclosure outcome allowed by policy;
- `NOT_FOUND_OR_NOT_DISCLOSED` — existence-safe absence/denial where policy requires convergence;
- `CONFLICT` — stale revision, state conflict, or idempotency fingerprint collision;
- `POLICY_BLOCKED` — quarantine, clinical, consent, approval, decision, residency, security, or deletion policy blocks;
- `RATE_OR_RESOURCE_LIMITED` — caller/workspace/capability budget or bounded-work limit;
- `DEPENDENCY_UNAVAILABLE` — required current capability cannot safely answer;
- `SCHEMA_OR_COMPATIBILITY_UNAVAILABLE` — unknown/incompatible version;
- `STALE_OR_PARTIAL` — explicitly bounded coverage/freshness limitation, never current completeness;
- `CANCELLED` — accepted cancellation observed at the owning safe point;
- `OUTCOME_UNKNOWN` — dispatch/effect may have occurred and requires reconciliation;
- `REPAIR_REQUIRED` — visible durable invariant/publication/projection/migration/replay repair; and
- `INTERNAL_FAILURE` — disclosure-safe unexpected failure with correlation and retained restricted evidence.

Exact API problem codes/statuses remain owned by `API-STD-001` and the OpenAPI contract. Domain outcomes are not inferred solely from HTTP status.

## 3. Retry classification

| Failure condition | Automatic retry | Required behavior |
|---|---|---|
| Invalid schema/semantic input | No | Return safe field/code; new corrected command uses a new or contract-consistent idempotency identity |
| Unauthenticated/forbidden/restricted | No blind retry | Reauthenticate or change approved authority/purpose; avoid existence/timing oracle |
| Stale ETag/aggregate revision | No same-write loop | Re-read authorized current representation and require an explicit user/workflow reconciliation |
| Idempotency key, different fingerprint | Never | Stable conflict; do not execute either interpretation |
| Rate/resource limit | Only under published bounded guidance | Respect safe server retry signal/budget; do not multiply fan-out |
| Transient dependency before effect | Only if operation is idempotent and budget remains | Backoff with jitter through an abstract policy; record attempt; cancellation/fence wins |
| Timeout after possible external effect | Not until reconciled | Enter `OUTCOME_UNKNOWN`/reconciliation; query by external command identity or require repair |
| Unknown/incompatible schema | No coercion | Quarantine/dead-letter/disable consumer or adapter until compatible decoder/repair |
| Poison event/invariant violation | No hot loop | Dead-letter quarantine with safe metadata and owner |
| Event gap/out-of-order | Hold/reconcile | Wait/replay exact missing order; never guess or overwrite newer state |
| Authorization/residency/deletion unavailable | No broad fallback | Fail closed or use an approved non-content/manual path |
| Quarantine/clinical/policy hold | No ordinary route retry | Await owning policy/review transition; preserve containment |
| Audit unavailable for consequential work | No success | Block or leave explicitly incomplete; reconcile audit obligation before completion |
| Telemetry unavailable | Product work may continue only if controls do not depend on it | Record visible observability degradation; never disable security/audit controls |

Retry policy is versioned per semantic operation/capability and defines maximum attempts/work/time, eligible codes, backoff/jitter class, idempotency scope, cancellation, deadline, rate budget, circuit interaction, audit, and terminal/repair outcome. This draft invents no durations.

## 4. Idempotency and concurrency

An idempotency record binds:

- semantic operation and contract version;
- workspace/platform scope, authenticated actor/grant or workload, and purpose;
- stable key and canonical request fingerprint;
- target aggregate/resource and expected revision where applicable;
- first-seen/retention policy reference, status, response/workflow/event identities;
- attempt/reconciliation state and safe error; and
- deletion/security state sufficient to prevent replay.

A repeated matching command returns/references the same logical outcome without repeating a consequence. A mismatch conflicts. The idempotency store cannot cross actors/workspaces or be treated as authorization. Current authorization, approval, quarantine, cancellation, residency, and deletion are rechecked before a pending replay or external effect even when the key matches.

Optimistic concurrency uses the contract ETag/expected aggregate revision. A precondition failure exposes a safe current revision token only where the caller may know the resource. Merge is explicit and domain-specific; no generic last-write-wins for facts, relationships, grants, approvals, actions, evidence, configuration, or deletion.

## 5. Transaction, outbox, and workflow consistency

For a local canonical command, success requires a durable aggregate transition or durable accepted workflow plus required event and audit publication obligations. A selected implementation must close these crash windows:

1. failure before canonical commit — no transition/event/effect exists;
2. failure after canonical commit but before send — outbox/equivalent remains discoverable and publishes the exact immutable event;
3. failure after send but before acknowledgement — redelivery preserves event identity; consumers deduplicate;
4. event published without authoritative transition — impossible by the chosen coupling or detected/quarantined as integrity failure;
5. audit unavailable — consequential work blocks or remains explicitly incomplete until reconciled; and
6. workflow accepted then worker lost — durable state remains queryable and repairable.

Workflows expose state/revision, safe progress/coverage, attempts, next action, cancellation, retry, blocked/degraded/partial/unknown/repair state, and terminal outcome. A queue entry is not workflow truth and disappearance is never completion.

## 6. Event consumption, replay, and dead-letter

Consumers use `event_id` for delivery deduplication and `(aggregate_revision, aggregate_event_index)` for per-aggregate order. Effect idempotency remains separate. Consumers:

- verify schema/event type/version, scope/workspace, aggregate identity/revision, correlation/causation, classification, and integrity before consequence;
- reject the same event ID with different bytes/meaning as an integrity incident;
- hold a forward gap, safely ignore/reconcile an older state replacement, and never invent order across aggregates;
- consult current authorization, policy/configuration, source health where relevant, quarantine, cancellation, residency route, and authoritative deletion fence;
- checkpoint only after the consumer's durable consequence/idempotency record;
- retain safe replay generation/subscription/policy/fence/evidence; and
- route poison, invariant, unsupported-major, integrity, unresolved-gap, or exhausted policy-bound deliveries to a visible dead-letter quarantine.

Replay selects immutable event IDs and original bytes under a manifest; uses isolated checkpoints and a new replay generation; re-runs compatibility, current policy, residency, deletion, and effect suppression; and reports per-event reconciled outcomes. Replay never republishes a new semantic fact merely to hide delivery uncertainty.

Dead-letter records contain only safe event/subscription/schema/aggregate refs, classification, reason, observation/attempt/budget, correlation, fence/policy watermark, owner, and repair state. Repair may make a decoder/configuration available, restore a dependency, replay the same event, rebuild a projection, or issue an owning compensating decision. Operators cannot edit event bytes or fabricate acknowledgement.

## 7. External effects and reconciliation

External action, connector, notification, export release, and deletion-side effects bind exact target/version, effect digest, approval/consent/policy, current authorization, idempotency/reconciliation identity, adapter/version/route, timeout/retry budget, and compensation/forward-repair capability.

| Observation | Canonical interpretation |
|---|---|
| Request not dispatched | Safe failed/blocked attempt; retry only under policy |
| Dispatch accepted | `Dispatched` or pending, not success |
| Timeout/connection loss after dispatch | `OutcomeUnknown`; reconcile before retry |
| Provider partial result | `PartiallySucceeded` plus item-level evidence/reconciliation |
| Provider acknowledgement | Receipt evidence only unless contract defines verified real-world effect |
| Reconciled success | `Succeeded` only with the owning evidence and current policy |
| Reconciled failure | `Failed` with safe evidence; compensate or forward repair where approved |
| Evidence missing | `EvidencePending`/repair; never fulfilment |

No external effect executes while its connector/channel/route is fenced by `DEC-031`, `DEC-037`, or `DEC-040`.

## 8. Degradation matrix

| Dependency/capability unavailable | Required degraded behavior |
|---|---|
| Identity/session | No protected operation; existing client view cannot become proof of access |
| Authorization/policy | Fail closed; only approved non-sensitive status may remain |
| Canonical record owner | No fabricated cache write/read-as-current; return unavailable or explicit safe cached limitation if policy permits |
| Artifact/integrity | No preview/download/processing/export; preserve workflow state |
| Scanner/content policy | Intake remains contained/quarantined; no downstream route |
| Parser/OCR/AI | Preserve original; return review/manual/unsupported/unavailable state; no unsupported fact |
| Search/vector/graph | Use an approved canonical/bounded fallback or explicit stale/partial/unavailable; never broaden candidates |
| Source retrieval/parser | Source health becomes stale/unavailable; last known result is not current/no-change |
| Event/workflow | Commands with required publication do not claim success without durable obligation; backlog/repair visible |
| Audit | Consequential/security operation blocks or stays incomplete |
| Notification delivery | Canonical task/requirement truth remains; delivery attempt fails/retries separately |
| Connector/action | No alternate provider/region without eligibility; unknown effect reconciles |
| Export | Package/release pauses and reauthorizes; partial package is not released as complete |
| Deletion | Fence/direct denial remains authoritative; purge residual stays incomplete |
| Key/secret | Affected decrypt/sign/connect routes unavailable; never fall back to unprotected data |
| Telemetry | Controls continue independently; observability degradation/gap is visible and later reconciled |
| Cost budget | Capability safely limits/degrades/blocks; no weaker evidence, cheaper ineligible route, or hidden overshoot |

## 9. Backpressure, circuits, cancellation, and deadlines

Rate limits, quotas, bounded queues, concurrency limits, load shedding, circuit states, deadlines, retry budgets, fan-out/depth/size limits, and admission control are policy-configured per operation/capability/workspace class. They must preserve fair tenant isolation and report truthful retry/degraded state without leaking other tenant load.

A circuit state distinguishes unavailable/overloaded/ineligible/unsafe dependencies and does not bypass route policy. Recovery probes use synthetic/minimal data and cannot send household content to test eligibility. Half-open/recovery behavior is idempotent and bounded.

Cancellation is a durable request, not proof that work or an external effect stopped. Workers check cancellation before each irreversible/expensive stage, alongside current authorization and deletion fence. The owner records `CANCELLING`/`CANCELLED`, too-late/partial/unknown, cleanup, and reconciliation accurately.

## 10. Repair and operational evidence

Every durable failure mode names:

- owning aggregate/workflow/component and on-call/repair role;
- safe detection condition and NFR/alert mapping;
- affected scope without content disclosure;
- automated bounded recovery and its stop condition;
- manual repair command/approval/preconditions;
- idempotency, current-policy, deletion, residency, and audit checks;
- reconciliation proof and user-visible state;
- rollback versus forward-repair constraint; and
- incident, root cause, regression, and closure evidence.

Repair commands are authenticated, authorized, workspace/partition bounded, dry-run/previewable where material, idempotent, rate-limited, auditable, and unable to edit immutable evidence or override open decisions.

## 11. Stable engineering rules

| Rule ID | Draft normative rule |
|---|---|
| `ENG-ERR-P1-001` | Caller, domain/workflow, and restricted-operational errors MUST remain separate views with stable correlation. |
| `ENG-ERR-P1-002` | Caller errors MUST use safe stable codes and MUST NOT leak protected existence, content, stack, provider, topology, credential, or unrestricted URL. |
| `ENG-ERR-P1-003` | Failure, stale, partial, restricted, unavailable, cancelled, unknown, and repair outcomes MUST NOT be mapped to success or empty/false. |
| `ENG-ERR-P1-004` | Retry eligibility MUST be defined per semantic operation and failure class; catch-all retries are prohibited. |
| `ENG-ERR-P1-005` | Retry budgets MUST bound attempts, work, elapsed policy, fan-out, cost, and deadline without inventing unapproved values. |
| `ENG-ERR-P1-006` | Invalid, unauthorized, policy-blocked, deletion-fenced, and incompatible-schema failures MUST NOT be blindly retried. |
| `ENG-ERR-P1-007` | A timeout after a possible external effect MUST enter unknown/reconciliation state before any retry. |
| `ENG-ERR-P1-008` | Backoff/jitter, quotas, and server guidance MUST prevent synchronized retry storms and cross-tenant resource capture. |
| `ENG-ERR-P1-009` | Every command retry MUST preserve scoped idempotency identity and canonical fingerprint. |
| `ENG-ERR-P1-010` | Idempotency-key reuse with a different fingerprint MUST conflict and MUST NOT execute either changed interpretation. |
| `ENG-ERR-P1-011` | Idempotency records MUST be workspace/actor or workload/operation scoped and MUST NOT confer authorization. |
| `ENG-ERR-P1-012` | Current authorization, approval, quarantine, cancellation, residency, and deletion MUST be rechecked before replayed/pending consequence. |
| `ENG-ERR-P1-013` | Existing-aggregate writes MUST enforce expected revision/ETag; conflicts require explicit authorized reconciliation. |
| `ENG-ERR-P1-014` | Local canonical success MUST include a durable transition or accepted workflow and durable event/audit publication obligation. |
| `ENG-ERR-P1-015` | Crash before/after commit, publish, acknowledgement, and audit MUST be detectable, testable, and repairable without invented transitions. |
| `ENG-ERR-P1-016` | Workflow state MUST remain durable/queryable and MUST NOT be inferred from queue presence, worker process, or elapsed time. |
| `ENG-ERR-P1-017` | Event redelivery MUST preserve event bytes/identity; consumers MUST deduplicate without assuming exactly-once delivery. |
| `ENG-ERR-P1-018` | Consumers MUST validate schema, scope, aggregate order/revision, integrity, current policy, and deletion before consequence. |
| `ENG-ERR-P1-019` | Forward event gaps MUST be held/reconciled; reordered or stale events MUST NOT overwrite newer state. |
| `ENG-ERR-P1-020` | Poison, unsupported-major, invariant, integrity, and exhausted deliveries MUST enter visible dead-letter quarantine, not a hot loop or discard. |
| `ENG-ERR-P1-021` | Replay MUST use an authorized manifest, original event identities/bytes, isolated checkpoints, new generation, and effect suppression/reconciliation. |
| `ENG-ERR-P1-022` | Replay, rebuild, late delivery, connector resync, and restore MUST consult current deletion fences and cannot recreate serviceable deleted data. |
| `ENG-ERR-P1-023` | Dead-letter and repair evidence MUST be content-minimized and must not become a shadow content store. |
| `ENG-ERR-P1-024` | External dispatch, receipt, timeout, delivery, or acknowledgement MUST remain separate from verified effect success and fulfilment. |
| `ENG-ERR-P1-025` | Partial/unknown external effects MUST retain item/attempt/reconciliation evidence and block unsafe duplicate execution/closure. |
| `ENG-ERR-P1-026` | Dependency degradation MUST preserve current authorization, audit, integrity, quarantine, residency, approval, and deletion controls. |
| `ENG-ERR-P1-027` | A cached/derived fallback MUST be explicitly authorized, freshness/coverage labelled, and never represented as canonical/current when it is not. |
| `ENG-ERR-P1-028` | Source failure MUST become unhealthy/stale/unavailable and MUST NOT be interpreted as no change or non-applicable. |
| `ENG-ERR-P1-029` | Notification failure MUST NOT change task, requirement, recommendation, action, or fulfilment truth. |
| `ENG-ERR-P1-030` | Audit failure MUST block or leave consequential/security work explicitly incomplete until reconciled. |
| `ENG-ERR-P1-031` | Telemetry failure MUST be visible but MUST NOT disable security, authorization, audit, deletion, or residency enforcement. |
| `ENG-ERR-P1-032` | Backpressure, circuit, load-shed, quota, and cancellation behavior MUST be tenant-safe, bounded, observable, and contractually truthful. |
| `ENG-ERR-P1-033` | Circuit recovery/fallback MUST rerun capability and route eligibility and MUST NOT silently cross processor, purpose, or region. |
| `ENG-ERR-P1-034` | Cancellation MUST be durable and stage-aware; it cannot claim an in-flight or external effect stopped without evidence. |
| `ENG-ERR-P1-035` | Repair operations MUST be authenticated, authorized, bounded, idempotent, current-policy/deletion checked, previewable where material, and audited. |
| `ENG-ERR-P1-036` | Operators MUST NOT edit immutable event/evidence bytes, fabricate acknowledgements, skip consequential gaps, or force completion without owning evidence. |
| `ENG-ERR-P1-037` | Rollback MUST be rejected when it would restore deleted data, stale authorization/configuration, vulnerable code, incompatible schema, or ineligible placement. |
| `ENG-ERR-P1-038` | Every enabled failure/degraded path MUST have deterministic fixtures, owner, safe telemetry, user-visible semantics, repair proof, and mapped NFR/test evidence. |

## 12. Release gate

An operation/capability cannot be enabled until its error catalogue, retry/idempotency/concurrency policy, workflow states, dependency degradation, circuit/backpressure/cancellation behavior, event/replay/DLQ handling, repair procedure, safe telemetry, and failure-injection evidence are reviewed. Any missing outcome is `UNAVAILABLE`/disabled—not an implementation default.
