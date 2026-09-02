# External Identity, Document Provider, and Email Setup Runbook

| Field | Value |
|---|---|
| Document ID | `OPS-PROVIDER-001` |
| Version | `0.2` |
| Status | **ACTIVE DEV SETUP RECORD — provider activation remains gated** |
| Product phase | Phase 1 — Personal and Family |
| Environment | Azure `dev`; synthetic/test data only |
| Verified | 2 September 2026 (repository configuration only; no live External ID tenant conformance) |
| Primary decisions | `DEC-043`, `DEC-045`, `DEC-046`, `DEC-049`, `DEC-050`, `DEC-054`, `DEC-055` |

## 1. Purpose and safety boundary

This runbook records how to create and verify the Microsoft Entra External ID browser-delegated identity broker for Google, Apple, and Microsoft account entry, the separate Google, Microsoft, Dropbox, and Box document applications, Azure Communication Services Email, and the public identifiers and secret references that belong in each environment.

It never records secret values. Do not paste client secrets, tokens, connection strings, private keys, recovery codes, or customer data into source control, tickets, chat, screenshots, logs, Bicep parameters, or browser-visible variables. Provider secrets belong in the environment-specific Azure Key Vault. Public client IDs, app keys, tenant IDs, callback URLs, and resource names may be recorded.

Registration is not activation. The browser-delegated identity adapter remains disabled unless its exact Entra External ID tenant, application, user flow, federated providers, callback, Key Vault secret reference, implementation and release evidence all pass. A document provider is active only after its separate adapter implements authorization-code exchange, state and PKCE validation, encrypted token custody, minimal-scope consent, disconnect/revocation, deletion fencing, audit, error recovery, and the tests required by [`API-CON-001`](../05-api/04-connector-contracts.md). The current deployment deliberately keeps `DM_EXTERNAL_IDENTITY_ADAPTER=disabled`, `DM_EXTERNAL_CONNECTORS=disabled` and `DM_CONNECTOR_ADAPTERS_READY=false`. The separately governed Product Authority/UAT email channel is enabled only because Issue #18 passed its own narrower conformance gate.

## 2. Development endpoints

Development web origin:

```text
https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io
```

| Provider capability | Exact development callback |
|---|---|
| Entra External ID browser-delegated account entry | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/auth/external/callback` |
| Gmail import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/gmail/callback` |
| Google Drive import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/google-drive/callback` |
| OneDrive import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/onedrive/callback` |
| Dropbox import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/dropbox/callback` |
| Box import | `https://ca-doculyra-dev-web.ashystone-3c89dc27.australiaeast.azurecontainerapps.io/api/connectors/box/callback` |

Google, Apple, and Microsoft do not return directly to provider-specific Doculyra callbacks for Issue #77. They federate into the external tenant; Entra validates that provider response and returns only to the single registered Doculyra callback above. Provider-console federation callbacks are tenant-derived `ciamlogin.com` URLs and MUST be copied from the exact external tenant/provider setup screen, not inferred from the Doculyra URL or reused from the older direct-registration record.

The Azure-generated hostname is acceptable for development. Stage and production require separate external tenants or an explicitly approved isolation design, separate registrations, and exact callbacks for their own origins. They remain disabled in checked-in configuration. Production also requires controlled custom DNS, legal/privacy URLs, provider review where applicable, certificate/federated app credentials rather than a long-lived client secret where supported, and the production release gate.

## 3. Verified development state

The following is a read-only verification snapshot, not an activation approval.

| Provider | Verified state | Remaining provider-console work |
|---|---|---|
| Entra External ID browser-delegated identity | `UNCONFIGURED_DISABLED`. Bicep accepts authority, tenant ID, client ID, the exact Doculyra callback, a constrained `apple`/`google`/`microsoft` allow-list and a Key Vault client-secret reference, but all environment files keep activation false. | Create the DEV external tenant, app and user flow; configure each provider; store the confidential-client secret in DEV Key Vault; then complete synthetic conformance and independent QA before any provider is enabled. |
| Microsoft Entra / Graph document registration | Application `Doculyra Dev`; multi-tenant Entra plus personal Microsoft accounts; delegated `openid`, `profile`, `email`, `offline_access`, `User.Read`, `Files.Read`, and `Mail.Read`; Key Vault secret metadata present and enabled. | This older registration supports the separately gated OneDrive/Outlook connector design. It is not the Issue #77 browser identity broker and MUST NOT be wired to the old direct sign-in callback. |
| Google Auth / Drive / Gmail | Project `doculyra-dev`; Gmail API, Google Drive API, and Google Picker API are enabled; the existing direct Google callbacks and web origin were previously registered; app name, support email, homepage, authorized domain, and one development test user are present; Key Vault secret metadata is present and enabled. Data Access retains `openid`, `userinfo.email`, `userinfo.profile`, and `drive.readonly`. | The older direct identity callback is not the Issue #77 broker. Configure a distinct Entra federation credential/callback set under section 5.2. Before any Google activation, correct privacy/terms/logo and keep document scopes out of account-entry consent. |
| Dropbox | Exact callback present; development app; only `account_info.read`, `files.metadata.read`, and `files.content.read` are selected; `openid`, `profile`, `email`, and all write scopes are cleared; Key Vault secret metadata is present and enabled. | The read-scope correction is complete. Disable implicit/public-client grant for the server-mediated code flow if it remains enabled, confirm the least-permissive content-access mode, and rotate the app secret/update Key Vault after the configuration review. |
| Box | Enabled OAuth application; exact callback present; `Read all files and folders` is selected and write access is no longer selected; Key Vault secret metadata is present and enabled. | Read-only scope correction is complete. Use downscoping when the selected-file flow permits it and retain the production activation gate. |
| Azure Communication Services Email | `acs-doculyra-dev` is linked to `ecs-doculyra-dev/AzureManagedDomain`; data location is Australia; Domain, SPF, DKIM, DKIM2, and DMARC are verified; sender is configured; runtime managed identity has send and delivery-log read roles. | The Product Authority/UAT notification adapter is operational after Issue #18 live conformance. This does not activate document connectors or customer-content email. |

## 4. Google setup

Official references: [Google OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes), [web-server OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server), [test audience rules](https://support.google.com/cloud/answer/15549945), and [OAuth verification](https://support.google.com/cloud/answer/13463073).

### 4.1 Project and client

1. Use a dedicated project for each environment. Development uses project ID `doculyra-dev`.
2. Enable the Google Drive API and Gmail API in that project.
3. Create an OAuth client of type **Web application**.
4. Add the development web origin under authorized JavaScript origins.
5. Add the Google Drive and Gmail document callbacks from section 2. Browser account entry instead uses the external-tenant federation callbacks in section 5.2; do not add a direct Doculyra Google sign-in callback.
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

## 5. Entra External ID account entry, OneDrive, and Outlook setup

Official references: [plan a customer identity deployment](https://learn.microsoft.com/en-us/entra/external-id/customers/concept-planning-your-solution), [register an external-tenant application](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-register-ciam-app), [create a sign-up/sign-in user flow](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-user-flow-sign-up-sign-in-customers), [associate an application](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-user-flow-add-application), [Google federation](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-google-federation-customers), [Apple federation](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-apple-federation-customers), [Microsoft-account federation](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-microsoft-accounts-federation-customers), and [identity-provider acceleration](https://learn.microsoft.com/en-us/entra/external-id/customers/concept-authentication-methods-customers#issuer-acceleration).

### 5.1 Create the DEV external tenant and application

These are owner/admin actions. Repository automation MUST NOT create or mutate the tenant for this increment.

1. In the Microsoft Entra admin center, create or select a dedicated **external tenant** for Doculyra DEV. Record its Australia-compatible location evidence, tenant subdomain and Directory (tenant) ID. Do not use the workforce tenant or the existing direct Graph/document app as a substitute.
2. While switched into that external tenant, register a confidential **Web** application for Doculyra DEV. Use single-tenant external-directory account support and register exactly the callback from section 2. Do not enable public-client or implicit flow.
3. Record only the external tenant's `https://<tenant-subdomain>.ciamlogin.com/<tenant-id>/v2.0` authority, tenant ID, application client ID and exact callback as the non-secret Bicep inputs. Verify the authority against the external tenant's OIDC discovery metadata before setting any presence marker.
4. Create a bounded DEV client credential. Put the value directly into the DEV Key Vault secret named by `externalIdentityClientSecretName`; never copy it into Bicep, GitHub, chat, shell history, logs or screenshots. Set expiry and ownership metadata.
5. Create one DEV sign-up/sign-in user flow. Select only approved identity methods; do not enable password reset, email recovery or a support fallback because `DEC-038` remains authoritative.
6. Under the user flow's **Applications**, associate the Doculyra DEV external-tenant app. One app can have only one user flow. Use **Run user flow** with the associated application and exact reply URL as pre-activation evidence, not as proof that the Doculyra adapter is ready.

### 5.2 Federate providers into the user flow

Configure providers one at a time. A configured provider is still unavailable to Doculyra until it appears in `externalIdentityProviderAllowList`, the adapter activation gate is true, and the exact candidate passes synthetic conformance and independent QA.

1. **Google:** create or reuse a Google OAuth web client dedicated to the DEV external tenant. Register every tenant-derived Google federation callback shown by Microsoft's current setup guidance, including the applicable `ciamlogin.com` URLs. Add `ciamlogin.com` and `microsoftonline.com` as authorized domains. Enter the Google client ID/secret under external tenant **External Identities → All identity providers → Google**, then select Google in the Doculyra user flow. This federation credential is held by Entra and is distinct from the document-connector credential in section 4.
2. **Apple:** in the owner-controlled Apple Developer account, create the App ID/Service ID, verified web domain and return URLs required by the exact external tenant. Create the Sign in with Apple key, then configure the Service ID/client ID, Team ID, Key ID and `.p8` key through Entra's Apple identity-provider setup. Add Apple to the user flow only after domain/return-URL validation and key-custody/rotation evidence are recorded. Never place the `.p8` value in this repository.
3. **Microsoft personal account:** register a dedicated MSA federation application that permits organizational directories plus personal Microsoft accounts, using the external tenant's generated federation callback. In the external tenant add a custom OIDC provider with discovery `https://login.microsoftonline.com/consumers/v2.0/.well-known/openid-configuration`, issuer `https://login.live.com`, client authentication `client_secret`, response type `code`, and scopes `openid profile email`; then add that provider to the user flow. This is separate from the external-tenant Doculyra relying-party app and from the OneDrive connector.
4. If work/school Microsoft accounts are later required, configure each approved Entra tenant as its own custom OIDC provider using Microsoft's external-tenant federation guidance. Do not silently broaden the Microsoft option into unrestricted work/school tenancy.

The Doculyra start route MAY use the allow-listed issuer-acceleration hint only as a routing hint: `domain_hint=google` for Google and `domain_hint=apple` for Apple. Microsoft account uses the configured custom OIDC provider's exact issuer/domain hint from the external tenant configuration; it MUST NOT accept a client-supplied arbitrary domain or tenant. Absence, mismatch, or unsupported `domain_hint` falls back to the Entra-hosted provider choice or fails closed according to the normative API contract. A hint never bypasses state, nonce, PKCE, issuer, audience, signature, expiry, callback replay or internal account-linking checks.

### 5.3 Separate OneDrive and Outlook document registration

Official references: [register an application](https://learn.microsoft.com/en-us/graph/auth-register-app-v2), [redirect URI guidance](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url), [permissions and consent](https://learn.microsoft.com/en-us/entra/identity-platform/permissions-consent-overview), and [Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference).

1. Create one development app registration and separate stage/production registrations later.
2. For the consumer product, select **Accounts in any organizational directory and personal Microsoft accounts**.
3. Add only the OneDrive document callback from section 2 as a **Web** redirect URI. Browser account entry uses Entra External ID sections 5.1–5.2 and MUST NOT add or revive a direct Doculyra Microsoft sign-in callback.
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

Issue #18 implements the repository transport with the official ACS Email SDK, managed-identity/Azure CLI conformance modes, the structured Product Authority allow-list, deterministic provider operation IDs, bounded retry and recipient-level Azure Monitor reconciliation. Engagement tracking is disabled and no attachment/HTML/product content path exists.

Before enabling synthetic email delivery:

1. compile and independently verify the channel-neutral notification adapter and configured recipient allow-list;
2. keep message content minimized and never attach or quote document content by default;
3. implement deduplication, delivery-state reconciliation, bounce/failure handling, user preferences, revocation, audit, and rate/cost controls;
4. test only with synthetic content; and
5. set `DM_EXTERNAL_NOTIFICATIONS=enabled` only in an environment whose exact delivery conformance suite has passed.

The repository Agent Engineering Framework adds the Product Authority decision/UAT notification contract and exactly-once ledger under `.agents/config/notifications.json`, `.agents/protocols/notification-event.schema.json`, and `.agents/state/notification-ledger.json`. Bicep codifies the runtime ACS role, least-privilege Log Analytics Data Reader role, ACS send/status diagnostic categories and non-secret runtime settings. Issue #18 live conformance passed for dev; ACS long-running-operation success remains only `SUBMITTED`/out-for-delivery until Azure Monitor reports terminal recipient delivery.

## 9. Configuration and Key Vault inventory

### 9.1 Public environment configuration

| Setting | Source |
|---|---|
| `DM_PUBLIC_BASE_URL` | Environment-specific web origin |
| `DM_EXTERNAL_IDENTITY_ADAPTER` | Explicit `enabled`/`disabled` release gate; checked-in DEV, Stage and production values are `disabled` |
| `DM_ENTRA_EXTERNAL_ID_AUTHORITY` | Exact TLS `ciamlogin.com` authority for the external tenant |
| `DM_ENTRA_EXTERNAL_ID_TENANT_ID` | External-tenant Directory ID; never a workforce-tenant assumption |
| `DM_ENTRA_EXTERNAL_ID_CLIENT_ID` | Doculyra confidential web app registered in the external tenant |
| `DM_ENTRA_EXTERNAL_ID_CALLBACK_URL` | Exact environment callback; DEV is the single browser-delegated callback in section 2 |
| `DM_EXTERNAL_IDENTITY_PROVIDER_ALLOW_LIST` | Comma-separated subset of `apple`, `google`, `microsoft`; empty means no provider is available |
| `DM_ENTRA_EXTERNAL_ID_CLIENT_SECRET_CONFIGURED` | Presence declaration only; never secret material or release evidence |
| `DM_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `DM_MICROSOFT_CLIENT_ID` | Microsoft application ID |
| `DM_MICROSOFT_TENANT` | Microsoft directory ID or approved tenant selector |
| `DM_DROPBOX_APP_KEY` | Dropbox app key |
| `DM_BOX_CLIENT_ID` | Box client ID |
| `DM_AZURE_COMMUNICATION_SERVICE` | ACS resource name |
| `DM_AZURE_COMMUNICATION_ENDPOINT` | ACS endpoint |
| `DM_EMAIL_FROM` | Verified sender address |
| `AZURE_CLIENT_ID` | User-assigned runtime identity client ID |
| `DM_LOG_ANALYTICS_WORKSPACE_ID` | Existing environment Log Analytics customer/workspace ID |
| `DM_NOTIFICATION_CREDENTIAL_MODE` | `MANAGED_IDENTITY` in Azure; explicit `AZURE_CLI` only for agent-local conformance |

### 9.2 Secret references

| Key Vault secret name | Consumer |
|---|---|
| Environment-selected `externalIdentityClientSecretName` (recommended DEV name: `entra-external-id-client-secret`) | Entra External ID confidential browser-delegated adapter only |
| `google-documents-client-secret` | Google Drive and Gmail document adapter |
| `microsoft-documents-client-secret` | OneDrive and Outlook document adapter |
| `dropbox-connector-app-secret` | Dropbox adapter |
| `box-connector-client-secret` | Box adapter |

Add secrets through Azure Portal → Key Vault → Secrets using a named, environment-specific vault. Set enabled state, expiry where the provider supports it, content type, and ownership/rotation metadata. After insertion, verify only name, enabled state, version, and expiry. Never run `az keyvault secret show --query value`, expose a value in shell history, or copy it into this repository.

The Bicep `*SecretConfigured` parameters are presence markers only. They do not prove that the runtime can read a secret, that an adapter exists, or that activation is safe. For External ID, a true marker causes Container Apps to resolve a versionless Key Vault reference through the existing least-privileged runtime managed identity and exposes it only to the API as a secret reference. A missing/disabled vault secret therefore fails at the platform boundary; the value is never emitted as an ordinary environment value or exposed to React/Flutter. The adapter still MUST fail closed if the runtime secret, discovery metadata or configured issuer/audience is unavailable or inconsistent.

### 9.3 External ID secret rotation

1. Create a new Entra app credential with a short bounded overlap; do not delete the working credential first.
2. Add a new enabled version to the same Key Vault secret name and record only version/created/expiry metadata in restricted operational evidence.
3. Create or restart the DEV Container Apps revision so the versionless Key Vault reference resolves the new version, then verify token exchange with named synthetic accounts for every currently enabled provider.
4. Confirm privacy-safe telemetry shows the new configuration version and successful health/conformance without token, claim, name or email leakage.
5. Revoke the old Entra credential, verify new sign-ins continue, and verify use of the old credential fails closed.
6. If any verification fails, disable `externalIdentityAdapterActivated`, reject outstanding callback state and roll back to the prior still-valid secret version during the overlap window. Do not enable a local recovery or support bypass.

## 10. Per-environment creation checklist

Create independent registrations for `dev`, `stage`, and `prod` so development callbacks, test users, credentials, incidents, and revocation cannot affect production.

1. Choose the environment origin and verify DNS ownership.
2. For identity, create the external tenant, confidential Doculyra app and one associated sign-up/sign-in user flow using section 5. For document access, create the separate provider application.
3. Add only that environment's exact Doculyra callback and provider federation callbacks; compare character-for-character, including scheme, host, path and case.
4. Set the minimum identity methods/scopes and correct named synthetic test audience. Recovery remains unavailable under `DEC-038`.
5. Store each credential in that environment's Key Vault and verify metadata/read authority without retrieving or displaying the value.
6. Record only public IDs, constrained provider allow-list, Key Vault secret name and secret-presence metadata in the environment parameter file.
7. Keep `externalIdentityAdapterActivated=false`. Compile Bicep and verify the deployed API reports disabled/unavailable while configuration is incomplete.
8. Verify callback equality, discovery authority/issuer/audience, app/user-flow association, provider status, consent copy and secret rotation/rollback.
9. Run unit, OAuth state/nonce/PKCE, token-custody, callback replay, account-linking/collision, permission-drift, revocation, deletion, rate-limit, audit/privacy and synthetic end-to-end tests.
10. Obtain security/privacy, protected CI, independent exact-candidate QA and release approval.
11. Add and activate one provider in DEV at a time with rollback and credential revocation ready. Stage and production stay disabled until their own governed release records pass.

## 11. Activation evidence checklist

A provider remains `CONFIGURED_DISABLED` until all applicable evidence is present:

- exact authorization-start and callback routes exist in code and OpenAPI;
- state, nonce where applicable, PKCE, redirect, issuer, audience, signature, expiry, and account-linking checks fail closed;
- tokens are encrypted, workspace/integration scoped, never browser persisted, and refresh/revoke behavior is tested;
- requested scopes match the provider console and consent copy exactly;
- for document providers, selected external files or attachments enter the ordinary ingestion, content-policy, customer-encryption, ownership, and deletion lifecycle;
- permission drift, expired token, provider deletion, duplicate callback, reordered event, partial import, timeout, and rate limit have truthful recoverable states;
- disconnect stops polling, callback acceptance, and token use without silently deleting already imported documents;
- current authorization protects document, fact, graph, search, answer, export, and activity surfaces;
- logs and telemetry contain no token, filename, document content, email body, attachment text, evidence passage, query, or answer;
- synthetic E2E and security tests pass in the target environment; and
- an approved release record enables the exact adapter/version/scope set.

For browser-delegated identity, release evidence additionally MUST bind the external tenant ID/subdomain, discovery authority, Doculyra app/client ID, exact callback, associated user-flow ID/configuration version, exact provider allow-list, Key Vault secret name/version metadata, synthetic tester set, source revision and immutable artifacts. It MUST prove that a missing secret, changed issuer/audience/callback, provider removal, disabled adapter or unavailable discovery endpoint denies new starts/callbacks without affecting local-password sessions.

### 11.1 Identity rollout and rollback

1. Deploy the code/configuration with an empty allow-list and `externalIdentityAdapterActivated=false`; verify local password entry is unaffected and external starts/callbacks are rejected.
2. Populate DEV public metadata and the Key Vault reference while activation remains false. Validate discovery, secret resolution, exact callback and user-flow association.
3. Put only the first approved provider in the allow-list, activate DEV, and limit the provider/user-flow audience to named synthetic testers.
4. Run live positive and negative conformance, privacy review and independent QA. Expand the DEV test audience only after PASS, then repeat independently for another provider.
5. Never infer Apple readiness from Google/Microsoft readiness or infer Stage/production readiness from DEV.

Rollback sets `externalIdentityAdapterActivated=false` first, removes the affected provider from the allow-list/user flow, rejects all outstanding callback state and stops provider token use. Revoke/rotate the affected federation and relying-party credentials where compromise or configuration drift is suspected. Preserve content-minimized audit/configuration evidence and verify other providers and local-password sessions remain unaffected. Provider-only users can be temporarily locked out; `DEC-038` prohibits inventing password reset, ownership transfer, support or break-glass fallback.

## 12. Current actions required from the product owner

Issue #77 cannot activate external identity until the owner/admin completes and records these external actions without publishing secret values:

1. Create/select the dedicated DEV Entra external tenant, confirm region/residency and record its public subdomain/tenant ID.
2. Register the confidential Doculyra DEV web app, exact callback and bounded credential; store the value in DEV Key Vault and provide only authority, tenant/client IDs, callback, secret name and safe presence/expiry metadata to deployment configuration.
3. Create the no-recovery sign-up/sign-in user flow and associate exactly the Doculyra DEV app.
4. Configure Google federation with its external-tenant callbacks, distinct privacy/terms URLs, logo and named synthetic users. Keep document scopes out of account-entry consent.
5. Supply the Apple Developer Team ID, Service ID, verified domain/return URLs, Key ID and controlled signing-key lifecycle, then configure Apple federation. Apple remains unavailable until complete.
6. Configure the dedicated Microsoft personal-account OIDC federation app/provider and approved synthetic account. Decide separately whether any named work/school tenant federation is in scope; no unrestricted expansion is assumed.
7. Approve provider consent/privacy copy, synthetic tester list, credential rotation owner/expiry, any incremental External ID cost/quota, and the first provider to activate after QA.
8. Dropbox: disable implicit/public-client grant if it remains enabled, confirm least-permissive document access and rotate the app secret after review. Box remains read-only and development-gated.

Permanent domains, Stage/production tenant/application configuration, provider production reviews, production credential form, public email/SMS delivery and store publication remain later owner-controlled gates. Until these actions and the Issue #77 evidence pass, DEV, Stage and production external identity remain disabled.
