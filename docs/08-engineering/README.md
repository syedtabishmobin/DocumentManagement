# Phase 1 Engineering Specification Index

| Field | Value |
|---|---|
| Document ID | `ENG-IDX-001` |
| Version | `0.1` |
| Status | **DRAFT — specification only; not implementation authority** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |

## Purpose and authority

This directory translates the product, architecture, API/event, document-intelligence, AI, security, privacy, audit, reference-data, and NFR contracts into provider-neutral engineering rules. It defines how future implementation choices must be evaluated and how code, repository boundaries, failures, local development, tests, and evidence must behave.

The source-of-truth hierarchy in [`CODEX.md`](../../CODEX.md) applies. Approved decisions outrank this pack; accepted ADRs would outrank it, but all current architecture ADRs remain **PROPOSED**. The implementation-readiness gate remains closed unless the product owner explicitly changes it. Nothing here creates application scaffolding, selects technology, installs a dependency, activates a deferred feature, or closes `DEC-031`–`DEC-040`.

## Reading order and ownership

| Order | Document | Stable rule namespace | Owns |
|---:|---|---|---|
| 1 | [Technology stack](01-technology-stack.md) | `ENG-STACK-P1-*` | Capability criteria, ports, evidence, evaluation, and decision gates |
| 2 | [Repository structure](02-repository-structure.md) | `ENG-REP-P1-*` | Future logical boundaries, dependency direction, generated assets, and migrations |
| 3 | [Coding standards](03-coding-standards.md) | `ENG-CODE-P1-*` | Language-neutral correctness, security, domain, API/event, and review rules |
| 4 | [Error and resilience standards](04-error-and-resilience-standards.md) | `ENG-ERR-P1-*` | Error semantics, retry, concurrency, outbox, replay, degradation, and repair |
| 5 | [Local development](05-local-development.md) | `ENG-DEV-P1-*` | Safe deterministic local profiles, synthetic fixtures, commands, and parity limits |
| 6 | [Testing standards](06-testing-standards.md) | `ENG-TST-P1-*` | Test layers, matrices, evidence, release gates, and waivers |

Rule IDs are immutable once referenced. A changed rule is versioned in place with impact review; a materially replaced rule is retired with an explicit successor and is never recycled.

## Shared engineering invariants

Every future implementation slice must preserve all of the following:

- one validated workspace, actor/workload, purpose, current-policy, correlation, and deletion context at every household boundary;
- canonical aggregate ownership, immutable originals/evidence, bitemporal fact/rule history, and rebuildable derivatives;
- current authorization at retrieval, output, redemption, queued execution, export, and external-effect time;
- durable command/audit/event obligations, explicit workflow state, idempotent and order-aware consumption, and truthful partial/unknown outcomes;
- provider-neutral ports and route eligibility based on current privacy, security, residency, retention, deletion, capability, and cost policy;
- closed, versioned API, event, structured-output, and reference-data contracts with compatibility evidence;
- synthetic or specifically approved test data and privacy-safe logs, traces, metrics, screenshots, tickets, and build evidence; and
- stop-ship behavior for unauthorized disclosure/effect, original loss or mutation, deletion resurrection, unapproved route, hidden stale state, prohibited telemetry content, or missing required audit.

## Present versus future repository state

This repository currently contains specifications, machine-readable contracts/reference data, and standard-library validators. Future source, migration, test, build, deployment, or generated-code directories described here are logical boundaries only. They must not be created until the specification gate and applicable technology/ADR decisions permit implementation.

The normative machine-readable sources currently are:

- [OpenAPI 3.1 contract](../05-api/02-openapi.json);
- [event schemas and examples](../05-api/events/);
- [reference-data schemas and inert catalogues](../11-reference-data/); and
- the validators documented in [`scripts/README.md`](../../scripts/README.md).

Generated clients, server bindings, event types, validators, fixtures, documentation, or runtime catalogues must remain downstream products of those reviewed sources. Generated output is not a second source of truth.

## Engineering-pack readiness

This pack may advance from DRAFT only when:

1. product and architecture confirm the Phase 1 implementation slices and accepted ADR baseline;
2. security, privacy, audit, operations, data/document-intelligence, AI assurance, accessibility, and quality owners approve their mapped rules;
3. technology candidates have conformance evidence and explicit decisions without bypassing open-decision fences;
4. every selected port has a versioned manifest, deterministic fake, integration conformance suite, failure/deletion/residency behavior, and accountable owner;
5. repository dependency rules, compatibility/migration policy, build provenance, and secret/configuration boundaries are enforceable;
6. all test layers and stop-ship gates have owners, stable commands, synthetic fixtures, and retained evidence; and
7. the repository, API/event, and reference-data validators pass together.

Approval of this pack alone does not satisfy the implementation-readiness gate in `CODEX.md`.
