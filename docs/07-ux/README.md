# UX Specification Index

| Field | Value |
|---|---|
| Document ID | `UX-IDX-001` |
| Version | `0.1` |
| Status | `DRAFT — product, design, accessibility, security, privacy, architecture, and quality approval required` |
| Product phase | Phase 1 — Personal and Family |
| Experience boundary | Responsive web/PWA; no native application or enterprise administration UI |
| Updated | 26 August 2026 |

## Purpose

This folder translates the Phase 1 product, domain, security, document-intelligence, and AI contracts into a provider- and framework-neutral user-experience contract. It does not redefine authorization, domain state, evidence, approval, retention, recovery, residency, or supported launch coverage.

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

## Open-decision fences

| Decision | UX behavior while open |
|---|---|
| `DEC-032` | No emergency, incapacity, or after-death trigger, enrolment promise, nominee release, or automatic disclosure UI. Only ordinary scoped grants and owner-created curated exports remain available. |
| `DEC-034` | No readiness/content-health/compliance/risk score, percentage, traffic light, rank, trend, denominator, dashboard tile, or hidden score-based ordering. Show authorized item-level findings only. |
| `DEC-036` | Suspected clinical content stays in generic `POLICY_HOLD`; ordinary preview, download, OCR/AI, search, graph, notification, and analytics routes are absent. No copy promises reject, retention, recovery, export, or purge behavior. |
| `DEC-037` | In-app task/notification state is supported. External channels, their content, consent, quiet-period delivery, escalation, and success promises remain disabled unless approved. |
| `DEC-038` | No account/workspace recovery, factor bypass, ownership transfer, support override, or private-resource reassignment route. UI states the capability is unavailable without soliciting sensitive evidence. |
| `DEC-039` | Deletion screens show actual governed states and per-class residuals but no invented cooling-off, purge, backup-expiry, audit-retention, or completion duration. |
| `DEC-040` | UI makes no “Australian hosted” or processor-location claim. An unknown or ineligible processing route blocks or visibly degrades the operation; consent cannot cure an unapproved route. |

## Readiness and evidence

Before this pack can be approved:

1. every screen and flow must link exact requirements, features, use cases, acceptance scenarios, NFRs, security rules, and domain states;
2. research must validate household mental models, evidence language, privacy-safe sharing previews, limitation states, destructive-action comprehension, and the conditional decision copy using synthetic or specifically consented data;
3. the accessibility evidence in `UX-A11Y-001` must meet provisional `NFR-P1-022`–`NFR-P1-025` and `AC-P1-A11Y-001`;
4. security/privacy tests must prove no disclosure through navigation, counts, timing, route errors, focus announcements, notifications, analytics, cached screens, or offline storage;
5. each open-decision branch must remain unavailable or receive an approved decision plus revised product, security, data, API, UX, and test contracts; and
6. implementation backlog items must reference stable `UX-*`/`A11Y-*` IDs rather than screenshots alone.
