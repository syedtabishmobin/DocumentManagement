# Phase 1 Backlog and Traceability Index

| Field | Value |
|---|---|
| Document ID | `BLG-IDX-001` |
| Version | `0.1` |
| Status | **DRAFT — product-owner, architecture, security, privacy, accessibility, quality, and delivery approval required** |
| Product phase | Phase 1 — Personal and Family |
| Sequence basis | `P1-S1`–`P1-S4`, proposed by `DEC-030`; not an approved release commitment |
| Updated | 26 August 2026 |

## 1. Purpose and authority

This folder turns the current Phase 1 specifications into small, testable implementation candidates and exposes their traceability gaps. It neither changes product scope nor authorizes implementation, procurement, deployment, public launch, or activation of an open-decision route.

The hierarchy in [`CODEX.md`](../../CODEX.md) applies. Current product-owner instruction, `APPROVED` decisions, accepted ADRs, normative machine-readable contracts, and product requirements outrank this backlog. All referenced product, architecture, document-intelligence, AI, API/event, security, UX, engineering, operations, and reference-data artifacts are presently `DRAFT`; `ADR-ARCH-001`–`005` are `PROPOSED`. Backlog wording cannot approve them.

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

Before acting on any item, also read the [decision register](../00-context/decision-register.md), [Phase 1 PRD](../01-product/02-phase-1-prd.md), [feature catalogue](../01-product/03-feature-catalogue.md), [use-case catalogue](../01-product/04-use-case-catalogue.md), [architecture index](../02-architecture/README.md), [document-intelligence index](../03-document-intelligence/README.md), [AI index](../04-ai/README.md), [API index](../05-api/README.md), [security index](../06-security/README.md), [UX index](../07-ux/README.md), [engineering index](../08-engineering/README.md), [operations index](../09-devops/README.md), and [reference-data index](../11-reference-data/README.md).

## 3. Stable namespaces

| Namespace | Owner | Meaning |
|---|---|---|
| `EPIC-P1-###` | `BLG-EPIC-001` | Stable Phase 1 vertical epic identity. |
| `STORY-P1-###` | `BLG-STORY-001` | Stable, non-reusable implementation-candidate identity. |
| `AC-STORY-P1-###-##` | `BLG-STORY-001` | Story-specific, testable Given/When/Then outcome. |
| `TRACE-GAP-P1-*` | `BLG-TRACE-001` | Explicit missing, ambiguous, or blocked traceability evidence. |

An ID remains stable when wording or slice ordering changes. Retired IDs are recorded and never reassigned. Stories may move only with updated inbound/outbound traces and a recorded reason.

## 4. Status, ownership, and decision fences

Every story has one of these planning states:

| State | Meaning |
|---|---|
| `DRAFT` | Candidate is specified and mapped to DRAFT test cases, but upstream approval, implementation gate, and executed test evidence remain outstanding. |
| `BLOCKED — DEC-nnn` | The capability must remain unavailable until the named `OPEN` or unapproved `PROPOSED` decision and dependent contracts are approved. |
| `READY` | Reserved future state; may be applied only after the `CODEX.md` readiness gate and story entry evidence are approved. No story in version `0.1` is `READY`. |
| `IN_PROGRESS`, `DONE`, `RETIRED` | Reserved execution states; require implementation authorization and objective evidence. |

`Owner` names an accountable role, never an assumed individual. Product owns scope; architecture/domain own invariants; security/privacy own control acceptance; design/accessibility own user-facing conformance; quality owns test evidence; delivery/operations own release evidence. A delivery owner cannot close a product or security decision.

Open-decision behavior is explicit:

- `DEC-031`: connector ingestion/actions stay disabled; upload, camera, and manual entry remain the required routes.
- `DEC-032`: no automatic emergency, incapacity, or after-death release.
- `DEC-033`: export states its exact versioned envelope and never claims unapproved completeness.
- `DEC-034`: no aggregate readiness/content-health/compliance/risk score or hidden score-based ordering.
- `DEC-035`: reference records remain DRAFT/disabled and `.invalid` sources remain synthetic; no launch coverage claim.
- `DEC-036`: suspected clinical material stays out of ordinary extraction/search/graph/AI; no storage/disposition/timing promise is invented.
- `DEC-037`: only the channel-neutral contract and in-app experience are specified; external delivery stays disabled.
- `DEC-038`: no account/workspace recovery, ownership transfer, or support bypass.
- `DEC-039`: no invented cooling-off, purge, backup-expiry, retained-audit, or completion duration.
- `DEC-040`: unknown or ineligible processing routes fail closed; no provider, region, or cross-border exception is inferred.

## 5. Named traceability gaps

| Gap | State | Consequence | Closure evidence |
|---|---|---|---|
| `TRACE-GAP-P1-TEST-001` | `CLOSED — superseded 26 August 2026` | The earlier absence of stable implementation-test IDs was closed by DRAFT `TST-IDX-001` version `0.1`. | `TEST-UNIT-P1-001`–`010`, `TEST-CON-P1-001`–`012`, `TEST-AI-P1-001`–`015`, `TEST-SEC-P1-001`–`015`, `TEST-E2E-P1-001`–`020`, `TEST-PERF-P1-001`–`010`, and `TEST-DR-P1-001`–`008` are mapped across 48/48 stories. DRAFT/NOT_RUN/INSUFFICIENT evidence still cannot satisfy a gate. |
| `TRACE-GAP-P1-APPROVAL-001` | `OPEN` | The PRD, catalogue, UX, architecture, security, API, engineering, operations, and backlog are DRAFT; proposed ADRs are not accepted. | Recorded approvals or an explicitly approved narrower implementation baseline. |
| `TRACE-GAP-P1-DECISION-001` | `OPEN` | `DEC-030`–`040` prevent fixed sequencing, launch coverage, connector/continuity/export/score/clinical/channel/recovery/deletion/residency commitments. | Approved decision plus updated affected contracts, reference data, stories, and tests. |
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
| `TRACE-GAP-P1-REF-002` | `OPEN` | No connector profile/adapter catalogue exists while connectors are undecided. | Close `DEC-031`/`040`; add disabled-first provider-neutral records and conformance evidence. |
| `TRACE-GAP-P1-REF-003` | `OPEN` | No managed-dependant transition policy catalogue exists. | Approved transition product/security/privacy contract and versioned policy records. |
| `TRACE-GAP-P1-REF-004` | `INTENTIONAL ABSENCE` | No aggregate score/weight/threshold/denominator record exists while `DEC-034` is unapproved. | Do not close by inventing a seed; requires decision approval and full metric/permission/evaluation contract. |
| `TRACE-GAP-P1-REF-005` | `OPEN` | No approved data-class/processor/region/exception matrix exists under `DEC-040`. | Approved enforceable matrix and placement/egress/restore/failover tests. |
| `TRACE-GAP-P1-REF-006` | `INTENTIONAL ABSENCE` | No recovery/continuity activation records exist while `DEC-038`/`032` are open. | Do not add until owning decisions and abuse-resistant contracts close. |
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

Repository, API/event, and reference-data validators check structure and contract consistency; they do not approve product scope or implementation readiness. Backlog review additionally compares all 90 `REQ-P1-*`, 30 `FEAT-P1-*`, and 19 `UC-P1-*` catalogue entries against story coverage and reports conditional/catalogue-only items separately from executable baseline work.

No application implementation is authorized by this pack.
