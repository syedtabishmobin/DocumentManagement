# Phase 1 Specification Readiness

| Field | Value |
|---|---|
| Document ID | `GOV-READY-001` |
| Status | Active gate record |
| Current verdict | **BUILD BASELINE APPROVED — DEFINITION OF READY SATISFIED — NOT PRODUCT OR PRODUCTION COMPLETE** |
| Updated | 30 August 2026 |
| Governing contract | [`CODEX.md`](CODEX.md#specification-readiness-gate) |

## 1. Purpose

This file makes the repository readiness gate inspectable. It records whether the specification pack is safe and sufficiently complete to authorize application implementation. It does not lower the gate in `CODEX.md`, approve a draft, or replace product-owner decisions.

A file's existence is not evidence that its contract is approved, complete, internally consistent, traceable, or tested. A criterion moves to `SATISFIED` only when the linked objective evidence exists and no higher-authority conflict remains.

## 2. Current verdict

The product owner explicitly approved the Phase 1 PRD, resolved `DEC-030`–`040` for safe local behavior, and authorized the complete personal/family build in `DEC-041`. `DEC-049`–`055` select Azure/Bicep, two-layer customer-controlled encryption, React web plus Flutter mobile, 30-day document Trash, and complete synthetic dev/stage implementation and deployment.

Approved baseline `DOCULYRA-BUILD-P1-2026.08.30.1` defines the complete hierarchy and Definition of Ready, including approved `DEC-P1-056`. Exact-candidate independent review and protected CI passed. Attributed story Issues may enter dependency order using synthetic data only after this baseline work merges and Product Authority separately starts the queue; external providers/channels, production provisioning, public launch, store publication and real personal documents remain separately gated.

## 3. Gate criteria

| Readiness ID | Criterion | Current state | Required evidence |
|---|---|---|---|
| `RDY-P1-001` | The Phase 1 PRD is approved or explicitly marked as an approved implementation baseline. | `SATISFIED` | `DEC-041` approves the PRD baseline; governed reconciliation records current `PROD-PRD-001` version `0.3`. |
| `RDY-P1-002` | High-impact product and architecture decisions are approved or safely deferred behind documented abstractions. | `SATISFIED` | `DEC-030`–`055` and `DEC-P1-056` define local/dev behavior, Azure/client/encryption/deletion/transition choices, and production/provider fences; applicable ADRs are accepted or superseded. |
| `RDY-P1-003` | Domain/data, tenancy, authorization, security, privacy, deletion, audit, and residency models are complete and mutually consistent. | `SATISFIED` | Reconciled architecture/security/data contracts, accepted ADRs, `DEC-P1-056`, exact story applicability and mapped negative tests form the build contract; runtime/release proof remains story evidence. |
| `RDY-P1-004` | Document-intelligence, monitoring, trusted-source, evidence, fact, graph, impact, health, and version contracts exist. | `SATISFIED` | Normative specifications, schemas/data, failure/replay expectations, story ownership and planned tests validate. |
| `RDY-P1-005` | AI capability, RAG, structured-output, prompt/tool, guardrail, and evaluation contracts exist. | `SATISFIED` | Provider-neutral/device-local contracts and planned evaluations are baselined; numeric thresholds and executed release evidence remain explicit delivery gates. |
| `RDY-P1-006` | API, event, async-job, upload/artifact, connector, export, deletion, and action contracts exist and validate. | `SATISFIED` | Existing contracts and named story-owned gaps/intentional absences are sufficient for dependency-aware implementation; compatibility/conformance results remain completion evidence. |
| `RDY-P1-007` | Critical responsive UX flows, states, screens, design system, and accessibility behavior are specified. | `SATISFIED` | Linked IA, 31 flows, 47 screen groups, design/accessibility contracts and platform boundaries are baselined; user/release conformance remains story evidence. |
| `RDY-P1-008` | Engineering and operational delivery contracts include measurable NFRs, environments, migrations, CI/CD, deployment, recovery, and observability. | `SATISFIED` | Provisional measurement definitions, environments, migration/repair expectations, CI, observability and release gates are explicit; production evidence is not claimed. |
| `RDY-P1-009` | Every implementation epic has stable traceability and testable acceptance criteria. | `SATISFIED` | Twelve epics, 31 features and 49 stories link 101 requirements, 20 use cases, 98 story ACs and 104 exact tests; all remain planned, not complete. |
| `RDY-P1-010` | Initial reference data and all required test/evaluation strategies, fixtures, and quality gates exist and pass. | `SATISFIED` | Twelve DRAFT/disabled catalogues and deterministic synthetic fixtures validate; test/evaluation execution remains story/release evidence and does not weaken DoR. |
| `RDY-P1-011` | No open decision makes the proposed implementation unsafe or substantially disposable. | `SATISFIED` | `DEC-031`–`040` and `DEC-P1-056` close local/transition behavior and explicitly deny unsafe or unproved activation; provider-neutral extension points preserve later change. |
| `RDY-P1-012` | The complete repository is coherent, reviewable, and protected against drift. | `SATISFIED` | Static validators, exact-candidate independent baseline review, negative mutation checks and protected CI pass; controlled material-change versioning is required. |

Allowed states are `MISSING`, `IN PROGRESS`, `BLOCKED`, `SATISFIED`, and `NOT APPLICABLE` with an approved rationale. `IN PROGRESS` never opens the implementation gate.

## 4. Specification-pack status

| Area | Required baseline | Current evidence | State |
|---|---|---|---|
| Governance/context | Working agreement, source hierarchy, preserved handover, decisions, research provenance, readiness record | `AGENTS.md`, `CODEX.md`, `docs/00-context/`, this file | `IN PROGRESS` — implementation authority is recorded; specialist review and production release evidence remain |
| Product | Vision, PRD, feature catalogue, use cases, personas/journeys, scope/metrics, research | [`docs/01-product/README.md`](docs/01-product/README.md) | `IN PROGRESS` — approved implementation baseline; catalogue-only detail and release evidence remain |
| Architecture | Solution, domain, data, workspace/family, NFRs, ADRs | [`docs/02-architecture/README.md`](docs/02-architecture/README.md) | `IN PROGRESS` — architecture baseline and platform/cloud/client choices approved; numeric targets and runtime evidence remain |
| Document intelligence | Taxonomy, ingestion, extraction/evidence, facts/entities, graph, monitoring, impact, sources, health, versioning | [`docs/03-document-intelligence/README.md`](docs/03-document-intelligence/README.md) | `IN PROGRESS` — draft pack complete; approvals and executed conformance evidence remain |
| AI | Capability architecture, RAG, outputs, prompts/tools, guardrails, evaluations | [`docs/04-ai/README.md`](docs/04-ai/README.md) | `IN PROGRESS` — draft pack complete; thresholds, approvals, and evaluation evidence remain |
| API/integration | API standards, OpenAPI, event catalogue/schemas, connector contracts | [`docs/05-api/README.md`](docs/05-api/README.md) | `IN PROGRESS` — draft contracts validate; approval and executed contract/conformance evidence remain |
| Security/privacy | Architecture, authorization, privacy/governance, audit/provenance, threat model | [`docs/06-security/README.md`](docs/06-security/README.md) | `IN PROGRESS` — draft pack complete; decisions, review, and executed security/privacy evidence remain |
| UX | Information architecture, flows, screens/states, design system, accessibility | [`docs/07-ux/README.md`](docs/07-ux/README.md) | `IN PROGRESS` — draft pack complete; target matrix and research/conformance evidence remain |
| Engineering | Stack/ADRs, repository structure, coding, errors/resilience, local development, testing standards | [`docs/08-engineering/README.md`](docs/08-engineering/README.md) | `IN PROGRESS` — React/TypeScript, Flutter, Azure, and IaC choices approved; full implementation and evidence remain |
| Operations | Environments, CI/CD, IaC, secrets, deployment/repair, backup/DR, observability | [`docs/09-devops/README.md`](docs/09-devops/README.md) | `IN PROGRESS` — Azure dev foundations and provider registrations exist; adapters, numeric targets, production controls, and operational evidence remain |
| Backlog/traceability | Epics, features, stories, acceptance, dependencies, release slices, matrix | [`docs/10-backlog/README.md`](docs/10-backlog/README.md) | `IN REVIEW` — 12 epics/31 features/49 stories/98 ACs/104 tests mapped; each story becomes READY only through an attributed Issue after predecessor and DoR checks |
| Reference data | Versioned schemas plus document types, rules, jurisdictions, sources, roles, permissions, statuses/severities | [`docs/11-reference-data/README.md`](docs/11-reference-data/README.md) | `IN PROGRESS` — draft synthetic seed validates; all runtime entries remain disabled and launch pack unresolved |
| Testing/evaluation | Test strategy, AI evaluation, security, integration/E2E, performance/resilience, fixtures/evidence | [`docs/12-testing/README.md`](docs/12-testing/README.md) | `IN PROGRESS` — draft cases and deterministic fixtures exist; execution evidence is `NOT_RUN`/insufficient |
| Repository validation | ID/link integrity, checksums, schemas, semantics, traceability, fixture privacy | [`scripts/README.md`](scripts/README.md) | `IN PROGRESS` — four static validators pass; formal review and executed quality evidence remain |

The evidence-based comparison is maintained in [`BLG-STATUS-001`](docs/10-backlog/05-personal-family-implementation-status.md). As assessed on 30 August 2026, 29 stories have partial preview evidence, 18 are not implemented, 2 are intentionally unavailable safety boundaries, and 0 meet the complete story exit gate.

## 5. Material decisions resolved for local implementation

| Decision | State | Readiness effect |
|---|---|---|
| `DEC-030` | `APPROVED` | Four slices are continuous engineering checkpoints within the full Phase 1 build. |
| `DEC-031` | `APPROVED` | Local upload/capture/manual routes enabled; live external connectors disabled. |
| `DEC-032` | `APPROVED` | Automated emergency/incapacity/after-death release excluded from Phase 1. |
| `DEC-033` | `APPROVED` | Complete authorized portability envelope is a Phase 1 requirement. |
| `DEC-034` | `APPROVED` | Item-level explainable findings only; aggregate scoring prohibited. |
| `DEC-035` | `APPROVED` | Synthetic governed Australian-first local package; public coverage package remains a production gate. |
| `DEC-036` | `APPROVED` | Suspected clinical records enter isolated `POLICY_HOLD`. |
| `DEC-037` | `APPROVED` | In-app notifications enabled; external channels disabled. |
| `DEC-038` | `APPROVED` | Recovery and ownership transfer absent from the local profile and separately gated for production. |
| `DEC-039` | `APPROVED` | Immediate local fence/purge, no production backup, content-free audit tombstone. |
| `DEC-040` | `APPROVED` | Synthetic local-only processing; production processors and placement separately gated. |
| `DEC-P1-056` | `APPROVED` | Explicit revisioned managed-dependant transition attempts fail closed; richer independent transfer/delegation is later governed scope. |

Deferred provider decisions in the decision register are acceptable only after provider-neutral ports, data-processing constraints, conformance tests, and failure behavior are documented.

## 6. Required closure order

1. Complete and review the product baseline; obtain explicit decisions and PRD approval.
2. Complete domain/data, tenancy/residency, authorization, privacy/deletion, audit, threat, and NFR contracts; accept required ADRs.
3. Complete document-intelligence and AI contracts against versioned schemas.
4. Complete API/event/connector and machine-readable reference contracts.
5. Complete responsive UX, engineering, operations, and test/evaluation specifications.
6. Decompose the approved contracts into vertical backlog slices with exact acceptance and test traceability.
7. Run schema, semantic, authorization, privacy, security, AI, accessibility, resilience, recovery, and performance gates and record evidence.
8. Conduct a formal readiness review against every `RDY-P1-*` item and update this verdict.

## 7. Readiness-review record requirements

A future approval record must state:

- exact repository revision and approved document/schema/reference-data versions;
- product owner, architecture, security/privacy, engineering, UX/accessibility, operations, and test reviewers;
- each `RDY-P1-*` disposition with evidence links;
- open decisions and why each is safely outside the authorized implementation slice;
- accepted risks, owner, expiry/review date, and compensating control;
- quality-gate commands and immutable result references;
- authorized implementation slice and explicit exclusions; and
- rollback of readiness approval if a material contract or decision changes.

`DEC-041` is the product-owner readiness record for local Phase 1 implementation. A separate cross-functional record satisfying the remaining production evidence above is required before the verdict can become production-ready.
