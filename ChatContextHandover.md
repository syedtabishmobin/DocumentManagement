# Temporary Chat Context Handover

> **Temporary operational file.** Delete this file after the next Codex task has read it and confirmed the continuation point. Durable product, architecture, security, operations, and backlog decisions remain in the numbered `docs/` sources and take precedence over this summary.

## Repository and required reading

- Repository: `/Users/syedtabishmobin/Documents/Work/Techafide/Codex/Projects/DocumentManagement`
- Branch: `main`
- Read first: `AGENTS.md`, `CODEX.md`, `docs/00-context/decision-register.md`, this file, and the applicable specification/backlog documents.
- Do not edit the preserved historical handover under `docs/00-context/`.
- Full Phase 1 implementation is authorized by `DEC-041` and `DEC-054`; local and Azure dev remain synthetic/test-data only until release gates are met.

## Current product and deployment state

- Working brand: **Doculyra**, with Doculyra Home for Phase 1.
- React/TypeScript web and authenticated vault plus a Flutter iOS/Android client are the approved clients.
- Azure dev website: <https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io>
- Deployed legal pages:
  - <https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/privacy>
  - <https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/terms>
- The dev deployment is a synthetic preview. External connectors, external notifications, and hosted AI remain disabled.
- Current deployed web revision recorded in infrastructure evidence: `ca-doculyra-dev-web--0000005`, built from commit `b5720be`.
- The evidence-based personal/family gap list is `docs/10-backlog/06-personal-family-remaining-work.md`; it aggregates 11 missing, 24 incomplete, and 2 required-absence-evidence work items.

## Provider configuration verified on 29 August 2026

The durable, secret-free runbook is `docs/09-devops/08-external-provider-setup.md` (`OPS-PROVIDER-001`). Registration never means that an adapter is active.

- **Microsoft:** development registration and Key Vault secret metadata are prepared. Adapter and conformance work remain.
- **Google:** one test user is configured. Data Access retains `openid`, `userinfo.email`, `userinfo.profile`, and restricted `drive.readonly` after reload. The identity scopes are correct. Before activation, decide whether broad `drive.readonly` is justified instead of selected-file `drive.file`; `gmail.readonly` is not currently saved. Branding was last verified with homepage placeholders, so point Privacy and Terms at the deployed distinct legal URLs and add the approved logo.
- **Dropbox:** only `account_info.read`, `files.metadata.read`, and `files.content.read` are selected. `profile`, `openid`, `email`, and write scopes are cleared. Still verify/disable implicit public-client mode, confirm the least-permissive content-access mode, and rotate the app secret in the provider and Key Vault because it was exposed during an earlier console review. Never place or repeat the secret value in chat, commands, logs, or the repository.
- **Box:** read-only scope is verified and write scope is cleared.
- **Azure Communication Services Email:** resource/domain/sender and runtime identity role are prepared; the notification adapter and synthetic-recipient controls are not implemented or enabled.

## Most recent completed work

- Added truthful public `/privacy` and `/terms` routes and deployed them to Azure dev.
- Added `docs/10-backlog/06-personal-family-remaining-work.md` with the complete remaining personal/family work inventory.
- Refreshed provider documentation after live Google and Dropbox verification.
- The last full `pnpm verify` before this handover passed all specification, contract, reference-data, traceability, type, unit, and build gates.

## Recommended continuation

1. Read `docs/10-backlog/06-personal-family-remaining-work.md` and select the next coherent implementation increment without redoing completed preview work.
2. Prefer foundational identity/session, persistent workspace/subject/grant storage, and encrypted document lifecycle work before activating live connectors.
3. Keep every provider `CONFIGURED_DISABLED` until its callback, state/nonce/PKCE, encrypted token custody, consent, revocation, deletion, audit, negative tests, and release evidence pass.
4. Preserve the customer-controlled encryption/device-processing boundary in `DEC-050`; do not send plaintext customer documents to hosted AI by implication.
5. Update implementation status, tests, deployment evidence, and relevant specifications in the same change; commit and push completed increments as authorized.

## Workspace cautions

- Two unrelated untracked duplicate Flutter files predate the latest documentation work and must not be deleted or committed without inspecting their ownership:
  - `src/apps/mobile/lib/main 2.dart`
  - `src/apps/mobile/test/widget_test 2.dart`
- Secrets belong in the environment-specific Key Vault, never in tracked files.
- After the new task confirms it has read this handover, remove `ChatContextHandover.md`, validate the repository, commit the removal, and push it.
