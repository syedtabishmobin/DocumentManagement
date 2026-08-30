# Repository validation

## Agent framework

Run `pnpm verify:framework` from the repository root. It executes:

- `python3 scripts/validate_agent_framework.py`, which validates framework/profile separation, required paths, structured configuration, source links, small skills, notification routing/ledger, GitHub controls, CI integration, and bootstrap completion; and
- `python3 scripts/test_agent_framework.py`, which exercises recipient allow-list, atomic reservation, bounded retry, notification content, submission/delivery truth, deduplication, attribution and validator invariants; and
- `pnpm verify:observability`, which validates the Agent Operations contracts and runs privacy, lifecycle, tree, state, usage-provenance and no-double-count smoke tests.

Validate a structured record with `python3 scripts/validate_agent_framework.py --record <type> <file.json>`.

Use `python3 scripts/notification_ledger.py plan <event.json>` to resolve deduplicated recipients and truthful adapter status. `dispatch` atomically reserves and invokes the built ACS transport; `check-delivery` reconciles recipient-level Azure Monitor evidence. Provider acceptance records `SUBMITTED`, not `SENT`. Direct `record SENT` is prohibited. `--conformance` is restricted to the governed adapter test path and `--retry` is bounded to the same event/provider operation identity.

Build-baseline and traceability controls:

- `pnpm verify:baseline` validates the approved outcome/metric/epic/feature/story/AC/test inventory, reciprocal feature/story/outcome and test mappings, implementation-evidence paths, completion integrity, and the dependency DAG.
- `pnpm build:graph` prints deterministic topological story order; add `--format json` or `--format dot` for machine-readable output.
- `pnpm trace:audit` reruns the read-only end-to-end audit and emits `END_TO_END_TRACEABILITY_COMPLETE` only for an independently approved baseline with no blocking decision.

Register the display/runtime run pairing in `.agents/state/agent-display-assignments.json`, then use `python3 scripts/github_attribution.py wrap --body-file <body.md> ...` to generate the complete three-level material GitHub record. It begins with the visible role/display agent and display run, places collapsible parent/work/capability/skill/tool/revision/environment details immediately next, requires and preserves a non-empty full body after those details, and ends with hidden v2 metadata containing separate display and runtime identities. Run `python3 scripts/github_attribution.py validate <wrapped.md>` before publication; legacy v1-only, bodyless, or out-of-order records do not satisfy the material-record gate.

Use one stable `workItem` correlation key for the whole assigned run—normally the governing Issue such as `issue-32`. Artifact-specific Level 2 text belongs in `workItemLabel`, so the Issue can display `Issue #32` and its PR can display `Issue #32 / PR #34` without changing the machine join. Completed assignments remain immutable valid history; `status` indicates lifecycle, not permission to rewrite or invalidate earlier evidence.

Use `pnpm agent:status`, `pnpm agent:tree`, and `pnpm agent:summary` for the local Agent Operations interface. Add `--online` to status for current GitHub context. Start the loopback-only read-only Delivery Control Centre with `pnpm agent:dashboard`; use `pnpm agent:snapshot`, `pnpm agent:trace <stable-id>`, and `pnpm agent:audit` for its machine-readable equivalents. `pnpm agent:project --online` verifies the persistent GitHub Project, required semantic fields, saved views and governed item coverage. `pnpm agent:project:reconcile` is dry-run by default; add `--apply` only in an authorised governed Project-maintenance run to align field options, view filters/columns and explicitly versioned current-item metadata. `pnpm agent:prune` physically removes events outside retention. `scripts/agent_ops.py emit` validates and appends metadata-only events to the Git-ignored local store.

Use `pnpm backlog:project` to compare the approved Phase 1 outcome, metric, epic, feature and story inventory with the GitHub Product Backlog. `pnpm backlog:project:apply` idempotently creates only missing Project draft items and assigns governed hierarchy/status fields. Each story item contains its exact acceptance criteria and test/evaluation expectations; convert the selected draft story to an attributed Issue before implementation. Existing governed story Issues are reused and never duplicated.

## Specification validation

Run from the repository root:

```sh
python3 scripts/validate-specifications.py
```

The validator uses only the Python standard library and checks:

- required Markdown artifacts across the governance and `01`–`12` specification packs;
- unique document IDs;
- local Markdown link targets;
- references to owned decision, product, architecture, document-intelligence, AI, security, UX/accessibility, engineering, operations, backlog, and test IDs;
- exact PRD-requirement coverage in the feature catalogue;
- contiguous numbered product and downstream rule/story/test namespaces;
- duplicate acceptance-scenario definitions; and
- the checksum of preserved historical files.

The specification validator is the Markdown ownership/link/checksum gate. The later validators own the detailed API/event, reference-data, fixture-privacy, and test-to-upstream semantics. None replaces executed contract, security, accessibility, AI, migration, resilience, recovery, or release evidence.

## Reference-data validation

Run from the repository root:

```sh
python3 scripts/validate-reference-data.py
```

This standard-library validator checks every JSON Schema and catalogue under `docs/11-reference-data/`. It rejects duplicate JSON keys, unsupported schema keywords, invalid local schema references, schema violations, duplicate or dangling stable IDs, incorrectly typed status/action/source/type references, incomplete metadata or retirement contracts, and mismatches in the exact governed state/action vocabularies.

It also enforces the initial seed's open-decision fences: all runtime-affecting entries remain DRAFT/disabled; clinical types stay at `POLICY_HOLD` outside ordinary processing; synthetic sources and endpoints stay disabled, non-production, and under `.invalid`; roles and severity definitions confer no authority or threshold; aggregate scoring remains off; and external notification channels remain disabled while `DEC-037` is open.

## API and event contract validation

Run from the repository root:

```sh
python3 scripts/validate-api-contracts.py
```

This standard-library validator parses the OpenAPI 3.1 contract and every event schema/example; rejects duplicate JSON keys and non-local or unresolved references; checks the exact, unique `API-P1-101`–`183` and `EVT-P1-001`–`032` inventories; enforces bearer security, workspace/purpose context, command idempotency, optimistic concurrency, and open-decision fences; and validates request, response, and event examples against their declared schemas.

## Test traceability and fixture validation

Run from the repository root:

```sh
python3 scripts/validate-test-traceability.py
```

This standard-library validator parses the synthetic manifests under `docs/12-testing/fixtures/`; rejects duplicate keys and stable IDs, dangling test/fixture/dataset/workload/fault references, owner-document inventory drift, non-synthetic or representative version `0.1` inputs, unreserved endpoints, and real-looking personal/credential data; validates every mapped upstream requirement, use case, acceptance, NFR, security, document-intelligence, AI, API, event, UX, accessibility, story, and story-acceptance ID; and reports exact coverage. Once the backlog is present, uncovered stories or requirements fail rather than silently passing.

All four validators are repository gates. They do not replace API/event transport tests, migration and compatibility tests, privacy/security negative suites, AI evaluations, source conformance tests, accessibility review, representative NFR/DR exercises, or recorded release evidence.
