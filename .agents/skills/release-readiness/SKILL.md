---
name: release-readiness
description: Assess an immutable release candidate for Stage, UAT, or production using independent evidence and environment gates. Use before declaring UAT-ready, promoting, or notifying Product Authority.
---

# Release readiness

1. Bind the candidate to source revision, build definition, artifact digests, configuration/migration/API/reference/AI versions, and evidence.
2. Confirm the same artifact is promoted and the target environment is isolated and correctly configured.
3. Collect required independent QA, security/privacy, accessibility, resilience/performance, migration/repair, mobile, operational, and BA/business acceptance results.
4. Record residual defects/risks, waivers, rollback/forward-repair, access instructions, and recommended UAT scenarios.
5. Validate against `.agents/protocols/release-evidence.schema.json`.
6. Emit `UAT_READY` only when Stage QA and business acceptance pass. Plan and dispatch through the exactly-once ledger, then record `SENT` only after terminal recipient delivery evidence; if the adapter is not operational or delivery cannot be reconciled, update the authoritative UAT Issue and mark the truthful non-success state.
