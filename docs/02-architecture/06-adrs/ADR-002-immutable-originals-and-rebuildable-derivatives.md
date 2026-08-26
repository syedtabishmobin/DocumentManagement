# ADR-ARCH-002 — Immutable Originals and Rebuildable Derivatives

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-002` |
| Status | **PROPOSED — not implementation authority** |
| Date | 26 August 2026 |
| Decision scope | Original artifacts, evidence versions, derived results, projections, lineage, rebuild, and purge |
| Decision owners | Architecture and data/document owners |
| Reviewers required | Product, security/privacy, document intelligence/AI, operations, testing |
| Supersedes | None |

## Context

`DEC-005` requires immutable original binaries and versioned logical documents. Extraction, OCR, classification, comparison, search, semantic/vector, graph, readiness, conversation, and analytics outputs will evolve as schemas, parsers, models, rules, and policies change. Treating these derivatives as truth risks evidence mutation, vendor lock-in, stale authorization, and deletion resurrection. Keeping every output forever would conflict with minimization and controlled purge.

## Decision drivers and traceability

- Approved decisions: `DEC-004`–`DEC-009`, `DEC-022`, `DEC-024`.
- Requirements: `REQ-P1-DOC-001`–`008`, `REQ-P1-ING-002`–`008`, `REQ-P1-SRCH-001`–`005`, `REQ-P1-AI-003`, `007`, `REQ-P1-TRUST-003`–`007`.
- Architecture/domain: `ARCH-P1-025`–`032`, `DOM-P1-019`–`025`, `048`–`052`.
- Logical data: `DATA-P1-021`–`030`, `041`–`050` in [`ARCH-DATA-001`](../03-logical-data-model.md).
- Security/privacy/threat: `SEC-P1-012`–`020`, `PRIV-P1-011`–`018`, `AUD-P1-011`, `014`, `020`–`021`, `THR-P1-008`, `012`–`016`, `019`, `022`–`024`.

## Proposed decision

Adopt a logical evidence hierarchy in which accepted originals and exact evidence observations are immutable while all computational derivatives are versioned, lineage-complete, authorization-aware, deletion-aware, and rebuildable from retained authoritative records.

### 1. Put accepted originals once

- `AcquisitionAttempt` records every intake attempt and retry.
- `ArtifactRecord` identifies accepted bytes, immutable digest, media/size, acquisition provenance, isolation state, and lifecycle.
- Acceptance success occurs only after required durability/integrity evidence.
- Reprocessing, preview generation, metadata correction, deduplication, versioning, archive, restore, or export never modifies accepted bytes.
- Equal hashes prove byte equality only; they do not merge logical documents or provenance.

### 2. Version logical documents additively

A `LogicalDocument` is the continuing semantic identity. Each `DocumentVersion` points to one exact accepted or controlled-generated artifact and carries version/effective/supersession/amendment/cancellation lineage. Corrected/replacement content creates another version; prior versions remain addressable until governed purge.

### 3. Make evidence anchors exact and stable

An `EvidenceAnchor` binds exact artifact/document/source-snapshot version and page/passage/coordinates/span under a versioned schema. A new OCR/parser/model result creates a new analysis/anchor when coordinates or interpretation change; old citations never silently repoint.

### 4. Treat analyses and indexes as derivatives

Extraction, OCR text, classification, fields, summaries, comparisons, embeddings, search documents, graph projections, readiness results, conversations, and analytics:

- have stable derived-result/projection identities;
- retain all authoritative inputs/revisions and transformation/model/prompt/tool/schema versions;
- retain confidence, review, active/supersession, build time, policy/configuration, workspace, classification, and deletion-generation data;
- never independently resolve canonical facts, publish rules, authorize output, or prove closure; and
- can be discarded and rebuilt from retained authority plus versioned transforms.

### 5. Use projection generations and watermarks

A rebuild writes a new logical generation, validates lineage/counts/integrity/authorization/deletion/freshness, then performs an atomic or safely versioned cutover. Old generations become inaccessible before purge. Each projection exposes source, policy, configuration, and deletion watermarks plus lag, coverage, transform/schema version, failures, and repair state.

### 6. Keep active-selection decisions explicit

When multiple analyses exist, the active/displayed interpretation is selected by a separate review/resolution/policy decision. Reprocessing alone does not silently replace a reviewed result. A rollback selects an earlier retained compatible derivative without altering either result or the original.

### 7. Govern purge without weakening immutability

Immutability means no in-place change while retained, not permanent retention. An authorized deletion case establishes a fence, purges originals and derivatives by lineage, records per-role acknowledgements/residuals, and leaves only the approved minimized tombstone/audit state. Rebuild, late event, connector resync, backup restore, and support must honor the fence.

## Explicit non-decisions

This ADR does not select:

- object/blob, file, database, search, vector, graph, cache, backup, or archival products;
- physical write-once controls, digest algorithm, encryption/key hierarchy, replication, or storage class;
- OCR, parser, embedding, model, or preview providers;
- content-addressable storage or cross-workspace physical deduplication;
- supported formats/document types or clinical-record disposition;
- retention/purge/backup durations or export envelope; or
- event sourcing or a deployment topology.

## Alternatives considered

| Alternative | Benefit | Why not proposed |
|---|---|---|
| Mutate original/replace file in place | Simple “latest file” model | Violates `DEC-005`, breaks evidence/citation integrity, and hides historical decisions. |
| Store each replacement as an unrelated document | Simple artifact write path | Loses logical version/amendment/supersession semantics and conformed effective views. |
| Treat extracted/indexed data as canonical truth | Faster reads | Couples truth to parser/model/vendor, loses provenance, and enables stale/deleted state to survive. |
| Keep only originals and compute everything on read | Minimal derivative storage | Cannot meet likely latency/monitoring needs and repeatedly exposes content to processing/cost. |
| Preserve every derivative forever | Easy audit/debug | Violates minimization/deletion, increases leakage/cost, and turns caches into shadow records. |
| Update one derivative record in place | Simple current view | Erases processor/model/schema/review history and makes regression/rollback irreproducible. |

## Consequences

### Positive

- Exact evidence remains verifiable across reprocessing and provider change.
- Canonical facts/rules are protected from model/parser churn.
- Search/vector/graph vendors and transform versions remain replaceable.
- Safe rollback, comparison, regression analysis, and deterministic rebuild become possible.
- Deletion coverage can follow explicit lineage across every derivative.

### Costs and risks

- More identities, lineage metadata, generations, and storage are required.
- Rebuild and cutover need capacity, compatibility, and operational controls.
- Evidence anchors may need migration/versioning when renderers or anchor schemas change.
- A lineage omission can cause stale authorization or incomplete purge, so coverage is a safety control.
- Cross-workspace deduplication, if later considered, creates tenancy/key/deletion side channels requiring a separate ADR.

## Validation before acceptance

Acceptance requires tests proving:

1. mutation attempts cannot change accepted original bytes/digest;
2. acquisition retry/dedup preserves each attempt without forced document identity;
3. new version/amendment/supersession retains exact prior version and comparison evidence;
4. every surfaced field/claim/citation resolves to exact evidence and processing versions;
5. two parser/model/schema runs coexist and active selection is explicit;
6. each projection rebuild from retained authority is deterministic within declared transform semantics;
7. generation validation/cutover/rollback never exposes mixed tenant, stale grant, deleted, or partial data;
8. current authorization filters every derivative output;
9. deletion removes originals/derivatives/temporary/export/connector copies by lineage and blocks late rebuild/restore; and
10. backup/restore and provider-portability exercises preserve integrity, IDs, versions, evidence, and tombstones.

## Open-decision fences

- `DEC-033`: export contents remain a versioned declared envelope, not assumed complete.
- `DEC-035`: no enabled format/type/schema/source profile is selected.
- `DEC-036`: suspected clinical content remains isolated; reject/recover/retain disposition is not selected.
- `DEC-039`: no purge, residual, backup-expiry, or audit-minimization duration is selected.
- `DEC-040`: no physical region or external processing route is approved.

## Revisit and supersession triggers

Revisit if approved RPO/RTO, latency, cost, or deletion objectives cannot be met; a selected storage approach lacks required immutability/integrity evidence; evidence-anchor stability proves infeasible; a new derivative cannot be rebuilt; Phase 2 records/hold obligations conflict with purge; or a proposed dedup/encryption architecture changes workspace isolation.

Until explicitly accepted, this ADR does not authorize a storage product, retention policy, or physical immutability mechanism.
