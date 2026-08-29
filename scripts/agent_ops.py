#!/usr/bin/env python3
"""Privacy-safe local query and event interface for Doculyra agent operations."""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import validate_observability

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".agents/project/observability.json"
ACTIVE_STATES = {"STARTING", "RUNNING", "TESTING", "BLOCKED", "HANDOFF"}
TERMINAL_TYPES = {"AGENT_COMPLETED", "AGENT_FAILED"}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def config() -> dict[str, Any]:
    return load_json(CONFIG_PATH)


def store_path(override: str | None = None) -> Path:
    candidate = Path(override) if override else Path(config()["runtimeStore"]["path"])
    return candidate if candidate.is_absolute() else ROOT / candidate


def parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_events(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    events: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_SH)
        for number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"invalid JSONL at {path}:{number}: {exc}") from exc
            errors = validate_observability.validate_event(event)
            if errors:
                raise ValueError(f"invalid event at {path}:{number}: {'; '.join(errors)}")
            events.append(event)
        fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    return sorted(events, key=lambda event: (parse_time(event["occurredAt"]), event["eventId"]))


def prune_events(events: list[dict[str, Any]], retention_days: int) -> list[dict[str, Any]]:
    threshold = datetime.now(timezone.utc) - timedelta(days=retention_days)
    return [event for event in events if parse_time(event["occurredAt"]) >= threshold]


def append_event(event: dict[str, Any], path: Path) -> None:
    errors = validate_observability.validate_event(event)
    if errors:
        raise ValueError("; ".join(errors))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.parent.chmod(0o700)
    path.touch(mode=0o600, exist_ok=True)
    with path.open("r+", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        existing = []
        for number, line in enumerate(handle, start=1):
            if line.strip():
                try:
                    existing_event = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"invalid JSONL at {path}:{number}: {exc}") from exc
                existing_errors = validate_observability.validate_event(existing_event)
                if existing_errors:
                    raise ValueError(f"invalid existing event at {path}:{number}: {'; '.join(existing_errors)}")
                existing.append(existing_event)
        if any(item.get("eventId") == event["eventId"] for item in existing):
            raise ValueError(f"duplicate eventId {event['eventId']}")
        retained = prune_events(existing, config()["runtimeStore"]["retentionDays"])
        retained.append(event)
        handle.seek(0)
        handle.truncate()
        for item in sorted(retained, key=lambda value: (parse_time(value["occurredAt"]), value["eventId"])):
            handle.write(json.dumps(item, sort_keys=True, separators=(",", ":")) + "\n")
        handle.flush()
        os.fsync(handle.fileno())
        fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
    path.chmod(0o600)


def git_value(*args: str) -> str | None:
    result = subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True, check=False)
    return result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else None


def aggregate_agent_states(events: list[dict[str, Any]], at: datetime | None = None) -> list[dict[str, Any]]:
    at = at or datetime.now(timezone.utc)
    by_agent: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in events:
        by_agent[event["agentId"]].append(event)
    result: list[dict[str, Any]] = []
    for agent_id, agent_events in by_agent.items():
        agent_events.sort(key=lambda event: (parse_time(event["occurredAt"]), event["eventId"]))
        latest = agent_events[-1]
        started = next((event for event in agent_events if event["eventType"] == "AGENT_STARTED"), agent_events[0])
        capabilities: list[str] = []
        skills: list[str] = []
        tools: list[str] = []
        adapters: list[str] = []
        for event in agent_events:
            for source, target in (("capabilityIds", capabilities), ("skillIds", skills), ("toolIds", tools), ("adapterIds", adapters)):
                for item in event.get(source, []):
                    if item not in target:
                        target.append(item)
        duration_ms = latest.get("durationMs")
        if duration_ms is None:
            end = at if latest["state"] in ACTIVE_STATES else parse_time(latest["occurredAt"])
            duration_ms = max(0, int((end - parse_time(started["occurredAt"])).total_seconds() * 1000))
        latest_with = lambda key: next((event[key] for event in reversed(agent_events) if key in event), None)
        quality_events = [event["quality"] for event in agent_events if "quality" in event]
        result.append({
            "agentId": agent_id,
            "parentAgentId": latest_with("parentAgentId"),
            "runId": latest["runId"],
            "roleId": latest_with("roleId"),
            "modelProfile": latest_with("modelProfile"),
            "workItem": latest_with("workItem"),
            "capabilityIds": capabilities,
            "skillIds": skills,
            "toolIds": tools,
            "adapterIds": adapters,
            "branch": latest_with("branch"),
            "worktree": latest_with("worktree"),
            "pullRequest": latest_with("pullRequest"),
            "environmentId": latest_with("environmentId"),
            "state": latest["state"],
            "durationMs": duration_ms,
            "retryCount": max((event.get("retryCount", 0) for event in agent_events), default=0),
            "blocker": latest_with("blocker") if latest["state"] == "BLOCKED" else None,
            "quality": quality_events[-1] if quality_events else None,
            "handoffTargetAgentId": latest_with("handoffTargetAgentId"),
            "lastEventType": latest["eventType"],
            "lastObservedAt": latest["occurredAt"],
            "active": latest["state"] in ACTIVE_STATES,
        })
    return sorted(result, key=lambda item: (item["parentAgentId"] or "", item["agentId"]))


def issue_severity(body: str, labels: list[dict[str, Any]]) -> str:
    match = re.search(r"(?:^|\n)#{2,4}\s+Severity\s*\n+\s*(CRITICAL|HIGH|MEDIUM|LOW)\b", body, re.I)
    if match:
        return match.group(1).upper()
    if any(label.get("name") == "risk:high" for label in labels):
        return "HIGH"
    return "UNAVAILABLE"


def github_snapshot() -> dict[str, Any]:
    def gh(*args: str) -> tuple[list[Any] | None, str | None]:
        result = subprocess.run(["gh", *args], cwd=ROOT, text=True, capture_output=True, check=False)
        if result.returncode != 0:
            return None, (result.stderr.strip() or "GitHub query failed")
        try:
            return json.loads(result.stdout), None
        except json.JSONDecodeError:
            return None, "GitHub returned non-JSON output"

    issues, issue_error = gh("issue", "list", "--state", "open", "--limit", "100", "--json", "number,title,url,labels,body")
    prs, pr_error = gh("pr", "list", "--state", "open", "--limit", "50", "--json", "number,title,url,headRefName,statusCheckRollup")
    if issues is None:
        return {"availability": "UNAVAILABLE", "reason": issue_error}
    minimized = [{key: item[key] for key in ("number", "title", "url", "labels")} for item in issues]
    decisions = [item for item in minimized if any(label["name"] == "type:decision" for label in item.get("labels", []))]
    defects: list[dict[str, Any]] = []
    for raw, item in zip(issues, minimized):
        if any(label["name"] == "type:defect" for label in item.get("labels", [])):
            defects.append({**item, "severity": issue_severity(raw.get("body", ""), item.get("labels", []))})
    defects_by_severity = Counter(item["severity"] for item in defects)
    uat_records = [item for item in minimized if any(label["name"] == "uat:ready" for label in item.get("labels", []))]
    return {"availability": "MEASURED", "openIssues": minimized, "pendingDecisions": decisions, "openDefects": defects, "defectsBySeverity": dict(defects_by_severity), "openUatReadyRecords": uat_records, "openPullRequests": prs or [], "pullRequestError": pr_error}


def notification_snapshot() -> dict[str, Any]:
    cfg = load_json(ROOT / ".agents/config/notifications.json")
    adapter = cfg["adapter"]
    operational = adapter["implementation"] == "IMPLEMENTED" and adapter["activation"] == "ENABLED" and adapter["deliveryConformance"] == "PASS"
    ledger = load_json(ROOT / cfg["ledger"])
    return {
        "operational": operational,
        "implementation": adapter["implementation"],
        "activation": adapter["activation"],
        "deliveryConformance": adapter["deliveryConformance"],
        "sendAllowed": adapter["sendAllowed"],
        "nonOperationalResult": cfg["nonOperationalResult"],
        "ledgerEvents": [{"key": item.get("key"), "status": item.get("status"), "authoritativeUrl": item.get("authoritativeUrl")} for item in ledger.get("events", [])],
    }


def status_snapshot(events: list[dict[str, Any]], online: bool = False, at: datetime | None = None) -> dict[str, Any]:
    agents = aggregate_agent_states(events, at)
    env = load_json(ROOT / ".agents/project/environments.json")
    current = config()
    github = github_snapshot() if online else {"availability": "NOT_QUERIED", "command": "pnpm agent:status --online"}
    by_environment = {item["id"]: item["status"] for item in env["environments"]}
    uat_state = "READY_RECORD_OPEN" if github.get("openUatReadyRecords") else ("NOT_READY" if online else "NOT_QUERIED")
    return {
        "generatedAt": now_iso(),
        "projectId": current["projectId"],
        "runtimeStore": {"status": current["runtimeStore"]["status"], "eventCount": len(events), "retentionDays": current["runtimeStore"]["retentionDays"]},
        "agents": agents,
        "activeAgents": [item for item in agents if item["active"]],
        "blockedAgents": [item for item in agents if item["state"] == "BLOCKED"],
        "repository": {"branch": git_value("branch", "--show-current"), "worktree": str(ROOT), "head": git_value("rev-parse", "HEAD")},
        "github": github,
        "environments": env,
        "releaseState": {"DEV": by_environment.get("dev", "UNAVAILABLE"), "STAGE": by_environment.get("stage", "UNAVAILABLE"), "UAT": uat_state},
        "notifications": notification_snapshot(),
        "nativeTelemetry": current["nativeTelemetry"],
        "autonomousQueueGate": current["autonomousQueueGate"],
    }


def tree_rows(agents: list[dict[str, Any]], work_item: str | None = None) -> list[dict[str, Any]]:
    selected = [item for item in agents if not work_item or item.get("workItem", {}).get("id") == work_item]
    by_parent: dict[str | None, list[dict[str, Any]]] = defaultdict(list)
    ids = {item["agentId"] for item in selected}
    for item in selected:
        parent = item.get("parentAgentId") if item.get("parentAgentId") in ids else None
        by_parent[parent].append(item)
    rows: list[dict[str, Any]] = []

    def visit(parent: str | None, depth: int) -> None:
        for item in sorted(by_parent.get(parent, []), key=lambda value: value["agentId"]):
            rows.append({"depth": depth, **item})
            visit(item["agentId"], depth + 1)

    visit(None, 0)
    return rows


def summary_snapshot(events: list[dict[str, Any]], window_days: int = 7, at: datetime | None = None) -> dict[str, Any]:
    at = at or datetime.now(timezone.utc)
    threshold = at - timedelta(days=window_days)
    selected = [event for event in events if parse_time(event["occurredAt"]) >= threshold]
    type_counts = Counter(event["eventType"] for event in selected)
    capabilities = Counter(item for event in selected for item in event.get("capabilityIds", []))
    skills = Counter(item for event in selected for item in event.get("skillIds", []))
    tools = Counter(item for event in selected for item in event.get("toolIds", []))
    quality = Counter(event.get("quality", {}).get("status") for event in selected if event.get("quality", {}).get("status"))
    usage: dict[str, Counter[str]] = defaultdict(Counter)
    seen_records: set[str] = set()
    duplicate_records = 0
    inclusive_records = 0
    for event in selected:
        record = event.get("usage")
        if not record:
            continue
        record_id = record["recordId"]
        if record_id in seen_records:
            duplicate_records += 1
            continue
        seen_records.add(record_id)
        if record["scope"] == "INCLUSIVE":
            inclusive_records += 1
            continue
        for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens", "credits", "providerCost", "toolCost"):
            metric = record[key]
            if metric["value"] is not None:
                usage[key][metric["provenance"]] += metric["value"]
    usage_output: dict[str, Any] = {}
    for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens", "credits", "providerCost", "toolCost"):
        buckets = dict(usage.get(key, {}))
        usage_output[key] = {"byProvenance": buckets, "status": "UNAVAILABLE" if not buckets else "AVAILABLE_WITH_RECORDED_PROVENANCE"}
    return {
        "generatedAt": now_iso(),
        "windowDays": window_days,
        "eventCount": len(selected),
        "eventTypes": dict(type_counts),
        "capabilities": dict(capabilities),
        "skills": dict(skills),
        "tools": dict(tools),
        "qualityStates": dict(quality),
        "failures": sum(type_counts[item] for item in ("AGENT_FAILED", "SKILL_FAILED", "TOOL_FAILED", "TEST_FAILED", "QUALITY_GATE_FAILED", "DEFECT_RETEST_FAILED")),
        "retries": type_counts["RETRY_RECORDED"],
        "usage": usage_output,
        "usageReconciliation": {"uniqueRecordIds": len(seen_records), "duplicatesExcluded": duplicate_records, "inclusiveParentRollupsExcluded": inclusive_records, "aggregationScope": "SELF_ONLY"},
    }


def print_status(snapshot: dict[str, Any]) -> None:
    print(f"Doculyra agent operations @ {snapshot['generatedAt']}")
    print(f"Active agents: {len(snapshot['activeAgents'])}; blocked: {len(snapshot['blockedAgents'])}; events: {snapshot['runtimeStore']['eventCount']}")
    for agent in snapshot["agents"]:
        work = agent.get("workItem") or {}
        print(f"- {agent['agentId']} [{agent['state']}] role={agent.get('roleId') or 'UNAVAILABLE'} work={work.get('kind', 'UNAVAILABLE')}:{work.get('id', 'UNAVAILABLE')} capability={','.join(agent['capabilityIds']) or 'UNAVAILABLE'} skills={','.join(agent['skillIds']) or 'UNAVAILABLE'} tools={','.join(agent['toolIds']) or 'UNAVAILABLE'} adapters={','.join(agent['adapterIds']) or 'UNAVAILABLE'} branch={agent.get('branch') or 'UNAVAILABLE'} worktree={agent.get('worktree') or 'UNAVAILABLE'} pr={(agent.get('pullRequest') or {}).get('number', 'UNAVAILABLE')} quality={(agent.get('quality') or {}).get('status', 'UNAVAILABLE')}")
        if agent.get("blocker"):
            print(f"  blocker={agent['blocker']['kind']}:{agent['blocker']['id']} status={agent['blocker']['status']}")
    github = snapshot["github"]
    if github["availability"] == "MEASURED":
        print(f"GitHub: MEASURED; pending decisions={len(github.get('pendingDecisions', []))}; open defects={len(github.get('openDefects', []))} by severity={github.get('defectsBySeverity', {})}; open PRs={len(github.get('openPullRequests', []))}")
    else:
        print(f"GitHub: {github['availability']}; pending decisions=UNAVAILABLE; open defects=UNAVAILABLE; open PRs=UNAVAILABLE")
    print("DEV/STAGE/UAT: " + ", ".join(f"{key}={value}" for key, value in snapshot["releaseState"].items()))
    notification = snapshot["notifications"]
    print(f"Email notification: operational={notification['operational']} implementation={notification['implementation']} activation={notification['activation']} conformance={notification['deliveryConformance']}")
    native = snapshot["nativeTelemetry"]
    print(f"Native token telemetry: {native['tokenStatus']}; cost telemetry: {native['costStatus']}")
    print(f"Autonomous queue: {snapshot['autonomousQueueGate']['status']} — {snapshot['autonomousQueueGate']['reason']}")


def unavailable_metric(provenance: str = "UNAVAILABLE") -> dict[str, Any]:
    return {"value": None, "provenance": provenance}


def build_event(args: argparse.Namespace) -> dict[str, Any]:
    event: dict[str, Any] = {
        "schemaVersion": "1.0.0",
        "eventId": args.event_id or f"evt-{uuid.uuid4()}",
        "eventType": args.type,
        "occurredAt": args.occurred_at or now_iso(),
        "projectId": config()["projectId"],
        "runId": args.run_id,
        "agentId": args.agent_id,
        "state": args.state,
        "dataClassification": "OPERATIONAL_METADATA",
        "synthetic": args.synthetic,
    }
    optional = {
        "parentAgentId": args.parent_agent_id, "roleId": args.role, "modelProfile": args.model_profile,
        "branch": args.branch or git_value("branch", "--show-current"), "worktree": args.worktree or str(ROOT),
        "environmentId": args.environment, "resultCode": args.result_code,
        "handoffTargetAgentId": args.handoff_target, "retryCount": args.retry_count,
        "durationMs": args.duration_ms,
    }
    event.update({key: value for key, value in optional.items() if value is not None})
    if args.capability:
        event["capabilityIds"] = args.capability
    if args.skill:
        event["skillIds"] = args.skill
    if args.tool:
        event["toolIds"] = args.tool
    if args.adapter:
        event["adapterIds"] = args.adapter
    if args.work_item_kind or args.work_item_id or args.work_item_url:
        if not args.work_item_kind or not args.work_item_id:
            raise ValueError("work item requires both --work-item-kind and --work-item-id")
        event["workItem"] = {"kind": args.work_item_kind, "id": args.work_item_id}
        if args.work_item_url:
            event["workItem"]["url"] = args.work_item_url
    if args.pr_number or args.pr_url:
        if not args.pr_number or not args.pr_url:
            raise ValueError("pull request requires both --pr-number and --pr-url")
        event["pullRequest"] = {"number": args.pr_number, "url": args.pr_url}
    if args.blocker_kind or args.blocker_id or args.blocker_status or args.blocker_url:
        if not args.blocker_kind or not args.blocker_id or not args.blocker_status:
            raise ValueError("blocker requires --blocker-kind, --blocker-id, and --blocker-status")
        event["blocker"] = {"kind": args.blocker_kind, "id": args.blocker_id, "status": args.blocker_status}
        if args.blocker_url:
            event["blocker"]["url"] = args.blocker_url
    if args.quality_gate or args.quality_status or args.acceptance_criterion or args.defect_id or args.rework_cycle is not None:
        if not args.quality_status:
            raise ValueError("quality details require --quality-status")
        event["quality"] = {"status": args.quality_status}
        for key, value in (("gateId", args.quality_gate), ("acceptanceCriterionId", args.acceptance_criterion), ("defectId", args.defect_id), ("reworkCycle", args.rework_cycle)):
            if value is not None:
                event["quality"][key] = value
    return event


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--store", help="override runtime JSONL store (primarily for tests)")
    sub = parser.add_subparsers(dest="command", required=True)
    emit = sub.add_parser("emit", help="validate and append one event")
    emit.add_argument("--event-file")
    emit.add_argument("--type", choices=load_json(validate_observability.SCHEMA_PATH)["properties"]["eventType"]["enum"])
    emit.add_argument("--event-id")
    emit.add_argument("--occurred-at")
    emit.add_argument("--run-id")
    emit.add_argument("--agent-id")
    emit.add_argument("--parent-agent-id")
    emit.add_argument("--role")
    emit.add_argument("--model-profile")
    emit.add_argument("--state", choices=load_json(validate_observability.SCHEMA_PATH)["properties"]["state"]["enum"])
    emit.add_argument("--capability", action="append")
    emit.add_argument("--skill", action="append")
    emit.add_argument("--tool", action="append")
    emit.add_argument("--adapter", action="append")
    emit.add_argument("--work-item-kind", choices=["GOAL", "FEATURE", "STORY", "TASK", "BUG", "DECISION", "RELEASE"])
    emit.add_argument("--work-item-id")
    emit.add_argument("--work-item-url")
    emit.add_argument("--branch")
    emit.add_argument("--worktree")
    emit.add_argument("--pr-number", type=int)
    emit.add_argument("--pr-url")
    emit.add_argument("--environment")
    emit.add_argument("--result-code")
    emit.add_argument("--retry-count", type=int)
    emit.add_argument("--duration-ms", type=int)
    emit.add_argument("--handoff-target")
    emit.add_argument("--blocker-kind", choices=["HUMAN_DECISION", "DEFECT", "DEPENDENCY", "ENVIRONMENT", "PERMISSION", "EXTERNAL_ACTION"])
    emit.add_argument("--blocker-id")
    emit.add_argument("--blocker-status", choices=["OPEN", "RESOLVED"])
    emit.add_argument("--blocker-url")
    emit.add_argument("--quality-gate")
    emit.add_argument("--quality-status", choices=["PASS", "FAIL", "BLOCKED", "NOT_APPLICABLE", "PENDING"])
    emit.add_argument("--acceptance-criterion")
    emit.add_argument("--defect-id")
    emit.add_argument("--rework-cycle", type=int)
    emit.add_argument("--synthetic", action="store_true")
    status = sub.add_parser("status", help="show current agents and control-plane state")
    status.add_argument("--online", action="store_true")
    status.add_argument("--json", action="store_true")
    tree = sub.add_parser("tree", help="show parent/subagent tree")
    tree.add_argument("--work-item")
    tree.add_argument("--json", action="store_true")
    summary = sub.add_parser("summary", help="show quality-linked usage and performance summary")
    summary.add_argument("--window-days", type=int, default=7)
    summary.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    parser = create_parser()
    args = parser.parse_args()
    path = store_path(args.store)
    try:
        if args.command == "emit":
            if args.event_file:
                event = load_json(Path(args.event_file))
            else:
                for required in ("type", "run_id", "agent_id", "state"):
                    if getattr(args, required) is None:
                        parser.error(f"emit without --event-file requires --{required.replace('_', '-')}")
                event = build_event(args)
            append_event(event, path)
            print(f"Recorded {event['eventType']} {event['eventId']} in {path}")
            return 0
        events = read_events(path)
        if args.command == "status":
            snapshot = status_snapshot(events, args.online)
            if args.json:
                print(json.dumps(snapshot, indent=2, sort_keys=True))
            else:
                print_status(snapshot)
        elif args.command == "tree":
            rows = tree_rows(aggregate_agent_states(events), args.work_item)
            if args.json:
                print(json.dumps(rows, indent=2, sort_keys=True))
            elif not rows:
                print("No agent events recorded.")
            else:
                for row in rows:
                    work = row.get("workItem") or {}
                    print(f"{'  ' * row['depth']}- {row['agentId']} [{row['state']}] role={row.get('roleId') or 'UNAVAILABLE'} work={work.get('id', 'UNAVAILABLE')} durationMs={row['durationMs']}")
        elif args.command == "summary":
            if args.window_days < 1:
                parser.error("--window-days must be positive")
            snapshot = summary_snapshot(events, args.window_days)
            print(json.dumps(snapshot, indent=2, sort_keys=True))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
