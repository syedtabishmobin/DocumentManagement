import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("keeps a restricted workspace dashboard usable while denying onward delegation and stale output", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const port = (app.getHttpServer().address() as AddressInfo).port;
      const base = `http://127.0.0.1:${port}/api`;
      const origin = "http://localhost:4173";
      const register = async (displayName: string, email: string) => {
        const response = await fetch(`${base}/auth/register`, {
          method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
          body: JSON.stringify({ displayName, email, password: "synthetic-password" }),
        });
        return { response, body: await response.json() as { account: { id: string } } };
      };
      const ownerRegistration = await register("Dashboard Synthetic Owner", "dashboard-owner@example.test");
      const delegateRegistration = await register("Dashboard Synthetic Delegate", "dashboard-delegate@example.test");
      const ownerCookie = ownerRegistration.response.headers.get("set-cookie")!.split(";")[0]!;
      const ownerCsrf = ownerRegistration.response.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: ownerCookie, "X-CSRF-Token": ownerCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-dashboard-workspace", "Idempotency-Key": "dashboard-workspace-create-0001" },
        body: JSON.stringify({ name: "Dashboard synthetic household", type: "FAMILY" }),
      });
      const workspace = await workspaceResponse.json() as { id: string };
      const currentOwnerCookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!;
      const currentOwnerCsrf = workspaceResponse.headers.get("x-csrf-token")!;
      const statePath = join(directory, "state.json");
      const state = JSON.parse(await readFile(statePath, "utf8")) as { workspaces: Array<{ workspace: { id: string }; members: Array<Record<string, unknown>>; accessGrants: Array<{ grantorIdentityId: string }> }> };
      const authority = state.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!;
      const at = new Date().toISOString();
      authority.members.push({
        id: "member_dashboard_delegate", workspaceId: workspace.id, identityId: delegateRegistration.body.account.id,
        displayName: "Dashboard Synthetic Delegate", role: "ADULT_MEMBER", state: "ACTIVE", invitationState: "ACTIVE",
        permissions: { view: true, add: false, edit: false, delete: false }, validFrom: at, recordedAt: at, createdAt: at, revision: 1, history: [],
      });
      await writeFile(statePath, JSON.stringify(state));
      const ownerHeaders = (key: string, revision?: number): Record<string, string> => ({
        "Content-Type": "application/json", Origin: origin, Cookie: currentOwnerCookie, "X-CSRF-Token": currentOwnerCsrf,
        "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`, "Idempotency-Key": key,
        ...(revision ? { "If-Match": `"${revision}"` } : {}),
      });
      const grantsUrl = `${base}/v1/workspaces/${workspace.id}/access-grants`;
      const parentBody = {
        grantee_ref: delegateRegistration.body.account.id, purpose_id: "PUR-P1-001",
        scope: { resource_refs: [workspace.id], field_refs: [], edge_refs: [], actions: ["workspace.read", "grant.create"], allow_export: false, allow_onward_delegation: false },
        valid_from: "2026-08-30T00:00:00.000Z", valid_to: null, policy_version: "policy.local-explicit-grant@0.2",
      };
      const parentResponse = await fetch(grantsUrl, { method: "POST", headers: ownerHeaders("dashboard-parent-grant-0001"), body: JSON.stringify(parentBody) });
      expect(parentResponse.status).toBe(201);
      const parent = await parentResponse.json() as { grant_id: string; revision: number };

      const delegateLogin = await fetch(`${base}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ email: "dashboard-delegate@example.test", password: "synthetic-password" }),
      });
      expect(delegateLogin.status).toBe(201);
      const delegateCookie = delegateLogin.headers.get("set-cookie")!.split(";")[0]!;
      const delegateCsrf = delegateLogin.headers.get("x-csrf-token")!;
      const delegateHeaders = (key: string): Record<string, string> => ({
        "Content-Type": "application/json", Origin: origin, Cookie: delegateCookie, "X-CSRF-Token": delegateCsrf,
        "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`, "Idempotency-Key": key,
      });
      const dashboardResponse = await fetch(`${base}/dashboard`, { headers: delegateHeaders("dashboard-restricted-read") });
      expect(dashboardResponse.status).toBe(200);
      expect(await dashboardResponse.json()).toMatchObject({ workspace: { id: workspace.id }, members: [], subjects: [], audit: [], accessGrants: [] });

      const childBody = { ...parentBody, grantee_ref: ownerRegistration.body.account.id, scope: { ...parentBody.scope, actions: ["workspace.read"] } };
      const childAttempt = await fetch(grantsUrl, { method: "POST", headers: delegateHeaders("dashboard-child-grant-0001"), body: JSON.stringify(childBody) });
      expect(childAttempt.status).toBe(404);
      expect(await childAttempt.json()).toMatchObject({ code: "RESOURCE_NOT_AVAILABLE" });
      const childReplay = await fetch(grantsUrl, { method: "POST", headers: delegateHeaders("dashboard-child-grant-0001"), body: JSON.stringify(childBody) });
      expect(childReplay.status).toBe(404);

      const persisted = JSON.parse(await readFile(statePath, "utf8")) as { workspaces: Array<{ workspace: { id: string }; accessGrants: Array<{ grantorIdentityId: string }>; audit: Array<{ type: string; outcome?: string; correlationId?: string; decisionReason?: string; authorizationPhase?: string; detail: string }> }>; authorityOutbox: Array<{ eventType: string; correlationId: string; decisionReason?: string; authorizationPhase?: string }> };
      const persistedAuthority = persisted.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!;
      expect(persistedAuthority.accessGrants.some((grant) => grant.grantorIdentityId === delegateRegistration.body.account.id)).toBe(false);
      const childDenials = persistedAuthority.audit.filter((entry) => entry.type === "ACCESS_GRANT_CREATION_DENIED" && entry.correlationId === "corr-dashboard-child-grant-0001");
      expect(childDenials).toHaveLength(2);
      expect(childDenials.every((entry) => entry.outcome === "DENIED" && entry.decisionReason === "ONWARD_DELEGATION_NOT_PERMITTED" && entry.authorizationPhase === "EFFECT")).toBe(true);
      expect(childDenials.every((entry) => !entry.detail.includes(delegateRegistration.body.account.id) && !entry.detail.includes(ownerRegistration.body.account.id))).toBe(true);
      expect(persisted.authorityOutbox.filter((entry) => entry.eventType === "ACCESS_GRANT_CREATION_DENIED" && entry.correlationId === "corr-dashboard-child-grant-0001")).toHaveLength(2);
      const revoked = await fetch(`${grantsUrl}/${parent.grant_id}/revocations`, { method: "POST", headers: ownerHeaders("dashboard-parent-revoke-0001", parent.revision), body: JSON.stringify({ reason_code: "USER_REQUEST" }) });
      expect(revoked.status).toBe(200);
      const staleDashboard = await fetch(`${base}/dashboard`, { headers: delegateHeaders("dashboard-revoked-read") });
      expect(staleDashboard.status).toBe(404);
    } finally {
      await app.close();
    }
  });
});
