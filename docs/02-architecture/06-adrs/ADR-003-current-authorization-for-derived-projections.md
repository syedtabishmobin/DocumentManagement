# ADR-ARCH-003 — Current Authorization for Derived Projections

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-003` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 26 August 2026 |
| Decision scope | Authorization of search, vector, graph, cache, conversation, notification, export, and other derived reads/effects |
| Decision owners | Architecture and security/authorization owners |
| Reviewers required | Product/privacy, data/search/AI, API, operations, testing |
| Supersedes | None |

## Context

`DEC-003` separates identity, membership, workspace, and resource. `DEC-008` requires retrieval, graph traversal, and AI answers to enforce current permissions. Derived stores may lag authoritative grants, membership, field/edge policy, quarantine, deletion, consent, approval, and configuration changes. Copying an ACL into an index at build time cannot safely authorize a later result, yet resolving every broad query solely from canonical storage may prevent useful search and graph behavior.

The design must prevent content and existence leakage through candidates, counts, facets, timing, paths, citations, conversations, notifications, exports, audit, and inference while remaining provider neutral.

## Decision drivers and traceability

- Approved decisions: `DEC-003`, `DEC-006`, `DEC-008`–`DEC-009`, `DEC-022`–`DEC-023`.
- Requirements: `REQ-P1-WS-004`–`006`, `REQ-P1-FCT-006`, `REQ-P1-GPH-002`, `004`, `REQ-P1-SRCH-003`–`004`, `REQ-P1-SHR-001`–`005`, `REQ-P1-TRUST-002`–`004`.
- Architecture/domain: `ARCH-P1-006`–`012`, `024`, `027`–`032`, `037`; `DOM-P1-014`–`018`, `036`–`037`, `049`–`052`.
- Workspace/data: `WSP-P1-021`–`032`, `DATA-P1-025`–`030`, `041`–`045`.
- Authorization/security: `AUTH-P1-001`–`025`, `030`, `034`–`035`; `SEC-P1-019`; `THR-P1-003`–`007`, `014`, `019`, `022`–`024`.
- NFR: `NFR-P1-002`, `016`–`018`, `033`, `041`–`043`.

## Proposed decision

Use a two-stage authorization strategy: projection-time candidate minimization plus mandatory current authoritative authorization before any protected output or effect.

### 1. Carry safe authorization attributes into projections

Every protected projection record carries or resolves:

- `WorkspaceId` and canonical source resource/version;
- resource/field/edge sensitivity and disclosure class;
- purpose/capability class where relevant;
- policy/configuration and authorization epoch used during build;
- deletion target generation/fence watermark;
- projection generation, source revision/event, transform version, build time, and freshness; and
- only the minimum grant/subject/role attributes safe and necessary for candidate filtering.

These attributes reduce candidate exposure and work. They are not an independent `ALLOW`.

### 2. Authorize every stage that can leak

Current policy applies to:

- query eligibility and start resource;
- candidate retrieval before content leaves the store;
- field/edge/path expansion and graph traversal;
- facets, counts, snippets, ranking/reranking, comparisons, and scores;
- model context, tools, structured claims, answer, and citation;
- conversation/cache reuse and follow-up;
- task/notification rendering and recipient/channel;
- export enumeration, package release/redemption, and audit view; and
- queued worker/external action execution.

Where a projection cannot safely enforce field/edge policy, it returns opaque candidate IDs to an enforcing canonical owner or suppresses the result.

### 3. Use current epochs and explicit invalidation

Membership, role, relationship authority, grant, consent, session risk, approval, policy/configuration, quarantine, security suspension, and deletion changes publish a versioned invalidation/epoch. Consumers record watermarks and invalidate/bypass affected caches, conversations, signed grants, jobs, notifications, exports, and projections.

Epoch convergence follows `NFR-P1-016` and deletion fences follow `NFR-P1-017`. Convergence time is an operational objective, not permission to expose stale data.

### 4. Synchronously reauthorize high-impact and redemption paths

Artifact/citation redemption, high-impact action, export release, destructive operation, and external effect always consult current authoritative policy/fences. Search/graph/AI output also reauthorizes; when bulk candidate checks are required, the authorization interface supports bounded batch decisions without weakening per-item semantics.

### 5. Fail closed with privacy-safe behavior

If current policy, required attributes, projection freshness, deletion generation, or epoch cannot be established, the operation:

1. uses a safe canonical fallback for a bounded query; or
2. returns explicit partial/stale/unavailable under a disclosure-safe response.

It never uses a cached broad allow. Empty/error/timing behavior cannot confirm a restricted resource exists. `MINIMAL_DISCLOSURE` is available only under a named versioned policy.

### 6. Partition caches and conversations by authorization equivalence

Cache/conversation keys include workspace, actor/grant or safe policy-equivalent scope, purpose, resource/field revision, policy epoch, source revision, and deletion generation. Shared cache entries cannot cross authorization-equivalence classes. Revocation/deletion makes old keys unusable even before eviction completes.

## Explicit non-decisions

This ADR does not select:

- identity or policy-engine products, policy language, token claims, or directory model;
- search, vector, graph, cache, database, queue, or AI products;
- physical filter/query syntax, cache topology, or epoch transport;
- role/permission/reference-data contents;
- customer-visible revocation SLA beyond provisional NFRs; or
- recovery, support, continuity, residency, or cross-border exceptions.

## Alternatives considered

| Alternative | Benefit | Why not proposed |
|---|---|---|
| Index-time embedded ACL only | Fast single-stage queries | Stale grants/deletion expose data; cannot handle current purpose, approval, field/edge, or inference policy safely. |
| Canonical-store authorization only after broad projection result | Simple policy truth | Projection may already leak counts/timing/candidates to service/model and broad retrieval is costly/unsafe. |
| No authorization attributes in projections | Fewer duplicated attributes | Forces excessive canonical reads and increases likelihood protected candidates enter model/ranker context. |
| Duplicate complete policy engine in each store | Local performance | Policy drift, inconsistent semantics, hard revocation proof, and vendor coupling. |
| Precompute one materialized view per user | Fast user reads | Explosive fan-out, complex grant union/revocation, stale views, and identity-centric rather than resource/purpose policy. |
| Allow cached authorization during outages | Higher apparent availability | Violates current authorization; uncertainty would expose sensitive household data. |

## Consequences

### Positive

- Revocation/deletion remain effective across direct and derived surfaces.
- Search/graph/AI can use projections without making them policy truth.
- Field/edge/purpose and minimal-disclosure rules stay consistent.
- Provider-specific query features remain optional behind conformance tests.
- Epoch/fence telemetry provides objective propagation evidence.

### Costs and risks

- Two-stage decisions add latency, policy-service availability dependency, and implementation complexity.
- Batch policy interfaces, response normalization, and negative testing are required.
- Projection schemas must carry authorization/deletion lineage and evolve with policy.
- Fail-closed behavior may reduce availability; `NFR-P1-002` requires high authorization availability.
- Inference/timing risk cannot be solved by filters alone and needs ongoing privacy testing.

## Validation before acceptance

Acceptance requires:

1. cross-workspace and private-family-resource tests across every direct/derived surface;
2. field/edge/count/facet/snippet/path/timing/error/inference negative tests;
3. revocation between query/candidate/rerank/model/output/citation and between enqueue/execution;
4. stale/missed epoch, partition, authorization outage, and projection-lag tests that fail closed;
5. deletion-fence, late-event, rebuild, cache, conversation, export, and restore tests;
6. guest/adviser scope, purpose, expiry, onward-delegation, and non-enumeration tests;
7. minimal-disclosure policy fixtures proving both allowed signal and forbidden inference;
8. performance/load evidence meeting `NFR-P1-002`, `009`, `015`–`018`; and
9. continuous telemetry/audit canaries proving no protected values enter decision logs.

## Open-decision fences

- `DEC-032`: no authorization rule may enable automated continuity release.
- `DEC-038`: no recovery/support shortcut may mint an owner/member/private-resource allow.
- `DEC-039`: deletion timing is unset, but the fence denies immediately after activation.
- `DEC-040`: resource access does not authorize an ineligible processor/region; residency is an independent input.

## Revisit and supersession triggers

Revisit if approved latency/availability targets cannot be met; policy semantics become safely expressible in a selected store without drift; an incident reveals an inference class not covered by two-stage checks; Phase 2 information barriers add new equivalence constraints; or new privacy-preserving query mechanisms materially change the trade-off.

Until explicitly accepted, this ADR does not authorize a policy engine, index ACL schema, or stale-allow duration.
