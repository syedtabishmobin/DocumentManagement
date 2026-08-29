# Reusable agent operations and observability policy

## Purpose and boundary

Agent operations telemetry makes execution, delegation, evidence, quality and cost state inspectable without relying on conversation memory. It is operational metadata, not product content, domain truth, audit evidence, authorization, or a substitute for the authoritative work-management system.

The reusable model is `project/work item → agent/role → capability → skill → tool/adapter → execution/evidence/result`. Material events MUST use stable correlation identifiers and the closed schema under `.agents/observability/`. Project-specific backends, routes, contacts, environments and trackers belong in project configuration.

## Runtime requirements

- Agent and subagent lifecycle, work item, role, delegation, capability, skill, tool, source-control context, handoff, retry/failure, blocker, decision, quality, defect, environment and notification state MUST be represented when reliably available.
- Missing fields MUST remain absent or explicitly `UNAVAILABLE`; they MUST NOT be inferred from conversational phrasing.
- Usage and cost values MUST carry `MEASURED`, `PROVIDER_REPORTED`, `ATTRIBUTED`, `ESTIMATED`, or `UNAVAILABLE` provenance.
- Aggregation MUST deduplicate `usage.recordId` and MUST exclude `INCLUSIVE` parent rollups when summing child/self usage.
- Optimisation MUST minimize cost at the required quality, security, privacy, accessibility and reliability level. A cheaper failed or reworked execution is not an improvement.
- Volatile events MUST live outside version control. The repository contains schemas, configuration, queries and durable readiness evidence only.

## Privacy and security

Producers MUST validate against a closed allow-list before emission. Raw prompts, customer or document content, credentials, secrets, arbitrary tool input/output, provider payloads and sensitive environment values are prohibited. Prefer normalized IDs, codes, counts and durable evidence links. Telemetry routing, retention and access MUST be explicit and project-approved.

Native runtime telemetry SHOULD be used when supported and privacy-safe. Framework events MAY add higher-level work-item, role, capability and skill semantics. Unsupported scraping of user-interface text MUST NOT be used as a telemetry source.

## Human and machine attribution

Material agent-generated control-plane records MUST expose three consistent levels: a compact role-oriented display identity at the beginning, collapsible execution details for human inspection, and final hidden versioned metadata for machine joins. Human-facing display IDs MUST be stable, concise, and separate from raw runtime/session identifiers. Hidden metadata MUST preserve both identities when available, plus run, parent, work item, capability, skill, tool, revision, and environment correlation. A validator MUST reject missing levels, disagreement between levels, unregistered or unauthorized claims, duplicate IDs, misplaced metadata, and display identities that are not assigned to the run. Project-specific identity prefixes, assignments, role labels, and tracker rendering belong in project configuration.

## Readiness gate

Governed autonomous execution requires testable attribution, active-state and blocker visibility, a configured destination or approved local/native store, privacy review, queryable operations, and truthful notification readiness. Unavailable exact token/cost data alone does not fail the gate when it is labelled honestly; a project-specific mandatory notification failure can still block execution.
