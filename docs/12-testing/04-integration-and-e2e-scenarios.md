# Phase 1 Integration and End-to-End Scenario Catalogue

| Field | Value |
|---|---|
| Document ID | `TST-E2E-001` |
| Version | `0.2` |
| Status | **APPROVED IMPLEMENTATION BASELINE — representative client and production evidence remains required** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `UC-P1-001`–`019`, all `AC-UC-P1-*`, `AC-P1-E2E-001`, `A11Y-P1-001`–`056`, `DEC-049`–`054` |

## 1. Integration profile

End-to-end tests use two unrelated synthetic household workspaces; owner/member/managed-dependant/guest/workload actors; private/shared/restricted resources; deterministic fake scanner, parser, AI, source, notification, connector, export and action ports; controllable clock and event order; and ephemeral canonical/derived stores. Outbound network is denied. The profile exercises real selected persistence, transaction/outbox, event-consumer and authorization boundaries once implementation choices exist, but fake-port success never proves a real provider, source, delivery, residency or effect.

Every scenario asserts UI/API state, canonical revision, immutable evidence/provenance, event and required audit obligations, projection/source/config/authorization/deletion watermarks, safe errors, accessibility status/focus, retry/cancel/repair behavior, cleanup, and prohibited observations. Deliberate denial or degradation is a functional security result and a separate availability/experience result.

## 2. Product journey catalogue

| Test ID | Use case / acceptance | Integrated scenario and terminal oracle |
|---|---|---|
| `TEST-E2E-P1-001` | `UC-P1-001`; `AC-UC-P1-001-01`–`04` | Create an idempotent personal/family workspace, owner membership and distinct subjects; reject enterprise; administrator cannot infer another member's private resource. |
| `TEST-E2E-P1-002` | `UC-P1-002`; `AC-UC-P1-002-01`–`05` | File/camera intake converges through receiving, safety, quarantine/hold, extraction and review; duplicate/reordered retries, malware, clinical hold, correction and mid-flow revoke remain truthful. |
| `TEST-E2E-P1-003` | `UC-P1-003`; `AC-UC-P1-003-01`–`04` | Preserve originals and acquisition histories through version/supersession/amendment/cancellation, conformed conflict and artifact-grant expiry/wrong version/workspace. |
| `TEST-E2E-P1-004` | `UC-P1-004`; `AC-UC-P1-004-01`–`04` | Resolve overlapping fact occurrences bitemporally with exact evidence, no confidence auto-promotion, restricted conflict minimization and stale-approval invalidation. |
| `TEST-E2E-P1-005` | `UC-P1-005`; `AC-UC-P1-005-01`–`04` | Search, cited Q&A and comparison return supported claims with exact authorized anchors, limitation states, revoke-safe conversation/citation, injection resistance and uncertainty. |
| `TEST-E2E-P1-006` | `UC-P1-006`; `AC-UC-P1-006-01`–`05` | Date/user/document/dependency/source triggers deduplicate; source parser/freshness failure remains visible; applicability precedes impact; graph cycle/depth yields incomplete coverage. |
| `TEST-E2E-P1-007` | `UC-P1-007`; `AC-UC-P1-007-01`–`05` | Typed authorized impact leads to recommendation, exact bound approval, action attempt/unknown/partial reconciliation and verified replacement evidence; stale source/grant/digest blocks closure. |
| `TEST-E2E-P1-008` | `UC-P1-008`; `AC-UC-P1-008-01`–`05` | Explain missing evidence/profile/rule, primary/alternative/exception fulfilment, distinct NA/dismiss/remind states and restricted minimization; no aggregate score or guarantee. |
| `TEST-E2E-P1-009` | `UC-P1-009`; `AC-UC-P1-009-01`–`05` | Preview exact grant, delegate two resources, expire/revoke link and invalidate conversation/download/notification/export; administrator cannot share private data; continuity trigger is inert. |
| `TEST-E2E-P1-010` | `UC-P1-010`; `AC-UC-P1-010-01`–`05` | Repeated events create one logical in-app reminder, snooze preserves truth, stale source/revoked grant degrades delivery, and complete-without-evidence cannot close obligation. |
| `TEST-E2E-P1-011` | `UC-P1-011`; `AC-UC-P1-011-01`–`05` | Authorized versioned export has exact manifest/checksums/envelope/omissions; revoke mid-build and partial item stay non-deliverable/incomplete; redemption reauthorizes. |
| `TEST-E2E-P1-012` | `UC-P1-012`; `AC-UC-P1-012-01`–`05` | Delete fences originals/derivatives/caches/events/connectors/backups immediately, displays Trash and exact server deadline, restores only with current step-up authority before 30 days, blocks post-deadline/late resurrection, and reconciles final purge evidence. |
| `TEST-E2E-P1-013` | `UC-P1-013`; `AC-UC-P1-013-01`–`04` | Two-workspace isolation across API, stores, search, graph, model/tools, conversations, notifications, exports, analytics, support and audit; revocation repairs queued/cached derivatives. |
| `TEST-E2E-P1-014` | `UC-P1-014` | Upload/camera/manual remain the only active routes; connector port conformance is synthetic and disabled; consent/revoke/resync/delete/route checks cannot activate a live adapter under `DEC-031`. |
| `TEST-E2E-P1-015` | `UC-P1-015` | Managed-dependant transition stays unavailable without approved authority/eligibility/challenge rules; existing evidence/history is not reassigned or recreated by a generic membership change. |
| `TEST-E2E-P1-016` | `UC-P1-016` | Incapacity/death/event input creates no automatic grant, disclosure, notification or effect while `DEC-032` is open; ordinary sharing/export remain distinct. |
| `TEST-E2E-P1-017` | `UC-P1-017` | Lost factors and support request reveal no workspace/member/private-resource existence and create no recovery/owner transfer while `DEC-038` is open. |
| `TEST-E2E-P1-018` | `UC-P1-018` | Validate, approve, publish, acknowledge, activate, supersede and roll back/forward-repair immutable configuration packages; DRAFT, incompatible, dangling or stale packages never activate. |
| `TEST-E2E-P1-019` | `UC-P1-019` | Reconstruct consequential workflow from immutable content-free audit/provenance, detect tamper/gaps, enforce tenant/purpose access and minimization, and keep retention durations unset. |
| `TEST-E2E-P1-020` | Mandatory product umbrellas | Run the four proposed slices as one cross-cutting synthetic journey and assert ingestion, RAG, monitoring, AI, security, deletion and accessibility umbrellas without enabling open-decision routes. |
| `TEST-E2E-P1-021` | `DEC-050`; `REQ-P1-CRYPTO-001`–`003` | Encrypt on client, upload only ciphertext/wrapped envelope, share and revoke a member key envelope, reopen on another authorized device, reject tamper/wrong context, and prove plaintext absent from transport, Azure data roles and telemetry. |
| `TEST-E2E-P1-022` | `DEC-052`; `REQ-P1-PLT-001`–`002` | Execute onboarding, capture, view, organize, ask-with-citations, family access, activity, Trash/restore and offline/reconnect through React web, Flutter iOS and Flutter Android with matching contract/security semantics. |
| `TEST-E2E-P1-023` | `DEC-049`/`054`; `REQ-P1-OPS-001`–`002` | Deploy immutable candidate to isolated Azure dev then stage, validate Australian routes, managed identities/RBAC/diagnostics/budget, reject cross-environment references, and prove production remains unprovisioned. |

## 3. Async, event, and race coverage

The integration harness provides barriers at canonical commit/outbox/send/ack/checkpoint; scanner/parser/model/tool start/finish; source retrieval/parser/publish; recommendation/approval/effect dispatch/receipt/reconcile; export package/release; deletion fence/purge acknowledgement; and projection rebuild/cutover. Each applicable journey injects duplicate, delayed, reordered, missing, same-ID/different-bytes, poison, partition, worker-loss, retry exhaustion, cancellation, audit outage, telemetry outage, and incompatible schema/configuration.

Required invariants are: canonical state is never inferred from queue presence; a durable accepted workflow remains queryable; identical idempotency replay creates one logical outcome; fingerprint mismatch conflicts; stale ETag requires explicit reconciliation; current authorization/quarantine/cancellation/source health/route/deletion is checked before consequence; unknown/partial external effects reconcile before retry; replay uses original identity/bytes in a new generation; and repair does not edit immutable evidence or fabricate acknowledgement.

## 4. Ingestion and deletion stage matrix

| Interleaving | Expected ingestion/deletion outcome |
|---|---|
| Duplicate acquisition before/after safety scan | Preserve acquisition history and immutable bytes; dedup cannot force logical identity or duplicate uncontrolled effects. |
| Malware decision before preview/parser/index | `QUARANTINED`; all ordinary content routes denied, authorized decision only. |
| Suspected clinical detection at any intake stage | `POLICY_HOLD`; no ordinary preview/extraction/search/graph/AI; no invented disposition/timing. |
| Cancel before irreversible stage | Durable `CANCELLING` then evidenced `CANCELLED`; exact cleanup and audit. |
| Cancel after possible external/derived work | Too-late/partial/unknown remains explicit; reconcile rather than claim stopped. |
| Revoke after candidate retrieval or before result | Stale actor receives no result/existence/citation/notification; canonical work may persist only under authorized service purpose. |
| Deletion fence before worker/model/commit/publish | Work stops or commits only denial/repair state; no serviceable derivative. |
| Fence after commit but before publish/checkpoint | Event/consumer observes current fence and suppresses/removes result; purge acknowledgement stays per data role. |
| Late event/replay/resync/rebuild/restore | Tombstone/fence prevents resurrection and emits safe rejection/reconciliation evidence. |

## 5. Source, monitoring, and action failure matrix

| Failure | Required user/domain behavior |
|---|---|
| Retrieval timeout/refusal/unknown schema | Source health moves to truthful degraded/unavailable state; prior snapshot is labelled stale; no-change is prohibited. |
| Parser change/failure | Preserve observation/snapshot/parser versions; do not publish false semantic change/no-change; repaired replay is deterministic. |
| Applicability evidence missing/restricted | `INDETERMINATE`, `REVIEW_REQUIRED`, `RESTRICTED`, or `UNAVAILABLE` as exact contract requires; no misleading action. |
| Graph cycle/depth/fan-out bound | Terminate deterministically with incomplete coverage; never claim all impacts found. |
| Recommendation target/effect changes | Bound approval becomes stale/invalid and cannot execute. |
| Timeout after possible effect | `OutcomeUnknown`/reconciliation; retry cannot duplicate effect. |
| Partial provider result/receipt only | `PartiallySucceeded` or evidence pending; not verified success/fulfilment. |
| Replacement evidence fails verification | Requirement/action/task remain open or review-required; no automatic renewal/closure. |

## 6. Accessibility critical-path matrix

Each user-facing `TEST-E2E-*` case runs automated checks plus manual keyboard and screen-reader review on the approved matrix when it exists. Until that matrix is approved, evidence is `INSUFFICIENT`, not a pass. Required checks map `A11Y-P1-001`–`056` and include:

- accessible name/role/state, headings/landmarks, semantic table/list/graph alternative, and programmatic relationship of evidence/status;
- logical keyboard order, visible focus, modal trapping/return, skip navigation, and no keyboard trap;
- announced loading/progress/quarantine/partial/stale/restricted/revoked/expired/deleted/offline states without repeated or content-leaking live updates;
- associated labels/instructions/errors, preserved input after reauthentication/failure, and focus to an actionable error summary;
- timeout warning/extension where permitted, durable async work, cancellation truth and recovery action;
- 320 CSS-pixel reflow, 200% text resize, 400% zoom, target size/spacing, contrast and non-colour status distinctions;
- reduced motion, readable language, bounded cognitive load, destructive confirmation and reversible-state explanation; and
- file-picker and camera alternatives with equivalent validation/error/privacy behavior.

Accessibility failure in onboarding, capture/review, evidence/citation, grant/revoke, approval/action, health/task, export/deletion, or authentication is assessed against the critical-journey stop-ship policy. Screenshots/recordings contain synthetic data only and follow the telemetry/evidence privacy allow-list.

## 7. Offline, stale, restricted and error states

No journey tests only a happy path. At each screen/API transition, the suite exercises loading, empty, partial, retryable and terminal error, offline, stale, restricted, revoked, expired, deleted, unknown version, and dependency unavailable where applicable. Cached/offline views carry last-verified time, coverage and non-authoritative label, cannot authorize a write/effect, and revalidate current authority before navigation or redemption. Privacy-safe counts never reveal hidden items through totals, badges or layout changes.

Destructive actions show exact scope and consequences, require current authority and explicit confirmation, and distinguish reversible Trash state from irreversible execution using the server-authored `deleted_at + 30 calendar days` deadline in `DEC-053`. Failure preserves user input where safe and provides one accessible next action without exposing provider/internal detail.

## 8. Completion evidence

An E2E result is complete only with exact candidate/contracts/reference/configuration/policy, fixture and seed, client/accessibility matrix, event/fault/race schedule, state/event/audit/projection assertions, prohibited observations, cleanup and privacy-safe artifacts. A product AC is covered only when its mapped case passes with every applicable security/failure/accessibility variant; a single happy-path run does not close it.
