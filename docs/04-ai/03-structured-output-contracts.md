# Phase 1 AI Structured Output Contracts

| Field | Value |
|---|---|
| Document ID | `AI-OUT-001` |
| Version | `0.1` |
| Status | `DRAFT — provider-neutral; architecture, domain, security, and AI assurance approval required` |
| Product phase | Phase 1 — Personal and Family |
| Primary requirements | `REQ-P1-AI-001`, `REQ-P1-AI-003`–`REQ-P1-AI-006`, `REQ-P1-ING-005`, `REQ-P1-SRCH-002`–`REQ-P1-SRCH-005` |
| Related contracts | `AI-CAP-001`, `DIT-EXT-001`, `DIT-FCT-001`, `DIT-GPH-001`, `DIT-MON-001`, `DIT-IMP-001`, `DIT-SRC-001`, `DIT-HLT-001`, `DIT-VER-001`, `SEC-AUD-001` |
| Open decisions | `DEC-034`, `DEC-035`, `DEC-036`, `DEC-039`, `DEC-040` |
| Updated | 26 August 2026 |

## 1. Purpose and invariants

This document defines the common machine-validatable envelope and capability-specific payload rules for every Phase 1 AI result. The envelope preserves exact scope, provenance, evidence, confidence, limitations, review and proposed effects independently of provider response formats.

All provider/model/parser output is untrusted input. Validation success permits storage as an immutable result generation or review proposal only; it never authorizes a domain mutation. Unknown security-relevant fields, commands disguised as data, arbitrary URLs, tool requests, grants, approvals and provider-native action semantics are rejected.

## 2. Contract and version model

| Object | Stable identity and compatibility rule |
|---|---|
| `OutputContract` | Stable `contract_id` plus immutable semantic `contract_version`; defines common envelope and payload schema. |
| `CapabilityPayloadSchema` | Stable capability/payload ID and immutable version; additional properties are denied unless explicitly declared. |
| `ResultGeneration` | Immutable validated output for exact inputs/run. Retry/replay creates a new generation and predecessor link. |
| `ValidationReport` | Immutable syntactic, referential, evidence, policy, guardrail and prohibited-effect findings. |
| `Claim` | Stable within the result; source-derived material assertion with evidence roles and support result. |
| `ProposedEffect` | Typed inert proposal for an owning domain command. It is never executable model text. |
| `Limitation` | Stable reason code, affected scope, severity, disclosure class and recoverability; prose is rendered separately. |

Compatibility is classified as additive, consumer-review-required, replay-required, or breaking. Published schemas are immutable. A consumer MUST name the versions it accepts and fail safely on unknown major versions or unknown security/consequence fields.

## 3. Common result envelope

### 3.1 Required top-level fields

| Group | Required fields and meaning |
|---|---|
| Contract | `contract_id`, `contract_version`, `payload_schema_id`, `payload_schema_version`, `capability_id`, `capability_version` |
| Identity | `result_generation_id`, `run_id`, `workspace_id` or explicit approved global-reference scope, `correlation_id`, `causation_id`, `idempotency_key_ref` |
| Inputs | Exact resource IDs, revisions/generations/digests, temporal perspective, configuration/taxonomy/rule/source versions and predecessor generation |
| Authority | Actor/workload reference, purpose, delegation/grant reference, authorization decision/policy version/epoch, checked time, residency/processor route and deletion-fence watermark |
| Processor provenance | Adapter/provider-model opaque reference, model/configuration, prompt/template, tool registry and invoked tool versions; no secrets or raw prompt text |
| Outcome | `status`, typed `payload`, coverage, limitations, validation state, retry/fallback state and supersession lineage |
| Evidence | Claims, evidence-anchor/source-snapshot references, support roles, resolver/support checks and citation disclosure state |
| Confidence | Calibration ID/version, applicable slice, calibrated score/band where permitted, uncertainty and review reasons; provider score is optional provenance only |
| Review/effects | Review route/policy, mandatory-review flags, inert `proposed_effects`, target revisions, preview/effect digests and prohibited-effect findings |
| Operations | Start/end/recorded times, attempt, usage/latency/cost classes and safe failure category; never raw content or provider payload in ordinary telemetry |

### 3.2 Status vocabulary

All outputs use one primary execution status: `VALIDATED_PROPOSAL`, `REVIEW_REQUIRED`, `DEGRADED`, `REFUSED`, `FAILED_RETRYABLE`, `FAILED_TERMINAL`, `CANCELLED`, `DELETION_BLOCKED`, or `POLICY_BLOCKED`. Capability-specific semantic outcomes remain inside the typed payload and cannot be inferred from execution success.

For example, a structurally valid applicability result may have semantic outcome `INDETERMINATE`; a valid search result may be `INSUFFICIENT`; and a successful comparison may be `SUPPORTED_NO_CHANGE_WITHIN_SCOPE`. `VALIDATED_PROPOSAL` never means accepted fact, verified evidence, approved action or fulfilled requirement.

### 3.3 Presence, restrictions and protected values

Every field capable of being absent MUST distinguish `ABSENT_NOT_FOUND`, `EXPLICIT_NONE`, `NOT_APPLICABLE`, `AMBIGUOUS`, `UNREADABLE`, `RESTRICTED_NOT_PROCESSED`, `INVALID_PROVIDER_OUTPUT`, `DELETED`, and `UNAVAILABLE`. Missing, `null`, redacted and empty are not interchangeable.

Protected values and evidence passages live only in authorized result/evidence stores. Ordinary events, audit and telemetry carry opaque references, types, bands, counts and reason codes. A payload may expose a redacted display while retaining a protected-value reference; it MUST NOT copy the value into `limitations`, errors, provenance or tool traces.

## 4. Capability payload registry

| Capability | Payload ID | Mandatory payload semantics |
|---|---|---|
| Ingestion orchestrator | `ai.ingestion_plan` | Stage contracts/dependencies, eligibility, blocking states, required/optional checkpoints, coverage and safe failures |
| Classifier | `ai.classification_proposal` | Exact selected/ranked profile versions, signal/anchor refs, calibration, alternative disclosure and review reasons |
| Extractor | `ai.extraction_result_set` | `DIT-EXT-001` field occurrences, typed presence/value references, anchors, coverage, calibration and review states |
| Subject resolver | `ai.subject_resolution_proposal` | Candidate refs only when disclosable; `CREATE_NEW`, `LINK_OCCURRENCE`, `RENAME_OR_CORRECT_ATTRIBUTE`, `MERGE`, `SPLIT`, or `REJECT_MATCH` proposal; comparison reasons and evidence per `DIT-FCT-001` |
| Document analyst | `ai.document_analysis` | Typed claims/date/clause/obligation/relationship proposals, exact source versions, limitations and citations |
| Dependency builder | `ai.dependency_edge_proposals` | Typed directed endpoints/revisions, temporal scope, provenance, anchors, graph validation and review |
| Change analyst | `ai.change_analysis` | Ordered base/target, comparison level, changes/no-change-within-scope/indeterminate, two-sided anchors and coverage |
| Applicability analyst | `ai.applicability_proposal` | Rule/source versions, predicate results/unknowns, `APPLICABLE`/`NON_APPLICABLE`/`INDETERMINATE`/`REVIEW_REQUIRED`/`RESTRICTED`/`UNAVAILABLE` per `DIT-MON-001` |
| Impact analyst | `ai.impact_assessment_proposal` | Accepted change/applicability, exact authorized `ImpactPath` values, targets, coverage and one exact `AUTOMATIC_TECHNICAL_UPDATE_POSSIBLE`, `USER_ACTION_REQUIRED`, `EXTERNAL_NOTIFICATION_REQUIRED`, `REVIEW_REQUIRED`, or `NO_ACTION` class; all `DIT-IMP-001` dimensions separate |
| Health analyst | `ai.health_outcome_proposal` | Exact profile/case/applicability; any `MISSING`, `POTENTIALLY_EXPIRED`, `STALE`, `SUPERSEDED`, `CONTRADICTORY`, `INSUFFICIENT`, `RESTRICTED`, or `SOURCE_OR_RULE_UNAVAILABLE` signals; user disposition and exact `DIT-HLT-001` fulfilment state as separate inputs/results, never an AI-set fulfilment or aggregate score |
| Recommendation generator | `ai.recommendation_proposal` | Exact impact class, evidence/path refs, separately named applicability/severity/urgency/confidence/evidence-strength/source-authority/source-health/coverage dimensions, proposed effect, limitations and approval/evidence requirements; no recommendation decision or approval |
| Draft generator | `ai.draft_proposal` | Target/template versions, protected draft ref, field-to-evidence mapping, unresolved fields, preview and effect digest |
| Verifier | `ai.validation_findings` | Candidate/output refs, deterministic/model checks, unsupported claims, policy/evidence/schema findings and pass/review/fail recommendation |
| Search assistant | `ai.cited_answer` | Answer-state, protected rendered-answer ref, material claims, exact citations, conflicts, freshness, coverage and limitations |

### 4.1 Exact domain-owned vocabularies

AI payloads may reference or propose inputs to these states, but the owning aggregate remains authoritative and the model cannot set them:

| Dimension | Exact values |
|---|---|
| Applicability (`DIT-MON-001`) | `APPLICABLE`, `NON_APPLICABLE`, `INDETERMINATE`, `REVIEW_REQUIRED`, `RESTRICTED`, `UNAVAILABLE` |
| Impact primary class (`DIT-IMP-001`) | `AUTOMATIC_TECHNICAL_UPDATE_POSSIBLE`, `USER_ACTION_REQUIRED`, `EXTERNAL_NOTIFICATION_REQUIRED`, `REVIEW_REQUIRED`, `NO_ACTION` |
| Health signal, multi-valued (`DIT-HLT-001`) | `MISSING`, `POTENTIALLY_EXPIRED`, `STALE`, `SUPERSEDED`, `CONTRADICTORY`, `INSUFFICIENT`, `RESTRICTED`, `SOURCE_OR_RULE_UNAVAILABLE` |
| Requirement-case user disposition (`DIT-HLT-001`) | `NO_DISPOSITION`, `EVIDENCE_ADDED`, `ALTERNATIVE_SELECTED`, `WAIVER_REVIEW_REQUESTED`, `NOT_APPLICABLE_SELECTED`, `DISMISSED`, `REMINDER_SET` |
| Requirement fulfilment (`DIT-HLT-001`) | `UNASSESSED`, `UNMET`, `EVIDENCE_PENDING`, `VERIFICATION_REQUIRED`, `FULFILLED_PRIMARY`, `FULFILLED_ALTERNATIVE`, `FULFILLED_BY_APPROVED_EXCEPTION`, `CONFLICTED`, `RESTRICTED`, `EXPIRED_OR_REOPENED` |
| Recommendation decision (`DIT-IMP-001`) | `APPROVE_REQUEST`, `REJECT`, `EDIT`, `DEFER`, `DISMISS`, `NOT_APPLICABLE` |
| Action execution (`DIT-IMP-001`) | `Requested`, `Blocked`, `DispatchPending`, `Dispatched`, `Acknowledged`, `OutcomeUnknown`, `Failed`, `Succeeded`, `PartiallySucceeded`, `ReconciliationPending`, `RepairPending`, `EvidencePending`, `ReversalPending`, `Reversed` |
| Evidence verification (`DIT-IMP-001`) | `VERIFIED`, `REJECTED`, `INSUFFICIENT`, `CONFLICTED`, `RESTRICTED`, `EXPIRED` |

Capitalization follows the owning DIT contracts. An output-schema adapter MAY use a separately versioned wire encoding, but it MUST map losslessly and cannot collapse distinct states.

## 5. Evidence, confidence and effects

### 5.1 Claim object

A material claim contains `claim_id`, stable claim type, protected/rendered text reference, asserted scope, temporal qualifier, materiality, evidence references with support roles, support-validation state, confidence/calibration where applicable, limitation refs and review route. The validator rejects a source-derived material claim without the minimum authorized evidence required by the capability contract.

### 5.2 Confidence object

The object contains `calibration_id`, `calibration_version`, capability/schema/field/type/language/jurisdiction/quality slice, calibrated value or approved band, provider raw score if retained in the restricted provenance store, evaluation dataset version, validation/evidence quality and review reasons. An unmatched slice is `UNCALIBRATED` and routes according to policy; it is not mapped to a generic confidence.

### 5.3 Proposed effect object

`proposed_effects` is an array of inert typed records containing `effect_type`, owning aggregate/capability, target resource and expected revision, exact input/result generation, normalized proposed parameters or protected payload ref, evidence refs, applicable policy, required review/approval, preview digest, effect digest, expiry and idempotency reference. The envelope MUST declare `execution_authority: NONE` for AI-produced effects. Only an owning command handler can translate a validated, reviewed proposal into a new domain transition.

## 6. Synthetic JSON examples

### 6.1 Classification proposal

```json
{
  "contract_id": "ai.result-envelope",
  "contract_version": "1.0.0-draft",
  "payload_schema_id": "ai.classification_proposal",
  "payload_schema_version": "1.0.0-draft",
  "capability_id": "AI-CAP-P1-002",
  "capability_version": "0.1",
  "result_generation_id": "result-synthetic-001",
  "run_id": "run-synthetic-001",
  "workspace_id": "workspace-synthetic-001",
  "correlation_id": "correlation-synthetic-001",
  "causation_id": "ingestion-stage-synthetic-001",
  "idempotency_key_ref": "idempotency-ref-synthetic-001",
  "inputs": [{
    "resource_type": "ArtifactRecord",
    "resource_id": "artifact-synthetic-001",
    "generation": "representation-synthetic-001",
    "digest": "sha256:illustrative-only"
  }],
  "authority": {
    "workload_ref": "workload-classifier",
    "purpose": "DOCUMENT_CLASSIFICATION",
    "authorization_decision_ref": "authz-synthetic-001",
    "policy_version": "policy-draft-1",
    "policy_epoch": "epoch-synthetic-1",
    "deletion_fence_watermark": "fence-synthetic-1",
    "residency_route_ref": "route-unapproved-example"
  },
  "provenance": {
    "adapter_ref": "adapter-provider-neutral",
    "model_ref": "opaque-model-ref",
    "prompt_template_ref": "prompt.classify@0.1",
    "tool_registry_ref": "tools.classify@0.1"
  },
  "status": "REVIEW_REQUIRED",
  "payload": {
    "outcome": "CANDIDATE_PROFILES",
    "ranked_profiles": [{
      "profile_ref": "doctype.coverage.generic_policy@0.1.0-draft",
      "evidence_anchor_refs": ["anchor-synthetic-001"],
      "confidence": {
        "calibration_ref": "calibration.classify.synthetic@0.1",
        "slice": "synthetic/en-AU/clear-scan",
        "calibrated_probability": 0.81,
        "band": "REVIEW"
      }
    }],
    "review_reasons": ["DRAFT_LAUNCH_PROFILE", "CLOSE_ALTERNATIVE"]
  },
  "coverage": {"units_expected": 2, "units_processed": 2, "truncated": false},
  "limitations": [],
  "proposed_effects": [{
    "effect_type": "SELECT_CLASSIFICATION_PROPOSAL",
    "owning_capability": "Evidence and interpretation capability",
    "target_resource_id": "document-analysis-synthetic-001",
    "expected_revision": 3,
    "execution_authority": "NONE",
    "required_review": true
  }],
  "validation": {"schema": "PASS", "evidence": "PASS", "policy": "PASS"},
  "operations": {"attempt": 1, "usage_class": "LOW", "cost_class": "LOW"},
  "example_only": true
}
```

### 6.2 Cited insufficient answer

```json
{
  "contract_id": "ai.result-envelope",
  "contract_version": "1.0.0-draft",
  "payload_schema_id": "ai.cited_answer",
  "payload_schema_version": "1.0.0-draft",
  "capability_id": "AI-CAP-P1-014",
  "capability_version": "0.1",
  "result_generation_id": "result-synthetic-002",
  "run_id": "run-synthetic-002",
  "workspace_id": "workspace-synthetic-001",
  "correlation_id": "correlation-synthetic-002",
  "causation_id": "query-synthetic-digest-002",
  "idempotency_key_ref": "request-ref-synthetic-002",
  "inputs": [{
    "resource_type": "RetrievalSnapshot",
    "resource_id": "retrieval-synthetic-002",
    "generation": "projection-generation-7",
    "digest": "sha256:illustrative-only"
  }],
  "authority": {
    "actor_ref": "actor-synthetic-001",
    "purpose": "WORKSPACE_QUESTION_ANSWERING",
    "authorization_decision_ref": "authz-synthetic-002",
    "policy_version": "policy-draft-1",
    "policy_epoch": "epoch-synthetic-2",
    "deletion_fence_watermark": "fence-synthetic-2",
    "residency_route_ref": "internal-route-synthetic"
  },
  "provenance": {
    "adapter_ref": "adapter-provider-neutral",
    "model_ref": "opaque-model-ref",
    "prompt_template_ref": "prompt.search-answer@0.1",
    "tool_registry_ref": "tools.rag@0.1"
  },
  "status": "DEGRADED",
  "payload": {
    "answer_state": "INSUFFICIENT",
    "rendered_answer_ref": "protected-answer-synthetic-002",
    "claims": [],
    "citations": [],
    "safe_next_steps": ["ADD_OR_REVIEW_REQUIRED_EVIDENCE"]
  },
  "coverage": {"authorized_candidates": 1, "required_evidence_classes_missing": 1},
  "limitations": [{
    "code": "EVIDENCE_GRANULARITY_INSUFFICIENT",
    "scope": "REQUESTED_CLAIM",
    "recoverability": "USER_OR_SOURCE_INPUT_REQUIRED",
    "disclosure_class": "SAFE_GENERIC"
  }],
  "proposed_effects": [],
  "validation": {"schema": "PASS", "claim_support": "PASS_NO_CLAIMS", "policy": "PASS"},
  "operations": {"attempt": 1, "usage_class": "LOW", "cost_class": "LOW"},
  "example_only": true
}
```

### 6.3 Recommendation proposal with no execution authority

```json
{
  "contract_id": "ai.result-envelope",
  "contract_version": "1.0.0-draft",
  "payload_schema_id": "ai.recommendation_proposal",
  "payload_schema_version": "1.0.0-draft",
  "capability_id": "AI-CAP-P1-011",
  "capability_version": "0.1",
  "result_generation_id": "result-synthetic-003",
  "run_id": "run-synthetic-003",
  "workspace_id": "workspace-synthetic-001",
  "correlation_id": "correlation-synthetic-003",
  "causation_id": "impact-synthetic-003",
  "idempotency_key_ref": "idempotency-ref-synthetic-003",
  "inputs": [{
    "resource_type": "ImpactAssessment",
    "resource_id": "impact-synthetic-003",
    "revision": 4,
    "digest": "sha256:illustrative-only"
  }],
  "authority": {
    "workload_ref": "workload-recommendation",
    "purpose": "RECOMMENDATION_DRAFT",
    "authorization_decision_ref": "authz-synthetic-003",
    "policy_version": "policy-draft-1",
    "policy_epoch": "epoch-synthetic-3",
    "deletion_fence_watermark": "fence-synthetic-3",
    "residency_route_ref": "internal-route-synthetic"
  },
  "provenance": {
    "adapter_ref": "adapter-provider-neutral",
    "model_ref": "opaque-model-ref",
    "prompt_template_ref": "prompt.recommend@0.1",
    "tool_registry_ref": "tools.recommend@0.1"
  },
  "status": "REVIEW_REQUIRED",
  "payload": {
    "recommendation_type": "REVIEW_DOCUMENT_CHANGE",
    "impact_class": "REVIEW_REQUIRED",
    "evidence_refs": ["anchor-synthetic-before", "anchor-synthetic-after"],
    "separated_dimensions": {
      "applicability": "APPLICABLE",
      "severity_band": "REVIEW",
      "urgency_band": "UNKNOWN",
      "confidence_band": "REVIEW",
      "evidence_strength_band": "MODERATE",
      "source_authority_tier": "GOVERNED_SECONDARY",
      "source_health": "HEALTHY",
      "coverage": "COMPLETE_WITHIN_DECLARED_SCOPE"
    }
  },
  "coverage": {"impact_paths_evaluated": 1, "truncated": false},
  "limitations": [{"code": "URGENCY_EVIDENCE_MISSING", "scope": "URGENCY", "recoverability": "REVIEW"}],
  "proposed_effects": [{
    "effect_type": "CREATE_RECOMMENDATION_PROPOSAL",
    "owning_capability": "Recommendation, approval, and action workflow",
    "target_resource_id": "recommendation-synthetic-003",
    "expected_revision": 0,
    "effect_digest": "sha256:illustrative-effect-only",
    "execution_authority": "NONE",
    "required_review": true
  }],
  "validation": {"schema": "PASS", "evidence": "PASS", "policy": "PASS"},
  "operations": {"attempt": 1, "usage_class": "LOW", "cost_class": "LOW"},
  "example_only": true
}
```

All examples are synthetic, non-activatable, and deliberately use unapproved draft routes/versions.

## 7. Draft normative rules

- `AI-OUT-P1-001` — Every output MUST identify exact contract, payload schema, capability and immutable versions; unknown/unsupported versions fail closed.
- `AI-OUT-P1-002` — Every household output MUST name one validated workspace and exact authorized input resources/revisions/generations; cross-workspace combinations are rejected before storage or disclosure.
- `AI-OUT-P1-003` — Result generations are immutable; retry, replay, correction, changed prompt/model/tool/schema/policy or review creates additive lineage and never overwrites provider output or prior decisions.
- `AI-OUT-P1-004` — The envelope MUST bind actor/workload, purpose, authorization decision/policy epoch, deletion fence, processing/residency route and consequence-time reauthorization obligation.
- `AI-OUT-P1-005` — Model/provider text, metadata and tool requests cannot populate trusted authority, workspace, policy, grant, approval, execution, citation-integrity or audit fields.
- `AI-OUT-P1-006` — Payload schemas MUST be closed by default, bound depth/size/cardinality/string/number ranges and reject undeclared security- or consequence-relevant fields.
- `AI-OUT-P1-007` — Stable semantic field/type IDs MUST be provider-neutral; provider mappings belong only in versioned adapters.
- `AI-OUT-P1-008` — Missing, null, empty, ambiguous, unreadable, restricted, deleted, unavailable and not-applicable states MUST remain distinct.
- `AI-OUT-P1-009` — Required schema shape MUST NOT fabricate a value, source, confidence, applicability, relationship, effect or success.
- `AI-OUT-P1-010` — Every material source-derived field/claim MUST cite exact validated authorized evidence at the asserted granularity or be marked unsupported/insufficient/restricted.
- `AI-OUT-P1-011` — Evidence objects MUST preserve direct, contextual, qualifying and contradictory roles and exact artifact/document/source representation integrity.
- `AI-OUT-P1-012` — Citation/anchor references MUST be reauthorized on resolution and may become inaccessible after revocation/deletion without being repointed or treated as fabricated.
- `AI-OUT-P1-013` — Confidence MUST reference an approved calibration and matching evaluation slice; unmatched output is `UNCALIBRATED`, not assigned a global score.
- `AI-OUT-P1-014` — Confidence is never authority, evidence, approval, applicability, fact acceptance, requirement fulfilment or correctness proof.
- `AI-OUT-P1-015` — Coverage MUST declare expected/processed/failed/truncated fields, pages, regions, sources, candidates, graph paths or comparison scope applicable to the capability.
- `AI-OUT-P1-016` — Partial success MUST remain explicit; a successful subset cannot imply whole-document, whole-workspace or complete impact/search coverage.
- `AI-OUT-P1-017` — Semantic outcome and execution status MUST be separate; a valid `INDETERMINATE`, `INSUFFICIENT`, `RESTRICTED` or conflicting result is not an execution failure or a positive conclusion.
- `AI-OUT-P1-018` — Every limitation MUST use a registered safe reason code, affected scope, disclosure class and recovery route; raw protected content is prohibited in errors/limitations.
- `AI-OUT-P1-019` — Proposed effects MUST be typed, inert, target/revision/input/effect-digest bound and declare `execution_authority: NONE` for model output.
- `AI-OUT-P1-020` — No output may contain a directly executable domain command, approval, grant, arbitrary fetch, credential, signature, public URL, schema mutation or unbounded tool plan; while `DEC-034` is open it also MUST NOT contain or imply an aggregate readiness/content-health/compliance/risk score or hidden rank.
- `AI-OUT-P1-021` — The owning domain handler MUST independently validate authorization, policy, evidence, review/approval, target revision, idempotency and deletion state before any state transition.
- `AI-OUT-P1-022` — Review decisions MUST bind the exact result generation, claims/evidence and policy; material input/version/effect change invalidates a stale review/approval.
- `AI-OUT-P1-023` — Output provenance MUST identify model/adapter, prompt/template, tools, schemas, configurations, calibration, exact inputs, times, attempts and predecessor lineage without secrets or raw prompt/tool payloads.
- `AI-OUT-P1-024` — Invalid schema, evidence, scope, provenance, policy or prohibited-effect validation MUST reject the generation; automatic repair/retry creates a new attempt and cannot silently edit the rejected output.
- `AI-OUT-P1-025` — Timeout, refusal, provider error, cost limit, cancellation, deletion or partial input MUST yield an explicit status and safe retry/fallback contract, never authoritative emptiness.
- `AI-OUT-P1-026` — Result/audit/event/telemetry schemas MUST segregate protected payloads from safe references; ordinary observability excludes raw content, values, passages, prompts, queries, answers, filenames, URLs, tool payloads, tokens and secrets.
- `AI-OUT-P1-027` — Output storage, projections, conversations, caches and evaluation artifacts MUST retain deletion lineage and current authorization attributes; late output cannot resurrect fenced content.
- `AI-OUT-P1-028` — External processor output MUST retain the approved purpose, data-processing class and route reference and MUST NOT be reused/trained/retained beyond that contract.
- `AI-OUT-P1-029` — Schema and validator publication MUST be versioned, reviewed, approved, tested for backward/forward compatibility, impact-assessed and auditable (`AUD-P1-022`).
- `AI-OUT-P1-030` — Machine-readable schemas and synthetic golden/negative fixtures MUST exist before implementation; examples in this document cannot activate a capability, provider, document type, source or threshold.

## 8. Validation pipeline and negative tests

Validation order is: decode and size limits; closed schema; workspace/input/revision match; registered versions; protected-field segregation; evidence resolution/integrity; authorization and fences; confidence/calibration slice; guardrail and prohibited-effect inspection; capability semantic checks; review route; immutable generation write; and consequence-time domain validation.

Synthetic tests MUST cover wrong workspace/generation, unknown fields, type/cardinality/depth/size abuse, `null` ambiguity, forged/cross-version anchors, hidden evidence, uncalibrated scores, contradictory claims, omitted coverage, tool/command injection, arbitrary URLs, executable effect fields, stale revisions/approvals, retry mutation, provider payload leakage, deletion resurrection and every no-raw-telemetry canary.

## 9. Traceability and decision fences

| Rule range | Primary trace |
|---|---|
| `AI-OUT-P1-001`–`AI-OUT-P1-009` | `REQ-P1-AI-001`, `003`, `006`; `DIT-EXT-P1-001`–`007`, `014`–`018`; `ARCH-P1-003`, `025`–`030` |
| `AI-OUT-P1-010`–`AI-OUT-P1-018` | `REQ-P1-ING-005`, `REQ-P1-SRCH-002`, `004`; `DIT-EXT-P1-008`–`013`, `019`–`024`; `THR-P1-030` |
| `AI-OUT-P1-019`–`AI-OUT-P1-025` | `REQ-P1-AI-002`, `004`–`006`; `SEC-P1-020`–`024`; `AUTH-P1-013`–`014`, `020`; `THR-P1-010`, `015` |
| `AI-OUT-P1-026`–`AI-OUT-P1-030` | `REQ-P1-AI-007`, `REQ-P1-TRUST-003`–`005`, `007`; `PRIV-P1-008`, `011`, `020`; `AUD-P1-014`, `022`, `027` |

`DEC-034` fences every aggregate readiness/content-health/compliance/risk output; `DEC-035` fences launch schemas/calibrations; `DEC-036` blocks ordinary outputs over suspected clinical content; `DEC-039` leaves output/evaluation retention durations unset; and `DEC-040` blocks an unapproved processor/residency route. None is resolved by this contract.
