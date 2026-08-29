# Phase 1 Local Development Standards

| Field | Value |
|---|---|
| Document ID | `ENG-DEV-001` |
| Version | `0.2` |
| Status | **ACTIVE IMPLEMENTATION STANDARD under `ADR-ARCH-006`–`009`** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 29 August 2026 |

## 1. Purpose and present boundary

This document defines how the implemented local environment remains safe, deterministic, synthetic, contract-compatible, and honest about production differences. `ADR-ARCH-006`–`009` select the current TypeScript/React/NestJS, Flutter, Azure/Bicep and adapter boundaries; this standard does not authorise production systems, real customer data or external provider activation.

## 2. Local profiles

| Profile | Purpose | Allowed dependencies/data | Must remain impossible |
|---|---|---|---|
| Specification validation | Validate Markdown links/IDs, OpenAPI/events, JSON Schema/reference data | Repository files and standard-library validators | Application runtime, provider route, runtime activation |
| Domain/unit | Run deterministic domain/application tests with in-memory fakes | Synthetic fixtures, deterministic clock/ID/randomness | Network, real credential, provider SDK, shared remote state |
| Local integration | Exercise selected adapters/stores/transport behind local test instances or deterministic simulators | Synthetic data, local ephemeral state, test-only credentials | Production endpoint/account, cross-border assumption, real notification/effect |
| End-to-end synthetic | Exercise client/API/workflow using a complete local synthetic capability set | Named synthetic workspaces/actors/documents/sources | Real household content, external delivery/effect, legal/source coverage claim |
| Failure/replay | Inject timeout, partition, duplicate, reorder, gap, poison, stale policy, deletion and repair | Deterministic event/clock/fault manifests | Unbounded retry, destructive production operation |
| Restricted candidate evaluation | Evaluate a future adapter only after an approved plan | Isolated test account/route and approved synthetic corpus | General developer credential, automatic activation, production content |

Profile names express behavior, not deployment topology. A local environment may use one or many processes after technology selection.

## 3. Synthetic workspace and policy baseline

The local seed includes at least:

- two unrelated workspaces with intentionally colliding display names/external-like values;
- owner, adult member, managed dependant subject without login, guest/adviser, expired/revoked grant, service workload, and unauthorized actor;
- public/global reference and platform-control fixtures containing no household fields;
- current/stale authorization epochs, field/edge restrictions, purpose allow/deny, session risk, and mid-flow revocation;
- active/no-fence and deletion-fenced generations, late events, restore/rebuild attempts, quarantine and policy-hold artifacts;
- valid, invalid, conflict, historical/bitemporal, unknown-time, superseded, restricted, and unavailable facts/rules/evidence;
- deterministic healthy/stale/unavailable synthetic sources using only non-routable/reserved endpoints;
- enabled local in-product behavior and disabled connector/external-channel/recovery/continuity/scoring/clinical/residency-dependent branches;
- synthetic provider-like success, timeout-before-effect, timeout-after-possible-effect, partial, invalid-schema, rate-limit, and deletion-ack behaviours; and
- no real names, contact details, documents, credentials, prompts, answers, regulated identifiers, or copied production examples.

Fixture manifests carry stable opaque ID/version, generator/version/seed, classification, purpose, intended workspace, contract/reference/config versions, expected outcomes, provenance, limitations, and deletion/reset behavior.

## 4. Fake port contract

Each future port has a deterministic fake that implements the same provider-neutral contract and supports controlled outcomes:

| Port class | Required fake controls |
|---|---|
| Identity/authorization | authentication classes, session expiry/revocation, step-up required, allow/deny/redact/minimal disclosure, epoch lag/unavailable |
| Canonical/artifact | revisions/conflicts, durability failure windows, integrity mismatch, quarantine, unavailable storage, scoped redemption, deletion residual |
| Event/workflow | duplicate, reorder, gap, delay, poison, partition, publish ambiguity, DLQ, replay generation, cancellation |
| Parser/OCR/AI/search/graph | valid/invalid schema, insufficient/restricted/stale/conflict, timeout, deterministic nondeterminism seed, evidence mismatch, budget limit |
| Source/connector/action | safe reserved endpoint, cursor/version/permission drift, callback replay, partial/unknown outcome, revoke/delete/resync |
| Notification | in-product record, duplicate delivery attempt, blocked channel, acknowledgement, failure; no real external send |
| Audit/telemetry | success, unavailable, delayed/gap, content-canary rejection; separate required audit from telemetry |
| Key/secret/residency | logical version/revoke/deny and route eligibility only; no imitation of production assurance |

Fakes cannot assert that production security, durability, region, deletion, delivery, recovery, cost, accessibility, or performance requirements pass. Their manifests declare deviations.

## 5. Configuration and secret safety

Local configuration is layered from checked-in safe schema/defaults plus untracked developer overrides. Defaults:

- bind to local-only interfaces unless a reviewed test requires otherwise;
- deny outbound network except an explicit isolated candidate-evaluation allow-list;
- use synthetic workspace/reference/configuration packages;
- disable connectors, external notification, recovery, continuity, aggregate scores, clinical ordinary processing, and unresolved residency routes;
- use test-only short-lived or deterministic fake credentials with no production privilege;
- make destructive/reset targets explicit local instance IDs; and
- label all UI/API/email-like/export-like outputs `SYNTHETIC — NOT SENT / NOT LEGAL OR PRODUCTION EVIDENCE`.

No sample file contains an actual secret-shaped usable value. Secret-required profiles fail clearly when the approved test credential is absent; they do not fall back to embedded/default/shared credentials.

## 6. Determinism and build inputs

A clean local verification records:

- source revision and dirty-state declaration;
- selected local profile;
- toolchain/dependency lock manifest and integrity/provenance result after selection;
- contract, reference-data, configuration, schema, migration, generator, fixture, and seed versions;
- UTC/test timezone, deterministic clock/ID/randomness settings where applicable;
- capability/adapter/fake versions and decision-fence state; and
- command/test result and generated-output drift.

No current date, local timezone, machine username/path, network availability, unpinned remote artifact, provider default, or mutable latest tag may silently change a deterministic result. Tests that intentionally use time/nondeterminism declare and capture it.

## 7. State, migration, replay, and reset

Local state is disposable but must exercise production semantics:

1. initialize schemas/configuration/reference packages through versioned setup/migrations, not ad hoc table edits;
2. create synthetic canonical records through owning commands where the behavior is under test;
3. retain immutable originals/events/evidence and exact versions inside a test run;
4. build derived generations with source/policy/deletion watermarks and validate before cutover;
5. support repeatable crash-window/outbox, duplicate/reorder/gap, replay/DLQ/repair, and migration interruption fixtures;
6. apply deletion fences before purge and verify late replay/rebuild/restore cannot resurrect data; and
7. reset only the explicitly resolved local test profile, then prove no state/secret escaped its boundary.

Reset tooling must print/return the resolved environment/profile/instance and refuse production-like, remote, unknown, root, home, repository-root, or unresolved targets. Broad recursive deletion, implicit wildcards, and shared developer-state deletion are prohibited.

## 8. Quality commands

The current repository gates, run from the repository root, are:

```sh
pnpm verify:framework
pnpm verify:spec
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

PostgreSQL authority migration, synthetic import and verification use the commands and activation controls in `docs/09-devops/07-postgresql-authority-persistence.md`. Ordinary local tests use PostgreSQL-compatible in-memory integration; CI runs the affected suite against an ephemeral PostgreSQL 17 service. Neither is Azure/production conformance.

After a toolchain is approved, the root developer interface must expose documented non-interactive capabilities for:

| Command capability | Required result |
|---|---|
| `bootstrap/check` | Verify compatible pinned toolchain/dependencies without fetching or executing untrusted code silently |
| `generate` | Reproduce generated contracts/reference bindings/docs and fail on drift |
| `format/check` | Deterministic formatting and no unexplained source mutation |
| `static` | Compile/type/lint/security/dependency/license/secret checks as applicable |
| `test-unit` | Deterministic domain/application unit/property tests |
| `test-contract` | API/event/reference/structured-output/port compatibility and examples |
| `test-integration` | Local adapter/store/transaction/outbox/migration integration |
| `test-e2e` | Synthetic critical journeys with accessibility/security assertions |
| `test-resilience` | Failure, retry, duplicate/order/replay/DLQ/deletion/restore matrix |
| `verify` | The merge-gate superset, manifesting every constituent result |
| `reset-local` | Safe explicit local-state reset with target guard and post-condition |

Names/syntax may differ by chosen toolchain, but there is one discoverable root entry point and CI invokes the same underlying commands. A passing developer shortcut cannot omit merge/release gates.

## 9. Debugging and observability

Local debug mode still obeys privacy allow-lists. It may expose safe synthetic opaque IDs, contract/config versions, state/reason, attempt, correlation/causation, watermarks, counts/buckets, and fault-injection label. It does not log synthetic raw content merely because the content is fake; testing the production prohibition is part of local behavior.

Debug authorization bypasses, universal admin roles, disabled deletion fences, accepted invalid schemas, unbounded queues, or force-success provider switches are prohibited. Test-only controls are compile/package/profile isolated, default off, authenticated/authorized where reachable, and impossible to include in a release artifact.

## 10. Parity and limitations

Every local profile publishes a parity matrix:

| Dimension | Required declaration |
|---|---|
| Semantics | Which domain/API/event/port behaviors are exact versus simplified |
| Security | Which identity, cryptography, isolation, browser/network, privileged-access properties are not production proof |
| Data | Synthetic coverage, size/layout/language/slice limits |
| Async/failure | Ordering, delivery, partition, clock and recovery simulation fidelity |
| Residency/privacy | Local placement is not Australian-residency or processor assurance |
| Performance/cost | Local measurements are diagnostic, not NFR/cost evidence unless an approved representative plan says so |
| Accessibility/client | Device/browser/assistive-technology gaps |
| External capability | Fake/candidate adapter differences, no delivery/effect/authority claim |

A local pass never substitutes for representative integration, security, privacy, accessibility, load, recovery, AI evaluation, or production-readiness evidence.

## 11. Stable engineering rules

| Rule ID | Draft normative rule |
|---|---|
| `ENG-DEV-P1-001` | Local development MUST follow the accepted Phase 1 implementation decisions while remaining synthetic, outbound-denied and separately gated from provider activation. |
| `ENG-DEV-P1-002` | Local profiles MUST be named, versioned, documented, and default to synthetic, local-only, outbound-denied behavior. |
| `ENG-DEV-P1-003` | Production endpoints, accounts, data, credentials, keys, notifications, connectors, and effects MUST NOT be reachable from an ordinary local profile. |
| `ENG-DEV-P1-004` | Fixtures MUST be synthetic by default and MUST carry stable ID/version, generator/seed, classification, purpose, scope, provenance, expectations, and limitations. |
| `ENG-DEV-P1-005` | At least two unrelated synthetic workspaces MUST exercise collisions and cross-workspace negative behavior in local integration/E2E profiles. |
| `ENG-DEV-P1-006` | Local identity/subject/membership/grant fixtures MUST preserve their distinct meanings and cover owner/member/dependant/guest/workload/revoked states. |
| `ENG-DEV-P1-007` | Local policy fixtures MUST cover current/stale epochs, field/edge restrictions, purpose denial, mid-flow revocation, quarantine, and deletion. |
| `ENG-DEV-P1-008` | Global/platform fixtures MUST contain no household identifier or personalized content. |
| `ENG-DEV-P1-009` | Synthetic source URLs/endpoints MUST be non-routable/reserved, disabled by default, and unable to imply authority or coverage. |
| `ENG-DEV-P1-010` | Conditional connector, external-channel, recovery, continuity, scoring, clinical, deletion-duration, and residency routes MUST stay disabled while decisions remain open. |
| `ENG-DEV-P1-011` | Every port MUST have deterministic fake behavior for valid, invalid, timeout, unavailable, partial/unknown, revoke/delete, and compatibility outcomes as applicable. |
| `ENG-DEV-P1-012` | Fakes MUST implement provider-neutral contracts and MUST NOT leak a candidate/provider object model into domain/application code. |
| `ENG-DEV-P1-013` | A fake/local pass MUST NOT be represented as production durability, security, residency, deletion, delivery, recovery, performance, cost, or accessibility evidence. |
| `ENG-DEV-P1-014` | Local configuration MUST be schema-validated, disabled/deny by default, versioned where consequential, and separate from secrets. |
| `ENG-DEV-P1-015` | Sample configuration MUST contain no usable secret; missing required test credentials MUST fail, not fall back to embedded/shared values. |
| `ENG-DEV-P1-016` | Test-only controls/bypasses MUST be isolated, unreachable by default, absent from release artifacts, and incapable of forcing business success. |
| `ENG-DEV-P1-017` | Local builds/generation/tests MUST use pinned inputs and record source, toolchain, dependencies, contracts, reference/config, fixtures, seed, and environment. |
| `ENG-DEV-P1-018` | Clock, timezone, randomness, ID generation, delivery order, and faults MUST be controllable and recorded for deterministic tests. |
| `ENG-DEV-P1-019` | Generated output MUST reproduce from clean source and a drift check MUST reject unexplained changes. |
| `ENG-DEV-P1-020` | Local initialization and migrations MUST use versioned production-semantic paths rather than manual storage mutation. |
| `ENG-DEV-P1-021` | Local event/workflow support MUST exercise commit/publish crash windows, duplicate/reorder/gap/poison, replay, DLQ, cancellation, and repair. |
| `ENG-DEV-P1-022` | Local deletion MUST establish a fence and prove late event/replay/rebuild/restore non-resurrection before reset. |
| `ENG-DEV-P1-023` | Reset MUST resolve and display an explicit local target and refuse remote, production-like, unknown, broad, home, root, or repository-root targets. |
| `ENG-DEV-P1-024` | Local debug logs/errors/traces MUST follow the production privacy allow-list even for synthetic content. |
| `ENG-DEV-P1-025` | Local service labels/UI outputs MUST clearly state synthetic/non-production status and MUST NOT claim legal, source, delivery, recovery, or residency assurance. |
| `ENG-DEV-P1-026` | Repository quality commands MUST be non-interactive, deterministic, root-discoverable, composable, and shared with CI. |
| `ENG-DEV-P1-027` | Framework, specification, API-contract, reference-data and traceability validators MUST pass together through the root verification gate before engineering source changes are considered consistent. |
| `ENG-DEV-P1-028` | Future root verification MUST include generation drift, static/security/dependency/secret checks, unit, contract, integration, and mapped critical tests. |
| `ENG-DEV-P1-029` | A local profile MUST publish semantic, security, data, async, residency, performance/cost, accessibility, and external-capability parity limitations. |
| `ENG-DEV-P1-030` | Local convenience MUST NOT weaken domain invariants, authorization, audit, original integrity, deletion, route eligibility, open-decision fences, or stop-ship tests. |

## 12. Local-profile readiness

No local application profile is release evidence until its manifest, synthetic fixture inventory, fake-port contracts, secret/network guard, migration/reset safety, deterministic build/generation, quality commands, failure controls, privacy-safe diagnostics, and parity declaration are reviewed. The current root/CI commands are the executable development baseline; representative security, recovery, accessibility, performance and provider conformance remain separate gates.
