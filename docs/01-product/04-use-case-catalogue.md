# Phase 1 Use-Case Catalogue

| Field | Value |
|---|---|
| Document ID | `PROD-UC-001` |
| Version | `0.2` |
| Status | `APPROVED DERIVED BUILD BASELINE — implementation and release evidence remain gated` |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 30 August 2026 — build-baseline traceability reconciliation |
| Primary source | `docs/01-product/02-phase-1-prd.md` version `0.3` |

## 1. Authority, scope, and interpretation

This catalogue refines the approved Phase 1 requirements into observable end-to-end behaviour. It does not independently change the PRD, select or activate a provider, prove implementation completion, or authorize production use. `CODEX.md` and the source-of-truth hierarchy continue to apply.

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** inherit the status of the approved requirements they refine. A release-gated flow remains unavailable until its exact activation evidence passes. Alternatives describe required handling of boundary conditions; they are not optional implementation shortcuts.

Stable IDs follow these rules:

- Use cases use `UC-P1-###`. An ID is never recycled.
- Acceptance scenarios use `AC-UC-P1-###-##` and remain attached to their use case.
- A catalogue row marked **Detailed** has an implementation-grade specification in section 5.
- Later specifications may add detail but must not weaken authorization, evidence, approval, deletion, or audit invariants without a higher-authority change.

## 2. Actors

| Actor ID | Actor | Relevant boundary |
|---|---|---|
| `ACT-HO` | Household owner | Governs a workspace but does not automatically override explicit private-resource policy. |
| `ACT-FA` | Family administrator | Manages permitted household structure and shared work; administration is not blanket content access. |
| `ACT-AM` | Adult member | Manages explicitly authorized personal and shared resources. |
| `ACT-MD` | Managed dependant subject | May be represented without credentials or membership; access and later transition require approved consent rules. |
| `ACT-GU` | Guest or delegated adviser | Receives purpose-, resource-, action-, and time-scoped access only. |
| `ACT-WS` | Workspace service | Performs tenant-scoped processing under least-privileged service authority. |
| `ACT-TS` | Trusted-source connector | Produces governed observations and snapshots; it cannot publish an applicable conclusion by itself. |
| `ACT-CP` | Capture/processing provider adapter | Scans, parses, extracts, or evaluates through a vendor-neutral contract and has no independent product authority. |
| `ACT-OP` | Product operator or support user | Has no standing raw-content access; any exceptional access depends on a separately approved policy. |

## 3. Catalogue

| Use case | Title | Slice | Scope | Detail | Primary traceability |
|---|---|---|---|---|---|
| `UC-P1-001` | Establish a personal or family workspace | `P1-S1` | `REQUIRED` | Detailed | `REQ-P1-WS-001`–`REQ-P1-WS-005` |
| `UC-P1-002` | Capture, quarantine, process, and review a document | `P1-S1`–`P1-S2` | `REQUIRED` | Detailed | `REQ-P1-ING-001`–`REQ-P1-ING-008`, `REQ-P1-DOC-006`–`REQ-P1-DOC-007` |
| `UC-P1-003` | Manage document, evidence, and version lifecycle | `P1-S1`–`P1-S3` | `REQUIRED` | Detailed | `REQ-P1-DOC-001`–`REQ-P1-DOC-005`, `REQ-P1-DOC-008` |
| `UC-P1-004` | Resolve a fact conflict and record a fact change | `P1-S2`–`P1-S3` | `REQUIRED` | Detailed | `REQ-P1-FCT-001`–`REQ-P1-FCT-006` |
| `UC-P1-005` | Search and ask questions with exact evidence | `P1-S2` | `REQUIRED` | Detailed | `REQ-P1-SRCH-001`–`REQ-P1-SRCH-005` |
| `UC-P1-006` | Monitor a date, user event, document, dependency, or governed source | `P1-S3` | `REQUIRED` | Detailed | `REQ-P1-MON-001`–`REQ-P1-MON-007` |
| `UC-P1-007` | Assess impact, approve action, and close with evidence | `P1-S3` | `REQUIRED` | Detailed | `REQ-P1-ACT-001`–`REQ-P1-ACT-008` |
| `UC-P1-008` | Resolve an expected-document or document-health finding | `P1-S3`–`P1-S4` | `REQUIRED`; score conditional | Detailed | `REQ-P1-HLT-001`–`REQ-P1-HLT-005` |
| `UC-P1-009` | Share, delegate, expire, and revoke access | `P1-S4` | `REQUIRED`; automatic continuity conditional | Detailed | `REQ-P1-SHR-001`–`REQ-P1-SHR-005` |
| `UC-P1-010` | Manage a task, reminder, and notification | `P1-S3`–`P1-S4` | `REQUIRED`; channels conditional | Detailed | `REQ-P1-NTF-001`–`REQ-P1-NTF-004` |
| `UC-P1-011` | Export an authorized portable workspace package | `P1-S4` | `REQUIRED`; approved envelope | Detailed | `REQ-P1-TRUST-006` |
| `UC-P1-012` | Delete and purge a governed resource | `P1-S4` | `REQUIRED`; timing open | Detailed | `REQ-P1-TRUST-007` |
| `UC-P1-013` | Enforce workspace and derivative isolation across a workflow | All | `REQUIRED` | Detailed cross-cutting | `REQ-P1-WS-004`, `REQ-P1-TRUST-002` |
| `UC-P1-014` | Ingest from a cloud or private-email connector | `P1-S4` | `REQUIRED / RELEASE GATED` | Detailed | `REQ-P1-ING-009`, `REQ-P1-TRUST-009` |
| `UC-P1-015` | Preserve a managed dependant through an authority-transition fence | `P1-S4` | `REQUIRED SAFE BOUNDARY` | Detailed | `REQ-P1-WS-007` |
| `UC-P1-016` | Keep automated continuity release unavailable | `P1-S4` | `INTENTIONALLY UNAVAILABLE` | Detailed absence | `REQ-P1-SHR-004` |
| `UC-P1-017` | Keep account/workspace recovery and ownership transfer unavailable | `P1-S4` | `INTENTIONALLY UNAVAILABLE` | Detailed absence | `REQ-P1-TRUST-001`, `REQ-P1-TRUST-008` |
| `UC-P1-018` | Publish consequential reference configuration | `P1-S3` | `REQUIRED` | Detailed | `REQ-P1-CFG-001`–`REQ-P1-CFG-004` |
| `UC-P1-019` | Inspect a privacy-safe audit history | All | `REQUIRED` | Detailed | `REQ-P1-TRUST-003`–`REQ-P1-TRUST-004` |
| `UC-P1-020` | Discover Doculyra and enter account creation or sign-in | `P1-S1` / cross-slice | `REQUIRED` | Detailed | `REQ-P1-PLT-001`, `REQ-P1-PLT-003` |

## 4. Cross-cutting invariants

Every detailed use case inherits these invariants:

1. **Current authorization wins.** Access is checked at request and execution time for every workspace, resource, field, edge, derivative, tool, export item, notification, and action. A stale derived store fails closed or visibly degrades.
2. **Workspace context is explicit.** Identity alone is never an ownership or access boundary. All resource and service operations carry a validated workspace context.
3. **Restricted existence is protected.** Counts, facets, errors, timing, graph paths, citations, summaries, notifications, scores, and audit views must not disclose protected resource or relationship existence unless a policy expressly permits minimal disclosure.
4. **Evidence is not approved truth.** Receipt, extraction, review, fact resolution, requirement fulfilment, approval, execution, verification, and closure are distinct state transitions.
5. **History is additive.** Original bytes, evidence anchors, occurrences, source snapshots, resolution events, approval records, and superseded versions are never silently overwritten.
6. **Consequential output is evidence-bound.** Applicability precedes impact. Material claims have authorized citations; an action approval binds reviewed inputs and effects and becomes invalid after a material change.
7. **Failure remains visible.** Quarantine, stale sources, parser/model failure, partial external action, incomplete graph traversal, and pending deletion are not represented as success or current verified truth.
8. **Audit is privacy-safe.** Security- and consequence-relevant transitions capture actor/service, target, action, policy or reason, decision, outcome, time, correlation, and safe provenance without putting raw content or secrets in ordinary logs.
9. **Retries are safe.** Client retries and duplicated/out-of-order worker or connector events cannot create uncontrolled resources, approvals, actions, notifications, or deletion side effects.
10. **Open decisions stay open.** `DEC-031`–`DEC-040` behaviour is disabled, bounded, or described as a branch until approved; no vendor or timing default is inferred.

## 5. Detailed critical use cases

### `UC-P1-001` — Establish a personal or family workspace

| Field | Specification |
|---|---|
| Objective | Create a workspace with explicit ownership, jurisdiction context, subjects, and policy-evaluated membership without making membership blanket resource access. |
| Primary actors | `ACT-HO`; `ACT-FA` after authorized invitation |
| Supporting actors | `ACT-WS` |
| Preconditions | The identity is authenticated and eligible; workspace, role, permission, relationship, and jurisdiction reference data are active; the requested workspace type is permitted in Phase 1. |
| Trigger | An eligible identity selects **Create personal workspace** or **Create family workspace**. |
| Linked requirements | `REQ-P1-WS-001`–`REQ-P1-WS-005`, `REQ-P1-TRUST-001`–`REQ-P1-TRUST-004`, `REQ-P1-CFG-001`, `REQ-P1-CFG-003` |
| Linked gaps/decisions | `GAP-010`; `DEC-002`, `DEC-003`, `DEC-007`, `DEC-020`, `DEC-022`, `DEC-023`; slice sequencing is approved by `DEC-030` |
| Release-gated dependency | Account/workspace recovery is intentionally unavailable under `DEC-038`; managed-dependant transition remains fail-closed until an approved applicable consent/authority policy exists. |

#### Main flow

1. The service resolves the acting identity and displays only workspace types allowed by current policy; `ORGANISATION` is not creatable in Phase 1.
2. The actor chooses personal or family, supplies the minimum required workspace profile, and selects the applicable jurisdiction pack.
3. The service validates eligibility, duplicate/retry tokens, requested type, residency offer, and policy/configuration versions.
4. In one recoverable creation workflow, the service creates a stable workspace, its explicit owner membership, and an owner subject linked to—but not collapsed into—the identity.
5. For a family workspace, the actor may add household subjects. A managed dependant is created as a subject without credentials or fabricated membership.
6. The service evaluates default resource and administration policies; it does not grant access to future or private resources merely because the actor is owner or administrator.
7. The service presents a confirmation explaining workspace type, owner, jurisdiction, privacy boundaries, and next authorized action.
8. Creation and any membership/subject changes are audited with the active policy and reference-data versions.

#### Alternatives and failures

- **Idempotent retry:** the same creation key returns the original result; a materially different request using the key is rejected.
- **Possible duplicate:** the service offers entry to an already authorized workspace but does not expose whether an inaccessible workspace exists.
- **Ineligible family creation:** no partial owner membership or orphan workspace remains; the actor receives a privacy-safe reason and recovery route.
- **Organisation request:** creation is rejected as out of Phase 1 without creating reserved enterprise objects.
- **Subject validation failure:** the actor may correct the subject input; no account or membership is fabricated.
- **Configuration or audit failure:** creation fails closed or enters an explicit recoverable state; success is not shown until required records are durable.

#### Authorization and privacy invariants

- Workspace ownership, membership, subject identity, and resource authorization remain separate.
- A family administrator cannot infer private resources through counts, search, graph, notifications, exports, or support views.
- The actor may not select residency, relationship, or permission values unavailable in active configuration.
- Only minimum onboarding data is collected; operator access does not arise from workspace creation.

#### Audit and evidence

Record the actor, workspace and membership IDs, requested and resulting type, jurisdiction/residency selection, policy/configuration versions, idempotency correlation, subject links created, decision, time, and outcome. Do not place sensitive profile values in ordinary audit fields.

#### Postconditions

- A stable workspace exists with one explicit owner and at least one subject, or no successful workspace state exists.
- All resources subsequently created require explicit workspace scope and policy evaluation.
- Any invitations or additional grants are separate events handled by `UC-P1-009`.

#### Acceptance scenarios

`AC-UC-P1-001-01` — **Given** an eligible identity and active Australia configuration, **when** the identity creates a family workspace and adds a managed dependant, **then** one owner membership and two distinct subjects exist, the dependant has no credentials or membership, and the creation is auditable.

`AC-UC-P1-001-02` — **Given** the same idempotency key is retried after a timeout, **when** creation is processed again, **then** the original workspace is returned and no duplicate owner, membership, subject, or audit side effect is created.

`AC-UC-P1-001-03` — **Given** an actor requests an organisation workspace, **when** policy evaluates the request, **then** creation is rejected and no enterprise resource is exposed or persisted.

`AC-UC-P1-001-04` — **Given** a family administrator and a private resource owned by another member, **when** the administrator completes onboarding or later views workspace summaries, **then** neither the resource nor its existence is disclosed by the administrator role alone.

### `UC-P1-002` — Capture, quarantine, process, and review a document

| Field | Specification |
|---|---|
| Objective | Convert browser upload, PWA camera capture, or manual entry into a truthful, retryable ingestion job while isolating unsafe content and routing uncertain derived results to review. |
| Primary actors | `ACT-HO`, `ACT-FA`, or `ACT-AM` with create permission |
| Supporting actors | `ACT-WS`, `ACT-CP` |
| Preconditions | The actor has create permission in the selected workspace and target resource scope; supported-format and processing profiles are active; ingestion dependencies can report health. |
| Trigger | The actor submits a file, camera capture, or manual record. |
| Linked requirements | `REQ-P1-ING-001`–`REQ-P1-ING-008`, `REQ-P1-DOC-001`, `REQ-P1-DOC-004`, `REQ-P1-DOC-006`, `REQ-P1-DOC-007`, `REQ-P1-AI-001`–`REQ-P1-AI-006`, `REQ-P1-TRUST-002`–`REQ-P1-TRUST-004` |
| Linked gaps/decisions | `GAP-003`, `GAP-004`, `GAP-009`; `DEC-005`, `DEC-006`, `DEC-008`, `DEC-009`, `DEC-024`, `DEC-031`, `DEC-035`, `DEC-036`, `DEC-045`, `DEC-052`; connector activation and public format coverage remain evidence-gated |
| Approved safety boundary | `DEC-036` requires isolated `POLICY_HOLD`, blocks ordinary preview/extraction/search/graph/AI/sharing/export, allows deletion, and requires explicit safe reclassification before ordinary processing. |

#### Main flow

1. The actor selects a workspace, subject/resource context, and capture route. The client validates only for usability; the service performs authoritative checks.
2. The service authorizes creation, assigns an idempotency key and acquisition identity, and records capture provenance without trusting client media type or metadata.
3. For camera capture, the actor reviews pages, rotation, ordering, and legibility before submission; the original submitted capture remains distinguishable from derived normalization.
4. The service receives the content, calculates a content hash, determines media characteristics, records size and provenance, and stores immutable bytes in a non-public, non-processable intake state.
5. Validation and malware scanning run before preview, parsing, indexing, embedding, graph use, or AI access.
6. Clean supported content advances through native extraction or OCR, classification, schema selection, field extraction, evidence anchoring, and review routing. Each derived result records processor/model/schema versions, time, confidence, page and passage/coordinates or span.
7. Low-confidence, conflicting, unsupported, or policy-selected results enter review. The reviewer may correct classification or extracted fields, but review does not automatically accept a fact, fulfil a requirement, approve an action, or close a task.
8. Authorized, eligible derived output is indexed only after its required processing and review gates. The job becomes `READY`, `NEEDS_REVIEW`, or another explicit terminal/recoverable state.
9. Every state transition and review decision is audit-linked to the acquisition, immutable artifact, actor/service, policy, and processing versions.

#### Alternatives and failures

- **Duplicate bytes:** preserve every acquisition attempt; offer an authorized logical-document/version choice without equating hash equality with logical identity.
- **Known malicious or suspicious content:** quarantine blocks download, preview, parsers, AI, indexes, and connectors. Only an authorized policy action can release or delete it.
- **Scanner timeout/unavailable:** remain visibly unscanned/quarantined, retry safely, and never bypass scanning to improve availability.
- **Unsupported, corrupt, or encrypted file:** show the configured unsupported/degraded path; do not manufacture extraction success.
- **Suspected clinical content:** stop ordinary flows and apply only the bounded `DEC-036` branch described above.
- **Parser/model timeout or invalid schema:** retain the original, preserve failure provenance, offer policy-allowed retry/manual review, and do not fabricate fields.
- **Out-of-order or duplicate events:** reconcile against the state machine; stale events cannot move a job backward or repeat side effects.
- **Permission revoked mid-process:** processing may retain only what policy permits, but no newly unauthorized preview, result, notification, or review task is released.
- **Cancellation or purge request:** coordinate with the ingestion state machine; late results cannot resurrect cancelled or deletion-blocked derivatives.

#### Authorization and privacy invariants

- The actor must be authorized both to create the resource and to bind it to the selected subject/resource.
- Quarantined bytes are unavailable even to ordinary content readers.
- Processing adapters receive only scoped content and cannot use model text or document instructions as authority.
- Review queues, thumbnails, filenames, extracted fields, counts, and errors enforce resource and field policy.
- Raw content, tokens, and sensitive extracted values are excluded from ordinary logs, metrics, traces, screenshots, and error payloads.

#### Audit and evidence

Preserve acquisition attempt, idempotency key, immutable artifact ID/hash, claimed and detected media type, scan decision and engine version, processing states, processor/model/schema versions, evidence anchors, confidence, reviewer decisions, failures/retries, authorization decisions, and correlation. Malware signatures or sensitive content appear only in approved security evidence stores.

#### Postconditions

- Immutable content is either safely rejected/policy-pending, quarantined, failed with a recoverable truthful state, awaiting review, or ready for authorized use.
- No extracted result has silently become a canonical fact or fulfilment decision.
- All active derived output can be traced to the exact artifact and processor versions.

#### Acceptance scenarios

`AC-UC-P1-002-01` — **Given** the same clean file is uploaded repeatedly and one attempt times out after scanning, **when** jobs and events retry out of order, **then** each acquisition is preserved, no uncontrolled logical document/version or side effect is created, and the immutable bytes and truthful state remain intact.

`AC-UC-P1-002-02` — **Given** a malicious-file fixture, **when** scanning marks it suspicious, **then** no preview, download, parser, index, embedding, graph, or AI path can access it and an authorized quarantine decision is required.

`AC-UC-P1-002-03` — **Given** low-confidence classification and extraction, **when** a reviewer corrects the type and one field, **then** the correction has exact evidence and audit history but no fact, requirement, action, or task is automatically approved.

`AC-UC-P1-002-04` — **Given** a synthetic clinical-record fixture, **when** capture detects it, **then** it cannot enter ordinary extraction, graph, search, or AI flows and the UI reports the unresolved `DEC-036` policy branch without misclassifying it as health-insurance evidence.

`AC-UC-P1-002-05` — **Given** access is revoked during processing, **when** processing later finishes, **then** stale permissions do not expose the preview, result, task, notification, citation, or existence to the revoked actor.

### `UC-P1-003` — Manage document, evidence, and version lifecycle

| Field | Specification |
|---|---|
| Objective | Preserve exact originals and evidence while creating logical versions, comparisons, supersession, conformed effective views, archive/trash/restore states, and controlled access. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM` according to resource/action grants |
| Supporting actors | `ACT-WS`, optionally `ACT-CP` for comparison |
| Preconditions | At least one accepted immutable artifact exists; the actor has the requested view or lifecycle action; version and supersession configuration is active. |
| Trigger | An actor opens a document, adds replacement evidence, requests comparison, or initiates a lifecycle transition. |
| Linked requirements | `REQ-P1-DOC-001`–`REQ-P1-DOC-005`, `REQ-P1-DOC-008`, `REQ-P1-ING-005`, `REQ-P1-ING-007`, `REQ-P1-ING-008`, `REQ-P1-SRCH-002`, `REQ-P1-SRCH-005`, `REQ-P1-FCT-001`, `REQ-P1-ACT-005`–`REQ-P1-ACT-008` |
| Linked gaps/decisions | `GAP-003`, `GAP-004`, `GAP-005`; `DEC-004`, `DEC-005`, `DEC-006`, `DEC-008`, `DEC-009`; purge timing remains open in `DEC-039` |
| Release-evidence dependency | This use case defines lifecycle semantics and delegates final purge execution to `UC-P1-012`; `DEC-053` sets the 30-calendar-day document Trash/restore window, while backup expiry and lawful/account-retention exceptions require their applicable release evidence and policy. |

#### Main flow

1. The actor opens an authorized logical document view. The service returns only permitted metadata, versions, fields, evidence anchors, relationships, and actions.
2. The actor can inspect or download an exact original through a short-lived, version- and actor-scoped access grant. The service reauthorizes redemption and does not expose a permanent public URL.
3. When replacement or amended evidence arrives, the actor or service proposes whether it belongs to an existing logical document or a new one; byte equality is evidence for duplication, not the logical-identity decision.
4. If accepted as a new version, the service links the immutable artifact without overwriting the prior version, records acquisition and decision provenance, and leaves effective/supersession status explicit.
5. An authorized comparison identifies the exact source versions, material differences, unchanged uncertainty, and citations. Model interpretation is labelled as derived output.
6. A consequential supersession/effective-status change passes policy and any configured approval. Invalid state transitions or missing provenance are rejected.
7. The conformed effective-document view resolves amendment, addendum, cancellation, and supersession relationships while retaining every version and surfacing conflicts or uncertainty.
8. Archive, trash, and restore actions use distinct authorized state transitions; they do not erase originals, history, evidence, or unrelated canonical facts.
9. Any purge request is handed to `UC-P1-012`; pending deletion state is visible to dependent search, graph, AI, task, and export flows.

#### Alternatives and failures

- **Identical bytes for unrelated records:** keep separate logical identities if policy/user decision says they are distinct.
- **Ambiguous replacement:** route to review; do not silently supersede.
- **Comparison failure or unsupported format:** preserve source versions and report an incomplete comparison without asserting no change.
- **Conflicting amendments or effective dates:** show an unresolved conformed-view conflict and block consequential conclusions that depend on it.
- **Expired or revoked artifact grant:** fail without revealing content, filename, or version metadata beyond authorized minimal error information.
- **Concurrent lifecycle changes:** use the approved concurrency contract; stale actors cannot overwrite a later status or approval.
- **Restore after a valid purge boundary:** reject; backup/support mechanisms cannot bypass governed deletion state.

#### Authorization and privacy invariants

- Authorization is reevaluated for every version, field, evidence anchor, comparison source, signed access redemption, and lifecycle action.
- A subject/resource view does not widen the underlying document policy.
- Comparisons, thumbnails, summaries, material-change flags, and version counts cannot leak restricted history.
- Approval to supersede one reviewed version pair cannot authorize a different replacement.

#### Audit and evidence

Record immutable artifact identities and hashes, logical-document/version links, exact comparison inputs and processor versions, lifecycle before/after states, supersession/effective rationale, actor/service, policy/approval, signed-access issuance/redemption outcome, time, and correlation. Do not log access URLs or raw content.

#### Postconditions

- Every active logical version points to immutable source evidence with additive provenance.
- Effective/supersession status and conformed-view uncertainty are explicit.
- Search, facts, graph, obligations, monitoring, tasks, and export can identify the exact version they relied upon.

#### Acceptance scenarios

`AC-UC-P1-003-01` — **Given** an existing policy and a replacement file, **when** an authorized reviewer accepts it as a new version and supersedes the old version, **then** both immutable originals remain intact, the decision and effective time are preserved, and every derived use identifies its source version.

`AC-UC-P1-003-02` — **Given** two records with identical bytes but different logical context, **when** duplicate detection runs, **then** the system preserves both acquisition histories and does not force a shared logical identity.

`AC-UC-P1-003-03` — **Given** an amendment that conflicts with a cancellation date, **when** the conformed view is calculated, **then** the conflict is visible, both sources are cited, and no dependent obligation is presented as definitively effective without resolution.

`AC-UC-P1-003-04` — **Given** a signed artifact URL that has expired, was revoked, belongs to another workspace, or names another version, **when** it is redeemed, **then** access fails without content or metadata leakage.

### `UC-P1-004` — Resolve a fact conflict and record a fact change

| Field | Specification |
|---|---|
| Objective | Resolve evidence occurrences into an effective-dated canonical value without overwriting conflict, provenance, history, or restricted evidence, and emit a governed change for impact assessment. |
| Primary actors | `ACT-HO`, `ACT-FA`, or `ACT-AM` with field-specific fact-resolution authority |
| Supporting actors | `ACT-WS`; `ACT-CP` may propose but cannot approve a value |
| Preconditions | A stable subject/entity exists; one or more authorized evidence occurrences or a permitted manual occurrence exist; fact definitions and resolution policy are active. |
| Trigger | New evidence contradicts an active value, an actor proposes a correction/change, or reprocessing changes a derived occurrence. |
| Linked requirements | `REQ-P1-FCT-001`–`REQ-P1-FCT-006`, `REQ-P1-ING-005`, `REQ-P1-ING-007`, `REQ-P1-ING-008`, `REQ-P1-GPH-001`–`REQ-P1-GPH-004`, `REQ-P1-ACT-001`, `REQ-P1-ACT-005`, `REQ-P1-ACT-006`, `REQ-P1-AI-003`–`REQ-P1-AI-005` |
| Linked gaps/decisions | `GAP-002`, `GAP-003`, `GAP-004`, `GAP-009`; `DEC-004`, `DEC-006`, `DEC-007`, `DEC-008`, `DEC-020` |
| Release-gated dependency | The approved transition fence does not permit reassignment of fact history; any active transition requires an approved applicable consent/authority policy under `REQ-P1-WS-007`. |

#### Main flow

1. The service creates or receives an occurrence anchored to a document version/passage, manual entry, connector record, or governed source. It does not alter the canonical fact.
2. The service evaluates field-level authorization before showing candidate values, source identity, subject linkage, or conflict existence.
3. The service compares the occurrence with effective and historical fact values and opens a conflict/change proposal when policy, confidence, or a user request requires resolution.
4. An authorized resolver reviews each permitted occurrence, evidence quality, valid/effective dates, transaction history, confidence, conflicts, downstream-dependency preview, and any required professional-review notice.
5. The resolver chooses a policy-supported outcome: accept a new value, correct effective dates, retain the current value, mark an occurrence disputed, supersede a prior resolution, or intentionally tolerate an unresolved conflict with reason.
6. For consequential resolution, the service evaluates policy and obtains the configured approval bound to the reviewed occurrences, value, dates, subject, and effect.
7. The service appends a resolution event with actor, reason, evidence, policy, confidence, valid time, transaction time, and supersession linkage. Prior occurrences and resolutions remain unchanged.
8. If the effective canonical value or material conflict state changes, the service emits one idempotent fact-change event for `UC-P1-007`; dependent impact is not assumed complete until traversal finishes.
9. Authorized views show the current resolution, permitted conflicts, history, citations, and downstream state without exposing restricted occurrences.

#### Alternatives and failures

- **Insufficient evidence:** retain an unresolved or insufficient state; do not select the most convenient or most recent value automatically.
- **Restricted occurrence:** a resolver without access cannot view or use it; policy may disclose only that additional authorized review is required, without source/value/count leakage.
- **Overlapping effective periods:** reject invalid bitemporal intervals or route them to explicit conflict resolution.
- **AI/OCR proposal:** show it as derived evidence with confidence and provenance; it cannot approve itself or become truth through repeated output.
- **Concurrent resolution:** a stale approval or edit fails; the actor must review the current occurrence set and downstream preview.
- **Source version is trashed/pending purge:** apply retention and lineage policy, mark affected resolution evidence state, and prevent a late purge from silently changing truth.
- **Impact service unavailable:** commit the authorized resolution only if the architecture guarantees durable change publication; otherwise fail visibly. Never claim impact analysis completed.

#### Authorization and privacy invariants

- Fact definition, subject, value, occurrence, evidence anchor, conflict, history, and resolution action may each have separate access decisions.
- Membership or family administration alone does not confer authority to see or resolve another subject's sensitive fact.
- Dependency previews and impact-exists disclosures must not reveal restricted resources, subjects, values, edges, snippets, or counts.
- Manual entry and model output are occurrences, not privileged truth sources.

#### Audit and evidence

Preserve occurrence and resolution IDs, subject/entity and fact-definition IDs, authorized evidence-anchor references, old/new effective and transaction intervals, conflict state, actor/service, reason, confidence, policy and approval, supersession links, emitted change ID, time, and correlation. Ordinary audit fields contain safe references rather than raw sensitive values.

#### Postconditions

- A new additive resolution event exists or the prior state remains unchanged with a recorded failed/abandoned attempt.
- Effective and historical answers are reproducible at valid and transaction times.
- Any material change has a durable idempotent input for impact assessment.

#### Acceptance scenarios

`AC-UC-P1-004-01` — **Given** two authorized documents support different home addresses for overlapping effective periods, **when** an authorized actor resolves the newer address with reason and evidence, **then** both occurrences remain, the old and new resolutions are bitemporal, and one fact-change event initiates impact assessment.

`AC-UC-P1-004-02` — **Given** OCR proposes a high-confidence value, **when** no configured auto-resolution rule and approval exist, **then** the value remains an occurrence and does not silently become canonical truth.

`AC-UC-P1-004-03` — **Given** one conflicting occurrence is restricted from the actor, **when** the actor reviews the fact, **then** no value, source, subject, count, or relationship is leaked and the service applies only an approved minimal-disclosure/review-routing policy.

`AC-UC-P1-004-04` — **Given** an approval was issued against an earlier occurrence set, **when** new material evidence arrives before execution, **then** the approval is invalidated or rerouted and cannot authorize the changed resolution.

### `UC-P1-005` — Search and ask questions with exact evidence

| Field | Specification |
|---|---|
| Objective | Return permission-aware full-text, filtered, semantic/hybrid, comparison, and conversational results whose material claims cite exact accessible evidence or explicitly state limitations. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM`, `ACT-GU` within granted scope |
| Supporting actors | `ACT-WS`, approved retrieval/reranking/model adapters through `ACT-CP` |
| Preconditions | The actor is authenticated or holds a valid guest grant; eligible resources have current authorization metadata and evidence anchors; retrieval health is observable. |
| Trigger | The actor submits a search, filter, comparison request, or question. |
| Linked requirements | `REQ-P1-SRCH-001`–`REQ-P1-SRCH-005`, `REQ-P1-GPH-002`, `REQ-P1-GPH-004`, `REQ-P1-FCT-004`, `REQ-P1-FCT-006`, `REQ-P1-AI-001`–`REQ-P1-AI-007`, `REQ-P1-TRUST-002`–`REQ-P1-TRUST-004` |
| Linked gaps/decisions | `GAP-003`, `GAP-009`; `DEC-006`, `DEC-008`, `DEC-009`, `DEC-035`, `DEC-040`, `DEC-049`, `DEC-050`; public launch profiles and exact processing routes remain release-gated |
| Release-gated dependency | An adapter may process content only under the approved applicable residency/data-processing route; unsupported or unproven processing must be blocked or disclosed before consent, not assumed. |

#### Main flow

1. The service resolves the acting identity/grant, workspace, purpose, current conversation scope, and requested operation.
2. It authorizes candidate stores and applies current workspace, resource, field, version, status, and purpose policy before and after retrieval; indexing-time permission alone is insufficient.
3. Retrieval combines only approved full-text, metadata/filter, semantic/hybrid, graph, or historical sources and records query and index/model versions using privacy-safe telemetry.
4. The service reauthorizes candidates, evidence anchors, snippets, facets, counts, and graph expansions before reranking or model context construction.
5. For a document comparison, it binds the exact authorized source versions and uses `UC-P1-003` semantics.
6. The assistant classifies available evidence as supported, conflicting, stale, incomplete, insufficient, or restricted. It does not treat lack of access as proof that no evidence exists.
7. Each material supported claim cites the exact document version and page/passage/anchor or governed-source snapshot. Citation access is reauthorized when followed.
8. If accessible evidence cannot support the requested conclusion, the answer states the specific safe limitation, suggests permitted next steps, and does not invent a citation or fill the gap from arbitrary web content.
9. Conversation turns store only the approved scoped context; every follow-up repeats authorization and does not revive revoked evidence from prior context or cache.
10. The service returns results and a privacy-safe audit/telemetry record of capability, policy, evidence references, model/tool/schema versions, and outcome.

#### Alternatives and failures

- **No accessible match:** return no supported result without confirming whether restricted items exist.
- **Conflicting evidence:** cite permitted competing occurrences and describe the unresolved/resolved state; do not select one without resolution authority.
- **Stale source/index:** visibly degrade or exclude it according to policy; never present last-known content as current.
- **Restricted evidence:** say only what minimal-disclosure policy permits, such as inability to answer from accessible evidence; never fabricate a redacted citation whose existence leaks data.
- **Citation revoked between answer and navigation:** navigation fails safely and the conversation no longer uses that evidence.
- **Prompt injection in a document or source:** treat instructions as content; tool and retrieval authority remain independent and structured-output validation applies.
- **Provider timeout/refusal/schema error/cost limit:** return an explicit retry-safe degraded result; do not manufacture success or lose already authorized deterministic search results.
- **Incomplete or truncated graph/search:** label coverage and uncertainty rather than claiming exhaustive results.

#### Authorization and privacy invariants

- Authorization is enforced across query parsing, candidates, filters, counts, snippets, reranking, model context, citations, conversation state, caches, analytics, and tool execution.
- Guests cannot broaden their purpose, resource set, historical versions, or export/action authority through natural-language instructions.
- Restricted evidence is excluded before model context construction whenever possible and cannot be inferred through response wording, timing, count, or citation identifiers.
- Ordinary logs never contain raw query content or answers unless a separately approved, purpose-limited policy explicitly permits protected storage.

#### Audit and evidence

Record actor/grant, workspace, capability ID/version, authorization-policy version, privacy-safe query correlation, eligible evidence references, exact citations surfaced, retrieval/reranker/model/prompt/tool/schema versions, limitation class, failures, latency/cost categories, and outcome. Preserve sufficient controlled provenance to reproduce an answer subject to retention policy without copying raw content into ordinary logs.

#### Postconditions

- The actor receives authorized results with navigable exact citations or an explicit privacy-safe limitation.
- No answer, conversation, cache, analytic, or citation path widens access.
- Derived interpretations remain distinguishable from approved facts, rules, and source evidence.

#### Acceptance scenarios

`AC-UC-P1-005-01` — **Given** authorized, conflicting, stale, and restricted evidence, **when** the actor asks a question not fully supported by accessible current evidence, **then** supported claims have page/passage citations, conflict/staleness is identified, insufficiency or restriction is stated safely, and no conclusion or citation is fabricated.

`AC-UC-P1-005-02` — **Given** access to a cited document is revoked after an earlier answer, **when** the actor follows the citation or asks a follow-up, **then** neither navigation nor conversation context exposes the document, value, snippet, relationship, or prior cached content.

`AC-UC-P1-005-03` — **Given** a document contains instructions to reveal another household member's records and call a connector, **when** the assistant processes it, **then** the text remains untrusted evidence, authorization and tool policy remain unchanged, and no unauthorized data or action is produced.

`AC-UC-P1-005-04` — **Given** a comparison processor cannot establish whether a clause changed, **when** two versions are compared, **then** the result identifies both source versions and reports uncertainty rather than claiming no material change.

### `UC-P1-006` — Monitor a date, user event, document, dependency, or governed source

| Field | Specification |
|---|---|
| Objective | Detect configured changes through distinct monitoring strategies, preserve governed observations, evaluate applicability, expose failures and coverage, and emit deduplicated change candidates. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM` for user events and subscriptions; `ACT-TS` for governed-source retrieval |
| Supporting actors | `ACT-WS`, parser/provider adapter through `ACT-CP` |
| Preconditions | An active versioned monitoring rule and subscription/context exist; jurisdiction, effective period, source and applicability metadata are valid; the service can report scheduler/source/parser health. |
| Trigger | A date/periodic schedule is due, a user/life event is recorded, a document/dependency version changes, or a governed source is retrieved/observed. |
| Linked requirements | `REQ-P1-MON-001`–`REQ-P1-MON-007`, `REQ-P1-CFG-002`–`REQ-P1-CFG-004`, `REQ-P1-GPH-001`, `REQ-P1-GPH-003`, `REQ-P1-GPH-005`, `REQ-P1-ACT-001`, `REQ-P1-ACT-003`, `REQ-P1-ACT-004`, `REQ-P1-TRUST-004` |
| Linked gaps/decisions | `GAP-002`, `GAP-006`; `DEC-001`, `DEC-006`, `DEC-007`, `DEC-008`, `DEC-020`, `DEC-035`, `DEC-040`, `DEC-049`; public source coverage and exact external routes remain release-gated |
| Release-gated dependency | `DEC-035` permits governed synthetic sources but no source or topic is a public launch commitment until the reviewed production package passes; the system must disclose enabled coverage and gaps rather than extrapolate from the domain envelope. |

#### Main flow

1. The service selects a specific active rule/subscription version and validates jurisdiction, subject/resource scope, effective time, source governance, ownership, and review requirements.
2. It records a trigger identity and idempotency key for one of the distinct strategies: date, periodic, user/life event, source change, dependency, or document version.
3. For date/periodic triggers, the service evaluates the configured temporal condition; elapsed time alone cannot renew evidence or prove fulfilment.
4. For user events, it preserves actor, evidence, effective date, and confidence and treats the event as an occurrence until any required fact resolution completes.
5. For document/dependency triggers, it binds the exact version/change and graph provenance; incomplete or cyclic traversal is explicit.
6. For a governed source, `ACT-TS` retrieves the official endpoint and records an immutable snapshot or verifiable no-change observation with retrieval time, identity, hash, parser version/result, coverage, and error state.
7. Source health updates last attempt, last success, freshness, parser failure, retry history, and stale/disabled status without overwriting the prior snapshot.
8. The service determines whether a material change was observed, then evaluates applicability separately from authority, source health, evidence strength, confidence, severity, and urgency.
9. Non-applicable observations are retained with rationale. Applicable or review-required changes emit one deduplicated change candidate for `UC-P1-007` with exact rule and evidence references.
10. Coverage, freshness, known gaps, retry/escalation state, and replay correlation are visible to authorized actors and privacy-safe operations views.

#### Alternatives and failures

- **Duplicate or out-of-order trigger:** deduplicate/reconcile without duplicate recommendations or lost later applicability.
- **Parser failure or freshness expiry:** mark the source failed/stale; dependent results degrade under policy and the last success is not presented as current.
- **Endpoint unavailable or rate-limited:** record the attempt, back off/retry under policy, and expose the gap without claiming no change.
- **Source content changes but parser output does not:** retain the new snapshot/hash and route unexpected differences or coverage loss to review.
- **Rule outside jurisdiction/effective period:** retain non-applicable rationale and do not issue a required action.
- **User event lacks evidence or authority:** record it as unverified/needs review; do not silently change canonical facts.
- **Graph cycle, fan-out, stale edge, or depth limit:** terminate deterministically, report truncation/incompleteness, and avoid exhaustive-coverage claims.
- **Rule/configuration changes during evaluation:** bind the run to one version; publish/replay under the new version as a separately traceable evaluation.

#### Authorization and privacy invariants

- Subscriptions, event evidence, source-derived impacts, health alerts, and monitoring counts are workspace/resource scoped.
- A source is authoritative only within declared jurisdiction/topics/coverage; arbitrary web content is not substituted after failure.
- Monitoring may disclose a restricted impact only through an approved minimal-disclosure route and cannot reveal protected sources or paths.
- Source parser/model instructions cannot expand retrieval, publication, notification, or action authority.

#### Audit and evidence

Record rule/subscription/source/version IDs, trigger strategy and ID, scheduler/retrieval times, immutable snapshot or no-change evidence, content hash, parser/version/result, source health, coverage, applicability inputs and rationale, confidence and severity components, dedup/replay linkage, actor/service, failures/retries, emitted change ID, and correlation.

#### Postconditions

- The observation and health state are reproducible and never hidden by a last-known success.
- Each applicable/review-required candidate has exact governed evidence and rule version; non-applicable outcomes retain rationale.
- No recommendation or action is executed by monitoring alone.

#### Acceptance scenarios

`AC-UC-P1-006-01` — **Given** a passport-expiry rule and an authorized current document version, **when** its configured date window is reached, **then** one deduplicated change candidate is emitted with the rule/version evidence and no claim that the passport was renewed or an obligation fulfilled.

`AC-UC-P1-006-02` — **Given** a user records a household address event, **when** monitoring processes it, **then** the event retains actor/evidence/effective time and initiates only the fact-resolution or impact path permitted by policy.

`AC-UC-P1-006-03` — **Given** a governed source has a last successful snapshot but its current parser fails and freshness expires, **when** dependent rules are evaluated, **then** the source is visibly failed/stale, the old result is not called current, retry/escalation is recorded, and repair supports deterministic replay.

`AC-UC-P1-006-04` — **Given** an official change is authoritative but outside the subject's jurisdiction or effective period, **when** applicability runs, **then** it is retained as non-applicable with rationale and does not create a misleading required action.

`AC-UC-P1-006-05` — **Given** graph traversal encounters a cycle and a depth limit, **when** dependency monitoring runs, **then** it terminates deterministically, marks coverage incomplete, and does not imply that all impacts were found.

### `UC-P1-007` — Assess impact, approve action, and close with evidence

| Field | Specification |
|---|---|
| Objective | Turn an authorized material change into explainable, permission-safe impacts and recommendations, bind consequential approval to exact inputs/effects, execute controlled work, and close only after verified evidence. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM`, or `ACT-GU` with the specific review/approval/action authority |
| Supporting actors | `ACT-WS`; provider-neutral action adapter through `ACT-CP` |
| Preconditions | An idempotent fact, document, event, dependency, or governed-rule change exists with evidence; graph/rule health and actor authority are evaluable. |
| Trigger | A durable change candidate becomes eligible for impact assessment. |
| Linked requirements | `REQ-P1-ACT-001`–`REQ-P1-ACT-008`, `REQ-P1-GPH-002`–`REQ-P1-GPH-005`, `REQ-P1-FCT-002`–`REQ-P1-FCT-004`, `REQ-P1-MON-005`–`REQ-P1-MON-007`, `REQ-P1-NTF-001`, `REQ-P1-NTF-002`, `REQ-P1-SHR-005`, `REQ-P1-AI-001`–`REQ-P1-AI-006` |
| Linked gaps/decisions | `GAP-004`, `GAP-005`, `GAP-009`; `DEC-001`, `DEC-004`, `DEC-005`, `DEC-006`, `DEC-007`, `DEC-008`, `DEC-009`, `DEC-020` |
| Release-gated dependency | External connector actions are available only for adapters whose exact scope, consent, route and conformance gates pass under `DEC-031`, `DEC-045`, and the applicable processing/residency policy. |

#### Main flow

1. The service claims the change candidate idempotently and binds the exact change, evidence, rule/configuration, valid/transaction times, and workspace.
2. Applicability is established before impact. If uncertain or stale, the assessment is marked review-required or unavailable under policy rather than forced actionable.
3. The service traverses eligible typed dependencies using current resource, field, edge, and derivative authorization, with cycle/depth/fan-out/stale-edge handling.
4. For each authorized impact, it preserves at least one inspectable typed path and classifies the outcome as automatic technical update possible, user action required, external notification required, review required, or no action.
5. It derives severity, urgency, confidence, evidence strength, applicability, and source health separately and reports coverage/truncation.
6. A consequential recommendation includes observed change, applicability, path, exact evidence, affected subject/resource, uncertainty, proposed action, and approval requirement. Missing required evidence blocks actionable status.
7. An authorized actor may approve, reject, edit, defer, dismiss, or mark not applicable where policy permits. Approval binds actor, policy, exact reviewed inputs, target, proposed effect, and expiry.
8. Before execution, the service reauthorizes actor and target and verifies that material inputs, policy, evidence, and approval remain current. A material change invalidates or reroutes approval.
9. Approved work creates a new immutable version, controlled task/checklist/draft, or provider-neutral connector command. Result, partial success, timeout, retry, and reversal options remain explicit.
10. Completion of work does not close the recommendation automatically. The service requires configured replacement/fulfilment evidence and verification state.
11. Once authorized verification succeeds, the service closes the recommendation/obligation, preserves the complete chain, and updates related tasks/notifications idempotently.

#### Alternatives and failures

- **No applicable impact:** retain the assessment and rationale as `NO_ACTION`; do not create a misleading task.
- **Restricted dependency:** omit protected details or use approved impact-exists routing; never leak subject, resource, value, edge, count, or citation.
- **Stale source/incomplete graph:** visibly degrade or block actionable status according to policy.
- **Approval rejected, edited, deferred, dismissed, or not applicable:** record the distinct outcome and reason; do not collapse them into completion.
- **Approval expired, inputs changed, or grant revoked:** fail closed and require renewed review where allowed.
- **External timeout/partial success:** remain pending/partially executed, reconcile idempotently, and never mark closure from request submission alone.
- **Replacement evidence conflicts or is insufficient:** keep open or route to review; file presence or elapsed time is not fulfilment.
- **Replayed change:** update the existing assessment or create a traceably superseding one according to contract; do not duplicate actions.

#### Authorization and privacy invariants

- Seeing an impact, reviewing evidence, approving, executing, verifying, closing, and exporting audit history are separate authorities.
- A recommendation exposes only paths and citations the actor may access; minimal-disclosure routing is policy-controlled.
- Approval cannot be supplied or expanded by model text, document instructions, stale session state, or prior unrelated consent.
- Bulk and external actions receive the same or stricter bound approval and policy evaluation as single actions.

#### Audit and evidence

Preserve change and assessment IDs, exact rule/snapshot/evidence, applicability rationale, authorized dependency path or protected-path token, separated scoring components, recommendation state, every actor decision/reason, policy and approval binding/expiry, execution command and idempotency key, provider result/reconciliation, replacement evidence and verifier, closure decision, models/tools/schemas, time, and correlation.

#### Postconditions

- Each impact is explainable, permission-safe, and linked to its triggering change.
- Consequential execution either has a current bound approval or did not occur.
- Closure has configured verified evidence; failures and incomplete work remain visible.

#### Acceptance scenarios

`AC-UC-P1-007-01` — **Given** an approved new home-address fact, affected licences/policies/providers, one restricted unrelated document, and a fresh applicable rule, **when** impact assessment runs, **then** every authorized impact has a typed path and exact citations, separate applicability/severity/urgency/confidence/source health, and the restricted resource leaves no unauthorized value, snippet, edge, subject, count, or path disclosure.

`AC-UC-P1-007-02` — **Given** an actor approves a specific reviewed external notification, **when** its target or material draft changes before execution, **then** the approval is invalidated or rerouted and cannot authorize the changed effect.

`AC-UC-P1-007-03` — **Given** an external action times out after possible partial success, **when** reconciliation runs, **then** the state remains truthful and idempotent, retry does not duplicate the effect, and closure waits for verified replacement/fulfilment evidence.

`AC-UC-P1-007-04` — **Given** the applicable source becomes stale or a grant is revoked mid-flow, **when** approval or execution is attempted, **then** policy reevaluates current state, blocks or reroutes the action, and safely audits the outcome.

`AC-UC-P1-007-05` — **Given** a replacement file is uploaded but fails configured evidence verification, **when** the task is submitted, **then** the action and requirement remain awaiting evidence/review and are not auto-renewed or closed.

### `UC-P1-008` — Resolve an expected-document or document-health finding

| Field | Specification |
|---|---|
| Objective | Explain why evidence may be expected or unhealthy and let an authorized user resolve the finding through evidence, alternative, exception, not-applicable, dismissal, or reminder outcomes without presenting file presence as fulfilment. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM`; `ACT-GU` only when the grant includes the specific finding/action |
| Supporting actors | `ACT-WS`; approved analysis adapter through `ACT-CP` |
| Preconditions | A versioned requirement profile or health rule is active and applicable, or a non-authoritative guidance rule is clearly labelled; relevant context and evidence can be evaluated under current authorization. |
| Trigger | The service detects potentially missing, expired, stale, superseded, or contradictory evidence, or a user opens a readiness review. |
| Linked requirements | `REQ-P1-HLT-001`–`REQ-P1-HLT-005`, `REQ-P1-FCT-004`, `REQ-P1-FCT-006`, `REQ-P1-MON-002`, `REQ-P1-MON-005`–`REQ-P1-MON-007`, `REQ-P1-ACT-003`–`REQ-P1-ACT-006`, `REQ-P1-ACT-008`, `REQ-P1-NTF-001`, `REQ-P1-NTF-002` |
| Linked gaps/decisions | `GAP-001`, `GAP-008`; `DEC-006`, `DEC-007`, `DEC-008`, `DEC-020`, `DEC-034`, `DEC-035`; public launch profiles remain release-gated |
| Approved safety boundary | The finding workflow is required. `DEC-034` prohibits aggregate or hidden readiness/content-health/compliance/risk scoring in Phase 1; item-level UX and negative evidence remain required. |

#### Main flow

1. The service selects the exact requirement-profile or health-rule version and evaluates jurisdiction, effective period, subject/resource context, accepted alternatives, exceptions/waivers, evidence criteria, and current source health.
2. It evaluates applicability before creating a finding and records whether the basis is governed authority or explicitly non-authoritative guidance.
3. It searches only authorized evidence and evaluates evidence type, subject, effective/expiry state, verification state, and conformed-document status. A file or extracted field alone does not establish satisfaction.
4. The service creates or updates one deduplicated finding with rationale, rule/evidence citations, uncertainty, affected resource, confidence, and available policy outcomes.
5. An authorized user reviews the finding and permitted evidence. The user may:
   - add or link evidence;
   - select an accepted alternative;
   - mark not applicable with reason;
   - request or record a supported exception/waiver review;
   - dismiss under policy; or
   - remind later.
6. Added evidence follows `UC-P1-002` and remains pending until configured verification completes. Alternative and exception choices require their own applicable rule and evidence.
7. The service records the distinct outcome and updates or creates a task/reminder through `UC-P1-010` where required.
8. If later context, rule, source health, or evidence changes materially, the service re-evaluates and may reopen/supersede the finding with explanation rather than silently changing history.

#### Alternatives and failures

- **No authoritative basis:** label the result as guidance, avoid legal/financial/tax/insurance/immigration conclusions, and do not represent it as mandatory.
- **Restricted context/evidence:** do not leak protected subject, resource, value, count, score contribution, or relationship; route only an approved minimal action.
- **Stale/failed source:** visibly degrade or suspend the finding under policy and do not call the last-known rule current.
- **Alternative not accepted by the profile:** reject the fulfilment choice and explain the authorized configured criteria.
- **Exception/waiver unsupported:** preserve the request but do not mark the requirement fulfilled.
- **Dismiss/remind later:** retain rationale, due state, reversibility, and audit; neither outcome equals not applicable or fulfilled.
- **Duplicate findings:** merge or link deterministically without losing different rule versions, subjects, or evidence states.
- **Score requested before `DEC-034`:** omit it and show explainable individual signals only.

#### Authorization and privacy invariants

- Applicability context, finding existence, evidence, alternatives, waiver state, outcome, and score contribution each enforce current policy.
- Aggregate counts or scores cannot reveal hidden household documents or subjects.
- A family administrator cannot satisfy, dismiss, or mark another subject's private requirement not applicable without the corresponding action authority.
- Model-generated reasoning is not authoritative evidence and cannot invent a legal requirement.

#### Audit and evidence

Record requirement-profile/rule/version, applicability inputs and rationale, source health, authorized evidence references and verification states, finding state, user-selected outcome and reason, alternative/exception basis, reminder linkage, actor/service, model/tool/schema versions where used, time, and correlation.

#### Postconditions

- The finding has one explicit current state and additive history.
- Fulfilment exists only when configured evidence and verification criteria pass.
- Dismissed, not-applicable, alternative, waiver, reminder, and fulfilled outcomes remain distinct and auditable.

#### Acceptance scenarios

`AC-UC-P1-008-01` — **Given** an applicable requirement profile expects current vehicle-registration evidence, **when** no verified evidence exists, **then** the finding explains why it may apply, cites the rule, lists only authorized outcomes, and does not assert fulfilment from an unrelated uploaded file.

`AC-UC-P1-008-02` — **Given** the profile accepts a configured alternative, **when** the actor links and verifies that alternative, **then** the requirement records alternative-based fulfilment with exact evidence and does not pretend the primary document exists.

`AC-UC-P1-008-03` — **Given** an actor selects not applicable, dismiss, and remind later in separate test cases, **when** each action is accepted by policy, **then** each produces a distinct state, rationale, reversibility/escalation behaviour, and audit trail.

`AC-UC-P1-008-04` — **Given** restricted evidence would improve a shared readiness signal, **when** another member views health findings, **then** neither item-level detail nor count/score arithmetic reveals the protected evidence or subject.

`AC-UC-P1-008-05` — **Given** approved `DEC-034`, **when** the user opens readiness, **then** explainable item-level signals may be shown but no aggregate score or legal-compliance/risk guarantee is presented.

### `UC-P1-009` — Share, delegate, expire, and revoke access

| Field | Specification |
|---|---|
| Objective | Grant least-privileged, purpose- and time-scoped access to selected resources/actions and reliably remove all direct and derivative access at expiry or revocation. |
| Primary actors | `ACT-HO`, `ACT-FA`, or `ACT-AM` with grant authority; recipient `ACT-AM` or `ACT-GU` |
| Supporting actors | `ACT-WS` |
| Preconditions | Grantor is currently authorized to delegate the selected scope; recipient identity/contact, resources, fields, actions, purpose, duration, and onward-sharing policy are valid. |
| Trigger | A grantor invites a member/guest, creates a guest link, changes scope, revokes access, or a grant reaches expiry. |
| Linked requirements | `REQ-P1-WS-004`–`REQ-P1-WS-007`, `REQ-P1-SHR-001`–`REQ-P1-SHR-005`, `REQ-P1-SRCH-003`, `REQ-P1-GPH-002`, `REQ-P1-GPH-004`, `REQ-P1-TRUST-002`, `REQ-P1-TRUST-004`, `REQ-P1-TRUST-009` |
| Linked gaps/decisions | `GAP-007`; `DEC-003`, `DEC-006`, `DEC-008`, `DEC-023`, `DEC-032`, `DEC-033`; automated emergency/incapacity/after-death release is excluded |
| Approved safety boundary | Ordinary explicit/time-aware grants and the approved curated export envelope are specified here. `DEC-032` requires automated trigger-based continuity release to remain unavailable in Phase 1. |

#### Main flow

1. The grantor selects a recipient and explicit workspace/resource/field/action/purpose scope, duration, and any permitted onward-sharing or export constraint.
2. The service reauthorizes the grantor for every selected target and delegation action; possession of content is not automatically permission to delegate it.
3. Before confirmation, the service displays the effective access and excluded capabilities, including browse, graph discovery, search/Q&A, download, approval, action, notification, and export consequences.
4. The grantor confirms. The service creates a stable versioned access grant with issuer, recipient, scope, purpose, start/expiry, policy, consent where required, and revocation state.
5. For a guest link, the service issues a short-lived, non-indexable, rate-limited token whose redemption is separately authorized and reveals no unrelated workspace context.
6. On each use, APIs, workers, previews, search, graph, AI, caches, notifications, exports, connectors, and actions evaluate current grant state and purpose.
7. On expiry or authorized revocation, the service invalidates the grant and propagates revocation to sessions, signed artifact access, conversation context, caches, pending notifications, exports, and action queues within the defined objective.
8. Any stale component that cannot confirm current policy fails closed or reports an explicit safe degradation.
9. The service records grant creation/use/change/expiry/revocation and makes an authorized access history available without exposing protected content.

#### Alternatives and failures

- **Grantor lacks delegation authority:** reject without revealing inaccessible target metadata.
- **Scope contains mixed-authority resources:** require the grantor to remove unauthorized items; do not create a partial surprising grant unless the UI explicitly confirms the reduced set.
- **Recipient already has broader/narrower access:** preserve independent grant provenance and show the effective union only to actors authorized to inspect it.
- **Expired, guessed, reused, or revoked guest link:** fail safely, rate-limit abuse, and reveal no workspace enumeration.
- **Revocation during active search/conversation/export/action:** stop future access, invalidate cached context, cancel or quarantine pending work where safe, and reconcile any completed effect visibly.
- **Grantor later loses authority:** reevaluate whether issued grants remain valid under policy; never assume perpetual delegation.
- **Automated continuity trigger:** reject as intentionally unavailable under approved `DEC-032`.

#### Authorization and privacy invariants

- Membership management, resource access, consent, fact resolution, approval, action, export, and deletion authority remain separate.
- A guest/adviser cannot enumerate household members, resource counts, graph edges, or unrelated search facets.
- Grant scope and purpose are enforced at execution, not only when issued or indexed.
- Revocation must cover derivatives and queued effects, not only primary database reads.

#### Audit and evidence

Record grantor/recipient or token identity, exact scope and exclusions, purpose, policy/configuration version, consent reference, start/expiry, issuance and redemption outcomes, changes, revocation reason, propagation/reconciliation status, actor/service, time, and correlation. Never log raw guest tokens.

#### Postconditions

- A valid explicit grant exists and is currently enforceable, or all covered access is expired/revoked with propagation state visible.
- No ordinary share operation creates automated emergency or after-death authority.
- Existing resource ownership and evidence provenance remain unchanged.

#### Acceptance scenarios

`AC-UC-P1-009-01` — **Given** an adviser is granted read access to two selected documents for seven days, **when** the adviser searches, traverses relationships, follows citations, or exports, **then** only the explicitly granted resources/actions are available and no other household subject, count, edge, or content is discoverable.

`AC-UC-P1-009-02` — **Given** a valid guest link, **when** it expires, is independently revoked, is guessed, or is reused outside policy, **then** redemption fails safely, abuse controls apply, and unrelated workspace context is not exposed.

`AC-UC-P1-009-03` — **Given** a grant is revoked while a conversation, signed download, pending notification, and export job reference the resource, **when** each later executes, **then** current authorization prevents disclosure and any partial prior effect is reconciled and audited.

`AC-UC-P1-009-04` — **Given** a family administrator without private-resource delegation authority, **when** the administrator attempts to share another member's private document, **then** the grant is rejected without confirming protected metadata.

`AC-UC-P1-009-05` — **Given** approved `DEC-032`, **when** an event purporting to prove incapacity or death arrives, **then** no restricted content is automatically released.

### `UC-P1-010` — Manage a task, reminder, and notification

| Field | Specification |
|---|---|
| Objective | Preserve causality from a recommendation or obligation through task ownership, due state, reminders, notification delivery, completion evidence, reopening, and audit without duplicate or privacy-leaking messages. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM`, or scoped `ACT-GU` as assignee/reviewer |
| Supporting actors | `ACT-WS`; channel adapter through `ACT-CP` |
| Preconditions | An authorized recommendation, obligation, or user-created permitted task exists; task/workflow, severity, preference, quiet-period, and channel configuration are active. |
| Trigger | A task is created/assigned, becomes due, changes state, meets escalation rules, or a user requests acknowledgement, snooze, reassign, complete, reopen, or dismiss. |
| Linked requirements | `REQ-P1-NTF-001`–`REQ-P1-NTF-004`, `REQ-P1-ACT-003`, `REQ-P1-ACT-007`, `REQ-P1-ACT-008`, `REQ-P1-HLT-002`, `REQ-P1-SHR-005`, `REQ-P1-TRUST-002`–`REQ-P1-TRUST-004` |
| Linked gaps/decisions | `GAP-004`; `DEC-006`, `DEC-007`, `DEC-008`, `DEC-037`, `DEC-045`; external customer-channel activation remains evidence-gated |
| Release-gated dependency | In-app notification behaviour is required. Email/push/SMS customer channels remain behind a channel-neutral contract and unavailable until exact consent, privacy, configuration, route, and conformance evidence passes. |

#### Main flow

1. The service creates a task from an authorized recommendation/obligation or permitted user action, retaining the causal source, owner/assignee, status, due date, severity/urgency, and evidence requirement.
2. Current policy determines who may see, acknowledge, snooze, reassign, complete, reopen, dismiss, or change the task; visibility of the task does not imply visibility of all underlying evidence.
3. A scheduler evaluates due/escalation rules idempotently with current source health, preferences, quiet periods, acknowledgement, deduplication keys, and approved exceptions.
4. Before rendering or delivery, the service reauthorizes recipient, task, source, and fields. It builds the minimum-content notification permitted for the channel.
5. In-app notification is persisted using a channel-neutral delivery envelope. Approved external channels, if any, receive only policy-permitted content and consented delivery.
6. The user acknowledges, snoozes, reassigns, completes, dismisses, or reopens according to workflow. Each action records actor, reason where required, state transition, and source linkage.
7. Completion that requires evidence invokes the configured verification flow; submitting a task or uploading a file does not close the underlying recommendation/obligation automatically.
8. Duplicate triggers/events converge on one logical notification/task transition; delivery attempts and user-visible state remain distinguishable.
9. Revocation, stale source, recommendation supersession, or corrected due data updates/suppresses/degrades pending notifications under policy without rewriting prior delivery history.

#### Alternatives and failures

- **Unauthorized assignee/action:** reject without exposing protected task source or evidence.
- **Duplicate trigger or retry:** reuse deduplication identity and avoid notification spam or repeated escalation.
- **Quiet period/preferences:** defer normal delivery; only an explicitly approved exception may override, and privacy still applies.
- **Stale/failed source:** suppress or clearly degrade the notification; never present the last-known value as currently verified.
- **Channel unavailable:** preserve task/in-app state and visible delivery failure/retry; do not mark a message delivered from request acceptance.
- **Grant revoked before delivery:** cancel/redact pending delivery and remove later access.
- **Completion evidence missing/invalid:** task may reflect submitted work if policy allows, but recommendation/obligation remains open or under review.
- **Terminal-state race:** concurrency policy rejects or reconciles invalid reopen/complete/dismiss transitions without lost history.

#### Authorization and privacy invariants

- Task existence, source, subject, due date, evidence, assignee, state, and available actions enforce current field/resource policy.
- Lock-screen, email, and push surfaces cannot receive sensitive details without an approved channel/content policy.
- An impact-exists notification may route a safe action but cannot reveal the protected subject/value/source.
- Preferences do not authorize an otherwise forbidden channel or content field.

#### Audit and evidence

Record task/source/recommendation/obligation IDs, owner/assignee, workflow/version, due state, evidence requirement, actor transitions/reasons, notification deduplication key, channel/content classification, policy/consent/preference version, attempt/delivery/acknowledgement/failure state, source-health effect, time, and correlation. Do not store raw external-channel credentials or unapproved message content in ordinary logs.

#### Postconditions

- Task, reminder, and notification states are consistent, causally linked, retry-safe, and independently auditable.
- Closure of a recommendation/obligation occurs only through `UC-P1-007` evidence verification.
- Pending messages no longer disclose revoked or superseded content.

#### Acceptance scenarios

`AC-UC-P1-010-01` — **Given** repeated events for the same due task, **when** notification processing retries, **then** one logical reminder is shown, attempts are traceable, and the user is not spammed.

`AC-UC-P1-010-02` — **Given** an actor snoozes a task, **when** the snooze expires, **then** the task re-enters the configured due flow with preserved causal evidence and history rather than being marked fulfilled.

`AC-UC-P1-010-03` — **Given** the underlying source monitor becomes stale, **when** a pending reminder is evaluated, **then** it is suppressed or visibly degraded under policy and does not state that the old rule/value is current.

`AC-UC-P1-010-04` — **Given** a grant is revoked before notification delivery, **when** the delivery attempt runs, **then** current authorization blocks protected content and safely records cancellation/failure.

`AC-UC-P1-010-05` — **Given** a user marks a task complete without required replacement evidence, **when** closure is evaluated, **then** the recommendation or obligation remains open/awaiting evidence and no automatic renewal occurs.

### `UC-P1-011` — Export an authorized portable workspace package

| Field | Specification |
|---|---|
| Objective | Produce a resumable, checksummed, documented export of the requester's authorized data without leaking another subject's resources or silently omitting declared package classes. |
| Primary actors | `ACT-HO`, `ACT-FA`, or `ACT-AM` with explicit export authority; scoped `ACT-GU` only if the grant expressly permits export |
| Supporting actors | `ACT-WS` |
| Preconditions | The actor is strongly authenticated under the approved policy; export authority and scope are current; an export schema/manifest version and retention policy are active. |
| Trigger | The actor requests export for a workspace, subject, selected resources, or another supported authorized scope. |
| Linked requirements | `REQ-P1-TRUST-002`–`REQ-P1-TRUST-006`, `REQ-P1-WS-004`, `REQ-P1-SHR-001`, `REQ-P1-SHR-003`, `REQ-P1-DOC-001`–`REQ-P1-DOC-004`, `REQ-P1-FCT-006`, `REQ-P1-GPH-002`, `REQ-P1-GPH-004` |
| Linked gaps/decisions | `GAP-007`; `DEC-003`, `DEC-005`, `DEC-008`, `DEC-009`, `DEC-022`, `DEC-033`, `DEC-040`, `DEC-049`; production route evidence remains gated |
| Approved boundary | The complete envelope—originals, versions, derived data, facts, relationships, applicable rules, tasks, reminders, grants, and audit history—is approved by `DEC-033`, subject to current authorization and third-party rights. Every export still versions and declares its actual envelope and cannot claim completion until validation passes. |

#### Main flow

1. The actor selects export scope and sees the enabled package classes, exclusions, third-party-rights constraints, expected processing state, expiry, and security requirements.
2. The service reauthenticates/re-authorizes the actor for export authority separately from ordinary read or family-administration authority.
3. It freezes a logical export request at a declared authorization/evaluation time while requiring current authorization again before each item is packaged and before delivery.
4. The service enumerates eligible originals, versions, metadata, derived results, facts, relationships, rules affecting the actor's resources, tasks, reminders, grants, and audit history according to the approved manifest version.
5. Every candidate item, field, edge, citation, and historical version is reauthorized. Restricted items are excluded or represented only as policy-approved non-identifying omissions.
6. The service generates provider-neutral documented files and a machine-readable manifest containing schema/version, item identities, types, checksums, lineage, status, included/excluded class counts that are safe for the actor, and generation errors.
7. Large exports proceed asynchronously and resumably. Retries do not duplicate or mix request versions, and partial failures remain visible.
8. Before release, the service validates manifest integrity, checksums, package encryption/protection, placement/residency, and current actor/grant status.
9. Delivery uses a short-lived, actor/request-scoped mechanism. Redemption is reauthorized and audited; expiry or revocation invalidates it.
10. Temporary package data expires under the declared policy without deleting source records or altering their provenance.

#### Alternatives and failures

- **Actor has read but not export authority:** reject; ordinary access or family administration does not imply bulk portability rights.
- **Authorization changes during generation:** exclude newly unauthorized items, cancel/restart if consistency requires, or fail visibly; never deliver stale-authorized content.
- **Third-party rights or subject privacy limit an item:** apply the approved exclusion/redaction rule and declare it safely in the manifest without leaking protected existence.
- **Source item pending purge/quarantine:** apply lifecycle policy; quarantined content is not released through export as a bypass.
- **Generation failure or quota/cost limit:** preserve resumable progress and explicit errors; do not label a partial package complete.
- **Checksum/manifest mismatch:** block delivery and regenerate/repair under audit.
- **Expired/revoked download:** fail without exposing filenames, package contents, or workspace metadata.
- **`DEC-033` unresolved:** report the active envelope version and limitations; do not claim complete portability.

#### Authorization and privacy invariants

- Export is a distinct high-impact action, evaluated at request, enumeration, packaging, and redemption.
- A package cannot reveal private resources through manifests, counts, relationship placeholders, rule references, audit entries, or omission messages.
- Export workers and temporary storage remain workspace-, request-, residency-, and retention-scoped.
- Guest/delegated access cannot produce bulk export unless explicitly granted for exact scope/purpose.

#### Audit and evidence

Record requester/grant, scope, strong-auth result reference, authorization-policy versions, manifest/schema version, evaluation times, included item identities and checksums in the protected export record, safe exclusion/error categories, generation/retry/resume/integrity outcomes, delivery issuance/redemption/expiry/revocation, temporary-package deletion, residency placement, time, and correlation. Ordinary logs contain no package contents or download secrets.

#### Postconditions

- A validated, documented, authorized package is available for a bounded period, or the request has an explicit failed/cancelled state.
- The package's declared scope and completeness can be independently checked from its manifest and checksums.
- Source resources, facts, relationships, and audit history are unchanged.

#### Acceptance scenarios

`AC-UC-P1-011-01` — **Given** an actor with explicit export authority and mixed shared/private household data, **when** a workspace-scope export is generated, **then** every included item and field is authorized, restricted existence is not leaked, and the versioned manifest/checksums validate the delivered package.

`AC-UC-P1-011-02` — **Given** a grant is revoked during asynchronous export generation, **when** the job packages or releases data, **then** stale authorization cannot deliver protected content and the job safely cancels, narrows, or fails according to the consistency contract.

`AC-UC-P1-011-03` — **Given** one item fails generation, **when** the job completes processing, **then** it remains explicitly partial/failed with resumable recovery and is not represented as a complete export.

`AC-UC-P1-011-04` — **Given** `DEC-033` is not approved, **when** an export is requested, **then** the service declares the exact active package envelope and does not claim complete portability beyond it.

`AC-UC-P1-011-05` — **Given** an expired, revoked, or wrong-actor package grant, **when** redemption is attempted, **then** access fails without package or workspace metadata leakage.

### `UC-P1-012` — Delete and purge a governed resource

| Field | Specification |
|---|---|
| Objective | Move an authorized resource through explicit archive/trash/deletion/purge states, remove active and derived access, respect approved retention exceptions and backup expiry, and prevent restore/support paths from resurrecting deleted data. |
| Primary actors | `ACT-HO`, `ACT-FA`, or `ACT-AM` with the exact deletion authority; privacy/support roles only under separately approved policy |
| Supporting actors | `ACT-WS`; connector/provider deletion adapters through `ACT-CP` |
| Preconditions | The resource and its derivative lineage are identifiable; actor authority, retention exceptions, holds/reservations, cooling-off policy, backup policy, and audit-minimization rules are evaluable. |
| Trigger | An authorized actor requests trash, restore, resource purge, account deletion, or cancellation within an allowed cooling-off period. |
| Linked requirements | `REQ-P1-DOC-003`, `REQ-P1-ING-002`, `REQ-P1-ING-008`, `REQ-P1-ING-009`, `REQ-P1-TRUST-002`–`REQ-P1-TRUST-005`, `REQ-P1-TRUST-007`, `REQ-P1-TRUST-009`, `REQ-P1-FCT-001`, `REQ-P1-GPH-002`, `REQ-P1-SRCH-003` |
| Linked gaps/decisions | `DEC-005`, `DEC-006`, `DEC-008`, `DEC-022`; active purge objective, cooling-off, backup expiry, and retained-audit minimization depend on `DEC-039`; residency placement/DR implications depend on `DEC-040` |
| Approved boundary | `DEC-053` defines the production 30-calendar-day document Trash/restore window and coordinated final purge; `DEC-039` governs the local profile and broader account/lawful-retention distinctions. Runtime timers and completion claims still require objective environment evidence. |

#### Main flow

1. The actor chooses a governed action—archive, trash, restore, resource purge, or account/workspace deletion—and sees consequences, current scope, recoverability, derivative classes, known retention exceptions, backup-expiry behaviour, and approval/re-authentication requirements.
2. The service strongly authenticates where policy requires and separately authorizes the action for every selected resource; read, administration, or ordinary ownership does not imply all deletion scopes.
3. It computes a privacy-safe deletion plan from lineage: originals, versions, metadata, extraction/OCR, thumbnails/previews, facts/occurrences subject to shared-evidence policy, search/vector/graph derivatives, citations/conversation caches, tasks/notifications, connector copies/commands, replicas, temporary exports, backups, and audit references.
4. Archive or trash changes availability/status without destructive mutation. Restore is allowed only within policy and cannot override a purge block or another subject's authorization.
5. A purge request receives a stable idempotency identity, policy/retention evaluation, any configured approval and cooling-off state, and immediate access restrictions appropriate to policy.
6. At execution eligibility, the service reauthorizes the request and rechecks retention exceptions, pending legal/reserved constraints if applicable, resource version, and cancellation state.
7. Active data and derivatives are deleted or rendered irreversibly inaccessible in dependency-safe order. Search, vector, graph, cache, conversation, notification, export, AI, and connector paths cannot continue to serve deleted content.
8. Shared facts or evidence relationships are handled by explicit lineage/policy: deletion of one occurrence does not rewrite unrelated occurrences or silently erase another authorized subject's evidence, but the deleted source cannot remain accessible through a derivative.
9. Replicas and backups expire or become cryptographically/infrastructurally inaccessible under the declared objective. Restore and support paths enforce deletion tombstones/blocks.
10. Audit evidence is retained, minimized, redacted, or deleted only under the approved policy. It cannot contain raw deleted content in ordinary fields.
11. The service verifies deletion coverage, records exceptions and scheduled expiry, and reports truthful status: pending, cooling-off, executing, partially failed, completed-active, or completed-including-backup objective as defined by contract.

#### Alternatives and failures

- **Unauthorized or ambiguous scope:** reject and require explicit resource/account/workspace selection without confirming inaccessible data.
- **Cancellation during approved cooling-off:** restore only the permitted pre-execution state; preserve request/cancellation audit.
- **Retention exception:** show a lawful/policy-approved, privacy-safe reason and bounded retained classes; do not silently claim full purge.
- **Partial derivative deletion failure:** block completion, retry/reconcile, isolate access, and expose affected class safely.
- **Connector unavailable:** revoke future access immediately where possible, queue/reconcile provider deletion under policy, and disclose retained consequence.
- **Late worker/index event:** deletion state/tombstone prevents resurrection or reindexing.
- **Backup not yet expired:** distinguish active-data completion from backup expiry and ensure ordinary restore/support cannot surface it.
- **Shared occurrence/fact:** preserve only independently authorized records required by the data model; sever/redact deleted lineage without rewriting canonical history silently.
- **Request retried:** return the existing request/state and do not restart cooling-off or duplicate destructive side effects.

#### Authorization and privacy invariants

- Trash, restore, purge, account deletion, cancellation, and exception review are separate permissions.
- Deletion planning/status cannot reveal inaccessible derivatives, subjects, relationships, or audit records.
- Deletion applies to every content-bearing derivative and queued future effect, not just the original object row.
- Support, disaster recovery, reprocessing, replay, and connector resync cannot bypass a completed or executing deletion state.

#### Audit and evidence

Record requester, exact scope and resource versions, strong-auth/approval references, policy and `DEC-039` parameter version once approved, plan/lineage version, requested action, before/after states, cooling-off/cancellation, per-class deletion verification, exceptions, connector/replica/backup status, minimized audit treatment, retries/failures, actor/service, time, and correlation. Deletion audit proves process without retaining raw deleted content.

#### Postconditions

- Archived/trashed resources have the declared recoverability, or purged active data and derivatives are inaccessible with remaining backup/exception status explicitly bounded.
- No stale index, cache, conversation, notification, export, worker, support, or restore path can resurrect accessible content.
- Independent evidence/history is preserved only according to the approved lineage, privacy, and audit policies.

#### Acceptance scenarios

`AC-UC-P1-012-01` — **Given** a document has originals, versions, extraction output, facts, embeddings, graph edges, citations, tasks, caches, replicas, backups, and audit references, **when** approved purge conditions are met, **then** active data and derivatives become inaccessible, per-class completion is verified, backup expiry is disclosed, and retained audit is minimized/redacted under policy.

`AC-UC-P1-012-02` — **Given** a purge job partially fails while removing a search derivative, **when** status is evaluated, **then** the resource remains inaccessible, completion is not falsely reported, retries are idempotent, and the failed class is reconciled.

`AC-UC-P1-012-03` — **Given** a delayed worker result or connector resync arrives after purge execution starts, **when** it attempts to recreate a derivative, **then** deletion state blocks resurrection and safely audits the rejected late event.

`AC-UC-P1-012-04` — **Given** an allowed cooling-off cancellation, **when** the authorized requester cancels before destructive execution, **then** the permitted state is restored without losing request/cancellation history or widening access.

`AC-UC-P1-012-05` — **Given** approved `DEC-053`, **when** product copy or an API requests a completion deadline, **then** it states the 30-calendar-day document Trash boundary accurately and does not invent a separate account-deletion, legal-retention, backup-expiry, or audit-retention promise.

### `UC-P1-013` — Enforce workspace and derivative isolation across a workflow

| Field | Specification |
|---|---|
| Objective | Prove that absent or revoked access cannot leak protected content or existence through any synchronous, asynchronous, derived, cached, support, or audit surface. |
| Primary actors | Any end-user actor attempting an allowed workflow; security/test actor exercising negative paths |
| Supporting actors | `ACT-WS`, `ACT-CP`, `ACT-OP` under test policy |
| Preconditions | Two workspaces and mixed public-to-member/private resources exist; derivatives include cached results, embeddings, graph edges, conversation state, pending notifications, export jobs, audit views, and worker messages. |
| Trigger | An access-controlled workflow runs without a grant, after revocation, after scope reduction, or with a deliberately stale derivative. |
| Linked requirements | `REQ-P1-WS-004`, `REQ-P1-WS-005`, `REQ-P1-FCT-006`, `REQ-P1-GPH-002`, `REQ-P1-GPH-004`, `REQ-P1-SRCH-003`, `REQ-P1-SRCH-004`, `REQ-P1-SHR-001`–`REQ-P1-SHR-003`, `REQ-P1-SHR-005`, `REQ-P1-TRUST-001`–`REQ-P1-TRUST-004` |
| Linked gaps/decisions | `GAP-003`, `GAP-007`, `GAP-009`; `DEC-003`, `DEC-006`, `DEC-008`, `DEC-022`, `DEC-023` |
| Open-decision dependency | This isolation baseline is not conditional. Future recovery, continuity, residency, or support decisions may add narrowly governed routes but cannot silently weaken it. |

#### Main flow

1. The service resolves actor, workspace, membership/grant, purpose, resource, field, edge, action, current time, and policy version for the requested workflow.
2. It denies cross-workspace identity/resource combinations before data access and includes explicit workspace context in service-to-service and worker authorization.
3. It evaluates resource/field/edge authorization when selecting primary data and again before producing every derivative or effect.
4. Search candidates, list counts, facets, snippets, summaries, graph paths, embeddings, reranking context, AI prompts/answers, citations, conversation history, notifications, export manifests, analytics, and audit views are trimmed or denied under current policy.
5. Service jobs and provider adapters receive scoped capability/context rather than ambient access. Document/model text cannot alter authority.
6. On grant revocation or scope reduction, the service invalidates or rechecks active sessions, signed access, caches, conversations, queued jobs, pending notifications, exports, and action commands within the defined objective.
7. If a derivative cannot prove freshness/current policy, it fails closed or presents an explicit safe degradation rather than stale data.
8. Denials and stale-component handling produce privacy-safe security/audit evidence without embedding protected content or values.

#### Alternatives and failures

- **No matching workspace membership:** deny without confirming target workspace/resource existence.
- **Membership exists but resource/field/edge grant does not:** deny or redact at that narrower level; membership does not become blanket access.
- **Authorized action but restricted evidence:** use only a separately approved impact-exists/minimal-disclosure route; do not reveal the protected path.
- **Stale search/vector/graph/cache authorization:** exclude/deny and queue safe repair; do not serve then retract.
- **Revocation races an external effect:** reauthorize before execution; if an effect already occurred, reconcile visibly under the action contract.
- **Support/operator request:** deny raw-content access absent a separately approved exceptional-access policy and audit path.
- **Timing/error oracle:** normalize privacy-sensitive responses and monitor abuse without revealing whether a protected item exists.

#### Authorization and privacy invariants

- Deny by default at workspace, resource, field, edge, retrieval, inference, citation, notification, export, and action layers.
- Minimal disclosure must be an explicit policy outcome; generic error handling is not permission to reveal existence.
- Current policy supersedes permissions captured when content was ingested, indexed, embedded, cached, or added to a conversation.
- Product operators and provider adapters have no standing user-equivalent browse authority.

#### Audit and evidence

Record actor/service class, workspace and safe target reference, action class, policy/version, grant/revocation version, allow/deny/redact/degrade decision, stale derivative class, repair/reconciliation action, time, and correlation. Security evidence may store protected details only in an approved restricted system, never ordinary logs.

#### Postconditions

- Allowed output contains only currently authorized content and effects.
- Denied/revoked workflows disclose no protected value or existence beyond approved minimal disclosure.
- Stale derivatives are blocked/repaired and the security outcome is testable across all product surfaces.

#### Acceptance scenarios

`AC-UC-P1-013-01` — **Given** two workspaces, a family administrator, a private document, restricted fact, cached search result, embedding, graph edge, existing conversation, and pending notification, **when** access is absent, **then** no API, worker, preview, count, facet, result, graph path, answer, citation, follow-up, notification, export, analytic, support, or audit view reveals the resource or value beyond approved minimal disclosure.

`AC-UC-P1-013-02` — **Given** previously valid access is revoked, **when** stale caches and queued jobs execute, **then** current authorization blocks disclosure/effect and the service invalidates, repairs, cancels, or reconciles each derivative under its contract.

`AC-UC-P1-013-03` — **Given** a model or document instructs a worker to use another workspace, **when** a tool call is attempted, **then** explicit workspace/capability authorization rejects it and the instruction cannot change policy.

`AC-UC-P1-013-04` — **Given** an operator lacks exceptional-access authorization, **when** support tooling attempts to view raw household content, **then** access is denied and the attempt is privacy-safely audited.

### `UC-P1-014` — Ingest from a cloud or private-email connector

| Field | Specification |
|---|---|
| Objective | Import user-selected evidence through a provider-neutral connector while preserving consent, source identity/version, permissions, provenance, route eligibility, revocation, deletion, and truthful failure state. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM` |
| Supporting actors | `ACT-WS`, connector/provider adapter |
| Preconditions | The adapter contract exists. Live use additionally requires exact credentials, redirect origins, minimal scopes, consent copy, token protection, route/residency eligibility, revocation/deletion semantics, audit, and provider conformance evidence. |
| Trigger | An authorized user opens connector settings or selects an eligible configured provider/import route. |
| Linked requirements | `REQ-P1-ING-009`, `REQ-P1-TRUST-002`, `REQ-P1-TRUST-005`, `REQ-P1-TRUST-009` |
| Approved boundary | `DEC-045` and `DEC-055` authorize disabled-first adapter implementation; registration or configuration alone does not activate a provider or authorize transfer. |

#### Observable flow and alternatives

1. The product displays provider status, purpose, requested scopes, data route, retained-data consequence, and disconnect/revocation behavior before consent.
2. An ineligible or incomplete adapter remains visibly unavailable and cannot produce a success state, callback, token, import, cursor, or transfer.
3. An eligible adapter binds state/PKCE, callback, identity, workspace, consent version, scope set, selected items, and source item/version identifiers.
4. Imported items enter the same governed ingestion and authorization boundaries as local capture while preserving connector provenance and retry-safe cursors.
5. Disconnect or consent withdrawal stops future retrieval; retained imported evidence follows the disclosed governed deletion policy.
6. Timeout, partial import, duplicate callback/event, permission drift, provider deletion, revocation, or route ineligibility remains visible and reconcilable without duplicate logical effects.

#### Acceptance scenarios

`AC-UC-P1-014-01` — **Given** a provider is missing any required activation evidence, **when** a user or direct callback attempts connection/import, **then** the provider remains visibly unavailable, no token or content is accepted, no simulated success is shown, and the denial is privacy-safely audited.

`AC-UC-P1-014-02` — **Given** an eligible configured provider and explicit user consent, **when** selected items are imported, retried, disconnected, or revoked, **then** source identity/version, scope, consent, provenance, cursor, permissions and retained-data state remain reconstructable, duplicates converge safely, and future retrieval stops after revocation.

### `UC-P1-015` — Preserve a managed dependant through an authority-transition fence

| Field | Specification |
|---|---|
| Objective | Preserve a managed dependant's stable subject, evidence, fact, relationship, and audit history while preventing age, relationship, invitation, or account creation from silently transferring authority. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-MD`; later eligible `ACT-AM` |
| Supporting actors | `ACT-WS` |
| Preconditions | A managed-dependant subject exists separately from identity and membership. No transition activates without an approved, versioned consent/authority policy and required evidence. |
| Trigger | An authorized actor proposes login enablement, independent access, membership, or a future transition for the dependant. |
| Linked requirements | `REQ-P1-WS-003`, `REQ-P1-WS-007`, `REQ-P1-SHR-001`, `REQ-P1-SHR-003` |
| Approved boundary | Phase 1 requires preservation and a fail-closed transition fence; it does not authorize age-based, relationship-based, support-driven, or automatic reassignment of authority. |

#### Observable flow and alternatives

1. The product resolves the subject independently from any proposed identity, membership, relationship, invitation, or grant.
2. Existing evidence and provenance remain attached to the stable subject and are never recreated, relabelled, or reassigned to manufacture a transition.
3. Without an approved applicable policy and evidence, the request remains unavailable or policy-blocked and creates no credentials, membership, grant, key access, export authority, or ownership effect.
4. Phase 1 records an explicit revisioned transition-attempt state and a privacy-safe audit result. No independent-access transfer state can activate; incomplete, ambiguous, failed, retried, rolled-back, stale, concurrent, or partially applied work recovers to the last authorised state and forces permission recalculation.
5. Richer independent transfer/delegation semantics remain a later governed capability. Phase 1 preserves stable identifiers and extension points without implying transferred document rights, inherited authority, delegation chains, credentials, keys, ownership, or private-resource access.

#### Acceptance scenarios

`AC-UC-P1-015-01` — **Given** a dependant reaches an age, receives an invitation, or is linked to a new identity without an approved applicable transition policy, **when** independent access is requested, **then** no membership, credential, grant, key, ownership, export, or hidden-content authority is created and the blocked state is explicit.

`AC-UC-P1-015-02` — **Given** an incomplete, ambiguous, failed, retried, rolled-back, stale, concurrent, or partially applied transition attempt, **when** access is evaluated, **then** it converges to the last authorised state, preserves the stable subject and all historical evidence/provenance, recalculates permission projections, records privacy-safe audit/recovery evidence, and grants no broader access.

### `UC-P1-016` — Keep automated continuity release unavailable

| Field | Specification |
|---|---|
| Objective | Prove that emergency, incapacity, and after-death events cannot automatically release restricted content or authority in Phase 1. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM`, `ACT-GU` |
| Supporting actors | `ACT-WS` |
| Preconditions | Ordinary grants and curated exports may exist; no automatic-release policy, trigger, event consumer, configuration record, or support override is active. |
| Trigger | A user, event, configuration, integration, or operator attempts emergency/incapacity/after-death release. |
| Linked requirements | `REQ-P1-SHR-004`, `REQ-P1-TRUST-002`, `REQ-P1-TRUST-004` |
| Approved boundary | `DEC-032` excludes automated emergency, incapacity, and after-death release from Phase 1. |

#### Acceptance scenarios

`AC-UC-P1-016-01` — **Given** any claimed emergency, incapacity, death, inactivity, date, relationship, or external signal, **when** automated release is attempted, **then** no restricted content, grant, key, membership, ownership, notification, or export authority is created and the unavailable boundary is visible and audited without sensitive claim detail.

`AC-UC-P1-016-02` — **Given** an ordinary grant or curated export exists, **when** a caller tries to repurpose it as automatic continuity release or enable release through configuration/direct access, **then** current explicit scope still applies and the attempt fails without broadening access.

### `UC-P1-017` — Keep account/workspace recovery and ownership transfer unavailable

| Field | Specification |
|---|---|
| Objective | Prove that recovery, ownership transfer, support, family relationship, and key-reset routes cannot weaken authentication, customer-controlled encryption, or resource authorization. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM` |
| Supporting actors | `ACT-WS`, `ACT-OP` |
| Preconditions | Recovery and ownership-transfer activation records and externally callable success routes do not exist. |
| Trigger | A user or operator requests password/account/workspace recovery, ownership transfer, key reset, evidence upload, or support override. |
| Linked requirements | `REQ-P1-TRUST-001`, `REQ-P1-TRUST-002`, `REQ-P1-TRUST-008`, `REQ-P1-CRYPTO-002` |
| Approved boundary | `DEC-038` keeps recovery and ownership transfer unavailable until a separate production assurance decision. |

#### Acceptance scenarios

`AC-UC-P1-017-01` — **Given** an unauthenticated or partially authenticated caller supplies an email, relationship claim, document, support request, or guessed workspace, **when** recovery or ownership transfer is attempted, **then** no account/workspace existence, content, factor, key, membership, grant, or owner state is disclosed or changed.

`AC-UC-P1-017-02` — **Given** an authenticated administrator or operator invokes a direct route, port, configuration, replay, or support path, **when** the unavailable capability is requested, **then** the result remains `POLICY_BLOCKED` or equivalent, ordinary access is unchanged, abuse is bounded, and the attempt is content-minimally audited.

### `UC-P1-018` — Publish consequential reference configuration

| Field | Specification |
|---|---|
| Objective | Move a versioned consequential configuration package through proposal, validation, independent review/approval, publication, effective dating, activation, supersession, rollback/forward repair, impact assessment, and replay without rewriting history. |
| Primary actors | Authorized configuration maintainer; independent reviewer/approver |
| Supporting actors | `ACT-WS`, `ACT-OP` |
| Preconditions | The package declares schema/version, owner, jurisdiction, applicability, evidence/source, effective dates, compatibility, review requirements, and affected consumers. |
| Trigger | An authorized maintainer proposes a new or changed package. |
| Linked requirements | `REQ-P1-CFG-001`–`REQ-P1-CFG-004`, `REQ-P1-TRUST-003`, `REQ-P1-TRUST-004` |
| Approved boundary | Configuration may implement approved policy but cannot independently create product scope, weaken security/privacy, activate a provider, or override a higher-authority decision. |

#### Observable flow and alternatives

1. Validation rejects dangling IDs, invalid schemas, missing authority/evidence/applicability, unsafe compatibility, and unapproved external routes before publication.
2. Proposal, review, approval, publication, and activation authorities are separated according to risk.
3. Activation is atomic and effective-dated; consumers acknowledge compatible versions before consequential use.
4. Supersession and repair preserve prior package, decision, findings, replay inputs, and audit history.
5. A failed activation leaves the prior eligible version active and the failure visible; rollback cannot revive revoked permissions or erase decisions already made under an earlier version.

#### Acceptance scenarios

`AC-UC-P1-018-01` — **Given** a package is invalid, incomplete, expired, unapproved, incompatible, or attempts to activate forbidden scope/provider behavior, **when** publication or activation is attempted, **then** no consumer uses it, the prior eligible version remains authoritative, and actionable validation evidence is recorded.

`AC-UC-P1-018-02` — **Given** an approved effective-dated package changes a consequential rule, **when** it activates, supersedes, rolls back, or is forward-repaired, **then** affected findings are identified, replay is deterministic, consumer acknowledgements are visible, and no prior evidence or decision history is rewritten.

### `UC-P1-019` — Inspect a privacy-safe audit history

| Field | Specification |
|---|---|
| Objective | Let an authorized user reconstruct security- and consequence-relevant activity without exposing raw document content, secrets, restricted values, or unauthorized resource existence. |
| Primary actors | `ACT-HO`, `ACT-FA`, `ACT-AM`, `ACT-GU` within exact grant scope |
| Supporting actors | `ACT-WS`, authorized `ACT-OP` |
| Preconditions | Audit records are append-only/tamper-evident, workspace-scoped, content-minimized, correlated, retained under policy, and independently authorized from source resources. |
| Trigger | An authorized actor opens, filters, exports, or verifies an audit history or evidence link. |
| Linked requirements | `REQ-P1-TRUST-002`–`REQ-P1-TRUST-004`, `REQ-P1-TRUST-006`, `REQ-P1-TRUST-007` |
| Approved boundary | Audit visibility does not grant source-content access and cannot reveal hidden resource existence through actors, targets, counts, filters, correlations, errors, timing, or exports. |

#### Acceptance scenarios

`AC-UC-P1-019-01` — **Given** an authorized actor requests permitted activity, **when** the history is viewed or exported, **then** actor/service, action, authorized target reference, policy/reason, decision, outcome, correlation and time are reconstructable while raw content, secrets and unauthorized values remain absent.

`AC-UC-P1-019-02` — **Given** a foreign workspace, restricted target, stale grant, tampered record/chain, retention boundary, or audit-store failure, **when** history is requested or verified, **then** disclosure fails closed or visibly degrades, tamper/failure evidence is preserved, and no ordinary workflow falsely claims complete audit evidence.

### `UC-P1-020` — Discover Doculyra and enter account creation or sign-in

| Field | Specification |
|---|---|
| Objective | Help an unauthenticated prospective user understand Doculyra, its trust and preview boundaries, and enter the governed account-creation or sign-in flow. |
| Primary actors | Prospective `ACT-HO` or `ACT-FA`; unauthenticated visitor |
| Supporting actors | Public web client |
| Preconditions | Public product, privacy, terms, and account-entry routes are deployed independently from customer workspace authorization. |
| Trigger | A visitor opens the public site or follows a public product, legal, create-account, or sign-in route. |
| Linked requirements | `REQ-P1-PLT-001`, `REQ-P1-PLT-003`; `AC-P1-PUB-001`, `AC-P1-A11Y-001` |
| Approved boundary | Public content uses `PROD-VIS-001`, `DEC-044`, and `DEC-047`; it is not evidence of production readiness, legal approval, active providers, completed controls, or permission to use real personal data. |

#### Observable flow and alternatives

1. The visitor can navigate product, intelligence/features, privacy/security, about/company, contact, privacy, and terms content without authentication.
2. Create-account and sign-in actions route to the governed authentication/onboarding entry with intent preserved.
3. The experience shows development-preview, synthetic-data, unavailable-provider, and non-advice boundaries wherever omission could create a false production or authority claim.
4. Missing contact/provider configuration is shown as unavailable; route errors do not disclose account/workspace existence or fall through to authenticated data.
5. Public navigation and content remain operable under applicable responsive, keyboard, screen-reader, focus, contrast, reflow, and error requirements.

#### Acceptance scenarios

`AC-UC-P1-020-01` — **Given** an unauthenticated visitor on a supported viewport or assistive-technology path, **when** they traverse public product, privacy/security, about/contact, privacy, terms, create-account and sign-in routes, **then** every route is operable without a session, the approved identity and preview boundaries remain consistent, and no customer/workspace data is requested or exposed.

`AC-UC-P1-020-02` — **Given** a provider, contact route, production legal detail, or control is unavailable or incomplete, **when** the visitor encounters its public representation or enters account creation/sign-in, **then** the exact unavailable/preview state is shown without simulated success, unsupported assurance or production claims, silent external transfer, or loss of the selected account-entry intent.

## 6. Resolved catalogue boundaries

`UC-P1-014`–`UC-P1-020` now have detailed, testable product boundaries. This closes the missing-product-detail basis of `TRACE-GAP-P1-UC-001`; implementation, specialist contracts, activation evidence, and independent test execution remain separately gated and must not be inferred from catalogue completeness.

## 7. Approved-decision impact matrix

| Decision | Affected use cases | Approved Phase 1 behaviour |
|---|---|---|
| `DEC-030` — release slices | All | Slice labels are planning metadata, not implementation authority. |
| `DEC-031` — connectors | `UC-P1-002`, `UC-P1-006`, `UC-P1-007`, `UC-P1-014` | Upload, camera, and manual entry are required; connector adapters may be implemented disabled-first and require live-activation evidence. |
| `DEC-032` — emergency/after-death release | `UC-P1-009`, `UC-P1-016` | No automated release; ordinary explicit grants and curated exports remain separate. |
| `DEC-033` — complete export envelope | `UC-P1-011` | Export declares its exact versioned envelope and cannot claim completeness beyond it. |
| `DEC-034` — readiness score | `UC-P1-008` | Show explainable item-level signals only; no aggregate score or compliance/risk guarantee. |
| `DEC-035` — launch document/source pack | `UC-P1-002`, `UC-P1-003`, `UC-P1-006`, `UC-P1-008` | Configuration may represent the domain envelope, but enabled formats/types/profiles/sources and coverage claims remain explicit. |
| `DEC-036` — suspected clinical capture | `UC-P1-002` | Isolate in `POLICY_HOLD`; block ordinary extraction, graph, search, and AI. |
| `DEC-037`/`045` — notification channels | `UC-P1-010` | Use a channel-neutral contract; in-app is required and external delivery remains activation-gated. |
| `DEC-038` — recovery assurance | `UC-P1-001`, `UC-P1-009`, `UC-P1-017` | Recovery and ownership transfer are unavailable; no weaker path may bypass authentication, private-resource policy, or grants. |
| `DEC-039`/`053` — document deletion | `UC-P1-003`, `UC-P1-011`, `UC-P1-012`, `UC-P1-019` | Fence immediately, retain recoverable Trash for 30 calendar days, then coordinate purge/non-resurrection and content-minimized evidence. |
| `DEC-040`/`049` — residency scope | All processing/export/deletion use cases | Use the approved Azure Australian baseline and block unknown or ineligible external routes. |

## 8. Requirement coverage summary

| Requirement family | Covered by detailed use cases | Remaining specialist or delivery refinement |
|---|---|---|
| `REQ-P1-WS-*` | `UC-P1-001`, `009`, `013`, `015` | Transition activation still requires an approved applicable consent/authority policy; the fail-closed fence is detailed. |
| `REQ-P1-DOC-*` | `UC-P1-002`, `003`, `012` | Synthetic dev formats and clinical hold are approved; public coverage and runtime evidence remain gated |
| `REQ-P1-ING-*` | `UC-P1-002`, `003`, `012`, `014` | Connector implementation is detailed; each live provider remains activation-gated. |
| `REQ-P1-FCT-*` | `UC-P1-004`, `007`, `013` | Data-model and bitemporal schemas remain specialist contracts |
| `REQ-P1-GPH-*` | `UC-P1-004`–`007`, `013` | Graph catalogue, traversal limits, and storage-neutral contracts remain specialist detail |
| `REQ-P1-SRCH-*` | `UC-P1-003`, `005`, `013` | Retrieval/evaluation contracts remain specialist detail |
| `REQ-P1-MON-*` | `UC-P1-006`–`008`, `010` | Synthetic dev sources are approved; public source pack remains release-gated |
| `REQ-P1-HLT-*` | `UC-P1-008` | Explainable item-level findings required; aggregate scoring prohibited by `DEC-034` |
| `REQ-P1-ACT-*` | `UC-P1-004`, `007`, `008`, `010` | External connector effects remain activation-gated under `DEC-031`/`045` |
| `REQ-P1-NTF-*` | `UC-P1-010` | In-app required; external channels remain activation-gated under `DEC-037`/`045` |
| `REQ-P1-SHR-*` | `UC-P1-009`, `013`, `015`, `016` | `UC-P1-016` defines the required tested absence of automated continuity under `DEC-032`. |
| `REQ-P1-AI-*` | `UC-P1-002`, `004`–`008`, `013` | Capability schemas and evaluations remain specialist contracts |
| `REQ-P1-TRUST-*` | All detailed use cases, especially `UC-P1-011`–`019` | Recovery remains intentionally unavailable; audit, deletion, residency, and production assurance execution evidence remain incomplete. |
| `REQ-P1-CFG-*` | Cross-cutting in `UC-P1-001`, `002`, `006`, `008`; detailed publication in `UC-P1-018` | Exact reference schemas/packages and execution evidence remain specialist and delivery work. |
| `REQ-P1-PLT-*` | Cross-client use cases plus public entry in `UC-P1-020` | Client parity, accessibility and release evidence remain incomplete. |

## 9. Validation and handoff requirements

Before an owning backlog item enters implementation for any use case, it must:

1. Link the exact `UC-*`, `AC-UC-*`, `REQ-*`, `GAP-*`, decision, security, API/event, UX, NFR, reference-data, and test IDs.
2. Replace every open-decision branch affecting the slice with an approved decision or an explicitly unavailable capability.
3. Define API commands/queries, async states, event schemas, idempotency/concurrency behaviour, privacy classification, and error contracts for each step.
4. Define authorization policy inputs and negative tests at workspace, resource, field, edge, retrieval, inference, citation, notification, export, and action layers.
5. Define audit events and evidence schemas sufficient to reconstruct the workflow without putting raw content in ordinary logs.
6. Test success, denial, retry, duplicate/out-of-order event, timeout, partial failure, revocation mid-flow, stale dependency, deletion race, and recovery/forward-repair paths relevant to the use case.
7. Use synthetic, non-personal fixtures and controlled providers; do not use real household records or production credentials.
8. Record objective test/evaluation evidence and preserve traceability when the use case, requirement, decision, or reference-data version changes.

The product-level scenarios `AC-P1-E2E-001`, `AC-P1-SEC-001`, `AC-P1-ING-001`, `AC-P1-RAG-001`, `AC-P1-MON-001`, `AC-P1-DEL-001`, `AC-P1-AI-001`, and `AC-P1-A11Y-001` remain mandatory umbrella scenarios. The acceptance scenarios in this catalogue refine rather than replace them.
