# Product Vision and Strategy

| Field | Value |
|---|---|
| Document ID | `PROD-VIS-001` |
| Status | **DRAFT — not an approved implementation baseline** |
| Product phase | Phase 1 direction with Phase 2 boundaries |
| Jurisdiction | Australia first; jurisdiction-neutral core |
| Updated | 26 August 2026 |
| Normative basis | `DEC-001`–`DEC-011`, `DEC-020`–`DEC-024` |
| Companion | [`PROD-SCOPE-001`](06-scope-and-success-metrics.md) |
| Draft candidate normative baseline | [`docs/01-product/02-phase-1-prd.md`](02-phase-1-prd.md) |

## 1. Purpose and authority

This document explains why the product should exist, whom it serves, how it should compete, and which principles should guide product choices. It does not define implementable requirements or approve a release scope. Those belong in the draft [Phase 1 PRD](02-phase-1-prd.md) once approved, supported by use cases, contracts, UX specifications, reference data, tests, and backlog acceptance criteria.

Approved entries in the [decision register](../00-context/decision-register.md) are constraints. The [competitive and gap analysis](07-competitive-gap-analysis.md) is research evidence: its `GAP-*` items and parity recommendations remain non-normative until an approved decision or the PRD explicitly adopts them.

## 2. Vision

Give people and families a trustworthy, living view of their important documents: what each document means, which facts and obligations it supports, what has changed, what else is affected, and what should happen next.

The product is an AI-native document-intelligence and change-monitoring platform, not merely a storage repository (`DEC-001`). AI is a means of interpreting evidence and reducing administration; it is not itself the customer promise and is never an independent source of approved truth.

## 3. Problem

Important household information is fragmented across files, inboxes, providers, portals, physical records, and family members. A conventional vault can preserve files but leaves the user to determine:

- which version is current;
- which people, assets, policies, accounts, or obligations a document concerns;
- whether extracted information is reliable;
- what has expired, become inconsistent, or needs review;
- which other documents or organisations are affected when a fact changes;
- whether a recommendation is relevant to the user and their jurisdiction;
- who is allowed to see the underlying evidence; and
- whether an intended action was completed and supported by replacement evidence.

The cost is not only time. Missed renewals, stale facts, inappropriate sharing, unsupported advice, and silent automation can create financial, legal, privacy, and safety consequences.

## 4. Product promise

> When something changes, know every document and action it affects—and why.

The complete product promise is an inspectable lifecycle:

`Evidence → interpreted document → resolved fact or rule → detected change → applicability → dependency impact → recommendation → approval → action → completion evidence → audit`

Each step preserves evidence, authorization, provenance, confidence, and user control. A later step must not imply that an earlier one was verified: receiving a file is different from extracting a value; extracting a value is different from accepting a fact; accepting a fact is different from satisfying a requirement; and approving an action is different from verifying completion.

## 5. Positioning

### 5.1 Market position

The product should be positioned as a living, evidence-backed document intelligence system for personal and family administration. It reconciles important facts, watches relevant change, explains downstream impact, and acts only with approval.

It should not lead with “AI-native document management,” “knowledge graph,” “document chat,” “missing documents,” or “proactive reminders” as standalone differentiators. Current products already claim or provide many of those capabilities. The defensible value is the governed combination of evidence, applicability, causality, current authorization, approval, and auditable closure.

### 5.2 Category boundaries

The product is:

- broader than a secure file vault because it interprets, links, monitors, and explains;
- more durable than a document-chat interface because accepted facts, decisions, and evidence have governed lifecycle state;
- safer than an autonomous general agent because consequential actions require evidence, policy checks, approval, and audit;
- more personal than an enterprise document-management system because the experience starts with household jobs rather than records-administration concepts; and
- designed for later organisational extension without exposing Phase 2 administration in Phase 1.

It is not a law firm, financial adviser, medical-record system, or guarantee that a person is legally compliant. Consequential statements require explicit evidence and applicability, and the experience must communicate uncertainty and source limitations.

## 6. Target users

### 6.1 Primary launch users

Per `DEC-023`, Phase 1 is designed first for:

- **Household owner:** the person establishing a trusted personal or family record, organising important documents, and deciding what needs attention.
- **Family administrator:** a person coordinating documents, reminders, and access for a household while respecting resource-level privacy.

The product should work for one-person households as well as families. A personal workspace must not feel like an incomplete family product, and a family workspace must not make membership equivalent to unrestricted visibility.

### 6.2 Supported participants

Phase 1 may support other family members, subjects without accounts, and limited guests through the `Identity → Membership → Workspace → Resources` model approved in `DEC-003`. Precise roles, age/capacity rules, delegation, consent, and transition behavior require the PRD, authorization model, and UX flows before implementation.

Advisers are supported only through limited guest or delegated access in Phase 1. There is no separate adviser product (`DEC-023`). The user experience must make the scope, duration, evidence visibility, and revocation of that access understandable.

### 6.3 Explicit non-targets for Phase 1

- Organisation administrators and enterprise records teams.
- A standalone adviser-led product.
- Users seeking storage and processing of clinical or medical records; health-insurance and general coverage documents remain eligible (`DEC-024`).
- Users requiring native mobile applications before the responsive web/PWA workflows are validated (`DEC-021`).

## 7. Priority user jobs

The product strategy is organised around jobs, not repository features:

1. **Collect and regain control.** Bring an important document into a trusted workspace and understand its processing and privacy state.
2. **Know what is current.** See the logical document, its immutable originals and versions, and whether review or replacement is needed.
3. **Understand with evidence.** See extracted facts, dates, parties, and obligations with exact provenance, confidence, and review state.
4. **Find and ask safely.** Retrieve a document or answer with evidence that the current user is authorized to see.
5. **Understand change.** See which documents, people, obligations, providers, and tasks are affected by a confirmed fact, document, event, or authoritative-rule change.
6. **Decide and close the loop.** Approve, edit, reject, defer, dismiss, or mark an item not applicable; then retain evidence of the completed outcome.
7. **Coordinate without oversharing.** Give a family member or limited guest only the access needed and revoke it predictably.
8. **Leave with the record intact.** Export or delete information through transparent, auditable controls once the governing specifications define the exact behavior.

## 8. Strategic pillars

### 8.1 Evidence-backed understanding

Original binaries remain immutable, logical documents retain version and supersession history, and extracted fields point back to exact occurrences (`DEC-005`). AI output is a proposed interpretation until the applicable review or resolution process accepts it.

### 8.2 Canonical facts with history

Canonical facts are independent of mutable document metadata (`DEC-004`). A fact can have multiple supporting or conflicting occurrences, effective periods, provenance, confidence, and resolution history. This allows a user to change a fact once and inspect its downstream consequences without rewriting source evidence.

### 8.3 Applicability and causal impact

Monitoring is valuable only when the product can explain why a change applies to this workspace, subject, jurisdiction, document, or effective period. Impact should be expressed as an understandable dependency path, not an unexplained score or opaque graph.

### 8.4 Human-controlled action

Consequential recommendations and updates require evidence, explanation, human approval, and audit (`DEC-006`). The system may prepare a proposed action, checklist, or draft, but approval and completion are distinct states.

### 8.5 Private family collaboration

Authorization is evaluated at retrieval, graph traversal, inference, evidence display, and action time (`DEC-008`). The product may disclose that attention is required without leaking another member’s restricted facts or documents.

### 8.6 Australia-first relevance

The initial jurisdiction pack uses Australian terminology, sources, document types, and scenarios while core contracts remain jurisdiction-neutral (`DEC-020`). Jurisdiction-specific content must identify authority, applicability, evidence, effective time, confidence, and review needs.

### 8.7 Consumer simplicity on extensible foundations

Phase 1 uses personal and family workspaces. Organisation workspaces and enterprise controls are Phase 2 extensions (`DEC-002`). Core abstractions may reserve later capabilities, but Phase 1 navigation and workflows must remain understandable to household users.

## 9. Product principles

| Principle | Product rule | Practical implication |
|---|---|---|
| Evidence before assertion | Consequential claims are tied to inspectable evidence or explicitly state that evidence is insufficient. | No uncited recommendation is presented as authoritative. |
| State means one thing | Received, extracted, accepted, current, satisfied, approved, acted, and verified are distinct concepts. | UX and metrics cannot use “complete” for incompatible states. |
| Current authorization everywhere | Access is checked when information is retrieved, traversed, inferred, displayed, exported, or acted on. | An index-time permission check is insufficient. |
| Explain impact, not just alerts | A notification states what changed, why it applies, what is affected, confidence, evidence, and available decisions. | Alert volume is not a success metric. |
| Preserve history | Originals and consequential fact/rule history are not silently overwritten. | Corrections and supersession create traceable new state. |
| Approval is a control boundary | A recommendation does not authorize a consequential update or external action. | Approval, execution, and completion evidence remain separate. |
| Configuration over hard-coding | Taxonomy, monitoring rules, trusted sources, permissions, and workflows are jurisdiction-aware configuration (`DEC-007`). | New jurisdictions and Phase 2 domains do not require core rewrites. |
| Vendor-neutral core | Cloud, identity, storage, OCR, model, search, graph, and notification choices remain replaceable until approved (`DEC-009`). | Product contracts describe capabilities and evidence, not vendor behavior. |
| Honest freshness and uncertainty | Failed monitoring, stale evidence, low confidence, and incomplete coverage remain visible. | The last successful value must not masquerade as a current check. |
| User control and portability | Sharing, review, export, deletion, and action are understandable and auditable. | Lock-in or hidden state is inconsistent with the trust promise. |
| Accessible by default | Responsive and assistive-technology behavior is part of the primary experience, not a later variant. | The PWA-first decision includes mobile capture and accessible critical paths (`DEC-021`). |
| Safety outranks engagement | Privacy, approval, evidence, and integrity guardrails are not traded for more uploads, notifications, AI use, or session time. | Growth metrics cannot offset a safety breach. |

## 10. Phase strategy

The detailed boundary and unresolved scope candidates are maintained in [`PROD-SCOPE-001`](06-scope-and-success-metrics.md). At strategy level:

| Phase | Product boundary |
|---|---|
| Phase 1 | Personal and family workspaces; responsive web/PWA first; mobile camera capture; household-owner and family-administrator workflows; limited guest/delegated adviser access; Australia-first jurisdiction pack; multi-tenant cloud SaaS with strict workspace isolation and an Australian data-residency option. |
| Phase 2 | Organisation workspaces and enterprise administration, identity, governance, records, retention, legal hold, DLP, information barriers, compliance, and enterprise integration experiences built on the same core abstractions. |

The strategy does not imply that every proposed Phase 1 capability ships in the first release. MVP, beta, general-availability, and later Phase 1 slices must be selected in the PRD and represented in the backlog. Native applications follow only after core workflows are validated (`DEC-021`). Infrastructure and product vendors remain undecided (`DEC-009`, `DEC-022`).

## 11. Strategic differentiation and research inputs

The competitive research suggests focusing on the complete causal lifecycle rather than parity features. The following are strategy hypotheses, not approved requirements:

- bitemporal resolution of facts and rules;
- governed source snapshots, coverage, freshness, and parser health;
- expected-document requirements with alternatives and exceptions;
- conformed effective-document and obligation views;
- explainable document-health or readiness signals;
- time-aware or emergency access and curated offline packs;
- policy gates for agentic and bulk actions; and
- complete machine-readable portability.

The PRD must explicitly adopt, defer, reject, or route each `GAP-001`–`GAP-010` item for a product decision. Phase 2 reservations must not become Phase 1 enterprise UI solely because the data model allows them.

## 12. Strategic risks

| Risk | Consequence | Strategy response |
|---|---|---|
| The breadth of Phase 1 obscures first value. | A long build produces a complex product before validating trust and usefulness. | Define coherent release slices and prove evidence-backed capture, understanding, and one end-to-end change scenario first. |
| AI errors damage trust. | Incorrect facts or unsupported advice can create real-world harm. | Preserve occurrences, expose confidence, require review, cite evidence, and measure negative cases. |
| Family collaboration leaks sensitive data. | Membership or graph inference reveals restricted information. | Treat resource, field, edge, retrieval, and action authorization as product behavior. |
| Monitoring appears authoritative when stale or incomplete. | Users act on an outdated rule or false assurance. | Publish scope, freshness, failure, applicability, and confidence; never promise complete coverage. |
| Enterprise extensibility overwhelms consumer UX. | Phase 1 resembles a records-management console. | Reserve abstractions in contracts while keeping household language and workflows. |
| Jurisdiction expansion hard-codes Australia. | A second jurisdiction requires redesign. | Keep core schemas neutral and isolate jurisdiction packs, terminology, rules, sources, and tests. |
| Engagement incentives undermine safety. | More alerts, sharing, or AI actions are rewarded despite low value. | Use the outcomes, safety measures, and anti-metrics in `PROD-SCOPE-001`. |

## 13. From strategy to implementation baseline

The draft [Phase 1 PRD](02-phase-1-prd.md) must turn this direction into bounded, testable product requirements. Before it is approved, it must:

1. cite the approved decisions it implements;
2. define MVP, beta, and later Phase 1 scope rather than treating Phase 1 as one release;
3. disposition every research `GAP-*` item;
4. define primary use cases, failure cases, and explicit non-goals;
5. link each implementable requirement to UX, security, API/event, NFR, reference-data, test, and backlog artifacts; and
6. be explicitly approved or marked as an approved implementation baseline before application work begins.

Until then, this strategy remains a draft direction and must not be used to infer missing requirements.
