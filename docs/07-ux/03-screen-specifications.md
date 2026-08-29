# Phase 1 Screen Specifications

| Field | Value |
|---|---|
| Document ID | `UX-SCR-001` |
| Version | `0.1` |
| Status | `DRAFT — product, design, accessibility, security, privacy, data, and quality approval required` |
| Product phase | Phase 1 — Personal and Family |
| Experience | Shared React web/PWA and Flutter protected-screen semantics; React-specific public/trust/legal/account-entry screens |
| Primary flows | `UX-FLOW-P1-001`–`UX-FLOW-P1-018`, `UX-FLOW-P1-031` |
| Approved boundaries | `DEC-032`, `DEC-034`, `DEC-036`–`DEC-040`, `DEC-044`, `DEC-047`, `DEC-049`–`DEC-053`, `DEC-055` |
| Updated | 30 August 2026 |

## 1. Purpose and specification method

This document defines the minimum Phase 1 user-facing screens and their actor, purpose, authorized data, actions, responsive behavior, state variants, destructive/recovery behavior, and analytics boundary. Protected screen semantics apply to both React web/PWA and Flutter iOS/Android under `DEC-052`; each client owns its platform presentation and source code. `UX-SCR-P1-046` and `047` are React-specific public/browser surfaces under `DEC-044`. A “screen” is a stable user outcome and landmark structure, not a URL, component implementation, modal requirement, or visual mock-up.

Every screen consumes current domain state. Client state, a route parameter, cached data, an event payload, a model response, or a prior screen does not grant authority. A screen may be implemented as a page, pane, step, or responsive disclosure only if the same landmarks, state semantics, authorization checks, focus behavior, and test evidence remain intact.

## 2. Common screen frame

Each protected screen contains, in reading/focus order where applicable:

1. skip link and stable application landmarks;
2. current safe workspace context and account menu;
3. breadcrumb/back context that contains no unauthorized names;
4. one programmatic page heading;
5. state summary and freshness/coverage when material;
6. primary content with clear section headings;
7. allowed actions, with the primary action unique and consequences named;
8. contextual help/limitations and privacy-safe correlation where needed; and
9. a polite status region plus assertive alert only for immediate blocking/safety conditions.

Protected content MUST NOT be placed in document title, URL, browser history label, client log, analytics property, notification preview, clipboard by default, or unapproved offline store.

## 3. Shared state contract

The following variants are mandatory for every screen at whole-screen, region, row, or action level. If a state cannot semantically apply to a resource, the implementation still handles the route/dependency becoming that state and returns the normalized safe alternative.

| State | Required rendering and interaction |
|---|---|
| Loading | Preserve landmarks and heading; mark the affected region busy; use structural placeholders without invented values/counts; announce completion once; do not repeatedly steal focus. |
| Empty | Explain exact authorized scope and why it is empty only when safely known; use “No items available in this view” when hidden/restricted items may exist; offer one authorized next step. |
| Partial | Render successful authorized portions; label missing/failed/truncated categories and coverage/watermark; no whole-result or “all clear” conclusion. |
| Error | State the safe problem, whether input/effect was accepted, what is preserved, and a bounded retry/alternate/support step; raw stack/provider/security/content detail is prohibited. |
| Offline | Persistent offline status; protected cached content is absent unless separately approved; no mutation appears accepted; preserve only policy-approved local draft/checkpoint and reauthorize on reconnect. |
| Stale | Label affected region, last verified/observed time or safe watermark, source/projection health, and consequence; never present historical content as current. |
| Restricted | Apply `DENY`, `REDACT`, or named `MINIMAL_DISCLOSURE`; no protected title/value/count/path/existence; the remediation route appears only when separately authorized. |
| Revoked | Immediately clear protected content and effects; explain safe grant/session outcome; re-request access only if policy supports it; citation/download/conversation reuse is blocked. |
| Expired | Distinguish session, invitation, guest link, grant, approval, citation/artifact link, export, reminder, evidence, or policy expiry; show only the permitted renewal/restart route. |
| Deleted | Deletion fence wins; remove serviceable content/derivatives; display only actor-authorized lifecycle/residual state and restore/cancel if the current policy permits. |
| Quarantined/hold | No ordinary preview/download/AI/search/graph/notification; generic safe state and separately authorized restricted actions only. |
| Unavailable/degraded | Name the affected capability and safe fallback/limitation; do not reuse last success as current or weaken authorization/evidence gates. |

State changes preserve user context where safe, announce programmatically under `NFR-P1-025`, and never announce hidden content in a live region. Loading/refresh does not clear a completed result before the replacement is safely available unless revocation, deletion, quarantine, or security policy requires immediate removal.

## 4. Screen catalogue

### 4.1 Entry, workspace, and dossiers

| Screen ID and name | Primary actor and purpose | Authorized data | Primary actions | Specific state/edge requirements |
|---|---|---|---|---|
| `UX-SCR-P1-001` — Sign-in and service entry | Any eligible identity; establish authentication and discover safe service availability | Authentication method/factor state, generic service state, terms/help; no workspace/resource data before authorization | Sign in, use approved factor, sign out, contact safe support | Failed sign-in does not confirm account/workspace; `DEC-038` recovery remains unavailable; time-limit and reauth return intent contains no protected title/value |
| `UX-SCR-P1-002` — Product explanation and onboarding | New eligible user; make an informed minimal-data start | Product purpose, Australian-first limitations, clinical exclusion, AI/review, monitoring, privacy, portability, open capabilities | Continue, exit, view accessible policy/help | No “complete coverage,” compliance, Australian-hosting, recovery, or continuity promise; no forced upload/member invite |
| `UX-SCR-P1-003` — Workspace creation | Eligible identity; create PERSONAL or eligible FAMILY workspace | Workspace type choices, minimum configuration/consent, ownership/private-resource explanation | Create, cancel, retry existing request | ORGANISATION absent; creating/failed/duplicate/idempotent outcomes; success only after owner/membership/subject/audit durability |
| `UX-SCR-P1-004` — People & resources | Authorized member; browse currently visible subjects/resources | Authorized dossier summaries, configured resource kinds, safe user-selected sort/filter | Open dossier, add subject/resource if permitted | No hidden member/resource counts; managed subject may have no identity; relationship label never implies permission |
| `UX-SCR-P1-005` — Person/resource dossier | Authorized subject/resource viewer; understand evidence and work in one context | Authorized overview, documents, facts, connections, expected evidence, activity, item-level findings | Navigate sections, add evidence/document, open work item as permitted | Each section reauthorizes; list-first connections; no aggregate score; “no visible records” not “none exist” |
| `UX-SCR-P1-006` — Membership and subject participation | Authorized membership administrator; invite/suspend/remove and understand authority separation | Safe membership/invitation state, configured participation class, effective administrative capability; private content excluded unless separately granted | Invite, cancel, suspend/remove, inspect independent grants | Preview capabilities separately from content; managed-dependant transition proposal-only; removal inventory/reconciliation without silent transfer |
| `UX-SCR-P1-007` — Home | Current participant; resume the safest next authorized work | Actor-scoped tasks/findings, active ingestion jobs, safe service/source limitations, authorized recent activity | Resume work, capture, navigate | No household readiness/compliance/risk score, hidden denominator, restricted item count, or “all clear”; explicit empty/coverage copy |

### 4.2 Capture, processing, document, and evidence

| Screen ID and name | Primary actor and purpose | Authorized data | Primary actions | Specific state/edge requirements |
|---|---|---|---|---|
| `UX-SCR-P1-008` — Documents | Authorized document viewer; find logical documents and versions | Authorized document summaries, current version, separate availability/effective/processing state, safe filters/facets | Search/filter, open, capture | Facet/count authorization; stale projection declared; quarantine/hold not exposed as ordinary document result |
| `UX-SCR-P1-009` — Capture chooser and file intake | Authorized creator; choose file/camera/manual and submit governed intake | Destination workspace/subject/resource, active format profile, route/purpose/processor eligibility, transfer progress | Select file, open camera, create manual record, cancel/resume | Offline not accepted; supported behavior from active profile; exact duplicates not auto-merged; client progress distinguished from durable receipt |
| `UX-SCR-P1-010` — Camera capture and page review | Authorized creator; obtain readable ordered pages | Live preview/local pages only under approved client policy, capture quality guidance, page order/rotation/crop | Capture/retake, add/reorder/rotate/remove page, accept, switch to file/manual | File/manual alternative always available; no gesture-only reorder; orientation/motion independence; local loss/privacy explained |
| `UX-SCR-P1-011` — Ingestion job status | Uploader/reviewer; understand durable async processing | Safe job ID, exact ingestion/stage state, completed/current/remaining classes, last update, review/failure reason code, optional degradation | Leave/return, retry, request cancel, open review/ready document | Exact `DIT-ING-001` states; no invented ETA; `CANCELLING` differs from `CANCELLED`; late/deletion results cannot activate |
| `UX-SCR-P1-012` — Quarantine or policy hold | Uploader; restricted reviewer/remediator where separately permitted | Generic containment state, safe timestamps/correlation, separately authorized safety evidence | Rescan/release/restricted review/delete only if exact policy permits | No preview/download/title/content/extraction/AI/search/graph/notification; approved `DEC-036` permits no ordinary processing path and no disposition/retention/export/purge promise beyond configured restricted policy |
| `UX-SCR-P1-013` — Extraction review workbench | Authorized reviewer; validate type, fields, anchors, and proposed interpretation | Exact version, page/representation, field proposals/source forms, validation issues, anchors, confidence/calibration/review reasons, prior generation | Accept-as-extraction, correct, reject, defer, request reprocessing, save/leave | Original/provider output immutable; field authorization independent; partial pages/anchors explicit; accepting extraction not fact/fulfilment/action approval |
| `UX-SCR-P1-014` — Document dossier | Authorized document viewer; inspect logical identity and lifecycle | Summary, exact versions, evidence, facts, relationships, related work, access/activity under section policy | Open version/evidence, compare, archive/trash/share/export/delete as separately authorized | Processing, effective, availability, review, fact, fulfilment, approval, execution, deletion shown separately |
| `UX-SCR-P1-015` — Evidence viewer | Authorized evidence reader; verify exact claim/field | Exact artifact/version/representation, page/span/region, support role, source time/health, permitted adjacent context | Navigate pages/anchors, zoom, download exact original via scoped grant where allowed, return to claim | Anchor and adjacent context reauthorized; coordinates have text equivalent; expired/revoked link safe; no permanent public URL |
| `UX-SCR-P1-016` — Version history, comparison, and conformed view | Authorized version reader/reviewer; understand change/effective scope | Ordered versions, relations/evidence, valid/known perspective, two-sided anchors, comparison coverage, conformed lineage/states | Select exact versions, compare, inspect relation, propose/review relation if allowed | Failure/partial/restricted is not unchanged; conformed output labelled derived interpretation, not controlling legal opinion |

### 4.3 Facts, search, monitoring, impact, and closure

| Screen ID and name | Primary actor and purpose | Authorized data | Primary actions | Specific state/edge requirements |
|---|---|---|---|---|
| `UX-SCR-P1-017` — Fact and conflict dossier | Authorized viewer/resolver; inspect bitemporal fact and occurrences | Fact definition/version, target, valid/known perspective, permitted value segments/occurrences/anchors, conflict/dispute/review state | Propose, accept/retain/correct/dispute/tolerate/supersede/record insufficiency as policy permits | Restricted occurrence does not become absence; stale revision preserves proposal; prior values/history remain inspectable when authorized |
| `UX-SCR-P1-018` — Search workspace | Authorized user/guest in exact scope; retrieve documents/facts/evidence | Query scope, authorized results/facets/snippets/versions, safe freshness and coverage | Search, filter, change temporal/resource scope, ask question, start comparison | Counts/facets privacy-safe; query not authority; empty vs restricted vs stale index vs unavailable distinct |
| `UX-SCR-P1-019` — Cited answer and conversation | Authorized asker; evaluate supported answer/limitation and inspect evidence | Structured claims, exact citations, conflicts, temporal/freshness, coverage, `SUPPORTED`/limitation states, current authorized history | Open citation, ask follow-up, retry/narrow scope, separately create task if permitted | Read-only; current turn reauthorizes history; revoked/deleted source removed; no arbitrary web or uncited consequential claim |
| `UX-SCR-P1-020` — Monitor and source health | Affected authorized user; understand monitor/source coverage and failure | Subscription/trigger class, rule/source version, authority tier, coverage, attempt/success/observation times, source health/freshness/parser state | Inspect affected results, refresh/retry visibility, adjust own subscription where permitted | Retrieval success not current-parser health; household UI cannot publish/repair sources; no guaranteed complete coverage |
| `UX-SCR-P1-021` — Change, impact, and recommendation | Authorized affected user/reviewer; understand why an item is affected and proposed work | Change generation, applicability/predicates, exact authorized paths, impact class, separate dimensions, evidence/source/coverage, recommendation/target/revision | Inspect path/evidence, approve request, reject, edit, defer, dismiss, not applicable where policy permits | Restricted path uses named minimal disclosure; graph cycle/truncation visible; no score or hidden ranking; unavailable action never offered |
| `UX-SCR-P1-022` — Approval preview | Separately authorized approver; bind decision to exact consequence | Exact reviewed inputs/effect hash, target revision, evidence, policy, actor, expiry/invalidation, external consequence, evidence requirement | Step up, approve, reject, edit/defer via owning workflow, cancel | Material change/revoke/expiry invalidates; ownership/high confidence not authority; audit failure leaves pending |
| `UX-SCR-P1-023` — Action execution and evidence closure | Authorized executor/verifier; observe real outcome, reconcile, and prove closure | Exact action state/attempts, partial/unknown outcomes, approval binding, repair/reversal, replacement evidence, verification and closure rule | Retry/reconcile/repair/reverse where allowed, add evidence, verify, close when rule passes | Acknowledgement/timeout not success; completion check not closure; unknown outcome blocks duplicate execution |
| `UX-SCR-P1-024` — Expected evidence and document health | Authorized subject/representative/reviewer; resolve one requirement case/finding | Profile/rule/context, applicability, item-level signals, evidence options/alternatives/waivers, disposition, verification/fulfilment | Add evidence, choose alternative, request waiver/review, mark not applicable, dismiss, remind | No aggregate score/percentage/traffic light/rank; restricted evidence not “missing”; file presence not fulfilment |

### 4.4 Work, sharing, portability, deletion, and settings

| Screen ID and name | Primary actor and purpose | Authorized data | Primary actions | Specific state/edge requirements |
|---|---|---|---|---|
| `UX-SCR-P1-025` — Tasks and in-app notifications | Task owner/assignee/authorized reassigner; coordinate work | Actor-authorized tasks, causality, safe due/source/evidence requirement, workflow state, in-app delivery/seen/ack state | Acknowledge, snooze, reassign, complete, reopen, dismiss, open cause | Task, notification, fulfilment, action, and closure separate; `DEC-037` external channels disabled; privacy-safe badges |
| `UX-SCR-P1-026` — Share and effective-access preview | Authorized grantor; create exact bounded access | Intended grantee/audience, purpose, resources/fields/actions, validity, export/onward constraints, effective inclusion/exclusion | Modify scope, step up/approve if required, issue invite/link, cancel | No whole-workspace default or implicit graph expansion; preview must be text-equivalent and show restrictions without hidden names |
| `UX-SCR-P1-027` — Grant/link detail and revoke | Grantor/grantee/auditor within separate permission; inspect use/expiry and end access | Safe grant scope/state/use, audience, expiry, sessions/link and propagation/reconciliation status, privacy-safe activity | Revoke, shorten/modify via new decision, copy link only when permitted, leave grant | Expired/revoked content cleared; no member/resource enumeration; current reauthorization blocks stale sessions/citations/exports/jobs |
| `UX-SCR-P1-028` — Export case | Actor with exact export authority; prepare and redeem portable data | Requested/authorized categories, manifest/envelope version, per-category include/exclude/error, checksums, route, temporary package state/expiry | Request, cancel where permitted, retry failed class, download with step-up | Approved `DEC-033` categories are declared by the exact manifest; partial never “complete”; mid-job revoke and ineligible route block; no content in analytics |
| `UX-SCR-P1-029` — Archive, Trash, restore, and deletion case | Actor with exact lifecycle/destructive authority; understand/control availability and purge | Exact target/revision/action, affected authorized data roles, recoverability, fence, per-class purge/residual/exception/verification state | Archive/Trash/restore, request/cancel deletion where permitted, step up/confirm, retry/reconcile | Local synthetic behavior follows `DEC-039`; production documents follow `DEC-053` immediate fence, 30-calendar-day Trash, then coordinated purge; other retention/account/backup durations remain separate; partial failure stays inaccessible/incomplete |
| `UX-SCR-P1-030` — Personal/family settings | Current actor; manage own permitted profile, participation, notification preference, security/export/delete entries | Current actor's settings and authorized workspace membership/grants; exact configured coverage/processing disclosures | Change own settings, open security/sharing/export/deletion | No enterprise/configuration/source/operator console; no route/hosting claim beyond configured environment/data class; customer external channels disabled until configured |
| `UX-SCR-P1-031` — Recovery unavailable | User who cannot complete approved sign-in; understand safe boundary | Generic policy/help and privacy-safe correlation only | Retry approved sign-in/factor; safe support contact | No workspace lookup, evidence upload, family/support override, ownership/factor/key transfer under approved `DEC-038` |
| `UX-SCR-P1-032` — Continuity information | Authorized current user; understand available preparation and absence of auto-release | General policy; links to ordinary scoped grants/curated export when authorized | Open ordinary sharing/export, leave | No nominee/trigger/timer/enrolment/release/guarantee because `DEC-032` excludes automatic continuity release; alleged trigger never discloses |

### 4.5 React-specific public, trust, legal, and account entry

| Screen ID and name | Primary actor and purpose | Authorized data | Primary actions | Specific state/edge requirements |
|---|---|---|---|---|
| `UX-SCR-P1-046` — Doculyra public product and trust experience | Signed-out prospective/returning user, evaluator, or reviewer; understand the product and choose a safe account route | Approved public product, intelligence, feature, security/privacy, about/company, contact availability, Doculyra brand assets, development-preview and illustrative-example disclosures | Navigate public sections, open privacy/terms, use configured contact, create account, sign in | React-specific; equivalent compact/wide destinations; correct account modes; truthful synthetic-preview and disabled-capability copy; missing contact/account dependency is explicit; no workspace data, unsupported production/security/coverage/legal claim, active Business/Enterprise implication, or hidden analytics content |
| `UX-SCR-P1-047` — Doculyra privacy and terms information | Signed-out or signed-in reader; inspect the applicable development legal/trust information | Document kind, status, effective date, scope, current preview/privacy/terms content, configured contact availability | Navigate headings/links, move between privacy/terms, return to public home, use configured contact | React-specific direct routes and refresh; one clear heading hierarchy; no forced acceptance merely by viewing; development wording does not imply final production legal approval; missing operator/contact/domain remains an accurate release-gated state |

## 5. State-coverage matrix

`A` means the screen must have a first-class variant. `R` means the condition is handled by the protected-route/shell variant and clears or replaces the screen. Both require tests.

| Screen family | Loading | Empty | Partial | Error | Offline | Stale | Restricted | Revoked | Expired | Deleted | Hold |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Entry/onboarding `001`–`003` | A | A | R | A | A | R | R | R | A | R | R |
| Workspace/dossiers `004`–`007` | A | A | A | A | A | A | A | R | R | A | R |
| Capture/processing `008`–`013` | A | A | A | A | A | A | A | R | R | A | A |
| Document/evidence/version `014`–`016` | A | A | A | A | A | A | A | A | A | A | A |
| Fact/search/answer `017`–`019` | A | A | A | A | A | A | A | A | A | A | R |
| Monitor/impact/action/health `020`–`024` | A | A | A | A | A | A | A | A | A | A | R |
| Tasks/sharing `025`–`027` | A | A | A | A | A | A | A | A | A | A | R |
| Export/deletion/settings `028`–`030` | A | A | A | A | A | A | A | A | A | A | R |
| Fenced information `031`–`032` | A | A | R | A | A | R | A | R | R | R | R |
| Public/trust/legal `046`–`047` | A | A | A | A | A | A | R | R | R | R | R |

Tests vary states at screen, nested region, row, action, and between confirmation and effect. A row-level restriction MUST NOT convert the whole screen to a revealing error or change a visible count in a way that identifies the hidden row.

## 6. Responsive and interaction rules

### 6.1 Compact presentation

- One primary content column; secondary panes become labelled routes, drawers, or sequential regions with predictable back behavior.
- Evidence review presents field then “View source” or source then “Review field,” preserving explicit relationship and focus return; simultaneous side-by-side layout is not required.
- Tables become labelled cards or horizontal-scroll regions only when relationships cannot be represented linearly; headers remain programmatically associated.
- Graphs have an equivalent path list and are never the only way to inspect or act.
- Persistent actions do not cover focused content, status messages, browser controls, or the on-screen keyboard.
- Camera and upload controls respect device permissions but always retain file/manual alternatives.

### 6.2 Wide presentation

- Side-by-side evidence, filter, comparison, or context panes may be used only when reading order, keyboard order, heading structure, and focus do not follow visual position incorrectly.
- Resizing or zooming collapses panes without losing draft state, selection, scroll target, error, or action access.
- Dense tables expose a compact alternative and do not require pointer hover for row actions or definitions.

### 6.3 State updates

Async updates do not reorder a focused list item, collapse an open disclosure, or move keyboard focus unless the resource becomes prohibited/revoked/deleted. New items are announced by safe count/category and offered through an explicit refresh. Critical safety/revocation changes may replace content immediately, move focus to the blocking heading, and announce a privacy-safe explanation.

## 7. Counts, badges, labels, and sorting

| Element | Allowed contract | Prohibited behavior |
|---|---|---|
| Task badge | Count of actor-authorized actionable tasks with named scope | Household total including restricted tasks; urgency/readiness score |
| Dossier count | Count only when all contributors' existence is authorized | Count delta revealing a hidden document/edge/finding |
| Facet count | Policy-authorized denominator within current query scope | Hidden corpus size, zero that implies absence, stale count shown current |
| Status label | Exact domain state plus plain-language explanation | Generic “good/bad,” colour-only label, `READY` presented as fulfilment |
| Sort | User choice or inspectable authorized field such as due/updated time | Hidden score, restricted severity, model confidence as priority, undisclosed personalization |
| Empty message | “No items available in this view” or safely proven true empty | “You have no documents/issues” when restricted/stale/partial data exists |

`DEC-034` prohibits aggregate readiness/content-health/compliance/risk score in visible components and in hidden ordering, notification priority, search ranking, analytics segments, accessibility labels, or CSS-only indicators.

## 8. Confirmation, destructive actions, and recovery

| Consequence | Preview and confirmation | Recovery/outcome |
|---|---|---|
| Reject/correct extraction or fact | Exact field/occurrence, source evidence, prior/new value/time, downstream reassessment | Additive history; stale revision refresh; no original mutation |
| Approve recommendation/action | Exact inputs/effect hash, target, policy, expiry/invalidation, external effect, required evidence | Approval separate from execution; changed input invalidates; unknown outcome reconciles |
| Revoke access | Exact grant purpose/resources/fields/actions/audience and currently active effects where safely visible | Immediate current-policy deny; propagation/reconciliation shown; completed external effect not erased |
| Cancel processing/export/action | State whether cancellation is local draft, requested, accepted, or complete | Late results blocked; prior durable acquisition/audit retained by policy |
| Archive/trash | Exact target and change in availability; clarify that source/effective history is not deleted | Restore only while policy permits; activity retained |
| Purge/account/workspace deletion | Exact action/scope, authorized affected classes, shared/third-party effect, fence, recovery boundary, residual categories, step-up/approval | Truthful per-class state; no `DEC-039` duration; partial failure remains inaccessible and repairable |

Confirmation controls use an explicit action label, neutral cancel/return, and no preselected destructive choice. Typed confirmation MAY be required by approved risk policy but cannot compensate for unclear scope. Browser back, Escape, and focus behavior never submit. Reauthentication returns to a revalidated preview, not directly to effect.

## 9. Analytics and diagnostics contract

### 9.1 Allowed ordinary event fields

- opaque `screen_id` (`UX-SCR-P1-*`), `flow_id`, component/contract version, route class, workspace type, purpose class;
- safe domain-state/reason/action code, disclosure outcome, capability class, feature flag state;
- interaction outcome, validation/error category, retry/resume/cancel, elapsed/latency bucket, viewport/input-mode bucket;
- accessibility test/synthetic marker and consented research cohort code; and
- opaque correlation/experiment ID only when approved and non-content-bearing.

### 9.2 Prohibited ordinary event fields

Names, email/contact, relationship description, subject/resource title, filename, document/source text or image, field/fact value, evidence passage/quote, prompt/query/answer, citation URL, unrestricted external ID/URL, grant token/link, signed URL, error payload, clipboard contents, keystrokes, camera frame, screenshot, DOM snapshot, session replay, free-text reason, and model/provider payload are prohibited (`SEC-P1-017`, `PRIV-P1-020`–`PRIV-P1-022`, `AUD-P1-027`).

Analytics success is the domain-confirmed outcome appropriate to the screen, not click-through. Denied, restricted, stale, partial, offline, assistive-technology, and low-connectivity cohorts are measured through safe state/outcome codes without recording content. Analytics failure never blocks safety, authorization, deletion, or required audit, and no product control depends on a third-party analytics script.

## 10. Cross-screen normative rules

- `UX-SCR-P1-033` — Every screen MUST declare and enforce its actor, purpose, workspace/resource scope, authorized data fields, allowed actions, disclosure class, and current state before rendering protected content.
- `UX-SCR-P1-034` — Every screen and nested async region MUST implement the shared loading, empty, partial, error, offline, stale, restricted, revoked, expired, deleted, hold, and unavailable/degraded contract or its normalized route replacement.
- `UX-SCR-P1-035` — A screen MUST NOT use client visibility, route access, prior response, membership, owner/admin label, relationship, confidence, or model output as authority for content or action.
- `UX-SCR-P1-036` — Counts, facets, badges, tabs, breadcrumbs, sort order, empty states, timing, live announcements, and responsive layout MUST follow a named disclosure policy and authorized denominator.
- `UX-SCR-P1-037` — Async screens MUST show the last durable milestone, safe last-update/freshness, current/next state, whether leaving is safe, and exact retry/resume/cancel semantics without invented completion or ETA.
- `UX-SCR-P1-038` — A material state change MUST update visible and programmatic state consistently, preserve focus/context where safe, and prevent stale content from remaining interactive.
- `UX-SCR-P1-039` — Destructive or consequential actions MUST have an accessible scope/consequence preview, current reauthorization and revision check, unambiguous confirmation, durable pending state, truthful partial/failure outcome, and policy-defined recovery.
- `UX-SCR-P1-040` — Reauthentication/step-up MUST preserve only safe draft context, return to a freshly authorized preview, and never cause the action merely because authentication succeeded.
- `UX-SCR-P1-041` — Compact and wide layouts MUST contain the same information and actions in a logical reading/focus order; no critical workflow may require simultaneous panes, hover, dragging, colour, pointer precision, or landscape orientation.
- `UX-SCR-P1-042` — Evidence coordinates, charts, graphs, timelines, differences, and status visuals MUST have equivalent structured text and direct keyboard navigation to the same authorized evidence/action.
- `UX-SCR-P1-043` — Screen copy MUST distinguish evidence, interpretation, suggestion, review, accepted domain state, approval, execution, verification, fulfilment, and closure and MUST disclose material coverage/uncertainty without advice-like certainty.
- `UX-SCR-P1-044` — Ordinary screen analytics and diagnostics MUST use the allow-list in section 9 and MUST NOT capture content, free text, replay, screenshots, protected identifiers, tokens, or provider payloads.
- `UX-SCR-P1-045` — Every configuration-, assurance-, or release-gated screen or branch MUST remain unavailable/disabled with accurate explanatory copy and an approved alternative; prototypes and deep links MUST NOT expose a latent active route.

## 11. Traceability and acceptance

| Screen group | Product/use-case trace | Specialist contract and acceptance trace |
|---|---|---|
| `UX-SCR-P1-001`–`UX-SCR-P1-007` | `REQ-P1-WS-001`–`REQ-P1-WS-007`; `FEAT-P1-001`–`FEAT-P1-002`; `UC-P1-001`, `UC-P1-009`, `JRN-P1-001` | `WSP-P1-001`–`WSP-P1-045`; `AUTH-P1-001`–`AUTH-P1-007`, `AUTH-P1-032`; `NFR-P1-032`–`NFR-P1-033` |
| `UX-SCR-P1-008`–`UX-SCR-P1-016` | `REQ-P1-DOC-001`–`REQ-P1-DOC-008`, `REQ-P1-ING-001`–`REQ-P1-ING-008`; `UC-P1-002`–`UC-P1-003`; `AC-P1-ING-001` | `DIT-TAX-P1-001`–`DIT-TAX-P1-025`; `DIT-ING-P1-001`–`DIT-ING-P1-035`; `DIT-EXT-P1-001`–`DIT-EXT-P1-035`; `DIT-VER-P1-001`–`DIT-VER-P1-042` |
| `UX-SCR-P1-017`–`UX-SCR-P1-024` | `REQ-P1-FCT-001`–`REQ-P1-FCT-006`, `REQ-P1-SRCH-001`–`REQ-P1-SRCH-005`, `REQ-P1-MON-001`–`REQ-P1-MON-007`, `REQ-P1-HLT-001`–`REQ-P1-HLT-005`, `REQ-P1-ACT-001`–`REQ-P1-ACT-008`; `UC-P1-004`–`UC-P1-008`; `AC-P1-E2E-001`, `AC-P1-RAG-001`, `AC-P1-MON-001` | `DIT-FCT-P1-001`–`DIT-FCT-P1-035`; `DIT-GPH-P1-001`–`DIT-GPH-P1-032`; `DIT-MON-P1-001`–`DIT-MON-P1-034`; `DIT-IMP-P1-001`–`DIT-IMP-P1-044`; `DIT-SRC-P1-001`–`DIT-SRC-P1-032`; `DIT-HLT-P1-001`–`DIT-HLT-P1-036`; `AI-RAG-P1-001`–`AI-RAG-P1-030` |
| `UX-SCR-P1-025`–`UX-SCR-P1-032` | `REQ-P1-NTF-001`–`REQ-P1-NTF-004`, `REQ-P1-SHR-001`–`REQ-P1-SHR-005`, `REQ-P1-TRUST-005`–`REQ-P1-TRUST-008`; `UC-P1-009`–`UC-P1-012`, `UC-P1-016`–`UC-P1-017`; `AC-P1-DEL-001`, `AC-P1-SEC-001` | `SEC-P1-015`, `SEC-P1-025`–`SEC-P1-028`; `AUTH-P1-015`–`AUTH-P1-019`, `AUTH-P1-032`–`AUTH-P1-034`; `PRIV-P1-011`–`PRIV-P1-019`, `PRIV-P1-024`–`PRIV-P1-030`; `AUD-P1-019`–`AUD-P1-029` |
| `UX-SCR-P1-033`–`UX-SCR-P1-045` | All critical use cases; `AC-P1-A11Y-001`, `AC-P1-SEC-001` | `NFR-P1-004`–`NFR-P1-006`, `NFR-P1-013`, `NFR-P1-016`–`NFR-P1-025`, `NFR-P1-033`–`NFR-P1-036`; `SEC-P1-016`–`SEC-P1-018`; `AUD-P1-025`–`AUD-P1-030` |
| `UX-SCR-P1-046`–`UX-SCR-P1-047` | `DEC-044`, `DEC-047`, `DEC-052`; `REQ-P1-PLT-001`; `UX-FLOW-P1-031`; `AC-P1-A11Y-001` | `NFR-P1-022`–`NFR-P1-025`, `NFR-P1-032`; public claim/legal/contact review; privacy-safe analytics and direct-route evidence |

Release evidence MUST exercise every screen with representative synthetic data in each applicable state, compact/wide/reflow views, keyboard and assistive-technology paths, privacy differentials, current-policy changes between load and action, and the decision-fenced routes. A screenshot is supporting evidence only; it cannot replace semantic, authorization, focus, state-transition, or telemetry tests.
