# Doculyra Agent Engineering Framework bootstrap report

**Status: COMPLETE.** Final completion was reassessed after independently verified Issue #2 merged to `main` as `6c047bd` and is governed by [Issue #9](https://github.com/syedtabishmobin/DocumentManagement/issues/9). General product development is intentionally stopped at this boundary so Agent Operations & Observability can be installed next.

## 1. Baseline and discovery

Bootstrap scope was framework/governance only; no unrelated product feature development occurred during bootstrap. Initial baseline: clean `main`/`origin/main` at `7b62573`; completion baseline: clean merged `main` at `6c047bd`. Full initial evidence and dispositions are in `.agents/bootstrap/discovery-2026-08-29.json`.

The existing specification-first system, application preview, tests, Azure/Bicep foundations, and CI were inspected and retained. Initial live GitHub discovery found a private repository with Issues enabled, zero Issues/PRs, generic labels only, three active workflows with recent successful runs, no GitHub Environments, no branch protection, and plan-unavailable rulesets. Actions exposed only Azure workload-identity/registry secret names; no repository variables were configured. Current public/protected state is recorded in sections 8 and 13.

## 2. Existing assets and decisions reused

- `CODEX.md`, approved `docs/00-context/decision-register.md`, ADRs, contracts, traceability, and numbered specification packs remain authoritative.
- `DEC-041` and `DEC-054` authorise Phase 1 implementation with synthetic data; production and activation fences remain intact.
- Existing pnpm, Flutter, Bicep and GitHub Actions gates are extended rather than replaced.
- Current synthetic preview and latest local multi-workspace identity/authority increment are preserved; implementation status truthfully records zero complete stories.
- Azure Communication Services Email infrastructure is prepared but the adapter remains absent/disabled.

## 3. Reusable global framework

Reusable project/vendor-neutral policy is implemented only under `.agents/framework/`, with role contracts under `.agents/roles/`. It covers authority, challenge, discovery/disposition, consultation, lifecycle, dependency-aware parallelism, separation of duties, quality/environment/release gates, critical decisions, UAT readiness, and truthful exactly-once notifications.

## 4. Doculyra profile and team

`.agents/project/` binds the framework to Doculyra, GitHub/GitHub Issues, source hierarchy, team, environments, current state, labels, repository controls and ordered work queue. Structured owner/contact and notification values are isolated under `.agents/config/`; matching normalized project/global addresses resolve to one To recipient and no CC duplicate.

## 5. Capabilities, protocols and tools

Small skills implement repository discovery, critical decisions, acceptance/test mapping, defect evidence, release readiness and GitHub Issue control-plane use. Capability and least-privilege tool registries reference them. JSON Schemas cover discovery, work items, decisions, defects, handoffs, release evidence, contacts, notification configuration and notification events. Human templates cover discovery, decisions and release/UAT evidence.

## 6. Enforcement and quality gates

- `scripts/validate_agent_framework.py` validates framework/profile separation, paths/cross-references, structured contacts and routing, notification status/ledger, skill registry, source map, GitHub controls, CI integration and this completion report.
- `scripts/test_agent_framework.py` tests recipient deduplication, disabled-adapter truth, immutable deduplication keys, and `SENT` preconditions.
- `scripts/notification_ledger.py` plans and atomically records exactly-once events; it rejects false `SENT` status.
- `pnpm verify:framework` is the framework gate and `pnpm verify` runs it before existing product checks. Existing GitHub Actions therefore enforce it.
- GitHub Issue forms, PR template and CODEOWNERS establish repository-contained work/decision/defect/UAT and sensitive-path controls.

## 7. Deviations and material-change decisions

- `REUSE`: existing governance/specifications, implementation evidence, CI, Azure/IaC and provider fences.
- `EXTEND`: agent control plane, GitHub Issues conventions, notification contract/ledger and onboarding.
- `REFACTOR`: root validation entry point only, preserving existing commands beneath it.
- `REPLACE_SELECTIVELY`: stale operating-path/command descriptions only.
- `REBUILD`: none. No sound product implementation was rewritten.

Independent QA for the first governed work item ran in a separate Codex task and isolated worktree, bound to immutable candidate commits. It independently found defects #5–#8, blocked the first candidate, retested fixes (including a second-round workspace-existence leak), recorded durable evidence, and confirmed all acceptance criteria before merge. GitHub correctly rejected a formal approval from the same signed-in account that authored the PR; no approval was claimed. The documented temporary branch policy requires zero approving reviews, so the independent QA evidence plus protected checks permitted merge.

## 8. Human decisions

`DEC-FWK-001` was the only consequential bootstrap decision. On 29 August 2026 the Product Authority selected Option B and made the repository public. Protected `main`, strict required Phase 1 checks, linear history, resolved conversations, administrator enforcement and branch cleanup are now enabled. Required approving reviews remain zero until a second authorised reviewer exists. GitHub Environment wiring remains separate release-control work. Authoritative Issue: https://github.com/syedtabishmobin/DocumentManagement/issues/1.

## 9. Notifications

The critical-decision and UAT-ready contracts are implemented. ACS delivery is not operational: runtime adapter, allow-list, reconciliation and conformance evidence are absent, so send is prohibited. The `DEC-FWK-001` event is recorded once as `EXTERNAL_ACTION_REQUIRED`; no email is reported as sent. GitHub Issues remains the phone-accessible authoritative channel.

## 10. Operation and onboarding

Root `04_USING_THIS_REPO_WITH_CODEX.md` is durable, linked from `AGENTS.md`, and reconciled with actual paths, source hierarchy, GitHub Issues, branches/PRs/CODEOWNERS, commands, skills/capabilities, environments, CI, notification status, security and completion steps. Its sample prompts match the implemented operating model. A future authorised person can clone/open the repository, follow the guide, find current truth and Issues, validate the framework, and continue without this chat.

## 11. First governed work queue

The ordered queue is in `.agents/project/first-governed-work-queue.md`. Remote enforcement (Issue #1) and transactional durable authority persistence (Issue #2 / PR #4) are complete. The remaining application sequence starts with complete current-authorization coverage, but that queue is intentionally paused: Agent Operations & Observability is the next installation activity. No live connector or PostgreSQL provider activation is recommended before its applicable foundations and conformance gates.

## 12. External/admin actions

- Protected `main` and required checks are resolved under `DEC-FWK-001` Option B.
- Wire deployment workflows to `dev`/`stage`/`prod` GitHub Environments without granting production credentials to change/test jobs; this remains pending until those deployment identities and Stage/production gates are ready.
- Implement and synthetically conformance-test the ACS notification adapter before changing send status; until then notifications remain `EXTERNAL_ACTION_REQUIRED`.

No external/admin action blocks framework bootstrap completion. The pending environment and notification actions remain truthful future release/capability work and are not reported as operational.

## 13. Validation

- `pnpm verify:framework`: PASS — framework structure and six focused invariants, including the complete UAT-ready packet gate.
- `pnpm verify`: PASS using the bundled Node/pnpm runtime — framework, 131-document specification/link/ID checks, 83 OpenAPI operations, 32 event schemas/examples, 12 reference schemas/catalogues, 101 traced tests, TypeScript checks, 41 local TypeScript tests, and all web/API/package builds. The two PostgreSQL-service integration tests are intentionally skipped without `DM_POSTGRES_TEST_URL` locally and pass in protected PostgreSQL 17 CI.
- Flutter `analyze`: PASS; Flutter tests: PASS (4 tests). Local Android artifact build is `BLOCKED_LOCAL_TOOLING` because this Mac has no Android SDK; the GitHub Android runner owns the artifact gate after push. The iOS simulator artifact gate also remains owned by GitHub CI.
- `az bicep build --file infra/main.bicep`: PASS.
- All `.github` YAML files parse successfully; `git diff --check`: PASS.
- The skill-creator supplied `quick_validate.py` could not start because neither available Python runtime includes its undeclared `PyYAML` dependency. No package was installed into the repository. The repository validator independently enforces skill frontmatter, names, descriptions, directory matching and capability registration and passed for all six skills.
- The repository is public; `main` protection matches `DEC-FWK-001`; no GitHub Environments exist; no Issue or pull request is open at completion. Issue #2 and defects #5–#8 are closed, PR #4 is merged, and its three protected checks passed against candidate `4bb43cc` before squash merge `6c047bd`.

## 14. Changed files

Durable bootstrap artifacts include:

- root `AGENTS.md`, `WORKFLOW.md`, and `04_USING_THIS_REPO_WITH_CODEX.md`;
- `.agents/framework-manifest.json` and all reusable framework/role files;
- all Doculyra project/configuration/current-state/queue files;
- capability/tool registries, six skills, nine protocol schemas, three templates, bootstrap discovery/report and notification ledger/event evidence;
- `.github/CODEOWNERS`, PR template, four Issue forms/config, and CI integration;
- framework validator, tests and notification-ledger utility plus package/script documentation; and
- reconciled repository-structure, CI/CD and provider-notification documentation.

The onboarding guide is explicitly included in both completion validation and this changed-files report.

Final bootstrap-status reconciliation changes only this report, `.agents/project/current-state.md`, and `.agents/project/first-governed-work-queue.md`. `04_USING_THIS_REPO_WITH_CODEX.md` and its mandatory root `AGENTS.md` link were revalidated unchanged against the implemented repository paths, GitHub control plane, commands, capabilities, environments and notification status.
