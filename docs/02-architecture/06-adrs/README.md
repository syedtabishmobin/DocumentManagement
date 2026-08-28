# Architecture Decision Records

| Field | Value |
|---|---|
| Document ID | `ARCH-ADR-INDEX-001` |
| Version | `0.1` |
| Status | **ACTIVE index** |
| Updated | 28 August 2026 |

## Purpose and authority

This directory records consequential technical choices that refine the approved product decisions and draft architecture contracts. The source-of-truth hierarchy in [`CODEX.md`](../../../CODEX.md) applies:

- an `ACCEPTED` ADR may constrain implementation only within approved product decisions and normative contracts;
- a `PROPOSED` ADR is a reviewable recommendation, not implementation authority;
- an ADR cannot close an `OPEN` product decision, weaken security/privacy requirements, select unapproved scope, or open the implementation gate; and
- vendor, framework, database, identity, AI/OCR, queue, cloud, and deployment choices remain undecided unless a later accepted ADR explicitly selects them.

ADR IDs and filenames are stable. Retired numbers are never reused. A superseding ADR links the prior record rather than rewriting its historical decision.

## Status vocabulary

| Status | Meaning |
|---|---|
| `PROPOSED` | Recommendation awaiting the named architecture/product/security review and approval. |
| `ACCEPTED` | Explicitly approved and active from its recorded effective version/date. |
| `REJECTED` | Considered and declined; retained to prevent repeated ambiguity. |
| `DEFERRED` | Intentionally postponed with the safe abstraction/fence preserved. |
| `SUPERSEDED` | Replaced by a linked later ADR; historical consequences remain traceable. |

## Current ADR set

All ADRs in the current Phase 1 implementation set are **ACCEPTED**.

| ADR | Status | Proposed choice | Primary constraints |
|---|---|---|---|
| [`ADR-ARCH-001`](ADR-001-bitemporal-fact-and-rule-history.md) | ACCEPTED | Append-only bitemporal fact and consequential-rule history with valid-time and transaction-time queries | `DEC-004`, `REQ-P1-FCT-001`–`004`, `DATA-P1-011`–`020` |
| [`ADR-ARCH-002`](ADR-002-immutable-originals-and-rebuildable-derivatives.md) | ACCEPTED | Put-once originals/evidence with versioned, lineage-complete, rebuildable derivatives | `DEC-005`, `REQ-P1-DOC-001`–`008`, `DATA-P1-021`–`030` |
| [`ADR-ARCH-003`](ADR-003-current-authorization-for-derived-projections.md) | ACCEPTED | Projection-time filtering plus mandatory current-policy output enforcement and epoch/fence invalidation | `DEC-003`, `DEC-008`, `REQ-P1-TRUST-002`, `AUTH-P1-019`–`024` |
| [`ADR-ARCH-004`](ADR-004-durable-commands-events-and-eventual-consistency.md) | ACCEPTED | Local authoritative transitions with durable publication, idempotent events, explicit workflows, and eventual cross-aggregate convergence | `DEC-006`, `ARCH-P1-019`–`024`, `DATA-P1-033`–`040` |
| [`ADR-ARCH-005`](ADR-005-provider-neutral-ports-and-residency-policy.md) | ACCEPTED | Versioned provider-neutral ports with capability conformance and policy-enforced processing/residency routes | `DEC-009`, `DEC-022`, `REQ-P1-AI-007`, `REQ-P1-TRUST-005`, `009` |
| [`ADR-ARCH-006`](ADR-006-phase-1-local-first-typescript-stack.md) | ACCEPTED | TypeScript monorepo, responsive React PWA, NestJS API, local adapters, and explicit production adapter gates | `DEC-041`, `DEC-042`, `ENG-STACK-001`, `ENG-REP-001` |
| [`ADR-ARCH-007`](ADR-007-azure-environments-and-managed-services.md) | ACCEPTED | Three Bicep-defined Azure environments, Australian production placement, and managed production adapters | `DEC-049`, `DEC-051`, `DEC-054`, `OPS-IAC-001` |
| [`ADR-ARCH-008`](ADR-008-customer-controlled-client-encryption.md) | ACCEPTED | Customer-controlled client encryption, device/workspace/document key hierarchy, local intelligence, and operator-blind storage | `DEC-050`, `REQ-P1-TRUST-001`–`009`, `SEC-ARCH-001` |
| [`ADR-ARCH-009`](ADR-009-react-web-flutter-mobile.md) | ACCEPTED | React web plus a mobile-first Flutter iOS/Android client sharing contracts and conformance evidence | `DEC-052`, `ENG-STACK-001`, `ENG-REP-001` |
| [`ADR-ARCH-010`](ADR-010-thirty-day-document-recovery-and-purge.md) | ACCEPTED | Immediate deletion fence, 30-day Trash/restore, cross-store purge, crypto-shredding, and restore-safe deletion ledger | `DEC-053`, `REQ-P1-TRUST-007`, `OPS-DR-001` |

Together these records form a coherent logical and deployment baseline: authoritative state and immutable evidence retain history; derivatives remain replaceable; asynchronous work cannot lose triggers or invent completion; every output/effect uses current authorization; Azure adapters remain behind portable boundaries; customer content is encrypted before transfer; React and Flutter share contracts rather than UI source; and deletion remains recoverable for exactly the approved window without resurrection through restore or replay.

## Required ADR contents

Every ADR must include:

1. status, owners/reviewers, date, and decision scope;
2. context and linked approved decisions, requirements, architecture/domain/security rules;
3. the proposed decision and explicit non-decisions;
4. alternatives considered and reasons they are not currently preferred;
5. positive and negative consequences, including migration, security, privacy, cost, operability, deletion, and portability;
6. validation/acceptance evidence;
7. unresolved decisions and safe behavior while open; and
8. revisit/supersession triggers.

An ADR is not accepted by merging or creating its file. Acceptance requires an explicit owner decision and status/date update, followed by aligned requirements, contracts, tests, reference data, traceability, and backlog.

## Review and change workflow

1. Check approved decisions and current normative contracts.
2. Draft alternatives and consequences without hiding product/security choices in implementation detail.
3. Obtain architecture review plus product, security/privacy, operations, data, or AI review as affected.
4. Resolve conflicts through the decision register or higher-authority contract.
5. Record explicit `ACCEPTED`, `REJECTED`, or `DEFERRED` status and effective date.
6. Update every affected rule, API/event/data contract, threat, NFR, test, reference-data package, traceability row, and backlog item.
7. Revalidate vendor portability, workspace/field/edge authorization, evidence lineage, deletion/restore, residency, and recovery before implementation.

## File template

```markdown
# ADR-ARCH-NNN — Decision title

| Field | Value |
|---|---|
| Status | PROPOSED |
| Date | YYYY-MM-DD |
| Decision owners | ... |
| Reviewers required | ... |

## Context
## Decision drivers and traceability
## Proposed decision
## Explicit non-decisions
## Alternatives considered
## Consequences
## Validation before acceptance
## Open-decision fences
## Revisit and supersession triggers
```

## Initial acceptance gate

None of the five initial ADRs may become `ACCEPTED` until:

- the draft PRD and applicable architecture/security contracts have an approved baseline or the ADR is explicitly scoped as a deferred abstraction;
- the logical data/workspace/NFR models agree with the proposed decision;
- failure, authorization, deletion, restore, residency, audit, migration, and portability tests are specified;
- `DEC-038`–`DEC-040` behavior remains fenced where unresolved; and
- no accepted ADR would make implementation unsafe or substantially disposable under the readiness gate.
