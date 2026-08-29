# Azure foundation and preview deployment evidence — 28–29 August 2026

This record contains content-free infrastructure evidence only. It contains no tenant ID, subscription ID, credentials, personal notification address, customer data, or application secret.

## Scope and result

| Environment | Deployment | Result | Customer-data policy | Applications |
|---|---|---|---|---|
| `dev` | Foundation plus immutable application revisions | `Succeeded` | `synthetic-only` | React web `b5720beedd6afa908a823775efeab88b4d47968a`; NestJS API `65cc3b62d104ba7faa880e89e0f24880483521ec` |
| `stage` | `doculyra-stage-foundation-refresh-20260829` | `Succeeded` | `synthetic-only` | Not deployed |
| `prod` | Parameterized only | Not provisioned | `production-gated` | Not deployed |

Both live deployments used Australia East and isolated resource groups. Azure validation and ResourceId-only What-If completed before creation. An initial dev attempt failed because the current Key Vault API rejects an explicit `enablePurgeProtection: false`; the Bicep was corrected to omit the property outside production, recompiled, revalidated, and the idempotent retry succeeded.

## Live verification

The following properties were queried from the deployed resources after successful completion:

- Blob object and container soft deletion: enabled for 30 days.
- Blob permanent-delete bypass: disabled; versioning and 30-day change feed: enabled.
- Storage transport: HTTPS/TLS-only with public Blob access disabled and infrastructure encryption required.
- Cosmos DB: local authentication disabled, key-based metadata writes disabled, continuous seven-day backup enabled; free tier enabled only for dev.

> Supersession note — 29 August 2026: this line records what the 28 August deployment created. `ADR-ARCH-007` selects PostgreSQL, and the current Bicep/application source no longer declares or uses Cosmos DB. Live Cosmos retirement remains a separately authorised Azure operation after dependency verification; this historical evidence is intentionally not rewritten as if that deletion already occurred.
- Key Vault: RBAC authorization and soft delete enabled with 90-day retention. Purge protection remains reserved for production because enabling it is irreversible.
- Monthly resource-group budget: AUD 25 for dev and AUD 75 for stage, with notification contacts supplied at deployment time rather than committed to source.
- Dev application deployment switch: `true`; stage and prod remain `false`.
- Dev web: `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io`.
- Dev API: `https://ca-doculyra-dev-api.ashystone-3c89dc27.australiaeast.azurecontainerapps.io`.
- Web root, direct API health, proxied API health, and proxied unauthenticated-session checks returned HTTP 200 after deployment.
- Public `/privacy` and `/terms` routes returned HTTP 200 from healthy web revision `ca-doculyra-dev-web--0000005`; browser verification confirmed the correct page headings, titles, legal-page navigation, synthetic-only boundary, and no horizontal overflow.
- The dev API reports `synthetic-only`, outbound network denied, external AI disabled, and external connectors disabled.
- Synthetic preview state is persisted on a dedicated 5 GiB Azure Files share; it is not the production customer artifact route.
- Immutable web/API images were built and pushed by GitHub-hosted runners using a repository/branch-bound Azure OIDC identity with ACR push only. The registry admin account remains disabled.
- ACR Tasks were unavailable on this subscription, returning `TasksOperationsNotAllowed`; the passwordless GitHub OIDC build path is the implemented replacement.
- Stage foundations were refreshed with the same repository/branch-bound OIDC identity pattern and synthetic-preview share; stage applications remain deliberately disabled.

## Gates that remain

The live dev application does not authorize real customer data. Its capture routes require an explicit synthetic-data confirmation and store only synthetic preview state. Real-document enablement remains gated on the ciphertext-only Azure adapter, client-side key lifecycle, device-local intelligence, external identity configuration, network/private-endpoint hardening, secrets/RBAC review, automated evidence, privacy/legal review, and independent security testing. Production also requires a separate production subscription and an explicit production deployment approval.
