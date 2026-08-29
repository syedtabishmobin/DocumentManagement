import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityStore, type AuthenticatedIdentity, type SessionCredentials } from "./identity.store.js";
import { LocalController } from "./local.controller.js";
import { LocalStore } from "./local.store.js";
import type { AuthenticatedRequest } from "./auth.controller.js";

interface ResponseHarness {
  response: Response;
  headers: Map<string, string>;
}

function responseHarness(): ResponseHarness {
  const headers = new Map<string, string>();
  return {
    headers,
    response: { setHeader: (name: string, value: string | number | readonly string[]) => {
      headers.set(name.toLowerCase(), Array.isArray(value) ? value.join(",") : String(value));
      return undefined as never;
    } } as unknown as Response,
  };
}

function requestHarness(identity: AuthenticatedIdentity, credentials: SessionCredentials, overrides: Record<string, string> = {}): AuthenticatedRequest {
  const headers: Record<string, string> = {
    cookie: `dm_session=${encodeURIComponent(credentials.token)}`,
    "x-purpose-id": "PUR-P1-001",
    "x-correlation-id": "corr-story-p1-001-controller",
    "idempotency-key": "controller-workspace-key-0001",
    ...overrides,
  };
  return {
    authIdentity: identity,
    headers,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as AuthenticatedRequest;
}

describe("workspace creation controller", () => {
  let directory: string;
  let identities: IdentityStore;
  let store: LocalStore;
  let controller: LocalController;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-workspace-controller-"));
    process.env.DM_DATA_DIR = directory;
    identities = new IdentityStore();
    store = new LocalStore();
    controller = new LocalController(store, identities);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("fails closed between identity binding and activation, then reconciles one workspace on retry", async () => {
    const registration = await identities.register({ displayName: "Synthetic Owner", email: "owner@example.test", password: "synthetic-password" });
    const activation = vi.spyOn(store, "activateWorkspace").mockRejectedValueOnce(new Error("synthetic activation interruption"));
    const firstResponse = responseHarness();
    await expect(controller.configureWorkspace(
      { name: "Synthetic household", type: "FAMILY" },
      requestHarness(registration.identity, registration.credentials),
      firstResponse.response,
    )).rejects.toThrow("synthetic activation interruption");
    expect(await store.listWorkspaces(registration.identity.account.id)).toEqual([]);

    activation.mockRestore();
    const signedIn = await identities.login({ email: "owner@example.test", password: "synthetic-password" }, "controller-retry-client");
    expect(signedIn.identity).toMatchObject({ onboardingComplete: true, activeWorkspaceId: expect.any(String) });
    const retryResponse = responseHarness();
    const workspace = await controller.configureWorkspace(
      { name: "Synthetic household", type: "FAMILY" },
      requestHarness(signedIn.identity, signedIn.credentials),
      retryResponse.response,
    );
    expect(workspace).toMatchObject({ id: signedIn.identity.activeWorkspaceId, status: "ACTIVE", revision: 2 });
    expect(await store.listWorkspaces(signedIn.identity.account.id)).toEqual([expect.objectContaining({ id: workspace.id })]);
    expect(retryResponse.headers.get("x-correlation-id")).toBe("corr-story-p1-001-controller");
    expect(retryResponse.headers.get("etag")).toBe('"2"');

    const database = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: unknown[]; workspaceCreationReceipts: unknown[]; authorityOutbox: Array<{ eventType: string }> };
    expect(database.workspaces).toHaveLength(1);
    expect(database.workspaceCreationReceipts).toHaveLength(1);
    expect(database.authorityOutbox.map((event) => event.eventType)).toEqual(["WORKSPACE_CREATED", "WORKSPACE_ACTIVATED"]);
  });

  it("enforces exact inert configuration on the canonical route without creating partial state", async () => {
    const registration = await identities.register({ displayName: "Synthetic Owner", email: "canonical@example.test", password: "synthetic-password" });
    const request = requestHarness(registration.identity, registration.credentials, { "idempotency-key": "canonical-workspace-key-0001" });
    await expect(controller.createCanonicalWorkspace({
      workspace_type: "PERSONAL",
      jurisdiction_pack_ref: "jurisdiction.AU",
      residency_policy_ref: "residency.local.synthetic",
      configuration_version: "configuration.stale@0.0",
    }, request, responseHarness().response)).rejects.toThrow("unavailable or no longer current");
    expect(await store.listWorkspaces(registration.identity.account.id)).toEqual([]);

    const response = responseHarness();
    const workspace = await controller.createCanonicalWorkspace({
      workspace_type: "PERSONAL",
      jurisdiction_pack_ref: "jurisdiction.AU",
      residency_policy_ref: "residency.local.synthetic",
      configuration_version: "configuration.local.synthetic@0.1",
    }, request, response.response);
    expect(workspace).toMatchObject({
      workspace_type: "PERSONAL",
      status: "ACTIVE",
      jurisdiction_pack_ref: "jurisdiction.AU",
      residency_policy_ref: "residency.local.synthetic",
      configuration_version: "configuration.local.synthetic@0.1",
      revision: 2,
    });
  });
});
