---
name: github-issue-control-plane
description: Create or maintain authoritative Doculyra work, defect, decision, and UAT records in GitHub Issues. Use whenever governed work or a remote human decision must be durable and actionable without conversation context.
---

# GitHub Issue control plane

1. Search open and closed Issues before creating a new record; update the authoritative existing Issue when one matches.
2. Select the repository Issue form for governed work, defect, decision, or UAT readiness.
3. Include stable IDs, outcome/scope, acceptance or decision fields, requirement/decision links, evidence, owner, dependencies, risks, and current status.
4. Apply the configured labels from `.agents/project/github-labels.json` and link branches/PRs/evidence.
5. Treat Issue comments/edits by authorised humans as the remote decision record. Do not treat notification email replies as authority.
6. Keep customer content, credentials, and sensitive values out of Issues.
