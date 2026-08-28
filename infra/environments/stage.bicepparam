using '../main.bicep'

param environment = 'stage'
param location = 'australiaeast'
param pairedLocation = 'australiasoutheast'
param deployApplications = false
param monthlyBudgetAud = 75
param alertEmail = readEnvironmentVariable('DOCULYRA_BUDGET_EMAIL', '')
param budgetStartDate = '2026-08-01'
