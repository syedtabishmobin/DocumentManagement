# Repository validation

## Agent framework

Run `pnpm verify:framework` from the repository root. It executes:

- `python3 scripts/validate_agent_framework.py`, which validates framework/profile separation, required paths, structured configuration, source links, small skills, notification routing/ledger, GitHub controls, CI integration, and bootstrap completion; and
- `python3 scripts/test_agent_framework.py`, which exercises notification deduplication and validator invariants.

Validate a structured record with `python3 scripts/validate_agent_framework.py --record <type> <file.json>`.

Use `python3 scripts/notification_ledger.py plan <event.json>` to resolve deduplicated recipients and truthful adapter status. Use `python3 scripts/notification_ledger.py record <event.json> --status <status> --evidence <url>` to record an exactly-once result. `SENT` is rejected unless configuration is operational and a provider message ID is supplied.

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
