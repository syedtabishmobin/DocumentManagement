import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from "pg";
import type {
  AuthorityOutboxEvent,
  WorkspaceCreationReceipt,
  WorkspaceDatabase,
  WorkspacePersistence,
  WorkspaceState,
} from "./workspace-state.js";

type SqlClient = Pick<PoolClient, "query" | "release">;
type SqlPool = Pick<Pool, "connect" | "end">;

export interface PersistenceOptions {
  pool: SqlPool;
  migrationMode: "apply" | "verify";
  migrationsDirectory?: string;
}

interface MigrationFile {
  version: string;
  checksum: string;
  sql: string;
}

interface WorkspaceRow extends QueryResultRow { workspace_id: string; storage_revision: string | number; state: WorkspaceState }
interface ReceiptRow extends QueryResultRow {
  identity_id: string;
  idempotency_key_hash: string;
  request_fingerprint: string;
  workspace_id: string;
  created_at: Date | string;
}
interface OutboxRow extends QueryResultRow {
  event_id: string;
  workspace_id: string;
  aggregate_type: "WORKSPACE_AUTHORITY";
  aggregate_id: string;
  aggregate_revision: string | number;
  event_type: string;
  schema_version: 1;
  correlation_id: string;
  actor_id: string;
  resource_type: AuthorityOutboxEvent["resourceType"];
  resource_id: string | null;
  occurred_at: Date | string;
}

const MIGRATION_LOCK_ID = 7_640_921;
const MUTATION_LOCK_ID = 7_640_922;
const defaultMigrationsDirectory = fileURLToPath(new URL("../../../../migrations/canonical", import.meta.url));

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function connectionConfig(): PoolConfig {
  const connectionString = process.env.DM_POSTGRES_URL;
  if (!connectionString) throw new Error("DM_POSTGRES_URL is required when DM_AUTHORITY_STORE=postgres");
  const tlsMode = process.env.DM_POSTGRES_TLS ?? "verify-full";
  if (!new Set(["verify-full", "require", "disabled"]).has(tlsMode)) throw new Error("DM_POSTGRES_TLS must be verify-full, require, or disabled");
  if (tlsMode === "disabled" && (process.env.DM_PROFILE ?? "local") !== "local") throw new Error("PostgreSQL TLS cannot be disabled outside the local profile");
  return {
    connectionString,
    application_name: "doculyra-api",
    max: Number(process.env.DM_POSTGRES_POOL_MAX ?? "10"),
    statement_timeout: Number(process.env.DM_POSTGRES_STATEMENT_TIMEOUT_MS ?? "5000"),
    connectionTimeoutMillis: Number(process.env.DM_POSTGRES_CONNECT_TIMEOUT_MS ?? "5000"),
    ...(tlsMode === "disabled" ? {} : { ssl: { rejectUnauthorized: tlsMode === "verify-full" } }),
  };
}

async function migrationFiles(directory: string): Promise<MigrationFile[]> {
  const names = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  return Promise.all(names.map(async (version) => {
    const sql = await readFile(resolve(directory, version), "utf8");
    return { version, sql, checksum: createHash("sha256").update(sql).digest("hex") };
  }));
}

function databaseFromRows(workspaces: WorkspaceRow[], receipts: ReceiptRow[], outbox: OutboxRow[]): WorkspaceDatabase {
  return {
    schemaVersion: 3,
    workspaces: workspaces.map((row) => row.state),
    workspaceCreationReceipts: receipts.map((row) => ({
      identityId: row.identity_id,
      idempotencyKeyHash: row.idempotency_key_hash,
      requestFingerprint: row.request_fingerprint,
      workspaceId: row.workspace_id,
      createdAt: iso(row.created_at),
    })),
    authorityOutbox: outbox.map((row) => ({
      id: row.event_id,
      workspaceId: row.workspace_id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      aggregateRevision: Number(row.aggregate_revision),
      eventType: row.event_type,
      schemaVersion: row.schema_version,
      correlationId: row.correlation_id,
      actorId: row.actor_id,
      resourceType: row.resource_type,
      ...(row.resource_id ? { resourceId: row.resource_id } : {}),
      occurredAt: iso(row.occurred_at),
    })),
  };
}

function validateDatabase(database: WorkspaceDatabase): void {
  const workspaceIds = new Set(database.workspaces.map((state) => state.workspace.id));
  if (workspaceIds.size !== database.workspaces.length) throw new Error("Duplicate workspace identity in persistence transaction");
  for (const state of database.workspaces) {
    const owners = state.ownerBindings.filter((binding) => binding.state === "ACTIVE");
    const ownerMembers = state.members.filter((member) => member.role === "OWNER" && member.state === "ACTIVE");
    if (owners.length !== 1 || ownerMembers.length !== 1) throw new Error(`Workspace authority invariant failed for ${state.workspace.id}`);
    if (owners[0]!.ownerMembershipId !== ownerMembers[0]!.id) throw new Error(`Workspace owner binding mismatch for ${state.workspace.id}`);
    if (!state.accessGrants.some((grant) => grant.state === "ACTIVE" && grant.granteeIdentityId === owners[0]!.ownerIdentityId)) throw new Error(`Workspace owner grant missing for ${state.workspace.id}`);
  }
  for (const receipt of database.workspaceCreationReceipts) if (!workspaceIds.has(receipt.workspaceId)) throw new Error("Workspace creation receipt references an unavailable workspace");
  for (const event of database.authorityOutbox) if (!workspaceIds.has(event.workspaceId)) throw new Error("Authority outbox event references an unavailable workspace");
}

class SerializationConflict extends Error {
  readonly code = "40001";
}

interface StoredSnapshot {
  database: WorkspaceDatabase;
  revisions: Map<string, number>;
  stateDigests: Map<string, string>;
}

export class PostgresWorkspacePersistence implements WorkspacePersistence {
  private readonly pool: SqlPool;
  private readonly migrationMode: "apply" | "verify";
  private readonly migrationsDirectory: string;
  private ready?: Promise<void>;
  private mutationChain: Promise<unknown> = Promise.resolve();

  constructor(options: PersistenceOptions) {
    this.pool = options.pool;
    this.migrationMode = options.migrationMode;
    this.migrationsDirectory = options.migrationsDirectory ?? defaultMigrationsDirectory;
  }

  static fromEnvironment(modeOverride?: "apply" | "verify"): PostgresWorkspacePersistence {
    const migrationMode = modeOverride ?? process.env.DM_POSTGRES_MIGRATIONS ?? "verify";
    if (migrationMode !== "apply" && migrationMode !== "verify") throw new Error("DM_POSTGRES_MIGRATIONS must be apply or verify");
    return new PostgresWorkspacePersistence({ pool: new Pool(connectionConfig()), migrationMode });
  }

  private ensureReady(): Promise<void> {
    this.ready ??= this.prepare();
    return this.ready;
  }

  private async prepare(): Promise<void> {
    const files = await migrationFiles(this.migrationsDirectory);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK_ID]);
      await client.query("CREATE SCHEMA IF NOT EXISTS doculyra");
      await client.query("CREATE TABLE IF NOT EXISTS doculyra.schema_migrations (version text PRIMARY KEY, checksum_sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)");
      const applied = await client.query<{ version: string; checksum_sha256: string }>("SELECT version, checksum_sha256 FROM doculyra.schema_migrations ORDER BY version");
      const appliedByVersion = new Map(applied.rows.map((row) => [row.version, row.checksum_sha256]));
      for (const file of files) {
        const checksum = appliedByVersion.get(file.version);
        if (checksum && checksum !== file.checksum) throw new Error(`Migration checksum drift detected: ${file.version}`);
        if (!checksum) {
          if (this.migrationMode !== "apply") throw new Error(`Required PostgreSQL migration is not applied: ${file.version}`);
          await client.query(file.sql);
          await client.query("INSERT INTO doculyra.schema_migrations(version, checksum_sha256) VALUES ($1, $2)", [file.version, file.checksum]);
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async snapshot(client: SqlClient): Promise<StoredSnapshot> {
    const [workspaces, receipts, outbox] = await Promise.all([
      client.query<WorkspaceRow>("SELECT workspace_id, storage_revision, state FROM doculyra.workspace_state ORDER BY workspace_id"),
      client.query<ReceiptRow>("SELECT identity_id, idempotency_key_hash, request_fingerprint, workspace_id, created_at FROM doculyra.workspace_creation_receipt ORDER BY identity_id, idempotency_key_hash"),
      client.query<OutboxRow>("SELECT event_id, workspace_id, aggregate_type, aggregate_id, aggregate_revision, event_type, schema_version, correlation_id, actor_id, resource_type, resource_id, occurred_at FROM doculyra.authority_outbox ORDER BY occurred_at, event_id"),
    ]);
    return {
      database: databaseFromRows(workspaces.rows, receipts.rows, outbox.rows),
      revisions: new Map(workspaces.rows.map((row) => [row.workspace_id, Number(row.storage_revision)])),
      stateDigests: new Map(workspaces.rows.map((row) => [row.workspace_id, createHash("sha256").update(JSON.stringify(row.state)).digest("hex")])),
    };
  }

  async read(): Promise<WorkspaceDatabase> {
    await this.ensureReady();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const { database } = await this.snapshot(client);
      await client.query("COMMIT");
      return database;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async persist(client: SqlClient, database: WorkspaceDatabase, previous?: StoredSnapshot): Promise<void> {
    validateDatabase(database);
    for (const state of database.workspaces) {
      const encoded = JSON.stringify(state);
      const priorRevision = previous?.revisions.get(state.workspace.id);
      if (priorRevision === undefined) {
        const inserted = await client.query(
          "INSERT INTO doculyra.workspace_state(workspace_id, storage_revision, state) VALUES ($1, 1, $2::jsonb) ON CONFLICT (workspace_id) DO NOTHING RETURNING workspace_id",
          [state.workspace.id, encoded],
        );
        if (inserted.rowCount !== 1) throw new SerializationConflict("Concurrent workspace creation requires replay");
        continue;
      }
      const digest = createHash("sha256").update(encoded).digest("hex");
      if (previous?.stateDigests.get(state.workspace.id) === digest) continue;
      const updated = await client.query(
        `UPDATE doculyra.workspace_state
         SET state = $2::jsonb, storage_revision = storage_revision + 1, updated_at = CURRENT_TIMESTAMP
         WHERE workspace_id = $1 AND storage_revision = $3
         RETURNING workspace_id`,
        [state.workspace.id, encoded, priorRevision],
      );
      if (updated.rowCount !== 1) throw new SerializationConflict("Concurrent workspace update requires replay");
    }
    for (const receipt of database.workspaceCreationReceipts) await this.persistReceipt(client, receipt);
    for (const event of database.authorityOutbox) await this.persistOutbox(client, event);
  }

  private async persistReceipt(client: SqlClient, receipt: WorkspaceCreationReceipt): Promise<void> {
    const inserted = await client.query<{ request_fingerprint: string; workspace_id: string }>(
      `INSERT INTO doculyra.workspace_creation_receipt(identity_id, idempotency_key_hash, request_fingerprint, workspace_id, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (identity_id, idempotency_key_hash) DO UPDATE
       SET request_fingerprint = doculyra.workspace_creation_receipt.request_fingerprint
       RETURNING request_fingerprint, workspace_id`,
      [receipt.identityId, receipt.idempotencyKeyHash, receipt.requestFingerprint, receipt.workspaceId, receipt.createdAt],
    );
    const row = inserted.rows[0];
    if (!row || row.request_fingerprint !== receipt.requestFingerprint || row.workspace_id !== receipt.workspaceId) throw new SerializationConflict("Concurrent workspace creation receipt requires replay");
  }

  private async persistOutbox(client: SqlClient, event: AuthorityOutboxEvent): Promise<void> {
    await client.query(
      `INSERT INTO doculyra.authority_outbox(event_id, workspace_id, aggregate_type, aggregate_id, aggregate_revision, event_type, schema_version, correlation_id, actor_id, resource_type, resource_id, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (event_id) DO NOTHING`,
      [event.id, event.workspaceId, event.aggregateType, event.aggregateId, event.aggregateRevision, event.eventType, event.schemaVersion, event.correlationId, event.actorId, event.resourceType, event.resourceId ?? null, event.occurredAt],
    );
  }

  private async transact<T>(operation: (database: WorkspaceDatabase) => Promise<T> | T): Promise<T> {
    await this.ensureReady();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        const snapshot = await this.snapshot(client);
        const result = await operation(snapshot.database);
        await this.persist(client, snapshot.database, snapshot);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        const code = (error as { code?: string }).code;
        if (attempt < 3 && (code === "40001" || code === "40P01")) continue;
        throw error;
      } finally {
        client.release();
      }
    }
    throw new Error("PostgreSQL authority transaction retry budget exhausted");
  }

  async mutate<T>(operation: (database: WorkspaceDatabase) => Promise<T> | T): Promise<T> {
    const run = this.mutationChain.then(() => this.transact(operation));
    this.mutationChain = run.then(() => undefined, () => undefined);
    return run;
  }

  async importSynthetic(database: WorkspaceDatabase, sourceSha256: string): Promise<{ migrationRunId: string; reused: boolean }> {
    await this.ensureReady();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      await client.query("SELECT pg_advisory_xact_lock($1)", [MUTATION_LOCK_ID]);
      const prior = await client.query<{ migration_run_id: string }>("SELECT migration_run_id FROM doculyra.authority_migration_run WHERE source_kind = 'LOCAL_SYNTHETIC_JSON' AND source_sha256 = $1", [sourceSha256]);
      if (prior.rows[0]) {
        await client.query("COMMIT");
        return { migrationRunId: prior.rows[0].migration_run_id, reused: true };
      }
      const current = await this.snapshot(client);
      if (current.database.workspaces.length || current.database.workspaceCreationReceipts.length || current.database.authorityOutbox.length) throw new Error("Synthetic import requires an empty PostgreSQL authority store");
      const migrationRunId = randomUUID();
      const startedAt = new Date().toISOString();
      await client.query(
        "INSERT INTO doculyra.authority_migration_run(migration_run_id, source_kind, source_sha256, status, workspace_count, receipt_count, outbox_count, started_at) VALUES ($1, 'LOCAL_SYNTHETIC_JSON', $2, 'STARTED', $3, $4, $5, $6)",
        [migrationRunId, sourceSha256, database.workspaces.length, database.workspaceCreationReceipts.length, database.authorityOutbox.length, startedAt],
      );
      await this.persist(client, database);
      const verified = (await this.snapshot(client)).database;
      validateDatabase(verified);
      if (verified.workspaces.length !== database.workspaces.length || verified.workspaceCreationReceipts.length !== database.workspaceCreationReceipts.length || verified.authorityOutbox.length !== database.authorityOutbox.length) throw new Error("Synthetic import verification count mismatch");
      await client.query("UPDATE doculyra.authority_migration_run SET status = 'VERIFIED', completed_at = CURRENT_TIMESTAMP WHERE migration_run_id = $1", [migrationRunId]);
      await client.query("COMMIT");
      return { migrationRunId, reused: false };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyInvariants(): Promise<{ workspaces: number; receipts: number; outbox: number }> {
    const database = await this.read();
    validateDatabase(database);
    return { workspaces: database.workspaces.length, receipts: database.workspaceCreationReceipts.length, outbox: database.authorityOutbox.length };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
