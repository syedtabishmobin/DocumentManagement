using '../main.bicep'

param environment = 'dev'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = false
param monthlyBudgetAud = 25
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
