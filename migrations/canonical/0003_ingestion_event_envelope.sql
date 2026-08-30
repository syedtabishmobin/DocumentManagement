ALTER TABLE doculyra.authority_outbox
  DROP CONSTRAINT IF EXISTS authority_outbox_aggregate_type_check;

ALTER TABLE doculyra.authority_outbox
  ADD CONSTRAINT authority_outbox_aggregate_type_check
  CHECK (aggregate_type IN ('WORKSPACE_AUTHORITY', 'IngestionCase'));

ALTER TABLE doculyra.authority_outbox
  ADD COLUMN IF NOT EXISTS event_envelope jsonb;

ALTER TABLE doculyra.authority_outbox
  ADD CONSTRAINT authority_outbox_ingestion_envelope_check
  CHECK (
    (aggregate_type = 'WORKSPACE_AUTHORITY' AND event_envelope IS NULL)
    OR
    (aggregate_type = 'IngestionCase' AND event_type = 'EVT-P1-006' AND event_envelope IS NOT NULL)
  );

CREATE INDEX authority_outbox_domain_event_idx
  ON doculyra.authority_outbox (workspace_id, event_type, aggregate_id, aggregate_revision);
