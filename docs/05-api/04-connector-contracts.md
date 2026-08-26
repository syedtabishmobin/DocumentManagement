# Phase 1 Connector and Adapter Contracts

| Field | Value |
|---|---|
| Document ID | `API-CON-001` |
| Version | `0.1` |
| Status | **DRAFT — provider-neutral; no conditional connector or channel is enabled** |
| Product phase | Phase 1 — Personal and Family |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 26 August 2026 |
| API companions | [`API-STD-001`](01-api-standards.md), [`API-OAS-001`](02-openapi.json) |
| Event companion | [`API-EVT-001`](03-event-catalogue.md) |
| Decision fences | `DEC-031`, `DEC-037`, `DEC-039`, `DEC-040` |

## 1. Purpose, authority, and activation boundary

This document defines provider-neutral contracts for import connectors, external action connectors, notification-channel adapters, governed-source retrieval/parser adapters, and external processing adapters. It covers capability declaration, consent, external identities and versions, cursors, permission mapping, idempotency, callbacks, revocation, deletion, residency, partial failure, reconciliation, and conformance. Stable draft rules use `CON-P1-*` IDs.

The source-of-truth hierarchy in [`CODEX.md`](../../CODEX.md) applies. Approved decisions constrain this draft. The contract refines the provider-neutral ports in [`ARCH-SOL-001`](../02-architecture/01-solution-architecture.md), the `Integration`, `ConsentRecord`, `SourceObservation`, `ActionExecution`, and `NotificationDelivery` records in [`ARCH-DATA-001`](../02-architecture/03-logical-data-model.md), and `SEC-P1-020`–`024`, `AUTH-P1-020`–`021`, `029`, `PRIV-P1-006`–`009`, `027`–`028`, and `AUD-P1-023`.

No private inbound-email or cloud import connector is selected while `DEC-031` is open. No external email or push channel is activated while `DEC-037` is unapproved. No connector or processor route is eligible for the Australian residency option until the `DEC-040` matrix proves it. No deletion/retained-data duration is inferred while `DEC-039` is open. A manifest, schema, OpenAPI operation, or passing synthetic test is not product activation.

## 2. Adapter classes and owning boundaries

| Adapter class | Canonical purpose | Owning platform records | Forbidden ownership |
|---|---|---|---|
| Import connector | Discover and retrieve approved external items/versions into an `AcquisitionAttempt` and `IngestionCase` | `Integration`, `ConsentRecord`, connector sync run, external mappings/cursor; ingestion owns accepted artifact/workflow | Logical-document equality, fact truth, classification, requirement fulfilment, or deletion truth |
| External action connector | Execute one approved provider-neutral effect and reconcile reality | `Approval` supplies binding; `ActionExecution` owns command, attempts, outcome, repair and evidence | Approval, canonical fact/rule mutation, closure, or silent retries |
| Notification channel | Deliver the minimum authorized rendered notification through an approved channel | `NotificationDelivery` owns recipient, policy, dedup, attempts and delivery outcome; `Task` remains separate | Task/recommendation truth, acknowledgement inferred from transport, or audience expansion |
| Governed-source retrieval/parser | Retrieve a governed endpoint, preserve an immutable observation/no-change result, parse candidates, and update source health | `SourceDefinitionVersion`, `SourceEndpointVersion`, `SourceRetrievalAttempt`, `SourceObservation`, `SourceParseRun`, `SourceHealth` | Rule publication, applicability, recommendation, or arbitrary-web authority |
| Content/AI processor | Perform one registered malware, native extraction/OCR, embedding/reranking/model/tool capability | `StageRun`, `ExtractionRun`, `DocumentAnalysis`, or AI result generation under the owning workflow | Domain mutation, access decision, approval, action, fulfilment, quarantine release, or provider-owned canonical truth |

An adapter class is a logical port contract, not a required service, process, product, marketplace, or deployment unit.

## 3. Common adapter envelope

Every outbound adapter request and inbound result/callback uses or resolves this minimum envelope:

| Field group | Required data |
|---|---|
| Contract | `adapter_contract_id`, immutable version, adapter class, registered capability/kind/version, accepted input/output schema versions |
| Scope | Exact `workspace_id`, or explicit `GLOBAL_REFERENCE` only for non-personalized governed public-source retrieval; residency policy/route and deletion generation |
| Actor/workload | Least-privileged `workload_id`, originating actor/grant/approval references where required, purpose, current policy/authorization decision and expiry/freshness |
| Integration | `integration_id`, consent/basis reference and notice version, external namespace, protected credential reference, requested scopes/capabilities |
| Command/run | Stable command or run ID, aggregate/case ID/revision, idempotency/reconciliation ID, causation/correlation, attempt and replay generation |
| Input | Exact platform resource/version/generation/digest references and the minimum content/fields required; no ambient workspace access |
| External identity | Namespaced external container/item/version/event/recipient/source identifiers plus their evidence and stability class |
| Control | Timeout/cancellation/retry classification, size/rate/fan-out budget, signature/replay requirements, data class, retention/deletion obligations |
| Output | Schema-bound result, provider receipt/reference, next cursor if applicable, per-item outcome, unknown/partial status, safe error class and evidence references |
| Provenance | Adapter/provider capability reference, processing/parser/model/tool versions, observed/recorded times, policy/configuration versions and audit correlation |

Raw secrets, bearer tokens, document content, evidence passages, destination contact values, unrestricted URLs, and provider payloads do not appear in ordinary events, problems, telemetry, or audit envelopes. They use separately classified protected stores and minimum scoped delivery.

## 4. Stable connector rules

### 4.1 Registration, versions, identity, and scope

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-001` | Every adapter MUST implement an immutable versioned contract and declare its adapter class, capabilities, input/output schemas, callback behavior, external identity/version semantics, permission model, failure modes, rate/size constraints, retention/deletion support, regions/processors, and conformance evidence. |
| `CON-P1-002` | Core domain commands/events MUST use provider-neutral types. Provider names, IDs, status codes, permission strings, cursor formats, receipts, and payloads MUST remain inside a versioned adapter mapping and cannot become platform enum or resource identity. |
| `CON-P1-003` | Every household adapter call MUST carry one validated `WorkspaceId`, purpose, capability, current policy/authorization reference, data classification, residency route, deletion generation, causation/correlation, and least-privileged workload identity. |
| `CON-P1-004` | An approved global-reference source call MUST contain no household ID, personalized query/response, credential belonging to a household, or content-derived household value. If personalization occurs, the call and result become workspace-scoped. |
| `CON-P1-005` | External identities MUST be stored as `IntegrationId + external namespace + external object kind + external ID + optional external version`. An external ID or matching name/hash MUST NOT replace a platform ID or prove subject/document equality. |
| `CON-P1-006` | Every provider version/change token, modification time, deletion marker, permission revision, webhook sequence, and cursor has an explicit stability/ordering interpretation. Unknown semantics route review or safe rescan; they are not guessed. |
| `CON-P1-007` | Adapter contract and schema compatibility is classified as additive, consumer-review-required, replay-required, or breaking. Unknown major/security/consequence fields fail closed and do not reach domain owners. |
| `CON-P1-008` | An adapter MAY be technically installed but remains `DISABLED` until capability, security, privacy, legal/consent, residency, deletion, operational, and product activation checks pass. A disabled adapter has no credential, polling, webhook, delivery, or data route. |
| `CON-P1-009` | Adapter-specific configuration MUST be versioned, evidence-backed, approved, effective-dated, audited, and rollback/forward-repair capable. It MUST NOT create hidden standing support/content access. |
| `CON-P1-010` | Every adapter request/result MUST retain enough safe references and exact contract/configuration versions to reproduce the platform decision without retaining a shadow copy of protected payload content. |

### 4.2 Consent, credentials, processing, and permission mapping

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-011` | An `Integration` MUST bind workspace, initiating identity/grant, purpose, adapter kind/version, external namespace/account reference, requested scopes, `ConsentRecord`, processing/residency policy, cursor/state, retention/deletion consequence, and lifecycle revision. |
| `CON-P1-012` | Consent, where used, MUST be affirmative, specific, attributable, versioned, purpose/capability/data-class/processor/region bounded, withdrawable where applicable, and no broader than the external authorization actually required. |
| `CON-P1-013` | Notice and consent MUST disclose the provider-neutral processing type, data categories, external permission effect, future retrieval, retained-data consequence, deletion limits, residency/cross-border state, and how to revoke. Provider branding alone is not an adequate notice contract. |
| `CON-P1-014` | Credentials/tokens MUST be stored only through a protected secret reference, least-scoped, non-exported, rotated/revoked, excluded from platform domain state/events/logs/audit, and inaccessible to model/document text. An adapter never returns a credential to an ordinary API client. |
| `CON-P1-015` | Before each call and before committing/releasing a result, the platform MUST re-evaluate integration state, consent, purpose, resource/field/action authority, grant/approval, processor/region eligibility, quarantine, and deletion fence. Enqueue-time authorization is insufficient. |
| `CON-P1-016` | External permissions are evidence inputs, not platform allows. Mapping outcomes are `MAPPED_ALLOW`, `MAPPED_DENY`, `REQUIRES_REVIEW`, or `UNSUPPORTED_BLOCKED`; an external allow cannot broaden current platform policy, and unknown/ambiguous permission fails closed. |
| `CON-P1-017` | Permission drift, external account change, scope reduction, token revocation, or loss of consent MUST invalidate affected syncs, caches, pending calls, artifact grants, results, and future effects. Already-completed effects remain visible and reconciled rather than falsified. |

### 4.3 Import, cursors, versions, callbacks, and ingestion

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-018` | Import discovery uses an opaque adapter cursor bound to integration, external collection/scope, permission revision, query contract, and replay generation. A cursor is not a platform resource ID, secret bearer grant, or proof that prior pages remain authorized. |
| `CON-P1-019` | The platform advances the durable cursor only after all preceding listed outcomes and required ingestion/outbox/audit records are durably reconciled. Adapter receipt alone MUST NOT skip items or mark them imported. |
| `CON-P1-020` | Full rescan, delta sync, callback, and manual import converge on the same stable external item/version mapping and ingestion idempotency identity. Duplicate, delayed, reordered, and replayed signals MUST NOT create uncontrolled documents, versions, tasks, or effects. |
| `CON-P1-021` | Each discovered external item/version records external identity/version evidence, parent/container reference where permitted, source time/uncertainty, permissions revision, media metadata, acquisition attempt, and safe outcome. Filename and provider modification time remain untrusted. |
| `CON-P1-022` | Imported bytes enter the same `IngestionCase` and isolation/safety pipeline as browser/PWA capture. A trusted connector or provider scan MUST NOT bypass platform validation, malware policy, suspected-clinical `POLICY_HOLD`, immutable-original, evidence, or review gates. |
| `CON-P1-023` | Exact external content/version equality is acquisition evidence only. The connector MUST NOT decide platform `LogicalDocument`, `DocumentVersion`, supersession, conformed view, canonical fact, or fulfilment identity. |
| `CON-P1-024` | External update and deletion markers create candidate/reconciliation inputs. They MUST NOT overwrite an original, delete platform evidence, remove another subject's rights, or declare platform purge without the owning lifecycle/deletion policy and authority. |
| `CON-P1-025` | Webhooks/callbacks MUST authenticate the sender/route, validate signature and schema, enforce destination and integration scope, reject replay, retain external event/version identity, and enqueue only a bounded provider-neutral signal. Callback payload permissions are untrusted. |
| `CON-P1-026` | If a provider cannot supply stable versions, permission changes, deletions, or cursors, the adapter MUST declare the limitation, use an approved reconciliation strategy, and expose incomplete/at-risk coverage. It MUST NOT manufacture ordering or monitoring completeness. |
| `CON-P1-027` | Disconnect or consent withdrawal stops future discovery/retrieval/callback acceptance as soon as the authoritative integration transition is accepted. Already-ingested data follows the separately approved platform retention/deletion policy; it is neither silently retained forever nor automatically destroyed. |

### 4.4 External action execution and reconciliation

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-028` | An external action adapter accepts only an `ActionExecution` command with current exact `Approval`, target/effect digest, expected resource revisions, actor/grant authority, purpose/consent, residency route, consequence class, idempotency/reconciliation identity, and audit correlation. |
| `CON-P1-029` | The adapter MUST reject a missing, expired, revoked, superseded, changed-input, changed-effect, wrong-target, wrong-workspace, wrong-purpose, or policy-ineligible approval/command. Model output and provider UI state cannot grant execution authority. |
| `CON-P1-030` | Provider statuses map losslessly into the exact owning `ActionExecution` vocabulary: `Requested`, `Blocked`, `DispatchPending`, `Dispatched`, `Acknowledged`, `OutcomeUnknown`, `Failed`, `Succeeded`, `PartiallySucceeded`, `ReconciliationPending`, `RepairPending`, `EvidencePending`, `ReversalPending`, or `Reversed`. Adapter “accepted” maps no further than `Acknowledged`. |
| `CON-P1-031` | A command uses one stable effect idempotency/reconciliation identity. Retrying after timeout or ambiguous response is blocked until provider capability or reconciliation proves whether repeating can duplicate or broaden the effect. Exactly-once external execution is not assumed. |
| `CON-P1-032` | Multi-target/bulk execution records a bounded manifest and a per-target state/evidence result. Partial success remains `PartiallySucceeded`/`ReconciliationPending`; it MUST NOT be collapsed into global success or silently retried for successful targets. |
| `CON-P1-033` | Reversal, compensation, cancellation, or forward repair is available only when declared by the exact action contract and separately authorized. The absence of reversal remains explicit before approval and after failure. |
| `CON-P1-034` | Provider delivery/acknowledgement does not verify real-world completion or close a recommendation/requirement. Closure requires configured replacement/fulfilment evidence and `EvidenceVerification` owned by the platform workflow. |

### 4.5 Notification-channel adapters

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-035` | A notification adapter receives a `NotificationDelivery` request, never unrestricted task/recommendation/evidence content. It binds exact recipient/audience, grant/purpose, channel policy, template/version, minimum content class, preference/quiet decision, dedup key, expiry and current authorization. |
| `CON-P1-036` | Rendered channel payloads MUST use approved templates and minimum disclosure. Subject names, values, document titles, evidence, graph paths, source details, signed artifact URLs, and action tokens are excluded unless the exact field/channel/purpose policy permits them. |
| `CON-P1-037` | Delivery, bounce, provider acknowledgement, open, click, or device receipt are separate adapter outcomes and MUST NOT change `Task`, `Recommendation`, approval, action, or evidence-verification truth. Duplicate callbacks cannot duplicate notifications or acknowledgements. |
| `CON-P1-038` | External channel failure, revocation, preference change, stale source, lost grant, deletion fence, or residency ineligibility suppresses/cancels/redacts the pending delivery and remains visible. It MUST NOT widen the recipient, switch to an unapproved channel, or mark delivery successful. |

### 4.6 Governed-source retrieval and parsing

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-039` | Governed-source retrieval binds exact `SourceDefinitionVersion`, `SourceEndpointVersion`, retrieval method, jurisdiction/topic/coverage, authority tier, schedule/run, network/content policy, parser contract, freshness objective, owner, and replay identity. An arbitrary URL or model-selected page is not a governed source. |
| `CON-P1-040` | The adapter MUST restrict destinations/protocols/redirects and resist SSRF, DNS/redirect substitution, oversized/decompression content, active content, parser exploitation, and source poisoning according to the security profile. Endpoint identity is validated independently of retrieved text. |
| `CON-P1-041` | Every attempt creates `SourceRetrievalAttempt` and either an immutable `SourceObservation`, verifiable no-change observation, or explicit failure. Mutable `SourceHealth` records attempt/success/freshness/parser/retry/disabled state separately; last success never hides current failure. |
| `CON-P1-042` | `SourceParseRun` binds the exact observation, parser/tool/schema/configuration versions, coverage, result and failure. Parsed `RuleOccurrence` is a candidate only; parsing MUST NOT publish a `RulePublication`, decide `ApplicabilityEvaluation`, or create a recommendation. |
| `CON-P1-043` | Source replay creates new attempt/parse/run lineage under exact historical versions or an explicitly chosen new version. It preserves prior observations, health, decisions, failures, and effective/transaction time and cannot claim coverage outside the manifest. |

### 4.7 Revocation, deletion, residency, failure, and conformance

| Rule ID | Draft connector rule |
|---|---|
| `CON-P1-044` | Revocation/disconnect MUST disable credentials, future polling, callbacks, syncs, deliveries, and queued calls; increment the relevant authorization/integration epoch; and reconcile in-flight/unknown outcomes. An uncertain consumer fails closed. |
| `CON-P1-045` | A `DeletionCase` fence takes precedence over connector sync, callback, retry, result commit, provider rescan, export, repair, and restore. Each adapter reports per-target `pending`, `complete`, `not_applicable`, `approved_exception`, `failed_retry`, or `residual` acknowledgement without claiming platform completion. |
| `CON-P1-046` | Provider-side deletion is requested only when the approved integration/deletion contract, subject rights, authority, and provider capability require it. Platform purge and provider deletion remain distinct evidenced states; unsupported provider deletion is disclosed, not fabricated. |
| `CON-P1-047` | Every external data/processor/region/support/telemetry/backup route MUST be present and eligible in the active residency/processing policy. Unknown or ineligible route blocks; an external contract or user preference cannot silently create a cross-border exception. |
| `CON-P1-048` | Timeout, rate limit, schema error, token expiry, permission drift, partial result, provider deletion, unavailable reconciliation, callback gap, cursor invalidation, or residency failure MUST produce an explicit safe retry/review/blocked/partial/unavailable state and never last-known or fabricated success. |
| `CON-P1-049` | Ordinary connector logs, events, metrics, traces, errors, analytics, and audit MUST use opaque IDs, versions, states, counts/buckets, latency/usage/cost classes, and safe reason codes only. Tokens, payload/content, recipient values, filenames, unrestricted URLs, source passages, and provider errors are prohibited. |
| `CON-P1-050` | An adapter cannot be activated until the complete conformance profile in section 10 passes for its exact version/capability/region and required decision gates are closed. A later material provider/capability change reopens affected conformance and replay/impact review. |

## 5. Integration and sync state contract

Exact product status IDs ultimately belong in versioned reference data. The connector contract reserves these provider-neutral meanings:

| Integration state | Meaning and allowed effect |
|---|---|
| `DRAFT` | Configuration exists with no credential, consent, call, callback, or data route. |
| `CONSENT_PENDING` | Notice/authorization is incomplete; no external processing. |
| `POLICY_BLOCKED` | Consent may exist, but product, permission, security, residency, deletion, or decision policy blocks activation. |
| `ACTIVE` | Exact adapter kind/version/capabilities and route are approved; calls may occur under current policy. This state is unreachable for private connectors while `DEC-031` is open and for an unproved route while `DEC-040` is open. |
| `SUSPENDED` | Calls are blocked pending safe review/repair; credentials remain protected and cannot be used by queued jobs. |
| `REVOCATION_PENDING` | Authoritative revocation is accepted; in-flight/callback/credential cleanup is being reconciled, and no new call is allowed. |
| `DISCONNECTED` | Future calls and callbacks are denied; retained platform/provider data consequences remain explicit. |
| `DELETION_PENDING` | A deletion case governs platform/provider cleanup; fence wins. |
| `DELETED` | The integration has no serviceable credential/route/data under the approved criteria; minimized tombstone/audit may remain. |
| `FAILED` | Terminal contract/configuration failure; new activation requires a corrected version/decision, not automatic broad fallback. |

Import/source synchronization attempts use `PENDING`, `RUNNING`, `PARTIAL`, `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_TERMINAL`, `CANCELLED`, `POLICY_BLOCKED`, or `DELETION_BLOCKED`. `SUCCEEDED` means the declared bounded page/run and its durable per-item outcomes reconciled; it does not mean all external data was discovered, imported, current, authorized, or fulfilled.

## 6. Provider-neutral manifest example

This is illustrative and deliberately activates nothing:

```json
{
  "adapter_contract_id": "connector.import.contract",
  "adapter_contract_version": "1.0.0-draft",
  "adapter_class": "IMPORT_CONNECTOR",
  "integration_kind": "PRIVATE_CONTENT_SOURCE_UNSELECTED",
  "status": "DISABLED",
  "decision_fences": ["DEC-031", "DEC-040"],
  "capabilities": {
    "discovery": "DECLARED_NOT_ENABLED",
    "version_identity": "REQUIRED_BEFORE_ENABLEMENT",
    "permission_mapping": "REQUIRED_BEFORE_ENABLEMENT",
    "deletion_signals": "REQUIRED_BEFORE_ENABLEMENT",
    "callback_support": "OPTIONAL_UNDECIDED"
  },
  "schemas": {
    "request": "connector.import.request@1.0.0-draft",
    "result": "connector.import.result@1.0.0-draft"
  },
  "processing_routes": [],
  "conformance_profile": "connector.conformance.phase1@0.1",
  "example_only": true
}
```

An empty `processing_routes` array means the adapter cannot be invoked. It does not mean data may be sent anywhere.

## 7. Import result contract

An import page/result contains:

- integration, adapter contract/version, workspace, purpose, consent and route references;
- sync run, replay generation, opaque input cursor digest/reference, per-page identity, causation/correlation and attempt;
- permission revision and mapping result;
- one immutable per-item result with external namespace/kind/ID/version/deletion marker, source time/uncertainty, acquisition/idempotency reference, declared data class and one safe outcome;
- explicit coverage and gaps, truncation/rate/failure state, duplicate/reorder observations, and cursor invalidation;
- a next cursor stored only in the protected integration state; and
- audit and telemetry references without content.

Per-item outcomes include discovered/no-change, submitted to ingestion, already reconciled, permission-blocked, policy-blocked, unsupported, retryable failure, terminal failure, external deletion observed, or deletion-fenced. They do not include “canonical fact accepted,” “logical document matched,” “fulfilled,” or “purged.”

## 8. Callback contract

Callback ingress is an untrusted public-edge input. The adapter boundary must:

1. resolve the route to one registered adapter/integration without accepting workspace identity from the body;
2. validate transport/source authentication, signature/key version, timestamp/nonce or equivalent replay proof, content type, size, schema and event type;
3. enforce integration state, decision/residency policy, callback capability, source account/namespace and rate/abuse controls;
4. store only the minimum protected callback evidence needed for reconciliation;
5. create a provider-neutral signal with stable external event/version identity and dedup/replay state;
6. re-fetch authoritative external state where the adapter contract requires it instead of trusting the callback body as truth; and
7. return a caller-safe acknowledgement that does not reveal workspace, resource, permission, deletion, or processing state.

Signature validity proves only possession of the configured callback credential. It does not prove platform authorization, document safety, rule authority, approval, or action completion.

## 9. Failure and reconciliation matrix

| Condition | Required outcome | Prohibited shortcut |
|---|---|---|
| Consent withdrawn | Stop new calls; invalidate/suspend pending work; reconcile in-flight; expose approved retained-data effect | Continue until next scheduled sync or silently delete retained evidence |
| Credential expired/revoked | `POLICY_BLOCKED`/`SUSPENDED`; protect diagnostics; require approved reauthorization | Fall back to a broader platform/operator credential |
| Permission drift | Re-evaluate each mapped item/action; suppress/narrow and invalidate derivatives | Treat the last external allow as current |
| Cursor invalid/expired | Record gap; bounded full rescan or review if approved; preserve prior cursor/run | Skip to a guessed cursor or claim complete coverage |
| Duplicate/out-of-order callback | Deduplicate/reconcile using external event/version and aggregate revision | Repeat upload, notification, action, deletion, or cursor advance |
| Import partial failure | Preserve per-item outcomes and cursor checkpoint; retry only failed eligible items | Mark page/sync complete or re-import successful items blindly |
| Action timeout | `OutcomeUnknown` then `ReconciliationPending`; do not retry until safe | Mark failed/succeeded from timeout alone |
| Action partial success | `PartiallySucceeded`; per-target evidence; approved repair/reversal | Collapse to success or rollback without authority |
| Notification failure | Preserve task/recommendation truth; retry/suppress under policy | Change recipient/channel or mark acknowledged |
| Source/parser failure | Update `SourceHealth`, retain dated observation, expose stale/failed and replay path | Present last successful value as current/no change |
| Deletion fence arrives | Stop call/result commit, keep fence, emit purge/reconciliation acknowledgement | Complete late result or reconnect/resync deleted data |
| Residency route unknown | Block before payload leaves the policy boundary | Select a reachable region/provider or infer consent |
| Provider schema change | Quarantine result and mark contract incompatibility; review/replay under new version | Ignore unknown fields or coerce provider status silently |

## 10. Adapter conformance profile

Each exact adapter version/capability/processing route must pass, with synthetic data only:

1. **Manifest and schema:** immutable version, required capability metadata, local schema validation, compatibility classification, unknown-field failure and representative examples.
2. **Tenant/identity:** missing/forged/wrong-workspace context, external-ID collision, provider-account swap and cross-workspace cache/cursor denial.
3. **Authorization/consent:** purpose, least scopes, notice/version, withdrawal, actor/workload separation, mid-job grant/revocation, approval/effect binding and no payload/model authority.
4. **Credentials/callbacks:** secret non-exposure, rotation/revoke, sender/signature validation, replay, route guessing, malformed/oversized payload and rate/abuse behavior.
5. **Permissions:** allow/deny/unknown mapping, permission drift, external deletion, shared item, lost access, and no platform-policy broadening.
6. **Cursor/version/idempotency:** initial/delta/full scan, invalid cursor, duplicate/delay/reorder, external version ambiguity, callback+poll convergence and per-item checkpoint repair.
7. **Ingestion/content safety:** immutable acquisition provenance, quarantine/scanner outage, suspected clinical `POLICY_HOLD`, exact-hash duplicate without logical merge, cancellation and late result.
8. **Action:** exact approval/revision/effect, timeout/unknown, duplicate command, partial/bulk, reconciliation, unsupported reversal, evidence verification and no auto-closure.
9. **Notification/source:** minimum disclosure, preference/revocation, no task mutation, destination restrictions, SSRF/redirect/parser poison, observation/health separation and deterministic replay.
10. **Deletion/restore:** disconnect, provider deletion capability, per-role acknowledgement, late callback/rescan, backup/restore/resurrection and minimized audit.
11. **Privacy/residency:** field minimization, retention/training/reuse prohibition, region/processor denial, cross-border exception expiry, telemetry/audit canary and no content-bearing errors.
12. **Resilience/operations:** quota/rate limit, bounded retry/backoff, circuit/backpressure, provider outage, schema incompatibility, reconciliation backlog, cost attribution and safe disable/rollback.

Activation requires zero known cross-workspace/field/edge/recipient leak, zero unauthorized action, zero deletion resurrection, zero prohibited telemetry content, and an eligible declared processing route. A conformance exception cannot close `DEC-031`, `DEC-037`, `DEC-039`, or `DEC-040`.

## 11. Decision fences

| Decision | Fence in this contract |
|---|---|
| `DEC-031` | Import integration operations `API-P1-177`–`API-P1-180` and every private-content source kind remain `DISABLED_UNTIL_APPROVED`; no example names or enables a provider. |
| `DEC-037` | Notification-channel registration `API-P1-169` is `DISABLED_UNTIL_APPROVED`; external email/push delivery is not implied. Task and `NotificationDelivery` records remain channel-neutral. |
| `DEC-039` | Disconnect/provider deletion/platform purge/credential and payload residuals have explicit states but no cooling-off, purge, retention, backup-expiry, or completion duration. |
| `DEC-040` | `ACTIVE` integration/channel/processor/source routes require a closed matrix row. Unknown route blocks and no user/API flag invents a cross-border exception. |

Other related fences remain in force: `DEC-035` selects the enabled governed-source launch pack; `DEC-036` controls suspected-clinical disposition; `DEC-032` prevents ordinary connector events from triggering continuity disclosure.

## 12. Traceability

| Connector rules | Primary alignment |
|---|---|
| `CON-P1-001`–`010` | `DEC-009`; `ARCH-P1-001`–`005`, `013`–`018`, `040`, `045`; `DATA-P1-004`–`006`, `025`, `041`, `046`–`050` |
| `CON-P1-011`–`017` | `DOM-P1-054`; `SEC-P1-020`–`022`; `AUTH-P1-020`–`021`, `029`; `PRIV-P1-005`–`009`; `AUD-P1-023` |
| `CON-P1-018`–`027` | `REQ-P1-ING-004`, `009`; `DIT-ING-P1-001`–`035`; `DATA-P1-033`–`040`; `THR-P1-011`, `018`, `023` |
| `CON-P1-028`–`034` | `REQ-P1-ACT-005`–`008`; `DOM-P1-043`–`046`; `DIT-IMP-001`; `SEC-P1-024`; `AUTH-P1-013`–`014`; `AUD-P1-017`–`018` |
| `CON-P1-035`–`038` | `REQ-P1-NTF-003`–`004`; `DOM-P1-047`; `AUTH-P1-011`, `019`; `AUD-P1-019`; `DEC-037` |
| `CON-P1-039`–`043` | `REQ-P1-MON-003`–`007`; `DOM-P1-032`–`033`; `DIT-SRC-001`; `SEC-P1-023`; `AUD-P1-015`; `THR-P1-017`, `027`, `030` |
| `CON-P1-044`–`050` | `ARCH-P1-015`, `023`, `031`–`032`, `041`–`045`; `PRIV-P1-011`–`018`, `027`–`028`; `AUTH-P1-034`; `NFR-P1-005`, `016`–`021`, `033`–`045`; `DEC-031`, `037`, `039`, `040` |

## 13. Definition of ready

This connector pack supports implementation readiness only after:

- the applicable connector/channel/source capability is explicitly approved and its decision-register state updated;
- OpenAPI, events, callbacks, schemas, state mappings, consent/notice, processing/residency, deletion and audit contracts agree;
- exact adapter manifests and examples validate without provider-native leakage into core contracts;
- security/privacy/threat review approves data fields, destinations, credentials, callbacks, logs, telemetry, support and incident paths;
- conformance evidence passes for the exact adapter version and every enabled route;
- negative tests cover revocation during discovery, retrieval, processing, delivery and effect; and
- the backlog and test strategy link implementation to `CON-P1-*`, `API-P1-*`, `EVT-P1-*`, requirements, use cases, security rules, NFRs and decision fences.

Until then, the adapter interfaces are inert extension points and no conditional connector or external channel is enabled.
