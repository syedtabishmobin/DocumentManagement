# Personal and Family Phase 1 Remaining Work Register

| Field | Value |
|---|---|
| Document ID | `BLG-REMAIN-001` |
| Version | `0.1` |
| Status | **ACTIVE EXECUTION CHECKLIST — not a production approval** |
| Scope | Phase 1 personal and family only |
| Generated | 29 August 2026 |
| Evidence source | [`BLG-STATUS-001`](05-personal-family-implementation-status.md) |

## 1. How to read this list

This register converts the story-by-story evidence audit into a delivery checklist. `MISSING` means the material runtime capability does not exist. `INCOMPLETE` means a preview or happy path exists but does not satisfy the story's full contracts and evidence. `REQUIRED ABSENCE EVIDENCE` means the approved behavior is to keep a capability unavailable and prove that it cannot be activated accidentally.

Priority `P0` items block real personal documents or production release. `P1` items are core Phase 1 outcomes. `P2` items complete integration, parity, portability, operations, and release assurance. Priority is dependency/risk order inside the one approved Phase 1 program, not a reduction of scope.

## 2. Remaining product and platform work

| Priority | State | Work item | Story trace |
|---|---|---|---|
| `P0` | `INCOMPLETE` | Replace the single local owner/session model with production identity, MFA/passkey enrolment, secure session rotation, CSRF and abuse controls, and explicit unavailable recovery behavior. | `STORY-P1-001`, `008`, `047` |
| `P0` | `INCOMPLETE` | Implement durable multi-workspace persistence with separate identity, person, relationship, membership, role, grant, document and action authority. | `STORY-P1-001`–`003`, `039`, `040` |
| `P0` | `INCOMPLETE` | Enforce deny-by-default current authorization at document, field, evidence, edge, search, answer, citation, task, export and activity surfaces, including revocation and side-channel tests. | `STORY-P1-003`, `019`, `020`–`023`, `038`, `039` |
| `P0` | `INCOMPLETE` | Encrypt every web and Flutter document before upload; implement secure device keys, workspace/customer key envelopes, grant-aware unwrap, rotation, revocation and crypto-shred without a plaintext fallback. | `STORY-P1-004`, `007`, `008`, `039`, `045` |
| `P0` | `INCOMPLETE` | Replace preview file storage with immutable put-once Azure Blob artifacts, separate logical versions, integrity verification and deletion acknowledgements. | `STORY-P1-007`, `011`, `044`, `045` |
| `P0` | `MISSING` | Build the durable ingestion workflow: validated stages, transactional outbox, leases, idempotency, retries, deduplication, dead-letter handling, reconciliation and repair tooling. | `STORY-P1-004`, `006`, `015` |
| `P0` | `INCOMPLETE` | Add trustworthy MIME/content inspection, malware scanning, isolated encrypted quarantine and safe `POLICY_HOLD` reclassification/deletion behavior. | `STORY-P1-005` |
| `P0` | `INCOMPLETE` | Replace mutable preview activity with append-only/tamper-evident audit, complete actor/workload provenance, correlation, content-safe telemetry and audit-failure behavior. | `STORY-P1-009` |
| `P0` | `MISSING` | Enforce a versioned data-class, processor, purpose, region and exception matrix across Azure storage, device/local AI, connectors, support, telemetry, backup/failover and export routes. | `STORY-P1-046` |
| `P1` | `INCOMPLETE` | Implement signed configuration packages and the propose, validate, review, approve, publish, activate, supersede, rollback/repair and consumer-acknowledgement lifecycle. | `STORY-P1-010`, `037` |
| `P1` | `INCOMPLETE` | Complete document lifecycle management: versions, supersession, archive, comparison, conflict handling, conformed effective view and immutable history. | `STORY-P1-011`, `026` |
| `P1` | `INCOMPLETE` | Add stable page/span/coordinate evidence anchors, exact citation redemption, extractor/schema/generation provenance and unsupported-format behavior. | `STORY-P1-012`, `023` |
| `P1` | `INCOMPLETE` | Replace heuristic category assignment with governed versioned taxonomy/schema execution, confidence/review states, ambiguity handling, lineage and reclassification. | `STORY-P1-013` |
| `P1` | `INCOMPLETE` | Complete extraction review with accept/correct/reject, optimistic concurrency, evidence editing, authorization, immutable correction provenance and audit. | `STORY-P1-014` |
| `P1` | `MISSING` | Implement immutable analysis generations and reprocessing with versioned inputs, cancellation, stale-result rejection, safe replay and current-generation selection. | `STORY-P1-015` |
| `P1` | `INCOMPLETE` | Build canonical bitemporal facts, immutable occurrences, entity aliases/merge/split, provenance-preserving corrections and temporal queries. | `STORY-P1-016`, `017` |
| `P1` | `MISSING` | Detect fact conflicts, retain competing evidence, support human resolution, preserve history and invalidate affected derivatives. | `STORY-P1-018` |
| `P1` | `INCOMPLETE` | Complete the permission-aware graph with versioned edge types, review/correction, bounded traversal, cycle/truncation handling, rebuild/freshness and APIs. | `STORY-P1-020`, `030` |
| `P1` | `INCOMPLETE` | Build metadata, full-text and semantic indexes with filters, ranking, pagination, watermarks, current authorization and deletion/revocation invalidation. | `STORY-P1-021` |
| `P1` | `INCOMPLETE` | Implement device-local RAG/model execution on web and Flutter with schema-bound answers, multi-document synthesis, exact citations, prompt-injection defenses, abstention and evaluation thresholds. | `STORY-P1-022`, `024`, `025` |
| `P1` | `MISSING` | Build monitoring subscriptions, durable schedules, governed source retrieval/parsers, immutable snapshots, health/freshness/coverage and replay-safe change detection. | `STORY-P1-027`, `028` |
| `P1` | `MISSING` | Implement rule applicability, jurisdiction/subject resolution, stable change cases, false-positive review, provenance and API/event contracts. | `STORY-P1-029` |
| `P1` | `MISSING` | Implement authorised impact traversal, explainable assessments and recommendations with evidence, limitations, severity/urgency separation and stale-input invalidation. | `STORY-P1-030`, `031` |
| `P1` | `MISSING` | Implement exact-input approval, step-up authority, revocation/expiry, idempotent external action, unknown/partial reconciliation, independent evidence verification and closure. | `STORY-P1-032`, `033` |
| `P1` | `MISSING` | Implement expected-evidence profiles and explainable item-level findings, including applicability, lifecycle, disposition, verification, waiver/exception, re-evaluation and no aggregate score. | `STORY-P1-034`, `035`, `043` |
| `P1` | `INCOMPLETE` | Complete tasks and notifications with assignment, schedules, preferences, quiet periods, linkage, deduplication, escalation, read state, repair and Flutter parity. | `STORY-P1-036`, `042` |
| `P1` | `MISSING` | Implement minimal-disclosure “impact exists” responses with policy-specific authorization, anti-enumeration behavior, safe redemption and side-channel tests. | `STORY-P1-038` |
| `P1` | `MISSING` | Implement exact resource/field/action/purpose/time grants with preview, secure invitation redemption, expiry/revocation, key-envelope access and audit. | `STORY-P1-039` |
| `P1` | `INCOMPLETE` | Complete family invitations with single-use delivery, invitee-created password/passkey, enable/suspend login, age/authority/consent rules, dependant transition and provenance. | `STORY-P1-040` |
| `P2` | `INCOMPLETE` | Implement Microsoft, Google, Dropbox and Box OAuth start/callback, state/PKCE, encrypted token custody, consent persistence, selected-file import, cursors, disconnect, revocation/deletion and conformance. | `STORY-P1-041` |
| `P2` | `INCOMPLETE` | Implement ACS email delivery with verified test recipients, preferences, minimised templates, bounce/retry state, rate controls and audit; decide whether SMS remains in scope. | `STORY-P1-042` |
| `P2` | `INCOMPLETE` | Produce the complete authorised export envelope with originals, versions, facts, relationships, tasks, grants, audit, manifest/checksums, encryption and temporary cleanup. | `STORY-P1-044` |
| `P2` | `INCOMPLETE` | Complete durable 30-day Trash with step-up restore, purge scheduler/ledger, Blob/key/projection/provider/backup acknowledgements, exceptions and non-resurrection tests. | `STORY-P1-045` |
| `P2` | `INCOMPLETE` | Bring Flutter to critical web-journey parity, add secure key storage, offline/degraded behavior, accessibility, signing and iOS/Android test distribution. | `STORY-P1-004`, `008`, `022`, `036` and all user-facing stories |
| `P2` | `INCOMPLETE` | Complete production observability, backup/restore, DR, migration/forward-repair, accessibility, privacy/legal review, penetration testing, incident exercises and release evidence. | All stories; especially `STORY-P1-009`, `045`, `046` |
| `P2` | `REQUIRED ABSENCE EVIDENCE` | Expose and test the absence of account/workspace recovery, ownership transfer, support bypass and weaker key/factor reset routes. | `STORY-P1-047` |
| `P2` | `REQUIRED ABSENCE EVIDENCE` | Expose and test the absence of automatic emergency, incapacity or after-death release; keep ordinary grants and export separate. | `STORY-P1-048` |

## 3. Immediate external configuration work

1. Deploy and verify the public `/privacy` and `/terms` routes, then replace the Google homepage placeholders with those exact URLs and add the approved logo.
2. In Google Data Access, save and reload the minimum identity scopes plus `drive.file` for selected-file import and `gmail.readonly` for the separately consented Gmail attachment feature. The console currently shows no saved rows.
3. In Dropbox, keep `account_info.read`, `files.metadata.read`, and `files.content.read`; remove `openid`, `profile`, and `email`; disable implicit/public-client grant for the server-mediated flow; rotate the reviewed app secret and update `dropbox-connector-app-secret` in Key Vault.
4. Keep Box read-only. The earlier write-scope blocker is verified closed.
5. Keep every adapter `CONFIGURED_DISABLED` until its runtime and conformance rows above pass.

## 4. Completion rule

The checklist is complete only when the owning story acceptance criteria and mapped unit, contract, authorization, security/privacy, accessibility, AI, integration, migration/repair, performance/resilience, mobile and operational evidence pass. A configured provider, deployed page, preview path or passing happy-path test does not by itself complete a story.
