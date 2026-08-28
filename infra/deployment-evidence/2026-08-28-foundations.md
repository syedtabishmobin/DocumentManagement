# Azure foundation deployment evidence — 28 August 2026

This record contains content-free infrastructure evidence only. It contains no tenant ID, subscription ID, credentials, personal notification address, customer data, or application secret.

## Scope and result

| Environment | Deployment | Result | Customer-data policy | Applications |
|---|---|---|---|---|
| `dev` | `doculyra-dev-foundation` | `Succeeded` | `synthetic-only` | Not deployed |
| `stage` | `doculyra-stage-foundation` | `Succeeded` | `synthetic-only` | Not deployed |
| `prod` | Parameterized only | Not provisioned | `production-gated` | Not deployed |

Both live deployments used Australia East and isolated resource groups. Azure validation and ResourceId-only What-If completed before creation. An initial dev attempt failed because the current Key Vault API rejects an explicit `enablePurgeProtection: false`; the Bicep was corrected to omit the property outside production, recompiled, revalidated, and the idempotent retry succeeded.

## Live verification

The following properties were queried from the deployed resources after successful completion:

- Blob object and container soft deletion: enabled for 30 days.
- Blob permanent-delete bypass: disabled; versioning and 30-day change feed: enabled.
- Storage transport: HTTPS/TLS-only with public Blob access disabled and infrastructure encryption required.
- Cosmos DB: local authentication disabled, key-based metadata writes disabled, continuous seven-day backup enabled; free tier enabled only for dev.
- Key Vault: RBAC authorization and soft delete enabled with 90-day retention. Purge protection remains reserved for production because enabling it is irreversible.
- Monthly resource-group budget: AUD 25 for dev and AUD 75 for stage, with notification contacts supplied at deployment time rather than committed to source.
- Application deployment switch: `false`; API and web URLs are therefore intentionally empty.

## Gates that remain

These foundations do not authorize real customer data. Application workloads remain gated on immutable reviewed images, the ciphertext-only Azure adapter, external identity configuration, network/private-endpoint hardening, secrets/RBAC review, automated evidence, privacy/legal review, and independent security testing. Production also requires a separate production subscription and an explicit production deployment approval.
