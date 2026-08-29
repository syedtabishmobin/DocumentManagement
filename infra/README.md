# Doculyra Azure infrastructure

The Bicep entry point defines three isolated environments. `dev` and `stage` are authorized for synthetic/test data in the current subscription. `prod.bicepparam` is deliberately deployable only after a separate production subscription and release gate are approved.

Foundation deployment creates Australian-region resource groups, diagnostics, a private artifact registry, ciphertext-only storage with 30-day soft deletion, Key Vault for platform secrets (never customer plaintext keys), and budget alerts. Application deployment is a separate switch and requires immutable reviewed web/API image references. Dev currently deploys a synthetic-only web/API preview and mounts a dedicated Azure Files share for preview state; that share is not eligible for real customer content or the production artifact route.

`ADR-ARCH-007` selects Azure Database for PostgreSQL Flexible Server for canonical and workflow records. The repository now contains the provider-neutral workspace persistence port, PostgreSQL adapter, and versioned canonical migrations. PostgreSQL infrastructure provisioning and runtime activation remain disabled until exact SKU, managed identity/database administration, private networking, backup, cost, and release inputs are approved. The previously deployed Cosmos DB resource is historical drift and must be retired through an authorised Azure change only after a live dependency check; it is no longer declared or used by the application source.

```sh
export DOCULYRA_BUDGET_EMAIL='<notification-address>'
az deployment sub what-if --location australiaeast --template-file infra/main.bicep --parameters infra/environments/dev.bicepparam
az deployment sub create --location australiaeast --template-file infra/main.bicep --parameters infra/environments/dev.bicepparam
```

The notification address is read from the process environment and MUST NOT be committed. If it is absent, the budget resource is intentionally omitted instead of creating an alert with an invalid recipient.

The dev parameter file contains only public provider identifiers, the connected Azure Communication Services sender, and boolean secret-presence markers. OAuth client secrets stay in Key Vault. The application deployment keeps `DM_EXTERNAL_CONNECTORS=disabled` and `DM_CONNECTOR_ADAPTERS_READY=false`. `DM_EXTERNAL_NOTIFICATIONS` is independently enabled in dev after Issue #18 live delivery conformance; this narrow Product Authority/UAT channel does not activate document connectors or mount their secrets.

The provider-console setup, exact permissions, Key Vault secret references, verified development state, remaining corrections, and activation checklist are maintained in [`OPS-PROVIDER-001`](../docs/09-devops/08-external-provider-setup.md). As verified on 29 August 2026, Microsoft registration, ACS Email foundations, Google's three identity scopes and development test user, Dropbox's read-only document scopes, and Box read-only scope are prepared. Google still needs distinct legal URLs/logo and a least-privilege decision for the currently saved restricted `drive.readonly` scope; its Gmail scope is not yet saved. Dropbox's unnecessary OIDC scopes are removed, while implicit/public-client mode and app-secret rotation remain to be closed. Registration metadata must not be interpreted as a working adapter.

Prepared dev callback URLs use the generated web origin because the web container reverse-proxies `/api` to the API:

- `/api/auth/google/callback`
- `/api/auth/microsoft/callback`
- `/api/connectors/gmail/callback`
- `/api/connectors/google-drive/callback`
- `/api/connectors/onedrive/callback`
- `/api/connectors/dropbox/callback`
- `/api/connectors/box/callback`

Do not pass `deployApplications=true` with mutable image tags. Do not deploy `prod.bicepparam` in the dev/stage subscription. Mobile binaries are built and signed in CI and distributed through Apple/Google test channels; they are not hosted as Azure compute resources.

ACR Tasks are not available on the current subscription. `.github/workflows/container-images.yml` therefore uses GitHub-hosted Docker Buildx and passwordless Azure OIDC to push immutable, provenance-attested images. The dev managed identity is limited to ACR push/pull for the dev registry; deployment remains a separately reviewed Bicep action.
