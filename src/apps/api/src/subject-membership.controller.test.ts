import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("managed dependant subject HTTP boundary", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-subject-controller-"));
    process.env.DM_DATA_DIR = directory;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("creates no fabricated participation and enforces revision and workspace disclosure fences", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const port = (app.getHttpServer().address() as AddressInfo).port;
      const base = `http://127.0.0.1:${port}/api`;
      const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ displayName: "Subject Synthetic Owner", email: "subject-owner@example.test", password: "synthetic-password" }),
      });
      const firstCookie = registration.headers.get("set-cookie")!.split(";")[0]!;
      const firstCsrf = registration.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: firstCookie, "X-CSRF-Token": firstCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-subject-workspace", "Idempotency-Key": "subject-workspace-create-0001" },
        body: JSON.stringify({ name: "Subject synthetic household", type: "FAMILY" }),
      });
      expect(workspaceResponse.status).toBe(200);
      const workspace = await workspaceResponse.json() as { id: string };
      const cookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!;
      const csrf = workspaceResponse.headers.get("x-csrf-token")!;
      const commandHeaders = (idempotencyKey: string, revision?: number): Record<string, string> => ({
        "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-CSRF-Token": csrf,
        "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${idempotencyKey}`,
        "Idempotency-Key": idempotencyKey, ...(revision ? { "If-Match": `"${revision}"` } : {}),
      });
      const dependantInput = {
        displayName: "HTTP Synthetic Dependant", kind: "DEPENDANT", relationship: "Child", loginEnabled: false,
        role: "MANAGED_DEPENDANT", permissions: { view: false, add: false, edit: false, delete: false },
      };
      const createdResponse = await fetch(`${base}/people`, { method: "POST", headers: commandHeaders("subject-create-0001"), body: JSON.stringify(dependantInput) });
      expect(createdResponse.status).toBe(201);
      expect(createdResponse.headers.get("etag")).toBe('"1"');
      const dependant = await createdResponse.json() as { id: string; revision: number; status: string };
      expect(dependant).toMatchObject({ revision: 1, status: "ACTIVE" });

      let state = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ subjects: Array<{ id: string; status: string; revision: number }>; members: Array<{ subjectId: string }>; subjectIdentityLinks: Array<{ subjectId: string }>; accessGrants: Array<{ resourceIds: string[] }>; audit: Array<{ type: string; outcome?: string }> }> };
      let authority = state.workspaces.find((candidate) => candidate.subjects.some((subject) => subject.id === dependant.id))!;
      expect(authority.members.some((member) => member.subjectId === dependant.id)).toBe(false);
      expect(authority.subjectIdentityLinks.some((link) => link.subjectId === dependant.id)).toBe(false);
      expect(authority.accessGrants.some((grant) => grant.resourceIds.includes(dependant.id))).toBe(false);

      const missingRevision = await fetch(`${base}/people/${dependant.id}`, { method: "PATCH", headers: commandHeaders("subject-update-missing-revision"), body: JSON.stringify({ ...dependantInput, relationship: "Dependant" }) });
      expect(missingRevision.status).toBe(428);
      expect(missingRevision.headers.get("content-type")).toContain("application/problem+json");
      const stale = await fetch(`${base}/people/${dependant.id}`, { method: "PATCH", headers: commandHeaders("subject-update-stale", 99), body: JSON.stringify({ ...dependantInput, relationship: "Stale" }) });
      expect(stale.status).toBe(412);
      expect(await stale.json()).toMatchObject({ code: "PRECONDITION_FAILED", retry_class: "REFRESH_REQUIRED" });
      const updatedResponse = await fetch(`${base}/people/${dependant.id}`, { method: "PATCH", headers: commandHeaders("subject-update-current", 1), body: JSON.stringify({ ...dependantInput, relationship: "Dependant" }) });
      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.headers.get("etag")).toBe('"2"');

      const foreign = await fetch(`${base}/people/subject-from-another-workspace`, { method: "PATCH", headers: commandHeaders("subject-update-foreign", 1), body: JSON.stringify(dependantInput) });
      expect(foreign.status).toBe(404);
      expect(await foreign.json()).toMatchObject({ code: "RESOURCE_NOT_AVAILABLE" });
      const retired = await fetch(`${base}/people/${dependant.id}`, { method: "DELETE", headers: commandHeaders("subject-retire-current", 2) });
      expect(retired.status).toBe(200);

      state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
      authority = state.workspaces.find((candidate) => candidate.subjects.some((subject) => subject.id === dependant.id))!;
      expect(authority.subjects.find((subject) => subject.id === dependant.id)).toMatchObject({ status: "RETIRED", revision: 3 });
      expect(authority.audit.filter((entry) => entry.type === "PERSON_CHANGE_REJECTED")).toHaveLength(2);
      const repeatedRetirement = await fetch(`${base}/people/${dependant.id}`, { method: "DELETE", headers: commandHeaders("subject-retire-repeated", 3) });
      expect(repeatedRetirement.status).toBe(404);
      expect(await repeatedRetirement.json()).toMatchObject({ code: "RESOURCE_NOT_AVAILABLE" });
      state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
      authority = state.workspaces.find((candidate) => candidate.subjects.some((subject) => subject.id === dependant.id))!;
      expect(authority.audit.filter((entry) => entry.type === "PERSON_RETIREMENT_REJECTED" && entry.outcome === "DENIED")).toHaveLength(1);
    } finally {
      await app.close();
    }
  });
});
