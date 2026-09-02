import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ExternalIdentityService } from "./external-identity.service.js";
import { IdentityStore } from "./identity.store.js";

describe("Microsoft Entra External ID provider-neutral adapter", () => {
  let directory: string;
  let server: Server;
  let service: ExternalIdentityService;
  let issuer: string;
  let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
  const fingerprint = "synthetic-browser-fingerprint";
  const clientSecret = "synthetic-client-secret-canary";

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-external-identity-"));
    process.env.DM_DATA_DIR = directory;
    process.env.NODE_ENV = "test";
    const keys = await generateKeyPair("RS256");
    privateKey = keys.privateKey;
    const publicJwk = await exportJWK(keys.publicKey);
    Object.assign(publicJwk, { kid: "synthetic-key", alg: "RS256", use: "sig" });
    server = createServer(async (request, response) => {
      if (request.url === "/tenant/v2.0/.well-known/openid-configuration") {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ issuer, authorization_endpoint: `${issuer.replace(/\/v2\.0$/, "")}/oauth2/v2.0/authorize`, token_endpoint: `${issuer.replace(/\/v2\.0$/, "")}/oauth2/v2.0/token`, jwks_uri: `${issuer.replace(/\/v2\.0$/, "")}/discovery/v2.0/keys` }));
        return;
      }
      if (request.url === "/tenant/discovery/v2.0/keys") {
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ keys: [publicJwk] }));
        return;
      }
      if (request.url === "/tenant/oauth2/v2.0/token" && request.method === "POST") {
        let body = "";
        for await (const chunk of request) body += chunk;
        const form = new URLSearchParams(body);
        const code = form.get("code")!;
        if (code.startsWith("outage:")) { response.statusCode = 503; response.end(); return; }
        const state = code.split(":")[1]!;
        const derivedNonce = await import("node:crypto").then(({ createHmac }) => createHmac("sha256", clientSecret).update(`doculyra-external-identity-v1\u001fnonce\u001f${state}`).digest("base64url"));
        const now = Math.floor(Date.now() / 1000);
        const claims = {
          sub: code.startsWith("subject-two") ? "subject-two" : "subject-one",
          nonce: code.startsWith("wrong-nonce") ? "wrong" : derivedNonce,
          email: code.startsWith("unverified") ? "unverified@example.test" : "external@example.test",
          email_verified: !code.startsWith("unverified"),
          name: "Synthetic External Owner",
        };
        const token = await new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "synthetic-key" })
          .setIssuer(code.startsWith("wrong-issuer") ? `${issuer}/wrong` : issuer)
          .setAudience(code.startsWith("wrong-audience") ? "wrong-client" : "synthetic-client")
          .setIssuedAt(now - 1).setExpirationTime(code.startsWith("expired") ? now - 10 : now + 300).sign(privateKey);
        response.setHeader("content-type", "application/json");
        response.end(JSON.stringify({ id_token: token, access_token: "must-never-persist", refresh_token: "must-never-persist-refresh" }));
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}/tenant/v2.0`;
    Object.assign(process.env, {
      DM_EXTERNAL_IDENTITY_ADAPTER: "enabled",
      DM_ENTRA_EXTERNAL_ID_AUTHORITY: issuer.replace(/\/v2\.0$/, ""),
      DM_ENTRA_EXTERNAL_ID_TENANT_ID: "tenant",
      DM_ENTRA_EXTERNAL_ID_CLIENT_ID: "synthetic-client",
      DM_ENTRA_EXTERNAL_ID_CALLBACK_URL: `${issuer.replace(/\/tenant\/v2\.0$/, "")}/callback`,
      DM_ENTRA_EXTERNAL_ID_CLIENT_SECRET: clientSecret,
      DM_ENTRA_EXTERNAL_ID_CLIENT_SECRET_CONFIGURED: "true",
      DM_EXTERNAL_IDENTITY_PROVIDER_ALLOW_LIST: "google,apple,microsoft",
    });
    service = new ExternalIdentityService(new IdentityStore());
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true });
    for (const key of Object.keys(process.env).filter((key) => key.startsWith("DM_EXTERNAL_IDENTITY"))) delete process.env[key];
    for (const key of Object.keys(process.env).filter((key) => key.startsWith("DM_ENTRA_EXTERNAL_ID"))) delete process.env[key];
    delete process.env.DM_DATA_DIR;
  });

  function stateFrom(authorizationUrl: string): string {
    return new URL(authorizationUrl).searchParams.get("state")!;
  }

  it("accepts only the configured CIAM host or exact tenant-ID CIAM host from discovery", () => {
    process.env.NODE_ENV = "production";
    const tenantId = "11111111-2222-3333-4444-555555555555";
    const validate = (service as unknown as { validateDiscovery: (config: unknown, value: unknown) => unknown }).validateDiscovery.bind(service);
    const config = { authority: new URL("https://tenant-name.ciamlogin.com/tenant-name.onmicrosoft.com/"), tenantId, clientId: "client", clientSecret: "secret", callbackUrl: "https://api.example.test/api/auth/external/callback", providers: new Set(["GOOGLE"]) };
    const valid = { issuer: `https://${tenantId}.ciamlogin.com/${tenantId}/v2.0`, authorization_endpoint: `https://${tenantId}.ciamlogin.com/${tenantId}/oauth2/v2.0/authorize`, token_endpoint: `https://${tenantId}.ciamlogin.com/${tenantId}/oauth2/v2.0/token`, jwks_uri: `https://${tenantId}.ciamlogin.com/${tenantId}/discovery/v2.0/keys` };
    expect(validate(config, valid)).toMatchObject({ issuer: valid.issuer });
    expect(() => validate(config, { ...valid, jwks_uri: `https://another-tenant.ciamlogin.com/${tenantId}/discovery/v2.0/keys` })).toThrow("invalid discovery");
    process.env.NODE_ENV = "test";
  });

  it("fails closed unless every activation input is valid and routes provider hints truthfully", async () => {
    expect((await service.availability()).providers.every((provider) => provider.available)).toBe(true);
    const google = await service.start("GOOGLE", "/app", fingerprint);
    const googleUrl = new URL(google.authorizationUrl);
    expect(googleUrl.searchParams.get("domain_hint")).toBe("google");
    expect(googleUrl.searchParams.has("p")).toBe(false);
    expect(googleUrl.searchParams.get("scope")).toBe("openid profile email");
    expect(googleUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(googleUrl.searchParams.get("code_challenge")).toHaveLength(43);
    expect(googleUrl.searchParams.get("nonce")).toHaveLength(43);
    expect(googleUrl.searchParams.get("state")).toHaveLength(43);
    const microsoft = new URL((await service.start("MICROSOFT", "/app", fingerprint)).authorizationUrl);
    expect(microsoft.searchParams.has("domain_hint")).toBe(false);
    delete process.env.DM_ENTRA_EXTERNAL_ID_CLIENT_SECRET;
    expect((await service.availability()).providers.every((provider) => !provider.available)).toBe(true);
    await expect(service.start("APPLE", "/app", fingerprint)).rejects.toMatchObject({ status: 503 });
  });

  it("validates the exact OIDC token, persists immutable mapping, issues a bounded session, and survives restart", async () => {
    const started = await service.start("GOOGLE", "/app/documents", fingerprint);
    const state = stateFrom(started.authorizationUrl);
    const completed = await service.callback({ state, code: `valid:${state}` }, fingerprint);
    expect(completed.outcome).toBe("SUCCESS");
    if (completed.outcome !== "SUCCESS") throw new Error("expected success");
    expect(completed.returnPath).toBe("/app/documents");
    expect(completed.result.identity).toMatchObject({ account: { email: "external@example.test" }, session: { authenticationMethod: "EXTERNAL_IDENTITY", assurance: "SINGLE_FACTOR" } });
    const persisted = await readFile(join(directory, "identity.json"), "utf8");
    expect(persisted).toContain('"schemaVersion": 4');
    expect(persisted).toContain('"issuer":');
    expect(persisted).toContain('"subject": "subject-one"');
    expect(persisted).not.toContain(state);
    expect(persisted).not.toContain("synthetic-client-secret-canary");
    expect(persisted).not.toContain("must-never-persist");
    expect(persisted).not.toContain(completed.result.credentials.token);
    const restarted = new ExternalIdentityService(new IdentityStore());
    const again = await restarted.start("GOOGLE", "/app", fingerprint);
    const againState = stateFrom(again.authorizationUrl);
    const resumedAfterAuthorizationRestart = new ExternalIdentityService(new IdentityStore());
    const signedIn = await resumedAfterAuthorizationRestart.callback({ state: againState, code: `valid:${againState}` }, fingerprint);
    if (signedIn.outcome !== "SUCCESS") throw new Error("expected success");
    expect(signedIn.result.identity.account.id).toBe(completed.result.identity.account.id);
    const stateAfter = JSON.parse(await readFile(join(directory, "identity.json"), "utf8")) as { accounts: unknown[]; externalIdentities: unknown[] };
    expect(stateAfter.accounts).toHaveLength(1);
    expect(stateAfter.externalIdentities).toHaveLength(1);
  });

  it.each(["wrong-issuer", "wrong-audience", "wrong-nonce", "expired", "unverified"])("rejects %s tokens without a session", async (mode) => {
    const started = await service.start("APPLE", "/app", fingerprint);
    const state = stateFrom(started.authorizationUrl);
    await expect(service.callback({ state, code: `${mode}:${state}` }, fingerprint)).resolves.toMatchObject({ outcome: "FAILED", reason: "invalid" });
    const persisted = JSON.parse(await readFile(join(directory, "identity.json"), "utf8")) as { sessions: unknown[]; externalIdentities: unknown[]; externalIdentityOutcomes: Array<{ provider: string; outcome: string }> };
    expect(persisted.sessions).toHaveLength(0);
    expect(persisted.externalIdentities).toHaveLength(0);
    expect(persisted.externalIdentityOutcomes).toEqual([{ id: expect.any(String), provider: "APPLE", outcome: "TOKEN_INVALID", occurredAt: expect.any(String) }]);
  });

  it("consumes state once across denial, provider outage, replay and restart", async () => {
    const denied = await service.start("MICROSOFT", "/app", fingerprint);
    const deniedState = stateFrom(denied.authorizationUrl);
    delete process.env.DM_EXTERNAL_IDENTITY_ADAPTER;
    await expect(service.callback({ state: deniedState, error: "access_denied" }, fingerprint)).resolves.toMatchObject({ outcome: "CANCELLED", reason: "cancelled" });
    await expect(service.callback({ state: deniedState, code: `valid:${deniedState}` }, fingerprint)).rejects.toMatchObject({ status: 401 });
    process.env.DM_EXTERNAL_IDENTITY_ADAPTER = "enabled";
    const outage = await service.start("MICROSOFT", "/app", fingerprint);
    const outageState = stateFrom(outage.authorizationUrl);
    await expect(service.callback({ state: outageState, code: `outage:${outageState}` }, fingerprint)).resolves.toMatchObject({ outcome: "FAILED", reason: "unavailable" });
    await expect(new ExternalIdentityService(new IdentityStore()).callback({ state: outageState, code: `valid:${outageState}` }, fingerprint)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects expired state and a callback from a different browser binding", async () => {
    const issuedAt = Date.parse("2026-09-02T00:00:00.000Z");
    const expired = await service.start("GOOGLE", "/app", fingerprint, issuedAt);
    const expiredState = stateFrom(expired.authorizationUrl);
    await expect(service.callback({ state: expiredState, code: `valid:${expiredState}` }, fingerprint, issuedAt + 600_001)).rejects.toMatchObject({ status: 401 });
    const bound = await service.start("GOOGLE", "/app", fingerprint, issuedAt);
    const boundState = stateFrom(bound.authorizationUrl);
    await expect(service.callback({ state: boundState, code: `valid:${boundState}` }, "different-browser", issuedAt + 1)).rejects.toMatchObject({ status: 401 });
  });

  it("never links by matching email and rate-limits repeated authorization starts", async () => {
    const store = new IdentityStore();
    await store.register({ displayName: "Local Owner", email: "external@example.test", password: "synthetic-password" });
    service = new ExternalIdentityService(store);
    const collision = await service.start("GOOGLE", "/app", fingerprint);
    const collisionState = stateFrom(collision.authorizationUrl);
    await expect(service.callback({ state: collisionState, code: `subject-two:${collisionState}` }, fingerprint)).resolves.toMatchObject({ outcome: "FAILED", reason: "invalid" });
    for (let attempt = 1; attempt < 10; attempt += 1) await service.start("GOOGLE", "/app", "rate-limited-browser");
    await service.start("GOOGLE", "/app", "rate-limited-browser");
    await expect(service.start("GOOGLE", "/app", "rate-limited-browser")).rejects.toMatchObject({ status: 429 });
  });
});
