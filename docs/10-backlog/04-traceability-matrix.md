# Phase 1 Backlog Traceability Matrix

| Field | Value |
|---|---|
| Document ID | `BLG-TRACE-001` |
| Version | `0.3` |
| Status | **APPROVED BUILD-BASELINE TRACE — exact-candidate independent review PASS** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 30 August 2026 |

## 1. Purpose and authority legend

This matrix shows which backlog item carries each Phase 1 requirement, feature, use case, and downstream contract boundary. Coverage means that a story references the source; it does not mean that the story is complete, tested, released, or launch-enabled. Current delivery evidence is recorded in [`BLG-STATUS-001`](05-personal-family-implementation-status.md).

| Label | Meaning |
|---|---|
| `APPROVED CONSTRAINT` | Applicable `DEC-001`–`055` entries and accepted ADRs are normative for every story. |
| `DRAFT` | A specialist contract or target still needs accountable review or execution evidence; draft status does not revoke the approved Phase 1 implementation baseline. |
| `APPROVED` | `DEC-030`–`055` define the Phase 1 dev/stage implementation baseline, selected architecture, and production/provider fences. |
| `RELEASE GATED` | Implementation may proceed inside the approved abstraction, but live-provider activation, real-customer-data processing, or production release requires the named evidence. |
| `INTENTIONALLY UNAVAILABLE` | A detailed negative product contract is baselined; the unsafe capability remains absent and must be proved non-activatable. |
| `MISSING` | Required owning contract/evidence does not exist; a named `TRACE-GAP-P1-*` must close before readiness. |

## 2. Static coverage summary

| Namespace | Source total | Backlog-covered | Static orphan count | Qualification |
|---|---:|---:|---:|---|
| `REQ-P1-*` | 101 | 101 | 0 | Every requirement is named by at least one story; the approved baseline is not evidence of story completion. |
| `FEAT-P1-*` | 31 | 31 | 0 | Every feature is assigned to a vertical story group; conditional features retain activation/release fences. |
| `UC-P1-*` | 20 | 20 | 0 | `UC-P1-001`–`020` have detailed flows and testable product acceptance scenarios. |
| `EPIC-P1-*` | 12 | 12 | 0 | Each story has one primary epic. |
| `STORY-P1-*` | 49 | 49 | 0 | Each has state, owner, upstream/downstream traces, migration/repair, negative/failure/audit evidence, two ACs, and exact future tests. |
| `AC-STORY-P1-*` | 98 | 98 | 0 | Exactly two ACs per story; all are covered by stable test IDs, but passing evidence is incomplete. |
| `TEST-UNIT/CON/AI/SEC/E2E/PERF/DR-P1-*` | 104 | 104 referenced by 49/49 stories | 0 static | All product tests have forward and reverse ownership. Twenty-three source-test files are separately mapped in `implementation-evidence.v1.json`; execution remains delivery evidence. |

The static comparison is reproducible with stable-ID extraction from the product and backlog artifacts. It does not evaluate semantic sufficiency or contract approval.

## 3. Requirement and feature coverage

Each row lists the requirements traced to the feature. Cross-cutting security, platform, deletion, operations, and assurance requirements may intentionally appear under more than one feature.

| Feature | Exact requirements | Primary stories | Use cases | Authority / fence |
|---|---|---|---|---|
| `FEAT-P1-001` | `REQ-P1-WS-001`, `REQ-P1-WS-002`, `REQ-P1-WS-003` | `STORY-P1-001`, `002` | `UC-P1-001` | Approved continuous Phase 1 sequence under `DEC-030`/`041`/`054`; completion evidence pending |
| `FEAT-P1-002` | `REQ-P1-WS-004`, `REQ-P1-WS-005`, `REQ-P1-TRUST-002` | `STORY-P1-003` | `UC-P1-001`, `013` | `DRAFT`; approved `DEC-003`, `008`, `022` constrain it |
| `FEAT-P1-003` | `REQ-P1-DOC-001`, `REQ-P1-DOC-002`, `REQ-P1-DOC-004`, `REQ-P1-CRYPTO-001` | `STORY-P1-007` | `UC-P1-002`, `003` | Immutable originals and client-controlled document encryption required; full evidence pending |
| `FEAT-P1-004` | `REQ-P1-DOC-006`, `REQ-P1-ING-001`, `REQ-P1-ING-002`, `REQ-P1-ING-004`, `REQ-P1-PLT-001` | `STORY-P1-004`, `006` | `UC-P1-002` | Upload/camera/manual required; provider adapters may be built disabled-first; public format claims release-gated |
| `FEAT-P1-005` | `REQ-P1-DOC-007`, `REQ-P1-ING-003` | `STORY-P1-005` | `UC-P1-002` | Suspected clinical material follows approved `POLICY_HOLD` behavior under `DEC-036` |
| `FEAT-P1-006` | `REQ-P1-TRUST-001`, `REQ-P1-TRUST-003`, `REQ-P1-TRUST-004`, `REQ-P1-CRYPTO-002`, `REQ-P1-OPS-002`, `REQ-P1-ASSURE-001` | `STORY-P1-008`, `009` | `UC-P1-001`, `013`, `019` | Audit/assurance and two-layer key boundaries required; recovery and ownership transfer intentionally unavailable under `DEC-038` |
| `FEAT-P1-007` | `REQ-P1-CFG-001`, `REQ-P1-CFG-005`, `REQ-P1-PLT-002` | `STORY-P1-010` | `UC-P1-001`, `018` | Synthetic dev configuration approved; public launch pack and publication UI remain release/delivery gaps |
| `FEAT-P1-008` | `REQ-P1-DOC-003`, `REQ-P1-DOC-005`, `REQ-P1-DEL-001` | `STORY-P1-011` | `UC-P1-003`, `012` | `DEC-053` requires immediate fencing, 30-day Trash, restore, then coordinated purge |
| `FEAT-P1-009` | `REQ-P1-ING-005`, `REQ-P1-ING-006`, `REQ-P1-ING-007`, `REQ-P1-ING-008`, `REQ-P1-CRYPTO-003` | `STORY-P1-012`–`015` | `UC-P1-002`–`004`, `012` | API gaps `API-001`–`003`; encrypted derived-data handling required; public schemas release-gated |
| `FEAT-P1-010` | `REQ-P1-FCT-001`, `REQ-P1-FCT-002`, `REQ-P1-FCT-003`, `REQ-P1-FCT-004`, `REQ-P1-FCT-005` | `STORY-P1-016`–`018` | `UC-P1-003`, `004` | `DRAFT`; `ADR-ARCH-001` proposed; `TRACE-GAP-P1-REF-001` |
| `FEAT-P1-011` | `REQ-P1-FCT-006` | `STORY-P1-019` | `UC-P1-004`, `005`, `008`, `013` | `DRAFT`; zero-tolerance non-disclosure; `TRACE-GAP-P1-REF-001` |
| `FEAT-P1-012` | `REQ-P1-GPH-001`, `REQ-P1-GPH-002` | `STORY-P1-020` | `UC-P1-004`, `005`, `013` | `DRAFT`; `TRACE-GAP-P1-API-005` |
| `FEAT-P1-013` | `REQ-P1-SRCH-001`, `REQ-P1-SRCH-002`, `REQ-P1-SRCH-003`, `REQ-P1-SRCH-004`, `REQ-P1-SRCH-005` | `STORY-P1-021`–`023` | `UC-P1-003`, `005`, `013` | `DRAFT`; current authorization/citation integrity zero tolerance |
| `FEAT-P1-014` | `REQ-P1-AI-001`, `REQ-P1-AI-002`, `REQ-P1-AI-003`, `REQ-P1-AI-004`, `REQ-P1-AI-005`, `REQ-P1-AI-006`, `REQ-P1-AI-007` | `STORY-P1-024`, `025` | `UC-P1-002`, `004`, `005`, `007` | `DRAFT`; provider/route/cost/evaluation approval absent; `TRACE-GAP-P1-API-006` |
| `FEAT-P1-015` | `REQ-P1-DOC-008` | `STORY-P1-026` | `UC-P1-003`, `006` | `DRAFT`; `TRACE-GAP-P1-API-007` |
| `FEAT-P1-016` | `REQ-P1-MON-001`, `REQ-P1-MON-002` | `STORY-P1-027` | `UC-P1-006` | Synthetic dev sources permitted; public source/rule pack release-gated |
| `FEAT-P1-017` | `REQ-P1-MON-003`, `REQ-P1-MON-004`, `REQ-P1-MON-005`, `REQ-P1-MON-007` | `STORY-P1-028` | `UC-P1-006` | Configuration-dependent; public monitoring coverage release-gated |
| `FEAT-P1-018` | `REQ-P1-MON-006`, `REQ-P1-GPH-003`, `REQ-P1-GPH-004`, `REQ-P1-GPH-005`, `REQ-P1-ACT-001`, `REQ-P1-ACT-002`, `REQ-P1-ACT-003`, `REQ-P1-ACT-004` | `STORY-P1-029`–`031` | `UC-P1-004`, `006`–`008` | `DRAFT`; `TRACE-GAP-P1-API-008` |
| `FEAT-P1-019` | `REQ-P1-ACT-005`, `REQ-P1-ACT-006`, `REQ-P1-ACT-007`, `REQ-P1-ACT-008` | `STORY-P1-032`, `033` | `UC-P1-004`, `007` | External effects are activation-gated; evidence-closure API gap remains |
| `FEAT-P1-020` | `REQ-P1-HLT-001`, `REQ-P1-HLT-002`, `REQ-P1-HLT-003`, `REQ-P1-HLT-005` | `STORY-P1-034`, `035` | `UC-P1-008` | Synthetic dev profiles permitted; public profiles release-gated; API gap remains |
| `FEAT-P1-021` | `REQ-P1-NTF-001`, `REQ-P1-NTF-002`, `REQ-P1-NTF-003` | `STORY-P1-036` | `UC-P1-007`, `008`, `010` | DRAFT in-app baseline |
| `FEAT-P1-022` | `REQ-P1-CFG-002`, `REQ-P1-CFG-003`, `REQ-P1-CFG-004` | `STORY-P1-037` | `UC-P1-018` | Detailed product AC exists; publication API and public activation evidence remain delivery work |
| `FEAT-P1-023` | `REQ-P1-SHR-005` | `STORY-P1-038` | `UC-P1-007`, `010`, `013` | `DRAFT`; `TRACE-GAP-P1-API-012` |
| `FEAT-P1-024` | `REQ-P1-SHR-001`, `REQ-P1-SHR-002`, `REQ-P1-SHR-003`, `REQ-P1-WS-006`, `REQ-P1-CRYPTO-002` | `STORY-P1-039` | `UC-P1-009`, `011`, `013` | Ordinary grants only; authorization and key-envelope scope must remain aligned |
| `FEAT-P1-025` | `REQ-P1-SHR-004`, `REQ-P1-WS-007` | `STORY-P1-040`, `048` | `UC-P1-015`, `016` | `DEC-P1-056` approves the fail-closed dependant fence with richer transfer deferred; `DEC-032` excludes automatic continuity release |
| `FEAT-P1-026` | `REQ-P1-ING-009`, `REQ-P1-TRUST-009` | `STORY-P1-041` | `UC-P1-014` | Provider adapters may be implemented disabled-first; live activation and event/reference coverage remain gated |
| `FEAT-P1-027` | `REQ-P1-NTF-004` | `STORY-P1-042` | `UC-P1-010` | In-app required; email/SMS adapters may be implemented but live delivery remains activation-gated |
| `FEAT-P1-028` | `REQ-P1-HLT-004` | `STORY-P1-043` | `UC-P1-008` | Aggregate and hidden scoring intentionally unavailable under approved `DEC-034` |
| `FEAT-P1-029` | `REQ-P1-TRUST-006`, `REQ-P1-TRUST-007`, `REQ-P1-DEL-001`, `REQ-P1-DEL-002` | `STORY-P1-044`, `045` | `UC-P1-011`, `012` | Approved export envelope, `DEC-053` Trash/purge lifecycle, and `DEC-049` routes apply |
| `FEAT-P1-030` | `REQ-P1-TRUST-005`, `REQ-P1-TRUST-008`, `REQ-P1-OPS-001` | `STORY-P1-046`, `047` | `UC-P1-011`–`013`, `017` | Azure Australian route baseline approved; recovery remains intentionally unavailable |
| `FEAT-P1-031` | `REQ-P1-PLT-003` | `STORY-P1-049` | `UC-P1-020` | React public product/trust/legal/account-entry surface is approved for synthetic dev/stage; production content, legal approval, DNS and launch remain gated. |

This table covers all 101 distinct requirement IDs. Cross-cutting requirements may appear under multiple affected features; source coverage is counted by distinct ID, not by table-cell occurrence.

## 4. Use-case coverage and readiness

| Use case | Story coverage | Product state | Blocking gap/decision |
|---|---|---|---|
| `UC-P1-001` | `STORY-P1-001`–`003`, `008`, `010` | `APPROVED BASELINE — detailed` | Runtime completion, assurance, and release evidence pending; no recovery bypass |
| `UC-P1-002` | `STORY-P1-004`–`007`, `013`, `015`, `025` | `APPROVED BASELINE — detailed` | Required local routes plus approved policy/route fences; provider activation remains gated |
| `UC-P1-003` | `STORY-P1-007`, `011`, `012`, `014`–`016`, `023`, `026` | `APPROVED BASELINE — detailed` | API gaps for review/reprocess/conformed view; `DEC-053` deletion lifecycle applies |
| `UC-P1-004` | `STORY-P1-012`, `014`, `016`–`018`, `025`, `031`, `032` | `APPROVED BASELINE — detailed` | Fact-definition/API gaps and accepted temporal architecture implementation remain |
| `UC-P1-005` | `STORY-P1-019`–`025` | `DRAFT — detailed` | AI route/evaluation/target approvals; graph/API gaps |
| `UC-P1-006` | `STORY-P1-026`–`030` | `APPROVED BASELINE — detailed` | Public source coverage is release-gated; conformed/change API gaps remain |
| `UC-P1-007` | `STORY-P1-025`, `029`–`033`, `036`, `038` | `APPROVED BASELINE — detailed` | Action-closure API gap; external connector effects remain activation-gated |
| `UC-P1-008` | `STORY-P1-019`, `031`, `034`, `035`, `043` | `APPROVED BASELINE — detailed` | Profiles/API gap; aggregate score intentionally unavailable under `DEC-034` |
| `UC-P1-009` | `STORY-P1-039` | `DRAFT — detailed` | ordinary explicit grants only; `DEC-032` no automatic release |
| `UC-P1-010` | `STORY-P1-036`, `038`, `042` | `APPROVED BASELINE — detailed` | External delivery activation and event coverage remain gated |
| `UC-P1-011` | `STORY-P1-039`, `044`, `046` | `APPROVED BASELINE — detailed` | Approved export and Australian route policies require implementation evidence |
| `UC-P1-012` | `STORY-P1-011`, `015`, `045` | `APPROVED BASELINE — detailed` | `DEC-053` Trash/restore/purge contract requires full implementation evidence |
| `UC-P1-013` | `STORY-P1-003`, `008`, `009`, `019`–`021`, `039`, `046` | `APPROVED BASELINE — detailed` | Zero-tolerance negative authorization and eligible-route evidence required |
| `UC-P1-014` | `STORY-P1-041` | `APPROVED BASELINE — detailed / RELEASE GATED` | Live activation and provider event/reference coverage remain gated |
| `UC-P1-015` | `STORY-P1-040` | `APPROVED BASELINE — detailed fail-closed fence` | `DEC-P1-056`; independent-transfer API/reference semantics intentionally absent until later governed change |
| `UC-P1-016` | `STORY-P1-048` | `APPROVED BASELINE — detailed / INTENTIONALLY UNAVAILABLE` | Automatic continuity excluded by `DEC-032` |
| `UC-P1-017` | `STORY-P1-047` | `APPROVED BASELINE — detailed / INTENTIONALLY UNAVAILABLE` | Recovery/ownership transfer excluded by `DEC-038` |
| `UC-P1-018` | `STORY-P1-010`, `037` | `APPROVED BASELINE — detailed` | Configuration-publication API and public activation evidence remain delivery work |
| `UC-P1-019` | `STORY-P1-009` | `APPROVED BASELINE — detailed` | Runtime audit-view/admin implementation and evidence remain delivery work |
| `UC-P1-020` | `STORY-P1-049` | `APPROVED BASELINE — detailed / RELEASE GATED` | Synthetic React public surface exists; production legal/content/DNS/launch evidence remains gated |

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
| `037` | Configuration publication/activation/compatibility contracts | No Phase 1 admin console; safe enabled-coverage state | `EVT-P1-031`; no publication API | Privileged separation/config injection/audit | All owner publication rules; all packs DRAFT/disabled | Reference/config/compatibility/rollback/replay gates | Detailed UC; `API-011`; `DEC-035` |
| `039`, `040`, `048` | Workspace/grant/dependant/continuity fences | Sharing/dependant/continuity flows | Grant API/events; transition endpoint intentionally absent; continuity disabled | Delegation, revocation, dependant/private resource, false trigger | Access-control records; richer dependant/continuity records intentionally absent | Grant race/a11y/fail-closed transition/absence/abuse tests | `DEC-P1-056`; `DEC-032`; future transfer requires change control |
| `041` | Connector ports and consent/residency/deletion contract | Unavailable settings boundary only | Disabled `API-P1-177`–`180`; no connector events | Connector token/scope/drift/replay/deletion/route threats | `CON-P1-001`–`035`; no connector records | Provider-neutral adapter conformance after decisions | `DEC-031`, `040`; UC/EVT/REF gaps |
| `044`, `045` | Export/deletion cases, fence/tombstone/purge/restore | Export/deletion critical flows | `API-P1-170`–`175`; `EVT-P1-027`–`030`, `011` | Export/deletion/resurrection/retention/residency controls | All owning DIT/AI deletion; no invented timing | Fidelity, per-class purge, restore/resurrection, a11y | `DEC-033`, `039`, `040` |
| `046`, `047` | Route/residency and recovery absence contracts | Safe blocked/recovery-unavailable states | Cross-cut route rules; disabled `API-P1-181`; no recovery event | Residency/egress/support/recovery takeover controls | Processor matrix/recovery records absent | Placement/restore/failover and route/state absence tests | `DEC-038`, `040`; API/EVT/REF gaps |
| `049` | Public product/trust/legal/account-entry contract | `UX-FLOW-P1-031`; `UX-SCR-P1-046`, `047`; React-only public surfaces | Existing web routes/components; no product API required | Public copy minimisation, no fabricated legal/launch assurance, accessible navigation | No AI authority or content processing | `TEST-CON-P1-015`, `TEST-SEC-P1-020`, `TEST-E2E-P1-024` | Production legal/content/DNS/launch release gates |

## 6. API/event availability and orphan report

| Contract set | Current state | Backlog treatment |
|---|---|---|
| `API-P1-101`–`120`, `122`–`148`, `153`–`168`, `176` | DRAFT representative operations | Mapped to stories; enabled only after the owning product/decision/configuration/gate approves. |
| `API-P1-121` | `DISABLED_POLICY_PENDING` under `DEC-036` | `STORY-P1-005`; no clinical disposition inferred. |
| `API-P1-149`–`152` | `CONFIGURATION_DEPENDENT_NO_LAUNCH_PACK` | `STORY-P1-028`; synthetic dev sources allowed, public coverage release-gated. |
| `API-P1-169` | Disabled external channel | `STORY-P1-042`; adapter implementation allowed, live delivery activation-gated. |
| `API-P1-170`–`175` | Approved export/deletion contract | `STORY-P1-044`, `045`; `DEC-033`, `049`, and `053` apply. |
| `API-P1-177`–`180` | Disabled connectors | `STORY-P1-041`; adapter implementation allowed, live provider activation-gated. |
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
| Monitoring/sources | Synthetic rules/source/coverage/endpoint/parser records | Approved for dev fixtures; disabled/`.invalid`; public coverage release-gated. |
| Health | Synthetic requirement profile/options/alternative/waiver/fulfilment and exact states | Dev fixtures approved; API gap; no score record by design under `DEC-034`. |
| Notifications | `channel.IN_APP`, disabled `EMAIL`/`PUSH`, synthetic templates | In-app required; external channels activation-gated; event gap. |
| Connectors | None | `TRACE-GAP-P1-REF-002`; adapters may be built disabled-first, live activation gated. |
| Dependant transition | Phase 1 default-deny/action records plus revisioned fail-closed attempt contract | `TRACE-GAP-P1-REF-003` resolved as intentional absence by `DEC-P1-056`; richer policy catalogue is a later governed capability. |
| Residency matrix | Jurisdiction identity only | `TRACE-GAP-P1-REF-005`; `DEC-040`. |
| Recovery/continuity | None | `TRACE-GAP-P1-REF-006`; intentional absence under approved `DEC-038`/`032`. |

No existing reference record is an implementation orphan: all packs are used by at least one story or provide shared controlled vocabularies. “Used” remains static DRAFT traceability, not activation.

## 8. Test, accessibility, NFR, and operational evidence gaps

- `TRACE-GAP-P1-TEST-001` is **CLOSED**: `TST-IDX-001` defines 104 stable cases and 49/49 stories reference exact applicable IDs; all 23 source-test files have reverse evidence mappings. Stable mapping does not imply a passing product execution result.
- `TRACE-GAP-P1-A11Y-001`: `A11Y-P1-001`–`056` is referenced across every applicable story, but product/specialist approval, pinned browser/assistive-technology versions, disabled-user evidence, implementation test IDs, and a release conformance report are absent.
- `TRACE-GAP-P1-TARGET-001`: applicable `NFR-P1-001`–`045` targets are referenced and retain `PROVISIONAL`/zero-tolerance labels. No story converts them into an SLA or approves the launch workload/capacity/cost envelope.
- `ENG-TST-P1-001`–`042`, `OPS-CICD-P1-001`–`030`, `OPS-DEP-P1-001`–`032`, `OPS-DR-P1-001`–`032`, and `OPS-OBS-P1-001`–`032` define future evidence but are not execution results.
- `TRACE-GAP-P1-APPROVAL-001`: the product baseline and architecture are approved for implementation, but specialist review and production release evidence remain incomplete.

## 9. Decision impact matrix

| Decision | State | Affected stories | Readiness consequence |
|---|---|---|---|
| `DEC-001`–`011`, `020`–`024` | `APPROVED` | All as applicable | Normative constraints; cannot be weakened by backlog. |
| `DEC-030` | `APPROVED` | All | Full Phase 1 authorized; slices are continuous checkpoints. |
| `DEC-031` | `APPROVED` | `004`, `033`, `041` | Upload/camera/manual enabled locally; live connectors disabled. |
| `DEC-032` | `APPROVED` | `039`, `040`, `048` | Ordinary grants/export remain; automatic continuity excluded. |
| `DEC-033` | `APPROVED` | `044` | Complete authorized portability envelope required. |
| `DEC-034` | `APPROVED` | `034`, `035`, `043` | Item-level findings only; aggregate/hidden score prohibited. |
| `DEC-035` | `APPROVED` | `004`, `010`, `013`, `027`, `028`, `034`, `037` | Synthetic local package enabled; public coverage claims remain production-gated. |
| `DEC-036` | `APPROVED` | `005` | Suspected clinical material isolated in `POLICY_HOLD`. |
| `DEC-037` | `APPROVED` | `036`, `042` | In-app state enabled; external channels disabled. |
| `DEC-038` | `APPROVED` | `001`, `008`, `040`, `047` | Recovery/ownership transfer absent locally and production-gated. |
| `DEC-039` | `SUPERSEDED FOR DOCUMENTS BY DEC-053` | `007`, `009`, `011`, `044`, `045` | Historical local behavior no longer defines the document lifecycle. |
| `DEC-040` | `SUPERSEDED BY DEC-049` | Every processor route | Historical synthetic route boundary replaced by the approved Azure Australian placement baseline and explicit eligibility gates. |
| `DEC-041`, `054` | `APPROVED` | All | Full personal/family implementation is authorized as one continuous program for synthetic dev/stage. |
| `DEC-043`–`046`, `055` | `APPROVED` | Identity, connector, notification, invitation, and deployment stories as applicable | Provider ports and registrations may be prepared; live activation requires exact consent, credentials, security, and conformance evidence. |
| `DEC-049` | `APPROVED` | All processing and storage routes | Azure Australia East baseline selected; unknown or ineligible routes fail closed. |
| `DEC-050`, `051` | `APPROVED` | Document storage, sharing, deletion, and trust stories | Two-layer encryption and customer/workspace key isolation are mandatory. |
| `DEC-052` | `APPROVED` | All user-facing stories | React web and Flutter iOS/Android clients proceed concurrently against shared contracts. |
| `DEC-053` | `APPROVED` | `007`, `009`, `011`, `044`, `045` and all derived-data deletion consumers | Immediate fence, 30-calendar-day Trash/restore, then coordinated purge/non-resurrection. |
| `DEC-P1-056` | `APPROVED` | `002`, `003`, `039`, `040` | Explicit revisioned transition attempts fail closed; partial/uncertain state cannot broaden access; richer independent transfer/delegation is later governed scope. |

## 10. Current orphan and drift findings

| Finding | Classification | Disposition |
|---|---|---|
| No uncovered `REQ-P1-*`, `FEAT-P1-*`, `UC-P1-*`, epic, story, or story AC | Static coverage result | Re-run on every product/backlog change; semantic review still required. |
| `UC-P1-014`–`020` now have detailed implementation-grade product AC | Closed product gap | Detailed flows, alternatives and acceptance scenarios are owned by `PROD-UC-001`; runtime evidence remains future story work. |
| Named API/event semantic surface gaps | Contract gaps | `TRACE-GAP-P1-API-001`–`014`, `EVT-001`–`003`; resolve in API/event owners before story readiness. |
| Fact, connector, residency, recovery/continuity reference records absent; dependant transfer catalogue intentionally absent | Reference gaps/intentional fences | `TRACE-GAP-P1-REF-001`, `002`, `005`, `006` remain delivery/release dependencies; `REF-003` is resolved by `DEC-P1-056`. Do not invent defaults. |
| No backlog story or source-test file lacks stable trace ownership | Closed historical test/reverse-trace gap | `TST-IDX-001` v0.2 covers 104 tests/98 story ACs; `implementation-evidence.v1.json` maps 23/23 source-test files. Execution evidence remains DRAFT/PLANNED. |
| Root `TRACEABILITY.md`, `SPECIFICATION-READINESS.md`, and repository navigation reflect all current draft packs | Closed governance/navigation drift | `TRACE-GAP-P1-GOV-001` closed 26 August 2026; reopen on detected drift. |

## 11. Change-control rule

Any changed requirement, feature, use case, decision, API/event/schema/reference record, security/privacy/audit/threat rule, NFR, DIT/AI contract, UX/A11Y rule, migration/operations contract, or test must update the affected story and this matrix in the same governed change. Implementation authority comes from `DEC-041` and `DEC-054`; a story becomes complete only when its named gaps close and its acceptance, security/privacy, accessibility, operational, and release evidence pass.
