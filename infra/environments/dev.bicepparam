using '../main.bicep'

param environment = 'dev'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = true
param apiImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-api:dev-e0d549d0f387428ac71fa042c542caa89260cf88'
param webImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-web:dev-e0d549d0f387428ac71fa042c542caa89260cf88'
param configureProviderRegistrations = true
param microsoftClientId = '12c61f10-e630-4022-879b-17e897967b11'
param microsoftTenantId = '945613e2-ad35-422e-a606-cf7d839982c2'
param microsoftClientSecretConfigured = true
param googleClientId = '910511403425-4330im2i0he7fckt6cd9hcg6gt6e3mpd.apps.googleusercontent.com'
param googleClientSecretConfigured = true
param dropboxAppKey = '42q2oall797rlcs'
param dropboxAppSecretConfigured = true
param boxClientId = '46o6gjad76z6byt0hacdfabhovf9ga47'
param boxClientSecretConfigured = true
// Issue #77 is deployed fail-closed. Populate the public Entra External ID
// metadata and Key Vault presence marker only after the owner completes the
// external tenant, app/user-flow and provider federation steps in OPS-PROVIDER-001.
// Activation remains false until synthetic live conformance and independent QA pass.
param externalIdentityAdapterActivated = false
param externalIdentityAuthority = ''
param externalIdentityTenantId = ''
param externalIdentityClientId = ''
param externalIdentityCallbackUrl = ''
param externalIdentityProviderAllowList = []
param externalIdentityClientSecretName = ''
param externalIdentityClientSecretConfigured = false
param azureCommunicationServiceName = 'acs-doculyra-dev'
param azureCommunicationEndpoint = 'https://acs-doculyra-dev.australia.communication.azure.com'
param emailFromAddress = 'DoNotReply@9900614b-2e01-4d86-93aa-379c583ada57.azurecomm.net'
param acsEmailRoleAssignmentName = '0218e4d2-5b83-44ae-8a4c-cdc5cebc4e6a'
param configureNotificationAdapterInfrastructure = true
param notificationAdapterActivated = true
param monthlyBudgetAud = 25
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
