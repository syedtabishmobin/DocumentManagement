import { describe, expect, it, vi } from "vitest";
import { LogsQueryResultStatus } from "@azure/monitor-query-logs";
import { AcsEmailTransport, validateDispatchPlan, validateTransportConfiguration, type EmailSender, type LogsReader, type NotificationDispatchPlan, type TransportConfiguration } from "./notification-email.transport.js";

const recipient = "authority@example.test";
const configuration: TransportConfiguration = {
  endpoint: "https://acs-doculyra-test.australia.communication.azure.com",
  senderAddress: "DoNotReply@example.test",
  allowedRecipients: { to: [recipient], cc: [] },
  workspaceId: "11111111-1111-4111-8111-111111111111",
  credentialMode: "MANAGED_IDENTITY",
  managedIdentityClientId: "22222222-2222-4222-8222-222222222222",
  maxProviderRetries: 2,
  pollIntervalMs: 1_000,
};
const plan: NotificationDispatchPlan = {
  schemaVersion: "1.0.0",
  eventKey: "decision:dec-test:first-blocking-notification",
  eventType: "BLOCKING_DECISION",
  providerOperationId: "33333333-3333-4333-8333-333333333333",
  subject: "[Doculyra][ACTION REQUIRED][DEC-TEST] Synthetic test",
  plainText: "Synthetic decision notification.",
  recipients: { to: [recipient], cc: [] },
};

function sender(result = { id: plan.providerOperationId, status: "Succeeded" }): EmailSender {
  return { beginSend: vi.fn(async () => ({ pollUntilDone: async () => result })) };
}

function logs(rows: (string | number | boolean | Record<string, unknown> | Date)[][] = []): LogsReader {
  return {
    queryWorkspace: vi.fn(async () => ({
      status: LogsQueryResultStatus.Success as LogsQueryResultStatus.Success,
      tables: [{
        name: "PrimaryResult",
        columnDescriptors: [{ name: "DeliveryStatus", type: "string" as const }, { name: "TimeGenerated", type: "datetime" as const }, { name: "IsHardBounce", type: "bool" as const }],
        rows,
      }],
    })),
  };
}

describe("ACS Email transport", () => {
  it("rejects credentials in endpoints, broad retry and duplicate recipients", () => {
    expect(() => validateTransportConfiguration({ ...configuration, endpoint: "https://user:secret@acs-doculyra-test.australia.communication.azure.com" })).toThrow("credential-free");
    expect(() => validateTransportConfiguration({ ...configuration, endpoint: "https://acs-doculyra-test.australia.communication.azure.com/path" })).toThrow("credential-free");
    expect(() => validateTransportConfiguration({ ...configuration, maxProviderRetries: 3 })).toThrow("bounded");
    expect(() => validateTransportConfiguration({ ...configuration, allowedRecipients: { to: [recipient], cc: [recipient] } })).toThrow("duplicate");
    expect(() => validateTransportConfiguration({ ...configuration, credentialMode: "UNSAFE" as TransportConfiguration["credentialMode"] })).toThrow("unsupported credential");
  });

  it("accepts only a canonical ACS HTTPS origin without an explicit port", () => {
    expect(() => validateTransportConfiguration(configuration)).not.toThrow();
    for (const endpoint of [
      "https://acs-doculyra-test.australia.communication.azure.com:443",
      "https://acs-doculyra-test.australia.communication.azure.com:444",
      "https://acs-doculyra-test.australia.communication.azure.com/path",
      "https://acs-doculyra-test.australia.communication.azure.com?token=synthetic",
      "http://acs-doculyra-test.australia.communication.azure.com",
    ]) {
      expect(() => validateTransportConfiguration({ ...configuration, endpoint })).toThrow("credential-free");
    }
  });

  it("rejects a plan whose recipients differ from the allow-list", () => {
    expect(() => validateDispatchPlan({ ...plan, recipients: { to: ["other@example.test"], cc: [] } }, configuration)).toThrow("outside the configured allow-list");
  });

  it("submits one plain-text message with engagement tracking disabled and a stable operation id", async () => {
    const emailClient = sender();
    const transport = new AcsEmailTransport(configuration, emailClient, logs());
    await expect(transport.submit(plan)).resolves.toEqual({ status: "SUBMITTED", providerMessageId: plan.providerOperationId, providerStatus: "Succeeded" });
    expect(emailClient.beginSend).toHaveBeenCalledTimes(1);
    expect(emailClient.beginSend).toHaveBeenCalledWith(expect.objectContaining({
      disableUserEngagementTracking: true,
      recipients: { to: [{ address: recipient }] },
    }), { operationId: plan.providerOperationId, updateIntervalInMs: 1_000 });
  });

  it("does not convert an ACS long-running-operation failure into submission success", async () => {
    const transport = new AcsEmailTransport(configuration, sender({ id: plan.providerOperationId, status: "Failed" }), logs());
    await expect(transport.submit(plan)).rejects.toThrow("did not succeed");
  });

  it("reports pending until a terminal recipient status exists", async () => {
    const transport = new AcsEmailTransport(configuration, sender(), logs());
    await expect(transport.queryDelivery(plan.providerOperationId)).resolves.toEqual({ status: "PENDING", providerMessageId: plan.providerOperationId });
  });

  it("distinguishes delivered from bounced terminal evidence", async () => {
    const delivered = new AcsEmailTransport(configuration, sender(), logs([["Delivered", "2026-08-29T12:00:00Z", false]]));
    await expect(delivered.queryDelivery(plan.providerOperationId)).resolves.toMatchObject({ status: "DELIVERED", deliveryStatus: "Delivered", hardBounce: false });
    const bounced = new AcsEmailTransport(configuration, sender(), logs([["Bounced", "2026-08-29T12:01:00Z", true]]));
    await expect(bounced.queryDelivery(plan.providerOperationId)).resolves.toMatchObject({ status: "FAILED", deliveryStatus: "Bounced", hardBounce: true });
  });
});
