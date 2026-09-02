using '../main.bicep'

param environment = 'prod'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = false
param externalIdentityAdapterActivated = false
param externalIdentityProviderAllowList = []
param externalIdentityClientSecretConfigured = false
param monthlyBudgetAud = 500
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
