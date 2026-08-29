# Using the Doculyra repository with Codex

This is the human-facing onboarding and operating guide for authorised contributors using Codex. It describes the system that is implemented in this repository; reusable policy remains in `.agents/framework/`, Doculyra policy/configuration remains in `.agents/project/`, and product truth remains in the approved numbered documentation.

## 1. Five-minute onboarding

In a brand-new Codex session:

1. Open or clone `syedtabishmobin/DocumentManagement` and use the repository root.
2. Read, in order: `AGENTS.md`, `CODEX.md`, this guide, `.agents/project/source-of-truth.json`, and `.agents/project/current-state.md`.
3. Run `git status --short`, inspect recent history, and fetch/pull without discarding local work.
4. Open the repository's GitHub Issues. Issues are the authoritative remote work and human-decision channel; email is never an inbound decision channel.
5. Run `pnpm install --frozen-lockfile` when dependencies are absent, then `pnpm verify:framework` and the checks relevant to the intended work.
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
| `.agents/protocols/` | Machine-readable record schemas |
| `.agents/templates/` | Human-readable record templates |
| `.agents/state/` | Durable non-secret framework state, including notification deduplication |
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
3. Use `.agents/skills/repository-discovery/SKILL.md` and persist a discovery record when the work changes architecture, security/privacy, data, AI behaviour, environments, release controls, or external integrations.
4. Consult the persistent roles in `.agents/project/team.json` and only the specialists selected by risk. Native Codex subagents may be used when available; use isolated worktrees and contract-first boundaries for parallel changes.
5. Make routine reversible in-scope decisions. Do not silently redefine material behaviour, success criteria, architecture, data handling, or external commitments.
6. Implement the smallest coherent vertical increment; keep status and evidence truthful.
7. Developers add unit tests. Independent QA owns final acceptance and regression verification.
8. Open a linked pull request and complete the review/release evidence.

Sample implementation prompt:

> Continue GitHub Issue #<number>. Read its requirements and linked decisions, inspect existing implementation and tests, and do not redo completed work. Use the persistent roles and risk-selected specialists. Implement a coherent increment with developer-owned unit tests, update traceability/status/evidence, run the affected checks and pnpm verify, and prepare the change for independent QA.

Sample independent QA prompt:

> Independently verify GitHub Issue #<number> against every acceptance criterion and mapped contract. Do not rely on the developer's conclusion. Run affected regression, security/privacy, accessibility, resilience, migration, mobile, and AI evaluations where applicable. Record evidence. Create or update a type:defect Issue for each failure and require independent retest after fixes.

## 5. Commands

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm verify:framework
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
```

Flutter checks run from `src/apps/mobile` with the pinned CI Flutter version (`3.47.2`):

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

The root `pnpm verify` runs framework/specification validation, TypeScript checks, tests, and builds. GitHub Actions additionally compiles Bicep and verifies Flutter Android/iOS.

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
3. generate a stable deduplication key and reserve it in `.agents/state/notification-ledger.json`;
4. send one actionable email only through the configured, enabled, delivery-tested adapter;
5. include the direct Issue URL and record the delivery result; and
6. continue independent safe work while stopping only the affected path.

The blocking subject is `[Doculyra][ACTION REQUIRED][<Decision ID>] <short title>`. A UAT-ready subject is `[Doculyra][UAT READY][<Release Candidate>] <short summary>`.

Doculyra currently has Azure Communication Services Email infrastructure prepared, but the runtime adapter, recipient allow-list, delivery-state reconciliation, and conformance test are not complete. `.agents/config/notifications.json` therefore prohibits send and requires `EXTERNAL_ACTION_REQUIRED`. Do not claim an email was sent. The GitHub Issue remains actionable from a phone and authoritative for the decision.

## 9. Secrets, privacy, and least privilege

- Never commit SMTP credentials, OAuth tokens, API keys, private certificates, customer documents, or copied secret values.
- Application secrets belong in environment-specific Azure Key Vault and runtime workloads use managed identity where supported.
- GitHub workflows receive read-only contents permission unless a job has a documented need for more.
- Use synthetic data in local/dev/CI and release evidence. Customer content must not enter prompts, logs, Issues, email, or ordinary fixtures.
- Preserve the customer-controlled encryption/device-processing boundary and current authorization, deletion, residency, audit, and recovery fences.

## 10. How to know where to continue

Open GitHub Issues first, then compare them with:

- `.agents/project/current-state.md` for the latest framework/bootstrap assessment;
- `.agents/project/first-governed-work-queue.md` for the recommended queue;
- `docs/10-backlog/05-personal-family-implementation-status.md` for evidence-backed implementation status; and
- `docs/10-backlog/06-personal-family-remaining-work.md` for the full Phase 1 gap inventory.

No story was complete at the assessed baseline; the current implementation is a synthetic preview. Do not mistake a deployed page, configured provider, or happy-path test for acceptance completion.

## 11. Session completion checklist

- The selected Issue and acceptance criteria are updated.
- Decisions, defects, waivers, and residual risks are durable and linked.
- `pnpm verify:framework` and all affected checks pass; skipped gates are explicit.
- Independent QA evidence exists where required.
- Product/status/traceability/operations records match the implementation.
- Notification events are deduplicated and truthfully marked `SENT`, `FAILED`, or `EXTERNAL_ACTION_REQUIRED`.
- Changed files, validation, external/admin actions, and next work are reported.
- Coherent commits are pushed; no secrets or unrelated local files are included.
