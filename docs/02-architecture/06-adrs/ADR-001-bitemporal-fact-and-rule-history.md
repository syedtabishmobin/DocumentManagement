# ADR-ARCH-001 — Bitemporal Fact and Rule History

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-001` |
| Status | **PROPOSED — not implementation authority** |
| Date | 26 August 2026 |
| Decision scope | Logical representation and query semantics for canonical facts and consequential rules |
| Decision owners | Architecture and domain/data owners |
| Reviewers required | Product, document intelligence, security/privacy, audit, testing |
| Supersedes | None |

## Context

`DEC-004` requires canonical facts to remain independent from document occurrences and to preserve history/provenance. `REQ-P1-FCT-002` requires valid/effective time and platform transaction time. Monitoring adds immutable source observations, parsed candidates, publication, applicability, and source-health states. A single mutable “current value” cannot answer:

- what applied on a real-world date;
- what the platform believed at an earlier recorded date;
- when a backdated correction became known;
- which conflicting evidence remained unresolved;
- which rule version was published and applicable; or
- which evidence/configuration supported a historical recommendation.

The decision must remain storage-product neutral and compatible with controlled deletion.

## Decision drivers and traceability

- Approved decisions: `DEC-004`, `DEC-006`–`DEC-009`, `DEC-020`.
- Requirements: `REQ-P1-FCT-001`–`004`, `REQ-P1-MON-002`–`006`, `REQ-P1-ACT-001`–`006`, `REQ-P1-CFG-002`–`004`.
- Architecture/domain: `ARCH-P1-025`–`029`, `033`–`038`; `DOM-P1-026`–`033`, `040`–`044`, `055`.
- Logical data: `DATA-P1-011`–`020`, fact/rule entities in [`ARCH-DATA-001`](../03-logical-data-model.md).
- Security/audit: `AUD-P1-012`, `015`–`017`, `027`–`029`; `THR-P1-008`–`010`, `017`, `030`.

## Proposed decision

Adopt an append-only bitemporal logical model for canonical facts and consequential rules.

### 1. Separate identities, observations, and decisions

For facts, preserve distinct:

1. `CanonicalFact` identity, independent of value/evidence;
2. immutable `FactOccurrence` assertions from documents, manual entry, connector, event, or source;
3. append-only `FactResolution` decisions accepting, correcting, disputing, tolerating, or superseding; and
4. rebuildable `FactValueSegment` views for efficient valid-at/known-at queries.

For rules, preserve distinct:

1. `SourceDefinitionVersion` and immutable `SourceObservation`;
2. immutable `RuleOccurrence` or parser/manual candidate;
3. versioned `RuleDefinitionVersion`;
4. append-only `RulePublication` decision; and
5. workspace-specific `RuleApplicability` assessment.

Source health is mutable operational state and never overwrites an observation/publication.

### 2. Preserve two time axes

- Valid/effective time answers when the represented value/rule applies.
- Transaction time answers when the platform durably knew or accepted it.
- Logical intervals use half-open `[from, to)` semantics.
- Open-ended validity uses an absent end under policy, not an infinite-retention promise.
- Earlier records remain unchanged; a later superseding record determines the earlier record’s logical transaction-time closure.
- Missing, uncertain, source-local, and backdated times remain explicit rather than receiving fabricated precision.

### 3. Make historical queries first-class

Every consequential fact/rule query must support or explicitly constrain:

- `valid_at` or valid interval;
- `known_at` transaction instant;
- exact workspace/reference scope;
- definition/configuration version;
- current authorization and requested disclosure; and
- conflict, restriction, stale-source, and insufficient-evidence outcomes.

“Current” means valid now under the current authorized policy and latest recorded knowledge; it is a named query mode, not a mutable record that destroys history.

### 4. Keep conflict and correction additive

Overlapping or contradictory occurrences/resolutions are retained. Policy may select an active conformed value only through an explicit resolution/publication. Backdated correction changes the conformed answer for later `known_at` queries while preserving what earlier users/systems saw.

### 5. Bind consequences to exact temporal inputs

Impact assessments, recommendations, approvals, actions, exports, and audit records retain exact fact/rule resolution/publication, evidence, configuration, valid-time, and transaction-time references or immutable digests. A later correction does not rewrite the historical decision; it may create a new change/impact case.

### 6. Treat conformed temporal views as rebuildable

Materialized current/history segments, search fields, graph rule edges, and analytics are derived from retained occurrences/resolutions/publications and versioned transforms. They carry lineage and watermarks and can be rebuilt without becoming truth.

### 7. Preserve governed deletion

“Append-only while retained” is not permanent retention. An approved deletion case may purge evidence/history according to policy. Remaining audit/tombstone views use safe non-content references and truthfully report unavailable evidence. `DEC-039` must define timing/minimization before final promises.

## Explicit non-decisions

This ADR does not select:

- a temporal, relational, document, graph, event, or ledger database;
- event sourcing for aggregates;
- physical columns, range types, indexes, triggers, partitions, or query language;
- clock/time synchronization products;
- fact/rule definition contents, launch document/source pack, or resolution UI;
- retention durations or residency placement; or
- a legal interpretation of effective time.

## Alternatives considered

| Alternative | Benefit | Why not proposed |
|---|---|---|
| Mutable current value plus change log | Simple common reads | Change log may not reconstruct valid-at/known-at truth, conflicts, or exact historical decisions; encourages destructive correction. |
| Valid-time only | Represents real-world applicability | Cannot answer when the platform learned/corrected the value or reproduce an earlier decision. |
| Transaction-time only | Strong audit chronology | Cannot express backdating, future effect, overlap, or real-world applicability. |
| Store occurrences only and infer current value ad hoc | Maximum raw evidence preservation | Produces inconsistent resolution semantics and makes consequential output irreproducible. |
| Event-source every aggregate | Uniform append-only mechanism | Materially expands architecture/operations/migration scope; not required to satisfy logical bitemporality. |
| Depend directly on one product’s temporal feature | Potentially efficient | Violates provider neutrality and may not cover occurrence/resolution/provenance/deletion semantics. |

## Consequences

### Positive

- Past valid-at/known-at answers and decisions are reproducible.
- Corrections and conflicts do not destroy evidence or prior belief.
- Rules, source observations, applicability, and health remain honest and separately inspectable.
- Impact and audit can bind to exact temporal inputs.
- Physical persistence remains replaceable behind a logical contract.

### Costs and risks

- Queries, fixtures, migrations, and user explanations are more complex than a current-value column.
- Temporal overlap, interval splitting, timezone uncertainty, and conflicting resolutions require rigorous validation.
- Historical indexes/projections may be larger and require generation/rebuild controls.
- Deletion can make historical evidence unavailable; UI/audit must communicate this without retaining a hidden copy.
- Incorrect clocks or ambiguous source dates can create false precision unless explicitly modelled.

## Validation before acceptance

Acceptance requires provider-neutral fixtures proving:

1. current, valid-at, known-at, and valid-at-plus-known-at queries;
2. backdated correction without rewriting earlier knowledge;
3. conflicting, disputed, tolerated, and unresolved occurrences;
4. future-effective and retroactively corrected rule publications;
5. source observation parsed under two parser versions while health changes independently;
6. authorization/redaction of a fact value, occurrence, rule, evidence anchor, and historical query;
7. impact/approval reconstruction to exact temporal inputs;
8. duplicate/out-of-order resolution/publication handling;
9. deterministic projection rebuild and migration from a prior schema; and
10. deletion/tombstone behavior without content leakage or resurrection.

## Open-decision fences

- `DEC-035`: no launch fact schema, document type, rule profile, or governed source is selected here.
- `DEC-039`: no retention, purge, backup-expiry, or audit-minimization duration is selected.
- `DEC-040`: no physical region/processor route for fact/rule evidence or derivatives is selected.

## Revisit and supersession triggers

Revisit if temporal query evidence cannot meet approved latency/cost targets; a selected persistence approach cannot reproduce both axes; legal/domain review changes time semantics; deletion requirements make retained history unsafe; Phase 2 introduces records/hold constraints; or migration/testing finds ambiguity in interval, conflict, or supersession rules.

Until explicitly accepted, implementations may not rely on this ADR as authorization to select a temporal product or physical schema.
