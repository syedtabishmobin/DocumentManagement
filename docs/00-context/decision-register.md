# Decision Register

| Field | Value |
|---|---|
| Document ID | `CTX-DEC-001` |
| Status | Active |
| Updated | 30 August 2026 — approved architecture status reconciled and managed-dependant transition boundary approved |

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
| `DEC-021` | SUPERSEDED | Responsive web application/PWA first, with mobile camera capture and push-ready APIs; native apps follow after the core workflows are validated. Superseded by the concurrent React web and Flutter mobile decision in `DEC-052`. | Controls UX scope, client architecture, offline behavior, testing, and release sequencing. | Concurrent web+iOS+Android; native mobile first; desktop-first. |
| `DEC-022` | SUPERSEDED | Multi-tenant cloud SaaS with strict workspace isolation and an Australian data-residency option; the production provider selection is superseded by `DEC-049` while the isolation and Australian-residency constraints remain active. | Affects security, operations, cost, residency, backup, connectors, and enterprise extensibility. | Single-tenant; self-hosted/local-first; provider-specific managed deployment. |
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
| `DEC-044` | APPROVED | Provide a complete public product website with product, feature, privacy/security, about and contact content and clear create-account/sign-in routes. Passkeys are an authentication method enrolled after account creation and offered on sign-in, not a social-sign-up provider. Personal/family selection updates the suggested workspace name. Family administration presents one people list while retaining separate subject, membership, invitation and grant records underneath; authorized administrators can add, edit and remove eligible people, enable/suspend login, assign explicit view/add/edit/delete document capabilities and inspect an immutable, content-minimized change history. | Product-owner correction, 28 August 2026 |
| `DEC-045` | APPROVED | Implement consent-driven external identity and acquisition adapters for Google, Apple, Microsoft, Gmail, Google Drive, OneDrive, Dropbox, Box and private inbound email, plus channel-neutral email/SMS invitation delivery. A provider activates only when its application credentials, exact redirect origins, minimal scopes, consent copy, token protection, revocation/deletion behavior, deployment eligibility and audit checks are configured. Missing configuration MUST remain visible and non-operational; no simulated success or silent transfer is allowed. | Product-owner instruction, 28 August 2026 |
| `DEC-046` | APPROVED | Do not transmit temporary passwords by email or SMS. Send a short-lived, single-use, audience-bound invitation link and optional one-time verification code; require the invitee to establish their own password or passkey on first redemption. This preserves the requested first-login credential setup without creating reusable credentials in messages. | Product-owner approval of all recommendations, 28 August 2026 |
| `DEC-047` | APPROVED | Use **Doculyra** as the working product brand, with `Doculyra Home` as the Phase 1 household edition and reserved `Doculyra Business`/`Doculyra Enterprise` extensions. Use the approved folded-document `D` mark, matching favicon/app icon, and a restrained black, graphite, grey and white visual system. Public copy and product presentation balance organisation, evidence-aware AI assistance, privacy and explicit human control; the design may use Apple-like restraint and clarity but must remain a distinct Doculyra identity. | Product-owner brand and design approval, 28 August 2026 |
| `DEC-048` | APPROVED | Finalise the Doculyra public, onboarding and local product experience before continuing live Google, Apple, Microsoft, email/SMS or cloud-document provider integration. Existing provider-neutral ports remain visible, disabled and testable; no provider is activated, simulated or removed by this sequencing decision. | Product-owner sequencing instruction, 28 August 2026 |

## Production and mobile decisions approved on 28 August 2026

| Decision ID | State | Decision | Source |
|---|---|---|---|
| `DEC-049` | APPROVED | Select Microsoft Azure as the Phase 1 production infrastructure provider behind the existing provider-neutral ports. Infrastructure MUST be defined in Bicep for isolated `dev`, `stage`, and `prod` environments. `dev` and `stage` may use the current personal Azure subscription with synthetic/test data; `prod` is parameterized but MUST NOT be provisioned until a separate production subscription exists. The approved production data realm is Australia East with only explicitly documented Australian paired-region resilience routes. | Product-owner approval, 28 August 2026 |
| `DEC-050` | APPROVED | Use two-layer encryption: Azure-managed encryption at rest/in transit plus customer-controlled client-side authenticated encryption for originals and sensitive derivatives before network transfer. Customer content keys MUST remain unavailable to Doculyra operators and ordinary Azure services. Doculyra MUST use established cryptographic standards and audited platform/library implementations rather than implement cryptographic primitives. Authorized review, extraction, search, graph, and question answering operate on the customer device unless a later separately consented private-compute route is approved. | Product-owner approval, 28 August 2026 |
| `DEC-051` | APPROVED | Adopt a secure-development and assurance baseline mapped to NIST CSF 2.0, OWASP ASVS, OWASP API Security, OWASP MASVS/MASTG, the Azure Security Benchmark, and applicable Australian Privacy Principles. Alignment is an engineering control objective, not a certification claim; public production release requires objective control evidence, privacy/legal review, and independent penetration testing. | Product-owner approval, 28 August 2026 |
| `DEC-052` | APPROVED | Keep the public website and authenticated web vault in React/TypeScript and build the primary dedicated iOS/Android experience in Flutter/Dart. The clients share OpenAPI/event schemas, authentication and authorization semantics, encryption envelopes, fixtures, and generated contract models, but not UI source code. Native Swift/Kotlin code is limited to platform capabilities that Flutter plugins cannot safely provide. This supersedes the web-first/native-later sequencing in `DEC-021` and the mobile-wrapper consequence in `ADR-ARCH-006`. | Product-owner approval and clarification, 28 August 2026 |
| `DEC-053` | APPROVED | Production document deletion immediately activates a deletion fence and moves the document to restricted Trash for 30 calendar days. An authorized user may restore it during that window after step-up authentication. At expiry, the system MUST purge the encrypted artifact, sensitive metadata and derivatives, destroy live recovery key envelopes, retain only content-minimized audit/deletion evidence, and prevent backup/restore/replay from resurrecting access. Azure Blob soft delete provides the physical 30-day artifact safety net; the application remains responsible for the cross-store lifecycle and deletion ledger. Account deletion and lawful retention exceptions remain separate governed workflows. | Product-owner approval, 28 August 2026 |
| `DEC-054` | APPROVED | Codex is authorized to update the specifications and implement the complete Phase 1 production-oriented program, including Bicep and Azure `dev`/`stage` provisioning in the current subscription, using synthetic/test data until production readiness. Production subscription creation, production provisioning, real-customer processing, public DNS cutover, external identity/provider activation, and App Store/Play production publication remain explicit release gates requiring the necessary owner accounts, credentials, legal details, costs, and final evidence. | Product-owner instruction, 28 August 2026 |
| `DEC-055` | APPROVED | Proceed with deployment of the complete synthetic-data Phase 1 development experience on Azure-generated HTTPS hosts. The default RAG, extraction, preview, search, graph and question-answering route remains customer-device local under `DEC-050`; no hosted model may receive plaintext by implication. Microsoft, Google, Apple and document-platform integrations are approved for implementation and consent/configuration preparation, but an exact provider activates only after the owner supplies or authorizes its application registration, credentials, redirect URIs, minimal scopes and conformance evidence. Permanent custom-domain purchase and public DNS cutover remain later owner-controlled release steps. | Product-owner instruction, 28 August 2026 |
| `DEC-P1-056` | APPROVED | Phase 1 implements a tested fail-closed ownership/access transition fence. Every attempt is explicit and independently testable; incomplete, ambiguous, failed, retried, rolled-back, stale, concurrent or partially applied state grants no broader access and converges to the last authorised state with permission recalculation and privacy-safe audit/recovery evidence. Advanced document-level transfer, complex inherited-right preservation, delegated authority chains and enterprise entitlement transfer are deferred to a later governed capability; extension points remain without implied authority. | Product Authority steer and [Issue #33 evidence](https://github.com/syedtabishmobin/DocumentManagement/issues/33#issuecomment-5463877570), 30 August 2026 |

## Open product decisions

No material product decision currently blocks the Phase 1 build baseline. Activation and release gates below remain governed evidence requirements, not unresolved scope choices.

## Remaining deferred or activation-gated choices

Approved `DEC-041`, `DEC-049`, `DEC-050`, `DEC-052`, `DEC-054`, `DEC-055`, and accepted ADRs select the core stack, Azure environment model, PostgreSQL canonical persistence, React/Flutter clients, customer-controlled encryption, and device-local intelligence boundary. The following narrower choices remain replaceable or disabled behind explicit contracts until their owning release evidence or decision is approved:

- exact production Azure subscription, SKUs, quotas, network, backup, failover, support, and per-data-role processor/placement matrix;
- search, vector, and graph physical adapters where accepted contracts do not yet select a managed product;
- external OCR/scanning and any separately consented private-compute AI/model/embedding route; the default plaintext route remains customer-device local under `DEC-050`/`055`;
- production recovery/ownership-transfer assurance; the Phase 1 dependant fence is approved by `DEC-P1-056`, while richer transfer semantics require a later governed change;
- customer-facing external notification/SMS activation, which is distinct from the framework Product Authority notification channel;
- exact external identity and connector registrations, credentials, redirect URIs, minimal scopes, consent, deletion, residency, and conformance evidence; and
- production legal terms, custom domain/DNS, store accounts/signing, public launch claims, and final accountable release approval.

## Decision workflow

1. Record a decision as `PROPOSED` or `OPEN` with options and consequences.
2. Obtain explicit product-owner approval for choices that materially affect scope, privacy, architecture, cost, or external commitments.
3. Add or update an Architecture Decision Record for technical choices.
4. Update every affected requirement, contract, reference-data file, test, and backlog item.
5. Never infer approval from an unreviewed draft or from the handover’s embedded instructions.
