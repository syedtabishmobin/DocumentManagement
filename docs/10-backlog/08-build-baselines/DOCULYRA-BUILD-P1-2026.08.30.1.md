# Doculyra Phase 1 Build Baseline

| Field | Value |
|---|---|
| Baseline ID | `DOCULYRA-BUILD-P1-2026.08.30.1` |
| Status | `IN_REVIEW — DEC-P1-056 resolved; second independent retest of defects #36–#38 pending` |
| Recorded | 30 August 2026, Australia/Sydney |
| Candidate revision | `426be2cd207bb5417f70aedffb2b6304e666a274` |
| Governed work | [Issue #32](https://github.com/syedtabishmobin/DocumentManagement/issues/32) |
| Blocking decision | None; [`DEC-P1-056`](https://github.com/syedtabishmobin/DocumentManagement/issues/33#issuecomment-5463877570) approved the Phase 1 fail-closed fence |
| Machine record | [`build-baseline.v1.json`](../build-baseline.v1.json) |

## Purpose and approval boundary

This record converts the approved Phase 1 product intent into a complete, dependency-aware build reference. It does not declare any product goal, feature, story, environment, business-acceptance gate, UAT gate, or release complete. Product implementation must not begin from this candidate until independent review and protected CI pass and this status becomes `BUILD_BASELINE_APPROVED`.

Once approved, the build may execute against this version. Material product or contract change requires governed change control and a new historically traceable baseline version; routine implementation details may evolve within the approved contracts.

## Product vision, goals, and success criteria

- Product vision: `PROD-VIS-001`, owned by `PROD-PRD-001` version `0.3`.
- Approved goals/outcomes: `OUT-P1-001`–`OUT-P1-007`.
- Measurable success definitions: `MET-P1-001`–`MET-P1-022`.
- Numeric metric targets remain provisional until representative calibration and Product Authority approval. Definitions are build measurement requirements; provisional thresholds are not public launch commitments.
- No outcome can be marked complete until its metrics and applicable product acceptance evidence pass in the required environment and observation window.

## Approved feature, story, and acceptance set

- Delivery slices: `P1-S1`–`P1-S4` as one continuous dependency-aware program.
- Epics: `EPIC-P1-001`–`EPIC-P1-012`.
- Features: `FEAT-P1-001`–`FEAT-P1-031`.
- Stories: `STORY-P1-001`–`STORY-P1-049`.
- Story acceptance criteria: `AC-STORY-P1-001-01` through the two criteria owned by each story, 98 total.
- Test/evaluation expectations: 104 DRAFT stable test cases; DRAFT/PLANNED is traceability, not passing evidence.

Every story inherits the full outcome set of its governing feature. Every story remains `PLANNED_UNISSUED` until an attributed GitHub execution Issue is created and its Definition of Ready passes. Historical Issue #2/PR #4 is bounded implementation evidence for stories `001`–`003`, `039`, and `040`; it completes none of them.

## Architecture, security/privacy, data/domain, AI, and UX baseline

- Architecture: accepted `ADR-ARCH-001`–`011`, including bitemporal history, immutable originals, current authorization, durable commands/events, provider-neutral ports, TypeScript/React/Flutter clients, Azure environments, customer-controlled encryption, 30-day document Trash, and device-local RAG.
- Security/privacy: `SEC-ARCH-001`, `SEC-PRIV-001`, `SEC-THR-001`, current authorization and privacy/audit contracts. Real personal documents remain prohibited until client encryption and all applicable controls pass.
- Data/domain: `ARCH-P1-*`, `DOM-P1-*`, `DATA-P1-*`, `WSP-P1-*`; history is additive and authorization-bearing identities remain separate.
- AI/evaluation: provider-neutral AI/RAG/output/tool/guardrail/evaluation contracts. Hosted plaintext fallback is prohibited; thresholds, providers, production datasets and release evidence remain gated.
- UX: approved Doculyra brand and public entry plus shared web/mobile journey semantics. Final production legal/operator/contact wording, browser/assistive-technology matrix, representative user research and conformance evidence remain release gates.

## Definition of Ready

A story is `READY` only when all of the following are true:

1. approved outcome, feature, requirement, story and AC ownership is reciprocal;
2. positive, negative, failure and unavailable outcomes are observable and testable;
3. dependencies, activation fences, migrations and repair are explicit;
4. architecture, security/privacy, data/domain, AI and UX applicability is resolved;
5. developer and independent test expectations, fixtures, environment and observability are named;
6. no material decision affecting that story is unresolved; and
7. an attributed authoritative GitHub Issue exists before execution.

The dependency graph is generated with `pnpm build:graph`. `BASELINED`, `SHAPING_REQUIRED`, `READY`, `IN_PROGRESS`, `PARTIAL PREVIEW`, `INTENTIONALLY UNAVAILABLE`, and `DONE` are not interchangeable.

## Baseline acceptance criteria

Issue #32's original stable meanings are preserved by the attributed [criterion amendment](https://github.com/syedtabishmobin/DocumentManagement/issues/32#issuecomment-5464068029). The machine baseline stores these exact ID/text pairs and the baseline validator rejects any human/machine divergence.

- `AC-BL-P1-001`: every approved goal has measurable success criteria and exact feature coverage.
- `AC-BL-P1-002`: every required feature has governed stories; every story has atomic testable acceptance criteria and explicit specialist dependencies.
- `AC-BL-P1-003`: missing, orphaned, duplicate, conflicting, stale, and undocumented-scope findings are resolved or explicitly dispositioned without deleting useful history.
- `AC-BL-P1-004`: test/evaluation expectations map to every acceptance criterion and reverse traceability covers material code, tests, Issues, defects, and PRs.
- `AC-BL-P1-005`: GitHub work state reflects the approved baseline and can generate a dependency-aware build queue.
- `AC-BL-P1-006`: an independent reviewer who did not author the material changes confirms Definition of Ready and baseline integrity against the exact candidate.
- `AC-BL-P1-007`: the corrected end-to-end audit reports `END_TO_END_TRACEABILITY_COMPLETE`, or names approved non-blocking exceptions.
- `AC-BL-P1-008`: observability, agent attribution, notifications, CI, and the absence of unresolved material human decisions are verified truthfully.
- `AC-BL-P1-009`: durable baseline evidence records identifier/version, source versions, scope snapshot, ADR/security/data/AI/UX references, risks/exceptions, approvals, and controlled change rules.
- `AC-BL-P1-010`: the approved `DEC-P1-056` Product Authority decision is represented as an explicit independently testable Phase 1 fail-closed ownership/access transition fence; richer independent transfer/delegation semantics remain a later governed capability.

## Current evidence and environment state

- Existing product state: 29 partial-preview stories after adding `STORY-P1-049`, 18 not implemented, 2 intentionally unavailable, 0 complete, subject to validator confirmation.
- `agent-local`: available.
- `dev`: synthetic preview available.
- `stage`: defined, not provisioned.
- BA/business acceptance: not started.
- UAT: not yet applicable/not ready.
- `prod`: defined, not provisioned.

Framework observability, three-level GitHub attribution, and Product Authority ACS notification conformance remain PASS. Framework Product Authority email is not customer notification feature evidence for `STORY-P1-042`.

## Accepted non-blocking exceptions

- Numeric outcome targets remain provisional.
- API/event/reference/accessibility gaps are dependency tasks for their owning stories and do not authorize missing contracts by implication.
- Production legal, processor, provider, DNS, store, real-data, Stage, BA, UAT and production evidence remains gated.
- Historical Issue #2 predates full agent telemetry; its Issue/PR/CI/QA evidence is retained without fabricating events.
- No goal, feature, story, or product release is complete.

## Resolved material decision

`DEC-P1-056` selects a tested fail-closed Phase 1 managed-dependant transition fence. Explicit revisioned attempts, audit, rollback/recovery and permission recalculation are required; no partial or uncertain state may broaden access. Advanced independent transfer/delegation semantics are retained as a later governed capability.

## Consultation and review evidence

| Authority | Evidence state |
|---|---|
| Product Manager / BA | Consultation complete; authoritative mapping and public-scope corrections authored |
| Architecture Guardian + Security/Privacy + Data/Domain | Consultation complete; corrections authored and `DEC-P1-056` resolved; exact-candidate review pending |
| AI Architect / Evaluator + UX/Product Design | Consultation complete; AI/UX/public-entry corrections authored |
| Repository & Traceability Steward + QA/Release | Consultation complete; exact-candidate independent review deliberately withheld |
| Independent baseline reviewer | Candidate `41b0f4b7c0eaaad388fd84c59c849ed8dd20385c` passed #36/#38 but FAILED #37 semantic consistency; remediation content revision `426be2cd207bb5417f70aedffb2b6304e666a274` awaits independent retest |

## Approval checklist

- [x] `DEC-P1-056` resolved in GitHub and reflected in all affected records.
- [ ] `pnpm verify` passes on the exact candidate.
- [ ] `pnpm verify:baseline`, `pnpm trace:audit`, and deterministic dependency graph pass.
- [ ] `pnpm agent:status --online` shows no unresolved material decision or defect.
- [ ] Independent reviewer verifies every `AC-BL-P1-*`, GitHub state, attribution, notification readiness, and protected CI at the exact SHA.
- [ ] Issue #32 and the PR contain attributed approval evidence.
- [ ] Status changes to `BUILD_BASELINE_APPROVED` without claiming product completion.
