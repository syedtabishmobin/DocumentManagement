import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("generic ingestion Job HTTP boundary", () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "doculyra-job-controller-")); process.env.DM_DATA_DIR = directory; });
  afterEach(async () => { await rm(directory, { recursive: true }); delete process.env.DM_DATA_DIR; });

  it("implements API-P1-142 and API-P1-143 with current authorization, concurrency and idempotency", async () => {
    const app = await NestFactory.create(AppModule, { logger: false }); app.setGlobalPrefix("api"); await app.listen(0, "127.0.0.1");
    try {
      const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`; const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ displayName: "Job Synthetic Owner", email: "job-owner@example.test", password: "synthetic-password" }) });
      const firstCookie = registration.headers.get("set-cookie")!.split(";")[0]!; const firstCsrf = registration.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: origin, Cookie: firstCookie, "X-CSRF-Token": firstCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-job-workspace", "Idempotency-Key": "job-workspace-0001" }, body: JSON.stringify({ name: "Job synthetic household", type: "FAMILY" }) });
      const workspace = await workspaceResponse.json() as { id: string }; const cookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!; const csrf = workspaceResponse.headers.get("x-csrf-token")!;
      const headers = (key: string, revision?: number): Record<string, string> => ({ "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-CSRF-Token": csrf, "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`, "Idempotency-Key": key, ...(revision ? { "If-Match": `"${revision}"` } : {}) });
      const casesUrl = `${base}/v1/workspaces/${workspace.id}/ingestion-cases`;
      const createdResponse = await fetch(casesUrl, { method: "POST", headers: headers("job-create-command-0001"), body: JSON.stringify({ capture_route: "BROWSER_UPLOAD", format_profile_ref: "format-profile-synthetic@0.1", source_descriptor_ref: null }) });
      expect(createdResponse.status).toBe(202);
      const created = await createdResponse.json() as { ingestion_case_id: string; revision: number };
      const jobUrl = `${base}/v1/workspaces/${workspace.id}/jobs/${created.ingestion_case_id}`;
      const queried = await fetch(jobUrl, { headers: headers("job-query-0001") });
      const queriedBody = await queried.json();
      expect({ status: queried.status, body: queriedBody }).toEqual({ status: 200, body: expect.objectContaining({ job_id: created.ingestion_case_id, workspace_id: workspace.id, job_kind: "DOCUMENT_INGESTION", state: "QUEUED", accepted_operation_id: "API-P1-116", revision: 1, result_ref: null, failure: null }) }); expect(queried.headers.get("etag")).toBe('"1"'); expect(queried.headers.get("ratelimit-policy")).toBe("jobs-synthetic;w=60;q=60");

      const cancelled = await fetch(`${jobUrl}/cancellations`, { method: "POST", headers: headers("job-cancel-command-0001", 1), body: JSON.stringify({ reason_code: "USER_REQUEST" }) });
      expect(cancelled.status).toBe(202); expect(cancelled.headers.get("location")).toBe(`/api/v1/workspaces/${workspace.id}/jobs/${created.ingestion_case_id}`); expect(cancelled.headers.get("ratelimit-policy")).toBe("jobs-synthetic;w=60;q=20");
      expect(await cancelled.json()).toEqual(expect.objectContaining({ state: "CANCELLED", revision: 2 }));
      const replay = await fetch(`${jobUrl}/cancellations`, { method: "POST", headers: headers("job-cancel-command-0001", 1), body: JSON.stringify({ reason_code: "USER_REQUEST" }) });
      expect(replay.status).toBe(202); expect(await replay.json()).toEqual(expect.objectContaining({ state: "CANCELLED", revision: 2 }));
      expect((await fetch(`${jobUrl}/cancellations`, { method: "POST", headers: headers("job-cancel-stale-0001", 1), body: JSON.stringify({ reason_code: "USER_REQUEST" }) })).status).toBe(412);

      const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ authorityCommandReceipts: Array<{ operationId: string }> }>; authorityOutbox: Array<{ eventType: string; eventEnvelope?: { producer?: { operation?: string } } }> };
      expect(persisted.workspaces[0]!.authorityCommandReceipts.filter((receipt) => receipt.operationId === "API-P1-143")).toHaveLength(1);
      expect(persisted.authorityOutbox.filter((event) => event.eventType === "EVT-P1-006").at(-1)?.eventEnvelope).toEqual(expect.objectContaining({ producer: { producer_id: "doculyra-api", operation: "API_P1_143" }, payload: expect.objectContaining({ to_state: "CANCELLED" }) }));
    } finally { await app.close(); }
  });
});
