# Phase 1 Continuous Integration and Delivery Standard

| Field | Value |
|---|---|
| Document ID | `OPS-CICD-001` |
| Version | `0.2` |
| Status | **APPROVED IMPLEMENTATION BASELINE — production promotion remains gated** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `SEC-P1-030`–`037`, `THR-P1-021`, `028`, `032`–`034`, `ARCH-P1-005`, `039`–`055`, `NFR-P1-005`, `022`–`050`, `DEC-049`–`054` |

## 1. Purpose and non-selection boundary

This standard defines integration, build, verification, release-candidate, promotion, approval, and evidence contracts for the approved React web, Flutter mobile, TypeScript API and Azure/Bicep stack. Exact CI vendor and production release authority remain outside this standard.

Environment rules are in [`OPS-ENV-001`](01-environments.md), infrastructure changes in [`OPS-IAC-001`](03-infrastructure-as-code.md), secret/configuration changes in [`OPS-SEC-001`](04-secrets-and-configuration.md), release execution in [`OPS-DEP-001`](05-deployment-rollback-and-repair.md), and test/evidence ownership in [`ENG-TST-001`](../08-engineering/06-testing-standards.md).

## 2. Delivery model

The logical flow is:

`reviewed source/configuration → isolated reproducible build → immutable candidate + provenance → static/contract/test/evaluation gates → signed approval evidence → promote same artifact → verify/observe → complete, contain, roll back, or forward-repair`

A release candidate manifest binds: source revision; build definition/toolchain/dependency locks; generated-contract inputs; artifact digests; software-bill-of-materials reference; provenance/signature references; configuration/migration/API/event/reference/AI versions; applicable requirements, threats, NFRs and decisions; test/evaluation manifests; known risks/waivers; promotion history; and rollback/forward-repair plan. It contains no secrets or raw fixture/customer content.

## 3. Stable CI/CD rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-CICD-P1-001` | Every change to source, build logic, infrastructure, schema, migration, API/event, reference data, security policy, prompt/tool/model configuration, deployment, or operations control MUST be version-controlled, attributable, reviewed, and linked to its owning contracts. |
| `OPS-CICD-P1-002` | A pipeline run and release candidate MUST have stable opaque identities bound to an immutable source revision and declared build definition; rerun evidence cannot silently replace a prior result. |
| `OPS-CICD-P1-003` | Builds MUST be deterministic and reproducible from declared source, toolchain, dependency, generated-input, locale/time, and configuration versions; unavoidable nondeterminism MUST be isolated, documented, and excluded from semantic artifacts. |
| `OPS-CICD-P1-004` | Build and test execution MUST occur in a clean, isolated, least-privileged environment with no production data, production credential, ambient administrator authority, or undeclared dependency on a developer workstation. |
| `OPS-CICD-P1-005` | Dependency acquisition MUST use exact declared versions and integrity evidence. Mutable/unverified dependencies, undeclared downloads, or resolution drift fail the candidate. |
| `OPS-CICD-P1-006` | Generated API, event, reference-data, policy, schema, client, migration, and documentation outputs MUST identify their canonical inputs/generator versions and MUST fail when checked-in/generated results disagree. |
| `OPS-CICD-P1-007` | Each candidate MUST produce a provider-neutral dependency and component inventory plus build provenance sufficient to trace every artifact to source, inputs, builder identity, and verification results. |
| `OPS-CICD-P1-008` | Artifact integrity MUST be verified at creation, storage, promotion, deployment, and rollback/repair selection; an unsigned, unapproved, mismatched, mutable, or provenance-incomplete artifact MUST NOT be promoted. |
| `OPS-CICD-P1-009` | Build runners, signing identities, deployment identities, secret access, and release approval MUST be separated and least-privileged; a pull request or model-generated change cannot approve or deploy itself. |
| `OPS-CICD-P1-010` | Source, history, dependencies, build output, images/packages, infrastructure plans, configuration, fixtures, reports, and logs MUST be scanned for credentials, key material, prohibited content, and unsafe endpoints before publication or promotion. |
| `OPS-CICD-P1-011` | Static code, dependency, license/policy, configuration, infrastructure, artifact, API/event, secret, and vulnerability checks MUST be product-neutral gates with versioned rules and explainable findings. |
| `OPS-CICD-P1-012` | Critical/high residual security or privacy findings block release unless the authorized risk process permits a scoped, time-bounded acceptance; open decisions and zero-tolerance disclosure/deletion/action failures are not waivable by pipeline configuration. |
| `OPS-CICD-P1-013` | Tests MUST be selected from changed contracts and risk impact, including unit/domain, integration, end-to-end, authorization, privacy, security, accessibility, migration, compatibility, resilience, AI evaluation, performance, deletion, residency, backup, and recovery evidence as applicable. |
| `OPS-CICD-P1-014` | Every candidate MUST run the repository validators from the repository root: `python3 scripts/validate-specifications.py`, `python3 scripts/validate-reference-data.py`, and `python3 scripts/validate-api-contracts.py`. |
| `OPS-CICD-P1-015` | A validator failure, missing validator, skipped expected input, duplicate/dangling stable ID, schema/example mismatch, broken local reference, or safety-fence violation blocks the candidate; hand-edited output cannot be used to claim a pass. |
| `OPS-CICD-P1-016` | API/event/schema compatibility MUST be assessed against every supported producer, consumer, retained replay decoder, client, and active release; unknown major or security/consequence field behavior fails closed. |
| `OPS-CICD-P1-017` | Migration gates MUST exercise empty, representative synthetic, prior-version, interrupted, retry, forward-repair, and compatibility paths; a destructive or irreversible transition requires separately approved loss/repair evidence. |
| `OPS-CICD-P1-018` | Authorization, workspace isolation, non-disclosure, audit durability, immutable-original integrity, deletion-fence/resurrection, and residency-denial suites are zero-tolerance gates for affected paths. |
| `OPS-CICD-P1-019` | AI/model/prompt/tool/schema/calibration or processor-route changes MUST produce a new candidate manifest and pass the mapped contract, offline, red-team, race, resilience, cost, and release gates in `AI-EVAL-001`; passing evidence does not float to a materially changed version. |
| `OPS-CICD-P1-020` | Performance, availability, freshness, accessibility, security-response, recovery, observability, and cost gates MUST cite `NFR-P1-*` populations and evidence. All numeric targets remain provisional until the accountable owners approve them. |
| `OPS-CICD-P1-021` | Release evidence MUST use deterministic synthetic fixtures or specifically approved test data, never production household content or production credentials; ordinary reports contain safe IDs, versions, counts, buckets, and findings only. |
| `OPS-CICD-P1-022` | Infrastructure plans, environment drift, route/placement eligibility, secret/configuration compatibility, backup/recovery evidence currency, and active incident/containment state MUST be evaluated before promotion. |
| `OPS-CICD-P1-023` | The exact same verified artifact digest MUST be promoted through environments. Rebuilding, retagging mutable content, or substituting an environment-specific binary invalidates earlier evidence. |
| `OPS-CICD-P1-024` | Promotion MUST be an explicit state transition with candidate, source/target environment, evidence set, requester, independent approver(s), change window/policy reference, expected configuration/migration, and rollback/repair plan. |
| `OPS-CICD-P1-025` | Production-capable promotion/deployment credentials MUST NOT be available to untrusted change code, pull-request forks, ordinary test jobs, local machines, model/tool output, or lower-environment identities. |
| `OPS-CICD-P1-026` | A release MUST NOT activate a route or behavior fenced by `DEC-031`–`DEC-040`; configuration defaults, environment variables, migrations, or stale feature state cannot close an open decision. |
| `OPS-CICD-P1-027` | Gate failure, missing evidence, incompatible migration/schema/configuration, unknown route, critical drift, or unresolved stop-ship condition MUST yield a blocked candidate with an owner and repair path, not a warning-only success. |
| `OPS-CICD-P1-028` | A waiver MUST name exact rule/gate, candidate and scope, evidence, impact, compensating controls, owner, approvers, effective/expiry conditions, monitoring, remediation, and disable/rollback trigger; it cannot waive law/policy, current authorization, deletion fence, original integrity, required audit, or residency eligibility. |
| `OPS-CICD-P1-029` | Build, gate, approval, promotion, deployment, rollback, repair, and waiver outcomes MUST create immutable privacy-safe evidence that can reconstruct who approved which exact artifact/configuration and why. |
| `OPS-CICD-P1-030` | Pipeline definitions and gate policies are consequential configuration: changes MUST be reviewed, compatibility-tested, integrity-protected, effective-dated, audited, and recoverable; disabling a gate is itself a gated release change. |
| `OPS-CICD-P1-031` | Every candidate MUST build and test the React web, TypeScript API, Flutter iOS, Flutter Android, shared contract fixtures and Bicep modules from pinned toolchains; missing critical-platform evidence blocks promotion. |
| `OPS-CICD-P1-032` | Language-neutral cryptographic known-answer vectors, randomized nonce/tamper tests and mixed-client compatibility MUST pass unchanged across React and Flutter before any document path is releasable. |
| `OPS-CICD-P1-033` | Azure deployment MUST use reviewed Bicep, environment-scoped workload identities and What-If evidence. Dev and stage may deploy synthetic/test candidates; production deployment is impossible without a separately approved subscription parameter set and release gate. |
| `OPS-CICD-P1-034` | Web and mobile artifacts that can observe plaintext MUST be signed/provenanced, dependency-scanned and traceable to reviewed source. Production requires protected signing identities, reproducible-build evidence and independent security closure. |

## 4. Minimum gate matrix

| Candidate change | Required evidence in addition to baseline validators |
|---|---|
| API/event/schema | Backward/forward compatibility, old/new producer-consumer, unknown-version, privacy-field, replay and decoder-retention tests |
| Domain/persistence | Invariant/concurrency/idempotency, expand/migrate/contract, interruption, rollback/forward-repair, backup/restore, deletion lineage |
| Authorization/security | Cross-workspace/resource/field/edge/output negatives, policy epoch/revoke races, abuse/fuzz, supply-chain and telemetry canaries |
| AI/document intelligence | Machine schema/fixture conformance, evidence/citation, injection, calibration/slice, provider replacement, deletion/residency and `AI-EVAL-001` gates |
| Infrastructure/secret/config | Plan review, drift, least privilege, encryption/key separation, rotation/disable, route eligibility, decision fences and repair |
| Deployment/recovery | Safe rollout, compatibility window, health/control verification, event/backlog behavior, restore gates and rollback versus forward-repair drill |

## 5. Evidence retention and disclosure

Candidate evidence retention follows an approved versioned policy; this draft invents no duration under `DEC-039`. Evidence remains classified and residency-controlled under `DEC-040`. No build, gate, waiver, configuration, or promotion may activate account/workspace recovery or ownership transfer while `DEC-038` remains open. Build logs and reports are not a shadow source/content store. A finding ticket references protected evidence where needed and never copies raw household or secret material into ordinary CI output.
