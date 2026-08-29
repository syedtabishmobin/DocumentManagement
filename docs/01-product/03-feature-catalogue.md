# Phase 1 Feature Catalogue

| Field | Value |
|---|---|
| Document ID | `PROD-FEAT-001` |
| Version | `0.3` |
| Status | `APPROVED DERIVED BUILD BASELINE — implementation and release evidence remain gated` |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Source baseline | `PROD-PRD-001` version `0.3`, stable vision `PROD-VIS-001`, and `APPROVED` decisions in `CTX-DEC-001` |
| Updated | 30 August 2026 — build-baseline traceability reconciliation |

## 1. Authority and catalogue rules

This catalogue groups the independently traceable requirements in `docs/01-product/02-phase-1-prd.md` into user- and service-facing features. It introduces no product scope independently of that PRD or the `APPROVED` decisions in `docs/00-context/decision-register.md`.

The PRD is the approved Phase 1 implementation baseline under `DEC-041`. This catalogue remains a derived planning view: implementation authority and decision boundaries come from the PRD, approved decision register, accepted ADRs, and normative contracts. The four release slices are continuous engineering checkpoints under approved `DEC-030`.

Feature IDs are stable. A retired ID must not be reused. Detailed use cases, contracts, tests, reference data, and backlog items must link to both the applicable `FEAT-P1-*` and `REQ-P1-*` IDs.

### 1.1 Scope labels

| Label | Meaning in this catalogue |
|---|---|
| `REQUIRED` | Necessary for the approved complete Phase 1 product baseline; implementation and release evidence are tracked separately. |
| `CONDITIONAL` | Included only after the named decision and specialist contract are approved. |
| `RESERVED` | A model or interface extension point is preserved; no Phase 1 end-user capability is promised. |
| `EXCLUDED` | The PRD expressly excludes the capability from Phase 1. |

### 1.2 Release sequence

| Approved slice | Catalogue outcome |
|---|---|
| `P1-S1` — Secure household vault | Establish isolated workspaces, governed capture, immutable originals, configurable authorization, security, and audit. |
| `P1-S2` — Understand and retrieve | Produce reviewable evidence, facts, entities, dependencies, comparisons, and permission-aware cited answers. |
| `P1-S3` — Monitor and close the loop | Detect governed change, establish applicability and impact, obtain bound approval, act, and close with evidence. |
| `P1-S4` — Family launch and portability | Complete scoped collaboration, consent, continuity, export, deletion, recovery, residency, and launch controls. |

All four slice definitions form the continuous approved implementation program under `DEC-030`, `DEC-041`, and `DEC-054`; this does not establish feature completion or production readiness.

## 2. `P1-S1` — Secure household vault

### `FEAT-P1-001` — Workspace, membership, and subject foundation

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-001`, `OUT-P1-005` — households can establish governed personal and family workspaces without equating a person, login, membership, subject, and resource. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-WS-001`, `REQ-P1-WS-002`, `REQ-P1-WS-003` |
| Primary users | Household owner; family administrator; adult member; managed dependant represented as a subject. |
| Capabilities | Create eligible personal and family workspaces; maintain one explicit owner; audit membership changes; represent subjects without fabricated login identities; reserve the organisation workspace type without exposing its creation. |
| Explicit exclusions and decision dependencies | Organisation workspace creation and enterprise administration are `EXCLUDED`. The approved workspace policy and sequence follow `DEC-002`, `DEC-003`, and `DEC-030`; implementation still requires exact eligibility/configuration and evidence. |
| Failure or degraded behavior | Duplicate or retried creation must reconcile without duplicate ownership or memberships. If ownership or workspace scope cannot be established, creation fails without creating accessible orphan resources. A subject may remain usable without an account. |
| Product-level acceptance summary | A person can belong to multiple isolated workspaces; a dependant can be linked to evidence without credentials; membership and ownership changes are reconstructable; organisation creation is unavailable in Phase 1. |

### `FEAT-P1-002` — Configurable resource and field authorization

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-005`, `OUT-P1-007` — collaboration does not expose resources or derivatives merely because someone is a workspace member or administrator. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-WS-004`, `REQ-P1-WS-005`, `REQ-P1-TRUST-002` |
| Primary users | Household owner; family administrator; adult member; guest/delegated adviser; workspace service. |
| Capabilities | Evaluate versioned roles, permissions, and relationships through one authorization contract across APIs, workers, artifacts, search, graph, AI, caches, exports, notifications, connectors, analytics, support, and audit views. |
| Explicit exclusions and decision dependencies | Membership, ownership, or an administrative label is not blanket content access. Hard-coded role behavior is excluded by `DEC-007`; current permission enforcement and exact provenance are constrained by `DEC-008`; tenant isolation is constrained by `DEC-022`. |
| Failure or degraded behavior | Missing, stale, conflicting, or unavailable authorization state fails closed or enters an explicitly approved minimal-disclosure mode. Revocation must invalidate derivative access within the defined objective rather than relying on ingestion-time permissions. |
| Product-level acceptance summary | `AC-P1-SEC-001` passes across direct and derived channels, including counts, caches, graph paths, conversations, notifications, exports, analytics, and support workflows. |

### `FEAT-P1-003` — Immutable original vault and scoped artifact access

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-001`, `OUT-P1-002` — users can preserve and retrieve the exact evidence originally received. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-DOC-001`, `REQ-P1-DOC-002`, `REQ-P1-DOC-004`, `REQ-P1-CRYPTO-001` |
| Primary users | Household owner; family administrator; authorized adult member; workspace service. |
| Capabilities | Encrypt originals on an authorized customer client with an independent document key and versioned authenticated envelope before transfer; preserve immutable ciphertext with stable artifact identity, hash, media type, size, and acquisition provenance; keep logical-document identity separate from byte equality; support immutable versions; issue short-lived, version- and workspace-scoped ciphertext access that only an authorized client can decrypt. |
| Explicit exclusions and decision dependencies | Destructive in-place replacement and permanent public artifact URLs are excluded. Immutability and logical versioning follow `DEC-005`; isolation remains active from `DEC-022`, Azure selection follows `DEC-049`, and slice sequencing follows `DEC-030`. |
| Failure or degraded behavior | Hash mismatch, wrong workspace/version, expired or revoked access, or missing authorization fails without returning content. Reprocessing or metadata failure cannot change the accepted original bytes. |
| Product-level acceptance summary | The stored hash remains stable through reprocessing; identical bytes do not force unrelated logical documents to merge; authorized users retrieve the requested version while expired, revoked, and cross-workspace requests reveal nothing. |

### `FEAT-P1-004` — Governed capture and retryable ingestion

| Field | Detail |
|---|---|
| Scope | `REQUIRED`; connector expansion is `CONDITIONAL` under `FEAT-P1-026`. |
| Outcome | `OUT-P1-001`, `OUT-P1-007` — required capture routes produce truthful, recoverable processing rather than opaque upload success. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-DOC-006`, `REQ-P1-ING-001`, `REQ-P1-ING-002`, `REQ-P1-ING-004`, `REQ-P1-PLT-001` |
| Primary users | Household owner; family administrator; adult member; workspace service. |
| Capabilities | Support React web/PWA upload plus Flutter iOS/Android file, camera, photo-library, and manual record capture; route all through one asynchronous ingestion state machine; configure validation, preview, native extraction, OCR fallback, and unsupported behavior by format; preserve acquisition attempts; provide idempotent retry and exact-hash duplicate detection. |
| Explicit exclusions and decision dependencies | React web and concurrent Flutter mobile delivery are approved by `DEC-052`, which supersedes `DEC-021`. `DEC-031` and `DEC-045` authorize disabled-first connector implementation but no live provider transfer without activation evidence. `DEC-035` permits governed synthetic formats while public launch coverage remains release-gated; sequencing follows `DEC-030`. |
| Failure or degraded behavior | Unsupported or unprocessable formats receive an explicit terminal or reviewable degraded state. Duplicate submissions, late events, and out-of-order retries must not create uncontrolled versions or duplicate side effects, and byte equality must not assert logical identity. |
| Product-level acceptance summary | Every enabled format has an observable path; capture routes share the same provenance envelope; `AC-P1-ING-001` passes for duplicate submissions, timeouts, and out-of-order events. |

### `FEAT-P1-005` — Malware isolation and clinical-content boundary

| Field | Detail |
|---|---|
| Scope | `REQUIRED`, with final suspected-clinical handling `CONDITIONAL` on `DEC-036`. |
| Outcome | `OUT-P1-001`, `OUT-P1-007` — unsafe or excluded content cannot silently enter ordinary document-intelligence flows. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-DOC-007`, `REQ-P1-ING-003` |
| Primary users | Household owner; family administrator; adult member; workspace service; product operator or support user under separately approved policy. |
| Capabilities | Validate and scan before extraction; isolate suspicious files from preview, download, parsing, indexing, graph, search, and AI; identify suspected clinical records and prevent them from entering ordinary Phase 1 flows. |
| Explicit exclusions and decision dependencies | Clinical/treatment records and medical workflows are excluded by `DEC-024`. `DEC-036` requires isolated `POLICY_HOLD`, denies ordinary preview/extraction/search/graph/AI/sharing/export, allows deletion, and requires explicit safe reclassification before ordinary processing. Provider-specific scanner behavior remains behind the `DEC-009` abstraction boundary. |
| Failure or degraded behavior | Scanner timeout, scanner unavailability, suspicious classification, or unresolved clinical suspicion defaults to isolation with truthful status; it must never fall through to ordinary processing. Release or deletion requires the approved policy and authorization. |
| Product-level acceptance summary | Malware and scanner-failure paths are tested; quarantined content cannot be processed or surfaced; a synthetic clinical fixture is not indexed or misrepresented as in-scope health-insurance evidence. |

### `FEAT-P1-006` — Security, privacy-safe operations, and audit baseline

| Field | Detail |
|---|---|
| Scope | `REQUIRED`; detailed recovery is `CONDITIONAL` under `FEAT-P1-030`. |
| Outcome | `OUT-P1-001`, `OUT-P1-007` — sensitive household content is isolated and consequential activity remains reconstructable without leaking content through operations data. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-TRUST-001`, `REQ-P1-TRUST-003`, `REQ-P1-TRUST-004`, `REQ-P1-CRYPTO-002`, `REQ-P1-OPS-002`, `REQ-P1-ASSURE-001` |
| Primary users | Household owner; family administrator; adult member; managed dependant; guest or delegated adviser; workspace service; product operator or support user. |
| Capabilities | Combine Azure-managed transport/at-rest controls with customer-controlled member/device/recovery key envelopes; enforce least privilege and workspace isolation; revoke and rotate access without exposing content keys to ordinary operators; consume Azure commodity capabilities through provider-neutral adapters; redact ordinary telemetry; create tamper-evident, workspace-scoped security and consequence audit records; maintain an evidence-backed assurance case mapped to the approved standards baseline. |
| Explicit exclusions and decision dependencies | Standing support access to raw household content, server-held plaintext customer keys, custom cryptographic primitives, duplicated managed-service capabilities, unsupported certification claims, and raw content in logs, analytics, traces, fixtures, errors, or screenshots are excluded. Azure selection follows `DEC-049`, customer-controlled encryption follows `DEC-050`, assurance follows `DEC-051`, and approved `DEC-038` keeps recovery/ownership-transfer success routes unavailable in Phase 1 pending a later governed assurance decision. |
| Failure or degraded behavior | Sensitive telemetry is dropped or safely redacted rather than emitted. Audit-write or required security-control failure blocks the consequential operation or leaves it explicitly incomplete; support cannot bypass normal authorization. |
| Product-level acceptance summary | Threat-model and negative-authorization gates pass; critical workflows can be reconstructed from privacy-safe audit records; automated redaction tests cover success and failure paths. |

### `FEAT-P1-007` — Versioned product configuration and extension-safe core

| Field | Detail |
|---|---|
| Scope | Configuration foundation is `REQUIRED`; Phase 2 domain types are `RESERVED`. |
| Outcome | `OUT-P1-001`, `OUT-P1-007` — product behavior is inspectable and changeable through governed reference data rather than scattered hard-coded values. |
| Release slice | `P1-S1` |
| Linked requirements | `REQ-P1-CFG-001`, `REQ-P1-CFG-005`, `REQ-P1-PLT-002` |
| Primary users | Workspace service; product operator or support user. |
| Capabilities | Version document types, extraction definitions, facts, dependency types, monitoring rules, sources, jurisdictions, roles, permissions, statuses, severities, workflows, AI capabilities, and client encryption envelopes; validate identifiers and references; generate or conformance-test TypeScript and Dart models against the same contracts and fixtures; reserve organisation and enterprise-governance extension types without Phase 1 UI. |
| Explicit exclusions and decision dependencies | Hard-coded taxonomy/workflows and vendor-bound core records are excluded by `DEC-007` and `DEC-009`. Organisation, business-unit, legal-hold, DLP, records, and information-barrier end-user capabilities are excluded from Phase 1 under `DEC-002`; only extension points are reserved. |
| Failure or degraded behavior | Dangling IDs, invalid versions, missing required relationships, or unsupported schema versions cannot activate. Unknown reserved types remain inert rather than leaking enterprise behavior into consumer workflows. |
| Product-level acceptance summary | Reference validation rejects invalid configuration; a later schema can add reserved Phase 2 types without redefining Phase 1 identity, workspace, resource, evidence, fact, or audit identities. |

### `FEAT-P1-031` — Public product, trust, and account-entry experience

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-001`, `OUT-P1-007` — a prospective household can understand Doculyra, its trust boundaries, and how to begin without mistaking a development preview or future integration for a completed production service. |
| Release slice | `P1-S1` / cross-slice public entry |
| Linked requirements | `REQ-P1-PLT-001`, `REQ-P1-PLT-003` |
| Primary users | Prospective household owner; prospective family administrator; unauthenticated visitor. |
| Capabilities | Present the approved Doculyra identity; explain product, features, evidence-aware assistance, privacy/security, company and contact intent; provide preview privacy and terms routes; and provide direct create-account and sign-in entry to the governed onboarding/authentication flow. |
| Explicit exclusions and decision dependencies | Public copy cannot claim legal approval, certification, production readiness, real-data eligibility, complete monitoring coverage, active providers, or completed controls without the corresponding evidence. Final operator identity, production legal terms, public domain/DNS, pricing, production support routes, and public launch remain release-gated. |
| Failure or degraded behavior | Public routes remain navigable without authentication and disclose no workspace/customer data. Missing contact or provider configuration is shown as unavailable rather than simulated; route or content failure does not fall through to an authenticated or customer-data surface. |
| Product-level acceptance summary | `AC-P1-PUB-001` and applicable `AC-P1-A11Y-001` evidence pass across public navigation, privacy/terms, account entry, unavailable-provider, synthetic-preview, no-leak, and unsupported-claim cases. |

## 3. `P1-S2` — Understand and retrieve

### `FEAT-P1-008` — Document lifecycle, version state, and household views

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-006` — users can organise, inspect, compare, archive, and restore documents without losing provenance or changing access boundaries. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-DOC-003`, `REQ-P1-DOC-005`, `REQ-P1-DEL-001` |
| Primary users | Household owner; family administrator; authorized adult member. |
| Capabilities | Apply explicit version/supersession/effective states; perform material comparison; archive, trash, restore, and initiate controlled purge; browse by document, subject, property, vehicle, policy, or provider over the same governed resources. |
| Explicit exclusions and decision dependencies | Resource-centric views do not create new access boundaries, and arbitrary shared office-document editing is excluded. Lifecycle behavior is constrained by `DEC-005` and `DEC-008`; the immediate deletion fence, restricted Trash, step-up restore, and exact 30-calendar-day boundary are approved by `DEC-053`, which resolves the document-specific portion of `DEC-039`. |
| Failure or degraded behavior | Invalid or unauthorized state transitions fail without rewriting history. If a material comparison is incomplete, the versions remain available and the uncertainty is shown rather than reporting no change. |
| Product-level acceptance summary | Every view enforces the same resource policy; source versions remain inspectable; invalid transitions are rejected; archive/restore retains provenance; purge cannot occur until its approved conditions are met. |

### `FEAT-P1-009` — Evidence extraction, classification, review, and reprocessing

| Field | Detail |
|---|---|
| Scope | `REQUIRED`; the first enabled schemas depend on `DEC-035`. |
| Outcome | `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-007` — derived document understanding is traceable, reviewable, and replaceable without becoming truth by default. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-ING-005`, `REQ-P1-ING-006`, `REQ-P1-ING-007`, `REQ-P1-ING-008`, `REQ-P1-CRYPTO-003` |
| Primary users | Household owner; family administrator; adult member; workspace service. |
| Capabilities | Perform default preview, extraction/OCR, classification, search preparation, graph preparation, and cited-answer preparation on an authorized customer client; retain page/passage/coordinates or span, processor/model version, time, confidence, and review state; classify against versioned jurisdiction-aware types and schemas; expose uncertainty and manual correction; keep extraction, document review, fact acceptance, fulfilment, action approval, and evidence verification separate; preserve derived-result history on reprocessing. |
| Explicit exclusions and decision dependencies | OCR or model output cannot become approved fact, fulfilment, or action by itself. The initial type/schema profile requires `DEC-035`; clinical content remains outside ordinary flow under `DEC-024` and `DEC-036`; providers remain replaceable under `DEC-009`. |
| Failure or degraded behavior | Low-confidence, unsupported, conflicting, or schema-invalid results enter review or a declared unsupported state. Reprocessing failure leaves earlier derived results and immutable bytes intact; rollback is allowed only where the detailed contract permits. |
| Product-level acceptance summary | Every promoted field and citation resolves to stable evidence; unsupported classification is visible; state separation prevents false fulfilment; reviewers can compare provenance across parser/schema/prompt/model versions. |

### `FEAT-P1-010` — Canonical fact, entity, and conflict resolution

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-002`, `OUT-P1-003` — a household can understand the currently resolved value while preserving every supporting, contradictory, and historical occurrence. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-FCT-001`, `REQ-P1-FCT-002`, `REQ-P1-FCT-003`, `REQ-P1-FCT-004`, `REQ-P1-FCT-005` |
| Primary users | Household owner; family administrator; adult member; workspace service. |
| Capabilities | Separate canonical facts from occurrences; preserve valid/effective and transaction time; identify subjects and household entities independently of display names; record promotion, correction, dispute, and supersession as explicit resolution events; retain explainable conflict states. |
| Explicit exclusions and decision dependencies | Mutable document metadata and AI/OCR output are not canonical truth. The separation and history are constrained by `DEC-004`; consequential resolution requires evidence, explanation, approval, and audit under `DEC-006`; detailed bitemporal behavior requires the PRD's data-model ADR. |
| Failure or degraded behavior | Unresolved or conflicting evidence remains visible as unresolved, resolved, or intentionally tolerated according to policy. The system must not choose a value merely to remove uncertainty, and removal of one occurrence cannot rewrite others. |
| Product-level acceptance summary | Historical belief can be reconstructed by effective and transaction time; competing evidence and resolution rationale remain inspectable; entity renames do not break links; the fact-history portions of `AC-P1-E2E-001` pass. |

### `FEAT-P1-011` — Sensitive evidence and field-level privacy

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-002`, `OUT-P1-005`, `OUT-P1-007` — useful document intelligence can be delivered without exposing protected values or their existence through derivatives. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-FCT-006` |
| Primary users | Authorized household member; restricted subject; workspace service; guest/delegated adviser. |
| Capabilities | Apply field-level authorization and redaction to evidence anchors, views, search, graph, AI context, notifications, logs, and exports; allow an approved minimal action-needed disclosure without exposing the protected value. |
| Explicit exclusions and decision dependencies | Membership or access to a containing document does not automatically reveal every sensitive field. Counts, snippets, facets, edges, scores, and generated summaries cannot bypass policy. The boundary is constrained by `DEC-003` and `DEC-008`. |
| Failure or degraded behavior | If a safe redaction or minimal disclosure cannot be produced, the derivative is suppressed or reported unavailable. Authorization uncertainty fails closed and must not be reframed as insufficient source evidence in a way that leaks existence. |
| Product-level acceptance summary | Restricted values and evidence are absent from every tested derivative; authorized users may receive only the policy-approved action signal; `AC-P1-SEC-001` and the restricted-evidence branch of `AC-P1-RAG-001` pass. |

### `FEAT-P1-012` — Typed, permission-aware dependency graph

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-002`, `OUT-P1-003` — document, fact, entity, and obligation relationships are typed, evidenced, and safe to traverse. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-GPH-001`, `REQ-P1-GPH-002` |
| Primary users | Household owner; family administrator; adult member; guest or delegated adviser where granted; workspace service. |
| Capabilities | Use a versioned node/edge catalogue with permitted endpoints, direction, cardinality, provenance, confidence/review state, validity, and supersession; evaluate current authorization for each resource, field, edge, and derived traversal result. |
| Explicit exclusions and decision dependencies | An untyped generic relationship graph, ingestion-time-only access filtering, and discovery of restricted relationship existence are excluded. Configuration follows `DEC-007`; traversal and provenance follow `DEC-008`; graph storage remains vendor-neutral under `DEC-009`. |
| Failure or degraded behavior | Invalid endpoints or edge types fail validation. Revoked or stale access removes the path within the defined objective; missing edge provenance prevents the edge from being treated as active evidence. |
| Product-level acceptance summary | Every active edge validates and has provenance; a grant change removes direct and cached graph exposure; node/edge semantics remain portable across graph implementations. |

### `FEAT-P1-013` — Permission-aware search, cited Q&A, and comparison

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-002`, `OUT-P1-007` — users can find and compare authorized evidence and receive a cited answer or an honest limitation. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-SRCH-001`, `REQ-P1-SRCH-002`, `REQ-P1-SRCH-003`, `REQ-P1-SRCH-004`, `REQ-P1-SRCH-005` |
| Primary users | Household owner; family administrator; authorized adult member; scoped guest/delegated adviser. |
| Capabilities | Full-text, metadata/filter, semantic or hybrid retrieval over eligible current and historical resources; exact version/page/passage or source-snapshot citations; permission-aware reranking, generation, conversation state, caches, and analytics; material version comparison. |
| Explicit exclusions and decision dependencies | A generic chatbot, uncited material claims, arbitrary web authority, and automatic legal/financial/tax/insurance/medical conclusions are excluded. Current permission and provenance behavior is constrained by `DEC-008`; providers remain replaceable under `DEC-009`. |
| Failure or degraded behavior | Conflicting, stale, incomplete, insufficient, or restricted evidence is stated explicitly. Citation resolution after revocation fails safely; incomplete comparison reports uncertainty; model or retrieval failure cannot be hidden by a fabricated answer. |
| Product-level acceptance summary | Filters and historical versions work inside the access boundary; every material claim navigates to authorized evidence; cross-workspace and follow-up leakage tests pass; `AC-P1-RAG-001` passes. |

### `FEAT-P1-014` — Governed AI capability control plane

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-002`, `OUT-P1-003`, `OUT-P1-004`, `OUT-P1-007` — AI assists within explicit contracts and cannot grant itself authority or conceal failure. |
| Release slice | `P1-S2` |
| Linked requirements | `REQ-P1-AI-001`, `REQ-P1-AI-002`, `REQ-P1-AI-003`, `REQ-P1-AI-004`, `REQ-P1-AI-005`, `REQ-P1-AI-006`, `REQ-P1-AI-007` |
| Primary users | Household owner; family administrator; adult member; guest or delegated adviser where granted; workspace service; product operator or support user. |
| Capabilities | Register versioned capabilities with input/context/tool/output/evidence/confidence/review/fallback/telemetry contracts; authorize retrieval and tools at execution; preserve model/prompt/tool/schema provenance; calibrate confidence per capability; contain embedded instructions; use provider-neutral adapters with policy-aware processing. |
| Explicit exclusions and decision dependencies | Unregistered or unbounded agents, model-granted authority, arbitrary-web authority, invalid structured output reaching users as verified, and provider lock-in are excluded by `DEC-006`, `DEC-008`, and `DEC-009`. Residency-dependent adapters require `DEC-040`. |
| Failure or degraded behavior | Refusal, timeout, invalid schema, provider unavailability, low confidence, conflict, or cost limit produces explicit retry-safe behavior and cannot mutate approved product state or fabricate success. High-impact or policy-selected output routes to review. |
| Product-level acceptance summary | Every enabled capability validates against its contract and evaluation threshold; injection cannot alter authorization, tools, citations, or output schema; `AC-P1-AI-001` passes; enabled adapters pass conformance and portability tests. |

## 4. `P1-S3` — Monitor and close the loop

### `FEAT-P1-015` — Conformed effective-document view

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-002`, `OUT-P1-004` — users can tell which version, amendment, addendum, cancellation, or supersession controls an interpreted obligation while retaining every source version. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-DOC-008` |
| Primary users | Household owner; authorized adult member; delegated reviewer; workspace service. |
| Capabilities | Build a conformed view over preserved source versions; represent amendments, addenda, cancellations, and supersession; identify effective clauses and expose unresolved conflicts for review. |
| Explicit exclusions and decision dependencies | Source versions cannot be overwritten, and the product cannot turn interpretation into automatic legal or insurance advice. The lifecycle is constrained by `DEC-005`; consequential conclusions require `DEC-006`; detailed version/obligation semantics require an approved model contract. |
| Failure or degraded behavior | Ambiguous, missing, or contradictory version relationships produce an incomplete or review-required conformed view rather than silently selecting a controlling clause. |
| Product-level acceptance summary | Effective obligations and answers identify their source clauses and versions; conflicts are visible; reconstruction does not alter any original or derived history. |

### `FEAT-P1-016` — Monitoring strategies and applicable rule subscriptions

| Field | Detail |
|---|---|
| Scope | `REQUIRED`; enabled launch rules depend on `DEC-035`. |
| Outcome | `OUT-P1-003`, `OUT-P1-007` — dates, events, dependencies, versions, and governed-source changes are detected through explicit, replayable strategies. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-MON-001`, `REQ-P1-MON-002` |
| Primary users | Household owner; family administrator; adult member; workspace service; trusted-source connector; product operator or support user. |
| Capabilities | Configure distinct date, periodic, user/life-event, source-change, dependency, and document-version triggers; version rules by jurisdiction, document type, subject/resource applicability, effective period, source, and review requirements; deduplicate and replay triggers. |
| Explicit exclusions and decision dependencies | A fixed expiry-only engine and hard-coded rules are excluded by `DEC-001` and `DEC-007`. The Australia-first core follows `DEC-020`; first public document/rule/source coverage requires `DEC-035`; slice sequencing requires `DEC-030`. |
| Failure or degraded behavior | A rule outside its jurisdiction/effective period or missing mandatory applicability cannot create an applicable recommendation. Duplicate or replayed triggers remain idempotent; unsupported strategies are visibly disabled. |
| Product-level acceptance summary | Each enabled strategy has deterministic trigger, deduplication, state, and replay evidence; non-applicable rules cannot produce misleading action. |

### `FEAT-P1-017` — Governed-source snapshots, coverage, and health

| Field | Detail |
|---|---|
| Scope | `REQUIRED`; initial Australian sources depend on `DEC-035`. |
| Outcome | `OUT-P1-003`, `OUT-P1-007` — external change is backed by reconstructable source evidence, while failures and coverage gaps remain visible. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-MON-003`, `REQ-P1-MON-004`, `REQ-P1-MON-005`, `REQ-P1-MON-007` |
| Primary users | Household owner; family administrator; adult member; trusted-source connector; workspace service; product operator or support user. |
| Capabilities | Govern source authority, jurisdiction, topics, official endpoint, method, coverage, cadence, parser/version, freshness, and ownership; create immutable snapshots or verifiable no-change observations; expose attempts, success, errors, retry, freshness, stale/disabled state, and disclosed coverage gaps. |
| Explicit exclusions and decision dependencies | Arbitrary web content is not authoritative, and complete change-detection coverage is not promised. Source configuration follows `DEC-007` and `DEC-020`; provider binding is excluded by `DEC-009`; the launch registry requires `DEC-035`. |
| Failure or degraded behavior | Parser failure, retrieval error, expired freshness, disabled coverage, or missing governance metadata visibly degrades dependent results. The last successful snapshot cannot be represented as a current successful check. |
| Product-level acceptance summary | Consequential source claims reconstruct from the exact snapshot and parser version; incomplete source metadata cannot activate; coverage and freshness are visible; `AC-P1-MON-001` passes including deterministic replay after repair. |

### `FEAT-P1-018` — Applicability, impact paths, and explainable recommendations

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-003`, `OUT-P1-007` — a change produces a permission-safe, explainable set of affected resources and outcomes rather than an opaque alert. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-GPH-003`, `REQ-P1-GPH-004`, `REQ-P1-GPH-005`, `REQ-P1-MON-006`, `REQ-P1-ACT-001`, `REQ-P1-ACT-002`, `REQ-P1-ACT-003`, `REQ-P1-ACT-004` |
| Primary users | Household owner; family administrator; authorized adult member; workspace service. |
| Capabilities | Evaluate applicability before impact; idempotently traverse eligible dependencies; retain typed paths; classify automatic technical update, user action, external notification, review, or no action; keep severity, urgency, confidence, applicability, evidence strength, and source health separate; report path truncation and uncertainty. |
| Explicit exclusions and decision dependencies | Restricted names, counts, snippets, values, subjects, and relationship existence cannot leak through paths or explanations. Complete coverage, uncited consequential claims, and advice are excluded. Evidence/approval follows `DEC-006`; current permissions and exact provenance follow `DEC-008`. |
| Failure or degraded behavior | Cycles, depth/fan-out limits, stale edges, incomplete data, replay, or revoked grants terminate deterministically and disclose uncertainty without claiming completeness. A recommendation missing applicability, evidence, or an inspectable authorized path cannot become actionable. |
| Product-level acceptance summary | Replayed changes do not duplicate or lose impacts; classifications remain separate from confidence/severity; authorized users can inspect why each result is affected; stale, cyclic, revoked, and no-leak variants of `AC-P1-E2E-001` pass. |

### `FEAT-P1-019` — Approval-bound action and evidence closure

| Field | Detail |
|---|---|
| Scope | `REQUIRED`; particular external connector actions may be `CONDITIONAL` on `DEC-031`. |
| Outcome | `OUT-P1-004`, `OUT-P1-007` — consequential work moves from reviewed evidence to a bounded action and closes only with configured replacement or fulfilment evidence. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-ACT-005`, `REQ-P1-ACT-006`, `REQ-P1-ACT-007`, `REQ-P1-ACT-008` |
| Primary users | Household owner; family administrator; adult member; guest or delegated adviser where explicitly granted; workspace service. |
| Capabilities | Policy-evaluate consequential fact/document/rule/bulk/external actions; obtain human approval bound to inputs, effect, actor, policy, and expiry; create a new version, controlled task/checklist/draft, or provider-neutral command; record result, failure, retry, reversal, and closure evidence. |
| Explicit exclusions and decision dependencies | Silent changes, reusable blanket model approval, changed-input reuse, and automatic renewal based on time, submission, or file presence are excluded by `DEC-006`. Current action authorization follows `DEC-008`; provider-neutrality follows `DEC-009`; connector scope requires `DEC-031`. |
| Failure or degraded behavior | Stale/expired approval, changed inputs, revoked access, policy failure, external timeout, or partial success fails closed or remains visibly incomplete and recoverable. Closure remains awaiting evidence until the configured verification state is met. |
| Product-level acceptance summary | Bypass and changed-input tests fail; approvals are inspectably bound; external partial success does not mark completion; replacement evidence is required; approval/action/closure branches of `AC-P1-E2E-001` and `AC-P1-AI-001` pass. |

### `FEAT-P1-020` — Expected-document and document-health findings

| Field | Detail |
|---|---|
| Scope | Core findings are `REQUIRED`; aggregate scoring is separated into conditional `FEAT-P1-028`. |
| Outcome | `OUT-P1-001`, `OUT-P1-003`, `OUT-P1-004` — households can understand potentially missing, stale, expired, superseded, or contradictory evidence and choose a governed response. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-HLT-001`, `REQ-P1-HLT-002`, `REQ-P1-HLT-003`, `REQ-P1-HLT-005` |
| Primary users | Household owner; family administrator; authorized adult member; workspace service. |
| Capabilities | Use versioned requirement profiles with context, jurisdiction, accepted alternatives, waivers/exceptions, validity, and evidence criteria; detect document-health findings; support add evidence, alternative, not applicable with reason, review/waiver where supported, dismiss, and remind later; verify fulfilment separately. |
| Explicit exclusions and decision dependencies | A file or extracted field is not fulfilment. Legal-compliance scoring, guaranteed completeness, and unsupported legal/tax/insurance conclusions are excluded. Rule/configuration behavior follows `DEC-007` and `DEC-020`; the launch profiles require `DEC-035`. |
| Failure or degraded behavior | A suggestion without an approved governing rule is labelled non-authoritative guidance. Uncertainty and evidence remain visible; reversible outcomes retain audit history; the service does not force satisfaction to produce a healthier state. |
| Product-level acceptance summary | Every suggestion explains why it may apply; alternatives and outcomes remain distinct; findings cite rule/evidence and expose confidence and resolution paths; evidence verification—not file presence—controls fulfilment. |

### `FEAT-P1-021` — Tasks, reminders, and in-app notification flow

| Field | Detail |
|---|---|
| Scope | Tasks/reminders are `REQUIRED`; in-app requirement and other channel sequencing depend on `DEC-037`. |
| Outcome | `OUT-P1-004`, `OUT-P1-005`, `OUT-P1-007` — recommendations and obligations become owned, auditable work without privacy-unsafe or duplicate messaging. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-NTF-001`, `REQ-P1-NTF-002`, `REQ-P1-NTF-003` |
| Primary users | Household owner; family administrator; assigned adult member; scoped guest/delegated adviser; workspace service. |
| Capabilities | Create causally linked tasks with owner, status, due date, source, evidence requirement, and history; acknowledge, snooze, reassign, complete, reopen, or dismiss according to workflow; deliver required in-app notifications through a channel-neutral contract. |
| Explicit exclusions and decision dependencies | In-app delivery is required; email/SMS adapters may be implemented but live delivery remains gated by `DEC-037`/`045`. Unapproved channels cannot receive sensitive content. Consequential notification follows `DEC-006`; workflows are configured under `DEC-007`; sequencing follows approved `DEC-030`. |
| Failure or degraded behavior | Invalid actors and state transitions fail; delivery retries remain idempotent; channel failure leaves task state available and truthfully reports notification status; completion does not discard required evidence. |
| Product-level acceptance summary | Task causality and history are preserved; authorized transitions behave deterministically; duplicate delivery does not duplicate tasks; channel content obeys the resource privacy policy. |

### `FEAT-P1-022` — Consequential configuration publication and Australia pack

| Field | Detail |
|---|---|
| Scope | Publication controls and Australia pack are `REQUIRED`; launch contents depend on `DEC-035`. |
| Outcome | `OUT-P1-003`, `OUT-P1-007` — jurisdiction-aware rules and sources are governed, effective-dated, reviewable, and replayable rather than deployed as opaque code changes. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-CFG-002`, `REQ-P1-CFG-003`, `REQ-P1-CFG-004` |
| Primary users | Workspace service; trusted-source connector; product operator or support user. |
| Capabilities | Declare jurisdiction, applicability, evidence, effective dates, confidence/review rules, owner, version, and history; validate and approve publication; audit, roll back or forward-repair configuration; assess impact and replay; load an Australia pack through jurisdiction-neutral contracts. |
| Explicit exclusions and decision dependencies | Core identifiers and code cannot embed Australian-only assumptions. Australia-first is constrained by `DEC-020`; configuration-driven behavior by `DEC-007`; vendors remain abstract under `DEC-009`; initial types, schemas, profiles, and sources require `DEC-035`. |
| Failure or degraded behavior | Incomplete, expired, invalid, or unapproved consequential configuration cannot activate. Failed publication leaves the prior active version and failure visible; repair and replay cannot rewrite prior findings or source history. |
| Product-level acceptance summary | A rule change identifies affected active findings and replays deterministically; invalid configuration is rejected; a second synthetic jurisdiction pack loads without code-level Australian assumptions. |

### `FEAT-P1-023` — Privacy-safe impact-exists routing

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-003`, `OUT-P1-005` — action can reach an authorized collaborator without revealing the restricted evidence that caused it. |
| Release slice | `P1-S3` |
| Linked requirements | `REQ-P1-SHR-005` |
| Primary users | Restricted subject; household owner or family administrator receiving a permitted action; adult member; workspace service. |
| Capabilities | Evaluate an impact-exists disclosure policy; route a permitted action or minimal explanation to an authorized person; separate task authority from evidence visibility; audit the disclosure decision. |
| Explicit exclusions and decision dependencies | The route cannot reveal the protected subject, value, document, snippet, edge, or count unless expressly permitted. Family administration is not evidence access under `DEC-003` and `DEC-023`; authorization and provenance follow `DEC-008`. |
| Failure or degraded behavior | If no safe minimal disclosure exists, routing is suppressed or escalated to an authorized reviewer without exposing the underlying cause. Delivery failure does not broaden the audience or weaken the policy. |
| Product-level acceptance summary | A permitted collaborator can act on the approved signal while negative tests show that restricted evidence and relationship existence cannot be inferred; the no-leak branch of `AC-P1-E2E-001` passes. |

## 5. `P1-S4` — Family launch and portability

### `FEAT-P1-024` — Scoped family and delegated-adviser sharing

| Field | Detail |
|---|---|
| Scope | `REQUIRED` |
| Outcome | `OUT-P1-005` — households can collaborate and obtain limited advice without converting membership or adviser status into unrestricted browse or action authority. |
| Release slice | `P1-S4` |
| Linked requirements | `REQ-P1-WS-006`, `REQ-P1-SHR-001`, `REQ-P1-SHR-002`, `REQ-P1-SHR-003`, `REQ-P1-CRYPTO-002` |
| Primary users | Household owner; family administrator; adult member; guest/delegated adviser. |
| Capabilities | Issue explicit purpose-, resource-, field-, action-, and time-scoped grants; create short-lived non-indexable guest links; revoke independently; separate family membership administration from content, consent, fact resolution, approval, export, and deletion authority. |
| Explicit exclusions and decision dependencies | A separate adviser tenancy/product, general household enumeration, blanket `FAMILY_ADMIN` content access, onward sharing, and default bulk export are excluded by `DEC-023` and `DEC-003`. Grant enforcement follows `DEC-008`; slice sequencing requires `DEC-030`. |
| Failure or degraded behavior | Expired, revoked, guessed, reused, rate-limited, or wrong-purpose access fails safely and removes retrieval, graph, answer, action, notification, and export exposure. Revocation cannot depend solely on link expiry or cached permission state. |
| Product-level acceptance summary | Grant creation displays effective access; guest links expose no unrelated context; administrator and adviser negative tests pass; `AC-P1-SEC-001` remains true before and after revocation. |

### `FEAT-P1-025` — Managed-dependant transition and family continuity

| Field | Detail |
|---|---|
| Scope | History preservation, ordinary scoped grants, and curated continuity/export are `REQUIRED`; automated release is `EXCLUDED` from Phase 1. |
| Outcome | `OUT-P1-005`, `OUT-P1-006` — subject history can survive a later access transition, and continuity can be prepared without unsafe automatic disclosure. |
| Release slice | `P1-S4` |
| Linked requirements | `REQ-P1-WS-007`, `REQ-P1-SHR-004` |
| Primary users | Managed dependant; adult member; household owner; family administrator; guest or delegated adviser where explicitly granted. |
| Capabilities | Preserve evidence, fact, subject, and provenance identity through a later access transition; prepare curated continuity/export packs and time-aware grants; reserve a governed release workflow if later approved. |
| Explicit exclusions and decision dependencies | `DEC-032` excludes automated incapacity, emergency, and after-death release from Phase 1. Transition rules still require an approved consent/authority design and cannot silently reassign history; ordinary grants and exports cannot be repurposed as automatic release. |
| Failure or degraded behavior | Without an approved transition or release policy, history remains preserved but access does not transfer automatically. Ambiguous trigger evidence, consent, or challenge state blocks release and leaves an auditable pending/denied outcome. |
| Product-level acceptance summary | A tested transition fence does not recreate or silently reassign evidence/facts/audit; curated packs obey current grants; negative evidence proves no event or configuration releases restricted content automatically. |

### `FEAT-P1-026` — Provider-neutral connector ingestion and processing consent

| Field | Detail |
|---|---|
| Scope | Adapter implementation is `REQUIRED / RELEASE GATED`; live provider activation is conditional on exact consent, credentials, route eligibility, and conformance evidence. |
| Outcome | `OUT-P1-001`, `OUT-P1-006`, `OUT-P1-007` — approved connectors can import evidence while preserving source identity, consent, permissions, versions, deletion, and revocation semantics. |
| Release slice | `P1-S4`; upload, camera, and manual routes remain earlier required capture paths. |
| Linked requirements | `REQ-P1-ING-009`, `REQ-P1-TRUST-009` |
| Primary users | Household owner; family administrator; adult member; workspace service; trusted-source connector; product operator or support user. |
| Capabilities | Record purpose-limited consent; preserve external item/version and source identity; preserve external permissions where applicable; implement deletion/disconnect semantics; revoke future retrieval and processing; enforce AI/OCR/analytics/support/cross-border processing policy through replaceable adapters. |
| Explicit exclusions and decision dependencies | `DEC-045` authorizes consent-driven provider-neutral adapter implementation and `DEC-055` authorizes configuration preparation. No exact provider may operate until its credentials, redirect origins, minimal scopes, consent, token protection, revocation/deletion, route eligibility, audit, and conformance gates pass. Provider lock-in remains excluded by `DEC-009`. |
| Failure or degraded behavior | Disconnect or consent withdrawal stops future retrieval. Adapter timeout, partial import, permission drift, or provider deletion remains visible and retry-safe; already-ingested evidence follows the approved retention policy rather than being silently retained or destroyed. |
| Product-level acceptance summary | Provider conformance tests preserve identity, permission, consent, revocation, and deletion semantics; a disconnected connector cannot continue retrieval; future processing changes when consent is withdrawn. |

### `FEAT-P1-027` — Notification preference, escalation, and stale-source policy

| Field | Detail |
|---|---|
| Scope | `CONDITIONAL` on `DEC-037` for channel commitments beyond the core task model. |
| Outcome | `OUT-P1-004`, `OUT-P1-005`, `OUT-P1-007` — users receive useful, deduplicated attention signals that respect preferences, privacy, and source health. |
| Release slice | `P1-S4` |
| Linked requirements | `REQ-P1-NTF-004` |
| Primary users | Household owner; family administrator; assigned adult member; scoped guest/delegated adviser. |
| Capabilities | Configure preferences and quiet periods; deduplicate, escalate, acknowledge, and degrade or suppress notifications based on stale-source policy; keep notification state consistent across retries and supported channels. |
| Explicit exclusions and decision dependencies | External delivery is permitted only after the `DEC-037`/`045` consent, configuration, minimization, and conformance gates pass. Notifications cannot reveal sensitive content on an unapproved device/channel or bypass current grants under `DEC-008`. |
| Failure or degraded behavior | Duplicate triggers do not spam; channel failure does not falsely mark delivery; stale or failed sources suppress or visibly qualify dependent messages; urgent handling still obeys approved privacy exceptions. |
| Product-level acceptance summary | Preference, quiet-period, deduplication, escalation, acknowledgement, and stale-source cases pass without unauthorized content exposure or divergence between task and notification state. |

### `FEAT-P1-028` — Explainable item-level readiness findings with aggregate scoring absent

| Field | Detail |
|---|---|
| Scope | `REQUIRED ABSENCE / SAFETY BOUNDARY` |
| Outcome | `OUT-P1-001`, `OUT-P1-007` — users can inspect authorized item-level findings and limitations without an aggregate or hidden score being mistaken for legal compliance, completeness, risk, or a guarantee. |
| Release slice | `P1-S4` |
| Linked requirements | `REQ-P1-HLT-004` |
| Primary users | Household owner; family administrator; authorized adult member. |
| Capabilities | Present decomposable, permission-aware item findings with their evidence, applicability, freshness, uncertainty, status, limitations, and available governed response. Preserve explicit absence of aggregate, ranking, traffic-light, compliance, completeness, legal-risk, or safety scoring. |
| Explicit exclusions and decision dependencies | `DEC-034` excludes aggregate and hidden scoring in Phase 1. Hidden restricted items cannot be inferred through totals, deltas, ordering, denominators, badges, colours, or copy. A future aggregate would require a superseding Product Authority decision and complete UX, privacy, metric, and evaluation contracts. |
| Failure or degraded behavior | If an item finding cannot be explained or disclosed safely, it is suppressed or shown as unavailable/limited according to policy; the product does not substitute an opaque aggregate or last-known score. |
| Product-level acceptance summary | Users can inspect every permitted item finding and limitation; access changes leak no hidden item existence; negative tests prove no aggregate or hidden score is calculated, displayed, persisted, inferred, or used for ordering. |

### `FEAT-P1-029` — Complete portability export and controlled deletion

| Field | Detail |
|---|---|
| Scope | Export and deletion capability and their approved envelope/lifecycle are `REQUIRED`; production execution remains evidence- and release-gated. |
| Outcome | `OUT-P1-006`, `OUT-P1-007` — authorized users can leave with documented usable data and request deletion without hidden active derivatives or misleading timing. |
| Release slice | `P1-S4` |
| Linked requirements | `REQ-P1-TRUST-006`, `REQ-P1-TRUST-007`, `REQ-P1-DEL-001`, `REQ-P1-DEL-002` |
| Primary users | Household owner; family administrator; adult member; managed dependant subject where policy permits; workspace service; product operator or support user. |
| Capabilities | Produce access-controlled, resumable, checksummed, machine-readable export manifests; govern archive, trash, account deletion, resource purge, retention exceptions, index/cache/connector removal, backup expiry, and minimized retained audit as separate states. |
| Explicit exclusions and decision dependencies | `DEC-033` approves complete authorized originals-plus-structured-data portability subject to third-party rights. Document Trash, restoration, purge coordination, key-envelope destruction, anti-resurrection controls, and content-minimized deletion evidence are approved by `DEC-053`; account deletion and lawful retention exceptions remain under the broader `DEC-039` governance boundary. Restore/support cannot bypass deletion, and deletion cannot falsely promise immediate backup erasure. |
| Failure or degraded behavior | Interrupted export is resumable and reports completeness; deletion remains in a truthful governed state until each objective is met; failed derivative removal is visible and recoverable; retained audit is minimized rather than silently destroyed or left content-rich. |
| Product-level acceptance summary | Export manifests are complete against the approved envelope and verify by checksum; purge covers active stores and derivatives; backup timing is disclosed; `AC-P1-DEL-001` passes without restore or support bypass. |

### `FEAT-P1-030` — Australian residency option and secure account recovery

| Field | Detail |
|---|---|
| Scope | Residency option is `REQUIRED` by approved decision; detailed residency and recovery behavior are `CONDITIONAL`. |
| Outcome | `OUT-P1-001`, `OUT-P1-006`, `OUT-P1-007` — the Australian residency option has verifiable processing boundaries, and recovery cannot become a weaker route to household authority or content. |
| Release slice | `P1-S4` |
| Linked requirements | `REQ-P1-TRUST-005`, `REQ-P1-TRUST-008`, `REQ-P1-OPS-001` |
| Primary users | Household owner; family administrator; adult member; product operator or support user; workspace service. |
| Capabilities | Define isolated Azure `dev`, `stage`, and future `prod` stacks in Bicep; apply an approved residency matrix to originals, records, indexes, backups, logs, analytics, support, AI/OCR, and disaster recovery; test placement and restore; enforce the approved absence of recovery/ownership-transfer success routes. A richer recovery capability is a later governed extension point, not Phase 1 behavior. |
| Explicit exclusions and decision dependencies | Azure and the Australia East production realm are approved by `DEC-049`; dev/stage are synthetic-only in the current subscription and prod remains unprovisioned pending a separate subscription. Processor/data-class coverage and cross-border exceptions require `DEC-040`. Approved `DEC-038` keeps recovery and ownership transfer unavailable; a future assurance/support process requires a later governed decision. Provider-neutral domain/adaptor boundaries remain required by `DEC-009`, and support has no standing raw-content access. |
| Failure or degraded behavior | Unsupported or non-compliant processing is blocked or disclosed before approved consent. Recovery cannot disclose content or transfer authority when evidence, challenge, delay, or policy is unresolved; restore cannot place data outside the approved matrix. |
| Product-level acceptance summary | Automated placement and restore match the approved matrix; cross-border exceptions are consented and recorded where permitted; recovery and support cannot bypass MFA, encryption, workspace ownership, private-resource, or delegated-access policy. |

## 6. Research-gap adoption, deferral, and decision map

Every disposition below is inherited from the approved `PROD-PRD-001` §9. “Adopt” means the product requirement is in the build baseline; it does not establish implementation completion, provider activation, or release evidence.

| Gap | Catalogue treatment | Features and requirements | Remaining build/release boundary |
|---|---|---|---|
| `GAP-001` | **Adopt** expected-document profiles, alternatives, waiver/exception, fulfilment, and evidence states. | `FEAT-P1-020`; `REQ-P1-HLT-001`, `002`, `005` | Requirement-profile/reference-data contracts and execution evidence remain required. |
| `GAP-002` | **Adopt** bitemporal fact/rule resolution and immutable occurrences/snapshots. | `FEAT-P1-010`, `FEAT-P1-016`, `FEAT-P1-017`; `REQ-P1-FCT-001`–`004`, `REQ-P1-MON-002`, `004` | Accepted data-model contracts and execution evidence remain required. |
| `GAP-003` | **Adopt** field- and passage-level provenance with processor/model/schema version and review state. | `FEAT-P1-009`, `FEAT-P1-013`, `FEAT-P1-014`; `REQ-P1-ING-005`, `REQ-P1-SRCH-002`, `REQ-P1-AI-003` | Evidence/output schemas and execution evidence remain required. |
| `GAP-004` | **Adopt** distinct extraction, fact, fulfilment, approval, and verification states. | `FEAT-P1-009`, `FEAT-P1-019`, `FEAT-P1-020`; `REQ-P1-ING-007`, `REQ-P1-HLT-005`, `REQ-P1-ACT-005`–`008` | Workflow-state contracts and execution evidence remain required. |
| `GAP-005` | **Adopt** conformed effective-document views and amendment-aware closure. | `FEAT-P1-015`, `FEAT-P1-019`; `REQ-P1-DOC-008`, `REQ-P1-ACT-008` | Version/obligation data contracts and execution evidence remain required. |
| `GAP-006` | **Adopt** source coverage, freshness, retrieval/parser health, stale-state behavior, and replay. | `FEAT-P1-017`; `REQ-P1-MON-003`–`007` | `DEC-035` permits synthetic development sources; the reviewed public source pack and source-monitor execution evidence remain release-gated. |
| `GAP-007` | **Split: adopt and explicitly exclude.** Adopt scoped grants and complete portability; automated emergency/incapacity/after-death release is excluded from Phase 1. | `FEAT-P1-024`, `FEAT-P1-025`, `FEAT-P1-029`; `REQ-P1-SHR-001`–`004`, `REQ-P1-TRUST-006` | `DEC-033` approves the complete authorized export envelope. `DEC-032` requires tested absence of automated release; ordinary grants and curated exports remain separate. |
| `GAP-008` | **Adopt item-level findings; exclude aggregate scoring.** | `FEAT-P1-020`, `FEAT-P1-028`; `REQ-P1-HLT-001`–`005` | `DEC-034` requires explainable item-level findings and prohibits aggregate/hidden readiness, compliance, risk, traffic-light, or ranking scores in Phase 1. |
| `GAP-009` | **Adopt** policy/evaluation gates for consequential and bulk AI-assisted actions. | `FEAT-P1-014`, `FEAT-P1-019`; `REQ-P1-AI-001`–`006`, `REQ-P1-ACT-005`–`007` | AI capability, policy, approval, authorization, audit, and evaluation contracts/evidence remain required. |
| `GAP-010` | **Defer end-user capability; reserve core extension points.** | `FEAT-P1-007`; `REQ-P1-CFG-005` | Organisation, records, hold, information-barrier, DLP, and enterprise-governance workflows/UI are deferred to Phase 2 decisions and ADRs. Phase 1 preserves schema extension points only. |

## 7. Requirement coverage index

This index is a completeness check, not a substitute for feature-level links.

| Requirement group | Covered by features |
|---|---|
| `REQ-P1-WS-001`–`007` | `FEAT-P1-001`, `002`, `024`, `025` |
| `REQ-P1-DOC-001`–`008` | `FEAT-P1-003`–`005`, `008`, `015` |
| `REQ-P1-ING-001`–`009` | `FEAT-P1-004`, `005`, `009`, `026` |
| `REQ-P1-FCT-001`–`006` | `FEAT-P1-010`, `011` |
| `REQ-P1-GPH-001`–`005` | `FEAT-P1-012`, `018` |
| `REQ-P1-SRCH-001`–`005` | `FEAT-P1-013` |
| `REQ-P1-MON-001`–`007` | `FEAT-P1-016`–`018` |
| `REQ-P1-HLT-001`–`005` | `FEAT-P1-020`, `028` |
| `REQ-P1-ACT-001`–`008` | `FEAT-P1-018`, `019` |
| `REQ-P1-NTF-001`–`004` | `FEAT-P1-021`, `027` |
| `REQ-P1-SHR-001`–`005` | `FEAT-P1-023`–`025` |
| `REQ-P1-AI-001`–`007` | `FEAT-P1-014` |
| `REQ-P1-TRUST-001`–`009` | `FEAT-P1-002`, `006`, `026`, `029`, `030` |
| `REQ-P1-CFG-001`–`005` | `FEAT-P1-007`, `022` |
| `REQ-P1-PLT-001`–`003` | `FEAT-P1-003`, `004`, `007`, `031` |

## 8. Catalogue-wide exclusions and acceptance boundary

The following PRD exclusions apply to every feature even where not repeated: clinical and treatment records; organisation workspaces and enterprise administration; automatic professional advice; silent consequential changes; unbounded autonomous agents; arbitrary web content as authority; uncited consequential claims; native desktop applications in Phase 1; guaranteed monitoring completeness; provider lock-in; an adviser-specific standalone product; and arbitrary shared office-document editing. Dedicated Flutter iOS/Android applications remain required by `DEC-052`.

Every user-facing critical flow must also satisfy `AC-P1-A11Y-001`. Every feature is subject to current authorization, additive history, applicability-before-recommendation, bound approval, visible failure, no derivative leakage, no automatic renewal, governed authority, portability/deletion design, and the launch gates in `PROD-PRD-001`. Detailed acceptance criteria and objective thresholds belong in the use-case catalogue, NFRs, AI evaluations, test strategy, and backlog; this catalogue does not weaken or replace them.
