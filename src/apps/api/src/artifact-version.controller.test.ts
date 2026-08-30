import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("immutable document version and artifact redemption HTTP boundary", () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "doculyra-artifact-controller-")); process.env.DM_DATA_DIR = directory; });
  afterEach(async () => { await rm(directory, { recursive: true }); delete process.env.DM_DATA_DIR; });

  it("implements API-P1-122 through 128 document and artifact boundaries without permanent byte URLs", async () => {
    const app = await NestFactory.create(AppModule, { logger: false }); app.setGlobalPrefix("api"); await app.listen(0, "127.0.0.1");
    try {
      const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`; const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ displayName: "Artifact Synthetic Owner", email: "artifact-owner@example.test", password: "synthetic-password" }) });
      const identity = await registration.json() as { account: { id: string } }; const firstCookie = registration.headers.get("set-cookie")!.split(";")[0]!; const firstCsrf = registration.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: origin, Cookie: firstCookie, "X-CSRF-Token": firstCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-artifact-workspace", "Idempotency-Key": "artifact-workspace-0001" }, body: JSON.stringify({ name: "Artifact synthetic household", type: "FAMILY" }) });
      const workspace = await workspaceResponse.json() as { id: string }; const cookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!; const csrf = workspaceResponse.headers.get("x-csrf-token")!;
      const headers = (key: string): Record<string, string> => ({ "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-CSRF-Token": csrf, "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`, "Idempotency-Key": key });
      const expectContractHeaders = (response: Response) => { expect(response.headers.get("x-correlation-id")).toMatch(/^corr-/); expect(response.headers.get("etag")).toBeTruthy(); expect(response.headers.get("ratelimit-policy")).toBeTruthy(); };
      const dashboard = await (await fetch(`${base}/dashboard`, { headers: headers("artifact-dashboard") })).json() as { subjects: Array<{ id: string }> };
      const upload = async (key: string, name: string) => { const body = new FormData(); body.set("file", new Blob(["Synthetic exact artifact bytes"], { type: "text/plain" }), name); body.set("subjectIds", dashboard.subjects[0]!.id); body.set("syntheticConfirmed", "true"); return fetch(`${base}/documents`, { method: "POST", headers: Object.fromEntries(Object.entries(headers(key)).filter(([header]) => header !== "Content-Type")), body }); };
      const first = await (await upload("artifact-upload-0001", "first.txt")).json() as { id: string };
      const second = await (await upload("artifact-upload-0002", "second.txt")).json() as { id: string };
      expect(second.id).not.toBe(first.id);

      const documentsUrl = `${base}/v1/workspaces/${workspace.id}/documents`;
      const collection = await fetch(documentsUrl, { headers: headers("artifact-documents") }); expect(collection.status).toBe(200); expectContractHeaders(collection);
      const documents = await collection.json() as { items: Array<{ document_id: string; current_version_id: string }> }; expect(documents.items).toHaveLength(2);
      const currentVersionId = documents.items.find((item) => item.document_id === first.id)!.current_version_id;
      const documentResponse = await fetch(`${documentsUrl}/${first.id}`, { headers: headers("artifact-document") }); expect(documentResponse.status).toBe(200); expectContractHeaders(documentResponse); expect(await documentResponse.json()).toMatchObject({ document_id: first.id, current_version_id: currentVersionId });
      const versionsResponse = await fetch(`${documentsUrl}/${first.id}/versions`, { headers: headers("artifact-versions") }); expect(versionsResponse.status).toBe(200); expectContractHeaders(versionsResponse);
      const versions = await versionsResponse.json() as { items: Array<{ document_version_id: string; artifact_id: string }> }; expect(versions.items).toHaveLength(1); expect(versions.items[0]!.document_version_id).toBe(currentVersionId);
      const exactResponse = await fetch(`${documentsUrl}/${first.id}/versions/${currentVersionId}`, { headers: headers("artifact-version") }); expect(exactResponse.status).toBe(200); expectContractHeaders(exactResponse); expect(await exactResponse.json()).toMatchObject({ document_id: first.id, document_version_id: currentVersionId, artifact_id: versions.items[0]!.artifact_id });

      const lifecycleResponse = await fetch(`${documentsUrl}/${first.id}/lifecycle-transitions`, { method: "POST", headers: { ...headers("artifact-lifecycle-0001"), "If-Match": '"1"' }, body: JSON.stringify({ transition: "ARCHIVE", reason_code: "USER_ORGANIZATION" }) });
      expect(lifecycleResponse.status).toBe(200); expectContractHeaders(lifecycleResponse); expect(await lifecycleResponse.json()).toMatchObject({ document_id: first.id, availability_state: "Archived", revision: 2 });
      const lifecycleReplay = await fetch(`${documentsUrl}/${first.id}/lifecycle-transitions`, { method: "POST", headers: { ...headers("artifact-lifecycle-0001"), "If-Match": '"1"' }, body: JSON.stringify({ transition: "ARCHIVE", reason_code: "USER_ORGANIZATION" }) });
      expect(lifecycleReplay.status).toBe(200); expectContractHeaders(lifecycleReplay); expect(await lifecycleReplay.json()).toMatchObject({ document_id: first.id, availability_state: "Archived", revision: 2 });
      const staleLifecycle = await fetch(`${documentsUrl}/${first.id}/lifecycle-transitions`, { method: "POST", headers: { ...headers("artifact-lifecycle-stale-0001"), "If-Match": '"1"' }, body: JSON.stringify({ transition: "TRASH", reason_code: "USER_REMOVAL" }) });
      expect(staleLifecycle.status).toBe(412); expect(await staleLifecycle.json()).toMatchObject({ code: "PRECONDITION_FAILED" });
      const trashResponse = await fetch(`${documentsUrl}/${second.id}/lifecycle-transitions`, { method: "POST", headers: { ...headers("artifact-lifecycle-trash-0001"), "If-Match": '"1"' }, body: JSON.stringify({ transition: "TRASH", reason_code: "USER_REMOVAL" }) });
      expect(trashResponse.status).toBe(200); expectContractHeaders(trashResponse); expect(await trashResponse.json()).toMatchObject({ document_id: second.id, availability_state: "Trashed", revision: 2 });
      const restoreResponse = await fetch(`${documentsUrl}/${second.id}/lifecycle-transitions`, { method: "POST", headers: { ...headers("artifact-lifecycle-restore-0001"), "If-Match": '"2"' }, body: JSON.stringify({ transition: "RESTORE", reason_code: "USER_REVERSAL" }) });
      expect(restoreResponse.status).toBe(200); expectContractHeaders(restoreResponse); expect(await restoreResponse.json()).toMatchObject({ document_id: second.id, availability_state: "Active", revision: 3 });

      const grantUrl = `${documentsUrl}/${first.id}/versions/${currentVersionId}/artifact-access-grants`;
      const grantResponse = await fetch(grantUrl, { method: "POST", headers: headers("artifact-grant-0001"), body: JSON.stringify({ operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: identity.account.id }) });
      expect(grantResponse.status).toBe(201); expectContractHeaders(grantResponse); const grant = await grantResponse.json() as { artifact_access_grant_id: string; expires_at: string; resource_version_ref: string }; expect(grant.resource_version_ref).toBe(currentVersionId);
      const redemptionUrl = `${base}/v1/workspaces/${workspace.id}/artifact-access-grants/${grant.artifact_access_grant_id}/redemptions`;
      const redemptionResponse = await fetch(redemptionUrl, { method: "POST", headers: headers("artifact-redemption-0001"), body: JSON.stringify({ requested_operation: "VIEW" }) });
      expect(redemptionResponse.status).toBe(200); expectContractHeaders(redemptionResponse); expect(redemptionResponse.headers.get("cache-control")).toBe("private, no-store");
      const redemption = await redemptionResponse.json() as { transfer_ref: string; integrity_digest_ref: string; expires_at: string }; expect(redemption).toMatchObject({ transfer_ref: expect.stringMatching(/^protected-transfer:/), integrity_digest_ref: expect.stringMatching(/^sha256:/), expires_at: grant.expires_at }); expect(redemption.transfer_ref).not.toContain("http");
      const replay = await fetch(redemptionUrl, { method: "POST", headers: headers("artifact-redemption-0001"), body: JSON.stringify({ requested_operation: "VIEW" }) }); expect(await replay.json()).toEqual(redemption);
      const wrongOperation = await fetch(redemptionUrl, { method: "POST", headers: headers("artifact-redemption-wrong-0001"), body: JSON.stringify({ requested_operation: "DOWNLOAD" }) }); expect(wrongOperation.status).toBe(404); expect(await wrongOperation.json()).toMatchObject({ code: "RESOURCE_NOT_AVAILABLE" });

      const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ audit: unknown[] }>; authorityOutbox: Array<{ eventType: string; eventEnvelope?: Record<string, unknown> }> };
      expect(persisted.authorityOutbox.filter((event) => event.eventType === "EVT-P1-009")).toHaveLength(2);
      expect(persisted.authorityOutbox.filter((event) => event.eventType === "EVT-P1-009").every((event) => event.eventEnvelope?.event_type === "EVT-P1-009")).toBe(true);
      expect(JSON.stringify({ audit: persisted.workspaces[0]!.audit, outbox: persisted.authorityOutbox })).not.toContain("Synthetic exact artifact bytes");
    } finally { await app.close(); }
  });
});
