# Phase 1 Coding Standards

| Field | Value |
|---|---|
| Document ID | `ENG-CODE-001` |
| Version | `0.1` |
| Status | **DRAFT — language- and framework-neutral** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |

## 1. Purpose and precedence

These standards define code properties that any future implementation language and framework must enforce. Exact formatter, linter, type checker, compiler, test runner, dependency tool, and code-generation tool remain technology decisions. Where a language-specific convention conflicts with a domain, security, privacy, API/event, or accepted ADR contract, the higher source wins.

Generated code is subject to security, dependency, build, and test gates but is changed through its source contract/generator rather than edited by hand.

## 2. Correctness and clarity

- Code uses exact ubiquitous-language terms from `ARCH-DOM-001` and specialist contracts. A synonym that collapses `Identity`, `Subject`, `Membership`, `Relationship`, `RoleAssignment`, or `AccessGrant` is prohibited.
- Types and interfaces make invalid scope, time, lifecycle, evidence, and authorization combinations hard to construct. Boundary strings become validated value objects before domain use.
- Functions/modules have one named owner and effect. Hidden global state, implicit workspace, implicit clock, implicit current user, and ambient provider context are prohibited.
- Branches for `RESTRICTED`, `UNAVAILABLE`, `INDETERMINATE`, stale, conflict, review, partial, unknown, cancel, repair, and deletion are explicit; a default branch cannot convert them into success/false/empty.
- Consequential logic is deterministic for the same exact inputs, policy/configuration versions, clock/randomness inputs, and port outcomes. Nondeterminism is isolated, injectable, bounded, and recorded where material.
- Comments explain invariant, threat, evidence, compatibility, or decision rationale. They do not restate syntax or preserve obsolete behavior without a tracked retirement.

## 3. Identity, scope, time, and data

At each trust boundary, a household operation carries a validated context containing:

| Context | Required semantics |
|---|---|
| Actor/workload | Stable authenticated identity/class; never authority inferred from payload |
| Workspace | Exactly one `WorkspaceId`, path/header consistency where applicable |
| Purpose/capability | Approved `PUR-P1-*` and operation/capability scope |
| Authorization | Current decision reference, policy/configuration epoch, obligations; never cached truth |
| Correlation | Request/workflow causation and correlation, privacy-safe |
| Lifecycle | Quarantine/security/deletion fence generation and cancellation state |
| Route | Processor/capability/residency eligibility when crossing a policy boundary |

Bare external IDs, names, emails, filenames, content hashes, provider IDs, or display values never substitute for platform identity. Global reference/platform operations have explicit non-household scope and reject household/personalized fields.

UTC instants are used for platform occurrence/transaction time; user/legal dates retain source timezone/calendar and precision. Facts/rules preserve valid/effective time separately from transaction/recorded time. Missing or uncertain time is represented, not fabricated. Numeric domain values carry units, scale/precision, provenance, and rounding policy; currency or consequential decimal values are not stored as unqualified binary floating-point values.

## 4. Domain and state transitions

Aggregate code:

1. validates current context, expected revision, command schema, idempotency identity, decision fences, and referenced entity versions;
2. evaluates all invariants before mutation;
3. produces one authorized local transition or a typed rejection;
4. emits immutable transition intent/event/audit evidence with exact causation; and
5. never writes another aggregate, projection, provider, or transport directly.

State machines use the exact owned vocabularies. A processing result cannot set document review; a task acknowledgement cannot set fulfilment; provider acceptance cannot set action success; file presence cannot prove evidence verification; a projection cannot resolve canonical truth.

Accepted originals, evidence anchors/observations, fact/rule occurrences, source snapshots, audit facts, and published event bytes are append-only while retained. Correction creates a linked new record. Governed purge deletes retained data under the deletion workflow; immutability is not permanent retention.

## 5. Boundaries and validation

All untrusted input—HTTP/event fields, files, document/source content, model output, provider callbacks, configuration, reference data, migration rows, environment values, and operator input—is validated against a closed versioned schema plus semantic policy before use.

Validation occurs:

- before resource lookup where malformed/scope data can leak existence;
- before domain construction and again at the owning invariant;
- before provider dispatch and after provider/model response;
- before event publication and consumer consequence;
- before persistence of canonical or derived state;
- before rendering, download, export, telemetry, or audit output; and
- again at high-impact execution, artifact redemption, export release, deletion, restore, and replay.

Unknown fields/versions do not silently coerce. Size, depth, cardinality, fan-out, recursion, archive expansion, decompression, page count, query complexity, graph traversal, tool calls, and output size are bounded by versioned policy.

## 6. Secure implementation baseline

Future code reviews and automated checks must cover:

- injection-safe parameterization/encoding for every interpreter, renderer, query, template, shell, path, document parser, model/tool, and provider boundary;
- canonicalization and allow-list validation before filesystem, URL, redirect, source retrieval, network/egress, MIME, or archive handling;
- output encoding and browser controls for XSS, CSRF, clickjacking, unsafe MIME, service-worker scope, local persistence, clipboard, and download;
- constant/disclosure-safe negative paths where existence, count, timing, error, cache, or facet behavior can leak restricted resources;
- least-privileged workload identity, no shared privileged accounts, no credential in code/config/log, and bounded privileged support access;
- authenticated encryption, separated key domains, secret rotation/revocation, and no custom cryptographic primitive without specialist review;
- dependency provenance, vulnerability/license review, pinned resolution, reproducible build, and removal/upgrade ownership; and
- safe resource limits, quotas, backpressure, circuit state, cancellation, and no unbounded retry/fan-out.

Security checks are explicit code paths or enforced policy; comments, naming, network location, UI hiding, or an adapter promise are not controls.

## 7. Commands, events, workflows, and concurrency

Commands use a stable scoped idempotency key and canonical fingerprint. Reuse with a different fingerprint is a conflict. Existing-aggregate writes require the expected revision/ETag or an explicit commutative design with proof; blind last-write-wins is prohibited.

The aggregate transition and required event/audit publication obligation are durably coupled through the future selected outbox/equivalent. Consumers deduplicate, validate aggregate order/revision, recheck current authorization/deletion/cancellation at consequence time, and record retry/repair outcomes. Event handlers are safe under duplicate, delayed, out-of-order, gap, partition, replay, and late-after-deletion cases.

External effects use a separate exact effect digest, approval binding, external command identity, attempt, provider receipt, reconciliation state, and fulfilment evidence. Timeout or acknowledgement is not success.

## 8. API, event, AI, and generated-contract code

- API implementations conform to `API-P1-001`–`052` and `API-P1-101`–`186`, including caller-safe problem responses, headers, examples, and decision metadata.
- Event producers/consumers conform to `EVT-P1-001`–`032` and the common envelope; event payloads remain closed and reference-oriented.
- Connector adapters conform to `CON-P1-001`–`050` and stay disabled where decisions require.
- AI/document processing is an untrusted interpretation path behind registered ports. Structured outputs are schema-, evidence-, policy-, guardrail-, and provenance-validated before immutable proposal storage.
- Model/document/source/provider text can never become instruction or tool/action authority. Tools are registered, input/output bounded, currently authorized, and effect-free unless an owning approved workflow expressly permits the effect.
- Generated bindings cannot weaken runtime validation, current authorization, deletion, compatibility, or audit obligations.

## 9. Privacy-safe errors and observability

Ordinary logs, traces, metrics, error bodies, analytics, screenshots, snapshots, tickets, test reports, crash dumps, and build output use an allow-list of safe identifiers, versions, classifications, outcome/reason codes, durations, sizes/count buckets, and watermarks.

They exclude raw document/image/text, extracted values, evidence passages, names/contact details, filenames, user queries, prompts, answers, tool arguments/results, model/provider payloads, tokens, credentials, key material, signed URLs, unrestricted URLs, and reversible hashes used as content copies. Sanitization happens at emission, not only downstream. Required audit is a distinct restricted contract and also does not become a hidden content archive.

Errors preserve correlation and stable safe codes while avoiding stack/provider/internal topology, sensitive validation details, or existence leakage at caller boundaries. Internal diagnostic details stay in approved restricted evidence with the same minimization, residency, retention, access, and deletion rules.

## 10. Review, static quality, and maintainability

Every changed behavior has:

- stable requirement/rule/test trace where consequence is material;
- automated tests for success, negative, boundary, and failure paths;
- compatibility/migration impact for contract or persistent-state changes;
- security/privacy/deletion/residency review when those surfaces change;
- documentation for public port/contract/state/error behavior;
- no unexplained formatter/linter/type/static-analysis suppression;
- measured or bounded complexity/fan-out for critical paths; and
- an owner and removal/revisit trigger for temporary code.

Dead code, disabled alternative implementations, commented-out secrets/code, and unbounded TODOs do not remain. Temporary exceptions are narrow, owned, expiring, tested, and never waive a zero-tolerance control or open decision.

## 11. Stable engineering rules

| Rule ID | Draft normative rule |
|---|---|
| `ENG-CODE-P1-001` | Code MUST use exact domain and contract terminology and MUST NOT collapse distinct identity, state, evidence, or authority concepts. |
| `ENG-CODE-P1-002` | Untrusted boundary values MUST be schema- and semantically validated before becoming domain/value objects. |
| `ENG-CODE-P1-003` | Every household request/job MUST carry validated actor/workload, workspace, purpose, current-policy, correlation, and deletion context. |
| `ENG-CODE-P1-004` | Global reference/platform paths MUST be explicit and reject household identifiers and personalized content. |
| `ENG-CODE-P1-005` | Bare provider/external IDs, names, emails, filenames, or hashes MUST NOT serve as canonical identity or authority. |
| `ENG-CODE-P1-006` | Aggregate commands MUST validate current policy/fences, schema, invariant, expected revision, and idempotency before transition. |
| `ENG-CODE-P1-007` | One aggregate owner MUST perform its transition; direct cross-aggregate or shared-store mutation is prohibited. |
| `ENG-CODE-P1-008` | State transitions MUST use exact versioned state machines and MUST NOT infer one owner's completion from another result/acknowledgement. |
| `ENG-CODE-P1-009` | Accepted originals and immutable evidence/history MUST be append-only while retained; correction creates linked versions. |
| `ENG-CODE-P1-010` | Valid/effective time and transaction/recorded time MUST remain separate, timezone-aware, reproducible, and uncertainty-preserving. |
| `ENG-CODE-P1-011` | Consequential numeric values MUST carry unit, precision, provenance, and rounding rules; unqualified floating values are prohibited. |
| `ENG-CODE-P1-012` | Unknown enum, schema, state, field, compatibility, or policy versions MUST fail safely and MUST NOT silently coerce. |
| `ENG-CODE-P1-013` | Input depth, size, count, recursion, fan-out, archive expansion, query/traversal, tool, and output work MUST be bounded. |
| `ENG-CODE-P1-014` | All interpreter/query/render/path/URL/file/model/tool/provider boundaries MUST use injection-safe construction, canonicalization, and allow-list policy. |
| `ENG-CODE-P1-015` | Authorization MUST be checked before protected retrieval and again before output, redemption, queued execution, export release, or external effect. |
| `ENG-CODE-P1-016` | Errors, empty results, counts, facets, timing, cache behavior, and identifiers MUST follow minimal-disclosure/non-enumeration policy. |
| `ENG-CODE-P1-017` | Secrets and key material MUST NOT appear in source, static configuration, fixtures, generated output, ordinary logs, or build artifacts. |
| `ENG-CODE-P1-018` | Cryptographic/security mechanisms MUST use an approved port/configuration and specialist-reviewed primitives; ad hoc security algorithms are prohibited. |
| `ENG-CODE-P1-019` | Dependencies MUST be locked, provenance/inventory/vulnerability/license checked, minimally scoped, and owned for update/removal. |
| `ENG-CODE-P1-020` | Commands MUST use scoped idempotency identity and fingerprint; mismatched reuse is a conflict, not a retry. |
| `ENG-CODE-P1-021` | Mutable aggregate writes MUST use expected revision/ETag or a proved explicit commutative operation; blind last-write-wins is prohibited. |
| `ENG-CODE-P1-022` | Successful canonical transitions MUST be durably coupled to required event and audit publication obligations. |
| `ENG-CODE-P1-023` | Consumers MUST be idempotent, order/revision aware, deletion/cancellation safe, current-policy checked, and replay repairable. |
| `ENG-CODE-P1-024` | Timeout, enqueue, dispatch, provider receipt, delivery, or elapsed time MUST NOT be coded as external-effect success or fulfilment. |
| `ENG-CODE-P1-025` | Retry, cancellation, partial, unknown, reconciliation, repair, and terminal outcomes MUST be explicit typed states. |
| `ENG-CODE-P1-026` | Provider types, SDK calls, callbacks, and errors MUST remain inside adapters and map losslessly to the provider-neutral port contract. |
| `ENG-CODE-P1-027` | API/event/connector behavior MUST be generated from or verified against reviewed machine-readable contracts, never inferred from implementation alone. |
| `ENG-CODE-P1-028` | AI/model/document/source/provider content MUST be treated as untrusted data and cannot alter policy, workspace, tool, evidence, or action authority. |
| `ENG-CODE-P1-029` | Structured AI/document outputs MUST pass schema, scope, evidence, provenance, confidence/coverage, guardrail, policy, and deletion checks before storage/use. |
| `ENG-CODE-P1-030` | Ordinary telemetry and errors MUST use property allow-lists and MUST exclude all prohibited content, credentials, signed access, and unrestricted URLs. |
| `ENG-CODE-P1-031` | Required audit MUST remain distinct from telemetry and MUST block or leave consequential work explicitly incomplete when unavailable. |
| `ENG-CODE-P1-032` | Clock, randomness, ID generation, external effects, and nondeterministic model/port behavior MUST be injectable and controllable in tests. |
| `ENG-CODE-P1-033` | Generated files MUST be source/version-linked, reproducible, non-hand-edited, drift-checked, and subject to compilation/security/test gates. |
| `ENG-CODE-P1-034` | Static-quality suppressions and temporary exceptions MUST be justified, narrow, owned, expiring, and unable to waive safety/open-decision gates. |
| `ENG-CODE-P1-035` | Code review MUST verify boundary ownership, contract compatibility, tests, threats, privacy/deletion/residency effects, and operational repair. |
| `ENG-CODE-P1-036` | A change MUST NOT merge with known unauthorized disclosure/effect, original mutation/loss, deletion resurrection, prohibited telemetry content, or missing required audit. |

## 12. Language-profile requirement

After a language/toolchain is selected, a subordinate approved profile must map every rule above to exact formatter, linter, type-safety, dependency, static/security analysis, build, code-generation, test, coverage, and documentation commands. It may strengthen these rules but cannot weaken them. No such profile is selected here.
