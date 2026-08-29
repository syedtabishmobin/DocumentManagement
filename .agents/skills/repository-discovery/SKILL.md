---
name: repository-discovery
description: Establish an evidence-backed baseline before material repository work. Use for bootstrap, unfamiliar repositories, architecture or integration changes, or when deciding whether to reuse, extend, refactor, selectively replace, or rebuild existing implementation.
---

# Repository discovery

1. Read repository entry points and source-of-truth configuration.
2. Inspect relevant product documentation, decisions/ADRs, code, tests/evaluations, recent history, open work/PRs, CI/CD, environments, security/privacy configuration, contacts, and outbound integrations.
3. Resolve discoverable facts with read-only tools; do not infer greenfield state.
4. For each material affected area, choose `REUSE`, `EXTEND`, `REFACTOR`, `REPLACE_SELECTIVELY`, or `REBUILD` and cite evidence.
5. Record risks, dependencies, consultations, consequential ambiguity, recommendation, and safe work that can continue.
6. Validate the output against `.agents/protocols/discovery.schema.json` or use `.agents/templates/discovery.md` for a human-readable record.
