# Application source

The Phase 1 product is being implemented as a modular TypeScript monorepo:

- `apps/web` — responsive installable web/PWA client;
- `apps/api` — local-first API and workflow runtime;
- `packages/domain` — provider-neutral domain types, invariants, and policies; and
- `packages/contracts` — shared application-facing contracts.

The default `local` profile stores data beneath the ignored `local-data/` directory, uses deterministic local document assistance, disables external connectors and notifications, and permits no cloud fallback. Production adapters must remain explicitly configured and gated.

The current local vertical flow includes local email/password registration, protected sessions, personal/family onboarding, household subjects distinct from login memberships, person-linked document capture, multi-file/folder and camera inputs, manual searchable records, hierarchical category browsing, controlled document dossiers and original viewing, deterministic evidence-linked profile extraction, human review of extracted proposals, typed person/document/category/fact connections, an accessible relationship map/list, cited local Q&A, tasks, family access administration, activity history, and visible disabled ports for future identity and acquisition sources.

This is implementation evidence for a bounded local profile, not a claim that every Phase 1 production, provider, operational, security or launch gate has been completed.
