# External Identity, Document Provider, and Email Setup Runbook

| Field | Value |
|---|---|
| Document ID | `OPS-PROVIDER-001` |
| Version | `0.1` |
| Status | **ACTIVE DEV SETUP RECORD — provider activation remains gated** |
| Product phase | Phase 1 — Personal and Family |
| Environment | Azure `dev`; synthetic/test data only |
| Verified | 29 August 2026 |
| Primary decisions | `DEC-043`, `DEC-045`, `DEC-046`, `DEC-049`, `DEC-050`, `DEC-054`, `DEC-055` |

## 1. Purpose and safety boundary

This runbook records how to create and verify the Microsoft, Google, Dropbox, and Box applications used by Doculyra, how to configure Azure Communication Services Email, and which public identifiers and secret references belong in each environment.

It never records secret values. Do not paste client secrets, tokens, connection strings, private keys, recovery codes, or customer data into source control, tickets, chat, screenshots, logs, Bicep parameters, or browser-visible variables. Provider secrets belong in the environment-specific Azure Key Vault. Public client IDs, app keys, tenant IDs, callback URLs, and resource names may be recorded.

Registration is not activation. A provider is active only after its adapter implements authorization-code exchange, state and PKCE validation, encrypted token custody, minimal-scope consent, disconnect/revocation, deletion fencing, audit, error recovery, and the tests required by [`API-CON-001`](../05-api/04-connector-contracts.md). The current deployment deliberately keeps `DM_EXTERNAL_CONNECTORS=disabled`, `DM_CONNECTOR_ADAPTERS_READY=false`, and `DM_EXTERNAL_NOTIFICATIONS=disabled`.

## 2. Development endpoints

Development web origin:

```text
https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io
```

| Provider capability | Exact development callback |
|---|---|
| Google sign-in | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/auth/google/callback` |
| Gmail import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/gmail/callback` |
| Google Drive import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/google-drive/callback` |
| Microsoft sign-in | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/auth/microsoft/callback` |
| OneDrive import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/onedrive/callback` |
| Dropbox import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/dropbox/callback` |
| Box import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/box/callback` |

The Azure-generated hostname is acceptable for development. Stage and production require separate registrations and exact callbacks for their own origins. Production also requires controlled custom DNS, legal/privacy URLs, provider review where applicable, and the production release gate.

## 3. Verified development state

The following is a read-only verification snapshot, not an activation approval.

| Provider | Verified state | Remaining provider-console work |
|---|---|---|
| Microsoft Entra / Graph | Application `Doculyra Dev`; multi-tenant Entra plus personal Microsoft accounts; both exact callbacks present; delegated `openid`, `profile`, `email`, `offline_access`, `User.Read`, `Files.Read`, and `Mail.Read`; Key Vault secret metadata present and enabled. | Registration is ready for adapter development. Do not grant application-wide Graph permissions or write scopes. |
| Google Auth / Drive / Gmail | Project `doculyra-dev`; Gmail API, Google Drive API, and Google Picker API are enabled; all three exact callbacks and the web origin are present; app name, support email, homepage, authorized domain, and one development test user are present; Key Vault secret metadata is present and enabled. Data Access now retains `openid`, `userinfo.email`, `userinfo.profile`, and `drive.readonly` after reload. The privacy and terms fields were last verified pointing to the homepage. | Identity scopes are saved. Before connector activation, replace the branding placeholders with the distinct `/privacy` and `/terms` URLs, add the approved logo, decide whether broad restricted `drive.readonly` is justified instead of selected-file `drive.file`, and add `gmail.readonly` only when Gmail attachment import is implemented and ready for its verification obligations. |
| Dropbox | Exact callback present; development app; only `account_info.read`, `files.metadata.read`, and `files.content.read` are selected; `openid`, `profile`, `email`, and all write scopes are cleared; Key Vault secret metadata is present and enabled. | The read-scope correction is complete. Disable implicit/public-client grant for the server-mediated code flow if it remains enabled, confirm the least-permissive content-access mode, and rotate the app secret/update Key Vault after the configuration review. |
| Box | Enabled OAuth application; exact callback present; `Read all files and folders` is selected and write access is no longer selected; Key Vault secret metadata is present and enabled. | Read-only scope correction is complete. Use downscoping when the selected-file flow permits it and retain the production activation gate. |
| Azure Communication Services Email | `acs-doculyra-dev` is linked to `ecs-doculyra-dev/AzureManagedDomain`; data location is Australia; Domain, SPF, DKIM, DKIM2, and DMARC are verified; sender is configured; runtime managed identity has `Communication and Email Service Owner`. | Provider resources are ready for a synthetic delivery adapter and test-recipient controls. The application email adapter is not implemented or enabled. |

## 4. Google setup

Official references: [Google OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes), [web-server OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server), [test audience rules](https://support.google.com/cloud/answer/15549945), and [OAuth verification](https://support.google.com/cloud/answer/13463073).

### 4.1 Project and client

1. Use a dedicated project for each environment. Development uses project ID `doculyra-dev`.
2. Enable the Google Drive API and Gmail API in that project.
3. Create an OAuth client of type **Web application**.
4. Add the development web origin under authorized JavaScript origins.
5. Add all three exact Google callbacks from section 2.
6. Copy the public OAuth client ID to `DM_GOOGLE_CLIENT_ID`.
7. Store the client secret in Key Vault as `google-documents-client-secret`.

### 4.2 Branding

In Google Auth Platform → Branding:

1. Set the app name, user-support email, developer contact, homepage, and authorized domain.
2. Add a Doculyra logo that matches the public website.
3. Use the public, distinct development URLs after deployment:
   - `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/privacy`
   - `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/terms`
4. Add the approved Doculyra logo and save. Final production legal pages still require legal/privacy review, the production operator identity, domain, contact details, and release approval.

### 4.3 Test audience

In Google Auth Platform → Audience:

1. Keep the development project in `Testing`.
2. Add the product owner's Google account as a test user. **Verified complete: one named development test user is present.**
3. Add only named developers/testers who need the integration.
4. Expect testing authorizations to expire according to Google's test-mode policy; do not treat test tokens as production-ready.

### 4.4 Data Access and runtime scopes

Add only the scopes the implementation actually requests. Read-only verification on 29 August 2026 confirmed that the Data Access page retains `openid`, `userinfo.email`, `userinfo.profile`, and `drive.readonly` after reload. The identity set matches the intended sign-in scopes. `drive.readonly` is a broad restricted scope rather than the selected-file scope recommended below, and no Gmail scope is currently saved. Provider-console configuration therefore remains development-only pending the exact connector behavior, least-privilege decision, verification obligations, and adapter conformance evidence.

| Capability | Scope set | Notes |
|---|---|---|
| Google sign-in | `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile` | Identity only; do not combine document access into initial sign-in consent. |
| Google Drive selected-file import | `https://www.googleapis.com/auth/drive.file` | Prefer Google Picker and per-file access. Do not request full-drive write access. |
| Gmail attachment import | `https://www.googleapis.com/auth/gmail.readonly` | Restricted scope; production use requires Google's applicable verification and possibly an independent security assessment. No send, edit, or delete permission. |

Request Drive and Gmail consent incrementally, only when the user chooses that connector. The authorization request must use a cryptographically random, session-bound `state`, authorization code with PKCE, exact redirect URI, and the minimum scope set. Tokens must remain server-side and encrypted; document content still follows the customer-controlled encryption and device-processing contract in `DEC-050`.

## 5. Microsoft Entra, OneDrive, and Outlook setup

Official references: [register an application](https://learn.microsoft.com/en-us/graph/auth-register-app-v2), [redirect URI guidance](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url), [permissions and consent](https://learn.microsoft.com/en-us/entra/identity-platform/permissions-consent-overview), and [Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference).

1. Create one development app registration and separate stage/production registrations later.
2. For the consumer product, select **Accounts in any organizational directory and personal Microsoft accounts**.
3. Add the Microsoft sign-in and OneDrive callbacks from section 2 as **Web** redirect URIs.
4. Configure delegated Microsoft Graph permissions only:
   - identity: `openid`, `profile`, `email`, `offline_access`, `User.Read`;
   - OneDrive: `Files.Read`;
   - Outlook document import: `Mail.Read`.
5. Do not add application permissions, `Files.Read.All`, `Mail.ReadWrite`, or send permission.
6. Copy the public application ID to `DM_MICROSOFT_CLIENT_ID` and the directory ID to `DM_MICROSOFT_TENANT`.
7. Store the client secret in Key Vault as `microsoft-documents-client-secret`; record its expiry and rotate it before expiry with an overlap-and-revoke procedure.

Development registration values are tracked as non-secret Bicep parameters in [`infra/environments/dev.bicepparam`](../../infra/environments/dev.bicepparam). The verified Microsoft secret expires on 25 February 2027 UTC.

## 6. Dropbox setup

Official references: [Dropbox OAuth guide](https://developers.dropbox.com/oauth-guide) and [app-console field guide](https://www.dropbox.com/developers/reference/getting-started).

1. Create a scoped Dropbox API app for the environment.
2. Register the exact Dropbox callback from section 2.
3. Use authorization-code flow with PKCE and server-side token exchange.
4. Disable **Allow public clients (Implicit Grant & PKCE)** for the current backend-mediated design. If a future native direct-to-provider flow is approved, use PKCE without embedding the app secret and document that as a separate client registration or route.
5. Select only `account_info.read`, `files.metadata.read`, and `files.content.read`.
6. Remove OIDC `openid`, `profile`, and `email`; Doculyra does not use Dropbox for sign-in.
7. Choose the minimum content-access mode that supports the approved picker/import experience. Prefer a Dropbox-hosted chooser or incremental access over unrestricted background discovery where product behavior permits it.
8. Copy the public app key to `DM_DROPBOX_APP_KEY` and store the app secret in Key Vault as `dropbox-connector-app-secret`.
9. Keep the app in Development until callback, consent, token, disconnect, deletion, audit, error, and rate-limit tests pass; complete Dropbox production review before public use.

## 7. Box setup

Official references: [Box OAuth 2.0](https://developer.box.com/guides/authentication/oauth2/), [OAuth with SDKs](https://developer.box.com/guides/authentication/oauth2/with-sdk/), [application scopes](https://developer.box.com/guides/api-calls/permissions-and-errors/scopes/), and [token downscoping](https://developer.box.com/guides/authentication/tokens/downscope/).

1. Create a **Custom App** using standard OAuth 2.0 user authentication.
2. Register the exact Box callback from section 2.
3. Enable only **Read all files and folders stored in Box** (`root_readonly`).
4. Disable **Read and write all files and folders stored in Box** (`root_readwrite`) and every administrative, AI, signature, user, enterprise, and webhook scope unless a later approved feature requires it.
5. Keep **Perform Actions as Users** disabled.
6. Where the Box selected-file flow supports it, downscope access tokens to the chosen item and required read/preview/download operation.
7. Copy the public client ID to `DM_BOX_CLIENT_ID` and store the client secret in Key Vault as `box-connector-client-secret`.
8. Complete Box authorization/review requirements before public activation.

## 8. Azure Communication Services Email

Official references: [email domains and sender authentication](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-domain-and-sender-authentication), [managed identity](https://learn.microsoft.com/en-us/azure/communication-services/how-tos/managed-identity), and [send email](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email).

Development resources:

| Setting | Value |
|---|---|
| Communication Services | `acs-doculyra-dev` |
| Email Communication Services | `ecs-doculyra-dev` |
| Domain | `AzureManagedDomain` |
| MailFrom | `DoNotReply@9900614b-2e01-4d86-93aa-379c583ada57.azurecomm.net` |
| Runtime identity | `id-doculyra-dev-runtime` |
| ACS role | `Communication and Email Service Owner` |

The runtime identity receives a role assignment on the ACS resource. The ACS resource itself does not need to own that identity. Runtime code must authenticate through managed identity; do not add an ACS connection string or access key to application configuration when managed identity is supported.

Before enabling synthetic email delivery:

1. implement the channel-neutral notification adapter and an allow-list of test recipients;
2. keep message content minimized and never attach or quote document content by default;
3. implement deduplication, delivery-state reconciliation, bounce/failure handling, user preferences, revocation, audit, and rate/cost controls;
4. test only with synthetic content; and
5. retain `DM_EXTERNAL_NOTIFICATIONS=disabled` until the delivery conformance suite passes.

## 9. Configuration and Key Vault inventory

### 9.1 Public environment configuration

| Setting | Source |
|---|---|
| `DM_PUBLIC_BASE_URL` | Environment-specific web origin |
| `DM_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `DM_MICROSOFT_CLIENT_ID` | Microsoft application ID |
| `DM_MICROSOFT_TENANT` | Microsoft directory ID or approved tenant selector |
| `DM_DROPBOX_APP_KEY` | Dropbox app key |
| `DM_BOX_CLIENT_ID` | Box client ID |
| `DM_AZURE_COMMUNICATION_SERVICE` | ACS resource name |
| `DM_AZURE_COMMUNICATION_ENDPOINT` | ACS endpoint |
| `DM_EMAIL_FROM` | Verified sender address |

### 9.2 Secret references

| Key Vault secret name | Consumer |
|---|---|
| `google-documents-client-secret` | Google identity, Drive, and Gmail adapter |
| `microsoft-documents-client-secret` | Microsoft identity, OneDrive, and Outlook adapter |
| `dropbox-connector-app-secret` | Dropbox adapter |
| `box-connector-client-secret` | Box adapter |

Add secrets through Azure Portal → Key Vault → Secrets using a named, environment-specific vault. Set enabled state, expiry where the provider supports it, content type, and ownership/rotation metadata. After insertion, verify only name, enabled state, version, and expiry. Never run `az keyvault secret show --query value`, expose a value in shell history, or copy it into this repository.

The Bicep `*SecretConfigured` parameters are presence markers only. They do not prove that the runtime can read a secret, that an adapter exists, or that activation is safe. When adapter implementation is ready, mount Key Vault references to the API container through its least-privileged runtime identity; never expose a secret to the React or Flutter client.

## 10. Per-environment creation checklist

Create independent registrations for `dev`, `stage`, and `prod` so development callbacks, test users, credentials, incidents, and revocation cannot affect production.

1. Choose the environment origin and verify DNS ownership.
2. Create the provider application using the steps above.
3. Add only that environment's callbacks.
4. Set the minimum scopes and the correct test/publishing audience.
5. Store its secret in that environment's Key Vault.
6. Record only public IDs and secret-presence metadata in the environment parameter file.
7. Verify callback equality, secret metadata, consent copy, and provider status.
8. Run unit, OAuth state/PKCE, token-custody, callback replay, permission-drift, disconnect, deletion, rate-limit, audit, and synthetic end-to-end tests.
9. Obtain security/privacy and release approval.
10. Enable one provider and environment at a time with rollback and revocation ready.

## 11. Activation evidence checklist

A provider remains `CONFIGURED_DISABLED` until all applicable evidence is present:

- exact authorization-start and callback routes exist in code and OpenAPI;
- state, nonce where applicable, PKCE, redirect, issuer, audience, signature, expiry, and account-linking checks fail closed;
- tokens are encrypted, workspace/integration scoped, never browser persisted, and refresh/revoke behavior is tested;
- requested scopes match the provider console and consent copy exactly;
- selected external files or attachments enter the ordinary ingestion, content-policy, customer-encryption, ownership, and deletion lifecycle;
- permission drift, expired token, provider deletion, duplicate callback, reordered event, partial import, timeout, and rate limit have truthful recoverable states;
- disconnect stops polling, callback acceptance, and token use without silently deleting already imported documents;
- current authorization protects document, fact, graph, search, answer, export, and activity surfaces;
- logs and telemetry contain no token, filename, document content, email body, attachment text, evidence passage, query, or answer;
- synthetic E2E and security tests pass in the target environment; and
- an approved release record enables the exact adapter/version/scope set.

## 12. Current actions required from the product owner

No new IDs or secret values are needed now. The remaining console actions are:

1. Google: replace the homepage placeholders with the deployed distinct `/privacy` and `/terms` URLs and add the logo. Identity scopes are saved; decide whether the broader restricted `drive.readonly` scope is justified instead of `drive.file`, and add `gmail.readonly` only when the Gmail adapter and its verification path are ready. The development test user is complete.
2. Dropbox: the OIDC-scope removal is complete. Disable implicit/public-client grant if it remains enabled, confirm the least-permissive content-access mode, and rotate the app secret/update Key Vault after this review.
3. Box: no immediate scope correction remains; read-only is verified. Keep the app development-gated.

Apple, permanent domains, production OAuth verification, provider production reviews, public email/SMS delivery, and store publication remain later owner-controlled gates.
