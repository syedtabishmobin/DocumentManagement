# Application source

The Phase 1 product is implemented as a modular React/TypeScript and Flutter repository:

- `apps/web` — responsive installable web/PWA client;
- `apps/api` — local-first API and workflow runtime;
- `apps/mobile` — dedicated Flutter iOS and Android client;
- `packages/domain` — provider-neutral domain types, invariants, and policies; and
- `packages/contracts` — shared application-facing contracts; and
- `packages/crypto` — Web Crypto customer-controlled envelope implementation and language-neutral vectors mirrored by Flutter.

The default `local` profile stores data beneath the ignored `local-data/` directory, uses deterministic local document assistance, disables external connectors and notifications, and permits no cloud fallback. Production adapters must remain explicitly configured and gated.

The current local vertical flow includes local email/password registration, protected sessions, personal/family onboarding, household subjects distinct from login memberships, person-linked file/camera/manual capture, hierarchical category browsing, controlled document dossiers and original viewing, deterministic evidence-linked profile extraction, human review, typed person/document/category/fact connections, an accessible relationship map/list, cited local Q&A, tasks, family access administration, activity history, and immediate deletion fencing with a server-authored 30-day Trash/restore deadline. React web and Flutter mobile share API semantics and exact AES-256-GCM known-answer vectors.

Azure foundations live under [`../infra`](../infra). Dev/stage are synthetic-data environments; `prod` is parameterized but deliberately unprovisioned until the separate production subscription and release gate exist.

This is implementation evidence for a bounded local profile, not a claim that every Phase 1 production, provider, operational, security or launch gate has been completed.
