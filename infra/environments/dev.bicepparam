using '../main.bicep'

param environment = 'dev'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = true
param apiImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-api:dev-b972b0265d84e35afdf268b31c2006ad95664050'
param webImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-web:dev-b972b0265d84e35afdf268b31c2006ad95664050'
param monthlyBudgetAud = 25
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
