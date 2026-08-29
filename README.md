# DocumentManagement

This repository is the source of truth for an AI-native personal and family document intelligence and change-monitoring product, designed with explicit enterprise extension points.

## Current status

The complete Phase 1 specification repository is the controlled build-baseline candidate. It includes the product, architecture, document-intelligence, AI, API/event, security, UX, engineering, operations, backlog, reference-data, and testing packs. The PRD defines four vertical slices, seven outcomes, 101 stable requirements, and an explicit disposition for every research `GAP-*` item. The backlog decomposes that candidate into 12 epics, 31 features, and 49 stories with 98 exact story acceptance criteria and 104 planned tests. Its status remains `IN_REVIEW` until exact-candidate independent approval.

The repository's Markdown/link/ID/checksum, API/event, reference-data, test-traceability, type, unit, and build validators are quality gates. Static success does not constitute legal validation or production release authority.

The product owner approved full Phase 1 implementation under `DEC-041` and the production-oriented Azure development program under `DEC-054`–`055`. The default local profile and deployed Azure development preview accept synthetic data only and keep external connectors, notifications, and hosted AI disabled. Production deployment and real personal-data processing remain gated by the [readiness record](SPECIFICATION-READINESS.md).

The current Azure development website is [Doculyra dev](https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io). It is a synthetic preview, not a production service. The evidence-based [personal/family implementation status](docs/10-backlog/05-personal-family-implementation-status.md) identifies the remaining work across all 49 stories, including the public-entry story.

## Run locally

From the repository root:

```sh
chmod +x scripts/local-app.sh
./scripts/local-app.sh
```

Open `http://127.0.0.1:4173`. Local state and uploaded files are written beneath ignored `local-data/`. The web client talks only to the API bound to `127.0.0.1`; no cloud AI key is required.

The first run now starts at account registration and a two-step local privacy/workspace setup. Choose a personal or family workspace, add the people whose records you manage, and then add documents through drag-and-drop, multi-file/folder selection, device camera/scan, or a manual record. Every document must be assigned to one or more people. Google, Apple, Microsoft, passkey, private-email, Gmail, Google Drive, OneDrive, Dropbox, and Box ports are visible but deliberately disconnected until their adapters, credentials, explicit consent, security controls, and conformance evidence are complete.

## External integration status

The user interface includes purpose- and permission-specific consent before each external connection. Microsoft, Google, Dropbox, Box, and Azure Communication Services development registrations have been prepared, but the application adapters are not implemented or enabled. The detailed, secret-free setup and verification record is [`OPS-PROVIDER-001`](docs/09-devops/08-external-provider-setup.md).

Current provider-console actions are limited to:

- updating Google Branding to the deployed `/privacy` and `/terms` pages, adding the logo, deciding whether restricted `drive.readonly` is justified instead of selected-file `drive.file`, and adding `gmail.readonly` only when the Gmail adapter is ready; the three identity scopes and development test user are configured;
- disabling Dropbox implicit/public-client grant if it remains enabled, confirming its least-permissive content-access mode, and rotating the reviewed app secret; the unnecessary OIDC scopes have been removed;
- retaining the verified Box read-only scope and production activation gate.

Remaining owner-controlled launch inputs include:

- production/staging domains, customer-facing contact email, company/legal name, privacy URL and terms URL;
- Microsoft Entra External ID tenant/application configuration for production customer identity;
- an Apple Developer team, primary App ID, Services ID, verified domain, key ID and Sign in with Apple private key;
- a private inbound-email domain/provider and verified webhook secret;
- an approved SMS provider/number if SMS is retained, plus production sender identities and recipient controls; and
- implementation and conformance evidence for the approved secure invitation design in `DEC-046`: a short-lived single-use link plus optional one-time code, followed by invitee-created password/passkey, instead of transmitting a reusable temporary password.

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
| `docs/01-product` | Vision, PRD, scope, use cases, personas, journeys, metrics, and competitor analysis | Approved PRD baseline; detailed release evidence pending |
| `docs/02-architecture` | Solution/domain/data architecture, workspace model, NFRs, and ADRs | Architecture baseline and Azure/client decisions approved; implementation evidence incomplete |
| `docs/03-document-intelligence` | Taxonomy, ingestion, extraction, facts, graph, monitoring, impact, document health, and versioning | Draft pack complete |
| `docs/04-ai` | AI capabilities, RAG, output contracts, prompts/tools, guardrails, and evaluations | Draft pack complete; evaluation execution pending |
| `docs/05-api` | API standards, OpenAPI, events, and connector contracts | Draft pack complete; contracts validate |
| `docs/06-security` | Security, authorization, privacy, audit, and threat model | Draft pack complete; review/evidence pending |
| `docs/07-ux` | Information architecture, flows, screen specifications, design system, and accessibility | Draft pack complete; research/conformance evidence pending |
| `docs/08-engineering` | Stack decisions, repository shape, standards, resilience, local development, and testing standards | React/TypeScript, Flutter, and Azure implementation active |
| `docs/09-devops` | Environments, delivery, infrastructure, secrets, providers, rollback, recovery, and observability | Azure dev foundations and synthetic app deployed; production and provider activation gated |
| `docs/10-backlog` | Epics, features, stories, acceptance criteria, dependencies, release slices, traceability, and implementation status | 12 epics, 31 features and all 49 stories reconciled in the controlled candidate; 0 complete against full gates |
| `docs/11-reference-data` | Machine-readable document types, rules, jurisdictions, sources, roles, permissions, and statuses | Draft synthetic seed complete; runtime activation prohibited |
| `docs/12-testing` | Test strategy, AI/security/integration/E2E/performance scenarios and synthetic fixtures | Static/unit/build evidence exists; full mapped release suites remain incomplete |

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
