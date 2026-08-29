# Reusable quality, environment, and release gates

## Quality ownership

Developers own unit/domain tests for their changes. Independent QA owns final acceptance verification and affected regression. Security, privacy, accessibility, data, AI, performance, resilience, migration, and operational assurance are selected by changed contracts and risk.

A gate result is `PASS`, `FAIL`, `BLOCKED`, or `NOT_APPLICABLE` with rationale. Missing evidence is not a pass. A waiver names exact scope, evidence, impact, controls, authority, expiry, monitoring, remediation, and rollback trigger.

## Environment progression

The reusable progression is `agent/local → dev → stage → prod`:

- local/dev use synthetic or explicitly approved test data;
- stage verifies the immutable release candidate, migrations, operations, security/privacy, accessibility, and business acceptance;
- production requires explicit authority, current evidence, separation of duties, rollback/forward-repair readiness, and the same verified artifact digest.

Environment configuration, identities, secrets, data, incidents, and evidence are isolated. A configured integration is not active until its adapter and target-environment conformance pass.

## UAT-ready gate

UAT-ready means the release candidate passed required Stage QA and BA/business acceptance. Its record includes location/access, delivered scope, acceptance/test/evaluation results, known residual defects/risks, business acceptance, recommended scenarios, durable evidence, and the requested owner action. One deduplicated notification event is emitted per candidate through an operational adapter; otherwise the external action is recorded truthfully.

## Production gate

Production promotion blocks on unresolved critical/high risk, unknown destructive migration outcomes, failed authorization/privacy/deletion/audit/residency obligations, missing provenance, unapproved activation fences, or unavailable rollback/repair. The implementing identity cannot supply final release approval.
