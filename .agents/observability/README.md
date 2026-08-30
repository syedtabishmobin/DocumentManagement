# Agent operations observability

This directory contains reusable, vendor-neutral definitions. Runtime events are written to the project-configured store and are never committed.

- `event-schema.json` is the closed event contract.
- `metric-catalog.json` defines aggregation, quality linkage and provenance.
- `queries/catalog.json` defines the minimum monitoring views.
- `adapters/codex-otel.md` records supported native telemetry boundaries.
- `privacy-policy.md` and `retention-policy.md` define source controls.

Project binding is in `.agents/project/observability.json`. The layered delivery-control-centre binding is in `.agents/project/control-centre.json`; its volatile event source remains the same Git-ignored store. Validate with `pnpm verify:observability`; query with `pnpm agent:status`, `pnpm agent:tree`, `pnpm agent:summary`, `pnpm agent:trace`, or `pnpm agent:audit`; start the loopback dashboard with `pnpm agent:dashboard`; force physical retention cleanup with `pnpm agent:prune`.
