# Phase 1 Event Catalogue

| Field | Value |
|---|---|
| Document ID | `API-EVT-001` |
| Version | `0.1` |
| Status | **DRAFT — product-owner, architecture, security, privacy, data, and API approval required** |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 26 August 2026 |
| Common envelope | [`event-envelope.v1.schema.json`](events/common/event-envelope.v1.schema.json) |
| Event inventory | `EVT-P1-001`–`EVT-P1-032`; 32 schemas and 32 synthetic examples |

## 1. Purpose, authority, and boundary

This document defines the provider-neutral Phase 1 asynchronous domain-event contract: stable event identities, the common envelope, aggregate ordering, durable publication, at-least-once delivery, causation/correlation/idempotency, replay, dead-letter repair, privacy, residency, deletion, and schema compatibility. It is the event companion to [`API-STD-001`](01-api-standards.md).

The source-of-truth hierarchy in [`CODEX.md`](../../CODEX.md) applies. This contract refines [`ARCH-SOL-001`](../02-architecture/01-solution-architecture.md), [`ARCH-DATA-001`](../02-architecture/03-logical-data-model.md), [`ADR-ARCH-004`](../02-architecture/06-adrs/ADR-004-durable-commands-events-and-eventual-consistency.md), [`SEC-AUTH-001`](../06-security/02-authorization-model.md), [`SEC-PRIV-001`](../06-security/03-privacy-and-data-governance.md), and [`SEC-AUD-001`](../06-security/04-audit-and-provenance.md). The owning aggregate and specialist DIT contract remain authoritative for state meaning.

An event is an immutable fact that an owning local transition committed. It is not a command, current authorization, approval, external-effect acknowledgement, delivery guarantee, projection truth, or completion claim for another aggregate. A consumer applies current policy and its own concurrency/idempotency rules before any output or effect.

This catalogue does not select a broker, queue, stream, database, schema registry, cloud, provider, region, retry duration, retention duration, or deployment topology. It does not enable a connector or delivery channel under `DEC-031`, continuity release under `DEC-032`, readiness/content-health scoring under `DEC-034`, a launch type/source/profile under `DEC-035`, a clinical-content disposition under `DEC-036`, recovery under `DEC-038`, deletion timing under `DEC-039`, or a processor/residency route under `DEC-040`.

## 2. Canonical event envelope

Every catalogue schema composes the closed common envelope in [`events/common/event-envelope.v1.schema.json`](events/common/event-envelope.v1.schema.json). The event-specific schema fixes `event_type`, `schema_version`, allowed scope, aggregate type, and a closed payload.

| Field | Required contract |
|---|---|
| `event_id` | Globally unique, opaque, immutable event identity. It is not a content digest, idempotency key, provider receipt, or sequence. Redelivery and replay preserve it. |
| `event_type` | The stable catalogue ID itself, exactly `EVT-P1-###`. IDs are never recycled. |
| `schema_version` | Semantic wire-schema version. Every file in this pack fixes `1.0.0`; the filename suffix `v1` is the compatibility major. |
| `occurred_at`, `recorded_at` | UTC RFC 3339 occurrence and durable platform-recorded times. `recorded_at` cannot precede `occurred_at`; client time alone is insufficient. |
| `scope_kind` | Exactly `WORKSPACE`, `GLOBAL_REFERENCE`, or `PLATFORM_CONTROL`. |
| `workspace_id` | Required for `WORKSPACE`; prohibited for `GLOBAL_REFERENCE` and `PLATFORM_CONTROL`. Global/platform events contain no household identifier or personalized content. |
| `aggregate_type`, `aggregate_id` | Owning consistency boundary and stable opaque aggregate identity. The payload cannot nominate a different owner. |
| `aggregate_revision` | Owning aggregate revision after the committed transition. It is not a document version, projection timestamp, or global event offset. |
| `aggregate_event_index` | Zero-based deterministic index when one aggregate revision emits more than one event. The producer makes `(scope, aggregate_type, aggregate_id, aggregate_revision, aggregate_event_index)` unique. |
| `attempt` | Producing command/workflow attempt retained as immutable provenance. Broker redelivery attempt is separate transport metadata and does not mutate the event. |
| `producer` | Stable producer/capability identity and semantic operation. Deployment instance, framework, host, queue, and provider names are not canonical identity. |
| `actor` | Safe human/workload/connector/operator/system reference and class; never a name, email, token, credential, or authority claim. |
| `authorization` | Decision reference, bounded decision outcome, policy version, and authorization epoch used at commit. This is audit evidence only; consumers reauthorize current access/effect. |
| `correlation_id` | End-to-end workflow/request/change correlation. Correlation does not create atomicity or order across aggregates. |
| `causation_id` | Exact preceding command, job, decision, or event reference that caused this committed fact. |
| `idempotency_key` | Opaque producing-operation idempotency identity. Its scope is producer, semantic operation, workspace/platform scope, authenticated actor/grant or workload, and the configured retention policy. |
| `classification` | Highest effective event data class, approved `PUR-P1-*` purpose, residency-policy reference, retention-rule reference, and deletion-lineage reference. References do not prove eligibility. |
| `deletion_fence` | Fence state and generation observed by the producer, plus `deletion_case_id` when fenced. Current authoritative fence state always wins over this historical value. |
| `payload` | Closed, event-specific, bounded reference-only data. Protected content remains in its owning store and is reauthorized when resolved. |

`authorization.decision: ALLOW` records the transition-time decision; it MUST NOT be interpreted as an allow for a consumer, cached output, replay, export, connector, notification, support view, or external effect. `DENY`, `REDACT`, and `MINIMAL_DISCLOSURE` are available for safe control facts where an owning workflow legitimately emits them, not to turn a denied command into a state transition.

## 3. Publication and transaction contract

1. A successful state-changing command commits the authoritative local aggregate revision, required privacy-safe audit, and an outbox/equivalent publication obligation atomically. Publishing before commit is forbidden.
2. The outbox record contains the final immutable event bytes and schema identity. A publisher crash after send can cause redelivery; it cannot create a second semantic event with a new `event_id` merely to hide uncertainty.
3. Required audit and domain events are distinct contracts. One cannot silently substitute for the other. Required audit failure blocks the consequential operation or leaves it explicitly pending/incomplete for reconciliation.
4. The producer allocates `aggregate_revision` under the owning concurrency guard and `aggregate_event_index` deterministically inside that revision. Retrying a command with the same scoped idempotency key and fingerprint returns the prior logical outcome/event identities.
5. Reuse of one idempotency key with a different canonical fingerprint is a conflict. Event, HTTP idempotency, external command, provider receipt, reconciliation, and approval identities remain separate.
6. Event schemas are closed. Unknown top-level or payload fields fail publication validation; a producer cannot smuggle provider-native extensions, authority, commands, or protected content through an event.
7. Event publication is at least once. This pack makes no exactly-once claim for publishing, delivery, consumption, domain transitions, external effects, notifications, exports, or purge.

## 4. Ordering, duplicate, delay, and gap handling

There is no platform-wide total order. The only canonical domain order is per aggregate by the lexicographic key:

`(aggregate_revision, aggregate_event_index)`

Consumers MUST:

- deduplicate by `event_id` and keep effect-specific idempotency separately;
- apply an event only when its aggregate order is admissible for that consumer's state;
- treat an identical redelivery as the same fact, not a new occurrence;
- reject or quarantine the same `event_id` with different bytes, type, scope, aggregate, or version as an integrity incident;
- hold and reconcile a forward gap rather than guessing missing state;
- ignore an older event for state replacement only after recording safe duplicate/stale reconciliation evidence; it must never overwrite a newer revision;
- process multiple events in one revision by `aggregate_event_index` and reject duplicate indexes with different `event_id` values;
- preserve `correlation_id` and `causation_id` for workflow reconstruction without treating them as cross-aggregate ordering; and
- reauthorize and recheck policy epoch, source watermark, current aggregate revision, quarantine, cancellation, security suspension, and deletion fence before output or consequence.

A consumer may rebuild from an authoritative snapshot plus a declared source watermark when its contract permits. A snapshot cannot erase immutable event/audit history or make an unseen gap look processed. Network partition, queue delay, stale projection, or unavailable authorization is never permission to serve a stale allow.

## 5. Retry, replay, dead-letter, and repair

### 5.1 Delivery retry

Retry/backoff, concurrency, rate, size, age, and attempt budgets are versioned operational policy. This contract sets no duration or numeric retry limit. Only declared retryable failures may retry. A retry stays inside the original subscription, scope, purpose, data class, residency route, and idempotency identity.

Transport metadata such as `subscription_id`, `delivery_attempt`, `delivery_deadline`, and `replay_run_id` is not part of the immutable domain event. It is separately classified and audited. The envelope's `attempt` remains the original producing command/workflow attempt.

### 5.2 Replay

Replay is an explicit, authorized, bounded operator/workflow command with a stable replay identity, reason, event-type/subscription/aggregate/time-or-offset bounds, schema decoder set, current policy, residency eligibility, deletion-fence watermark, dry-run/impact evidence where required, and per-event outcome.

- Redelivery replay preserves the original event bytes, `event_id`, occurrence/recorded times, aggregate order, causation, correlation, and producer attempt.
- Re-evaluation under a changed parser, schema, prompt, rule, configuration, policy, or model creates a new immutable domain result and, if committed, a new event with a new `event_id` causally linked to the replay command. It never rewrites the old event.
- Replay MUST NOT resurrect deleted/fenced data, reactivate superseded results, reuse stale approval, bypass current authorization, duplicate tasks/effects, or silently widen processing purpose/region.
- Completion is reported from per-event reconciled outcomes. Partial replay cannot be labelled complete.

### 5.3 Dead-letter quarantine

Invalid encoding/schema, unsupported major version, integrity mismatch, poison payload, consumer invariant violation, unresolved aggregate gap, repeated policy-bound retry exhaustion, or an unknown external outcome routes the delivery to a visible dead-letter quarantine/repair state. Dead-lettering is not successful consumption and is not permission to discard the fact.

A dead-letter record contains only safe event/subscription/schema/aggregate references, classification, failure code, first/last observation, attempt/budget state, correlation, fence/policy watermark, owner, and repair status. It MUST NOT copy raw document content, field values, evidence passages, filenames, prompts, answers, provider payloads, unrestricted URLs, credentials, or secrets.

Repair actions are explicit and audited: correct a consumer/configuration, make the decoder available, restore an admissible dependency, replay the same event, rebuild from an authorized source, or publish a new compensating domain decision. Operators cannot edit an event in place, fabricate an acknowledgement, mark a gap applied, or skip a consequential fact without an owning policy decision and reconciliation evidence.

## 6. Privacy, residency, retention, and deletion

### 6.1 Scope and minimization

- Every household event is `WORKSPACE` scoped to exactly one `workspace_id`. Cross-workspace payload references are invalid.
- `GLOBAL_REFERENCE` and `PLATFORM_CONTROL` events omit `workspace_id` and household/personalized data. A personalized or authenticated source observation is always isolated to `WORKSPACE`.
- The event's `classification.data_class` uses the exact `P0-PUBLIC` through `P5-EXCLUDED` classes from `SEC-PRIV-001` and records the highest effective classification of the event, not the source object's full content.
- The payload is a safe routing/provenance summary. Raw originals, document text/images, extracted values, evidence passages, subject names, contact details, filenames, raw hashes used as hidden copies, prompts, queries, answers, tool arguments/results, provider responses, tokens, secrets, key material, signed URLs, and unrestricted URLs are prohibited.
- Opaque references do not make protected existence public. Resolving a reference, count, graph edge, target, evidence anchor, or audit view requires current authorization and minimal-disclosure policy.
- `P5-EXCLUDED` content never enters ordinary event payloads. A permitted containment event may carry only safe policy state/reason references and cannot encode a final clinical disposition while `DEC-036` is open.

### 6.2 Residency and processing

`classification.residency_policy_ref` identifies the governing policy considered at publication; it does not prove an approved physical region, processor, support, analytics, backup, DR, connector, channel, or replay route. Unknown or ineligible placement/egress under `DEC-040` blocks the affected route or uses a separately approved alternative. Event brokers, archives, dead-letter stores, replay tooling, audit, telemetry, and backups are all in the residency inventory.

### 6.3 Retention and deletion

`classification.retention_rule_ref` and `deletion_lineage_ref` are mandatory, but no cooling-off, event retention, dead-letter retention, active-purge, backup-expiry, or audit-minimization duration is defined while `DEC-039` is open. An event store cannot become a shadow content store.

The authoritative current deletion fence precedes consume, replay, rebuild, cache, export, connector resync, support, and restore. A historical `NOT_FENCED` envelope cannot override a later fence. `EVT-P1-029` communicates fence activation for fast convergence, but consumers still consult current authoritative fence/tombstone state. Late events may retain only allowed minimized reconciliation evidence and MUST NOT recreate serviceable content. Retained history resolves purged references as unavailable/tombstoned; it never repoints an evidence anchor or reconstructs raw content.

## 7. Schema and semantic compatibility

1. Published schemas are immutable. A correction publishes a new version and compatibility record; it does not replace the bytes of a released schema.
2. `schema_version` is `MAJOR.MINOR.PATCH`. `v1` files accept only `1.0.0` in this baseline. An incompatible wire or semantic change requires a new major schema and usually a new event type when the fact's meaning, owner, scope, authorization consequence, privacy class, or ordering contract changes.
3. An additive minor may add only optional fields whose absence has the previous meaning and whose presence every declared consumer can safely ignore or understand. Added enum values, broader scope, greater disclosure, new consequence, or changed default require consumer/privacy review and are not automatically additive.
4. Removing or renaming a field, making an optional field required, changing type/meaning/unit/cardinality, weakening validation, changing aggregate ownership/order/idempotency, or changing privacy/deletion semantics is breaking.
5. Consumers declare accepted event types and schema major/minor ranges. Unsupported major versions and unknown security/consequence fields fail closed into dead-letter quarantine; consumers never guess, coerce, or silently drop them.
6. Decoders for retained replayable events remain available for the applicable retention policy. Migration or replay produces new projections/results without rewriting old events.
7. Event IDs and meanings are never recycled. A retired type remains documented; the next type uses the next unused `EVT-P1-###` value.
8. Schema publication is reviewed, impact-assessed, compatibility-tested, privacy/security approved, effective-dated, auditable, and forward-repairable. `EVT-P1-031` reports the owning `ConfigurationPackage` publication fact but does not itself activate unresolved features.

## 8. Stable event catalogue

The ID in the first column is both the catalogue identity and the exact wire `event_type`. Each schema fixes it with `const`; each adjacent example uses the same value. All examples are synthetic, non-activatable, and make no provider, route, source coverage, duration, connector, channel, readiness-score, clinical-disposition, recovery, or continuity claim.

| Event type | Committed fact | Owning aggregate / allowed scope | Schema and example |
|---|---|---|---|
| `EVT-P1-001` | Workspace state changed | `Workspace` / `WORKSPACE` | [schema](events/access/evt-p1-001-workspace-state-changed.v1.schema.json) · [example](events/access/evt-p1-001-workspace-state-changed.v1.example.json) |
| `EVT-P1-002` | Membership state changed inside the workspace aggregate | `Workspace` / `WORKSPACE` | [schema](events/access/evt-p1-002-membership-state-changed.v1.schema.json) · [example](events/access/evt-p1-002-membership-state-changed.v1.example.json) |
| `EVT-P1-003` | Subject record changed without making subject an identity or authority | `Workspace` / `WORKSPACE` | [schema](events/access/evt-p1-003-subject-record-changed.v1.schema.json) · [example](events/access/evt-p1-003-subject-record-changed.v1.example.json) |
| `EVT-P1-004` | AccessGrant state changed | `AccessGrant` / `WORKSPACE` | [schema](events/access/evt-p1-004-access-grant-state-changed.v1.schema.json) · [example](events/access/evt-p1-004-access-grant-state-changed.v1.example.json) |
| `EVT-P1-005` | Authorization epoch advanced for invalidation; it is not an allow | `Workspace` / `WORKSPACE` | [schema](events/access/evt-p1-005-authorization-epoch-advanced.v1.schema.json) · [example](events/access/evt-p1-005-authorization-epoch-advanced.v1.example.json) |
| `EVT-P1-006` | IngestionCase state/stage changed | `IngestionCase` / `WORKSPACE` | [schema](events/ingestion/evt-p1-006-ingestion-case-state-changed.v1.schema.json) · [example](events/ingestion/evt-p1-006-ingestion-case-state-changed.v1.example.json) |
| `EVT-P1-007` | ArtifactRecord integrity/quarantine state changed; no bytes are included | `ArtifactRecord` / `WORKSPACE` | [schema](events/ingestion/evt-p1-007-artifact-integrity-state-changed.v1.schema.json) · [example](events/ingestion/evt-p1-007-artifact-integrity-state-changed.v1.example.json) |
| `EVT-P1-008` | Immutable DocumentAnalysis generation recorded | `DocumentAnalysis` / `WORKSPACE` | [schema](events/documents/evt-p1-008-document-analysis-generation-recorded.v1.schema.json) · [example](events/documents/evt-p1-008-document-analysis-generation-recorded.v1.example.json) |
| `EVT-P1-009` | Immutable document version added to a LogicalDocument | `LogicalDocument` / `WORKSPACE` | [schema](events/documents/evt-p1-009-document-version-added.v1.schema.json) · [example](events/documents/evt-p1-009-document-version-added.v1.example.json) |
| `EVT-P1-010` | Document relationship decision changed for exact version endpoints | `LogicalDocument` / `WORKSPACE` | [schema](events/documents/evt-p1-010-document-relationship-decision-changed.v1.schema.json) · [example](events/documents/evt-p1-010-document-relationship-decision-changed.v1.example.json) |
| `EVT-P1-011` | LogicalDocument availability/lifecycle changed | `LogicalDocument` / `WORKSPACE` | [schema](events/documents/evt-p1-011-logical-document-lifecycle-changed.v1.schema.json) · [example](events/documents/evt-p1-011-logical-document-lifecycle-changed.v1.example.json) |
| `EVT-P1-012` | Immutable FactOccurrence recorded by CanonicalFact | `CanonicalFact` / `WORKSPACE` | [schema](events/facts/evt-p1-012-fact-occurrence-recorded.v1.schema.json) · [example](events/facts/evt-p1-012-fact-occurrence-recorded.v1.example.json) |
| `EVT-P1-013` | CanonicalFact resolution/conflict state changed without copying a value | `CanonicalFact` / `WORKSPACE` | [schema](events/facts/evt-p1-013-canonical-fact-resolution-changed.v1.schema.json) · [example](events/facts/evt-p1-013-canonical-fact-resolution-changed.v1.example.json) |
| `EVT-P1-014` | DependencyRecord state changed for exact typed endpoints | `DependencyRecord` / `WORKSPACE` | [schema](events/graph/evt-p1-014-dependency-record-state-changed.v1.schema.json) · [example](events/graph/evt-p1-014-dependency-record-state-changed.v1.example.json) |
| `EVT-P1-015` | Immutable SourceObservation snapshot/no-change evidence recorded | `SourceObservation` / `WORKSPACE` or `GLOBAL_REFERENCE` | [schema](events/monitoring/evt-p1-015-source-observation-recorded.v1.schema.json) · [example](events/monitoring/evt-p1-015-source-observation-recorded.v1.example.json) |
| `EVT-P1-016` | Mutable SourceHealth dimensions changed separately from observation history | `SourceHealth` / `WORKSPACE` or `GLOBAL_REFERENCE` | [schema](events/monitoring/evt-p1-016-source-health-changed.v1.schema.json) · [example](events/monitoring/evt-p1-016-source-health-changed.v1.example.json) |
| `EVT-P1-017` | MonitoringRun completed with explicit outcome/replay lineage | `MonitoringRun` / `WORKSPACE` | [schema](events/monitoring/evt-p1-017-monitoring-run-completed.v1.schema.json) · [example](events/monitoring/evt-p1-017-monitoring-run-completed.v1.example.json) |
| `EVT-P1-018` | RuleResolution/applicability state changed using the exact six outcomes | `RuleResolution` / `WORKSPACE` | [schema](events/monitoring/evt-p1-018-rule-resolution-state-changed.v1.schema.json) · [example](events/monitoring/evt-p1-018-rule-resolution-state-changed.v1.example.json) |
| `EVT-P1-019` | ChangeCase state changed with supported comparison evidence | `ChangeCase` / `WORKSPACE` | [schema](events/monitoring/evt-p1-019-change-case-state-changed.v1.schema.json) · [example](events/monitoring/evt-p1-019-change-case-state-changed.v1.example.json) |
| `EVT-P1-020` | ImpactAssessment generation recorded with separate applicability/class/dimensions/coverage | `ImpactAssessment` / `WORKSPACE` | [schema](events/impact/evt-p1-020-impact-assessment-recorded.v1.schema.json) · [example](events/impact/evt-p1-020-impact-assessment-recorded.v1.example.json) |
| `EVT-P1-021` | Recommendation state or disposition changed | `Recommendation` / `WORKSPACE` | [schema](events/impact/evt-p1-021-recommendation-state-changed.v1.schema.json) · [example](events/impact/evt-p1-021-recommendation-state-changed.v1.example.json) |
| `EVT-P1-022` | Bound Approval state changed for exact reviewed input/effect/target revision | `Approval` / `WORKSPACE` | [schema](events/impact/evt-p1-022-approval-state-changed.v1.schema.json) · [example](events/impact/evt-p1-022-approval-state-changed.v1.example.json) |
| `EVT-P1-023` | ActionExecution state changed, including unknown/partial/reconciliation outcomes | `ActionExecution` / `WORKSPACE` | [schema](events/impact/evt-p1-023-action-execution-state-changed.v1.schema.json) · [example](events/impact/evt-p1-023-action-execution-state-changed.v1.example.json) |
| `EVT-P1-024` | Additive EvidenceVerification decision recorded | `RequirementCase` / `WORKSPACE` | [schema](events/impact/evt-p1-024-evidence-verification-recorded.v1.schema.json) · [example](events/impact/evt-p1-024-evidence-verification-recorded.v1.example.json) |
| `EVT-P1-025` | RequirementCase applicability, health, disposition, or fulfilment state changed without a score | `RequirementCase` / `WORKSPACE` | [schema](events/impact/evt-p1-025-requirement-case-state-changed.v1.schema.json) · [example](events/impact/evt-p1-025-requirement-case-state-changed.v1.example.json) |
| `EVT-P1-026` | Task state changed; task/reminder truth remains separate from requirement truth | `Task` / `WORKSPACE` | [schema](events/tasks/evt-p1-026-task-state-changed.v1.schema.json) · [example](events/tasks/evt-p1-026-task-state-changed.v1.example.json) |
| `EVT-P1-027` | ExportCase state changed for a bounded manifest/scope snapshot | `ExportCase` / `WORKSPACE` | [schema](events/export/evt-p1-027-export-case-state-changed.v1.schema.json) · [example](events/export/evt-p1-027-export-case-state-changed.v1.example.json) |
| `EVT-P1-028` | DeletionCase lifecycle/residual state changed | `DeletionCase` / `WORKSPACE` | [schema](events/deletion/evt-p1-028-deletion-case-state-changed.v1.schema.json) · [example](events/deletion/evt-p1-028-deletion-case-state-changed.v1.example.json) |
| `EVT-P1-029` | Authoritative deletion fence activated for fast consumer convergence | `DeletionCase` / `WORKSPACE` | [schema](events/deletion/evt-p1-029-deletion-fence-activated.v1.schema.json) · [example](events/deletion/evt-p1-029-deletion-fence-activated.v1.example.json) |
| `EVT-P1-030` | Per-data-role purge acknowledgement/residual recorded; not overall completion by itself | `DeletionCase` / `WORKSPACE` | [schema](events/deletion/evt-p1-030-purge-acknowledgement-recorded.v1.schema.json) · [example](events/deletion/evt-p1-030-purge-acknowledgement-recorded.v1.example.json) |
| `EVT-P1-031` | ConfigurationPackage publication state changed without enabling fenced features | `ConfigurationPackage` / `PLATFORM_CONTROL` | [schema](events/configuration/evt-p1-031-configuration-package-publication-changed.v1.schema.json) · [example](events/configuration/evt-p1-031-configuration-package-publication-changed.v1.example.json) |
| `EVT-P1-032` | Validated non-readiness ProjectionWatermark generation activated | `ProjectionWatermark` / `WORKSPACE` | [schema](events/projections/evt-p1-032-projection-generation-activated.v1.schema.json) · [example](events/projections/evt-p1-032-projection-generation-activated.v1.example.json) |

## 9. Consumer consequence rules

| Family | Consumer boundary |
|---|---|
| Access `001`–`005` | Invalidate/filter using the epoch, then query current authorization. An event never grants access, delegation, subject authority, or hidden-resource disclosure. |
| Intake/document `006`–`011` | Preserve original/version/analysis separation. Safety, quarantine, relationship, effective, lifecycle, and deletion states remain orthogonal. |
| Facts/graph `012`–`014` | Resolve protected references under current field/edge policy. Occurrence, resolution, edge activation, and projection are distinct. |
| Monitoring `015`–`019` | Preserve source observation, source health, parser/run, applicability, and change as separate facts. Failure cannot become no change, non-applicable, or current success. |
| Impact/workflow `020`–`025` | Impact, recommendation, approval, execution, evidence verification, and fulfilment remain separately owned. No event substitutes for a bound approval or verified closure. |
| Task `026` | Task completion, reminder, acknowledgement, or delivery cannot establish applicability, evidence, fulfilment, execution success, or closure. No notification channel is selected here. |
| Export/deletion `027`–`030` | Reauthorize every item/release/purge step. A manifest, acknowledgement, or one purge role never claims overall completeness; fence wins every race. |
| Configuration/projection `031`–`032` | Activate only an approved compatible generation. `EVT-P1-032` excludes `ReadinessProjection` while `DEC-034` is open; neither type enables a connector, channel, provider, source, route, or launch profile. |

## 10. Conformance and negative-test obligations

Automated evidence MUST prove:

1. all JSON parses and every schema passes the JSON Schema 2020-12 meta-schema;
2. event IDs are unique and contiguous from `EVT-P1-001` through `EVT-P1-032`, and filename, schema `event_type.const`, catalogue row, and example `event_type` agree;
3. every `$ref` is local, repository-contained, resolvable, and does not require a network fetch;
4. every example validates against exactly its adjacent schema and every event schema composes the common envelope;
5. workspace/global/platform scope rules reject missing, extra, mismatched, personalized-global, and cross-workspace references;
6. duplicate, same-ID/different-bytes, delay, reordering, multi-event revision, gap, stale revision, retry, partition, and replay permutations preserve one admissible consequence;
7. outbox crash-before/after-send, audit outage, dead-letter, decoder upgrade, partial replay, and repair retain truthful visible state;
8. current authorization, policy epoch, quarantine, source health, approval/effect digest, residency, cancellation, and deletion are rechecked at consume/consequence time;
9. a deletion fence blocks late delivery, replay, rebuild, connector resync, export, support, and restore from recreating serviceable data;
10. schema compatibility tests cover additive optional, unknown minor, unknown major, removed/renamed/type-changed fields, added enums, broadened scope, privacy-class changes, and retained replay decoders;
11. schema/property allow-lists and canary scans find no raw content, values, filenames, passages, queries, prompts, answers, tool/provider payloads, unrestricted URLs, tokens, credentials, secrets, key material, or signed access URLs; and
12. no example, schema, retry policy, replay contract, or dead-letter contract invents an unresolved duration, route, connector/channel enablement, continuity/recovery success, clinical disposition, readiness score, launch coverage, or completion guarantee.

The repository validator checks static inventory, local references, and example conformance. It does not replace broker integration, transactional outbox, authorization, privacy, deletion, replay, chaos, or end-to-end evidence.

## 11. Definition of ready

This draft can advance only when all 32 event schemas and examples, aggregate/outbox mappings, consumer ownership, schema registry and compatibility policy, authorization/non-disclosure matrix, privacy/residency/retention inventory, deletion-fence behavior, dead-letter/replay operations, audit coverage, and duplicate/reorder/gap/partition/restore tests are approved. That approval does not by itself satisfy the repository implementation gate or close any referenced open decision.
