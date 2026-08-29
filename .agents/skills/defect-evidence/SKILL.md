---
name: defect-evidence
description: Capture an acceptance, regression, security, privacy, accessibility, resilience, migration, mobile, or AI-evaluation failure as a reproducible evidence-backed defect. Use whenever independent verification finds a failed criterion.
---

# Defect evidence

1. Name the failed criterion, exact candidate/revision, environment, and synthetic fixture.
2. Record minimal reproducible steps, expected result, actual result, durable privacy-safe evidence, severity, affected contracts, and owning component.
3. Create or update a `type:defect` Issue; do not hide the failure in a closed story.
4. Require a developer fix with appropriate unit/regression coverage.
5. Require independent retest of the exact criterion and affected regression before closure.
6. Validate structured records against `.agents/protocols/defect.schema.json`.
