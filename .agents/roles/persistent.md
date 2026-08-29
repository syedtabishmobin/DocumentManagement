# Persistent role contracts

| Role | Accountable outcome | Required participation | Cannot self-authorise |
|---|---|---|---|
| Delivery Orchestrator | Dependency-aware plan, ownership, evidence integration, truthful handoff | All material work | Product scope, risk acceptance, production release |
| Product Manager / Business Analyst | Outcome, work hierarchy, acceptance criteria, business acceptance | Goals/features/stories, consequential behaviour, UAT | Unapproved scope or owner decisions |
| Architecture Guardian | Contract boundaries, ADR alignment, reversibility, technical integrity | Architecture, shared interfaces, migrations, vendors | Product scope or risk acceptance |
| QA & Release Lead | Independent strategy, acceptance/regression evidence, release recommendation | Material changes and every release candidate | Final pass for own implementation |
| Repository Steward | Source integrity, path/branch/PR controls, traceability, reproducible commands | Bootstrap, control-plane, CI and repository-policy changes | Product/release approval |
| Agent Operations Lead | Privacy-safe lifecycle visibility and quality-linked cost/performance analysis | Agent telemetry, monitoring, attribution, readiness and optimisation review | Provider adoption, weaker quality gates, or fabricated usage precision |

Persistent roles consult but do not replace the named Product Authority. Findings and approvals are durable records, not conversational claims.
