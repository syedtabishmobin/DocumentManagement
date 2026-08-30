# Personal and Family Phase 1 Implementation Status

| Field | Value |
|---|---|
| Document ID | `BLG-STATUS-001` |
| Version | `0.2` |
| Status | **ACTIVE EVIDENCE SNAPSHOT — not a release approval** |
| Scope | Phase 1 personal and family only; organisation features excluded |
| Assessed | 30 August 2026 |
| Baseline | `DOCULYRA-BUILD-P1-2026.08.30.1`; `PROD-PRD-001` v0.3; `FEAT-P1-001`–`031`; `STORY-P1-001`–`049`; `P1-S1`–`P1-S4` |

## 1. Outcome

The current React/API/Flutter implementation is a useful synthetic development preview, not a completed Phase 1 product. No story has yet satisfied its complete acceptance criteria and mapped unit, contract, security, E2E, performance/resilience, accessibility, migration/repair, and operational evidence gate.

| Assessment | Stories | Meaning |
|---|---:|---|
| `PARTIAL PREVIEW` | 29 | A visible or tested happy-path behavior exists, but major contract, security, durability, authorization, platform-parity, or evidence obligations remain. |
| `NOT IMPLEMENTED` | 18 | No material runtime behavior implements the story outcome. Specification/contracts may exist. |
| `INTENTIONALLY UNAVAILABLE` | 2 | The required Phase 1 behavior is to keep an unsafe capability absent; stronger negative tests and production decisions are still required. |
| `COMPLETE` | 0 | No story currently meets its full definition of done. |

This status does not reduce the value of the preview. It prevents prototype behaviors—such as one JSON store, a deterministic text search, a connector catalogue, or crypto known-answer tests—from being mistaken for production completion.

## 2. Evidence reviewed

The assessment compared:

- the approved PRD, feature and use-case catalogues, 49 story records, traceability matrix, controlled baseline candidate, and four-slice release plan;
- solution/data/workspace architecture, accepted ADRs, security/privacy/audit/threat contracts, API/event/connector contracts, UX/accessibility, DevOps, reference-data, and test specifications;
- the React web/PWA, NestJS API, shared domain/contracts/crypto packages, Flutter client, unit tests, CI workflows, Bicep, Azure deployment evidence, and the current provider-registration state; and
- current product-owner decisions through `DEC-055`.

Organisation workspaces, SSO/SCIM, DLP, records management, enterprise administration, and other Phase 2 capabilities were excluded.

### 2.1 Latest bounded implementation evidence

The 29 August 2026 identity/authority increment adds local-preview evidence without closing any story:

- versioned local authority persistence now supports multiple isolated workspaces and records the workspace, explicit owner binding, owner subject, identity link, membership, bootstrap owner grant, authorization epoch, audit entry, and idempotent creation receipt as separate records;
- the API now requires an active session plus explicit workspace and purpose context, evaluates current membership and explicit action grants through one deny-by-default policy function, and returns existence-safe denials for mismatched workspaces;
- local identity persistence now supports separate accounts, scrypt password hashes, hashed session and CSRF tokens, 30-minute idle and seven-day absolute expiry, privilege-change/session rotation, current-session revocation, trusted browser origins, and persisted sign-in throttling keyed by email and client fingerprint;
- React and Flutter requests carry the current workspace, purpose, CSRF, correlation, and idempotency context; protected originals and exports are fetched through authorized requests rather than unauthenticated browser links; and
- web/mobile sign-in surfaces state that recovery and ownership transfer are unavailable, while the reserved authenticated recovery-case route returns and audits `POLICY_BLOCKED` under `DEC-038`.

The focused API suite covers policy allow/deny behavior, multi-workspace isolation/idempotency, authority record separation, session/CSRF rotation, login throttling, unique-owner fencing, and the recovery fence. A live local HTTP smoke test also verified create/replay `200`, reused-key conflict `409`, authorized dashboard `200`, owner-fabrication `400`, cross-workspace `404`, missing-CSRF `403`, policy-blocked recovery `201`, and untrusted-origin `403` outcomes.

The governed Issue #2/PR #4 increment adds a provider-neutral workspace persistence port and PostgreSQL adapter selected by `ADR-ARCH-007`; immutable/checksummed canonical migrations; serializable workspace transactions; unique actor/key creation receipts; optimistic per-workspace storage revisions; correlated, content-minimized authority outbox events; explicit synthetic import/verification evidence; and restart/interruption/concurrency/foreign-workspace tests. Independent QA passed `AUTH-DUR-AC-01`–`10` on exact candidate `4bb43cc` after defects #5–#8 were independently retested; PR #4 merged as `6c047bd`. This is bounded component evidence, not completion of any story. The current dev preview still uses the file profile, and Azure activation/backup/performance conformance, broader authorization, MFA/passkeys, delegated grants, client encryption, accessibility and full story E2E evidence remain open.

## 3. Story-by-story comparison

### `P1-S1` — Secure household vault

| Story | Status | Current evidence | Remaining work |
|---|---|---|---|
| `STORY-P1-001` | `DEV ACCEPTED` | Issue #39 / PR #40 added exact purpose/configuration binding, canonical create conformance, fail-closed pending activation, bounded identity/activation reconciliation, safe legacy receipt replay and privacy-safe invalid-payload handling. Independent `QA-FUNC-005` passed both ACs on exact candidate `6f7d9e9`; protected CI and real-PostgreSQL tests passed before merge `73700f7`. | Azure DEV provider activation, backup/performance evidence, Stage E2E, BA/UAT and parent feature/outcome completion remain separate gates. |
| `STORY-P1-002` | `DEV ACCEPTED` | Issue #42 / PR #43 added stable subject lifecycle/history, strict subject/identity/membership separation, canonical API-P1-104–111 routes, bounded opaque pagination, revision/idempotency controls and correlation-consistent audit/outbox evidence. Independent `QA-FUNC-008` passed both ACs and the 12-group black-box regression on exact candidate `2942c0e`; protected CI passed real PostgreSQL 47/47 plus Android/iOS before merge `717fd35`. | Invitation redemption and richer authority semantics remain in their governed stories; Azure DEV provider activation, Stage E2E, BA/UAT and parent feature/outcome completion remain separate gates. |
| `STORY-P1-003` | `DEV ACCEPTED` | Issue #46 / PR #47 added exact resource/field/edge/action grant scope, current input/output/effect fencing, deny precedence, minimized dashboard/document/artifact surfaces, canonical AccessGrant routes, and correlated denial/audit/outbox evidence. Independent `QA-FUNC-011` passed both ACs on exact candidate `95321ce`; protected PostgreSQL/API 53/53 and Android/iOS passed before merge `1441de0`. | Azure DEV provider activation, Stage E2E, BA/UAT and parent feature/outcome completion remain separate gates; advanced delegation remains deferred. |
| `STORY-P1-004` | `DEV ACCEPTED` | Issue #50 / PR #51 added canonical durable ingestion cases, transactional EVT-P1-006 envelopes, fail-closed pre-safety artifacts, and bounded web/mobile retry keys; `QA-FUNC-013` independently passed both ACs. | Stage/BA/UAT and parent feature/outcome completion remain open; production artifact activation remains separately gated. |
| `STORY-P1-005` | `IN REVIEW` | Issue #55 / PR #56 add deterministic synthetic safety assessment, scanner-unavailable/malicious/clinical containment, truthful case/event/audit state, generic web/mobile UX and restart/replay evidence without activating a production scanner or clinical disposition. | Independent adversarial Functional/Security QA, protected real-PostgreSQL and mobile evidence, then DEV acceptance; Stage/BA/UAT remain separate gates. |
| `STORY-P1-006` | `NOT IMPLEMENTED` | No durable staged workflow, outbox, lease, retry, or dead-letter runtime. | Idempotent ingestion stages, crash-window recovery, duplicate/reorder handling, retry budget, reconciliation, audit, and repair tooling. |
| `STORY-P1-007` | `PARTIAL PREVIEW` | Uploaded bytes are hashed and stored; duplicate content is rejected. | Put-once Azure Blob artifact path, immutable artifact/version identities, logical document versioning, integrity verification, supersession, compare, retention, and deletion acknowledgements. |
| `STORY-P1-008` | `PARTIAL PREVIEW` | Local accounts use scrypt hashes; raw session/CSRF tokens are not stored; HttpOnly/SameSite sessions have idle/absolute expiry, CSRF/origin checks, privilege-change rotation, revocation metadata and persisted sign-in throttling. Key Vault/IaC foundations and cross-language AES-GCM vectors also exist. | End-to-end client encryption on every web/mobile upload/download, secure device key storage, key envelope/grant lifecycle, step-up/MFA/passkeys, production identity/federation, distributed revocation, secret mounting/rotation, and full abuse/security evidence. |
| `STORY-P1-009` | `PARTIAL PREVIEW` | Content-minimized local activity records and basic tests exist. | Append-only/tamper-evident audit store, actor/workload provenance, comprehensive event coverage, separate safe telemetry, correlation, retention/export controls, anomaly alerting, and audit-failure behavior. |
| `STORY-P1-010` | `PARTIAL PREVIEW` | Versioned synthetic reference JSON and validators exist; runtime activation is disabled. | Runtime configuration registry/publication, signed immutable packages, compatibility/impact/replay, approval/activation, rollback/forward repair, and consumer acknowledgements. |

### `P1-S2` — Understand and retrieve

| Story | Status | Current evidence | Remaining work |
|---|---|---|---|
| `STORY-P1-011` | `PARTIAL PREVIEW` | Document detail and Trash/restore lifecycle exist. | Versions, supersession, archive, material comparison, current/effective view, conflict handling, and immutable lifecycle history. |
| `STORY-P1-012` | `PARTIAL PREVIEW` | Extracted facts retain a source document and short evidence excerpt. | Stable page/span/coordinate anchors, extractor/schema/generation provenance, exact citation redemption, unsupported-format behavior, and immutable evidence history. |
| `STORY-P1-013` | `PARTIAL PREVIEW` | Deterministic heuristic classification assigns a category. | Enabled versioned taxonomy/schema execution, confidence/review states, unknown/ambiguous types, configuration lineage, reclassification, and launch-pack coverage. |
| `STORY-P1-014` | `PARTIAL PREVIEW` | A proposed fact can be marked reviewed. | Correct/reject operations, optimistic concurrency, separate extraction/fact states, correction provenance, authorization, audit, and UI evidence editing. |
| `STORY-P1-015` | `NOT IMPLEMENTED` | No analysis-generation or reprocess command. | Immutable generations, versioned processor inputs, safe replay, current-generation selection, cancellation, stale-result handling, and API/event contracts. |
| `STORY-P1-016` | `PARTIAL PREVIEW` | Extracted records contain `validFrom` and `recordedAt`. | Immutable occurrences, canonical resolutions, bitemporal correction, effective/recorded queries, provenance, concurrency, and non-destructive history. |
| `STORY-P1-017` | `PARTIAL PREVIEW` | Stable household subjects are linked to documents/facts. | Resource-entity resolution, aliases, merge/split with additive lineage, ambiguity review, authorization, and migration repair. |
| `STORY-P1-018` | `NOT IMPLEMENTED` | No fact-conflict detection or resolution workflow. | Conflict records, competing evidence, resolution policy, human review, temporal history, downstream invalidation, and tests. |
| `STORY-P1-019` | `NOT IMPLEMENTED` | Session access is workspace-wide; per-field privacy is not enforced. | Field/evidence/edge/search/answer/export privacy policy, redaction/minimal disclosure, cache invalidation, audit, and side-channel tests. |
| `STORY-P1-020` | `PARTIAL PREVIEW` | Person→document, category→document, and document→fact edges plus visual/list views exist. | Versioned edge catalogue, review/correction, current authorization at every node/edge, bounded traversal/cycles/truncation, rebuild/freshness, and graph APIs. |
| `STORY-P1-021` | `PARTIAL PREVIEW` | Deterministic token matching searches active text documents. | Metadata/full-text/semantic indexes, filters/facets, ranking, pagination, freshness/watermarks, request-time authorization, deletion/revocation invalidation, and performance evidence. |
| `STORY-P1-022` | `PARTIAL PREVIEW` | Questions return excerpts or explicit insufficient evidence without hosted AI. | Local on-device model/RAG runtime, schema-bound answer contract, exact anchors, multi-document synthesis, authorization, prompt-injection defenses, evaluation thresholds, and mobile parity. |
| `STORY-P1-023` | `PARTIAL PREVIEW` | Users can open original/text/image/PDF document views. | Clickable citation redemption to exact version/page/passage, version comparison, expired/revoked access behavior, and conversation provenance. |
| `STORY-P1-024` | `NOT IMPLEMENTED` | No AI capability gateway or registered model/tool execution. | Capability registry, schema validation, context/tool allow-list, local model selection/runtime, prompt/tool/model provenance, cancellation, fallback policy, and evaluation hooks. |
| `STORY-P1-025` | `PARTIAL PREVIEW` | Deterministic answers show coarse confidence and citations; external AI is off. | Calibrated confidence/review policy, groundedness/completeness/safety evaluations, privacy/cost/latency budgets, abstention, adversarial testing, and human-review routing. |

### `P1-S3` — Monitor and close the loop

| Story | Status | Current evidence | Remaining work |
|---|---|---|---|
| `STORY-P1-026` | `NOT IMPLEMENTED` | Dashboard summaries are not a versioned conformed document view. | Conformed-view schema, generation lineage, coverage/freshness, current authorization, lifecycle/version inputs, API, and rebuild/repair. |
| `STORY-P1-027` | `NOT IMPLEMENTED` | No monitoring subscription or durable run scheduler. | Date/document/source triggers, subscriptions, schedule/clock rules, retry-safe runs, deduplication, cancellation, replay, and audit. |
| `STORY-P1-028` | `NOT IMPLEMENTED` | Synthetic source registry exists only as disabled reference data. | Governed retrieval/parsers, immutable snapshots, source health/freshness/coverage, change detection, eligible Australian routes, and failure states. |
| `STORY-P1-029` | `NOT IMPLEMENTED` | No rule applicability or change case runtime. | Versioned rule resolution, jurisdiction/subject applicability, stable change cases, false-positive review, provenance, replay, and APIs/events. |
| `STORY-P1-030` | `NOT IMPLEMENTED` | Basic graph visualization does not perform governed impact traversal. | Authorized bounded dependency traversal, path evidence, cycles/truncation, stale edge handling, impact candidates, and tests. |
| `STORY-P1-031` | `NOT IMPLEMENTED` | No impact assessment or recommendation aggregate. | Explainable assessments, evidence/limitations, recommendation state, severity/urgency separation, deduplication, stale-input invalidation, and human review. |
| `STORY-P1-032` | `NOT IMPLEMENTED` | No approval workflow. | Approval bound to exact inputs/target/effect/policy/expiry, step-up authority, revoke/stale behavior, audit, and APIs/events. |
| `STORY-P1-033` | `NOT IMPLEMENTED` | No external action execution or evidence-verification closure. | Command/idempotency, partial/unknown outcome, reconciliation, replacement evidence, independent verification, closure, compensation, and connector conformance. |
| `STORY-P1-034` | `NOT IMPLEMENTED` | No expected-evidence profile evaluator. | Approved profiles, applicability, item findings, coverage/limitations, re-evaluation, provenance, and APIs/reference data. |
| `STORY-P1-035` | `NOT IMPLEMENTED` | General tasks are not governed findings. | Finding lifecycle, disposition/reason, evidence requirement, fulfilment verification, waiver/exception rules, history, and UI. |
| `STORY-P1-036` | `PARTIAL PREVIEW` | Users can create/complete tasks and see in-app notifications/activity. | Assignment, reminders/schedules, preferences/quiet periods, task-document/finding linkage, deduplication, escalation, notification read state, repair, and mobile parity. |
| `STORY-P1-037` | `NOT IMPLEMENTED` | Static validators are not configuration publication. | Propose/validate/review/approve/publish/activate/supersede/rollback workflow, authorization separation, compatibility, consumer acknowledgement, and audit. |
| `STORY-P1-038` | `NOT IMPLEMENTED` | No minimal-disclosure impact response. | Policy-specific “impact exists” result without protected basis, anti-enumeration behavior, authorized redemption, side-channel testing, and API contract. |

### `P1-S4` — Family launch and portability

| Story | Status | Current evidence | Remaining work |
|---|---|---|---|
| `STORY-P1-039` | `NOT IMPLEMENTED` | Workspace creation now persists and evaluates one explicit purpose/action/resource bootstrap grant for the owner; prospective members receive no fabricated grant. No delegated grant issue/preview/redeem workflow exists. | Exact delegated resource/field/action/purpose/time grants, effective-access preview, invitation, single-use redemption, expiry/revocation propagation, key-envelope access, minimal disclosure, and immutable audit. |
| `STORY-P1-040` | `PARTIAL PREVIEW` | Dependants and login-enabled people are separate; invitation state is represented; bounded authority persistence preserves separate subjects/memberships. | Implement and independently prove the `DEC-P1-056` explicit revisioned fail-closed attempt state, atomic deny boundary, audit, retry/rollback/recovery, permission recalculation, and partial/concurrent failure cases. Do not add advanced independent transfer/delegation semantics. |
| `STORY-P1-041` | `PARTIAL PREVIEW` | Provider catalogue shows purpose, requested permission, exact callback, and `CONFIGURED_DISABLED` state. | OAuth start/callback routes, token store, provider adapters, consent persistence, selected-file import, cursors, revocation/deletion, conformance, and production provider approval. |
| `STORY-P1-042` | `PARTIAL PREVIEW` | Customer external channels remain disabled; the framework ACS Product Authority adapter is operational but is explicitly not product/customer notification evidence. | Notification preferences, customer-recipient email adapter, recipient verification, delivery/bounce/retry state, quiet periods, consent/minimization, SMS scope/provider decision, and product conformance tests. |
| `STORY-P1-043` | `PARTIAL PREVIEW` | No aggregate score is shown; statuses/tasks provide limited item signals. | Versioned expected-evidence findings, explainable item health, coverage/freshness/limitations, accessible UI, and explicit no-score negative tests. |
| `STORY-P1-044` | `PARTIAL PREVIEW` | A JSON export endpoint returns some current local state without extracted text. | Complete declared envelope with originals, versions, facts, relationships, tasks, grants, audit, manifest/checksums, authorization, encryption, temporary cleanup, and portability tests. |
| `STORY-P1-045` | `PARTIAL PREVIEW` | Immediate fence, 30-day Trash/restore, final file/fact/edge/task purge, and unit tests exist. | Step-up restore, durable scheduler/ledger, encrypted Blob and key-envelope purge, every projection/adapter/backup acknowledgement, late-event non-resurrection, exceptions, and production evidence. |
| `STORY-P1-046` | `PARTIAL PREVIEW` | Azure Australia foundations, policy markers, and Australian ACS data location exist. | Enforceable data-class/processor/region matrix across storage, AI, connectors, support, telemetry, backup/failover, exports, and denial/evidence tests. |
| `STORY-P1-047` | `INTENTIONALLY UNAVAILABLE` | Web/mobile sign-in explicitly says recovery and ownership transfer are unavailable; the reserved authenticated API returns and audits `POLICY_BLOCKED` rather than success, and no reset/transfer/evidence-upload route exists. | Full contract, accessibility, anti-enumeration, repeated-abuse, direct-port/configuration and support-boundary negative evidence; any later production recovery still requires identity/key assurance and an owner decision. |
| `STORY-P1-048` | `INTENTIONALLY UNAVAILABLE` | No automated emergency/incapacity/after-death release exists, as required by `DEC-032`. | Explicit negative tests and copy; keep ordinary grants/export separate and prevent future configuration from silently activating release. |
| `STORY-P1-049` | `PARTIAL PREVIEW` | React public marketing, product/feature, trust/privacy/security, legal, about/contact and account-entry routes/components exist with approved Doculyra branding. | Complete acceptance/security/accessibility tests, production legal/operator/contact approval, launch content review, DNS/deployment evidence and no-fabricated-assurance checks. |

## 4. Feature and requirement coverage by slice

| Slice | Feature range | Current position | Main unfinished requirement families |
|---|---|---|---|
| `P1-S1` | `FEAT-P1-001`–`007` | All have partial preview evidence except durable ingestion retry. | `REQ-P1-WS-*`, `DOC-*`, `ING-*`, `TRUST-*`, `CFG-*`: production authorization, immutable versions, durable workflows, malware/quarantine, encryption/key custody, audit, and configuration activation. |
| `P1-S2` | `FEAT-P1-008`–`015` | Basic dossier/facts/graph/search/cited-answer behavior exists; no feature is complete. | `DOC-*`, `ING-*`, `FCT-*`, `GPH-*`, `SRCH-*`, `AI-*`: exact evidence, bitemporal facts, conflicts, versioning, field privacy, bounded graph, real local RAG, and evaluation. |
| `P1-S3` | `FEAT-P1-016`–`023` | Only general task/in-app behavior is partially implemented. | `MON-*`, `GPH-*`, `ACT-*`, `HLT-*`, `NTF-*`, `CFG-*`, `SHR-*`: governed monitoring, applicability, impact, recommendation/approval/action, evidence health, and configuration publication. |
| `P1-S4` | `FEAT-P1-024`–`031` | Family people, public entry, disabled connector catalogue, basic export/Trash, and Australian foundations are partial; recovery/continuity correctly absent. | `SHR-*`, `ING-*`, `NTF-*`, `TRUST-*`, `HLT-*`, `PLT-*`: exact grants/invites, fail-closed dependant fence, live adapters, complete export, coordinated deletion, residency enforcement, item health, public-entry assurance, and launch evidence. |

## 5. Architecture and production gaps

The principal differences between the preview and [`ARCH-SOL-001`](../02-architecture/01-solution-architecture.md) are:

1. **Tenancy and authorization:** a local multi-workspace authority store, explicit owner bootstrap grant, authorization epoch and deny-by-default action boundary now exist, but persistence is still JSON and field/evidence/edge/delegated-grant/revocation propagation and production policy infrastructure remain incomplete.
2. **Data plane:** canonical state is a local JSON file and artifacts are local/Azure Files preview data, not production canonical stores plus immutable customer-encrypted Blob artifacts and rebuildable projections.
3. **Encryption:** TypeScript and Dart cryptographic envelope tests exist, but React/Flutter upload paths send plaintext to the API and the API stores plaintext. This must be fixed before real documents are allowed.
4. **Durable processing:** there is no transactional outbox, workflow state machine, queue, retry/replay, dead-letter, cursor, projection watermark, migration, or repair runtime.
5. **Intelligence:** current extraction/search/Q&A are deterministic heuristics in the API, not the approved device-local extraction/RAG/capability-gateway architecture.
6. **Provider adapters:** registrations and secrets are prepared, but authorization/callback/token/import/delivery code does not exist and provider routes are absent from OpenAPI.
7. **Monitoring and action:** governed sources, subscriptions, rule applicability, impact, recommendation, approval, external action, evidence verification, and closure are not implemented.
8. **Operations:** foundations, IaC, CI, images, and synthetic deployment exist; production observability, backup/restore, DR, privacy/legal review, accessibility evidence, penetration testing, incident exercises, and production subscription/release evidence do not.
9. **Mobile parity:** Flutter provides authentication, onboarding, dashboard/capture/Q&A/Trash foundations and builds previews, but it does not yet match all critical React journeys or implement store signing/distribution.
10. **Traceability state:** the reconciled baseline now represents public entry, current architecture decisions, bounded Issue #2 evidence, 49 stories and reverse source-test ownership. Future implementation increments must update this evidence snapshot without converting preview evidence into completion.

## 6. Recommended implementation order

All Phase 1 remains one continuous program under `DEC-054`; this order is for dependency and risk control, not separate product approvals.

1. Complete the production identity/MFA/passkey and durable multi-workspace foundation, then extend the local action-policy baseline into exact delegated grants, field/evidence/edge decisions, secure invitations, revocation propagation, and append-only audit.
2. End-to-end client encryption and secure key envelopes on React and Flutter before any real-document route.
3. Immutable artifact/version repository and durable ingestion/outbox/retry/quarantine pipeline.
4. Evidence anchors, extraction generations, taxonomy, bitemporal facts/entities/conflicts, and review/correction.
5. Authorized indexes/graph plus device-local RAG/capability gateway, exact citation redemption, and evaluation.
6. Governed monitoring, applicability, impact, recommendation, approval/action, evidence closure, and item-level health.
7. Complete tasks/reminders/preferences, ACS email invitation delivery, and mobile parity.
8. Implement and individually certify Microsoft, Google, Dropbox, and Box adapters using [`OPS-PROVIDER-001`](../09-devops/08-external-provider-setup.md).
9. Complete portability export, coordinated encrypted 30-day deletion, residency enforcement, backup/restore/DR, observability, and incident controls.
10. Execute the mapped security, privacy, accessibility, E2E, performance/resilience, migration/repair, mobile signing, and production-readiness gates.

## 7. Immediate external-provider blockers

- Google: one test user is verified, but the Data Access tables show no saved scopes; distinct `/privacy` and `/terms` URLs plus the logo must replace the current homepage placeholders after deployment.
- Dropbox: implicit/public-client grant remains enabled and unnecessary `openid`, `profile`, and `email` scopes remain selected; rotate the reviewed app secret and update Key Vault.
- Box: the earlier write-scope blocker is closed; read-only access is verified.
- All providers: runtime adapters, token custody, callbacks, consent persistence, disconnect/deletion, audit, and conformance tests are not implemented.

Until those conditions are closed, the truthful application state is `CONFIGURED_DISABLED`.

The prioritised, implementation-ready list of missing and incomplete items is maintained in [`BLG-REMAIN-001`](06-personal-family-remaining-work.md).
