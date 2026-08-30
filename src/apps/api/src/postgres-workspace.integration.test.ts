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

integration.sequential("PostgreSQL workspace authority integration", () => {
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
    // Deployment applies migrations before verify-only runtime instances start.
    // Exercise concurrent migration applicants explicitly, then bind runtime
    // concurrency to the fully migrated schema so verify cannot race first apply.
    const concurrentApplicant = new PostgresWorkspacePersistence({ pool, migrationMode: "apply", migrationsDirectory });
    await Promise.all([firstPersistence.read(), concurrentApplicant.read()]);

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

    const createFence = await firstStore.startAuthorization(actor, first.id, "subject.create", "WORKSPACE");
    const person = await firstStore.createPerson(first.id, actor, {
      displayName: "Synthetic Concurrent Person", kind: "ADULT", relationship: "Family member", loginEnabled: false,
      role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false },
    }, createFence, "corr-real-postgres-person-create");
    const update = (displayName: string) => ({
      displayName, kind: "ADULT" as const, relationship: "Family member", loginEnabled: false,
      role: "ADULT_MEMBER" as const, permissions: { view: true, add: false, edit: false, delete: false },
    });
    const [firstUpdateFence, secondUpdateFence] = await Promise.all([
      firstStore.startAuthorization(actor, first.id, "subject.edit", "WORKSPACE"),
      secondStore.startAuthorization(actor, first.id, "subject.edit", "WORKSPACE"),
    ]);
    const outcomes = await Promise.allSettled([
      firstStore.updatePerson(first.id, actor, person.id, person.revision, update("Synthetic Concurrent Person A"), firstUpdateFence, "corr-real-postgres-person-update-a"),
      secondStore.updatePerson(first.id, actor, person.id, person.revision, update("Synthetic Concurrent Person B"), secondUpdateFence, "corr-real-postgres-person-update-b"),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    const afterConcurrentUpdate = await firstPersistence.read();
    const authority = afterConcurrentUpdate.workspaces.find((state) => state.workspace.id === first.id)!;
    expect(authority.subjects.find((subject) => subject.id === person.id)?.revision).toBe(2);
    expect(authority.audit.filter((record) => record.type === "PERSON_UPDATED")).toHaveLength(1);
    expect(authority.audit.filter((record) => record.type === "PERSON_CHANGE_REJECTED")).toHaveLength(1);

    const canonicalFence = await firstStore.startAuthorization(actor, first.id, "subject.create", "WORKSPACE");
    const canonicalSubject = await firstStore.createCanonicalSubject(first.id, actor, authority.workspace.revision, "real-postgres-subject-command-0001", { subject_kind: "PERSON", authority_basis_ref: "authority-basis-synthetic-001" }, canonicalFence, "corr-real-postgres-subject");
    const replayFence = await secondStore.startAuthorization(actor, first.id, "subject.create", "WORKSPACE");
    const replayedCanonicalSubject = await secondStore.createCanonicalSubject(first.id, actor, authority.workspace.revision, "real-postgres-subject-command-0001", { subject_kind: "PERSON", authority_basis_ref: "authority-basis-synthetic-001" }, replayFence, "corr-real-postgres-replay");
    expect(replayedCanonicalSubject.id).toBe(canonicalSubject.id);
    const afterCommandReplay = await firstPersistence.read();
    expect(afterCommandReplay.workspaces.find((state) => state.workspace.id === first.id)!.authorityCommandReceipts).toEqual([
      expect.objectContaining({ operationId: "API-P1-105", resourceId: canonicalSubject.id }),
    ]);

    await expect(firstPersistence.mutate((database) => {
      database.workspaces.find((state) => state.workspace.id === first.id)!.accessGrants[0]!.workspaceId = foreign.id;
    })).rejects.toThrow("workspace scope mismatch");

    await expect(firstPersistence.mutate((database) => {
      database.workspaceCreationReceipts.push({ identityId: actor.identityId, idempotencyKeyHash: "partial", requestFingerprint: "partial", workspaceId: "missing", createdAt: new Date().toISOString() });
      throw new Error("synthetic transaction interruption");
    })).rejects.toThrow("synthetic transaction interruption");

    const restarted = new LocalStore(new PostgresWorkspacePersistence({ pool, migrationMode: "verify", migrationsDirectory }));
    expect(await restarted.listWorkspaces(actor.identityId)).toEqual([expect.objectContaining({ id: first.id })]);
    await expect(firstPersistence.verifyInvariants()).resolves.toEqual({ workspaces: 2, receipts: 2, outbox: 6 });

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

  it("persists policy epoch and effect evidence for bounded grant revocation on real PostgreSQL", async () => {
    const store = new LocalStore(firstPersistence);
    const workspace = await store.createWorkspace(actor, "Authorization evidence household", "FAMILY", "real-postgres-authorization-0001");
    const createFence = await store.startAuthorization(actor, workspace.id, "grant.create", "WORKSPACE", workspace.id, { correlationId: "corr-real-postgres-grant-create-auth" });
    const grant = await store.createAccessGrant(workspace.id, actor, "real-postgres-grant-create-0001", {
      grantee_ref: actor.identityId, purpose_id: "PUR-P1-001",
      scope: { resource_refs: [workspace.id], field_refs: [], edge_refs: [], actions: ["workspace.read"], allow_export: false, allow_onward_delegation: false },
      valid_from: new Date(Date.now() - 60_000).toISOString(), valid_to: null, policy_version: "policy.local-explicit-grant@0.2",
    }, createFence, "corr-real-postgres-grant-create");
    const queuedFence = await store.startAuthorization(actor, workspace.id, "workspace.read", "WORKSPACE", workspace.id, { correlationId: "corr-real-postgres-queued" });
    const revokeFence = await store.startAuthorization(actor, workspace.id, "grant.revoke", "WORKSPACE", workspace.id, { correlationId: "corr-real-postgres-grant-revoke-auth" });
    await store.revokeAccessGrant(workspace.id, actor, grant.id, 1, "real-postgres-grant-revoke-0001", "USER_REQUEST", revokeFence, "corr-real-postgres-grant-revoke");
    await expect(store.reauthorize(queuedFence, actor, "OUTPUT", "corr-real-postgres-stale-output")).rejects.toThrow("not available");

    const restarted = new LocalStore(new PostgresWorkspacePersistence({ pool, migrationMode: "verify", migrationsDirectory }));
    await expect(restarted.requireAuthorization(actor, workspace.id, "workspace.read", "WORKSPACE", workspace.id)).resolves.toBeUndefined();
    const outbox = await pool.query<{ policy_version: string; authorization_epoch: string; authorization_phase: string; decision_reason: string }>(
      "SELECT policy_version, authorization_epoch, authorization_phase, decision_reason FROM doculyra.authority_outbox WHERE event_type = 'ACCESS_GRANT_REVOKED'",
    );
    expect(outbox.rows).toEqual([expect.objectContaining({ policy_version: "policy.local-explicit-grant@0.2", authorization_phase: "EFFECT", decision_reason: "EXPLICIT_GRANT" })]);
    expect(Number(outbox.rows[0]!.authorization_epoch)).toBeGreaterThan(createFence.authorizationEpoch);
  });
});
