# Using the Doculyra repository with Codex

This is the human-facing onboarding and operating guide for authorised contributors using Codex. It describes the system that is implemented in this repository; reusable policy remains in `.agents/framework/`, Doculyra policy/configuration remains in `.agents/project/`, and product truth remains in the approved numbered documentation.

## 1. Five-minute onboarding

In a brand-new Codex session:

1. Open or clone `syedtabishmobin/DocumentManagement` and use the repository root.
2. Read, in order: `AGENTS.md`, `CODEX.md`, this guide, `.agents/project/source-of-truth.json`, and `.agents/project/current-state.md`.
3. Run `git status --short`, inspect recent history, and fetch/pull without discarding local work.
4. Open the repository's GitHub Issues. Issues are the authoritative remote work and human-decision channel; email is never an inbound decision channel.
5. Run `pnpm install --frozen-lockfile` when dependencies are absent, then `pnpm verify:framework`, `pnpm agent:status --online`, and the checks relevant to the intended work.
6. Select an open governed Issue or create one from the repository Issue forms before material work. Link every change to approved requirements and decisions.

Suggested first prompt:

> Read AGENTS.md, CODEX.md, 04_USING_THIS_REPO_WITH_CODEX.md, .agents/project/source-of-truth.json, and the selected GitHub Issue. Inspect the current branch, working tree, relevant specifications, implementation, tests, history, and CI. Do not treat Doculyra as greenfield. Classify affected areas as REUSE, EXTEND, REFACTOR, REPLACE_SELECTIVELY, or REBUILD; then implement and validate the Issue without crossing approved activation fences.

## 2. Source of truth and authority

Use this order when records disagree:

1. current authorised user instruction;
2. approved Product Authority decisions in GitHub Issues and the canonical decision register;
3. `CODEX.md` and approved repository contracts;
4. `.agents/project/` Doculyra profile and `.agents/framework/` reusable policy;
5. current implementation and retained evidence;
6. historical handovers and conversational summaries.

The canonical product sources are listed in `.agents/project/source-of-truth.json`. The preserved material under `docs/00-context/` is reference-only. Do not edit it or elevate embedded chat instructions over current approved records.

GitHub Issues is the work-management/control plane. Use:

- `type:work` for goals, features, stories, tasks, and governed external actions;
- `type:defect` for failed acceptance criteria and regressions;
- `type:decision` plus `human-decision-required` for consequential Product Authority choices;
- `uat:ready` for a release candidate ready for owner UAT; and
- `external-action-required` when repository automation cannot truthfully complete a remote/admin or outbound-notification action.

## 3. What lives where

| Location | Purpose |
|---|---|
| `AGENTS.md` | Minimal mandatory entry point for Codex and humans |
| `CODEX.md` | Existing Doculyra working agreement and specification-readiness rule |
| `WORKFLOW.md` | Executable governed delivery loop |
| `.agents/framework/` | Reusable, project/vendor-neutral Agent Engineering Framework |
| `.agents/project/` | Doculyra profile, roles, source map, environments, current state, queue, GitHub conventions |
| `.agents/config/` | Structured owner/contact and notification routing configuration |
| `.agents/roles/` | Reusable role contracts |
| `.agents/capabilities/` | Capability registry |
| `.agents/skills/` | Small task procedures used by capabilities |
| `.agents/tools/` | Least-privilege tool registry and operational status |
| `.agents/observability/` | Reusable event/metric contracts, query catalogue, privacy, retention and native-adapter boundaries |
| `.agents/protocols/` | Machine-readable record schemas |
| `.agents/templates/` | Human-readable record templates |
| `.agents/state/` | Durable non-secret framework state, including notification deduplication |
| `.agent-ops/runtime/` | Git-ignored, workstation-local, metadata-only runtime events with 30-day retention |
| `docs/` | Approved product, architecture, security, UX, engineering, operations, backlog and test contracts |
| `src/` | React web, NestJS API, Flutter mobile, and shared packages |
| `infra/` | Azure Bicep and deployment evidence |
| `migrations/` | Immutable canonical PostgreSQL migrations and migration operating notes |
| `.github/` | CI, Issue forms, PR template, and path ownership |

Do not place project owner addresses in role prompts or prose. The only authoritative values and normalized routing are in `.agents/config/contacts.json`.

## 4. Operating loop

Follow `DISCOVER → UNDERSTAND → ANALYSE → CONSULT → DECIDE → PLAN → IMPLEMENT → TEST → DOCUMENT → HANDOFF`.

For material work:

1. Inspect applicable specs, ADRs/decisions, code, tests/evaluations, recent history, CI/CD, environments, security/privacy controls, and open Issues/PRs.
2. Write or update the Issue with scope, acceptance criteria, evidence, risks, dependencies, and requirement/decision IDs.
3. Record a material run with `scripts/agent_ops.py emit`; use stable run/agent IDs and only allow-listed metadata. Subagents record `parentAgentId`.
4. Use `.agents/skills/repository-discovery/SKILL.md` and persist a discovery record when the work changes architecture, security/privacy, data, AI behaviour, environments, release controls, or external integrations.
5. Consult the persistent roles in `.agents/project/team.json` and only the specialists selected by risk. Native Codex subagents may be used when available; use isolated worktrees and contract-first boundaries for parallel changes.
6. Make routine reversible in-scope decisions. Do not silently redefine material behaviour, success criteria, architecture, data handling, or external commitments.
7. Implement the smallest coherent vertical increment; keep status and evidence truthful.
8. Developers add unit tests. Independent QA owns final acceptance and regression verification.
9. Open a linked pull request and complete the review/release evidence.

Sample implementation prompt:

> Continue GitHub Issue #<number>. Read its requirements and linked decisions, inspect existing implementation and tests, and do not redo completed work. Use the persistent roles and risk-selected specialists. Implement a coherent increment with developer-owned unit tests, update traceability/status/evidence, run the affected checks and pnpm verify, and prepare the change for independent QA.

Sample independent QA prompt:

> Independently verify GitHub Issue #<number> against every acceptance criterion and mapped contract. Do not rely on the developer's conclusion. Run affected regression, security/privacy, accessibility, resilience, migration, mobile, and AI evaluations where applicable. Record evidence. Create or update a type:defect Issue for each failure and require independent retest after fixes.

## 5. Commands

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm verify:framework
pnpm verify:observability
pnpm verify:spec
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

Framework-specific tools:

```bash
python3 scripts/validate_agent_framework.py
python3 scripts/notification_ledger.py plan path/to/notification-event.json
python3 scripts/notification_ledger.py record path/to/notification-event.json --status EXTERNAL_ACTION_REQUIRED --evidence <issue-url>
python3 scripts/github_attribution.py wrap --body-file <body.md> --display-agent-id <role-id> --display-role <role-label> --activity <activity-id> --display-run-id <RUN-id> --runtime-agent-id <runtime-id> --runtime-run-id <runtime-run> --role-id <role> --parent-display-agent-id <parent-or-NONE> --work-item <machine-work-id> --work-item-label <human-work-label> --capability-ids <ids> --skill-ids <ids> --tool-ids <ids> --commit <sha-or-PENDING> --environment <environment>
python3 scripts/github_attribution.py validate <wrapped.md>
```

Before an agent creates its first material record, assign its display identity and run in `.agents/state/agent-display-assignments.json`. Use concise role-oriented IDs such as `ORCH-001`, `BA-002`, `ARCH-001`, `DEV-BE-004`, `DEV-WEB-003`, `DEV-MOB-002`, `DEV-AI-005`, `QA-FUNC-007`, `QA-SEC-003`, `QA-E2E-004`, or `AI-EVAL-002`; do not use a raw `codex-<uuid>` as the primary visible identity.

Every material agent-authored Issue/comment, defect/fix update, PR summary/review, QA result/retest, architecture/security decision, Product Authority request, UAT record and release-evidence record uses all three levels generated by `wrap`:

1. the first two lines always show `🤖 <role> · <display agent ID>` and the visible activity/run ID;
2. immediately after those lines and before the full record body, a collapsible execution block shows parent, work item, capabilities, skills, tools, commit and environment; the substantive body is mandatory and cannot be omitted or contain only whitespace; and
3. the final hidden `doculyra-agent-meta:v2` block preserves separate display/runtime agent and run IDs for telemetry joins.

The validator joins the record to the assignment, team, capability, skill and tool registries and rejects inconsistent, out-of-order, or bodyless material records. The implementation agent must not edit a QA agent's conclusions or claim its visible identity; QA must publish or update its own independent records. Do not include owner contact/Azure tenant values in a public record.

Agent Operations commands:

```bash
# Current local agents plus configured environment/notification/telemetry state
pnpm agent:status

# Add live GitHub Issues, decisions, defects and pull requests
pnpm agent:status --online

# Parent/subagent delegation tree; optionally add --work-item <issue-number>
pnpm agent:tree

# Seven-day quality, retry, failure, usage and cost summary; values retain provenance
pnpm agent:summary

# Validate schemas, adapters, privacy negatives and no-double-count aggregation
pnpm verify:observability

# Physically remove local events outside the configured 30-day retention window
pnpm agent:prune

# Native interactive local Codex session view, where supported by the installed CLI
codex agents
```

Start a material run after selecting its Issue. Use stable IDs for the session; never put the user prompt or tool output into the event:

```bash
python3 scripts/agent_ops.py emit \
  --type AGENT_STARTED --run-id <run-id> --agent-id <agent-id> --state RUNNING \
  --role <role-id> --capability <capability-id> --skill <skill-id> --tool <tool-id> \
  --work-item-kind TASK --work-item-id <issue-number> \
  --work-item-url https://github.com/syedtabishmobin/DocumentManagement/issues/<issue-number> \
  --environment agent-local

python3 scripts/agent_ops.py emit \
  --type AGENT_COMPLETED --run-id <run-id> --agent-id <agent-id> --state COMPLETED \
  --result-code PASS --work-item-kind TASK --work-item-id <issue-number> \
  --work-item-url https://github.com/syedtabishmobin/DocumentManagement/issues/<issue-number>
```

For a subagent add `--parent-agent-id <parent-agent-id>`. Emit state transitions for blocked decisions, handoffs, retries, tests, defects, gates and environment promotion. Complex usage records can be supplied with `--event-file <validated-json>`; every value must use `MEASURED`, `PROVIDER_REPORTED`, `ATTRIBUTED`, `ESTIMATED`, or `UNAVAILABLE`.

The runtime store is `.agent-ops/runtime/events.jsonl`, mode-restricted and Git-ignored. Append and query paths enforce 30-day retention, and `pnpm agent:prune` performs explicit physical cleanup. The validator rejects unknown fields, non-normalized free text in identifier/code fields, raw prompt/content keys, secret-like values, unsafe evidence URLs, invalid lifecycle/parent graphs, unregistered attribution IDs and inconsistent provenance before persistence.

Native Codex OpenTelemetry is supported by the installed runtime but disabled. OTel routing is configured only in the user's `~/.codex/config.toml`; a repository `.codex/config.toml` cannot enforce it. Doculyra also requires `log_user_prompt = false`, and native tool-result/error fields need a privacy-filtering collector before export. Do not enable an exporter or copy endpoints/credentials into the repository. The existing Azure Log Analytics/Application Insights infrastructure is the preferred future route to assess, but agent telemetry is not bound to it yet. Current token and cost values therefore report `UNAVAILABLE`, not zero.

Useful monitoring prompts for a future Codex session:

> Use the observability-status skill and current runtime metadata, GitHub, and repository configuration—not chat memory. Show all active Doculyra agents, their parent tree, role, Issue, capability, skills, tools, branch/worktree/PR, state/duration, blockers, pending decisions, defects, QA state, and DEV/STAGE/UAT state. Label token and cost provenance.

> Use the cost-performance-analysis skill. Show this week's usage, cost, retries, failures, rework and first-pass QA by agent/capability/skill. Preserve provenance, exclude duplicate usage records and inclusive parent rollups, and make no precision claims where data is unavailable.

Flutter checks run from `src/apps/mobile` with the pinned CI Flutter version (`3.47.2`):

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

The root `pnpm verify` runs framework and observability validation, specification validation, TypeScript checks, tests, and builds. GitHub Actions therefore gates observability on the specifications/TypeScript job and additionally compiles Bicep and verifies Flutter Android/iOS.

Workspace authority persistence defaults to the file-backed synthetic profile. The PostgreSQL adapter selected by `ADR-ARCH-007` is explicit and fail-closed. Its migration/verification commands, secret/TLS requirements, synthetic import, repair rules and activation fences are in `docs/09-devops/07-postgresql-authority-persistence.md`. Do not place `DM_POSTGRES_URL` in a prompt, Issue, source file or Bicep parameter.

## 6. GitHub, branches, ownership, and review

Repository: `syedtabishmobin/DocumentManagement` (public), default branch `main`.

- Start from current `main`; use `codex/<issue>-<short-name>` for ordinary Codex work.
- Keep one coherent change per branch and link the PR to the Issue.
- `.github/CODEOWNERS` identifies sensitive paths. Approval authority still follows `CODEX.md`, the decision register, and `.agents/project/team.json`.
- The required quality workflow is `.github/workflows/ci.yml` (`Phase 1 quality gates`).
- `main` is remotely protected under `DEC-FWK-001`: use a pull request; all three Phase 1 jobs must pass against current `main`; linear history and resolved conversations are required; administrators cannot bypass; force-push and branch deletion are disabled.
- Required approving reviews are temporarily zero because only one authorised reviewer is configured. When a second authorised reviewer is added, change this to one independent approval and enable required CODEOWNER review.
- Head branches are deleted automatically after merge.
- Never let generated code or the implementation agent approve its own release.

## 7. Environments and release gates

The implemented environment model is:

- `agent/local`: local synthetic data only;
- `dev`: Azure Australia synthetic development preview;
- `stage`: defined but not provisioned/wired for governed Stage acceptance;
- `prod`: defined but not provisioned or approved.

GitHub Environments are not currently configured. Azure environment truth and activation fences are in `docs/09-devops/`, `infra/environments/`, and `.agents/project/environments.json`. External connectors, external notifications, and hosted AI remain disabled unless their exact adapter, conformance, security/privacy, and release gates pass.

The PostgreSQL code adapter and canonical migrations exist, but Azure PostgreSQL provisioning and runtime activation are not enabled. The current dev preview explicitly remains on `DM_AUTHORITY_STORE=file`. Exact database SKU/capacity, managed identity/database administration, private network, backup/restore, cost and release evidence remain required before activation. The historical deployed Cosmos resource is no longer declared or used and needs a separately authorised live dependency check and retirement operation.

A release candidate cannot be called UAT-ready until Stage QA and BA/business acceptance pass. The UAT record must include access instructions, delivered scope, test/evaluation summary, known residual risks, BA status, recommended scenarios, and durable evidence links.

## 8. Product Authority decisions and notifications

When a genuine human-owned blocking decision is first reached:

1. create or update the authoritative `type:decision` GitHub Issue;
2. persist the decision brief and evidence;
3. generate a stable deduplication key and atomically reserve it in `.agents/state/notification-ledger.json`;
4. send one actionable email only through the configured, enabled, delivery-tested adapter using the stable provider operation ID;
5. record provider acceptance as `SUBMITTED`, then record `SENT` only after recipient-level terminal delivery evidence;
6. include the direct Issue URL and record the delivery result; and
7. continue independent safe work while stopping only the affected path.

The blocking subject is `[Doculyra][ACTION REQUIRED][<Decision ID>] <short title>`. A UAT-ready subject is `[Doculyra][UAT READY][<Release Candidate>] <short summary>`.

The ACS Email transport, recipient allow-list, atomic ledger, bounded retry and Azure Monitor delivery reconciliation are implemented under Issue #18. Activation remains `CONFIGURED_DISABLED` and conformance is `BLOCKED_EXTERNAL_VALIDATION`: authorised Azure login, live resource/role/sender/diagnostic verification, Bicep what-if/deployment and two terminal delivery tests have not completed. Normal plans therefore still return `EXTERNAL_ACTION_REQUIRED`. Do not claim an email was delivered from ACS submission alone.

Notification state: implementation=IMPLEMENTED; activation=CONFIGURED_DISABLED; deliveryConformance=BLOCKED_EXTERNAL_VALIDATION; sendAllowed=false.

After authorised Azure login, use the exact Issue #18 conformance sequence from the repository root:

```bash
pnpm --filter @document-management/api build

export DM_PROFILE=agent-local
export DM_NOTIFICATION_CREDENTIAL_MODE=AZURE_CLI
export DM_NOTIFICATION_ALLOW_AZURE_CLI_CREDENTIAL=enabled
export DM_AZURE_COMMUNICATION_ENDPOINT=https://acs-doculyra-dev.australia.communication.azure.com
export DM_EMAIL_FROM=DoNotReply@9900614b-2e01-4d86-93aa-379c583ada57.azurecomm.net
export DM_LOG_ANALYTICS_WORKSPACE_ID=<customer-id-of-log-doculyra-dev-workspace>

python3 scripts/notification_ledger.py dispatch .agents/state/events/issue-18-blocking-notification-conformance.json --conformance
python3 scripts/notification_ledger.py check-delivery .agents/state/events/issue-18-blocking-notification-conformance.json
python3 scripts/notification_ledger.py dispatch .agents/state/events/issue-18-blocking-notification-conformance.json --conformance

python3 scripts/notification_ledger.py dispatch .agents/state/events/issue-18-uat-ready-notification-conformance.json --conformance
python3 scripts/notification_ledger.py check-delivery .agents/state/events/issue-18-uat-ready-notification-conformance.json
python3 scripts/notification_ledger.py dispatch .agents/state/events/issue-18-uat-ready-notification-conformance.json --conformance
```

Wait for Azure Monitor ingestion and repeat `check-delivery` while the result is `SUBMITTED`/pending. The repeated `dispatch` commands must return the existing terminal/submitted result without invoking ACS again. Never use `--retry` unless the Issue records why the prior attempt is safe to retry; attempts are capped at three and reuse the same provider operation ID.

## 9. Secrets, privacy, and least privilege

- Never commit SMTP credentials, OAuth tokens, API keys, private certificates, customer documents, or copied secret values.
- Application secrets belong in environment-specific Azure Key Vault and runtime workloads use managed identity where supported.
- GitHub workflows receive read-only contents permission unless a job has a documented need for more.
- Use synthetic data in local/dev/CI and release evidence. Customer content must not enter prompts, logs, Issues, email, or ordinary fixtures.
- Preserve the customer-controlled encryption/device-processing boundary and current authorization, deletion, residency, audit, and recovery fences.

## 10. How to know where to continue

Open GitHub Issues first, then compare them with:

- `.agents/project/current-state.md` for the latest framework/bootstrap assessment;
- `.agents/bootstrap/2026-08-30-final-autonomous-readiness-report.md` for the latest notification and autonomous-queue gate evidence;
- `.agents/project/first-governed-work-queue.md` for the recommended queue;
- `docs/10-backlog/05-personal-family-implementation-status.md` for evidence-backed implementation status; and
- `docs/10-backlog/06-personal-family-remaining-work.md` for the full Phase 1 gap inventory.

No story was complete at the assessed baseline; the current implementation is a synthetic preview. Do not mistake a deployed page, configured provider, or happy-path test for acceptance completion.

## 11. Session completion checklist

- The selected Issue and acceptance criteria are updated.
- Decisions, defects, waivers, and residual risks are durable and linked.
- `pnpm verify:framework` and all affected checks pass; skipped gates are explicit.
- `pnpm agent:status --online` reflects the terminal agent, blocker, GitHub, environment, notification and telemetry state.
- Independent QA evidence exists where required.
- Product/status/traceability/operations records match the implementation.
- Notification events are deduplicated and truthfully marked `RESERVED`, `SUBMITTED`, `SENT`, `FAILED`, or `EXTERNAL_ACTION_REQUIRED`.
- Changed files, validation, external/admin actions, and next work are reported.
- Coherent commits are pushed; no secrets or unrelated local files are included.
