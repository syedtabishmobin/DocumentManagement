using '../main.bicep'

param environment = 'dev'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = true
param apiImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-api:dev-65cc3b62d104ba7faa880e89e0f24880483521ec'
param webImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-web:dev-b5720beedd6afa908a823775efeab88b4d47968a'
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
param azureCommunicationServiceName = 'acs-doculyra-dev'
param azureCommunicationEndpoint = 'https://acs-doculyra-dev.australia.communication.azure.com'
param emailFromAddress = 'DoNotReply@9900614b-2e01-4d86-93aa-379c583ada57.azurecomm.net'
param monthlyBudgetAud = 25
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
