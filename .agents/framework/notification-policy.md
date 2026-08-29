# Reusable Product Authority notification policy

The work-management decision record is authoritative. Email or another outbound channel is a notification channel unless an approved authenticated inbound integration explicitly makes it a control channel.

## Blocking decision

On the first genuine human-owned blocking decision:

1. create or update the authoritative decision record;
2. persist the decision brief and durable evidence;
3. reserve a stable event/deduplication key;
4. resolve recipients from structured configuration and normalize/deduplicate addresses;
5. send once through an approved, enabled, delivery-tested adapter;
6. include the direct decision URL, required action, reason and exact blocked scope, recommendation, alternatives/impacts, continuing work, and remaining work; and
7. reconcile the delivery result in the ledger.

## UAT-ready

Reserve one event per immutable release candidate. Include environment access, scope, acceptance/evaluation evidence, residual risks, business acceptance, recommended scenarios, durable links, and requested approval/testing.

## Truth and failure

Credentials are never stored in framework configuration or ledgers. `SENT` requires provider confirmation or an approved equivalent. If no adapter exists, is disabled, or lacks successful conformance evidence, record `EXTERNAL_ACTION_REQUIRED`; do not simulate delivery. Retries reuse the same key. Recipient routing must not place the same normalized address in both To and CC.
