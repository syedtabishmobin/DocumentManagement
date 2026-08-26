# ADR-ARCH-005 — Provider-Neutral Ports and Residency Policy Enforcement

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-005` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 26 August 2026 |
| Decision scope | External/provider capabilities, adapters, data placement, processing routes, portability, and Australian-residency enforcement |
| Decision owners | Architecture and security/privacy owners |
| Reviewers required | Product, legal/privacy, operations, data/AI/document intelligence, finance, testing |
| Supersedes | None |

## Context

`DEC-009` keeps vendor-specific choices behind abstractions. `DEC-022` requires a multi-tenant cloud service with strict workspace isolation and an Australian data-residency option. Identity, storage, malware scanning, OCR/AI/embedding/reranking, search/vector/graph, notifications, connectors, key management, observability, analytics, backups, and disaster recovery may involve different capabilities and regions. Direct provider coupling would make contracts disposable and could allow data to cross an unapproved processor or region during fallback, support, telemetry, or restore.

`DEC-040` remains open on which data classes/processors must stay in Australia and permitted exceptions. This ADR can propose an enforcement architecture without approving a provider, route, region, exception, or consent basis.

## Decision drivers and traceability

- Approved decisions: `DEC-007`, `DEC-009`, `DEC-020`–`DEC-022`.
- Requirements: `REQ-P1-ING-009`, `REQ-P1-MON-003`–`005`, `REQ-P1-AI-001`, `006`–`007`, `REQ-P1-TRUST-001`, `003`, `005`, `007`, `009`, `REQ-P1-CFG-001`–`004`.
- Architecture/domain: `ARCH-P1-001`–`005`, `013`–`018`, `032`–`045`; `DOM-P1-054`–`057`.
- Logical data: `DATA-P1-003`, `006`, `025`–`030`, `041`–`050`.
- Security/privacy: `SEC-P1-008`–`011`, `017`, `020`–`030`; `PRIV-P1-001`, `005`–`009`, `011`–`016`, `020`, `027`–`030`; `AUD-P1-023`, `027`–`030`.
- Threats/NFR: `THR-P1-016`–`020`, `024`, `026`–`029`; `NFR-P1-005`, `014`–`015`, `031`, `036`, `038`–`045`.

## Proposed decision

All infrastructure and external capabilities are consumed through versioned provider-neutral ports. Adapters must declare and prove capability, security, processing, residency, retention, deletion, failure, cost, and evidence properties before a route can be enabled. A policy decision selects an eligible route for each request/data role; unknown or ineligible routes block or use an expressly approved non-content fallback.

### 1. Define capability ports at the domain/application boundary

Ports express required behavior rather than provider APIs. Applicable port families include:

- authentication/session and recovery (recovery disabled pending `DEC-038`);
- artifact storage, scoped redemption, integrity, crypto/key/secret operations;
- malware/content-policy scanning and safe rendering;
- native extraction/OCR, AI capability, embedding/reranking, search, semantic/vector, and graph;
- governed-source retrieval and parser execution;
- import/action connectors and notification channels;
- durable event/workflow/scheduling;
- audit integrity, observability/analytics, export packaging;
- backup, restore, disaster recovery, and deletion acknowledgement.

Logical port names do not require separate deployables or products.

### 2. Version a capability manifest for each adapter/route

An adapter manifest declares:

- adapter and contract versions, capability IDs, supported schemas/types/sizes and limits;
- authentication/workload identity, scopes, endpoint/network policy, secrets/key use;
- accepted data classes, fields, purposes, subjects, and content restrictions;
- processing, storage, support, telemetry, backup, failover, and subcontractor regions;
- retention, training/reuse, deletion, disconnect, revocation, export, and incident behavior;
- timeout, retry, idempotency, rate/volume, partial/unknown, and reconciliation semantics;
- provenance/evidence returned, including processor/model/parser/tool versions;
- cost/usage units and budget controls; and
- required contract, security, privacy, residency, deletion, failure, portability, and evaluation evidence.

Missing, expired, incompatible, or unverified claims make the route ineligible.

### 3. Attach placement/processing policy to every data role

Every original, canonical record, derivative, index/cache, export, audit record, telemetry stream, support path, temporary copy, connector payload, backup, replica, and DR copy carries or resolves:

- classification and declared purpose;
- workspace/residency policy and jurisdiction pack;
- permitted processor/capability and regions;
- consent/basis and notice version where applicable;
- retention/deletion lineage and key/security profile; and
- policy/configuration version and effective time.

Derived and operational data are not exempt because they lack obvious raw content.

### 4. Select routes through a policy gate

Before data crosses a logical component, trust, processor, or residency boundary, the policy gate evaluates the current workspace, data class/fields, purpose, consent/basis, capability, adapter manifest, route regions, support/telemetry/backup implications, retention/deletion, security state, cost budget, and policy version.

The result is a bounded `ALLOW`, `DENY`, or approved alternate/manual/degraded route. Resource authorization alone never implies processor/residency eligibility. Provider availability or lower cost cannot broaden purpose or route.

### 5. Enforce placement and record evidence

Eligible adapters receive only the minimum authorized payload through scoped workload credentials and egress controls. Each call/copy records privacy-safe route/placement decision ID, adapter/contract version, data-class/purpose, region policy, request/outcome, usage/cost, and deletion lineage without copying content into telemetry/audit.

Storage/replication/backup/restore/projection generations expose placement evidence that can be reconciled against the active matrix. Failover is a new route decision, not an automatic exemption.

### 6. Require conformance before enablement and on material change

Every adapter and route passes common contract/security/privacy/residency/deletion/failure/portability tests before activation. Material provider, region, subcontractor, model, API, retention, training/reuse, support, failover, pricing, or capability change expires or re-runs affected evidence. Feature configuration references capability IDs, not provider names.

### 7. Keep canonical records portable

Provider identifiers remain namespaced external mappings. Canonical IDs, domain states, facts, evidence/provenance, events, approvals, actions, configuration, and export schemas remain provider-neutral. A replacement adapter can replay/rebuild from retained canonical records and versioned contracts without re-keying the domain.

## Explicit non-decisions

This ADR does not select:

- any cloud, region, identity, storage, database, search, graph, vector, queue, key, scanner, OCR, AI, notification, connector, analytics, observability, backup, or DR provider/product;
- a deployment topology, service count, network product, framework, language, or infrastructure tool;
- Australian-residency matrix contents, cross-border basis/consent, or failover exception;
- data-processing agreements, legal conclusions, retention durations, or customer terms;
- a multi-provider requirement for every capability; or
- the initial connector/source/model/channel order.

## Alternatives considered

| Alternative | Benefit | Why not proposed |
|---|---|---|
| Bind core domain directly to chosen provider SDKs | Fast initial integration | Violates `DEC-009`, leaks provider IDs/semantics into truth, and makes residency/deletion portability inconsistent. |
| One generic lowest-common-denominator interface | Few interfaces | Hides capability-specific evidence, failure, deletion, provenance, security, and cost semantics. |
| Contract interfaces without runtime policy gate | Compile-time separation | Cannot enforce workspace/data-class/purpose/region/consent changes or failover safely. |
| Route globally, disclose/obtain consent afterward | High availability | Processing has already occurred; violates purpose/residency and cannot be undone. |
| Treat provider contractual region as sufficient | Simple assurance | Does not cover telemetry, support, subcontractors, backups, failover, or actual technical placement. |
| Build every capability in-house | Maximum direct control | Expands scope/cost and still requires ports, security, deletion, and residency contracts. |
| Require two active providers for every capability | Portability/failover | May increase cost, data exposure, inconsistency, and residency complexity before need is proven. |

## Consequences

### Positive

- Vendor choice and replacement do not redefine canonical domain contracts.
- Residency, purpose, consent, deletion, and cost are enforceable per route rather than prose promises.
- Adapter failure and fallback cannot silently cross an unapproved boundary.
- Capability-specific conformance provides objective provider-selection evidence.
- Australia-first deployment can coexist with jurisdiction-neutral core identifiers.

### Costs and risks

- Port/manifest/policy/test design adds upfront work and may expose provider capability gaps.
- Some providers may not support required region, deletion, provenance, idempotency, or retention evidence.
- Abstractions can leak if they mirror one provider or become too generic; contract review is ongoing.
- Blocking unknown routes reduces availability; safe manual/degraded paths need product design.
- Cost/usage normalization and provider-change evidence require operational governance.

## Validation before acceptance

Acceptance requires:

1. contract tests using at least a deterministic fake and one non-provider-specific reference adapter per enabled port;
2. capability/manifest schema compatibility and unknown-version failure tests;
3. field/payload minimization, scoped credential, egress/SSRF, timeout/retry/idempotency and partial-result tests;
4. prompt/content injection and structured-output/evidence tests for document/AI ports;
5. placement, cross-border deny, support, telemetry, backup, restore, failover, and expired-exception tests;
6. consent withdrawal, disconnect, deletion acknowledgement, retained-copy, late-callback/resync tests;
7. provider outage/route-ineligible behavior with no silent cross-region fallback;
8. canonical export/rebuild/replay through replacement adapters without ID or provenance loss;
9. cost attribution/budget and resource-exhaustion behavior meeting `NFR-P1-044`–`045`; and
10. threat/control mapping and accepted residual risk for every enabled adapter/route.

## Open-decision fences

- `DEC-031`: no private inbound-email/cloud connector adapter is enabled until the slice and contract are approved.
- `DEC-035`: no launch source/document/schema/processor profile is selected.
- `DEC-036`: suspected clinical content cannot be routed to ordinary processors while final handling is open.
- `DEC-037`: external notification channel enablement remains conditional and channel-neutral.
- `DEC-038`: recovery adapter/route remains disabled.
- `DEC-039`: retention/deletion/backups expose states but no invented durations.
- `DEC-040`: every Australian-residency matrix field remains `OPEN`; no external, failover, support, analytics, AI/OCR, or backup route is presumed eligible.

## Revisit and supersession triggers

Revisit when a provider/capability is selected; `DEC-040` closes; a provider changes region/subprocessor/API/retention/training/failover terms; portability tests fail; an incident reveals policy/egress drift; approved availability/cost targets require multi-route operation; or Phase 2 introduces organisation-specific residency/key/connector requirements.

Until explicitly accepted, this ADR does not authorize a provider, adapter, region, processing basis, cross-border exception, or fallback route.
