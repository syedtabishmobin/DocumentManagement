import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("durable multi-route IngestionCase HTTP boundary", () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "doculyra-ingestion-controller-")); process.env.DM_DATA_DIR = directory; });
  afterEach(async () => { await rm(directory, { recursive: true }); delete process.env.DM_DATA_DIR; });

  it("implements API-P1-116 through API-P1-119 with truthful idempotent state and privacy-safe evidence", async () => {
    const app = await NestFactory.create(AppModule, { logger: false }); app.setGlobalPrefix("api"); await app.listen(0, "127.0.0.1");
    try {
      const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`; const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ displayName: "Ingestion Synthetic Owner", email: "ingestion-owner@example.test", password: "synthetic-password" }) });
      const firstCookie = registration.headers.get("set-cookie")!.split(";")[0]!; const firstCsrf = registration.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: origin, Cookie: firstCookie, "X-CSRF-Token": firstCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-ingestion-workspace", "Idempotency-Key": "ingestion-workspace-0001" }, body: JSON.stringify({ name: "Ingestion synthetic household", type: "FAMILY" }) });
      const workspace = await workspaceResponse.json() as { id: string }; const cookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!; const csrf = workspaceResponse.headers.get("x-csrf-token")!;
      const headers = (key: string, revision?: number): Record<string, string> => ({ "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-CSRF-Token": csrf, "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`, "Idempotency-Key": key, ...(revision ? { "If-Match": `"${revision}"` } : {}) });
      const casesUrl = `${base}/v1/workspaces/${workspace.id}/ingestion-cases`;
      const createBody = { capture_route: "PWA_CAMERA_CAPTURE", format_profile_ref: "format-profile-synthetic@0.1", source_descriptor_ref: "source-synthetic-camera-001" };
      const createdResponse = await fetch(casesUrl, { method: "POST", headers: headers("ingestion-create-0001"), body: JSON.stringify(createBody) });
      expect(createdResponse.status).toBe(202); expect(createdResponse.headers.get("location")).toContain("/ingestion-cases/");
      const created = await createdResponse.json() as { ingestion_case_id: string; acquisition_id: string; state: string; artifact_id: null; document_id: null; revision: number };
      expect(created).toMatchObject({ state: "CREATED", artifact_id: null, document_id: null, revision: 1 });
      const replay = await fetch(casesUrl, { method: "POST", headers: headers("ingestion-create-0001"), body: JSON.stringify(createBody) });
      expect(replay.status).toBe(202); expect(await replay.json()).toMatchObject({ ingestion_case_id: created.ingestion_case_id, acquisition_id: created.acquisition_id, revision: 1 });
      const conflict = await fetch(casesUrl, { method: "POST", headers: headers("ingestion-create-0001"), body: JSON.stringify({ ...createBody, capture_route: "MANUAL_RECORD" }) });
      expect(conflict.status).toBe(409);
      const unsupported = await fetch(casesUrl, { method: "POST", headers: headers("ingestion-create-invalid-0001"), body: JSON.stringify({ ...createBody, format_profile_ref: "format-profile-production-unknown" }) });
      expect(unsupported.status).toBe(422);

      const caseUrl = `${casesUrl}/${created.ingestion_case_id}`;
      const getCreated = await fetch(caseUrl, { headers: headers("ingestion-get-created") });
      expect(getCreated.status).toBe(200); expect(await getCreated.json()).toMatchObject({ state: "CREATED", revision: 1 });
      const receiptBody = { transfer_ref: "transfer-synthetic-001", byte_count: 128, content_digest_ref: "digest-ref-synthetic-001" };
      const committed = await fetch(`${caseUrl}/receipt-commits`, { method: "POST", headers: headers("ingestion-receipt-0001", 1), body: JSON.stringify(receiptBody) });
      expect(committed.status).toBe(202); expect(await committed.json()).toMatchObject({ state: "RECEIVED", revision: 2, artifact_id: null, document_id: null });
      const commitReplay = await fetch(`${caseUrl}/receipt-commits`, { method: "POST", headers: headers("ingestion-receipt-0001", 1), body: JSON.stringify(receiptBody) });
      expect(commitReplay.status).toBe(202); expect(await commitReplay.json()).toMatchObject({ state: "RECEIVED", revision: 2 });
      const staleCommit = await fetch(`${caseUrl}/receipt-commits`, { method: "POST", headers: headers("ingestion-receipt-stale-0001", 1), body: JSON.stringify(receiptBody) });
      expect(staleCommit.status).toBe(412);
      const cancelled = await fetch(`${caseUrl}/cancellations`, { method: "POST", headers: headers("ingestion-cancel-0001", 2), body: JSON.stringify({ reason_code: "USER_REQUEST" }) });
      expect(cancelled.status).toBe(202); expect(await cancelled.json()).toMatchObject({ state: "CANCELLED", revision: 3 });
      const cancelReplay = await fetch(`${caseUrl}/cancellations`, { method: "POST", headers: headers("ingestion-cancel-0001", 2), body: JSON.stringify({ reason_code: "USER_REQUEST" }) });
      expect(cancelReplay.status).toBe(202); expect(await cancelReplay.json()).toMatchObject({ state: "CANCELLED", revision: 3 });

      const dashboard = await (await fetch(`${base}/dashboard`, { headers: headers("ingestion-dashboard") })).json() as { subjects: Array<{ id: string }> };
      const upload = () => { const body = new FormData(); body.set("file", new Blob(["Synthetic capture payload"], { type: "text/plain" }), "synthetic-capture.txt"); body.set("subjectIds", dashboard.subjects[0]!.id); body.set("captureRoute", "CAMERA"); body.set("syntheticConfirmed", "true"); return fetch(`${base}/documents`, { method: "POST", headers: Object.fromEntries(Object.entries(headers("legacy-camera-capture-0001")).filter(([name]) => name !== "Content-Type")), body }); };
      const legacy = await upload(); expect(legacy.status).toBe(201); const legacyDocument = await legacy.json() as { id: string };
      const legacyReplay = await upload(); expect(legacyReplay.status).toBe(201); expect(await legacyReplay.json()).toMatchObject({ id: legacyDocument.id });
      const manualBody = { name: "Synthetic manual capture", content: "Synthetic manual content", subjectIds: [dashboard.subjects[0]!.id], syntheticConfirmed: true };
      const manual = await fetch(`${base}/documents/manual`, { method: "POST", headers: headers("legacy-manual-capture-0001"), body: JSON.stringify(manualBody) });
      expect(manual.status).toBe(201); const manualDocument = await manual.json() as { id: string };
      const manualReplay = await fetch(`${base}/documents/manual`, { method: "POST", headers: headers("legacy-manual-capture-0001"), body: JSON.stringify(manualBody) });
      expect(manualReplay.status).toBe(201); expect(await manualReplay.json()).toMatchObject({ id: manualDocument.id });

      const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string }; ingestionCases: Array<{ id: string; attempts: Array<Record<string, unknown>> }>; audit: Array<{ type: string; detail: string; correlationId?: string }> }>; authorityOutbox: Array<{ eventType: string; correlationId: string }> };
      const authority = persisted.workspaces.find((item) => item.workspace.id === workspace.id)!; const stored = authority.ingestionCases.find((item) => item.id === created.ingestion_case_id)!;
      expect(stored.attempts).toHaveLength(3);
      expect(authority.ingestionCases.filter((item) => item.id !== created.ingestion_case_id)).toHaveLength(2);
      expect(authority.audit).toEqual(expect.arrayContaining([expect.objectContaining({ type: "INGESTION_CASE_CREATED", correlationId: "corr-ingestion-create-0001" }), expect.objectContaining({ type: "INGESTION_RECEIPT_COMMITTED", correlationId: "corr-ingestion-receipt-0001" }), expect.objectContaining({ type: "INGESTION_CASE_CANCELLED", correlationId: "corr-ingestion-cancel-0001" })]));
      expect(persisted.authorityOutbox.filter((event) => event.eventType !== "INGESTION_CASE_RECEIVED" && event.eventType.startsWith("INGESTION_")).map((event) => event.correlationId)).toEqual(["corr-ingestion-create-0001", "corr-ingestion-receipt-0001", "corr-ingestion-cancel-0001"]);
      expect(JSON.stringify(authority.audit)).not.toContain("source-synthetic-camera-001"); expect(JSON.stringify(authority.audit)).not.toContain("digest-ref-synthetic-001");
    } finally { await app.close(); }
  });
});
