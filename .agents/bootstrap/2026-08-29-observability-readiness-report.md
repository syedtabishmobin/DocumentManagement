# OBSERVABILITY READINESS REPORT

Governed by [Issue #11](https://github.com/syedtabishmobin/DocumentManagement/issues/11) and candidate [PR #12](https://github.com/syedtabishmobin/DocumentManagement/pull/12). This report covers the Agent Operations & Observability installation only; no general product-development queue item was started.

## 1. Repository/framework state discovered

- Base framework bootstrap was complete on clean public/protected `main` at `00d553e93a8367b7cdbc0239c78ba3e8e63b2fcd`; Issues #1, #2 and #9 and PRs #3, #4 and #10 were closed/merged.
- Framework v1.1.0 had reusable/project separation, six skills, GitHub Issues authority, protected-main CI, environment truth and notification deduplication, but no agent lifecycle event model or query interface.
- Existing `OPS-OBS-001` is a strong privacy-safe product telemetry standard. Azure development infrastructure already provisions Log Analytics and Application Insights, but agent operations are not routed there.
- Installed Codex CLI `0.150.0-alpha.8` exposes stable multi-agent support and the interactive `codex agents` view. `runtime_metrics` was observed under development and disabled.
- Official Codex configuration supports OpenTelemetry logs/metrics/traces, but OTel routing is user-level; project `.codex/config.toml` cannot enforce it. Native export remains disabled because no privacy-filtered destination has passed conformance. See [OpenAI advanced configuration](https://learn.chatgpt.com/docs/config-file/config-advanced) and [OpenAI configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).
- Blocking-decision and UAT-ready notification contracts exist, but ACS Email implementation is `MISSING`, activation is `CONFIGURED_DISABLED`, delivery conformance is `NOT_RUN`, and send is prohibited.

## 2. Files/config changed

- Framework/profile: `.agents/framework/operations-observability.md`, `.agents/framework-manifest.json` (v1.2.0), `.agents/project/observability.json`, profile/team/role/capability/tool registries.
- Definitions: `.agents/observability/README.md`, event schema, metric catalogue, query catalogue, privacy/retention policies and Codex OTel adapter contract.
- Skills: `observability-status`, `telemetry-validation`, and `cost-performance-analysis`.
- Runtime/query/test: `scripts/agent_ops.py`, `scripts/validate_observability.py`, `scripts/observability_smoke_test.py`, package scripts and framework validator integration.
- Regression stabilization: `src/apps/api/src/postgres-workspace.integration.test.ts` now proves concurrent migration applicants before verify-only runtime concurrency and serializes destructive shared-schema fixtures.
- Operations: `.gitignore`, `AGENTS.md`, `WORKFLOW.md`, `04_USING_THIS_REPO_WITH_CODEX.md`, `scripts/README.md`, current-state/queue reconciliation, this report and the observability discovery record.
- Volatile `.agent-ops/runtime/events.jsonl` is intentionally excluded from version control.

## 3. Event/metric model implemented

The closed `1.0.0` event schema supports agent start/complete/fail/block/state, subagent spawn, handoff, work start/complete, capability selection, skill/tool/test lifecycle, defects/fix/retest, quality gates, decisions, environment promotion, UAT readiness, retries, notification status, usage and context observations.

Correlation dimensions include project, goal, feature, work item, run, agent/parent, role, capability, skill, tool/adapter, branch/worktree/PR, environment and release candidate. Current state and duration are derived from ordered events. The metric catalogue links usage to result, acceptance, first-pass QA and rework.

Usage aggregation deduplicates `usage.recordId` and sums only `SELF_ONLY`; `INCLUSIVE` parent rollups are display-only. Smoke evidence counted one provider-reported 100-token child record while excluding its duplicate and a 100-token parent rollup.

Lifecycle validation is per run, enforces legal state transitions and stable acyclic parent assignment, and rejects missing parents. Retention removes expired records and any now-orphaned descendant subtree rather than fabricating parent events or retaining data past policy.

## 4. Agent/capability/skill/tool attribution status

**PASS for framework events.** A live Issue #11 event was queried with agent ID, operations role, work item, capabilities, seven invoked skills, four tools, two adapters, branch/worktree, environment, state and duration. Synthetic tests prove a root/QA child tree, terminal child state, blocked parent, decision and notification state.

Native Codex may expose model/session/runtime fields separately; unavailable values are not inferred. GitHub context is joined on demand and remains authoritative for Issues, decisions, defects, PRs and CI.

## 5. Token/cost telemetry status and provenance

- Input, cached input, output, reasoning and total tokens: `UNAVAILABLE` for the live run.
- Credits/usage, provider-reported cost and separately billed tool cost: `UNAVAILABLE` for the live run.
- Context size/reuse, repeated unchanged-file loading and large-output totals: `UNAVAILABLE` for the live run; schema support exists for future measured data.
- Duration and event counts: `MEASURED` by the local runtime event timestamps/store.
- No value is treated as zero and no agent/skill allocation is presented as billing truth.

The aggregation engine keeps separate provenance buckets for `MEASURED`, `PROVIDER_REPORTED`, `ATTRIBUTED`, and `ESTIMATED`. Native/user-level OTel is not enabled, so the current report contains no attributed or estimated cost. Token/cost unavailability is a limitation but, under the global gate, is not by itself a blocker when labelled honestly.

## 6. Monitoring interface and exact usage

From the repository root:

```bash
pnpm agent:status                 # local active/running/testing/blocked state
pnpm agent:status --online        # add current GitHub decisions, defects and PRs
pnpm agent:tree                   # parent/subagent tree
pnpm agent:tree --work-item 11    # tree for one work item
pnpm agent:summary                # seven-day quality/usage/cost summary
pnpm agent:summary --window-days 30
pnpm verify:observability         # contract, privacy and aggregation smoke tests
pnpm agent:prune                  # physically remove events outside 30-day retention
codex agents                      # native interactive local session view
```

The final pre-merge online status proof returned one active Issue #11 agent on PR #12, zero pending decision Issues, zero open defects and one open PR; it also showed `agent-local=AVAILABLE`, `dev=SYNTHETIC_PREVIEW_AVAILABLE`, `stage/prod=DEFINED_NOT_PROVISIONED`, UAT not ready, notification failure and unavailable native token/cost telemetry.

## 7. Privacy/security controls

- Closed schema with unknown-field rejection before append.
- Explicit rejection of raw prompt/content/tool-payload/credential fields, multiline arbitrary content, secret-like values, unsafe URLs and inconsistent usage provenance.
- Runtime directory/file modes are restricted; writes use an exclusive lock, validated rewrite, flush and filesystem sync after pruning.
- Runtime events are Git-ignored, metadata-only, separate from product content, pruned on append/query to 30 days, and removable explicitly with `pnpm agent:prune`.
- Evidence URLs are HTTPS and limited to the configured GitHub repository and durable Issue, PR, Actions-run/job or commit routes, without credentials/query strings/fragments.
- Native `log_user_prompt` must remain false; external export is disabled until destination, filtering, identity, retention, residency and conformance are approved.

## 8. Notification-path validation

- Blocking decision fixture: one normalized To recipient, no duplicate CC, existing deduplication key, `sendAllowed=false`, result `EXTERNAL_ACTION_REQUIRED`.
- Complete synthetic UAT-ready fixture: one normalized To recipient, no duplicate CC, new deduplication key, `sendAllowed=false`, result `EXTERNAL_ACTION_REQUIRED`.
- False `SENT` remains rejected by existing framework tests unless implementation, activation, delivery conformance and provider message ID all pass.

GitHub remains the authoritative phone-accessible decision/UAT record. Email is **not operational** and no delivery is claimed.

## 9. External/admin actions still required

1. Implement the existing vendor-neutral notification port with the prepared Azure Communication Services Email resources.
2. Configure managed-identity send permission, a synthetic-recipient allow-list, preferences/minimisation, delivery-state reconciliation, bounce/failure handling, audit and rate controls without committing addresses or credentials outside structured/secret configuration.
3. Run and retain a successful synthetic delivery conformance test for both blocking-decision and UAT-ready messages, then update `.agents/config/notifications.json` truthfully.
4. Alternative: Product Authority may explicitly accept GitHub-only fallback for autonomous queue execution. No such acceptance is currently recorded.
5. Optional future durability: design a privacy-filtering Codex OTel collector/export path to the existing Azure monitoring estate and approve its identity, data fields, residency, retention and cost before activation. This is not required for the approved local mechanism.

## 10. Observability readiness

**PARTIAL**

The event/config model, local destination, lifecycle/attribution queries, privacy controls, validation, GitHub join and environment/quality/decision visibility pass. Autonomous queue readiness does not pass because the mandatory Product Authority email path is unavailable and no GitHub-only fallback has been accepted.

Validation evidence: local `pnpm verify` passed framework/observability, 140-document specifications, API/event/reference/traceability contracts, TypeScript typechecks, 41 local tests with two honestly skipped PostgreSQL-service tests, and all builds. `pnpm verify:observability` passes 34 focused tests. Independent QA passed a separate 22-case adversarial suite and every OBS-AC-01–12 criterion on exact candidate `c025420aacb522f25952750e72b067bdbf86892c`. Protected [run 33250411214 attempt 1](https://github.com/syedtabishmobin/DocumentManagement/actions/runs/33250411214/attempts/1) passed specifications/TypeScript, 31/31 API tests including both PostgreSQL 17 integrations, Bicep, Android and iOS; [attempt 2](https://github.com/syedtabishmobin/DocumentManagement/actions/runs/33250411214/attempts/2) repeated the PostgreSQL/specification/Bicep job successfully. Local Flutter tooling is unavailable. The skill-creator `quick_validate.py` could not start because its environment lacks `PyYAML`; no dependency was added. The repository's dependency-free validator passed all skill frontmatter, naming, descriptions, directory matching and capability registration.

Independent QA originally blocked candidate `4dc03a0` with lifecycle/parent-graph [defect #13](https://github.com/syedtabishmobin/DocumentManagement/issues/13), prompt/retention [defect #14](https://github.com/syedtabishmobin/DocumentManagement/issues/14), usage/currency [defect #15](https://github.com/syedtabishmobin/DocumentManagement/issues/15), partial-GitHub [defect #16](https://github.com/syedtabishmobin/DocumentManagement/issues/16), and later protected-CI migration-race [defect #17](https://github.com/syedtabishmobin/DocumentManagement/issues/17). Exact-SHA independent retest passed and closed all five defects. The durable acceptance matrix is recorded on [Issue #11](https://github.com/syedtabishmobin/DocumentManagement/issues/11#issuecomment-5462210886) and [PR #12](https://github.com/syedtabishmobin/DocumentManagement/pull/12#issuecomment-5462210905).

## 11. Exact reasons for non-PASS result

The sole gate-blocking reason is notification readiness: ACS Email implementation is missing, send is configured-disabled, delivery conformance has not run, and the Doculyra project addendum explicitly requires operational email or Product Authority acceptance of GitHub-only fallback before autonomous queue execution.

Exact token/cost and context-efficiency data is unavailable, but this is labelled `UNAVAILABLE` and the global addendum says it must not alone block safe governed development. The approved local store satisfies the destination requirement without a new external provider.

## 12. Recommendation for starting the governed Doculyra work queue

Do **not** start the autonomous product queue yet. The framework-only observability layer has independent technical acceptance; make notification-adapter implementation and delivery conformance the next governed item—or record explicit Product Authority acceptance of GitHub-only fallback. Re-run `pnpm agent:status --online` and both notification plans; only after the queue gate changes truthfully to pass should the existing application queue resume at current-authorization coverage.
