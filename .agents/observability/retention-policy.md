# Reusable telemetry retention policy

Projects MUST configure a bounded runtime retention period and removal mechanism. Event definitions and readiness evidence remain version controlled; volatile events do not.

The local store SHOULD be pruned by event time, preserve no content payloads, and support immediate deletion without affecting product data or authoritative work records. External destinations require separately approved retention and access controls. A missing or unknown external retention route is ineligible for activation.
