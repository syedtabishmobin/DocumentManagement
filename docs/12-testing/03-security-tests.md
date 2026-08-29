# Phase 1 Security, Privacy, and Abuse Test Catalogue

| Field | Value |
|---|---|
| Document ID | `TST-SEC-001` |
| Version | `0.3` |
| Status | **APPROVED IMPLEMENTATION BASELINE — independent production evidence remains required** |
| Product phase | Phase 1 — Personal and Family |
| Updated | 28 August 2026 |
| Primary trace | `SEC-P1-001`–`037`, `AUTH-P1-001`–`035`, `PRIV-P1-001`–`030`, `AUD-P1-001`–`030`, `THR-P1-001`–`034`, `DEC-049`–`054` |

## 1. Security test stance

Tests use two unrelated synthetic workspaces, distinct subjects and actors, private/shared resources, current/stale grants and policy epochs, and content canaries that are never real personal data. Authorization is checked at request, candidate retrieval, field/edge selection, model/tool context, commit, enqueue, effect, result, citation/redemption, replay, export, support and restore boundaries. A denial must also prevent existence, count, facet, timing, cache, error, notification, audit, analytics and path inference beyond the approved minimal-disclosure policy.

Security tests assert both the allowed outcome and prohibited observations. A safe denial does not pass availability. Any confirmed unauthorized disclosure/effect, original mutation/loss, clinical escape, deletion resurrection, missing required audit, ineligible processing route, prohibited telemetry record, usable secret, or unresolved critical/high residual risk is stop-ship.

## 2. Scenario catalogue

| Test ID | Attack/control surface | Required oracle |
|---|---|---|
| `TEST-SEC-P1-001` | Workspace/resource enumeration and tenant confusion | Missing/forged/mismatched workspace/actor/purpose/grant returns existence-safe denial across API, worker and storage; no cross-tenant count/timing/error difference. |
| `TEST-SEC-P1-002` | Field, evidence and graph-edge restriction | Hidden value/source/anchor/edge/bridge/subject/count/path remains undisclosed; graph and impact coverage is safely limited. |
| `TEST-SEC-P1-003` | Retrieval, facets, cache, conversation and citation | Prefilter and postfilter/current-auth checks prevent stale/hidden result, snippet, facet, context, follow-up and citation redemption. |
| `TEST-SEC-P1-004` | Model inference and document/source instruction | Restricted facts cannot be reconstructed or confirmed; untrusted content cannot change system policy, workspace, candidate set or tool authority. |
| `TEST-SEC-P1-005` | Recommendation, approval and action authority | Actor/capability/purpose/target/effect digest/current revision/expiry/revocation bind; no confused deputy, self-approval or changed-effect execution. |
| `TEST-SEC-P1-006` | Grants, signed artifacts and export | Scope/action/time/actor/version redemption rechecked; revoke/expiry/wrong actor/current deletion prevents package or metadata disclosure. |
| `TEST-SEC-P1-007` | Audit, support and exceptional access | Unauthorized operator cannot browse content; required safe audit reconstructs decision without raw values; tamper/gap is detected. |
| `TEST-SEC-P1-008` | Session, factor, step-up and recovery abuse | Theft/fixation/replay/revocation/CSRF-style state change denied; `DEC-038` leaves no support, owner-transfer or recovery bypass. |
| `TEST-SEC-P1-009` | File safety and clinical containment | Malicious/polyglot/encrypted/active/archive/bomb/oversize and scanner/parser failures remain contained; clinical fixture stays `POLICY_HOLD`. |
| `TEST-SEC-P1-010` | Injection, rendering, URL/callback and SSRF/egress | Query/path/template/render/source/model/tool/provider/callback inputs cannot execute, fetch arbitrary hosts, redirect credentials, or cross an ineligible route. |
| `TEST-SEC-P1-011` | Secrets, keys, dependencies and build provenance | No usable secret in source/config/artifact/log; least privilege/duty separation; tampered/unpinned artifact or dependency is rejected. |
| `TEST-SEC-P1-012` | Telemetry, error, screenshot, ticket and audit redaction | Canaries for content/value/filename/query/prompt/answer/tool/provider/URL/token are rejected at producer; safe correlation remains. |
| `TEST-SEC-P1-013` | Consent, connector/channel and retained-copy boundaries | Permission drift, revoke, disconnect, late callback/resync and external-channel attempts remain disabled or fenced; no live `.invalid` call. |
| `TEST-SEC-P1-014` | Deletion, replay, rebuild, backup and restore | Current fence/tombstone denies late output, cache, event, resync, derived rebuild and restore; residual state never becomes serviceable. |
| `TEST-SEC-P1-015` | Abuse, exhaustion, quota and noisy neighbour | Size/depth/fan-out/rate/retry/cost/queue attacks remain bounded and tenant-isolated without weakening authorization, audit, quarantine or deletion. |
| `TEST-SEC-P1-016` | Client-side encryption and key hierarchy | Plaintext and unwrapped keys never reach API, Azure stores, queues, telemetry, support or backup; wrong workspace/member/version/context and tampered envelopes fail closed. |
| `TEST-SEC-P1-017` | Web/Flutter release integrity and malicious-update resistance | Signed/provenanced candidates match reviewed source; CSP and dependency controls block unapproved egress; rollback, compromised builder and untrusted plugin cases cannot obtain plaintext silently. |
| `TEST-SEC-P1-018` | Trash, restore and final purge | Immediate fence, authorized pre-deadline restore, post-deadline denial, crypto-shred, derived cleanup, replay/restore suppression and immutable content-free ledger are verified at clock boundaries. |
| `TEST-SEC-P1-019` | Azure identity, network and environment isolation | Dev/stage/prod identities, data, secrets, RBAC and routes cannot cross; public exposure, policy drift and non-Australian route attempts fail deployment or runtime gates. |
| `TEST-SEC-P1-020` | Public product and legal-preview trust boundary | Signed-out routes expose no account/workspace/document data, credential, unsafe egress or hidden-provider state; telemetry stays metadata-only and every missing configuration or unfinished production/legal capability is reported truthfully. |

## 3. Authorization negative matrix

| Boundary | Negative identities/context | Prohibited disclosure/effect |
|---|---|---|
| Workspace/API | no token, forged token, wrong workspace header/path, stale policy, wrong purpose, disabled capability | existence, IDs, counts, status, latency oracle, mutation, job creation |
| Resource/field | wrong owner/member/guest/workload, private resource, dependant without authority, expired/revoked grant | metadata, filename, value, anchor, type, subject, number of hidden items |
| Edge/graph | unauthorized endpoint, restricted bridge, excessive traversal | node/edge/path, bridge existence, fan-out/count, inferred relationship |
| Retrieval | hidden lexical/vector/fact candidate, stale cache/index epoch | result, rank, facet, snippet, score, conversation memory, prior answer |
| Inference/citation | prompt asks to infer/confirm hidden fact; citation revoked after generation | claim, confirmation, citation token, passage, version/existence |
| Tool/action | model/document proposes new workspace/target/effect; stale approval digest | call, dispatch, changed draft, grant, notification, external effect |
| Export/download | wrong actor/version/scope, expiry/revoke/deletion during build/redemption | package, partial bytes, manifest categories, signed URL, metadata |
| Audit/support | ordinary member/support/operator lacks explicit purpose/role | raw household content, protected event fields, hidden resource existence |

Every row runs the same logical request against permitted and denied controls with normalized safe error/state/timing buckets. Timing tests account for noise and never use a faster denial as proof of non-disclosure without statistical review.

## 4. Race schedule

For revocation, grant expiry, policy epoch change, quarantine, consent withdrawal, approval revoke/target change, cancellation, source suspension, route ineligibility and deletion fence, barriers are injected: before lookup; after candidate selection; before/after model or tool; before commit; after enqueue; before effect; after possible effect; before output/citation/download/export redemption; and during replay/rebuild/restore. The current authoritative state wins, stale work is cancelled/blocked/reconciled, and no prior authorization is treated as durable capability.

## 5. File, injection, egress and supply-chain corpus

The corpus is synthetic and includes extension/MIME mismatch, polyglot, active content, embedded object, encrypted/passworded input without a real password, recursive archive/decompression ratio, malformed structure, oversized dimensions/counts, OCR adversarial text, right-to-left/Unicode controls, formula/CSV injection text, path traversal names, unsafe markup, indirect prompt injection, reserved `.invalid` URLs, redirect chains terminating at `.invalid`, blocked IP-literal/private/metadata patterns, invalid callback signatures, dependency/artifact digest mismatch, and secret-shaped canaries.

No fixture contains exploit code aimed at a real service, usable credentials, routable endpoints, or production data. The oracle covers pre-parse containment, scanner failure, preview/download denial, downstream non-propagation, bounded resource use, safe audit/telemetry, authorized review, and deletion cleanup.

## 6. Audit and telemetry canaries

Each critical workflow emits registered safe event identity, actor/workload class, purpose, workspace-safe reference where allowed, policy/config/schema/candidate versions, state/reason, correlation/causation, and evidence reference. Tests inject unique synthetic canary labels into original content, filenames, fields, queries, prompts, answers, tool arguments/results, source/provider payloads, URLs, tokens and exception text, then scan ordinary logs, traces, metrics, audit, screenshots, reports, tickets and build artifacts for any occurrence. The test passes only if prohibited fields are rejected before emission and required content-free correlation/audit remains complete.

Audit outage and telemetry outage are separate cases: required consequential/security work cannot complete without durable audit; telemetry loss cannot disable authorization, quarantine, deletion, residency, rate/backpressure or audit controls. Gap detection and reconciliation are tested with safe manifests.

## 7. Decision fences and abuse of unavailable routes

Negative cases prove no connector/effect under `DEC-031`, automatic continuity under `DEC-032`, aggregate score under `DEC-034`, enabled DRAFT source/profile under `DEC-035`, ordinary clinical route under `DEC-036`, external notification under `DEC-037`, or recovery/ownership transfer under `DEC-038`. They also prove that no client/server path bypasses `DEC-050`, no platform drifts from `DEC-052`, no restore extends the `DEC-053` deadline, and no deployment crosses `DEC-049`/`054` environment or release gates. UI hiding is insufficient: API, job, event, configuration, replay, migration, support, and direct-port invocation all fail closed.

## 8. Evidence and release consequence

The run manifest retains target/control/threat IDs, exact candidate/config/policy/reference versions, synthetic fixture IDs, seed/race/fault schedule, allowed and prohibited observations, normalized response/state, audit/event checks, telemetry scan digest, all attempts, cleanup, and finding owner. Sensitive proof is kept in a separately authorized evidence store; ordinary evidence is content-free.

Critical/high findings remain blocking through root-cause analysis, impact scope, containment, targeted and broad regression, independent control-owner closure, and release reapproval. No single-role waiver, flaky quarantine, availability objective, or passing aggregate can override a confirmed zero-tolerance failure.
