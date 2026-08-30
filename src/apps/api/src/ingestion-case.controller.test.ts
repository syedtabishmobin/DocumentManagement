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
      expect(createdResponse.status).toBe(202); expect(createdResponse.headers.get("location")).toContain("/ingestion-cases/"); expect(createdResponse.headers.get("ratelimit-policy")).toBe("ingestion-synthetic;w=60;q=20");
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
      const legacy = await upload(); expect(legacy.status).toBe(201); const legacyDocument = await legacy.json() as { id: string; status: string; extractedText?: string };
      expect(legacyDocument).toMatchObject({ status: "NEEDS_REVIEW" }); expect(legacyDocument).not.toHaveProperty("extractedText");
      const legacyReplay = await upload(); expect(legacyReplay.status).toBe(201); expect(await legacyReplay.json()).toMatchObject({ id: legacyDocument.id });
      const legacyDetail = await fetch(`${base}/documents/${legacyDocument.id}`, { headers: headers("legacy-camera-detail-0001") });
      expect(legacyDetail.status).toBe(200); const legacyDetailBody = await legacyDetail.json() as { preview: { kind: string }; facts: unknown[]; dependencies: Array<{ kind: string }> }; expect(legacyDetailBody).toMatchObject({ preview: { kind: "UNAVAILABLE" }, facts: [] }); expect(legacyDetailBody.dependencies.map((edge) => edge.kind).sort()).toEqual(["DOCUMENT_CATEGORY", "DOCUMENT_SUBJECT"]);
      const legacyArtifact = await fetch(`${base}/documents/${legacyDocument.id}/artifact`, { headers: headers("legacy-camera-artifact-0001") });
      expect(legacyArtifact.status).toBe(200); expect(await legacyArtifact.text()).toBe("Synthetic capture payload");
      const binaryBody = new FormData(); binaryBody.set("file", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: "image/png" }), "synthetic-camera.png"); binaryBody.set("subjectIds", dashboard.subjects[0]!.id); binaryBody.set("captureRoute", "CAMERA"); binaryBody.set("syntheticConfirmed", "true");
      const binary = await fetch(`${base}/documents`, { method: "POST", headers: Object.fromEntries(Object.entries(headers("legacy-camera-binary-0001")).filter(([name]) => name !== "Content-Type")), body: binaryBody });
      expect(binary.status).toBe(201); const binaryDocument = await binary.json() as { id: string; status: string; name: string; extractedText?: string }; expect(binaryDocument).toMatchObject({ status: "POLICY_HOLD", name: "Restricted document" }); expect(binaryDocument).not.toHaveProperty("extractedText");
      expect((await fetch(`${base}/documents/${binaryDocument.id}/artifact`, { headers: headers("legacy-camera-binary-artifact-0001") })).status).toBe(404);

      const containedUpload = async (key: string, name: string, content: string) => { const body = new FormData(); body.set("file", new Blob([content], { type: "text/plain" }), name); body.set("subjectIds", dashboard.subjects[0]!.id); body.set("captureRoute", "FILE"); body.set("syntheticConfirmed", "true"); return fetch(`${base}/documents`, { method: "POST", headers: Object.fromEntries(Object.entries(headers(key)).filter(([header]) => header !== "Content-Type")), body }); };
      const malicious = await containedUpload("legacy-malware-0001", "synthetic-malware.txt", "EICAR-STANDARD-ANTIVIRUS-TEST-FILE"); expect(malicious.status).toBe(201); const maliciousDocument = await malicious.json() as { id: string; status: string; name: string }; expect(maliciousDocument).toMatchObject({ status: "POLICY_HOLD", name: "Restricted document" });
      const scanner = await containedUpload("legacy-scanner-indeterminate-0001", "synthetic-scan.txt", "SYNTHETIC-SCANNER-UNAVAILABLE"); expect(scanner.status).toBe(201); const scannerDocument = await scanner.json() as { id: string; status: string; name: string }; expect(scannerDocument).toMatchObject({ status: "POLICY_HOLD", name: "Restricted document" });
      const clinical = await containedUpload("legacy-clinical-0001", "synthetic-record.txt", "Clinical note: synthetic diagnosis and pathology"); expect(clinical.status).toBe(201); const clinicalDocument = await clinical.json() as { id: string; status: string; name: string }; expect(clinicalDocument).toMatchObject({ status: "POLICY_HOLD", name: "Restricted document" });
      for (const [index, documentId] of [maliciousDocument.id, scannerDocument.id, clinicalDocument.id].entries()) {
        expect((await fetch(`${base}/documents/${documentId}`, { headers: headers(`contained-detail-000${index + 1}`) })).status).toBe(404);
        expect((await fetch(`${base}/documents/${documentId}/artifact`, { headers: headers(`contained-artifact-000${index + 1}`) })).status).toBe(404);
        expect((await fetch(`${base}/documents/${documentId}`, { method: "DELETE", headers: headers(`contained-delete-000${index + 1}`) })).status).toBe(404);
      }
      const workspaceExport = await fetch(`${base}/exports/current`, { headers: headers("workspace-export-0001") }); expect(workspaceExport.status).toBe(200); const exportBody = JSON.stringify(await workspaceExport.json());
      for (const documentId of [maliciousDocument.id, scannerDocument.id, clinicalDocument.id]) expect(exportBody).not.toContain(documentId);
      for (const forbidden of ["Restricted document", "Document contained", "item is contained", "CONTENT_CONTAINED", "CONTAINED_CONTENT", "INGESTION_SAFETY_RETRY", "POLICY_HOLD", "QUARANTINED", "legacy-malware", "legacy-scanner-indeterminate", "legacy-clinical", "scanner-retry", "clinical-retry"]) expect(exportBody).not.toContain(forbidden);
      const containedState = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string }; ingestionCases: Array<{ id: string; documentId: string | null; state: string; revision: number }> }> };
      const cases = containedState.workspaces.find((item) => item.workspace.id === workspace.id)!.ingestionCases;
      expect(cases.find((item) => item.documentId === maliciousDocument.id)).toMatchObject({ state: "QUARANTINED", revision: 3 });
      const scannerCase = cases.find((item) => item.documentId === scannerDocument.id)!; expect(scannerCase).toMatchObject({ state: "QUARANTINED", revision: 3 });
      const clinicalCase = cases.find((item) => item.documentId === clinicalDocument.id)!; expect(clinicalCase).toMatchObject({ state: "POLICY_HOLD", revision: 3 });
      const retryUrl = `${casesUrl}/${scannerCase.id}/retries`;
      const retry = await fetch(retryUrl, { method: "POST", headers: headers("scanner-retry-0001", 3), body: JSON.stringify({ reason_code: "DEPENDENCY_RETRY" }) }); expect(retry.status).toBe(202); expect(retry.headers.get("ratelimit-policy")).toBe("ingestion-synthetic;w=60;q=3"); expect(await retry.json()).toMatchObject({ state: "QUARANTINED", revision: 4 });
      const retryReplay = await fetch(retryUrl, { method: "POST", headers: headers("scanner-retry-0001", 3), body: JSON.stringify({ reason_code: "DEPENDENCY_RETRY" }) }); expect(retryReplay.status).toBe(202); expect(await retryReplay.json()).toMatchObject({ state: "QUARANTINED", revision: 4 });
      const secondRetry = await fetch(retryUrl, { method: "POST", headers: headers("scanner-retry-0002", 4), body: JSON.stringify({ reason_code: "DEPENDENCY_RETRY" }) }); expect(secondRetry.status).toBe(202); expect(await secondRetry.json()).toMatchObject({ state: "QUARANTINED", revision: 5 });
      expect((await fetch(retryUrl, { method: "POST", headers: headers("scanner-retry-exhausted-0001", 5), body: JSON.stringify({ reason_code: "DEPENDENCY_RETRY" }) })).status).toBe(422);
      expect((await fetch(`${casesUrl}/${clinicalCase.id}/retries`, { method: "POST", headers: headers("clinical-retry-denied-0001", 3), body: JSON.stringify({ reason_code: "FALSE_POSITIVE" }) })).status).toBe(422);
      expect((await fetch(`${casesUrl}/${clinicalCase.id}/clinical-policy-decisions`, { method: "POST", headers: headers("clinical-disposition-disabled-0001", 3), body: JSON.stringify({ requested_disposition: "QUARANTINE_FOR_USER_DECISION", policy_version: "policy-unavailable-clinical-disposition" }) })).status).toBe(404);
      const manualBody = { name: "Synthetic manual capture", content: "Synthetic manual content", subjectIds: [dashboard.subjects[0]!.id], syntheticConfirmed: true };
      const manual = await fetch(`${base}/documents/manual`, { method: "POST", headers: headers("legacy-manual-capture-0001"), body: JSON.stringify(manualBody) });
      expect(manual.status).toBe(201); const manualDocument = await manual.json() as { id: string };
      const manualReplay = await fetch(`${base}/documents/manual`, { method: "POST", headers: headers("legacy-manual-capture-0001"), body: JSON.stringify(manualBody) });
      expect(manualReplay.status).toBe(201); expect(await manualReplay.json()).toMatchObject({ id: manualDocument.id });

      const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string }; ingestionCases: Array<{ id: string; attempts: Array<Record<string, unknown>> }>; notifications: Array<{ documentId?: string }>; audit: Array<{ type: string; detail: string; correlationId?: string }> }>; authorityOutbox: Array<{ eventType: string; correlationId: string; eventEnvelope?: Record<string, unknown> }> };
      const authority = persisted.workspaces.find((item) => item.workspace.id === workspace.id)!; const stored = authority.ingestionCases.find((item) => item.id === created.ingestion_case_id)!;
      expect(stored.attempts).toHaveLength(3);
      expect(authority.ingestionCases.filter((item) => item.id !== created.ingestion_case_id)).toHaveLength(6);
      expect(authority.audit).toEqual(expect.arrayContaining([expect.objectContaining({ type: "INGESTION_CASE_CREATED", correlationId: "corr-ingestion-create-0001" }), expect.objectContaining({ type: "INGESTION_RECEIPT_COMMITTED", correlationId: "corr-ingestion-receipt-0001" }), expect.objectContaining({ type: "INGESTION_CASE_CANCELLED", correlationId: "corr-ingestion-cancel-0001" })]));
      expect(persisted.authorityOutbox.filter((event) => event.eventType !== "INGESTION_CASE_RECEIVED" && event.eventType.startsWith("INGESTION_")).map((event) => event.correlationId)).toEqual([
        "corr-ingestion-create-0001", "corr-ingestion-receipt-0001", "corr-ingestion-cancel-0001",
        "corr-legacy-camera-capture-0001", "corr-legacy-camera-binary-0001", "corr-legacy-malware-0001",
        "corr-legacy-scanner-indeterminate-0001", "corr-legacy-clinical-0001", "corr-scanner-retry-0001",
        "corr-scanner-retry-0002", "corr-scanner-retry-exhausted-0001", "corr-clinical-retry-denied-0001",
        "corr-legacy-manual-capture-0001",
      ]);
      const domainEvents = persisted.authorityOutbox.filter((event) => event.eventType === "EVT-P1-006").map((event) => event.eventEnvelope!);
      expect(domainEvents).toHaveLength(17);
      for (const event of domainEvents) expect(event).toMatchObject({ event_type: "EVT-P1-006", schema_version: "1.0.0", scope_kind: "WORKSPACE", aggregate_type: "IngestionCase", producer: { producer_id: "doculyra-api" }, actor: { actor_class: "HUMAN" }, authorization: { decision: "ALLOW" }, classification: { purpose_id: "PUR-P1-001" }, deletion_fence: { state: "NOT_FENCED", generation: 0 }, payload: { stage_id: "INGESTION_ACQUISITION" } });
      const integrityEvents = persisted.authorityOutbox.filter((event) => event.eventType === "EVT-P1-007").map((event) => event.eventEnvelope!); expect(integrityEvents).toHaveLength(8);
      for (const event of integrityEvents) expect(event).toMatchObject({ event_type: "EVT-P1-007", aggregate_type: "ArtifactRecord", classification: { data_class: "P4-RESTRICTED" }, payload: { safety_assessment_id: expect.any(String), content_digest_ref: expect.stringMatching(/^sha256:/) } });
      expect(authority.audit.filter((entry) => entry.type === "CONTAINED_CONTENT_ACCESS_DENIED")).toHaveLength(7);
      expect(authority.audit.filter((entry) => entry.type === "CONTAINED_CONTENT_DISPOSITION_DENIED")).toHaveLength(3);
      expect(authority.audit.filter((entry) => entry.type === "INGESTION_SAFETY_RETRY_DENIED")).toHaveLength(2);
      expect(authority.notifications.filter((notification) => notification.documentId && [maliciousDocument.id, scannerDocument.id, clinicalDocument.id].includes(notification.documentId))).toHaveLength(3);
      expect(JSON.stringify(authority.audit)).not.toContain("source-synthetic-camera-001"); expect(JSON.stringify(authority.audit)).not.toContain("digest-ref-synthetic-001");
      expect(JSON.stringify(authority.audit)).not.toContain("EICAR-STANDARD"); expect(JSON.stringify(authority.audit)).not.toContain("Clinical note"); expect(JSON.stringify(persisted.authorityOutbox)).not.toContain("SYNTHETIC-SCANNER-UNAVAILABLE");
    } finally { await app.close(); }
  });
});
