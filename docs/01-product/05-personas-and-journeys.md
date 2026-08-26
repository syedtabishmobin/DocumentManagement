# Phase 1 Personas and Journeys

| Field | Value |
|---|---|
| Document ID | `PROD-PER-001` |
| Version | `0.1` |
| Status | `DRAFT` |
| Product phase | Phase 1 — Personal and Family |
| Updated | 26 August 2026 |

## 1. Purpose and interpretation

This document describes the people, contexts, jobs, trust needs, and end-to-end experiences that the Phase 1 product must support. It refines `PROD-PRD-001` without granting permissions or inventing product scope.

Personas are research hypotheses for design and testing, not authorization roles. A persona may hold different memberships and grants in different workspaces. The normative authorization model must come from the approved security and reference-data specifications.

The example names are fictional. They do not constrain age, gender, family structure, language, disability, device, financial position, or legal relationship. UX research must validate and revise these hypotheses before a public launch.

## 2. Shared human needs

Across personas, users need to:

- understand what the product knows, why it believes it, and what remains uncertain;
- preserve original evidence while correcting extracted or resolved information;
- see relevant work without learning another person's private information;
- recover from upload, OCR, source, model, connector, network, and approval failures;
- distinguish a suggestion from an authoritative obligation or professional advice;
- use the critical workflows on small screens, with keyboard and assistive technology, and under time or cognitive pressure;
- control sharing, external processing, notifications, exports, and deletion;
- leave the service without losing the structured meaning built around their documents; and
- trust that stale monitoring, incomplete coverage, and restricted evidence will be disclosed rather than concealed.

## 3. Primary personas

### `PER-P1-001` — household organiser

**Context:** Responsible for getting a personal or family workspace into a usable state. May be a household owner or family administrator, but the product must not equate organisation responsibility with blanket access.

**Jobs to be done**

- Capture scattered household documents without designing a filing system first.
- Know which items need review and which suggestions can be trusted.
- Coordinate actions across people without repeatedly asking for private details.
- Prepare for address changes, renewals, travel, school transitions, tax time, property events, and emergencies.

**Trust needs**

- A clear explanation of what administrators can and cannot see.
- No silent sharing when a document is assigned to a person or household resource.
- Visible processing and monitor failures.
- Proof that approved actions produced the intended new evidence or version.

**Failure sensitivities**

- A confident but unsupported household-wide recommendation.
- Duplicate reminders caused by repeated upload or event delivery.
- A family dashboard that reveals a hidden document through a count, title, or score.
- Export that omits facts, relationships, tasks, or audit history.

**Mapped outcomes:** `OUT-P1-001`, `OUT-P1-003`, `OUT-P1-004`, `OUT-P1-005`, `OUT-P1-006`.

### `PER-P1-002` — privacy-conscious adult member

**Context:** Participates in a family workspace but expects control over personal documents, sensitive fields, and approvals. May also have a separate personal workspace.

**Jobs to be done**

- Keep selected evidence private while contributing enough information to household actions.
- Understand which facts or dependencies a shared workflow uses.
- Correct extraction and fact conflicts without exposing unnecessary source material.
- Revoke access and verify that search, AI, notifications, and exports reflect the revocation.

**Trust needs**

- Resource- and field-level access that is consistent across every derivative.
- A useful “action exists” path that does not disclose the protected value.
- Inspectable access history and sharing expiry.
- No assumption that family administration overrides consent or privacy.

**Failure sensitivities**

- Snippet, facet, graph, conversation, or notification leakage after revocation.
- An AI answer that cites evidence the questioner cannot open.
- Recovery or support procedures that bypass private-resource controls.

**Mapped outcomes:** `OUT-P1-002`, `OUT-P1-005`, `OUT-P1-006`, `OUT-P1-007`.

### `PER-P1-003` — parent or caregiver managing a dependant

**Context:** Maintains documents and deadlines for a child or another person who may not have an account. Authority, consent, and the dependant's future independence can change over time.

**Jobs to be done**

- Keep identity, school, travel, insurance, consent, and qualification evidence current.
- Answer time-sensitive questions such as expiry dates with exact evidence.
- Coordinate with another caregiver without exposing unrelated records.
- Preserve history when the dependant later receives independent access.

**Trust needs**

- A subject can exist without a fabricated login or email address.
- The product records why the caregiver can act and when that authority changes.
- Transition to independent access does not recreate or silently re-own history.
- Missing-document suggestions explain context and support not-applicable or alternatives.

**Failure sensitivities**

- Treating a family relationship as proof of legal authority.
- Showing a dependant's restricted evidence to every adult member.
- Losing provenance during transition or relationship change.

**Mapped outcomes:** `OUT-P1-001`, `OUT-P1-002`, `OUT-P1-003`, `OUT-P1-005`.

### `PER-P1-004` — limited adviser or helper

**Context:** An accountant, solicitor, broker, migration professional, executor, support person, or trusted relative receives access for a narrow purpose. `DEC-023` makes this a guest/delegated experience, not a separate adviser product.

**Jobs to be done**

- Review selected documents, evidence, comparisons, or tasks.
- Request clarification or replacement evidence without browsing the household.
- Complete the permitted work before access expires.
- Demonstrate what was accessed or changed.

**Trust needs**

- The invitation states purpose, scope, actions, expiry, and restrictions.
- The adviser cannot infer unrelated resources through navigation, counts, graph edges, search, or AI.
- Revocation takes effect across active sessions and derived access.
- Advice or uploaded evidence remains attributable to the adviser and subject to household approval.

**Failure sensitivities**

- Default full-workspace access.
- A reusable public link or onward sharing.
- Export or bulk download beyond the explicit grant.
- Treating professional input as automatically approved canonical truth.

**Mapped outcomes:** `OUT-P1-002`, `OUT-P1-004`, `OUT-P1-005`, `OUT-P1-007`.

### `PER-P1-005` — time-poor or low-confidence user

**Context:** Wants the outcome but has limited time, document literacy, confidence with technology, reliable connectivity, or tolerance for complex records-management concepts. This persona includes users of assistive technology and users working primarily on a phone.

**Jobs to be done**

- Add a document from camera or file with minimal setup.
- Know the one next action that matters and why.
- Recover from interruption without repeating work.
- Recognize uncertainty, risk, and required review in plain language.

**Trust needs**

- Progressive disclosure, clear status, accessible interaction, and recoverable errors.
- No dark patterns that encourage broad sharing, unnecessary data capture, or irreversible action.
- Plain-language distinction between product guidance and professional advice.
- Saved drafts and resumable jobs without silent partial completion.

**Failure sensitivities**

- Dense graph or compliance terminology.
- Time-limited approval that expires without warning or recovery.
- Camera or OCR failure with no manual path.
- Colour-only severity, inaccessible evidence anchors, or focus loss after updates.

**Mapped outcomes:** all Phase 1 outcomes, especially `OUT-P1-001` and `OUT-P1-007`.

## 4. Secondary actors

| Actor ID | Actor | Product responsibility | Human-facing boundary |
|---|---|---|---|
| `ACT-P1-001` | Product operator | Maintain service health, configuration deployment, source coverage, and incident response. | No standing raw-content access; exceptional access requires an approved, audited process. |
| `ACT-P1-002` | Trusted-source maintainer | Curate source definitions, parsers, rules, applicability, and coverage. | A parser result is not an approved consequential rule until review/publish gates pass. |
| `ACT-P1-003` | Support agent | Help recover workflows and explain status. | Cannot reset authorization, reveal content, or transfer ownership outside the approved recovery contract. |
| `ACT-P1-004` | Automated service capability | Scan, extract, classify, retrieve, assess, recommend, and notify. | Least-privileged, schema-bound, evidence-bound, policy-gated, and never a source of authority itself. |

## 5. Journey design invariants

Every journey below must preserve these invariants:

1. **Scope before disclosure:** establish workspace, subject, resource, field, and action authorization before showing content or derived existence.
2. **Status before confidence:** show whether data is current, stale, failed, conflicting, incomplete, restricted, or under review before presenting a conclusion.
3. **Evidence before consequence:** an actionable recommendation exposes its evidence, applicability, path, and uncertainty.
4. **Review before truth:** extraction and model suggestions remain proposed until the configured resolution or approval event.
5. **Approval before effect:** consequential effect is bound to the reviewed inputs and target.
6. **Evidence before closure:** submission or elapsed time is not sufficient completion when replacement evidence is required.
7. **Recovery at every asynchronous boundary:** users can leave, return, retry, cancel where safe, or understand what support is needed.
8. **No privacy side channel:** counts, empty states, errors, scores, graph layouts, citations, alerts, and timing do not expose restricted resources.
9. **Responsive and accessible by default:** critical information and actions do not depend on hover, fine pointer control, colour, drag-and-drop, or a large screen.
10. **Audit without surveillance:** consequential events are attributable and reconstructable without putting raw content in ordinary logs.

## 6. Critical journeys

### `JRN-P1-001` — establish a household baseline

**Primary personas:** `PER-P1-001`, `PER-P1-003`, `PER-P1-005`
**Linked requirements:** `REQ-P1-WS-001`–`007`, `REQ-P1-CFG-001`, `REQ-P1-TRUST-001`–`004`
**Target slice:** `P1-S1`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Explain | Decide whether the service is appropriate. | Explain product purpose, Australian-first coverage, sensitive-data handling, clinical exclusion, monitoring limits, AI review, and portability. | No claim of complete monitoring, legal advice, or blanket administrator access. |
| Create | Establish identity and workspace. | Create a personal or family workspace with explicit owner, terms/consent records, recovery-state disclosure, and audit. | Idempotent creation; no duplicate workspace after retry. |
| Represent | Add household subjects and relationships. | Permit a subject without login, record relationship basis and effective period, and avoid implying access authority. | Relationship is not authorization; show what needs later consent/review. |
| Invite | Invite another member where needed. | Preview proposed role and actual default access, then send an expiring invitation. | Reject over-broad defaults; reveal no existing private-resource names. |
| Orient | Understand current readiness. | Show an honest empty state and next capture action, not a misleading perfect score. | Explain that the product has no evidence yet and coverage is configuration-dependent. |

**Success signal:** the household has a governed workspace, at least one valid subject, clear privacy boundaries, and an understandable next step without uploading unnecessary sensitive information.

### `JRN-P1-002` — capture, process, and review a document

**Primary personas:** all primary personas
**Linked requirements:** `REQ-P1-DOC-001`–`008`, `REQ-P1-ING-001`–`009`, `REQ-P1-FCT-001`–`006`
**Target slices:** `P1-S1`, `P1-S2`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Select | Add by file, camera, or manual record. | State supported types, destination workspace/subject, processing purpose, and network/upload status. | Camera has file/manual alternatives; interruption is resumable where safe. |
| Validate | Know whether the file is safe and accepted. | Validate, hash, scan, and create an observable ingestion job before parsing. | Quarantine prevents preview, indexing, AI, and download; scanner failure is not success. |
| Process | Let the system classify and extract. | Show non-ambiguous state, expected work, and whether the user may leave. | Retry is idempotent; exact duplicates are explained without forcing logical identity. |
| Review | Check document type, subject, fields, dates, and evidence anchors. | Present source page/passage, confidence, and corrections side by side. | Suggested values are not canonical truth; restricted fields stay protected. |
| Resolve | Accept, correct, dispute, or defer suggested facts. | Create explicit resolution events and surface conflicts/downstream effects. | Original and previous derived results remain inspectable. |
| File | View the document and next actions. | Show logical document, version, status, evidence, facts, dependencies, monitoring, and access. | “Ready” does not imply every extracted fact or requirement is approved. |

**Failure variants:** unsupported format, zero-byte/encrypted file, malware, camera quality failure, OCR unavailable, partial extraction, suspected clinical record (`DEC-036`), duplicate, deletion during processing, and access revocation during review.

### `JRN-P1-003` — find an answer and inspect evidence

**Primary personas:** all primary personas
**Linked requirements:** `REQ-P1-SRCH-001`–`005`, `REQ-P1-GPH-002`, `REQ-P1-FCT-006`, `REQ-P1-AI-001`–`007`
**Target slice:** `P1-S2`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Ask | Search or ask in natural language. | Clarify workspace/scope where needed and retrieve under current authorization. | Query text does not grant access; prior conversation cannot resurrect revoked access. |
| Evaluate | Understand the answer quality. | Label supported, conflicting, stale, incomplete, insufficient, or restricted evidence. | Never invent a citation or hide uncertainty with fluent language. |
| Verify | Inspect a material claim. | Link each claim to exact authorized version/page/passage or governed snapshot. | Citation access is checked again; inaccessible evidence is not summarized. |
| Compare | Compare versions or documents. | Identify sources, material differences, uncertainty, and effective/conformed view. | Both originals remain unchanged and independently accessible. |
| Act | Save a task or open an impact. | Preserve the query/answer only as analysis context, not canonical truth. | Any state change uses its own evidence, policy, and approval workflow. |

**Success signal:** the user reaches authorized evidence or receives an honest limitation quickly enough to make a safe next decision.

### `JRN-P1-004` — change a fact and close downstream work

**Primary personas:** `PER-P1-001`, `PER-P1-002`, `PER-P1-003`
**Linked requirements:** `REQ-P1-FCT-001`–`006`, `REQ-P1-GPH-001`–`005`, `REQ-P1-ACT-001`–`008`, `REQ-P1-NTF-001`–`004`
**Target slice:** `P1-S3`
**Acceptance seed:** `AC-P1-E2E-001`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Propose | Record a changed address, name, relationship, employer, or other fact. | Capture proposed value, effective date, evidence, affected subject, and reason. | Preserve prior value and occurrence; do not accept model text as evidence. |
| Resolve | Make the canonical decision. | Route review according to sensitivity, confidence, conflict, and authority. | Actor sees the exact effect and cannot resolve a field they cannot access. |
| Assess | Learn what is affected. | Evaluate applicability and traverse typed dependencies under current authorization. | Show truncation, stale edges, incomplete data, and minimal disclosures. |
| Recommend | Understand each required action. | Separate severity, urgency, confidence, source health, applicability, evidence, and action class. | Every consequence has an inspectable authorized path. |
| Approve | Choose approve, edit, reject, defer, dismiss, or not applicable where policy permits. | Bind approval to inputs, effect, target, actor, and expiry. | Material input change invalidates approval. |
| Execute | Create a version/task/draft or invoke an approved connector. | Show progress, partial success, retry, reversal, and audit state. | Never mark an external timeout as success. |
| Close | Prove the work is finished. | Receive and verify replacement/fulfilment evidence, then close linked work. | Time elapsed or button press alone does not renew evidence. |

### `JRN-P1-005` — resolve missing, stale, or contradictory evidence

**Primary personas:** `PER-P1-001`, `PER-P1-003`, `PER-P1-005`
**Linked requirements:** `REQ-P1-HLT-001`–`005`, `REQ-P1-FCT-003`–`004`, `REQ-P1-ACT-003`–`008`
**Target slice:** `P1-S3`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Notice | Understand why something appears incomplete or conflicting. | Explain context, jurisdiction, rule/evidence, confidence, validity, and affected items. | Non-authoritative guidance is labelled; hidden resources do not distort visible scores or counts. |
| Choose | Decide whether the finding applies. | Offer add evidence, accepted alternative, not applicable, waiver/review, dismiss, or remind later as configured. | Options are distinct, reasons captured, and reversibility explained. |
| Resolve | Submit or select evidence. | Validate evidence criteria and keep receipt/extraction/verification/fulfilment separate. | Presence of a file is not automatic fulfilment. |
| Learn | Avoid repeated irrelevant prompts. | Apply the recorded outcome only within its scope/effective period and reassess after relevant change. | A dismissal is not a permanent global rule and does not erase the original rationale. |

### `JRN-P1-006` — share limited evidence with an adviser and revoke it

**Primary personas:** `PER-P1-001`, `PER-P1-002`, `PER-P1-004`
**Linked requirements:** `REQ-P1-WS-004`, `REQ-P1-WS-006`, `REQ-P1-SHR-001`–`003`, `REQ-P1-TRUST-002`, `REQ-P1-TRUST-004`
**Target slice:** `P1-S4`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Select | Choose exact resources, fields, actions, purpose, and expiry. | Preview effective access including related evidence that is and is not included. | No implicit graph expansion or whole-workspace default. |
| Invite | Deliver access safely. | Use authenticated delegated access or a short-lived scoped link according to policy. | Invite content does not disclose document names or sensitive values unnecessarily. |
| Review | Let the adviser complete permitted work. | Provide a purpose-specific view, evidence citations, and allowed comment/upload/task actions. | No general search, household counts, AI discovery, bulk export, or onward sharing unless explicit. |
| Revoke | End access immediately. | Revoke grant/link/session and propagate to retrieval, graph, AI, notifications, exports, and caches. | Explain bounded propagation objective; test stale-session denial. |
| Audit | Confirm what happened. | Show privacy-safe access and action history to authorized parties. | Audit itself does not reveal content outside the viewer's permission. |

### `JRN-P1-007` — source change degrades safely

**Primary personas:** `PER-P1-001`, `PER-P1-005`; secondary `ACT-P1-002`
**Linked requirements:** `REQ-P1-MON-002`–`007`, `REQ-P1-ACT-003`–`004`, `REQ-P1-NTF-004`
**Target slice:** `P1-S3`
**Acceptance seed:** `AC-P1-MON-001`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Detect | Monitor a governed official source. | Retrieve/observe, snapshot, parse, compare, and record source health. | A retrieval or parser failure is a state, not “no change.” |
| Degrade | Avoid acting on stale data. | Mark source and dependent conclusions stale/failed according to policy. | Last-known content remains dated and is never represented as current. |
| Communicate | Tell affected users what is known. | Explain coverage, last success, failure, expected retry, and whether existing action remains valid. | Notification avoids alarming or authoritative language unsupported by current evidence. |
| Repair | Restore parser/source operation. | Review new parser/result, publish safely, and replay affected observations deterministically. | Replayed events deduplicate recommendations and preserve original failure history. |

### `JRN-P1-008` — export, delete, and understand residual retention

**Primary personas:** `PER-P1-001`, `PER-P1-002`, `PER-P1-005`
**Linked requirements:** `REQ-P1-TRUST-004`–`009`, `REQ-P1-DOC-003`, `REQ-P1-SHR-003`
**Target slice:** `P1-S4`
**Decision dependencies:** `DEC-033`, `DEC-039`, `DEC-040`

| Stage | User intent | Product response | Trust and recovery requirement |
|---|---|---|---|
| Scope | Understand what the actor may export or delete. | Distinguish account, membership, workspace, resource, connector, subject, and grant operations. | Family administration is not automatic export/deletion authority. |
| Export | Obtain a complete portable copy. | Prepare an asynchronous checksummed package and machine-readable manifest under current authorization. | Report excluded/restricted/third-party material and failures; do not silently omit categories. |
| Cool off | Request destructive deletion. | Show affected active data, derivatives, audit, backups, connectors, other members, delay, cancellation, and legal/policy exceptions. | No dark pattern; explicit step-up authorization and recoverable cooling-off period if approved. |
| Purge | Complete controlled erasure. | Remove active and derived copies per contract and expose truthful backup/audit residuals. | Search, AI, support, restore, and connector paths cannot revive purged active access. |
| Prove | Confirm result. | Provide a privacy-safe completion record and unresolved exception list. | Do not claim immediate total erasure while a declared backup-retention window exists. |

### `JRN-P1-009` — encounter an excluded clinical record

**Primary personas:** `PER-P1-001`, `PER-P1-003`, `PER-P1-005`
**Linked requirements:** `REQ-P1-DOC-007`, `REQ-P1-ING-002`–`003`, `REQ-P1-TRUST-003`, `REQ-P1-TRUST-007`
**Target slice:** `P1-S1`
**Decision dependency:** `DEC-036`

The finalized flow must:

1. avoid displaying or logging unnecessary clinical content;
2. explain that clinical records are outside Phase 1 while distinguishing allowed health-insurance/general-coverage records;
3. prevent excluded content from ordinary extraction, embeddings, graph, search, AI, monitoring, or analytics;
4. provide only the storage, recovery, export, or deletion actions approved by `DEC-036`;
5. handle false positives through a privacy-safe review path; and
6. record the decision without turning clinical type labels or extracted values into ordinary telemetry.

Until `DEC-036` is approved, UX and backlog work may specify the decision point and safe containment state but not a final retention promise.

### `JRN-P1-010` — recover an account or prepare continuity access

**Primary personas:** `PER-P1-001`, `PER-P1-002`, `PER-P1-003`
**Linked requirements:** `REQ-P1-TRUST-001`, `REQ-P1-TRUST-008`, `REQ-P1-SHR-004`
**Target slice:** `P1-S4`
**Decision dependencies:** `DEC-032`, `DEC-038`

Only these design principles are fixed before the decisions close:

- Recovery and continuity are separate flows: proof that an account holder lost access is not proof of incapacity or death.
- A family relationship, adviser role, support contact, or possession of an email account is not by itself sufficient authority.
- The flow must disclose delay, challenge, notification, revocation, evidence, scope, and irreversible consequences before enrolment.
- Enrolment cannot silently weaken private-resource, encryption, MFA, residency, or export controls.
- Every attempt, challenge, cancellation, release, and denial is auditable without broadcasting sensitive circumstances.
- The accessible alternative before automated release is approved is an owner-prepared, encrypted, curated export or ordinary time-limited grant, subject to its own security contract.

## 7. Journey-to-use-case mapping

The use-case catalogue owns detailed system flows and Given/When/Then criteria. Its initial mapping should preserve these IDs:

| Journey | Expected primary use-case coverage |
|---|---|
| `JRN-P1-001` | Workspace creation, subject creation, membership invitation, access preview |
| `JRN-P1-002` | Upload/camera, quarantine, processing/review, document/version inspection |
| `JRN-P1-003` | Search, cited Q&A, comparison, insufficient/restricted evidence |
| `JRN-P1-004` | Fact proposal/resolution, impact assessment, approval, action, evidence closure |
| `JRN-P1-005` | Expected evidence, alternative/not-applicable/dismiss/defer, conflict resolution |
| `JRN-P1-006` | Delegated grant, guest link, adviser review, expiry/revocation |
| `JRN-P1-007` | Source retrieval, parser failure, stale degradation, replay |
| `JRN-P1-008` | Portable export, deletion request, controlled purge |
| `JRN-P1-009` | Suspected excluded-content containment and user decision |
| `JRN-P1-010` | Account recovery and conditional continuity access |

## 8. Research and validation plan

Before Phase 1 public launch, product research should validate at least:

- household mental models for personal versus family workspace and private versus shared resources;
- whether users understand evidence occurrence, accepted fact, conflict, applicability, confidence, urgency, and verified closure without specialist language;
- adviser invitation scope and whether the effective-access preview prevents accidental oversharing;
- camera and review usability across low-quality scans, interrupted networks, and small screens;
- cited-answer navigation and the acceptability of honest insufficient/restricted-evidence responses;
- the usefulness and privacy side effects of document-readiness scoring before `DEC-034` is approved;
- clinical-exclusion messaging and false-positive recovery before `DEC-036` is approved;
- complete-export expectations and ability to reuse the package elsewhere;
- deletion, backup-residual, and audit-retention comprehension;
- accessibility with keyboard, screen reader, magnification, switch/voice input where feasible, reduced motion, high contrast, reflow, and cognitive-load constraints; and
- Australian household terminology and the risk of advice-like language across tax, legal, immigration, insurance, and government-source changes.

Research data must use synthetic or specifically consented material and must not introduce real personal documents into ordinary fixtures, recordings, screenshots, or analytics.

## 9. Journey completeness checklist

A journey is ready for UX and backlog decomposition only when it has:

- a stable journey ID and linked requirement/use-case IDs;
- explicit actor, workspace, subject, resource, and action authorization assumptions;
- entry state, happy path, alternatives, failures, cancellation, retry, and resumption;
- loading, empty, partial, stale, conflicting, restricted, expired, revoked, and offline/degraded states where relevant;
- evidence, confidence, applicability, approval, audit, and closure behavior;
- responsive and accessibility behavior;
- telemetry that measures the outcome without collecting raw content;
- privacy and security negative scenarios; and
- a decision dependency instead of an invented answer where scope remains open.
