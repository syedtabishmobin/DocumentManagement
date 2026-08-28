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

  it("registers a single local owner, hashes the password, and manages the session", async () => {
    const registered = await store.register({ displayName: "Test Owner", email: "owner@example.test", password: "synthetic-password" });
    expect(registered.session).toMatchObject({ authenticated: true, onboardingComplete: false, account: { displayName: "Test Owner" } });
    expect(await store.session(registered.token)).toMatchObject({ authenticated: true });

    const persisted = await readFile(join(directory, "identity.json"), "utf8");
    expect(persisted).not.toContain("synthetic-password");
    expect(persisted).not.toContain(registered.token);

    await store.completeOnboarding(registered.session.account!.id);
    expect((await store.session(registered.token)).onboardingComplete).toBe(true);
    await store.logout(registered.token);
    expect(await store.session(registered.token)).toEqual({ authenticated: false, onboardingComplete: false });
  });

  it("rejects invalid credentials and a second owner account", async () => {
    await store.register({ displayName: "Test Owner", email: "owner@example.test", password: "synthetic-password" });
    await expect(store.login({ email: "owner@example.test", password: "wrong" })).rejects.toThrow("Email or password is incorrect");
    await expect(store.register({ displayName: "Other", email: "other@example.test", password: "another-password" })).rejects.toThrow("local owner account already exists");
  });
});
