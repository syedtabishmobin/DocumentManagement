# Phase 1 Proposed Release Plan

| Field | Value |
|---|---|
| Document ID | `BLG-REL-001` |
| Version | `0.2` |
| Status | **APPROVED CONTINUOUS PHASE 1 BUILD — dev/stage deployment authorized; production promotion remains gated** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |

## 1. Release stance

This plan sequences specification-backed vertical slices. It sets no calendar dates, staffing commitments, public-launch claim, service-level agreement, or production authorization. Azure and the client platforms are selected by `DEC-049`/`052`; slice completion means its approved scope and evidence gates pass together.

`DEC-030`, `DEC-041`, and `DEC-054` approve the complete sequence as one continuously authorized implementation program. Slice boundaries remain engineering checkpoints and do not require renewed product scope approval. Azure dev/stage deployments use synthetic/test data; production subscription provisioning, real customer data, public DNS, external providers, and store publication remain separately gated.

## 2. Proposed sequence

| Slice | User/service outcome | Primary stories | Entry gate | Exit gate |
|---|---|---|---|---|
| `P1-S1` — Secure household vault | An eligible household can establish an isolated workspace, capture through required routes, preserve exact originals, inspect durable status, and operate under current authorization/audit/configuration. | `STORY-P1-001`–`010` | PRD/slice baseline approved; identity/auth/security/privacy/audit architecture accepted; required capture routes and safe `DEC-035`/`036` boundary approved or explicitly synthetic-only; route eligibility known. | S1 functional, negative-auth/privacy, immutable-original, idempotency/retry, quarantine, configuration, accessibility, migration/repair, NFR, audit, and telemetry gates pass; no open decision is silently activated. |
| `P1-S2` — Understand and retrieve | Authorized users can inspect document history/evidence, resolve facts/conflicts/dependencies, search, compare, and receive cited limited answers. | `STORY-P1-011`–`025` | S1 exit; evidence/fact/graph/search/AI schemas and proposed ADRs approved; enabled type/schema/capability/processor routes known; evaluation fixtures and gates approved. | Exact citation redemption and current authorization pass across document/fact/edge/search/AI; bitemporal/history/reprocessing integrity pass; AI safety/quality/cost/accessibility and degraded states pass. |
| `P1-S3` — Monitor and close the loop | Governed observations detect change, establish applicability/impact, support bound approval/action, verify closure, explain evidence health, and coordinate in-app work. | `STORY-P1-026`–`038` | S2 exit; source/rule/profile pack approved under `DEC-035`; monitoring/action ports, approval authorities, configuration publication, and source/residency routes approved. | Source health and coverage truthfulness, replay/dedup, applicability/impact, stale approval, action unknown/partial/reconcile, evidence closure, health alternatives, task/in-app accessibility, and audit/operations gates pass. |
| `P1-S4` — Family launch and portability | Households can share exact scopes, manage dependant boundaries, export declared data, use 30-day Trash/restore, and see truthful connector/channel/score/recovery/continuity/residency availability. | `STORY-P1-039`–`048` | S3 exit; ordinary sharing/export approved; `DEC-049`–`053` contracts implemented; still-open `DEC-031`–`038` routes retained as disabled/absence boundaries. | Grant/key-envelope revocation, export manifest/limitations, Trash/restore/final purge/resurrection, residency denial, dependant transition, decision-fence, accessibility, recovery/continuity non-bypass, and production operations evidence pass. |

`STORY-P1-026` belongs to the S3 sequence because its conformed current view is consumed by monitoring, but it remains in `EPIC-P1-004` because document evidence owns its semantics.

## 3. Universal slice entry gate

Before any slice is authorized for implementation, the accountable reviewers must record:

1. an approved PRD or explicitly approved bounded baseline and stable requirement/use-case/story/AC scope;
2. accepted applicable ADRs or an approved provider-neutral implementation constraint;
3. closed or safely deferred decisions with disabled routes and conformance tests;
4. approved API/event/schema/reference versions and no dangling or incompatible consumers;
5. exact applicable `TEST-UNIT/CON/AI/SEC/E2E/PERF/DR-P1-*` cases for every story AC, negative security/privacy path, failure/race/migration/accessibility/evaluation case, with the testing trace validator reporting no uncovered story;
6. synthetic fixture, data classification, consent, residency/processor, retention/deletion, audit, and evidence plans;
7. approved provisional NFR measurement populations/targets or an explicit non-production evidence boundary;
8. deterministic build, migration/compatibility, rollback/forward-repair, backup/restore, observability/incident, and ownership plans; and
9. no unresolved conflict against `APPROVED` decisions or normative contracts.

## 4. Universal slice exit gate

A slice exits only when:

- every included story AC passes against its mapped, approved `TEST-*` cases and required contract/evaluation suites;
- all changed API/event/reference/structured-output contracts validate and compatibility consumers are known;
- positive, negative, stale-policy, revocation, deletion, residency, retry/replay, concurrency, partial/unknown-effect, and restore cases pass where applicable;
- zero-tolerance authorization, privacy, original-integrity, clinical-boundary, audit, deletion-resurrection, residency, telemetry-leak, and unapproved-effect checks pass with no open critical/high residual risk;
- applicable `NFR-P1-*` measurement has representative, versioned evidence and provisional results are not presented as SLAs;
- critical UX journeys pass the `A11Y-P1-001`–`056` release contract, approved browser/assistive-technology matrix, and privacy parity;
- migration interruption, rollback eligibility, forward repair, projection rebuild, replay/DLQ, configuration rollback, backup/restore, and incident exercises pass for affected state;
- observed gaps, waivers, known limitations, disabled routes, coverage, freshness, and public claims are explicit and approved; and
- product, security/privacy, quality/accessibility, and delivery/operations authorities sign the exact candidate and evidence set.

Validator success alone is necessary specification evidence, not a slice exit.

## 5. Decision-dependent scope treatment

| Decision | Release treatment while unapproved | Stories |
|---|---|---|
| `DEC-030` | Keep slice order and launch plan DRAFT; do not allocate a committed release date from this document. | All |
| `DEC-031` | Connector configuration/conformance may be specified, but live inbound-email/cloud ingestion and external connector action remain unavailable. | `STORY-P1-041`; also action route in `STORY-P1-033` |
| `DEC-032` | Ordinary grants and curated exports remain separate; no automatic trigger/enrolment/release. | `STORY-P1-048`, boundary in `040` |
| `DEC-033` | Export declares exact envelope version/categories/omissions/third-party limits and cannot claim complete portability. | `STORY-P1-044` |
| `DEC-034` | Item-level explainable findings only; no aggregate score, percentage, rank, trend, traffic light, or hidden score use. | `STORY-P1-043` |
| `DEC-035` | DRAFT/disabled reference packs and `.invalid` sources remain synthetic; no public type/source/coverage claim. | `STORY-P1-010`, `013`, `027`, `028`, `034`, `037` |
| `DEC-036` | `POLICY_HOLD` prevents ordinary preview/extraction/search/graph/AI; no storage/disposition/timing promise. | `STORY-P1-005` |
| `DEC-037` | In-app state may proceed if approved; external channel adapters and delivery/escalation claims stay disabled. | `STORY-P1-042` |
| `DEC-038` | Recovery/ownership transfer/support override remain absent and tested as unavailable. | `STORY-P1-047` |
| `DEC-039` / `DEC-053` | `DEC-039` is superseded for documents: implement immediate deletion fence, 30-calendar-day Trash/restore, then final purge/crypto-shred and content-free evidence. | `STORY-P1-045` |
| `DEC-040` / `DEC-049` | `DEC-040` is superseded by the approved Azure Australian placement matrix; unknown/ineligible routes still block. | `STORY-P1-046` and all processor-using stories |
| `DEC-050` | Every document path uses customer-controlled client encryption; platform processing cannot add a plaintext fallback. | All document, AI, export, sharing and recovery stories |
| `DEC-052` | Critical journeys and semantics ship on React web and Flutter iOS/Android; a platform omission needs an explicit release exception. | All user-facing stories |
| `DEC-054` | IaC and complete Phase 1 implementation may proceed continuously; only synthetic/test data is allowed in the current dev/stage subscription. | All |

If a decision changes, the affected requirements, architecture/security/data/API/event/UX/reference data, stories/AC, tests, migration/compatibility, operations, and user-facing claims must be revised as one governed change. A feature flag, environment variable, or deployment choice cannot approve scope.

## 6. Migration, rollback, and repair gates by slice

| Slice | Required state-change evidence |
|---|---|
| `P1-S1` | Workspace/identity/membership/grant schema compatibility; original/artifact/version identity; ingestion/outbox idempotency; configuration activation rollback; no orphan owner/resource; secret/config rotation; safe empty/prior-version/interrupted migration. |
| `P1-S2` | Extraction generation coexistence; anchor stability; bitemporal correction; entity merge/split; graph rebuild/cycle/truncation; index/vector/projection authorization/deletion watermarks; retained decoders; AI capability/prompt/schema rollback without rewriting results. |
| `P1-S3` | Source snapshot/rule/config effective-time history; monitoring replay generation; change/impact/recommendation dedup; approval/effect digest staleness; action unknown/partial reconcile; requirement finding re-evaluation; task/notification repair. |
| `P1-S4` | Grant expiry/revocation projection; dependant transition fence; connector disconnect/cursor/late callback; export temporary artifact cleanup; deletion fences/purge acknowledgements/tombstones/restore non-resurrection; residency-route change; unavailable recovery/continuity state remains inert. |

Unsafe destructive rollback is rejected in favor of forward repair. State already observed externally or written as immutable evidence is never erased merely to make a deployment appear rolled back.

## 7. Promotion and launch claims

Promotion must satisfy `OPS-CICD-P1-001`–`030` and `OPS-DEP-P1-001`–`032` using the same verified artifact, compatible configuration/migrations, decision fences, and route eligibility. Production promotion also requires current recovery/restore, incident, security, privacy, accessibility, NFR, and cost evidence.

Public claims are limited to the approved, enabled, measured profile. They must disclose material source/type/schema/route/AI/monitoring/export limitations and never imply legal compliance, professional advice, complete detection, complete portability, account recovery availability, or an aggregate risk/readiness guarantee unless the owning decision and evidence explicitly permit it. The 30-day document Trash promise and Australian Azure placement may be claimed only after release evidence proves `DEC-049` and `DEC-053` end to end.

This plan grants complete Phase 1 implementation and Azure dev/stage deployment authority under `DEC-054`; it does not grant production launch authority.
