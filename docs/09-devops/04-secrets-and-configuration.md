# Phase 1 Secrets, Keys, and Configuration Standard

| Field | Value |
|---|---|
| Document ID | `OPS-SEC-001` |
| Version | `0.1` |
| Status | **DRAFT — security, privacy, architecture, operations, and configuration-owner approval required** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |
| Primary trace | `ARCH-P1-005`, `017`, `044`, `SEC-P1-007`–`011`, `025`–`030`, `AUD-P1-022`–`024`, `THR-P1-021`, `028`–`029` |

## 1. Purpose and separation

This document governs secrets, cryptographic-key references, operational settings, and consequential configuration without selecting a secret store, key-management system, configuration service, certificate authority, identity provider, or deployment product.

These concerns remain distinct:

| Concern | Examples | Governing property |
|---|---|---|
| Secret | Connector credential, signing credential, database credential, callback secret | Confidential value; scoped use, rotation/revocation, never source/static config |
| Cryptographic key | Encryption, signing, integrity, or key-encryption material | Separated use/management/recovery/destruction authority; raw material never application state |
| Operational setting | Endpoint reference, capacity/budget class, feature-safe timeout/retry policy | Versioned non-secret environment configuration with schema and compatibility |
| Consequential configuration | Policy, roles, taxonomy, sources, rules, workflows, schemas, prompts/tools, AI capability, route matrix, release/deployment policy | Proposed/reviewed/approved/effective-dated publication, impact/replay and rollback/repair |

Environment handling follows [`OPS-ENV-001`](01-environments.md); pipeline access follows [`OPS-CICD-001`](02-ci-cd.md); deployment/cutover follows [`OPS-DEP-001`](05-deployment-rollback-and-repair.md).

## 2. Secret and key inventory

The versioned inventory records stable secret/key reference, class, owner/custodian, approved purpose, environment, consumers/workload capabilities, data/key domain, creation/activation/rotation/disable/destruction state, expiry policy reference, storage/processing route, access policy, audit classification, dependencies, recovery/escrow status where approved, and incident/compromise state. It records no value or raw material.

Key domains remain separated for transport, session/signing, primary records, immutable artifacts, quarantine, derived stores/caches, exports, audit, backups/DR, and connector/provider credentials as required by `SEC-ARCH-001`.

## 3. Stable secret, key, and configuration rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-SEC-P1-001` | Secrets, keys, operational settings, domain/reference configuration, policy, and deployment metadata MUST be classified and handled as distinct types; calling a secret “configuration” cannot weaken its controls. |
| `OPS-SEC-P1-002` | Production secrets and raw key material MUST NOT exist in source control, build definitions, infrastructure code/state output, static configuration, images/packages, documentation, fixtures, tickets, chat, logs, metrics, traces, screenshots, or model context. |
| `OPS-SEC-P1-003` | A production secret/key MUST NOT be available, downloaded, cached, copied, backed up, or emulated on a developer workstation or lower environment; local development uses non-sensitive synthetic credentials for local fakes only. |
| `OPS-SEC-P1-004` | Secret/key access MUST use named workload or privileged identities with least capability, environment, purpose, data/key domain, operation, and approved duration; ambient host, broad developer, or shared service credentials are prohibited. |
| `OPS-SEC-P1-005` | Workload identity and scoped short-lived authorization SHOULD replace exportable long-lived credentials where a future approved implementation can do so without weakening portability or recovery; any long-lived secret needs explicit justification and compensating controls. |
| `OPS-SEC-P1-006` | Secret/key values MUST be encrypted in transit and at rest, exposed only to the consuming boundary, and redacted structurally before errors or telemetry; masking after logging is insufficient. |
| `OPS-SEC-P1-007` | Secret/key references and versions MAY appear in audit/provenance; raw material, factors, tokens, passwords, private keys, recovery shares, and unbounded credential-derived identifiers MUST NOT. |
| `OPS-SEC-P1-008` | Secret creation, issue, access-policy change, use anomaly, rotation, disable, revoke, recovery, export attempt, and destruction MUST be privacy-safe, attributable, tamper-evident, and independently reviewable. |
| `OPS-SEC-P1-009` | Key use, key administration, recovery, rotation, and destruction duties MUST be separable; no ordinary application, support, pipeline, or operator identity receives unrestricted raw key access. |
| `OPS-SEC-P1-010` | Backup/DR keys and recovery material MUST be separated from protected backups and ordinary application authority; recovery cannot bypass current residency, deletion, audit, or `DEC-038` user-authority fences. |
| `OPS-SEC-P1-011` | Every secret/key MUST have an approved rotation/disable/revoke procedure, dependency inventory, compatibility window, verification, rollback/forward-repair path, and safe behavior when unavailable. This draft invents no rotation duration. |
| `OPS-SEC-P1-012` | Rotation MUST support old/new overlap only for the minimum approved compatibility policy, identify every consumer, prevent downgrade, verify new use, revoke the old version, and reconcile delayed jobs/callbacks without duplicating effects. |
| `OPS-SEC-P1-013` | Suspected compromise MUST disable or contain the credential/route, preserve safe evidence, identify affected artifacts/data/actions, rotate or replace under incident authority, and invalidate sessions/caches/grants where applicable before normal service resumes. |
| `OPS-SEC-P1-014` | Secret/key unavailability or unknown version MUST yield fail-closed or explicitly degraded behavior. It MUST NOT select a broader identity, older unsafe credential, unapproved region, or plaintext fallback. |
| `OPS-SEC-P1-015` | Secret and key scans/canaries MUST cover source/history, dependencies, artifacts, infrastructure state/output, configuration, logs/reports, telemetry, support/incident systems, and exposed endpoints; a confirmed exposure is a security incident and release blocker. |
| `OPS-SEC-P1-016` | Operational and consequential configuration MUST use closed schemas, stable IDs, immutable versions, owners, source/evidence, decision traces, effective period, compatibility bounds, status, review/approval, retirement/replacement, and impact/replay metadata. |
| `OPS-SEC-P1-017` | Configuration values MUST be canonical provider-neutral semantics. Provider-native options are isolated in versioned adapter mappings and cannot leak authority, identity, state, or undisclosed processing behavior into core configuration. |
| `OPS-SEC-P1-018` | Configuration publication MUST separate proposal, validation/evaluation, review, approval, effective activation, supersession, rollback/repair, and retirement. Editing a live value in place is prohibited for consequential configuration. |
| `OPS-SEC-P1-019` | A configuration package MUST declare compatible application, API, event, schema, reference-data, policy, migration, prompt/tool/model/adapter, projection, and environment versions; unknown or incompatible consumers block activation. |
| `OPS-SEC-P1-020` | Activation MUST wait for required consumer compatibility acknowledgements and current authorization/deletion/residency policy. A publication event such as `EVT-P1-031` reports a fact; it is not authority to activate. |
| `OPS-SEC-P1-021` | Feature flags and environment variables MUST NOT grant authorization, bypass quarantine/deletion/audit, change data class/purpose, invent a processor/region, or close `DEC-031`–`DEC-040`; prohibited branches remain unreachable. |
| `OPS-SEC-P1-022` | Runtime-affecting reference-data seed records remain DRAFT/disabled until their owning publication and decision gates pass. Copying repository seed JSON into an environment MUST NOT make it active configuration. |
| `OPS-SEC-P1-023` | Security, authorization, residency, retention/deletion, audit, prompt/tool, AI capability, source/rule, connector/channel, and deployment-policy changes require independent specialist review and mapped conformance/evaluation evidence. |
| `OPS-SEC-P1-024` | Configuration access MUST separate read, propose, validate, approve, publish, activate, roll back/repair, and audit permissions; support and ordinary developers have no standing production mutation or content access. |
| `OPS-SEC-P1-025` | Configuration distribution MUST be integrity-protected, environment/scoped, observable, and freshness-aware. A consumer with missing, unknown, stale, conflicting, or tampered consequential configuration MUST fail closed or expose an explicit unavailable state. |
| `OPS-SEC-P1-026` | Configuration cache keys and watermarks MUST include exact package/policy epoch and environment; rollback or security/deletion change invalidates affected caches/jobs/projections and cannot serve a stale allow. |
| `OPS-SEC-P1-027` | A rollback MAY reactivate only a retained compatible and currently eligible configuration version. If it would restore a vulnerability, stale authorization, deleted route/data, incompatible schema, or ineligible placement, the capability remains disabled and uses forward repair. |
| `OPS-SEC-P1-028` | Every secret/key/configuration operation MUST produce safe evidence with exact references, versions, actors/workloads, approvals, policy/compatibility outcome, effective time, affected consumers, and repair state, without protected values. |
| `OPS-SEC-P1-029` | Configuration and secret/key inventory drift MUST be detected and reconciled. Unknown active versions, orphaned credentials, over-broad policy, missing owner, unapproved route, or expired evidence blocks affected release/capability. |
| `OPS-SEC-P1-030` | Retention, backup, recovery, and destruction behavior for secrets/keys/configuration MUST remain explicit but duration-neutral while `DEC-039` is open, route-ineligible while `DEC-040` is open, and unable to transfer user/workspace authority while `DEC-038` is open. |

## 4. Configuration activation and repair sequence

1. Validate schema, references, stable IDs, ownership, effective period, decision status, and safe defaults.
2. Classify compatibility and affected APIs/events/migrations/projections/adapters/prompts/tools/policies.
3. Run synthetic contract, authorization, privacy, security, AI, replay, deletion, residency, and degraded-mode evidence for the impact set.
4. Obtain required independent approvals and integrity-protect the immutable package.
5. Distribute without activation; prove required consumer compatibility and policy/route eligibility.
6. Activate as a distinct audited transition, observe watermarks/outcomes, and either complete, contain, select a safe retained version, or forward-repair.

No step permits secret values in the configuration package. Production configuration export for diagnosis is minimized, authorized, and reference-only; it cannot be copied to a lower environment.

## 5. Decision fences

Recovery credentials/keys cannot implement ownership recovery while `DEC-038` is open. Key destruction and backup residuals cannot imply deletion completion while `DEC-039` is open. A key location or encrypted payload does not prove the processor/support/telemetry/backup route is eligible under `DEC-040`.
