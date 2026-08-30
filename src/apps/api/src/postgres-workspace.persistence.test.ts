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

function serializationFailure(message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code: "40001" });
}

function retryHarness(failures: number, retry: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number }) {
  const memory = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  memory.public.registerFunction({ name: "pg_advisory_xact_lock", args: [DataType.integer], returns: DataType.integer, implementation: () => 1 });
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool();
  let remainingFailures = failures;
  const retryPool = {
    async connect() {
      const client = await pool.connect();
      return {
        query: async (...args: Parameters<typeof client.query>) => {
          if (remainingFailures > 0 && typeof args[0] === "string" && args[0].includes("INSERT INTO doculyra.workspace_state")) {
            remainingFailures -= 1;
            throw serializationFailure("synthetic serialization conflict");
          }
          return client.query(...args);
        },
        release: () => client.release(),
      };
    },
    end: () => pool.end(),
  };
  const delays: number[] = [];
  const persistence = new PostgresWorkspacePersistence({
    pool: retryPool,
    migrationMode: "apply",
    migrationsDirectory,
    transactionRetry: { ...retry, sleep: async (delayMs) => { delays.push(delayMs); } },
  });
  return { pool: retryPool, persistence, store: new LocalStore(persistence), delays, remainingFailures: () => remainingFailures };
}

const openPools: Array<{ end(): Promise<void> }> = [];
afterEach(async () => {
  await Promise.all(openPools.splice(0).map((pool) => pool.end()));
});

describe("PostgresWorkspacePersistence", () => {
  it("delays retryable serialization conflicts, converges, and exhausts the exact bounded budget", async () => {
    const converging = retryHarness(3, { maxAttempts: 5, baseDelayMs: 10, maxDelayMs: 25 });
    openPools.push(converging.pool);
    await expect(converging.store.createWorkspace(actor, "Synthetic retry household", "FAMILY", "postgres-retry-0001")).resolves.toMatchObject({ name: "Synthetic retry household" });
    expect(converging.delays).toEqual([10, 20, 25]);
    expect(converging.remainingFailures()).toBe(0);
    await expect(converging.persistence.verifyInvariants()).resolves.toEqual({ workspaces: 1, receipts: 1, outbox: 1 });

    const exhausted = retryHarness(4, { maxAttempts: 3, baseDelayMs: 7, maxDelayMs: 10 });
    openPools.push(exhausted.pool);
    await expect(exhausted.store.createWorkspace(actor, "Synthetic exhausted household", "FAMILY", "postgres-retry-0002")).rejects.toMatchObject({ code: "40001" });
    expect(exhausted.delays).toEqual([7, 10]);
    expect(exhausted.remainingFailures()).toBe(1);
    await expect(exhausted.persistence.verifyInvariants()).resolves.toEqual({ workspaces: 0, receipts: 0, outbox: 0 });
  });

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

  it("expands pre-lifecycle PostgreSQL authority records without fabricating access", async () => {
    const { pool, persistence, store } = harness();
    openPools.push(pool);
    const workspace = await store.createWorkspace(actor, "Legacy authority household", "FAMILY", "postgres-legacy-0001");
    const current = (await persistence.read()).workspaces[0]!;
    const legacy = structuredClone(current);
    for (const subject of legacy.subjects) {
      const record = subject as unknown as Record<string, unknown>;
      delete record.status;
      delete record.validFrom;
      delete record.recordedAt;
      delete record.history;
    }
    for (const member of legacy.members) {
      const record = member as unknown as Record<string, unknown>;
      delete record.validFrom;
      delete record.recordedAt;
      delete record.history;
    }
    await pool.query("UPDATE doculyra.workspace_state SET state = $2::jsonb WHERE workspace_id = $1", [workspace.id, JSON.stringify(legacy)]);

    const expanded = await persistence.read();
    expect(expanded.workspaces[0]!.subjects[0]).toMatchObject({ status: "ACTIVE", validFrom: current.subjects[0]!.createdAt, history: [] });
    expect(expanded.workspaces[0]!.members[0]).toMatchObject({ validFrom: current.members[0]!.createdAt, history: [] });
    expect(expanded.workspaces[0]!.members).toHaveLength(current.members.length);
    expect(expanded.workspaces[0]!.subjectIdentityLinks).toEqual(current.subjectIdentityLinks);
    expect(expanded.workspaces[0]!.accessGrants).toEqual(current.accessGrants);
    await expect(persistence.verifyInvariants()).resolves.toMatchObject({ workspaces: 1 });
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
    expect(first).toMatchObject({ reused: false, status: "VERIFIED" });
    expect(repeated).toEqual({ migrationRunId: first.migrationRunId, reused: true, status: "ALREADY_APPLIED_AND_VERIFIED" });
    const workspaceId = source.workspaces[0]!.workspace.id;
    const fence = await targetHarness.store.startAuthorization(actor, workspaceId, "subject.create", "WORKSPACE");
    await targetHarness.store.createPerson(workspaceId, actor, {
      displayName: "Synthetic evolved person", kind: "ADULT", relationship: "Family member", loginEnabled: false,
      role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false },
    }, fence, "corr-pgmem-person-create");
    await expect(targetHarness.persistence.importSynthetic(source, "a".repeat(64))).resolves.toMatchObject({ reused: true, status: "ALREADY_APPLIED_AND_VERIFIED" });
    await expect(targetHarness.persistence.verifyInvariants()).resolves.toEqual({ workspaces: 1, receipts: 1, outbox: 4 });
  });

  it("rejects cross-workspace and dangling authority records before commit", async () => {
    const { pool, persistence, store } = harness();
    openPools.push(pool);
    await store.createWorkspace(actor, "Synthetic invariant household", "FAMILY", "postgres-invariant-0001");
    const corruptions: Array<(state: WorkspaceDatabase["workspaces"][number]) => void> = [
      (state) => { state.members[0]!.workspaceId = "workspace_foreign"; },
      (state) => { state.ownerBindings[0]!.workspaceId = "workspace_foreign"; },
      (state) => { state.accessGrants[0]!.workspaceId = "workspace_foreign"; },
      (state) => { state.authorizationEpoch.workspaceId = "workspace_foreign"; },
      (state) => { state.subjectIdentityLinks[0]!.subjectId = "subject_missing"; },
      (state) => { state.accessGrants[0]!.resourceIds = ["workspace_foreign"]; },
      (state) => { state.members[0]!.subjectId = "subject_missing"; },
      (state) => { state.ownerBindings.push({ ...state.ownerBindings[0]! }); },
    ];
    for (const corrupt of corruptions) {
      await expect(persistence.mutate((database) => corrupt(database.workspaces[0]!))).rejects.toThrow();
      await expect(persistence.verifyInvariants()).resolves.toMatchObject({ workspaces: 1 });
    }
  });

  it("marks a corrupt imported target as repair-required instead of verified reuse", async () => {
    const sourceHarness = harness();
    openPools.push(sourceHarness.pool);
    await sourceHarness.store.createWorkspace(actor, "Synthetic replay source", "FAMILY", "postgres-replay-source-0001");
    const source = await sourceHarness.persistence.read();

    const targetHarness = harness();
    openPools.push(targetHarness.pool);
    const first = await targetHarness.persistence.importSynthetic(source, "c".repeat(64));
    const rows = await targetHarness.pool.query("SELECT workspace_id, state FROM doculyra.workspace_state");
    const state = rows.rows[0]!.state as WorkspaceDatabase["workspaces"][number];
    state.members[0]!.workspaceId = "workspace_foreign";
    await targetHarness.pool.query("UPDATE doculyra.workspace_state SET state = $2::jsonb WHERE workspace_id = $1", [state.workspace.id, JSON.stringify(state)]);

    await expect(targetHarness.persistence.importSynthetic(source, "c".repeat(64))).rejects.toThrow("requires repair");
    const run = await targetHarness.pool.query("SELECT status FROM doculyra.authority_migration_run WHERE migration_run_id = $1", [first.migrationRunId]);
    expect(run.rows[0]?.status).toBe("REPAIR_REQUIRED");
    await expect(targetHarness.persistence.verifyInvariants()).rejects.toThrow("workspace scope mismatch");
  });

  it("rolls back an invalid first import and detects retained migration-ledger drift", async () => {
    const sourceHarness = harness();
    openPools.push(sourceHarness.pool);
    await sourceHarness.store.createWorkspace(actor, "Synthetic import evidence source", "FAMILY", "postgres-import-evidence-0001");
    const source = await sourceHarness.persistence.read();

    const interruptedHarness = harness();
    openPools.push(interruptedHarness.pool);
    const invalidSource = structuredClone(source);
    invalidSource.workspaces[0]!.members[0]!.workspaceId = "workspace_foreign";
    await expect(interruptedHarness.persistence.importSynthetic(invalidSource, "e".repeat(64))).rejects.toThrow("workspace scope mismatch");
    expect((await interruptedHarness.pool.query("SELECT COUNT(*)::int AS count FROM doculyra.workspace_state")).rows[0]?.count).toBe(0);

    const driftHarness = harness();
    openPools.push(driftHarness.pool);
    const first = await driftHarness.persistence.importSynthetic(source, "f".repeat(64));
    await driftHarness.pool.query("UPDATE doculyra.authority_migration_run SET workspace_count = workspace_count + 1 WHERE migration_run_id = $1", [first.migrationRunId]);
    await expect(driftHarness.persistence.importSynthetic(source, "f".repeat(64))).rejects.toThrow("requires repair");
    const run = await driftHarness.pool.query("SELECT status FROM doculyra.authority_migration_run WHERE migration_run_id = $1", [first.migrationRunId]);
    expect(run.rows[0]?.status).toBe("REPAIR_REQUIRED");
  });

  it("retains deny-by-default cross-workspace authorization after durable reload", async () => {
    const { pool, persistence, store } = harness();
    openPools.push(pool);
    const first = await store.createWorkspace(actor, "Owned household", "FAMILY", "postgres-auth-0001");
    const foreignActor: WorkspaceActor = { identityId: "identity_foreign", displayName: "Synthetic Foreign Actor" };
    const second = await store.createWorkspace(foreignActor, "Foreign household", "FAMILY", "postgres-auth-0002");
    await expect(store.requireAuthorization(actor, first.id, "workspace.read", "WORKSPACE", first.id)).resolves.toBeUndefined();
    await expect(store.requireAuthorization(actor, second.id, "workspace.read", "WORKSPACE", second.id)).rejects.toThrow("not available");

    const rows = await pool.query("SELECT state FROM doculyra.workspace_state WHERE workspace_id = $1", [first.id]);
    const state = rows.rows[0]!.state as WorkspaceDatabase["workspaces"][number];
    state.members[0]!.workspaceId = second.id;
    await pool.query("UPDATE doculyra.workspace_state SET state = $2::jsonb WHERE workspace_id = $1", [first.id, JSON.stringify(state)]);
    const restarted = new LocalStore(new PostgresWorkspacePersistence({ pool, migrationMode: "verify", migrationsDirectory }));
    await expect(restarted.listWorkspaces(actor.identityId)).resolves.toEqual([]);
    await expect(restarted.requireAuthorization(actor, first.id, "workspace.read", "WORKSPACE", first.id)).rejects.toThrow("not available");
    await expect(persistence.verifyInvariants()).rejects.toThrow("workspace scope mismatch");
  });
});

describe("PostgreSQL TLS configuration", () => {
  const original = { profile: process.env.DM_PROFILE, url: process.env.DM_POSTGRES_URL, tls: process.env.DM_POSTGRES_TLS };
  afterEach(() => {
    if (original.profile === undefined) delete process.env.DM_PROFILE; else process.env.DM_PROFILE = original.profile;
    if (original.url === undefined) delete process.env.DM_POSTGRES_URL; else process.env.DM_POSTGRES_URL = original.url;
    if (original.tls === undefined) delete process.env.DM_POSTGRES_TLS; else process.env.DM_POSTGRES_TLS = original.tls;
  });

  it.each(["dev", "stage", "prod"])("rejects non-verifying TLS in the %s profile", (profile) => {
    process.env.DM_PROFILE = profile;
    process.env.DM_POSTGRES_URL = "postgresql://synthetic:synthetic@example.invalid/doculyra";
    for (const mode of ["require", "disabled"]) {
      process.env.DM_POSTGRES_TLS = mode;
      expect(() => PostgresWorkspacePersistence.fromEnvironment()).toThrow("must verify");
    }
  });

  it("rejects connection-string TLS downgrades and accepts explicit verify-full", async () => {
    process.env.DM_PROFILE = "prod";
    process.env.DM_POSTGRES_TLS = "verify-full";
    process.env.DM_POSTGRES_URL = "postgresql://synthetic:synthetic@example.invalid/doculyra?sslmode=require";
    expect(() => PostgresWorkspacePersistence.fromEnvironment()).toThrow("cannot override");
    process.env.DM_POSTGRES_URL = "postgresql://synthetic:synthetic@example.invalid/doculyra?sslmode=verify-full";
    const persistence = PostgresWorkspacePersistence.fromEnvironment();
    await persistence.close();
  });
});
