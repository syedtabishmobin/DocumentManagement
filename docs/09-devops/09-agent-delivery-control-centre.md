# AI-Native Delivery Control Centre

| Field | Value |
|---|---|
| Document ID | `OPS-CC-001` |
| Version | `1.0` |
| Scope | Agent delivery operations; no product runtime behavior |
| Mode | Local/private/read-only plus authenticated GitHub Project |
| Governing work | [Issue #61](https://github.com/syedtabishmobin/DocumentManagement/issues/61) |

## Layered architecture

The Control Centre extends the existing framework rather than replacing it:

1. [Doculyra Product Delivery](https://github.com/users/syedtabishmobin/projects/1) is the persistent Delivery and Management Project over GitHub Issues and pull requests.
2. `pnpm agent:dashboard` serves the local/private read-only operations interface from `127.0.0.1:4178`.
3. GitHub Issues/PRs/decisions/test evidence and repository manifests remain durable evidence and audit truth.
4. `pnpm agent:trace <stable-id>` and `/traceability` provide shared-ID drill-through without copying source content.

GitHub Issues remains the authoritative work and decision channel. The Project is a managed view over those records; the local dashboard is a query surface. Neither may redefine requirements, acceptance, QA, environment state, or Product Authority decisions.

## Data and freshness model

The normalized snapshot joins only approved sources:

- validated metadata-only local lifecycle events;
- current GitHub Issues, pull requests and labels;
- the approved build baseline and source/test traceability manifests;
- structured role/capability/skill/tool/agent assignments;
- environment and notification configuration; and
- the durable queue checkpoint.

Every source carries `observedAt`, status and one freshness class:

- `LIVE`: local runtime/event state refreshed from the retained store;
- `CURRENT`: GitHub/repository/environment/notification state captured on refresh; or
- `HISTORICAL`: retained events and trends bounded by the configured 30-day policy.

Dashboard snapshots are cached for 30 seconds. A render never calls GitHub directly. Source failure remains `UNAVAILABLE` or `PARTIAL`; it is not converted to zero or a pass.

## Metric and completion semantics

Every catalog metric declares its identifier, definition, source, calculation, freshness, provenance, null behavior and quality link. Usage/cost provenance remains `MEASURED`, `PROVIDER_REPORTED`, `ATTRIBUTED`, `ESTIMATED`, or `UNAVAILABLE`. Usage is deduplicated by `recordId`; only `SELF_ONLY` records enter totals and `INCLUSIVE` parent rollups are display-only.

Work-item status and product success remain separate. `Done` means the governed work record is closed; it does not prove feature/goal outcomes, Stage, BA, UAT, or production readiness.

The six progress measures are deliberately non-conflated:

- Story Work Completion = governed stories in `Done` / all governed stories in scope.
- Acceptance Criteria Completion = ACs with current passing independent evidence / all ACs in scope.
- Feature Work Completion = governed feature stories in `Done` / all governed feature stories.
- Feature Success Criteria Achievement = feature success criteria with current measured passing evidence / all feature success criteria.
- Goal Work Completion = governed goal features in `Done` / all governed goal features.
- Goal Success Criteria Achievement = goal success criteria with current measured passing evidence / all goal success criteria.

Unavailable, skipped, stale, unresolved, or developer-only evidence never counts as passing. Child closure never proves parent success.

## Security and privacy

- The server is fixed to IPv4 loopback and has no public binding option.
- Only `GET`, `HEAD`, and `OPTIONS` are accepted. Mutation methods return `405 READ_ONLY`.
- Content Security Policy permits only same-origin scripts/styles/connections; framing and referrers are disabled.
- The UI uses no external assets and no `innerHTML`/dynamic code execution.
- Raw prompts, credentials, customer/document content, arbitrary tool payloads, sensitive provider data and external exports remain prohibited.
- Request logging includes only method, normalized path and status; headers, query strings and bodies are excluded.
- GitHub Project access requires authenticated owner access. No GitHub Pages site exists.

## GitHub Project contract

The Project has the required Status plus semantic fields for Type, priority, phase, goal/feature/parent, baseline/release, agent/capability, environment, risk/severity, iteration/date/blocking/decision, QA and UAT state. GitHub reserves the exact custom name `Type` while personal repositories expose no native Issue Types; the repository therefore maps required `Type` semantics to the visible `Work Type` field without changing its option set.

The ten saved views are Executive, Delivery Board, Product Backlog, Active Work, QA & Defects, Human Decisions, Stage & UAT, Roadmap, Completed and Trends. Persistent view numbers/URLs, layouts and filters are versioned in `.agents/project/control-centre.json` and checked with `pnpm agent:project --online`.

The required `Work Type`, `Status` and `Priority` option sets, each view's relevant visible fields, and the metadata for the currently paused/active governed items are also versioned there. `pnpm agent:project:reconcile` is a dry run; an authorised maintainer may add `--apply` to align that contract idempotently while preserving select-option identities. The default authenticated Burn up insight is available at `https://github.com/users/syedtabishmobin/projects/1/insights`.

The Project uses GitHub's built-in automation rather than a repository PAT or third-party service. Auto-add targets `syedtabishmobin/DocumentManagement` for Issues and pull requests; GitHub's default closed-Issue and merged-PR workflows set Project `Status` to `Done`. These are presentation automations only and cannot establish story, feature, goal, QA, release, BA, or UAT completion.

## Operations

```bash
pnpm agent:dashboard
pnpm agent:snapshot
pnpm agent:trace STORY-P1-006
pnpm agent:audit
pnpm agent:project --online
pnpm verify:observability
```

Local routes and the Product Authority launch list are maintained in `04_USING_THIS_REPO_WITH_CODEX.md` and the final readiness report. The dashboard must be restarted after repository code/configuration changes; ordinary data refresh happens automatically at the bounded cache interval.

## Preserved queue checkpoint

Product delivery is paused. Issue #58 / PR #59 remain isolated and unmerged at `1c84f44ace589c51018047daebfbd32e968dfbde`; defect #60 is the blocker. Resume begins with its Backend/API fix and independent retest. No later product story was started by this work.
