# Reusable Product Authority notification policy

The work-management decision record is authoritative. Email or another outbound channel is a notification channel unless an approved authenticated inbound integration explicitly makes it a control channel.

## Blocking decision

On the first genuine human-owned blocking decision:

1. create or update the authoritative decision record;
2. persist the decision brief and durable evidence;
3. reserve a stable event/deduplication key;
4. resolve recipients from structured configuration and normalize/deduplicate addresses;
5. acquire an atomic bounded lease and send once through an approved, enabled, delivery-tested adapter using a stable provider operation identity;
6. include the direct decision URL, required action, reason and exact blocked scope, recommendation, alternatives/impacts, continuing work, and remaining work; and
7. record provider acceptance as submitted/out-for-delivery, never as sent; and
8. reconcile recipient-level terminal delivery evidence in the ledger before recording SENT.

## UAT-ready

Reserve one event per immutable release candidate. Include environment access, scope, acceptance/evaluation evidence, residual risks, business acceptance, recommended scenarios, durable links, and requested approval/testing.

## Truth and failure

Credentials are never stored in framework configuration or ledgers. SENT requires recipient-level terminal provider confirmation or an approved equivalent; provider submission alone is not delivery. If no adapter exists, is disabled, or lacks successful conformance evidence, record EXTERNAL_ACTION_REQUIRED; do not simulate delivery. Retries are bounded and reuse the same event key and provider operation identity. Concurrent dispatchers cannot both acquire the same event. Recipient routing must not place the same normalized address in both To and CC.
