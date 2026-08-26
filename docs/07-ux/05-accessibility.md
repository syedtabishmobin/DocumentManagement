# Phase 1 Accessibility Contract

| Field | Value |
|---|---|
| Document ID | `UX-A11Y-001` |
| Version | `0.1` |
| Status | `DRAFT — product owner and accessibility specialist approval required; all targets provisional` |
| Product phase | Phase 1 — Personal and Family |
| Target standard | WCAG 2.2 Level AA for all Phase 1 user-facing pages, components, and critical workflows |
| NFR alignment | `NFR-P1-022`–`NFR-P1-025` |
| Primary acceptance | `AC-P1-A11Y-001`; all `UX-FLOW-P1-*` and `UX-SCR-P1-*` critical states |
| Updated | 26 August 2026 |

## 1. Purpose, target, and authority

This document defines the accessibility behavior, testing, evidence, and release gate for the Phase 1 responsive web/PWA. WCAG 2.2 Level AA is the provisional baseline from `NFR-P1-022`; product-owner and accessibility-specialist approval is still required before it becomes a committed conformance target or public claim.

Conformance applies to complete processes, not only individual pages. It includes authentication, onboarding, workspace/subject setup, file and camera-alternative capture, processing/review, evidence/citation, versions/comparison, facts/conflicts, search/Q&A, monitoring/source failure, impact/approval/action/evidence closure, expected evidence, tasks/notifications, sharing/revocation, export, deletion, and every blocked conditional state.

Accessibility does not authorize broader disclosure. Accessible names, descriptions, live regions, headings, error messages, focus targets, page titles, transcripts, test recordings, and alternate representations follow the same current authorization and privacy rules as visual content.

## 2. Accessibility design principles

1. **Equivalent outcome:** different input/output modes reach the same authorized information, action, evidence, and recovery.
2. **Predictable structure:** landmarks, headings, navigation, labels, action order, and state language are consistent.
3. **No sensory dependency:** colour, location, shape, size, motion, sound, hover, drag, camera, or pointer precision is never the sole instruction.
4. **Status without disruption:** asynchronous changes are perceivable promptly without repeatedly moving focus or interrupting reading.
5. **Recoverable work:** validation, timeout, reauthentication, network loss, and service failure preserve authorized input and explain the next step.
6. **Cognitive clarity:** one material decision at a time, plain language, visible scope/consequence, and progressive disclosure without hiding essential limitations.
7. **Privacy parity:** a screen reader or alternate view never exposes text, counts, relationships, diagnostics, or evidence omitted from the authorized visual view.

## 3. WCAG 2.2 AA coverage map

| Need | Principal WCAG 2.2 success criteria | Phase 1 application |
|---|---|---|
| Text alternatives/media | 1.1.1; 1.2.1–1.2.5 where media exists | Icons, camera instructions, scanned-page/evidence regions, charts/graphs, and any product-created media receive equivalent alternatives; source-document accessibility limits remain explicit. |
| Structure and sequence | 1.3.1–1.3.5 | Landmarks/headings/lists/tables/forms, meaningful DOM order across responsive panes, no sensory-only instruction, orientation freedom, input purpose. |
| Visual presentation | 1.4.1–1.4.5; 1.4.10–1.4.13 | Non-colour state/diff/error cues, contrast, resize/reflow, text spacing, hover/focus content control. |
| Keyboard and input | 2.1.1–2.1.2; 2.1.4; 2.5.1–2.5.4; 2.5.7–2.5.8 | All journeys keyboard-complete; no traps; shortcut controls; non-gesture alternatives; cancellation; label-in-name; no motion-only; no drag-only; target size. |
| Time and motion | 2.2.1–2.2.2; 2.3.1 | Timeout warning/extension or documented security exception, pause/stop/hide for moving content, no flashing hazard. |
| Navigation and focus | 2.4.1–2.4.7; 2.4.11 | Skip blocks, accurate safe titles, logical focus, clear link purpose, multiple ways, descriptive headings, visible/unobscured focus. |
| Predictability and help | 3.2.1–3.2.4; 3.2.6 | No surprise change on focus/input, consistent navigation/identification/help. |
| Language and comprehension | 3.1.1–3.1.2 | Page/parts language, expansion of specialist terms, accurate localized state meaning. |
| Errors and authentication | 3.3.1–3.3.4; 3.3.7–3.3.8 | Linked error summary, suggestions, confirmation for consequential/destructive data, no unnecessary re-entry, accessible sign-in/MFA. |
| Programmatic compatibility | 4.1.2–4.1.3 | Correct name/role/value/state and timely privacy-safe status messages. |

The complete applicable WCAG 2.2 A/AA set remains in scope even when not repeated above. An applicability assessment must document any criterion considered not applicable and its evidence; omission from this table is not an exemption.

## 4. Normative accessibility rules

### 4.1 Governance and complete processes

- `A11Y-P1-001` — Every Phase 1 user-facing page, component, state, and complete critical process MUST conform to all applicable WCAG 2.2 A and AA success criteria under provisional `NFR-P1-022`.
- `A11Y-P1-002` — Accessibility acceptance MUST cover authorized success, loading, empty, partial, error, offline, stale, restricted, revoked, expired, deleted, quarantined/hold, unavailable, retry, cancellation, and reauthentication states.
- `A11Y-P1-003` — Accessibility semantics and alternate representations MUST enforce the same current workspace/resource/field/edge/evidence/action authorization and minimal-disclosure policy as visual output.
- `A11Y-P1-004` — No accessibility label, description, page title, live announcement, transcript, test artifact, shortcut, or hidden DOM node may expose restricted content/existence or retain revoked/deleted content.
- `A11Y-P1-005` — Accessibility is a release gate: any blocker or unresolved critical/serious defect in a critical journey, or any applicable A/AA failure without an authorized exception, is stop-ship under `NFR-P1-022`–`NFR-P1-025`.
- `A11Y-P1-006` — Accessibility requirements, component behavior, test cases, defects, exceptions, and conformance evidence MUST use stable IDs/versions and trace to the affected `REQ-*`, `UC-*`, `UX-*`, NFR, and WCAG criterion.

### 4.2 Structure, semantics, and names

- `A11Y-P1-007` — Each page MUST expose one main landmark, a programmatic page title and one primary heading that safely identify the current outcome; repeated navigation/help/footer regions use consistent landmarks and names.
- `A11Y-P1-008` — Headings, lists, tables, definition lists, forms, groups, dialogs, alerts, statuses, progress, tabs, disclosures, menus, and links MUST use native semantics where available and correct name/role/value/state when custom behavior is unavoidable.
- `A11Y-P1-009` — Responsive visual order and DOM/reading/focus order MUST remain meaningful; moving a pane or card MUST NOT detach labels, errors, evidence, source, or actions from their subject.
- `A11Y-P1-010` — Visible control text MUST be contained in the accessible name in the same order where practical; icon-only controls require a persistent or contextually clear visible label on critical flows.
- `A11Y-P1-011` — Forms MUST have persistent programmatic labels, required/optional state, units/format, descriptions and errors; placeholder, colour, location, example value, or icon alone is not a label/instruction.
- `A11Y-P1-012` — Page/section language and language changes MUST be programmatically declared; machine state codes, abbreviations, technical terms, and foreign passages require plain-language expansion or marked language as appropriate.
- `A11Y-P1-013` — Repeated navigation, help, state chips, buttons, and icons MUST retain consistent order, name, and meaning across screens; the same label MUST NOT trigger materially different effects without context in its accessible name.

### 4.3 Keyboard, focus, and alternative input

- `A11Y-P1-014` — Every action and complete critical journey MUST be operable with keyboard alone, without a specific timing for individual keystrokes, and without requiring pointer, hover, drag, swipe, pinch, device motion, camera, or handwriting.
- `A11Y-P1-015` — Focus order MUST follow the logical task and relationship order, remain visible, and never enter hidden/inert/prohibited content or become trapped except in a correctly implemented modal that supports an explicit exit.
- `A11Y-P1-016` — Opening a route places focus predictably at the page heading or retained initiating context; opening/closing dialogs, drawers, evidence anchors, errors, and responsive panes moves/returns focus to an existing logical control.
- `A11Y-P1-017` — Async refresh MUST preserve the user's focus, selection, expanded regions, and reading position unless current policy requires immediate removal; policy removal moves focus to a safe explanatory heading and announces it once.
- `A11Y-P1-018` — Focus indicators MUST be clearly visible with sufficient contrast and area, remain unobscured by sticky headers/footers/dialogs/virtual keyboards, and be visible in forced-colours/high-contrast modes.
- `A11Y-P1-019` — Keyboard shortcuts using printable characters MUST be off, remappable, or active only while the relevant component has focus; shortcut help is discoverable and cannot invoke a consequential/destructive effect without confirmation.
- `A11Y-P1-020` — All pointer gestures and dragging—including page reorder, crop/region selection, graph pan, sliders, swipe actions, and drag-and-drop upload—MUST have single-pointer, keyboard, and explicit-control alternatives with equivalent precision/outcome.

### 4.4 Status, validation, errors, and time limits

- `A11Y-P1-021` — Visual loading, progress, upload, processing, result, validation, source-health, action, notification, revoke, and deletion updates MUST expose a programmatic status within the provisional one-second objective in `NFR-P1-025` without requiring focus movement.
- `A11Y-P1-022` — Live announcements MUST be concise, deduplicated, privacy-safe, and scoped; progress updates are throttled, completed milestones announced once, and background household changes MUST NOT interrupt or reveal hidden content.
- `A11Y-P1-023` — Blocking/safety/revocation/deletion errors MAY use assertive alert semantics; ordinary success, progress, search results, autosave, and background updates use polite status or explicit user-requested refresh.
- `A11Y-P1-024` — On failed submission, an error summary receives focus, identifies every affected field/problem, links to each field, explains what was accepted/preserved, and provides a specific recovery; each field also owns its inline error.
- `A11Y-P1-025` — Error text MUST identify format, range, unit, evidence, scope, conflict, or required action in plain language without raw provider/security/content detail; correction MUST NOT erase unaffected authorized input.
- `A11Y-P1-026` — Consequential/destructive submissions MUST provide review, correction, and explicit confirmation of exact scope/effect; stale revision, changed input, and reauthentication return the user to a refreshed review rather than executing automatically.
- `A11Y-P1-027` — Session, invitation, grant, approval, export-link, or other user time limits MUST warn early enough to act and permit approved extension unless a documented security policy forbids it; expiry preserves safe draft/input and offers reauthentication/restart without duplicate effect.
- `A11Y-P1-028` — Moving, blinking, updating, auto-advancing, or animated content MUST support pause/stop/hide where required and MUST NOT flash above applicable thresholds; live dashboards, carousels, and auto-rotating evidence are not required Phase 1 patterns.

### 4.5 Reflow, zoom, visual presentation, touch, and motion

- `A11Y-P1-029` — Critical content and functions MUST remain usable at 320 CSS px, 200% text resize, and 400% browser zoom without loss or two-dimensional scrolling except intrinsically two-dimensional content with an equivalent linear representation (`NFR-P1-024`).
- `A11Y-P1-030` — User text-spacing overrides at WCAG test values MUST NOT clip, overlap, hide, or truncate labels, errors, evidence, statuses, buttons, tables, or dialogs; content expands/reflows rather than becoming hover-only.
- `A11Y-P1-031` — Text, meaningful graphics, control boundaries, states, and focus MUST meet applicable contrast requirements across supported themes/states; colour MUST NOT be the only cue for evidence, confidence, applicability, severity, source health, diff, error, selection, or disabled state.
- `A11Y-P1-032` — Pointer targets MUST meet WCAG 2.2 AA target-size/spacing rules; primary touch actions SHOULD be at least 44 by 44 CSS px, and adjacent destructive/safe controls require spacing that prevents accidental activation.
- `A11Y-P1-033` — Content and actions MUST work in portrait and landscape without forcing a particular orientation except an approved essential exception; device rotation MUST NOT discard work or reset focus.
- `A11Y-P1-034` — Motion/transition MUST respect reduced-motion preferences, avoid parallax/vestibular effects, and never carry essential state or temporal meaning; disabling animation MUST NOT delay status or focus updates.
- `A11Y-P1-035` — Hover/focus-triggered help or previews MUST be dismissible, hoverable, persistent as required, keyboard accessible, and never contain the only label/error/evidence/action; critical explanations use visible or explicitly opened content.

### 4.6 Capture, evidence, documents, comparison, and graphs

- `A11Y-P1-036` — Camera capture MUST have a complete file-upload and permitted manual-entry alternative, plus accessible permission denial, capture, retake, page count/order, rotate/crop, quality issue, submission, and cancellation controls.
- `A11Y-P1-037` — Camera quality guidance MUST not rely only on visual overlays, colour, sound, vibration, or motion; textual status and instructions describe detectable blur, glare, cutoff, orientation, page order, and next action without claiming guaranteed quality.
- `A11Y-P1-038` — Evidence viewers MUST expose exact source/version/page/anchor labels, keyboard page/anchor navigation, zoom controls, focus return, and an authorized text/structural alternative for product-generated highlights; adjacent restricted regions remain unavailable.
- `A11Y-P1-039` — If a source artifact itself is scanned, malformed, or not fully accessible, the product MUST disclose the limitation and provide any authorized validated text/field/anchor representation without claiming it is a complete replacement or fabricating missing content.
- `A11Y-P1-040` — Comparison MUST identify base/target, source side, added/removed/changed/moved/unchanged-within-scope/uncertain/restricted states in text and structure; colour, strike-through, column position, or sound alone is insufficient.
- `A11Y-P1-041` — Graphs, charts, timelines, coordinates, maps, and spatial evidence MUST have a logically ordered list/table/description with the same authorized nodes, edges, direction, values, versions, evidence, cycle/truncation/coverage, and actions.
- `A11Y-P1-042` — Large data sets MUST support headings, captions, summaries, filtering, pagination/virtualization announcements, and stable focus; virtualization MUST NOT make focused rows disappear or misreport set position/count.

### 4.7 Language, cognitive load, authentication, and help

- `A11Y-P1-043` — Content MUST use short sentences, concrete verbs, consistent terms, visible scope, absolute dates/times, and one material decision per step; evidence and limitations remain available without forcing users to remember prior screens.
- `A11Y-P1-044` — Technical/domain states MUST pair exact meaning with plain-language explanation; evidence, confidence, applicability, severity, urgency, source authority, source health, verification, and fulfilment are explained separately.
- `A11Y-P1-045` — Instructions MUST not rely on “above/below/left/right,” colour, icon, shape, sound, or gesture alone; references use the visible/programmatic label of the target.
- `A11Y-P1-046` — Users MUST be able to review and revise multi-step input, leave/resume asynchronous work, and avoid redundant re-entry of previously supplied current authorized information unless re-entry is essential for security or data integrity.
- `A11Y-P1-047` — Authentication MUST permit password managers and paste, avoid cognitive-function tests, and provide an accessible alternative to any challenge; MFA methods and errors require equivalent keyboard/screen-reader paths. `DEC-038` does not permit an unapproved recovery workaround.
- `A11Y-P1-048` — Contextual help MUST be consistently located, keyboard/screen-reader accessible, task-specific, privacy-safe, and distinguish product explanation from professional advice; support cannot request or reveal raw content through ordinary channels.
- `A11Y-P1-049` — Destructive, sharing, approval, and external-effect copy MUST avoid time pressure, shame, forced consent, double negatives, ambiguous defaults, or visually dominant unsafe choices; consequence and recovery are stated before confirmation.
- `A11Y-P1-050` — Localization MUST preserve exact domain-state distinctions, date/time/number precision, source names, evidence relationships, action consequence, and accessible name/visible-label parity; untranslated content and language changes are marked.

### 4.8 Testing, evidence, and exceptions

- `A11Y-P1-051` — Automated accessibility checks MUST run on components and representative pages/states, but automated success MUST NOT replace manual keyboard, screen-reader, zoom/reflow, touch, cognition, and user testing.
- `A11Y-P1-052` — Every release MUST execute the critical-journey matrix in section 6 using synthetic data across the approved browser/assistive-technology matrix and record criterion, environment, component/build, result, defect, retest, and evidence.
- `A11Y-P1-053` — Tests MUST include mid-flow async updates, offline/reconnect, timeout/reauthentication, source/model/authorization failure, partial results, validation errors, revocation, expiry, deletion, quarantine/hold, and decision-fenced routes.
- `A11Y-P1-054` — Accessibility telemetry/test artifacts MUST contain no raw household content, names, filenames, evidence, queries/answers, values, tokens, screenshots, recordings, or accessibility-tree dumps from production data; use synthetic fixtures.
- `A11Y-P1-055` — An accessibility exception MUST identify exact criterion/screen/flow/component/version, affected users/tasks, evidence, safe alternative, owner, approval, expiry, monitoring, remediation, and release consequence; it cannot waive unauthorized disclosure or an unusable critical workflow.
- `A11Y-P1-056` — The accessibility conformance report MUST be versioned per release, list applicable criteria and methods, approved matrix, known limitations/exceptions, decision-fenced functionality, and test evidence; no public conformance claim precedes specialist/product approval.

## 5. Assistive-technology and viewport matrix

The accessibility specialist must pin supported versions before beta. Until then, the following categories are the minimum test matrix; “current” means the versions approved in the release test plan, not an evergreen claim.

| Matrix row | Required environment | Scope |
|---|---|---|
| Desktop keyboard | Each supported desktop browser, keyboard only | All critical flows, dialogs, menus, evidence, diff, graph/list, async states, destructive actions |
| Windows screen reader | Current approved Chromium-family and Firefox-family browsers with a widely used Windows screen reader | All critical flows; browse/forms modes; live regions; tables; errors; evidence; reflow |
| macOS screen reader | Current approved Safari with the platform screen reader | All critical flows; VoiceOver navigation; file/camera alternative; dialogs; async status |
| iOS screen reader/touch | Current approved Safari/PWA with platform screen reader | Compact layout; touch exploration; rotor/headings/forms; camera alternative; uploads; evidence/approval/delete |
| Android screen reader/touch | Current approved Chromium/PWA with platform screen reader | Compact layout; touch exploration; focus order; capture alternative; tasks/sharing/delete |
| Zoom/low vision | 200% text, 400% zoom, 320 CSS px, OS magnification sample, text-spacing overrides | No loss/overlap; focus visible; sticky content; dialogs; on-screen keyboard; evidence/diffs |
| Contrast/colour | Forced colours/high contrast plus representative colour-vision simulations | Navigation, status dimensions, errors, charts/graphs/diffs, disabled/destructive/focus states |
| Alternative input | Voice control and switch-control sampling on approved platforms | Label-in-name, target discovery, sequential navigation, confirmation, page reorder, graph/list actions |
| Motion/orientation | Reduced motion, portrait/landscape, animation disabled | No lost state, essential motion, forced orientation, flashing, or delayed status |
| Low connectivity | Throttled/interrupted network, offline/reconnect, async replay | Status announcements, saved input, no duplicate effect, no stale protected cache |

At least two independent browser/engine families are required on desktop unless the approved support policy documents a narrower scope with product/accessibility acceptance. Automated engines run in all supported browser families where feasible; manual results remain authoritative for usability/assistive-technology behavior.

## 6. Critical-journey test matrix

| Journey | Keyboard/screen-reader checkpoints | Reflow/touch/cognitive checkpoints | Primary trace |
|---|---|---|---|
| Sign-in/onboarding/workspace | Accessible authentication, safe errors, heading/focus, no recovery bypass, terms/help | No forced upload/share; resume/retry; plain privacy/coverage copy | `UX-FLOW-P1-001`–`002`, `UX-SCR-P1-001`–`007`, `NFR-P1-032` |
| File/camera capture | Route choice, file control, page management, progress/cancel/status | Camera denied/no camera alternative, 320 px, interruption/offline, no drag-only | `UX-FLOW-P1-003`, `UX-SCR-P1-009`–`011`, `AC-P1-ING-001` |
| Quarantine/clinical hold | Blocking state announced, ordinary routes absent, restricted actions labelled | Generic non-alarming copy; no clinical detail; no disposition promise | `UX-FLOW-P1-004`, `UX-SCR-P1-012`, `DEC-036` |
| Extraction/evidence/version | Field/source relation, anchor navigation/focus return, table/diff semantics | Sequential compact review, zoom, low vision, partial/inaccessible source | `UX-FLOW-P1-005`–`006`, `UX-SCR-P1-013`–`016` |
| Facts/conflicts | Occurrence labels/time/evidence, conflict/status, form errors/review | Separate confidence/evidence; memory-light comparison; protected value | `UX-FLOW-P1-007`, `UX-SCR-P1-017` |
| Search/Q&A | Query form, working/result status, claims/citations, limitation headings | 320 px; no hidden facet/count; stale/conflicting/insufficient comprehension | `UX-FLOW-P1-008`, `UX-SCR-P1-018`–`019`, `AC-P1-RAG-001` |
| Source failure | Source-health/freshness announced, historical state persistent | Authority/health separation; retry/limitation clarity | `UX-FLOW-P1-009`, `UX-SCR-P1-020`, `AC-P1-MON-001` |
| Impact/approval/action/closure | Path-list alternative, dimension labels, approval preview, execution/verification statuses | One decision/step; no colour/score; timeout/reauth; partial/unknown outcome | `UX-FLOW-P1-010`–`011`, `UX-SCR-P1-021`–`023`, `AC-P1-E2E-001` |
| Expected evidence | Signals/options/fulfilment semantics, linked evidence, errors | No aggregate score; alternatives/waiver/NA/dismiss/remind clearly distinct | `UX-FLOW-P1-012`, `UX-SCR-P1-024`, `DEC-034` |
| Tasks/notifications | Task causality/status, notification announcement, transitions | Badges privacy-safe; quiet preference; channel fence explained | `UX-FLOW-P1-013`, `UX-SCR-P1-025`, `DEC-037` |
| Share/revoke | Scope form, effective-access preview, confirmation, revoke/status | No hidden expansion; target size; expired/revoked link; plain consequence | `UX-FLOW-P1-014`, `UX-SCR-P1-026`–`027`, `AC-P1-SEC-001` |
| Export | Scope/manifest/errors/status, step-up, download link | Partial versus complete; timeout/resume; route restriction | `UX-FLOW-P1-015`, `UX-SCR-P1-028` |
| Delete/restore | Consequence review, exact confirmation, status/residuals, focus after fence | No dark pattern or invented time; restore boundary; partial failure | `UX-FLOW-P1-016`, `UX-SCR-P1-029`, `AC-P1-DEL-001` |
| Recovery/continuity absent | Generic safe message and approved alternatives navigable | No evidence solicitation, nominee/trigger/release implication | `UX-FLOW-P1-017`–`018`, `UX-SCR-P1-031`–`032`, `DEC-032`, `DEC-038` |

Every journey is repeated with at least one validation error, async state change, current-policy change, and safe failure. `AC-P1-A11Y-001` passes only when capture, review, search, impact inspection, approval, sharing, export, and deletion complete with keyboard alone and the approved assistive-technology matrix without blocker, focus loss/trap, inaccessible status/error, or information available only visually.

## 7. Testing cadence and methods

| Stage | Minimum evidence |
|---|---|
| Design/content review | Annotated interaction/state specification, reading/focus order, names/roles/status, contrast/token check, cognitive walkthrough, decision/privacy review |
| Component build | Semantic/unit checks, automated accessibility engine, keyboard contract, high-contrast/reduced-motion/reflow snapshots with synthetic content |
| Feature integration | Manual keyboard and screen-reader flow, browser/zoom/touch matrix, async/error/permission state tests, accessibility-tree inspection |
| Every release | Full critical-journey matrix, automated page-state suite, regression of prior serious defects, approved exception review |
| Before beta/public launch | Independent specialist audit, representative disabled-user research/usability, conformance report, product/accessibility sign-off |
| Production monitoring | Privacy-safe defect/support signals and synthetic probes; no session replay or raw content; rapid containment of critical regression |

Automated tools can detect only part of WCAG and usability. Manual inspection must verify navigation logic, state comprehension, evidence relationships, live-region timing, destructive flows, cognitive load, privacy-safe wording, and real assistive-technology interaction.

## 8. Defect severity and release gate

| Severity | Definition | Release treatment |
|---|---|---|
| Blocker | Critical journey cannot be completed; keyboard trap; authentication impossible; safety/privacy disclosure; destructive effect cannot be understood/cancelled | Immediate stop-ship; no exception that permits unauthorized disclosure or inaccessible required action |
| Critical/serious | Essential content/state/evidence/error unavailable to a disability group; focus loss causes task/data loss; major reflow/contrast/name/role failure on a critical flow | Zero unresolved at release under `NFR-P1-022`; specialist retest required |
| Moderate | Material difficulty or inefficiency with a reliable accessible workaround | Fix before release or narrow, owned, expiring exception with documented workaround and user impact |
| Minor | Non-blocking inconsistency with low task impact | Planned remediation, regression coverage, and review for systemic pattern |

Severity is based on user/task impact, frequency, scope, safety/privacy consequence, and workaround—not automated-tool wording alone. A cluster of minor defects may be serious when it creates cumulative cognitive or navigation burden.

## 9. Acceptance mapping

| Rule range | WCAG/NFR emphasis | Product/UX acceptance |
|---|---|---|
| `A11Y-P1-001`–`A11Y-P1-006` | Complete conformance; `NFR-P1-022`–`NFR-P1-025` | `AC-P1-A11Y-001`; all Phase 1 critical journeys |
| `A11Y-P1-007`–`A11Y-P1-013` | 1.3.*, 2.4.*, 3.1.*, 3.2.*, 4.1.2 | Every `UX-SCR-P1-*`; safe landmarks/names/states |
| `A11Y-P1-014`–`A11Y-P1-020` | 2.1.*, 2.4.3/7/11, 2.5.*; `NFR-P1-023` | Keyboard-complete capture/review/search/approval/share/export/delete |
| `A11Y-P1-021`–`A11Y-P1-028` | 2.2.*, 3.3.*, 4.1.3; `NFR-P1-025` | Async ingestion, RAG, source, action, notification, revoke, deletion states |
| `A11Y-P1-029`–`A11Y-P1-035` | 1.4.*, 2.3.1, 2.5.8; `NFR-P1-024` | Compact/wide parity, zoom/reflow, contrast, touch, reduced motion |
| `A11Y-P1-036`–`A11Y-P1-042` | 1.1.1, 1.3.*, 2.1.*, 2.5.* | `AC-P1-ING-001`, `AC-P1-RAG-001`, evidence/diff/graph test suites |
| `A11Y-P1-043`–`A11Y-P1-050` | 3.1.*, 3.2.*, 3.3.7–3.3.8 | `PER-P1-005`, `JRN-P1-001`–`JRN-P1-010`, destructive/decision-fenced comprehension |
| `A11Y-P1-051`–`A11Y-P1-056` | Evidence and exception governance | `NFR-P1-022` stop-ship evidence and per-release conformance report |

## 10. Approval checklist

This contract remains DRAFT until:

1. the product owner and accessibility specialist approve WCAG 2.2 AA, the supported browser/assistive-technology/version matrix, target-size interpretation, defect severity, and exception authority;
2. design/content/security/privacy approve state language and ensure accessible alternatives do not create disclosure side channels;
3. quality maps stable automated and manual cases to every `A11Y-P1-*`, `UX-FLOW-P1-*`, `UX-SCR-P1-*`, applicable WCAG criterion, and `NFR-P1-022`–`NFR-P1-025`;
4. representative disabled-user research validates critical flows with synthetic or specifically consented content;
5. open-decision routes remain unavailable and testable rather than appearing as incomplete controls; and
6. the release conformance report and stop-ship evidence are reviewable without raw household data.
