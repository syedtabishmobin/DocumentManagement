# Phase 1 Environment Standard

| Field | Value |
|---|---|
| Document ID | `OPS-ENV-001` |
| Version | `0.2` |
| Status | **APPROVED IMPLEMENTATION STANDARD under `DEC-049` and `DEC-054`** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `DEC-009`, `DEC-049`–`054`, `ADR-ARCH-007`–`010`, `ARCH-P1-001`–`018`, `ARCH-P1-039`–`045`, `PRIV-P1-020`–`022`, `SEC-P1-001`–`011`, `028`–`030` |

## 1. Purpose and boundary

This document defines logical environment classes and isolation controls. `ADR-ARCH-007` now maps those classes to Bicep-defined Azure environments while preserving the provider-neutral behavior and evidence boundaries. Detailed offline/local profiles, fake ports, fixtures, and reset safety are owned by [`ENG-DEV-001`](../08-engineering/05-local-development.md).

`dev` and `stage` are approved for synthetic/test data in the current Azure subscription. `prod` is a defined but unprovisioned target until a separate production subscription and the `DEC-054` release gates exist. Environment provisioning follows [`OPS-IAC-001`](03-infrastructure-as-code.md); promotion follows [`OPS-CICD-001`](02-ci-cd.md); secrets and configuration follow [`OPS-SEC-001`](04-secrets-and-configuration.md).

## 2. Logical environment classes

| Class | Permitted purpose | Data and dependency stance | Serviceability |
|---|---|---|---|
| Developer-local | Offline development, static analysis, unit tests, contract generation, deterministic component simulation | Synthetic fixtures; deterministic local fakes; no production identity, secret, backup, endpoint, or household content | Never production or a residency proof |
| Shared integration | Cross-component, API/event, migration, async, security-negative, and accessibility integration | Synthetic workspaces and synthetic provider-neutral adapters; default-deny egress | Non-production only |
| Representative pre-production | Release, performance, resilience, restore rehearsal, AI evaluation, and deployment evidence at representative shape | Synthetic or specifically approved non-household test data; declared route simulation; no production copy | Release evidence only, never customer service |
| Isolated security/recovery exercise | Penetration, incident, backup restore, key/secret, deletion-resurrection, or disaster exercise | Access-controlled synthetic or separately approved recovery inputs; isolated output; explicit teardown/retention policy | Cannot become serviceable without every restore/release gate |
| Production | Approved customer service under current contracts, decisions, placement matrix, and release evidence | Only approved data classes, processors, routes, identities, keys, configuration, and telemetry | Conditional on the specification and release gates |

An implementation may combine or subdivide these logical classes only when every trust, data, access, route, evidence, and separation property remains independently enforceable and reviewable.

The approved physical mapping is: developer-local remains offline; Azure `dev` implements shared integration; Azure `stage` implements representative pre-production and isolated exercises through separately scoped resources; Azure `prod` implements production only after its subscription and release gate exist. Production's primary region is Australia East and only approved Australian paired-region routes may use Australia Southeast.

## 3. Environment manifest

Each environment has a versioned manifest recording: stable environment identity/class; owner and approvers; intended capabilities; trust boundaries; identity and workload domains; permitted data classes and synthetic marker; workspace/purpose policy; configuration/package versions; API/event/schema compatibility; infrastructure generation; allowed egress and capability routes; residency-policy state; secret/key domains; telemetry/audit destinations; backup/restore eligibility; deletion-fence source; access policy; drift state; and creation/change/retirement evidence.

The manifest contains safe references, not credentials, raw configuration secrets, household data, unrestricted endpoints, or provider-native payloads.

## 4. Stable environment rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-ENV-P1-001` | Every environment MUST have one immutable-versioned manifest and stable opaque identity; labels such as local, test, staging, or production MUST NOT themselves grant trust or authority. |
| `OPS-ENV-P1-002` | Identity, workload, data, secret/key, audit, telemetry, backup, and administrative boundaries MUST be isolated between production and every lower environment; shared physical infrastructure, if later chosen, cannot weaken the logical separation. |
| `OPS-ENV-P1-003` | Developer-local, shared integration, representative pre-production, and ordinary exercise environments MUST use deterministic synthetic data and MUST NOT ingest real household content. |
| `OPS-ENV-P1-004` | Production records, derivatives, exports, events, audit payloads, telemetry payloads, backups, snapshots, credentials, tokens, and key material MUST NOT be copied, restored, sampled, mirrored, or replayed into a lower environment. |
| `OPS-ENV-P1-005` | Synthetic fixtures MUST exercise at least two workspaces, private family fields, global-reference scope, purpose/residency policy, authorization epochs, deletion fences, and content-free telemetry so isolation failures remain detectable. |
| `OPS-ENV-P1-006` | Environment selection MUST come from trusted deployment/runtime context and MUST NOT be accepted from a client, event payload, model output, document, source, or connector as an authority claim. |
| `OPS-ENV-P1-007` | Each environment MUST use environment-specific least-privileged human/workload identities and distinct secret/key domains; production credentials MUST be unusable from local or lower-environment execution. |
| `OPS-ENV-P1-008` | Local development MUST NOT require, cache, export, impersonate, or offer a fallback path to a production identity, secret, signing key, data store, event stream, telemetry store, backup, or administrator session. |
| `OPS-ENV-P1-009` | Every environment MUST enforce workspace, purpose, classification, processing/residency, retention/deletion, and configuration policy; a lower environment cannot bypass policy merely because its data is synthetic. |
| `OPS-ENV-P1-010` | Azure environment region and route fields MUST match the `DEC-049` placement matrix. Australia East is primary; Australia Southeast is eligible only for an explicitly inventoried paired-region resilience role. Every other route remains ineligible until separately approved. |
| `OPS-ENV-P1-011` | Lower environments MUST default to offline deterministic provider-neutral fakes for identity, storage, scanning, document/AI processing, sources, connectors, notifications, events, audit, telemetry, backup, and recovery ports. |
| `OPS-ENV-P1-012` | An external conformance sandbox MAY be used only with synthetic inputs, an approved bounded purpose/route, isolated credentials, explicit cost/retention evidence, and no implication that the adapter or route is production-approved. |
| `OPS-ENV-P1-013` | External egress and inbound callbacks in lower environments MUST be deny-by-default and restricted to declared test endpoints/sinks; tests MUST NOT address real recipients, real source accounts, or production callback identities. |
| `OPS-ENV-P1-014` | Conditional connectors, external notification channels, continuity/recovery, launch sources/profiles, readiness scoring, and clinical disposition MUST remain disabled in every environment unless their owning decision and exact conformance gate are approved; synthetic simulation cannot activate them. |
| `OPS-ENV-P1-015` | Each environment MUST load exact compatible API, event, reference-data, policy, schema, prompt/tool, model/adapter, parser, migration, and projection versions from a reviewed release/configuration manifest. |
| `OPS-ENV-P1-016` | Ordinary logs, metrics, traces, screenshots, build output, test reports, and incident records in every environment MUST follow the same content-prohibition and schema-allow-list rules as production. |
| `OPS-ENV-P1-017` | Human access MUST be named, least-privileged, purpose-bound, time-bounded by approved policy, strongly authenticated where required, separately approved for privileged actions, and auditable; support has no standing content access. |
| `OPS-ENV-P1-018` | Test and exercise automation MUST use workload identities whose workspace/capability/route scope is explicit; ambient developer, runner, or administrator privilege MUST NOT be used by application paths. |
| `OPS-ENV-P1-019` | Environment creation, configuration change, privileged access, drift, release, restore, repair, and retirement MUST produce privacy-safe audit/control evidence with artifact and manifest identity. |
| `OPS-ENV-P1-020` | Environment drift MUST be detected against declared infrastructure, configuration, secret/key references, schemas, policies, routes, and release manifest; unknown or security/recovery/residency-affecting drift blocks promotion or serviceability. |
| `OPS-ENV-P1-021` | Build artifacts MUST NOT be rebuilt per environment. The same verified immutable artifact is promoted; only approved non-secret configuration and environment-specific secret/key references vary. |
| `OPS-ENV-P1-022` | Parity claims MUST enumerate intentional differences in scale, dependencies, identity, routes, data, keys, observability, backup, and failure controls. Lower-environment success is not production reliability, residency, or recovery proof. |
| `OPS-ENV-P1-023` | An isolated restored or disaster-recovery environment MUST remain non-serviceable until integrity, schema/configuration, authorization, deletion-fence/tombstone, audit continuity, processing/residency, key, and release gates pass. |
| `OPS-ENV-P1-024` | Environment policy MUST preserve `DEC-038`, `DEC-050`, and `DEC-053`: no user-authority recovery bypass, no operator document-decryption path, and no restore/replay route that exceeds the approved 30-day document recovery lifecycle. |

## 5. Synthetic fixture and reset contract

Synthetic environment seeds are versioned, deterministic, non-activatable, and traceable to repository contract/reference-data versions. Reset creates or retires only an explicitly named synthetic environment/workspace generation. A reset procedure MUST validate its exact target and environment class, refuse production, preserve required test evidence, and use recoverable lifecycle operations where practical. Broad recursive deletion, unresolved variables, home/workspace-root targets, or implicit wildcard targets are prohibited.

Synthetic sources use controlled offline fixtures or reserved non-production endpoints; synthetic messages use local sinks; synthetic identity and payment/action-like effects cannot reach a real party. Seed and reset evidence records fixture version, target identity, before/after generation, actor/workload, outcome, and safe counts—not fixture content.

## 6. Parity and readiness limits

Pre-production evidence MUST declare what it cannot prove: real provider control behavior, real geographic placement, customer traffic distribution, production identity assurance, production key controls, operational staffing, real backup durability, or unresolved NFR approval. A production promotion is blocked if an applicable difference lacks an explicit risk/evidence disposition.

No environment is ready for implementation or customer use merely because it can be provisioned. Readiness also requires the specification gate, approved decision matrix, threat/NFR mapping, delivery and restore evidence, and accountable go/no-go approval.
