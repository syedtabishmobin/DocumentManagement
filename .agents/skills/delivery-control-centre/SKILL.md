---
name: delivery-control-centre
description: Build or query a layered read-only delivery control centre using authoritative work records, validated agent operations metadata, shared IDs, and truthful freshness/provenance. Use when delivery state, agent activity, quality, cost, environment, traceability, audit, or historical trends need one inspectable interface.
---

# Delivery Control Centre

Use this skill to build or query Doculyra's read-only delivery control centre without replacing GitHub Issues as durable truth.

1. Read `.agents/project/control-centre.json`, `.agents/project/observability.json`, and the queue checkpoint.
2. Resolve each value from a declared repository, runtime, GitHub, environment, notification, or evidence source.
3. Label data `LIVE`, `CURRENT`, or `HISTORICAL` with its observation timestamp.
4. Preserve stable work, requirement, agent, run, test, environment, commit, Issue and PR IDs for drill-through.
5. Keep token/cost provenance explicit and exclude inclusive parent usage from totals.
6. Return `UNAVAILABLE` for missing data; never coerce it to zero or infer it from chat text.
7. Expose no mutation controls. Bind local HTTP only to loopback and reject unsafe methods.
8. Do not persist raw prompts, secrets, customer/document content, or arbitrary tool payloads.
9. Keep authorised GitHub Project maintenance outside the dashboard: dry-run `pnpm agent:project:reconcile`, apply only in a governed maintenance run, and never let Project automation establish QA, merge, release, BA, or UAT completion.
10. Validate routes, privacy, read-only behavior, caching/freshness, traceability and current-state joins before handoff.
