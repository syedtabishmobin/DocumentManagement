# Codex Working Agreement

## Purpose

This file defines how Codex and human contributors must navigate, change, validate, and implement the DocumentManagement repository.

## Required reading before work

For product or implementation work, read at minimum:

1. `docs/00-context/decision-register.md`
2. `docs/01-product/02-phase-1-prd.md`
3. The applicable architecture, security, domain, API, UX, and testing specifications
4. Relevant Architecture Decision Records
5. Relevant machine-readable files under `docs/11-reference-data/`
6. Relevant backlog item and its acceptance criteria

For research or scope work, also read `docs/01-product/07-competitive-gap-analysis.md` and the preserved handover.

If a referenced file does not yet exist, report that as a specification gap. Do not silently substitute an assumption.

## Source-of-truth hierarchy

When sources conflict, use this order:

1. Current explicit product-owner instruction
2. `APPROVED` entries in `docs/00-context/decision-register.md` and accepted ADRs
3. Normative API/event/output contracts and machine-readable reference data
4. Product requirements and acceptance criteria
5. Architecture, domain, security, AI, document-intelligence, UX, and operational specifications
6. Tests and evaluation fixtures that correctly implement the normative sources
7. Backlog descriptions
8. Examples and explanatory prose
9. The preserved historical handover

Do not resolve conflicts by choosing whichever source is easiest to implement. Record and escalate the conflict.

## Specification readiness gate

Application implementation may begin only when all of the following are true, unless the product owner explicitly authorizes a narrower prototype:

- The Phase 1 PRD is approved or clearly marked as an approved implementation baseline.
- High-impact product and architecture decisions are approved or intentionally deferred behind documented abstractions.
- Domain/data models, authorization model, security architecture, API/event contracts, UX flows, test strategy, and initial reference data exist.
- Every implementation epic has stable requirement/use-case references and testable acceptance criteria.
- Privacy, deletion, audit, evidence, and human-approval behavior is defined for the slice.
- No open decision would make the proposed implementation unsafe or substantially disposable.

## Implementation workflow

1. Identify the backlog item and all linked requirement, use-case, security, NFR, API/event, UX, and test IDs.
2. Read the applicable documents and ADRs before editing code.
3. State any bounded implementation assumptions. Add a decision/ADR when an assumption crosses a product or architecture boundary.
4. Implement the smallest coherent vertical slice that meets the acceptance criteria.
5. Add or update unit, integration, contract, authorization, security, migration, and E2E tests in proportion to the change.
6. Run the relevant quality gates and capture objective evidence.
7. Update affected specifications, generated contracts, reference data, traceability, and backlog state in the same change.
8. Review for privacy leakage, authorization bypass, evidence loss, destructive migration, vendor lock-in, and unsafe AI action.

## Documentation rules

- Use stable IDs and preserve them when wording changes. Never recycle a retired ID.
- Use RFC 2119 terms (`MUST`, `SHOULD`, `MAY`) only for normative statements.
- Distinguish verified facts, product decisions, proposed defaults, examples, and open questions.
- Every consequential rule must identify jurisdiction, applicability, source/evidence, effective dates, and confidence/review requirements.
- Keep examples consistent with normative schemas; validate machine-readable examples where practical.
- Update inbound and outbound cross-references when moving or renaming content.
- Record material changes in the decision register or an ADR rather than burying them in prose.

## Testing requirements

Every implemented capability must have evidence for relevant layers:

- Unit/domain rules and state transitions
- API and event contract compatibility
- Database migrations, rollback or forward-repair behavior
- Workspace, resource, field, edge, retrieval, and action authorization
- Ingestion idempotency, retries, quarantine, deduplication, and provenance
- AI schema validation, citations, confidence/review routing, safety, and regression evaluation
- Source-monitor freshness, parser failure, stale state, applicability, and replay
- Audit completeness and sensitive-log redaction
- Accessibility and critical-path E2E behavior
- Performance/resilience targets where the NFR applies

Tests must not rely on real personal documents, production credentials, or uncontrolled external services.

## Forbidden shortcuts

- Do not collapse the model into `User → Documents`.
- Do not store canonical facts only as mutable document metadata.
- Do not overwrite original binaries or destructive-update fact/rule history.
- Do not treat OCR output, model output, or chat text as approved truth.
- Do not claim a requirement is satisfied merely because a file or extracted field exists.
- Do not bypass current authorization during retrieval, graph traversal, inference, or action.
- Do not silently update consequential documents or invoke external actions without the required approval.
- Do not fabricate citations, source coverage, legal requirements, confidence, or monitoring success.
- Do not auto-renew evidence because time elapsed.
- Do not hide a failed or stale source monitor behind the last successful value.
- Do not hard-code document types, jurisdictions, monitoring rules, source definitions, permissions, or workflows that belong in configuration.
- Do not bind core contracts directly to one AI, OCR, graph, vector, identity, storage, or cloud vendor without an approved ADR.
- Do not expose raw document content or sensitive values in ordinary logs, analytics, fixtures, screenshots, or error messages.
- Do not add Phase 2 enterprise UI complexity to Phase 1 merely because the domain reserves enterprise extension points.

## Definition of done

A change is done only when:

- Linked acceptance criteria pass.
- Relevant tests and evaluations pass with recorded evidence.
- Authorization and privacy behavior has been tested, including negative cases.
- Audit/provenance requirements are met.
- Failure, retry, recovery, and rollback/forward-repair behavior is defined and tested where applicable.
- Observability is useful without exposing sensitive content.
- Documentation, contracts, reference data, and traceability are current.
- No unresolved blocker or hidden product decision remains.
- The change is reviewable, reversible where required, and contains no known forbidden shortcut.

## Handling uncertainty

If a choice materially affects scope, security, privacy, architecture, cost, vendor commitment, data residency, legal interpretation, or user-facing behavior, add it to the decision register and ask the product owner. For a safe local implementation detail inside approved contracts, make the bounded decision and document it where future maintainers will find it.
