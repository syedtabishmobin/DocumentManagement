# Decision Register

| Field | Value |
|---|---|
| Document ID | `CTX-DEC-001` |
| Status | Active |
| Updated | 26 August 2026 — Phase 1 implementation approval recorded |

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

## Phase 1 baseline decisions approved for implementation

The product owner approved the complete Phase 1 implementation on 26 August 2026. The approval authorizes a continuous local-first build across all four slices using synthetic data and local/mock adapters. It does not authorize production deployment or processing of real personal documents. Decisions whose production values remain intentionally deferred have an explicit disabled local boundary below.

| Decision ID | State | Decision or question | Consequence if unresolved | Primary specification |
|---|---|---|---|---|
| `DEC-030` | APPROVED | Implement the complete Phase 1 through four coherent vertical slices—secure household vault, understand/retrieve, monitor/close, and family launch/portability—but treat them as engineering checkpoints within one continuously authorized build. | Enables full Phase 1 delivery without renewed scope approval at each slice. | Product-owner approval, 26 August 2026 |
| `DEC-031` | APPROVED | Phase 1 local development enables upload, camera-compatible capture, bulk upload, and manual entry. Inbound email and live cloud connectors remain disabled behind provider-neutral ports until separately activated for production. | Preserves complete connector architecture without external transfer during local testing. | Product-owner approval, 26 August 2026 |
| `DEC-032` | APPROVED | Automated emergency, incapacity, and after-death release is excluded from Phase 1. Ordinary scoped grants and curated portability exports remain in scope. | Removes an unsafe automatic-release path while preserving family collaboration. | Product-owner approval, 26 August 2026 |
| `DEC-033` | APPROVED | A complete portability export includes authorized originals, versions, derived data, facts, relationships, applicable rules, tasks, reminders, grants, and audit history in documented formats, subject to third-party rights. | Establishes the full Phase 1 portability contract. | Product-owner approval, 26 August 2026 |
| `DEC-034` | APPROVED | Phase 1 presents decomposable item-level readiness findings only. It does not calculate or display an aggregate score, rank, traffic light, compliance claim, or risk guarantee. | Prevents a misleading summary while retaining explainable assistance. | Product-owner approval, 26 August 2026 |
| `DEC-035` | APPROVED | Local implementation uses governed synthetic Australian-first document, schema, requirement, and source fixtures. Public launch coverage claims require a later reviewed production package and are not implied by local fixtures. | Allows complete implementation and testing without fabricating public coverage. | Product-owner approval, 26 August 2026 |
| `DEC-036` | APPROVED | Suspected clinical records enter isolated `POLICY_HOLD` quarantine. Preview, extraction, search, graph, AI, sharing, and export are denied; deletion is allowed; ordinary processing requires explicit safe reclassification. | Provides a consistent fail-closed clinical boundary. | Product-owner approval, 26 August 2026 |
| `DEC-037` | APPROVED | In-app notifications are required in Phase 1. Email and push remain disabled behind a channel-neutral adapter until separately approved and configured. | Delivers the workflow without external data transfer. | Product-owner approval, 26 August 2026 |
| `DEC-038` | APPROVED | Recovery and ownership-transfer routes are unavailable in the local Phase 1 profile. Production recovery requires a separate assurance decision and cannot silently activate. | Avoids insecure placeholder recovery while allowing other identity workflows to be built. | Product-owner approval, 26 August 2026 |
| `DEC-039` | APPROVED | The local profile immediately fences deletion, purges active and derived local content, creates no production backup, and retains only a content-free audit tombstone. Production cooling-off, backup-expiry, and statutory audit-retention values require a later deployment decision. | Makes local deletion deterministic without inventing production promises. | Product-owner approval, 26 August 2026 |
| `DEC-040` | APPROVED | The default Phase 1 development route is synthetic, local-only, outbound-denied processing with no cloud processor or residency claim. Production data-class, processor, region, support, backup, and exception routes require a later deployment decision. | Enables safe local testing and preserves an Australian-residency production option. | Product-owner approval, 26 August 2026 |

## Implementation authorization

| Decision ID | State | Decision | Source |
|---|---|---|---|
| `DEC-041` | APPROVED | `PROD-PRD-001` version `0.1` is the approved Phase 1 implementation baseline. Codex is authorized to implement all Phase 1 slices as one continuous program, using synthetic data and local-only defaults, and to commit and push completed increments. Production deployment and real personal-data processing remain outside this authority. | Product-owner instruction, 26 August 2026 |
| `DEC-042` | APPROVED | Use a TypeScript modular monorepo with a responsive installable web/PWA client, structured API/domain boundaries, PostgreSQL-compatible persistence ports, local filesystem artifact storage, local/mock AI adapters, OpenAPI contracts, deterministic tests, and optional container packaging. Provider activation remains configuration-gated. | Product-owner approval of recommended implementation stack, 26 August 2026 |
| `DEC-043` | APPROVED | Phase 1 onboarding and acquisition surfaces must expose consumer parity: email/password registration, passkey-ready and Google/Apple/Microsoft identity ports; personal/family setup; household subjects distinct from login members; subject-linked capture; browse/drag-drop, multi-file/folder, camera/scan and manual entry; and email, Gmail, Google Drive, OneDrive, Dropbox and Box connector ports. The local profile implements local credentials and device/file/manual routes; external identity and connector routes remain visibly unconnected until explicit credentials, consent and production eligibility are configured, with no silent fallback or transfer. | Product-owner correction, 28 August 2026 |

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
