# Phase 1 Testing and Evidence Standards

| Field | Value |
|---|---|
| Document ID | `ENG-TST-001` |
| Version | `0.1` |
| Status | **DRAFT — test tools, languages, and environments not selected** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |
| Gate inputs | `CODEX.md` definition of done; `ARCH-NFR-001` stop-ship rules; security/privacy/audit/threat and `AI-EVAL-001` |

## 1. Purpose and release stance

This document defines the test layers, matrices, fixtures, evidence, ownership, stop-ship behavior, and waiver rules required of any future implementation. It does not select a test framework, browser/device service, scanner, load platform, CI product, coverage tool, language, or environment provider.

Testing proves a declared candidate and scope against versioned contracts. It cannot prove an unstated requirement, compensate for an open decision, make a DRAFT reference record active, or convert a fake/local result into production assurance. A failure that preserves security by failing closed still counts against the applicable availability/experience objective.

## 2. Test case and run contract

Each durable test case records:

| Field | Required semantics |
|---|---|
| Identity | Stable test-case ID/version and owning suite/component |
| Traceability | Requirement, acceptance, architecture/domain/data/workspace, NFR, security/privacy/audit/threat, API/event/connector/AI/engineering rule IDs |
| Risk | Consequence/severity, protected slice, stop-ship mapping |
| Preconditions | Exact contract/schema/reference/config/policy/migration/build/candidate versions and state |
| Fixtures | Synthetic fixture/generator/seed IDs, classification, workspace, purpose, provenance, deletion |
| Action | Deterministic inputs, clock/randomness/fault/order controls and port outcomes |
| Oracle | Expected domain state/revision, events/audit, response/problem, evidence/coverage, side effects and prohibited observations |
| Cleanup | Cancellation/reconciliation/purge/reset and proof of no escaped state |
| Ownership | Maintainer, reviewers, automation/manual status, environment and cadence |

Each run creates an immutable manifest with source/build/dependency/provenance, environment/profile, all input versions, selected test IDs, shard/order/seed/faults, start/end, results, retries, quarantines, artifacts/digests, data-quality/coverage state, exceptions, and approvers. Ordinary evidence is content-free.

## 3. Test layers

| Layer | Primary purpose | Required examples |
|---|---|---|
| Specification/static | Source links/IDs, JSON/JSON Schema/OpenAPI, generated drift, compile/type/lint/security/dependency/secret/license rules | All repository validators; boundary/dependency checks |
| Unit/property | Pure value objects, invariants, state/temporal logic, policies, parsers/normalizers where deterministic | Invalid values, state transitions, bitemporal corrections, authorization precedence, randomized bounded properties |
| Component | One aggregate/workflow/capability with fake ports | Commands/queries, idempotency, concurrency, failure/degraded/cancel/repair states |
| Contract | API/event/connector/structured-output/reference/port/provider-neutral compatibility | Schemas/examples, old/new/unknown versions, consumer/provider conformance |
| Integration | Real selected implementation boundaries with ephemeral test dependencies | persistence constraints, transaction/outbox, migrations, encryption/access, adapter mapping |
| End-to-end | User/API/worker journey across all logical owners using synthetic workspaces | onboarding, upload/review, evidence/search/Q&A, grants, actions, tasks, export/deletion |
| Security/privacy | Threat/control and data-lifecycle negative tests | cross-workspace/field/edge/inference, injection, egress, secrets, audit, deletion, support |
| Resilience/recovery | Fault, partition, retry, replay, DLQ, restore, DR, degraded behavior | crash windows, duplicate/reorder/gap/poison, unknown effect, telemetry/audit outage |
| Performance/capacity/cost | NFR latency/throughput/freshness/isolation/cost with representative workload | percentiles, backlog drain, noisy neighbor, budget exhaustion, attribution |
| Accessibility/UX | Applicable WCAG and critical journey usability/status/recovery | keyboard, screen reader, reflow/zoom, focus/status/error, interrupted async work |
| AI/document evaluation | Provider-neutral quality, evidence, guardrails, slices, drift and candidate release | `AI-EVAL-001` datasets/gates and document-intelligence exact vocabularies |
| Operational exercise | Incident, repair, key/secret, migration, rollback/forward repair, backup/restore/DR | Timed runbooks with safe evidence and separation of duties |

No fixed testing pyramid percentage is mandated. Risk and contract ownership determine the layer; critical behavior is tested at the lowest deterministic layer and at every integration boundary capable of invalidating it.

## 4. Traceability and coverage

Before merge/release:

1. every changed requirement/rule/contract/state/port/migration has mapped tests;
2. every acceptance scenario has at least one positive and required negative/failure implementation path;
3. every NFR has a measurement/evidence owner and no zero-tolerance control is sampled away;
4. every `THR-P1-*` treatment has a verification hook and retained result;
5. every API operation and event/connector type has schema, auth/scope, success, safe error, compatibility, idempotency/concurrency where applicable, and decision-fence coverage;
6. every aggregate state machine tests valid and invalid transitions, stale revision, duplicate command, cancellation, deletion, and audit/event obligations;
7. every data role has create/read/update/version/derive/export/delete/restore and cross-workspace coverage as applicable; and
8. coverage gaps are explicit `NOT_TESTED`/`INSUFFICIENT` and cannot be treated as passes.

Statement/branch coverage may be a diagnostic after tool selection, but no universal percentage is invented. Passing lines does not prove invariants, threats, compatibility, or data non-disclosure. Risk, mutation/fault sensitivity, boundary matrix, and requirement traceability are the controlling coverage evidence.

## 5. Contract and compatibility suites

### 5.1 API

For every `API-P1-101`–`183` operation test:

- explicit bearer authentication and current authorization;
- workspace path/header equality and required purpose;
- closed request/response/problem schemas and supported content types;
- malformed/unknown/oversize values and existence-safe errors;
- ETag/`If-Match` stale/current behavior where required;
- idempotency first call, identical replay, fingerprint mismatch, cross-actor/workspace collision;
- pagination/snapshot/filter/sort bounds and no hidden counts;
- async job status/cancel/retry/coverage and artifact grant/redemption scope;
- quotas/rate/resource behavior and privacy-safe correlation;
- open-decision availability metadata and disabled behavior; and
- current-policy/deletion changes between request, work, result, and redemption.

### 5.2 Events

For `EVT-P1-001`–`032`:

- filename/catalogue/schema/example/event type/version agreement and common envelope;
- closed schema, scope/workspace rules, safe classification, event/aggregate identity, order and immutable bytes;
- duplicate, same-ID/different-bytes, delay, reorder, same-revision index, gap, stale event, partition, retry and replay;
- consumer current authorization, quarantine, source-health, approval/effect, residency, cancellation and deletion checks;
- outbox crash before/after commit/send/ack and required audit outage;
- old/new/unknown major/minor compatibility and retained decoders;
- DLQ/repair/replay generation and no repeated external effect; and
- privacy canaries prohibiting content, filename, prompt/query/answer, credential, provider payload and unrestricted URL.

### 5.3 Reference data, structured output, and ports

Reference data tests validate schema, unique/dangling/typed IDs, metadata/effective/retirement, exact controlled vocabularies, inert DRAFT/disabled seeds, clinical `POLICY_HOLD`, synthetic sources, no duration/score/channel activation, and safe package publication.

Structured document/AI outputs test unknown fields/versions, scope/generation, exact evidence anchors, presence/conflict/restriction, confidence/coverage, prohibited effects, guardrails, and current-policy/deletion at storage/use. Provider/adapter conformance runs the same port suite against deterministic fake and every candidate exact version; provider-specific tests may add but cannot weaken common assertions.

## 6. Domain, data, migration, and race matrices

Required domain/data cases include:

- identity versus subject versus membership/relationship/role/grant and managed-dependant transition;
- two unrelated workspaces across every canonical/derived store, cache, index, graph, event, audit, backup, support, and error surface;
- fact/rule bitemporal overlap, backdated correction, knowledge-as-of, uncertainty, conflict/resolution, and immutable prior belief;
- acquisition attempt versus artifact versus logical document/version and byte-equality non-identity;
- immutable original/evidence mutation attempts, exact anchors, reprocessing generations, active-selection decision;
- typed dependency endpoint/direction/cardinality/time/provenance, cycles/depth, restricted bridge and impact-path coverage;
- recommendation/approval/effect digest/action attempt/unknown/partial/reconciliation/evidence/fulfilment separation;
- deletion case/fence/purge acknowledgements/residuals/tombstone/late event/rebuild/resync/backup restore non-resurrection;
- canonical expand/validate/migrate/switch/retire interruption at each stage, old-reader/new-writer matrices, rerun, rollback/forward repair;
- derived rebuild generation validation/cutover/retirement with authorization/deletion/source watermarks; and
- configuration/reference activation, supersession, incompatible consumer, rollback/replay and missing acknowledgement.

Concurrency tests control barriers so authorization revocation, grant expiry, target revision change, approval revocation, cancellation, quarantine, deletion fence, policy/config activation, source staleness, and adapter outcome occur at every material stage: before lookup, after candidate retrieval, before/after model/tool, before commit, after enqueue, before effect, after possible effect, before output/redemption/export, and during replay/restore.

## 7. Security, privacy, and abuse testing

The mandatory suite maps every `SEC-P1-*`, `AUTH-P1-*`, `PRIV-P1-*`, `AUD-P1-*`, and `THR-P1-*` rule and includes:

- missing/forged/mismatched workspace, actor, purpose, policy, grant, relationship, field/edge, consent and service context;
- horizontal/vertical access, hidden-resource enumeration, counts/facets/snippets/timing/errors/caches/conversations/audit/support inference;
- session theft/fixation/revocation/step-up and absence of a recovery/break-glass bypass while decisions remain open;
- malicious/polyglot/encrypted/active/archive/decompression/oversize files; scanner/parser timeout/bypass and quarantine routes;
- injection across API/query/template/path/URL/redirect/render/source/document/model/tool/provider/callback and SSRF/egress;
- credential/key/secret exposure, unsafe transport/storage, dependency/build artifact tamper and privileged-duty separation;
- consent withdrawal, connector permission drift/disconnect/resync, provider retained copy and late callback;
- telemetry/audit/error/screenshot/ticket/build canaries and property allow-lists;
- export/deletion reauthorization, temporary outputs, audit minimization, backup residual and restore; and
- resource exhaustion, quota evasion, fan-out/depth/size, queue/retry/cost storm and noisy-neighbor isolation.

Confirmed unauthorized disclosure/effect, original mutation/loss, deletion resurrection, unapproved processing/region, prohibited telemetry record, clinical ordinary-route escape, missing required audit, or unresolved critical/high residual risk is stop-ship under the owning contract.

## 8. Resilience, recovery, and degraded behavior

Fault injection covers each dependency in `NFR-P1-005` and each degradation row in `ENG-ERR-001`. Tests assert both safety and correct availability accounting:

- dependency timeout, refusal, overload, malformed response, inconsistent response, and incompatible version;
- process/transaction failure at every commit/outbox/publish/checkpoint/cutover boundary;
- delayed/dropped/duplicate/reordered/poison messages, forward gap, partition, replay and DLQ repair;
- stale/missed authorization epoch and deletion generation;
- cancellation/deletion/revocation during expensive work or external effect;
- external timeout-before-effect versus after-possible-effect, partial result, receipt-only, reconcile and repair;
- audit outage versus telemetry outage; required product controls never depend on telemetry delivery;
- backup/restore into current schema/policy/residency/fence and application-level integrity/audit verification;
- rollback rejection where unsafe, and forward-repair path; and
- user/API state remains truthful, accessible, retry-safe, and non-disclosing.

Recovery exercises measure from declared start to application-level safe capability, not infrastructure startup, and compare against provisional `NFR-P1-026`–`031` only when the environment/data profile is approved as representative.

## 9. AI, document intelligence, and source evaluation

The full `AI-EVAL-001` framework is incorporated, not replaced. Candidate runs retain `EvaluationPlan`, `DatasetManifest`, fixtures/gold/adjudication, `RunManifest`, metric results/findings, and release decision. Required slices cover approved type/schema/field/language/quality/layout/jurisdiction, native/OCR/manual route, sensitivity, temporal/freshness, evidence strength, conflict/restriction, consequence, source health, adapter and synthetic generator.

Tests separately measure classification, typed extraction/presence/anchors, entity/fact resolution, graph/path validity, supported comparison, exact applicability outcomes, exact five impact classes and dimensions, health signals/disposition/fulfilment, authorized retrieval, citation resolution/support/coverage, faithfulness, confidence/calibration/selective risk, insufficient-evidence safety, injection/tool/effect, latency/reliability/cost, and human correction.

Aggregate results cannot hide a critical slice. Unset launch slices, sample sufficiency, calibration/review thresholds, source coverage, processor/residency, clinical policy, or scoring policy means disabled/review-only according to the owning contracts.

## 10. Accessibility and critical journeys

Every release exercises all Phase 1 critical journeys with the approved browser/device/assistive-technology matrix. Automated accessibility checks supplement, not replace, manual keyboard and screen-reader testing.

Tests cover accessible name/role/state, focus order/visibility/restoration, status/live updates, errors/instructions, reauthentication and preserved input, timeouts/extensions, modals/overlays, tables/graphs with equivalent access, evidence/citation navigation, file/camera alternatives, reflow at 320 CSS px, 200% text resize, 400% zoom, reduced motion/contrast/target size as applicable, and truthful async/degraded/cancel/retry states.

No screenshot/golden artifact contains real household data. Visual diffs are versioned by environment and reviewed for both intended change and privacy leakage.

## 11. Performance, capacity, freshness, and cost

Performance evidence uses a versioned representative workload/corpus/forecast with synthetic tenants, warm/cold/cache state declared, independent client/server timing, percentile method, sample/data-quality state, operation/slice segmentation, dependency behavior, queue/backlog drain, resource/cost attribution, and correctness/safety assertions.

Tests cover `NFR-P1-007`–`021` and `044`–`045` as applicable: simple read/mutation, search, redemption, Q&A, ingestion, status propagation, forecast amplification, noisy neighbor, authorization/deletion convergence, projection/source/config freshness, stale transparency, intelligence attribution and budget exhaustion. A faster unauthorized/stale/unsupported result is a failure. Targets remain provisional until approved and are not customer SLAs.

## 12. Evidence, flakiness, quarantine, and waivers

Test evidence is immutable by run and includes failures, not only summaries. A retry does not erase the first failure; the manifest shows every attempt and final classification. Flaky means the system/test is nondeterministic outside its declared model, not “pass on retry.”

A flaky test:

1. is immediately classified by risk and owner;
2. remains blocking for zero-tolerance/critical behavior;
3. may be quarantined only for a named non-safety scope with issue, expiry, root-cause plan, compensating coverage, and approval;
4. is excluded transparently from pass rates and leaves the mapped requirement `INSUFFICIENT`; and
5. returns only after deterministic evidence proves repair.

A waiver cannot close an open decision or waive law/policy, unauthorized disclosure/effect, original integrity, deletion fence, required audit, unapproved residency route, critical accessibility blocker, or other zero-tolerance gate. A permissible temporary quality waiver names exact version/slice, evidence, impact, safer mode, controls, owner/approvers, start/expiry, monitoring, remediation, and rollback/disable trigger.

## 13. Quality commands

The current required source gates are:

```sh
python3 scripts/validate-specifications.py
python3 scripts/validate-api-contracts.py
python3 scripts/validate-reference-data.py
```

Future implementation adds the root command capabilities defined by [local development](05-local-development.md): generation drift, static/security/dependency/secret checks, unit/property, contract, integration, end-to-end, security/privacy, resilience/recovery, performance/accessibility, AI evaluation, and an aggregate verify command. CI and developers invoke the same underlying commands and versions.

## 14. Stable engineering rules

| Rule ID | Draft normative rule |
|---|---|
| `ENG-TST-P1-001` | Every test MUST have stable identity/version, owner, traceability, risk, exact inputs/state, oracle, cleanup, environment, and cadence. |
| `ENG-TST-P1-002` | Every run MUST retain an immutable manifest of source/build/dependencies, contracts/config/fixtures, seed/fault/order, results/retries, evidence and exceptions. |
| `ENG-TST-P1-003` | Test fixtures MUST be synthetic by default and MUST NOT copy production household content or credentials into ordinary environments/evidence. |
| `ENG-TST-P1-004` | Tests MUST assert required outputs/state/evidence and prohibited observations/effects; absence of an exception is insufficient. |
| `ENG-TST-P1-005` | Changed requirements, rules, contracts, states, ports, migrations, threats, and NFRs MUST have mapped test impact before merge. |
| `ENG-TST-P1-006` | Coverage gaps and insufficient samples MUST be explicit and MUST NOT count as passes. |
| `ENG-TST-P1-007` | Line/branch percentages MAY be diagnostic after tool selection but MUST NOT replace risk, mutation/fault, boundary, and traceability coverage. |
| `ENG-TST-P1-008` | Critical behavior MUST be tested at the lowest deterministic layer and at every integration boundary that can invalidate it. |
| `ENG-TST-P1-009` | Domain tests MUST cover exact state transitions, invalid transitions, expected revisions, idempotency, event/audit obligations, and separate state ownership. |
| `ENG-TST-P1-010` | Bitemporal tests MUST cover valid/transaction time, overlap, backdating, knowledge-as-of, uncertainty, conflict, correction, and immutable history. |
| `ENG-TST-P1-011` | Original/evidence tests MUST prove immutable bytes/anchors, additive versions/analyses, exact provenance, active selection, purge and non-resurrection. |
| `ENG-TST-P1-012` | Every storage, cache, index, graph, event, audit, support, export, backup, error and inference surface MUST pass two-workspace isolation. |
| `ENG-TST-P1-013` | Authorization tests MUST cover resource, field, edge, retrieval, inference, action, notification, export, audit, support, purpose and minimal disclosure. |
| `ENG-TST-P1-014` | Revocation/deletion/policy race tests MUST interleave every material retrieval, model/tool, commit, enqueue, effect, output, redemption, replay and restore stage. |
| `ENG-TST-P1-015` | API tests MUST cover security/context, closed schemas, safe problems, pagination, ETags, idempotency, jobs, quotas, artifacts and decision fences per operation. |
| `ENG-TST-P1-016` | Event tests MUST cover envelope/schema, immutable identity, duplicate/different-bytes, ordering/gaps, replay/DLQ, current policy and deletion. |
| `ENG-TST-P1-017` | Contract compatibility MUST cover supported old/new and unknown/incompatible producer, consumer, reader, writer, schema, reference, adapter and generated versions. |
| `ENG-TST-P1-018` | Port conformance MUST run unchanged against a deterministic fake and each exact candidate adapter version before activation. |
| `ENG-TST-P1-019` | Provider-specific tests MAY add evidence but MUST NOT weaken, skip, fork, or reinterpret common provider-neutral assertions. |
| `ENG-TST-P1-020` | Reference-data tests MUST enforce unique/typed references, metadata/retirement, exact vocabularies, and inert decision-fenced seed behavior. |
| `ENG-TST-P1-021` | Canonical migration tests MUST interrupt/rerun each phase, verify old/new compatibility, constraints, lineage, scope, reconciliation and safe repair. |
| `ENG-TST-P1-022` | Derived migration tests MUST rebuild/validate/cut over generations with source, policy and deletion watermarks and inaccessible retired output. |
| `ENG-TST-P1-023` | Async tests MUST cover commit/publish crash windows, duplicate/delay/reorder/gap/poison/partition, idempotent checkpoints, replay and repair. |
| `ENG-TST-P1-024` | External-effect tests MUST distinguish not-dispatched, dispatched, timeout/unknown, partial, receipt, reconciled success/failure, evidence pending and repair. |
| `ENG-TST-P1-025` | Failure injection MUST cover every enabled dependency and assert both safe degradation and correct availability/NFR accounting. |
| `ENG-TST-P1-026` | Audit outage and telemetry outage MUST be tested separately; telemetry loss cannot weaken controls and required audit loss cannot yield false completion. |
| `ENG-TST-P1-027` | Cancellation tests MUST prove durable stage-aware state, too-late/partial/unknown handling, cleanup and no false external-effect cancellation. |
| `ENG-TST-P1-028` | Backup/restore/DR tests MUST verify application-level integrity, schemas, current policy, audit continuity, placement, fences/tombstones and no resurrection. |
| `ENG-TST-P1-029` | Security/privacy tests MUST map every control/threat and include injection, SSRF/egress, secrets, supply chain, abuse/resource and telemetry canaries. |
| `ENG-TST-P1-030` | AI/document tests MUST use versioned manifests/gold/slices and measure evidence, exact outcomes, limitations, guardrails, reliability, cost and human review separately. |
| `ENG-TST-P1-031` | Aggregate AI/document metrics MUST NOT hide a protected, critical, type, field, language, quality, jurisdiction, conflict or restricted slice failure. |
| `ENG-TST-P1-032` | Accessibility tests MUST combine automated checks with manual keyboard/screen-reader and responsive critical journeys on the approved matrix. |
| `ENG-TST-P1-033` | Performance tests MUST use an approved representative workload and report percentiles/segments, correctness/safety, data quality, backlog drain, resources and cost. |
| `ENG-TST-P1-034` | NFR tests MUST preserve provisional/approved status and MUST NOT publish draft target results as customer SLAs. |
| `ENG-TST-P1-035` | Test evidence, logs, screenshots, reports, tickets and recordings MUST obey privacy allow-lists, access, residency, retention and deletion. |
| `ENG-TST-P1-036` | A retry MUST retain the first failure and all attempts; pass-on-retry MUST NOT erase or silently reclassify nondeterminism. |
| `ENG-TST-P1-037` | Zero-tolerance or critical tests MUST NOT be quarantined or waived; a confirmed miss is stop-ship/disable and incident handling. |
| `ENG-TST-P1-038` | Any permitted flaky-test quarantine MUST be narrow, owned, expiring, transparent, compensated and leave mapped coverage insufficient. |
| `ENG-TST-P1-039` | Waivers MUST NOT close open decisions or waive authorization, effect approval, integrity, deletion, audit, residency, clinical, telemetry or critical accessibility gates. |
| `ENG-TST-P1-040` | Developer and CI quality gates MUST invoke the same pinned underlying commands and generated/fixture versions. |
| `ENG-TST-P1-041` | A release decision MUST enumerate passed, failed, skipped, quarantined and insufficient tests by risk/slice with stop-ship and exception status. |
| `ENG-TST-P1-042` | Production activation MUST require retained evidence for contracts, migrations, security/privacy, resilience/recovery, accessibility, applicable NFRs and candidate evaluation. |

## 15. Definition of test ready

A future implementation slice is test-ready only when its traceability, test cases/oracles, synthetic fixtures, fake and candidate port suites, race/fault controls, migration/compatibility matrix, privacy-safe evidence, commands/environments, owners/cadence, stop-ship rules, and permissible waiver boundaries are approved before implementation completion. “Tests to be added later” does not meet the repository definition of done.
