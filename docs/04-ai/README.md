# AI Specification Index

| Field | Value |
|---|---|
| Document ID | `AI-IDX-001` |
| Status | Active navigation aid; linked contracts are build-baseline inputs with release evidence still gated |
| Updated | 30 August 2026 |

## Reading order

1. [`AI-CAP-001` — AI Capability Architecture](01-ai-capability-architecture.md)
2. [`AI-RAG-001` — RAG and Search Architecture](02-rag-and-search-architecture.md)
3. [`AI-OUT-001` — Structured Output Contracts](03-structured-output-contracts.md)
4. [`AI-TOOL-001` — Prompt and Tool Standards](04-prompt-and-tool-standards.md)
5. [`AI-GRD-001` — AI Guardrails](05-ai-guardrails.md)
6. [`AI-EVAL-001` — AI Evaluation Framework](06-ai-evaluation-framework.md)

## Rule ownership

| Namespace | Owner | Coverage |
|---|---|---|
| `AI-CAP-P1-*` | `AI-CAP-001` | Capability registry, allowed inputs/tools/effects, evidence, review, failure, telemetry, and cost |
| `AI-RAG-P1-*` | `AI-RAG-001` | Permission-trimmed retrieval, citations, evidence states, conversations, and deletion/revocation |
| `AI-OUT-P1-*` | `AI-OUT-001` | Versioned envelopes, schemas, validation, provenance, confidence, and state-effect boundaries |
| `AI-TOOL-P1-*` | `AI-TOOL-001` | Prompt provenance, untrusted content, least-privileged tools, idempotency, timeout, and retry |
| `AI-GRD-P1-*` | `AI-GRD-001` | Policy, approval, injection, exfiltration, unsafe advice/action, bulk operations, and stop controls |
| `AI-EVAL-P1-*` | `AI-EVAL-001` | Datasets, adjudication, metrics, provisional gates, regression, drift, red-team, and stop-ship |

## State-effect boundary

Model output is untrusted structured input. It cannot grant authorization, become canonical truth, publish a consequential rule, approve an action, or mutate domain state until schema, evidence, policy, current-authorization, and human-review requirements pass. Azure is the approved managed infrastructure provider under `DEC-049`, while model, OCR, embedding, reranking, and other AI processors remain replaceable behind the registered contracts. Under `DEC-050` and `DEC-055`, authorized plaintext document intelligence and RAG run on the customer device by default; no hosted model receives plaintext by implication. A hosted or external processor route remains unavailable until its exact purpose, consent, data class, region, credentials, retention, evaluation, and conformance evidence are approved and configured. Ordinary telemetry contains no raw document, query, evidence, prompt, tool payload, or generated content.

## Approved boundaries and remaining release gates

The decision fences referenced by the linked contracts are approved product boundaries, not unanswered build-scope questions:

- `DEC-031` keeps inbound email and cloud-document ingestion disabled until an exact provider route is configured and conformed.
- `DEC-032` excludes automated emergency, incapacity, and after-death release from Phase 1.
- `DEC-034` requires item-level findings and prohibits aggregate or hidden readiness/compliance/risk scoring.
- `DEC-035` permits governed synthetic Australian-first fixtures while keeping public launch coverage claims release-gated.
- `DEC-036` requires suspected clinical material to remain in isolated `POLICY_HOLD` outside ordinary AI, OCR, search, graph, sharing, export, and analytics routes.
- `DEC-037` requires in-app notifications; customer-facing external channels remain configuration- and release-gated.
- `DEC-038` keeps account recovery and ownership transfer unavailable until a separate production assurance decision.
- `DEC-039` continues to define the local synthetic deletion profile; production document Trash and purge follow `DEC-053`.
- `DEC-040`'s local outbound-denied boundary is refined by `DEC-049`, `DEC-050`, and `DEC-055`: Azure `dev`/`stage` may use synthetic data, customer content remains client-encrypted, and device-local intelligence is the default.

Exact production model/provider selection, calibration thresholds, dataset and slice sufficiency, latency/cost ceilings, processor eligibility, and public launch claims remain release inputs. An unset gate means disabled, synthetic-only, or review-only behavior; it does not authorize an implementation default or weaken a safety control.
