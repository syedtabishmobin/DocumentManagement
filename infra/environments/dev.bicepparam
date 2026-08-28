using '../main.bicep'

param environment = 'dev'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = true
param apiImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-api:dev-a9b5b5cad10d2a21afd95902058cbe816f06e723'
param webImage = 'crdoculyradevgpdxvjimpdtji.azurecr.io/doculyra-web:dev-a9b5b5cad10d2a21afd95902058cbe816f06e723'
param monthlyBudgetAud = 25
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
