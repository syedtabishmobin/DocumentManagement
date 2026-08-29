# Phase 1 Test Strategy and Core Catalogue

| Field | Value |
|---|---|
| Document ID | `TST-STR-001` |
| Version | `0.3` |
| Status | **APPROVED IMPLEMENTATION BASELINE — candidate-specific release evidence is still required** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `ENG-TST-P1-001`–`042`, `ARCH-NFR-001`, `OPS-CICD-001`, `OPS-DEP-001`, `OPS-OBS-001`, `DEC-049`–`054` |

## 1. Objective and test model

Testing establishes evidence about one immutable candidate, exact contract/configuration/reference versions, and a declared synthetic or approved representative population. It never fills an unspecified requirement, changes product authority, or treats unavailable evidence as success. Safety and availability are scored separately: a correct fail-closed response may pass a security oracle while failing the applicable availability objective.

The required layers are specification/static, unit/property, component, contract, integration, end-to-end, security/privacy, AI/document evaluation, accessibility, performance/capacity/cost, resilience/recovery, and operational exercise. Critical behavior is tested at the lowest deterministic layer and again at every integration boundary capable of invalidating it.

## 2. Durable test-case and run contract

Every test case and its machine-readable entry MUST include stable identity/version, owning suite and role, risk, automation state, exact trace IDs, fixture/dataset/workload/fault references, deterministic preconditions/action, positive oracle, prohibited observations/effects, cleanup, environment class, and cadence. Every run MUST preserve an immutable content-free manifest with candidate/build provenance, input versions, selected test IDs, seed/order/faults, all attempts, results, quarantines/exceptions, evidence digests, data-quality/coverage state, and approvers.

Test cases use exact upstream IDs rather than unvalidated ranges in the JSON manifest. Changes to requirements, rules, states, operations, events, schemas, configurations, threats, migrations, or NFRs require impact analysis against that manifest. A coverage row is `COVERED`, `BLOCKED`, `INSUFFICIENT`, or `UNMAPPED`; only a passing, applicable, representative result supplies release evidence.

## 3. Ownership and lifecycle

| Concern | Accountable owner | Required independent review |
|---|---|---|
| Domain/state/migration | Domain/Data Quality | Architecture and owning domain steward |
| API/event/schema/reference contracts | Contract Quality | API/Event and configuration owners |
| AI/document evaluation | AI Evaluation | Document Intelligence, Product, Security/Privacy |
| Security/privacy/abuse | Security/Privacy Quality | Owning control and threat-treatment owners |
| Product/E2E/accessibility | Product Quality | Product, Design, Accessibility |
| Performance/cost | Performance Quality | Architecture, Operations, Product/Finance for targets |
| Recovery/DR | Operations Quality | Security, Privacy, Data, Architecture |

A test moves through `DRAFT`, `APPROVED`, `RETIRED`; execution uses the separate result vocabulary in the index. No version `0.1` case is approved. Retirement requires a reason, effective time, replacement where applicable, and proof that no requirement/story/contract is left silently uncovered.

## 4. Environments, fixtures, and determinism

The default profile is local or isolated Azure dev/stage integration, outbound denied except to explicitly approved test dependencies, with at least two unrelated synthetic workspaces and controlled clock, timezone, randomness, ID generation, event order, concurrency barriers, fake ports, and faults. Every fixture records its generator and seed, synthetic marker, privacy class, purpose, expected scope, provenance, cleanup, and limitations. Local/dev/stage results are not proof of production security, residency, durability, accessibility, performance, delivery, source authority, or recovery.

Representative performance, accessibility, security, and recovery environments require separate approval and a parity statement. Production content or credentials are prohibited from ordinary test inputs/evidence. Raw synthetic document content is also excluded from ordinary logs so the production minimization path is tested, not bypassed.

## 5. Unit/property catalogue

| Test ID | Deterministic target | Core oracle / prohibited outcome |
|---|---|---|
| `TEST-UNIT-P1-001` | Identifiers, effective periods, reference retirement | Closed formats, interval validity, stable non-reuse, no ambiguous active version. |
| `TEST-UNIT-P1-002` | Identity, subject, relationship, membership, role, grant | Distinct authorities; no implicit private-resource or dependant access. |
| `TEST-UNIT-P1-003` | Acquisition, immutable artifact, logical document and version | Byte equality never forces identity; mutation fails; lineage remains exact. |
| `TEST-UNIT-P1-004` | Ingestion state, idempotency, cancellation and deletion barriers | Only allowed transitions; identical replay has one logical effect; fence wins races. |
| `TEST-UNIT-P1-005` | Evidence anchors, cardinality, presence and confidence | Coordinates resolve to the exact immutable artifact; unknown/restricted is not empty. |
| `TEST-UNIT-P1-006` | Occurrences, bitemporal fact resolution, conflicts and entities | Prior belief is reconstructable; corrections are additive; ambiguity cannot auto-resolve. |
| `TEST-UNIT-P1-007` | Typed dependency records and traversal bounds | Endpoint/direction/cardinality valid; cycles terminate; restricted bridges do not leak paths/counts. |
| `TEST-UNIT-P1-008` | Source health, monitoring, applicability and replay | Failure is not no-change; exact applicability vocabulary; replay is deterministic/idempotent. |
| `TEST-UNIT-P1-009` | Recommendation, bound approval, action, evidence and fulfilment | Separate state owners; stale digest fails; receipt/attempt is not verified closure. |
| `TEST-UNIT-P1-010` | Expand/migrate/contract, configuration and derived generations | Interrupted rerun converges; old/new compatibility holds; current fence/policy prevents resurrection. |
| `TEST-UNIT-P1-011` | Client encryption envelopes, key wrapping and algorithm agility | Web and Flutter known-answer vectors agree; nonces are unique; tamper, wrong context, retired suite and malformed envelope fail closed. |
| `TEST-UNIT-P1-012` | Trash deadline and purge/restore state machine | Delete fences immediately; restore is authorized only before `deleted_at + 30 calendar days`; replay, skew and repeated requests converge without resurrection. |

Property generators MUST bound field sizes, Unicode, time/clock uncertainty, interval overlap, graph cycles/fan-out/depth, page geometry, duplicate/reordered delivery, and concurrency schedules. Shrunk counterexamples preserve the seed and contract versions. Random passes do not replace named boundary cases.

## 6. Contract catalogue

| Test ID | Contract surface | Required coverage |
|---|---|---|
| `TEST-CON-P1-001` | `API-P1-101`–`115` | Identity/workspace/subject/membership/grant auth, context, schema, safe errors, idempotency/concurrency. |
| `TEST-CON-P1-002` | `API-P1-116`–`132` | Intake/quarantine/jobs/document/version/artifact/evidence; disabled clinical branch and redemption reauth. |
| `TEST-CON-P1-003` | `API-P1-133`–`143` | Facts/conflicts/search/answers/jobs; field/retrieval/inference minimization and stale policy. |
| `TEST-CON-P1-004` | `API-P1-144`–`161` | Monitoring/source/impact/recommendation/approval/action; effect digest and unknown/partial outcomes. |
| `TEST-CON-P1-005` | `API-P1-162`–`183` | Tasks/notifications/export/deletion/audit and reserved connector/recovery/continuity/score operations remain fenced. |
| `TEST-CON-P1-006` | `EVT-P1-001`–`010` | Envelope, schema, aggregate order, immutable identity, duplicate/different-bytes, gap/replay/current policy. |
| `TEST-CON-P1-007` | `EVT-P1-011`–`020` | Lifecycle/fact/graph/source/monitor/change state, current fence, source health and deterministic consumers. |
| `TEST-CON-P1-008` | `EVT-P1-021`–`032` | Recommendation through projection; approval/effect separation, audit, purge acknowledgement, publication/rebuild. |
| `TEST-CON-P1-009` | `11-reference-data` schemas/catalogues | Duplicate/dangling/typed refs, metadata/effective/retirement, exact vocabularies, inert seed/fences. |
| `TEST-CON-P1-010` | Extraction/evidence structured output | Closed schemas, exact generations/anchors/presence/confidence, unknown versions, correction/reprocessing. |
| `TEST-CON-P1-011` | AI outputs, tools and guardrail decisions | Closed output/action schemas, citations, capability/policy versions, tool allow-list, no direct effect. |
| `TEST-CON-P1-012` | Provider-neutral source/processor/connector/channel ports | Same suite against fake/candidate version; timeout/malformed/partial/revoke/delete/unknown version; no live activation. |
| `TEST-CON-P1-013` | React web and Flutter iOS/Android shared contracts | OpenAPI, envelope vectors, error semantics, authorization, lifecycle and accessibility labels remain compatible across supported clients. |
| `TEST-CON-P1-014` | Azure Bicep environment contract | Build/What-If, naming, tags, regions, identity, RBAC, diagnostics, lifecycle, budget and no-cross-environment-reference policies pass for dev/stage and parameterized prod. |
| `TEST-CON-P1-015` | Public product, trust, legal-preview and account-entry routes | Direct/refreshed routes, approved identity, CTA modes, claim boundaries, missing-contact and disabled-provider states conform to `UC-P1-020`, `AC-P1-PUB-001`, and `STORY-P1-049` without requiring an account. |

Every API operation and event listed above is expanded as an exact trace ID in the scenario manifest. Per-operation conformance MUST cover authentication, workspace/header equality, purpose, minimal disclosure, supported content type, closed schemas, malformed/unknown/oversize input, current authorization, quotas, correlation, and applicable ETag, idempotency, pagination, async, cancellation, decision-fence, deletion, and redemption behavior. Every event MUST cover the common envelope, immutable bytes, duplicate/different-bytes, delay/reorder/gap, compatibility, checkpoint, DLQ/repair/replay, privacy canaries, and current authority before consequence.

## 7. Domain, migration and race matrix

The combined unit, contract, E2E, security, and DR suites MUST interleave revocation, expiry, target revision change, approval revocation, cancellation, quarantine, deletion fence, configuration activation, source staleness, adapter result, and audit outage at: before lookup; after candidate retrieval; before and after model/tool; before commit; after commit/before publish; after send/before acknowledgement; before effect; after possible effect; before output/redemption/export; and during replay/rebuild/restore.

Migration cases cover empty and populated stores; old reader/new writer and new reader/old writer; expand, backfill, validate, switch and contract interruption; duplicate/reordered work; constraint failure; retained decoder; rollback eligibility; forward repair; authorization/deletion/source watermarks; projection generation cutover; and no hidden loss of immutable evidence, event, audit, idempotency or external-effect history.

## 8. Evidence, flakiness and stop-ship

Oracles assert canonical state/revision, emitted event/audit obligations, caller-safe result, exact evidence/coverage, side effects, and prohibited observations. Cleanup proves cancellation/reconciliation/purge/reset and no escaped state. Retried results retain the first failure. Zero-tolerance authorization, plaintext/key egress, cryptographic-vector conformance, effect approval, original integrity, clinical containment, required audit, deletion resurrection/deadline, residency, telemetry leakage, secret exposure, release provenance, and critical accessibility tests cannot be quarantined or waived.

A non-safety flaky quarantine is narrow, owned, expiring, linked to repair, transparent in coverage, and leaves mapped scope `INSUFFICIENT`. A waiver cannot close an open decision, bypass `DEC-049`–`054`, or turn a provisional target into an SLA.

## 9. Entry and exit evidence

A test is ready to execute only when its owner, versions, fixtures, deterministic controls, oracle/prohibitions, cleanup, environment/parity, automation status, cadence, and evidence destination are reviewed. A release report enumerates passed, failed, blocked, not-run, insufficient, quarantined, and not-applicable cases by risk and slice; requirement/story/AC/NFR gaps; exact candidate and input versions; stop-ship state; and decision-fenced capabilities. A validator pass checks specification trace structure, not implementation readiness.
