---
name: observability-status
description: Query current agent operations from validated runtime metadata, repository state, and authoritative work records. Use when someone asks who is active, what is blocked, or what quality and environment state applies.
---

# Agent operations status

1. Run `pnpm agent:status`; add `--online` only when current GitHub decisions, defects and PRs are needed.
2. Use `pnpm agent:tree` for delegation and `pnpm agent:summary` for usage, retries, failures and quality trends.
3. Distinguish live runtime events, repository configuration, and GitHub authority in the result. Do not fill missing fields from conversation memory.
4. Show every usage/cost value with its recorded provenance and state `UNAVAILABLE` plainly.
5. Do not expose raw event files when a minimized query result answers the request.
