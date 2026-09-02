import type { AddressInfo } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { ExternalIdentityController } from "./external-identity.controller.js";

describe("external identity HTTP contract", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-external-http-"));
    process.env.DM_DATA_DIR = directory;
    process.env.NODE_ENV = "test";
    process.env.DM_PUBLIC_BASE_URL = "https://preview.example.test";
    delete process.env.DM_EXTERNAL_IDENTITY_ADAPTER;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
    delete process.env.DM_PUBLIC_BASE_URL;
  });

  it("publishes truthful disabled availability and rejects malformed, untrusted and unconfigured starts without state", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}/api/auth/external`;
      const availability = await fetch(`${base}/providers`);
      const availabilityBody = await availability.text();
      expect(availability.status, availabilityBody).toBe(200);
      expect(availability.headers.get("cache-control")).toBe("private, no-store");
      expect(JSON.parse(availabilityBody)).toEqual({ broker: "MICROSOFT_ENTRA_EXTERNAL_ID", providers: [
        { provider: "GOOGLE", available: false }, { provider: "APPLE", available: false }, { provider: "MICROSOFT", available: false },
      ] });
      const malformed = await fetch(`${base}/start?provider=UNKNOWN&returnPath=https://attacker.example`, { headers: { Origin: "http://localhost:4173" } });
      expect(malformed.status).toBe(400);
      expect(await malformed.text()).not.toContain("attacker.example");
      const untrusted = await fetch(`${base}/start?provider=GOOGLE&returnPath=/app`, { headers: { Origin: "https://untrusted.example.test" } });
      expect(untrusted.status).toBe(403);
      const disabled = await fetch(`${base}/start?provider=GOOGLE&returnPath=/app`, { headers: { Origin: "http://localhost:4173" } });
      expect(disabled.status).toBe(503);
      expect(await disabled.text()).not.toContain("client_secret");
      const invalidCallback = await fetch(`${base}/callback?state=short&error=access_denied&error_description=owner%40example.test`, { redirect: "manual" });
      expect(invalidCallback.status).toBe(303);
      expect(invalidCallback.headers.get("location")).toBe("https://preview.example.test/app?external_auth=failed&reason=invalid");
      expect(invalidCallback.headers.get("location")).not.toContain("owner");
    } finally {
      await app.close();
    }
  });

  it("redirects successful and cancelled callbacks with only bounded result markers", async () => {
    const headers = new Map<string, string>();
    let location = "";
    const response = {
      setHeader: (name: string, value: string) => { headers.set(name.toLowerCase(), value); },
      redirect: (status: number, value: string) => { expect(status).toBe(303); location = value; },
    };
    const request = { ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" }, get: (name: string) => name.toLowerCase() === "user-agent" ? "synthetic-browser" : undefined };
    const identity = { account: { id: "account-synthetic", displayName: "Synthetic", email: "owner@example.test" }, onboardingComplete: false, session: { id: "session-synthetic", createdAt: "2026-09-02T00:00:00.000Z", idleExpiresAt: "2026-09-02T00:30:00.000Z", absoluteExpiresAt: "2026-09-09T00:00:00.000Z", authenticationMethod: "EXTERNAL_IDENTITY" as const, assurance: "SINGLE_FACTOR" as const } };
    const service = { callback: async () => ({ outcome: "SUCCESS" as const, returnPath: "/app/documents", result: { identity, credentials: { token: "synthetic-session-token", csrfToken: "synthetic-csrf" } } }) };
    const controller = new ExternalIdentityController(service as never);
    await controller.callback({ state: "s".repeat(32), code: "synthetic-code" }, request as never, response as never);
    expect(location).toBe("https://preview.example.test/app/documents?external_auth=success");
    expect(headers.get("set-cookie")).toContain("HttpOnly; SameSite=Strict");
    expect(location).not.toContain("synthetic-code");

    const cancelled = new ExternalIdentityController({ callback: async () => ({ outcome: "CANCELLED" as const, reason: "cancelled" as const, returnPath: "/app" }) } as never);
    await cancelled.callback({ state: "s".repeat(32), error: "access_denied", error_description: "owner@example.test" }, request as never, response as never);
    expect(location).toBe("https://preview.example.test/app?external_auth=cancelled");
    expect(location).not.toContain("owner");
  });
});
