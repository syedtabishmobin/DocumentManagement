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
// GitHub's OIDC subject includes immutable account/repository IDs so a rename or
// transfer cannot silently inherit this Azure trust relationship.
param githubRepository string = 'syedtabishmobin@212241246/DocumentManagement@1347196921'
param deployApplications bool = false
param apiImage string = ''
param webImage string = ''
// Public provider identifiers and secret-presence markers are safe deployment
// metadata. Secret values remain in Key Vault and are not bound to the app until
// the corresponding adapter passes its activation gate.
param configureProviderRegistrations bool = false
param microsoftClientId string = ''
param microsoftTenantId string = ''
param microsoftClientSecretConfigured bool = false
param googleClientId string = ''
param googleClientSecretConfigured bool = false
param dropboxAppKey string = ''
param dropboxAppSecretConfigured bool = false
param boxClientId string = ''
param boxClientSecretConfigured bool = false
// Entra External ID is the browser-delegated customer identity broker selected
// by ADR-ARCH-007. These values are non-secret deployment metadata. Activation
// remains a separate fail-closed gate and is permitted only in synthetic DEV.
param externalIdentityAdapterActivated bool = false
param externalIdentityAuthority string = ''
param externalIdentityTenantId string = ''
param externalIdentityClientId string = ''
param externalIdentityCallbackUrl string = ''
param externalIdentityProviderAllowList array = []
param externalIdentityClientSecretName string = ''
param externalIdentityClientSecretConfigured bool = false
param azureCommunicationServiceName string = ''
param azureCommunicationEndpoint string = ''
param emailFromAddress string = ''
// Existing environments may have an approved role assignment created before
// this template managed notification infrastructure. Supplying its immutable
// assignment name adopts it without a delete/recreate permission gap.
param acsEmailRoleAssignmentName string = ''
param configureNotificationAdapterInfrastructure bool = false
// Activation is independent from resource configuration. Enable only after the
// exact sender, recipient route, identity, diagnostics and delivery suite pass.
param notificationAdapterActivated bool = false
param monthlyBudgetAud int = environment == 'dev' ? 25 : environment == 'stage' ? 75 : 500
param alertEmail string = ''
param budgetStartDate string = utcNow('yyyy-MM-dd')

var suffix = toLower(uniqueString(subscription().id, environment, resourcePrefix))
var resourceGroupName = 'rg-${resourcePrefix}-${environment}-aue'
var supportedExternalIdentityProviders = [
  'apple'
  'google'
  'microsoft'
]
var invalidExternalIdentityProviders = filter(externalIdentityProviderAllowList, provider => !contains(supportedExternalIdentityProviders, provider))
var externalIdentityConfigurationAbsent = empty(externalIdentityAuthority)
  && empty(externalIdentityTenantId)
  && empty(externalIdentityClientId)
  && empty(externalIdentityCallbackUrl)
  && empty(externalIdentityProviderAllowList)
  && empty(externalIdentityClientSecretName)
  && !externalIdentityClientSecretConfigured
var externalIdentityBrokerConfigurationComplete = !empty(externalIdentityAuthority)
  && !empty(externalIdentityTenantId)
  && !empty(externalIdentityClientId)
  && !empty(externalIdentityCallbackUrl)
  && !empty(externalIdentityClientSecretName)
  && externalIdentityClientSecretConfigured
var externalIdentityActivationComplete = externalIdentityBrokerConfigurationComplete && !empty(externalIdentityProviderAllowList)

assert externalIdentityProviderAllowListValid = empty(invalidExternalIdentityProviders)
assert externalIdentityProviderAllowListUnique = length(union(externalIdentityProviderAllowList, externalIdentityProviderAllowList)) == length(externalIdentityProviderAllowList)
assert externalIdentityAuthorityIsTlsCiam = empty(externalIdentityAuthority) || (startsWith(externalIdentityAuthority, 'https://') && contains(externalIdentityAuthority, '.ciamlogin.com/'))
assert externalIdentityAuthorityMatchesTenant = empty(externalIdentityAuthority) || (!empty(externalIdentityTenantId) && contains(externalIdentityAuthority, externalIdentityTenantId))
assert externalIdentityCallbackIsTls = empty(externalIdentityCallbackUrl) || (startsWith(externalIdentityCallbackUrl, 'https://') && endsWith(externalIdentityCallbackUrl, '/api/auth/external/callback'))
assert externalIdentitySecretNameIsVaultRelative = empty(externalIdentityClientSecretName) || (!contains(externalIdentityClientSecretName, '/') && !contains(externalIdentityClientSecretName, '://'))
assert externalIdentityConfigurationIsWhole = externalIdentityConfigurationAbsent || externalIdentityBrokerConfigurationComplete
assert externalIdentityActivationIsDevOnly = !externalIdentityAdapterActivated || environment == 'dev'
assert externalIdentityActivationIsComplete = !externalIdentityAdapterActivated || externalIdentityActivationComplete
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
    githubRepository: githubRepository
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
    syntheticPreviewShareName: foundation.outputs.syntheticPreviewShareName
    keyVaultName: foundation.outputs.keyVaultName
    configureProviderRegistrations: configureProviderRegistrations
    microsoftClientId: microsoftClientId
    microsoftTenantId: microsoftTenantId
    microsoftClientSecretConfigured: microsoftClientSecretConfigured
    googleClientId: googleClientId
    googleClientSecretConfigured: googleClientSecretConfigured
    dropboxAppKey: dropboxAppKey
    dropboxAppSecretConfigured: dropboxAppSecretConfigured
    boxClientId: boxClientId
    boxClientSecretConfigured: boxClientSecretConfigured
    externalIdentityAdapterActivated: externalIdentityAdapterActivated
    externalIdentityAuthority: externalIdentityAuthority
    externalIdentityTenantId: externalIdentityTenantId
    externalIdentityClientId: externalIdentityClientId
    externalIdentityCallbackUrl: externalIdentityCallbackUrl
    externalIdentityProviderAllowList: externalIdentityProviderAllowList
    externalIdentityClientSecretName: externalIdentityClientSecretName
    externalIdentityClientSecretConfigured: externalIdentityClientSecretConfigured
    azureCommunicationServiceName: azureCommunicationServiceName
    azureCommunicationEndpoint: azureCommunicationEndpoint
    emailFromAddress: emailFromAddress
    acsEmailRoleAssignmentName: acsEmailRoleAssignmentName
    configureNotificationAdapterInfrastructure: configureNotificationAdapterInfrastructure
    notificationAdapterActivated: notificationAdapterActivated
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
output ciClientId string = foundation.outputs.ciClientId
output providerRegistrationMetadataConfigured bool = configureProviderRegistrations
output externalIdentityActivated bool = externalIdentityAdapterActivated
output externalIdentityConfiguredProviders array = externalIdentityProviderAllowList
output externalIdentitySecretPresenceDeclared bool = externalIdentityClientSecretConfigured
output notificationAdapterInfrastructureConfigured bool = configureNotificationAdapterInfrastructure
