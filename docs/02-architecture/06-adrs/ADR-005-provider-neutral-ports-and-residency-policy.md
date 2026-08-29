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
| Later refinement | `DEC-049`, `DEC-050`, `DEC-053`, `DEC-055`, and `ADR-ARCH-007`–`011` select named Phase 1 adapters/routes while preserving this policy boundary |

## Context

`DEC-009` keeps vendor-specific choices behind abstractions. `DEC-022` requires a multi-tenant cloud service with strict workspace isolation and an Australian data-residency option. Identity, storage, malware scanning, OCR/AI/embedding/reranking, search/vector/graph, notifications, connectors, key management, observability, analytics, backups, and disaster recovery may involve different capabilities and regions. Direct provider coupling would make contracts disposable and could allow data to cross an unapproved processor or region during fallback, support, telemetry, or restore.

At this ADR's original acceptance, `DEC-040` preserved a synthetic local-only route and deferred the production provider/placement choice. Approved `DEC-049` and `ADR-ARCH-007` now select Azure, Australia East as primary, and only explicitly inventoried Australian paired-region roles. Exact data-role processors, support, telemetry, backup, failover and exception eligibility remain release evidence; an unspecified route is blocked rather than treated as an open invitation to choose a provider in code.

## Decision drivers and traceability

- Approved decisions: `DEC-007`, `DEC-009`, `DEC-020`–`DEC-022`, `DEC-031`–`040`, `DEC-045`, `DEC-049`, `DEC-050`, `DEC-053`–`055`, and `DEC-P1-056`.
- Requirements: `REQ-P1-ING-009`, `REQ-P1-MON-003`–`005`, `REQ-P1-AI-001`, `006`–`007`, `REQ-P1-TRUST-001`, `003`, `005`, `007`, `009`, `REQ-P1-CFG-001`–`004`.
- Architecture/domain: `ARCH-P1-001`–`005`, `013`–`018`, `032`–`045`; `DOM-P1-054`–`057`.
- Logical data: `DATA-P1-003`, `006`, `025`–`030`, `041`–`050`.
- Security/privacy: `SEC-P1-008`–`011`, `017`, `020`–`030`; `PRIV-P1-001`, `005`–`009`, `011`–`016`, `020`, `027`–`030`; `AUD-P1-023`, `027`–`030`.
- Threats/NFR: `THR-P1-016`–`020`, `024`, `026`–`029`; `NFR-P1-005`, `014`–`015`, `031`, `036`, `038`–`045`.

## Decision

All infrastructure and external capabilities are consumed through versioned provider-neutral ports. Adapters must declare and prove capability, security, processing, residency, retention, deletion, failure, cost, and evidence properties before a route can be enabled. A policy decision selects an eligible route for each request/data role; unknown or ineligible routes block or use an expressly approved non-content fallback.

### 1. Define capability ports at the domain/application boundary

Ports express required behavior rather than provider APIs. Applicable port families include:

- authentication/session and recovery (local recovery unavailable under approved `DEC-038`; production recovery separately assurance-gated);
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

## Explicit non-decisions and later selections

At original acceptance this ADR deliberately did not select a cloud, region, identity, storage, database, queue, key, framework, language, or deployment product. Later approved decisions and `ADR-ARCH-006`–`011` select Azure/Bicep, React/NestJS/Flutter, PostgreSQL, Blob, Service Bus, Key Vault/Monitor, customer-controlled encryption, 30-day document deletion, and device-local RAG for their named roles. Those selections do not weaken this provider-neutral port and policy-gate contract.

The following remain non-decisions of this ADR:

- exact production Azure subscription, SKUs, service count, network topology, capacity, backup/failover and support operation;
- search, graph and vector physical products where a later accepted contract has not selected one;
- external scanner/OCR, hosted/private-compute AI, customer-facing notification, connector, analytics or other provider activation;
- per-data-role processor/region/support/telemetry/backup/DR eligibility, cross-border basis, consent or exception beyond the approved Australian route baseline;
- data-processing agreements, legal conclusions, account/workspace retention durations, and customer terms;
- a multi-provider requirement for every capability; and
- exact external identity/connector/channel registrations, credentials, minimal scopes, order and release timing.

## Alternatives considered

| Alternative | Benefit | Why not selected |
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

## Validation and conformance obligations

Conformance requires:

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

## Approved decision and activation fences

- `DEC-031`, `DEC-045`, and `DEC-055`: named connector adapters may be implemented disabled-first; live routes require exact consent, credentials, minimal scopes, deletion/revocation, processing placement, and conformance evidence.
- `DEC-035`: synthetic Australian-first packs are approved for development; no public launch coverage is inferred without a reviewed production package.
- `DEC-036`: suspected clinical content uses approved `POLICY_HOLD` and cannot be routed to ordinary processors; deletion or explicit safe reclassification are the only permitted exits.
- `DEC-037`: in-app notifications are required; customer-facing external channels remain consent/configuration/conformance-gated and are distinct from framework Product Authority email.
- `DEC-038`: local recovery/owner-transfer success routes are unavailable; production recovery remains disabled until separately assurance-approved.
- `DEC-039` is historical local behavior; `DEC-053` governs production document Trash/restore/purge. Account/workspace retention and lawful exceptions remain separate release contracts.
- `DEC-040`'s production-provider non-selection is superseded by `DEC-049`: Azure Australia East and explicitly inventoried Australian paired-region roles are the baseline, but no unverified external, failover, support, analytics, AI/OCR, notification, backup or DR route is presumed eligible.
- `DEC-050`/`055`: plaintext document processing remains on an authorized customer device by default; no provider fallback is inferred.
- `DEC-P1-056`: no Phase 1 route may turn a managed-dependant attempt into independent access or transfer credentials, keys, grants, inherited/delegated authority, ownership, consent, export authority, or resources. The fail-closed fence is provider-neutral; richer routes require a later governed change.

## Revisit and supersession triggers

Revisit when a selected provider/capability or approved route changes region/subprocessor/API/retention/training/failover terms; portability tests fail; an incident reveals policy/egress drift; approved availability/cost targets require multi-route operation; or Phase 2 introduces organisation-specific residency/key/connector requirements.

Acceptance of this ADR establishes the provider-neutral port, manifest and policy-gate requirements. Provider and region authority comes only from later approved decisions/ADRs, and no adapter, processing basis, cross-border exception or fallback route activates without its exact conformance and release evidence.
