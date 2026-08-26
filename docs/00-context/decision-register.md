# Decision Register

| Field | Value |
|---|---|
| Document ID | `CTX-DEC-001` |
| Status | Active |
| Updated | 26 August 2026 |

## Decision states

- `APPROVED`: explicitly selected and now a repository constraint.
- `PROPOSED`: recommended default awaiting owner confirmation.
- `OPEN`: material options remain and no safe default has been selected.
- `DEFERRED`: intentionally postponed; specifications must preserve alternatives.
- `SUPERSEDED`: replaced by a later decision with a traceable reference.

## Approved baseline decisions

| Decision ID | State | Decision | Source |
|---|---|---|---|
| `DEC-001` | APPROVED | Build an AI-native document intelligence and change-monitoring platform, not merely a file repository. | Handover sections 1 and 14 |
| `DEC-002` | APPROVED | Phase 1 serves personal and family workspaces; Phase 2 extends the same core to organisations. | Handover section 2 |
| `DEC-003` | APPROVED | Use `Identity → Membership → Workspace → Resources`; reserve PERSONAL, FAMILY, and ORGANISATION workspace types. | Handover section 3 |
| `DEC-004` | APPROVED | Store canonical facts independently from document occurrences, with history and provenance. | Handover section 3 |
| `DEC-005` | APPROVED | Original binaries are immutable; logical documents support versions, supersession, comparison, archive, restore, and controlled purge. | Handover section 7 |
| `DEC-006` | APPROVED | Consequential recommendations and updates require evidence, explanation, human approval, and audit. | Handover sections 5, 8, and 9 |
| `DEC-007` | APPROVED | Taxonomy, monitoring rules, trusted sources, permissions, and workflows are configuration-driven and jurisdiction-aware. | Handover sections 4, 5, and 11 |
| `DEC-008` | APPROVED | Retrieval, graph traversal, and AI answers are permission-aware and preserve exact evidence provenance. | Handover sections 8 and 9 |
| `DEC-009` | APPROVED | Vendor-specific choices remain behind abstractions until explicitly approved. | Handover section 13 |
| `DEC-010` | APPROVED | The full Phase 1 specification pack is produced before application implementation begins. | Handover sections 11–14 |
| `DEC-011` | APPROVED | The local repository lives at `/Users/syedtabishmobin/Documents/Work/Techafide/Codex/Projects/DocumentManagement`. | Current task confirmation |

## Product decisions approved on 26 August 2026

| Decision ID | State | Decision | Why it matters | Alternatives considered |
|---|---|---|---|---|
| `DEC-020` | APPROVED | Australia-first jurisdiction pack, with jurisdiction-neutral core contracts. | Changes privacy, terminology, document taxonomy, trusted sources, requirements, and acceptance scenarios. The consumer market has strong US-oriented incumbents. | Global/generic first; another named country first; Australia + one secondary launch jurisdiction. |
| `DEC-021` | APPROVED | Responsive web application/PWA first, with mobile camera capture and push-ready APIs; native apps follow after the core workflows are validated. | Controls UX scope, client architecture, offline behavior, testing, and release sequencing. | Concurrent web+iOS+Android; native mobile first; desktop-first. |
| `DEC-022` | APPROVED | Multi-tenant cloud SaaS with strict workspace isolation and an Australian data-residency option; infrastructure provider remains undecided. | Affects security, operations, cost, residency, backup, connectors, and enterprise extensibility. | Single-tenant; self-hosted/local-first; provider-specific managed deployment. |
| `DEC-023` | APPROVED | Phase 1 targets household owners and family administrators first; advisers receive limited guest/delegated access rather than a separate adviser product. | Keeps onboarding and workflows coherent while preserving professional collaboration. | Adviser-led B2B2C launch; estate-only launch; property-only vertical launch. |
| `DEC-024` | APPROVED | Treat health and clinical records as out of initial scope; include health-insurance and general coverage documents only. | Clinical data materially expands safety, privacy, consent, terminology, and regulatory obligations. | Include personal medical records in Phase 1; exclude all health-related documents. |

## Phase 1 baseline decisions awaiting product-owner review

These entries make unresolved product boundaries visible. `PROPOSED` and `OPEN` entries are not implementation authority, and their appearance in the draft PRD does not imply approval.

| Decision ID | State | Decision or question | Consequence if unresolved | Primary specification |
|---|---|---|---|---|
| `DEC-030` | PROPOSED | Deliver Phase 1 as four vertical product slices—secure household vault, understand/retrieve, monitor/close, and family launch/portability—while allowing the overall Phase 1 domain envelope to exceed the first public launch profile. | Backlog sequencing and launch claims cannot be frozen. | `PROD-PRD-001` §6.2 |
| `DEC-031` | OPEN | Which private inbound-email and cloud connector capabilities, if any, are required in each Phase 1 slice beyond upload, camera capture, and manual entry? | Connector stories, consent UX, retention behavior, and adapter acceptance tests remain conditional. | `PROD-PRD-001` §7.3 |
| `DEC-032` | OPEN | Whether Phase 1 includes automated emergency, incapacity, or after-death release, and which evidence, delay, challenge, consent, revocation, and jurisdiction rules govern it. | Automated release cannot be specified or implemented safely; curated exports and ordinary time-limited grants may be specified separately. | `PROD-PRD-001` §7.11 |
| `DEC-033` | PROPOSED | A complete portability export includes authorized originals, versions, derived data, facts, relationships, applicable rules, tasks, reminders, grants, and audit history in documented formats, subject to third-party rights. | Export architecture and acceptance criteria otherwise risk becoming originals-only and non-portable. | `PROD-PRD-001` §7.13 |
| `DEC-034` | PROPOSED | Phase 1 may show an explainable document-readiness/content-health score only if it is decomposable, permission-safe, and never represented as legal compliance or a risk guarantee. | Health dashboards must omit aggregate scoring until terminology, privacy, and validation are approved. | `PROD-PRD-001` §7.8 |
| `DEC-035` | OPEN | Which document types, extraction schemas, requirement profiles, and Australian governed sources form the first public launch pack? | Initial reference data, source monitors, evaluation fixtures, and launch positioning cannot be finalized. | `PROD-PRD-001` §6.3 |
| `DEC-036` | OPEN | When capture appears to contain an excluded clinical record, should the service block before storage, quarantine for user decision, or retain only an encrypted original while disabling processing? | Clinical exclusion cannot be enforced consistently across ingestion, search, AI, export, and deletion. | `PROD-PRD-001` §7.2 |
| `DEC-037` | PROPOSED | In-app notifications are required in Phase 1; email and push sequencing remain behind a channel-neutral adapter until separately approved. | Detailed notification delivery, consent, privacy, and escalation tests beyond in-app remain conditional. | `PROD-PRD-001` §7.10 |
| `DEC-038` | OPEN | Which account and workspace recovery assurance, delay, challenge, and support process is acceptable for highly sensitive household data? | Authentication, key recovery, ownership transfer, and support-access architecture cannot be approved. | `PROD-PRD-001` §7.13 |
| `DEC-039` | OPEN | What are the deletion cooling-off period, active-data purge objective, backup expiry, and retained-audit minimization rules? | Privacy, backup, restore, audit, and user-facing deletion promises remain unsafe to implement. | `PROD-PRD-001` §7.13 |
| `DEC-040` | OPEN | Which data classes and processors must remain in Australia for the residency option, and which cross-border exceptions or consent mechanisms are permitted? | Deployment topology, provider selection, AI/OCR use, support, analytics, failover, and backup cannot be approved. | `PROD-PRD-001` §7.13 |

## Deferred implementation choices

These must remain replaceable behind explicit contracts until the architecture decision is approved:

- Cloud/infrastructure provider.
- Application framework and programming languages.
- Relational, search, vector, and graph storage products.
- Identity provider.
- OCR/document processing provider.
- Foundation-model and embedding providers.
- Notification, malware scanning, observability, and analytics vendors.
- Initial connector order beyond upload/camera/manual import.

## Decision workflow

1. Record a decision as `PROPOSED` or `OPEN` with options and consequences.
2. Obtain explicit product-owner approval for choices that materially affect scope, privacy, architecture, cost, or external commitments.
3. Add or update an Architecture Decision Record for technical choices.
4. Update every affected requirement, contract, reference-data file, test, and backlog item.
5. Never infer approval from an unreviewed draft or from the handover’s embedded instructions.
