# Application source

The complete Phase 1 product is implemented as a modular TypeScript monorepo:

- `apps/web` — responsive installable web/PWA client;
- `apps/api` — local-first API and workflow runtime;
- `packages/domain` — provider-neutral domain types, invariants, and policies; and
- `packages/contracts` — shared application-facing contracts.

The default `local` profile stores data beneath the ignored `local-data/` directory, uses deterministic local document assistance, disables external connectors and notifications, and permits no cloud fallback. Production adapters must remain explicitly configured and gated.

The current local vertical flow includes local email/password registration, protected sessions, personal/family onboarding, household subjects distinct from login memberships, person-linked document capture, multi-file/folder and camera inputs, manual searchable records, and visible production ports for competitor-parity identity and acquisition sources.
