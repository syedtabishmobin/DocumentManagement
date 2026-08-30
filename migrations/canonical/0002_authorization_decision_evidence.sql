ALTER TABLE doculyra.authority_outbox
  ADD COLUMN policy_version text,
  ADD COLUMN authorization_epoch bigint CHECK (authorization_epoch IS NULL OR authorization_epoch > 0),
  ADD COLUMN authorization_phase text CHECK (authorization_phase IS NULL OR authorization_phase IN ('INPUT', 'CANDIDATE', 'OUTPUT', 'EFFECT')),
  ADD COLUMN decision_reason text;

CREATE INDEX authority_outbox_authorization_evidence_idx
  ON doculyra.authority_outbox (workspace_id, authorization_epoch, occurred_at, event_id)
  WHERE authorization_epoch IS NOT NULL;
