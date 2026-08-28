# Phase 1 Infrastructure-as-Code Standard

| Field | Value |
|---|---|
| Document ID | `OPS-IAC-001` |
| Version | `0.2` |
| Status | **APPROVED IMPLEMENTATION STANDARD under `DEC-049` and `ADR-ARCH-007`** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `DEC-009`, `DEC-049`–`054`, `ADR-ARCH-005`, `ADR-ARCH-007`–`010`, `ARCH-P1-001`–`005`, `013`–`018`, `031`–`045`, `SEC-P1-028`–`030` |

## 1. Purpose and boundary

This standard defines declarative infrastructure intent, protected state, change planning, drift control, residency evidence, and lifecycle. `ADR-ARCH-007` selects Azure and Bicep for the named Phase 1 adapters; provider-neutral capability records and domain boundaries remain authoritative.

Logical architecture components do not automatically imply separate deployables. Bicep modules implement the accepted environment/topology decision and MUST NOT invent an additional service, public route, region, processor, recovery route, retention period, or data placement outside `DEC-049`–`054`.

## 2. Declarative resource contract

Every managed resource or logical resource group has a stable provider-neutral record containing: purpose/capability and owner; environment; trust zone; data role/classification; workspace/reference scope; processing/residency policy reference; retention/deletion lineage; availability/recovery class; encryption/key-domain reference; network/egress class; workload identity; audit/telemetry obligations; backup/restore behavior; dependencies; desired configuration version; provider-external mapping if later selected; drift/health state; and lifecycle/retirement policy.

The record contains references and eligibility state, not raw secrets, keys, content, provider payloads, or an invented region decision.

## 3. Change lifecycle

1. A reviewed change produces a deterministic plan against an explicit environment and current state generation.
2. Policy checks classify create/change/replace/destroy, data movement, route/region, identity/privilege, encryption/key, network/egress, backup, deletion, audit, cost, and availability consequences.
3. Applicable CI/CD, security, privacy, residency, migration, compatibility, and recovery gates run before approval.
4. A least-privileged deployment identity applies only the approved plan or semantically identical checked action.
5. Post-apply reconciliation proves desired/observed state, route, control, telemetry, backup, and service gates; partial/unknown outcomes enter repair.

## 4. Stable infrastructure rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-IAC-P1-001` | All persistent or security/reliability-relevant infrastructure MUST be represented by reviewed versioned declarative intent or an explicitly governed import/exception record; undocumented console/manual state is not authoritative. |
| `OPS-IAC-P1-002` | Infrastructure definitions MUST express provider-neutral capability and control requirements. Provider mappings, if later approved, remain replaceable adapters and MUST NOT redefine canonical domain, API, event, identity, or data-role semantics. |
| `OPS-IAC-P1-003` | Logical component diagrams MUST NOT be translated automatically into services, accounts, networks, databases, clusters, or regions; topology requires an accepted architecture decision and cost/security/operability evidence. |
| `OPS-IAC-P1-004` | Each resource MUST carry or resolve environment, owner, purpose, trust zone, data role/class, processing/residency, retention/deletion, key, audit/telemetry, backup/recovery, and lifecycle attributes before creation. |
| `OPS-IAC-P1-005` | Infrastructure state MUST be encrypted, integrity-protected, access-controlled, versioned, backed up according to its approved class, and audited; state output MUST NOT contain production secrets, raw key material, access tokens, or household content. |
| `OPS-IAC-P1-006` | State access and apply authority MUST use distinct least-privileged workload identities separated by environment; local developer credentials MUST NOT read or mutate production infrastructure state. |
| `OPS-IAC-P1-007` | Plans MUST bind exact source revision, modules/providers if any, input/configuration versions, environment/state generation, policy versions, and expected resource changes; stale or materially changed plans require regeneration and review. |
| `OPS-IAC-P1-008` | Plan review MUST surface replacements/destruction, data copy/movement, privilege growth, public exposure, egress, route/region changes, encryption/key changes, backup/retention changes, observability gaps, availability impact, cost change, and irreversible behavior. |
| `OPS-IAC-P1-009` | Apply MUST be non-interactive, attributable, constrained to the approved environment/scope, and incapable of accepting untrusted client, document, model, event, or provider text as infrastructure authority. |
| `OPS-IAC-P1-010` | Production apply approval, deployment execution, state administration, key/secret administration, and security/policy review MUST be separated according to consequence; one standing identity MUST NOT hold every duty. |
| `OPS-IAC-P1-011` | Resource naming, tags/labels, external provider IDs, IPs, endpoints, or content hashes MUST NOT become canonical platform identities or authorization boundaries. |
| `OPS-IAC-P1-012` | Network and egress intent MUST be default-deny, purpose/capability scoped, environment specific, and testable. An outage or lower-cost route MUST NOT introduce an undeclared processor, destination, support path, or cross-region fallback. |
| `OPS-IAC-P1-013` | Public exposure, inbound callbacks, administrative entry, inter-zone paths, and artifact redemption MUST be explicit, minimized, authenticated, authorized, rate/abuse controlled, observable, and linked to their owning API/adapter contracts. |
| `OPS-IAC-P1-014` | Placement, replication, telemetry, support, backup, and disaster-recovery route fields MUST be policy inputs. Azure Australia East is primary and Australia Southeast is eligible only for explicitly declared paired-region roles; unknown or other routes block creation/activation. |
| `OPS-IAC-P1-015` | Storage and processing resources MUST declare encryption/key domain, immutability or append-only needs, deletion acknowledgement behavior, backup class, restore role, and rebuildability; derived stores cannot be treated as authoritative backups. |
| `OPS-IAC-P1-016` | Destruction, replacement, import, move, state repair, and resource adoption MUST check data ownership, current deletion fences/tombstones, audit, backup, dependency, migration, and service consequences before action. |
| `OPS-IAC-P1-017` | A resource destroy does not prove data deletion, connector erasure, backup expiry, audit minimization, or key destruction. `DeletionCase` per-role acknowledgements remain authoritative and document lifecycle evidence MUST satisfy the 30-day recovery/purge contract in `DEC-053`. |
| `OPS-IAC-P1-018` | Infrastructure drift MUST be reconciled continuously or at an approved cadence against declared intent; security, identity, residency, encryption, deletion, backup, exposure, or recovery drift is a control finding and blocks affected promotion/serviceability. |
| `OPS-IAC-P1-019` | Automatic drift correction MAY operate only for pre-approved reversible changes with bounded blast radius and no data, privilege, route, key, deletion, or serviceability consequence; other drift requires reviewed repair. |
| `OPS-IAC-P1-020` | Manual emergency change is not a bypass: it requires incident authority, exact scope, independent review where feasible, privacy-safe audit, bounded credentials, verification, and prompt reconciliation back into declarative intent. No Phase 1 universal break-glass content role is created. |
| `OPS-IAC-P1-021` | Modules and policy rules MUST have immutable versions, explicit inputs/outputs, compatibility bounds, owners, tests, and retirement/replacement lineage; mutable remote templates or undeclared includes are prohibited. |
| `OPS-IAC-P1-022` | Infrastructure changes MUST pass syntax/semantic validation, policy/security/privacy scans, plan fixtures, least-privilege tests, failure/interruption/retry behavior, drift detection, portability review, and applicable recovery/deletion/residency exercises before production approval. |
| `OPS-IAC-P1-023` | Resource limits, quotas, scaling, availability, and cost controls MUST be driven by approved workload/NFR evidence and safe failure policy. Provisional NFR targets are test hypotheses, not authority to purchase or deploy capacity. |
| `OPS-IAC-P1-024` | Every plan/apply/import/drift/repair/destroy outcome MUST emit privacy-safe evidence with source, plan, actor/workload, approver, environment, state before/after, policy result, affected control classes, and reconciliation state. |

## 5. State repair, import, and retirement

State repair never edits infrastructure or evidence merely to make a plan clean. It first establishes observed reality, ownership, data/control impact, provider mapping, deletion/backup state, and incident status. Import/adoption creates declarative intent and conformance evidence before the resource is trusted. Orphaned or unreachable state remains a visible finding until reconciled.

Retirement disables service routes, drains/reconciles work, preserves required event/audit/configuration compatibility, applies deletion and backup policy, revokes identities/secrets, verifies no dependent route remains, and records residuals. A successful destroy command alone is not retirement evidence.

## 6. Decision and approval gates

Infrastructure definitions implement only the provider, regions, environment topology, encryption boundaries, and document-deletion duration approved by `DEC-049`–`053`. `DEC-038` still keeps account/workspace ownership recovery disabled; infrastructure restore or key access cannot create that authority. Production readiness requires provider-portability tests, closed route rows, security/threat review, cost evidence, operations ownership, and rollback/forward-repair/restore exercises under `DEC-054`.
