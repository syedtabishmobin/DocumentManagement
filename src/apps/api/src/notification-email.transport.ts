import { EmailClient, KnownEmailSendStatus, type EmailMessage, type EmailSendResult } from "@azure/communication-email";
import { AzureCliCredential, ManagedIdentityCredential, type TokenCredential } from "@azure/identity";
import { LogsQueryClient, LogsQueryResultStatus, type LogsQueryResult } from "@azure/monitor-query-logs";

export const TERMINAL_DELIVERY_STATUSES = ["Delivered", "Bounced", "Quarantined", "FilteredSpam", "Suppressed", "Failed"] as const;

type TerminalDeliveryStatus = (typeof TERMINAL_DELIVERY_STATUSES)[number];

export interface NotificationDispatchPlan {
  schemaVersion: "1.0.0";
  eventKey: string;
  eventType: "BLOCKING_DECISION" | "UAT_READY";
  providerOperationId: string;
  subject: string;
  plainText: string;
  recipients: { to: string[]; cc: string[] };
}

export interface TransportConfiguration {
  endpoint: string;
  senderAddress: string;
  allowedRecipients: { to: string[]; cc: string[] };
  workspaceId: string;
  credentialMode: "MANAGED_IDENTITY" | "AZURE_CLI";
  managedIdentityClientId?: string;
  maxProviderRetries: number;
  pollIntervalMs: number;
}

interface EmailPoller {
  pollUntilDone(): Promise<EmailSendResult>;
}

export interface EmailSender {
  beginSend(message: EmailMessage, options: { operationId: string; updateIntervalInMs: number }): Promise<EmailPoller>;
}

export interface LogsReader {
  queryWorkspace(workspaceId: string, query: string, timespan: { duration: string }, options: { serverTimeoutInSeconds: number }): Promise<LogsQueryResult>;
}

export interface SubmissionResult {
  status: "SUBMITTED";
  providerMessageId: string;
  providerStatus: string;
}

export interface DeliveryResult {
  status: "DELIVERED" | "FAILED" | "PENDING";
  providerMessageId: string;
  deliveryStatus?: TerminalDeliveryStatus;
  observedAt?: string;
  hardBounce?: boolean;
}

function normalized(address: string): string {
  return address.trim().toLowerCase();
}

function validAddress(address: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) && address.length <= 254;
}

function sameAddresses(actual: string[], expected: string[]): boolean {
  const left = actual.map(normalized).sort();
  const right = expected.map(normalized).sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${label} must be a UUID`);
  }
}

export function validateTransportConfiguration(configuration: TransportConfiguration): void {
  let endpoint: URL;
  try {
    endpoint = new URL(configuration.endpoint);
  } catch {
    throw new Error("ACS endpoint must be a valid URL");
  }
  // Compare the raw value with the normalized origin as well as checking the
  // parsed port. URL normalization erases an explicit default :443, while a
  // nonstandard port survives in origin; both forms are forbidden.
  if (configuration.endpoint !== endpoint.origin || endpoint.port || endpoint.protocol !== "https:" || !endpoint.hostname.endsWith(".communication.azure.com") || endpoint.pathname !== "/" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("ACS endpoint must be a credential-free Azure Communication Services HTTPS endpoint");
  }
  if (!validAddress(configuration.senderAddress)) throw new Error("ACS sender address is invalid");
  const allRecipients = [...configuration.allowedRecipients.to, ...configuration.allowedRecipients.cc].map(normalized);
  if (configuration.allowedRecipients.to.length !== 1 || new Set(allRecipients).size !== allRecipients.length || allRecipients.some((address) => !validAddress(address))) {
    throw new Error("recipient allow-list must contain one To recipient with no duplicate To/CC entries");
  }
  assertUuid(configuration.workspaceId, "Log Analytics workspace ID");
  if (configuration.credentialMode !== "MANAGED_IDENTITY" && configuration.credentialMode !== "AZURE_CLI") throw new Error("unsupported credential mode");
  if (!Number.isInteger(configuration.maxProviderRetries) || configuration.maxProviderRetries < 0 || configuration.maxProviderRetries > 2) {
    throw new Error("provider retry count must be bounded between zero and two");
  }
  if (!Number.isInteger(configuration.pollIntervalMs) || configuration.pollIntervalMs < 1_000 || configuration.pollIntervalMs > 30_000) {
    throw new Error("provider poll interval must be between 1 and 30 seconds");
  }
  if (configuration.credentialMode === "MANAGED_IDENTITY" && !configuration.managedIdentityClientId) {
    throw new Error("user-assigned managed identity client ID is required");
  }
}

export function validateDispatchPlan(plan: NotificationDispatchPlan, configuration: TransportConfiguration): void {
  validateTransportConfiguration(configuration);
  assertUuid(plan.providerOperationId, "providerOperationId");
  if (plan.schemaVersion !== "1.0.0" || !plan.eventKey || !plan.subject || !plan.plainText) throw new Error("notification dispatch plan is incomplete");
  if (plan.plainText.length > 20_000 || plan.subject.length > 200) throw new Error("notification content exceeds the minimized size limit");
  if (!sameAddresses(plan.recipients.to, configuration.allowedRecipients.to) || !sameAddresses(plan.recipients.cc, configuration.allowedRecipients.cc)) {
    throw new Error("notification recipients are outside the configured allow-list");
  }
}

function credential(configuration: TransportConfiguration): TokenCredential {
  if (configuration.credentialMode === "MANAGED_IDENTITY") return new ManagedIdentityCredential(configuration.managedIdentityClientId!);
  if ((process.env.DM_PROFILE ?? "local") !== "agent-local" || process.env.DM_NOTIFICATION_ALLOW_AZURE_CLI_CREDENTIAL !== "enabled") {
    throw new Error("Azure CLI credential is restricted to an explicitly enabled agent-local conformance run");
  }
  return new AzureCliCredential();
}

export function createAcsEmailTransport(configuration: TransportConfiguration): AcsEmailTransport {
  validateTransportConfiguration(configuration);
  const tokenCredential = credential(configuration);
  return new AcsEmailTransport(
    configuration,
    new EmailClient(configuration.endpoint, tokenCredential, { retryOptions: { maxRetries: configuration.maxProviderRetries } }),
    new LogsQueryClient(tokenCredential),
  );
}

export class AcsEmailTransport {
  constructor(
    private readonly configuration: TransportConfiguration,
    private readonly emailClient: EmailSender,
    private readonly logsClient: LogsReader,
  ) {
    validateTransportConfiguration(configuration);
  }

  async submit(plan: NotificationDispatchPlan): Promise<SubmissionResult> {
    validateDispatchPlan(plan, this.configuration);
    const poller = await this.emailClient.beginSend({
      senderAddress: this.configuration.senderAddress,
      content: { subject: plan.subject, plainText: plan.plainText },
      recipients: {
        to: plan.recipients.to.map((address) => ({ address })),
        ...(plan.recipients.cc.length ? { cc: plan.recipients.cc.map((address) => ({ address })) } : {}),
      },
      disableUserEngagementTracking: true,
    }, { operationId: plan.providerOperationId, updateIntervalInMs: this.configuration.pollIntervalMs });
    const result = await poller.pollUntilDone();
    if (result.status !== KnownEmailSendStatus.Succeeded) {
      throw new Error(`ACS submission did not succeed (${result.error?.code ?? result.status})`);
    }
    assertUuid(result.id, "ACS provider message ID");
    return { status: "SUBMITTED", providerMessageId: result.id, providerStatus: result.status };
  }

  async queryDelivery(providerMessageId: string): Promise<DeliveryResult> {
    assertUuid(providerMessageId, "providerMessageId");
    const recipient = normalized(this.configuration.allowedRecipients.to[0]!);
    const query = [
      "ACSEmailStatusUpdateOperational",
      `| where CorrelationId == \"${providerMessageId}\"`,
      `| where tolower(RecipientId) == \"${recipient}\"`,
      `| where DeliveryStatus in (${TERMINAL_DELIVERY_STATUSES.map((status) => `\"${status}\"`).join(", ")})`,
      "| top 1 by TimeGenerated desc",
      "| project DeliveryStatus, TimeGenerated, IsHardBounce",
    ].join("\n");
    const result = await this.logsClient.queryWorkspace(this.configuration.workspaceId, query, { duration: "P1D" }, { serverTimeoutInSeconds: 30 });
    if (result.status !== LogsQueryResultStatus.Success) throw new Error("Azure Monitor delivery query was only partially successful");
    const table = result.tables[0];
    const row = table?.rows[0];
    if (!table || !row) return { status: "PENDING", providerMessageId };
    const columns = new Map(table.columnDescriptors.map((column, index) => [column.name, index]));
    const deliveryStatus = String(row[columns.get("DeliveryStatus") ?? -1] ?? "") as TerminalDeliveryStatus;
    if (!TERMINAL_DELIVERY_STATUSES.includes(deliveryStatus)) throw new Error("Azure Monitor returned an unsupported delivery status");
    const observed = row[columns.get("TimeGenerated") ?? -1];
    const hardBounce = row[columns.get("IsHardBounce") ?? -1];
    return {
      status: deliveryStatus === "Delivered" ? "DELIVERED" : "FAILED",
      providerMessageId,
      deliveryStatus,
      ...(observed ? { observedAt: observed instanceof Date ? observed.toISOString() : String(observed) } : {}),
      ...(typeof hardBounce === "boolean" ? { hardBounce } : {}),
    };
  }
}
