# ADR-ARCH-008 — Customer-Controlled Client Encryption

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-008` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 28 August 2026 |
| Decision scope | Operator-blind document encryption, device/workspace/document keys, sharing, recovery, derivatives, and local intelligence |
| Decision owners | Product owner, architecture, security/privacy, document intelligence, and mobile/web engineering |
| Supersedes | Server-readable production processing assumptions where they conflict with `DEC-050` |

## Context

The product owner requires every document and sensitive derivative to be readable only by the customer and explicitly authorized people. Azure encryption at rest protects media and infrastructure but does not make the application operator cryptographically unable to inspect content. `DEC-050` therefore requires client-side encryption before network transfer in addition to Azure platform encryption.

## Decision drivers and traceability

- Decisions: `DEC-003`, `DEC-005`, `DEC-008`, `DEC-036`, `DEC-050`, `DEC-051`, `DEC-053`.
- Requirements: `REQ-P1-ING-001`–`009`, `REQ-P1-SRCH-001`–`006`, `REQ-P1-AI-001`–`007`, `REQ-P1-TRUST-001`–`009`.
- Architecture/security: `ADR-ARCH-002`–`003`, `SEC-ARCH-001`, `SEC-THR-001`, `PRIV-DATA-001`.

## Decision

### 1. Versioned cryptographic envelope

Each immutable document version is encrypted on the client with a new random 256-bit data-encryption key using AES-256-GCM and a unique nonce. The authenticated envelope includes a version, algorithm suite, opaque object identifier, ciphertext digest, length, and non-sensitive routing fields. Envelopes support algorithm migration; unknown or retired suites fail closed.

Cryptographic primitives come from platform APIs or maintained, independently reviewed libraries. Doculyra does not implement AES, public-key arithmetic, random-number generation, password hashing, or signature primitives.

### 2. Key hierarchy

- A device creates a device key pair protected by Apple Keychain/Secure Enclave, Android hardware-backed Keystore, or the approved web key store.
- Each workspace has a random workspace key-encryption key.
- Each document version has an independent data-encryption key.
- Document keys are wrapped by the workspace key; the workspace key is separately wrapped to each authorized account/device or approved recovery factor.
- The service stores ciphertext, public keys, wrapped key envelopes, versions, grant metadata, and content-minimized routing data. It never receives an unwrapped document or workspace key.

Passkeys authenticate an account; they are not silently reused as document encryption keys.

### 3. Sharing and revocation

An authorized client grants access by wrapping the required workspace/document key material to the recipient's registered public key after current policy approval. Revocation immediately blocks server retrieval and rotates affected future key material. The product must disclose that it cannot erase plaintext or screenshots already exported by a previously authorized recipient.

### 4. Recovery

Vault recovery uses an offline customer recovery secret, an existing authorized device, or an approved trusted-member ceremony. Support and operators cannot create a replacement decryption path. Losing every authorized device, recovery secret, and trusted recovery route can make the vault permanently inaccessible; onboarding must make that consequence explicit and verify recovery setup.

Account authentication recovery and vault-key recovery remain separate. Neither may transfer workspace ownership or bypass current grants.

### 5. Intelligence and derivatives

Preview, parsing, OCR, extraction, classification, local search, relationship construction, and cited question answering run on the authorized client for the default private route. Sensitive extracted facts, thumbnails, indexes, embeddings, graph labels, conversations, and model state are encrypted before synchronization. The server may coordinate jobs and store opaque versions but cannot inspect their content.

An optional server-side private-compute route requires a later ADR, explicit per-purpose consent, attestation/key-release evidence, residency approval, and a truthful statement that it differs from pure client-only processing.

### 6. Defense in depth

TLS protects transport; Azure Storage encryption protects media; private networking, managed identities, authorization, audit, and tenant isolation remain mandatory. Client-side encryption does not replace those controls and does not conceal ciphertext size, timing, account membership, or the minimal metadata needed to operate the service.

## Explicit non-decisions

This ADR does not claim protection from a compromised authorized device, malicious authorized recipient, customer-chosen weak recovery storage, traffic analysis, or future cryptanalytic breakthroughs. It does not approve a cloud OCR/AI route.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| Azure platform encryption only | Full server-side functionality | Operators/application services can obtain plaintext; fails the product promise. |
| Azure customer-managed storage key only | Customer lifecycle control over a storage key | Azure services still decrypt for authorized application operations and it does not provide per-household sharing. |
| One global application content key | Simple processing | Catastrophic blast radius and no customer/operator separation. |
| Custom cryptographic primitives | Tailored implementation | Unacceptable security and verification risk. |

## Consequences

- A database/storage compromise does not directly reveal document content.
- Cloud OCR, full-text search, malware inspection, and AI cannot inspect plaintext by default.
- Device synchronization, family sharing, recovery, rotation, and encrypted-index conflict handling become material product capabilities.
- Support cannot recover a vault without a customer-controlled route.

## Validation before release

1. Published envelope/key protocol and test vectors pass across web, iOS, and Android.
2. Known-answer, nonce-uniqueness, tamper, truncation, wrong-key, replay, downgrade, rotation, grant, revoke, recovery, and crypto-shred tests pass.
3. Network and storage inspection proves no plaintext original, sensitive derivative, unwrapped key, recovery secret, or content-bearing log leaves the client.
4. Independent cryptographic design review and mobile/web penetration testing complete before public production.
5. Client compromise and lost-recovery residual risks are disclosed in product UX and support policy.

## Open-decision fences

No server-side OCR, AI, scanning, preview, support-content access, or plaintext analytics adapter is eligible without a separately approved route. Missing local capability results in an explicit unsupported/degraded outcome, not a cloud fallback.

## Revisit and supersession triggers

Revisit after cryptographic review, material platform API change, multi-device recovery failure, enterprise-managed-key requirements, a confidential-compute proposal, or evidence that an approved algorithm/library no longer meets policy.
