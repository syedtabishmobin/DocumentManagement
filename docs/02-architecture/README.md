# Architecture Specification Index

| Field | Value |
|---|---|
| Document ID | `ARCH-IDX-001` |
| Status | Active navigation and implementation-contract index; accepted ADRs and remaining fences are explicit |
| Updated | 30 August 2026 |

## Reading order

1. [`ARCH-SOL-001` — Solution Architecture](01-solution-architecture.md)
2. [`ARCH-DOM-001` — Domain Model](02-domain-model.md)
3. [`ARCH-DATA-001` — Logical Data Model](03-logical-data-model.md)
4. [`ARCH-WSP-001` — Workspace, Family, and Membership Model](04-workspace-family-membership-model.md)
5. [`ARCH-NFR-001` — Non-Functional Requirements](05-non-functional-requirements.md)
6. [`ARCH-ADR-INDEX-001` — Architecture Decision Records](06-adrs/README.md)

## Rule ownership

| Namespace | Owner | Coverage |
|---|---|---|
| `ARCH-P1-*` | `ARCH-SOL-001` | Logical components, ports, zones, consistency, flows, failure behavior, and extension points |
| `DOM-P1-*` | `ARCH-DOM-001` | Aggregates, entities, value objects, identities, lifecycle ownership, and invariants |
| `DATA-P1-*` | `ARCH-DATA-001` | Logical records, keys, temporal constraints, scope, lineage, projections, and migration implications |
| `WSP-P1-*` | `ARCH-WSP-001` | Identity, subject, relationship, membership, grant, dependant, guest, and continuity boundaries |
| `NFR-P1-*` | `ARCH-NFR-001` | Measurable provisional service, security, accessibility, recovery, freshness, and cost targets |
| `ADR-ARCH-*` | `06-adrs/` | Accepted cross-cutting architecture decisions and their explicit release fences |

`ADR-ARCH-001`–`011` are accepted for Phase 1 implementation. Together with approved decisions they select the durable consistency model, Azure/Bicep environment and managed-service baseline, PostgreSQL canonical persistence, React/NestJS/Flutter stack, customer-controlled client encryption, 30-day document Trash/purge contract, and device-local RAG boundary. Provider-neutral ports remain mandatory, and exact SKUs, production activation, external provider credentials/routes, customer-facing external channels, and other named release inputs remain gated where their ADRs say so.

`DEC-P1-056` is approved in [GitHub Issue #33](https://github.com/syedtabishmobin/DocumentManagement/issues/33#issuecomment-5463877570): `WSP-P1-037`–`039` preserve stable subject history and implement an explicit, revisioned, independently tested fail-closed Phase 1 fence. Independent access-transfer/delegation semantics are a later governed capability. Numeric NFR targets remain approval-labelled and cannot be treated as contractual SLOs until approved.

## Handoff boundary

These documents define provider-neutral architecture and invariants. Detailed security controls belong to `docs/06-security/`; document semantics to `docs/03-document-intelligence/`; AI contracts to `docs/04-ai/`; API/events to `docs/05-api/`; and physical stack/provider selection to accepted ADRs and the engineering/operations packs. A lower-level artifact must report, not silently resolve, any conflict.
