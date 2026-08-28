targetScope = 'subscription'

@allowed([
  'dev'
  'stage'
  'prod'
])
param environment string

param location string = 'australiaeast'
param pairedLocation string = 'australiasoutheast'
@minLength(5)
param resourcePrefix string = 'doculyra'
param deployApplications bool = false
param apiImage string = ''
param webImage string = ''
param monthlyBudgetAud int = environment == 'dev' ? 25 : environment == 'stage' ? 75 : 500
param alertEmail string = ''
param budgetStartDate string = utcNow('yyyy-MM-dd')

var suffix = toLower(uniqueString(subscription().id, environment, resourcePrefix))
var resourceGroupName = 'rg-${resourcePrefix}-${environment}-aue'
var commonTags = {
  product: 'Doculyra'
  environment: environment
  managedBy: 'Bicep'
  dataResidency: 'Australia'
  customerData: environment == 'prod' ? 'production-gated' : 'synthetic-only'
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: commonTags
}

module foundation './modules/foundation.bicep' = {
  name: 'foundation-${environment}'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    pairedLocation: pairedLocation
    resourcePrefix: resourcePrefix
    suffix: suffix
    tags: commonTags
  }
}

module applications './modules/applications.bicep' = if (deployApplications) {
  name: 'applications-${environment}'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    resourcePrefix: resourcePrefix
    apiImage: apiImage
    webImage: webImage
    logAnalyticsName: foundation.outputs.logAnalyticsName
    registryName: foundation.outputs.registryName
    ciphertextStorageName: foundation.outputs.ciphertextStorageName
    keyVaultName: foundation.outputs.keyVaultName
    tags: commonTags
  }
}

resource budget 'Microsoft.Consumption/budgets@2023-11-01' = if (!empty(alertEmail)) {
  name: '${resourcePrefix}-${environment}-monthly'
  properties: {
    amount: monthlyBudgetAud
    category: 'Cost'
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: '${budgetStartDate}T00:00:00Z'
      endDate: '2036-12-31T00:00:00Z'
    }
    notifications: {
      actual80: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        thresholdType: 'Actual'
        contactEmails: [alertEmail]
      }
      forecast100: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Forecasted'
        contactEmails: [alertEmail]
      }
    }
    filter: {
      dimensions: {
        name: 'ResourceGroupName'
        operator: 'In'
        values: [resourceGroupName]
      }
    }
  }
}

output environmentName string = environment
output resourceGroup string = resourceGroup.name
output applicationsDeployed bool = deployApplications
output apiUrl string = deployApplications ? applications!.outputs.apiUrl : ''
output webUrl string = deployApplications ? applications!.outputs.webUrl : ''
output customerDataPolicy string = commonTags.customerData
