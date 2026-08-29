---
name: telemetry-validation
description: Validate agent observability schemas, privacy boundaries, attribution, retention, and aggregation invariants. Use when changing telemetry contracts, emitters, adapters, monitoring queries, or readiness gates.
---

# Telemetry validation

1. Run `pnpm verify:observability` and inspect failures rather than weakening the closed schema.
2. Verify stable event/run/agent correlation, parent-child integrity, registered capability/skill/tool IDs, and project adapter paths.
3. Test negative privacy cases for raw prompts, secrets, content and unknown fields at emission time.
4. Verify usage provenance, null/unavailable consistency, `recordId` deduplication and exclusion of inclusive parent rollups.
5. Treat an untested external route, missing data, or disabled adapter as unavailable—not a pass.
