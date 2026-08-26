# Phase 1 API Standards

| Field | Value |
|---|---|
| Document ID | `API-STD-001` |
| Version | `0.1` |
| Status | **DRAFT — product-owner, architecture, security, privacy, and API approval required** |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 26 August 2026 |
| Machine-readable companion | [`API-OAS-001`](02-openapi.json) |
| Event companion | [`API-EVT-001`](03-event-catalogue.md) |
| Connector companion | [`API-CON-001`](04-connector-contracts.md) |

## 1. Purpose, authority, and boundary

This document defines the provider-neutral HTTP API contract for Phase 1. It owns URI and compatibility rules, request context, representations, errors, pagination/filtering, concurrency, idempotency, asynchronous job semantics, quotas, artifact access, privacy-safe diagnostics, and decision fences. Stable draft rules use `API-P1-*` IDs. Stable HTTP operation IDs in [`02-openapi.json`](02-openapi.json) use the same namespace from `API-P1-101` onward; rule and operation ranges are intentionally disjoint.

The source-of-truth hierarchy in [`CODEX.md`](../../CODEX.md) applies. Approved decisions constrain this draft. The [Phase 1 PRD](../01-product/02-phase-1-prd.md), [`ARCH-SOL-001`](../02-architecture/01-solution-architecture.md), [`ARCH-DOM-001`](../02-architecture/02-domain-model.md), [`ARCH-DATA-001`](../02-architecture/03-logical-data-model.md), [`ARCH-WSP-001`](../02-architecture/04-workspace-family-membership-model.md), [`ARCH-NFR-001`](../02-architecture/05-non-functional-requirements.md), document-intelligence contracts, AI contracts, and the security pack are draft inputs.

This pack does not approve the draft PRD, accept an ADR, open the implementation gate, select an API gateway, identity system, framework, database, event transport, artifact store, connector, processor, notification channel, or cloud provider, or define a customer SLA. Paths name logical resources and workflows, not service/process boundaries.

The OpenAPI document is the normative wire-shape candidate where it is more specific than this prose. It remains `DRAFT`; conditional operations are contract reservations, not enabled product capabilities. Domain invariants, authorization, privacy, evidence, approval, deletion, and audit rules cannot be weakened by an API example.

## 2. API styles and scope

Phase 1 uses:

- authenticated workspace-scoped HTTP commands and queries under `/api/v1/workspaces/{workspaceId}`;
- a small platform-scoped workspace-creation command that establishes a new tenant boundary;
- explicit durable `Job`, `IngestionCase`, `ExportCase`, and `DeletionCase` resources for long-running work;
- short-lived artifact-access grants followed by reauthorized redemption, never permanent public object URLs;
- versioned asynchronous domain events defined by [`API-EVT-001`](03-event-catalogue.md); and
- provider-neutral adapters defined by [`API-CON-001`](04-connector-contracts.md).

The API does not expose a generic aggregate mutation endpoint, arbitrary query language, arbitrary URL fetch, provider-native payload, raw event bus, direct projection write, unrestricted graph traversal, or model tool surface. A resource returned by the API remains protected at resource, version, field, edge, evidence, purpose, and action levels.

## 3. Stable draft API rules

### 3.1 Contract identity, URI versioning, and compatibility

| Rule ID | Draft API rule |
|---|---|
| `API-P1-001` | The machine-readable OpenAPI 3.1 document MUST define every enabled Phase 1 HTTP operation, request/response schema, security requirement, stable operation ID, decision fence, and representative synthetic example. Prose MUST NOT silently add a second incompatible wire contract. |
| `API-P1-002` | The canonical Phase 1 base is `/api/v1`. `v1` is the public compatibility major, not a deployment or document-schema version. An incompatible resource or behavior change requires a new major path or an explicitly negotiated version; it cannot reuse an existing operation ID with changed meaning. |
| `API-P1-003` | Additive changes within a major MAY add optional response fields, enum values only where consumers are required to tolerate them, endpoints, or problem codes. Required request fields, meanings, authorization scope, state transitions, and existing enum semantics MUST NOT change incompatibly. |
| `API-P1-004` | Every operation MUST have one immutable `API-P1-*` operation ID. Renaming a path or summary does not recycle the ID; replacement retains traceability and marks the former operation retired rather than reassigning it. |
| `API-P1-005` | Request and response schemas MUST declare compatible contract versions where domain interpretation depends on schema, taxonomy, policy, evidence-anchor, workflow, or configuration version. “Latest” MUST NOT be stored as historical basis. |
| `API-P1-006` | Provider, framework, database, transport, region, and deployment details MUST remain outside canonical resource identity and semantics. Provider-native fields MAY appear only inside an adapter-owned protected extension explicitly mapped by `API-CON-001`. |

### 3.2 Authentication, workspace context, authorization, and purpose

| Rule ID | Draft API rule |
|---|---|
| `API-P1-007` | Every protected request MUST authenticate a human or workload principal and carry an explicit purpose. Authentication establishes principal/assurance only; it does not establish workspace, subject, membership, ownership, or permission. |
| `API-P1-008` | Every household operation except platform-scoped workspace creation MUST name exactly one `{workspaceId}` and matching `X-Workspace-Id`. Missing or mismatched context is denied before protected resource lookup. Client context is validated, never trusted as tenancy truth. |
| `API-P1-009` | Approved global-reference or platform-control operations, if later added, MUST use an explicit non-household scope and MUST NOT accept or return a household identifier or personalized result. A global route cannot be used as a workspace lookup shortcut. |
| `API-P1-010` | Current authorization MUST be enforced before lookup and again before delayed output, artifact redemption, citation resolution, job result, notification, export release, connector effect, or destructive transition. Index-time labels and enqueue-time authorization are filtering hints only. |
| `API-P1-011` | Authorization MUST independently cover the requested operation, resource/version, field/value, evidence anchor, dependency edge/path, purpose, consequence class, grant/authority basis, consent, residency route, and bound approval where applicable. Membership or owner/admin labels are insufficient. |
| `API-P1-012` | Actor, membership, grant, approval, and workload identity MUST be resolved from trusted session/service context and authoritative records. A request body, query, document, connector payload, model output, or event MUST NOT supply its own authority. |
| `API-P1-013` | Step-up, consent, review, or approval obligations returned by policy MUST be satisfied through their owning workflows. An API success, acknowledgement, notification, or previous similar approval cannot substitute for an exact current binding. |
| `API-P1-014` | Denial, empty, count, timing, validation, and not-found behavior MUST use an approved disclosure class. Where existence is protected, inaccessible and absent resources produce indistinguishable caller-safe behavior while protected diagnostics remain separately authorized and audited. |

### 3.3 Media types, IDs, values, and time

| Rule ID | Draft API rule |
|---|---|
| `API-P1-015` | Canonical structured bodies use `application/json`; errors use `application/problem+json`. Artifact bytes use a separate scoped transfer/redemption contract and MUST NOT be embedded as base64 in ordinary JSON resources. |
| `API-P1-016` | Canonical IDs are opaque strings, immutable, non-recycled, non-PII, and not derived from filenames, hashes, display names, provider IDs, type labels, or physical locations. Clients MUST treat them as case-sensitive opaque values. |
| `API-P1-017` | A workspace resource reference at a trust boundary includes both `workspace_id` and resource ID. External identifiers are namespaced by `integration_id` or governed-source namespace and never replace platform identity or prove logical equality. |
| `API-P1-018` | UTC instants use RFC 3339 `date-time` representations with an explicit offset. `local_date`, `year_month`, source timezone/calendar context, and valid/effective intervals remain distinct; the API MUST NOT fabricate a time, offset, day, or precision. |
| `API-P1-019` | Consequential time-bearing responses distinguish occurrence, observation, valid/effective, recorded/transaction, review, expiry, and supersession times. Intervals use `[from,to)` semantics and an absent end means open-ended under policy, not permanent retention. |
| `API-P1-020` | Decimal, money, percentage, identifier, presence, restriction, confidence, applicability, severity, urgency, evidence strength, source authority, source health, and coverage fields use their owning DIT/AI contract. `null`, absent, redacted, restricted, deleted, unreadable, and not applicable MUST NOT be collapsed. |

### 3.4 Errors, pagination, filtering, sorting, and disclosure

| Rule ID | Draft API rule |
|---|---|
| `API-P1-021` | Every non-success response uses the `Problem` schema with a stable safe `code`, HTTP status, caller-safe title/detail, `correlation_id`, retry classification, and optional field violations. Raw content, filenames, values, passages, provider payloads, secrets, tokens, URLs, prompts, queries, answers, or stack traces are prohibited. |
| `API-P1-022` | Malformed syntax returns `400`; unauthenticated requests return `401`; disclosed authorization failures return `403`; protected absence uses the configured privacy-safe `404`; state/idempotency conflicts use `409`; stale concurrency uses `412`; semantic validation uses `422`; quota uses `429`; safe dependency unavailability uses `503`. The disclosure policy may intentionally narrow detail. |
| `API-P1-023` | Validation violations identify only allow-listed field paths and safe reason codes. Protected supplied values and expected secret/content patterns MUST NOT be reflected. Unknown security- or consequence-relevant fields fail validation rather than being ignored. |
| `API-P1-024` | Collections use opaque cursor pagination with `page_size`, `page_after`, `next_page_after`, and `has_more`. Cursors bind workspace, actor/grant equivalence, purpose, filter/sort, policy epoch, and snapshot/generation as applicable and MUST NOT expose offsets, IDs, counts, or signatures. |
| `API-P1-025` | Filters and sorts are operation-specific allow-lists. Authorization is applied before snippets, facets, counts, aggregation, or page assembly; a total count is omitted unless the operation and disclosure policy expressly authorize it. |
| `API-P1-026` | Pagination order MUST be stable within the declared snapshot/generation. A stale, invalid, wrong-workspace, wrong-purpose, expired, or policy-ineligible cursor returns a safe problem and cannot fall back to an unscoped first page. |

### 3.5 Concurrency and idempotency

| Rule ID | Draft API rule |
|---|---|
| `API-P1-027` | Every mutable aggregate representation exposes a strong logical revision through `ETag` and/or a schema field. The token represents the owning aggregate revision, not a projection timestamp or byte hash unless that aggregate explicitly owns it. |
| `API-P1-028` | A command that changes an existing aggregate MUST require `If-Match` or an exact expected revision/digest defined by the owning workflow. Missing precondition is rejected; stale precondition returns `412` without overwriting later state. |
| `API-P1-029` | A material change to recommendation inputs, target/effect digest, policy/configuration, authority, approval, document version, or deletion state invalidates the prior command precondition and approval; the API routes a new review rather than force-applying it. |
| `API-P1-030` | Every state-changing `POST`, `PATCH`, or `DELETE` command MUST accept `Idempotency-Key`. The server scopes it to authenticated actor/grant or workload, workspace/platform scope, operation ID, and a configured retention window and binds it to a canonical request fingerprint. |
| `API-P1-031` | Repeating a key with the same fingerprint returns the prior logical result or current case reference without duplicating a workspace, document version, grant, notification, export, purge, or external effect. Reuse with a different fingerprint returns `409` without revealing another actor's request. |
| `API-P1-032` | Idempotency, event, action, and reconciliation identities are separate opaque values. A transport retry or provider acknowledgement does not prove exactly-once execution or owning-aggregate completion. |

### 3.6 Commands, queries, jobs, and asynchronous consistency

| Rule ID | Draft API rule |
|---|---|
| `API-P1-033` | A synchronous command success means the owning local transition, required privacy-safe audit, and outbox/equivalent obligation are durable. It does not claim that processing, projection, delivery, external effect, export, purge, backup expiry, or another aggregate is complete. |
| `API-P1-034` | Long-running work returns `202 Accepted` with a stable job/case resource and `Location`; the response declares the accepted command, current truthful state, correlation, and safe next action. No fixed polling or completion duration is invented by this contract. |
| `API-P1-035` | `Job` state distinguishes queued/running, blocked, review, retry, partial, failed, cancelled, deletion-blocked, and succeeded outcomes as applicable. Capability-specific aggregates such as `IngestionCase`, `ActionExecution`, `ExportCase`, and `DeletionCase` retain their exact owning state vocabularies. |
| `API-P1-036` | Cancellation, retry, replay, reconcile, verification, and repair are explicit authorized commands with their own idempotency and concurrency. They append attempt/history and cannot mutate immutable provider output or silently reactivate a superseded/deleted generation. |
| `API-P1-037` | Every request, response, command, job, event, adapter call, approval, action, projection, and audit record preserves privacy-safe `correlation_id`, `causation_id`, attempt, contract version, and relevant resource/case revisions. Caller-supplied correlation is validated and may be replaced. |
| `API-P1-038` | Cross-aggregate reads declare relevant freshness, projection generation, source/policy/deletion watermarks, truncation, and coverage. Stale or incomplete state uses an explicit partial/stale/unavailable result or approved canonical fallback; last-known success MUST NOT appear current. |

### 3.7 Quotas, artifacts, signing, and external effects

| Rule ID | Draft API rule |
|---|---|
| `API-P1-039` | Rate, size, page, fan-out, query, graph, AI/OCR, export, and workflow quotas are versioned policy, not hard-coded API promises. A response MAY expose only the caller's safe limit state and retry guidance; it MUST NOT reveal another workspace's load or provider capacity. |
| `API-P1-040` | Quota exhaustion returns `429` or an explicit asynchronous budget-blocked state without weakening malware, authorization, evidence, approval, residency, audit, or deletion controls. Retrying MUST NOT duplicate cost or effect. |
| `API-P1-041` | Artifact upload/download, preview, citation, and export delivery use two steps: authorize and issue a short-lived bounded access grant, then redeem it with current authorization, integrity, quarantine, deletion, audience, purpose, use, and policy checks. |
| `API-P1-042` | Access grants bind exact workspace, actor/audience, resource and version, operation, purpose, expiry/use constraints, policy/deletion generation, and integrity expectation. Permanent public URLs, canonical URLs containing bearer secrets, and ordinary-log token capture are prohibited. |
| `API-P1-043` | Upload finalization proves only that the scoped transfer is durably received and linked to its `AcquisitionAttempt`/`IngestionCase`. It does not prove safety, logical-document identity, extraction, field acceptance, fact truth, requirement fulfilment, or readiness. |
| `API-P1-044` | Consequential external effects use a provider-neutral action command with exact approval, input/effect digest, idempotency/reconciliation identity, target, consent/purpose/residency route, and expected outcome contract. Provider-native “accepted” is not closure. |
| `API-P1-045` | Timeout, ambiguity, or partial external success produces the exact `ActionExecution` unknown/partial/reconciliation state and attempt evidence. Automatic retry is permitted only when the adapter contract proves it cannot duplicate or broaden the effect. |
| `API-P1-046` | Signed package/artifact metadata, connector receipts, source observations, and provider acknowledgements are untrusted until signature/integrity, scope, schema, authorization, policy, and replay validation succeeds. Cryptographic evidence cannot supply missing product authority. |

### 3.8 Privacy, audit, deletion, residency, and decision fences

| Rule ID | Draft API rule |
|---|---|
| `API-P1-047` | Ordinary API logs, traces, metrics, analytics, problems, headers, and audit envelopes MUST exclude raw document bytes/text/images, filenames where sensitive, extracted values, evidence passages, queries/answers/prompts, connector payloads, unrestricted URLs, signed URLs, tokens, secrets, and key material. |
| `API-P1-048` | Security- and consequence-relevant commands, decisions, denials, attempts, partial results, redemptions, exports, deletion, and reconciliation MUST create `SEC-AUD-001`-conformant audit evidence. Required audit failure blocks the transition or leaves it explicitly incomplete. |
| `API-P1-049` | Every request and result that can process household data carries or resolves data classification, purpose, consent/basis, retention/deletion lineage, residency policy, processor route, and accountable owner. An unknown or ineligible route blocks processing. |
| `API-P1-050` | An authoritative deletion fence takes precedence over reads, writes, jobs, replay, rebuild, artifact access, connectors, exports, support, and restore. A late API response or callback MUST NOT resurrect serviceable data. |
| `API-P1-051` | An operation governed by `DEC-031`–`DEC-040` MUST declare `x-decision-fence`, `x-decision-state`, and `x-availability` in OpenAPI. An `OPEN` or otherwise unapproved conditional operation remains disabled or policy-pending; documenting it is not activation. |
| `API-P1-052` | This contract MUST NOT invent connector/channel enablement, recovery or continuity success, clinical disposition, readiness scoring, deletion/backup durations, residency routes/exceptions, quotas, or external processing consent. These remain explicit decision/configuration inputs and fail closed when absent. |

## 4. Required request context

| Context element | Wire representation | Contract |
|---|---|---|
| Authentication | `Authorization: Bearer …` or a future equivalent declared by the identity adapter | Token is never logged or accepted from query/body; actual mechanism remains undecided. |
| Workspace | `{workspaceId}` plus `X-Workspace-Id` | Both are opaque and must match authoritative resolution. Platform-scoped workspace creation is the only Phase 1 exception. |
| Purpose | `X-Purpose-Id` | Stable purpose such as `PUR-P1-001`; caller selection does not bypass policy/consent. |
| Correlation | `X-Correlation-Id` | Optional caller seed; service validates/normalizes and always returns a safe correlation ID. |
| Idempotency | `Idempotency-Key` | Required for commands; opaque, non-secret, fingerprint-bound and scope-bound. |
| Concurrency | `If-Match` | Required where an existing aggregate changes; value comes from the most recent authorized representation. |
| Representation | `Accept` / `Content-Type` | `application/json` or `application/problem+json`; bytes use scoped artifact transfer. |

Headers are transport context, not durable authority. A worker, event handler, or delayed job resolves equivalent trusted context from canonical references and reauthorizes.

## 5. Common response patterns

### 5.1 Resource response

An authorized mutable resource returns:

- opaque stable resource and workspace IDs;
- exact aggregate `revision` and `ETag`;
- owning lifecycle state and relevant contract/configuration versions;
- privacy-safe links only to actions the caller may attempt to authorize;
- freshness/coverage metadata for derived fields; and
- `X-Correlation-Id`.

The presence of a link is not proof that a future request will be allowed; current policy is re-evaluated.

### 5.2 Accepted workflow response

`202 Accepted` returns a `Job` or owning case with:

```json
{
  "job_id": "job-synthetic-001",
  "workspace_id": "workspace-synthetic-001",
  "job_kind": "DOCUMENT_COMPARISON",
  "state": "QUEUED",
  "accepted_operation_id": "API-P1-131",
  "correlation_id": "correlation-synthetic-001",
  "created_at": "2026-08-26T00:00:00Z",
  "result_ref": null,
  "failure": null
}
```

This synthetic example defines shape only. It does not promise a start/completion time or activate a provider.

### 5.3 Problem response

```json
{
  "type": "urn:document-management:problem:precondition-failed",
  "title": "The resource changed",
  "status": 412,
  "code": "PRECONDITION_FAILED",
  "correlation_id": "correlation-synthetic-001",
  "retry_class": "REFRESH_REQUIRED",
  "detail": "Refresh the authorized resource and review the change before retrying."
}
```

The example intentionally contains no resource title, prior value, current value, protected existence, or diagnostic stack.

## 6. Pagination and query semantics

Collection queries use only the filters declared by the OpenAPI operation. Common candidates are `page_size`, `page_after`, `sort`, `state`, `subject_id`, `document_type_id`, `valid_at`, and `known_at`, but an operation does not support one merely because another does.

A collection envelope contains:

```json
{
  "items": [],
  "page": {
    "next_page_after": null,
    "has_more": false,
    "snapshot_ref": "snapshot-synthetic-001"
  },
  "coverage": {
    "state": "COMPLETE_AUTHORIZED_VIEW",
    "projection_generation": "generation-synthetic-001",
    "source_watermark": "event-synthetic-001",
    "policy_epoch": "epoch-synthetic-001",
    "deletion_fence_watermark": "fence-synthetic-001"
  }
}
```

`COMPLETE_AUTHORIZED_VIEW` means complete only for the authorized, declared filters/snapshot and known projection coverage. It does not imply that hidden resources do not exist or that external monitoring is complete.

## 7. Conditional operation register

| Decision | Reserved API surface | Required behavior now |
|---|---|---|
| `DEC-031` | Integration creation, sync, disconnect, private inbound-email/cloud ingestion | Operations are present for compatibility design and marked `DISABLED_UNTIL_APPROVED`; no connector kind/provider is enabled. |
| `DEC-032` | Automated continuity-release creation/execution | Reserved operation always denies/policy-blocks; ordinary grants and curated exports stay separate. |
| `DEC-033` | Complete export envelope | Export accepts an envelope version but cannot claim category completeness beyond the approved profile. |
| `DEC-034` | Aggregate readiness projection | Reserved read remains unavailable; individual authorized findings remain separate. |
| `DEC-035` | Launch document/source profiles | APIs expose exact active configuration versions; no example claims that a type or source is launch-enabled. |
| `DEC-036` | Suspected-clinical disposition | Reserved decision command cannot choose reject/retain/recover until approved; `POLICY_HOLD` remains the safe state. |
| `DEC-037` | External email/push notification channels | Channel registration/delivery adapters remain disabled; documenting a neutral request does not enable a channel. |
| `DEC-038` | Account/workspace recovery and owner transfer | Reserved request cannot produce a successful recovery/transfer event or state. |
| `DEC-039` | Deletion cancellation windows, active purge, backup expiry, audit minimization | APIs expose state/residuals without durations or premature completion; cancellation is conditional on approved policy. |
| `DEC-040` | Australian residency data classes, processors, routes, exceptions | Any unknown/ineligible processor or route blocks; connector/channel/AI routes remain disabled until the matrix proves eligibility. |

## 8. OpenAPI authoring requirements

Each operation in [`02-openapi.json`](02-openapi.json) declares:

- stable `operationId`, domain tag, scope, command/query classification, and linked requirements/rules;
- explicit `x-decision-fence` metadata for conditional behavior;
- inherited or explicit authentication;
- workspace path/header and purpose context for household operations;
- `Idempotency-Key` for commands and `If-Match` for existing-aggregate mutation;
- request and response schemas plus synthetic examples for commands;
- caller-safe problem responses;
- `202` plus job/case location for asynchronous acceptance; and
- no provider-specific schema or executable conditional default.

Generated clients, server stubs, UI types, and tests are downstream derivatives. Generation never changes the source-of-truth hierarchy or turns this draft into an approved baseline.

## 9. Traceability

| API rule family | Primary source alignment |
|---|---|
| `API-P1-001`–`006` | `ARCH-P1-001`–`005`, `043`–`045`; `DATA-P1-046`–`050`; `REQ-P1-CFG-001`–`005` |
| `API-P1-007`–`014` | `ARCH-P1-003`, `006`–`012`, `024`; `WSP-P1-001`–`032`; `AUTH-P1-001`–`035`; `AC-P1-SEC-001` |
| `API-P1-015`–`020` | `DOM-P1-004`–`005`, `023`, `029`; `DATA-P1-004`–`006`, `011`–`020`; `DIT-EXT-001`; `AI-OUT-001` |
| `API-P1-021`–`026` | `ARCH-P1-009`, `018`, `041`; `AUTH-P1-025`; `PRIV-P1-020`; `AUD-P1-027`; `THR-P1-005`, `019` |
| `API-P1-027`–`032` | `DOM-P1-009`–`011`, `044`–`045`; `DATA-P1-007`, `033`–`040`; `DIT-ING-P1-011`–`018`; `THR-P1-010`–`011` |
| `API-P1-033`–`038` | `ARCH-P1-019`–`024`, `027`–`032`, `039`–`042`; `NFR-P1-003`–`004`, `013`, `016`–`021`, `041` |
| `API-P1-039`–`046` | `ARCH-P1-011`, `015`, `023`, `029`; `SEC-P1-015`, `022`, `024`, `029`; `DIT-IMP-001`; `THR-P1-014`, `018`, `026` |
| `API-P1-047`–`052` | `PRIV-P1-001`–`030`; `AUD-P1-001`–`030`; `ARCH-P1-031`–`032`, `044`; `NFR-P1-017`, `033`–`040`; `DEC-031`–`DEC-040` |

## 10. Contract verification gates

Before any API operation becomes implementation authority:

1. OpenAPI and all referenced JSON schemas parse and resolve locally;
2. operation IDs are unique, stable, traceable, and not reused by prose rules;
3. every workspace operation proves authentication, explicit workspace/purpose context, current authorization, and safe denial;
4. commands prove idempotency; mutable transitions prove concurrency; delayed output/effect proves reauthorization;
5. representative success, validation, denial, stale revision, retry, partial, revocation, deletion-fence, and dependency-failure examples pass schema tests;
6. negative tests cover cross-workspace identifiers, fields, edges, counts, cursors, caches, signed grants, artifact versions, approvals, and conditional endpoints;
7. audit and telemetry schema/content-canary tests prove no prohibited content leakage;
8. event/HTTP state and correlation mappings reconcile under duplicate, delay, reorder, replay, cancellation, and purge;
9. connector conformance proves consent, permission, external-version, cursor, revocation, deletion, residency, and partial-failure semantics; and
10. decision-fenced operations remain disabled until the decision register and affected product/architecture/security/testing contracts are updated.

The standard-library validator [`validate-api-contracts.py`](../../scripts/validate-api-contracts.py) checks structural contract invariants. It does not replace authorization, security, privacy, schema-compatibility, adapter, or end-to-end evidence.
