# Product Specification Index

| Field | Value |
|---|---|
| Document ID | `PROD-IDX-001` |
| Status | Active navigation aid |
| Updated | 26 August 2026 |

## Reading order

1. [`PROD-VIS-001` — Product Vision and Strategy](01-product-vision-strategy.md)
2. [`PROD-PRD-001` — Phase 1 Product Requirements Document](02-phase-1-prd.md)
3. [`PROD-FEAT-001` — Feature Catalogue](03-feature-catalogue.md)
4. [`PROD-UC-001` — Use Case Catalogue](04-use-case-catalogue.md)
5. [`PROD-PER-001` — Personas and Journeys](05-personas-and-journeys.md)
6. [`PROD-SCOPE-001` — Scope and Success Metrics](06-scope-and-success-metrics.md)
7. [`PROD-COMP-001` — Competitive and Gap Analysis](07-competitive-gap-analysis.md)

The reading order does not change the authority hierarchy in [`CODEX.md`](../../CODEX.md). In particular, approved decisions outrank these drafts, and the competitive analysis is research evidence rather than a normative product contract.

## Status and ownership

| Document | Current role | Approval effect |
|---|---|---|
| `PROD-VIS-001` | Draft strategy and positioning | Does not authorize implementation. |
| `PROD-PRD-001` | Approved implementation baseline with 100 stable `REQ-P1-*` requirements | Development is authorized by `DEC-041` and `DEC-054`; production and real-customer-data processing remain release-gated. |
| `PROD-FEAT-001` | Draft feature decomposition of every PRD requirement | Derivative; cannot add or weaken PRD scope. |
| `PROD-UC-001` | Draft observable actor/system flows and acceptance seeds | Derivative; detailed UX, API, security, and tests remain required. |
| `PROD-PER-001` | Draft persona hypotheses and journeys | Requires product research; personas are not roles. |
| `PROD-SCOPE-001` | Draft outcomes, boundaries, and provisional success/safety metrics | Targets require owner approval and empirical recalibration. Zero-tolerance safety controls cannot be weakened through calibration. |
| `PROD-COMP-001` | Completed baseline research, subject to refresh policy | `GAP-*` items remain recommendations unless adopted by an approved higher-authority source. |

## Stable ID namespaces

| Namespace | Owner | Meaning |
|---|---|---|
| `OUT-P1-*` | `PROD-PRD-001` / `PROD-SCOPE-001` | Phase 1 product outcomes |
| `REQ-P1-*` | `PROD-PRD-001` | Product requirements |
| `FEAT-P1-*` | `PROD-FEAT-001` | Product features |
| `UC-P1-*` | `PROD-UC-001` | Use cases |
| `AC-P1-*`, `AC-UC-P1-*` | PRD and use-case catalogue | Product acceptance scenarios |
| `PER-P1-*` | `PROD-PER-001` | Persona hypotheses |
| `JRN-P1-*` | `PROD-PER-001` | End-to-end user journeys |
| `MET-P1-*` | `PROD-SCOPE-001` | Outcome, quality, and safety measures |
| `GAP-*` | `PROD-COMP-001` | Research recommendations, not requirements |

IDs are never recycled. Retirement and replacement must remain traceable.

## Draft baseline summary

- Four proposed vertical slices: `P1-S1` secure household vault, `P1-S2` understand/retrieve, `P1-S3` monitor/close, and `P1-S4` family launch/portability.
- Seven outcomes: `OUT-P1-001`–`OUT-P1-007`.
- One hundred product requirements across workspace, documents, ingestion, facts, graph, search, monitoring, health, action, notification, sharing, AI, trust, configuration, platform, cryptography, deletion, operations, and assurance.
- Thirty feature records: `FEAT-P1-001`–`FEAT-P1-030`.
- Approved dev/stage and production-fence decisions: `DEC-030`–`DEC-055`.
- Research gaps `GAP-001`–`GAP-010` explicitly dispositioned in the draft PRD.

## Handoff rules

Downstream specifications and backlog items must:

1. cite exact requirement and use-case IDs;
2. distinguish approved decisions from draft proposals and open decisions;
3. preserve every privacy, evidence, current-authorization, approval, history, and visible-failure invariant;
4. map behavior to objective tests and evaluation evidence;
5. keep the core provider-neutral while implementing the Azure and external-provider adapters selected by approved decisions; and
6. report any conflict instead of resolving it by silently changing a lower-authority artifact.
