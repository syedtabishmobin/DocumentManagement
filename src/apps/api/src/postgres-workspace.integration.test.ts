import { resolve } from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LocalStore, type WorkspaceActor } from "./local.store.js";
import { PostgresWorkspacePersistence } from "./postgres-workspace.persistence.js";

const testUrl = process.env.DM_TEST_POSTGRES_URL;
const resetAllowed = process.env.DM_TEST_POSTGRES_ALLOW_SCHEMA_RESET === "enabled";
const integration = testUrl && resetAllowed ? describe : describe.skip;
const migrationsDirectory = resolve(process.cwd(), "../../../migrations/canonical");
const actor: WorkspaceActor = { identityId: "identity_real_postgres", displayName: "Synthetic PostgreSQL Owner" };

integration("PostgreSQL workspace authority integration", () => {
  let pool: Pool;
  let firstPersistence: PostgresWorkspacePersistence;

  beforeAll(async () => {
    pool = new Pool({ connectionString: testUrl, max: 8 });
  });

  beforeEach(async () => {
    await pool.query("DROP SCHEMA IF EXISTS doculyra CASCADE");
    firstPersistence = new PostgresWorkspacePersistence({ pool, migrationMode: "apply", migrationsDirectory });
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query("DROP SCHEMA IF EXISTS doculyra CASCADE");
    await pool.end();
  });

  it("proves cross-connection idempotency, concurrency, restart and rollback on PostgreSQL", async () => {
    const firstStore = new LocalStore(firstPersistence);
    const secondPersistence = new PostgresWorkspacePersistence({ pool, migrationMode: "verify", migrationsDirectory });
    const secondStore = new LocalStore(secondPersistence);

    const [first, replay] = await Promise.all([
      firstStore.createWorkspace(actor, "Concurrent durable household", "FAMILY", "real-postgres-key-0001"),
      secondStore.createWorkspace(actor, "Concurrent durable household", "FAMILY", "real-postgres-key-0001"),
    ]);
    expect(replay.id).toBe(first.id);
    await expect(secondStore.createWorkspace(actor, "Conflicting durable household", "PERSONAL", "real-postgres-key-0001")).rejects.toThrow("already used");

    const foreignActor: WorkspaceActor = { identityId: "identity_real_postgres_foreign", displayName: "Synthetic Foreign Owner" };
    const foreign = await secondStore.createWorkspace(foreignActor, "Foreign durable household", "PERSONAL", "real-postgres-key-0002");
    await expect(secondStore.requireAuthorization(actor, foreign.id, "workspace.read", "WORKSPACE", foreign.id)).rejects.toThrow("not available");

    const person = await firstStore.createPerson(first.id, actor, {
      displayName: "Synthetic Concurrent Person", kind: "ADULT", relationship: "Family member", loginEnabled: false,
      role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false },
    });
    const update = (displayName: string) => ({
      displayName, kind: "ADULT" as const, relationship: "Family member", loginEnabled: false,
      role: "ADULT_MEMBER" as const, permissions: { view: true, add: false, edit: false, delete: false },
    });
    await Promise.all([
      firstStore.updatePerson(first.id, actor, person.id, update("Synthetic Concurrent Person A")),
      secondStore.updatePerson(first.id, actor, person.id, update("Synthetic Concurrent Person B")),
    ]);
    const afterConcurrentUpdate = await firstPersistence.read();
    const authority = afterConcurrentUpdate.workspaces.find((state) => state.workspace.id === first.id)!;
    expect(authority.subjects.find((subject) => subject.id === person.id)?.revision).toBe(3);
    expect(authority.audit.filter((record) => record.type === "PERSON_UPDATED")).toHaveLength(2);

    await expect(firstPersistence.mutate((database) => {
      database.workspaces.find((state) => state.workspace.id === first.id)!.accessGrants[0]!.workspaceId = foreign.id;
    })).rejects.toThrow("workspace scope mismatch");

    await expect(firstPersistence.mutate((database) => {
      database.workspaceCreationReceipts.push({ identityId: actor.identityId, idempotencyKeyHash: "partial", requestFingerprint: "partial", workspaceId: "missing", createdAt: new Date().toISOString() });
      throw new Error("synthetic transaction interruption");
    })).rejects.toThrow("synthetic transaction interruption");

    const restarted = new LocalStore(new PostgresWorkspacePersistence({ pool, migrationMode: "verify", migrationsDirectory }));
    expect(await restarted.listWorkspaces(actor.identityId)).toEqual([expect.objectContaining({ id: first.id })]);
    await expect(firstPersistence.verifyInvariants()).resolves.toEqual({ workspaces: 2, receipts: 2, outbox: 5 });

    const row = await pool.query<{ state: { members: Array<{ workspaceId: string }> } }>("SELECT state FROM doculyra.workspace_state WHERE workspace_id = $1", [first.id]);
    row.rows[0]!.state.members[0]!.workspaceId = foreign.id;
    await pool.query("UPDATE doculyra.workspace_state SET state = $2::jsonb WHERE workspace_id = $1", [first.id, JSON.stringify(row.rows[0]!.state)]);
    await expect(restarted.listWorkspaces(actor.identityId)).resolves.toEqual([]);
    await expect(restarted.requireAuthorization(actor, first.id, "workspace.read", "WORKSPACE", first.id)).rejects.toThrow("not available");
    await expect(firstPersistence.verifyInvariants()).rejects.toThrow("workspace scope mismatch");
  });

  it("rejects verified replay when an imported PostgreSQL target is corrupt", async () => {
    const sourceStore = new LocalStore(firstPersistence);
    await sourceStore.createWorkspace(actor, "Synthetic PostgreSQL import source", "FAMILY", "real-postgres-import-0001");
    const source = await firstPersistence.read();
    await pool.query("DROP SCHEMA IF EXISTS doculyra CASCADE");
    const target = new PostgresWorkspacePersistence({ pool, migrationMode: "apply", migrationsDirectory });
    const invalidSource = structuredClone(source);
    invalidSource.workspaces[0]!.members[0]!.workspaceId = "workspace_foreign";
    await expect(target.importSynthetic(invalidSource, "e".repeat(64))).rejects.toThrow("workspace scope mismatch");
    expect((await pool.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM doculyra.authority_migration_run")).rows[0]?.count).toBe(0);
    expect((await pool.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM doculyra.workspace_state")).rows[0]?.count).toBe(0);
    const first = await target.importSynthetic(source, "d".repeat(64));
    const row = await pool.query<{ workspace_id: string; state: { members: Array<{ workspaceId: string }> } }>("SELECT workspace_id, state FROM doculyra.workspace_state");
    row.rows[0]!.state.members[0]!.workspaceId = "workspace_foreign";
    await pool.query("UPDATE doculyra.workspace_state SET state = $2::jsonb WHERE workspace_id = $1", [row.rows[0]!.workspace_id, JSON.stringify(row.rows[0]!.state)]);
    await expect(target.importSynthetic(source, "d".repeat(64))).rejects.toThrow("requires repair");
    const run = await pool.query<{ status: string }>("SELECT status FROM doculyra.authority_migration_run WHERE migration_run_id = $1", [first.migrationRunId]);
    expect(run.rows[0]?.status).toBe("REPAIR_REQUIRED");
  });
});
