---
name: critical-decision
description: Route a genuine human-owned consequential decision through durable evidence, meaningful options, a recommendation, the authoritative work-management record, and exactly-once notification. Use after investigation and specialist consultation cannot safely resolve the ambiguity.
---

# Critical decision

1. Stop only the affected path and continue independent safe work.
2. Create or update the authoritative decision Issue using `.github/ISSUE_TEMPLATE/decision.yml`.
3. State the exact question, evidence, why work stopped, affected scope, at least two meaningful options and impacts, recommendation, blocked work, continuing work, and remaining work.
4. Validate a structured record against `.agents/protocols/decision.schema.json` when one is persisted outside the Issue.
5. Create a `BLOCKING_DECISION` event with a stable decision-scoped key and direct Issue URL.
6. Use `python3 scripts/notification_ledger.py plan <event.json>`. If operational, use `dispatch` and then `check-delivery`; provider submission remains `SUBMITTED` until terminal recipient evidence records `SENT`. If non-operational, record `EXTERNAL_ACTION_REQUIRED` without claiming delivery. Use `--conformance` only for the governed adapter-conformance work item.
7. Record the authoritative decision in the Issue and update affected contracts after approval.
