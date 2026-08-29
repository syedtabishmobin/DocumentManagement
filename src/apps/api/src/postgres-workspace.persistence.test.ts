import { resolve } from "node:path";
import { DataType, newDb } from "pg-mem";
import { afterEach, describe, expect, it } from "vitest";
import { LocalStore, normalizeWorkspaceDatabase, type WorkspaceActor } from "./local.store.js";
import { PostgresWorkspacePersistence } from "./postgres-workspace.persistence.js";
import type { WorkspaceDatabase } from "./workspace-state.js";

const actor: WorkspaceActor = { identityId: "identity_postgres_test", displayName: "Synthetic Owner" };
const migrationsDirectory = resolve(process.cwd(), "../../../migrations/canonical");

function harness() {
  const memory = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  memory.public.registerFunction({ name: "pg_advisory_xact_lock", args: [DataType.integer], returns: DataType.integer, implementation: () => 1 });
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool();
  const persistence = new PostgresWorkspacePersistence({ pool, migrationMode: "apply", migrationsDirectory });
  return { pool, persistence, store: new LocalStore(persistence) };
}

const openPools: Array<{ end(): Promise<void> }> = [];
afterEach(async () => {
  await Promise.all(openPools.splice(0).map((pool) => pool.end()));
});

describe("PostgresWorkspacePersistence", () => {
  it("commits workspace authority, receipt, audit and outbox atomically and survives a store restart", async () => {
    const { pool, persistence, store } = harness();
    openPools.push(pool);
    const workspace = await store.createWorkspace(actor, "Synthetic durable household", "FAMILY", "postgres-key-0001");
    const snapshot = await persistence.read();
    expect(snapshot.workspaces).toHaveLength(1);
    expect(snapshot.workspaceCreationReceipts).toHaveLength(1);
    expect(snapshot.authorityOutbox).toHaveLength(1);
    expect(snapshot.workspaces[0]).toMatchObject({
      workspace: { id: workspace.id },
      ownerBindings: [{ ownerIdentityId: actor.identityId }],
      members: [{ identityId: actor.identityId, role: "OWNER" }],
      authorizationEpoch: { value: 1 },
    });
    expect(snapshot.authorityOutbox[0]).toMatchObject({ eventType: "WORKSPACE_CREATED", workspaceId: workspace.id, actorId: actor.identityId });
    expect(snapshot.workspaces[0]!.audit[0]!.correlationId).toBe(snapshot.authorityOutbox[0]!.correlationId);

    const restarted = new LocalStore(new PostgresWorkspacePersistence({ pool, migrationMode: "verify", migrationsDirectory }));
    await expect(restarted.createWorkspace(actor, "Synthetic durable household", "FAMILY", "postgres-key-0001")).resolves.toMatchObject({ id: workspace.id });
    await expect(restarted.createWorkspace(actor, "Changed input", "PERSONAL", "postgres-key-0001")).rejects.toThrow("already used");
  });

  it("serializes concurrent commands and preserves one owner, membership and grant per workspace", async () => {
    const { pool, persistence, store } = harness();
    openPools.push(pool);
    const results = await Promise.all([
      store.createWorkspace(actor, "First concurrent household", "FAMILY", "postgres-concurrent-0001"),
      store.createWorkspace(actor, "Second concurrent household", "PERSONAL", "postgres-concurrent-0002"),
    ]);
    expect(new Set(results.map((workspace) => workspace.id)).size).toBe(2);
    const snapshot = await persistence.read();
    expect(snapshot.workspaces).toHaveLength(2);
    for (const state of snapshot.workspaces) {
      expect(state.ownerBindings.filter((binding) => binding.state === "ACTIVE")).toHaveLength(1);
      expect(state.members.filter((member) => member.role === "OWNER" && member.state === "ACTIVE")).toHaveLength(1);
      expect(state.accessGrants.filter((grant) => grant.state === "ACTIVE" && grant.granteeIdentityId === actor.identityId)).toHaveLength(1);
    }
  });

  it("rolls back an interrupted authority transaction without partial state", async () => {
    const { pool, persistence } = harness();
    openPools.push(pool);
    await expect(persistence.mutate((database) => {
      database.workspaces.push({ workspace: { id: "partial" } } as WorkspaceDatabase["workspaces"][number]);
      throw new Error("synthetic interruption");
    })).rejects.toThrow("synthetic interruption");
    await expect(persistence.verifyInvariants()).resolves.toEqual({ workspaces: 0, receipts: 0, outbox: 0 });
  });

  it("imports one synthetic local snapshot idempotently and records verified migration evidence", async () => {
    const sourceHarness = harness();
    openPools.push(sourceHarness.pool);
    await sourceHarness.store.createWorkspace(actor, "Synthetic migration household", "FAMILY", "postgres-migration-0001");
    const source = normalizeWorkspaceDatabase(await sourceHarness.persistence.read());

    const targetHarness = harness();
    openPools.push(targetHarness.pool);
    const first = await targetHarness.persistence.importSynthetic(source, "a".repeat(64));
    const repeated = await targetHarness.persistence.importSynthetic(source, "a".repeat(64));
    expect(first.reused).toBe(false);
    expect(repeated).toEqual({ migrationRunId: first.migrationRunId, reused: true });
    await expect(targetHarness.persistence.verifyInvariants()).resolves.toEqual({ workspaces: 1, receipts: 1, outbox: 1 });
  });

  it("retains deny-by-default cross-workspace authorization after durable reload", async () => {
    const { pool, store } = harness();
    openPools.push(pool);
    const first = await store.createWorkspace(actor, "Owned household", "FAMILY", "postgres-auth-0001");
    const foreignActor: WorkspaceActor = { identityId: "identity_foreign", displayName: "Synthetic Foreign Actor" };
    const second = await store.createWorkspace(foreignActor, "Foreign household", "FAMILY", "postgres-auth-0002");
    await expect(store.requireAuthorization(actor, first.id, "workspace.read", "WORKSPACE", first.id)).resolves.toBeUndefined();
    await expect(store.requireAuthorization(actor, second.id, "workspace.read", "WORKSPACE", second.id)).rejects.toThrow("not available");
  });
});
