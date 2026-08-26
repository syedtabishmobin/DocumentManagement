# AI Specification Index

| Field | Value |
|---|---|
| Document ID | `AI-IDX-001` |
| Status | Active navigation aid; all linked contracts remain DRAFT |
| Updated | 26 August 2026 |

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

Model output is untrusted structured input. It cannot grant authorization, become canonical truth, publish a consequential rule, approve an action, or mutate domain state until schema, evidence, policy, current-authorization, and human-review requirements pass. Provider choice remains deferred, and ordinary telemetry contains no raw document, query, evidence, prompt, or generated content.
