# Phase 1 Scope and Success Metrics

| Field | Value |
|---|---|
| Document ID | `PROD-SCOPE-001` |
| Version | `0.2` |
| Status | **APPROVED BUILD MEASUREMENT BASELINE — numeric targets remain PROVISIONAL** |
| Product phase | Phase 1, with explicit Phase 2 exclusions and extension points |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 30 August 2026 — build-baseline traceability reconciliation |
| Normative basis | `PROD-PRD-001` version `0.3`; approved decisions through `DEC-055` |
| Strategy | [`PROD-VIS-001`](01-product-vision-strategy.md) |
| Approved normative baseline | [`docs/01-product/02-phase-1-prd.md`](02-phase-1-prd.md) |

## 1. Purpose and status

This document records the approved Phase 1 boundaries and outcomes using stable `OUT-P1-*` IDs and supplies measurement definitions using stable `MET-P1-*` IDs. It is the measurement layer of the approved build baseline, not evidence that an outcome, implementation, environment, or release gate has passed.

It is not the Phase 1 PRD and cannot independently change product scope. The approved [Phase 1 PRD](02-phase-1-prd.md), approved entries in the [decision register](../00-context/decision-register.md), and the `CODEX.md` hierarchy remain authoritative. Recommendations from [`PROD-COMP-001`](07-competitive-gap-analysis.md), including all `GAP-*` items, remain research inputs except where the approved PRD explicitly adopts or dispositions them.

The metric identities, definitions, provenance expectations, and outcome relationships are approved for build planning and instrumentation. Every numeric target remains **PROVISIONAL**: it is an engineering/evaluation hypothesis, not a public promise or final goal-completion threshold, until Product Authority approval after representative dogfood/private-beta calibration. Recalibration must not weaken a zero-tolerance safety control merely because early performance is poor.

## 2. Scope taxonomy

Every capability must be assigned one of these states in the PRD:

| State | Meaning |
|---|---|
| Approved boundary | Directly constrained by an approved decision; later specifications may add detail but cannot contradict it. |
| Approved Phase 1 capability | Included by the approved PRD; implementation and release evidence remain separately gated. |
| Decision required | Material user, privacy, legal, cost, or scope behavior remains unresolved and must be recorded in the decision register. |
| Deferred implementation choice | Capability contracts may be specified, but the named provider or technical product remains replaceable. |
| Phase 2 reservation | The core may preserve an extension point, but Phase 1 must not expose enterprise UI or promise the enterprise capability. |
| Out of Phase 1 | Explicitly excluded by an approved decision. |

“Phase 1” is a product phase, not a single release. `DEC-030` defines four coherent engineering/evidence slices inside one continuously approved implementation program.

## 3. Approved Phase 1 boundary

| Decision | Approved constraint | Scope consequence |
|---|---|---|
| `DEC-001` | AI-native document intelligence and change monitoring, not only file storage. | The product scope includes meaning and change, but the PRD must choose which intelligence workflows ship in each slice. |
| `DEC-002` | Personal and family in Phase 1; organisations in Phase 2. | No organisation workspace or enterprise administration experience in Phase 1. |
| `DEC-003` | `Identity → Membership → Workspace → Resources`; workspace types reserve PERSONAL, FAMILY, ORGANISATION. | Personal and family access cannot collapse into `User → Documents`; ORGANISATION remains reserved. |
| `DEC-004` | Canonical facts are independent from document occurrences and retain history/provenance. | Mutable document metadata alone cannot be the source of accepted facts. |
| `DEC-005` | Original binaries are immutable; logical documents support versions and controlled lifecycle. | Version, supersession, comparison, archive, restore, and controlled purge require explicit product behavior. |
| `DEC-006` | Consequential recommendations and updates require evidence, explanation, approval, and audit. | Silent consequential action is outside the approved behavior. |
| `DEC-007` | Taxonomy, monitoring rules, sources, permissions, and workflows are configured and jurisdiction-aware. | Australia-specific behavior belongs in a jurisdiction pack rather than hard-coded core logic. |
| `DEC-008` | Retrieval, graph traversal, and AI answers are permission-aware with exact provenance. | Current authorization and evidence visibility are acceptance boundaries for every relevant flow. |
| `DEC-009` | Vendors remain behind abstractions until approved. | No product requirement may depend on one cloud, OCR, model, graph, search, identity, or notification vendor. |
| `DEC-010` | Complete Phase 1 specification pack precedes application implementation. | Draft scope is not permission to begin application code. |
| `DEC-020` | Australia-first launch pack with neutral core contracts. | Initial terminology, scenarios, sources, and reference data are Australian. |
| `DEC-021` | Superseded by `DEC-052`. | The obsolete web-first/native-later sequencing is not part of the current baseline. |
| `DEC-022` | Superseded in provider selection by `DEC-049`; isolation and Australian-residency constraints remain active. | Azure is selected for managed infrastructure while canonical product contracts remain provider-neutral. |
| `DEC-023` | Household owners and family administrators first; advisers receive limited guest/delegated access. | A separate adviser product is outside Phase 1. Guest access requires bounded product and authorization behavior. |
| `DEC-024` | Clinical records excluded; health-insurance and general coverage included. | The PRD must define supported-content boundaries and the safe handling of attempted clinical content. |
| `DEC-041`, `DEC-054` | The complete Phase 1 build is authorized for synthetic local/Azure dev-stage work. | Scope authorization is not implementation completion, Stage/UAT acceptance, production activation, or real-data authority. |
| `DEC-049`, `DEC-052` | Azure managed infrastructure and concurrent React/Flutter clients are selected. | Environment and client evidence must follow the approved portable contracts and release gates. |

`DEC-011` fixes the repository location and has no user-facing scope consequence.

## 4. Approved Phase 1 capability envelope

The following summarises capabilities adopted by the approved PRD. The PRD requirements, not this summary, are normative; none of these entries claims implementation completion.

### 4.1 Workspace and access

- Create and operate personal and family workspaces.
- Represent household subjects separately from account identities and memberships.
- Apply resource-level access rather than treating workspace membership as universal visibility.
- Invite, constrain, inspect, and revoke limited guest or delegated adviser access.
- Record access-relevant and consequential actions in a privacy-preserving audit trail.

### 4.2 Capture and document lifecycle

- Browser upload, mobile camera capture, and manual import as baseline ingestion routes.
- Validate, quarantine, deduplicate, and process supported formats while preserving the immutable original.
- Group versions into logical documents and support supersession, comparison, archive, restore, and controlled purge.
- Expose received, processing, review, ready, failed, quarantined, archived, and deletion states without conflating them.

Exact file formats, limits, encrypted-file behavior, bulk-upload scope, and document-type launch set require the PRD and document-intelligence specifications.

### 4.3 Understanding and evidence

- Classify documents and extract proposed facts, parties, dates, amounts, and obligations.
- Preserve field- or passage-level provenance, confidence, processing version, and review state.
- Resolve accepted canonical facts independently of document occurrences while retaining conflicts and history.
- Provide understandable document, subject, property, vehicle, provider, policy, and obligation context where selected by the PRD.

### 4.4 Retrieval and proactive intelligence

- Permission-aware full-text, filtered, and evidence-backed conversational retrieval.
- Date, periodic, event, dependency, source-change, and version monitoring selected for supported document types and jurisdictions.
- Explain potentially stale, inconsistent, superseded, or missing information without presenting inference as a legal requirement.
- Assess downstream impact of a confirmed fact, document, event, or applicable source-rule change.

### 4.5 Decision, action, and control

- Present evidence, applicability, severity, confidence, impact, and proposed action as distinct values.
- Let authorized users approve, edit, reject, dismiss, defer, or mark an item not applicable where the applicable workflow permits.
- Create tasks, reminders, and completion-evidence requests without equating a reminder with fulfilment.
- Provide transparent export and deletion journeys once their exact envelope, retention, recovery, and audit semantics are approved.

## 5. Explicit boundaries and unresolved scope

### 5.1 Out of Phase 1 by approved decision

- Organisation workspaces and enterprise administration (`DEC-002`).
- Native desktop applications. Dedicated Flutter iOS and Android applications are required by `DEC-052`.
- A standalone adviser product (`DEC-023`).
- Clinical and medical records (`DEC-024`).
- Silent consequential document changes or external actions (`DEC-006`).

### 5.2 Deferred implementation choices

Azure is the approved managed infrastructure provider under `DEC-049`; React/TypeScript and Flutter/Dart are selected under `DEC-052`. Canonical domain, API, event, encryption, and reference-data contracts remain provider-neutral under `DEC-009`. Exact identity, OCR/document-processing, model, embedding/vector/graph/search, customer-notification, malware-scanning, analytics, and other adapters remain replaceable or activation-gated unless a later approved decision selects them.

`DEC-045` and `DEC-055` authorize consent-driven connector adapter implementation and configuration preparation. Email import, private inbound email, OneDrive, Google Drive, Dropbox, Box, and other exact providers remain non-operational until their credentials, minimal scopes, consent, token protection, route eligibility, revocation/deletion, audit, and conformance gates pass; registration alone is not launch scope or activation evidence.

### 5.3 Approved decisions and remaining release gates

| Topic | Review entry | Why a decision is required |
|---|---|---|
| Phase 1 vertical slices and public launch profile | `DEC-030` — APPROVED | Four engineering checkpoints form one continuously authorized Phase 1 build. |
| Initial document-type and governed-source pack | `DEC-035` — APPROVED | Synthetic Australian-first local fixtures are enabled; public coverage requires a later production package. |
| Connector sequence | `DEC-031` — APPROVED | Upload/capture/manual routes are local; live inbound email/cloud connectors remain disabled. |
| Notification channels | `DEC-037` — APPROVED | In-app notifications are enabled; external channels remain disabled. |
| Emergency, after-death, and time-aware access | `DEC-032` — APPROVED | Automated release is excluded from Phase 1. |
| Offline or curated continuity packs | `DEC-032`, `DEC-033` | Curated authorized export is governed by the approved export envelope; it must remain separate from excluded automated release. Any new offline-release behaviour requires governed change control. |
| Export and portability envelope | `DEC-033` — APPROVED | Complete authorized originals, versions, derivatives, facts, relationships, rules, work, grants, and audit envelope. |
| Readiness or document-health score | `DEC-034` — APPROVED | Item-level explainable findings only; aggregate/hidden scoring prohibited. |
| Unsupported clinical-content handling | `DEC-036` — APPROVED | Suspected clinical material enters isolated `POLICY_HOLD`. |
| Agentic and bulk actions | Approved PRD safety boundary | Bound approval, current authorization, policy gates, reversibility, rate limits, reconciliation, and completion evidence are required; unbounded autonomous action remains excluded. |
| Family subject, dependant, and guest lifecycle | Approved PRD; safe transition fence | Subjects, identities, memberships and grants remain separate. A dependant transition cannot activate without an approved applicable consent/authority policy; history preservation and fail-closed absence are buildable now. |
| Account and workspace recovery | `DEC-038` — APPROVED | Recovery/ownership transfer is unavailable locally and separately production-gated. |
| Deletion and purge timing | `DEC-039` — APPROVED | Immediate local fence/purge, no production backup, and content-free tombstone. |
| Australian residency envelope | `DEC-040` — APPROVED | Synthetic local processing enabled; production processor/region choices remain deployment-gated. |

### 5.4 Research recommendations and approved PRD disposition

The approved PRD records the following Phase 1 dispositions. Production claims remain limited by the deployment and evidence gates.

| Research item | Approved PRD disposition | Build/release interpretation |
|---|---|---|
| `GAP-001` expected-document requirements, alternatives, waivers, fulfilment, and evidence | Adopt | Requirement-profile contracts and user terminology must distinguish evidence from fulfilment and legal obligation. |
| `GAP-002` bitemporal fact and rule resolution | Adopt | Architecture and data contracts must define valid/effective time and platform transaction time. |
| `GAP-003` field/passage provenance | Adopt | Extraction, UX, API/output, and evaluation contracts must define the minimum stable evidence anchor. |
| `GAP-004` distinct lifecycle states | Adopt | Domain, UX, API, and reference data must own exact states and transitions without calling incompatible states “complete.” |
| `GAP-005` conformed effective-document views and obligation inheritance | Adopt | Versioning and obligation specifications must define supported amendment, addendum, cancellation, and supersession semantics. |
| `GAP-006` monitor coverage, freshness, health, and stale behavior | Adopt | Monitoring, UX, operations, and API contracts must define coverage and failure behavior. |
| `GAP-007` time-aware access, emergency succession, offline/export packs | Split | Scoped grants and complete portability are adopted; `DEC-032` excludes automated emergency/incapacity/after-death release from Phase 1. |
| `GAP-008` explainable readiness scoring | Item-level adopt; aggregate excluded | `DEC-034` requires explainable item-level findings and prohibits aggregate/hidden readiness, compliance, risk, traffic-light, or ranking scores in Phase 1. |
| `GAP-009` policy/evaluation gates for agentic or bulk action | Adopt | PRD, AI, authorization, audit, and test specifications must agree on bound approval, policy gates, and recovery. |
| `GAP-010` enterprise records, holds, barriers, DLP, and residency abstractions | Reserve | Architecture may preserve extension points; no Phase 1 enterprise UX or backlog promise. |

## 6. Approved Phase 1 outcomes

Outcome IDs and definitions are part of the approved build baseline. Retired IDs must not be reused. `APPROVED BUILD OUTCOME` means approved intent and planning traceability; it does not mean achieved, validated, released, or production-ready.

| Outcome ID | Approved user outcome | Primary users | Decision alignment | Status |
|---|---|---|---|---|
| `OUT-P1-001` | A household can establish a secure, intelligible document baseline without specialist records-management knowledge. This includes understandable ownership, lifecycle, evidence-review, and access state rather than storage volume alone. | Household owner, family administrator | `DEC-002`, `DEC-003`, `DEC-005`, `DEC-049`, `DEC-052` | APPROVED BUILD OUTCOME |
| `OUT-P1-002` | An authorized user can locate a document, fact, obligation, or deadline and inspect the exact evidence supporting the result. The experience distinguishes proposed extraction, accepted state, conflict, insufficiency, staleness, and restriction. | All authorized Phase 1 participants | `DEC-004`, `DEC-006`, `DEC-008` | APPROVED BUILD OUTCOME |
| `OUT-P1-003` | A material fact, document, event, or governed-rule change produces a permission-safe, explainable impact set. Applicability, source health, evidence, severity, urgency, confidence, and dependency path remain inspectable rather than collapsing into an opaque alert. | Household owner, family administrator, authorized decision maker | `DEC-001`, `DEC-004`, `DEC-007`, `DEC-008`, `DEC-020` | APPROVED BUILD OUTCOME |
| `OUT-P1-004` | A user can take a recommendation from evidence through approval and replacement-evidence closure without losing audit history. Approval, execution, and verified completion remain distinct states. | Authorized decision maker | `DEC-005`, `DEC-006` | APPROVED BUILD OUTCOME |
| `OUT-P1-005` | Family collaboration improves readiness without making workspace membership equivalent to unrestricted access. Members and limited guests can receive the minimum permitted evidence or action while restricted resources remain undisclosed. | Family administrator, member, limited adviser/guest | `DEC-003`, `DEC-008`, `DEC-023` | APPROVED BUILD OUTCOME |
| `OUT-P1-006` | Users can leave the service with a complete, documented export and can request controlled deletion under the approved portability, Trash, purge, non-resurrection, recovery-absence, and audit-minimization boundaries. | Household owner, authorized family administrator | `DEC-005`, `DEC-006`, `DEC-033`, `DEC-038`, `DEC-053` | APPROVED BUILD OUTCOME |
| `OUT-P1-007` | AI and monitoring failures are visible, recoverable, and never presented as verified truth or complete coverage. Low confidence, stale sources, parser failure, incomplete graphs, and insufficient evidence visibly degrade the result. | All authorized Phase 1 participants | `DEC-001`, `DEC-006`, `DEC-007`, `DEC-008`, `DEC-009` | APPROVED BUILD OUTCOME |

### 6.1 Exact outcome-to-measure ownership

This inverse index is normative for build traceability. A measure may contribute to more than one outcome; `MET-P1-006` and `MET-P1-021` are universal cross-outcome measures. Numeric targets retain their `PROVISIONAL` status.

| Outcome | Owning measures |
|---|---|
| `OUT-P1-001` | `MET-P1-001`, `002`, `003`, `006`, `019`, `020`, `021` |
| `OUT-P1-002` | `MET-P1-001`, `003`, `006`, `009`, `010`, `011`, `012`, `018`, `021`, `022` |
| `OUT-P1-003` | `MET-P1-004`, `005`, `006`, `008`, `009`, `013`, `014`, `015`, `021` |
| `OUT-P1-004` | `MET-P1-005`, `006`, `007`, `008`, `009`, `017`, `021` |
| `OUT-P1-005` | `MET-P1-006`, `018`, `021` |
| `OUT-P1-006` | `MET-P1-006`, `016`, `019`, `021` |
| `OUT-P1-007` | `MET-P1-006`, `009`, `012`, `015`, `021`, `022` |

## 7. Metric design rules

1. A metric definition is an approved measurement and traceability contract only to the extent stated here; its provisional numeric target is not a final requirement, public promise, or proof of outcome completion.
2. Numerator and denominator count the same eligible unit unless the definition explicitly describes an evaluation set.
3. Internal, test, synthetic, known-abusive, and successfully deleted workspaces are excluded from customer-behavior denominators. Synthetic evaluation fixtures remain included in evaluation metrics.
4. A “supported” document or action means it meets the approved type, format, size, language, jurisdiction, and workflow criteria that the PRD and detailed specifications will define.
5. Cohort windows use the workspace’s configured local day; event timestamps are stored in UTC. Rolling windows end at the completed UTC day unless a metric states otherwise.
6. Metrics are segmented at minimum by personal/family workspace, device class, ingestion route, supported document type, and jurisdiction pack when sample size permits. Accessibility and assistive-technology segmentation requires privacy-safe instrumentation and governance.
7. Rates are not published for segments below the approved minimum sample size. Private-beta review should use a provisional minimum of 30 eligible units and show counts and confidence intervals.
8. Quality averages must not hide a poorly performing document type, permission boundary, or jurisdiction. Safety failures are reported individually regardless of sample size.
9. Raw document content, extracted sensitive values, search query text, and evidence passages are prohibited from ordinary product analytics. Evaluation data must use approved synthetic or de-identified fixtures.
10. Safety targets are guardrails. Engagement or retention cannot compensate for a safety miss.

## 8. Leading indicators

| Metric ID | Outcome | Measure | Numerator | Denominator | Window | Provisional target | Instrumentation/event dependency | Target status |
|---|---|---|---|---|---|---|---|---|
| `MET-P1-001` | `OUT-P1-001`, `OUT-P1-002` | Seven-day trusted activation rate | New eligible workspaces in which the primary user imports at least one supported document, reaches a reviewable state, and completes its required first review within seven local days | All new eligible workspaces whose primary user completed workspace creation | Acquisition cohort observed for 7 days; reported weekly | **≥60%** | Workspace-created, file-accepted, document-reviewable, review-completed signals joined by pseudonymous workspace/document IDs | PROVISIONAL |
| `MET-P1-002` | `OUT-P1-001` | Timely path to a reviewable document | Supported accepted files that reach either review-required or ready state within 10 minutes without losing the original | All supported files accepted for processing, excluding user-cancelled transfers but including processing failures | Rolling 7 days, with daily review | **≥95%** overall and **≥90%** for every launch document type with sufficient sample | File-accepted, original-preserved, processing-state-changed timestamps; document type and route | PROVISIONAL |
| `MET-P1-003` | `OUT-P1-001`, `OUT-P1-002` | Evidence review engagement | Eligible workspaces in which an authorized user confirms or corrects at least one proposed extracted value and opens its evidence anchor | Workspaces receiving at least one reviewable extracted value | Cohort observed for 14 days; reported monthly | **≥50%** | Extraction-proposed, evidence-opened, field-confirmed/corrected signals; no field value in analytics | PROVISIONAL |
| `MET-P1-004` | `OUT-P1-003`, `OUT-P1-007` | Monitoring value configured | Eligible workspaces with at least one verified supported document for which an applicable date, periodic, or approved source/dependency monitor is active and visible to the user | Workspaces with at least one verified document eligible for an approved monitor | Cohort observed for 14 days; reported monthly | **≥55%** | Document-verified, monitoring-rule-assigned, monitor-activated, monitor-visibility-confirmed signals | PROVISIONAL |
| `MET-P1-005` | `OUT-P1-003`, `OUT-P1-004` | Explainable-impact engagement | Presented impact assessments for which an authorized user opens evidence or a dependency explanation and records an allowed disposition | All impact assessments presented to an authorized user and eligible for a disposition | Rolling 30 days | **≥50%** | Impact-presented, evidence-opened/dependency-opened, recommendation-disposition-recorded signals | PROVISIONAL |

## 9. Lagging outcome measures

| Metric ID | Outcome | Measure | Numerator | Denominator | Window | Provisional target | Instrumentation/event dependency | Target status |
|---|---|---|---|---|---|---|---|---|
| `MET-P1-006` | `OUT-P1-001`–`OUT-P1-007` | Eight-week retained value rate | Activated workspaces with at least one meaningful action in three distinct weeks during weeks 5–8; meaningful actions are review completion, evidence-backed retrieval, recommendation disposition, or verified action closure | Activated workspaces that remain eligible and have completed eight weeks of observation | Acquisition cohort observed through week 8; reported monthly | **≥35%** | Review-completed, evidence-backed-answer-used, disposition-recorded, action-closure-verified signals | PROVISIONAL |
| `MET-P1-007` | `OUT-P1-004` | On-time verified action closure | Accepted actionable recommendations whose required completion evidence is verified on or before the applicable due date | Accepted actionable recommendations with a due date whose due date has passed or whose evidence was verified | Rolling 90 days | **≥70%** | Recommendation-accepted, due-date-set, evidence-submitted, completion-verified signals | PROVISIONAL |
| `MET-P1-008` | `OUT-P1-003`, `OUT-P1-004` | Confirmed-change resolution rate | Confirmed fact-change cases in which every user-accepted affected item is dispositioned and required completion evidence is verified within 30 days | Confirmed fact-change cases with at least one accepted affected item and 30 days of observation | Rolling 90 days | **≥60%** | Fact-change-confirmed, impact-item-accepted, item-dispositioned, completion-verified signals | PROVISIONAL |
| `MET-P1-009` | `OUT-P1-002`–`OUT-P1-004`, `OUT-P1-007` | Evidence-backed usefulness score | Valid respondents selecting 4 or 5 on a five-point statement: “This helped me understand what needed attention, what to do, and why” | All valid responses to that statement after an eligible evidence-backed answer, impact assessment, or action closure | Rolling 90 days; no more than one sampled response per workspace per 30 days | **≥75%** positive and **<10%** selecting 1 or 2 | Privacy-approved survey-presented and survey-response signals linked only to interaction type and pseudonymous workspace | PROVISIONAL |

## 10. Quality measures

| Metric ID | Outcome | Measure | Numerator | Denominator | Window | Provisional target | Instrumentation/event dependency | Target status |
|---|---|---|---|---|---|---|---|---|
| `MET-P1-010` | `OUT-P1-002` | Reviewed extraction acceptance | Reviewed extracted fields accepted without a value correction | All reviewed extracted fields with a confirm or correct decision | Rolling 30 days and per release, segmented by field and document type | **≥90%** overall and **≥85%** for every launch document type/critical field with sufficient sample | Field-proposed and field-review-outcome signals; extractor/schema version; no values in analytics | PROVISIONAL |
| `MET-P1-011` | `OUT-P1-002` | Reviewed classification accuracy | Reviewed documents whose proposed launch taxonomy classification is accepted | All reviewed documents receiving a classification decision | Rolling 30 days and per release, by launch document type | **≥95%** overall and **≥90%** for each launch type with sufficient sample | Classification-proposed and classification-review-outcome signals; model/taxonomy version | PROVISIONAL |
| `MET-P1-012` | `OUT-P1-002`, `OUT-P1-007` | Citation support validity | Audited consequential claims whose citation resolves to authorized, available evidence that directly supports the claim at the asserted granularity | All consequential claims selected by the approved risk-based audit sample plus all such claims in the release evaluation set | Every release and rolling 30-day production audit | **≥99%**, with **100%** for high-severity consequential claims | Structured claim/citation records, authorization result, evidence-anchor resolver, audit outcome | PROVISIONAL |
| `MET-P1-013` | `OUT-P1-003` | Impact precision | Validated predicted impact items judged correctly affected with a valid typed dependency path | All predicted impact items in the evaluation set or human-validation sample | Every release and rolling 30 days | **≥90%** overall; severe false positives reviewed individually | Impact prediction, dependency path, validator outcome, rules/model version | PROVISIONAL |
| `MET-P1-014` | `OUT-P1-003` | Impact recall | Gold-standard affected items correctly detected | All gold-standard affected items in approved synthetic/evaluation scenarios | Every release and monthly regression run | **≥90%** overall and **100%** for designated critical scenarios | Versioned evaluation fixtures, expected impact set, detected impact set | PROVISIONAL |
| `MET-P1-015` | `OUT-P1-003`, `OUT-P1-007` | Stale-source transparency | Source-derived user presentations after a source becomes stale or unhealthy that clearly disclose staleness/failure or suppress the consequential recommendation according to policy | All source-derived user presentations occurring while the governing source is stale or unhealthy | Continuous control, reviewed daily and reported weekly | **100%** | Source-health/freshness change, presentation-policy outcome, recommendation-presented/suppressed signals | PROVISIONAL |
| `MET-P1-016` | `OUT-P1-006` | Export fidelity | Expected export objects and relationships whose manifest entries, hashes, references, and documented representations validate | All expected in-scope objects and relationships for completed export jobs | Every completed export and rolling 30 days | **≥99.9%** overall, **100%** of included immutable originals, and zero cross-workspace objects | Export-requested/completed, expected manifest, validation result, artifact hash, authorization scope | PROVISIONAL |

## 11. Safety and trust guardrails

| Metric ID | Outcome | Measure | Numerator | Denominator | Window | Provisional target | Instrumentation/event dependency | Target status |
|---|---|---|---|---|---|---|---|---|
| `MET-P1-017` | `OUT-P1-004` | Valid approval coverage for consequential execution | Consequential action executions linked to a current, authorized, action-specific approval and complete audit record | All consequential action executions | Continuous, with per-release test and weekly production review | **100%**; zero unapproved executions | Approval-created/revoked/expired, authorization decision, action-executed, audit-record-validated signals | PROVISIONAL — zero tolerance |
| `MET-P1-018` | `OUT-P1-002`, `OUT-P1-005` | Authorization non-disclosure | Evaluated retrieval, graph, inference, evidence, export, and action outputs that reveal no content or sensitive metadata beyond the current authorization | All negative authorization test outputs plus the approved risk-based production audit sample | Every build for automated tests; every release for E2E; weekly production audit | **100%**; zero confirmed restricted-data disclosure | Authorization policy decision, output policy label, negative-test expectation, privacy incident record | PROVISIONAL — zero tolerance |
| `MET-P1-019` | `OUT-P1-001`, `OUT-P1-006` | Immutable-original integrity | Checked original artifacts whose stored bytes/hash match the ingestion-time integrity record and have no mutation event | All original artifacts in the integrity check population | Daily risk-based sample and quarterly full check, subject to storage architecture validation | **100%**; zero mutations | Original-preserved hash, integrity-check result, artifact lifecycle event, incident record | PROVISIONAL — zero tolerance |
| `MET-P1-020` | `OUT-P1-001` | Clinical-content boundary handling | Known clinical-record attempts in the approved safety evaluation set that are blocked or routed according to the approved unsupported-content policy before ordinary extraction/indexing | All known clinical-record attempts in that evaluation set | Every release and monthly regression run | **100%** after the handling policy is approved | Supported-content policy result, quarantine/rejection route, extraction/indexing start, versioned safety fixture | PROVISIONAL — zero tolerance for known test cases |
| `MET-P1-021` | All outcomes | Sensitive telemetry hygiene | Scanned ordinary logs and analytics records containing no prohibited raw document content, evidence passage, query text, or sensitive extracted value | All log and analytics records examined by automated scanning plus the approved audit sample | Continuous automated control and weekly audit | **100%**; zero confirmed prohibited records | Telemetry schema registry, content scanner outcome, redaction policy version, incident record | PROVISIONAL — zero tolerance |
| `MET-P1-022` | `OUT-P1-002`, `OUT-P1-007` | Insufficient-evidence safety | Low-evidence or no-evidence evaluation prompts that explicitly communicate insufficiency and produce no unsupported consequential claim | All designated low-evidence/no-evidence prompts in the approved evaluation set | Every release and monthly regression run | **≥99%** overall and **100%** for designated high-risk prompts | Versioned evaluation fixture, structured answer/claim output, citation validator, safety-review outcome | PROVISIONAL |

## 12. Instrumentation and event dependencies

### 12.1 Instrumentation concepts

The metric tables name required signals. The following are provisional analytics concepts, not normative API or domain-event IDs. The future API/event specifications must assign contracts and compatibility rules without assuming these names.

| Instrumentation area | Minimum concepts | Metrics dependent on it |
|---|---|---|
| Workspace lifecycle | Workspace created, workspace type, configured local timezone, primary-user setup completed, workspace deleted/excluded | `MET-P1-001`, `MET-P1-006` |
| Ingestion lifecycle | Transfer accepted/cancelled, original preserved, quarantine result, processing-state transition, reviewable timestamp, supported-type decision | `MET-P1-001`, `MET-P1-002`, `MET-P1-019`, `MET-P1-020` |
| Interpretation review | Classification proposed/decided, field proposed/confirmed/corrected, evidence anchor opened, schema/model version | `MET-P1-003`, `MET-P1-010`, `MET-P1-011` |
| Retrieval and evidence | Interaction type, structured claim, citation reference, evidence-anchor resolution, current authorization result, insufficiency outcome | `MET-P1-006`, `MET-P1-009`, `MET-P1-012`, `MET-P1-018`, `MET-P1-022` |
| Monitoring | Rule assignment, subscription state, source freshness/health, presentation policy result, recommendation shown/suppressed | `MET-P1-004`, `MET-P1-015` |
| Impact and decision | Confirmed change, predicted impact/path, impact presentation, allowed disposition, approval lifecycle | `MET-P1-005`, `MET-P1-008`, `MET-P1-013`, `MET-P1-014`, `MET-P1-017` |
| Action and evidence | Due date, action execution, evidence submission, verification result, closure timestamp | `MET-P1-006`, `MET-P1-007`, `MET-P1-008`, `MET-P1-017` |
| Access control | Actor pseudonym, workspace/resource policy reference, requested operation, allow/deny result, policy version; no restricted value | `MET-P1-018` |
| Export | Authorized export scope, expected manifest, completion state, validation result, hashes and cross-workspace check | `MET-P1-016`, `MET-P1-018` |
| Product feedback | Eligibility, prompt context category, response score, sampling/suppression state; no free text by default | `MET-P1-009` |
| Safety and audit | Control result, risk class, policy/model version, incident classification, remediation state | `MET-P1-012`, `MET-P1-015`, `MET-P1-017`–`MET-P1-022` |

### 12.2 Common event properties

Where applicable, events need:

- immutable event ID and occurrence timestamp;
- pseudonymous actor, workspace, resource, and workflow correlation IDs;
- workspace type, jurisdiction-pack version, client/device class, and ingestion route;
- capability, policy, taxonomy, schema, parser, model, prompt/tool, and rule versions relevant to the outcome;
- authorization decision and evidence/citation reference IDs without copied evidence content;
- state before and after a transition;
- synthetic/test/internal marker for denominator exclusion; and
- event-contract version and idempotency/deduplication key.

Raw filenames may themselves be sensitive and should not be ordinary analytics properties. Document text, field values, query text, generated free text, evidence passages, and unrestricted URLs must not be collected in product analytics. Privacy, consent, retention, deletion, access, residency, and redaction rules require the security/privacy and observability specifications before instrumentation is enabled.

### 12.3 Measurement dependencies before beta

Before any beta target is used for a go/no-go decision:

1. the event catalogue and analytics schema are versioned;
2. numerator/denominator queries have fixture-based tests;
3. retries and duplicate events cannot double-count a unit;
4. authorization and privacy reviews approve every property;
5. test/internal traffic exclusion is verified;
6. quality metrics have approved gold sets and sampling procedures;
7. safety metrics have named incident escalation and stop-ship behavior; and
8. a dashboard shows counts, exclusions, missing-data rate, segment distribution, and target status rather than only a percentage.

## 13. Anti-metrics

The following must not be used alone as evidence of product success:

- **Documents uploaded.** Volume does not show understanding, correctness, or user control.
- **Storage consumed.** More retained data may increase cost and privacy risk without value.
- **AI prompts, answers, tokens, or agent actions.** Activity can rise when the experience is confusing or unreliable.
- **Graph nodes or edges.** A larger graph is not necessarily more correct, useful, or authorized.
- **Recommendations or notifications sent.** More alerts can create fatigue and false urgency.
- **Time in app or session length.** Household administration should often become faster, not more engaging.
- **Family members or guests invited.** Sharing is not inherently beneficial and must not be incentivized over privacy.
- **Fields extracted.** Extraction volume does not establish acceptance, evidence quality, or fact resolution.
- **A single readiness/completeness score.** It can imply legal compliance or complete source coverage unless its components, evidence, limits, and uncertainty are explicit and approved.
- **Zero user corrections.** This can mean users did not review, could not understand the interface, or lacked an accessible correction path.
- **Retention without trust guardrails.** Retention achieved through lock-in, hard export, excessive reminders, or hidden deletion is contrary to the product strategy.

Anti-metrics may be operational inputs or diagnostic segments, but they require a linked outcome or quality/safety measure before influencing prioritisation.

## 14. Review cadence and target governance

| Cadence | Review | Accountable roles | Required output |
|---|---|---|---|
| Continuous/daily | Safety controls, authorization incidents, original integrity, source freshness, ingestion failures, telemetry leakage | Security/privacy, engineering, operations, document intelligence | Incident or control record; immediate escalation for zero-tolerance miss |
| Weekly during dogfood/beta | Leading indicators, processing reliability, quality sample health, metric data completeness | Product, design, engineering, data/analytics, AI/document intelligence | Annotated dashboard and corrective actions; no silent target changes |
| Monthly | Outcome cohorts, lagging measures, segment disparities, accessibility findings, false-positive/false-negative patterns | Product owner and cross-functional leads | Metric review note with counts, confidence, target status, and backlog implications |
| Before each release | All applicable safety/quality guardrails and critical end-to-end outcome scenario | Release owner, security/privacy, quality, product | Recorded go/no-go evidence linked to tests and known exceptions |
| Quarterly | Scope, outcome relevance, target calibration, cost/value trade-offs, Phase 1 slice sequencing | Product owner, architecture, security/privacy, delivery leads | Approved decision or documented no-change review; updates to PRD/traceability/backlog as needed |
| At least every six months pre-launch | Competitive/gap refresh and positioning review | Product strategy/research | Updated evidence register and explicit `GAP-*` disposition review |

Target changes must record the previous value, new value, reason, evidence window, approver, and effective date. Material changes to scope, privacy, user-facing behavior, safety tolerance, legal interpretation, vendor commitment, or external action require a decision-register entry, not only a table edit.

## 15. Build-baseline measurement and release handoff

The approved build baseline must preserve:

- stable `OUT-P1-*` and `MET-P1-*` identities without recycling retired IDs;
- exact outcome-to-feature/story and outcome-to-metric traceability;
- privacy-safe instrumentation and provenance classification for every measure;
- explicit `PROVISIONAL` status for every unapproved numeric target;
- separate build, test/evaluation, Stage, BA/business acceptance, UAT, production, and public-launch evidence;
- approved supported document types, formats, channels, jurisdictions, users, actions, and non-goals for each released profile;
- requirement links to use cases, UX, authorization, security/privacy, API/event, NFR, reference-data, tests/evaluations, and governed work items; and
- recorded Product Authority approval, previous/new value, evidence window, reason, and effective date for any target promoted or materially changed.

This document makes the build measurable. It does not establish that a metric is currently instrumented, a target has been met, a goal is complete, or the product is ready for Stage, BA acceptance, UAT, production, public release, or real personal data.
