# Phase 1 Non-Functional Requirements

| Field | Value |
|---|---|
| Document ID | `ARCH-NFR-001` |
| Version | `0.2` |
| Status | **DRAFT — all numeric targets are provisional until explicitly approved** |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 28 August 2026 |
| Normative basis | Approved decision register through `DEC-054`; approved PRD/architecture and accepted ADRs; security, privacy, audit, threat, testing, and operations contracts |
| Target authority | Product owner plus the accountable specialist named per target; this document does not create a customer SLA |

## 1. Purpose, authority, and target status

This document defines measurable draft Phase 1 service-quality and safety objectives. Stable IDs use `NFR-P1-*`. It covers availability, latency, throughput, freshness, authorization propagation, accessibility, durability, RPO/RTO, recovery, security, residency, observability, and AI/OCR cost.

The hierarchy in [`CODEX.md`](../../CODEX.md) applies. Approved decisions and accepted ADRs outrank this draft. The [Phase 1 PRD](../01-product/02-phase-1-prd.md), [success metrics](../01-product/06-scope-and-success-metrics.md), [`ARCH-SOL-001`](01-solution-architecture.md), [`ARCH-DOM-001`](02-domain-model.md), [`ARCH-DATA-001`](03-logical-data-model.md), [`ARCH-WSP-001`](04-workspace-family-membership-model.md), and security contracts are draft inputs.

Service-level targets in this version remain **PROVISIONAL** unless their row identifies an approved product invariant. “MUST” expresses the required behavior; numeric SLO/customer promises still require the named accountable owners to approve population, exclusions, window, and release consequence. `DEC-038` continues to block account/workspace recovery; `DEC-049`–`053` approve the environment, encryption, client, and document-deletion invariants but not an external SLA.

This document does not select infrastructure, deployment, database, queue, CDN, identity, monitoring, security, AI/OCR, or cost-management products.

## 2. Measurement contract

### 2.1 Common definitions

| Term | Definition |
|---|---|
| Eligible request | A syntactically valid, in-scope request reaching the service boundary with supported client/contract version and no client cancellation. Abuse traffic and deliberate security-test denials are reported separately; legitimate rate-limit failures remain service failures if the caller stayed within its published quota. |
| Successful request | Returns the correct authorized result or truthful accepted/pending/degraded state within the applicable latency objective. A fabricated, stale-as-current, unauthorized, or unaudited result is never a success. |
| Critical workflow | Workspace/session access; authorization; upload acceptance/quarantine; original retrieval; evidence/citation redemption; consequential approval/action; export release; deletion fence; security/audit control. |
| Availability rate | `successful eligible requests / all eligible requests` in the stated window. Both counts and error-duration incidents are reported. |
| Percentile latency | End-to-end server-observed elapsed time from accepted request bytes/context to complete response or defined milestone, calculated per operation and segment. Retries are separate attempts and cannot hide first-attempt latency. |
| Freshness lag | Time from authoritative durable change/event to the consumer watermark proving it can enforce or present that change. |
| RPO | Maximum acceptable committed data interval lost after the declared disaster point. A value of zero means a success acknowledgement cannot precede the required durable evidence. |
| RTO | Time from declared recovery start to the stated service capability meeting its integrity, authorization, deletion, residency, and audit gates—not merely infrastructure startup. |
| Activated workspace | The cohort definition used by `MET-P1-001`; synthetic/internal workspaces are excluded from product-cost denominators but included in reliability tests. |
| Stop-ship | Release, rollout, adapter enablement, or affected capability activation is blocked until evidence passes or an authorized, time-bounded exception is recorded. Zero-tolerance safety rules are not offset by availability or engagement. |

### 2.2 General measurement rules

1. Windows use UTC for operational SLIs; user/business due dates retain configured local-zone semantics.
2. Availability and latency are reported by operation, workspace type, device/client class where observable, region/residency policy, and dependency/capability. Aggregate success cannot hide a critical segment miss.
3. Production, representative pre-production load, synthetic probes, chaos/recovery drills, and contract tests are separate evidence streams. Synthetic success does not replace real traffic evidence, and low production volume does not waive release tests.
4. Planned maintenance counts against these internal objectives unless the product owner approves an explicit exclusion before the window. Security containment intentionally disabling an unsafe capability remains visible as unavailable/degraded, not success.
5. A metric query records numerator, denominator, exclusions, missing-event rate, sample size, percentile method, contract version, and data-quality state.
6. Raw documents, filenames, values, evidence passages, prompts, queries, answers, tokens, relationship details, and unrestricted URLs are prohibited from NFR telemetry.
7. For rates, a denominator of zero is `NO_DATA`, not 100%. A release gate then relies on the required representative fixture/load evidence.
8. A target miss cannot be reclassified or excluded after observation without an approved correction record retaining the original result.

### 2.3 Target-approval labels

| Label | Meaning |
|---|---|
| `PROVISIONAL — approval required` | Draft target is measurable but not an approved commitment. |
| `PROVISIONAL — decision blocked` | Draft control/target exists, but an open decision prevents activation or final promise. |
| `ZERO TOLERANCE — provisional gate` | Proposed release blocker with target 100%/zero incidents; still requires formal baseline approval, but any known miss is unsafe under current draft contracts. |

## 3. Availability and resilience

| NFR ID | SLI, numerator/denominator, and scope | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-001` | Core interactive availability: successful eligible workspace, browse, document, task, and settings requests / all eligible requests; authorization and correctness failures count unavailable. | **≥99.9% per calendar month**, and no single continuous critical-workflow outage over **15 minutes**. | Server outcomes plus independent synthetic critical journeys; segmented daily and reviewed monthly. | PROVISIONAL — product, engineering, operations approval required. |
| `NFR-P1-002` | Authorization-decision availability: valid policy decisions returned within target / all eligible policy-decision attempts. A fail-closed dependency error is secure but counts unavailable. | **≥99.99% monthly**; **100%** of unknown/stale/error cases fail closed or return approved non-sensitive degradation. | Policy service/client telemetry, fault injection, partition tests, policy replay. | PROVISIONAL — security, architecture, operations approval required. |
| `NFR-P1-003` | Durable command acceptance availability: valid synchronous commands that durably commit or create an explicit accepted workflow / all eligible commands. | **≥99.9% monthly**; zero success responses without recoverable state/event/audit obligations. | Command outcome, aggregate revision, outbox/equivalent, audit correlation reconciliation. | PROVISIONAL — architecture, engineering, operations approval required. |
| `NFR-P1-004` | Async workflow/status availability: accepted jobs with a retrievable truthful state / all accepted jobs, sampled continuously. | **≥99.9% monthly**; **100%** of accepted jobs retain a terminal, pending, retry, blocked, cancelled, partial, or repairable state—never disappear. | Job-state probes, event/outbox reconciliation, duplicate/reorder/partition tests. | PROVISIONAL — architecture and operations approval required. |
| `NFR-P1-005` | Safe degraded behavior: dependency-failure scenarios yielding the contractually correct blocked, stale, partial, fallback, retry, or unavailable state / all enabled dependency-failure fixtures. | **100% per release** across identity, authorization, scanner, artifact, parser/OCR/AI, search/graph, source, event, audit, notification, connector, export, deletion, key, region, and telemetry dependencies. | Deterministic failure-injection/chaos matrix; no last-known-success or security bypass. | ZERO TOLERANCE — architecture, security, quality approval required. |
| `NFR-P1-006` | Service degradation detection: critical dependency/control outages detected and represented to operators/users within the allowed time. | Critical control alert **≤5 minutes** from first failed probe; user-safe service state **≤2 minutes** where the failure affects an active journey; **100%** of stale-source cases follow `NFR-P1-021`. | Synthetic probes, alert timestamps, UI/API state fixtures, incident timeline. | PROVISIONAL — product, operations, security approval required. |

## 4. Latency, processing time, and throughput

| NFR ID | SLI and population | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-007` | Server latency for simple authorized metadata/list/detail reads excluding artifact bytes, search, and AI. | Rolling 7 days: **p50 ≤300 ms, p95 ≤750 ms, p99 ≤1,500 ms**. No critical segment p95 may exceed **1,200 ms**. | Server spans from authenticated request acceptance through complete bounded response; representative load and production. | PROVISIONAL — product/UX, engineering, operations approval required. |
| `NFR-P1-008` | Server latency to accept/reject an ordinary synchronous mutation or durably return an async workflow ID. | Rolling 7 days: **p95 ≤1,000 ms, p99 ≤2,000 ms**. | End-to-end API timing including authentication, authorization, concurrency, audit/outbox obligations. | PROVISIONAL — product/UX, architecture, operations approval required. |
| `NFR-P1-009` | Authorized metadata/full-text/hybrid search response excluding generated answer completion. | Rolling 7 days and per release: **p50 ≤1,000 ms, p95 ≤2,000 ms, p99 ≤5,000 ms** for the approved reference corpus and result bound. | Production-safe timing plus fixed corpus/load; stale/partial/unavailable results are labelled and counted separately. | PROVISIONAL — product, search/document intelligence, operations approval required. |
| `NFR-P1-010` | Evidence/citation/original redemption to authorized first usable byte or explicit safe denial, for supported artifact sizes. | Rolling 7 days: **p95 ≤2,000 ms, p99 ≤4,000 ms** after redemption request; integrity/authorization checks remain in path. | Browser/API timing by artifact-size bucket and region; revoked/wrong-scope tests. | PROVISIONAL — product/UX, security, operations approval required. |
| `NFR-P1-011` | Supported evidence-backed Q&A: time to explicit working/degraded state and to final structured answer/limitation. | Reference evaluation and rolling 7 days: status **p95 ≤1 second**; final answer/limitation **p95 ≤15 seconds, p99 ≤30 seconds**; hard timeout produces a truthful retry-safe state by **35 seconds**. | Capability/version segmented timing; provider delay separated but not excluded; citation/authorization validity remains mandatory. | PROVISIONAL — product, AI/document intelligence, operations approval required. |
| `NFR-P1-012` | Supported accepted files reaching `ReviewRequired` or `Ready` without losing the original / all supported accepted files, excluding user-cancelled transfers but including processing failure. | **≥95% within 10 minutes** rolling 7 days; **≥90%** for every approved launch document type with sufficient sample, matching `MET-P1-002`. | File-accepted and state-transition timestamps; size/page/type/route buckets; release corpus. | PROVISIONAL — product, document intelligence, operations approval required. |
| `NFR-P1-013` | Authoritative workflow transition to user-visible job/task/status update for connected/polling supported clients. | Rolling 7 days: **p95 ≤5 seconds, p99 ≤15 seconds**; missed push/channel delivery does not change canonical state. | State/event time to successful authorized API/subscription visibility; reconnect/poll tests. | PROVISIONAL — product/UX, API, operations approval required. |
| `NFR-P1-014` | Capacity headroom under the approved launch traffic/data profile: valid requests/jobs completed within their NFRs at amplified demand. | Sustain **2× forecast peak for 60 minutes** and **1.5× peak for 8 hours**, with **<1%** platform 5xx/job-terminal-failure rate and all latency/security targets met. The launch forecast must contain numeric request, upload, page, job, storage, graph, monitor, and AI rates before beta. | Repeatable mixed-workload load test with synthetic tenants/data; queue/backlog drain and cost recorded. | PROVISIONAL — product, finance, architecture, operations approval required; not approvable until forecast exists. |
| `NFR-P1-015` | Tenant/noisy-neighbour isolation: other conforming tenants’ latency/error change while one synthetic tenant drives 10× its typical assigned workload up to enforced quota. | Other tenants: p95 latency increase **≤20%**, platform error-rate increase **<0.5 percentage points**, and **zero** workspace/authorization/residency leakage; abusive tenant is bounded within **60 seconds**. | Multi-tenant load/abuse suite across API, upload, jobs, search, graph, AI, export, and deletion. | PROVISIONAL — architecture, security, operations approval required. |

## 5. Freshness, propagation, and staleness

| NFR ID | SLI, numerator/denominator, and scope | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-016` | Grant/membership/policy/security revocation convergence: affected consumers at or beyond the new authorization epoch / all registered consumers for the affected scope. | High-impact execution, export release, artifact/citation redemption, and deletion reauthorize synchronously (**zero known-stale allow**). All registered caches/projections/conversations/jobs converge **p99 ≤60 seconds**, maximum **5 minutes** before forced unavailable/rebuild. | Epoch publication/consumer watermark; mid-flow revocation tests across every `SEC-AUTH-001` surface. | ZERO TOLERANCE for stale disclosure; timing PROVISIONAL — security, product, architecture approval required. |
| `NFR-P1-017` | Deletion-fence propagation: accepted deletion targets protected by an authoritative fence and registered consumers observing its generation. | **100%** of deletion acceptance responses follow durable fence activation; direct access denied immediately; registered derived/worker/restore consumers converge **p99 ≤60 seconds**, with fail-closed lookup throughout lag. | Fence/ack timestamps, late-event/rebuild/restore/connector tests, `AC-P1-DEL-001`. | ZERO TOLERANCE — privacy, security, architecture approval required; completion durations blocked by `DEC-039`. |
| `NFR-P1-018` | Ordinary derived projection freshness from eligible authoritative event to queryable new generation/watermark, excluding policy/deletion changes governed above. | Rolling 7 days: **p95 ≤2 minutes, p99 ≤10 minutes**; at **30 minutes** lag the affected query must be explicit stale/partial/unavailable unless a stricter capability rule applies. | Event-to-watermark lag by projection/partition; backlog, dead-letter and repair state. | PROVISIONAL — product, architecture, operations approval required. |
| `NFR-P1-019` | Governed-source schedule and health freshness: enabled source attempts started by due time and health state updated after attempt/failure. | **≥99%** of attempts start by `scheduled_at + max(5 minutes, 10% of cadence)` monthly; attempt/failure health visible **≤60 seconds** after durable outcome; source-specific stricter objectives may override. | Scheduler/source-health timestamps, outage/parser tests, configured cadence/version. | PROVISIONAL — product, document intelligence, operations approval required; launch sources blocked by `DEC-035`. |
| `NFR-P1-020` | Consequential configuration/policy propagation: registered consumers validating the activated version / all required consumers. | Activation waits for required validation; consumer convergence **p99 ≤5 minutes**. Security/deletion policy change uses synchronous current checks until convergence. Missing consumer acknowledgement blocks activation or affected capability. | Package publication, consumer watermark, compatibility and replay/rollback evidence. | PROVISIONAL — architecture, security, configuration owner approval required. |
| `NFR-P1-021` | Stale-source transparency: source-derived presentations during stale/unhealthy state that disclose/suppress according to policy / all such presentations. | **100% continuously**, matching `MET-P1-015`; zero last-known value represented as current. | Presentation policy outcome joined to source-health revision without raw content. | ZERO TOLERANCE — product, document intelligence, quality approval required. |

## 6. Accessibility and responsive experience

| NFR ID | SLI and scope | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-022` | Standards conformance for all Phase 1 user-facing pages/components and critical workflows. | Conform to **WCAG 2.2 Level AA**: **100%** applicable A/AA success criteria; zero unresolved critical/serious accessibility defects at release. | Automated checks plus manual expert review; accessibility conformance report per release. | PROVISIONAL — product owner and accessibility specialist must approve standard/version and exceptions. |
| `NFR-P1-023` | Critical journeys completed using keyboard alone and the approved screen-reader/browser matrix: sign-in/setup, upload/camera alternative, review, evidence/citation, search/Q&A, grant/revoke, approval, task, export, deletion. | **100%** complete without blocker, focus trap/loss, inaccessible control/status, or information available only visually; tested every release. | Scripted manual journeys with recorded issues/results; no production personal data. | ZERO TOLERANCE for blockers — product, design, accessibility, quality approval required. |
| `NFR-P1-024` | Reflow/zoom/mobile accessibility across responsive web/PWA. | Critical content/functions remain usable at **320 CSS px**, **200% text resize**, and **400% browser zoom** without loss or two-dimensional scrolling except intrinsically two-dimensional content; approved minimum target-size criteria pass. | Browser/device matrix, visual/manual checks, camera/file alternatives. | PROVISIONAL — design, accessibility, product approval required. |
| `NFR-P1-025` | Accessible async/status/error behavior: programmatic status delivery, focus preservation, time-limit control, and recoverable input. | Status/validation changes exposed to assistive technology **≤1 second** after visual update; **100%** critical errors identify field/problem/recovery; user time limits warn and allow the approved extension unless security policy forbids it; no data loss on retry/re-auth. | Component tests plus manual assistive-technology and interrupted-session journeys. | PROVISIONAL — design, accessibility, security approval required. |

## 7. Durability, backup, disaster recovery, and recovery fences

| NFR ID | SLI and scope | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-026` | RPO for accepted originals and consequential canonical transitions. | **RPO 0** after success acknowledgement: zero accepted original, fact/rule resolution, approval, consequential action outcome, deletion fence, or required audit event may be absent from recoverable authoritative state. | Acknowledgement/durability fault injection, integrity checks, transaction/outbox/audit reconciliation, restore drills. | ZERO TOLERANCE — product, architecture, security, operations approval required. |
| `NFR-P1-027` | RPO for other mutable operational/domain state not covered by zero-RPO acceptance. | **RPO ≤5 minutes** for a declared regional/service disaster; lost/replayed derived state must be reconstructable and user-visible. | Backup/replication checkpoint to restored revision comparison by data class. | PROVISIONAL — product, architecture, operations approval required. |
| `NFR-P1-028` | Required audit durability and gap recovery. | **RPO 0** for security/consequential transitions; audit unavailable blocks or leaves the operation explicitly incomplete. Audit gap detection **≤5 minutes** and reconciliation begins **≤30 minutes**. | Audit outage, buffer/outbox replay, checkpoint/tamper/gap exercises. | ZERO TOLERANCE — security, privacy, operations approval required. |
| `NFR-P1-029` | RTO for minimum safe core service after declared disaster. | Authorization/deletion-fence enforcement **≤1 hour**; authenticated core read/write and original access **≤4 hours**; no serviceable restore before policy, integrity, residency, deletion, schema and audit gates pass. | Quarterly declared-recovery exercise from isolated recovery inputs with timed gate evidence. | PROVISIONAL — product, security, architecture, operations approval required. |
| `NFR-P1-030` | RTO for rebuildable capabilities after authoritative service recovery. | Metadata/full-text search **≤8 hours**; semantic/vector, graph, comparison, readiness, and conversation projections **≤24 hours**; truthful canonical fallback/stale state until ready. | New-generation rebuild, validation, cutover and backlog-drain drills at launch forecast size. | PROVISIONAL — product, architecture, document intelligence, operations approval required. |
| `NFR-P1-031` | Backup/recovery verification coverage: scheduled jobs passing integrity/placement/deletion checks and recovery exercises meeting objectives. | Backup control checks **daily**; sampled restore **monthly**; full disaster recovery **quarterly**; **100%** scheduled exercises completed or formally escalated, with no deletion resurrection or residency breach. | Checksums/integrity, schema/config, fence/tombstone, authorization, audit, placement and application-level verification. | PROVISIONAL — operations, security, privacy, architecture approval required. |
| `NFR-P1-032` | Account/workspace recovery safety while ceremony is unresolved: unapproved recovery/owner-transfer routes denied / all attempted routes. | **100% denied**, zero support/email/family-relationship bypass, and no production recovery/owner-transfer capability enabled until `DEC-038` closes and this NFR is revised with success-time/assurance targets. | Route inventory, abuse tests, support tooling review, recovery attempt audit. | PROVISIONAL — decision blocked by `DEC-038`; ZERO TOLERANCE for bypass. |

## 8. Security, privacy, integrity, and residency

| NFR ID | SLI, numerator/denominator, and scope | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-033` | Authorization non-disclosure: evaluated negative outputs with no unauthorized content/metadata/existence / all cross-workspace, resource, field, edge, retrieval, inference, notification, export, audit, support, and action negative cases plus approved production audit sample. | **100% every build/release and continuously for confirmed incidents**; zero known restricted-data disclosure, matching `MET-P1-018`. | Exhaustive mutation/side-channel suites, penetration tests, privacy incident register. | ZERO TOLERANCE — security, privacy, product approval required. |
| `NFR-P1-034` | Consequential execution with current exact approval and complete audit / all consequential executions. | **100% continuously**, zero unapproved execution, matching `MET-P1-017`; changed/revoked/expired inputs always block or reroute. | Approval/input/effect/policy correlation and negative replay/partial-action tests. | ZERO TOLERANCE — product, security, audit owner approval required. |
| `NFR-P1-035` | Immutable-original integrity: checked retained originals matching acquisition digest with no mutation / all originals in scheduled population. | **100%** daily risk-based sample and **100% quarterly full population**, matching `MET-P1-019`; zero mutation/substitution. | Ingestion-to-retrieval/export/backup/restore integrity verification and incident record. | ZERO TOLERANCE — security, architecture, operations approval required. |
| `NFR-P1-036` | Sensitive telemetry/audit hygiene: scanned ordinary telemetry records with no prohibited content / all scanned records plus audit sample. | **100% continuously**, zero confirmed prohibited record, matching `MET-P1-021`; scanner/schema coverage **100%** of registered telemetry producers. | Schema allow-list, content canaries, pipeline inventory, weekly audit. | ZERO TOLERANCE — privacy, security, observability approval required. |
| `NFR-P1-037` | Security finding remediation and residual-risk gate. | Zero unresolved **critical or high residual** release findings without authorized risk acceptance. Draft remediation objectives: critical containment **≤24 hours**, high remediation/mitigation **≤7 days**, medium **≤30 days** from validated finding. | Vulnerability/threat/penetration register, retest, risk owner/expiry; supply-chain evidence. | PROVISIONAL — security/product owners must approve severity model, times, and exception authority. |
| `NFR-P1-038` | Encryption, key, and secret control coverage: eligible data paths/stores using approved protection / all registered in-scope paths/stores; prohibited secret exposure count. | **100%** encryption/control coverage, **zero** production secrets in source/ordinary logs, **100% quarterly** key/secret disable/rotate/recovery drill coverage for critical domains. | Data-flow inventory, configuration/protocol tests, secret scans/canaries, key audit and recovery exercise. | ZERO TOLERANCE for exposure/unprotected path — security, architecture, operations approval required. |
| `NFR-P1-039` | Australian-residency conformance: eligible placements/processing/replication/support/telemetry/backup/DR routes / all attempted routes. | **100% conforming**, zero unapproved cross-border route; unknown/ineligible route blocks. No launch approval until every `DEC-049` matrix row is verified. | Placement inventory, policy decision, egress/failover/restore/processor denial tests. | APPROVED invariant; privacy/legal, security, and operations evidence required before production. |
| `NFR-P1-040` | Critical security/privacy incident response timing from first detectable signal. | Detection **≤5 minutes**, human acknowledgement **≤15 minutes**, containment action begins **≤30 minutes**, and affected high-risk capability is disabled/fail-closed until safe; measured per exercise/incident. | At least quarterly incident exercise plus real incident timeline; missed detection counts even if no harm observed. | PROVISIONAL — security, privacy, operations, product approval required. |
| `NFR-P1-046` | Plaintext/key egress: customer originals, sensitive derivatives, recovery secrets, or unwrapped content keys observed beyond an authorized client / all inspected network, API, storage, queue, telemetry, support, backup, and failure paths. | **Zero observed and 100% registered-path inspection every release**; any confirmed instance is stop-ship/incident. | Network capture, storage/queue inspection, content canaries, wrong-route and failure-path tests. | APPROVED ZERO-TOLERANCE invariant under `DEC-050`. |
| `NFR-P1-047` | Cross-client cryptographic conformance: supported web/iOS/Android envelope vectors producing the expected decrypt/tamper/downgrade result / all approved vectors and mixed-version cases. | **100% every release**, zero nonce reuse in generated test population, unknown/retired suite always fails closed. | Language-neutral known-answer vectors, randomized property tests, version migration and rollback tests. | APPROVED ZERO-TOLERANCE invariant; independent cryptographic review required before production. |
| `NFR-P1-048` | Document deletion timing and state: accepted deletions fenced immediately; eligible restores accepted before deadline; restore denied at/after deadline; final-purge roles reconciled. | **100%** durable fence before acknowledgement; Trash deadline exactly `deleted_at + 30 calendar days`; **100%** post-deadline restores denied; all registered roles acknowledged before complete. | Server-clock boundary tests, delayed worker/queue/replay/restore/resync drills, lifecycle ledger. | APPROVED product invariant under `DEC-053`; no guarantee of worker completion before dependencies permit, but access remains denied. |
| `NFR-P1-049` | Critical client parity: supported critical journeys meeting the same contract, authorization, evidence, encryption, deletion, and error semantics / required React web, Flutter iOS, and Flutter Android matrix. | **100% before release** or an explicit approved platform exception; zero security/privacy semantic exception. | Shared synthetic journeys, contract snapshots, authorized-result comparisons, accessibility/device evidence. | APPROVED release invariant under `DEC-052`. |
| `NFR-P1-050` | Infrastructure reproducibility and isolation: environment resources represented by approved Bicep and free of unexplained security/data drift / all `dev`, `stage`, and future `prod` resources. | **100% managed or governed exception**, zero cross-environment identity/data/secret reuse, and zero production resource before its `DEC-054` gate. | Bicep build/What-If, inventory/drift, role, secret, network, data-marker and migration tests. | APPROVED release invariant under `DEC-049`/`054`; exact cost/SKU targets remain provisional. |

## 9. Observability and control evidence

| NFR ID | SLI and population | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-041` | Correlation coverage: critical requests/commands/events/jobs/adapter calls/projections/actions with complete privacy-safe trace/causation/correlation/contract IDs / all critical operations. | **100% per release**, **≥99.9% rolling 7-day production**; required audit coverage remains 100% under `NFR-P1-028`. | Trace/event schema validation and workflow reconstruction; content canary checks. | PROVISIONAL — architecture, operations, audit/security approval required. |
| `NFR-P1-042` | Operational telemetry delivery: registered safe health/SLI records queryable within freshness objective / records expected from producer sequence/checkpoints. | **≥99.5% within 5 minutes** rolling 7 days; missingness/gaps detected **≤5 minutes**; telemetry outage cannot weaken product controls. | Producer/collector sequence reconciliation, delayed/drop tests, dashboard data-quality state. | PROVISIONAL — operations and data/observability approval required. |
| `NFR-P1-043` | Objective/alert coverage: enabled zero-tolerance and budget-burn conditions detected by registered monitor / all injected monitor fixtures. | **100% of monthly synthetic alert fixtures**, zero silent critical control miss; alert routing acknowledgement follows `NFR-P1-040`; noisy duplicate alerts **<5%** of alert incidents monthly. | Synthetic canaries for auth leak, audit gap, integrity, source stale, deletion, residency, telemetry leak, backlog and cost. | PROVISIONAL — operations, security, product approval required. |

## 10. AI/OCR cost and resource governance

| NFR ID | SLI and population | Provisional target and window | Measurement/evidence | Target approval |
|---|---|---|---|---|
| `NFR-P1-044` | Intelligence-cost attribution: AI/OCR/embedding/reranking calls with workspace pseudonym, capability/version, provider-neutral usage units, AUD-converted variable cost, outcome, retry/cache class, and approved budget / all such calls. | **100% attributable daily**, duplicate/retry cost separately visible, unpriced/unknown-cost route blocks activation; cost-led telemetry contains no content. | Adapter receipts/usage reconciled to capability ledger; variance **≤2% monthly** against invoiced/approved usage where available. | PROVISIONAL — finance, product, privacy, AI/architecture approval required. |
| `NFR-P1-045` | Variable intelligence spend across enabled AI/OCR/embedding/reranking: per activated workspace-month and per supported document reaching reviewable state. | Draft envelope: mean **≤A$5 per activated workspace-month**, p95 **≤A$15**, and p95 **≤A$1 per reviewable supported document**, rolling 30 days. Alert at **80%** of approved daily/monthly capability budget; at **100%**, block/degrade safely with no unsupported result and no more than **5%** in-flight overshoot. | Cost ledger segmented by capability, type/page bucket, outcome/retry/cache; load/cost-exhaustion tests and user-safe degradation. | PROVISIONAL — explicit product/finance approval required; targets must be recalibrated after representative provider-neutral evaluation. |

Cost targets never authorize sending data to an ineligible processor, weakening evidence/citations, skipping review, using stale authorization, or hiding a failure. A cheaper unsafe result is a failure; a cost cap produces an explicit limitation or approved deterministic fallback.

## 11. Stop-ship, rollback, and exception rules

### 11.1 Universal stop-ship conditions

A release or affected capability is blocked when any of these is true:

1. a known cross-workspace, resource, field, edge, inference, guest, export, audit, support, or action disclosure exists (`NFR-P1-033`);
2. any consequential execution lacks current exact approval or required durable audit (`NFR-P1-034`, `NFR-P1-028`);
3. an accepted original is mutated/lost, a deletion fence is bypassed, or deleted data is resurrected (`NFR-P1-026`, `035`, `017`);
4. ordinary telemetry/audit contains prohibited raw content, a known clinical fixture enters ordinary processing, or a residency-controlled route is unapproved (`NFR-P1-036`, `MET-P1-020`, `NFR-P1-039`);
5. a required security dependency fails open, stale source is shown as current, or AI/monitor output fabricates evidence/success (`NFR-P1-002`, `005`, `021`);
6. a critical/high residual threat remains unmitigated and unaccepted under the approved risk process (`NFR-P1-037`);
7. a critical accessibility journey has a blocker or the applicable A/AA gate fails (`NFR-P1-022`–`025`);
8. RPO/RTO/restore evidence is missing or the latest required recovery exercise fails (`NFR-P1-026`–`031`);
9. a blocked recovery, continuity, clinical, deletion, or residency branch is enabled without its decision and updated contracts; or
10. the measurement pipeline cannot prove the applicable numerator, denominator, exclusions, data quality, and representative test population.

### 11.2 Performance and reliability stop-ship rules

- A provisional latency/throughput/freshness target blocks general release when it misses in **two consecutive representative release runs**, misses by more than **25% in one run**, or hides a critical segment failure. The accountable owners may set a stricter approved gate.
- Core availability error-budget burn above **50% of the monthly budget in 7 days** freezes non-remediation rollout; exhaustion blocks rollout until service review.
- Queue/projection backlog that cannot drain to target within **one target window** after representative peak blocks the affected capability.
- Cost target miss does not by itself override a safe launch if the product/finance owner explicitly re-baselines it, but missing attribution, unbounded spend, or unsafe cost degradation is stop-ship.

### 11.3 Production rollback or capability-disable triggers

Zero-tolerance safety failures trigger immediate containment, affected-capability disablement, or rollback/forward repair according to the incident plan. Availability targets never justify keeping an unsafe path active. A rollback is prohibited if it restores deleted data, stale authorization/configuration, vulnerable code, incompatible schema, or ineligible residency placement; use forward repair or keep the capability disabled.

### 11.4 Exception contract

An exception must name the NFR, exact scope/version/segment, observed evidence, user/security/privacy impact, compensating controls, accountable owner, start/expiry, monitoring, remediation date, and rollback/disable trigger. It cannot waive an approved decision, law/policy obligation, known unauthorized disclosure, required approval, original integrity, deletion fence, or unapproved residency route. Safety/risk exceptions require the authorized product/security/privacy owner, not only engineering acceptance.

## 12. Measurement and instrumentation dependencies

| Area | Minimum privacy-safe signals |
|---|---|
| Request/service | Operation ID, contract version, opaque workspace/capability, start/end, outcome class, safe error, response-size bucket |
| Authorization | Decision ID/outcome, policy/config epoch, freshness, obligations, scope class; no protected values |
| Workflow/event | Aggregate/workflow/event IDs, revision, state, attempt, queue/processing timestamps, causation/correlation/idempotency |
| Projection | Kind/generation/partition, source/policy/deletion watermarks, coverage, lag, rebuild/repair state |
| Source monitoring | Source definition/version, due/attempt/result time, health/freshness class, parser version, retry state |
| Accessibility | Test case/component/version, environment/assistive technology, criterion/severity/outcome; no recording of household content |
| Backup/recovery | Data role/generation, checkpoint, restore gate, integrity/count result, fence/residency/schema/audit verification |
| Security/privacy | Control/threat ID, safe finding/outcome/severity, detection/ack/containment time, remediation state |
| AI/cost | Capability/model class/version, provider-neutral usage unit, outcome/retry/cache, AUD cost, budget state; no prompt/query/answer |

Before a target controls beta or launch:

1. its SLI query and event contracts have stable versions and fixture-based numerator/denominator tests;
2. duplicate/retry/replay behavior cannot inflate success or hide cost/failure;
3. the reference traffic/data/corpus and segment thresholds are approved;
4. privacy/security approves every telemetry property and retention/residency route;
5. dashboards show counts, missingness, exclusions, confidence, segments, target/budget status, and incidents—not only a percentage;
6. alerts and stop-ship automation have synthetic canaries and named responders; and
7. target approval records the value, owner, date, evidence, external promise (if any), and next review.

## 13. Review cadence and target governance

| Cadence | Review | Required output |
|---|---|---|
| Continuous/daily | Zero-tolerance safety, availability/error budget, auth/deletion propagation, stale sources, integrity, audit/telemetry gaps, residency, backlog, AI cost | Alert/incident/control record and immediate containment where required |
| Weekly during dogfood/beta | Latency, processing time, projection freshness, capacity, segment outliers, accessibility defects, cost/unit | Annotated dashboard, corrective action, and data-quality statement |
| Before every release | Applicable NFR conformance, chaos/dependency failures, authorization/abuse, accessibility, recovery currency | Signed go/no-go evidence linked to NFR/test/threat IDs |
| Monthly | Availability, SLO/error budget, cost, security/privacy findings, backup sample, target calibration | Cross-functional service review with decisions/actions |
| Quarterly | Full DR/incident exercises, capacity forecast, risk register, provider/adapter portability/residency, NFR target suitability | Approved exercise report and target-change proposal if required |

Target changes preserve the prior target, evidence window, reason, approvers, effective date, test/alert updates, and user/SLA consequence. A material safety, privacy, architecture, cost, or external commitment change requires the appropriate decision/ADR, not a silent NFR table edit.

## 14. Traceability

| NFR family | Primary architecture/security rules | Product metrics/requirements |
|---|---|---|
| `NFR-P1-001`–`006` | `ARCH-P1-019`–`024`, `039`–`042`; `SEC-P1-018`, `029`; `THR-P1-026`–`027` | `OUT-P1-007`, `REQ-P1-ING-002`–`004`, `REQ-P1-AI-006`, `REQ-P1-TRUST-002` |
| `NFR-P1-007`–`015` | `ARCH-P1-001`–`005`, `019`–`024`, `041`–`042`; `SEC-P1-029` | `MET-P1-002`, critical use cases, PRD launch-gate latency/throughput |
| `NFR-P1-016`–`021` | `ARCH-P1-024`, `027`–`032`, `036`; `AUTH-P1-019`–`024`, `034` | `REQ-P1-GPH-002`, `SRCH-003`, `MON-003`–`007`, `TRUST-002`, `MET-P1-015`, `018` |
| `NFR-P1-022`–`025` | `SEC-P1-016`; responsive/PWA boundary | `DEC-021`, `AC-P1-A11Y-001`, `PER-P1-005`, `JRN-P1-*` critical flows |
| `NFR-P1-026`–`032` | `ARCH-P1-021`, `026`, `031`–`032`, `039`; `DATA-P1-042`–`050`; `AUD-P1-005` | `REQ-P1-DOC-001`, `TRUST-004`, `007`–`008`, `MET-P1-019`, `AC-P1-DEL-001` |
| `NFR-P1-033`–`040` | `SEC-P1-*`, `AUTH-P1-*`, `PRIV-P1-*`, `AUD-P1-*`, `THR-P1-*` | `MET-P1-017`–`021`, `REQ-P1-TRUST-001`–`009`, `AC-P1-SEC-001`, `AC-P1-AI-001` |
| `NFR-P1-041`–`043` | `ARCH-P1-039`–`042`, `SEC-P1-017`–`018`, `AUD-P1-001`–`030` | All operational/safety metrics and critical use cases |
| `NFR-P1-044`–`045` | `ARCH-P1-033`, `041`–`045`, `SEC-P1-020`, `029`; `THR-P1-026`, `030` | `REQ-P1-AI-001`, `006`–`007`; product cost/value review |
| `NFR-P1-046`–`050` | `ARCH-P1-046`–`055`, `SEC-P1-031`–`037`, `THR-P1-031`–`034` | `REQ-P1-PLT-001`–`002`, `REQ-P1-CRYPTO-001`–`003`, `REQ-P1-DEL-001`–`002`, `REQ-P1-OPS-001`–`002` |

## 15. Approval checklist

This document cannot become an approved NFR baseline until:

- the product owner approves user-facing availability, latency, accessibility, and cost targets;
- architecture/operations approve load profile, capacity headroom, freshness, RPO/RTO, restore and observability mechanisms;
- security/privacy approve zero-tolerance gates, incident targets, audit/telemetry, deletion, and residency evidence;
- accessibility specialists approve the standard/version, test matrix, severity gate, and any documented exceptions;
- AI/document-intelligence owners approve Q&A/processing timing and safe cost-degradation behavior;
- finance approves AUD cost accounting and unit budgets;
- `DEC-038` remains blocked; all `DEC-049`–`054` placement, encryption, deletion, client, and release prerequisites are evidenced;
- the test strategy assigns automated/manual/chaos/recovery evidence for every `NFR-P1-*`; and
- backlog and traceability map each implementation slice to applicable NFRs and stop-ship rules.

Until those approvals exist, the values are testable planning hypotheses, not an SLA or permission to begin implementation.
