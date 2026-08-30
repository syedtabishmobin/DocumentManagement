# Doculyra governed delivery workflow

This file is the executable repository workflow. Reusable policy is in `.agents/framework/`; Doculyra bindings are in `.agents/project/`; product and engineering truth remains in the numbered `docs/` sources identified by `CODEX.md`.

## 1. Start and discover

1. Read `AGENTS.md`, `CODEX.md`, `04_USING_THIS_REPO_WITH_CODEX.md`, `.agents/project/source-of-truth.json`, and the applicable approved product/architecture/security/operations records.
2. Pull `main`, inspect the working tree and recent history, and query the `Doculyra Product Delivery` GitHub Project plus open GitHub Issues and pull requests. Never assume the repository is greenfield. If `.agents/state/control-centre-checkpoint.json` records a Product Authority queue pause, do not dispatch product work until its resume policy is satisfied.
3. Create or select the authoritative GitHub Issue. Record scope, acceptance criteria, requirement/decision links, risks, owner, and dependencies.
4. Produce a discovery record for material work using `.agents/protocols/discovery.schema.json` and classify each affected area as `REUSE`, `EXTEND`, `REFACTOR`, `REPLACE_SELECTIVELY`, or `REBUILD`.
5. Emit `AGENT_STARTED` and `WORK_ITEM_STARTED` metadata for material execution using `scripts/agent_ops.py`; include the Issue, role, capability, selected skills, branch/worktree and parent agent when reliably available.

## 2. Decide and plan

1. Confirm the specification-readiness gate and all activation fences before application implementation.
2. Use the persistent roles in `.agents/project/team.json`; consult specialists selected by risk and changed contracts.
3. Resolve discoverable facts. For a consequential unresolved human choice, update a `type:decision` GitHub Issue with evidence, options, impacts, recommendation, blocked scope, and work that continues.
4. Plan and atomically reserve the notification event in the exactly-once ledger. Email is notification only; the linked GitHub Issue is authoritative. Provider acceptance is SUBMITTED; only terminal recipient evidence is SENT.
5. Decompose work by contracts and dependencies. Parallel work must use isolated worktrees/branches and non-overlapping ownership.

## 3. Implement and verify

1. Branch from an up-to-date `main` using `codex/<issue>-<short-name>` unless the owner explicitly chooses another name.
2. Developers own implementation and unit tests. Update contracts, traceability, operational evidence, and status in the same change.
3. Run `pnpm verify:framework`, then the narrow affected checks, then `pnpm verify` before review.
4. Independent QA verifies acceptance criteria and affected regression paths. A failed criterion becomes an evidence-backed defect routed to the owning component; the fixer does not provide final independent retest.
5. Use a pull request linked to the Issue. Complete `.github/pull_request_template.md`; wrap every material agent-authored GitHub record with the configured visible identity, collapsible execution details and final hidden metadata; do not merge with unresolved blocking evidence.
6. Record material capability, skill, tool, test, gate, defect, handoff, retry, blocker and decision transitions. Validate with `pnpm verify:observability`; never persist raw prompts or tool/customer content.

## 4. Release and notify

1. Promote the same immutable candidate through `dev`, `stage`, and `prod`; do not rebuild between environments.
2. Stage/UAT readiness requires Stage QA and BA/business acceptance, a release evidence record, access instructions, residual risks, and recommended UAT scenarios.
3. Reserve one `UAT_READY` event per release candidate. Send only through an enabled adapter with a successful delivery-conformance test; otherwise record `EXTERNAL_ACTION_REQUIRED` and update the GitHub UAT-ready record.
4. Production promotion requires explicit Product Authority approval and the release gates in `docs/09-devops/` and `.agents/framework/quality-release.md`.

## 5. Finish

Update the Issue, durable evidence, source-of-truth records, notification ledger and terminal `AGENT_COMPLETED` or `AGENT_FAILED` event. Run `pnpm agent:status` to confirm truthful final state. Commit coherent changes, push the branch, and report changed files, validation evidence, unresolved risks, external/admin actions, and the next governed queue.
