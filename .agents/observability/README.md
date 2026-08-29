# Agent operations observability

This directory contains reusable, vendor-neutral definitions. Runtime events are written to the project-configured store and are never committed.

- `event-schema.json` is the closed event contract.
- `metric-catalog.json` defines aggregation, quality linkage and provenance.
- `queries/catalog.json` defines the minimum monitoring views.
- `adapters/codex-otel.md` records supported native telemetry boundaries.
- `privacy-policy.md` and `retention-policy.md` define source controls.

Project binding is in `.agents/project/observability.json`. Validate with `pnpm verify:observability`; query with `pnpm agent:status`, `pnpm agent:tree`, and `pnpm agent:summary`; force physical retention cleanup with `pnpm agent:prune`.
