# DocumentManagement

This repository is the source of truth for an AI-native personal and family document intelligence and change-monitoring product, designed with explicit enterprise extension points.

## Current status

The complete Phase 1 specification repository is the approved implementation baseline. It includes the product, architecture, document-intelligence, AI, API/event, security, UX, engineering, operations, backlog, reference-data, and testing packs. The PRD defines four vertical slices, seven outcomes, 90 stable requirements, and an explicit disposition for every research `GAP-*` item. The backlog decomposes that baseline into 12 epics and 48 stories with exact acceptance and test mappings.

The repository's Markdown/link/ID/checksum, API/event, reference-data, test-traceability, type, unit, and build validators are quality gates. Static success does not constitute legal validation or production release authority.

The product owner approved full Phase 1 implementation under `DEC-041`. The default application profile is local-only, uses synthetic data and deterministic local assistance, and disables external connectors, notifications, and cloud AI. Production deployment and real personal-data processing remain gated by the [readiness record](SPECIFICATION-READINESS.md).

## Run locally

From the repository root:

```sh
chmod +x scripts/local-app.sh
./scripts/local-app.sh
```

Open `http://127.0.0.1:4173`. Local state and uploaded files are written beneath ignored `local-data/`. The web client talks only to the API bound to `127.0.0.1`; no cloud AI key is required.

The first run now starts at account registration and a two-step local privacy/workspace setup. Choose a personal or family workspace, add the people whose records you manage, and then add documents through drag-and-drop, multi-file/folder selection, device camera/scan, or a manual record. Every document must be assigned to one or more people. Google, Apple, Microsoft, passkey, private-email, Gmail, Google Drive, OneDrive, Dropbox, and Box ports are visible but deliberately disconnected until production credentials and explicit consent are configured.

## External integration prerequisites

The user interface includes purpose- and permission-specific consent before each external connection. Live adapters cannot be completed safely from invented credentials. The product owner must provide or approve:

- the production/staging domain, exact callback base URL, customer-facing contact email, company/legal name, privacy URL and terms URL;
- a managed identity choice (Auth0 is the current recommendation) and its tenant/domain, client ID, client secret and API audience;
- Google Cloud OAuth credentials with approved origins/redirects and separately approved Gmail/Drive scopes;
- an Apple Developer team, primary App ID, Services ID, verified domain, key ID and Sign in with Apple private key;
- a Microsoft Entra app registration, supported account/tenant choice, client ID/secret and delegated Microsoft Graph scopes;
- Dropbox and Box developer applications with exact redirect URLs and least-privileged read scopes;
- a private inbound-email domain/provider and verified webhook secret;
- email and SMS delivery providers, verified sender identities and test-only recipient routing; and
- approval of the proposed secure invitation design in `DEC-046`: a short-lived single-use link plus optional one-time code, followed by invitee-created password/passkey, instead of transmitting a reusable temporary password.

Configuration names are documented without secrets in [`.env.example`](.env.example). Real secrets belong in an environment-specific secret store and must never be committed.

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
| [`src/`](src/README.md) | Phase 1 web, API, domain, and shared-contract source |
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

## Implementation authority

The product owner authorized full Phase 1 implementation in `DEC-041`. `DEC-043` corrects the onboarding and acquisition baseline to require consumer-parity surfaces while preserving the no-silent-transfer local profile. Production deployment, real personal data, live external identities, connectors, messages, and hosted AI remain subject to their documented readiness gates.
