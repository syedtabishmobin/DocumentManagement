import { mkdtemp, readFile, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("authentication, session and DEC-038 security boundary", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-auth-security-"));
    process.env.DM_DATA_DIR = directory;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("returns actionable privacy-safe 400 responses for malformed account entry without weakening authentication controls", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`;
      const origin = "http://localhost:4173";
      const request = (path: "register" | "login", body: unknown, requestOrigin = origin) => fetch(`${base}/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: requestOrigin },
        body: JSON.stringify(body),
      });

      const invalidRegistration = await request("register", { displayName: "", email: "not-an-email", password: "short", privateCanary: "do-not-return-auth-canary" });
      expect(invalidRegistration.status).toBe(400);
      expect(invalidRegistration.headers.get("set-cookie")).toBeNull();
      const registrationError = await invalidRegistration.text();
      expect(registrationError).toContain("Enter a name between 1 and 120 characters");
      expect(registrationError).toContain("Enter a valid email address");
      expect(registrationError).toContain("Use a password between 10 and 200 characters");
      expect(registrationError).not.toContain("do-not-return-auth-canary");
      expect(registrationError).not.toContain("ZodError");

      const invalidLogin = await request("login", { email: "not-an-email", password: "" });
      expect(invalidLogin.status).toBe(400);
      expect(await invalidLogin.json()).toMatchObject({
        statusCode: 400,
        message: ["Enter a valid email address", "Enter your password"],
      });

      const validRegistration = await request("register", { displayName: "Preview Synthetic Owner", email: "preview-owner@example.test", password: "synthetic-password" });
      expect(validRegistration.status).toBe(201);
      expect(validRegistration.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Strict/);
      const registrationCookie = validRegistration.headers.get("set-cookie")!.split(";")[0]!;
      const registrationCsrf = validRegistration.headers.get("x-csrf-token")!;

      const duplicate = await request("register", { displayName: "Another Synthetic Owner", email: "preview-owner@example.test", password: "another-password" });
      expect(duplicate.status).toBe(409);
      expect(await duplicate.json()).toMatchObject({ message: "Unable to create an account with those details" });

      const wrongCredentials = await request("login", { email: "preview-owner@example.test", password: "wrong-password" });
      expect(wrongCredentials.status).toBe(401);
      expect(await wrongCredentials.json()).toMatchObject({ message: "Email or password is incorrect" });

      const logout = await fetch(`${base}/auth/logout`, {
        method: "POST",
        headers: { Origin: origin, Cookie: registrationCookie, "X-CSRF-Token": registrationCsrf },
      });
      expect(logout.status).toBe(201);
      expect(await logout.json()).toEqual({ signedOut: true });
      expect(await (await fetch(`${base}/auth/session`, { headers: { Cookie: registrationCookie } })).json()).toMatchObject({ authenticated: false });

      const validLogin = await request("login", { email: "preview-owner@example.test", password: "synthetic-password" });
      expect(validLogin.status).toBe(201);
      expect(validLogin.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Strict/);

      const untrustedOrigin = await request("login", { email: "preview-owner@example.test", password: "synthetic-password" }, "https://untrusted.example.test");
      expect(untrustedOrigin.status).toBe(403);
      expect(await untrustedOrigin.json()).toMatchObject({ message: "Request could not be authorized" });
    } finally {
      await app.close();
    }
  });

  it("rotates and revokes bounded sessions while API-P1-181 remains idempotently policy blocked", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api`;
      const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ displayName: "Security Synthetic Owner", email: "security-owner@example.test", password: "synthetic-password" }),
      });
      expect(registration.status).toBe(201);
      expect(registration.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Strict; Path=\/; Max-Age=604800/);
      const initialCookie = registration.headers.get("set-cookie")!.split(";")[0]!;
      const initialCsrf = registration.headers.get("x-csrf-token")!;
      const account = await registration.json() as { account: { id: string } };

      const workspaceResponse = await fetch(`${base}/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: initialCookie, "X-CSRF-Token": initialCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-security-workspace", "Idempotency-Key": "security-workspace-0001" },
        body: JSON.stringify({ name: "Security synthetic household", type: "FAMILY" }),
      });
      expect(workspaceResponse.status).toBe(200);
      const workspace = await workspaceResponse.json() as { id: string };
      const ownerCookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!;
      const ownerCsrf = workspaceResponse.headers.get("x-csrf-token")!;
      const oldSession = await fetch(`${base}/auth/session`, { headers: { Cookie: initialCookie } });
      expect(await oldSession.json()).toMatchObject({ authenticated: false });

      const secondLogin = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin, "User-Agent": "synthetic-second-device" },
        body: JSON.stringify({ email: "security-owner@example.test", password: "synthetic-password" }),
      });
      expect(secondLogin.status).toBe(201);
      const secondCookie = secondLogin.headers.get("set-cookie")!.split(";")[0]!;
      const sessions = await (await fetch(`${base}/auth/sessions`, { headers: { Cookie: ownerCookie } })).json() as Array<{ id: string; current: boolean }>;
      expect(sessions).toHaveLength(2);
      const secondSession = sessions.find((session) => !session.current)!;
      const revoked = await fetch(`${base}/auth/sessions/${secondSession.id}`, { method: "DELETE", headers: { Origin: origin, Cookie: ownerCookie, "X-CSRF-Token": ownerCsrf } });
      expect(revoked.status).toBe(200);
      expect(await revoked.json()).toEqual({ revoked: true });
      expect((await fetch(`${base}/auth/sessions`, { headers: { Cookie: secondCookie } })).status).toBe(401);

      const recoveryUrl = `${base}/v1/workspaces/${workspace.id}/recovery-cases`;
      const recoveryHeaders = (key: string) => ({ "Content-Type": "application/json", Origin: origin, Cookie: ownerCookie, "X-CSRF-Token": ownerCsrf, "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${key}`, "Idempotency-Key": key });
      const recoveryInput = { requested_scope: "WORKSPACE_OWNERSHIP", evidence_submission_refs: [] };
      const blocked = await fetch(recoveryUrl, { method: "POST", headers: recoveryHeaders("recovery-blocked-0001"), body: JSON.stringify(recoveryInput) });
      expect(blocked.status).toBe(202);
      expect(blocked.headers.get("x-correlation-id")).toBe("corr-recovery-blocked-0001");
      expect(blocked.headers.get("ratelimit-policy")).toBeTruthy();
      expect(blocked.headers.get("etag")).toBe('"1"');
      expect(blocked.headers.get("location")).toMatch(new RegExp(`^/v1/workspaces/${workspace.id}/recovery-cases/`));
      const blockedCase = await blocked.json() as { case_id: string };
      expect(blockedCase).toMatchObject({ workspace_id: workspace.id, case_kind: "WORKSPACE_RECOVERY", state: "POLICY_BLOCKED", decision_fence: "DEC-038", revision: 1 });
      const replay = await fetch(recoveryUrl, { method: "POST", headers: recoveryHeaders("recovery-blocked-0001"), body: JSON.stringify(recoveryInput) });
      expect(replay.status).toBe(202);
      expect(await replay.json()).toEqual(blockedCase);
      const conflict = await fetch(recoveryUrl, { method: "POST", headers: recoveryHeaders("recovery-blocked-0001"), body: JSON.stringify({ ...recoveryInput, requested_scope: "ACCOUNT" }) });
      expect(conflict.status).toBe(409);

      const evidenceCanary = "protected-recovery-proof-canary";
      const evidenceAttempt = await fetch(recoveryUrl, { method: "POST", headers: recoveryHeaders("recovery-evidence-0001"), body: JSON.stringify({ ...recoveryInput, evidence_submission_refs: [evidenceCanary] }) });
      expect(evidenceAttempt.status).toBe(422);
      expect(await evidenceAttempt.json()).toMatchObject({ code: "RECOVERY_UNAVAILABLE" });
      const anonymousAttempt = await fetch(`${base}/v1/workspaces/workspace-guessed/recovery-cases`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(recoveryInput) });
      expect(anonymousAttempt.status).toBe(401);

      const identityState = await readFile(join(directory, "identity.json"), "utf8");
      const workspaceState = await readFile(join(directory, "state.json"), "utf8");
      expect(identityState).not.toContain("synthetic-password");
      expect(identityState).not.toContain(ownerCookie.split("=")[1]!);
      expect(workspaceState).not.toContain(evidenceCanary);
      const persistedIdentity = JSON.parse(identityState) as { securityEvents: Array<{ eventType: string; accountId: string }> };
      expect(persistedIdentity.securityEvents.map((event) => event.eventType)).toEqual(expect.arrayContaining(["SECURITY_STATE_ROTATED", "SESSION_REVOKED"]));
      expect(persistedIdentity.securityEvents.every((event) => event.accountId === account.account.id)).toBe(true);
      const persisted = JSON.parse(workspaceState) as { workspaces: Array<{ policyBlockedCases: unknown[]; audit: Array<{ type: string }> }> };
      expect(persisted.workspaces[0]!.policyBlockedCases).toHaveLength(1);
      expect(persisted.workspaces[0]!.audit.filter((entry) => entry.type === "RECOVERY_POLICY_BLOCKED")).toHaveLength(1);
      expect(account.account.id).toBeTruthy();
    } finally {
      await app.close();
    }
  });
});
