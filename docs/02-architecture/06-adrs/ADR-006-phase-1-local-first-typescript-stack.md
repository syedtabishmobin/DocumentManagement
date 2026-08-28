# ADR-ARCH-006 — Phase 1 Local-First TypeScript Stack

| Field | Value |
|---|---|
| Document ID | `ADR-ARCH-006` |
| Status | **ACCEPTED for Phase 1 implementation** |
| Date | 26 August 2026 |
| Decision scope | Phase 1 application language, modular repository, client/API framework, local adapters, and test toolchain |
| Decision owners | Product owner and engineering |
| Supersedes | The non-selection boundary in `ENG-STACK-001` for the named implementation components only |
| Superseded in part by | `ADR-ARCH-009` for dedicated mobile delivery; the React web, NestJS API, TypeScript packages, and local profile remain active |

## Context

`DEC-041` authorizes the complete Phase 1 build and requires it to be immediately testable locally. `DEC-042` approves a TypeScript responsive web/PWA stack with provider-neutral production boundaries. The implementation must run without Docker, external credentials, real personal data, or cloud processing, while preserving a direct path to managed PostgreSQL, object storage, identity, queues, and approved AI adapters.

## Decision

Use a `pnpm` TypeScript monorepo. The web client uses React and Vite as an installable PWA. The API uses NestJS with explicit domain/application/adapters/interfaces boundaries. Local persistence and artifact adapters write only beneath an ignored repository-local data directory. Shared wire contracts are validated with Zod. Unit tests use Vitest and browser journeys use Playwright when the browser suite is introduced.

The default runtime profile is `local`, outbound-denied, synthetic-first, and uses a deterministic local assistant. No adapter may silently fall back to a remote service. PostgreSQL, S3-compatible storage, durable worker, identity, OCR, local-model, cloud-model, connector, notification, and observability products remain replaceable adapters and require separate activation evidence before production.

## Consequences

- The app can run on a developer machine without Docker or API keys.
- A shared TypeScript model reduces contract drift while source OpenAPI/event/reference contracts retain authority.
- Local filesystem persistence is development evidence, not production durability or Australian-residency evidence.
- Productionisation replaces adapters and configuration rather than domain workflows or user journeys.
- React remains the responsive web/PWA implementation. Dedicated mobile delivery now uses Flutter under `ADR-ARCH-009`; it shares contracts, fixtures, and server/domain semantics rather than React UI source.
