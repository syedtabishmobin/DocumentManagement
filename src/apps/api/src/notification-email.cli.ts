import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createAcsEmailTransport, validateDispatchPlan, type NotificationDispatchPlan, type TransportConfiguration } from "./notification-email.transport.js";

interface Contacts {
  routing: { resolved: { to: string[]; cc: string[] } };
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as T;
}

function configuration(contacts: Contacts): TransportConfiguration {
  const credentialMode = (process.env.DM_NOTIFICATION_CREDENTIAL_MODE ?? "MANAGED_IDENTITY") as TransportConfiguration["credentialMode"];
  if (credentialMode !== "MANAGED_IDENTITY" && credentialMode !== "AZURE_CLI") throw new Error("DM_NOTIFICATION_CREDENTIAL_MODE must be MANAGED_IDENTITY or AZURE_CLI");
  return {
    endpoint: required(process.env.DM_AZURE_COMMUNICATION_ENDPOINT, "DM_AZURE_COMMUNICATION_ENDPOINT"),
    senderAddress: required(process.env.DM_EMAIL_FROM, "DM_EMAIL_FROM"),
    allowedRecipients: contacts.routing.resolved,
    workspaceId: required(process.env.DM_LOG_ANALYTICS_WORKSPACE_ID, "DM_LOG_ANALYTICS_WORKSPACE_ID"),
    credentialMode,
    ...(process.env.AZURE_CLIENT_ID ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID } : {}),
    maxProviderRetries: Number(process.env.DM_NOTIFICATION_PROVIDER_RETRIES ?? "2"),
    pollIntervalMs: Number(process.env.DM_NOTIFICATION_POLL_INTERVAL_MS ?? "5000"),
  };
}

async function run(): Promise<void> {
  const command = process.argv[2];
  const contacts = await json<Contacts>(argument("--contacts") ?? ".agents/config/contacts.json");
  const transportConfiguration = configuration(contacts);
  const planPath = argument("--plan");
  const plan = planPath ? await json<NotificationDispatchPlan>(planPath) : undefined;
  if (command === "validate") {
    if (!plan) throw new Error("--plan is required");
    validateDispatchPlan(plan, transportConfiguration);
    process.stdout.write(`${JSON.stringify({ status: "CONFIG_VALID", credentialMode: transportConfiguration.credentialMode, recipientCount: plan.recipients.to.length + plan.recipients.cc.length })}\n`);
    return;
  }
  if (process.env.DM_EXTERNAL_NOTIFICATIONS !== "enabled") throw new Error("DM_EXTERNAL_NOTIFICATIONS must be enabled for provider operations");
  const transport = createAcsEmailTransport(transportConfiguration);
  if (command === "submit") {
    if (!plan) throw new Error("--plan is required");
    process.stdout.write(`${JSON.stringify(await transport.submit(plan))}\n`);
    return;
  }
  if (command === "delivery") {
    const providerMessageId = required(argument("--provider-message-id"), "--provider-message-id");
    process.stdout.write(`${JSON.stringify(await transport.queryDelivery(providerMessageId))}\n`);
    return;
  }
  throw new Error("Usage: notification-email.cli.js <validate|submit|delivery> [--plan path] [--provider-message-id UUID] [--contacts path]");
}

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Notification transport failed"}\n`);
  process.exitCode = 1;
});
