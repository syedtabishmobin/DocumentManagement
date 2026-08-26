# Phase 1 Synthetic Test Manifests

| Field | Value |
|---|---|
| Document ID | `TST-FIX-001` |
| Version | `0.1` |
| Status | **DRAFT — synthetic scaffolding only; no launch dataset, service, workload, target, or route is approved** |
| Updated | 26 August 2026 |

## Files and authority

| Manifest | Purpose |
|---|---|
| [`test-scenarios.v1.json`](test-scenarios.v1.json) | Exact stable test inventory, ownership, trace IDs, fixture/dataset/workload/fault references, decisions, deterministic action, oracles, prohibitions and cleanup. This is the test traceability source of truth. |
| [`synthetic-fixtures.v1.json`](synthetic-fixtures.v1.json) | Deterministic non-personal workspace, authority, artifact, evidence, fact, graph, source, workflow, security, deletion and migration inputs. |
| [`ai-evaluation-datasets.v1.json`](ai-evaluation-datasets.v1.json) | Synthetic evaluation dataset/slice/gold/adjudication scaffolds. All statistical launch gates remain insufficient. |
| [`workload-and-fault-profiles.v1.json`](workload-and-fault-profiles.v1.json) | Non-representative diagnostic workloads and deterministic provider-neutral fault schedules. |

The manifests are inputs to the prose catalogues, not runtime production configuration. They do not supersede product requirements, schemas, reference data, AI evaluation rules, security controls or NFRs.

## Required common metadata

Every manifest records stable ID/version, `DRAFT` status, effective date, owner/review state, synthetic-only declaration and privacy class. Every leaf fixture/dataset/workload/fault/test has a stable non-reusable ID and version. Retirement retains the entry, reason, effective time and replacement where applicable; IDs are never reassigned.

Every fixture records a deterministic generator and seed, purpose, classification, whether personal data is present, credential mode, endpoint references, cleanup and limitations. Every dataset adds partitions/slices, gold contract and sample status. Every workload declares synthetic population and `representative: false`. Every fault declares a deterministic trigger, expected safe class and whether an external effect may be possible.

## Privacy and network constraints

- All content and labels are synthetic and non-personal. No production household record, direct identifier, contact detail, real address, credential, token, key, secret, signed URL or provider payload is permitted.
- Endpoint examples use reserved `.invalid` hosts, remain disabled, and are never evidence of source authority, coverage, delivery, residency or availability.
- Ordinary test profiles deny outbound traffic. A future candidate adapter test requires an approved isolated route and a new exact manifest version; it cannot edit these synthetic examples into live endpoints.
- Ordinary logs, traces, metrics, audit, tickets, screenshots and reports use safe IDs, versions, outcomes, counts/buckets and digests only. They exclude fixture content even though it is synthetic.
- Two unrelated synthetic workspaces are mandatory for isolation tests. Fixtures cannot use a global/shared personalized identifier to simplify joins.

## Determinism and replay

The run manifest pins fixture/dataset/workload/fault versions, generator/seed, controlled clock/timezone, randomness and ID generation, event order, concurrency barriers, adapter outcomes and candidate versions. A failure is reproducible from these inputs. A retry retains its earlier attempts and does not rewrite the run as a first-pass success.

AI split isolation is by document/source/template family and near-duplicate lineage. Release holdout items are not used for tuning. Gold corrections are additive and trigger replay/impact analysis; prior results retain their original gold version.

## Decision-fenced limitations

The DRAFT source, rule, profile, role, severity, channel and capability records used here remain disabled. Suspected clinical input is a non-clinical marker used only to prove `POLICY_HOLD`. Connector/external channel, automatic continuity, aggregate score, recovery/owner transfer, deletion duration and unknown processor/residency routes remain unavailable under `DEC-031`–`040`. A fixture or passing test cannot activate them.

## Validation

Run:

```sh
python3 scripts/validate-test-traceability.py
```

The validator rejects malformed or duplicate-key JSON; duplicate or dangling test/input IDs; owner-document inventory mismatch; non-DRAFT, non-synthetic or representative version `0.1` data; unreserved endpoints; credential/private-key/token patterns; realistic email, public IP or payment-number patterns; unknown upstream trace IDs; and uncovered current requirements, product ACs, backlog stories or story ACs. It prints exact coverage counts and never treats a missing upstream backlog file as passing backlog evidence.
