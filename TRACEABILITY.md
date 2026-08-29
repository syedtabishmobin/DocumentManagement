# Phase 1 Traceability Index

| Field | Value |
|---|---|
| Document ID | `GOV-TRACE-001` |
| Version | `0.4` |
| Status | `BUILD BASELINE IN REVIEW — hierarchy and reverse traceability complete; product execution evidence not started/complete` |
| Updated | 30 August 2026 |
| Readiness record | [`GOV-READY-001`](SPECIFICATION-READINESS.md) |

## 1. Purpose

This index traces the Phase 1 product baseline from decisions and research gaps through outcomes, requirements, features, use cases, journeys, and measures. Exact story-level links across architecture, document intelligence, AI, API/event, security, UX/accessibility, NFR, engineering, operations, reference data, and tests are owned by the [backlog traceability matrix](docs/10-backlog/04-traceability-matrix.md). Machine-checked test-to-upstream mappings are owned by the [test scenario manifest](docs/12-testing/fixtures/test-scenarios.v1.json).

Static traceability is complete for the current namespaces. `DEC-041` and `DEC-054` authorize all four implementation slices as one continuous program, but authorization is not completion. The [personal/family implementation status](docs/10-backlog/05-personal-family-implementation-status.md) records current code evidence and remaining work; no story currently meets its complete release gate.

The controlled candidate is [`DOCULYRA-BUILD-P1-2026.08.30.1`](docs/10-backlog/08-build-baselines/DOCULYRA-BUILD-P1-2026.08.30.1.md): vision `PROD-VIS-001`, 7 outcomes, 22 measurable definitions, 12 epics, 31 features, 49 stories, 98 story ACs, and 104 planned tests. Every story is `PLANNED_UNISSUED` until an attributed GitHub execution Issue passes Definition of Ready.

## 2. Traceability rules

1. The source-of-truth hierarchy in `CODEX.md` applies; this index does not create authority.
2. Every stable ID has one owning artifact and may be referenced elsewhere.
3. IDs are never recycled. A retired ID records its replacement or reason.
4. A range in this navigation index does not replace exact links in an implementation story or test.
5. Every implemented story must link exact decision, requirement, use-case, UX, API/event, authorization/security, NFR, reference-data, migration, test, and evaluation IDs that apply.
6. `GAP-*` means research input, not approved scope. Its disposition comes from the approved PRD or a higher-authority decision.
7. An open decision must remain a visible dependency; lower-level documents cannot close it by selecting a behavior or provider.

## 3. Product outcome chain

| Outcome | Primary requirement families | Features | Use cases | Journeys | Measures |
|---|---|---|---|---|---|
| `OUT-P1-001` — secure intelligible baseline | Exact ownership in product/feature catalogues | `FEAT-P1-001`, `003`–`009`, `020`, `026`, `028`, `030`, `031` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-001`, `002`, `003`, `006`, `019`, `020`, `021` |
| `OUT-P1-002` — find and verify evidence | Exact ownership in product/feature catalogues | `FEAT-P1-003`, `008`–`015` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-001`, `003`, `006`, `009`–`012`, `018`, `021`, `022` |
| `OUT-P1-003` — explain change impact | Exact ownership in product/feature catalogues | `FEAT-P1-010`, `012`, `014`, `016`–`018`, `020`, `022`, `023` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-004`, `005`, `006`, `008`, `009`, `013`–`015`, `021` |
| `OUT-P1-004` — approval-to-evidence closure | Exact ownership in product/feature catalogues | `FEAT-P1-014`, `015`, `019`–`021`, `027` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-005`–`009`, `017`, `021` |
| `OUT-P1-005` — private family collaboration | Exact ownership in product/feature catalogues | `FEAT-P1-001`, `002`, `011`, `021`, `023`–`025`, `027` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-006`, `018`, `021` |
| `OUT-P1-006` — portable export and controlled deletion | Exact ownership in product/feature catalogues | `FEAT-P1-008`, `025`, `026`, `029`, `030` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-006`, `016`, `019`, `021` |
| `OUT-P1-007` — honest, recoverable intelligence | Exact ownership in product/feature catalogues | `FEAT-P1-002`, `004`–`007`, `009`, `011`, `013`, `014`, `016`–`019`, `021`, `022`, `026`–`031` | Exact reciprocal links in `PROD-UC-001`/`BLG-STORY-001` | `JRN-P1-*` as applicable | `MET-P1-006`, `009`, `012`, `015`, `021`, `022` |

## 4. Approved-decision traceability

| Approved decision | Principal product requirements | Product acceptance or measure evidence | Downstream state |
|---|---|---|---|
| `DEC-001` — intelligence and monitoring product | `REQ-P1-ING-*`, `REQ-P1-FCT-*`, `REQ-P1-GPH-*`, `REQ-P1-SRCH-*`, `REQ-P1-MON-*`, `REQ-P1-HLT-*`, `REQ-P1-ACT-*` | `AC-P1-E2E-001`, `AC-P1-RAG-001`, `AC-P1-MON-001`; `MET-P1-003`–`015`, `MET-P1-022` | `IN PROGRESS` |
| `DEC-002` — personal/family first | `REQ-P1-WS-001`–`007`, `REQ-P1-CFG-005` | `UC-P1-001`, `UC-P1-009`; `JRN-P1-001`, `JRN-P1-006` | `IN PROGRESS` |
| `DEC-003` — identity/membership/workspace/resource | `REQ-P1-WS-001`–`007`, `REQ-P1-SHR-*`, `REQ-P1-TRUST-002` | `AC-P1-SEC-001`, `UC-P1-001`, `UC-P1-009`, `UC-P1-013`; `MET-P1-018` | `IN PROGRESS` |
| `DEC-004` — canonical facts separate from occurrences | `REQ-P1-FCT-001`–`006`, `REQ-P1-ING-005`, `REQ-P1-GPH-*` | `AC-P1-E2E-001`, `UC-P1-004`; `MET-P1-010`, `MET-P1-013`, `MET-P1-014` | `IN PROGRESS` |
| `DEC-005` — immutable originals and versions | `REQ-P1-DOC-001`–`008`, `REQ-P1-ING-004`, `REQ-P1-ING-008`, `REQ-P1-TRUST-007` | `AC-P1-ING-001`, `AC-P1-DEL-001`, `UC-P1-002`, `UC-P1-003`, `UC-P1-012`; `MET-P1-019` | `IN PROGRESS` |
| `DEC-006` — evidence, explanation, approval, audit | `REQ-P1-ACT-003`–`008`, `REQ-P1-AI-*`, `REQ-P1-TRUST-004` | `AC-P1-E2E-001`, `AC-P1-AI-001`, `UC-P1-007`; `MET-P1-012`, `MET-P1-017`, `MET-P1-022` | `IN PROGRESS` |
| `DEC-007` — configuration-driven and jurisdiction-aware | `REQ-P1-MON-002`–`003`, `REQ-P1-HLT-001`, `REQ-P1-CFG-001`–`004` | `UC-P1-006`, `UC-P1-008`, `UC-P1-018`; `MET-P1-004`, `MET-P1-015` | DRAFT machine-readable contracts validate; runtime seeds remain disabled |
| `DEC-008` — permission-aware retrieval/graph/AI | `REQ-P1-FCT-006`, `REQ-P1-GPH-002`–`004`, `REQ-P1-SRCH-002`–`004`, `REQ-P1-AI-002`, `REQ-P1-TRUST-002` | `AC-P1-SEC-001`, `AC-P1-RAG-001`, `UC-P1-005`, `UC-P1-013`; `MET-P1-018` | `IN PROGRESS` |
| `DEC-009` — vendor-neutral core | `REQ-P1-ING-009`, `REQ-P1-AI-007`, `REQ-P1-CFG-001` | Provider-conformance acceptance remains to be defined | `IN PROGRESS` |
| `DEC-010` — full specifications before implementation | All requirements and `RDY-P1-*` criteria | `GOV-READY-001` verdict | `SATISFIED FOR DEV/STAGE IMPLEMENTATION`; production remains gated |
| `DEC-020` — Australia first | `REQ-P1-MON-002`–`003`, `REQ-P1-CFG-002`–`003`, `REQ-P1-TRUST-005` | Australian pack and applicability tests | DRAFT jurisdiction-neutral seed exists; public launch pack/residency remain blocked by `DEC-035`/`040` |
| `DEC-021` — responsive PWA first | `REQ-P1-ING-001`, `REQ-P1-NTF-003`; all critical UX | `AC-P1-A11Y-001`, `JRN-P1-002` | `SUPERSEDED` by concurrent React web and Flutter mobile in `DEC-052` |
| `DEC-022` — multi-tenant SaaS/Australian residency option | `REQ-P1-TRUST-001`–`005`, `REQ-P1-TRUST-009` | `AC-P1-SEC-001`, residency/restore tests | Provider selection `SUPERSEDED` by Azure in `DEC-049`; isolation/residency implementation remains incomplete |
| `DEC-023` — household owner/admin and limited adviser | `REQ-P1-WS-002`, `REQ-P1-WS-004`, `REQ-P1-WS-006`, `REQ-P1-SHR-*` | `UC-P1-001`, `UC-P1-009`, `JRN-P1-006` | `IN PROGRESS` |
| `DEC-024` — no clinical records | `REQ-P1-DOC-007`, `REQ-P1-ING-003`, `REQ-P1-TRUST-003`, `REQ-P1-TRUST-007` | `JRN-P1-009`, `MET-P1-020` | Heuristic `POLICY_HOLD` preview exists under approved `DEC-036`; production content-safety evidence incomplete |

## 5. Research-gap disposition traceability

| Research gap | Draft PRD disposition | Requirements | Features | Use cases | Decision or specialist dependency |
|---|---|---|---|---|---|
| `GAP-001` | Adopt | `REQ-P1-HLT-001`, `REQ-P1-HLT-002`, `REQ-P1-HLT-005` | `FEAT-P1-020` | `UC-P1-008` | Requirement-profile/reference-data contract |
| `GAP-002` | Adopt | `REQ-P1-FCT-001`–`004`, `REQ-P1-MON-002`, `REQ-P1-MON-004` | `FEAT-P1-010`, `FEAT-P1-016`, `FEAT-P1-017` | `UC-P1-004`, `UC-P1-006` | Bitemporal data model and rule/snapshot contract |
| `GAP-003` | Adopt | `REQ-P1-ING-005`, `REQ-P1-SRCH-002`, `REQ-P1-AI-003` | `FEAT-P1-009`, `FEAT-P1-013`, `FEAT-P1-014` | `UC-P1-002`, `UC-P1-005` | Evidence and structured-output schemas |
| `GAP-004` | Adopt | `REQ-P1-ING-007`, `REQ-P1-HLT-005`, `REQ-P1-ACT-005`–`008` | `FEAT-P1-009`, `FEAT-P1-019`, `FEAT-P1-020` | `UC-P1-002`, `UC-P1-007`, `UC-P1-008` | Workflow state contracts |
| `GAP-005` | Adopt | `REQ-P1-DOC-008`, `REQ-P1-ACT-008` | `FEAT-P1-015`, `FEAT-P1-019` | `UC-P1-003`, `UC-P1-007` | Version/obligation model |
| `GAP-006` | Adopt | `REQ-P1-MON-003`–`007` | `FEAT-P1-017` | `UC-P1-006` | Source-monitor operations and `DEC-035` |
| `GAP-007` | Split | `REQ-P1-SHR-001`–`004`, `REQ-P1-TRUST-006` | `FEAT-P1-024`, `FEAT-P1-025`, `FEAT-P1-029` | `UC-P1-009`, `UC-P1-011`, `UC-P1-016` | `DEC-032`, `DEC-033`, privacy/security design |
| `GAP-008` | Conditional adopt | `REQ-P1-HLT-004` | `FEAT-P1-028` | `UC-P1-008` | `DEC-034`; omit aggregate score until approved |
| `GAP-009` | Adopt | `REQ-P1-ACT-005`–`007`, `REQ-P1-AI-001`–`006` | `FEAT-P1-014`, `FEAT-P1-019` | `UC-P1-007`, `UC-P1-013` | AI capability/policy/approval/evaluation contracts |
| `GAP-010` | Reserve only | `REQ-P1-CFG-005` | `FEAT-P1-007` | No Phase 1 end-user use case | Future Phase 2 decisions/ADRs |

## 6. Requirement-family handoff matrix

| Requirement family | Product feature coverage | Use-case coverage | Downstream owners | Current downstream state |
|---|---|---|---|---|
| `REQ-P1-WS-*` | `FEAT-P1-001`, `FEAT-P1-002`, `FEAT-P1-024`, `FEAT-P1-025` | `UC-P1-001`, `UC-P1-009`, `UC-P1-013`, `UC-P1-015` | Domain/workspace, authorization, API, UX, tests | DRAFT contracts and exact story/test mappings exist; approval/evidence pending |
| `REQ-P1-DOC-*` | `FEAT-P1-003`–`005`, `FEAT-P1-008`, `FEAT-P1-015` | `UC-P1-002`, `UC-P1-003`, `UC-P1-012` | Domain/data, document intelligence, API, UX, tests | DRAFT contracts and exact story/test mappings exist; approval/evidence pending |
| `REQ-P1-ING-*` | `FEAT-P1-004`, `FEAT-P1-005`, `FEAT-P1-009`, `FEAT-P1-026` | `UC-P1-002`, `UC-P1-003`, `UC-P1-012`, `UC-P1-014` | Ingestion, security, API/events/connectors, UX, tests | DRAFT contracts and exact story/test mappings exist; connector scope remains fenced by `DEC-031` |
| `REQ-P1-FCT-*` | `FEAT-P1-010`, `FEAT-P1-011` | `UC-P1-004`, `UC-P1-007`, `UC-P1-013` | Domain/data, facts, graph, authorization, API, UX, tests | DRAFT contracts and exact story/test mappings exist; approval/evidence pending |
| `REQ-P1-GPH-*` | `FEAT-P1-012`, `FEAT-P1-018` | `UC-P1-004`–`007`, `UC-P1-013` | Domain/data, graph, impact, authorization, API, tests | DRAFT contracts and exact story/test mappings exist; approval/evidence pending |
| `REQ-P1-SRCH-*` | `FEAT-P1-013` | `UC-P1-003`, `UC-P1-005`, `UC-P1-013` | AI/RAG, authorization, API, UX, evaluations | DRAFT contracts and exact story/test mappings exist; evaluation evidence pending |
| `REQ-P1-MON-*` | `FEAT-P1-016`–`018` | `UC-P1-006`–`008`, `UC-P1-010` | Monitoring/source, API/events, operations, UX, tests | DRAFT contracts and exact story/test mappings exist; launch sources unresolved by `DEC-035` |
| `REQ-P1-HLT-*` | `FEAT-P1-020`, `FEAT-P1-028` | `UC-P1-008` | Health/requirements, reference data, UX, AI, tests | DRAFT contracts and exact story/test mappings exist; aggregate scoring remains off under `DEC-034` |
| `REQ-P1-ACT-*` | `FEAT-P1-018`, `FEAT-P1-019` | `UC-P1-004`, `UC-P1-007`, `UC-P1-008`, `UC-P1-010` | Impact/workflow, AI, authorization, API/events, UX, tests | DRAFT contracts and exact story/test mappings exist; approval/execution evidence pending |
| `REQ-P1-NTF-*` | `FEAT-P1-021`, `FEAT-P1-027` | `UC-P1-010` | Workflow, API/events, UX, operations, tests | DRAFT contracts exist; external channels remain disabled under `DEC-037` |
| `REQ-P1-SHR-*` | `FEAT-P1-023`–`025` | `UC-P1-009`, `UC-P1-013`, `UC-P1-016` | Workspace/domain, authorization/privacy, API, UX, tests | DRAFT ordinary-sharing contracts exist; automated continuity remains blocked by `DEC-032` |
| `REQ-P1-AI-*` | `FEAT-P1-014` | `UC-P1-002`, `UC-P1-004`–`008`, `UC-P1-013` | AI/RAG/output/tools/guardrails/evaluation, security | DRAFT contracts and exact story/test mappings exist; evaluation evidence pending |
| `REQ-P1-TRUST-*` | `FEAT-P1-002`, `FEAT-P1-006`, `FEAT-P1-026`, `FEAT-P1-029`, `FEAT-P1-030` | All; especially `UC-P1-011`–`019` | Security/privacy/audit/threat, architecture, operations, tests | DRAFT contracts exist; `DEC-038`–`040` block recovery, deletion timing, and residency approval |
| `REQ-P1-CFG-*` | `FEAT-P1-007`, `FEAT-P1-022` | Cross-cutting; `UC-P1-018` publication | Domain/data, reference schemas/data, API, operations, tests | DRAFT schemas/catalogues and publication contracts validate; runtime activation prohibited |

## 7. Detailed traceability and remaining readiness gaps

The static owner namespaces now exist. The detailed [backlog matrix](docs/10-backlog/04-traceability-matrix.md) records 12 epics, 31 features, 49 stories, 98 story acceptance criteria, all 101 requirements, 20 use cases, and 104 exact downstream test mappings. The [test traceability validator](scripts/validate-test-traceability.py) rejects dangling IDs, incomplete reciprocal coverage, and unmapped source-test files.

Remaining gaps are implementation and evidence gaps, not missing ID families:

- full implementation of the 49 baselined stories and correction of the evidence gaps in `BLG-STATUS-001`;
- approved production reference packs, processors, identity/recovery, residency routes, external providers/channels, and operational targets;
- execution and review of mapped security, privacy, authorization, accessibility, AI, integration, migration, performance, resilience, restore, and disaster-recovery evidence; and
- a formal production readiness record naming the exact release revision and evidence set.

The implementation gate is open for synthetic dev/stage work. The production and real-customer-data gates remain closed.
