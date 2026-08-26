# DocumentManagement Specification Repository

This repository is the source of truth for an AI-native personal and family document intelligence and change-monitoring product, designed with explicit enterprise extension points.

## Current status

The complete Phase 1 specification repository now exists as a coherent **draft review baseline**. It includes the product, architecture, document-intelligence, AI, API/event, security, UX, engineering, operations, backlog, reference-data, and testing packs. The draft PRD defines four proposed vertical slices, seven outcomes, 90 stable requirements, and an explicit disposition for every research `GAP-*` item. The backlog decomposes that baseline into 12 epics and 48 stories with exact acceptance and test mappings.

The repository's Markdown/link/ID/checksum, API/event, reference-data, and test-traceability validators are the current static quality gates. They establish internal draft consistency; they do not constitute execution evidence, product approval, legal validation, or release authority.

The PRD is **not yet approved**. Decisions `DEC-030`–`DEC-040` remain `PROPOSED` or `OPEN`, the five architecture ADRs remain proposed, and test/evaluation cases remain draft and unexecuted. The preserved handover is historical input; only material decisions promoted to `APPROVED` entries in the [decision register](docs/00-context/decision-register.md) are repository constraints.

Application implementation has not started and remains blocked by the [readiness record](SPECIFICATION-READINESS.md).

## Working-folder location

`/Users/syedtabishmobin/Documents/Work/Techafide/Codex/Projects/DocumentManagement`

## Reading order

1. [`AGENTS.md`](AGENTS.md) and [`CODEX.md`](CODEX.md)
2. [`docs/00-context/decision-register.md`](docs/00-context/decision-register.md)
3. [`docs/01-product/README.md`](docs/01-product/README.md) and [`docs/01-product/02-phase-1-prd.md`](docs/01-product/02-phase-1-prd.md)
4. Applicable architecture, domain, data, security, document-intelligence, AI, API/event, UX, NFR, and test specifications
5. Applicable machine-readable reference data and accepted ADRs
6. Applicable backlog item and its acceptance criteria

For research or scope work, also read the [competitive analysis](docs/01-product/07-competitive-gap-analysis.md), its source register, and the [preserved handover](docs/00-context/Document_Management_Product_Chat_Handover.md).

The numbered folders under [`docs/`](docs/README.md) define navigation order, not authority. The complete source-of-truth hierarchy is normative in [`CODEX.md`](CODEX.md#source-of-truth-hierarchy); this README does not paraphrase or replace it.

## Top-level layout

| Path | Purpose |
|---|---|
| [`docs/`](docs/README.md) | Numbered Phase 1 specification packs and machine-readable contracts/reference fixtures |
| `src/` | Reserved for application source after the readiness gate opens; currently intentionally empty |
| [`scripts/`](scripts/README.md) | Standard-library validation gates for specifications and contracts |
| `artifacts/` | Ignored local delivery archives; publish distributable archives as GitHub release assets instead of committing them |

## Repository map

| Folder | Purpose | Current state |
|---|---|---|
| `docs/00-context` | Preserved historical handover, decisions, research provenance, and change history | Active decision/research foundation |
| `docs/01-product` | Vision, PRD, scope, use cases, personas, journeys, metrics, and competitor analysis | Draft product baseline complete; approval pending |
| `docs/02-architecture` | Solution/domain/data architecture, workspace model, NFRs, and ADRs | Draft pack complete; ADR acceptance pending |
| `docs/03-document-intelligence` | Taxonomy, ingestion, extraction, facts, graph, monitoring, impact, document health, and versioning | Draft pack complete |
| `docs/04-ai` | AI capabilities, RAG, output contracts, prompts/tools, guardrails, and evaluations | Draft pack complete; evaluation execution pending |
| `docs/05-api` | API standards, OpenAPI, events, and connector contracts | Draft pack complete; contracts validate |
| `docs/06-security` | Security, authorization, privacy, audit, and threat model | Draft pack complete; review/evidence pending |
| `docs/07-ux` | Information architecture, flows, screen specifications, design system, and accessibility | Draft pack complete; research/conformance evidence pending |
| `docs/08-engineering` | Stack decisions, repository shape, standards, resilience, local development, and testing standards | Draft pack complete; stack approval pending |
| `docs/09-devops` | Environments, delivery, infrastructure, secrets, rollback, recovery, and observability | Draft pack complete; targets/provider approval pending |
| `docs/10-backlog` | Epics, features, stories, acceptance criteria, dependencies, release slices, and traceability | Draft pack complete; no story authorized |
| `docs/11-reference-data` | Machine-readable document types, rules, jurisdictions, sources, roles, permissions, and statuses | Draft synthetic seed complete; runtime activation prohibited |
| `docs/12-testing` | Test strategy, AI/security/integration/E2E/performance scenarios and synthetic fixtures | Draft pack complete; cases not executed |

## Validation

Run every static repository gate from the root:

```sh
python3 scripts/validate-specifications.py
python3 scripts/validate-api-contracts.py
python3 scripts/validate-reference-data.py
python3 scripts/validate-test-traceability.py
```

See [`scripts/README.md`](scripts/README.md) for scope and limitations.

## Implementation gate

Application implementation remains prohibited until the [specification readiness gate](CODEX.md#specification-readiness-gate) is satisfied or the product owner explicitly authorizes a narrower prototype. A directory or draft file existing is not sufficient: contracts must be approved, traceable, testable, privacy-safe, and free of unresolved decisions that would make implementation unsafe or substantially disposable.
