# ADR-ARCH-007 — Azure Environments and Managed Production Services

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-007` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 28 August 2026 |
| Decision scope | Cloud provider, environment topology, Australian placement, managed services, infrastructure as code, and subscription promotion |
| Decision owners | Product owner, architecture, security/privacy, and operations |
| Supersedes | The provider non-selection in `DEC-022`, `DEC-040`, `ADR-ARCH-005`, and `ENG-STACK-001` for the named Azure adapters only |

## Context

`DEC-049` selects Azure while preserving provider-neutral domain ports. The product owner requires three isolated environments, authorizes `dev` and `stage` in the current subscription, and will create a separate production subscription later. Production must not depend on manually moving a fragile set of resources from a personal subscription.

## Decision drivers and traceability

- Decisions: `DEC-009`, `DEC-020`, `DEC-049`, `DEC-051`, `DEC-054`.
- Requirements: `REQ-P1-TRUST-001`–`009`, `REQ-P1-CFG-001`–`005`.
- Architecture and operations: `ADR-ARCH-004`–`005`, `OPS-ENV-001`, `OPS-IAC-001`, `OPS-SEC-001`, `OPS-DR-001`.

## Decision

### 1. Environment and subscription boundary

- `dev`, `stage`, and `prod` are separately deployable Bicep stacks with distinct resource groups, identities, networks, data stores, secrets, configuration, telemetry, budgets, and DNS names.
- `dev` and `stage` may be provisioned in the current subscription. They accept synthetic and explicitly governed test data only.
- `prod` is fully parameterized but remains unprovisioned until a production subscription owned by the product/business exists.
- Production is recreated from the same immutable release and Bicep modules. Subscription migration is an export/import and controlled cutover exercise, not a requirement that every live Azure resource support an in-place move.

### 2. Approved Azure adapter set

The initial production topology uses:

- Azure Front Door and Web Application Firewall for the production edge;
- Azure Container Apps for the React web application, NestJS API, asynchronous workers, and scheduled jobs;
- Azure Container Registry for signed container artifacts;
- Azure Database for PostgreSQL Flexible Server for canonical and workflow records;
- Azure Blob Storage for encrypted immutable document artifacts;
- Azure Service Bus for durable commands, events, retries, and dead-letter handling;
- Azure Key Vault for infrastructure secrets, certificates, and service keys, never customer document plaintext keys;
- Microsoft Entra External ID for customer authentication when its release gate opens; and
- Azure Monitor, Application Insights, Log Analytics, budgets, alerts, and Defender recommendations with content-redacted telemetry.

Products remain adapters to `ADR-ARCH-005`; provider-native identifiers do not become domain truth.

### 3. Placement and resilience

The primary production region is Australia East. Only explicitly inventoried Australian paired-region routes may use Australia Southeast. Every artifact, database, queue, log, support, backup, identity, notification, and failover route must have placement evidence before production activation. Availability cannot create an undeclared cross-border fallback.

### 4. Infrastructure-as-code and promotion

Bicep modules, checked into `infra/`, define resources, policy, diagnostic settings, role assignments, locks, private networking, lifecycle configuration, budgets, and outputs. Environment parameter files contain safe configuration only. Secrets enter through approved deployment identities and Key Vault references.

CI performs format/lint, validation, What-If, policy/security checks, and artifact provenance before a separately authorized deployment. The same application artifact is promoted; it is not rebuilt differently for production.

### 5. Cost-aware fidelity

Development may scale to zero and use non-HA data services. Stage mirrors the logical security and integration boundaries but may use smaller SKUs. Production uses approved availability and recovery settings. A cheaper environment must never weaken tenant isolation, encryption protocol, authorization behavior, deletion semantics, or telemetry redaction.

## Explicit non-decisions

This ADR does not provision production, authorize customer data in non-production, approve public DNS, activate external identity/connectors, select exact paid SKUs, or claim legal/compliance certification. Those require the release evidence and owner inputs in `DEC-054`.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| Move all resources from the personal subscription later | Potentially fewer migration steps | Move support and identity/network dependencies vary; it creates avoidable production coupling. |
| Build custom infrastructure services | Maximum implementation control | Duplicates managed capabilities and expands security/operations risk. |
| One shared environment | Lowest cost | Violates isolation, release, test-data, and operational safety requirements. |
| Bind domain code to Azure SDK objects | Fastest adapter implementation | Violates portability and makes contracts/provider migration disposable. |

## Consequences

- Production can be recreated in a new subscription with predictable configuration and evidence.
- Azure provides commodity infrastructure capabilities while Doculyra retains portable domain contracts.
- Three environments and private production controls add cost and operational work.
- Cross-subscription cutover still requires tested encrypted-data and database migration procedures.

## Validation before release

1. Bicep build/lint and What-If pass for all environments.
2. No secret or customer content appears in templates, state, outputs, logs, or telemetry.
3. Cross-workspace, private-network, managed-identity, least-privilege, egress, backup, restore, and deletion tests pass.
4. A synthetic stage-to-new-subscription migration exercise proves artifact integrity, database consistency, deletion fences, key references, and rollback.
5. Cost budgets and stop/scale controls are active before shared Azure testing.

## Open-decision fences

Exact production SKUs, public domain, notification senders, external identity applications, store accounts, and production subscription identifiers remain release inputs. Missing inputs keep only the affected route disabled.

## Revisit and supersession triggers

Revisit when Azure cannot meet an approved residency/control objective, costs materially exceed forecast, a managed service becomes unavailable/retired, a second jurisdiction launches, or production scale requires a different topology.
