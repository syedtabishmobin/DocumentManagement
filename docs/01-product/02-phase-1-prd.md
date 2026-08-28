# Phase 1 Product Requirements Document

| Field | Value |
|---|---|
| Document ID | `PROD-PRD-001` |
| Version | `0.2` |
| Status | `APPROVED IMPLEMENTATION BASELINE` |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 28 August 2026 |
| Owners | Product owner; product and architecture maintainers |

## 1. Authority and approval boundary

This PRD translates the approved decisions in `docs/00-context/decision-register.md` and the findings in `docs/01-product/07-competitive-gap-analysis.md` into the approved Phase 1 implementation contract. Product-owner implementation approval is recorded by `DEC-041` and expanded for the production-oriented program by `DEC-054`.

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative for Phase 1 implementation. Azure `dev`/`stage` implementation and provisioning are approved for synthetic/test data. Production provisioning, public release, and real personal-data processing remain gated by `DEC-054` and require their own readiness evidence.

When this PRD conflicts with a higher-authority source, the hierarchy in `CODEX.md` applies. In particular:

- `APPROVED` decisions are constraints.
- Competitive `GAP-*` items are research recommendations until adopted here and approved.
- Suggested roles, severities, pipelines, channels, formats, or vendors in the preserved handover are not approved merely because they appear there.
- Detailed architecture, security, API, UX, reference-data, and testing specifications may refine this PRD but may not silently weaken it.

## 2. Product definition

Phase 1 provides a React public website and authenticated web/PWA plus dedicated Flutter iOS and Android applications for personal and family workspaces. It securely preserves customer-encrypted documents, performs authorized intelligence on the customer device by default, resolves canonical facts with history, connects dependencies, monitors dates and governed sources, explains downstream impact, and routes consequential action through human approval and auditable closure.

The product is not a passive drive, a generic chatbot, a legal-advice service, or a clinical-record system. Its short promise is:

> When something changes, know every document and action it affects—and why.

The complete value chain is:

`Evidence → resolved fact or rule → detected change → applicability → dependency impact → recommendation → approval → action → replacement evidence → closure and audit`

## 3. Approved constraints

| Decision | Product constraint |
|---|---|
| `DEC-001` | The system is a document-intelligence and change-monitoring product, not merely file storage. |
| `DEC-002` | Phase 1 serves personal and family workspaces while preserving organisation extension points. |
| `DEC-003` | Ownership and access use `Identity → Membership → Workspace → Resource`; a membership is not blanket resource access. |
| `DEC-004` | Canonical facts are independent of document occurrences and retain history and provenance. |
| `DEC-005` | Original binaries are immutable; logical documents support versioning, supersession, comparison, archive, restore, and controlled purge. |
| `DEC-006` | Consequential recommendations and updates require evidence, explanation, approval, and audit. |
| `DEC-007` | Taxonomy, monitoring rules, sources, permissions, and workflows are configuration-driven and jurisdiction-aware. |
| `DEC-008` | Retrieval, graph traversal, AI output, and actions enforce current permissions and preserve exact evidence provenance. |
| `DEC-009` | Core contracts remain vendor-neutral until a provider decision is approved. |
| `DEC-010` | The complete Phase 1 specification pack precedes application implementation. |
| `DEC-020` | Phase 1 launches Australia first on a jurisdiction-neutral core. |
| `DEC-021` | Superseded by `DEC-052`; React web/PWA and Flutter mobile are concurrent Phase 1 clients. |
| `DEC-022` | Superseded in provider selection by `DEC-049`; multi-tenant isolation and Australian-residency constraints remain active. |
| `DEC-023` | Household owners and family administrators are primary; advisers use limited guest/delegated access. |
| `DEC-024` | Clinical records are out of initial scope; health-insurance and general coverage documents are allowed. |
| `DEC-049` | Azure is the approved managed production provider behind portable ports; Bicep defines isolated `dev`, `stage`, and `prod` environments. |
| `DEC-050` | Azure platform encryption is supplemented by customer-controlled client encryption; default document intelligence is customer-device processing. |
| `DEC-051` | Security implementation and release evidence map to the approved NIST, OWASP, Azure, and Australian privacy baseline without claiming certification. |
| `DEC-052` | React serves web while Flutter supplies the primary dedicated iOS/Android experience; clients share contracts and evidence rather than UI code. |
| `DEC-053` | Production document Trash is recoverable for 30 calendar days, followed by coordinated purge and non-resurrection controls. |

## 4. Product outcomes

The detailed outcome and metric definitions live in `docs/01-product/06-scope-and-success-metrics.md`. Phase 1 is intended to prove these outcomes:

| Outcome ID | Outcome |
|---|---|
| `OUT-P1-001` | A household can establish a secure, intelligible document baseline without specialist records-management knowledge. |
| `OUT-P1-002` | A user can locate a document, fact, obligation, or deadline and inspect the exact evidence supporting the result. |
| `OUT-P1-003` | A material fact, document, event, or governed-rule change produces a permission-safe, explainable impact set. |
| `OUT-P1-004` | A user can take a recommendation from evidence through approval and replacement-evidence closure without losing audit history. |
| `OUT-P1-005` | Family collaboration improves readiness without making workspace membership equivalent to unrestricted access. |
| `OUT-P1-006` | Users can leave the service with a complete, documented export and can request controlled deletion. |
| `OUT-P1-007` | AI and monitoring failures are visible, recoverable, and never presented as verified truth or complete coverage. |

## 5. Users and actors

| Actor | Phase 1 need | Boundary |
|---|---|---|
| Household owner | Establish and govern a personal or family workspace; understand readiness and changes. | Ownership does not override another subject's explicit private-resource policy unless an approved legal/consent rule says otherwise. |
| Family administrator | Organise shared household resources, tasks, and invited members. | Administration is not automatic access to every document, field, graph edge, answer, or export. |
| Adult member | Manage personal and shared documents, facts, approvals, and tasks. | Access is resource- and purpose-scoped. |
| Managed dependant | Be represented as a subject without requiring an account. | Visibility and future transition require consent- and policy-aware rules. |
| Guest or delegated adviser | Review explicitly shared resources for a limited purpose and period. | No general household browse, graph discovery, bulk export, or onward sharing by default. |
| Workspace service | Process, index, monitor, recommend, notify, and audit. | Every operation is tenant/workspace scoped and service actions are least-privileged. |
| Product operator or support user | Operate and support the service. | No standing access to raw household content; exceptional access requires a separately specified, audited policy. |
| Trusted-source connector | Retrieve governed authoritative material and produce snapshots. | It cannot publish consequential conclusions without parser, applicability, evidence, and review controls. |

Detailed personas and journeys are defined in `docs/01-product/05-personas-and-journeys.md`.

## 6. Scope and release slices

### 6.1 Scope labels

| Label | Meaning |
|---|---|
| `REQUIRED` | Proposed as necessary to complete Phase 1. |
| `CONDITIONAL` | Part of Phase 1 only after the linked open decision and specialist contract are approved. |
| `RESERVED` | The core model or interface must preserve an extension point, but no Phase 1 end-user capability is promised. |
| `EXCLUDED` | Explicitly outside Phase 1. |

### 6.2 Vertical release slices

These are product slices, not permission to start implementation before the repository readiness gate passes.

| Slice | Name | Demonstrable outcome | Entry dependency | Exit condition |
|---|---|---|---|---|
| `P1-S1` | Secure household vault | A user creates a workspace, adds a subject, captures a supported document, reviews processing, controls access, views the immutable original, and audits the activity. | Approved specification baseline and foundational security architecture. | Cross-workspace denial, quarantine, immutable-original, archive/restore, and audit scenarios pass. |
| `P1-S2` | Understand and retrieve | The system extracts evidence, resolves facts, builds typed dependencies, compares versions, and answers permission-aware questions with exact citations. | `P1-S1`; approved evidence/fact/graph and AI/RAG contracts. | Evidence, conflict, insufficient-evidence, and restricted-evidence scenarios pass. |
| `P1-S3` | Monitor and close the loop | A date, user event, document version, dependency, or governed-source change is assessed for applicability and impact, then becomes an approved action closed by evidence. | `P1-S2`; approved source, monitoring, impact, workflow, and notification contracts. | Differentiated end-to-end scenario `AC-P1-E2E-001` passes with stale-source and no-leak variants. |
| `P1-S4` | Family launch and portability | Household collaboration, delegated access, readiness guidance, export, deletion, recovery, accessibility, resilience, and operational controls meet launch gates. | `P1-S1`–`P1-S3`; open launch decisions resolved. | Product, security, privacy, accessibility, recovery, and operational launch gates pass. |

### 6.3 Document-domain envelope

Phase 1's configuration model MUST be able to represent the following household domains. `DEC-035` approves governed synthetic Australian-first fixtures for development; the reviewed document types and governed source monitors enabled in the first public production launch profile remain a later release package.

| Domain | Representative in-scope records | Boundary |
|---|---|---|
| Identity and travel | Passport, driver licence, birth/citizenship/marriage certificate, visa/residency, itinerary, travel insurance | Government rule coverage varies by jurisdiction and issuer. |
| Family and education | School/childcare enrolment, consent, emergency contacts, qualifications, transcripts, course certificates | Managed-dependant privacy and transfer rules apply. |
| Finance, tax, and superannuation | Bank/loan/mortgage evidence, tax returns and notices, receipts, investment and superannuation statements | The product organises evidence; it does not provide financial or tax advice. |
| Property and household | Lease, purchase, strata, inspection, utilities, service agreements, receipts, warranties | Property dossiers are a view over governed resources, not a separate access boundary. |
| Insurance | Home, contents, vehicle, health-insurance, life, and travel policies | Clinical reports, notes, diagnostic results, prescriptions, and treatment records are excluded by `DEC-024`. |
| Vehicles | Registration, insurance, finance, service, warranty, roadside assistance | State/territory applicability must be explicit. |
| Legal and estate | Will, power of attorney, guardianship, beneficiary nomination, personal trust records | No legal advice or automatic legal conclusion. Jurisdiction and professional-review notices are required for consequential guidance. |
| Employment and career | Contract, position description, NDA/IP terms, payslip, CV, licence, certification, training, portfolio evidence | Employer action is external and requires approval; workplace surveillance is not in scope. |

### 6.4 Explicit exclusions

- Clinical and treatment records, clinical decision support, medical advice, or health-provider workflows.
- Organisation workspaces and enterprise administration screens.
- SSO/SCIM, DLP administration, legal hold/eDiscovery, records disposition, information barriers, and enterprise file plans; their domain extension points are `RESERVED` only.
- Automatic legal, financial, tax, immigration, insurance, or medical advice.
- Silent edits to consequential documents, facts, rules, or external systems.
- Unbounded autonomous agents, arbitrary web browsing as authority, or uncited consequential claims.
- Native desktop applications in Phase 1. Dedicated Flutter iOS and Android applications are required by `DEC-052`; platform-specific Swift/Kotlin remains limited to capabilities Flutter cannot safely provide.
- Guaranteed completeness of external-source monitoring.
- A public marketplace, provider-specific lock-in, or an adviser-specific standalone product.
- Shared editing of arbitrary office-document contents; the product may prepare controlled drafts or replacement versions after approval.

## 7. Functional requirements

Each row is an independently traceable product requirement. The acceptance summary states observable evidence; detailed acceptance scenarios belong in the use-case catalogue and testing specifications.

### 7.1 Identity, workspace, subjects, and membership

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-WS-001` | The service MUST represent identity, membership, workspace, subject, and resource as separate concepts and MUST reserve `PERSONAL`, `FAMILY`, and `ORGANISATION` workspace types. Phase 1 MUST NOT expose creation of organisation workspaces. | `P1-S1` | A person may hold memberships in multiple workspaces; resources remain workspace-scoped; organisation creation is unavailable. |
| `REQ-P1-WS-002` | An eligible identity MUST be able to create a personal workspace and, subject to product policy, a family workspace, with one explicit owner and auditable membership changes. | `P1-S1` | Creation, duplicate/retry, ownership, and membership audit scenarios pass. |
| `REQ-P1-WS-003` | A workspace MUST support subjects who do not have login identities, including managed dependants, without fabricating accounts. | `P1-S1` | A dependant can be linked to evidence and facts without credentials or membership. |
| `REQ-P1-WS-004` | Membership MUST NOT automatically grant access to every resource, field, dependency edge, search result, notification, or export. | `P1-S1` | Negative tests show an administrator or member cannot infer or retrieve a non-granted private resource. |
| `REQ-P1-WS-005` | Roles, permissions, and relationship types MUST be configuration-driven, versioned, and enforced by a common authorization contract. | `P1-S1` | Changing configured policy changes evaluated access without code-level taxonomy assumptions and is audited. |
| `REQ-P1-WS-006` | Adviser access MUST use limited guest or delegated grants rather than a separate adviser tenancy or unrestricted family role. | `P1-S4` | An adviser can access only selected resources/actions until expiry or revocation and cannot enumerate the household. |
| `REQ-P1-WS-007` | The model MUST preserve subject and provenance history when a managed dependant later receives independent access; transfer behavior remains conditional on the approved consent design. | `P1-S4` | No evidence, fact, or audit history is recreated or silently reassigned during a tested transition. |

### 7.2 Document repository and lifecycle

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-DOC-001` | Every accepted file MUST be stored as an immutable original artifact with content hash, media type, size, acquisition provenance, and stable identity. | `P1-S1` | Reprocessing and metadata changes leave original bytes and hash unchanged. |
| `REQ-P1-DOC-002` | A logical document MUST support one or more immutable versions and MUST keep logical identity distinct from byte-level hash equality. | `P1-S1` | Identical bytes can be detected without forcing unrelated documents into one logical record; a replacement can become a new version. |
| `REQ-P1-DOC-003` | Document versions MUST support explicit supersession, effective status, material comparison, archive, trash, restore, and controlled purge without destructive in-place replacement. | `P1-S2` | State transitions reject invalid or unauthorized moves and retain required provenance. |
| `REQ-P1-DOC-004` | Authorized users MUST be able to inspect and download the exact original version through short-lived, scoped access; the product MUST NOT expose permanent public artifact URLs. | `P1-S1` | Expired, revoked, wrong-workspace, and wrong-version links fail without content leakage. |
| `REQ-P1-DOC-005` | Browsing MUST offer human-readable views by document, subject, and relevant household resource such as property, vehicle, policy, or provider without changing the underlying access boundary. | `P1-S2` | The same resource policy is enforced across every view and count. |
| `REQ-P1-DOC-006` | The supported-format profile MUST be configuration-driven and MUST define validation, preview, native extraction, OCR fallback, and unsupported-file behavior per format. | `P1-S1` | Every enabled format has an explicit processing path and an observable unsupported or degraded outcome. |
| `REQ-P1-DOC-007` | Suspected clinical records MUST NOT enter ordinary Phase 1 extraction, graph, search, or AI flows; final reject/quarantine/user-recovery behavior is blocked on `DEC-036`. | `P1-S1` | A synthetic clinical-record fixture cannot be indexed or surfaced as an in-scope insurance record. |
| `REQ-P1-DOC-008` | A conformed effective-document view MUST account for version, amendment, addendum, cancellation, and supersession relationships while preserving every source version. | `P1-S3` | Obligations and answers identify which clauses/versions are effective and expose conflicts for review. |

### 7.3 Capture, ingestion, and processing

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-ING-001` | Phase 1 MUST support browser upload, PWA camera capture, and manual record creation; other connector ingestion is conditional on `DEC-031`. | `P1-S1` | Each required entry route produces the same governed ingestion job and provenance envelope. |
| `REQ-P1-ING-002` | Ingestion MUST be an explicit asynchronous state machine separating receipt, validation, quarantine, extraction, review, indexing, readiness, failure, cancellation, and purge interactions. | `P1-S1` | Clients can observe non-ambiguous states; invalid transitions and late events are rejected or reconciled. |
| `REQ-P1-ING-003` | Files MUST be validated and scanned before content extraction; suspicious files MUST be isolated from download, preview, parsing, indexing, and AI until an authorized quarantine decision. | `P1-S1` | Known-malicious, scan-timeout, scanner-unavailable, release, and delete paths are tested. |
| `REQ-P1-ING-004` | Receipt and processing MUST be idempotent and retryable; exact-hash duplicate detection MUST preserve acquisition attempts and MUST NOT imply logical-document identity. | `P1-S1` | Repeated upload and event delivery do not create uncontrolled versions, lost provenance, or duplicate side effects. |
| `REQ-P1-ING-005` | Native extraction or OCR output MUST retain document-version, page, passage/coordinates or span, processor and model version, processing time, confidence, and review state. | `P1-S2` | Every promoted field or citation can be traced to a stable evidence anchor or is rejected as unsupported. |
| `REQ-P1-ING-006` | Classification MUST select a versioned, jurisdiction-aware document-type and extraction schema and MUST expose uncertainty, unsupported types, and manual correction. | `P1-S2` | Low-confidence and out-of-profile documents enter review rather than silently receiving a trusted type. |
| `REQ-P1-ING-007` | Field extraction, document review, fact acceptance, requirement fulfilment, action approval, and evidence verification MUST be separate states. | `P1-S2` | Approving an extracted field does not automatically satisfy a requirement or approve an action. |
| `REQ-P1-ING-008` | Reprocessing under a new parser, schema, prompt, or model version MUST create new derived results, retain prior provenance, and avoid changing the immutable original. | `P1-S2` | A reviewer can compare and, where permitted, roll back the active derived result. |
| `REQ-P1-ING-009` | Connector ingestion MUST preserve source identity, consent, external item/version identity, permissions where applicable, deletion semantics, and revocation behavior behind a provider-neutral adapter. | `P1-S4` `CONDITIONAL` | A disconnected connector cannot continue retrieval; already-ingested evidence follows the approved retention policy. |

### 7.4 Evidence, canonical facts, and entities

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-FCT-001` | A canonical fact MUST be separate from every document, manual, connector, or source occurrence that supports or contradicts it. | `P1-S2` | Removing or superseding one occurrence does not rewrite other evidence or history. |
| `REQ-P1-FCT-002` | Fact values and consequential rules MUST be bitemporal, preserving valid/effective time and platform transaction time. | `P1-S2` | The system can answer what was believed for a past effective date and what was recorded at a past transaction time. |
| `REQ-P1-FCT-003` | Promoting, correcting, disputing, or superseding a canonical value MUST be an explicit resolution event with actor, reason, evidence, confidence, policy, and time. | `P1-S2` | OCR or model output alone never becomes approved truth; resolution history is inspectable. |
| `REQ-P1-FCT-004` | Conflicting evidence MUST remain preserved and MUST produce an explainable unresolved, resolved, or intentionally tolerated conflict state. | `P1-S2` | A user can inspect competing occurrences and downstream impact without either being silently overwritten. |
| `REQ-P1-FCT-005` | Subjects, organisations, properties, vehicles, policies, providers, obligations, and other entities MUST have stable identities distinct from display names and source occurrences. | `P1-S2` | Renaming or correcting an entity does not break linked evidence or dependency history. |
| `REQ-P1-FCT-006` | Sensitive fact values and evidence anchors MUST support field-level authorization and redaction in views, search, graph traversal, AI context, notifications, logs, and exports. | `P1-S2` | An authorized user may learn that action is required without learning a restricted value or source. |

### 7.5 Dependency graph and impact paths

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-GPH-001` | Dependencies MUST use a versioned catalogue of typed nodes and directed edges with permitted endpoints, cardinality, provenance, confidence/review state, validity, and supersession semantics. | `P1-S2` | Invalid edge types/endpoints fail contract validation and every active edge has provenance. |
| `REQ-P1-GPH-002` | Graph traversal MUST evaluate current authorization for each resource, field, edge, and derived result rather than relying only on permissions captured at indexing time. | `P1-S2` | Grant revocation removes accessible paths and cached/derived exposure within the defined freshness objective. |
| `REQ-P1-GPH-003` | Every reported impact MUST retain at least one typed, inspectable path from changed evidence, fact, rule, document, or event to the affected resource or action. | `P1-S3` | A user can inspect why an item is affected and authorized evidence for each hop. |
| `REQ-P1-GPH-004` | Restricted paths MUST be redacted or summarized according to policy without leaking names, counts, snippets, values, or relationship existence. | `P1-S3` | Negative scenarios cover list counts, facets, snippets, notifications, and generated explanations. |
| `REQ-P1-GPH-005` | Impact traversal MUST define cycle, depth, fan-out, version-target, stale-edge, and incomplete-data behavior and MUST report truncation or uncertainty. | `P1-S3` | Cyclic or very large graphs terminate deterministically and do not imply complete coverage. |

### 7.6 Search, retrieval, comparison, and question answering

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-SRCH-001` | Authorized users MUST be able to use full-text, metadata/filter, and semantic or hybrid retrieval over eligible current and historical resources. | `P1-S2` | Filters, versions, status, subject, type, and date work within the authorization boundary. |
| `REQ-P1-SRCH-002` | Answers and comparisons MUST cite exact document version, page and passage/anchor or governed-source snapshot for each material claim. | `P1-S2` | Citation navigation resolves to the supporting authorized evidence and fails safely after revocation. |
| `REQ-P1-SRCH-003` | Retrieval, reranking, answer generation, citations, conversation state, caches, and analytics MUST enforce current authorization. | `P1-S2` | Cross-workspace, revoked-grant, restricted-field, stale-index, and conversation-follow-up tests do not leak data. |
| `REQ-P1-SRCH-004` | The assistant MUST distinguish supported, conflicting, stale, incomplete, insufficient, and restricted evidence and MUST NOT invent a confident answer to hide those states. | `P1-S2` | Expected responses explicitly state limitations and never fabricate a citation. |
| `REQ-P1-SRCH-005` | Document comparison MUST identify source versions, material differences, unchanged uncertainty, and the evidence underlying any interpreted change. | `P1-S2` | A comparison can be reproduced from the cited versions and does not overwrite either document. |

### 7.7 Monitoring and trusted sources

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-MON-001` | The monitoring model MUST support date, periodic, user/life event, source change, dependency, and document-version triggers as distinct strategies. | `P1-S3` | Each enabled strategy has deterministic trigger, deduplication, state, and replay tests. |
| `REQ-P1-MON-002` | Monitoring rules MUST be versioned configuration scoped by jurisdiction, document type, subject or resource applicability, effective period, source, and review requirements. | `P1-S3` | A rule outside jurisdiction or effective period cannot create an applicable recommendation. |
| `REQ-P1-MON-003` | Every governed external source MUST declare authority tier, jurisdiction, topics, official endpoint, retrieval method, coverage, cadence, parser/version, freshness objective, and ownership. | `P1-S3` | A source lacking mandatory governance metadata cannot be enabled for consequential monitoring. |
| `REQ-P1-MON-004` | Every retrieval MUST produce an immutable snapshot or verifiable no-change observation and record time, identity, content hash, parser result, and error state. | `P1-S3` | A consequential rule can be reconstructed from the exact snapshot and parser version. |
| `REQ-P1-MON-005` | Source health MUST expose last attempt, last success, freshness, coverage, parser failure, retry history, and stale/disabled status; the last successful value MUST NOT hide current failure. | `P1-S3` | A broken or stale monitor visibly degrades dependent results and notifications. |
| `REQ-P1-MON-006` | Applicability MUST be evaluated before impact and MUST remain distinct from authority, evidence strength, confidence, severity, and urgency. | `P1-S3` | Non-applicable changes are retained with rationale but do not produce misleading required actions. |
| `REQ-P1-MON-007` | The product MUST disclose monitored coverage and MUST NOT claim that every authoritative change will be detected. | `P1-S3` | UI and exports show covered sources/topics, freshness, and gaps. |

### 7.8 Document health and expected evidence

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-HLT-001` | Expected-document intelligence MUST use versioned requirement profiles with context, jurisdiction, accepted alternatives, exceptions/waivers, validity, and evidence criteria. | `P1-S3` | Each suggestion explains why it may apply and cites an approved rule or is labelled non-authoritative guidance. |
| `REQ-P1-HLT-002` | A user MUST be able to add evidence, select an accepted alternative, mark not applicable with reason, request a waiver/review where supported, dismiss, or remind later. | `P1-S3` | Each outcome is distinct, reversible where policy permits, and auditable. |
| `REQ-P1-HLT-003` | The service MUST detect potentially expired, stale, superseded, missing, and contradictory information while preserving the evidence and uncertainty behind the finding. | `P1-S3` | A finding identifies rule/evidence, affected resources, confidence, and available resolution paths. |
| `REQ-P1-HLT-004` | Any aggregate readiness or content-health score MUST be explainable, decomposable, permission-aware, and explicitly not a legal-compliance or risk guarantee; release depends on `DEC-034`. | `P1-S4` `CONDITIONAL` | Users can inspect contributing signals and cannot infer hidden restricted items from the score. |
| `REQ-P1-HLT-005` | Requirement satisfaction MUST require configured evidence and verification state; the presence of a file or extracted field MUST NOT by itself establish fulfilment. | `P1-S3` | A file can be received and extracted while its requirement remains unmet or under review. |

### 7.9 Change, recommendation, approval, action, and closure

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-ACT-001` | A change to a fact, document version, event, dependency, or governed rule MUST be able to initiate an idempotent impact assessment over eligible dependencies. | `P1-S3` | Replayed changes do not duplicate recommendations or lose newly applicable impacts. |
| `REQ-P1-ACT-002` | Each impact MUST classify the outcome as automatic technical update possible, user action required, external notification required, review required, or no action. | `P1-S3` | Classification is explicit and independent from severity or confidence. |
| `REQ-P1-ACT-003` | Each consequential recommendation MUST include the observed change, applicability, typed dependency path, evidence, affected subject/resource, severity, confidence, uncertainty, proposed action, and approval requirement. | `P1-S3` | A recommendation missing required evidence or applicability cannot enter an actionable state. |
| `REQ-P1-ACT-004` | Severity, urgency, confidence, applicability, evidence strength, and source health MUST remain separate values with separately explainable derivations. | `P1-S3` | Changing confidence does not silently change urgency or applicability. |
| `REQ-P1-ACT-005` | Consequential document changes, canonical fact resolutions, rule publications, bulk operations, notifications to external parties, and connector actions MUST require policy evaluation and the configured human approval. | `P1-S3` | Bypass, stale approval, changed-input, revoked-access, and bulk-action tests fail closed. |
| `REQ-P1-ACT-006` | Approval MUST bind to the reviewed inputs, proposed effect, actor, policy, and expiry; a material input change MUST invalidate or re-route approval. | `P1-S3` | An approval cannot authorize a later materially different draft or target. |
| `REQ-P1-ACT-007` | Approved work MUST create a new version, controlled task/checklist/draft, or provider-neutral connector command and MUST record result, failure, retry, reversal options, and audit evidence. | `P1-S3` | External timeout or partial success remains visible and recoverable without falsely marking completion. |
| `REQ-P1-ACT-008` | Closure MUST require the configured fulfilment or replacement evidence and verification state; time elapsed or action submission alone MUST NOT auto-renew evidence. | `P1-S3` | A task remains open or awaiting evidence until the configured closure rule is met. |

### 7.10 Tasks, reminders, and notifications

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-NTF-001` | Recommendations and obligations MUST be able to create owned tasks with status, due date, source, evidence requirement, and audit history. | `P1-S3` | Task creation and updates retain causality to the recommendation or obligation. |
| `REQ-P1-NTF-002` | Users MUST be able to acknowledge, snooze, reassign where authorized, complete, reopen, or dismiss a task subject to its workflow policy. | `P1-S3` | Invalid actors or terminal-state transitions fail; completion evidence is preserved. |
| `REQ-P1-NTF-003` | In-app notifications are required; email and push delivery are conditional on `DEC-037` and MUST use a channel-neutral notification contract. | `P1-S3` | Notification state is consistent across retries and does not expose sensitive content on an unapproved channel. |
| `REQ-P1-NTF-004` | Notification policy MUST support preference, quiet-period, deduplication, escalation, acknowledgement, and stale-source suppression/degradation. | `P1-S4` | Duplicate triggers do not spam; urgent behavior still respects privacy and approved exceptions. |

### 7.11 Family sharing, delegation, and continuity

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-SHR-001` | Sharing grants MUST be explicit, scoped to workspace/resource/field/action/purpose as applicable, time-bounded where configured, and revocable. | `P1-S4` | Grant creation shows effective access; expiry/revocation removes retrieval, graph, answer, action, notification, and export access. |
| `REQ-P1-SHR-002` | Guest links MUST be short-lived, least-privileged, non-indexable, rate-limited, auditable, and independently revocable without exposing unrelated workspace context. | `P1-S4` | Link guessing, expiry, reuse, onward enumeration, and revoked-link scenarios fail safely. |
| `REQ-P1-SHR-003` | Family administration MUST separate membership management from content access, consent, fact resolution, approval authority, and export/deletion authority. | `P1-S4` | Granting `FAMILY_ADMIN` does not silently confer every listed authority. |
| `REQ-P1-SHR-004` | Curated continuity/export packs and time-aware access grants are proposed; automated incapacity or after-death release remains conditional on `DEC-032`. | `P1-S4` `CONDITIONAL` | No event can release restricted content until trigger evidence, challenge, revocation, consent, and audit rules are approved and tested. |
| `REQ-P1-SHR-005` | The product MUST support an impact-exists disclosure policy that can route action to an authorized person without revealing restricted evidence. | `P1-S3` | A collaborator sees only the permitted action/explanation and cannot infer the protected subject or value. |

### 7.12 AI capability and trust controls

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-AI-001` | Each AI capability MUST have a versioned contract defining inputs, allowed context, authorized tools, structured output, evidence, confidence, permitted and forbidden actions, review threshold, fallback, and telemetry. | `P1-S2` | Unregistered capability or invalid output cannot mutate product state or reach a user as verified. |
| `REQ-P1-AI-002` | Tool and retrieval authorization MUST be evaluated for the acting identity and workspace at execution time; model text MUST never grant authority. | `P1-S2` | Prompt injection cannot expand resource, field, edge, connector, or action access. |
| `REQ-P1-AI-003` | AI-derived facts, classifications, dependencies, impacts, and answers MUST retain model/prompt/tool/schema versions and evidence anchors. | `P1-S2` | Any surfaced result can be reconstructed to the recorded inputs and versions subject to retention policy. |
| `REQ-P1-AI-004` | Confidence MUST be calibrated per capability and route low-confidence, conflicting, high-impact, or policy-selected results to review. | `P1-S2` | Evaluation thresholds determine routing; a global uncalibrated score is not accepted. |
| `REQ-P1-AI-005` | The system MUST detect and contain untrusted instructions embedded in documents, source pages, metadata, and connector content. | `P1-S2` | Injection fixtures cannot alter system policy, tool scope, citations, or output schema. |
| `REQ-P1-AI-006` | AI failures, refusals, timeouts, schema errors, provider unavailability, and cost limits MUST have explicit degraded behavior and MUST NOT fabricate success. | `P1-S2` | Each failure mode has observable, retry-safe, privacy-safe behavior. |
| `REQ-P1-AI-007` | Model, OCR, embedding, reranking, and vector/graph products MUST remain replaceable behind approved contracts, with data-processing and residency policy enforced per adapter. | `P1-S2` | Provider conformance tests pass for every enabled adapter; core domain records are portable. |

### 7.13 Privacy, security, audit, export, and deletion

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-TRUST-001` | The service MUST encrypt data in transit and at rest, isolate workspaces, use least privilege, and define key, secret, session, device, and recovery controls in the security architecture. | `P1-S1` | Threat-model and negative authorization evidence meets the approved security gates. |
| `REQ-P1-TRUST-002` | Authorization MUST be consistent across APIs, workers, storage, previews, search, vectors, graph, AI, caches, exports, notifications, connectors, analytics, support, and audit views. | `P1-S1` | A grant change propagates within the defined objective and stale components fail closed or visibly degrade. |
| `REQ-P1-TRUST-003` | Ordinary logs, analytics, traces, metrics, fixtures, errors, and screenshots MUST NOT contain raw document content, secrets, tokens, or unapproved sensitive values. | `P1-S1` | Automated redaction and synthetic-data tests cover success and failure paths. |
| `REQ-P1-TRUST-004` | Security- and consequence-relevant events MUST produce tamper-evident, workspace-scoped audit records with actor/service, action, target, decision, outcome, correlation, time, and safe provenance. | `P1-S1` | Critical workflows can be reconstructed without placing raw content in ordinary audit fields. |
| `REQ-P1-TRUST-005` | The Australian data-residency option MUST cover every in-scope data class and processor according to an approved residency matrix, including originals, records, indexes, backups, logs, analytics, support, AI/OCR, and disaster recovery. | `P1-S4` | Automated placement and restore tests match the declared residency policy; unsupported processing is blocked or disclosed before consent. |
| `REQ-P1-TRUST-006` | Users MUST be able to export their authorized data in documented, usable formats. The proposed complete envelope in `DEC-033` includes originals, versions, derived data, facts, relationships, rules affecting them, tasks, reminders, grants, and audit history subject to third-party rights. | `P1-S4` | Export manifests are complete, checksummed, access-controlled, resumable, and machine-readable. |
| `REQ-P1-TRUST-007` | Archive, trash, account deletion, resource purge, retention exceptions, derived-index removal, connector deletion, and backup expiry MUST be separate governed states with published user-visible behavior. | `P1-S4` | Purge tests cover binaries, rows, search/vector/graph indexes, caches, derivatives, replicas, backups, and retained/redacted audit evidence. |
| `REQ-P1-TRUST-008` | Account recovery MUST not create a weaker path around encryption, MFA, workspace ownership, private resources, or delegated access; the assurance model remains open in `DEC-038`. | `P1-S4` `CONDITIONAL` | Recovery and support cannot disclose content or transfer authority without the approved evidence and delay/challenge process. |
| `REQ-P1-TRUST-009` | Connector consent, AI/OCR processing, analytics, support access, and cross-border processing MUST be purpose-limited, transparent, revocable where applicable, and recorded. | `P1-S4` | Consent withdrawal changes future processing and displays the approved retained-data consequence. |

### 7.14 Configuration and Phase 2 extension points

| Requirement | Proposed normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-CFG-001` | Document types, extraction definitions, facts, dependency types, monitoring rules, trusted sources, jurisdictions, roles, permissions, statuses, severities, workflows, and AI capabilities MUST be versioned reference data rather than scattered hard-coded values. | `P1-S1` | Reference validation rejects dangling IDs, invalid versions, and missing required relationships. |
| `REQ-P1-CFG-002` | Consequential configuration MUST declare jurisdiction, applicability, source/evidence, effective dates, confidence/review rules, version, owner, and change history. | `P1-S3` | Incomplete or expired consequential configuration cannot be activated. |
| `REQ-P1-CFG-003` | Phase 1 MUST provide an Australia jurisdiction pack while keeping core identifiers and contracts jurisdiction-neutral. | `P1-S3` | The core can load a second synthetic jurisdiction pack without code-level Australian assumptions. |
| `REQ-P1-CFG-004` | Configuration publication MUST use validation, review/approval, effective dating, audit, rollback or forward repair, and impact assessment appropriate to risk. | `P1-S3` | A rule change identifies affected active findings and supports deterministic replay. |
| `REQ-P1-CFG-005` | The domain MUST reserve organisation, business unit, client, matter, case, policy, control, record, hold, information-barrier, DLP, and residency-policy extension points without exposing Phase 2 consumer-irrelevant UI. | `P1-S1` `RESERVED` | Schema evolution can add Phase 2 types without redefining Phase 1 identity, workspace, resource, evidence, fact, or audit identities. |

### 7.15 Production platform, customer encryption, and client delivery

| Requirement | Normative statement | Slice | Acceptance summary |
|---|---|---|---|
| `REQ-P1-PLT-001` | The public website and authenticated web/PWA MUST remain React/TypeScript; dedicated iOS and Android clients MUST use one Flutter/Dart mobile codebase. | Cross-slice | Critical journeys meet the same API, authorization, evidence, encryption, state, and error contracts across supported clients. |
| `REQ-P1-PLT-002` | TypeScript and Dart clients MUST consume generated or conformance-validated models from the same OpenAPI, event, encryption-envelope, and reference-data contracts; UI code is not a shared source of domain truth. | Cross-slice | Contract drift blocks CI and equivalent synthetic fixtures produce equivalent authorized outcomes. |
| `REQ-P1-CRYPTO-001` | Original document bytes and sensitive derivatives MUST be encrypted on the authorized customer client before network transfer using a versioned authenticated-encryption envelope and independent document keys. | `P1-S1`–`S2` | Network/storage inspection and cross-client test vectors prove no plaintext or unwrapped customer content key reaches the service. |
| `REQ-P1-CRYPTO-002` | Workspace/document key access MUST be customer controlled, separately wrapped to authorized devices/members/recovery factors, revocable, rotatable, and unavailable to ordinary Doculyra/Azure operators. | `P1-S1`, `S4` | Grant, revoke, rotation, device loss, recovery, wrong-key, tamper, replay, downgrade, and crypto-shred tests fail safely. |
| `REQ-P1-CRYPTO-003` | Default preview, extraction, OCR, classification, search, graph, and cited question answering over customer content MUST run on the authorized client. No cloud plaintext fallback is permitted without a later approved, explicit-consent processing route. | `P1-S1`–`S3` | Unsupported local processing remains visible and no egress occurs when a cloud route is absent or ineligible. |
| `REQ-P1-DEL-001` | Production document deletion MUST immediately fence ordinary access, retain the item only in restricted Trash for 30 calendar days, permit authorized step-up restoration before expiry, and permanently deny restoration after expiry. | `P1-S4` | Boundary-time, authorization, retry, failure, backup, replay, cross-store, and accessibility scenarios pass. |
| `REQ-P1-DEL-002` | Final purge MUST remove or render irrecoverable every registered artifact, key envelope, sensitive canonical value, derivative, cache, index, graph, conversation, export, connector copy, and temporary object while retaining only content-minimized deletion/audit evidence. | `P1-S4` | Per-role acknowledgements and deletion-ledger reconciliation prevent restore/rebuild/resync resurrection. |
| `REQ-P1-OPS-001` | Bicep MUST define isolated Azure `dev`, `stage`, and `prod` stacks. `dev`/`stage` use the current subscription only for synthetic/test data; `prod` remains parameterized and unprovisioned until the production subscription and release gate exist. | Cross-slice | Bicep build/What-If, drift, secret, placement, cost, security, migration, and teardown/recovery evidence passes. |
| `REQ-P1-OPS-002` | Azure managed services MUST provide commodity storage, database, identity, queue, edge, secret, monitoring, backup, and lifecycle capabilities behind provider-neutral adapters; application code MUST NOT duplicate a managed capability except where the customer-controlled encryption or cross-domain product contract requires application orchestration. | Cross-slice | Adapter conformance and architecture review show no provider model in canonical domain contracts and no custom cryptographic primitive. |
| `REQ-P1-ASSURE-001` | The release assurance case MUST map implemented controls and evidence to `DEC-051`; certification or regulatory-compliance claims MUST NOT be made without the corresponding independent assessment. | Cross-slice | Control matrix, threat review, automated evidence, privacy/legal review, and penetration-test findings have owners and release disposition. |

## 8. Cross-cutting product rules

1. **Current authorization wins.** Ingestion-time or indexing-time access is never sufficient for a later read, inference, traversal, citation, notification, export, or action.
2. **Evidence is not truth by default.** File receipt, extraction, field review, fact resolution, requirement fulfilment, action approval, and closure are different decisions.
3. **History is additive.** Original evidence, occurrences, source snapshots, resolution events, superseded versions, and approval records are not silently overwritten.
4. **Applicability precedes recommendation.** Authority and freshness alone do not prove a rule applies to a person, resource, period, or jurisdiction.
5. **Consequential action is bound and approved.** Approval covers a specific reviewed input and effect, not a reusable grant of model autonomy.
6. **Failure remains visible.** A stale monitor, failed parser, unavailable model, partial connector action, or incomplete graph is not disguised by a last-known successful value.
7. **No leakage through derivatives.** Counts, facets, graph edges, embeddings, summaries, caches, scores, audit views, and notifications are subject to the same privacy boundary as source material.
8. **No automatic renewal.** Time elapsed, task submission, or file presence alone cannot renew evidence or fulfil an obligation.
9. **No unsupported authority.** Consequential claims use governed sources and exact evidence; arbitrary web content and generated text are not authoritative records.
10. **Portability and deletion are designed in.** Provider-neutral domain records and explicit derivative lineage are prerequisites, not a launch clean-up task.

## 9. Research-gap disposition

| Gap | Draft disposition | Result in this PRD | Approval dependency |
|---|---|---|---|
| `GAP-001` | Adopt | `REQ-P1-HLT-001`, `REQ-P1-HLT-002`, `REQ-P1-HLT-005` | PRD approval and requirement-profile contract. |
| `GAP-002` | Adopt | `REQ-P1-FCT-001`–`004`, `REQ-P1-MON-002`, `REQ-P1-MON-004` | PRD approval and data-model ADR. |
| `GAP-003` | Adopt | `REQ-P1-ING-005`, `REQ-P1-SRCH-002`, `REQ-P1-AI-003` | PRD approval and evidence schema. |
| `GAP-004` | Adopt | `REQ-P1-ING-007`, `REQ-P1-HLT-005`, `REQ-P1-ACT-005`–`008` | PRD approval and workflow state contracts. |
| `GAP-005` | Adopt | `REQ-P1-DOC-008`, `REQ-P1-ACT-008` | PRD approval and version/obligation model. |
| `GAP-006` | Adopt | `REQ-P1-MON-003`–`007` | PRD approval and source-monitor operations contract. |
| `GAP-007` | Split | Scoped grants and complete export adopted; automated emergency/after-death release remains conditional. | `DEC-032`, `DEC-033`, privacy/security design. |
| `GAP-008` | Conditional adopt | `REQ-P1-HLT-004` permits only an explainable, permission-safe readiness score. | `DEC-034` and validated UX/metric design. |
| `GAP-009` | Adopt | `REQ-P1-ACT-005`–`007`, `REQ-P1-AI-001`–`006` | PRD approval and policy/approval contracts. |
| `GAP-010` | Reserve | `REQ-P1-CFG-005`; no Phase 1 enterprise UI or workflows. | Future Phase 2 decisions and ADRs. |

## 10. Product-level acceptance scenarios

These scenarios are mandatory seeds for detailed use cases and tests. They do not replace lower-level contract, authorization, security, migration, accessibility, resilience, or evaluation evidence.

### `AC-P1-E2E-001` — change once, explain impact everywhere

**Given** an Australian family workspace contains two adult members, a managed dependant, private and shared documents, a resolved home-address fact with cited occurrences, affected licences/policies/providers, an unrelated restricted document, and a fresh governed-source rule,

**When** an authorized member proposes and approves a new address fact value,

**Then** the system:

1. preserves the old and new occurrences and bitemporal resolution history;
2. calculates applicability before impact;
3. reports every authorized affected document, obligation, provider, and person with a typed dependency path;
4. keeps severity, urgency, confidence, source health, and applicability separate;
5. does not expose the restricted document, its subject, values, snippets, edges, or count;
6. provides exact evidence and rule-snapshot citations for every consequential claim;
7. distinguishes automatic technical updates, user actions, external notifications, review, and no action;
8. lets the authorized user approve, reject, edit, defer, dismiss, or mark not applicable where policy permits;
9. binds an approval to the reviewed inputs and proposed effect;
10. records any new version or external action plus failure/retry state;
11. requires replacement or fulfilment evidence before closure; and
12. records the actors, policies, models, tools, sources, state transitions, and outcomes in privacy-safe audit records.

The scenario MUST also pass when the source is stale, a parser has failed, an approval expires, a grant is revoked mid-flow, an external action partially succeeds, and the impact graph contains a cycle.

### `AC-P1-SEC-001` — workspace and field isolation

**Given** two workspaces, a family administrator, a private document, a restricted fact field, cached search results, embeddings, graph edges, an existing conversation, and a pending notification,

**When** access is absent or revoked,

**Then** no API, worker, preview, list count, facet, search result, graph path, AI answer, citation, conversation follow-up, notification, export, analytics view, or support workflow reveals the protected resource or value beyond an expressly approved minimal disclosure.

### `AC-P1-ING-001` — safe retryable capture

**Given** the same file is submitted repeatedly and one processing attempt times out after malware scanning,

**When** jobs and events are retried out of order,

**Then** the system preserves every acquisition attempt, creates no uncontrolled document/version duplicates, never processes quarantined content, exposes a truthful recoverable state, and leaves the immutable bytes unchanged.

### `AC-P1-RAG-001` — cited answer or explicit limitation

**Given** authorized, conflicting, stale, and restricted evidence,

**When** a user asks a question whose full answer is not supported by accessible current evidence,

**Then** the assistant cites supported claims at page/passage level, describes conflicts or staleness, states that evidence is insufficient or restricted without leaking it, and does not fabricate a conclusion or citation.

### `AC-P1-MON-001` — source failure is visible

**Given** a governed source has a last successful snapshot but its current parser fails and freshness expires,

**When** dependent rules or recommendations are evaluated,

**Then** the source is visibly stale or failed, dependent confidence/availability follows policy, no last-known value is represented as current, retry and escalation are recorded, and replay after repair is deterministic.

### `AC-P1-DEL-001` — controlled purge

**Given** an authorized deletion request for a document with originals, versions, extraction output, facts, embeddings, graph edges, citations, tasks, caches, replicas, backups, and audit references,

**When** the approved cooling-off and retention conditions are met,

**Then** active data and derivatives become inaccessible and are purged within their declared objectives, backup expiry is disclosed, retained audit is minimized/redacted according to policy, and restore or support paths cannot bypass the deletion state.

### `AC-P1-AI-001` — action policy gate

**Given** an injected document asks the model to reveal other household data and execute a connector action,

**When** any AI capability processes that content,

**Then** document instructions remain untrusted data, retrieval and tools retain their independent authorization, structured output validation and policy gates apply, no consequential action occurs without bound approval, and the attempt is safely audited.

### `AC-P1-A11Y-001` — critical workflow accessibility

**Given** a keyboard-only or assistive-technology user on a supported responsive viewport,

**When** the user completes capture, review, search, impact inspection, approval, sharing, export, and deletion workflows,

**Then** the approved accessibility standard is met for navigation, focus, names/roles/values, validation, status changes, time limits, alternatives, contrast, target size, reflow, and recovery from errors.

## 11. Success and launch gates

Phase 1 launch requires all of the following, with exact targets defined in `docs/01-product/06-scope-and-success-metrics.md`, the NFRs, and the test strategy:

- Activation and time-to-first-value meet approved targets without forcing broad sharing or unnecessary sensitive data collection.
- Retrieval quality, citation correctness, extraction accuracy, conflict routing, impact precision/recall, and monitoring freshness meet capability-specific evaluation gates.
- Cross-workspace, resource, field, edge, retrieval, inference, and action authorization negative tests pass with zero known critical leaks.
- Consequential recommendations have governed evidence, applicability, explanation, and approval coverage.
- Original immutability, idempotent ingestion, quarantine, versioning, audit, export, and controlled purge tests pass.
- Accessibility, availability, latency, throughput, backup/restore, RPO/RTO, residency, incident, and cost budgets meet approved targets.
- Users can distinguish current, stale, failed, incomplete, restricted, conflicting, and insufficient states.
- No critical or high unresolved security finding, unsafe product decision, fabricated claim/citation, or silent monitoring failure remains.

## 12. Assumptions and open decisions

The following approved decisions define local implementation behavior and the production activation fences. `DEC-049` now selects Azure for the named managed adapters while provider-neutral domain contracts remain mandatory.

| Decision | State | Question | Affected requirements |
|---|---|---|---|
| `DEC-030` | `APPROVED` | Four vertical slices are continuous engineering checkpoints within one authorized Phase 1 build. | All release mapping. |
| `DEC-031` | `APPROVED` | Enable local upload/capture/manual routes; keep live inbound-email and cloud connectors disabled behind ports. | `REQ-P1-ING-001`, `009` |
| `DEC-032` | `APPROVED` | Exclude automated emergency, incapacity, and after-death release from Phase 1. | `REQ-P1-SHR-004` |
| `DEC-033` | `APPROVED` | Implement the complete authorized portability envelope. | `REQ-P1-TRUST-006` |
| `DEC-034` | `APPROVED` | Present item-level findings only; do not implement an aggregate score or compliance/risk guarantee. | `REQ-P1-HLT-004` |
| `DEC-035` | `APPROVED` | Use synthetic governed Australian-first fixtures locally; require a later production package for public coverage claims. | `REQ-P1-DOC-006`, `REQ-P1-CFG-003`, monitoring/health requirements |
| `DEC-036` | `APPROVED` | Isolate suspected clinical records in `POLICY_HOLD`; deny ordinary processing until explicit safe reclassification. | `REQ-P1-DOC-007` |
| `DEC-037` | `APPROVED` | Require in-app notifications; keep email/push disabled behind a channel adapter. | `REQ-P1-NTF-003`, `004` |
| `DEC-038` | `APPROVED` | Recovery and ownership transfer are unavailable locally and require a separate production assurance decision. | `REQ-P1-TRUST-001`, `008` |
| `DEC-039` | `APPROVED` | Local deletion immediately fences and purges active/derived content with no backup and a content-free tombstone. | `REQ-P1-DOC-003`, `REQ-P1-TRUST-004`, `007` |
| `DEC-040` | `APPROVED` | Use synthetic local-only processing; require a later deployment decision for production data classes, processors, regions, support, backups, and exceptions. | `REQ-P1-TRUST-005`, `009` |
| `DEC-049` | `APPROVED` | Use Bicep-defined Azure `dev`/`stage` now and a later separate Azure production subscription, with Australia-first placement. | `REQ-P1-OPS-001`, `002`, `REQ-P1-TRUST-005` |
| `DEC-050` | `APPROVED` | Use Azure platform encryption plus customer-controlled client encryption and local customer-device intelligence by default. | `REQ-P1-CRYPTO-001`–`003`, `REQ-P1-TRUST-001`, `002`, `009` |
| `DEC-051` | `APPROVED` | Implement and evidence the approved security/assurance baseline without unearned certification claims. | `REQ-P1-ASSURE-001`, all trust requirements |
| `DEC-052` | `APPROVED` | Keep React web and build a mobile-first Flutter client for iOS/Android. | `REQ-P1-PLT-001`, `002` |
| `DEC-053` | `APPROVED` | Provide 30-day production document Trash/restore followed by coordinated final purge. | `REQ-P1-DEL-001`, `002`, `REQ-P1-TRUST-007` |
| `DEC-054` | `APPROVED` | Implement the complete production-oriented Phase 1 and provision synthetic-only Azure `dev`/`stage`; keep production/public/real-data activation gated. | All implementation and release requirements |

Commercial pricing, production SKUs/quotas, issuer partnerships, external providers, store accounts, and exact public-release inputs remain outside this PRD's technical baseline until separately decided. They MUST NOT be hidden in implementation defaults where they change user-visible retention, quality, privacy, or access.

## 13. Dependencies on the remaining specification pack

This PRD is not sufficient to start implementation. Each requirement must be refined and traced through the repository:

| Contract area | Required detail before readiness approval |
|---|---|
| Architecture/domain/data | Aggregates, ownership, bitemporal model, state machines, transaction/consistency boundaries, graph semantics, tenancy/residency, and accepted ADRs. |
| Document intelligence | Taxonomy, ingestion, extraction/evidence, facts, graph, monitoring, applicability, impact, health, obligations, conformed views, and versioning. |
| AI | Capability registry, RAG, structured schemas, prompt/tool standards, guardrails, provider adapters, evaluations, and failure behavior. |
| API/events/connectors | Versioning, identity, errors, idempotency, concurrency, async jobs, OpenAPI, events, replay, privacy classification, and adapter contracts. |
| Security/privacy/audit | Authentication/recovery, authorization matrix, encryption/keys, support access, malware, data processing, retention/deletion, audit, consent, threat model, and incident rules. |
| UX/accessibility | Information architecture, responsive flows, every state, evidence/citation patterns, privacy-safe counts, approvals, recovery, and accessible interaction specifications. |
| Engineering/operations | Stack ADRs, repository and migration standards, environments, CI/CD, IaC, secrets, deployment/repair, backup/DR, observability, and cost controls. |
| Reference data | Versioned schemas and initial Australia data for document types, rules, sources, jurisdictions, roles, permissions, statuses, severities, and workflows. |
| Backlog/testing | Vertical stories with linked acceptance criteria; contract, authorization, security, migration, E2E, resilience, performance, and AI evaluation evidence. |

## 14. PRD approval checklist

The product owner should approve this PRD only when:

- the included, conditional, reserved, and excluded boundaries are intentional;
- every `GAP-001`–`GAP-010` disposition is accepted or revised;
- the open decisions that materially change scope have owners and decision dates;
- requirements and release slices reflect an achievable Phase 1 sequence;
- success metrics and safety/quality gates are approved;
- Australian terminology and domain boundaries have been reviewed;
- clinical-record exclusion and unsupported-content behavior are unambiguous;
- the product does not imply legal, tax, financial, insurance, immigration, or medical advice; and
- the decision register records the approved PRD version and date.

Approval of this PRD alone does **not** open the implementation gate. `DEC-010` and the full readiness conditions in `CODEX.md` continue to apply.
