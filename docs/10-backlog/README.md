# Phase 1 Backlog and Traceability Index

| Field | Value |
|---|---|
| Document ID | `BLG-IDX-001` |
| Version | `0.2` |
| Status | **APPROVED CONTINUOUS IMPLEMENTATION PROGRAM — completion evidence remains gated** |
| Product phase | Phase 1 — Personal and Family |
| Sequence basis | `P1-S1`–`P1-S4`, approved as one continuous program by `DEC-030`, `DEC-041`, and `DEC-054` |
| Updated | 29 August 2026 |

## 1. Purpose and authority

This folder turns the Phase 1 specifications into testable implementation units, exposes traceability gaps, and records current implementation evidence. `DEC-041` and `DEC-054` authorize the complete personal/family implementation and synthetic Azure dev/stage deployment. This pack does not authorize production, real customer data, public launch, or external-provider activation.

The hierarchy in [`CODEX.md`](../../CODEX.md) applies. Current product-owner instruction, `APPROVED` decisions, accepted ADRs, normative machine-readable contracts, and product requirements outrank this backlog. The product baseline and implementation-shaping decisions are approved; many specialist documents, targets, reference packs, and evidence plans retain `DRAFT`, synthetic, disabled, or provisional status. Backlog wording cannot approve or activate them.

The four slices are coherent value increments, not folders or handover chapters:

| Slice | Proposed outcome | Backlog boundary |
|---|---|---|
| `P1-S1` | Secure household vault | Isolated workspace, identity/subject/membership separation, current authorization, safe capture, immutable custody, audit, and inert configuration. |
| `P1-S2` | Understand and retrieve | Reviewable extraction, evidence, facts, conflicts, dependencies, comparison, permission-aware search/Q&A, and controlled AI. |
| `P1-S3` | Monitor and close the loop | Governed sources/rules, monitoring, applicability, impact, recommendations, approval, action, evidence closure, health findings, and in-app work. |
| `P1-S4` | Family launch and portability | Scoped sharing, dependant boundaries, disabled connector/channel/score fences, export, deletion, residency, and explicit recovery/continuity absence. |

`DEC-030` and `DEC-041` approve the complete Phase 1 sequence as one continuous implementation program; slices remain evidence and engineering checkpoints rather than separate scope approvals.

## 2. Reading order

1. [`01-epics.md`](01-epics.md) — vertical outcome groups, story ranges, dependencies, and epic exit evidence.
2. [`02-features-and-stories.md`](02-features-and-stories.md) — implementation-sized stories, exact contract links, fences, failure/repair obligations, and Given/When/Then acceptance criteria.
3. [`03-release-plan.md`](03-release-plan.md) — proposed slice entry/exit gates, dependency order, evidence, stop-ship rules, and approval boundary.
4. [`04-traceability-matrix.md`](04-traceability-matrix.md) — coverage across requirements, features, use cases, downstream contracts, decisions, and absent test cases.
5. [`05-personal-family-implementation-status.md`](05-personal-family-implementation-status.md) — evidence-based comparison of the current application against all 48 stories and the remaining personal/family work.
6. [`06-personal-family-remaining-work.md`](06-personal-family-remaining-work.md) — prioritised checklist of every missing, incomplete, or intentionally unavailable personal/family workstream.

Before acting on any item, also read the [decision register](../00-context/decision-register.md), [Phase 1 PRD](../01-product/02-phase-1-prd.md), [feature catalogue](../01-product/03-feature-catalogue.md), [use-case catalogue](../01-product/04-use-case-catalogue.md), [architecture index](../02-architecture/README.md), [document-intelligence index](../03-document-intelligence/README.md), [AI index](../04-ai/README.md), [API index](../05-api/README.md), [security index](../06-security/README.md), [UX index](../07-ux/README.md), [engineering index](../08-engineering/README.md), [operations index](../09-devops/README.md), and [reference-data index](../11-reference-data/README.md).

## 3. Stable namespaces

| Namespace | Owner | Meaning |
|---|---|---|
| `EPIC-P1-###` | `BLG-EPIC-001` | Stable Phase 1 vertical epic identity. |
| `STORY-P1-###` | `BLG-STORY-001` | Stable, non-reusable implementation-candidate identity. |
| `AC-STORY-P1-###-##` | `BLG-STORY-001` | Story-specific, testable Given/When/Then outcome. |
| `TRACE-GAP-P1-*` | `BLG-TRACE-001` | Explicit missing, ambiguous, or blocked traceability evidence. |

An ID remains stable when wording or slice ordering changes. Retired IDs are recorded and never reassigned. Stories may move only with updated inbound/outbound traces and a recorded reason.

## 4. Status, ownership, and decision outcomes

Every story has one of these planning states:

| State | Meaning |
|---|---|
| `DRAFT` | The story contract is specified but still lacks some specialist detail or executed evidence. It may be implemented inside the approved program where no named safety gate blocks it. |
| `RELEASE GATED` | Implementation may proceed disabled-first, but provider activation, real-data processing, or release is prohibited until named evidence passes. |
| `INTENTIONALLY UNAVAILABLE` | The approved outcome is a tested absence boundary, such as automatic continuity or account recovery. |
| `IN_PROGRESS`, `DONE`, `RETIRED` | Execution states; `DONE` requires complete objective acceptance and release evidence, not a preview or passing happy path. |

`Owner` names an accountable role, never an assumed individual. Product owns scope; architecture/domain own invariants; security/privacy own control acceptance; design/accessibility own user-facing conformance; quality owns test evidence; delivery/operations own release evidence. A delivery owner cannot close a product or security decision.

Approved decision behavior is explicit:

- `DEC-031`/`045`/`055`: provider adapters and registration may be implemented; live connector ingestion/actions remain disabled until exact activation evidence passes; upload, camera, and manual entry remain required routes.
- `DEC-032`: no automatic emergency, incapacity, or after-death release.
- `DEC-033`: export includes the approved complete authorized envelope and states its exact version/contents/limitations.
- `DEC-034`: no aggregate readiness/content-health/compliance/risk score or hidden score-based ordering.
- `DEC-035`: governed synthetic records may drive dev/test; the public production launch pack remains separately reviewed and no development fixture implies launch coverage.
- `DEC-036`: suspected clinical material stays out of ordinary extraction/search/graph/AI; no storage/disposition/timing promise is invented.
- `DEC-037`/`045`: in-app delivery is required; external email/SMS adapters may be implemented but remain disabled until configured and certified.
- `DEC-038`: no account/workspace recovery, ownership transfer, or support bypass.
- `DEC-053`: documents are fenced immediately, recoverable in Trash for 30 calendar days, then coordinated purge/non-resurrection applies; account deletion and lawful retention remain separate.
- `DEC-049`: Azure Australia East and documented Australian resilience routes are selected; unknown or ineligible processors/connectors/support/telemetry routes still fail closed.

## 5. Named traceability gaps

| Gap | State | Consequence | Closure evidence |
|---|---|---|---|
| `TRACE-GAP-P1-TEST-001` | `CLOSED — superseded 26 August 2026` | The earlier absence of stable implementation-test IDs was closed by DRAFT `TST-IDX-001` version `0.1`. | `TEST-UNIT-P1-001`–`010`, `TEST-CON-P1-001`–`012`, `TEST-AI-P1-001`–`015`, `TEST-SEC-P1-001`–`015`, `TEST-E2E-P1-001`–`020`, `TEST-PERF-P1-001`–`010`, and `TEST-DR-P1-001`–`008` are mapped across 48/48 stories. DRAFT/NOT_RUN/INSUFFICIENT evidence still cannot satisfy a gate. |
| `TRACE-GAP-P1-APPROVAL-001` | `OPEN` | The PRD, catalogue, UX, architecture, security, API, engineering, operations, and backlog are DRAFT; proposed ADRs are not accepted. | Recorded approvals or an explicitly approved narrower implementation baseline. |
| `TRACE-GAP-P1-DECISION-001` | `CLOSED — superseded by DEC-030–055` | The original implementation-shaping questions now have approved dev/stage behavior and explicit production/provider fences. Runtime delivery and release evidence remain incomplete. | Reopen only if an approved decision is changed or a new unsafe ambiguity is found. |
| `TRACE-GAP-P1-TARGET-001` | `OPEN` | Numeric NFRs and support/accessibility matrices are provisional, not service commitments. | Accountable owner approval with representative workload, measurement, and stop-ship evidence. |
| `TRACE-GAP-P1-UC-001` | `OPEN` | `UC-P1-014`–`019` are catalogue-only and lack the detailed product AC/contract depth required for implementation. Stories may test only a disabled/absence/safe-boundary outcome. | Approved detailed use case and product acceptance scenarios, plus updated product, API/event, security, UX, reference-data, test, and backlog traces. |
| `TRACE-GAP-P1-API-001` | `OPEN` | No direct classification operation is present in `API-OPENAPI-001`. | Owning API decision: add a versioned operation or document/test an internal-only boundary and observable job/result contract. |
| `TRACE-GAP-P1-API-002` | `OPEN` | No extraction review/correction operation is present. | Approved operation/schema/concurrency/audit contract and tests. |
| `TRACE-GAP-P1-API-003` | `OPEN` | No analysis-generation reprocess operation is present; ingestion retry is not equivalent. | Approved reprocessing command/status contract and tests. |
| `TRACE-GAP-P1-API-004` | `OPEN` | No `ResourceEntity` create/link/merge/split operation is present. | Approved entity-resolution command/query contract and tests, or an explicitly approved non-public owner. |
| `TRACE-GAP-P1-API-005` | `OPEN` | No dependency-edge CRUD/review/traversal operation is present. | Approved graph command/query boundary and tests, or documented internal-only ownership. |
| `TRACE-GAP-P1-API-006` | `OPEN` | The internal AI gateway/evaluation contract has no generic public API/event; this is appropriate only if capability-specific operations provide complete observable state. | Architecture/API confirmation plus provider-port, manifest, job, audit, and evaluation conformance tests. |
| `TRACE-GAP-P1-API-007` | `OPEN` | No conformed-view operation is present. | Approved conformed-view query schema including inputs/generation/coverage/freshness/current authorization. |
| `TRACE-GAP-P1-API-008` | `OPEN` | No `RuleResolution`/`ChangeCase` operation is present. | Approved monitoring applicability/change command/query contract and tests. |
| `TRACE-GAP-P1-API-009` | `OPEN` | Action execution exists, but evidence submission/verification/closure operations are absent. | Approved evidence-verification and closure command/query contracts with separate authority/state. |
| `TRACE-GAP-P1-API-010` | `OPEN` | No `RequirementCase` profile/finding/disposition/fulfilment operation is present. | Approved expected-evidence/health API and tests. |
| `TRACE-GAP-P1-API-011` | `OPEN` | No configuration publication/activation operation is present. | Approved privileged global-scope configuration API or explicitly approved non-HTTP control contract. |
| `TRACE-GAP-P1-API-012` | `OPEN` | No dedicated minimal-disclosure “impact exists” operation is present. | Approved named disclosure-policy response contract and side-channel tests. |
| `TRACE-GAP-P1-API-013` | `OPEN` | No managed-dependant transition operation is present, matching its catalogue-only state. | Close `TRACE-GAP-P1-UC-001`, then approve the exact transition case/API. |
| `TRACE-GAP-P1-API-014` | `OPEN` | Residency is cross-cutting and has no dedicated route-policy evidence query; all processing operations still require an enforceable decision. | Approved internal policy/evidence contract and operator/product-safe visibility without a second authority source. |
| `TRACE-GAP-P1-EVT-001` | `OPEN` | No connector event family exists; connector operations remain disabled. | Close `DEC-031`/`040`, then add schemas/catalogue entries and replay/deletion/privacy conformance. |
| `TRACE-GAP-P1-EVT-002` | `OPEN` | No notification delivery/preference event family exists; external channels remain disabled. | Approved event ownership/compatibility/privacy contract if asynchronous consumers require it. |
| `TRACE-GAP-P1-EVT-003` | `OPEN` | No recovery or continuity event exists, intentionally matching disabled capabilities. | Add only after `DEC-032`/`038` and the full owning product/security contracts are approved. |
| `TRACE-GAP-P1-REF-001` | `OPEN` | DIT requires versioned fact definitions, but no fact-definition reference catalogue exists. Extraction fields are not fact definitions. | Approved fact-definition schema/data pack, publication rules, migrations, and tests. |
| `TRACE-GAP-P1-REF-002` | `OPEN` | No connector profile/adapter catalogue exists even though disabled-first adapter implementation is approved. | Add provider-neutral records for the approved Microsoft, Google, Dropbox, and Box development registrations, then prove consent, scope, route, deletion, and conformance behavior before activation. |
| `TRACE-GAP-P1-REF-003` | `OPEN` | No managed-dependant transition policy catalogue exists. | Approved transition product/security/privacy contract and versioned policy records. |
| `TRACE-GAP-P1-REF-004` | `INTENTIONAL ABSENCE` | No aggregate score/weight/threshold/denominator record exists because `DEC-034` prohibits aggregate or hidden scoring in Phase 1. | Preserve the absence unless a later approved decision and full metric/permission/evaluation contract supersede it. |
| `TRACE-GAP-P1-REF-005` | `OPEN` | No approved data-class/processor/region/exception matrix exists under `DEC-040`. | Approved enforceable matrix and placement/egress/restore/failover tests. |
| `TRACE-GAP-P1-REF-006` | `INTENTIONAL ABSENCE` | No recovery/continuity activation records exist because `DEC-038` excludes recovery/ownership transfer and `DEC-032` excludes automatic continuity release. | Do not add unless later approved decisions and abuse-resistant contracts explicitly supersede these boundaries. |
| `TRACE-GAP-P1-A11Y-001` | `OPEN` | `UX-A11Y-001` is complete as a DRAFT namespace, but its target/support matrix is unapproved and no stable implementation test cases or release conformance evidence exists. | Product/accessibility approval, pinned browser/AT matrix, `TEST-P1-*` mapping, specialist/user evidence, and release report. |
| `TRACE-GAP-P1-GOV-001` | `CLOSED — 26 August 2026` | Root `TRACEABILITY.md`, `SPECIFICATION-READINESS.md`, and repository navigation now reflect the complete draft packs and their approval/evidence gaps. | Reopen if root governance or navigation drifts from the owning specifications. |

## 6. Story entry and completion evidence

A future implementation may enter a story only when:

1. its exact requirements, feature, use case, decision state, API/events, security/privacy/audit/threat, NFR, DIT/AI, UX/accessibility, reference-data, engineering, operations, and `TEST-UNIT/CON/AI/SEC/E2E/PERF/DR-P1-*` traces are current;
2. upstream requirements and applicable ADRs are approved or intentionally bounded by an approved implementation baseline;
3. no unresolved decision would make the work unsafe, materially disposable, or falsely user-facing;
4. synthetic fixtures, migration/compatibility plan, rollback or forward-repair plan, observability, and evidence owners exist; and
5. every referenced route/configuration is eligible and decision-fenced defaults remain disabled.

Completion requires all `AC-STORY-*` outcomes plus passing mapped `TEST-UNIT/CON/AI/SEC/E2E/PERF/DR-P1-*` evidence, negative authorization/privacy cases, failure/retry/replay/reconciliation evidence, audit/provenance evidence, accessibility where user-facing, migration/rollback/repair evidence where state changes, and applicable NFR/evaluation gates. A DRAFT test ID, happy path, validator, prototype, fake-port result, or mock does not establish completion.

## 7. Validation stance

Repository, API/event, and reference-data validators check structure and contract consistency; they do not approve product scope or implementation readiness. Backlog review additionally compares all 100 `REQ-P1-*`, 30 `FEAT-P1-*`, and 19 `UC-P1-*` catalogue entries against story coverage and reports conditional/catalogue-only items separately from executable baseline work.

Application implementation is authorized by `DEC-041` and `DEC-054`, not by this pack. Story completion and production/provider activation still require the exact acceptance, test, security/privacy, accessibility, operational, and release evidence described above.
