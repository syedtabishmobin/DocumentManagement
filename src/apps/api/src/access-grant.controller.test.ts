import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("bounded current AccessGrant HTTP boundary", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-grant-controller-"));
    process.env.DM_DATA_DIR = directory;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("implements API-P1-112 through API-P1-115 with bounded scope, cursor invalidation, idempotency, concurrency and revocation", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const port = (app.getHttpServer().address() as AddressInfo).port;
      const base = `http://127.0.0.1:${port}/api`;
      const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ displayName: "Grant Synthetic Owner", email: "grant-owner@example.test", password: "synthetic-password" }),
      });
      const identity = await registration.json() as { account: { id: string } };
      const firstCookie = registration.headers.get("set-cookie")!.split(";")[0]!;
      const firstCsrf = registration.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: firstCookie, "X-CSRF-Token": firstCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-grant-workspace", "Idempotency-Key": "grant-workspace-create-0001" },
        body: JSON.stringify({ name: "Grant synthetic household", type: "FAMILY" }),
      });
      const workspace = await workspaceResponse.json() as { id: string };
      const cookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!;
      const csrf = workspaceResponse.headers.get("x-csrf-token")!;
      const headers = (key: string, revision?: number): Record<string, string> => ({
        "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-CSRF-Token": csrf,
        "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`,
        "Idempotency-Key": key, ...(revision ? { "If-Match": `"${revision}"` } : {}),
      });
      const grantsUrl = `${base}/v1/workspaces/${workspace.id}/access-grants`;
      const body = {
        grantee_ref: identity.account.id, purpose_id: "PUR-P1-001",
        scope: { resource_refs: [workspace.id], field_refs: [], edge_refs: [], actions: ["workspace.read"], allow_export: false, allow_onward_delegation: false },
        valid_from: "2026-08-30T00:00:00.000Z", valid_to: null, policy_version: "policy.local-explicit-grant@0.2",
      };

      const createdResponse = await fetch(grantsUrl, { method: "POST", headers: headers("grant-create-canonical-0001"), body: JSON.stringify(body) });
      expect(createdResponse.status).toBe(201);
      expect(createdResponse.headers.get("x-correlation-id")).toBe("corr-grant-create-canonical-0001");
      const grant = await createdResponse.json() as { grant_id: string; revision: number; status: string; scope: { field_refs: string[]; edge_refs: string[]; allow_onward_delegation: boolean } };
      expect(grant).toMatchObject({ revision: 1, status: "ACTIVE", scope: { field_refs: [], edge_refs: [], allow_onward_delegation: false } });
      const replay = await fetch(grantsUrl, { method: "POST", headers: headers("grant-create-canonical-0001"), body: JSON.stringify(body) });
      expect(replay.status).toBe(201); expect((await replay.json() as { grant_id: string }).grant_id).toBe(grant.grant_id);
      const conflict = await fetch(grantsUrl, { method: "POST", headers: headers("grant-create-canonical-0001"), body: JSON.stringify({ ...body, scope: { ...body.scope, actions: ["audit.read"] } }) });
      expect(conflict.status).toBe(409);

      const pageOneResponse = await fetch(`${grantsUrl}?page_size=1`, { headers: headers("grant-list-page-one") });
      expect(pageOneResponse.status).toBe(200);
      const pageOne = await pageOneResponse.json() as { items: unknown[]; page: { next_page_after: string; has_more: boolean } };
      expect(pageOne.items).toHaveLength(1); expect(pageOne.page.has_more).toBe(true);
      const pageTwoResponse = await fetch(`${grantsUrl}?page_size=1&page_after=${encodeURIComponent(pageOne.page.next_page_after)}`, { headers: headers("grant-list-page-two") });
      expect(pageTwoResponse.status).toBe(200); expect((await pageTwoResponse.json() as { items: unknown[] }).items).toHaveLength(1);
      const getResponse = await fetch(`${grantsUrl}/${grant.grant_id}`, { headers: headers("grant-get-canonical") });
      expect(getResponse.status).toBe(200); expect(await getResponse.json()).toMatchObject({ grant_id: grant.grant_id, revision: 1 });

      const revokeUrl = `${grantsUrl}/${grant.grant_id}/revocations`;
      const revokeBody = JSON.stringify({ reason_code: "USER_REQUEST" });
      const revokedResponse = await fetch(revokeUrl, { method: "POST", headers: headers("grant-revoke-canonical-0001", 1), body: revokeBody });
      expect(revokedResponse.status).toBe(200); expect(await revokedResponse.json()).toMatchObject({ grant_id: grant.grant_id, status: "REVOKED", revision: 2 });
      const revokeReplay = await fetch(revokeUrl, { method: "POST", headers: headers("grant-revoke-canonical-0001", 1), body: revokeBody });
      expect(revokeReplay.status).toBe(200); expect(await revokeReplay.json()).toMatchObject({ revision: 2 });
      const staleRevoke = await fetch(revokeUrl, { method: "POST", headers: headers("grant-revoke-canonical-stale", 1), body: revokeBody });
      expect(staleRevoke.status).toBe(412);
      const staleCursor = await fetch(`${grantsUrl}?page_size=1&page_after=${encodeURIComponent(pageOne.page.next_page_after)}`, { headers: headers("grant-list-stale-cursor") });
      expect(staleCursor.status).toBe(400); expect(await staleCursor.json()).toMatchObject({ code: "INVALID_PAGE_CURSOR" });
    } finally {
      await app.close();
    }
  });
});
