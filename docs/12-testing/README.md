# Phase 1 Testing and Evaluation Pack

| Field | Value |
|---|---|
| Document ID | `TST-IDX-001` |
| Version | `0.1` |
| Status | **DRAFT — implementation, tools, representative environments, targets, and release authority are not selected** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |

## Purpose and authority

This pack turns the current Phase 1 contracts into stable implementation-test candidates, synthetic fixtures, evaluation scenarios, and executable traceability checks. It does not authorize implementation or launch, approve a DRAFT requirement or NFR, select a provider/tool, close an open decision, or turn a synthetic/local pass into production assurance.

The governing test contract is [`ENG-TST-001`](../08-engineering/06-testing-standards.md). Product acceptance remains owned by the [use-case catalogue](../01-product/04-use-case-catalogue.md); AI release evaluation remains owned by [`AI-EVAL-001`](../04-ai/06-ai-evaluation-framework.md); security controls remain owned by [`SEC-ARCH-001`](../06-security/01-security-architecture.md); and recovery objectives remain provisional in [`ARCH-NFR-001`](../02-architecture/05-non-functional-requirements.md). If this pack conflicts with an owning contract, the owning contract wins and the affected test is `BLOCKED` or `INSUFFICIENT`, not silently weakened.

## Reading order

1. [`01-test-strategy.md`](01-test-strategy.md) — governance, layers, evidence, domain/unit and contract catalogues.
2. [`02-ai-evaluation-scenarios.md`](02-ai-evaluation-scenarios.md) — document/AI datasets, metrics, adjudication, guardrails, and release gates.
3. [`03-security-tests.md`](03-security-tests.md) — negative authorization, privacy, abuse, injection, deletion, audit, and telemetry cases.
4. [`04-integration-and-e2e-scenarios.md`](04-integration-and-e2e-scenarios.md) — product acceptance, async races, accessibility, and decision-boundary journeys.
5. [`05-performance-and-resilience-tests.md`](05-performance-and-resilience-tests.md) — provisional NFR measurement, capacity, chaos, restore, and DR exercises.
6. [`fixtures/README.md`](fixtures/README.md) — machine-readable test, fixture, evaluation, workload, and fault manifests.

## Stable test namespaces

| Namespace | Owning document | Owner | Scope |
|---|---|---|---|
| `TEST-UNIT-P1-###` | `TST-STR-001` | Domain/Data Quality | Pure invariants, state, time, policy, migration properties. |
| `TEST-CON-P1-###` | `TST-STR-001` | Contract Quality | API, event, schema, reference-data, structured-output, and port conformance. |
| `TEST-AI-P1-###` | `TST-AI-001` | AI Evaluation + Document Intelligence | Document/AI quality, evidence, safety, calibration, adjudication, drift. |
| `TEST-SEC-P1-###` | `TST-SEC-001` | Security + Privacy Quality | Negative authorization, inference, abuse, egress, secrets, audit, deletion. |
| `TEST-E2E-P1-###` | `TST-E2E-001` | Product Quality | Integrated product/use-case acceptance and accessibility journeys. |
| `TEST-PERF-P1-###` | `TST-PRF-001` | Performance/Capacity Quality | Availability, latency, throughput, freshness, isolation, cost. |
| `TEST-DR-P1-###` | `TST-PRF-001` | Resilience/Operations Quality | Faults, replay, migration repair, restore, RPO/RTO, DR. |

IDs are never recycled. A renamed or moved test retains its ID and owner history. A retired test remains in the manifest with `RETIRED`, a replacement or retirement reason, and effective metadata; it is never deleted to make coverage appear complete. Version `0.1` defines `TEST-UNIT-P1-001`–`010`, `TEST-CON-P1-001`–`012`, `TEST-AI-P1-001`–`015`, `TEST-SEC-P1-001`–`015`, `TEST-E2E-P1-001`–`020`, `TEST-PERF-P1-001`–`010`, and `TEST-DR-P1-001`–`008`.

## Machine-readable source of trace truth

[`fixtures/test-scenarios.v1.json`](fixtures/test-scenarios.v1.json) is the exact test-to-contract mapping. The prose tables explain intent; they do not expand or override the JSON trace arrays. Other manifests provide only referenced synthetic inputs:

- [`fixtures/synthetic-fixtures.v1.json`](fixtures/synthetic-fixtures.v1.json) — deterministic non-personal workspaces, documents, sources, and policies;
- [`fixtures/ai-evaluation-datasets.v1.json`](fixtures/ai-evaluation-datasets.v1.json) — versioned synthetic evaluation slices and adjudication contracts; and
- [`fixtures/workload-and-fault-profiles.v1.json`](fixtures/workload-and-fault-profiles.v1.json) — provider-neutral workload, concurrency, clock, delivery, and fault profiles.

All fixtures are synthetic, local-test-only, privacy classified, deterministic, and outbound denied. Reserved `.invalid` endpoints are descriptive values only and never enabled services. No manifest contains real household data, credentials, routable service endpoints, or an assertion of Australian processing.

## Decision fences and evidence status

`DEC-030`–`040` remain controlling. In particular: connectors, automated continuity, aggregate scoring, external channels, account/workspace recovery, undecided clinical disposition, unapproved launch sources/profiles, deletion durations, and unknown processor/residency routes are tested as disabled, unavailable, `POLICY_HOLD`, or fail-closed. Tests may exercise a synthetic candidate behind an isolated port, but a passing result does not activate the capability.

Every result is one of `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `INSUFFICIENT`, or `NOT_APPLICABLE` with a reason. `BLOCKED`, `NOT_RUN`, and `INSUFFICIENT` never count as passes. Zero-tolerance failures are stop-ship and cannot be quarantined or waived.

## Validation

Run from the repository root:

```sh
python3 scripts/validate-test-traceability.py
```

The validator checks JSON shape, stable/unique IDs, owner-document agreement, fixture references, exact upstream trace IDs, requirement/acceptance/backlog coverage reporting, deterministic/synthetic/privacy metadata, reserved endpoints, and credential/personal-data canaries. It complements rather than replaces the specification, API/event, and reference-data validators.
