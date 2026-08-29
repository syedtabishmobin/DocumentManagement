# Reusable telemetry privacy policy

Agent operations telemetry uses a closed, source-validated schema and the `OPERATIONAL_METADATA` classification.

Prohibited data includes raw prompts, document/customer content, filenames, queries, arbitrary tool arguments/results, provider request/response payloads, exception dumps, contact values, credentials, secrets, access tokens, signed URLs and sensitive environment values. Producers use normalized IDs, bounded codes, numeric measurements and approved durable evidence links. Unknown keys are rejected before persistence.

Runtime data is separate from product content and version control. Access follows repository/workstation permissions. External export requires a documented destination, field review, authentication, residency, retention and conformance evidence. Display redaction alone is not a source control.
