# Phase 1 Specification Readiness

| Field | Value |
|---|---|
| Document ID | `GOV-READY-001` |
| Status | Active gate record |
| Current verdict | **READY FOR LOCAL PHASE 1 IMPLEMENTATION — NOT PRODUCTION AUTHORIZED** |
| Updated | 26 August 2026 |
| Governing contract | [`CODEX.md`](CODEX.md#specification-readiness-gate) |

## 1. Purpose

This file makes the repository readiness gate inspectable. It records whether the specification pack is safe and sufficiently complete to authorize application implementation. It does not lower the gate in `CODEX.md`, approve a draft, or replace product-owner decisions.

A file's existence is not evidence that its contract is approved, complete, internally consistent, traceable, or tested. A criterion moves to `SATISFIED` only when the linked objective evidence exists and no higher-authority conflict remains.

## 2. Current verdict

The product owner explicitly approved `PROD-PRD-001` version `0.1`, resolved `DEC-030`–`DEC-040` for local implementation, accepted the provider-neutral architecture, and authorized the complete Phase 1 build in `DEC-041`–`042`.

Application implementation may therefore proceed across `P1-S1`–`P1-S4` as one continuous program. The default profile MUST use synthetic data, local storage, local/mock AI, disabled external connectors/channels, and deny-by-default egress. This verdict does not authorize production deployment, public coverage claims, or processing of real personal documents. Those actions still require cross-functional security, privacy, accessibility, operations, recovery, residency, retention, and release evidence.

## 3. Gate criteria

| Readiness ID | Criterion | Current state | Required evidence |
|---|---|---|---|
| `RDY-P1-001` | The Phase 1 PRD is approved or explicitly marked as an approved implementation baseline. | `SATISFIED` | `DEC-041` approves `PROD-PRD-001` version `0.1`. |
| `RDY-P1-002` | High-impact product and architecture decisions are approved or safely deferred behind documented abstractions. | `SATISFIED` | `DEC-030`–`042` define approved local behavior and production fences; ADRs `001`–`006` are accepted. |
| `RDY-P1-003` | Domain/data, tenancy, authorization, security, privacy, deletion, audit, and residency models are complete and mutually consistent. | `IN PROGRESS` | Approved specifications, state/invariant matrices, threat mitigations, negative tests, deletion/residency matrices, and accepted ADRs. |
| `RDY-P1-004` | Document-intelligence, monitoring, trusted-source, evidence, fact, graph, impact, health, and version contracts exist. | `IN PROGRESS` | Normative specifications, machine-readable schemas/data, examples that validate, failure/replay behavior, and traceability. |
| `RDY-P1-005` | AI capability, RAG, structured-output, prompt/tool, guardrail, and evaluation contracts exist. | `IN PROGRESS` | Draft contracts and synthetic evaluation manifests exist; provider/processor decisions, thresholds, review approval, execution, and regression evidence remain outstanding. |
| `RDY-P1-006` | API, event, async-job, upload/artifact, connector, export, deletion, and action contracts exist and validate. | `IN PROGRESS` | The draft OpenAPI/event/connector contracts pass static validation; approved baselines and executed compatibility, authorization, replay, migration, and conformance tests remain outstanding. |
| `RDY-P1-007` | Critical responsive UX flows, states, screens, design system, and accessibility behavior are specified. | `IN PROGRESS` | Draft linked IA, flows, screen/state specs, design rules, and accessibility criteria exist; target browser/assistive-technology approval and research/conformance evidence remain outstanding. |
| `RDY-P1-008` | Engineering and operational delivery contracts include measurable NFRs, environments, migrations, CI/CD, deployment, recovery, and observability. | `IN PROGRESS` | Draft provider-neutral contracts exist; stack/ADR approval, numeric-target approval, environment selection, and executed migration/restore/failover evidence remain outstanding. |
| `RDY-P1-009` | Every implementation epic has stable traceability and testable acceptance criteria. | `IN PROGRESS` | Twelve draft epics and 48 stories link 90 requirements, 96 story acceptance criteria, and exact test IDs; approvals and passing execution evidence remain outstanding. |
| `RDY-P1-010` | Initial reference data and all required test/evaluation strategies, fixtures, and quality gates exist and pass. | `IN PROGRESS` | Twelve DRAFT/disabled reference catalogues and deterministic synthetic test fixtures validate; the launch pack is unresolved under `DEC-035`, and all test/evaluation evidence remains unexecuted. |
| `RDY-P1-011` | No open decision makes the proposed implementation unsafe or substantially disposable. | `SATISFIED` | `DEC-031`–`040` close the local behavior and explicitly deny production/provider activation; provider-neutral ports preserve replacement. |
| `RDY-P1-012` | The complete repository is coherent, reviewable, and protected against drift. | `IN PROGRESS` | Passing link/ID/schema/semantic/traceability/privacy validators, preserved-source checks, change review, and zero unresolved source conflict. |

Allowed states are `MISSING`, `IN PROGRESS`, `BLOCKED`, `SATISFIED`, and `NOT APPLICABLE` with an approved rationale. `IN PROGRESS` never opens the implementation gate.

## 4. Specification-pack status

| Area | Required baseline | Current evidence | State |
|---|---|---|---|
| Governance/context | Working agreement, source hierarchy, preserved handover, decisions, research provenance, readiness record | `AGENTS.md`, `CODEX.md`, `docs/00-context/`, this file | `IN PROGRESS` — open decisions and formal approval record remain |
| Product | Vision, PRD, feature catalogue, use cases, personas/journeys, scope/metrics, research | [`docs/01-product/README.md`](docs/01-product/README.md) | `IN PROGRESS` — draft set exists; owner approval and open decisions remain |
| Architecture | Solution, domain, data, workspace/family, NFRs, ADRs | [`docs/02-architecture/README.md`](docs/02-architecture/README.md) | `IN PROGRESS` — draft pack complete; five ADRs and targets remain proposed |
| Document intelligence | Taxonomy, ingestion, extraction/evidence, facts/entities, graph, monitoring, impact, sources, health, versioning | [`docs/03-document-intelligence/README.md`](docs/03-document-intelligence/README.md) | `IN PROGRESS` — draft pack complete; approvals and executed conformance evidence remain |
| AI | Capability architecture, RAG, outputs, prompts/tools, guardrails, evaluations | [`docs/04-ai/README.md`](docs/04-ai/README.md) | `IN PROGRESS` — draft pack complete; thresholds, approvals, and evaluation evidence remain |
| API/integration | API standards, OpenAPI, event catalogue/schemas, connector contracts | [`docs/05-api/README.md`](docs/05-api/README.md) | `IN PROGRESS` — draft contracts validate; approval and executed contract/conformance evidence remain |
| Security/privacy | Architecture, authorization, privacy/governance, audit/provenance, threat model | [`docs/06-security/README.md`](docs/06-security/README.md) | `IN PROGRESS` — draft pack complete; decisions, review, and executed security/privacy evidence remain |
| UX | Information architecture, flows, screens/states, design system, accessibility | [`docs/07-ux/README.md`](docs/07-ux/README.md) | `IN PROGRESS` — draft pack complete; target matrix and research/conformance evidence remain |
| Engineering | Stack/ADRs, repository structure, coding, errors/resilience, local development, testing standards | [`docs/08-engineering/README.md`](docs/08-engineering/README.md) | `IN PROGRESS` — draft pack complete; stack/ADR approval and implementation evidence remain |
| Operations | Environments, CI/CD, IaC, secrets, deployment/repair, backup/DR, observability | [`docs/09-devops/README.md`](docs/09-devops/README.md) | `IN PROGRESS` — draft pack complete; providers, numeric targets, and operational evidence remain |
| Backlog/traceability | Epics, features, stories, acceptance, dependencies, release slices, matrix | [`docs/10-backlog/README.md`](docs/10-backlog/README.md) | `IN PROGRESS` — 12 epics/48 stories mapped; none approved or implementation-ready |
| Reference data | Versioned schemas plus document types, rules, jurisdictions, sources, roles, permissions, statuses/severities | [`docs/11-reference-data/README.md`](docs/11-reference-data/README.md) | `IN PROGRESS` — draft synthetic seed validates; all runtime entries remain disabled and launch pack unresolved |
| Testing/evaluation | Test strategy, AI evaluation, security, integration/E2E, performance/resilience, fixtures/evidence | [`docs/12-testing/README.md`](docs/12-testing/README.md) | `IN PROGRESS` — draft cases and deterministic fixtures exist; execution evidence is `NOT_RUN`/insufficient |
| Repository validation | ID/link integrity, checksums, schemas, semantics, traceability, fixture privacy | [`scripts/README.md`](scripts/README.md) | `IN PROGRESS` — four static validators pass; formal review and executed quality evidence remain |

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
