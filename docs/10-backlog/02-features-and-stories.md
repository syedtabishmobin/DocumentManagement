# Phase 1 Features and Implementation Stories

| Field | Value |
|---|---|
| Document ID | `BLG-STORY-001` |
| Version | `0.2` |
| Status | **APPROVED BUILD BACKLOG — execution requires a story Issue and Definition of Ready pass** |
| Product phase | Phase 1 — Personal and Family |
| Sequence basis | Approved continuous `P1-S1`–`P1-S4` program under `DEC-030`, `DEC-041`, and `DEC-054` |
| Updated | 30 August 2026 |

## 1. Story contract

Each story is the smallest currently coherent implementation candidate that leaves an observable, testable result without weakening a later invariant. A story includes its API/domain outcome, user-visible state where applicable, security/privacy/audit behavior, failure and repair path, migration compatibility, and evidence. Splitting a story by UI/API/database/worker is not completion.

All stories are part of the approved build backlog, but baseline inclusion is not permission to begin work without an attributed story Issue and a current Definition of Ready pass. `BASELINED`, `PLANNED_UNISSUED`, `SHAPING_REQUIRED`, `READY`, `IN_PROGRESS`, `PARTIAL PREVIEW`, `INTENTIONALLY UNAVAILABLE`, and `DONE` remain distinct. Owners are accountable roles. Product/catalogue, architecture/security/API/UX/engineering/operations/reference contracts remain their own sources of truth. DRAFT/disabled reference records remain non-activating until an approved publication changes them.

Each story inherits the complete `OUT-P1-*` set declared by its governing `FEAT-P1-*`. Requirement and acceptance links may be narrower, but a hand-maintained story row MUST NOT contradict its parent feature. `scripts/validate-build-baseline.py` enforces this reciprocal relationship.

The DRAFT testing pack now defines stable `TEST-UNIT/CON/AI/SEC/E2E/PERF/DR-P1-*` cases. Every story maps exact applicable IDs in its `Future TEST` row, closing historical `TRACE-GAP-P1-TEST-001`. Those IDs are candidates, not passing evidence: tests that are DRAFT, `BLOCKED`, `NOT_RUN`, or `INSUFFICIENT` cannot satisfy a story or release gate. Product `AC-P1-*`, use-case `AC-UC-*`, engineering rules, story ACs, and implementation tests retain separate ownership.

## 2. `P1-S1` — Secure household vault

### `STORY-P1-001` — Create an eligible workspace with one explicit owner

| Field | Contract |
|---|---|
| State / owner | `DEV_ACCEPTED — Issue #39 / PR #40`; Product + Identity/Workspace; independent `QA-FUNC-005` passed both story ACs on exact merged candidate, while Stage/BA/UAT and parent completion remain open. |
| Product | `REQ-P1-WS-001`, `REQ-P1-WS-002`; `FEAT-P1-001`; `UC-P1-001`; `OUT-P1-001`, `OUT-P1-005` |
| UX / accessibility | `UX-FLOW-P1-002`; `UX-SCR-P1-002`, `003`; `UX-IA-P1-001`–`006`; `A11Y-P1-001`–`017`, `021`–`035`, `043`–`050` |
| API / events | `API-P1-101`–`103`; `EVT-P1-001`, `002`; API rules `API-P1-007`–`014`, `027`–`038`, `047`–`052` |
| Security | `AUTH-P1-001`–`006`, `012`, `021`, `025`, `035`; `SEC-P1-001`–`004`, `006`–`011`, `017`, `018`; `PRIV-P1-001`–`003`, `020`, `022`; `AUD-P1-001`–`010`, `027`; `THR-P1-001`, `003`–`007`, `009`, `011`, `019` |
| NFR / DIT / AI | `NFR-P1-001`–`008`, `013`, `016`, `022`–`029`, `033`, `036`, `041`; no DIT/AI-owned state—`AI-CAP-P1-001`–`030` cannot supply workspace authority |
| Reference data | `data/jurisdictions.json`: `jurisdiction.core.neutral`, `jurisdiction.AU`; `data/access-control.json`: `policy.default-deny`, `role.workspace-member`; `data/common.json`: `PUR-P1-001` |
| Dependencies / fences | One idempotent aggregate workflow creates workspace, owner membership, and owner subject; `ORGANISATION` remains reserved; `DEC-030` approves the continuous sequence; `DEC-038` creates no recovery path. |
| Migration / rollback / repair | Expand/validate/migrate owner cardinality and opaque IDs before cutover; an interrupted creation reconciles or removes inaccessible provisional state; never roll back by orphaning an owner/resource. |
| Negative, failure, audit | Deny ineligible type, mismatched scope, duplicate-key fingerprint, cross-actor replay, audit/config failure, and inaccessible-workspace probing; same key returns the same logical result; audit owner/workspace/config/policy IDs without profile values. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-001`, `TEST-SEC-P1-001`, `TEST-SEC-P1-007`, `TEST-SEC-P1-008`, `TEST-E2E-P1-001`, `TEST-E2E-P1-013`, `TEST-PERF-P1-001`, `TEST-PERF-P1-002`, `TEST-DR-P1-001`, `TEST-DR-P1-002`, `TEST-DR-P1-007`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-001-01` — **Given** an eligible actor and approved personal/family configuration, **when** the actor repeats the same creation command and idempotency key, **then** one workspace with one explicit owner and one owner subject is returned with durable audit/event evidence.
- `AC-STORY-P1-001-02` — **Given** an ineligible, cross-actor, organisation, stale-config, or audit-failed request, **when** creation is attempted, **then** no accessible partial workspace or orphan membership remains and the caller receives a privacy-safe recoverable denial.

### `STORY-P1-002` — Represent subjects and memberships without fabricated identities

| Field | Contract |
|---|---|
| State / owner | `DEV_ACCEPTED — Issue #42 / PR #43`; Product + Identity/Workspace |
| Product | `REQ-P1-WS-003`; `FEAT-P1-001`; `UC-P1-001`; `OUT-P1-001`, `OUT-P1-005` |
| UX / accessibility | `UX-FLOW-P1-002`; `UX-SCR-P1-004`–`006`; `UX-IA-P1-007`–`012`; `A11Y-P1-001`–`017`, `024`–`035`, `043`–`050` |
| API / events | `API-P1-104`–`111`; `EVT-P1-002`, `003`; `API-P1-007`–`020`, `027`–`038`, `047`–`050` |
| Security | `AUTH-P1-001`–`007`, `012`, `021`, `025`, `035`; `SEC-P1-001`, `002`, `006`, `017`, `018`; `PRIV-P1-001`–`004`, `019`, `023`; `AUD-P1-001`–`010`, `027`; `THR-P1-003`–`007`, `009`, `019` |
| NFR / DIT / AI | `NFR-P1-001`–`008`, `013`, `016`, `022`–`029`, `033`, `036`, `041`; no DIT/AI identity resolution may create authority (`DIT-FCT-P1-018`–`024`, `AI-CAP-P1-001`–`030`) |
| Reference data | `data/access-control.json`: `role.workspace-member`, `policy.default-deny`; `data/common.json`: `privacy.P2-HOUSEHOLD`, `privacy.P3-SENSITIVE` |
| Dependencies / fences | Depends on `STORY-P1-001`; identity, subject, membership, relationship, and credential stay distinct; a managed dependant can exist without login; transition is deferred to `STORY-P1-040`. |
| Migration / rollback / repair | Preserve stable subject IDs and effective-dated membership history; repair duplicate proposals through explicit merge/reject lineage, never by rewriting evidence or attaching credentials silently. |
| Negative, failure, audit | Deny cross-workspace subject/member access, relationship-as-authority, hidden-resource counts, and fabricated login; concurrent invite/update uses revision guards; audit changes without sensitive subject values. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-001`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-E2E-P1-001`, `TEST-E2E-P1-015`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-002`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-002-01` — **Given** a family workspace, **when** an authorized actor creates a managed-dependant subject, **then** the subject has a stable workspace identity and provenance without a fabricated account or membership.
- `AC-STORY-P1-002-02` — **Given** a relationship label, stale membership revision, or foreign workspace ID, **when** protected membership or subject data is requested or changed, **then** authority is denied without disclosing hidden resources and the attempt is safely audited.

### `STORY-P1-003` — Evaluate current resource, field, edge, and action authorization

| Field | Contract |
|---|---|
| State / owner | `DEV_ACCEPTED — Issue #46 / PR #47`; Security + Authorization; independent `QA-FUNC-011` passed both story ACs on exact merged candidate, while Stage/BA/UAT and parent completion remain open. |
| Product | `REQ-P1-WS-004`, `REQ-P1-WS-005`, `REQ-P1-TRUST-002`; `FEAT-P1-002`; `UC-P1-001`, `013`; `OUT-P1-005`, `OUT-P1-007` |
| UX / accessibility | All `UX-FLOW-P1-*`/`UX-SCR-P1-*` discovery and action surfaces; `UX-IA-P1-013`–`032`; `A11Y-P1-003`, `004`, `007`–`025`, `051`–`056` |
| API / events | `API-P1-112`–`115`; `EVT-P1-004`, `005`; cross-cutting `API-P1-007`–`014`, `024`–`032`, `037`–`052` |
| Security | `AUTH-P1-001`–`035`; `SEC-P1-001`, `002`, `006`, `007`, `015`, `017`–`019`, `024`–`029`; `PRIV-P1-001`–`004`, `020`, `023`–`028`; `AUD-P1-001`–`010`, `013`–`030`; `THR-P1-003`–`007`, `010`, `014`, `019`, `020`, `022`–`025` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `007`, `008`, `013`, `016`, `017`, `022`–`025`, `026`, `028`, `029`, `032`–`043`; all DIT/AI consumers must reauthorize; especially `DIT-FCT-P1-025`–`035`, `DIT-GPH-P1-023`–`032`, `AI-RAG-P1-006`–`030` |
| Reference data | `data/access-control.json`: all `action.*`, `policy-decision.*`, `permission.*`, `role.*`, `policy.default-deny`, `policy.minimum-disclosure`; `data/common.json`: `PUR-P1-001`–`008` |
| Dependencies / fences | Depends on `STORY-P1-001`, `002`; policy/version/epoch are authoritative; membership/admin labels are insufficient; `DEC-038`/`040` unknown states deny. |
| Migration / rollback / repair | Policy schema changes are expand/validate/activate with consumer acknowledgements; keep old decoder/policy versions for replay; rollback cannot revive revoked grants or reduce deny precedence. |
| Negative, failure, audit | Exhaustive two-workspace/resource/field/edge/search/inference/action/export/audit/support matrix; revoke between enqueue/work/output/redemption; policy outage fails closed and counts unavailable; decisions log safe inputs/obligations only. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-001`, `TEST-CON-P1-006`, `TEST-CON-P1-007`, `TEST-CON-P1-008`, `TEST-SEC-P1-001`–`TEST-SEC-P1-008`, `TEST-E2E-P1-013`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-003-01` — **Given** a member with container access but no sensitive-field/edge/action permission, **when** every direct and derived surface is queried, **then** the protected value/existence/path/effect remains undisclosed while authorized information remains usable.
- `AC-STORY-P1-003-02` — **Given** a grant is revoked or policy epoch advances during queued work, **when** a worker, cache, answer, artifact, notification, export, or action reaches output/effect, **then** current policy blocks or safely minimizes it and records propagation evidence.

### `STORY-P1-004` — Accept upload, camera, and manual capture into one durable case

| Field | Contract |
|---|---|
| State / owner | `DEV_ACCEPTED — Issue #50 / PR #51`; Document Platform + UX; independent `QA-FUNC-013` passed both story ACs on exact merged candidate, while Stage/BA/UAT and parent completion remain open. |
| Product | `REQ-P1-DOC-006`, `REQ-P1-ING-001`, `REQ-P1-ING-002`; `FEAT-P1-004`; `UC-P1-002`; `OUT-P1-001`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-003`; `UX-SCR-P1-009`–`011`; `UX-DS-P1-014`–`025`; `A11Y-P1-001`–`042`, especially `036`, `037` |
| API / events | `API-P1-116`–`119`; `EVT-P1-006`; `API-P1-015`–`023`, `027`–`043`, `047`–`052` |
| Security | `AUTH-P1-001`–`007`, `012`, `021`, `025`, `035`; `SEC-P1-001`, `002`, `006`–`018`, `029`; `PRIV-P1-001`, `002`, `010`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `027`; `THR-P1-003`, `007`, `011`–`013`, `019`, `026`, `027`, `029` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `012`–`015`, `022`–`029`, `033`–`043`; `DIT-ING-P1-001`–`018`; `DIT-TAX-P1-001`–`010`; AI planning only through registered `ai.ingestion_plan` under `AI-CAP-P1-001`–`030` |
| Reference data | `data/document-types.json`: `format.application-pdf`, `format.image-jpeg`, `format.image-png`, `launch-profile.synthetic.au.phase1`; `data/states-and-severity.json`: `machine.ingestion-case`, `machine.ingestion-stage`, `machine.presence` |
| Dependencies / fences | Depends on `STORY-P1-001`, `003`; required routes only; connector capture deferred to `STORY-P1-041`; enabled formats/limits remain disabled/synthetic pending `DEC-035`. |
| Migration / rollback / repair | Preserve acquisition-attempt and case IDs across schema versions; interrupted transfer resumes/reconciles or cancels; no accepted bytes are discarded by deployment rollback; forward repair publishes a new attempt/stage. |
| Negative, failure, audit | Reject wrong workspace/grant, unsafe MIME/size, expired transfer, duplicate fingerprint mismatch, and disabled format; same idempotency fingerprint returns one case; offline/cancel/retry preserves truthful state and content-free audit. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-UNIT-P1-004`, `TEST-CON-P1-002`, `TEST-CON-P1-006`, `TEST-SEC-P1-009`, `TEST-SEC-P1-010`, `TEST-SEC-P1-015`, `TEST-E2E-P1-002`, `TEST-PERF-P1-005`, `TEST-DR-P1-001`, `TEST-DR-P1-002`, `TEST-UNIT-P1-011`, `TEST-SEC-P1-016`, `TEST-SEC-P1-017`, `TEST-E2E-P1-021`, `TEST-CON-P1-013`, `TEST-E2E-P1-022`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-004-01` — **Given** an enabled synthetic format, **when** the same authorized payload is submitted through retries, **then** one durable ingestion case records route/provenance/attempts and exposes a retrievable truthful state without claiming extraction success.
- `AC-STORY-P1-004-02` — **Given** camera denial, keyboard-only use, offline interruption, unsupported input, or authorization change, **when** capture proceeds, **then** an equivalent file/manual path and safe cancel/retry outcome exist without duplicate versions or leaked metadata.

### `STORY-P1-005` — Isolate malware and suspected clinical material before ordinary processing

| Field | Contract |
|---|---|
| State / owner | `DEV_ACCEPTED — Issue #55 / PR #56`; Security + Document Platform; independent `QA-FUNC-015` passed both story ACs and defect #57 on exact candidate `e7879c8`; Stage/BA/UAT and parent completion remain open. |
| Product | `REQ-P1-DOC-007`, `REQ-P1-ING-003`; `FEAT-P1-005`; `UC-P1-002`; `OUT-P1-001`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-004`; `UX-SCR-P1-012`; `UX-DS-P1-026`–`034`; `A11Y-P1-001`–`005`, `014`–`028`, `036`, `037`, `043`–`056` |
| API / events | `API-P1-118`, `120`, conditional `121`; `EVT-P1-006`, `007`, `029`; `API-P1-033`–`040`, `047`–`052` |
| Security | `AUTH-P1-001`–`007`, `012`, `021`, `025`, `031`, `035`; `SEC-P1-013`, `014`, `016`–`018`, `029`; `PRIV-P1-010`, `011`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `027`; `THR-P1-011`–`013`, `019`, `026`, `027` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `012`, `013`, `022`–`029`, `033`, `036`, `037`, `040`–`043`; `DIT-ING-P1-019`–`035`; `DIT-TAX-P1-011`–`025`; `AI-GRD-P1-001`–`035` must refuse ordinary processing |
| Reference data | `data/document-types.json`: `content-boundary.CLINICAL_EXCLUDED`, `doctype.health.clinical-record`; `data/states-and-severity.json`: `state.ingestion.QUARANTINED`, `state.ingestion.POLICY_HOLD`, `state.ai-output.POLICY_BLOCKED` |
| Dependencies / fences | Depends on `STORY-P1-004`; scanner timeout/unavailability and suspicion remain contained; approved `DEC-036` requires isolated `POLICY_HOLD` and forbids inventing any broader storage/disposition/timing promise; `DEC-024` excludes clinical records. |
| Migration / rollback / repair | Quarantine/hold survives deployment and projection rebuild; repaired scanner creates a new stage attempt; rollback cannot expose content or erase containment history; release/delete waits for approved policy and distinct authority. |
| Negative, failure, audit | Deny preview/download/parser/OCR/AI/index/graph/search/notification/support for contained content; malicious/polyglot/archive/scanner-timeout fixtures; generic status discloses no clinical inference; audit safe classification/attempt/result only. |
| Future TEST | `TEST-UNIT-P1-004`, `TEST-CON-P1-002`, `TEST-AI-P1-001`, `TEST-SEC-P1-009`, `TEST-SEC-P1-010`, `TEST-SEC-P1-012`, `TEST-E2E-P1-002`, `TEST-PERF-P1-001`, `TEST-PERF-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-005-01` — **Given** a malicious, scanner-indeterminate, or synthetic suspected-clinical fixture, **when** safety checks run, **then** it cannot reach any ordinary content/derivative route and the case exposes a truthful contained state.
- `AC-STORY-P1-005-02` — **Given** suspected clinical material enters approved `POLICY_HOLD` under `DEC-036`, **when** a user or operator asks what will be stored, released, exported, recovered, or purged, **then** only the approved containment behavior is stated and no ordinary/admin role can override it.

### `STORY-P1-006` — Retry durable ingestion stages without duplicate logical effects

| Field | Contract |
|---|---|
| State / owner | `DEV_ACCEPTED — Issue #58 / PR #59`; Document Platform; independent `QA-FUNC-019` passed defect #60, both story ACs and P1-001–005 regression on exact candidate `552ad41`; protected PostgreSQL/API 63/63 plus Android/iOS passed before merge `6e306b0`. |
| Product | `REQ-P1-ING-004`; `FEAT-P1-004`; `UC-P1-002`; `OUT-P1-001`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-003`, `005`; `UX-SCR-P1-011`; `A11Y-P1-002`, `017`, `021`–`028`, `046`, `051`–`054` |
| API / events | `API-P1-118`–`120`, `142`, `143`; `EVT-P1-006`, `008`; `API-P1-027`–`040`, `047`–`050` |
| Security | `AUTH-P1-001`, `003`–`007`, `012`, `021`, `024`, `025`, `035`; `SEC-P1-001`, `006`, `007`, `013`, `014`, `017`–`020`, `029`; `PRIV-P1-001`, `010`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `027`; `THR-P1-007`, `009`, `011`–`013`, `019`, `026`, `027` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `012`–`018`, `026`–`030`, `033`–`036`, `041`–`045`; `DIT-ING-P1-011`–`035`; AI/OCR attempts follow `AI-CAP-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/states-and-severity.json`: all `machine.ingestion-case`, `machine.ingestion-stage`, `machine.ai-output-status` records |
| Dependencies / fences | Depends on `STORY-P1-004`, `005`; each stage/attempt/outbox transition has stable identity; current authorization, quarantine, deletion, route, and cost are rechecked at execution/output. |
| Migration / rollback / repair | Retain old event/schema decoders and checkpoints; replay creates a new generation/attempt without rewriting prior output; poison messages enter DLQ/repair; rollback cannot repeat an external or version-creation effect. |
| Negative, failure, audit | Exercise crash before/after commit/publish/ack, duplicate/delayed/reordered events, revoke/delete mid-stage, cost/route exhaustion, cancel/race, audit outage; one logical result with all attempt evidence. |
| Future TEST | `TEST-UNIT-P1-004`, `TEST-CON-P1-002`, `TEST-CON-P1-006`, `TEST-SEC-P1-014`, `TEST-SEC-P1-015`, `TEST-E2E-P1-002`, `TEST-PERF-P1-005`, `TEST-PERF-P1-006`, `TEST-DR-P1-001`, `TEST-DR-P1-002`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-006-01` — **Given** duplicate, delayed, reordered, or replayed stage messages, **when** workers process them across crash windows, **then** state converges without duplicate version/output and every attempt remains correlated and auditable.
- `AC-STORY-P1-006-02` — **Given** revocation, quarantine, deletion, ineligible route, or exhausted retry/cost policy during work, **when** the next boundary is reached, **then** processing stops in an exact blocked/retry/terminal state and prior safe results are not falsified.

### `STORY-P1-007` — Preserve immutable artifact bytes and logical document versions

| Field | Contract |
|---|---|
| State / owner | `IN_IMPLEMENTATION — Issue #65`; Document Platform + Security |
| Product | `REQ-P1-DOC-001`, `REQ-P1-DOC-002`, `REQ-P1-DOC-004`; `FEAT-P1-003`; `UC-P1-002`, `003`; `OUT-P1-001`, `OUT-P1-002` |
| UX / accessibility | `UX-FLOW-P1-005`, `006`; `UX-SCR-P1-014`–`016`; `A11Y-P1-001`–`020`, `029`–`042`, `043`–`050` |
| API / events | `API-P1-122`–`130`; `EVT-P1-007`, `009`; `API-P1-015`–`020`, `027`–`038`, `041`, `042`, `047`–`050` |
| Security | `AUTH-P1-001`–`007`, `012`, `018`–`025`, `034`, `035`; `SEC-P1-012`, `015`–`019`, `027`, `029`; `PRIV-P1-001`, `011`, `016`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `027`; `THR-P1-003`, `006`, `008`, `009`, `011`, `014`, `019`, `023`, `026` |
| NFR / DIT / AI | `NFR-P1-003`–`005`, `010`, `013`, `016`–`018`, `022`–`031`, `033`, `035`, `036`, `039`, `041`–`043`; `DIT-ING-P1-001`–`035`, `DIT-EXT-P1-001`–`008`, `DIT-VER-P1-001`–`018`; AI has no authority to mutate bytes (`AI-GRD-P1-001`–`035`) |
| Reference data | `data/document-types.json`: enabled `format.*` and `content-boundary.*`; `data/access-control.json`: `action.read`, `action.supersede`; `data/states-and-severity.json`: relevant ingestion/deletion states |
| Dependencies / fences | Depends on `STORY-P1-003`–`006`; hash equality is not logical identity; access is short-lived and reauthorized; originals are immutable while retained but still subject to governed purge. |
| Migration / rollback / repair | Byte/key/version identities and acquisition hash never change during migration; derived metadata is rebuildable; integrity mismatch blocks access and starts incident/repair; restore proves digest, policy, deletion, and residency before service. |
| Negative, failure, audit | Mutation/substitution, wrong workspace/version/audience, guessed/expired/revoked grant, range/MIME abuse, cache/referrer leakage, restore/deletion resurrection; record receipt/hash/version/grant/redemption without filename/content/token. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-CON-P1-002`, `TEST-CON-P1-006`, `TEST-SEC-P1-006`, `TEST-SEC-P1-009`, `TEST-SEC-P1-014`, `TEST-E2E-P1-003`, `TEST-PERF-P1-003`, `TEST-PERF-P1-006`, `TEST-DR-P1-001`, `TEST-DR-P1-004`, `TEST-DR-P1-006`, `TEST-DR-P1-008`, `TEST-UNIT-P1-011`, `TEST-SEC-P1-016`, `TEST-SEC-P1-017`, `TEST-E2E-P1-021`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-007-01` — **Given** accepted bytes, **when** reprocessing, migration, export, backup, restore, or repeated retrieval occurs, **then** the acquisition digest and immutable bytes remain identical while derived generations and logical versions remain separate.
- `AC-STORY-P1-007-02` — **Given** wrong scope/version/audience, expiry, revocation, quarantine, deletion, integrity mismatch, or stale policy, **when** access is redeemed, **then** no bytes/existence leak and a privacy-safe audit outcome records the denial.

### `STORY-P1-008` — Enforce authentication, session, encryption, key, and secret controls

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Security + Platform |
| Product | `REQ-P1-TRUST-001`; `FEAT-P1-006`; `UC-P1-001`, `013`; `OUT-P1-001`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-001`; `UX-SCR-P1-001`, `030`, `031`; `A11Y-P1-001`–`035`, `043`–`050`, especially `047` |
| API / events | Authentication prerequisite for `API-P1-101`–`183`; `EVT-P1-003`, `005`, `029`; `API-P1-007`–`014`, `047`–`052` |
| Security | `AUTH-P1-001`–`005`, `020`–`027`, `032`, `035`; `SEC-P1-001`–`011`, `016`–`018`, `025`, `026`, `030`; `PRIV-P1-001`, `002`, `020`, `022`, `025`, `026`; `AUD-P1-001`–`009`, `024`, `027`, `030`; `THR-P1-001`–`003`, `007`, `009`, `019`, `020`, `028`, `029` |
| NFR / DIT / AI | `NFR-P1-001`–`008`, `016`, `022`–`029`, `032`–`043`; no DIT/AI identity authority; workloads follow `AI-CAP-P1-001`–`030` capability scope |
| Reference data | `data/access-control.json`: `policy.default-deny`, `policy-decision.DENY`; `data/common.json`: all `privacy.*`, `PUR-P1-001`–`008` |
| Dependencies / fences | Depends on approved identity/session design; `DEC-038` prohibits recovery/factor/ownership fallback; no standing support/break-glass content role; provider products remain unselected. |
| Migration / rollback / repair | Credential/session/key/secret versions rotate with overlap and revocation proof; deployment rollback cannot restore compromised material or older authorization; key failure degrades safely and recovery exercises respect deletion/residency. |
| Negative, failure, audit | Credential stuffing, phishing/session theft/fixation/replay, MFA downgrade, support impersonation, secret canaries, crypto downgrade, key denial/rotation, device/offline cache leakage; audit safe identity/session/key version outcomes only. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-001`, `TEST-SEC-P1-001`, `TEST-SEC-P1-008`, `TEST-SEC-P1-011`, `TEST-E2E-P1-001`, `TEST-E2E-P1-013`, `TEST-E2E-P1-017`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-PERF-P1-009`, `TEST-DR-P1-004`, `TEST-DR-P1-007`, `TEST-DR-P1-008`, `TEST-UNIT-P1-011`, `TEST-CON-P1-013`, `TEST-SEC-P1-016`, `TEST-SEC-P1-017`, `TEST-SEC-P1-018`, `TEST-E2E-P1-021`, `TEST-E2E-P1-022`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-008-01` — **Given** an authenticated actor, **when** session/privilege/security state changes, **then** sessions and downstream authorization are rotated/revoked within the owning control while secrets/keys/content never enter ordinary telemetry.
- `AC-STORY-P1-008-02` — **Given** lost factor, alleged ownership, family/support assertion, or unavailable identity dependency under the `DEC-038` no-recovery boundary, **when** access is attempted, **then** no weaker recovery/transfer route or workspace-existence disclosure is available.

### `STORY-P1-009` — Emit privacy-safe telemetry and immutable consequential audit

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; detailed UC-P1-019 contract`; Security/Privacy + Observability |
| Product | `REQ-P1-TRUST-003`, `REQ-P1-TRUST-004`; `FEAT-P1-006`; `UC-P1-013`, `UC-P1-019`; `OUT-P1-001`, `OUT-P1-007`; **`TRACE-GAP-P1-UC-001`** |
| UX / accessibility | Audit/status/error behavior across all `UX-FLOW-P1-*`; `UX-SCR-P1-030`; `A11Y-P1-003`, `004`, `021`–`025`, `051`–`056` |
| API / events | `API-P1-176`; all `EVT-P1-001`–`032` envelopes; `API-P1-021`–`023`, `033`, `037`, `047`–`050` |
| Security | `AUTH-P1-001`, `025`, `026`, `030`, `035`; `SEC-P1-017`, `018`, `025`, `029`, `030`; `PRIV-P1-001`, `020`–`022`, `026`, `029`; `AUD-P1-001`–`030`; `THR-P1-005`, `008`–`011`, `019`–`021`, `027`, `028` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `013`, `016`–`021`, `022`–`029`, `033`–`043`; all DIT/AI outputs use safe references; `AI-TOOL-P1-001`–`030`, `AI-GRD-P1-001`–`035`, `AI-EVAL-P1-001`–`035` |
| Reference data | `data/common.json`: all `privacy.*`, `PUR-P1-001`–`008`; `data/states-and-severity.json`: `severity.*`; no raw values from any other data pack may become telemetry labels. |
| Dependencies / fences | Applies to every story; telemetry, audit, events, provenance, analytics, and protected evidence stay distinct; `DEC-053` defines document Trash timing and `DEC-049` makes unknown/ineligible routes fail closed. |
| Migration / rollback / repair | Audit schemas remain decodable and append-only; correction supersedes; telemetry schema rollback cannot drop required audit; gaps create findings/reconciliation; restore verifies checkpoints and deletion/residency. |
| Negative, failure, audit | Content/token/filename/query/prompt/answer/provider-payload canaries, arbitrary serialization, cardinality attack, audit write outage, duplicate/reorder/tamper/gap, privileged audit search, cross-workspace audit view; required audit failure blocks/incompletes consequence. |
| Future TEST | `TEST-UNIT-P1-010`, `TEST-CON-P1-006`, `TEST-CON-P1-007`, `TEST-CON-P1-008`, `TEST-SEC-P1-007`, `TEST-SEC-P1-012`, `TEST-E2E-P1-019`, `TEST-E2E-P1-020`, `TEST-PERF-P1-009`, `TEST-DR-P1-003`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-009-01` — **Given** success, denial, partial failure, retry, or reconciliation in a critical workflow, **when** evidence is emitted, **then** immutable audit can reconstruct the outcome by safe IDs/versions while ordinary telemetry contains no prohibited content.
- `AC-STORY-P1-009-02` — **Given** required audit is unavailable or a checkpoint/content-canary violation occurs, **when** a consequential transition is attempted, **then** it blocks or remains explicitly incomplete and a privacy-safe control finding initiates repair.

### `STORY-P1-010` — Validate inert versioned reference configuration

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; launch activation BLOCKED by DEC-035`; Reference-data Governance + Platform |
| Product | `REQ-P1-CFG-001`, `REQ-P1-CFG-005`; `FEAT-P1-007`; `UC-P1-001`, `018`; `OUT-P1-001`, `OUT-P1-007` |
| UX / accessibility | No Phase 1 configuration console; absence follows `UX-IA-P1-006`, `UX-SCR-P1-030`; any safe validation problem follows `A11Y-P1-021`–`028`, `043`–`050` |
| API / events | No public household configuration operation; `EVT-P1-031`; API schema/version rules `API-P1-001`–`006`, `009`, `020`, `046`–`052` |
| Security | `AUTH-P1-003`, `020`, `028`, `035`; `SEC-P1-001`, `006`, `007`, `017`, `018`, `025`, `030`; `PRIV-P1-001`, `020`–`022`, `030`; `AUD-P1-001`–`008`, `022`, `024`, `027`; `THR-P1-007`, `009`, `019`–`021`, `028` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `018`, `020`, `026`–`028`, `033`, `036`–`043`; all `DIT-*-P1-*` and `AI-*-P1-*` consumers use exact configuration versions, but no package is activated here |
| Reference data | All schemas and `data/*.json`; especially `meta.reference-data-draft`, `launch-profile.synthetic.au.phase1`, `source.synthetic.au.reference-series`, `channel.EMAIL`, `channel.PUSH`; every seed remains DRAFT/disabled as declared. |
| Dependencies / fences | Validator checks schema, unique/dangling/typed IDs, safe endpoints, cross-pack references, decision fences, and inert Phase 2 types; publication/activation is `STORY-P1-037`; `DEC-035` prohibits launch coverage inference. Detailed `UC-P1-018` ACs govern the product boundary. |
| Migration / rollback / repair | Package/schema versions are immutable; canonical expansion precedes consumer support; invalid migration never activates; repair publishes a new version; no direct database/code hotfix or reinterpretation of an old package. |
| Negative, failure, audit | Reject dangling/duplicate/unknown typed IDs, unsafe endpoint, enabled DRAFT seed, invented duration/score/channel/processor, clinical ordinary path, incompatible consumer, household ID in global scope; audit validation/publication attempts safely. |
| Future TEST | `TEST-UNIT-P1-001`, `TEST-UNIT-P1-010`, `TEST-CON-P1-009`, `TEST-SEC-P1-011`, `TEST-SEC-P1-012`, `TEST-E2E-P1-018`, `TEST-PERF-P1-007`, `TEST-PERF-P1-009`, `TEST-DR-P1-002`, `TEST-DR-P1-008`; DRAFT cases require execution evidence. |

- `AC-STORY-P1-010-01` — **Given** the repository reference packs, **when** validation runs, **then** every stable ID/reference/type/state/fence is consistent and every DRAFT/disabled/synthetic seed remains inert.
- `AC-STORY-P1-010-02` — **Given** a dangling ID, unsafe endpoint, invented timing/score/channel/route, clinical leak, or incompatible schema, **when** validation/publication is attempted, **then** activation is blocked with safe, versioned evidence and no household processing.

## 3. `P1-S2` — Understand and retrieve

### `STORY-P1-011` — Manage document lifecycle, supersession, and material comparison state

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Platform + Product |
| Product | `REQ-P1-DOC-003`, `REQ-P1-DOC-005`; `FEAT-P1-008`; `UC-P1-003`, `012`; `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-006` |
| UX / accessibility | `UX-FLOW-P1-006`, `016`, `019`–`021`; `UX-SCR-P1-008`, `014`, `016`, `029`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `040`, `042`–`056` |
| API / events | `API-P1-122`–`126`; `EVT-P1-010`, `011`; `API-P1-007`–`020`, `027`–`038`, `047`–`052` |
| Security | `AUTH-P1-001`–`007`, `012`, `019`–`025`, `034`, `035`; `SEC-P1-012`, `015`–`019`, `027`, `029`; `PRIV-P1-011`–`017`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `027`; `THR-P1-006`, `008`, `009`, `011`, `014`, `019`, `023` |
| NFR / DIT / AI | `NFR-P1-001`–`010`, `013`, `016`–`018`, `022`–`031`, `033`, `035`, `036`, `041`–`043`; `DIT-VER-P1-001`–`042`, `DIT-EXT-P1-001`–`008`; comparison AI remains proposal-only under `AI-CAP-P1-001`–`030` |
| Reference data | `data/states-and-severity.json`: `machine.comparison`, all `state.comparison.*`; `data/access-control.json`: `action.compare`, `action.supersede`, `action.trash`, `action.restore`, `action.purge` |
| Dependencies / fences | Depends on `STORY-P1-007`; version, supersession, lifecycle, comparison, archive/trash/restore/purge are separate; `DEC-039` leaves purge timing unset. |
| Migration / rollback / repair | Preserve version DAG, lifecycle history, comparison generations, and immutable evidence; invalid transition or interrupted comparison is repairable; rollback cannot resurrect a purged/fenced resource or rewrite supersession. |
| Negative, failure, audit | Deny adjacent-action privilege, stale ETag, cross-workspace/version, revoked grant, invalid state, restricted comparison side; partial/unsupported comparison is explicit; audit versions, transitions, coverage, and safe failure without content. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-UNIT-P1-010`, `TEST-CON-P1-002`, `TEST-CON-P1-007`, `TEST-AI-P1-008`, `TEST-SEC-P1-006`, `TEST-SEC-P1-014`, `TEST-E2E-P1-003`, `TEST-E2E-P1-012`, `TEST-PERF-P1-003`, `TEST-PERF-P1-006`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-011-01` — **Given** two authorized immutable versions, **when** a material comparison is requested, **then** base/target, supported/uncertain/restricted coverage, evidence, and generation are explicit without rewriting either version.
- `AC-STORY-P1-011-02` — **Given** stale revision, wrong action authority, deletion fence, or incomplete comparison, **when** lifecycle/supersession is attempted, **then** history remains intact and the result is a safe denial or repairable non-success rather than false change/no-change.

### `STORY-P1-012` — Preserve extraction evidence anchors and provenance

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Intelligence |
| Product | `REQ-P1-ING-005`; `FEAT-P1-009`; `UC-P1-003`, `004`; `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-005`, `006`, `020`; `UX-SCR-P1-011`, `013`, `015`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`039`, `042`–`056` |
| API / events | `API-P1-129`, `130`; `EVT-P1-008`; `API-P1-015`–`020`, `033`–`038`, `041`, `042`, `047`–`050` |
| Security | `AUTH-P1-001`–`010`, `012`, `019`–`025`, `035`; `SEC-P1-012`, `015`–`021`, `029`; `PRIV-P1-001`, `004`, `008`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `014`, `027`; `THR-P1-006`, `008`, `014`–`016`, `019`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-004`, `005`, `010`, `012`, `013`, `016`–`018`, `022`–`030`, `033`, `036`, `041`–`045`; `DIT-EXT-P1-001`–`035`, `DIT-ING-P1-019`–`035`; `AI-OUT-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/extraction-schemas.json`: all `anchor-type.*`, `support-role.*`, `evidence-field.*`; `data/states-and-severity.json`: `machine.presence`, `machine.extraction-review` |
| Dependencies / fences | Depends on `STORY-P1-006`, `007`; anchors bind exact artifact/version/page/span/coordinates/schema/processor/generation; unresolvable evidence cannot support a claim. |
| Migration / rollback / repair | Anchor schema expansion preserves old geometry/text-span semantics and decoders; re-anchor is a new linked result with reason; corrupted projection rebuilds from retained evidence and deletion watermark. |
| Negative, failure, audit | Deny restricted adjacent region, wrong version/workspace, expired grant, stale anchor, provider payload/schema injection; degraded/unreadable evidence remains explicit; audit safe references/versions/confidence/review without passages. |
| Future TEST | `TEST-UNIT-P1-005`, `TEST-CON-P1-002`, `TEST-CON-P1-010`, `TEST-AI-P1-003`, `TEST-SEC-P1-002`, `TEST-SEC-P1-003`, `TEST-SEC-P1-006`, `TEST-E2E-P1-003`, `TEST-E2E-P1-005`, `TEST-PERF-P1-003`, `TEST-DR-P1-005`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-012-01` — **Given** a promoted extracted field or citation, **when** its evidence is redeemed, **then** it resolves to the exact authorized source version and anchor with processor/schema/generation provenance.
- `AC-STORY-P1-012-02` — **Given** missing, stale, unreadable, deleted, or restricted evidence, **when** a consumer requests support, **then** the exact limitation is returned and no fabricated or adjacent protected passage substitutes for it.

### `STORY-P1-013` — Classify against an enabled versioned taxonomy and schema

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; launch types/schemas BLOCKED by DEC-035`; Document Intelligence |
| Product | `REQ-P1-ING-006`; `FEAT-P1-009`; `UC-P1-002`, `003`; `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-005`, `020`; `UX-SCR-P1-013`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `042`–`056` |
| API / events | No direct classification operation in `API-OPENAPI-001`; adjacent job/document operations `API-P1-118`, `122`, `123`, `142`; `EVT-P1-008`; **`TRACE-GAP-P1-API-001`** |
| Security | `AUTH-P1-001`–`007`, `020`–`025`, `029`, `035`; `SEC-P1-017`, `019`–`021`, `028`, `029`; `PRIV-P1-001`, `004`, `008`, `010`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `011`, `014`, `027`, `029`; `THR-P1-006`, `013`, `015`, `016`, `019`, `024`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `012`–`015`, `018`, `022`–`030`, `033`, `036`, `039`, `041`–`045`; `DIT-TAX-P1-001`–`025`, `DIT-EXT-P1-001`–`035`; `AI-CAP-P1-001`–`030`, `AI-OUT-P1-001`–`030`, `AI-EVAL-P1-001`–`035` |
| Reference data | `data/document-types.json`: `launch-profile.synthetic.au.phase1`, `doctype.coverage.generic-policy`, `doctype.health.clinical-record`; `data/extraction-schemas.json`: `extraction-schema.generic-policy`; `data/jurisdictions.json`: `jurisdiction.AU` |
| Dependencies / fences | Depends on `STORY-P1-010`, `012`; only compatible, approved/effective types/schemas can be enabled; `DEC-035` keeps public launch pack unset; clinical type never authorizes ordinary processing. |
| Migration / rollback / repair | Taxonomy/schema version is immutable; compatibility validation precedes activation; reclassification creates a new analysis generation; rollback selects a prior approved package but preserves prior decisions/results. |
| Negative, failure, audit | Unknown/ambiguous/unsupported type, schema mismatch, prompt injection, low confidence, old consumer, clinical misclassification, ineligible processor route; route review/degraded state rather than forcing a type; audit versions/decision safely. |
| Future TEST | `TEST-UNIT-P1-001`, `TEST-UNIT-P1-005`, `TEST-CON-P1-010`, `TEST-CON-P1-011`, `TEST-AI-P1-001`, `TEST-AI-P1-002`, `TEST-AI-P1-004`, `TEST-AI-P1-015`, `TEST-SEC-P1-004`, `TEST-SEC-P1-009`, `TEST-SEC-P1-010`, `TEST-SEC-P1-015`, `TEST-E2E-P1-002`, `TEST-PERF-P1-004`, `TEST-PERF-P1-005`, `TEST-PERF-P1-010`, `TEST-DR-P1-005`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-013-01` — **Given** an approved enabled type/schema version and supported synthetic document, **when** classification completes, **then** the proposal records exact taxonomy/schema/evidence/model/rule versions and never becomes accepted fact by itself.
- `AC-STORY-P1-013-02` — **Given** the public launch pack is not approved or the input is unknown, clinical, incompatible, or insufficient, **when** classification runs, **then** no launch coverage or forced type is claimed and the case remains blocked/review/degraded with evidence.

### `STORY-P1-014` — Review and correct extraction without collapsing domain states

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Intelligence + UX |
| Product | `REQ-P1-ING-007`; `FEAT-P1-009`; `UC-P1-003`, `004`; `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-005`, `020`, `021`; `UX-SCR-P1-013`, `015`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`039`, `042`–`056` |
| API / events | No extraction-review/correction operation in `API-OPENAPI-001`; adjacent `API-P1-118`, `129`, `130`, `133`; `EVT-P1-008`; **`TRACE-GAP-P1-API-002`** |
| Security | `AUTH-P1-001`–`007`, `012`–`014`, `021`, `025`, `035`; `SEC-P1-006`, `017`–`021`, `024`; `PRIV-P1-001`, `004`, `008`, `019`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `012`, `014`, `027`; `THR-P1-005`–`010`, `015`, `016`, `019`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`005`, `008`, `013`, `016`, `022`–`029`, `033`, `034`, `036`, `041`–`045`; `DIT-EXT-P1-001`–`035`, `DIT-FCT-P1-001`–`017`; `AI-OUT-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/states-and-severity.json`: all `machine.extraction-review`, `machine.presence`; `data/extraction-schemas.json`: exact `evidence-field.*`, `support-role.*` |
| Dependencies / fences | Depends on `STORY-P1-012`, `013`; extraction review, document review, fact resolution, requirement fulfilment, approval, effect, verification, and closure stay separate. |
| Migration / rollback / repair | Corrections create new reviewed values/anchors linked to original proposal; old schema/review states remain decodable; interrupted save uses revision/idempotency; rollback cannot erase reviewer action or promote an earlier proposal. |
| Negative, failure, audit | Deny reviewer without field/evidence/action authority, stale revision, protected value echo, correction without anchor/reason; model cannot self-accept; audit proposal/correction/reviewer/policy/evidence refs without raw values. |
| Future TEST | `TEST-UNIT-P1-005`, `TEST-UNIT-P1-006`, `TEST-CON-P1-010`, `TEST-CON-P1-011`, `TEST-AI-P1-002`, `TEST-AI-P1-003`, `TEST-AI-P1-005`, `TEST-AI-P1-006`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-SEC-P1-007`, `TEST-E2E-P1-002`, `TEST-E2E-P1-004`, `TEST-PERF-P1-004`, `TEST-DR-P1-005`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-014-01` — **Given** a review-required extraction, **when** an authorized reviewer accepts, corrects, or rejects it, **then** the exact decision and evidence lineage are appended while fact/fulfilment/action states remain unchanged.
- `AC-STORY-P1-014-02` — **Given** stale inputs, insufficient authority, restricted evidence, or schema-invalid correction, **when** review is submitted, **then** no overwrite/promotion occurs and the accessible error preserves authorized work and explains recovery.

### `STORY-P1-015` — Reprocess derived analysis with immutable generation lineage

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Intelligence + Platform |
| Product | `REQ-P1-ING-008`; `FEAT-P1-009`; `UC-P1-002`, `003`, `012`; `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-005`, `020`; `UX-SCR-P1-011`, `013`, `033`–`036`; `A11Y-P1-001`–`035`, `038`, `039`, `042`–`056` |
| API / events | Adjacent retry `API-P1-120` does not define analysis reprocessing; status `API-P1-118`, `142`; `EVT-P1-008`; **`TRACE-GAP-P1-API-003`** |
| Security | `AUTH-P1-001`–`007`, `020`–`025`, `029`, `034`, `035`; `SEC-P1-012`, `017`–`021`, `027`–`029`; `PRIV-P1-001`, `004`, `008`, `011`, `015`–`017`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `012`, `014`, `027`; `THR-P1-006`–`009`, `011`, `015`, `016`, `019`, `023`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `012`–`018`, `026`–`030`, `033`, `035`, `036`, `039`, `041`–`045`; `DIT-ING-P1-011`–`035`, `DIT-EXT-P1-001`–`035`, `DIT-VER-P1-001`–`042`; all `AI-CAP/OUT/GRD/EVAL-P1-*` relevant to the capability |
| Reference data | Exact immutable package/type/schema/capability IDs from `data/document-types.json`, `data/extraction-schemas.json`, `data/ai-capabilities.json`; analysis states in `data/states-and-severity.json` |
| Dependencies / fences | Depends on `STORY-P1-006`, `012`–`014`; current original/version/policy/deletion/route remain authoritative; reprocessing never overwrites prior analysis or silently changes active selection. |
| Migration / rollback / repair | New generation builds beside old, validates coverage/integrity/authorization/deletion watermarks, then explicit cutover; failure leaves old truthful generation; repair/replay is new generation; old outputs remain historical until governed deletion. |
| Negative, failure, audit | Duplicate/reordered reprocess, revoked policy, deleted input, provider/schema incompatibility, partial index update, cost exhaustion, cutover crash; no old-result mutation or stale-current claim; audit generation/input/versions/selection. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-UNIT-P1-005`, `TEST-UNIT-P1-010`, `TEST-CON-P1-010`, `TEST-CON-P1-011`, `TEST-AI-P1-005`, `TEST-AI-P1-015`, `TEST-SEC-P1-014`, `TEST-SEC-P1-015`, `TEST-E2E-P1-002`, `TEST-E2E-P1-003`, `TEST-PERF-P1-004`, `TEST-PERF-P1-005`, `TEST-PERF-P1-007`, `TEST-DR-P1-002`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-015-01` — **Given** a retained original and changed processor/schema/configuration, **when** reprocessing succeeds, **then** a new immutable analysis generation is selected only after validation while the prior generation remains reconstructable.
- `AC-STORY-P1-015-02` — **Given** failure, cancellation, deletion, revocation, incompatible output, or interrupted cutover, **when** reprocessing stops, **then** no partial generation appears current and repair can resume without duplicate or lost lineage.

### `STORY-P1-016` — Store immutable fact occurrences and bitemporal resolutions

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Domain/Data + Document Intelligence |
| Product | `REQ-P1-FCT-001`, `REQ-P1-FCT-002`; `FEAT-P1-010`; `UC-P1-003`, `004`; `OUT-P1-002`, `OUT-P1-003` |
| UX / accessibility | `UX-FLOW-P1-007`, `021`; `UX-SCR-P1-017`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `038`, `039`, `042`–`056` |
| API / events | `API-P1-133`–`135`; `EVT-P1-012`, `013`; `API-P1-015`–`020`, `027`–`038`, `047`–`050` |
| Security | `AUTH-P1-001`–`007`, `012`, `021`–`025`, `034`, `035`; `SEC-P1-006`, `012`, `017`–`019`; `PRIV-P1-001`, `004`, `011`, `016`, `017`, `019`, `020`, `022`; `AUD-P1-001`–`008`, `012`, `027`; `THR-P1-005`, `006`, `008`, `009`, `019`, `023`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`005`, `007`, `008`, `013`, `016`–`018`, `026`–`030`, `033`, `036`, `041`–`043`; `DIT-FCT-P1-001`–`017`, `DIT-EXT-P1-001`–`035`; AI/OCR outputs remain occurrences under `AI-OUT-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | No fact-definition catalogue exists: **`TRACE-GAP-P1-REF-001`**. Supporting exact presence/evidence/privacy identities come from `data/states-and-severity.json`, `data/extraction-schemas.json`, and `data/common.json` but MUST NOT be treated as fact definitions. |
| Dependencies / fences | Depends on `STORY-P1-012`, `014`; `ADR-ARCH-001` remains PROPOSED; valid/effective and recorded/known time remain separate; occurrence, resolution, segment, document, and entity identities never collapse. |
| Migration / rollback / repair | Additive bitemporal records with half-open intervals/uncertainty; backdated correction creates new known-time evidence; projection rebuild keeps resolution set/generation; rollback cannot rewrite historical belief. |
| Negative, failure, audit | Deny value/occurrence/evidence without independent permission, stale occurrence-set digest, overlap/cardinality violation, unsupported promotion, deletion resurrection; preserve conflicts/restriction/uncertainty; audit safe temporal/provenance refs. |
| Future TEST | `TEST-UNIT-P1-006`, `TEST-CON-P1-003`, `TEST-CON-P1-007`, `TEST-CON-P1-009`, `TEST-AI-P1-006`, `TEST-SEC-P1-002`, `TEST-SEC-P1-007`, `TEST-SEC-P1-014`, `TEST-E2E-P1-004`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-001`, `TEST-DR-P1-002`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-016-01` — **Given** an occurrence later corrected retroactively, **when** current and prior `valid_at`/`known_at` queries run, **then** both effective truth and what the platform knew at each time are reconstructable without mutation.
- `AC-STORY-P1-016-02` — **Given** stale resolution inputs, restricted evidence, invalid temporal overlap, or deleted scope, **when** resolution is attempted, **then** no canonical segment changes and the exact conflict/restriction/failure remains evidenced.

### `STORY-P1-017` — Resolve stable subjects and resource entities with additive lineage

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Domain/Data + Document Intelligence |
| Product | `REQ-P1-FCT-003`, `REQ-P1-FCT-004`; `FEAT-P1-010`; `UC-P1-004`; `OUT-P1-002`, `OUT-P1-003` |
| UX / accessibility | `UX-FLOW-P1-007`, `021`; `UX-SCR-P1-017`, `033`–`036`; `A11Y-P1-001`–`035`, `042`–`056` |
| API / events | No `ResourceEntity` create/link/merge/split API in `API-OPENAPI-001`; adjacent fact operations `API-P1-133`–`135`; `EVT-P1-012`, `013`; **`TRACE-GAP-P1-API-004`** |
| Security | `AUTH-P1-001`–`007`, `010`, `012`, `021`–`025`, `035`; `SEC-P1-001`, `002`, `006`, `017`–`019`; `PRIV-P1-001`, `003`, `004`, `017`, `019`, `020`, `022`, `023`; `AUD-P1-001`–`008`, `010`, `012`, `027`; `THR-P1-003`–`008`, `019`, `023`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`005`, `007`, `008`, `013`, `016`–`018`, `026`–`030`, `033`, `036`, `041`–`045`; `DIT-FCT-P1-018`–`035`; `AI-CAP-P1-001`–`030`, `AI-OUT-P1-001`–`030`, `AI-EVAL-P1-001`–`035` |
| Reference data | No fact-definition catalogue exists: **`TRACE-GAP-P1-REF-001`**. `data/dependencies.json`: `node-type.ResourceEntity`; namespaced evidence/value types and privacy/purpose records remain supporting contracts, not canonical fact definitions. |
| Dependencies / fences | Depends on `STORY-P1-002`, `016`; display names, external IDs, content hashes, and similarity are evidence, never identity or cross-workspace match authority. |
| Migration / rollback / repair | Merge/split/rename/reject are revisioned additive decisions with survivor/alias/reattribution lineage; impact-assess facts/edges/grants/exports/deletion; repair reverses through a new decision, not repointing history. |
| Negative, failure, audit | Cross-workspace matching oracle, same-name/hash conflation, stale proposal, unauthorized merge, restricted candidate, ambiguous split; model cannot self-merge; audit decision/evidence/affected IDs without sensitive identifiers. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-UNIT-P1-006`, `TEST-CON-P1-003`, `TEST-CON-P1-007`, `TEST-AI-P1-006`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-E2E-P1-004`, `TEST-E2E-P1-013`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-002`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-017-01` — **Given** two evidence-backed entity candidates, **when** an authorized merge or rejection is recorded, **then** stable identities, source history, affected dependencies, and prior known-time views remain reconstructable.
- `AC-STORY-P1-017-02` — **Given** same display name/hash/external ID, model similarity, restricted evidence, or foreign workspace, **when** resolution is proposed, **then** no identity or authority is inferred and no candidate existence leaks.

### `STORY-P1-018` — Preserve and explicitly resolve fact conflicts

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Intelligence + UX |
| Product | `REQ-P1-FCT-005`; `FEAT-P1-010`; `UC-P1-004`; `OUT-P1-002`, `OUT-P1-003` |
| UX / accessibility | `UX-FLOW-P1-007`, `021`; `UX-SCR-P1-017`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `038`, `039`, `042`–`056` |
| API / events | `API-P1-136`–`138`; `EVT-P1-013`; `API-P1-007`–`020`, `027`–`038`, `047`–`050` |
| Security | `AUTH-P1-001`–`007`, `012`, `021`–`025`, `035`; `SEC-P1-006`, `017`–`019`; `PRIV-P1-001`, `004`, `017`, `019`, `020`, `022`; `AUD-P1-001`–`008`, `012`, `027`; `THR-P1-005`, `006`, `008`, `009`, `019`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`005`, `007`, `008`, `013`, `016`–`018`, `022`–`030`, `033`, `036`, `041`–`043`; `DIT-FCT-P1-008`–`017`, `025`–`035`; AI explanation cannot choose truth under `AI-GRD-P1-001`–`035` |
| Reference data | No fact-definition catalogue exists: **`TRACE-GAP-P1-REF-001`**. Supporting conflict/presence states, evidence definitions, and `action.resolve` cannot supply missing definition semantics. |
| Dependencies / fences | Depends on `STORY-P1-016`; unresolved, resolved-with-preserved-conflict, disputed, tolerated, restricted, insufficient, and unavailable remain distinct; conflict is not auto-cleared by confidence/repetition. |
| Migration / rollback / repair | Conflict/resolution history is append-only; new evidence invalidates stale resolution binding; policy changes re-evaluate through a new resolution; projections rebuild from complete occurrence/resolution sets. |
| Negative, failure, audit | Deny conflict existence/value/evidence/action independently; stale ETag/occurrence digest; restricted occurrence cannot be exposed by counts or rationale; failure leaves prior truthful state; audit safe evidence/decision/rationale refs. |
| Future TEST | `TEST-UNIT-P1-006`, `TEST-CON-P1-003`, `TEST-CON-P1-007`, `TEST-AI-P1-006`, `TEST-AI-P1-011`, `TEST-SEC-P1-002`, `TEST-SEC-P1-003`, `TEST-SEC-P1-007`, `TEST-E2E-P1-004`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-002`, `TEST-DR-P1-005`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-018-01` — **Given** contradictory eligible occurrences, **when** an authorized resolution is recorded, **then** the selected/tolerated/insufficient outcome and rationale are append-only while every competing occurrence remains inspectable when authorized.
- `AC-STORY-P1-018-02` — **Given** new material or restricted evidence after review, **when** current conflict state is queried or changed, **then** stale resolution is invalidated/rerouted without revealing restricted content or silently removing uncertainty.

### `STORY-P1-019` — Enforce field-level privacy across evidence and derivatives

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Security/Privacy + Document Intelligence |
| Product | `REQ-P1-FCT-006`; `FEAT-P1-011`; `UC-P1-004`, `005`, `008`, `013`; `OUT-P1-002`, `OUT-P1-005`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-007`, `008`, `010`, `012`, `019`–`021`; `UX-SCR-P1-015`, `017`–`021`, `024`, `033`–`045`; `A11Y-P1-001`–`056`, especially `003`, `004`, `038`–`042` |
| API / events | `API-P1-133`–`138` plus every downstream read/result; `EVT-P1-012`, `013`; cross-cutting `API-P1-007`–`014`, `024`–`026`, `037`–`052` |
| Security | `AUTH-P1-001`–`011`, `019`–`025`, `030`, `035`; `SEC-P1-001`, `002`, `006`, `015`, `017`–`021`, `027`; `PRIV-P1-001`–`004`, `017`–`022`; `AUD-P1-001`–`008`, `012`–`016`, `019`, `020`, `025`–`027`; `THR-P1-003`–`006`, `014`–`016`, `019`, `022`, `030` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `009`–`011`, `013`, `016`–`025`, `028`, `033`, `036`, `041`–`045`; `DIT-FCT-P1-025`–`035`, `DIT-GPH-P1-023`–`032`; `AI-RAG-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/common.json`: `privacy.P2-HOUSEHOLD`–`privacy.P5-EXCLUDED`, `PUR-P1-001`–`008`; `data/access-control.json`: `policy-decision.REDACT`, `policy-decision.MINIMAL_DISCLOSURE`, `policy.minimum-disclosure`; missing fact definitions remain **`TRACE-GAP-P1-REF-001`**. |
| Dependencies / fences | Depends on `STORY-P1-003`, `012`, `016`; container access never implies field/evidence/existence access; minimal disclosure is named policy, not ad-hoc masking. |
| Migration / rollback / repair | Sensitivity/policy changes increment epoch and rebuild affected indexes/graphs/caches/conversations with authorization/deletion watermarks; rollback cannot re-expose fields; uncertain consumers fail closed. |
| Negative, failure, audit | Differential counts/facets/timing/errors, snippets/citations, graph bridges, conversation memory, notifications, export/audit, accessibility tree/DOM/cache; revoke mid-job/result; audit decision references without protected value/existence. |
| Future TEST | `TEST-UNIT-P1-005`, `TEST-UNIT-P1-006`, `TEST-CON-P1-003`, `TEST-CON-P1-007`, `TEST-CON-P1-010`, `TEST-AI-P1-009`, `TEST-AI-P1-011`, `TEST-SEC-P1-002`–`TEST-SEC-P1-004`, `TEST-E2E-P1-004`, `TEST-E2E-P1-005`, `TEST-E2E-P1-008`, `TEST-E2E-P1-013`, `TEST-PERF-P1-003`, `TEST-PERF-P1-006`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-019-01` — **Given** access to a document/container but not a sensitive field/evidence anchor, **when** every direct and derived surface is exercised, **then** neither value nor protected existence can be inferred.
- `AC-STORY-P1-019-02` — **Given** field authority is revoked during retrieval, model work, notification, export, or cached conversation, **when** output is attempted, **then** current authorization removes/blocks it and propagation evidence satisfies the owning NFR.

### `STORY-P1-020` — Store typed dependency edges and bounded authorized traversal

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Domain/Data + Document Intelligence |
| Product | `REQ-P1-GPH-001`, `REQ-P1-GPH-002`; `FEAT-P1-012`; `UC-P1-004`, `005`, `013`; `OUT-P1-002`, `OUT-P1-003` |
| UX / accessibility | `UX-FLOW-P1-010`, `022`; `UX-SCR-P1-005`, `021`, `033`–`045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | No dependency-edge CRUD/traversal operation in `API-OPENAPI-001`; graph is consumed by search/impact operations; `EVT-P1-014`; **`TRACE-GAP-P1-API-005`** |
| Security | `AUTH-P1-001`–`012`, `019`–`025`, `034`, `035`; `SEC-P1-001`, `002`, `006`, `017`–`019`, `029`; `PRIV-P1-001`, `004`, `011`, `017`, `020`, `022`; `AUD-P1-001`–`008`, `013`, `027`; `THR-P1-003`–`009`, `011`, `019`, `023`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-004`, `005`, `009`, `013`–`018`, `022`–`030`, `033`, `036`, `041`–`045`; `DIT-GPH-P1-001`–`032`, `DIT-FCT-P1-018`–`035`; `AI-CAP-P1-001`–`030`, `AI-OUT-P1-001`–`030`, `AI-EVAL-P1-001`–`035` |
| Reference data | `data/dependencies.json`: all `node-type.*`, `edge-type.*`; `data/access-control.json`: field/edge-relevant deny/minimal-disclosure policies |
| Dependencies / fences | Depends on `STORY-P1-016`, `017`, `019`; edge endpoints/type/direction/cardinality/validity/evidence/review are exact; cycles/depth/truncation/coverage are explicit; model proposals need validation/review. |
| Migration / rollback / repair | Edge type/schema changes preserve old versions and path history; rebuild generation validates endpoint scope, deletion/auth watermark, cycles, counts, and coverage before cutover; repair never invents missing edges. |
| Negative, failure, audit | Wrong workspace/node/type/direction/cardinality, hidden bridge/path-length/count/layout inference, cycle/fan-out/depth/timeout, stale edge, deleted node, poisoned proposal; audit safe edge/path/truncation refs, not hidden topology. |
| Future TEST | `TEST-UNIT-P1-007`, `TEST-CON-P1-007`, `TEST-CON-P1-009`, `TEST-CON-P1-011`, `TEST-AI-P1-007`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-SEC-P1-015`, `TEST-E2E-P1-004`, `TEST-E2E-P1-006`, `TEST-E2E-P1-013`, `TEST-PERF-P1-003`, `TEST-PERF-P1-008`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-020-01` — **Given** authorized typed endpoints and evidence, **when** an edge is accepted and traversed, **then** direction/type/validity/provenance/revision and bounded path coverage are preserved.
- `AC-STORY-P1-020-02` — **Given** a restricted bridge, cycle, stale/deleted endpoint, excessive fan-out, or incomplete projection, **when** traversal occurs, **then** no hidden topology leaks and the result states truncation/restriction/staleness instead of complete coverage.

### `STORY-P1-021` — Search authorized metadata, text, and derived evidence

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Search + Security |
| Product | `REQ-P1-SRCH-001`, `REQ-P1-SRCH-003`; `FEAT-P1-013`; `UC-P1-005`, `013`; `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-008`, `023`; `UX-SCR-P1-018`, `033`–`045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `038`, `039`, `042`–`056` |
| API / events | `API-P1-139`; no result event required; `EVT-P1-032` is projection activation only; `API-P1-007`–`026`, `037`–`040`, `047`–`052` |
| Security | `AUTH-P1-001`–`010`, `019`–`025`, `034`, `035`; `SEC-P1-001`, `002`, `006`, `017`–`021`, `029`; `PRIV-P1-001`, `004`, `008`, `011`, `020`–`022`; `AUD-P1-001`–`008`, `014`, `027`; `THR-P1-003`–`007`, `014`–`016`, `019`, `023`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-001`, `002`, `005`, `009`, `013`–`018`, `022`–`030`, `033`, `036`, `039`, `041`–`045`; `DIT-EXT-P1-001`–`035`, `DIT-FCT-P1-025`–`035`, `DIT-GPH-P1-023`–`032`; `AI-RAG-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | Searchable type/field/privacy definitions from `data/document-types.json`, `data/extraction-schemas.json`, `data/common.json`; result states from `data/states-and-severity.json`: `machine.rag-result` |
| Dependencies / fences | Depends on `STORY-P1-003`, `012`, `016`, `019`, `020`; index ACLs are hints; current policy/deletion/quarantine/residency are rechecked; counts/facets/snippets require explicit disclosure policy. |
| Migration / rollback / repair | Build a new search generation with source/policy/deletion watermarks, compare/validate, then cut over; stale/partial canonical fallback is labelled; rollback cannot restore revoked/deleted entries or conversation cache. |
| Negative, failure, audit | Cross-workspace IDs, hidden counts/facets/snippets/timing, stale ACL/cache/cursor, revoke/delete mid-query, injection, index outage/lag, quota; safe empty/error indistinguishability; audit query class/capability/evidence refs, not query text. |
| Future TEST | `TEST-CON-P1-003`, `TEST-AI-P1-009`, `TEST-AI-P1-011`, `TEST-AI-P1-012`, `TEST-SEC-P1-001`–`TEST-SEC-P1-004`, `TEST-SEC-P1-015`, `TEST-E2E-P1-005`, `TEST-E2E-P1-013`, `TEST-PERF-P1-003`, `TEST-PERF-P1-006`, `TEST-PERF-P1-008`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-021-01` — **Given** a mixed authorized/restricted corpus, **when** metadata/full-text/derived search runs, **then** only currently authorized results/snippets/facets/counts are returned with explicit freshness and coverage.
- `AC-STORY-P1-021-02` — **Given** revocation, deletion, stale projection, malformed query, quota, or dependency failure, **when** search completes, **then** it fails closed or returns a truthful partial/stale/unavailable state without existence or query leakage.

### `STORY-P1-022` — Produce a cited answer or explicit evidence limitation

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; AI/Search + Product |
| Product | `REQ-P1-SRCH-002`, `REQ-P1-SRCH-004`; `FEAT-P1-013`; `UC-P1-005`; `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-008`, `023`; `UX-SCR-P1-018`, `019`, `033`–`045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`039`, `042`–`056` |
| API / events | `API-P1-140`–`143`; no answer-content event; `API-P1-007`–`023`, `027`–`040`, `047`–`052` |
| Security | `AUTH-P1-001`–`011`, `019`–`025`, `029`, `034`, `035`; `SEC-P1-017`–`021`, `028`, `029`; `PRIV-P1-001`, `004`, `008`, `020`–`022`, `027`, `028`; `AUD-P1-001`–`008`, `014`, `027`, `029`; `THR-P1-005`–`007`, `014`–`016`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-002`, `004`–`006`, `011`, `013`–`018`, `021`–`030`, `033`, `036`, `039`, `041`–`045`; `DIT-EXT-P1-001`–`035`, `DIT-FCT-P1-025`–`035`; `AI-RAG-P1-001`–`030`, `AI-OUT-P1-001`–`030`, `AI-GRD-P1-001`–`035`, `AI-EVAL-P1-001`–`035` |
| Reference data | `data/ai-capabilities.json`: `ai.cited_answer`, `tool-class.READ_EVIDENCE`, `tool-class.READ_DERIVED`; `data/states-and-severity.json`: all `state.rag.*`, `state.ai-output.*`, `state.guardrail.*` |
| Dependencies / fences | Depends on `STORY-P1-012`, `019`, `021`, `024`, `025`; every material claim maps to redeemable authorized evidence; insufficient/conflicting/stale/restricted/unavailable are first-class outcomes; no professional-advice claim. |
| Migration / rollback / repair | Answer job/result is immutable by capability/prompt/model/schema/retrieval generation; retry creates linked attempt; capability rollback leaves old answer evidence but disables reuse where unsafe; conversation cache reauthorizes each turn. |
| Negative, failure, audit | Direct/indirect injection, fabricated/misattributed citation, restricted inference, stale source, revoke/delete during generation/redemption, provider timeout/malformed output, budget exhaustion; audit versions/citation refs/limitations, not prompt/query/answer. |
| Future TEST | `TEST-CON-P1-003`, `TEST-CON-P1-011`, `TEST-AI-P1-009`–`TEST-AI-P1-012`, `TEST-AI-P1-015`, `TEST-SEC-P1-003`, `TEST-SEC-P1-004`, `TEST-SEC-P1-010`, `TEST-SEC-P1-015`, `TEST-E2E-P1-005`, `TEST-PERF-P1-003`, `TEST-PERF-P1-004`, `TEST-PERF-P1-010`, `TEST-DR-P1-005`, `TEST-DR-P1-008`, `TEST-CON-P1-013`, `TEST-E2E-P1-022`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-022-01` — **Given** sufficient current authorized evidence, **when** an answer completes, **then** each material claim is supported by exact redeemable citations and limitations/coverage are explicit.
- `AC-STORY-P1-022-02` — **Given** conflicting, stale, insufficient, restricted, unavailable, injected, or revoked evidence, **when** Q&A runs, **then** the answer refuses/limits truthfully without fabricating a claim/citation or exposing protected context.

### `STORY-P1-023` — Redeem evidence and compare versions from search and answers

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Search/Document Platform + UX |
| Product | `REQ-P1-SRCH-005`; `FEAT-P1-013`; `UC-P1-003`, `005`; `OUT-P1-002`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-006`, `008`, `020`, `023`; `UX-SCR-P1-015`, `016`, `019`, `033`–`045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`056`, especially `038`–`040`, `042` |
| API / events | `API-P1-127`–`132`; adjacent `EVT-P1-009`, `010`; `API-P1-010`, `015`–`020`, `027`–`038`, `041`, `042`, `047`–`050` |
| Security | `AUTH-P1-001`–`010`, `012`, `018`–`025`, `034`, `035`; `SEC-P1-012`, `015`–`021`, `027`; `PRIV-P1-001`, `004`, `011`, `016`, `020`, `022`; `AUD-P1-001`–`008`, `011`, `014`, `027`; `THR-P1-005`, `006`, `008`, `014`–`016`, `019`, `023`, `030` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `010`, `013`, `016`–`018`, `022`–`030`, `033`, `035`, `036`, `041`–`043`; `DIT-EXT-P1-001`–`035`, `DIT-VER-P1-001`–`042`; `AI-RAG-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/extraction-schemas.json`: all anchor/support identities; `data/states-and-severity.json`: all comparison/RAG states; `data/access-control.json`: `action.read`, `action.compare` |
| Dependencies / fences | Depends on `STORY-P1-007`, `011`, `012`, `019`, `022`; citation/grant/redemption authorization is separate from seeing answer text; comparison respects each side/region. |
| Migration / rollback / repair | Preserve citation/evidence/version identities across schema/generation; invalidate grants on policy/deletion change; regenerate comparison as a new generation; broken anchor creates limitation/repair, never citation substitution. |
| Negative, failure, audit | Guessed/reused/wrong audience/workspace/version, expired/revoked/deleted/quarantined grant, hidden comparison side/region, cache/referrer leak, broken anchor; audit grants/redemptions/comparison refs without token/content. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-UNIT-P1-005`, `TEST-CON-P1-002`, `TEST-CON-P1-003`, `TEST-AI-P1-003`, `TEST-AI-P1-008`, `TEST-AI-P1-010`, `TEST-AI-P1-011`, `TEST-SEC-P1-002`, `TEST-SEC-P1-003`, `TEST-SEC-P1-006`, `TEST-E2E-P1-003`, `TEST-E2E-P1-005`, `TEST-PERF-P1-003`, `TEST-PERF-P1-006`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-023-01` — **Given** an authorized citation or comparison, **when** the user opens it, **then** exact source/version/anchor and base/target/coverage are shown with current authorization and accessible focus/navigation.
- `AC-STORY-P1-023-02` — **Given** expiration, revocation, deletion, quarantine, hidden region, wrong audience, or broken anchor, **when** redemption occurs, **then** no content/existence leaks and the caller gets a truthful safe limitation/recovery path.

### `STORY-P1-024` — Route AI work only through registered schema-bound capabilities

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; AI Platform + Security |
| Product | `REQ-P1-AI-001`, `REQ-P1-AI-002`, `REQ-P1-AI-003`; `FEAT-P1-014`; `UC-P1-005`; `OUT-P1-002`, `OUT-P1-003`, `OUT-P1-004`, `OUT-P1-007` |
| UX / accessibility | Platform-only gateway; user-visible async/limitation outcomes surface through `UX-FLOW-P1-005`, `008`, `010`, `012`, `020`–`023` and `UX-SCR-P1-013`, `019`, `021`, `024`, `033`–`045`; `A11Y-P1-002`–`005`, `021`–`028`, `043`–`056` |
| API / events | No generic public AI invocation API/event by design; capability-specific operations own user contracts; **`TRACE-GAP-P1-API-006`** records gateway conformance visibility, not a demand for a public endpoint. |
| Security | `AUTH-P1-001`–`011`, `020`–`025`, `029`, `034`, `035`; `SEC-P1-007`, `017`–`021`, `028`, `029`; `PRIV-P1-001`, `004`, `008`, `020`–`022`, `027`, `028`; `AUD-P1-001`–`008`, `014`, `027`, `029`; `THR-P1-005`–`007`, `015`, `016`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-002`, `004`–`006`, `011`–`018`, `021`–`030`, `033`, `036`, `039`, `041`–`045`; every applicable DIT structured contract; `AI-CAP-P1-001`–`030`, `AI-OUT-P1-001`–`030`, `AI-TOOL-P1-001`–`030` |
| Reference data | `data/ai-capabilities.json`: all `tool-class.*`, `ai.*`, `AI-CAP-P1-001`–`014`; `data/states-and-severity.json`: `machine.ai-output-status`, `machine.tool-call`, `machine.guardrail-gate` |
| Dependencies / fences | Depends on `STORY-P1-003`, `009`, `010`; exact capability/model/prompt/tool/schema/route/budget versions; service identity cannot become user; no model text grants workspace/tool/effect authority. |
| Migration / rollback / repair | Capability version changes create new immutable manifests/results; old/new schema compatibility and deterministic fake-port conformance precede activation; rollback disables route/selection without rewriting outputs; unknown effect reconciles separately. |
| Negative, failure, audit | Unregistered capability/tool/model, schema extra/missing field, prompt/tool injection, workspace/purpose spoof, unapproved retention/training/region, malformed/timeout, quota/cost exhaustion; audit manifest/result refs and safe reason only. |
| Future TEST | `TEST-UNIT-P1-010`, `TEST-CON-P1-011`, `TEST-CON-P1-012`, `TEST-AI-P1-012`, `TEST-AI-P1-013`, `TEST-AI-P1-015`, `TEST-SEC-P1-004`, `TEST-SEC-P1-005`, `TEST-SEC-P1-010`, `TEST-SEC-P1-012`, `TEST-SEC-P1-015`, `TEST-E2E-P1-005`, `TEST-E2E-P1-007`, `TEST-E2E-P1-020`, `TEST-PERF-P1-004`, `TEST-PERF-P1-010`, `TEST-DR-P1-008`; DRAFT cases require execution evidence. |

- `AC-STORY-P1-024-01` — **Given** a registered capability and eligible route, **when** AI work is requested, **then** exact versions, purpose/scope, structured schema, evidence policy, tool ceiling, budget, and audit correlation bind the immutable run/result.
- `AC-STORY-P1-024-02` — **Given** unregistered/incompatible capability, forged authority, injected tool request, unknown route/cost, or malformed output, **when** the gateway evaluates it, **then** it refuses/limits/reviews without calling an unauthorized tool or emitting unvalidated state.

### `STORY-P1-025` — Gate AI evidence, confidence, human review, privacy, and cost

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; AI Assurance + Product/Security |
| Product | `REQ-P1-AI-004`, `REQ-P1-AI-005`, `REQ-P1-AI-006`, `REQ-P1-AI-007`; `FEAT-P1-014`; `UC-P1-002`, `004`, `005`, `007`; `OUT-P1-002`, `OUT-P1-003`, `OUT-P1-004`, `OUT-P1-007` |
| UX / accessibility | Platform evaluation; user-visible confidence/evidence/limitations/review across `UX-FLOW-P1-005`, `007`, `008`, `010`, `012`, `020`–`023`; `UX-SCR-P1-013`, `017`, `019`, `021`, `024`, `033`–`045`; `A11Y-P1-001`–`056` |
| API / events | No generic AI evaluation API/event; capability APIs/jobs expose only validated outcomes; **`TRACE-GAP-P1-API-006`**; all operations inherit `API-P1-037`, `047`–`052`. |
| Security | `AUTH-P1-001`–`014`, `020`–`025`, `029`, `034`, `035`; `SEC-P1-017`–`021`, `024`, `028`, `029`; `PRIV-P1-001`, `004`, `008`, `020`–`022`, `027`, `028`; `AUD-P1-001`–`008`, `014`, `016`–`018`, `027`, `029`; `THR-P1-005`–`007`, `010`, `015`, `016`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `011`–`018`, `021`–`030`, `033`, `034`, `036`, `039`, `041`–`045`; all applicable `DIT-*-P1-*`; `AI-CAP-P1-001`–`030`, `AI-OUT-P1-001`–`030`, `AI-TOOL-P1-001`–`030`, `AI-GRD-P1-001`–`035`, `AI-EVAL-P1-001`–`035` |
| Reference data | `data/ai-capabilities.json`: all capability/tool records; `data/states-and-severity.json`: all `state.ai-output.*`, `state.guardrail.*`, `state.tool-call.*`; `data/common.json`: privacy/purpose classes |
| Dependencies / fences | Depends on `STORY-P1-009`, `012`, `019`, `024`; confidence, evidence strength, coverage, applicability, source authority/health, severity, urgency remain separate; no AI output self-approves truth/effect. |
| Migration / rollback / repair | Evaluation plan/dataset/run/candidate/calibration versions immutable; candidate evidence never floats to changed version; failed gate disables/reverts selection, not historical results; budget degradation is explicit and safe. |
| Negative, failure, audit | Unsupported claim, unresolvable citation, sensitive slice, overconfidence, selective-risk/calibration failure, injection, provider drift, retention/egress, unknown price, cost/retry storm, human-review bypass; synthetic evidence only. |
| Future TEST | `TEST-CON-P1-011`, `TEST-CON-P1-012`, `TEST-AI-P1-003`, `TEST-AI-P1-004`, `TEST-AI-P1-009`–`TEST-AI-P1-015`, `TEST-SEC-P1-004`, `TEST-SEC-P1-005`, `TEST-SEC-P1-010`, `TEST-SEC-P1-012`, `TEST-SEC-P1-015`, `TEST-E2E-P1-002`, `TEST-E2E-P1-004`, `TEST-E2E-P1-005`, `TEST-E2E-P1-007`, `TEST-E2E-P1-008`, `TEST-E2E-P1-020`, `TEST-PERF-P1-004`, `TEST-PERF-P1-010`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-025-01` — **Given** an exact candidate/version and approved evaluation plan, **when** evidence/quality/safety/privacy/cost gates run, **then** results remain sliced, attributable, reproducible, and cannot be hidden by an aggregate pass.
- `AC-STORY-P1-025-02` — **Given** insufficient evidence, critical slice failure, injection, unapproved route/retention, missing human review, or exhausted budget, **when** the capability is requested, **then** it refuses/limits/degrades and cannot create canonical truth or consequential effect.

## 4. `P1-S3` — Monitor and close the loop

### `STORY-P1-026` — Build a versioned conformed current document view

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Intelligence + Domain/Data |
| Product | `REQ-P1-DOC-008`; `FEAT-P1-015`; `UC-P1-003`, `006`; `OUT-P1-002`, `OUT-P1-004` |
| UX / accessibility | `UX-FLOW-P1-006`, `020`, `021`; `UX-SCR-P1-016`, `033`–`036`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`056`, especially `038`–`040`, `042` |
| API / events | No conformed-view operation in `API-OPENAPI-001`; adjacent version/comparison `API-P1-125`, `126`, `131`, `132`; `EVT-P1-010`; **`TRACE-GAP-P1-API-007`** |
| Security | `AUTH-P1-001`–`010`, `019`–`025`, `034`, `035`; `SEC-P1-012`, `017`–`021`, `027`, `029`; `PRIV-P1-001`, `004`, `011`, `016`, `017`, `020`, `022`; `AUD-P1-001`–`008`, `011`–`014`, `027`; `THR-P1-005`, `006`, `008`, `009`, `019`, `023`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-004`, `005`, `007`–`013`, `016`–`018`, `022`–`030`, `033`, `035`, `036`, `041`–`045`; `DIT-VER-P1-018`–`031`; `AI-CAP-P1-005`, `AI-CAP-P1-007`, plus `AI-GRD-P1-001`–`035` |
| Reference data | Version/type/evidence identities from `data/document-types.json`, `data/extraction-schemas.json`; `data/states-and-severity.json`: comparison/presence/review states |
| Dependencies / fences | Depends on `STORY-P1-011`–`019`; the conformed view is derived, versioned, evidence-backed, permission-filtered, and never a mutable replacement for source versions/facts. |
| Migration / rollback / repair | New projection generation binds input versions/resolutions/policy/deletion/source watermarks; validate coverage before cutover; stale/partial fallback is explicit; repair rebuilds, never edits immutable source. |
| Negative, failure, audit | Hidden field/version, restricted conflict, stale projection, deleted input, incomplete comparison, cycle or generation mismatch; current authorization at query; audit inputs/generation/coverage/selection without content. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-UNIT-P1-005`, `TEST-UNIT-P1-006`, `TEST-UNIT-P1-010`, `TEST-CON-P1-002`, `TEST-CON-P1-003`, `TEST-CON-P1-007`, `TEST-CON-P1-010`, `TEST-AI-P1-008`, `TEST-SEC-P1-002`, `TEST-SEC-P1-003`, `TEST-SEC-P1-006`, `TEST-SEC-P1-014`, `TEST-E2E-P1-003`, `TEST-E2E-P1-006`, `TEST-E2E-P1-008`, `TEST-PERF-P1-003`, `TEST-PERF-P1-006`, `TEST-PERF-P1-007`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-026-01` — **Given** multiple source versions, fact resolutions, and comparison evidence, **when** the conformed view builds, **then** its exact inputs, selection rationale, coverage, generation, and current authorization are inspectable.
- `AC-STORY-P1-026-02` — **Given** a restricted/deleted input, stale fact/version, incomplete comparison, or failed rebuild, **when** the view is queried, **then** it is safely filtered and labelled stale/partial/unavailable rather than presented as complete current truth.

### `STORY-P1-027` — Create versioned monitoring subscriptions and retry-safe runs

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Monitoring + Document Intelligence |
| Product | `REQ-P1-MON-001`, `REQ-P1-MON-002`; `FEAT-P1-016`; `UC-P1-006`; `OUT-P1-003`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-009`, `024`; `UX-SCR-P1-020`, `037`–`039`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | `API-P1-144`–`148`; `EVT-P1-017`; `API-P1-007`–`014`, `027`–`040`, `047`–`052` |
| Security | `AUTH-P1-001`–`008`, `021`–`025`, `029`, `034`, `035`; `SEC-P1-001`, `002`, `006`, `007`, `017`–`019`, `023`, `029`; `PRIV-P1-001`, `004`, `006`–`008`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `013`, `015`, `027`, `029`; `THR-P1-003`, `005`–`007`, `009`, `011`, `017`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `013`–`021`, `022`–`030`, `033`, `036`, `039`, `041`–`043`; `DIT-MON-P1-001`–`020`; AI proposals only through `AI-CAP-P1-007`, `008` and applicable guardrails |
| Reference data | `data/monitoring-rules.json`: all `monitoring-strategy.*`, `monitoring-rule.synthetic.*`; `data/states-and-severity.json`: source/applicability states; DRAFT/disabled pending launch approval |
| Dependencies / fences | Depends on `STORY-P1-003`, `010`, `026`; subscriptions bind exact rule/config/source/input/purpose/consent/region versions; schedule does not authorize or prove a check; launch coverage blocked by `DEC-035`. |
| Migration / rollback / repair | Preserve subscription/rule revisions, trigger/run IDs, checkpoints, attempts, and replay generations; interrupted scheduler/outbox reconciles; rollback does not erase observations or duplicate change cases. |
| Negative, failure, audit | Duplicate/delayed/reordered/concurrent triggers, lease/clock/DST ambiguity, revoke/delete/source-disable mid-run, retry exhaustion/cost storm, audit failure; exact failed/degraded state and attempt evidence. |
| Future TEST | `TEST-UNIT-P1-008`, `TEST-CON-P1-004`, `TEST-CON-P1-007`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-007`, `TEST-SEC-P1-015`, `TEST-E2E-P1-006`, `TEST-PERF-P1-007`, `TEST-PERF-P1-008`, `TEST-DR-P1-002`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-027-01` — **Given** an approved enabled rule/source and authorized subscription, **when** duplicate or reordered triggers run, **then** one logical run/change input is produced with all attempts and exact configuration lineage.
- `AC-STORY-P1-027-02` — **Given** stale policy, disabled source/rule, deletion, retry exhaustion, scheduler/audit outage, or clock ambiguity, **when** monitoring runs, **then** it stops or degrades truthfully without claiming a check/change/fulfilment.

### `STORY-P1-028` — Preserve governed source snapshots, coverage, and current health

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; launch source pack BLOCKED by DEC-035`; Source Governance + Monitoring |
| Product | `REQ-P1-MON-003`, `REQ-P1-MON-004`, `REQ-P1-MON-005`, `REQ-P1-MON-007`; `FEAT-P1-017`; `UC-P1-006`; `OUT-P1-003`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-009`, `024`; `UX-SCR-P1-020`, `037`–`039`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | `API-P1-149`–`152` are `CONFIGURATION_DEPENDENT_NO_LAUNCH_PACK`; `EVT-P1-015`–`017`; `API-P1-038`, `046`–`052` |
| Security | `AUTH-P1-001`–`008`, `021`–`025`, `029`, `034`, `035`; `SEC-P1-017`–`019`, `023`, `028`, `029`; `PRIV-P1-001`, `004`, `008`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `013`, `015`, `027`, `029`; `THR-P1-005`–`007`, `009`, `017`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `013`–`021`, `022`–`030`, `033`, `036`, `039`–`043`; `DIT-SRC-P1-001`–`032`, `DIT-MON-P1-017`, `025`–`034`; parser/AI output cannot publish authority under `AI-GRD-P1-001`–`035` |
| Reference data | `data/trusted-sources.json`: all `authority-tier.*`, `freshness-policy.unset`, `source/coverage/endpoint/parser.synthetic.au.reference-series`; all are DRAFT/disabled/`.invalid`. |
| Dependencies / fences | Depends on `STORY-P1-010`, `027`, `037`; source authority, health, freshness, coverage, parser success, applicability, and evidence strength stay separate; `DEC-035` permits synthetic dev fixtures but public coverage remains release-gated. |
| Migration / rollback / repair | Snapshot/endpoint/parser/publication versions immutable; source health history never reset by deployment; parser repair creates new observation; source-package rollback preserves failed/current health and prior snapshots. |
| Negative, failure, audit | SSRF/DNS/redirect, poisoned/oversize content, bad signature/schema, parser failure, schedule miss, partial coverage, stale/disabled source, ineligible route; last success never masks failure; audit endpoint by governed ID, not unrestricted URL/content. |
| Future TEST | `TEST-UNIT-P1-008`, `TEST-CON-P1-004`, `TEST-CON-P1-007`, `TEST-CON-P1-012`, `TEST-AI-P1-014`, `TEST-SEC-P1-010`, `TEST-SEC-P1-012`, `TEST-SEC-P1-015`, `TEST-E2E-P1-006`, `TEST-PERF-P1-007`, `TEST-DR-P1-002`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-028-01` — **Given** an approved governed source configuration, **when** retrieval/parser succeeds or fails, **then** an immutable observation/snapshot attempt and current health/coverage state record exact versions and truthful freshness.
- `AC-STORY-P1-028-02` — **Given** stale/failed/partial/disabled/poisoned or synthetic-only source state, **when** any user/API presentation occurs, **then** prior success is not shown as current and no enabled launch coverage is inferred.

### `STORY-P1-029` — Determine applicability before creating a stable change case

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Monitoring + Document Intelligence |
| Product | `REQ-P1-MON-006`; `FEAT-P1-018`; `UC-P1-006`, `007`; `OUT-P1-003`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-009`, `010`, `024`, `025`; `UX-SCR-P1-020`, `021`, `037`–`040`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | No `RuleResolution`/`ChangeCase` operation in `API-OPENAPI-001`; adjacent source/impact queries `API-P1-152`–`154`; `EVT-P1-018`, `019`; **`TRACE-GAP-P1-API-008`** |
| Security | `AUTH-P1-001`–`011`, `021`–`025`, `029`, `034`, `035`; `SEC-P1-017`–`019`, `023`, `029`; `PRIV-P1-001`, `004`, `008`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `013`, `015`, `016`, `027`, `029`; `THR-P1-005`–`007`, `009`, `017`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `013`, `016`–`021`, `022`–`030`, `033`, `036`, `039`, `041`–`045`; `DIT-MON-P1-021`–`034`, `DIT-IMP-P1-001`–`008`; `AI-CAP-P1-007`, `008`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/states-and-severity.json`: all `state.applicability.*`; exact source/rule records from `data/trusted-sources.json`, `data/monitoring-rules.json` remain DRAFT/disabled |
| Dependencies / fences | Depends on `STORY-P1-027`, `028`; applicability precedes impact and remains separate from authority/health/confidence/severity/urgency; one stable `ChangeCase` per material eligible transition. |
| Migration / rollback / repair | Applicability/rule-resolution/change-case versions append; new evidence or rule/config version re-evaluates without rewriting prior result; duplicate replay reconciles by exact transition/input generation. |
| Negative, failure, audit | Restricted/indeterminate/review/unavailable cannot become non-applicable; source failure cannot become no change; revoke/delete/rule supersede mid-run; audit exact rule/evidence/context/outcome refs without hidden subject/value. |
| Future TEST | `TEST-UNIT-P1-008`, `TEST-CON-P1-004`, `TEST-CON-P1-007`, `TEST-AI-P1-014`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-SEC-P1-010`, `TEST-E2E-P1-006`, `TEST-E2E-P1-007`, `TEST-PERF-P1-007`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-029-01` — **Given** a material observation and exact current rule/context, **when** applicability evaluates, **then** one exact applicability outcome and rationale precede creation/reconciliation of one stable change case.
- `AC-STORY-P1-029-02` — **Given** restricted, insufficient, stale, unhealthy, superseded, or unavailable inputs, **when** evaluation occurs, **then** the outcome remains exact and no false non-applicable/no-change/required-action claim is made.

### `STORY-P1-030` — Traverse dependencies to produce bounded impact paths

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Document Intelligence + Domain/Data |
| Product | `REQ-P1-GPH-003`, `REQ-P1-GPH-004`, `REQ-P1-GPH-005`; `FEAT-P1-018`; `UC-P1-006`, `007`; `OUT-P1-003`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-010`, `022`, `025`; `UX-SCR-P1-005`, `021`, `037`–`040`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | `API-P1-153`, `154`; `EVT-P1-014`, `020`; `API-P1-007`–`026`, `033`–`040`, `047`–`052` |
| Security | `AUTH-P1-001`–`012`, `019`–`025`, `034`, `035`; `SEC-P1-017`–`019`, `023`, `029`; `PRIV-P1-001`, `004`, `020`, `022`; `AUD-P1-001`–`008`, `013`, `015`, `016`, `027`; `THR-P1-005`–`007`, `009`, `017`, `019`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `009`, `013`–`021`, `022`–`030`, `033`, `036`, `041`–`045`; `DIT-GPH-P1-014`–`032`, `DIT-IMP-P1-001`–`014`; `AI-CAP-P1-009`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/dependencies.json`: all exact node/edge types; `data/states-and-severity.json`: applicability/impact-class states |
| Dependencies / fences | Depends on `STORY-P1-020`, `026`, `029`; traverse exact graph/input/projection revisions; cycle, truncation, restricted bridge, missing/stale edge, depth/fan-out, and coverage are visible. |
| Migration / rollback / repair | Impact traversal/output is immutable by change/graph/rule generation; graph rebuild/cutover preserves old paths; replay creates new assessment and reconciles stable impact identity; never infer missing edges. |
| Negative, failure, audit | Hidden-node/path/count/layout inference, cycle/explosion, stale/deleted edge, partial projection, timeout/quota, revoked field/edge during traversal; safe minimal disclosure only by named policy; audit visible path refs/limits. |
| Future TEST | `TEST-UNIT-P1-007`, `TEST-UNIT-P1-008`, `TEST-CON-P1-004`, `TEST-CON-P1-007`, `TEST-AI-P1-007`, `TEST-AI-P1-014`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-SEC-P1-015`, `TEST-E2E-P1-006`, `TEST-E2E-P1-007`, `TEST-E2E-P1-013`, `TEST-PERF-P1-003`, `TEST-PERF-P1-007`, `TEST-PERF-P1-008`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-030-01` — **Given** an applicable change and authorized graph revision, **when** impact traversal runs, **then** each returned path has exact nodes/edges/direction/evidence/generation and explicit depth/cycle/truncation/coverage.
- `AC-STORY-P1-030-02` — **Given** restricted bridge, stale/deleted edge, cycle, excessive fan-out, incomplete projection, or authorization change, **when** traversal runs, **then** it cannot imply hidden topology or complete coverage and degrades truthfully.

### `STORY-P1-031` — Create explainable impact assessments and recommendations

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Product Workflow + Document Intelligence |
| Product | `REQ-P1-ACT-001`, `REQ-P1-ACT-002`, `REQ-P1-ACT-003`, `REQ-P1-ACT-004`; `FEAT-P1-018`; `UC-P1-004`, `007`, `008`; `OUT-P1-003`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-010`, `025`; `UX-SCR-P1-021`, `037`–`040`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | `API-P1-153`–`157`; `EVT-P1-020`, `021`; `API-P1-007`–`020`, `027`–`040`, `047`–`052` |
| Security | `AUTH-P1-001`–`014`, `019`–`025`, `035`; `SEC-P1-017`–`019`, `024`, `029`; `PRIV-P1-001`, `004`, `020`, `022`; `AUD-P1-001`–`008`, `013`, `015`, `016`, `027`; `THR-P1-005`–`011`, `019`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `013`, `016`–`021`, `022`–`030`, `033`, `034`, `036`, `041`–`045`; `DIT-IMP-P1-001`–`019`; `AI-CAP-P1-009`, `011`, `AI-OUT-P1-001`–`030`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/states-and-severity.json`: `machine.impact-class`, `machine.recommendation-decision`, `severity.*`; `data/dependencies.json`: `edge-type.impact-yields-recommendation` |
| Dependencies / fences | Depends on `STORY-P1-029`, `030`; applicability, impact class, severity, urgency, confidence, evidence strength, source authority/health stay separate; recommendation is inert until exact human decision/approval. |
| Migration / rollback / repair | Assessment/recommendation versions and input digests immutable; new evidence/policy/path invalidates/reroutes stale recommendation; regenerate rather than overwrite; repair deduplicates one logical recommendation lineage. |
| Negative, failure, audit | Restricted evidence/path, stale/changed input, model hallucination/injection, unsupported recommendation, duplicate replay, source failure, current-policy change; audit change/applicability/path/evidence/version/dimensions/disposition safely. |
| Future TEST | `TEST-UNIT-P1-009`, `TEST-CON-P1-004`, `TEST-CON-P1-008`, `TEST-CON-P1-011`, `TEST-AI-P1-007`, `TEST-AI-P1-013`, `TEST-AI-P1-014`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-SEC-P1-005`, `TEST-E2E-P1-007`, `TEST-E2E-P1-008`, `TEST-PERF-P1-003`, `TEST-PERF-P1-004`, `TEST-DR-P1-002`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-031-01` — **Given** an applicable change with authorized evidence/path, **when** assessment completes, **then** exact impact class and separated dimensions support an inert recommendation with explainable source/evidence/version links.
- `AC-STORY-P1-031-02` — **Given** stale/changed/restricted/insufficient inputs, unhealthy source, injection, or duplicate replay, **when** recommendation is produced or viewed, **then** it is blocked/rerouted/limited and cannot imply approval or effect.

### `STORY-P1-032` — Bind approval to exact recommendation inputs and effect

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Product Workflow + Security |
| Product | `REQ-P1-ACT-005`, `REQ-P1-ACT-006`; `FEAT-P1-019`; `UC-P1-004`, `007`; `OUT-P1-004`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-010`, `025`, `026`; `UX-SCR-P1-021`, `022`, `037`–`041`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `043`–`056`, especially `049` |
| API / events | `API-P1-157`–`159`; `EVT-P1-021`, `022`; `API-P1-007`–`020`, `027`–`038`, `044`, `047`–`052` |
| Security | `AUTH-P1-001`–`014`, `019`–`025`, `035`; `SEC-P1-017`–`019`, `024`, `029`; `PRIV-P1-001`, `004`, `020`, `022`; `AUD-P1-001`–`008`, `016`, `017`, `027`; `THR-P1-005`–`011`, `019`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `013`, `016`, `022`–`029`, `033`, `034`, `036`, `041`–`043`; `DIT-IMP-P1-020`–`025`; AI recommendation remains inert under `AI-CAP-P1-009`, `011`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/access-control.json`: `action.approve`, `permission.action-approval`, `role.action-approver`; `data/states-and-severity.json`: `machine.recommendation-decision` |
| Dependencies / fences | Depends on `STORY-P1-003`, `031`; approval authority, execution, verification/closure are separable; approval binds target/input/effect/policy/config/authority digest, issue/expiry/revocation. |
| Migration / rollback / repair | Approval record immutable; schema changes preserve digest semantics and old decoder; changed input/policy/authority invalidates rather than migrates approval; reversal creates explicit new action/approval if policy allows. |
| Negative, failure, audit | Self-approval where separation required, adjacent permission, stale ETag/digest, changed evidence/effect/policy, expired/revoked approval, replay, audit outage; no model/provider acknowledgement substitutes; exact privacy-safe audit. |
| Future TEST | `TEST-UNIT-P1-009`, `TEST-CON-P1-004`, `TEST-CON-P1-008`, `TEST-AI-P1-013`, `TEST-SEC-P1-005`, `TEST-SEC-P1-007`, `TEST-E2E-P1-007`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-001`, `TEST-DR-P1-003`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-032-01` — **Given** an authorized approver and exact reviewed recommendation/effect, **when** approval is granted, **then** an immutable approval binds the full current digest, scope, authority, policy, time, and decision.
- `AC-STORY-P1-032-02` — **Given** changed/stale/revoked/expired input, authority, policy, target, or effect, **when** approval is reused or execution requested, **then** it is invalid and a fresh review is required without automatic effect.

### `STORY-P1-033` — Execute, reconcile, verify evidence, and close separately

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Product Workflow + Integration/Security |
| Product | `REQ-P1-ACT-007`, `REQ-P1-ACT-008`; `FEAT-P1-019`; `UC-P1-007`; `OUT-P1-004`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-011`, `026`; `UX-SCR-P1-023`, `041`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `038`, `039`, `043`–`056`, especially `049` |
| API / events | `API-P1-160`, `161`; `EVT-P1-023`, `024`; evidence submit/verify/closure API is absent: **`TRACE-GAP-P1-API-009`**; `API-P1-027`–`052` |
| Security | `AUTH-P1-001`–`015`, `019`–`025`, `029`, `035`; `SEC-P1-017`–`019`, `022`, `024`, `027`–`029`; `PRIV-P1-001`, `004`, `006`–`009`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `016`–`018`, `023`, `027`, `029`; `THR-P1-005`–`011`, `018`, `019`, `024`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `013`–`018`, `022`–`030`, `033`, `034`, `036`, `039`, `041`–`045`; `DIT-IMP-P1-026`–`044`; optional drafting/verification proposals `AI-CAP-P1-012`, `013` remain non-authoritative |
| Reference data | `data/states-and-severity.json`: all `machine.action-execution`, `machine.evidence-verification`; `data/access-control.json`: `action.execute`, `action.verify`, execution/verifier roles/permissions |
| Dependencies / fences | Depends on `STORY-P1-032`; attempt, dispatch, acknowledgement, outcome, reconciliation, repair/reversal, evidence verification, fulfilment, closure stay separate; connector effect unavailable until `DEC-031` route approval. |
| Migration / rollback / repair | Action/reconciliation IDs and attempts immutable; timeout-after-possible-effect becomes `OutcomeUnknown`; retry only with adapter proof; repair/forward reconcile, never rollback by hiding external effect; old state decoders retained. |
| Negative, failure, audit | Stale/forged approval/effect, revoke/delete/consent/route change, timeout before/after possible effect, duplicate callback, partial/unknown, evidence mismatch, self-verification, audit outage; record every attempt/outcome/reconcile/evidence safely. |
| Future TEST | `TEST-UNIT-P1-009`, `TEST-CON-P1-004`, `TEST-CON-P1-008`, `TEST-CON-P1-012`, `TEST-AI-P1-013`, `TEST-AI-P1-014`, `TEST-SEC-P1-005`, `TEST-SEC-P1-010`, `TEST-SEC-P1-013`, `TEST-SEC-P1-015`, `TEST-E2E-P1-007`, `TEST-PERF-P1-001`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-PERF-P1-008`, `TEST-DR-P1-001`, `TEST-DR-P1-002`, `TEST-DR-P1-003`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-033-01` — **Given** current exact approval and eligible effect route, **when** execution has a success, partial result, failure, or timeout after possible effect, **then** one attempt lineage reaches the exact state and ambiguous outcomes reconcile before retry/closure.
- `AC-STORY-P1-033-02` — **Given** claimed replacement evidence, **when** a separately authorized verifier evaluates it, **then** evidence verification, requirement fulfilment, and closure change only through their own recorded decisions and cannot be inferred from provider acknowledgement.

### `STORY-P1-034` — Evaluate versioned expected-evidence profiles

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; launch profiles BLOCKED by DEC-035`; Document Intelligence + Product |
| Product | `REQ-P1-HLT-001`, `REQ-P1-HLT-002`, `REQ-P1-HLT-003`; `FEAT-P1-020`; `UC-P1-008`; `OUT-P1-001`, `OUT-P1-003`, `OUT-P1-004` |
| UX / accessibility | `UX-FLOW-P1-012`, `027`; `UX-SCR-P1-024`, `042`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `038`, `039`, `042`–`056` |
| API / events | No `RequirementCase`/profile operation in `API-OPENAPI-001`; `EVT-P1-025`; **`TRACE-GAP-P1-API-010`** |
| Security | `AUTH-P1-001`–`011`, `019`–`025`, `035`; `SEC-P1-017`–`019`, `023`, `029`; `PRIV-P1-001`, `004`, `020`, `022`; `AUD-P1-001`–`008`, `013`, `015`, `016`, `019`, `027`; `THR-P1-005`–`007`, `009`, `017`, `019`, `026`, `027`, `030` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `007`, `008`, `013`, `016`–`021`, `022`–`030`, `033`, `036`, `041`–`045`; `DIT-HLT-P1-001`–`006`; `AI-CAP-P1-010`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/requirement-profiles.json`: all `evidence-option.*`, `alternative.*`, `waiver-policy.*`, `fulfilment-policy.*`, `requirement-profile.synthetic.au.generic-policy-reference`; all DRAFT/disabled |
| Dependencies / fences | Depends on `STORY-P1-010`, `016`, `028`, `037`; profile/rule/source/jurisdiction/applicability/effective versions exact; expected is not legal obligation or fulfilment; `DEC-035` permits synthetic dev profiles but public profile coverage remains release-gated. |
| Migration / rollback / repair | Profile versions immutable/effective-dated; re-evaluation creates new requirement-case/finding generation; rollback selects prior approved profile and preserves old findings/dispositions/evidence; consumer compatibility required. |
| Negative, failure, audit | Missing/inactive/incompatible profile, stale/unhealthy source/rule, restricted evidence, unsupported alternative/waiver, jurisdiction/time ambiguity; no authoritative finding on invalid input; audit safe profile/input/outcome refs. |
| Future TEST | `TEST-UNIT-P1-008`, `TEST-UNIT-P1-009`, `TEST-CON-P1-004`, `TEST-CON-P1-008`, `TEST-CON-P1-009`, `TEST-AI-P1-014`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-E2E-P1-008`, `TEST-PERF-P1-007`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-034-01` — **Given** an approved effective profile and authorized household context, **when** expected evidence evaluates, **then** exact profile/options/rules/source/input versions and applicability support a requirement case without claiming compliance.
- `AC-STORY-P1-034-02` — **Given** missing/inactive/stale/unhealthy/restricted/incompatible inputs, **when** evaluation runs, **then** no authoritative missing/fulfilled result is created and the limitation remains explicit.

### `STORY-P1-035` — Manage explainable findings, disposition, and verified fulfilment

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Product + Document Intelligence |
| Product | `REQ-P1-HLT-005`; `FEAT-P1-020`; `UC-P1-008`; `OUT-P1-001`, `OUT-P1-003`, `OUT-P1-004` |
| UX / accessibility | `UX-FLOW-P1-012`, `027`; `UX-SCR-P1-024`, `042`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `038`, `039`, `042`–`056` |
| API / events | No `RequirementCase` finding/disposition/fulfilment operation in `API-OPENAPI-001`; `EVT-P1-025`; **`TRACE-GAP-P1-API-010`** |
| Security | `AUTH-P1-001`–`012`, `019`–`025`, `035`; `SEC-P1-017`–`019`, `024`, `029`; `PRIV-P1-001`, `004`, `019`, `020`, `022`; `AUD-P1-001`–`008`, `016`, `018`, `019`, `027`; `THR-P1-005`–`011`, `019`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `007`, `008`, `013`, `016`–`021`, `022`–`030`, `033`, `034`, `036`, `041`–`045`; `DIT-HLT-P1-007`–`036`; `AI-CAP-P1-010`, `AI-GRD-P1-001`–`035` |
| Reference data | `data/requirement-profiles.json`: exact options/alternative/waiver/fulfilment records; `data/states-and-severity.json`: all `machine.health-signal`, `machine.requirement-disposition`, `machine.requirement-fulfilment` states |
| Dependencies / fences | Depends on `STORY-P1-034`; signal, disposition, task, evidence added, alternative, waiver review, N/A, dismissal, reminder, verification, fulfilment, reopen stay distinct; aggregate score deferred to `STORY-P1-043`. |
| Migration / rollback / repair | Finding/disposition/fulfilment events append; new material evidence/profile/source state reopens through a new transition; repair recalculates projection but cannot turn user disposition into verified fulfilment. |
| Negative, failure, audit | Restricted evidence cannot appear missing; dismissed/reminded/N/A cannot imply fulfilled; unsupported alternative/waiver denied; stale verification/new evidence reopens; audit causality/evidence/decision without protected value. |
| Future TEST | `TEST-UNIT-P1-009`, `TEST-CON-P1-005`, `TEST-CON-P1-008`, `TEST-CON-P1-009`, `TEST-AI-P1-014`, `TEST-SEC-P1-002`, `TEST-SEC-P1-005`, `TEST-E2E-P1-008`, `TEST-E2E-P1-010`, `TEST-PERF-P1-002`, `TEST-PERF-P1-007`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-035-01` — **Given** an explainable item-level finding, **when** a user chooses a supported disposition, **then** the disposition and causality are recorded without changing fulfilment until exact evidence/policy verification succeeds.
- `AC-STORY-P1-035-02` — **Given** restricted, expired, conflicting, stale, superseded, or new material evidence, **when** health is recomputed, **then** the exact signal/fulfilment/reopen state is shown and neither absence nor compliance is fabricated.

### `STORY-P1-036` — Coordinate tasks, reminders, and in-app notifications

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Product Workflow + UX |
| Product | `REQ-P1-NTF-001`, `REQ-P1-NTF-002`, `REQ-P1-NTF-003`; `FEAT-P1-021`; `UC-P1-007`, `008`, `010`; `OUT-P1-004`, `OUT-P1-005`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-013`, `028`; `UX-SCR-P1-025`, `043`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `042`–`056` |
| API / events | `API-P1-162`–`168`; `EVT-P1-026`; `API-P1-007`–`026`, `027`–`038`, `047`–`052` |
| Security | `AUTH-P1-001`–`012`, `019`–`025`, `035`; `SEC-P1-017`–`019`, `024`, `029`; `PRIV-P1-001`, `004`, `020`, `022`; `AUD-P1-001`–`008`, `019`, `027`; `THR-P1-005`–`007`, `009`, `011`, `019`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-001`–`008`, `013`, `016`, `022`–`030`, `033`, `036`, `041`–`043`; tasks consume `DIT-HLT-P1-007`–`036` and `DIT-IMP-P1-001`–`044` causality; no AI owns assignment/completion |
| Reference data | `data/notifications.json`: `channel.IN_APP`, both synthetic templates; `data/states-and-severity.json`: applicable finding/action states; `data/access-control.json`: exact read/edit/verify permissions as configured |
| Dependencies / fences | Depends on `STORY-P1-003`, `031`, `035`; task, reminder, notification delivery/seen/ack, action, fulfilment, and closure are distinct; protected cause uses current authorization/minimal disclosure. |
| Migration / rollback / repair | Stable task/notification/cause/dedup IDs; retry delivery cannot duplicate task or completion; late notification reflects current state; repair/reopen is explicit; rollback does not erase user action/history. |
| Negative, failure, audit | Wrong assignee/workspace, hidden cause/badge/count, revoke between creation/delivery/open, duplicate/out-of-order delivery, offline/reconnect, notification failure; in-app state canonical and content-minimized; audit causality/transitions. |
| Future TEST | `TEST-UNIT-P1-009`, `TEST-CON-P1-005`, `TEST-CON-P1-008`, `TEST-SEC-P1-002`, `TEST-SEC-P1-013`, `TEST-SEC-P1-015`, `TEST-E2E-P1-007`, `TEST-E2E-P1-008`, `TEST-E2E-P1-010`, `TEST-PERF-P1-001`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-002`, `TEST-DR-P1-008`, `TEST-CON-P1-013`, `TEST-E2E-P1-022`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-036-01` — **Given** an authorized finding or action cause, **when** a task/reminder and in-app notification are created/retried, **then** one logical task preserves cause, assignment, state, delivery/ack history, and current authorized presentation.
- `AC-STORY-P1-036-02` — **Given** hidden/revoked cause, wrong assignee, duplicate delivery, offline client, or notification failure, **when** the user returns, **then** no protected badge/detail leaks and canonical task state remains truthful and repairable.

### `STORY-P1-037` — Publish, activate, supersede, and roll back configuration packages

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; detailed UC-P1-018 contract; launch activation gated by DEC-035`; Configuration Governance |
| Product | `REQ-P1-CFG-002`, `REQ-P1-CFG-003`, `REQ-P1-CFG-004`; `FEAT-P1-022`; `UC-P1-018`; `OUT-P1-003`, `OUT-P1-007`; **`TRACE-GAP-P1-UC-001`** |
| UX / accessibility | No Phase 1 configuration administration console; user-visible enabled coverage/settings through `UX-SCR-P1-030`, safe stale/unavailable states `UX-SCR-P1-033`–`045`; `A11Y-P1-002`–`005`, `021`–`028`, `043`–`056` |
| API / events | No configuration-publication API in `API-OPENAPI-001`; `EVT-P1-031`; **`TRACE-GAP-P1-API-011`** |
| Security | `AUTH-P1-001`, `003`, `020`, `028`, `035`; `SEC-P1-001`, `006`, `007`, `017`, `018`, `025`, `030`; `PRIV-P1-001`, `020`–`022`, `030`; `AUD-P1-001`–`008`, `022`, `024`, `027`; `THR-P1-007`, `009`, `019`–`021`, `028` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `013`, `018`, `020`, `026`–`030`, `033`, `036`–`043`; `DIT-TAX-P1-023`–`025`, `DIT-MON-P1-004`, `005`, `DIT-SRC-P1-005`, `006`, `014`–`019`, `DIT-HLT-P1-003`, `004`; `AI-CAP-P1-030`, `AI-OUT-P1-029`, `030`, `AI-TOOL-P1-029`, `030`, `AI-GRD-P1-033`–`035` |
| Reference data | All `docs/11-reference-data/data/*.json` and schemas; exact package/meta/owner/effective/version/status fields; DRAFT/disabled seeds never activate without approved replacement/publication. |
| Dependencies / fences | Depends on `STORY-P1-009`, `010`; separate proposal/review/approval/publication/activation/supersession/rollback; required consumer compatibility/ack; detailed `UC-P1-018` ACs govern the safe publication boundary. |
| Migration / rollback / repair | Immutable signed/versioned package; validate diff/dependencies/consumer compatibility/effective interval and impact; activate only after acknowledgements; rollback selects prior approved version and replays/repairs, never edits history. |
| Negative, failure, audit | Self-publish, privilege/config injection, DRAFT seed, dangling ID, unsafe endpoint, unapproved route/type/source/channel/score/duration, missing/incompatible consumer, partial activation; block/repair with immutable privacy-safe audit. |
| Future TEST | `TEST-UNIT-P1-001`, `TEST-UNIT-P1-010`, `TEST-CON-P1-008`, `TEST-CON-P1-009`, `TEST-SEC-P1-007`, `TEST-SEC-P1-011`, `TEST-SEC-P1-012`, `TEST-E2E-P1-018`, `TEST-PERF-P1-007`, `TEST-PERF-P1-009`, `TEST-DR-P1-002`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-037-01` — **Given** a reviewed compatible package and authorized separate approver, **when** publication/activation occurs, **then** exact immutable version/effective time/consumer acknowledgements/audit bind the active configuration.
- `AC-STORY-P1-037-02` — **Given** DRAFT/unsafe/incompatible/unapproved configuration or partial activation, **when** publication is attempted, **then** affected capabilities remain disabled and rollback/repair preserves the prior active version and history.

### `STORY-P1-038` — Disclose that an impact exists without exposing its protected basis

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Security/Privacy + Product Workflow |
| Product | `REQ-P1-SHR-005`; `FEAT-P1-023`; `UC-P1-007`, `010`, `013`; `OUT-P1-003`, `OUT-P1-005` |
| UX / accessibility | `UX-FLOW-P1-010`, `013`, `025`, `028`; `UX-SCR-P1-007`, `021`, `025`, `037`–`043`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `041`–`056` |
| API / events | Adjacent `API-P1-153`–`156`, `162`–`166`; no dedicated minimal-disclosure impact operation: **`TRACE-GAP-P1-API-012`**; `EVT-P1-020`, `021`, `026` |
| Security | `AUTH-P1-001`–`012`, `019`–`025`, `035`; `SEC-P1-001`, `002`, `006`, `017`–`019`, `024`, `029`; `PRIV-P1-001`, `003`, `004`, `020`, `022`; `AUD-P1-001`–`008`, `013`, `016`, `019`, `027`; `THR-P1-003`–`007`, `009`, `010`, `019`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `007`, `013`, `016`, `022`–`030`, `033`, `034`, `036`, `041`–`043`; `DIT-GPH-P1-021`–`032`, `DIT-IMP-P1-034`–`044`; AI cannot broaden disclosure under `AI-GRD-P1-001`–`035` |
| Reference data | `data/access-control.json`: `policy-decision.MINIMAL_DISCLOSURE`, `policy.minimum-disclosure`; `data/common.json`: approved purpose/privacy records; no free-text protected cause. |
| Dependencies / fences | Depends on `STORY-P1-003`, `030`, `031`, `036`; only named policy may reveal a generic action-needed signal; it exposes no subject/resource/value/source/document/edge/path/count/schedule/timing detail. |
| Migration / rollback / repair | Minimal-disclosure policy/version and emitted signal causality are stable; policy change increments epoch and removes cached/notification signal; repair reconciles without preserving forbidden details. |
| Negative, failure, audit | Differencing/timing/count/badge/ordering/accessibility-label inference, recipient without named policy, revoke mid-delivery/open, hidden cause in analytics/audit; safe generic error and audit policy/outcome only. |
| Future TEST | `TEST-UNIT-P1-007`, `TEST-UNIT-P1-009`, `TEST-CON-P1-004`, `TEST-CON-P1-005`, `TEST-CON-P1-007`, `TEST-CON-P1-008`, `TEST-SEC-P1-002`, `TEST-SEC-P1-003`, `TEST-SEC-P1-005`, `TEST-SEC-P1-012`, `TEST-E2E-P1-007`, `TEST-E2E-P1-010`, `TEST-E2E-P1-013`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-038-01` — **Given** a protected impact and a recipient authorized only under named minimal-disclosure policy, **when** a task/signal is presented, **then** it communicates only the approved generic action-needed outcome.
- `AC-STORY-P1-038-02` — **Given** no named policy, revocation, or a request for count/timing/path/cause detail, **when** any UI/API/notification/audit surface responds, **then** protected existence and basis remain undisclosed.

## 5. `P1-S4` — Family launch and portability

### `STORY-P1-039` — Issue, preview, redeem, expire, and revoke exact grants

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED`; Product + Authorization/Privacy |
| Product | `REQ-P1-SHR-001`, `REQ-P1-SHR-002`, `REQ-P1-SHR-003`, `REQ-P1-WS-006`; `FEAT-P1-024`; `UC-P1-009`, `011`, `013`; `OUT-P1-005` |
| UX / accessibility | `UX-FLOW-P1-014`, `029`; `UX-SCR-P1-026`, `027`, `044`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`056`, especially `042`, `049` |
| API / events | `API-P1-112`–`115`; `EVT-P1-004`, `005`; `API-P1-007`–`020`, `027`–`032`, `037`, `041`, `042`, `047`–`052` |
| Security | `AUTH-P1-001`–`007`, `012`, `015`–`025`, `035`; `SEC-P1-001`–`006`, `015`–`019`, `027`, `029`; `PRIV-P1-001`–`007`, `018`–`020`, `022`; `AUD-P1-001`–`010`, `020`, `027`; `THR-P1-003`–`006`, `009`, `011`, `014`, `019`, `022`, `026` |
| NFR / DIT / AI | `NFR-P1-001`–`008`, `010`, `013`, `016`, `022`–`030`, `033`, `036`, `041`–`043`; DIT/AI have no grant authority; every derivative consumer applies `AUTH-P1-019`–`024` and `AI-GRD-P1-001`–`035` |
| Reference data | `data/access-control.json`: `action.share`, `action.read`, `action.export`, `policy.default-deny`, `policy.minimum-disclosure`, applicable roles/permissions; `data/common.json`: exact purpose/privacy records |
| Dependencies / fences | Depends on `STORY-P1-001`–`003`, `019`; grant names issuer/recipient/resources/fields/actions/purpose/start/expiry/onward/export/revocation; issuer cannot delegate more than current authority; ordinary grants never become `DEC-032` continuity release. |
| Migration / rollback / repair | Grant revisions/uses/revocations immutable; policy/relationship changes increment epoch; projection/cache repair uses current grant/policy/deletion watermark; rollback cannot revive expiry/revocation or expand scope. |
| Negative, failure, audit | Mixed-authority selection, over-broad/missing scope, hidden effective-access preview, guessed/reused guest capability, wrong audience/workspace/use, revoke mid-session/job/redemption/export, clock skew; audit exact safe scope IDs and history. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-001`, `TEST-CON-P1-006`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-006`, `TEST-SEC-P1-008`, `TEST-E2E-P1-009`, `TEST-E2E-P1-011`, `TEST-E2E-P1-013`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-002`, `TEST-DR-P1-008`, `TEST-UNIT-P1-011`, `TEST-SEC-P1-016`, `TEST-SEC-P1-017`, `TEST-E2E-P1-021`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-039-01` — **Given** an issuer with delegation authority for an exact scope, **when** a grant is reviewed and issued, **then** the preview and immutable grant match recipient/resources/fields/actions/purpose/time/onward/export limits without hidden expansion.
- `AC-STORY-P1-039-02` — **Given** expiry/revocation, changed issuer authority, wrong audience/workspace/use, or mid-flow policy change, **when** access/result/redemption occurs, **then** current policy denies it and downstream consumers converge without existence leakage.

### `STORY-P1-040` — Fence managed-dependant authority transition without losing provenance

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; fail-closed Phase 1 fence; richer transfer deferred by DEC-P1-056`; Product + Identity/Privacy |
| Product | `REQ-P1-WS-007`; `FEAT-P1-025`; `UC-P1-015`; `OUT-P1-005`, `OUT-P1-006`; `DEC-P1-056` |
| UX / accessibility | `UX-FLOW-P1-002`, `030`; `UX-SCR-P1-006`, `045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `043`–`056`, especially `047`, `049` |
| API / events | Adjacent subject/membership operations `API-P1-104`–`111` and `EVT-P1-002`, `003` remain governed by the transition fence. `DEC-P1-056` intentionally requires no independent-transfer endpoint in Phase 1; any later endpoint is a governed extension. |
| Security | `AUTH-P1-001`–`007`, `012`, `016`–`025`, `032`, `033`, `035`; `SEC-P1-001`–`007`, `017`, `018`, `025`, `026`; `PRIV-P1-001`–`007`, `019`, `023`–`026`; `AUD-P1-001`–`010`, `024`, `027`; `THR-P1-001`–`006`, `009`, `014`, `020`, `025` |
| NFR / DIT / AI | `NFR-P1-002`–`006`, `008`, `013`, `016`, `022`–`029`, `032`, `033`, `036`, `041`–`043`; no DIT/AI authority; `DIT-FCT-P1-018`–`024` may preserve subject/entity provenance only |
| Reference data | `data/access-control.json` default-deny, role and action records are the complete Phase 1 fence. `DEC-P1-056` intentionally defers a richer transition-policy catalogue to a later governed capability. |
| Dependencies / fences | Depends on `STORY-P1-002`, `003`, `039`; Phase 1 permits no independent access-transfer semantics. Relationship, maturity, invitation, support, partial state or uncertainty never transfers credentials, ownership, grants, inherited rights, delegation chains or content. |
| Migration / rollback / repair | Stable subject identity and prior authority/evidence history survive every attempt. A transition attempt has an explicit revisioned state and atomic deny/commit boundary; interrupted/ambiguous/partial work recovers to the last authorised state, invalidates stale permission projections and recalculates current authority before any response. |
| Negative, failure, audit | Premature/false age/event, family-admin assertion, identity mismatch, missing consent/evidence, partial apply, retry, rollback, stale projection, private-resource expansion, support/recovery bypass and concurrent policy/grant change all fail closed. Audit records safe state, policy/version, actor, outcome, recovery and recalculation evidence without sensitive content. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-001`, `TEST-CON-P1-006`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-008`, `TEST-E2E-P1-015`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-007`, `TEST-DR-P1-008`; DRAFT disabled-boundary cases require execution/accessibility evidence. |

- `AC-STORY-P1-040-01` — **Given** a managed dependant, **when** age, relationship, invitation, identity-link, membership, support, or asserted consent changes, **then** the explicit Phase 1 transition state and audit show no independent transfer and no ownership, credential, key, grant, inherited, delegated, export, or private-resource authority broadens.
- `AC-STORY-P1-040-02` — **Given** an incomplete, ambiguous, failed, retried, rolled-back, stale, concurrent, or partially applied transition attempt, **when** authority is evaluated, **then** the attempt converges to the last authorised state, subject/provenance remain intact, permission projections are invalidated and recalculated, and independent negative evidence proves fail-closed behaviour.

### `STORY-P1-041` — Preserve disabled connector consent and conformance boundaries

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; adapter work authorised; provider activation gated`; Integration + Security/Privacy |
| Product | `REQ-P1-ING-009`, `REQ-P1-TRUST-009`; `FEAT-P1-026`; `UC-P1-014`; `OUT-P1-001`, `OUT-P1-006`, `OUT-P1-007`; **`TRACE-GAP-P1-UC-001`** |
| UX / accessibility | No enabled connector setup flow; safe unavailable/settings boundary `UX-SCR-P1-030`, `033`–`045`; `A11Y-P1-002`–`005`, `021`–`028`, `043`–`056` |
| API / events | `API-P1-177`–`180` are disabled; no connector event family exists: **`TRACE-GAP-P1-EVT-001`**; API fence rules `API-P1-046`–`052` |
| Security | `AUTH-P1-001`–`007`, `019`–`025`, `029`, `034`, `035`; `SEC-P1-001`, `002`, `006`, `007`, `017`–`019`, `022`, `027`–`029`; `PRIV-P1-001`, `004`, `005`–`009`, `011`–`017`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `023`, `027`, `029`; `THR-P1-003`, `005`–`007`, `009`, `011`, `018`, `019`, `023`, `024`, `026`, `027` |
| NFR / DIT / AI | `NFR-P1-004`–`006`, `013`–`018`, `022`–`030`, `033`, `036`, `039`, `041`–`043`; no owning DIT/AI rule; connector behavior is governed by `CON-P1-001`–`035` and provider-neutral port/residency contracts |
| Reference data | No connector-profile catalogue exists: **`TRACE-GAP-P1-REF-002`**; `DEC-031`/`045`/`055` permit disabled-first adapters and registrations, but no endpoint/token seed may be inferred from other packs. |
| Dependencies / fences | Requires approved connector routes/scope, purpose/consent, external identity/version/permissions, cursor, callback, retention/deletion, revocation/disconnect, residency/processor, action semantics, notification, conformance, and tests; documentation is not enablement. |
| Migration / rollback / repair | Future connector versions/cursors/external IDs immutable/namespaced; disconnect fences new work; resync/replay creates attempt lineage and honors tombstones; token/consent rotation cannot resurrect deleted/revoked scope. |
| Negative, failure, audit | Today every create/sync/disconnect route is disabled. Future suite covers token theft, over-scope, permission drift, spoof/replay, partial sync, cursor rollback, withdraw mid-job, late callback, deletion/resync resurrection, ineligible route; safe audit by references. |
| Future TEST | `TEST-UNIT-P1-010`, `TEST-CON-P1-005`, `TEST-CON-P1-012`, `TEST-SEC-P1-010`, `TEST-SEC-P1-013`–`TEST-SEC-P1-015`, `TEST-E2E-P1-014`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-PERF-P1-008`, `TEST-DR-P1-008`, `TEST-SEC-P1-018`; DRAFT disabled-boundary cases require execution evidence. |

- `AC-STORY-P1-041-01` — **Given** an exact provider has not passed approved `DEC-031`, `DEC-045`, `DEC-049`, and `DEC-055` activation evidence, **when** any connector creation, sync, action, callback, or credential path is invoked, **then** it remains disabled/fails closed without token, external request, household disclosure, or inferred launch scope.
- `AC-STORY-P1-041-02` — **Given** a future approved connector, **when** conformance is assessed, **then** consent/scope/external version/cursor/permissions/revocation/deletion/partial failure/residency evidence must all pass before enablement.

### `STORY-P1-042` — Apply notification preferences while external channels stay disabled

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; in-app required; customer external channels activation-gated`; Product Workflow + UX/Privacy |
| Product | `REQ-P1-NTF-004`; `FEAT-P1-027`; `UC-P1-010`; `OUT-P1-004`, `OUT-P1-005`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-013`, `028`; `UX-SCR-P1-025`, `030`, `043`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `042`–`056` |
| API / events | `API-P1-165`–`168`; `API-P1-169` is disabled; no notification delivery/preference event: **`TRACE-GAP-P1-EVT-002`**; `API-P1-047`–`052` |
| Security | `AUTH-P1-001`–`012`, `019`–`025`, `029`, `035`; `SEC-P1-017`–`019`, `022`, `029`; `PRIV-P1-001`, `004`–`009`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `019`, `023`, `027`, `029`; `THR-P1-005`–`007`, `011`, `018`, `019`, `024`, `026`, `027` |
| NFR / DIT / AI | `NFR-P1-001`–`008`, `013`, `016`, `022`–`030`, `033`, `036`, `039`, `041`–`043`; no owning DIT/AI rule; canonical task/cause behavior remains in `DIT-HLT-P1-007`–`036` and `DIT-IMP-P1-034`–`044` |
| Reference data | `data/notifications.json`: `channel.IN_APP` is proposed baseline; `channel.EMAIL`, `channel.PUSH` remain disabled; synthetic templates are not production message approval. |
| Dependencies / fences | Depends on `STORY-P1-036`, `038`; channel, category, privacy/content policy, consent, quiet/escalation/delivery success remain separate; external failure never changes task/action/fulfilment. The framework Product Authority ACS adapter under Issue #18 is a governance control-plane channel and supplies no completion evidence for this customer notification story. |
| Migration / rollback / repair | Preference revisions/delivery attempts/dedup IDs preserved; template/channel versions immutable; rollback does not resend or mark delivered; late/out-of-order delivery checks current authorization/cause; disabling channel cancels future dispatch. |
| Negative, failure, audit | Hidden badge/cause, preference bypass, duplicate/out-of-order, revoked/expired cause, external content leak, invalid destination/consent/route, quiet/escalation invention; external routes disabled; safe audit state/attempt/template IDs only. |
| Future TEST | `TEST-CON-P1-005`, `TEST-CON-P1-012`, `TEST-SEC-P1-002`, `TEST-SEC-P1-012`, `TEST-SEC-P1-013`, `TEST-SEC-P1-015`, `TEST-E2E-P1-010`, `TEST-PERF-P1-001`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-DR-P1-002`, `TEST-DR-P1-008`, `TEST-SEC-P1-018`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-042-01` — **Given** current in-app preferences and an authorized cause, **when** a notification is created/acknowledged/dismissed, **then** canonical state and task causality remain separate, deduplicated, accessible, and privacy-safe.
- `AC-STORY-P1-042-02` — **Given** a customer channel is not activated under approved `DEC-037`, `DEC-045`, and the current route policy, or consent/current authority is absent, **when** email/push/other external delivery is requested, **then** no dispatch or success/escalation claim occurs.

### `STORY-P1-043` — Show item-level health while aggregate scoring stays absent

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; item-level findings required; aggregate scoring intentionally unavailable`; Product + UX/AI Assurance |
| Product | `REQ-P1-HLT-004`; `FEAT-P1-028`; `UC-P1-008`; `OUT-P1-001`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-012`, `027`; `UX-SCR-P1-024`, `042`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `042`–`056` |
| API / events | `API-P1-183` is disabled; no readiness event exists and `EVT-P1-032` explicitly is not readiness; `API-P1-051`, `052` |
| Security | `AUTH-P1-001`–`011`, `019`–`025`, `035`; `SEC-P1-017`–`019`, `029`; `PRIV-P1-001`, `004`, `020`–`022`; `AUD-P1-001`–`008`, `019`, `027`; `THR-P1-005`, `006`, `019`, `026`, `030` |
| NFR / DIT / AI | `NFR-P1-005`, `007`, `013`, `016`–`025`, `033`, `036`, `041`–`045`; `DIT-HLT-P1-024`–`036`; `AI-GRD-P1-015`, `AI-OUT-P1-020`, `AI-RAG-P1-019`, `AI-EVAL-P1-035` |
| Reference data | No score/weight/threshold/denominator record exists by design; exact item-level health/disposition/fulfilment states in `data/states-and-severity.json` remain usable; **`TRACE-GAP-P1-REF-004` is an intentional absence, not a seed to invent.** |
| Dependencies / fences | Depends on `STORY-P1-034`, `035`; no score, percentage, traffic light, rank, trend, denominator, tile, analytics segment, notification priority, search ordering, accessibility label, or CSS-only hidden score. |
| Migration / rollback / repair | No aggregate projection may be created/activated. Future approved design needs versioned formula/inputs/coverage/permission-safe denominator/evaluation/migration and new story/API/event/reference/test contracts; removing experiment purges derivatives. |
| Negative, failure, audit | Search/UI/API/analytics/notification/a11y/source code scan for hidden score/rank; mixed permissions cannot alter disclosed denominator; item states remain separate; audit no score. |
| Future TEST | `TEST-UNIT-P1-009`, `TEST-UNIT-P1-010`, `TEST-CON-P1-005`, `TEST-CON-P1-008`, `TEST-CON-P1-009`, `TEST-AI-P1-004`, `TEST-AI-P1-014`, `TEST-AI-P1-015`, `TEST-SEC-P1-002`, `TEST-SEC-P1-004`, `TEST-SEC-P1-012`, `TEST-E2E-P1-008`, `TEST-PERF-P1-007`, `TEST-PERF-P1-010`, `TEST-DR-P1-005`, `TEST-DR-P1-008`; DRAFT disabled-boundary cases require execution/accessibility evidence. |

- `AC-STORY-P1-043-01` — **Given** approved `DEC-034`, **when** health is displayed or used downstream, **then** only authorized explainable item-level signals appear and no aggregate/hidden score or compliance/risk guarantee exists.
- `AC-STORY-P1-043-02` — **Given** a request to enable, order, notify, segment, style, or label by readiness, **when** no approved scoring contract exists, **then** the operation remains disabled and produces no score derivative.

### `STORY-P1-044` — Export a declared authorized versioned envelope

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; approved envelope`; Product + Privacy/Platform |
| Product | `REQ-P1-TRUST-006`; `FEAT-P1-029`; `UC-P1-011`; `OUT-P1-006`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-015`, `029`; `UX-SCR-P1-028`, `044`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`056`, especially `042`, `049` |
| API / events | `API-P1-170`–`172` are decision-fenced; `EVT-P1-027`; `API-P1-010`–`020`, `027`–`038`, `041`, `042`, `047`–`052` |
| Security | `AUTH-P1-001`–`007`, `012`, `015`, `018`–`025`, `029`, `034`, `035`; `SEC-P1-009`, `012`, `015`, `017`–`019`, `027`–`029`; `PRIV-P1-001`, `004`, `011`, `015`–`020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `020`, `027`, `029`; `THR-P1-003`, `005`, `006`, `008`, `011`, `014`, `019`, `022`–`024`, `026`, `027` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `010`, `013`–`018`, `022`–`031`, `033`, `035`, `036`, `039`, `041`–`043`; every included DIT/AI record keeps owning schema/version/provenance; no model generates authority or missing content |
| Reference data | Export includes only exact authorized records from active contracts; `data/access-control.json`: `action.export`; manifests declare pack/schema/config IDs; DRAFT seeds are labelled and not public coverage. |
| Dependencies / fences | Depends on `STORY-P1-003`, `007`, `019`, `039`; request/enumeration/generation/release/redemption each reauthorize; manifest lists included/excluded/error classes, checksums, envelope version, rights/limitations; no complete claim beyond `DEC-033`. |
| Migration / rollback / repair | Export case/manifest/package immutable by attempt; partial class failure retried/repaired without changing successful bytes silently; old envelope decoder retained; temporary artifacts cleaned; rollback cannot release old/revoked package. |
| Negative, failure, audit | Cross-workspace/private/third-party inclusion, silent omission, mid-job revoke/delete, wrong route, corrupt/checksum mismatch, temp URL leak, retry duplicate, partial falsely complete; audit request/scope/manifest/errors/release/redemption/deletion without package content. |
| Future TEST | `TEST-UNIT-P1-003`, `TEST-UNIT-P1-010`, `TEST-CON-P1-005`, `TEST-CON-P1-008`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-006`, `TEST-SEC-P1-012`, `TEST-SEC-P1-014`, `TEST-SEC-P1-015`, `TEST-E2E-P1-011`, `TEST-PERF-P1-001`, `TEST-PERF-P1-002`, `TEST-PERF-P1-006`, `TEST-PERF-P1-008`, `TEST-DR-P1-001`, `TEST-DR-P1-002`, `TEST-DR-P1-006`, `TEST-DR-P1-008`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-044-01` — **Given** an authorized export request, **when** generation completes or partially fails, **then** the signed manifest declares exact envelope version/categories/omissions/errors/checksums/limitations and never overclaims completeness.
- `AC-STORY-P1-044-02` — **Given** authorization/deletion/route changes, integrity failure, or expired/wrong-audience release, **when** generation or redemption occurs, **then** no protected package is released and repair/audit remain truthful.

### `STORY-P1-045` — Execute deletion as a fenced, verified, non-resurrecting case

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; 30-day Trash and coordinated purge approved`; Privacy + Platform/Operations |
| Product | `REQ-P1-TRUST-007`; `FEAT-P1-029`; `UC-P1-012`; `OUT-P1-006`, `OUT-P1-007` |
| UX / accessibility | `UX-FLOW-P1-016`, `029`; `UX-SCR-P1-029`, `044`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`056`, especially `042`, `049` |
| API / events | `API-P1-124`, `173`–`175` are decision-fenced; `EVT-P1-011`, `028`–`030`; `API-P1-027`–`038`, `047`–`052` |
| Security | `AUTH-P1-001`–`007`, `012`, `015`, `019`–`025`, `029`, `034`, `035`; `SEC-P1-009`, `012`, `017`–`019`, `027`–`029`; `PRIV-P1-001`, `004`, `011`–`017`, `020`, `022`, `027`, `028`; `AUD-P1-001`–`008`, `021`, `026`–`029`; `THR-P1-003`, `005`, `006`, `008`, `009`, `011`, `019`, `023`, `024`, `026`, `027`, `029` |
| NFR / DIT / AI | `NFR-P1-003`–`006`, `008`, `013`, `016`–`018`, `022`–`031`, `033`, `035`, `036`, `039`, `041`–`043`; `DIT-VER-P1-032`–`042` plus deletion rules of every owning DIT/AI contract |
| Reference data | `data/access-control.json`: `action.trash`, `action.restore`, `action.purge`; deletion/fence states in `data/states-and-severity.json`; the 30-calendar-day document Trash boundary comes from `DEC-053`; account deletion and lawful-retention values remain separate release contracts. |
| Dependencies / fences | Depends on all state-owning stories; archive/trash/restore/account deletion/resource purge/retention exception/active completion/backup expiry/audit minimization remain distinct; durable fence precedes acceptance; per-class verification/residuals. |
| Migration / rollback / repair | Deletion plan/generation/tombstone/purge acknowledgements immutable; late events/replay/rebuild/resync/restore consult fence; partial failure stays inaccessible and repairable; rollback cannot cross irreversible boundary or resurrect data. |
| Negative, failure, audit | Wrong delete/export/read authority, stale target/revision, hidden affected party, cancel race, worker/connector/backup miss, late callback/event, restore/resync resurrection, audit over-retention, route failure; no invented durations/false completion. |
| Future TEST | `TEST-UNIT-P1-004`, `TEST-UNIT-P1-010`, `TEST-CON-P1-005`, `TEST-CON-P1-007`, `TEST-CON-P1-008`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-007`, `TEST-SEC-P1-012`, `TEST-SEC-P1-014`, `TEST-SEC-P1-015`, `TEST-E2E-P1-012`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-PERF-P1-008`, `TEST-PERF-P1-009`, `TEST-DR-P1-001`–`TEST-DR-P1-006`, `TEST-DR-P1-008`, `TEST-UNIT-P1-011`, `TEST-UNIT-P1-012`, `TEST-SEC-P1-016`, `TEST-SEC-P1-017`, `TEST-E2E-P1-021`; DRAFT cases require execution/accessibility evidence. |

- `AC-STORY-P1-045-01` — **Given** an authorized exact deletion target, **when** the case is accepted, **then** a durable fence immediately denies access/work and per-class execution/verification/residual states are reconstructable.
- `AC-STORY-P1-045-02` — **Given** partial failure, late event/callback, rebuild/resync/restore, or an overdue `DEC-053` purge, **when** deletion status is evaluated, **then** data remains inaccessible/non-resurrected, repair remains explicit, and the 30-calendar-day Trash boundary is reported truthfully.

### `STORY-P1-046` — Enforce the Australian-residency option at every processing route

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; Azure/device-local build routes approved; production processor matrix release-gated`; Architecture + Security/Privacy/Operations |
| Product | `REQ-P1-TRUST-005`; `FEAT-P1-030`; `UC-P1-011`–`013`; `OUT-P1-001`, `OUT-P1-006`, `OUT-P1-007` |
| UX / accessibility | Platform policy; user-visible safe blocked/degraded state across affected flows and `UX-SCR-P1-030`, `033`–`045`; `A11Y-P1-002`–`005`, `021`–`028`, `043`–`056` |
| API / events | Cross-cutting route context on every processor/export/deletion operation; no dedicated residency API/event; `API-P1-049`, `051`, `052`; **`TRACE-GAP-P1-API-014`** documents required route-policy evidence. |
| Security | `AUTH-P1-001`–`007`, `019`–`025`, `029`, `034`, `035`; `SEC-P1-008`–`011`, `017`–`023`, `027`–`030`; `PRIV-P1-001`, `005`–`009`, `011`, `018`, `020`–`022`, `027`–`029`; `AUD-P1-001`–`008`, `023`, `024`, `027`, `029`; `THR-P1-003`, `007`, `016`–`020`, `022`–`024`, `027`–`029` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `006`, `013`–`018`, `022`–`031`, `033`, `036`, `038`–`043`, `044`; no owning DIT rule—every DIT/AI/provider port consumes the current data-class/processor/region decision |
| Reference data | `data/jurisdictions.json`: `jurisdiction.AU`; `data/common.json`: privacy/purpose classes; no approved processor/region/exception matrix exists: **`TRACE-GAP-P1-REF-005`**. |
| Dependencies / fences | Applies to primary/derived/search/vector/graph/AI/OCR/scanner/source/telemetry/support/analytics/connector/export/backup/DR/failover routes; consent cannot cure an unapproved route; provider/location not selected or claimed. |
| Migration / rollback / repair | Route-policy/config versions immutable; placement migration needs classified inventory, copy/verify/cutover/delete evidence and denial during uncertainty; restore/failover re-evaluates route; rollback cannot reintroduce ineligible copies. |
| Negative, failure, audit | Unknown/missing/mismatched route, cross-border adapter/support/telemetry/backup/DR, expired exception, consent misuse, failover pressure, provider error; block/degrade, preserve content-free placement/egress/audit evidence, initiate incident/repair. |
| Future TEST | `TEST-UNIT-P1-010`, `TEST-CON-P1-005`, `TEST-CON-P1-012`, `TEST-SEC-P1-010`–`TEST-SEC-P1-015`, `TEST-E2E-P1-013`, `TEST-E2E-P1-014`, `TEST-E2E-P1-020`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-PERF-P1-008`–`TEST-PERF-P1-010`, `TEST-DR-P1-004`, `TEST-DR-P1-006`, `TEST-DR-P1-008`, `TEST-CON-P1-014`, `TEST-SEC-P1-018`, `TEST-SEC-P1-019`, `TEST-E2E-P1-023`; DRAFT blocked-route cases require execution/accessibility evidence. |

- `AC-STORY-P1-046-01` — **Given** the Australian-residency option and an unknown/ineligible route, **when** any household data processing/export/backup/support/failover is attempted, **then** it fails closed before egress and records privacy-safe policy evidence.
- `AC-STORY-P1-046-02` — **Given** a future approved matrix/version, **when** placement, restore, migration, or processor routing occurs, **then** every data class/route is verified against that exact matrix and no consent/default silently expands it.

### `STORY-P1-047` — Keep account/workspace recovery and ownership transfer unavailable

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; intentionally unavailable under DEC-038`; Security + Product |
| Product | `REQ-P1-TRUST-008`; `FEAT-P1-030`; `UC-P1-017`; `OUT-P1-001`, `OUT-P1-006`, `OUT-P1-007`; **`TRACE-GAP-P1-UC-001`** |
| UX / accessibility | `UX-FLOW-P1-017`, `030`; `UX-SCR-P1-001`, `031`, `045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `043`–`056`, especially `047` |
| API / events | `API-P1-181` is disabled; no recovery event exists; `API-P1-051`, `052`; **`TRACE-GAP-P1-EVT-003`** |
| Security | `AUTH-P1-001`–`007`, `019`–`027`, `032`, `035`; `SEC-P1-003`–`007`, `017`, `018`, `025`, `026`, `029`; `PRIV-P1-001`–`005`, `020`, `022`, `025`, `026`; `AUD-P1-001`–`009`, `024`, `027`; `THR-P1-001`–`007`, `009`, `019`, `020`, `029` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `006`, `022`–`029`, `032`, `033`, `036`–`043`; no DIT/AI role; a model/document/family/support assertion cannot provide recovery authority |
| Reference data | No recovery/ownership-transfer activation records exist by design: **`TRACE-GAP-P1-REF-006`**; current access-control `policy.default-deny` applies. |
| Dependencies / fences | Recovery assurance, delay, challenge, factors/keys, ownership/private-resource/grants, support, abuse, notice/appeal, residency, audit, accessibility, and tests must be approved before any success route; safe support never browses content. |
| Migration / rollback / repair | No recovery aggregate/state or hidden operator override is enabled. Future design requires explicit migrations and preserved attempt/ownership history; migration cannot infer ownership or weaken keys/factors/private-resource policy. |
| Negative, failure, audit | Lost factor/device, alleged family/owner, identity lookup, evidence upload, support override, email/relationship bypass, factor/key transfer, enumeration/timing; all denied generically and audited without soliciting sensitive proof. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-005`, `TEST-SEC-P1-001`, `TEST-SEC-P1-007`, `TEST-SEC-P1-008`, `TEST-SEC-P1-011`, `TEST-E2E-P1-017`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-DR-P1-004`, `TEST-DR-P1-007`, `TEST-DR-P1-008`; DRAFT disabled-boundary cases require execution/accessibility evidence. |

- `AC-STORY-P1-047-01` — **Given** the approved `DEC-038` no-recovery boundary, **when** a user/support/family actor attempts recovery, factor/key reset, ownership transfer, or private-resource reassignment, **then** no success or evidence-upload route exists and workspace/account existence remains protected.
- `AC-STORY-P1-047-02` — **Given** the safe unavailable screen, **when** it is used by keyboard/screen reader or under repeated abuse, **then** approved sign-in/support guidance remains accessible without leaking state, soliciting sensitive proof, or weakening rate/security controls.

### `STORY-P1-048` — Keep automated emergency/incapacity/after-death release unavailable

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; intentionally unavailable under DEC-032`; Product + Security/Privacy |
| Product | `REQ-P1-SHR-004`; `FEAT-P1-025`; `UC-P1-016`; `OUT-P1-005`, `OUT-P1-006`; **`TRACE-GAP-P1-UC-001`** |
| UX / accessibility | `UX-FLOW-P1-018`, `030`; `UX-SCR-P1-032`, `045`; `UX-DS-P1-001`–`040`; `A11Y-P1-001`–`035`, `043`–`056`, especially `049` |
| API / events | `API-P1-182` is disabled; no continuity event exists; `API-P1-051`, `052`; **`TRACE-GAP-P1-EVT-003`** |
| Security | `AUTH-P1-001`–`007`, `016`–`025`, `033`, `035`; `SEC-P1-015`, `017`, `018`, `025`, `026`, `029`; `PRIV-P1-001`–`007`, `020`, `022`–`024`, `026`; `AUD-P1-001`–`010`, `024`, `027`; `THR-P1-003`–`006`, `009`, `014`, `019`, `020`, `025`, `026` |
| NFR / DIT / AI | `NFR-P1-002`, `005`, `006`, `016`, `022`–`029`, `033`, `036`–`043`; no DIT/AI authority; event/model/document/relationship evidence cannot trigger release |
| Reference data | No continuity trigger/nominee/evidence/delay/challenge/release policy exists by design: **`TRACE-GAP-P1-REF-006`**; ordinary grants/exports use only current exact access-control records. |
| Dependencies / fences | Ordinary scoped grants (`STORY-P1-039`) and owner-created declared exports (`044`) remain separate. Future release needs evidence, consent, scope, delay, challenge, notice, revocation, jurisdiction, false-trigger recovery, key/private-resource, appeal, audit, abuse, accessibility contracts. |
| Migration / rollback / repair | No enrolment/nominee/trigger/timer/release state is enabled. Future migration cannot reinterpret ordinary relationships/grants/tasks as continuity authority; false-trigger repair/appeal must preserve evidence without disclosure. |
| Negative, failure, audit | Alleged death/incapacity/emergency, forged source/event, family/support/nominee role, old consent/grant, hidden trigger route, timer, notification, automatic export; all produce no release and no affected-workspace/content disclosure. |
| Future TEST | `TEST-UNIT-P1-002`, `TEST-CON-P1-005`, `TEST-SEC-P1-001`, `TEST-SEC-P1-002`, `TEST-SEC-P1-006`, `TEST-SEC-P1-007`, `TEST-SEC-P1-008`, `TEST-SEC-P1-013`, `TEST-E2E-P1-009`, `TEST-E2E-P1-016`, `TEST-PERF-P1-001`, `TEST-PERF-P1-006`, `TEST-DR-P1-007`, `TEST-DR-P1-008`; DRAFT disabled-boundary cases require execution/accessibility evidence. |

- `AC-STORY-P1-048-01` — **Given** approved `DEC-032`, **when** any event/actor asserts emergency, incapacity, or death, **then** no enrolment, nominee, timer, export, grant change, notification, or protected-content release is created.
- `AC-STORY-P1-048-02` — **Given** the continuity information screen, **when** an authorized current user views it, **then** it explains the unavailable boundary and ordinary sharing/export alternatives without implying a trigger, guarantee, or future automatic release.

## 6. Cross-slice public product entry

### `STORY-P1-049` — Present truthful public product, trust, legal-preview, and account-entry routes

| Field | Contract |
|---|---|
| State / owner | `BASELINED — PLANNED_UNISSUED; partial preview evidence exists`; Product + UX/Accessibility + Security/Privacy |
| Product | `REQ-P1-PLT-001`, `REQ-P1-PLT-003`, `REQ-P1-ASSURE-001`; `FEAT-P1-031`; `UC-P1-020`; `OUT-P1-001`, `OUT-P1-007`; `DEC-044`, `DEC-047`, `DEC-048` |
| UX / accessibility | `UX-FLOW-P1-031`; `UX-SCR-P1-046`, `UX-SCR-P1-047`; approved Doculyra identity; applicable `UX-DS-P1-*` and `A11Y-P1-*` public/onboarding criteria |
| API / events | Public React routes `/`, `/privacy`, `/terms`, `/app?mode=register`, `/app?mode=login`; no customer-data API or external-provider activation is implied |
| Security | Current public/synthetic environment disclosure; no workspace enumeration, customer content, credential, secret, unsupported assurance claim, or simulated provider success; privacy-safe analytics only |
| NFR / DIT / AI | Responsive/accessible public route behavior; AI copy distinguishes evidence-aware assistance from authority and does not claim production model availability or complete coverage |
| Reference data | Approved Doculyra/Doculyra Home naming and mark under `DEC-047`; production legal entity, address, contact/domain, launch coverage, and final legal review remain release inputs rather than hard-coded assumptions |
| Dependencies / fences | Existing preview evidence is `src/apps/web/src/Marketing.tsx`, `Legal.tsx`, `Brand.tsx`, and `Marketing.test.tsx`; `DEC-054` authorizes synthetic dev/stage only; public production, DNS, real-data processing, and legal approval remain gated |
| Migration / rollback / repair | Public routes and links remain backward-compatible; withdrawn or corrected claims retain review history; rollback cannot restore disproven or unapproved claims |
| Negative, failure, audit | Direct-route refresh, missing contact configuration, keyboard/mobile-menu/focus/reflow, disabled providers, synthetic preview labelling, legal-route availability, unsupported product/security/AI/legal claims, and absence of customer-data disclosure |
| Future TEST | `TEST-CON-P1-015`, `TEST-SEC-P1-020`, `TEST-E2E-P1-024`; DRAFT cases require independent accessibility, claim, privacy, and route evidence. |

- `AC-STORY-P1-049-01` — **Given** a signed-out visitor, **when** the public experience is opened on a supported viewport or direct route, **then** approved Doculyra product, feature, trust, about, contact and account-entry content is accessible, correctly branded, and routes to governed sign-in or registration while labelling illustrative/synthetic preview state truthfully.
- `AC-STORY-P1-049-02` — **Given** privacy, terms, contact, provider, AI, security, coverage, or environment information is unavailable or release-gated, **when** the visitor navigates by pointer, keyboard or assistive technology, **then** direct legal routes and safe alternatives remain usable without customer-data disclosure, simulated success, inaccessible focus/reflow, or unsupported production, assurance, advice, or legal claim.

## 7. Cross-story implementation rules

1. Every story inherits `ENG-CODE-P1-001`–`016`, `030`–`036`; `ENG-TST-P1-001`–`009`, `012`–`020`, `029`, `035`–`042`; `OPS-CICD-P1-001`–`030`; and `OPS-OBS-P1-001`–`030`. Mutable/async work also inherits `ENG-CODE-P1-020`–`027`, `ENG-ERR-P1-004`–`038`, `ENG-TST-P1-021`–`028`, `OPS-DEP-P1-015`–`031`.
2. These engineering/operations rules are specification obligations, not existing implementation tests or deployment evidence.
3. A story referencing a DRAFT/disabled/synthetic record cannot enable it by coding a default. Activation requires `STORY-P1-037` plus approved decision, package, consumer, migration, test, and release evidence.
4. An API/event/reference/product gap must close in its owning artifact before the affected story becomes `READY`; this backlog cannot create a second wire/domain contract.
5. Story completion never overrides the universal slice exit/stop-ship gates in `BLG-REL-001`.
