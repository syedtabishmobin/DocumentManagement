ALTER TABLE doculyra.authority_outbox
  DROP CONSTRAINT authority_outbox_aggregate_type_check;

ALTER TABLE doculyra.authority_outbox
  ADD CONSTRAINT authority_outbox_aggregate_type_check
  CHECK (aggregate_type IN ('WORKSPACE_AUTHORITY', 'IngestionCase', 'ArtifactRecord', 'LogicalDocument'));

ALTER TABLE doculyra.authority_outbox
  DROP CONSTRAINT authority_outbox_domain_envelope_check;

ALTER TABLE doculyra.authority_outbox
  ADD CONSTRAINT authority_outbox_domain_envelope_check
  CHECK (
    (aggregate_type = 'WORKSPACE_AUTHORITY' AND event_envelope IS NULL)
    OR
    (aggregate_type = 'IngestionCase' AND event_type = 'EVT-P1-006' AND event_envelope IS NOT NULL)
    OR
    (aggregate_type = 'ArtifactRecord' AND event_type = 'EVT-P1-007' AND event_envelope IS NOT NULL)
    OR
    (aggregate_type = 'LogicalDocument' AND event_type = 'EVT-P1-009' AND event_envelope IS NOT NULL)
  );
