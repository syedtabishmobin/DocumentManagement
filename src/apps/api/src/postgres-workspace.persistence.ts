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
import { normalizeAuthorityLifecycle } from "./workspace-state.js";

type SqlClient = Pick<PoolClient, "query" | "release">;
interface SqlPool {
  connect(): Promise<SqlClient>;
  end(): Promise<void>;
}

export interface PersistenceOptions {
  pool: SqlPool;
  migrationMode: "apply" | "verify";
  migrationsDirectory?: string;
  transactionRetry?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    sleep?: (delayMs: number) => Promise<void>;
  };
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
  aggregate_type: AuthorityOutboxEvent["aggregateType"];
  aggregate_id: string;
  aggregate_revision: string | number;
  event_type: string;
  schema_version: 1;
  correlation_id: string;
  actor_id: string;
  resource_type: AuthorityOutboxEvent["resourceType"];
  resource_id: string | null;
  policy_version: string | null;
  authorization_epoch: string | number | null;
  authorization_phase: AuthorityOutboxEvent["authorizationPhase"] | null;
  decision_reason: string | null;
  event_envelope: Record<string, unknown> | null;
  occurred_at: Date | string;
}

const MIGRATION_LOCK_ID = 7_640_921;
const MUTATION_LOCK_ID = 7_640_922;
const DEFAULT_TRANSACTION_RETRY_MAX_ATTEMPTS = 6;
const DEFAULT_TRANSACTION_RETRY_BASE_DELAY_MS = 10;
const DEFAULT_TRANSACTION_RETRY_MAX_DELAY_MS = 80;
const defaultMigrationsDirectory = fileURLToPath(new URL("../../../../migrations/canonical", import.meta.url));

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function connectionConfig(): PoolConfig {
  const connectionString = process.env.DM_POSTGRES_URL;
  if (!connectionString) throw new Error("DM_POSTGRES_URL is required when DM_AUTHORITY_STORE=postgres");
  const tlsMode = process.env.DM_POSTGRES_TLS ?? "verify-full";
  if (!new Set(["verify-full", "require", "disabled"]).has(tlsMode)) throw new Error("DM_POSTGRES_TLS must be verify-full, require, or disabled");
  const profile = process.env.DM_PROFILE ?? "local";
  if (profile !== "local" && tlsMode !== "verify-full") throw new Error("PostgreSQL TLS must verify the server certificate outside the local profile");
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("DM_POSTGRES_URL must be a valid PostgreSQL URL");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") throw new Error("DM_POSTGRES_URL must use the PostgreSQL protocol");
  const embeddedMode = parsed.searchParams.get("sslmode");
  if (embeddedMode && embeddedMode !== tlsMode) throw new Error("DM_POSTGRES_URL cannot override DM_POSTGRES_TLS");
  parsed.searchParams.delete("sslmode");
  for (const option of ["sslcert", "sslkey", "sslrootcert"]) {
    if (parsed.searchParams.has(option)) throw new Error(`DM_POSTGRES_URL cannot configure ${option}; use the approved runtime trust route`);
  }
  return {
    connectionString: parsed.toString(),
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
    workspaces: workspaces.map((row) => normalizeAuthorityLifecycle(row.state)),
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
      ...(row.policy_version ? { policyVersion: row.policy_version } : {}),
      ...(row.authorization_epoch !== null ? { authorizationEpoch: Number(row.authorization_epoch) } : {}),
      ...(row.authorization_phase ? { authorizationPhase: row.authorization_phase } : {}),
      ...(row.decision_reason ? { decisionReason: row.decision_reason } : {}),
      ...(row.event_envelope ? { eventEnvelope: row.event_envelope } : {}),
      occurredAt: iso(row.occurred_at),
    })),
  };
}

function assertUniqueIds(items: Array<{ id: string }>, kind: string, workspaceId: string): void {
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) throw new Error(`Duplicate ${kind} identity in workspace ${workspaceId}`);
}

function assertWorkspaceScope(items: Array<{ workspaceId: string }>, kind: string, workspaceId: string): void {
  if (items.some((item) => item.workspaceId !== workspaceId)) throw new Error(`${kind} workspace scope mismatch for ${workspaceId}`);
}

function validateWorkspaceState(state: WorkspaceState): void {
  const workspaceId = state.workspace.id;
  const scopedCollections: Array<[Array<{ workspaceId: string; id: string }>, string]> = [
    [state.ownerBindings, "owner binding"],
    [state.documents, "document"],
    [state.artifacts, "artifact"],
    [state.documentVersions, "document version"],
    [state.artifactAccessGrants, "artifact access grant"],
    [state.facts, "fact"],
    [state.tasks, "task"],
    [state.notifications, "notification"],
    [state.members, "membership"],
    [state.subjects, "subject"],
    [state.subjectIdentityLinks, "subject identity link"],
    [state.accessGrants, "access grant"],
    [state.audit, "audit record"],
    [state.dependencies, "dependency"],
    [state.ingestionCases, "ingestion case"],
    [state.policyBlockedCases, "policy-blocked case"],
    [state.authorityCommandReceipts, "authority command receipt"],
  ];
  for (const [items, kind] of scopedCollections) {
    assertUniqueIds(items, kind, workspaceId);
    assertWorkspaceScope(items, kind, workspaceId);
  }
  if (state.authorizationEpoch.workspaceId !== workspaceId || state.authorizationEpoch.value < 1) throw new Error(`Authorization epoch scope mismatch for ${workspaceId}`);

  const subjects = new Map(state.subjects.map((subject) => [subject.id, subject]));
  const documents = new Set(state.documents.map((document) => document.id));
  const artifacts = new Set(state.artifacts.map((artifact) => artifact.id));
  const documentVersions = new Set(state.documentVersions.map((version) => version.id));
  const tasks = new Set(state.tasks.map((task) => task.id));
  const owners = state.ownerBindings.filter((binding) => binding.state === "ACTIVE");
  const ownerMembers = state.members.filter((member) => member.role === "OWNER" && member.state === "ACTIVE");
  if (owners.length !== 1 || ownerMembers.length !== 1) throw new Error(`Workspace authority invariant failed for ${workspaceId}`);
  const ownerBinding = owners[0]!;
  const ownerMember = ownerMembers[0]!;
  if (state.workspace.ownerBindingId !== ownerBinding.id || ownerBinding.ownerMembershipId !== ownerMember.id) throw new Error(`Workspace owner binding mismatch for ${workspaceId}`);
  if (!ownerMember.identityId || ownerBinding.ownerIdentityId !== ownerMember.identityId) throw new Error(`Workspace owner identity mismatch for ${workspaceId}`);
  const ownerSubject = subjects.get(ownerMember.subjectId);
  if (!ownerSubject || ownerSubject.kind !== "OWNER" || ownerSubject.status !== "ACTIVE") throw new Error(`Workspace owner subject mismatch for ${workspaceId}`);
  if (!state.subjectIdentityLinks.some((link) => link.state === "ACTIVE" && link.subjectId === ownerSubject.id && link.identityId === ownerBinding.ownerIdentityId)) throw new Error(`Workspace owner identity link missing for ${workspaceId}`);

  for (const member of state.members) if (!subjects.has(member.subjectId)) throw new Error(`Membership subject reference missing for ${workspaceId}`);
  for (const link of state.subjectIdentityLinks) if (!subjects.has(link.subjectId)) throw new Error(`Subject identity link reference missing for ${workspaceId}`);
  for (const document of state.documents) if (document.subjectIds.some((subjectId) => !subjects.has(subjectId))) throw new Error(`Document subject reference missing for ${workspaceId}`);
  for (const version of state.documentVersions) if (!documents.has(version.documentId) || !artifacts.has(version.artifactId)) throw new Error(`Document version reference missing for ${workspaceId}`);
  for (const grant of state.artifactAccessGrants) if (!documents.has(grant.documentId) || !documentVersions.has(grant.documentVersionId) || !artifacts.has(grant.artifactId)) throw new Error(`Artifact access grant reference missing for ${workspaceId}`);
  for (const fact of state.facts) {
    if (!documents.has(fact.documentId) || fact.subjectIds.some((subjectId) => !subjects.has(subjectId))) throw new Error(`Fact reference missing for ${workspaceId}`);
  }
  for (const task of state.tasks) if (task.documentId && !documents.has(task.documentId)) throw new Error(`Task document reference missing for ${workspaceId}`);
  for (const dependency of state.dependencies) if (!documents.has(dependency.evidenceDocumentId)) throw new Error(`Dependency evidence reference missing for ${workspaceId}`);

  for (const grant of state.accessGrants) {
    const resourceIds = grant.resourceKind === "WORKSPACE" ? new Set([workspaceId])
      : grant.resourceKind === "DOCUMENT" ? documents
        : grant.resourceKind === "SUBJECT" ? new Set(subjects.keys())
          : tasks;
    if (!grant.resourceIds.length || grant.resourceIds.some((resourceId) => !resourceIds.has(resourceId))) throw new Error(`Access grant resource scope mismatch for ${workspaceId}`);
  }
  if (!state.accessGrants.some((grant) =>
    grant.state === "ACTIVE" &&
    grant.granteeIdentityId === ownerBinding.ownerIdentityId &&
    grant.resourceKind === "WORKSPACE" &&
    grant.resourceIds.includes(workspaceId) &&
    grant.actions.includes("workspace.admin")
  )) throw new Error(`Workspace owner grant missing for ${workspaceId}`);
}

function validateDatabase(database: WorkspaceDatabase): void {
  const workspaceIds = new Set(database.workspaces.map((state) => state.workspace.id));
  if (workspaceIds.size !== database.workspaces.length) throw new Error("Duplicate workspace identity in persistence transaction");
  for (const state of database.workspaces) validateWorkspaceState(state);
  const globallyUniqueCollections: Array<[string, (state: WorkspaceState) => Array<{ id: string }>]> = [
    ["owner binding", (state) => state.ownerBindings],
    ["document", (state) => state.documents],
    ["artifact", (state) => state.artifacts],
    ["document version", (state) => state.documentVersions],
    ["artifact access grant", (state) => state.artifactAccessGrants],
    ["fact", (state) => state.facts],
    ["task", (state) => state.tasks],
    ["notification", (state) => state.notifications],
    ["membership", (state) => state.members],
    ["subject", (state) => state.subjects],
    ["subject identity link", (state) => state.subjectIdentityLinks],
    ["access grant", (state) => state.accessGrants],
    ["audit record", (state) => state.audit],
    ["dependency", (state) => state.dependencies],
    ["policy-blocked case", (state) => state.policyBlockedCases],
  ];
  for (const [kind, records] of globallyUniqueCollections) {
    const all = database.workspaces.flatMap(records);
    if (new Set(all.map((record) => record.id)).size !== all.length) throw new Error(`Duplicate global ${kind} identity`);
  }
  const receiptKeys = new Set<string>();
  for (const receipt of database.workspaceCreationReceipts) {
    if (!workspaceIds.has(receipt.workspaceId)) throw new Error("Workspace creation receipt references an unavailable workspace");
    const key = `${receipt.identityId}\u001f${receipt.idempotencyKeyHash}`;
    if (receiptKeys.has(key)) throw new Error("Duplicate workspace creation receipt identity");
    receiptKeys.add(key);
  }
  assertUniqueIds(database.authorityOutbox, "authority outbox event", "database");
  for (const event of database.authorityOutbox) {
    if (!workspaceIds.has(event.workspaceId) || event.aggregateRevision < 1) throw new Error("Authority outbox event scope mismatch");
    if (event.aggregateType === "WORKSPACE_AUTHORITY" && event.aggregateId !== event.workspaceId) throw new Error("Authority outbox aggregate mismatch");
    if (event.aggregateType === "IngestionCase" && (event.eventType !== "EVT-P1-006" || event.eventEnvelope?.event_type !== "EVT-P1-006" || event.eventEnvelope.aggregate_id !== event.aggregateId)) throw new Error("Ingestion outbox envelope mismatch");
    if (event.aggregateType === "ArtifactRecord" && (event.eventType !== "EVT-P1-007" || event.eventEnvelope?.event_type !== "EVT-P1-007" || event.eventEnvelope.aggregate_id !== event.aggregateId)) throw new Error("Artifact integrity outbox envelope mismatch");
    if (event.aggregateType === "LogicalDocument" && (event.eventType !== "EVT-P1-009" || event.eventEnvelope?.event_type !== "EVT-P1-009" || event.eventEnvelope.aggregate_id !== event.aggregateId)) throw new Error("Document version outbox envelope mismatch");
  }
}

class SerializationConflict extends Error {
  readonly code = "40001";
}

class ImportRepairRequired extends Error {}

interface StoredSnapshot {
  database: WorkspaceDatabase;
  revisions: Map<string, number>;
  stateDigests: Map<string, string>;
}

export class PostgresWorkspacePersistence implements WorkspacePersistence {
  private readonly pool: SqlPool;
  private readonly migrationMode: "apply" | "verify";
  private readonly migrationsDirectory: string;
  private readonly transactionRetryMaxAttempts: number;
  private readonly transactionRetryBaseDelayMs: number;
  private readonly transactionRetryMaxDelayMs: number;
  private readonly transactionRetrySleep: (delayMs: number) => Promise<void>;
  private ready?: Promise<void>;
  private mutationChain: Promise<unknown> = Promise.resolve();

  constructor(options: PersistenceOptions) {
    this.pool = options.pool;
    this.migrationMode = options.migrationMode;
    this.migrationsDirectory = options.migrationsDirectory ?? defaultMigrationsDirectory;
    this.transactionRetryMaxAttempts = options.transactionRetry?.maxAttempts ?? DEFAULT_TRANSACTION_RETRY_MAX_ATTEMPTS;
    this.transactionRetryBaseDelayMs = options.transactionRetry?.baseDelayMs ?? DEFAULT_TRANSACTION_RETRY_BASE_DELAY_MS;
    this.transactionRetryMaxDelayMs = options.transactionRetry?.maxDelayMs ?? DEFAULT_TRANSACTION_RETRY_MAX_DELAY_MS;
    this.transactionRetrySleep = options.transactionRetry?.sleep ?? sleep;
    if (!Number.isInteger(this.transactionRetryMaxAttempts) || this.transactionRetryMaxAttempts < 1 || this.transactionRetryMaxAttempts > 10) throw new Error("PostgreSQL transaction retry attempts must be bounded between one and ten");
    if (!Number.isInteger(this.transactionRetryBaseDelayMs) || this.transactionRetryBaseDelayMs < 0 || this.transactionRetryBaseDelayMs > 1_000) throw new Error("PostgreSQL transaction retry base delay must be bounded between zero and 1000 milliseconds");
    if (!Number.isInteger(this.transactionRetryMaxDelayMs) || this.transactionRetryMaxDelayMs < this.transactionRetryBaseDelayMs || this.transactionRetryMaxDelayMs > 5_000) throw new Error("PostgreSQL transaction retry maximum delay must be bounded between the base delay and 5000 milliseconds");
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
      if (this.migrationMode === "apply") {
        await client.query("CREATE SCHEMA IF NOT EXISTS doculyra");
        await client.query("CREATE TABLE IF NOT EXISTS doculyra.schema_migrations (version text PRIMARY KEY, checksum_sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)");
      }
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
      client.query<OutboxRow>("SELECT event_id, workspace_id, aggregate_type, aggregate_id, aggregate_revision, event_type, schema_version, correlation_id, actor_id, resource_type, resource_id, policy_version, authorization_epoch, authorization_phase, decision_reason, event_envelope, occurred_at FROM doculyra.authority_outbox ORDER BY occurred_at, event_id"),
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
      `INSERT INTO doculyra.authority_outbox(event_id, workspace_id, aggregate_type, aggregate_id, aggregate_revision, event_type, schema_version, correlation_id, actor_id, resource_type, resource_id, policy_version, authorization_epoch, authorization_phase, decision_reason, event_envelope, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17)
       ON CONFLICT (event_id) DO NOTHING`,
      [event.id, event.workspaceId, event.aggregateType, event.aggregateId, event.aggregateRevision, event.eventType, event.schemaVersion, event.correlationId, event.actorId, event.resourceType, event.resourceId ?? null, event.policyVersion ?? null, event.authorizationEpoch ?? null, event.authorizationPhase ?? null, event.decisionReason ?? null, event.eventEnvelope ? JSON.stringify(event.eventEnvelope) : null, event.occurredAt],
    );
  }

  private async transact<T>(operation: (database: WorkspaceDatabase) => Promise<T> | T): Promise<T> {
    await this.ensureReady();
    for (let attempt = 1; attempt <= this.transactionRetryMaxAttempts; attempt += 1) {
      const client = await this.pool.connect();
      let retryableConflict = false;
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
        retryableConflict = code === "40001" || code === "40P01";
        if (!retryableConflict || attempt >= this.transactionRetryMaxAttempts) throw error;
      } finally {
        client.release();
      }
      if (retryableConflict) {
        const delayMs = Math.min(this.transactionRetryMaxDelayMs, this.transactionRetryBaseDelayMs * (2 ** (attempt - 1)));
        await this.transactionRetrySleep(delayMs);
      }
    }
    throw new Error("PostgreSQL authority transaction retry budget exhausted");
  }

  async mutate<T>(operation: (database: WorkspaceDatabase) => Promise<T> | T): Promise<T> {
    const run = this.mutationChain.then(() => this.transact(operation));
    this.mutationChain = run.then(() => undefined, () => undefined);
    return run;
  }

  async importSynthetic(database: WorkspaceDatabase, sourceSha256: string): Promise<{ migrationRunId: string; reused: boolean; status: "VERIFIED" | "ALREADY_APPLIED_AND_VERIFIED" }> {
    await this.ensureReady();
    const client = await this.pool.connect();
    let transactionOpen = false;
    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      transactionOpen = true;
      await client.query("SELECT pg_advisory_xact_lock($1)", [MUTATION_LOCK_ID]);
      const prior = await client.query<{ migration_run_id: string; status: "STARTED" | "VERIFIED" | "REPAIR_REQUIRED"; workspace_count: number; receipt_count: number; outbox_count: number }>(
        "SELECT migration_run_id, status, workspace_count, receipt_count, outbox_count FROM doculyra.authority_migration_run WHERE source_kind = 'LOCAL_SYNTHETIC_JSON' AND source_sha256 = $1",
        [sourceSha256],
      );
      const priorRun = prior.rows[0];
      if (priorRun) {
        const current = (await this.snapshot(client)).database;
        let repairReason: string | undefined;
        try {
          validateDatabase(current);
        } catch {
          repairReason = "current authority invariants failed";
        }
        if (priorRun.status !== "VERIFIED") repairReason ??= `migration ledger status is ${priorRun.status}`;
        if (current.workspaces.length < priorRun.workspace_count || current.workspaceCreationReceipts.length < priorRun.receipt_count || current.authorityOutbox.length < priorRun.outbox_count) repairReason ??= "retained migration evidence is incomplete";
        if (repairReason) {
          await client.query("UPDATE doculyra.authority_migration_run SET status = 'REPAIR_REQUIRED', completed_at = CURRENT_TIMESTAMP WHERE migration_run_id = $1", [priorRun.migration_run_id]);
          await client.query("COMMIT");
          transactionOpen = false;
          throw new ImportRepairRequired(`Synthetic import replay requires repair: ${repairReason}`);
        }
        await client.query("COMMIT");
        transactionOpen = false;
        return { migrationRunId: priorRun.migration_run_id, reused: true, status: "ALREADY_APPLIED_AND_VERIFIED" };
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
      transactionOpen = false;
      return { migrationRunId, reused: false, status: "VERIFIED" };
    } catch (error) {
      if (transactionOpen) await client.query("ROLLBACK");
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
