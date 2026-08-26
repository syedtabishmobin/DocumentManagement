# ADR-ARCH-004 — Durable Commands, Events, and Eventual Consistency

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-004` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 26 August 2026 |
| Decision scope | Synchronous command boundaries, durable publication, asynchronous workflows, idempotency, and external effects |
| Decision owners | Architecture and domain owners |
| Reviewers required | Product, security/audit, API/events, operations, testing |
| Supersedes | None |

## Context

Ingestion, processing, indexing, monitoring, impact, notifications, export, deletion, and external actions are long-running and cross multiple aggregate, processor, and provider boundaries. A synchronous request cannot safely hold a distributed transaction across them. Best-effort event publication can lose a required trigger; naive retry can duplicate versions, notifications, actions, exports, or purge effects. The user must see truthful pending, failed, partial, stale, and reconciled states.

## Decision drivers and traceability

- Approved decisions: `DEC-001`, `DEC-004`–`DEC-009`, `DEC-022`.
- Requirements: `REQ-P1-ING-002`–`004`, `008`–`009`, `REQ-P1-MON-001`, `004`–`007`, `REQ-P1-ACT-001`, `005`–`008`, `REQ-P1-NTF-001`–`004`, `REQ-P1-TRUST-004`, `006`–`007`, `REQ-P1-CFG-004`.
- Architecture/domain: `ARCH-P1-019`–`024`, `039`–`042`; `DOM-P1-008`–`011`, `040`, `043`–`055`.
- Logical data: `DATA-P1-007`–`010`, `032`–`040`, `042`–`050`.
- Security/audit/threat: `SEC-P1-018`, `024`, `027`, `029`; `AUD-P1-001`–`008`, `018`–`023`; `THR-P1-007`, `009`–`011`, `018`, `022`–`023`, `026`–`027`.
- NFR: `NFR-P1-003`–`006`, `008`, `013`–`018`, `026`–`031`, `041`–`043`.

## Proposed decision

Use synchronous local-authority commands with durable event/audit publication, explicit asynchronous workflow state machines, idempotent consumers, and eventual cross-aggregate convergence.

### 1. Bound synchronous commands

A synchronous command must:

1. authenticate and establish one workspace/capability context;
2. evaluate current authorization, policy, deletion/quarantine/security state, and required approval;
3. validate schema, invariant, expected aggregate revision, and idempotency key;
4. durably record either the complete local aggregate transition or an explicit accepted workflow; and
5. durably couple required event/audit publication before returning success.

A response never promises downstream completion merely because work was enqueued.

### 2. Couple transition and publication

The aggregate transition, required domain-event intent, and required audit evidence use a transactional outbox or provider-neutral equivalent. The mechanism must make missing, duplicate, delayed, and failed publication detectable and repairable. It does not require one physical transaction across unrelated aggregates or external providers.

### 3. Standardize command/event identity

Commands/events carry stable IDs, workspace, aggregate ID/revision, schema version, occurred/recorded time, actor/workload and purpose refs, policy/config references, causation, correlation, idempotency/dedup identity, privacy class, and safe trace context. Payloads contain minimum required data and stable refs; they are not hidden content archives or authorization grants.

### 4. Make consumers idempotent and order-aware

Consumers:

- deduplicate by scoped stable identity;
- validate aggregate/source revision and monotonic transition rules;
- tolerate duplicate, delayed, and out-of-order delivery;
- reject/reconcile workspace/generation mismatch and deletion-fenced targets;
- reauthorize at execution/output/effect time;
- bound retries/backoff and route poison/unknown events to visible quarantine/repair; and
- record attempt and final/reconciliation evidence separately.

### 5. Represent long-running work explicitly

Each workflow has an owning durable state machine with named pending, running, review, retry, blocked, failed, cancelled, partial, unknown, repair, and terminal states as applicable. State owners do not infer another aggregate/provider’s completion. Clients receive workflow ID, state/revision, progress/coverage safe for disclosure, next action, retry/cancellation contract, and truthful degraded status.

### 6. Use eventual consistency across aggregate boundaries

One aggregate commits its invariant locally and publishes a fact about the transition. Other aggregates/projections converge through commands/events. A saga/process-manager style coordinator may own cross-aggregate progress, compensation, and reconciliation, but no business aggregate directly writes another aggregate’s state.

### 7. Treat external effects as at-least-attempted and reconciled

An external action command binds exact effect digest, target, approval, current policy, idempotency/reconciliation identity, timeout, retry budget, and compensation/forward-repair capability. “Accepted” or timeout is not real-world success. Unknown/partial outcomes are reconciled before retry or closure, and fulfilment evidence verifies completion.

### 8. Preserve deletion and restore safety

Deletion fence/generation checks precede consumer work. Late events become discarded/reconciled outcomes and cannot recreate IDs. Restore replays current fences, policies, schemas, configuration, and audit continuity before event processing resumes.

## Explicit non-decisions

This ADR does not select:

- queue, log, broker, stream, workflow, scheduler, outbox, database, or change-data-capture products;
- event sourcing, microservices, modular monolith, process count, or deployment topology;
- delivery protocol, serialization format, partition count/key, lease algorithm, or ordering technology;
- fixed retry/backoff/dead-letter durations or throughput limits;
- connector/action providers; or
- a distributed transaction mechanism.

## Alternatives considered

| Alternative | Benefit | Why not proposed |
|---|---|---|
| Synchronous end-to-end calls | Simple mental model | Long latency/cascading failure; cannot survive interruption; encourages false completion. |
| Best-effort event after commit | Low implementation effort | Can silently lose required processing/audit trigger. |
| Publish before committing state | Early notification | Consumer may observe an event for state that never committed. |
| Distributed transaction across all components/providers | Strong atomicity appearance | External systems generally cannot participate; tight coupling, availability and portability costs. |
| Assume exactly-once delivery | Simplifies consumers | Delivery/retry/failover reality still duplicates effects; external actions need reconciliation. |
| At-most-once delivery | Avoids duplicates | Lost work becomes unrecoverable and unsafe for processing/deletion/audit. |
| Event-source every aggregate | Uniform replay/history | Broad architectural commitment not required by approved contracts; increases migration/operations scope. |
| Shared database writes between components | Immediate consistency | Breaks aggregate ownership, bypasses invariants/audit, and makes separation/evolution unsafe. |

## Consequences

### Positive

- Accepted work cannot silently lose required downstream triggers.
- Retry, replay, duplicate, out-of-order, and dependency failure become testable contracts.
- Users see truthful progress and partial/unknown outcomes.
- Aggregate ownership and provider neutrality are preserved.
- External actions and deletion can reconcile without claiming impossible exactly-once effects.

### Costs and risks

- Outbox/publication, idempotency, workflow, dead-letter/quarantine, replay, and repair tooling add complexity.
- Cross-aggregate views are eventually consistent and need freshness/degraded UX.
- Event contracts require compatibility governance and privacy classification.
- Idempotency retention and ordering boundaries must be defined per operation.
- Reconciliation may require operator workflows while protecting content.

## Validation before acceptance

Acceptance requires tests proving:

1. crash before/after aggregate commit and publication cannot lose or invent a transition;
2. duplicate, delayed, reordered, partitioned, and poison events preserve invariants;
3. stale expected revision and idempotency-key collision are safe across actors/workspaces;
4. revoke/delete between enqueue and execution fails closed;
5. every long-running workflow exposes truthful progress, retry, failure, cancellation, partial, and repair states;
6. event schema evolution supports old/new producers/consumers and unknown versions fail safely;
7. notification/action/export/delete duplicate delivery does not duplicate real effects;
8. timeout/unknown external effect reconciles before retry/closure;
9. audit outage blocks or leaves consequential work incomplete and later reconciles;
10. replay after parser/config repair is deterministic and deduplicated;
11. late event and restored backup cannot resurrect deletion-fenced data; and
12. load/chaos evidence meets applicable NFRs without content-bearing observability.

## Open-decision fences

- `DEC-031`: connector command/event kinds remain disabled until selected and contracted.
- `DEC-032`: no continuity trigger event can release content.
- `DEC-036`: suspected-clinical workflow remains isolated/policy-pending; no final disposition event is selected.
- `DEC-037`: notification events remain channel-neutral and do not promise external delivery.
- `DEC-039`: deletion state/acknowledgement exists without invented durations.
- `DEC-040`: event/worker/adapter placement must follow an approved route; no cross-border fallback.

## Revisit and supersession triggers

Revisit if approved consistency/latency/RPO requirements cannot be met; event volume/cost makes the model impractical; a selected workflow/transaction mechanism offers stronger portable guarantees; an incident exposes idempotency/reconciliation gaps; or Phase 2 requires new cross-aggregate atomic boundaries.

Until explicitly accepted, this ADR does not authorize an event platform, outbox implementation, workflow engine, or service topology.
