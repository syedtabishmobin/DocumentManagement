# Operations and DevOps Specification Index

| Field | Value |
|---|---|
| Document ID | `OPS-IDX-001` |
| Version | `0.2` |
| Status | **DRAFT — product-owner, architecture, security, privacy, operations, and quality approval required** |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 29 August 2026 |

## Purpose and authority

This directory defines the provider-neutral Phase 1 operating contract and its approved Azure implementation for environments, delivery, infrastructure, secrets/configuration, external-provider registration, deployment repair, backup/recovery, and observability. Azure `dev` foundations and a synthetic application preview exist; production and external-provider activation remain gated by `DEC-054`–`055`.

The source-of-truth hierarchy in `CODEX.md` applies. Approved decisions and accepted ADRs outrank this draft. The primary inputs are [`ARCH-SOL-001`](../02-architecture/01-solution-architecture.md), [`ARCH-NFR-001`](../02-architecture/05-non-functional-requirements.md), the [ADR set](../02-architecture/06-adrs/README.md), [`API-STD-001`](../05-api/01-api-standards.md), [`API-EVT-001`](../05-api/03-event-catalogue.md), the [security pack](../06-security/README.md), [`ENG-DEV-001`](../08-engineering/05-local-development.md), and [`ENG-TST-001`](../08-engineering/06-testing-standards.md). Every numeric target repeated here remains **PROVISIONAL** exactly as labelled in `ARCH-NFR-001`; it is not a customer SLA or implementation approval.

## Reading order and rule ownership

| Order | Document | Stable rule namespace | Owns |
|---:|---|---|---|
| 1 | [`01-environments.md`](01-environments.md) | `OPS-ENV-P1-001`–`OPS-ENV-P1-024` | Environment classes, isolation, synthetic data, route simulation, access, parity, and decision fences |
| 2 | [`02-ci-cd.md`](02-ci-cd.md) | `OPS-CICD-P1-001`–`OPS-CICD-P1-030` | Reproducible build, supply-chain evidence, validation gates, promotion, approvals, and waivers |
| 3 | [`03-infrastructure-as-code.md`](03-infrastructure-as-code.md) | `OPS-IAC-P1-001`–`OPS-IAC-P1-024` | Declarative infrastructure, protected state, plans, drift, residency, and lifecycle |
| 4 | [`04-secrets-and-configuration.md`](04-secrets-and-configuration.md) | `OPS-SEC-P1-001`–`OPS-SEC-P1-030` | Secret/key lifecycle, workload access, configuration packages, rotation, and decision-safe activation |
| 5 | [`05-deployment-rollback-and-repair.md`](05-deployment-rollback-and-repair.md) | `OPS-DEP-P1-001`–`OPS-DEP-P1-032` | Release manifests, compatible deployment, migrations, rollback versus forward repair, and containment |
| 6 | [`06-backup-and-disaster-recovery.md`](06-backup-and-disaster-recovery.md) | `OPS-DR-P1-001`–`OPS-DR-P1-032` | Backup classes, recovery objectives, restore gates, deletion/residency safety, and exercises |
| 7 | [`07-observability.md`](07-observability.md) | `OPS-OBS-P1-001`–`OPS-OBS-P1-032` | Content-free telemetry, SLIs, alerts, runbooks, incidents, control evidence, and cost |
| 8 | [`08-external-provider-setup.md`](08-external-provider-setup.md) | `OPS-PROVIDER-001` | Microsoft, Google, Dropbox, Box, ACS Email, callbacks, scopes, secret references, verification, and activation gates |
| 9 | [`09-agent-delivery-control-centre.md`](09-agent-delivery-control-centre.md) | `OPS-CC-001` | Persistent delivery Project, local read-only agent operations, shared-ID trace/audit views, freshness, provenance, and privacy |

Stable rule IDs are never recycled. Wording may evolve additively; retired rules retain their IDs and point to replacements.

## Shared operating invariants

- Azure, Bicep, React/TypeScript, and Flutter are approved by `DEC-049`–`052`; core capability and adapter contracts remain provider-neutral, and no Azure resource or provider registration alone activates a product route.
- Build once and promote the same verified immutable artifact and manifest; environment-specific behavior comes only from approved versioned configuration and policy.
- Lower environments contain deterministic synthetic data only. Production household content, production-derived copies, production credentials, production backups, and unrestricted production telemetry never flow downward.
- Workspace, purpose, classification, authorization epoch, residency/processing policy, retention/deletion lineage, and configuration version remain explicit across deployment and operational data paths.
- Unknown schema, configuration, migration, adapter, processor, region, or compatibility state blocks activation or yields an explicit safe degraded state. Availability pressure cannot authorize a fallback route.
- Deletion fences and current authorization precede replay, repair, rebuild, restore, export, connector resync, cache activation, and service release.
- Ordinary operational telemetry is schema allow-listed and contains no raw document content, filenames, protected values, evidence passages, prompts, queries, answers, tool/provider payloads, unrestricted URLs, tokens, secrets, or key material.
- Audit, domain events, and operational telemetry remain distinct contracts. One cannot silently substitute for another.

## Approved decision outcomes and release fences

| Decision | Current operations consequence |
|---|---|
| `DEC-038` | Recovery and ownership transfer remain unavailable in local/dev; production recovery needs a separate assurance decision. Infrastructure recovery cannot create user authority. |
| `DEC-039` / `DEC-053` | `DEC-053` establishes immediate document deletion fencing, 30-calendar-day Trash/restore, then coordinated purge and non-resurrection. Account deletion and lawful-retention exceptions remain separate. |
| `DEC-040` / `DEC-049` | Azure Australia East with explicitly documented Australian paired-region routes is selected. Every content, processor, support, telemetry, backup, failover, and external-provider route still needs enforceable eligibility evidence; unknown routes block. |

`DEC-031`–`037` define the approved disabled/default behavior. An environment, deployment variable, infrastructure module, secret, or configuration flag still cannot activate a connector or external notification channel, automated continuity release, aggregate score, unreviewed launch pack, or unsafe clinical-content route. Provider implementation/configuration is authorized by `DEC-045` and `DEC-055`; exact activation remains a release gate.

## Pack conformance

This pack is ready for approval only when:

1. every rule has an accountable control owner, implementation mapping, test/evidence source, and exception authority;
2. environment, build, infrastructure, secret, deployment, backup, and telemetry manifests have machine-readable schemas and synthetic fixtures;
3. API, event, reference-data, migration, configuration, AI, security, privacy, deletion, residency, accessibility, resilience, and recovery gates are integrated without weakening their owning contracts;
4. threat and NFR mappings are reviewed, including `THR-P1-019`, `THR-P1-023`–`029` and `NFR-P1-026`–`045`;
5. all enabled routes have current provider-neutral capability and placement evidence;
6. rollback, forward-repair, restore, and incident exercises prove deletion and authorization safety; and
7. the product owner explicitly approves the applicable NFR baseline and closes or preserves every decision fence.
