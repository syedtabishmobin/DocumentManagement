# Phase 1 Specification Packs

| Field | Value |
|---|---|
| Document ID | `GOV-DOCS-001` |
| Status | `Active index` |
| Updated | 29 August 2026 |

The numbered directories preserve the specification reading order while keeping repository governance, validation commands, and future application source clearly separated. Authority remains defined by [`CODEX.md`](../CODEX.md), not by directory order.

| Pack | Index |
|---|---|
| Context and decisions | [`00-context/`](00-context/decision-register.md) |
| Product | [`01-product/`](01-product/README.md) |
| Architecture | [`02-architecture/`](02-architecture/README.md) |
| Document intelligence | [`03-document-intelligence/`](03-document-intelligence/README.md) |
| AI | [`04-ai/`](04-ai/README.md) |
| API and events | [`05-api/`](05-api/README.md) |
| Security and privacy | [`06-security/`](06-security/README.md) |
| UX and accessibility | [`07-ux/`](07-ux/README.md) |
| Engineering | [`08-engineering/`](08-engineering/README.md) |
| Operations | [`09-devops/`](09-devops/README.md) |
| Backlog and detailed traceability | [`10-backlog/`](10-backlog/README.md) |
| Reference data | [`11-reference-data/`](11-reference-data/README.md) |
| Testing and evaluation | [`12-testing/`](12-testing/README.md) |

The specification readiness gate is open for the complete Phase 1 personal/family implementation under `DEC-041` and `DEC-054`. Application source now lives under [`src/`](../src/README.md); Azure `dev` hosts a synthetic preview. Production, real customer data, external-provider activation, public DNS, and app-store publication remain separately gated. See the [current implementation status](10-backlog/05-personal-family-implementation-status.md).
