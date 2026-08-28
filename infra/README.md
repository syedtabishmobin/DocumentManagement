# Doculyra Azure infrastructure

The Bicep entry point defines three isolated environments. `dev` and `stage` are authorized for synthetic/test data in the current subscription. `prod.bicepparam` is deliberately deployable only after a separate production subscription and release gate are approved.

Foundation deployment creates Australian-region resource groups, diagnostics, a private artifact registry, ciphertext-only storage with 30-day soft deletion, Key Vault for platform secrets (never customer plaintext keys), serverless Cosmos DB, and budget alerts. Application deployment is a separate switch and requires immutable reviewed web/API image references.

```sh
export DOCULYRA_BUDGET_EMAIL='<notification-address>'
az deployment sub what-if --location australiaeast --template-file infra/main.bicep --parameters infra/environments/dev.bicepparam
az deployment sub create --location australiaeast --template-file infra/main.bicep --parameters infra/environments/dev.bicepparam
```

The notification address is read from the process environment and MUST NOT be committed. If it is absent, the budget resource is intentionally omitted instead of creating an alert with an invalid recipient.

Do not pass `deployApplications=true` with mutable image tags. Do not deploy `prod.bicepparam` in the dev/stage subscription. Mobile binaries are built and signed in CI and distributed through Apple/Google test channels; they are not hosted as Azure compute resources.
