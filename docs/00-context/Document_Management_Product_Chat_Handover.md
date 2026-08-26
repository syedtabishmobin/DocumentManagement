# Chat Handover --- Intelligent Document Management Product

## Purpose

This handover captures the product direction, decisions, architecture
principles, feature scope, development approach, and next work from this
chat. Use it as the starting context in a new ChatGPT Work chat. Do not
restart product discovery unless a decision below is explicitly
reconsidered.

## 1. Product concept

Build an **AI-native intelligent document management and
change-monitoring platform**. It is not merely a cloud drive or document
repository.

The product should know: - What documents a user has and what they
mean. - Whether documents are current, expired, superseded or due for
review. - What facts, dates, parties and obligations they contain. -
What personal, family or external changes affect them. - What other
documents are affected by a change. - What expected documents appear to
be missing. - Where documents contradict one another or contain stale
facts. - What action should be taken and what evidence supports it.

Core lifecycle:

`Ingest → Understand → Link → Monitor → Detect → Assess Impact → Recommend → Approve → Act/Update → Audit`

A key differentiator is the **Document Dependency Graph**, connecting
documents, sections, people, canonical facts, obligations, events,
trusted sources, changes, recommendations and tasks.

## 2. Product phases

### Phase 1 --- Personal & Family

Build first: - Personal and family workspaces. - Identity, family,
finance, tax, property, insurance, vehicles, travel, education,
employment/career, certifications, legal/estate and household
documents. - Secure vault, ingestion, OCR/extraction, classification and
versioning. - Canonical facts and dependency graph. - Expiry, renewal,
periodic-review, life-event and trusted-source monitoring. - Impact
analysis, missing-document detection, inconsistency/staleness
detection. - AI search/Q&A with evidence. - Recommendations, tasks,
reminders and notifications. - Family sharing, privacy, audit, export
and deletion.

### Phase 2 --- Company & Enterprise

Extend the same foundation with: - Organisation workspaces and business
units. - Corporate, legal, contract, finance, tax, HR, governance,
privacy, cybersecurity, compliance, policy, technology, operations,
vendor, insurance and IP documents. - Enterprise RBAC, SSO/SCIM, DLP and
tenant administration. - Records retention/disposition, legal
hold/eDiscovery. - Policy lifecycle, compliance obligations, controls
and evidence. - Enterprise integrations, reporting and APIs.

**Critical decision:** Phase 1 has consumer scope but must use
enterprise-ready architectural abstractions so Phase 2 does not require
rebuilding the core.

## 3. Core architecture and domain model

Do not model the platform simply as `User → Documents`.

Use:

`Identity → Membership → Workspace → Resources`

Workspace types: - PERSONAL - FAMILY - ORGANISATION (reserved for Phase
2)

Core entities should include: - User, Workspace, Membership, Subject,
Relationship, Role, Permission - Document, DocumentType,
DocumentVersion, DocumentSection, DocumentChunk, DocumentArtifact -
FactDefinition, Fact, FactValue/History, FactOccurrence - Obligation,
Requirement - Dependency - ExternalSource, SourceSnapshot, SourceRule -
MonitoringRule, MonitoringSubscription - ChangeEvent, ImpactAssessment,
Recommendation - Review, Approval, Task, Reminder, Notification -
Integration, AccessGrant - Evidence, AIAnalysis, ConfidenceScore,
AuditEvent

### Canonical facts

Facts are separate from document occurrences. Examples include name,
address, DOB, citizenship, employer, contact details, household
relationships and school.

A document can provide evidence for a fact. Fact values should be
effective-dated and retain provenance/history. When a canonical fact
changes, the dependency graph identifies affected resources.

Example: changing a home address should identify licences, insurance,
banks, lease/property records, schools, vehicle registration, employer
records, utilities and any other documents containing/depending on the
old address.

## 4. Phase 1 document taxonomy

Initial categories and examples:

-   **Identity:** passport, driver licence, birth certificate,
    citizenship certificate, marriage certificate, visa/residency and
    other identity records.
-   **Family:** family identity records, school/childcare enrolments,
    consent forms, emergency-contact and dependant records.
-   **Finance:** bank records, loans, mortgage, investments,
    superannuation and credit agreements.
-   **Tax:** returns, assessments/notices, receipts, deductions and
    accountant correspondence.
-   **Property:** lease, mortgage, purchase, strata and inspection
    documents.
-   **Insurance:** home, contents, vehicle, health, life, travel and
    relevant professional cover.
-   **Vehicles:** registration, insurance, finance, service, warranty
    and roadside assistance.
-   **Travel:** passport/visa records, travel insurance, itineraries,
    tickets and bookings.
-   **Legal/Estate:** will, power of attorney, guardianship, beneficiary
    nominations and personal trust documents.
-   **Employment:** contracts, contractor agreements, position
    descriptions, NDA/IP documents and payslips.
-   **Career:** CV/resume, certifications, licences, training and
    portfolio evidence.
-   **Education:** degrees, transcripts, school/university records and
    course certificates.
-   **Household:** utilities/service agreements, receipts, warranties
    and important household contracts.

Taxonomy must be configuration-driven and jurisdiction-aware. Per
document type define classification aliases, extraction schema,
sensitive fields, expiry/review fields, monitoring rules, expected
dependencies, trusted sources and supersession rules.

## 5. Change and monitoring model

Monitor more than expiry dates.

Change classes: - Expiry, renewal and deadline. - Periodic review. -
Personal/family/life-event change. - Employment or financial change. -
Regulatory, tax or authoritative-rule change. -
Provider/contract/version change. - Policy/document dependency change. -
Authoritative website/source change. - Cross-document inconsistency. -
Stale information. - Missing information/document. - New obligation or
official replacement template/form. - Supersession.

Monitoring strategies: - DATE - PERIODIC - EVENT - SOURCE_CHANGE -
DEPENDENCY - VERSION

Monitoring rules must be document-type and jurisdiction specific.

### Trusted Source Registry

Store source ID, authority, jurisdiction, topics, official URL/API,
retrieval method, frequency, reliability tier, last successful check,
parser/version and applicable rules.

Prefer: 1. Government/regulator/official issuer. 2. Recognised official
provider/standards body. 3. User-selected source.

External-change recommendations must retain source, observed date,
evidence, applicability and confidence. AI must not use arbitrary web
content as authority for consequential recommendations.

## 6. Dependency, impact and proactive intelligence

Possible graph nodes: Document, DocumentSection, Fact, Subject,
Household, Obligation, ExternalSource, SourceRule, Event, Recommendation
and Task.

Possible edges: `DOCUMENT_CONTAINS_FACT`, `FACT_SUPPORTED_BY`,
`DOCUMENT_DEPENDS_ON_FACT`, `DOCUMENT_SUBJECT`,
`OBLIGATION_DERIVED_FROM`, `RULE_MONITORED_AT_SOURCE`, `CHANGE_AFFECTS`,
`SUPERSEDES`.

Impact results should distinguish: - Automatic update technically
possible. - User action required. - External notification required. -
Review required. - No action.

Severity and confidence are separate.

### Missing-document intelligence

Infer potentially expected documents from context, explain why they are
expected, and support Add, Not Applicable, Dismiss and Remind Later. Do
not assert a legal requirement without authoritative evidence.

### Inconsistency/staleness intelligence

Detect conflicting addresses/names/dates/terms, obsolete provider
details, superseded policies, expired documents, stale
CV/employer/school details and other time-sensitive facts.

## 7. Ingestion, versioning and AI

### Ingestion sources

Browser/mobile upload, camera scan, bulk upload, email import, OneDrive,
Google Drive, Dropbox, Box and future connectors.

Initial formats: PDF, DOCX, XLSX, PPTX, TXT, CSV, JPG/JPEG, PNG and HEIC
where supported.

Suggested pipeline: 1. Validate file. 2. Malware scan/quarantine. 3.
Hash/deduplicate. 4. Preserve immutable original. 5. Native text
extraction or OCR. 6. Language/layout detection. 7. Classification. 8.
Select extraction schema. 9. Extract entities, facts, dates, amounts and
obligations. 10. Validate extraction. 11. Resolve subject/owner
candidates. 12. Summarise. 13. Chunk/embed/index. 14. Create fact
occurrences. 15. Infer dependencies. 16. Assign monitoring rules. 17.
Calculate confidence. 18. READY or NEEDS_REVIEW. 19. Record
audit/provenance.

### Versioning

Original binaries are immutable. A logical document may have many
versions. Support supersession, semantic/material comparison, archive,
trash/restore and controlled purge. Exact hash equality means identical
bytes, not logical document identity.

### AI capabilities

Define explicit capabilities rather than one generic agent: ingestion
orchestrator, classifier, extractor, subject resolver, document analyst,
dependency builder, change analyst, impact analyst,
consistency/staleness analyst, missing-document analyst, recommendation
generator, draft-update generator, verifier and search assistant.

Each AI capability must define inputs, authorized tools, structured
output, evidence, confidence, permitted/forbidden actions, human-review
threshold, retry/fallback and telemetry.

## 8. Search, trust, family access and notifications

### Search/RAG

Support full-text, metadata/filter, semantic/hybrid search and
conversational Q&A. Retrieval must be permission-aware. Preserve
document/version/page/section provenance. Answers cite evidence and
explicitly state insufficient evidence when applicable.

Example questions: - When does my son's passport expire? - Which family
documents expire in 90 days? - Which documents contain my old address? -
Compare these insurance policies. - What needs attention and why?

### Human approval

Never silently rewrite consequential documents.

Preferred workflow:

`Detect → Explain → Evidence → Impact → Proposed Action → User Approval → New Version/External Action → Audit`

### Family model

Roles can initially include OWNER, FAMILY_ADMIN, ADULT_MEMBER,
MANAGED_DEPENDANT and GUEST. Membership does not automatically reveal
every resource. Dependants may exist without accounts and later
transition to independent access without recreating history. Guest
access can be time-limited and revoked.

### Notifications

Suggested severities: INFO, ACTION, IMPORTANT, URGENT, CRITICAL.
Channels: in-app plus extensible email/push. Support tasks, due dates,
snooze, escalation, completion evidence, preferences and deduplication.

## 9. Security, privacy and non-functional principles

Because highly sensitive documents are stored, security is
foundational: - Encryption in transit/at rest. - Secure secrets. - Least
privilege and workspace isolation. - Authorization before retrieval,
including RAG. - Malware quarantine. - Signed/time-limited artifact
access. - Sensitive logging redaction; no normal logs containing raw
document content. - Session/device security. - Audit/provenance. -
Connector consent/revocation. - Export and deletion/purge. - Retention
controls. - Backup/recovery. - AI provider/data-processing controls.

Phase 2 must be able to add SSO, SCIM, enterprise RBAC, DLP, residency
controls, legal hold and records management.

NFR areas requiring explicit targets before production: availability,
latency, ingestion throughput, scalability, backup/RPO/RTO,
accessibility, observability, AI cost budgets, performance, security and
AI regression testing.

## 10. Competitive direction

A competitor comparison was requested across enterprise DMS/content
platforms, consumer document vaults, contract lifecycle tools,
compliance/policy products, AI document tools, records-management
systems and expiry/renewal products. The detailed response repeatedly
disappeared due to a UI/rendering issue, so the exact competitor matrix
was not retained.

Capabilities deliberately incorporated from mature product categories
include: - Repository/storage, OCR, metadata, tagging, search and
versioning. - Sharing, permissions, audit and workflow/tasks. -
Cloud/email integrations. - Document comparison. - AI document Q&A. -
Expiry/renewal and obligation extraction. - Enterprise extension points
for records, policies, compliance, identity and administration.

Intended differentiation: 1. Personal + family + later enterprise
lifecycle. 2. Canonical facts. 3. Dependency graph. 4. Authoritative
external change monitoring. 5. Change-once / impact-everywhere. 6.
Missing-document intelligence. 7. Cross-document
inconsistency/staleness. 8. Evidence-backed recommendations. 9.
Human-approved updates. 10. Proactive document health rather than
passive storage.

**Next chat should re-run current competitor research before freezing
the PRD and incorporate worthwhile missing capabilities.**

## 11. Codex development approach

The intention is for Codex to develop the application from a
high-quality specification repository.

Major product, architecture, security and domain decisions should be
specified before Codex implements them. Codex may make bounded
implementation decisions within those contracts.

Suggested implementation epics: 1. Identity & Workspace 2. Document
Repository 3. Ingestion 4. Document Intelligence 5. Search & Retrieval
6. Facts & Entities 7. Dependency Graph 8. Versioning 9. Change
Monitoring 10. Impact Analysis 11. Notifications/Tasks 12. AI Assistant
13. Personal Workspace 14. Family Workspace 15. Integrations 16.
Security & Audit 17. Administration/Configuration

The documentation itself should live in the repository. Document types,
monitoring rules, source definitions, permissions and workflows should
be configuration/machine-readable where practical rather than
hard-coded.

## 12. Required specification pack

The user agreed with the recommendation to create all necessary Phase 1
documentation while retaining Phase 2 extension points.

The planned repository should include:

### `/01-product`

-   Product Vision & Strategy
-   Phase 1 PRD
-   Feature Catalogue
-   Use Case Catalogue
-   Personas/Journeys
-   Scope and success metrics

### `/02-architecture`

-   Solution Architecture
-   Domain Model
-   Logical/Physical Data Model
-   Workspace/Family/Membership Model
-   Non-Functional Requirements
-   Architecture Decision Records

### `/03-document-intelligence`

-   Document Taxonomy
-   Ingestion/Processing
-   Extraction Schemas
-   Facts/Entities
-   Dependency Graph
-   Change Monitoring
-   Impact Analysis
-   Trusted Source Registry
-   Missing/Inconsistency/Staleness logic
-   Versioning

### `/04-ai`

-   AI/Agent Architecture
-   RAG/Search Architecture
-   Structured Output Contracts
-   Prompt/Tool Standards
-   AI Guardrails
-   AI Evaluation Framework

### `/05-api`

-   API Standards
-   OpenAPI contract
-   Event Catalogue
-   Integration/Connector contracts

### `/06-security`

-   Security Architecture
-   Authorization/RBAC
-   Privacy/Data Governance
-   Audit/Provenance
-   Threat Model

### `/07-ux`

-   Information Architecture
-   User Flows
-   Screen Specifications
-   Design System
-   Accessibility

### `/08-engineering`

-   Technology Stack
-   Repository Structure
-   Coding Standards
-   Error/Resilience Standards
-   Local Development
-   Testing Standards

### `/09-devops`

-   Environments
-   CI/CD
-   Infrastructure as Code
-   Secrets/configuration
-   Deployment/Rollback
-   Backup/DR
-   Observability

### `/10-backlog`

-   Epics
-   Features
-   User stories
-   Acceptance criteria
-   Dependencies

### `/11-reference-data`

-   Document type definitions
-   Monitoring rules
-   Jurisdictions
-   Trusted sources
-   Roles/permissions
-   Status/severity definitions

### `/12-testing`

-   Test Strategy
-   AI Evaluation Dataset/Scenarios
-   Security Tests
-   Integration/E2E Scenarios
-   Performance Tests

## 13. Required next task in the new Work chat

The user wants the new chat to **create the complete Phase 1
specification pack in Markdown**, detailed enough to be downloaded,
placed in a repository, and used by Codex to implement the product.

Instructions for the new chat:

1.  Treat this handover as approved context.
2.  Re-run a current competitor/gap analysis first and incorporate
    genuinely useful missing capabilities.
3.  Finalise the Phase 1 product scope without compromising Phase 2
    extensibility.
4.  Create the complete Markdown documentation repository listed above.
5.  Do not produce superficial one-page placeholder specifications. Core
    PRD, architecture, domain/data model, security, document
    intelligence, AI, monitoring, API contracts, UX flows, testing and
    backlog must be implementation-grade.
6.  Use stable requirement/use-case IDs and cross-reference them.
7.  Include acceptance criteria for implementable requirements.
8.  Use Mermaid diagrams where useful in Markdown.
9.  Put machine-readable configuration examples in YAML/JSON code blocks
    where appropriate.
10. Clearly mark unresolved decisions rather than silently inventing
    them.
11. Keep vendor-specific implementation decisions isolated behind
    abstractions unless a technology decision is explicitly approved.
12. Produce a repository that Codex can navigate predictably.
13. Include a root `README.md` explaining reading order and
    source-of-truth hierarchy.
14. Include a `CODEX.md` (or equivalent) with explicit instructions for
    Codex: what documents to read, implementation workflow, testing
    requirements, documentation-update rules, forbidden shortcuts and
    definition of done.
15. Package the completed Markdown repository as a downloadable ZIP as
    well as individual `.md` files/folders if the environment supports
    it.

## 14. Current status

No final specification pack has been successfully produced yet. Attempts
in the prior chat were interrupted by tooling/output issues. Therefore
the new Work chat should create the documents fresh from this handover
rather than assuming partial generated files are authoritative.

The decisions in this handover are the approved baseline unless the user
explicitly changes them.
