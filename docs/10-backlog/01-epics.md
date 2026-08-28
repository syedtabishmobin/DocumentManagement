# Phase 1 Vertical Epics

| Field | Value |
|---|---|
| Document ID | `BLG-EPIC-001` |
| Version | `0.1` |
| Status | **DRAFT — proposed sequencing under `DEC-030`; no implementation authorization** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |

## 1. Epic model

Epics group end-to-end outcomes and operational evidence. They do not mirror repository folders, handover headings, technical layers, or teams. A story has one primary epic but may be a prerequisite for later epics. Each epic inherits current authorization, immutable evidence/provenance, privacy-safe telemetry, audit durability, accessibility, retry/repair, migration compatibility, deletion, and residency rules from the owning contracts.

All epics are `DRAFT`. The sequence is contingent on `DEC-030`, the Phase 1 PRD is not an approved implementation baseline, and the mapped `TST-IDX-001` test cases are DRAFT/NOT_RUN rather than completion evidence. Historical `TRACE-GAP-P1-TEST-001` is closed by that catalogue.

## 2. Epic inventory

| Epic | Slice | Outcome | Stories | Primary product trace | State / owner |
|---|---|---|---|---|---|
| `EPIC-P1-001` — Establish an isolated household | `P1-S1` | Create personal/family workspaces while keeping identity, subject, relationship, membership, ownership, role, grant, and resource authority distinct. | `STORY-P1-001`–`003` | `FEAT-P1-001`, `002`; `UC-P1-001`, `013`; `REQ-P1-WS-001`–`005`, `REQ-P1-TRUST-002` | `DRAFT`; Product + Identity/Authorization |
| `EPIC-P1-002` — Capture and preserve evidence safely | `P1-S1` | Accept required routes, isolate unsafe/excluded material, provide durable processing state, and preserve immutable originals/versions. | `STORY-P1-004`–`007` | `FEAT-P1-003`–`005`; `UC-P1-002`; `REQ-P1-DOC-001`, `002`, `004`, `006`, `007`; `REQ-P1-ING-001`–`004` | `DRAFT`; Product + Document Platform |
| `EPIC-P1-003` — Operate a secure configurable foundation | `P1-S1` | Enforce isolation/security, reconstruct consequential activity without content leakage, and activate only validated governed configuration. | `STORY-P1-008`–`010` | `FEAT-P1-006`, `007`; `UC-P1-001`, `013`, `018`, `019`; `REQ-P1-TRUST-001`, `003`, `004`; `REQ-P1-CFG-001`, `005` | `DRAFT`; Security/Privacy + Platform |
| `EPIC-P1-004` — Turn documents into reviewable evidence | `P1-S2` | Manage document lifecycle, extraction, evidence anchors, classification, separated reviews, reprocessing lineage, comparisons, and conformed views. | `STORY-P1-011`–`015`, `026` | `FEAT-P1-008`, `009`, `015`; `UC-P1-003`; `REQ-P1-DOC-003`, `005`, `008`; `REQ-P1-ING-005`–`008` | `DRAFT`; Document Intelligence + UX |
| `EPIC-P1-005` — Resolve facts and dependencies without erasing history | `P1-S2` | Preserve immutable occurrences and bitemporal resolutions, entities, conflicts, field privacy, and typed dependency semantics. | `STORY-P1-016`–`020` | `FEAT-P1-010`–`012`; `UC-P1-004`, `013`; `REQ-P1-FCT-001`–`006`, `REQ-P1-GPH-001`, `002` | `DRAFT`; Domain/Data + Document Intelligence |
| `EPIC-P1-006` — Retrieve and explain authorized knowledge | `P1-S2` | Search, compare, and answer with exact current authorization, citations, limitations, controlled AI, and cost/safety evidence. | `STORY-P1-021`–`025` | `FEAT-P1-013`, `014`; `UC-P1-005`; `REQ-P1-SRCH-001`–`005`, `REQ-P1-AI-001`–`007` | `DRAFT`; Search/AI + Security |
| `EPIC-P1-007` — Detect governed change truthfully | `P1-S3` | Run versioned monitoring strategies over governed observations/sources and establish applicability/change without masking stale or failed coverage. | `STORY-P1-027`–`030` | `FEAT-P1-016`–`018`; `UC-P1-006`; `REQ-P1-MON-001`–`007`, `REQ-P1-GPH-003`–`005` | `DRAFT`; Monitoring + Document Intelligence |
| `EPIC-P1-008` — Move from impact to evidenced closure | `P1-S3` | Produce impact/recommendations, bind approval to exact inputs/effects, execute or reconcile safely, and close only with verified evidence. | `STORY-P1-031`–`033`, `038` | `FEAT-P1-018`, `019`, `023`; `UC-P1-007`; `REQ-P1-ACT-001`–`008`, `REQ-P1-SHR-005` | `DRAFT`; Product Workflow + Security |
| `EPIC-P1-009` — Explain evidence health and coordinate work | `P1-S3`, `P1-S4` | Evaluate expected evidence with item-level findings, manage tasks/in-app notifications, and preserve disabled aggregate/external-channel boundaries. | `STORY-P1-034`–`036`, `042`, `043` | `FEAT-P1-020`, `021`, `027`, `028`; `UC-P1-008`, `010`; `REQ-P1-HLT-001`–`005`, `REQ-P1-NTF-001`–`004` | `DRAFT`; Product + Workflow/UX |
| `EPIC-P1-010` — Publish governed configuration and preserve connector ports | `P1-S3`, `P1-S4` | Validate, approve, activate, supersede, and roll back configuration; preserve consent-aware connector interfaces without enabling undecided adapters. | `STORY-P1-037`, `041` | `FEAT-P1-022`, `026`; `UC-P1-014`, `018`; `REQ-P1-CFG-002`–`004`, `REQ-P1-ING-009`, `REQ-P1-TRUST-009` | `DRAFT`; Configuration Governance + Integration |
| `EPIC-P1-011` — Share and dispose with exact scope | `P1-S4` | Grant/revoke bounded access, manage dependant transition fences, export a declared envelope, and perform deletion as an evidenced case. | `STORY-P1-039`, `040`, `044`, `045` | `FEAT-P1-024`, `025`, `029`; `UC-P1-009`, `011`, `012`, `015`; `REQ-P1-SHR-001`–`004`, `REQ-P1-WS-006`, `007`, `REQ-P1-TRUST-006`, `007` | `DRAFT`; Product + Authorization/Privacy |
| `EPIC-P1-012` — Enforce residency and unavailable safety boundaries | `P1-S4` | Fail closed on ineligible routes and explicitly represent unavailable recovery/continuity instead of inventing unsafe mechanisms. | `STORY-P1-046`–`048` | `FEAT-P1-030`; `UC-P1-016`, `017`; `REQ-P1-TRUST-005`, `008`, plus ordinary continuity boundary from `REQ-P1-SHR-004` | `DRAFT`; Architecture/Security + Product |

## 3. Epic entry/exit evidence

### `EPIC-P1-001` — Establish an isolated household

- **Entry:** approved identity/workspace baseline; authorization vocabulary validated; `DEC-038` recovery stays absent.
- **Exit:** workspace creation is idempotent; one explicit owner exists; subjects need not be identities; negative cross-workspace/resource/field/edge/action cases pass; grants revoke at current policy; audit contains no protected values.
- **Stop-ship:** any ownership ambiguity, existence leak, implicit administrator content access, or stale/revoked derived access.

### `EPIC-P1-002` — Capture and preserve evidence safely

- **Entry:** enabled launch formats/routes and clinical disposition are approved, or tests remain synthetic and the `DEC-035`/`036` branches remain disabled/held.
- **Exit:** upload/camera/manual routes converge on one durable state model; duplicate/reorder/retry cases reconcile; unsafe material cannot reach preview/extraction/search/AI; original integrity and access redemption pass.
- **Stop-ship:** original mutation/loss, ordinary-path clinical or malware escape, cross-workspace artifact access, or false successful processing.

### `EPIC-P1-003` — Operate a secure configurable foundation

- **Entry:** threat/control owners and configuration publication authority identified.
- **Exit:** required audit is durable, telemetry canaries find no content, reference validation rejects dangling/unsafe activation, and security/secret/config failure degrades safely.
- **Stop-ship:** prohibited telemetry, missing required audit, unapproved route/config activation, secret exposure, or support bypass.

### `EPIC-P1-004` — Turn documents into reviewable evidence

- **Entry:** launch schemas/types approved or remain disabled fixtures; evidence identity and immutable-derivative boundaries approved.
- **Exit:** exact anchors resolve; extraction/review/fact/fulfilment/approval states cannot collapse; reprocessing preserves generations; lifecycle and comparison are authorization-safe and accessible.
- **Stop-ship:** fabricated/unresolvable evidence, derived overwrite, silent uncertainty, or lifecycle transition that loses provenance.

### `EPIC-P1-005` — Resolve facts and dependencies without erasing history

- **Entry:** bitemporal and immutable-history ADRs accepted or included in an approved baseline.
- **Exit:** valid/known-time queries reconstruct prior belief; conflict/entity/edge decisions are append-only and evidenced; field/edge access prevents inference; cycles/truncation are explicit.
- **Stop-ship:** history rewrite, unauthorized value/existence/path leak, unsupported canonical promotion, or false complete traversal.

### `EPIC-P1-006` — Retrieve and explain authorized knowledge

- **Entry:** registered AI capabilities, evaluation plan, route eligibility, and cost/privacy controls approved.
- **Exit:** search/Q&A/comparison enforce current authorization before and after work; every material claim has redeemable evidence or is explicitly unsupported; injection/tool/action boundaries and evaluation gates pass.
- **Stop-ship:** fabricated citation, restricted inference, unapproved model/tool/route, silent insufficient evidence, or unaudited consequential effect.

### `EPIC-P1-007` — Detect governed change truthfully

- **Entry:** `DEC-035` launch source/rule pack and processor routes approved for any production claim.
- **Exit:** triggers deduplicate/replay with lineage; source health/current failure remain visible; applicability precedes impact; coverage/freshness/gaps are explicit and accessible.
- **Stop-ship:** failed retrieval interpreted as no change, stale success shown as current, unauthorized observation/path, or coverage claim beyond enabled sources.

### `EPIC-P1-008` — Move from impact to evidenced closure

- **Entry:** exact effect classes, approval authorities, action ports, and reconciliation policies approved; connector action remains disabled under `DEC-031` unless approved.
- **Exit:** recommendation, approval, attempt, outcome, verification, fulfilment, and closure are separate; stale approval/effect digests fail; unknown/partial outcomes reconcile without duplicate effect.
- **Stop-ship:** unapproved effect, duplicate effect, false closure, missing required audit, or evidence/authorization mismatch.

### `EPIC-P1-009` — Explain evidence health and coordinate work

- **Entry:** enabled profiles and in-app notification policy approved; aggregate score stays intentionally absent under `DEC-034`, while external channels remain disabled until the `DEC-037`/`045` activation evidence passes.
- **Exit:** findings disclose profile/evidence/source freshness and alternatives; task and notification state remain separate; accessibility and privacy-safe badge/status behavior pass.
- **Stop-ship:** hidden aggregate score/ranking, unsupported fulfilment, protected badge/notification leak, or external delivery activation.

### `EPIC-P1-010` — Publish governed configuration and preserve connector ports

- **Entry:** configuration approval roles and compatibility policy approved; connector work limited to a disabled port/conformance boundary unless `DEC-031` closes.
- **Exit:** publish/activate/supersede/rollback are versioned and audited; consumers acknowledge compatible versions; connector consent/revocation/deletion/residency negative contracts pass without a live adapter.
- **Stop-ship:** DRAFT seed activation, incompatible publication, unapproved connector call, consent/permission drift, or deletion/residency breach.

### `EPIC-P1-011` — Share and dispose with exact scope

- **Entry:** ordinary grant/export/deletion authority and envelope/state model approved; no automated continuity substitution.
- **Exit:** effective-access previews and revocation races pass; export declares exact categories/limitations; deletion fences all processing and verifies per-class outcomes/residuals without invented duration.
- **Stop-ship:** grant expansion, revoked result redemption, false complete export/deletion, deletion resurrection, or protected affected-party disclosure.

### `EPIC-P1-012` — Enforce residency and unavailable safety boundaries

- **Entry:** route matrix approved for any enabled processor; recovery/continuity features remain absence contracts until their decisions close.
- **Exit:** unknown/ineligible routes fail closed with safe evidence; sign-in failure never exposes workspace existence; recovery and automatic continuity triggers cannot create state/effects.
- **Stop-ship:** unapproved processing/egress/failover, factor/ownership bypass, support disclosure, or automatic continuity release.

## 4. Cross-epic dependency rules

1. `EPIC-P1-001`–`003` are safety prerequisites for every later user-visible route; later epics do not reimplement identity, authorization, audit, or configuration.
2. `EPIC-P1-004` supplies exact evidence/provenance to `EPIC-P1-005`–`009`; derived results never replace immutable inputs.
3. `EPIC-P1-005` supplies facts/edges and coverage semantics to retrieval, monitoring, impact, health, export, and deletion.
4. `EPIC-P1-006` can answer only over authorized outputs created by earlier epics and cannot activate an action.
5. `EPIC-P1-007` creates governed observations/change cases, not approved effects; `EPIC-P1-008` owns approval/action/evidence closure.
6. `EPIC-P1-010` activation gates every configurable behavior and can disable a route without deleting its prior evidence.
7. `EPIC-P1-011`–`012` recheck current authorization, deletion, residency, and decision state at request, execution, result, and redemption boundaries.

No epic is implementation-ready until the shared gaps in `BLG-IDX-001` and its own entry evidence are closed.
