param environment string
param location string
param resourcePrefix string
param apiImage string
param webImage string
param logAnalyticsName string
param registryName string
param ciphertextStorageName string
param syntheticPreviewShareName string
param keyVaultName string
param configureProviderRegistrations bool
param microsoftClientId string
param microsoftTenantId string
param microsoftClientSecretConfigured bool
param googleClientId string
param googleClientSecretConfigured bool
param dropboxAppKey string
param dropboxAppSecretConfigured bool
param boxClientId string
param boxClientSecretConfigured bool
param azureCommunicationServiceName string
param azureCommunicationEndpoint string
param emailFromAddress string
param tags object

var webAppName = 'ca-${resourcePrefix}-${environment}-web'
var publicBaseUrl = 'https://${webAppName}.${managedEnvironment.properties.defaultDomain}'
var providerRegistrationEnvironment = configureProviderRegistrations ? [
  { name: 'DM_PUBLIC_BASE_URL', value: publicBaseUrl }
  { name: 'DM_GOOGLE_CLIENT_ID', value: googleClientId }
  { name: 'DM_GOOGLE_CLIENT_SECRET_CONFIGURED', value: string(googleClientSecretConfigured) }
  { name: 'DM_MICROSOFT_CLIENT_ID', value: microsoftClientId }
  { name: 'DM_MICROSOFT_TENANT', value: microsoftTenantId }
  { name: 'DM_MICROSOFT_CLIENT_SECRET_CONFIGURED', value: string(microsoftClientSecretConfigured) }
  { name: 'DM_DROPBOX_APP_KEY', value: dropboxAppKey }
  { name: 'DM_DROPBOX_APP_SECRET_CONFIGURED', value: string(dropboxAppSecretConfigured) }
  { name: 'DM_BOX_CLIENT_ID', value: boxClientId }
  { name: 'DM_BOX_CLIENT_SECRET_CONFIGURED', value: string(boxClientSecretConfigured) }
  { name: 'DM_AZURE_COMMUNICATION_SERVICE', value: azureCommunicationServiceName }
  { name: 'DM_AZURE_COMMUNICATION_ENDPOINT', value: azureCommunicationEndpoint }
  { name: 'DM_EMAIL_FROM', value: emailFromAddress }
] : []

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsName
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: registryName
}

resource ciphertextStorage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: ciphertextStorageName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource runtimeIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${resourcePrefix}-${environment}-runtime'
  location: location
  tags: tags
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, runtimeIdentity.id, 'AcrPull')
  scope: registry
  properties: {
    principalId: runtimeIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  }
}

resource blobContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(ciphertextStorage.id, runtimeIdentity.id, 'StorageBlobDataContributor')
  scope: ciphertextStorage
  properties: {
    principalId: runtimeIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  }
}

resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, runtimeIdentity.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    principalId: runtimeIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
  }
}

resource managedEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-${resourcePrefix}-${environment}-aue'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
    zoneRedundant: environment == 'prod'
  }
}

resource syntheticPreviewStorage 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: managedEnvironment
  name: 'synthetic-preview'
  properties: {
    azureFile: {
      accountName: ciphertextStorage.name
      accountKey: ciphertextStorage.listKeys().keys[0].value
      shareName: syntheticPreviewShareName
      accessMode: 'ReadWrite'
    }
  }
}

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'ca-${resourcePrefix}-${environment}-api'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${runtimeIdentity.id}': {}
    }
  }
  properties: {
    environmentId: managedEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: '${registryName}.azurecr.io'
          identity: runtimeIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: apiImage
          env: concat([
            { name: 'DM_PROFILE', value: environment }
            { name: 'DM_API_PORT', value: '3000' }
            { name: 'DM_BIND_HOST', value: '0.0.0.0' }
            { name: 'DM_DATA_DIR', value: '/data' }
            { name: 'DM_OUTBOUND_NETWORK', value: 'deny' }
            { name: 'DM_EXTERNAL_CONNECTORS', value: 'disabled' }
            { name: 'DM_CONNECTOR_ADAPTERS_READY', value: 'false' }
            { name: 'DM_EXTERNAL_NOTIFICATIONS', value: 'disabled' }
            { name: 'DM_AZURE_STORAGE_ACCOUNT', value: ciphertextStorageName }
            { name: 'DM_AZURE_KEY_VAULT', value: keyVaultName }
            { name: 'DM_CUSTOMER_DATA_POLICY', value: environment == 'prod' ? 'production-gated' : 'synthetic-only' }
          ], providerRegistrationEnvironment)
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          volumeMounts: [
            {
              volumeName: 'synthetic-preview-data'
              mountPath: '/data'
            }
          ]
        }
      ]
      scale: {
        minReplicas: environment == 'prod' ? 1 : 0
        maxReplicas: environment == 'prod' ? 10 : 2
      }
      volumes: [
        {
          name: 'synthetic-preview-data'
          storageName: syntheticPreviewStorage.name
          storageType: 'AzureFile'
        }
      ]
    }
  }
  dependsOn: [acrPull, blobContributor, keyVaultSecretsUser]
}

resource web 'Microsoft.App/containerApps@2024-03-01' = {
  name: webAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${runtimeIdentity.id}': {}
    }
  }
  properties: {
    environmentId: managedEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: '${registryName}.azurecr.io'
          identity: runtimeIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: webImage
          env: [
            { name: 'DOCULYRA_API_ORIGIN', value: 'https://${api.properties.configuration.ingress.fqdn}' }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: environment == 'prod' ? 1 : 0
        maxReplicas: environment == 'prod' ? 6 : 2
      }
    }
  }
  dependsOn: [acrPull]
}

output apiUrl string = 'https://${api.properties.configuration.ingress.fqdn}'
output webUrl string = 'https://${web.properties.configuration.ingress.fqdn}'
