# Phase 1 Observability and Incident Standard

| Field | Value |
|---|---|
| Document ID | `OPS-OBS-001` |
| Version | `0.1` |
| Status | **DRAFT — all numeric SLI/alert/response/cost targets are provisional; operations, security, privacy, architecture, product, and finance approval required** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |
| Primary trace | `ARCH-P1-018`, `039`–`045`, `PRIV-P1-020`–`022`, `AUD-P1-027`–`030`, `NFR-P1-001`–`045`, `THR-P1-019`, `026`–`030` |

## 1. Purpose, authority, and content boundary

This standard defines privacy-safe operational signals, SLI evidence, dashboards, alerts, runbooks, incident records, and cost attribution without selecting a logging, metrics, tracing, monitoring, analytics, paging, ticketing, security-information, cost, or incident product.

Operational telemetry is not domain truth, audit, evidence content, authorization, or a backup. It may reference those records safely. Required audit follows [`SEC-AUD-001`](../06-security/04-audit-and-provenance.md); event semantics follow [`API-EVT-001`](../05-api/03-event-catalogue.md); release and recovery evidence follow [`OPS-DEP-001`](05-deployment-rollback-and-repair.md) and [`OPS-DR-001`](06-backup-and-disaster-recovery.md).

All numeric targets are inherited from [`ARCH-NFR-001`](../02-architecture/05-non-functional-requirements.md) and remain **PROVISIONAL** until their named owners approve population, exclusions, windows, evidence, and consequence.

## 2. Registered signal contract

Each signal schema has a stable ID/version, owner, purpose, data classification, permitted producers/consumers, required/optional allow-listed fields, prohibited fields, cardinality/size policy, sampling/aggregation, retention policy reference, processing/residency route, access policy, quality/checkpoint behavior, and change/retirement record.

Common safe fields, when applicable, are: event/signal identity; occurred/recorded time; environment and release/configuration/contract versions; operation/capability; synthetic marker; opaque purpose-specific workspace pseudonym; actor/workload class and safe reference; outcome/state/reason code; count/size/latency/usage/cost bucket; correlation/causation/attempt; aggregate/job/event safe reference and revision; policy/authorization/deletion/source/projection watermark; route-policy decision reference; dependency class; and data-quality/missingness state.

Ordinary telemetry MUST NOT contain raw original/document/source content, thumbnails, OCR/extracted values, evidence passages, subject/member names, contact/recipient values, filenames, queries, prompts, answers, tool arguments/results, provider payload/errors, unrestricted URLs, signed access URLs, tokens, credentials, factors, secrets, key material, export contents, or content-bearing exception stacks.

## 3. Signal families

| Family | Required purpose-safe evidence | Not permitted |
|---|---|---|
| Logs/events | State/outcome/reason, safe IDs/versions, attempt/correlation, environment/release, synthetic marker | Raw request/response bodies, protected values, arbitrary string dumps |
| Metrics | Explicit numerator/denominator, unit, population/segment, window, data quality, bucketed dimensions | Household/resource IDs as unbounded labels, filenames/queries/errors as labels |
| Traces | Operation/contract/capability spans, safe causation, dependency class, policy/fence watermark, outcome/latency | Payloads, prompts, passages, SQL/provider commands, tokens, unrestricted endpoints |
| Health/control findings | Control/threat/rule ID, safe severity, scope/version, detected/ack/containment/remediation state | Exploit/customer content copied into ordinary alert/ticket fields |
| Cost/usage | Capability/adapter class/version, provider-neutral usage unit, retry/cache/outcome, AUD conversion reference, budget state | Prompt/query/content, recipient/customer identity, provider invoice payload |

## 4. SLI and provisional target mapping

| Area | Owning NFRs and required measurement |
|---|---|
| Availability/degraded behavior | `NFR-P1-001`–`006`: eligible/success counts by operation/segment; dependency/control failures; user-safe state; synthetic journeys separate from production evidence |
| Latency/capacity/isolation | `NFR-P1-007`–`015`: server/end-to-end percentiles, workload profile, queue/backlog drain, tenant/noisy-neighbour isolation, security and cost outcomes |
| Freshness/propagation | `NFR-P1-016`–`021`: authorization/deletion/configuration epochs, source/projection watermarks, lag, stale/partial/unavailable presentations |
| Accessibility | `NFR-P1-022`–`025`: automated/manual evidence, critical journeys, environment/assistive-technology matrix, severity and outcome without household recordings |
| Durability/recovery | `NFR-P1-026`–`032`: checkpoints, acknowledged/recoverable revisions, audit gaps, restore gates, RPO/RTO and exercise results |
| Security/privacy/residency | `NFR-P1-033`–`040`: negative/control populations, integrity, telemetry canaries, findings, secret/key drills, route/placement decisions and incident timelines |
| Observability controls | `NFR-P1-041`: 100% critical correlation per release and ≥99.9% rolling seven-day production; `NFR-P1-042`: ≥99.5% safe records within five minutes and gaps detected ≤5 minutes; `NFR-P1-043`: 100% monthly injected alert fixtures and <5% noisy duplicates—all provisional |
| AI/OCR cost | `NFR-P1-044`–`045`: attributable provider-neutral usage/cost, retry/cache, budget state, safe degradation; draft monetary/alert envelopes remain provisional |

An SLI manifest records exact semantic version, population, numerator, denominator, success/failure mapping, exclusions, segments, event/signal sources, duplicate/retry/replay handling, percentile method where applicable, missingness/data-quality rules, target/budget, owner, dashboard/alert, test fixture, and effective period.

## 5. Stable observability and incident rules

| Rule ID | Draft normative rule |
|---|---|
| `OPS-OBS-P1-001` | Every operational signal, SLI, dashboard, alert, runbook, incident type, and cost measure MUST have a stable versioned definition, owner, purpose, classification, processing/residency, access, retention policy reference, and test evidence. |
| `OPS-OBS-P1-002` | Critical requests, commands, events, jobs, adapter calls, projections, approvals/actions, deployments, migrations, restores, and configuration changes MUST preserve privacy-safe trace, causation, correlation, attempt, environment, release, and contract-version identifiers. |
| `OPS-OBS-P1-003` | Household telemetry MUST use purpose-specific opaque workspace pseudonyms only where necessary; explicit global/platform signals contain no household identifier or personalized content, and telemetry identity is never authorization. |
| `OPS-OBS-P1-004` | Logs MUST be structured against closed allow-listed schemas and safe reason codes. Arbitrary object serialization, payload/body dumping, content-bearing formatted strings, and provider error passthrough are prohibited. |
| `OPS-OBS-P1-005` | Metrics MUST declare unit, population, numerator/denominator or distribution, window, segments, exclusions, duplicate/retry semantics, and data quality. A metric name or dashboard percentage alone is not evidence. |
| `OPS-OBS-P1-006` | Traces MUST capture bounded operation/dependency/control timing and safe version/watermark/outcome attributes; request/response bodies, evidence, prompts/tools, provider payloads, credentials, and protected values MUST NOT be span data. |
| `OPS-OBS-P1-007` | Error handling MUST map exceptions/provider failures to registered safe categories. Detailed protected diagnostics remain in separately authorized evidence stores where approved, not ordinary telemetry or incident tools. |
| `OPS-OBS-P1-008` | Operational telemetry, immutable audit, domain events, evidence/provenance, security findings, and business analytics MUST remain distinct schemas/stores/authorities; one stream MUST NOT silently replace another. |
| `OPS-OBS-P1-009` | Raw content, values, filenames, passages, queries, prompts, answers, tool/provider payloads, unrestricted URLs, tokens, secrets, and key material MUST be rejected before ordinary telemetry emission, not merely hidden at display time. |
| `OPS-OBS-P1-010` | Every producer MUST apply source-side schema validation, minimization, classification, size/cardinality bounds, and unsafe-field filtering; collector failure or permissive downstream storage is not a safety control. |
| `OPS-OBS-P1-011` | Untrusted client/document/source/model/provider strings MUST NOT become metric labels, trace attributes, alert titles, dashboard filters, or ordinary log fields; only registered normalized codes are permitted. |
| `OPS-OBS-P1-012` | Signal cardinality and volume MUST be bounded without dropping critical audit/control outcomes. Workspace/resource/event/run identifiers use approved sampling, bucketing, or protected lookup and never unbounded public labels. |
| `OPS-OBS-P1-013` | Time sources, occurred/recorded semantics, clock uncertainty, and ordering limits MUST be explicit. Clock skew cannot fabricate event order, SLI success, recovery time, approval validity, or source freshness. |
| `OPS-OBS-P1-014` | Sampling MUST NOT remove required security/privacy/deletion/residency findings, required audit, consequential outcome, gap/control evidence, or the ability to compute an SLI denominator; sampled populations remain labelled. |
| `OPS-OBS-P1-015` | Every SLI MUST use a reviewed manifest and fixture-tested query. Metric/query changes preserve the prior version/results, receive impact review, and cannot rewrite a missed target after observation. |
| `OPS-OBS-P1-016` | Zero denominator is `NO_DATA`, never 100% success. Missing records, late data, duplicates, replay, retry, excluded traffic, and low sample sizes MUST be visible and cannot improve an SLI silently. |
| `OPS-OBS-P1-017` | Retries and redelivery MUST be reported as attempts and one reconciled logical outcome; they cannot hide first-attempt latency/failure, inflate success, or suppress duplicate cost/effect risk. |
| `OPS-OBS-P1-018` | SLIs MUST be segmented by applicable operation, environment, workspace type, client/device class, route/residency policy, dependency/capability, release/configuration, and synthetic/production evidence without exposing protected identities. |
| `OPS-OBS-P1-019` | Dashboards MUST show counts, denominators, missingness, exclusions, sample/uncertainty, segment outliers, target/budget status, incidents, release/configuration, and data-quality state—not only a green aggregate percentage. |
| `OPS-OBS-P1-020` | All numeric thresholds in this draft MUST reference an approved `NFR-P1-*` version. Until approval, dashboards label them provisional planning hypotheses and MUST NOT present them as SLAs or launch authority. |
| `OPS-OBS-P1-021` | Alerts MUST have stable versioned condition, severity, population, data-quality prerequisite, dedup/suppression, owner/responder, safe payload schema, runbook, escalation, test fixture, and closure condition. |
| `OPS-OBS-P1-022` | Alert payloads/routes MUST be purpose-minimized, access-controlled, residency-eligible, and content-free. Availability or urgency cannot send protected content to an unapproved channel, support region, or incident service. |
| `OPS-OBS-P1-023` | Telemetry silence, checkpoint gap, query failure, expired monitor, or unknown data quality MUST alert as an observability-control failure; absence of signals is never evidence of health. |
| `OPS-OBS-P1-024` | Synthetic canaries MUST cover authorization disclosure, audit gap, original integrity, source stale, deletion resurrection, residency/egress, secret/telemetry leakage, queue/backlog, deployment, restore, AI safety, and cost/budget conditions applicable to the release. |
| `OPS-OBS-P1-025` | Each runbook MUST identify trigger/scope, preconditions and current-policy checks, safe diagnostics, roles/approval, containment, user-safe degradation, repair/rollback/restore choices, deletion/residency/secret handling, communications, verification, evidence, and escalation. |
| `OPS-OBS-P1-026` | Runbooks MUST use safe references and approved tools/identities; they MUST NOT instruct operators to browse raw household content, bypass authorization, edit immutable evidence/events, disable fences, use production secrets locally, or fail over across an ineligible route. |
| `OPS-OBS-P1-027` | An incident record MUST preserve detection, acknowledgement, classification, scope/releases/routes, containment, decisions, user/security/privacy impact, evidence refs, eradication/repair/recovery, verification, communication/legal review, owner, and post-incident actions. |
| `OPS-OBS-P1-028` | Incident collaboration/tickets MUST contain safe IDs, versions, normalized findings, counts/buckets, and protected-evidence references only. Necessary content review occurs in an authorized restricted system and is not copied into ordinary tooling. |
| `OPS-OBS-P1-029` | Zero-tolerance authorization, approval/action, deletion, integrity, telemetry, clinical, audit, residency, or critical/high residual-risk failure MUST block release or disable/contain the affected route as required by `ARCH-NFR-001`; availability cannot overrule it. |
| `OPS-OBS-P1-030` | Observability-path outage MUST NOT disable authorization, deletion, audit durability, quarantine, route policy, rate/backpressure, or other product controls. The service fails closed or explicitly degraded and records gaps for reconciliation. |
| `OPS-OBS-P1-031` | Telemetry, alerts, dashboards, incident evidence, and cost data MUST follow an approved retention/minimization and processing/residency matrix. `DEC-039` leaves durations unset and `DEC-040` makes unknown routes ineligible. |
| `OPS-OBS-P1-032` | AI/OCR/embedding/reranking and other variable usage MUST be attributable through provider-neutral units, capability/version, outcome, retry/cache, route and AUD conversion/budget references without content; unknown price/route blocks activation as required by provisional `NFR-P1-044`–`045`. |

## 6. Alert and incident priorities

Alert severity is based on user/security/privacy/evidence/residency/control impact and urgency, not merely resource utilization. Critical paths include authorization, deletion fence, original integrity, required audit, secrets/keys, residency route, consequential actions, deployment/supply chain, recovery, and telemetry-content controls.

The provisional timing targets in `NFR-P1-006` and `NFR-P1-040` are evidence hypotheses: critical control detection within five minutes; security/privacy incident human acknowledgement within fifteen minutes; and containment action beginning within thirty minutes. These values remain unapproved, and stricter owning contracts win.

## 7. Cost and capacity evidence

Cost views separate fixed/variable capacity, capability, route, environment, synthetic/production, retries, duplicate delivery, cache, outcome, and unit. They never weaken purpose, evidence, authorization, deletion, or residency controls. Cost exhaustion produces an explicit limitation, queue/backpressure, or approved deterministic fallback; it cannot select an ineligible processor or fabricate success.

## 8. Review and release evidence

Before a telemetry or alert schema is enabled, privacy/security approves every property and route; fixtures prove numerator/denominator, duplicate/replay, missingness, content canaries, cardinality, access, alert firing and recovery; runbooks name responders; dashboards expose data quality; and incident/disable paths are exercised. Observability cannot activate or infer account/workspace recovery prohibited by `DEC-038`, contradict the `DEC-053` Trash/purge boundary, or authorize a route outside the `DEC-049` processor/residency policy. A material signal, target, route, sampling, retention, or alert change is consequential configuration and follows the reviewed release process.
