# API, Event, and Connector Specification Index

| Field | Value |
|---|---|
| Document ID | `API-IDX-001` |
| Status | Active navigation aid; contracts validate but production/provider conformance is incomplete |
| Updated | 29 August 2026 |

## Reading order

1. [`API-STD-001` — API Standards](01-api-standards.md)
2. [`API-OAS-001` — OpenAPI 3.1 Contract](02-openapi.json)
3. [`API-EVT-001` — Event Catalogue](03-event-catalogue.md)
4. [`API-CON-001` — Connector and Adapter Contracts](04-connector-contracts.md)
5. [`OPS-PROVIDER-001` — External Provider Setup Runbook](../09-devops/08-external-provider-setup.md) for provider-specific operational configuration and verification

## Contract ownership

| Namespace | Owner | Coverage |
|---|---|---|
| `API-P1-001`–`API-P1-052` | `API-STD-001` | HTTP/API rules, context, errors, paging, compatibility, concurrency, idempotency, jobs, artifacts, privacy, and decision fences |
| `API-P1-101`–`API-P1-183` | `API-OAS-001` | Eighty-three stable HTTP operation IDs and their wire contracts |
| `EVT-P1-001`–`EVT-P1-032` | `API-EVT-001` and `events/` | Domain/integration event types, common envelope, schemas, examples, ordering, replay, and privacy |
| `CON-P1-001`–`CON-P1-050` | `API-CON-001` | Provider-neutral import, external-action, notification, source, and processing adapter contracts |

## Machine validation

From the repository root run:

```sh
python3 scripts/validate-api-contracts.py
```

The validator parses the OpenAPI document and all event JSON with duplicate-key rejection, resolves local references, verifies operation/event identity and continuity, validates OpenAPI and event examples, and checks required workspace, authorization, idempotency, concurrency, async, privacy, ordering, replay, and conditional-operation invariants.

Passing validation does not activate a conditional endpoint, connector, notification channel, source, processor, export envelope, deletion duration, or residency route. `DEC-031`, `DEC-037`, `DEC-039`, and `DEC-040` remain decision fences.
