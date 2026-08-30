import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IdentityStore } from "./identity.store.js";

describe("IdentityStore", () => {
  let directory: string;
  let store: IdentityStore;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "document-management-identity-"));
    process.env.DM_DATA_DIR = directory;
    store = new IdentityStore();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("hashes credentials, binds CSRF, and rotates sessions after a privilege change", async () => {
    const registered = await store.register({ displayName: "Test Owner", email: "owner@example.test", password: "synthetic-password" });
    expect(registered.identity).toMatchObject({ onboardingComplete: false, account: { displayName: "Test Owner" } });

    const current = await store.session(registered.credentials.token);
    expect(current.identity).toMatchObject({ account: { id: registered.identity.account.id } });
    expect((await store.session(registered.credentials.token)).csrfToken).toBe(current.csrfToken);
    await expect(store.requireSession(registered.credentials.token, "wrong-csrf", true)).rejects.toThrow("could not be authorized");
    await expect(store.requireSession(registered.credentials.token, current.csrfToken, true)).resolves.toMatchObject({ account: { email: "owner@example.test" } });

    const persisted = await readFile(join(directory, "identity.json"), "utf8");
    expect(persisted).not.toContain("synthetic-password");
    expect(persisted).not.toContain(registered.credentials.token);
    expect(persisted).not.toContain(registered.credentials.csrfToken);
    expect(persisted).not.toContain(current.csrfToken!);

    const secondDevice = await store.login({ email: "owner@example.test", password: "synthetic-password" }, "second-device-before-privilege-change");
    const completed = await store.completeOnboarding(registered.identity.account.id, registered.credentials.token, "wrk_test");
    expect(completed.identity).toMatchObject({ onboardingComplete: true, activeWorkspaceId: "wrk_test" });
    await expect(store.requireSession(registered.credentials.token)).rejects.toThrow("Sign in required");
    await expect(store.requireSession(secondDevice.credentials.token)).rejects.toThrow("Sign in required");
    await expect(store.requireSession(completed.credentials.token, completed.credentials.csrfToken, true)).resolves.toMatchObject({ activeWorkspaceId: "wrk_test" });

    await store.logout(completed.credentials.token);
    expect(await store.session(completed.credentials.token)).toEqual({});
    const finalState = JSON.parse(await readFile(join(directory, "identity.json"), "utf8")) as { schemaVersion: number; securityEvents: Array<{ eventType: string; accountId: string; securityVersion: number }> };
    expect(finalState.schemaVersion).toBe(3);
    expect(finalState.securityEvents.map((event) => event.eventType)).toEqual(expect.arrayContaining(["SESSION_ISSUED", "SECURITY_STATE_ROTATED", "SESSION_LOGGED_OUT"]));
    expect(finalState.securityEvents.every((event) => event.accountId === registered.identity.account.id && event.securityVersion >= 1)).toBe(true);
    expect(JSON.stringify(finalState.securityEvents)).not.toContain("synthetic-password");
    expect(JSON.stringify(finalState.securityEvents)).not.toContain(completed.credentials.token);
  });

  it("supports separate identities while rejecting duplicate email ownership", async () => {
    await store.register({ displayName: "First", email: "first@example.test", password: "synthetic-password" });
    const second = await store.register({ displayName: "Second", email: "second@example.test", password: "another-password" });
    expect(second.identity.account.email).toBe("second@example.test");
    await expect(store.register({ displayName: "Duplicate", email: "first@example.test", password: "another-password" })).rejects.toThrow("Unable to create");
  });

  it("binds active workspace selection to each session", async () => {
    const registered = await store.register({ displayName: "Workspace Owner", email: "workspace@example.test", password: "synthetic-password" });
    const first = await store.completeOnboarding(registered.identity.account.id, registered.credentials.token, "wrk_a");
    const second = await store.login({ email: "workspace@example.test", password: "synthetic-password" }, "second-client");
    expect(second.identity.activeWorkspaceId).toBe("wrk_a");

    const switched = await store.selectWorkspace(first.identity.account.id, first.credentials.token, "wrk_b");
    expect(switched.identity.activeWorkspaceId).toBe("wrk_b");
    expect((await store.requireSession(second.credentials.token)).activeWorkspaceId).toBe("wrk_a");
  });

  it("expires an idle session at its bounded deadline", async () => {
    const issuedAt = Date.parse("2026-08-29T00:00:00.000Z");
    const registered = await store.register({ displayName: "Idle Owner", email: "idle@example.test", password: "synthetic-password" }, issuedAt);
    await expect(store.requireSession(registered.credentials.token, undefined, false, issuedAt + 30 * 60 * 1000 - 1)).resolves.toMatchObject({ account: { email: "idle@example.test" } });
    expect(await store.session(registered.credentials.token, issuedAt + 60 * 60 * 1000)).toEqual({});
  });

  it("persists a bounded sign-in lock by email and client fingerprint", async () => {
    await store.register({ displayName: "Test Owner", email: "owner@example.test", password: "synthetic-password" }, Date.parse("2026-08-29T00:00:00.000Z"));
    const input = { email: "owner@example.test", password: "wrong" };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(store.login(input, "client-a", Date.parse(`2026-08-29T00:0${attempt + 1}:00.000Z`))).rejects.toThrow("Email or password is incorrect");
    }
    await expect(store.login(input, "client-a", Date.parse("2026-08-29T00:05:00.000Z"))).rejects.toMatchObject({ status: 429 });
    await expect(store.login({ ...input, password: "synthetic-password" }, "client-a", Date.parse("2026-08-29T00:06:00.000Z"))).rejects.toMatchObject({ status: 429 });
    await expect(store.login({ ...input, password: "synthetic-password" }, "client-b", Date.parse("2026-08-29T00:06:00.000Z"))).resolves.toMatchObject({ identity: { account: { email: "owner@example.test" } } });
  });
});
