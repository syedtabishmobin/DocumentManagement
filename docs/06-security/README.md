# Security Specification Index

| Field | Value |
|---|---|
| Document ID | `SEC-IDX-001` |
| Status | Active navigation aid; all linked contracts remain DRAFT |
| Updated | 26 August 2026 |

## Reading order

1. [`SEC-ARCH-001` — Security Architecture](01-security-architecture.md)
2. [`SEC-AUTH-001` — Authorization Model](02-authorization-model.md)
3. [`SEC-PRIV-001` — Privacy and Data Governance](03-privacy-and-data-governance.md)
4. [`SEC-AUD-001` — Audit and Provenance](04-audit-and-provenance.md)
5. [`SEC-THR-001` — Threat Model](05-threat-model.md)

## Rule ownership

| Namespace | Owner | Coverage |
|---|---|---|
| `SEC-P1-*` | `SEC-ARCH-001` | Trust boundaries, identity/session, isolation, encryption, files, adapters, operations, residency, and response |
| `AUTH-P1-*` | `SEC-AUTH-001` | Deny-first resource, field, edge, retrieval, inference, action, export, audit, support, and projection authorization |
| `PRIV-P1-*` | `SEC-PRIV-001` | Classification, purpose, consent, processing, residency, retention, export, deletion, backup, and user control |
| `AUD-P1-*` | `SEC-AUD-001` | Immutable audit events, provenance, coverage, integrity, access, retention, redaction, and verification |
| `THR-P1-*` | `SEC-THR-001` | STRIDE, privacy, AI, abuse, and availability threats, mitigations, detection/tests, and residual risk |

## Approval boundary

These controls remain draft and cannot close `DEC-032`, `DEC-036`, `DEC-039`, or `DEC-040`, and cannot override approved `DEC-038`, which keeps account/workspace recovery and ownership transfer unavailable in Phase 1. A provider's default security claim is not evidence that a control is satisfied. Each implementation slice requires threat-model updates, negative authorization tests, privacy review, and recorded control evidence.
