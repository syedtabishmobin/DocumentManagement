CREATE SCHEMA IF NOT EXISTS doculyra;

CREATE TABLE IF NOT EXISTS doculyra.schema_migrations (
  version text PRIMARY KEY,
  checksum_sha256 text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doculyra.workspace_state (
  workspace_id text PRIMARY KEY,
  storage_revision bigint NOT NULL DEFAULT 1 CHECK (storage_revision > 0),
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doculyra.workspace_creation_receipt (
  identity_id text NOT NULL,
  idempotency_key_hash text NOT NULL,
  request_fingerprint text NOT NULL,
  workspace_id text NOT NULL REFERENCES doculyra.workspace_state(workspace_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (identity_id, idempotency_key_hash)
);

CREATE INDEX IF NOT EXISTS workspace_creation_receipt_workspace_idx
  ON doculyra.workspace_creation_receipt (workspace_id);

CREATE TABLE IF NOT EXISTS doculyra.authority_outbox (
  event_id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES doculyra.workspace_state(workspace_id) ON DELETE RESTRICT,
  aggregate_type text NOT NULL CHECK (aggregate_type = 'WORKSPACE_AUTHORITY'),
  aggregate_id text NOT NULL,
  aggregate_revision bigint NOT NULL CHECK (aggregate_revision > 0),
  event_type text NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version = 1),
  correlation_id text NOT NULL,
  actor_id text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  occurred_at timestamptz NOT NULL,
  published_at timestamptz,
  publication_attempts integer NOT NULL DEFAULT 0 CHECK (publication_attempts >= 0),
  last_error_code text
);

CREATE INDEX IF NOT EXISTS authority_outbox_pending_idx
  ON doculyra.authority_outbox (occurred_at, event_id)
  WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS doculyra.authority_migration_run (
  migration_run_id text PRIMARY KEY,
  source_kind text NOT NULL,
  source_sha256 text NOT NULL,
  status text NOT NULL CHECK (status IN ('STARTED', 'VERIFIED', 'REPAIR_REQUIRED')),
  workspace_count integer NOT NULL CHECK (workspace_count >= 0),
  receipt_count integer NOT NULL CHECK (receipt_count >= 0),
  outbox_count integer NOT NULL CHECK (outbox_count >= 0),
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  UNIQUE (source_kind, source_sha256)
);
