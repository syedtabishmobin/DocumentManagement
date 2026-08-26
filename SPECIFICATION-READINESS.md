# Phase 1 Specification Readiness

| Field | Value |
|---|---|
| Document ID | `GOV-READY-001` |
| Status | Active gate record |
| Current verdict | **NOT READY FOR APPLICATION IMPLEMENTATION** |
| Updated | 26 August 2026 |
| Governing contract | [`CODEX.md`](CODEX.md#specification-readiness-gate) |

## 1. Purpose

This file makes the repository readiness gate inspectable. It records whether the specification pack is safe and sufficiently complete to authorize application implementation. It does not lower the gate in `CODEX.md`, approve a draft, or replace product-owner decisions.

A file's existence is not evidence that its contract is approved, complete, internally consistent, traceable, or tested. A criterion moves to `SATISFIED` only when the linked objective evidence exists and no higher-authority conflict remains.

## 2. Current verdict

Application implementation is blocked because:

- `PROD-PRD-001` is a draft candidate baseline, not product-owner approved;
- `DEC-030`–`DEC-040` include material proposed and open product, privacy, recovery, deletion, residency, and launch-pack choices;
- all five architecture ADRs remain proposed and draft contracts have not received their required product, architecture, security/privacy, accessibility, quality, or operations approvals;
- the static specification, API/event, reference-data, and traceability gates pass, but the mapped test/evaluation cases are unexecuted and therefore provide no implementation or release evidence; and
- no formal cross-functional readiness-review record authorizes a bounded implementation slice.

Repository validation tooling and draft specifications may continue. Application scaffolding, provider selection, database schema implementation, UI implementation, or production integration may not begin unless the product owner explicitly changes the governing instruction.

## 3. Gate criteria

| Readiness ID | Criterion | Current state | Required evidence |
|---|---|---|---|
| `RDY-P1-001` | The Phase 1 PRD is approved or explicitly marked as an approved implementation baseline. | `BLOCKED` | Product-owner approval of a named PRD version and a corresponding `APPROVED` decision-register entry. |
| `RDY-P1-002` | High-impact product and architecture decisions are approved or safely deferred behind documented abstractions. | `BLOCKED` | Resolution or safe contractual deferral of every material `OPEN`/`PROPOSED` decision; accepted ADR set; no hidden provider commitment. |
| `RDY-P1-003` | Domain/data, tenancy, authorization, security, privacy, deletion, audit, and residency models are complete and mutually consistent. | `IN PROGRESS` | Approved specifications, state/invariant matrices, threat mitigations, negative tests, deletion/residency matrices, and accepted ADRs. |
| `RDY-P1-004` | Document-intelligence, monitoring, trusted-source, evidence, fact, graph, impact, health, and version contracts exist. | `IN PROGRESS` | Normative specifications, machine-readable schemas/data, examples that validate, failure/replay behavior, and traceability. |
| `RDY-P1-005` | AI capability, RAG, structured-output, prompt/tool, guardrail, and evaluation contracts exist. | `IN PROGRESS` | Draft contracts and synthetic evaluation manifests exist; provider/processor decisions, thresholds, review approval, execution, and regression evidence remain outstanding. |
| `RDY-P1-006` | API, event, async-job, upload/artifact, connector, export, deletion, and action contracts exist and validate. | `IN PROGRESS` | The draft OpenAPI/event/connector contracts pass static validation; approved baselines and executed compatibility, authorization, replay, migration, and conformance tests remain outstanding. |
| `RDY-P1-007` | Critical responsive UX flows, states, screens, design system, and accessibility behavior are specified. | `IN PROGRESS` | Draft linked IA, flows, screen/state specs, design rules, and accessibility criteria exist; target browser/assistive-technology approval and research/conformance evidence remain outstanding. |
| `RDY-P1-008` | Engineering and operational delivery contracts include measurable NFRs, environments, migrations, CI/CD, deployment, recovery, and observability. | `IN PROGRESS` | Draft provider-neutral contracts exist; stack/ADR approval, numeric-target approval, environment selection, and executed migration/restore/failover evidence remain outstanding. |
| `RDY-P1-009` | Every implementation epic has stable traceability and testable acceptance criteria. | `IN PROGRESS` | Twelve draft epics and 48 stories link 90 requirements, 96 story acceptance criteria, and exact test IDs; approvals and passing execution evidence remain outstanding. |
| `RDY-P1-010` | Initial reference data and all required test/evaluation strategies, fixtures, and quality gates exist and pass. | `IN PROGRESS` | Twelve DRAFT/disabled reference catalogues and deterministic synthetic test fixtures validate; the launch pack is unresolved under `DEC-035`, and all test/evaluation evidence remains unexecuted. |
| `RDY-P1-011` | No open decision makes the proposed implementation unsafe or substantially disposable. | `BLOCKED` | Formal cross-functional readiness review showing all remaining open items are outside the slice or safely abstracted. |
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

## 5. Material decisions blocking scope or architecture

| Decision | State | Readiness effect |
|---|---|---|
| `DEC-030` | `PROPOSED` | Release-slice and launch-profile planning remains provisional. |
| `DEC-031` | `OPEN` | Connector ingestion/action scope and consent/deletion behavior cannot be frozen. |
| `DEC-032` | `OPEN` | Automated emergency/incapacity/after-death release remains unavailable. |
| `DEC-033` | `PROPOSED` | Complete export envelope is not yet an approved product promise. |
| `DEC-034` | `PROPOSED` | Aggregate readiness scoring remains conditional and may be omitted. |
| `DEC-035` | `OPEN` | First public document-type, requirement-profile, extraction, and Australian source pack is unknown. |
| `DEC-036` | `OPEN` | Clinical-record containment, retention, and recovery behavior is not safe to implement. |
| `DEC-037` | `PROPOSED` | External notification channel scope remains conditional; only draft in-app scope exists. |
| `DEC-038` | `OPEN` | Authentication/account/workspace recovery architecture cannot be approved. |
| `DEC-039` | `OPEN` | Deletion timing, backup expiry, and retained-audit minimization are unresolved. |
| `DEC-040` | `OPEN` | Australian-residency data-class and processor boundary is unresolved. |

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

Until such a record exists, this file's verdict remains **NOT READY FOR APPLICATION IMPLEMENTATION**.
