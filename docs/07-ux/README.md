# UX Specification Index

| Field | Value |
|---|---|
| Document ID | `UX-IDX-001` |
| Version | `0.1` |
| Status | `DRAFT — product, design, accessibility, security, privacy, architecture, and quality approval required` |
| Product phase | Phase 1 — Personal and Family |
| Experience boundary | Shared React web/PWA and Flutter iOS/Android semantics; React-specific public product and legal surfaces; no enterprise administration UI |
| Updated | 30 August 2026 |

## Purpose

This folder translates the Phase 1 product, domain, security, document-intelligence, and AI contracts into a provider-neutral user-experience contract. Under `DEC-052`, authenticated critical journeys share the same state, authorization, evidence, failure, accessibility, and interaction semantics across the React web/PWA and Flutter iOS/Android clients even though they do not share UI source code. The public product, trust, privacy, terms, and browser account-entry surfaces are React-specific under `DEC-044`. The approved Doculyra identity, `Doculyra Home` edition name, folded-document `D` mark, and restrained black/graphite/grey/white direction come from `DEC-047`; implementation tokens remain independently testable. This pack does not redefine authorization, domain state, evidence, approval, retention, recovery, residency, or supported launch coverage.

The hierarchy in [`CODEX.md`](../../CODEX.md) applies. Approved decisions and accepted ADRs outrank every document in this folder. All six artifacts are DRAFT and do not open the implementation gate.

## Reading order

1. [`01-information-architecture.md`](01-information-architecture.md) — responsive shell, navigation, dossiers, route disclosure, and decision-fenced surfaces.
2. [`02-user-flows.md`](02-user-flows.md) — end-to-end critical journeys, recovery paths, and unavailable conditional branches.
3. [`03-screen-specifications.md`](03-screen-specifications.md) — screen inventory, actors, data, actions, states, responsive behavior, and privacy-safe analytics.
4. [`04-design-system.md`](04-design-system.md) — semantic tokens, components, status language, evidence presentation, and non-colour cues.
5. [`05-accessibility.md`](05-accessibility.md) — WCAG 2.2 AA target, normative accessibility rules, test matrix, and acceptance mapping.

Read these with the [Phase 1 PRD](../01-product/02-phase-1-prd.md), [feature catalogue](../01-product/03-feature-catalogue.md), [use-case catalogue](../01-product/04-use-case-catalogue.md), [personas and journeys](../01-product/05-personas-and-journeys.md), [workspace model](../02-architecture/04-workspace-family-membership-model.md), [NFRs](../02-architecture/05-non-functional-requirements.md), [document-intelligence index](../03-document-intelligence/README.md), [AI index](../04-ai/README.md), and [security index](../06-security/README.md).

## Namespace ownership

| Namespace | Owner | Contract |
|---|---|---|
| `UX-IA-P1-*` | `UX-IA-001` | Information hierarchy, routes, navigation, dossiers, disclosure, and responsive shell |
| `UX-FLOW-P1-*` | `UX-FLOW-001` | Human journeys, entry/exit conditions, decisions, failures, and resumability |
| `UX-SCR-P1-*` | `UX-SCR-001` | User-facing screen and state specifications |
| `UX-DS-P1-*` | `UX-DS-001` | Framework-neutral visual, interaction, content, and component rules |
| `A11Y-P1-*` | `UX-A11Y-001` | Accessibility behavior, evidence, testing, and release gates |

Normative words `MUST`, `MUST NOT`, `SHOULD`, and `MAY` have their usual requirements meaning. Exact domain values shown in code font are owned by their source contract and must not be renamed in implementation telemetry, API mapping, or test fixtures merely for display convenience. User-facing labels may be localized, but the underlying state and its meaning remain stable.

## Experience invariants

- Current authorization precedes route discovery, content, counts, facets, citations, actions, notifications, exports, and activity views.
- Receipt, extraction, review, fact resolution, applicability, fulfilment, approval, execution, verification, and closure remain separate.
- Evidence, confidence, applicability, severity, urgency, source authority, source health, and coverage remain visibly distinct.
- Async work has a durable, retrievable status and a truthful recovery path. Last-known success never masks current failure.
- Restricted, revoked, expired, deleted, quarantined, stale, partial, offline, and unavailable are different states; none becomes a generic empty screen.
- Critical journeys work on a small viewport, with keyboard and assistive technology, without hover, drag-only interaction, fine pointer control, or colour-only meaning.
- Ordinary product analytics contain only approved opaque identifiers, contract/state codes, safe counts or buckets, timing, and interaction outcomes—never household content.
- Phase 1 exposes personal and family participation only. Organisation workspaces, enterprise roles, SSO/SCIM administration, policy consoles, information barriers, DLP, cases/matters, and business-unit dashboards are absent.

## Approved boundaries and release-gated routes

| Decision | Required UX behavior |
|---|---|
| `DEC-032` | No emergency, incapacity, or after-death trigger, enrolment promise, nominee release, or automatic disclosure UI. Only ordinary scoped grants and owner-created curated exports remain available. |
| `DEC-034` | No readiness/content-health/compliance/risk score, percentage, traffic light, rank, trend, denominator, dashboard tile, or hidden score-based ordering. Show authorized item-level findings only. |
| `DEC-036` | Suspected clinical content stays in generic `POLICY_HOLD`; ordinary preview, download, OCR/AI, search, graph, notification, and analytics routes are absent. No copy promises reject, retention, recovery, export, or purge behavior. |
| `DEC-037` | In-app task/notification state is supported. External channels, their content, consent, quiet-period delivery, escalation, and success promises remain disabled unless approved. |
| `DEC-038` | No account/workspace recovery, factor bypass, ownership transfer, support override, or private-resource reassignment route. UI states the capability is unavailable without soliciting sensitive evidence. |
| `DEC-039`, `DEC-053` | Local synthetic deletion follows the content-free local profile. Production document deletion immediately fences access, uses restricted Trash for 30 calendar days, then requires coordinated purge/non-resurrection evidence. Account deletion, legal retention, backup expiry, and any other duration remain separately governed and must not be invented. |
| `DEC-040`, `DEC-049`, `DEC-050`, `DEC-055` | Azure `dev`/`stage` may identify their exact synthetic-data route. Customer content remains client-encrypted and plaintext intelligence is device-local by default. No generic “Australian hosted” or external-processing claim is allowed beyond the exact configured data class, processor, environment, and route; unknown/ineligible routes block or visibly degrade. |
| `DEC-044`, `DEC-047` | The React public experience presents Doculyra product, features, trust/privacy, about, contact, privacy and terms content with clear create-account/sign-in routes and the approved Doculyra identity. Preview and illustrative content must be labelled truthfully. |
| `DEC-052` | React web/PWA and Flutter mobile expose equivalent critical journey contracts, states, errors, evidence, authorization, and accessibility outcomes. Public marketing/legal routes remain React-specific. |

## Readiness and evidence

Before this pack can receive final specialist approval:

1. every screen and flow must link exact requirements, features, use cases, acceptance scenarios, NFRs, security rules, and domain states;
2. research must validate household mental models, evidence language, privacy-safe sharing previews, limitation states, destructive-action comprehension, and the conditional decision copy using synthetic or specifically consented data;
3. the accessibility evidence in `UX-A11Y-001` must meet provisional `NFR-P1-022`–`NFR-P1-025` and `AC-P1-A11Y-001`;
4. security/privacy tests must prove no disclosure through navigation, counts, timing, route errors, focus announcements, notifications, analytics, cached screens, or offline storage;
5. each configuration- or release-gated branch must remain accurately unavailable until its approved configuration and evidence exist; and
6. implementation backlog items must reference stable `UX-*`/`A11Y-*` IDs rather than screenshots alone.

The public experience may be included in the build baseline before production legal/contact release evidence exists, provided it remains explicitly a synthetic-data development preview. Final operator identity, production contact route, legal/privacy approval, public-domain configuration, supported browser/assistive-technology versions, representative disabled-user research, and release conformance evidence remain release gates rather than implied claims.
