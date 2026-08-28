# ADR-ARCH-011 — Device-Local RAG Runtime

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-011` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 28 August 2026 |
| Decision scope | Customer-private retrieval, extraction, embeddings, cited answers and optional small language model execution |
| Decision owners | Product owner, architecture, security/privacy, AI assurance, web and mobile engineering |

## Context

`DEC-050` and `ADR-ARCH-008` require originals and sensitive derivatives to be encrypted before network transfer while keeping unwrapped customer content keys unavailable to Doculyra operators and ordinary Azure services. A conventional hosted RAG pipeline would require server-readable passages, embeddings or prompts and would contradict that promise. The product owner has now requested a working per-customer RAG experience while retaining operator-blind document security.

## Decision drivers and traceability

- Decisions: `DEC-008`, `DEC-050`, `DEC-051`, `DEC-052`, `DEC-055`.
- Requirements: `REQ-P1-ING-005`–`008`, `REQ-P1-SRCH-001`–`006`, `REQ-P1-AI-001`–`007`, `REQ-P1-TRUST-001`–`009`.
- AI/security: `AI-CAP-P1-014`, `AI-RAG-P1-001`–`030`, `AI-GRD-P1-001`–`035`, `ADR-ARCH-003`, `ADR-ARCH-008`.

## Decision

### 1. Per-workspace local execution

The default RAG pipeline executes on an authorized customer device after local decryption. Parsing, OCR where supported, chunking, lexical/semantic indexing, retrieval, reranking, answer construction and citation validation MUST remain inside the client trust boundary. Each index, conversation and derived result is scoped to one workspace, purpose, policy epoch and source generation.

### 2. Capability layers

Phase 1 has two replaceable local layers:

1. A mandatory deterministic cited-retrieval layer provides lexical search, bounded extractive answers, explicit insufficient-evidence outcomes and exact source passages without requiring a language model.
2. An optional packaged small-language-model layer may turn already validated claims into clearer prose. It cannot expand retrieval scope, create unsupported claims, invoke external actions or omit citations.

The application MUST truthfully identify which layer produced an answer. Absence or incompatibility of a local SLM degrades to deterministic cited retrieval, never to an undeclared cloud model.

### 3. Model and embedding manifests

An exact model is activated only through a versioned manifest recording source, immutable digest, licence, architecture, quantization, runtime, supported device classes, memory/storage budget, benchmark and safety results. Model files MAY be downloaded or bundled, but document content, queries, prompts, embeddings and outputs MUST NOT be sent to the model distributor.

The React client uses an isolated worker/runtime with an approved local model cache. Flutter uses an isolated Dart/native runtime with platform key-store protection. Both clients share language-neutral chunk, envelope, citation and evaluation fixtures.

### 4. Encrypted synchronization

Sensitive chunks, embeddings, graph projections, extracted fields, answer history and model state are encrypted by the customer client before optional synchronization. Azure stores opaque ciphertext plus the minimum authorized routing/version metadata. Unencrypted in-memory working data is released promptly and never enters ordinary telemetry, crash reports or browser/server logs.

### 5. Retrieval and answer authority

Current authorization is enforced before retrieval and again before citation release. Document instructions are untrusted data. Every material answer claim requires exact authorized evidence, and the client returns an explicit `INSUFFICIENT`, `RESTRICTED`, `STALE`, `CONFLICTING` or `UNAVAILABLE` result when the evidence contract cannot pass. Model output never becomes an approved fact or consequential action.

## Explicit non-decisions

This ADR does not select or approve an Azure OpenAI, OpenAI API or other hosted plaintext-processing route. It does not yet select the exact packaged SLM or embedding model; selection requires the manifest and cross-device evaluation above. It does not claim that every document format can be locally OCRed on every supported device.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| Hosted multi-tenant RAG | Powerful models and central operations | Requires plaintext or decryptable derivatives in the service and breaks the operator-blind promise. |
| Per-customer hosted vector database | Strong cloud retrieval | Still exposes plaintext-derived embeddings and increases tenant-isolation and deletion risk. |
| No retrieval until a local LLM is selected | Small initial scope | Unnecessarily withholds safe deterministic cited answers already supported by the contracts. |
| Undeclared cloud fallback | Higher apparent availability | Violates consent, residency, encryption and truthful-degradation requirements. |

## Consequences

- Customers keep the strongest content-confidentiality boundary and RAG state remains per workspace.
- Initial downloads, memory use, battery use and capability vary by device; the UI must disclose support and progress.
- Server-side support cannot inspect or debug customer passages.
- Cross-client evaluation and encrypted-index synchronization become release-critical capabilities.
- A future private-compute route requires its own ADR, consent, attestation, key-release and residency evidence.

## Validation before release

1. Network inspection proves that documents, passages, queries, embeddings, prompts and answers remain on the device.
2. Cross-workspace, revoked-grant, deletion-fence, stale-index and prompt-injection negative tests pass.
3. Every released claim resolves to an exact authorized citation or an explicit limitation state.
4. Web, iOS and Android model/runtime manifests pass licence, digest, memory, latency, quality and device-compatibility gates.
5. Encrypted synchronized derivatives are tamper-detected and become inaccessible after key destruction.

## Open-decision fences

Until an exact SLM and embedding manifest passes evaluation, production uses the deterministic cited-retrieval layer and labels it accordingly. No hosted plaintext-processing route is enabled.

## Revisit and supersession triggers

Revisit after representative device benchmarks, a separately proposed confidential-compute route, material browser/mobile runtime changes, model licence or supply-chain changes, unacceptable accessibility/performance results, or cryptographic design review.
