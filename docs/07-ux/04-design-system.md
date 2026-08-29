# Phase 1 Design System Contract

| Field | Value |
|---|---|
| Document ID | `UX-DS-001` |
| Version | `0.1` |
| Status | `DRAFT — product, design, accessibility, security, privacy, and content approval required` |
| Product phase | Phase 1 — Personal and Family |
| Boundary | Provider-neutral semantic system; approved Doculyra identity; React and Flutter implementations remain separate |
| Primary screens | `UX-SCR-P1-001`–`UX-SCR-P1-047` |
| Approved boundaries | `DEC-032`, `DEC-034`, `DEC-036`–`DEC-040`, `DEC-044`, `DEC-047`, `DEC-049`–`DEC-053`, `DEC-055` |
| Updated | 30 August 2026 |

## 1. Purpose and principles

This document defines the semantic visual, interaction, content, and component contract shared by the authenticated React web/PWA and Flutter iOS/Android clients, plus the React-specific public product and legal surfaces. The clients do not share UI source code under `DEC-052`, but they preserve equivalent state, evidence, authorization, error, accessibility, and action meaning. `DEC-047` approves the Doculyra name, `Doculyra Home` Phase 1 edition, folded-document `D` mark, matching icon family, and restrained black/graphite/grey/white direction. This document does not choose a CSS/Flutter component library, design tool, font family, frontend architecture, animation library, browser-storage technology, or analytics provider; exact tokens remain subject to component-level accessibility evidence.

The system makes trust boundaries visible without turning them into decoration:

1. evidence is shown before consequence;
2. current state is shown before confidence;
3. uncertainty and restricted scope are explicit;
4. semantic dimensions never collapse into a single colour or score;
5. state-changing controls describe their effect rather than using generic “OK”; and
6. every visual relationship has structured text, keyboard operation, and assistive-technology meaning.

## 2. Token architecture

Tokens are versioned semantic roles. Raw values may change under approved brand/accessibility review without changing component meaning.

| Token family | Required semantic roles | Constraints |
|---|---|---|
| Colour | canvas, surface, elevated surface, text primary/secondary/inverse, border, focus, link, action primary/secondary/destructive, state info/attention/positive/negative/restricted/stale/unknown | A token name describes purpose, not a hue. State still includes text and/or icon/pattern. Forced-colours mode remains operable. |
| Typography | display/page/section/label/body/help/code/data | Relative units, user font/spacing resilience, clear heading hierarchy, no all-caps paragraph/status copy. Numeric identifiers use legible tabular alignment where helpful, never visual-only alignment. |
| Space | inline, control, cluster, section, layout gutters | A small consistent scale; content reflows instead of shrinking below readable size. Spacing changes cannot convey hierarchy alone. |
| Size | icon, control minimum, touch preferred, content measure, compact/medium/wide layout bounds | Interactive targets meet WCAG 2.2 AA minimum 24 by 24 CSS px or spacing exception; prefer at least 44 by 44 for primary touch controls. |
| Shape | control, card, popover, dialog, focus | Shape may distinguish component role but never status alone. |
| Elevation | base, navigation, popover, modal, blocking overlay | Layering preserves reading/focus order; an overlay cannot hide the focused element or status. |
| Motion | instant, short, standard, emphasis | Motion is functional, cancellable where applicable, and removed/reduced for `prefers-reduced-motion`; no parallax or essential timed animation. |
| Data density | comfortable, compact | User/system context may choose density, but the information/action set and touch/focus targets remain accessible. |

Contrast targets follow WCAG 2.2 AA: at least 4.5:1 for ordinary text, 3:1 for large text and meaningful non-text boundaries/icons, and an independently perceivable focus indicator. A visual token set cannot be approved from isolated swatches; states, overlays, disabled controls, charts, evidence regions, forced colours, dark/light preferences if offered, zoom, and common colour-vision conditions require component-level testing.

## 3. Semantic dimension grammar

Each dimension uses a dedicated labelled row or field, its own machine state, plain-language explanation, and optional distinct icon/colour token. Components MUST NOT infer one dimension from another.

| Dimension | Label and source | Required presentation | Must not imply |
|---|---|---|---|
| Evidence support | “Evidence” from exact anchors/source snapshots and support roles | Source/version, direct/context/qualifier/contradictory role, openable authorized citation, missing/restricted/invalid state | Truth, confidence, authority, applicability, fulfilment, compliance |
| Confidence | “Confidence” from capability/slice calibration | Approved calibrated band/value, calibration scope/version where material, `UNCALIBRATED`/review route, explanation | Evidence strength, probability of legal correctness, priority, permission, approval |
| Applicability | “Applicability” from `DIT-MON-001` | Exact `APPLICABLE`, `NON_APPLICABLE`, `INDETERMINATE`, `REVIEW_REQUIRED`, `RESTRICTED`, or `UNAVAILABLE` label plus rationale/unknowns | Source authority, severity, confidence, obligation, action success |
| Impact class | “Type of impact” from `DIT-IMP-001` | Exact primary class and plain-language next-work meaning | Severity, urgency, confidence, automatic execution authority |
| Severity | “Severity” from the active versioned severity definition | Exact configured label/version and derivation access; `UNASSIGNED` when absent | Urgency, due date, confidence, applicability, risk score, action authority |
| Urgency | “When attention may be needed” from explicit rule/date | Exact due/effective time, time zone, rationale, unknown/overdue state | Severity or correctness |
| Source authority | “Source authority” from registry tier | Exact approved tier/label, source/version and coverage | Freshness, health, complete coverage, legal advice |
| Source health | “Source health” from `DIT-SRC-001` | Exact health state, last attempt/success/observation, freshness and parser state | Authority, applicability, confidence, “no change” |
| Coverage | “Coverage” | Included/excluded/missing/restricted/truncated classes and temporal scope | Completeness outside declared scope |
| Verification/fulfilment | Separate “Evidence verification” and “Requirement status” fields | Exact owning states and evidence criteria | That receipt, extraction, task completion, or elapsed time proves fulfilment |

The current reference-data seed marks severity labels DRAFT/runtime-disabled under `DEC-035`; the design system does not activate or rank them. Until an approved definition is enabled, present “Severity: not assigned” when the field is required and omit severity-based sorting/escalation.

### 3.1 State-chip anatomy

A compact state chip contains:

1. semantic icon or pattern where space permits;
2. visible text label;
3. machine state available to the component but not exposed as unexplained jargon;
4. optional short qualifier such as “last checked 24 Aug” outside the accessible name when necessary; and
5. a description/control relationship to a fuller explanation.

Colour, position, fill, motion, acronym, icon shape, or tooltip alone is insufficient. Tooltips may supplement but never contain the only label, error, evidence, or action.

## 4. Status and limitation presentation

| Contract family | Presentation rule |
|---|---|
| Ingestion | Show exact milestone and plain-language meaning; `READY` is “processing ready,” not “verified” or “complete.” Quarantine/hold uses blocking containment styling and removes ordinary content/actions. |
| Extraction | Proposed/review-required/accepted-as-extraction/corrected/rejected/superseded remain distinct and cite evidence. |
| RAG/search | Show `SUPPORTED`, `CONFLICTING`, `STALE`, `INCOMPLETE`, `INSUFFICIENT`, `RESTRICTED`, and `UNAVAILABLE` at answer/result level; composable limitations use a list, not one blended state. |
| Source health | Use exact state plus last attempt/success/freshness and affected capability. Historical last-known content has a persistent dated banner, not a transient toast. |
| Impact/action | Impact class, recommendation decision, approval, execution, verification, and closure each occupy separate sections. Unknown/partial external outcome is visually persistent. |
| Expected evidence | Display all authorized item-level signals, disposition, verification, and fulfilment. No aggregate score, progress percentage, traffic light, ring, rank, or “complete household” illustration. |
| Access | Restricted, redacted, minimal disclosure, revoked, and expired use different copy/actions internally; policy may normalize the external existence message. |
| Deletion | Archive/Trash/fence/purge/residual/verification states use a timeline or list with exact achieved milestones and unknowns. Production document Trash uses the approved `DEC-053` 30-calendar-day boundary; local, account, lawful-retention, backup-expiry, and other durations remain separately governed. |

Positive styling is reserved for an exact successfully achieved domain state. It MUST NOT be used for “no visible findings,” “no search result,” accepted upload, provider acknowledgement, high confidence, an unverified file, or a task check-off that still requires evidence.

## 5. Core component contracts

| Component | Required anatomy/behavior | Critical variants |
|---|---|---|
| Application shell | Skip link, current workspace, primary destinations, account/settings, service state, one main landmark | compact/medium/wide; offline; auth unavailable; workspace switch |
| Workspace switcher | Current workspace name only when authorized, type, switch action, safe loading | no hidden counts/recents; clears current content; keyboard typeahead only over authorized options |
| Breadcrumb/back context | Safe hierarchical labels and current-page relation | restricted ancestor uses generic label/omission; compact back control retains full accessible name |
| Section tabs | Tab list or equivalent in stable order, selected state, panel relation | overflow becomes labelled menu/section links; hidden tab existence cannot leak data |
| Page/state header | One heading, separate state fields, freshness/coverage, primary action | loading/partial/stale/restricted/deleted; no composite score |
| Banner/alert | Scope, state, consequence, safe next action, dismiss policy | persistent stale/partial/offline; assertive safety/revocation; no content in live text |
| Toast/status | Short confirmation of a non-blocking achieved milestone with link to durable state | never sole error, approval, action, deletion, or evidence record; respects time/read pause |
| Form field | Label, required/optional, input, description, error, units/format, value-state | protected/redacted, uncertain, composite/repeated, read-only; placeholder not label |
| File intake | Labelled drop/select area plus ordinary file control, constraints, chosen file safe display, progress/cancel | keyboard/no-drag, offline, resume, unsupported, encrypted/corrupt, duplicate |
| Camera capture | Permission explanation, live region instructions, capture, page list, quality/retake, file/manual alternative | permission denied, low quality, no camera, orientation, reduced motion |
| Async progress | Exact durable milestone, current work, last update, leave/return, retry/cancel | indeterminate progress without fake percentage; partial, unknown outcome, cancellation requested |
| List/card | Heading/link, scoped metadata, separate states/dimensions, allowed actions | empty/loading/stale/restricted row; user-controlled sort; privacy-safe count |
| Data table | Caption, headers, row headers where needed, keyboard-accessible actions, responsive equivalent | comparison/history/audit; horizontal scroll only if intrinsic; no hover-only detail |
| Evidence card | Claim/field, source/version, anchor role, excerpt only if authorized, temporal/source health, open action | contradictory/qualifier/restricted/unavailable; exact citation validation |
| Evidence viewer | Page/anchor navigation, zoom, text alternative, highlighted region, focus return | span/polygon/table/sheet/slide; adjacent region restriction; expired/deleted |
| Fact/occurrence card | Fact definition, source, valid/recorded time, evidence, confidence, review/conflict | protected value, dispute, tolerated conflict, unavailable evidence |
| Dimension stack | One labelled row per applicability/impact/severity/urgency/confidence/evidence/source/coverage value | unknown/restricted/unavailable values stay separate; no combined colour block |
| Path list/graph | Ordered typed hops, endpoints, evidence, direction, cycle/truncation/coverage; graph optional | restricted bridge, stale edge, no path within scope; complete text equivalent |
| Version diff | Exact base/target, source-side labels, added/removed/changed/uncertain semantics, anchors | colour-plus-text/pattern; no-change-within-scope; incomplete/restricted side |
| Task card | Cause, owner, due/state, evidence requirement, allowed transition | minimal-disclosure action exists; source stale; task complete but evidence pending |
| Approval summary | Exact inputs/effect/target/revision, evidence, policy/expiry/invalidation, approver authority | step-up, changed input, stale/revoked approval, audit unavailable |
| Destructive dialog/page | Exact action/target/scope, consequences, recoverability, affected classes, residuals, explicit confirmation | revoke/cancel/archive/trash/purge/account/workspace deletion; no generic “Are you sure?” |
| Empty state | Scope statement, reason only when safely known, one safe next step | no visible items, restricted/partial/stale distinction; no celebratory compliance imagery |
| Error summary | Page-level linked list plus field errors, what was accepted/preserved, recovery | focus on summary after failed submit; safe correlation; no raw provider/content detail |
| Public navigation/header | Approved Doculyra wordmark/mark, labelled section links, create-account/sign-in actions, compact menu with explicit state | React-specific; keyboard/Escape/focus return; no icon-only destination, active Business/Enterprise implication, or account-mode ambiguity |
| Public product preview | Clearly illustrative product structure and synthetic example labels | never current user data, complete coverage, production assurance, or hidden personalized claim |
| Public contact state | Configured approved destination or explicit unavailable/pending explanation | no invented address, simulated delivery, free-text analytics, or implied production support |
| Privacy/terms page | Doculyra context, one page heading, document kind/status/effective date, structured sections, contact availability and safe return links | React-specific direct route; viewing does not force acceptance; development wording is not final production legal approval |

## 6. Content and terminology

### 6.1 Voice

Copy is direct, calm, specific, and non-judgmental. It explains what the service observed, which source/time/scope applies, what remains unknown, and what the user can safely do. It does not imitate a regulator, lawyer, doctor, financial adviser, insurer, government agency, or family authority.

| Avoid | Use instead |
|---|---|
| “Everything is up to date” | “No authorized item-level findings are available in this view. Coverage and source status are shown below.” |
| “You are compliant” | “The configured evidence requirement is fulfilled for this case and effective period.” |
| “AI verified” | “The extraction passed the listed checks and requires/received the named review.” |
| “No document exists” | “No document is available in your current access and scope.” |
| “This definitely applies” without rule outcome | “Applicability: APPLICABLE under rule/version …” with evidence and limitations |
| “Action complete” after dispatch | “Sent; outcome awaiting confirmation” or exact action state |
| “Permanent deletion in 30 days” | Exact current deletion state and residual categories; no duration until approved |
| “Stored in Australia” | Exact configured environment, data class, processor and route statement under `DEC-049`/`050`/`055`; otherwise unavailable/unknown |

### 6.2 Dates, numbers, and identifiers

- Show human-readable local date/time plus time zone when consequence depends on time; retain an exact machine value for accessibility/detail.
- Do not use relative time alone for expiry, due dates, approval, source freshness, evidence validity, deletion, or legal/effective perspective.
- Preserve source precision: do not invent a day, time, currency, timezone, unit, decimal, or identifier formatting.
- Large/sensitive identifiers are not copied to labels, URLs, analytics, or clipboard automatically; masked display does not imply access to the unmasked value.
- Counts state scope; zero is not “healthy,” and `NO_DATA` is not 100%.

### 6.3 Actions

Buttons use verb plus object/effect: “Approve this request,” “Request cancellation,” “Revoke access,” “Download export,” “Move to trash,” “Request deletion.” Generic “Yes,” “OK,” “Submit,” “Continue” is permitted only when the preceding step and accessible name retain the unambiguous effect. Destructive and safe escape actions are visually and semantically distinct without swapping order unpredictably across screens.

## 7. Evidence, comparison, graph, and confidence details

### 7.1 Evidence anchors

Anchor highlights never depend on colour alone. Use an outline/pattern plus a labelled marker connected programmatically to the claim/field. Text spans expose exact selected text only when authorized; a page-region-only anchor has a concise reviewer-provided or generated accessible description that is itself protected/reviewed. Zoom/pan does not trap keyboard or obscure the source label.

### 7.2 Differences

Added, removed, changed, moved, unchanged-within-scope, uncertain, and inaccessible content use text labels, structural markup, and optional distinct patterns/icons. Strikethrough alone is insufficient. A diff summary links to each difference; each side is separately authorized. `INDETERMINATE`/partial/restricted comparison cannot show a reassuring “no changes” illustration.

### 7.3 Graphs and timelines

Every graph has a path-list/table representation containing exact typed endpoints/edges, direction, evidence, versions, time, cycle, restriction, and truncation. Keyboard users can traverse the list in document order and open the same evidence/actions. Spatial proximity, node size, edge thickness, animation, or colour never communicates authorization, relevance, severity, confidence, or completeness alone.

### 7.4 Confidence

Confidence is shown only when a registered capability and calibration slice supplies an approved display. A numeric value never appears without the calibration scope/band meaning and review implication. Provider raw scores stay in restricted provenance, not household UI. Confidence bars, stars, gauges, rankings, or “accuracy” percentages are prohibited unless a later evaluated contract demonstrates comprehension and non-conflation; high confidence never changes action styling or skips review.

## 8. Decision-fenced presentation

| Decision | Component/system fence |
|---|---|
| `DEC-032` | No continuity enrolment card, nominee chip, countdown, trigger upload, release status, or guarantee component. Ordinary share/export components retain their own labels. |
| `DEC-034` | No score/gauge/ring/traffic-light/dashboard grade, hidden score token, progress-to-compliance, ranking, celebratory empty state, or accessible-name score. |
| `DEC-036` | `POLICY_HOLD` uses generic containment component; no content preview, ordinary metadata, clinical detail, or implied final action. |
| `DEC-037` | Channel picker exposes only approved enabled channels. Current seed external channels are DRAFT/disabled; do not render them as “coming soon” commitments. |
| `DEC-038` | No recovery wizard, upload-evidence form, support override, ownership transfer, or family attestation component. |
| `DEC-039`, `DEC-053` | Local synthetic and production document deletion policies stay distinct. A 30-calendar-day Trash boundary is shown only for the `DEC-053` production document route; other durations require their own policy. |
| `DEC-040`, `DEC-049`, `DEC-050`, `DEC-055` | No flag/map/data-centre icon or generic “Australian hosted” badge beyond an exact configured environment/data-class/processor route; unknown/ineligible route uses a blocking limitation and hosted AI receives no plaintext by implication. |
| `DEC-044`, `DEC-047` | React public/trust/legal components use the approved Doculyra identity, show accurate product and account-entry routes, and label development/illustrative content without implying release readiness. |
| `DEC-052` | React and Flutter components may differ visually and structurally but preserve equivalent semantic information, state, error, evidence, authorization, and accessibility outcomes for shared protected journeys. |

## 9. Draft normative rules

### Foundations

- `UX-DS-P1-001` — Design tokens MUST be semantic, versioned, theme/brand independent, and testable at component level; raw colour, pixel, font, shadow, and motion values MUST NOT become domain meaning.
- `UX-DS-P1-002` — Text and meaningful non-text contrast, focus indication, forced-colours behavior, zoom/reflow, target size, and motion MUST meet `A11Y-P1-*` and provisional `NFR-P1-022`–`NFR-P1-025`.
- `UX-DS-P1-003` — Colour, icon, shape, position, sound, motion, texture, or spatial relationship MUST NOT be the only means of conveying state, evidence, difference, error, requiredness, selection, or action.
- `UX-DS-P1-004` — Components MUST inherit user text-size, spacing, contrast, motion, input, language, and platform accessibility settings without loss of content or function.
- `UX-DS-P1-005` — Framework, library, provider, CSS methodology, font, analytics, and device-specific choices remain implementation decisions subject to this semantic contract. Brand implementation MUST remain consistent with approved `DEC-047` and cannot replace semantic state meaning with colour or decoration.

### State and trust language

- `UX-DS-P1-006` — Evidence, confidence, applicability, impact class, severity, urgency, source authority, source health, coverage, verification, and fulfilment MUST use separate labelled components and source states.
- `UX-DS-P1-007` — A state component MUST include visible text and programmatic meaning; colour/icon MAY reinforce but cannot replace them.
- `UX-DS-P1-008` — Domain state labels MAY be localized for display only when the exact machine state, meaning, and test mapping remain stable and no stronger conclusion is introduced.
- `UX-DS-P1-009` — Positive/success styling MUST appear only for the exact achieved state and declared scope; no result, no visible finding, acceptance, acknowledgement, high confidence, or task check-off MUST NOT appear as verified success.
- `UX-DS-P1-010` — `READY` MUST be labelled as processing readiness; extraction acceptance, fact resolution, applicability, fulfilment, approval, execution, evidence verification, and closure remain separate.
- `UX-DS-P1-011` — Stale/last-known content MUST carry a persistent dated label and affected-scope explanation; a transient toast or muted colour is insufficient.
- `UX-DS-P1-012` — Restricted/minimal-disclosure wording MUST follow current policy and MUST NOT reveal hidden existence through labels, icons, counts, layout gaps, timing, or accessible descriptions.

### Components and interaction

- `UX-DS-P1-013` — Every interactive component MUST have an accessible name, role, value/state, keyboard operation, visible focus, and a target meeting the approved WCAG 2.2 AA criterion.
- `UX-DS-P1-014` — Hover, long press, swipe, drag, pinch, pointer precision, device motion, camera, colour, or simultaneous panes MUST always have an equivalent explicit control/path.
- `UX-DS-P1-015` — Dialog/popover/drawer behavior MUST preserve logical focus entry, containment where appropriate, Escape/cancel, focus return, background inertness, and must never confirm an action by dismissal.
- `UX-DS-P1-016` — Toasts MUST NOT be the only record of error, approval, execution, evidence, deletion, or other consequential state; durable status remains on the owning screen/dossier.
- `UX-DS-P1-017` — Async progress MUST show exact durable milestones and indeterminate work honestly; fake percentages, countdowns, or optimistic completion are prohibited.
- `UX-DS-P1-018` — Forms MUST use persistent labels, explicit required/optional state, format/units, linked errors, error summary on failed submit, and preserve authorized input through recoverable errors/reauthentication.
- `UX-DS-P1-019` — Camera capture MUST include file/manual alternatives, accessible page management, non-visual quality guidance, permission-denied recovery, and no gesture-only operation.
- `UX-DS-P1-020` — Tables, diffs, graphs, charts, evidence regions, timelines, and spatial diagrams MUST provide an equivalent structured text representation and direct access to the same evidence/actions.
- `UX-DS-P1-021` — Compact and wide component variants MUST preserve information, action, state, reading/focus order, and error/context state; visual relocation cannot change semantics.
- `UX-DS-P1-022` — Destructive/consequential controls MUST name the effect, expose a scope/consequence preview, require explicit confirmation and current reauthorization, and retain a neutral safe exit.

### Content, privacy, and decisions

- `UX-DS-P1-023` — Product copy MUST state evidence, source/time/scope, limitation, and next step without claiming legal/medical/tax/financial/insurance/immigration certainty or complete monitoring.
- `UX-DS-P1-024` — Dates affecting expiry, effectiveness, approval, evidence, freshness, tasks, or deletion MUST include absolute date/time and time zone/precision as applicable; relative time alone is prohibited.
- `UX-DS-P1-025` — Sensitive values, names, filenames, evidence text, query/answer text, URLs, tokens, and protected identifiers MUST NOT appear in component analytics, browser/title metadata, error detail, test snapshots, or unapproved clipboard/download surfaces.
- `UX-DS-P1-026` — Counts, percentages, denominators, badges, facets, rankings, sorting, and empty-state illustrations MUST have an authorized scope and MUST NOT disclose restricted contributors.
- `UX-DS-P1-027` — Under approved `DEC-034`, aggregate readiness/content-health/compliance/risk scores and every visible, hidden, colour, rank, trend, progress, or accessible-name proxy are prohibited.
- `UX-DS-P1-028` — Under approved `DEC-036`, suspected clinical `POLICY_HOLD` MUST use generic containment presentation with no ordinary content or inferred disposition beyond configured restricted policy.
- `UX-DS-P1-029` — External notification channels MUST render only when an approved, enabled channel definition exists; `DEC-037` does not authorize placeholder delivery claims.
- `UX-DS-P1-030` — Recovery and automated continuity components MUST be absent except accurate unavailable-information surfaces under approved `DEC-032`/`DEC-038`.
- `UX-DS-P1-031` — Deletion components MUST show actual state/residuals and MUST NOT display a duration, deadline, countdown, or total-erasure claim outside the exact applicable `DEC-039` or `DEC-053` policy.
- `UX-DS-P1-032` — Residency components MUST show only the configured exact environment/route/data-class status and MUST NOT use a generic Australian-location badge or consent-based exception assumption.
- `UX-DS-P1-033` — Phase 2 organisation, business-unit, SSO/SCIM, tenant-admin, policy, DLP, information-barrier, matter/case, legal-hold, and enterprise-dashboard components MUST be absent from Phase 1.

### Governance and verification

- `UX-DS-P1-034` — Every production component MUST have stable component/version identity, documented states/variants, content contract, accessibility semantics, responsive behavior, privacy classification, analytics allow-list, and test fixtures.
- `UX-DS-P1-035` — Component examples, screenshots, visual regression fixtures, demos, and research prototypes MUST use synthetic non-personal content and disabled decision-fenced data.
- `UX-DS-P1-036` — A component change affecting domain meaning, destructive action, privacy disclosure, accessibility, or configuration-/assurance-/release-gated behavior requires cross-contract impact review and versioned migration evidence.
- `UX-DS-P1-037` — Visual regression cannot be the sole acceptance method; semantic DOM/accessibility tree, keyboard, state, disclosure, reflow, current-policy, and content-safety tests are mandatory.
- `UX-DS-P1-038` — New component variants MUST fail safely for unknown domain states and MUST NOT map them to success, absence, generic low severity, or a default colour.
- `UX-DS-P1-039` — Disabled controls MUST be accompanied by perceivable reason and safe next step when relevant; a tooltip-only or lower-opacity-only explanation is insufficient.
- `UX-DS-P1-040` — Analytics/experimentation MUST NOT change authorization, evidence, ordering by hidden protected state, destructive confirmation, decision fences, accessibility semantics, or user safety copy.

## 10. Component test matrix

| Component family | Required automated evidence | Required manual evidence |
|---|---|---|
| Shell/navigation/tabs | semantics, current page/selection, route disclosure, keyboard, reflow, focus visibility | screen reader landmarks, 320 px/400% zoom, workspace switch/revoke |
| Forms/capture | label/error association, input purpose, target size, no drag-only, saved-state contract | keyboard/screen reader, camera denied, file/manual alternative, low vision, interruption |
| Status/banner/progress | state-to-copy mapping, live-region dedup, unknown-state failure | async updates without focus loss, stale/partial/restricted comprehension |
| Evidence/diff/graph | exact source IDs, structured alternative, non-colour difference, anchor authorization | zoom/screen reader/keyboard evidence navigation and restricted regions |
| Dimension stack | exact independent source values, no inferred/combined state, no score | user comprehension of evidence/confidence/applicability/severity/source health separation |
| Dialog/destructive action | focus containment/return, explicit action, no dismissal-submit, current revision | keyboard/voice/switch input, reauth return, deletion/revoke comprehension |
| Responsive variants | content/action parity, reading/focus order, no hidden overflow | phone/tablet/desktop, text spacing, portrait/landscape independence, on-screen keyboard |

## 11. Traceability

| Rule range | Primary trace |
|---|---|
| `UX-DS-P1-001`–`UX-DS-P1-005` | `NFR-P1-022`–`NFR-P1-025`; `SEC-P1-016`; `AC-P1-A11Y-001` |
| `UX-DS-P1-006`–`UX-DS-P1-012` | `REQ-P1-ACT-002`–`REQ-P1-ACT-004`; `REQ-P1-MON-005`–`REQ-P1-MON-007`; `DIT-MON-P1-001`; `DIT-IMP-P1-001`; `DIT-SRC-P1-001`; `DIT-HLT-P1-001`; `AI-RAG-P1-015`–`AI-RAG-P1-019` |
| `UX-DS-P1-013`–`UX-DS-P1-022` | `PER-P1-005`; `JRN-P1-001`–`JRN-P1-010`; `UX-FLOW-P1-019`–`UX-FLOW-P1-028`; `NFR-P1-023`–`NFR-P1-025` |
| `UX-DS-P1-023`–`UX-DS-P1-033` | `REQ-P1-TRUST-002`–`REQ-P1-TRUST-009`; `REQ-P1-CFG-005`; `AUTH-P1-008`–`AUTH-P1-011`, `AUTH-P1-025`, `AUTH-P1-030`–`AUTH-P1-034`; `PRIV-P1-020`–`PRIV-P1-030` |
| `UX-DS-P1-034`–`UX-DS-P1-040` | `AC-P1-A11Y-001`, `AC-P1-SEC-001`; `NFR-P1-022`–`NFR-P1-025`, `NFR-P1-033`, `NFR-P1-036`; `AUD-P1-025`–`AUD-P1-030` |
