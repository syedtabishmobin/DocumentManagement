# Phase 1 Backlog Traceability Matrix

| Field | Value |
|---|---|
| Document ID | `BLG-TRACE-001` |
| Version | `0.1` |
| Status | **DRAFT — static specification coverage, not implementation evidence** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |

## 1. Purpose and authority legend

This matrix shows which backlog candidate carries each Phase 1 requirement, feature, use case, and downstream contract boundary. Coverage means “a DRAFT story references the source”; it does not mean approved, implemented, tested, released, or launch-enabled.

| Label | Meaning |
|---|---|
| `APPROVED CONSTRAINT` | `DEC-001`–`011`, `DEC-020`–`024`; normative for every story. |
| `DRAFT` | Product requirements/catalogues, architecture, DIT, AI, API/event, security, UX, engineering, operations, reference-data pack, backlog, and their acceptance/evidence plans require approval. |
| `PROPOSED` | `DEC-030`, `DEC-033`, `DEC-034`, `DEC-037`; recommended but not implementation authority. All five ADRs are also `PROPOSED`. |
| `OPEN` | `DEC-031`, `032`, `035`, `036`, `038`, `039`, `040`; no safe default may be inferred. |
| `DISABLED / CATALOGUE-ONLY` | Contract shape or absence boundary is documented, but the user capability is not implementation-ready or enabled. |
| `MISSING` | Required owning contract/evidence does not exist; a named `TRACE-GAP-P1-*` must close before readiness. |

## 2. Static coverage summary

| Namespace | Source total | Backlog-covered | Static orphan count | Qualification |
|---|---:|---:|---:|---|
| `REQ-P1-*` | 90 | 90 | 0 | Every requirement is named by at least one story; all requirements and stories remain DRAFT. |
| `FEAT-P1-*` | 30 | 30 | 0 | Every feature is assigned to a vertical story group; conditional features retain decision fences. |
| `UC-P1-*` | 19 | 19 | 0 | `UC-P1-001`–`013` have detailed flows; `UC-P1-014`–`019` are catalogue-only and counted separately, not implementation-ready. |
| `EPIC-P1-*` | 12 | 12 | 0 | Each story has one primary epic. |
| `STORY-P1-*` | 48 | 48 | 0 | Each has state, owner, upstream/downstream traces, migration/repair, negative/failure/audit evidence, two ACs, and a future-test gap. |
| `AC-STORY-P1-*` | 96 | 96 | 0 | Exactly two ACs per story; none has an implementation `TEST-P1-*` mapping yet. |
| `TEST-UNIT/CON/AI/SEC/E2E/PERF/DR-P1-*` | 90 | 90 referenced by 48/48 stories | 0 static | Historical `TRACE-GAP-P1-TEST-001` is closed. All cases and evidence remain DRAFT/NOT_RUN/INSUFFICIENT until executed against an approved candidate; `ENG-TST-P1-*` and `AI-EVAL-P1-*` remain owning standards, not substitutes. |

The static comparison is reproducible with stable-ID extraction from the product and backlog artifacts. It does not evaluate semantic sufficiency or contract approval.

## 3. Requirement and feature coverage

Each row lists every requirement owned by the feature; no ellipsis implies omitted IDs.

| Feature | Exact requirements | Primary stories | Use cases | Authority / fence |
|---|---|---|---|---|
| `FEAT-P1-001` | `REQ-P1-WS-001`, `REQ-P1-WS-002`, `REQ-P1-WS-003` | `STORY-P1-001`, `002` | `UC-P1-001` | `DRAFT`; sequence `DEC-030` proposed |
| `FEAT-P1-002` | `REQ-P1-WS-004`, `REQ-P1-WS-005`, `REQ-P1-TRUST-002` | `STORY-P1-003` | `UC-P1-001`, `013` | `DRAFT`; approved `DEC-003`, `008`, `022` constrain it |
| `FEAT-P1-003` | `REQ-P1-DOC-001`, `REQ-P1-DOC-002`, `REQ-P1-DOC-004` | `STORY-P1-007` | `UC-P1-002`, `003` | `DRAFT`; approved `DEC-005` constraint |
| `FEAT-P1-004` | `REQ-P1-DOC-006`, `REQ-P1-ING-001`, `REQ-P1-ING-002`, `REQ-P1-ING-004` | `STORY-P1-004`, `006` | `UC-P1-002` | Required routes DRAFT; connector expansion `DEC-031` open; launch formats `DEC-035` open |
| `FEAT-P1-005` | `REQ-P1-DOC-007`, `REQ-P1-ING-003` | `STORY-P1-005` | `UC-P1-002` | Clinical exclusion approved by `DEC-024`; final disposition `DEC-036` open |
| `FEAT-P1-006` | `REQ-P1-TRUST-001`, `REQ-P1-TRUST-003`, `REQ-P1-TRUST-004` | `STORY-P1-008`, `009` | `UC-P1-001`, `013`, `019` | `DRAFT`; `UC-P1-019` catalogue-only; recovery `DEC-038` open |
| `FEAT-P1-007` | `REQ-P1-CFG-001`, `REQ-P1-CFG-005` | `STORY-P1-010` | `UC-P1-001`, `018` | DRAFT inert foundation; `UC-P1-018` catalogue-only; launch pack `DEC-035` open |
| `FEAT-P1-008` | `REQ-P1-DOC-003`, `REQ-P1-DOC-005` | `STORY-P1-011` | `UC-P1-003`, `012` | `DRAFT`; purge timing `DEC-039` open |
| `FEAT-P1-009` | `REQ-P1-ING-005`, `REQ-P1-ING-006`, `REQ-P1-ING-007`, `REQ-P1-ING-008` | `STORY-P1-012`–`015` | `UC-P1-002`–`004`, `012` | `DRAFT`; API gaps `API-001`–`003`; launch schemas `DEC-035` open |
| `FEAT-P1-010` | `REQ-P1-FCT-001`, `REQ-P1-FCT-002`, `REQ-P1-FCT-003`, `REQ-P1-FCT-004`, `REQ-P1-FCT-005` | `STORY-P1-016`–`018` | `UC-P1-003`, `004` | `DRAFT`; `ADR-ARCH-001` proposed; `TRACE-GAP-P1-REF-001` |
| `FEAT-P1-011` | `REQ-P1-FCT-006` | `STORY-P1-019` | `UC-P1-004`, `005`, `008`, `013` | `DRAFT`; zero-tolerance non-disclosure; `TRACE-GAP-P1-REF-001` |
| `FEAT-P1-012` | `REQ-P1-GPH-001`, `REQ-P1-GPH-002` | `STORY-P1-020` | `UC-P1-004`, `005`, `013` | `DRAFT`; `TRACE-GAP-P1-API-005` |
| `FEAT-P1-013` | `REQ-P1-SRCH-001`, `REQ-P1-SRCH-002`, `REQ-P1-SRCH-003`, `REQ-P1-SRCH-004`, `REQ-P1-SRCH-005` | `STORY-P1-021`–`023` | `UC-P1-003`, `005`, `013` | `DRAFT`; current authorization/citation integrity zero tolerance |
| `FEAT-P1-014` | `REQ-P1-AI-001`, `REQ-P1-AI-002`, `REQ-P1-AI-003`, `REQ-P1-AI-004`, `REQ-P1-AI-005`, `REQ-P1-AI-006`, `REQ-P1-AI-007` | `STORY-P1-024`, `025` | `UC-P1-002`, `004`, `005`, `007` | `DRAFT`; provider/route/cost/evaluation approval absent; `TRACE-GAP-P1-API-006` |
| `FEAT-P1-015` | `REQ-P1-DOC-008` | `STORY-P1-026` | `UC-P1-003`, `006` | `DRAFT`; `TRACE-GAP-P1-API-007` |
| `FEAT-P1-016` | `REQ-P1-MON-001`, `REQ-P1-MON-002` | `STORY-P1-027` | `UC-P1-006` | `DRAFT`; source/rule launch pack `DEC-035` open |
| `FEAT-P1-017` | `REQ-P1-MON-003`, `REQ-P1-MON-004`, `REQ-P1-MON-005`, `REQ-P1-MON-007` | `STORY-P1-028` | `UC-P1-006` | DRAFT/configuration-dependent; `DEC-035` open |
| `FEAT-P1-018` | `REQ-P1-MON-006`, `REQ-P1-GPH-003`, `REQ-P1-GPH-004`, `REQ-P1-GPH-005`, `REQ-P1-ACT-001`, `REQ-P1-ACT-002`, `REQ-P1-ACT-003`, `REQ-P1-ACT-004` | `STORY-P1-029`–`031` | `UC-P1-004`, `006`–`008` | `DRAFT`; `TRACE-GAP-P1-API-008` |
| `FEAT-P1-019` | `REQ-P1-ACT-005`, `REQ-P1-ACT-006`, `REQ-P1-ACT-007`, `REQ-P1-ACT-008` | `STORY-P1-032`, `033` | `UC-P1-004`, `007` | `DRAFT`; external connector effects `DEC-031` open; `TRACE-GAP-P1-API-009` |
| `FEAT-P1-020` | `REQ-P1-HLT-001`, `REQ-P1-HLT-002`, `REQ-P1-HLT-003`, `REQ-P1-HLT-005` | `STORY-P1-034`, `035` | `UC-P1-008` | DRAFT; profiles `DEC-035` open; `TRACE-GAP-P1-API-010` |
| `FEAT-P1-021` | `REQ-P1-NTF-001`, `REQ-P1-NTF-002`, `REQ-P1-NTF-003` | `STORY-P1-036` | `UC-P1-007`, `008`, `010` | DRAFT in-app baseline |
| `FEAT-P1-022` | `REQ-P1-CFG-002`, `REQ-P1-CFG-003`, `REQ-P1-CFG-004` | `STORY-P1-037` | `UC-P1-018` | `UC-P1-018` catalogue-only; `TRACE-GAP-P1-API-011`; activation `DEC-035` open |
| `FEAT-P1-023` | `REQ-P1-SHR-005` | `STORY-P1-038` | `UC-P1-007`, `010`, `013` | `DRAFT`; `TRACE-GAP-P1-API-012` |
| `FEAT-P1-024` | `REQ-P1-SHR-001`, `REQ-P1-SHR-002`, `REQ-P1-SHR-003`, `REQ-P1-WS-006` | `STORY-P1-039` | `UC-P1-009`, `011`, `013` | `DRAFT`; ordinary grants only, not continuity |
| `FEAT-P1-025` | `REQ-P1-SHR-004`, `REQ-P1-WS-007` | `STORY-P1-040`, `048` | `UC-P1-015`, `016` | Both catalogue-only; dependant policy/API gaps; automatic release `DEC-032` open |
| `FEAT-P1-026` | `REQ-P1-ING-009`, `REQ-P1-TRUST-009` | `STORY-P1-041` | `UC-P1-014` | `BLOCKED`; `DEC-031`, `040`; API ops disabled; event/reference gaps |
| `FEAT-P1-027` | `REQ-P1-NTF-004` | `STORY-P1-042` | `UC-P1-010` | In-app DRAFT; external channel `DEC-037` proposed/unapproved and `DEC-040` open |
| `FEAT-P1-028` | `REQ-P1-HLT-004` | `STORY-P1-043` | `UC-P1-008` | Aggregate score `BLOCKED`; `DEC-034` proposed/unapproved; intentional event/reference absence |
| `FEAT-P1-029` | `REQ-P1-TRUST-006`, `REQ-P1-TRUST-007` | `STORY-P1-044`, `045` | `UC-P1-011`, `012` | Export envelope `DEC-033` proposed; deletion timing `DEC-039` open; routes `DEC-040` open |
| `FEAT-P1-030` | `REQ-P1-TRUST-005`, `REQ-P1-TRUST-008` | `STORY-P1-046`, `047` | `UC-P1-011`–`013`, `017` | Residency/recovery `BLOCKED`; `DEC-038`, `040`; `UC-P1-017` catalogue-only |

This table accounts for all 90 distinct requirement IDs exactly once under their owning feature. A requirement may appear in additional prerequisite or negative-boundary stories without changing its owner.

## 4. Use-case coverage and readiness

| Use case | Story coverage | Product state | Blocking gap/decision |
|---|---|---|---|
| `UC-P1-001` | `STORY-P1-001`–`003`, `008`, `010` | `DRAFT — detailed` | PRD/contracts approval; `DEC-030`, `035`, `038`, `040` as applicable |
| `UC-P1-002` | `STORY-P1-004`–`007`, `013`, `015`, `025` | `DRAFT — detailed` | `DEC-031`, `035`, `036`, `040` |
| `UC-P1-003` | `STORY-P1-007`, `011`, `012`, `014`–`016`, `023`, `026` | `DRAFT — detailed` | API gaps for review/reprocess/conformed view; `DEC-039` |
| `UC-P1-004` | `STORY-P1-012`, `014`, `016`–`018`, `025`, `031`, `032` | `DRAFT — detailed` | fact-definition/API gaps; proposed temporal ADR |
| `UC-P1-005` | `STORY-P1-019`–`025` | `DRAFT — detailed` | AI route/evaluation/target approvals; graph/API gaps |
| `UC-P1-006` | `STORY-P1-026`–`030` | `DRAFT — detailed` | `DEC-035`, `040`; conformed/change API gaps |
| `UC-P1-007` | `STORY-P1-025`, `029`–`033`, `036`, `038` | `DRAFT — detailed` | action closure API gap; connector effect `DEC-031` |
| `UC-P1-008` | `STORY-P1-019`, `031`, `034`, `035`, `043` | `DRAFT — detailed` | profiles/API gap; score `DEC-034` remains disabled |
| `UC-P1-009` | `STORY-P1-039` | `DRAFT — detailed` | ordinary explicit grants only; `DEC-032` no automatic release |
| `UC-P1-010` | `STORY-P1-036`, `038`, `042` | `DRAFT — detailed` | external channel `DEC-037`/`040`; event gap |
| `UC-P1-011` | `STORY-P1-039`, `044`, `046` | `DRAFT — detailed` | `DEC-033`, `040` |
| `UC-P1-012` | `STORY-P1-011`, `015`, `045` | `DRAFT — detailed` | `DEC-039`, `040`; no duration invented |
| `UC-P1-013` | `STORY-P1-003`, `008`, `009`, `019`–`021`, `039`, `046` | `DRAFT — detailed` | zero-tolerance negative authorization; `DEC-040` |
| `UC-P1-014` | `STORY-P1-041` | `CATALOGUE-ONLY / BLOCKED` | `TRACE-GAP-P1-UC-001`; `DEC-031`, `040`; event/reference gaps |
| `UC-P1-015` | `STORY-P1-040` | `CATALOGUE-ONLY` | `TRACE-GAP-P1-UC-001`; dependant policy/API gaps |
| `UC-P1-016` | `STORY-P1-048` | `CATALOGUE-ONLY / BLOCKED` | `TRACE-GAP-P1-UC-001`; `DEC-032`; intentional event/reference absence |
| `UC-P1-017` | `STORY-P1-047` | `CATALOGUE-ONLY / BLOCKED` | `TRACE-GAP-P1-UC-001`; `DEC-038`; intentional event/reference absence |
| `UC-P1-018` | `STORY-P1-010`, `037` | `CATALOGUE-ONLY` | `TRACE-GAP-P1-UC-001`; configuration-publication API gap; `DEC-035` |
| `UC-P1-019` | `STORY-P1-009` | `CATALOGUE-ONLY` | `TRACE-GAP-P1-UC-001`; detailed audit-view/admin product AC absent |

## 5. Downstream contract trace by story cluster

The exact rule IDs for each story are in `BLG-STORY-001`; this table provides the inverse navigation and makes gaps visible.

| Story cluster | Architecture/domain/data | UX | API/event | Security/privacy/audit/threat | DIT/AI/reference | Quality/operations | Gap state |
|---|---|---|---|---|---|---|---|
| `001`–`003` | `ARCH-P1-003`, `006`–`012`; `DOM-P1-001`–`018`; `DATA-P1-001`–`010`; `WSP-P1-001`–`032` | Workspace/member flows/screens; `A11Y-P1-001`–`056` applicable | `API-P1-101`–`115`; `EVT-P1-001`–`005` | Exact `AUTH/SEC/PRIV/AUD/THR` rows in each story | Access-control/jurisdiction/purpose records; AI cannot provide authority | `ENG-TST-P1-001`–`042`; `OPS-*` owning controls | Test/approval/target gaps |
| `004`–`010` | `ARCH-P1-013`–`032`; `DOM-P1-019`–`025`, `048`–`055`; `DATA-P1-021`–`030`, `041`–`050` | Capture/containment/evidence/auth plus accessible degraded states | `API-P1-116`–`130`, `176`; `EVT-P1-006`–`009`, `029`, `031` | Ingestion/custody/session/audit threat clusters | `DIT-TAX`, `DIT-ING`, `DIT-VER`; all reference packs inert | Contract, resilience, migration, a11y, config, telemetry gates | UC019/config API; `DEC-035`, `036`, `038`, `040` |
| `011`–`015`, `026` | Document/evidence aggregate and derived-generation contracts | Review/evidence/diff/conformed flows; `A11Y-P1-038`–`042` | Adjacent doc/evidence APIs/events; named API gaps | Current field/evidence auth, immutable provenance, deletion | `DIT-EXT`, `DIT-VER`; taxonomy/schema/capability versions | DIT evaluation, compatibility, rebuild/cutover | `API-001`–`003`, `007`; `DEC-035`, `039`, `040` |
| `016`–`019` | `DOM-P1-026`–`033`; `DATA-P1-011`–`020`; proposed `ADR-ARCH-001` | Facts/conflicts/private evidence flows | `API-P1-133`–`138`; `EVT-P1-012`, `013`; entity API gap | Field/value/existence negative matrix, audit history | `DIT-FCT`; **fact-definition catalogue missing** | Temporal/property/migration/rebuild/privacy tests required | `TRACE-GAP-P1-REF-001`, `API-004`, TEST |
| `020`, `030` | Graph aggregate/projection contracts | Linear/list equivalent required by `A11Y-P1-041` | Impact APIs; `EVT-P1-014`, `020`; graph CRUD/query API gap | Edge/path/count/layout non-disclosure | `DIT-GPH`, `DIT-IMP`; dependency records | Cycle/fanout/rebuild/auth/performance tests | `TRACE-GAP-P1-API-005` |
| `021`–`025` | Search/AI ports, projection/current-auth, route constraints | Search/Q&A/evidence/limitation flows | `API-P1-127`–`143`; no generic public AI API/event | Retrieval/inference/injection/egress/cost threat clusters | `AI-CAP/RAG/OUT/TOOL/GRD/EVAL`; AI/reference state records | AI evaluation, a11y, cost, resilience, route evidence | `TRACE-GAP-P1-API-006`; targets/routes unapproved |
| `027`–`029` | Monitor/source/change aggregates and temporal/event contracts | Source-health/change/applicability flows | `API-P1-144`–`152`; `EVT-P1-015`–`019`; change API gap | Source/SSRF/stale/route/non-disclosure controls | `DIT-MON`, `DIT-SRC`; monitoring/source records disabled | Replay/source/parser/stale/coverage/a11y/ops tests | `DEC-035`, `040`; `API-008` |
| `031`–`033`, `038` | Recommendation/approval/action/evidence aggregates | Consequence/approval/action/minimal-disclosure flows | `API-P1-153`–`161`; `EVT-P1-020`–`024`; evidence-closure/minimal API gaps | Bound approval, separation, unknown effect, disclosure | `DIT-IMP`; AI proposals inert; action/evidence states | Action race/reconcile/evidence/audit/a11y tests | `API-009`, `012`; connector effect `DEC-031` |
| `034`–`036`, `042`, `043` | Requirement/task/notification projection contracts | Health/task/notification flows and score absence | `API-P1-162`–`169`, disabled `183`; `EVT-P1-025`, `026`; event/API gaps | Finding/task/cause/privacy/current-auth controls | `DIT-HLT`; requirement/notification states; no score record | State-separation/a11y/delivery/absence tests | `API-010`; `EVT-002`; `DEC-034`, `035`, `037`, `040` |
| `037` | Configuration publication/activation/compatibility contracts | No Phase 1 admin console; safe enabled-coverage state | `EVT-P1-031`; no publication API | Privileged separation/config injection/audit | All owner publication rules; all packs DRAFT/disabled | Reference/config/compatibility/rollback/replay gates | UC catalogue-only; `API-011`; `DEC-035` |
| `039`, `040`, `048` | Workspace/grant/dependant/continuity fences | Sharing/dependant/continuity flows | Grant API/events; transition/continuity gaps | Delegation, revocation, dependant/private resource, false trigger | Access-control records; dependant/continuity records absent | Grant race/a11y/absence/abuse tests | UC/API/EVT/REF gaps; `DEC-032` |
| `041` | Connector ports and consent/residency/deletion contract | Unavailable settings boundary only | Disabled `API-P1-177`–`180`; no connector events | Connector token/scope/drift/replay/deletion/route threats | `CON-P1-001`–`035`; no connector records | Provider-neutral adapter conformance after decisions | `DEC-031`, `040`; UC/EVT/REF gaps |
| `044`, `045` | Export/deletion cases, fence/tombstone/purge/restore | Export/deletion critical flows | `API-P1-170`–`175`; `EVT-P1-027`–`030`, `011` | Export/deletion/resurrection/retention/residency controls | All owning DIT/AI deletion; no invented timing | Fidelity, per-class purge, restore/resurrection, a11y | `DEC-033`, `039`, `040` |
| `046`, `047` | Route/residency and recovery absence contracts | Safe blocked/recovery-unavailable states | Cross-cut route rules; disabled `API-P1-181`; no recovery event | Residency/egress/support/recovery takeover controls | Processor matrix/recovery records absent | Placement/restore/failover and route/state absence tests | `DEC-038`, `040`; API/EVT/REF gaps |

## 6. API/event availability and orphan report

| Contract set | Current state | Backlog treatment |
|---|---|---|
| `API-P1-101`–`120`, `122`–`148`, `153`–`168`, `176` | DRAFT representative operations | Mapped to stories; enabled only after the owning product/decision/configuration/gate approves. |
| `API-P1-121` | `DISABLED_POLICY_PENDING` under `DEC-036` | `STORY-P1-005`; no clinical disposition inferred. |
| `API-P1-149`–`152` | `CONFIGURATION_DEPENDENT_NO_LAUNCH_PACK` | `STORY-P1-028`; no source coverage while `DEC-035` open. |
| `API-P1-169` | Disabled external channel | `STORY-P1-042`; `DEC-037`, `040`. |
| `API-P1-170`–`175` | Decision-fenced export/deletion | `STORY-P1-044`, `045`; `DEC-033`, `039`, `040`. |
| `API-P1-177`–`180` | Disabled connectors | `STORY-P1-041`; `DEC-031`, `040`. |
| `API-P1-181` | Disabled recovery | `STORY-P1-047`; `DEC-038`. |
| `API-P1-182` | Disabled continuity | `STORY-P1-048`; `DEC-032`. |
| `API-P1-183` | Disabled readiness score | `STORY-P1-043`; `DEC-034`; `EVT-P1-032` is not a readiness event. |
| `EVT-P1-001`–`032` | DRAFT event catalogue | All existing types have at least one story trace; missing connector/notification/recovery/continuity families are explicit gaps or intentional absences. |

Existing API/event IDs are not statically orphaned. The named operation/event gaps in `BLG-IDX-001` are semantic surface omissions or intentional disabled boundaries; they must be resolved by the owning contracts, not invented in the backlog.

## 7. Reference-data coverage and orphan report

All 12 schema/catalogue files and current 415 stable reference IDs pass the reference-data validator. Runtime-affecting seeds remain DRAFT/disabled/synthetic and `.invalid` endpoints do not establish launch coverage.

| Area | Existing coverage | Gap/decision |
|---|---|---|
| Identity/access/purpose/privacy | `access-control.json`, `common.json`, `jurisdictions.json` | Product/security approval still required. |
| Formats/types/extraction/evidence | `document-types.json`, `extraction-schemas.json`, ingestion/review states | Launch selection `DEC-035`; clinical disposition `DEC-036`. |
| Facts/entities | Presence/evidence/value support only | `TRACE-GAP-P1-REF-001`: canonical fact definitions missing. |
| Dependencies | Exact `node-type.*` and `edge-type.*` records | DRAFT activation; graph API gap. |
| AI | Exact capability/tool/state records | Model/provider/route/cost/evaluation approval absent. |
| Monitoring/sources | Synthetic rules/source/coverage/endpoint/parser records | DRAFT/disabled/`.invalid`; `DEC-035`, `040`. |
| Health | Synthetic requirement profile/options/alternative/waiver/fulfilment and exact states | `DEC-035`; API gap; no score record by design under `DEC-034`. |
| Notifications | `channel.IN_APP`, disabled `EMAIL`/`PUSH`, synthetic templates | `DEC-037`, `040`; event gap. |
| Connectors | None | `TRACE-GAP-P1-REF-002`; `DEC-031`, `040`. |
| Dependant transition | None | `TRACE-GAP-P1-REF-003`; catalogue-only use case. |
| Residency matrix | Jurisdiction identity only | `TRACE-GAP-P1-REF-005`; `DEC-040`. |
| Recovery/continuity | None | `TRACE-GAP-P1-REF-006`; intentional while `DEC-038`/`032` open. |

No existing reference record is an implementation orphan: all packs are used by at least one story or provide shared controlled vocabularies. “Used” remains static DRAFT traceability, not activation.

## 8. Test, accessibility, NFR, and operational evidence gaps

- `TRACE-GAP-P1-TEST-001` is **CLOSED**: `TST-IDX-001` version `0.1` defines 90 stable cases and 48/48 stories reference exact applicable IDs. The cases are DRAFT and no execution result is implied.
- `TRACE-GAP-P1-A11Y-001`: `A11Y-P1-001`–`056` is referenced across every applicable story, but product/specialist approval, pinned browser/assistive-technology versions, disabled-user evidence, implementation test IDs, and a release conformance report are absent.
- `TRACE-GAP-P1-TARGET-001`: applicable `NFR-P1-001`–`045` targets are referenced and retain `PROVISIONAL`/zero-tolerance labels. No story converts them into an SLA or approves the launch workload/capacity/cost envelope.
- `ENG-TST-P1-001`–`042`, `OPS-CICD-P1-001`–`030`, `OPS-DEP-P1-001`–`032`, `OPS-DR-P1-001`–`032`, and `OPS-OBS-P1-001`–`032` define future evidence but are not execution results.
- `TRACE-GAP-P1-APPROVAL-001`: all packs/ADRs/backlog require accountable approval; no static link can close it.

## 9. Decision impact matrix

| Decision | State | Affected stories | Readiness consequence |
|---|---|---|---|
| `DEC-001`–`011`, `020`–`024` | `APPROVED` | All as applicable | Normative constraints; cannot be weakened by backlog. |
| `DEC-030` | `PROPOSED` | All | Slice/order/release plan remains DRAFT. |
| `DEC-031` | `OPEN` | `004`, `033`, `041` | Only upload/camera/manual required; connector ingestion/action disabled. |
| `DEC-032` | `OPEN` | `039`, `040`, `048` | Ordinary grants/export remain separate; automatic continuity disabled. |
| `DEC-033` | `PROPOSED` | `044` | Export declares exact enabled envelope; no completeness claim. |
| `DEC-034` | `PROPOSED` | `034`, `035`, `043` | Item-level findings only; aggregate/hidden score disabled. |
| `DEC-035` | `OPEN` | `004`, `010`, `013`, `027`, `028`, `034`, `037` | No launch type/schema/profile/source/coverage activation or claim. |
| `DEC-036` | `OPEN` | `005` | Ordinary processing blocked; no disposition/timing promise. |
| `DEC-037` | `PROPOSED` | `036`, `042` | In-app state proposed; external channels disabled. |
| `DEC-038` | `OPEN` | `001`, `008`, `040`, `047` | No recovery/factor/ownership/private-resource/support bypass. |
| `DEC-039` | `OPEN` | `007`, `009`, `011`, `044`, `045` | No deletion/backup/audit timing; exact state/residual evidence only. |
| `DEC-040` | `OPEN` | Every processor route; especially `005`, `013`, `015`, `022`, `024`, `025`, `027`, `028`, `033`, `041`, `042`, `044`–`046` | Unknown/ineligible processing/support/telemetry/export/backup/failover route blocks. |

## 10. Current orphan and drift findings

| Finding | Classification | Disposition |
|---|---|---|
| No uncovered `REQ-P1-*`, `FEAT-P1-*`, `UC-P1-*`, epic, story, or story AC | Static coverage result | Re-run on every product/backlog change; semantic review still required. |
| `UC-P1-014`–`019` lack detailed implementation-grade product AC | Product orphan/gap | `TRACE-GAP-P1-UC-001`; keep stories disabled/absence-only. |
| Named API/event semantic surface gaps | Contract gaps | `TRACE-GAP-P1-API-001`–`014`, `EVT-001`–`003`; resolve in API/event owners before story readiness. |
| Fact, connector, dependant, residency, recovery/continuity reference records absent | Reference gaps/intentional fences | `TRACE-GAP-P1-REF-001`–`006`; do not invent defaults. |
| No backlog story lacks stable test IDs; 48/48 are mapped | Closed historical test-trace gap | `TRACE-GAP-P1-TEST-001` closed by `TST-IDX-001` v0.1. Execution/evidence remains DRAFT/NOT_RUN/INSUFFICIENT, and the test trace validator must still prove all 96 story ACs plus negative/failure/race/migration/a11y/evaluation obligations. |
| Root `TRACEABILITY.md`, `SPECIFICATION-READINESS.md`, and repository navigation reflect all current draft packs | Closed governance/navigation drift | `TRACE-GAP-P1-GOV-001` closed 26 August 2026; reopen on detected drift. |

## 11. Change-control rule

Any changed requirement, feature, use case, decision, API/event/schema/reference record, security/privacy/audit/threat rule, NFR, DIT/AI contract, UX/A11Y rule, migration/operations contract, or future test must update the affected story and this matrix in the same governed change. A story may become `READY` only after its named gaps close and the `CODEX.md` readiness gate is explicitly satisfied; this DRAFT matrix provides no implementation authorization.
