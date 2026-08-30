#!/usr/bin/env python3
"""Local/private read-only Doculyra delivery control centre."""

from __future__ import annotations

import argparse
import json
import re
import statistics
import threading
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable
from urllib.parse import unquote, urlparse

import agent_ops


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".agents/project/control-centre.json"
ASSET_ROOT = ROOT / ".agents/control-centre/web"
ID_PATTERN = re.compile(
    r"\b(?:PROD-(?:VIS|PRD)-[0-9]+|OUT-P1-[0-9]+|MET-P1-[0-9]+|EPIC-P1-[0-9]+|"
    r"FEAT-P1-[0-9]+|STORY-P1-[0-9]+|AC-[A-Z0-9-]+|REQ-P1-[A-Z0-9-]+|"
    r"API-P1-[0-9]+|EVT-P1-[0-9]+|TEST-[A-Z0-9-]+|DIT-[A-Z0-9-]+|"
    r"DEC-[A-Z0-9-]+|ADR-[0-9]+|RUN-[0-9]{8}-[0-9]{4}|"
    r"(?:ORCH|BA|ARCH|SEC|OPS|DEV-(?:BE|WEB|MOB|AI)|QA-(?:FUNC|SEC|E2E)|AI-EVAL)-[0-9]{3})\b"
)
SAFE_TRACE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:#/-]{1,127}$")
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE", "CONNECT", "TRACE"}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def source_record(source_id: str, freshness: str, status: str, observed_at: str, detail: str) -> dict[str, str]:
    return {
        "sourceId": source_id,
        "freshnessClass": freshness,
        "status": status,
        "observedAt": observed_at,
        "detail": detail,
    }


def trace_index(config: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Index stable IDs and repository references without persisting source content."""
    records: dict[str, dict[str, Any]] = {}
    for relative in config["sharedIdSources"]:
        path = ROOT / relative
        if not path.is_file():
            continue
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            ids = sorted(set(ID_PATTERN.findall(line)))
            for stable_id in ids:
                record = records.setdefault(stable_id, {"id": stable_id, "references": [], "relatedIds": set()})
                reference = {"path": relative, "line": line_number}
                if reference not in record["references"]:
                    record["references"].append(reference)
                record["relatedIds"].update(item for item in ids if item != stable_id)
    for record in records.values():
        record["relatedIds"] = sorted(record["relatedIds"])
        record["references"] = sorted(record["references"], key=lambda item: (item["path"], item["line"]))
    return dict(sorted(records.items()))


def github_trace_records(github: dict[str, Any]) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for item in github.get("openIssues") or []:
        stable_id = f"issue-{item['number']}"
        records[stable_id] = {
            "id": stable_id,
            "kind": "GITHUB_ISSUE",
            "title": item["title"],
            "url": item["url"],
            "labels": [label["name"] for label in item.get("labels", [])],
        }
    for item in github.get("openPullRequests") or []:
        stable_id = f"pr-{item['number']}"
        records[stable_id] = {
            "id": stable_id,
            "kind": "GITHUB_PULL_REQUEST",
            "title": item["title"],
            "url": item["url"],
            "branch": item.get("headRefName"),
        }
    return records


def historical_trends(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, Counter[str]] = defaultdict(Counter)
    for event in events:
        day = event["occurredAt"][:10]
        buckets[day]["events"] += 1
        if event["eventType"] in {"AGENT_STARTED", "SUBAGENT_SPAWNED"}:
            buckets[day]["agentsStarted"] += 1
        if event["eventType"] in {"TEST_FAILED", "QUALITY_GATE_FAILED", "DEFECT_CREATED", "DEFECT_RETEST_FAILED"}:
            buckets[day]["qualityFailures"] += 1
        if event["eventType"] == "RETRY_RECORDED":
            buckets[day]["retries"] += 1
        if event["eventType"] in {"TEST_PASSED", "QUALITY_GATE_PASSED", "DEFECT_RETEST_PASSED"}:
            buckets[day]["qualityPasses"] += 1
    return [{"date": day, **dict(values)} for day, values in sorted(buckets.items())]


def duration_metrics(agents: list[dict[str, Any]]) -> dict[str, Any]:
    completed = [item["durationMs"] for item in agents if not item["active"] and isinstance(item.get("durationMs"), int)]
    if not completed:
        return {
            "status": "UNAVAILABLE",
            "provenance": "UNAVAILABLE",
            "averageDurationMs": None,
            "medianDurationMs": None,
            "sampleCount": None,
        }
    return {
        "status": "AVAILABLE",
        "provenance": "MEASURED",
        "averageDurationMs": round(sum(completed) / len(completed)),
        "medianDurationMs": round(statistics.median(completed)),
        "sampleCount": len(completed),
    }


def registered_counts(summary: dict[str, Any], registry_path: Path, key: str, observed_key: str) -> list[dict[str, Any]]:
    registry = load_json(registry_path)
    observed = summary.get(observed_key, {})
    return [
        {
            "id": item["id"],
            "status": item.get("status", "REGISTERED"),
            "purpose": item.get("purpose"),
            "invocations": observed.get(item["id"]),
            "invocationProvenance": "MEASURED" if item["id"] in observed else "UNAVAILABLE",
        }
        for item in registry[key]
    ]


def skill_counts(summary: dict[str, Any]) -> list[dict[str, Any]]:
    observed = summary.get("skills", {})
    result = []
    for skill_file in sorted((ROOT / ".agents/skills").glob("*/SKILL.md")):
        skill_id = skill_file.parent.name
        result.append({
            "id": skill_id,
            "invocations": observed.get(skill_id),
            "invocationProvenance": "MEASURED" if skill_id in observed else "UNAVAILABLE",
        })
    return result


def build_audit(
    config: dict[str, Any],
    status: dict[str, Any],
    traces: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    def check(check_id: str, passed: bool, evidence: str) -> None:
        checks.append({"id": check_id, "status": "PASS" if passed else "FAIL", "evidence": evidence})

    project = config["githubProject"]
    expected_routes = {
        "overview", "agents", "agent-tree", "workstreams", "capabilities", "skills", "tools", "quality",
        "cost-tokens", "performance", "failures-retries", "decisions", "environments", "traceability", "audit",
        "historical-trends",
    }
    actual_routes = {item["id"] for item in config["dashboard"]["routes"]}
    checkpoint = load_json(ROOT / ".agents/state/control-centre-checkpoint.json")
    assignments = load_json(ROOT / ".agents/state/agent-display-assignments.json")["assignments"]
    notification = status["notifications"]
    check("CC-AUD-001", project["title"] == "Doculyra Product Delivery" and len(project["fields"]) == 22, "Configured Project title and 22 governed fields")
    check("CC-AUD-002", len(project["views"]) == 10 and len({item["name"] for item in project["views"]}) == 10, "Ten distinct specified Project views")
    check("CC-AUD-003", actual_routes == expected_routes, "All sixteen dashboard routes configured")
    check("CC-AUD-004", config["dashboard"]["readOnly"] is True and set(config["dashboard"]["allowedMethods"]).isdisjoint(MUTATING_METHODS), "Read-only method contract")
    check("CC-AUD-005", config["dashboard"]["bindHost"] == "127.0.0.1" and config["privacy"]["loopbackOnly"] is True, "Loopback-only server binding")
    check("CC-AUD-006", checkpoint["queueState"] == "PAUSED_BY_PRODUCT_AUTHORITY" and checkpoint["dispatchAllowed"] is False, "Durable paused-queue checkpoint")
    check("CC-AUD-007", any(item["displayAgentId"] == "ORCH-010" and item["workItem"] == "issue-61" for item in assignments), "Registered human-readable/runtime identity join")
    check("CC-AUD-008", bool(traces), "Shared-ID repository trace index is non-empty")
    check("CC-AUD-009", notification["operational"] is True, "Product Authority notification adapter remains operational")
    check("CC-AUD-010", status["nativeTelemetry"]["tokenStatus"] in {"MEASURED", "PROVIDER_REPORTED", "ATTRIBUTED", "ESTIMATED", "UNAVAILABLE"}, "Token provenance is explicit")
    return {
        "status": "PASS" if all(item["status"] == "PASS" for item in checks) else "FAIL",
        "checks": checks,
        "generatedAt": utc_now(),
    }


def build_snapshot(
    *,
    online: bool = True,
    event_store: Path | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    generated_at = (now or datetime.now(timezone.utc)).isoformat().replace("+00:00", "Z")
    config = load_json(CONFIG_PATH)
    events = agent_ops.read_events(event_store or agent_ops.store_path(), now)
    status = agent_ops.status_snapshot(events, online=online, at=now)
    agents = status["agents"]
    tree = agent_ops.tree_rows(agents)
    summary_1 = agent_ops.summary_snapshot(events, 1, now)
    summary_7 = agent_ops.summary_snapshot(events, 7, now)
    summary_30 = agent_ops.summary_snapshot(events, 30, now)
    traces = trace_index(config)
    github_traces = github_trace_records(status["github"])
    baseline = load_json(ROOT / "docs/10-backlog/build-baseline.v1.json")
    metric_catalog = load_json(ROOT / ".agents/observability/metric-catalog.json")
    audit = build_audit(config, status, traces)
    github_status = status["github"]["availability"]
    sources = [
        source_record("agent-ops-local-store", "LIVE", "AVAILABLE", generated_at, f"{len(events)} validated retained events"),
        source_record("github-control-plane", "CURRENT", github_status, generated_at, "GitHub Issues and pull requests queried on refresh"),
        source_record("approved-build-baseline", "CURRENT", "AVAILABLE", generated_at, baseline["baselineId"]),
        source_record("repository-trace-index", "CURRENT", "AVAILABLE", generated_at, f"{len(traces)} stable IDs indexed"),
        source_record("retained-event-trends", "HISTORICAL", "AVAILABLE" if events else "UNAVAILABLE", generated_at, "Bounded by local retention policy"),
    ]
    return {
        "schemaVersion": "1.0.0",
        "controlCentreId": config["controlCentreId"],
        "generatedAt": generated_at,
        "readOnly": True,
        "freshness": sources,
        "repository": status["repository"],
        "queueCheckpoint": load_json(ROOT / ".agents/state/control-centre-checkpoint.json"),
        "githubProject": config["githubProject"],
        "overview": {
            "activeAgentCount": len(status["activeAgents"]),
            "blockedAgentCount": len(status["blockedAgents"]),
            "openIssueCount": len(status["github"].get("openIssues") or []) if github_status != "UNAVAILABLE" else None,
            "openDefectCount": len(status["github"].get("openDefects") or []) if github_status != "UNAVAILABLE" else None,
            "openPullRequestCount": len(status["github"].get("openPullRequests") or []) if github_status != "UNAVAILABLE" else None,
            "baselineId": baseline["baselineId"],
            "baselineStatus": baseline["status"],
            "notificationOperational": status["notifications"]["operational"],
            "auditStatus": audit["status"],
        },
        "agents": agents,
        "agentTree": tree,
        "workstreams": {
            "openIssues": status["github"].get("openIssues"),
            "openPullRequests": status["github"].get("openPullRequests"),
            "queueState": "PAUSED_BY_PRODUCT_AUTHORITY",
        },
        "capabilities": registered_counts(summary_30, ROOT / ".agents/capabilities/registry.json", "capabilities", "capabilities"),
        "skills": skill_counts(summary_30),
        "tools": registered_counts(summary_30, ROOT / ".agents/tools/registry.json", "tools", "tools"),
        "quality": {
            "states": summary_30["qualityStates"],
            "openDefects": status["github"].get("openDefects"),
            "defectsBySeverity": status["github"].get("defectsBySeverity"),
            "firstPassQa": next((item for item in metric_catalog["metrics"] if item["id"] == "first_pass_qa_rate"), None),
        },
        "costTokens": {
            "usage": summary_30["usage"],
            "reconciliation": summary_30["usageReconciliation"],
            "nativeTelemetry": status["nativeTelemetry"],
        },
        "performance": {
            "durations": duration_metrics(agents),
            "contextEfficiency": summary_30["contextEfficiency"],
            "window1Day": {"events": summary_1["eventCount"], "failures": summary_1["failures"], "retries": summary_1["retries"]},
            "window7Days": {"events": summary_7["eventCount"], "failures": summary_7["failures"], "retries": summary_7["retries"]},
        },
        "failuresRetries": {
            "eventTypes": summary_30["eventTypes"],
            "failures": summary_30["failures"],
            "retries": summary_30["retries"],
            "openDefects": status["github"].get("openDefects"),
        },
        "decisions": {
            "pending": status["github"].get("pendingDecisions"),
            "blockingDecisions": baseline["blockingDecisions"],
            "notifications": status["notifications"],
        },
        "environments": {
            "configured": status["environments"],
            "releaseState": status["releaseState"],
        },
        "traceability": {
            "baselineId": baseline["baselineId"],
            "hierarchy": baseline["approvedHierarchy"],
            "stableIdCount": len(traces),
            "records": list(traces.values()),
            "githubRecords": list(github_traces.values()),
        },
        "audit": audit,
        "historicalTrends": historical_trends(events),
        "metricCatalog": metric_catalog,
        "routes": config["dashboard"]["routes"],
    }


def trace_lookup(snapshot: dict[str, Any], stable_id: str) -> dict[str, Any]:
    if not SAFE_TRACE_ID.fullmatch(stable_id):
        raise ValueError("trace ID must be a normalized stable identifier")
    records = {item["id"]: item for item in snapshot["traceability"]["records"]}
    records.update({item["id"]: item for item in snapshot["traceability"]["githubRecords"]})
    return {
        "id": stable_id,
        "status": "FOUND" if stable_id in records else "NOT_FOUND",
        "record": records.get(stable_id),
        "generatedAt": snapshot["generatedAt"],
    }


class SnapshotCache:
    def __init__(self, ttl_seconds: int, builder: Callable[[], dict[str, Any]]) -> None:
        self.ttl_seconds = ttl_seconds
        self.builder = builder
        self._lock = threading.Lock()
        self._captured = 0.0
        self._value: dict[str, Any] | None = None

    def get(self) -> dict[str, Any]:
        with self._lock:
            current = time.monotonic()
            if self._value is None or current - self._captured >= self.ttl_seconds:
                self._value = self.builder()
                self._captured = current
            return self._value


class ControlCentreHandler(BaseHTTPRequestHandler):
    server_version = "DoculyraControlCentre/1.0"

    def _headers(self, status: int, content_type: str, length: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()

    def _send(self, status: int, payload: bytes, content_type: str) -> None:
        self._headers(status, content_type, len(payload))
        if self.command != "HEAD":
            self.wfile.write(payload)

    def _json(self, status: int, value: Any) -> None:
        self._send(status, json.dumps(value, sort_keys=True, separators=(",", ":")).encode(), "application/json; charset=utf-8")

    def _serve_get(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        cache: SnapshotCache = self.server.snapshot_cache  # type: ignore[attr-defined]
        if path == "/healthz":
            self._json(HTTPStatus.OK, {"status": "PASS", "readOnly": True})
            return
        if path == "/api/v1/snapshot":
            self._json(HTTPStatus.OK, cache.get())
            return
        if path == "/api/v1/audit":
            self._json(HTTPStatus.OK, cache.get()["audit"])
            return
        if path.startswith("/api/v1/trace/"):
            try:
                result = trace_lookup(cache.get(), unquote(path.removeprefix("/api/v1/trace/")))
            except ValueError as exc:
                self._json(HTTPStatus.BAD_REQUEST, {"status": "INVALID", "error": str(exc)})
                return
            self._json(HTTPStatus.OK if result["status"] == "FOUND" else HTTPStatus.NOT_FOUND, result)
            return
        asset = {"/app.js": ("app.js", "text/javascript; charset=utf-8"), "/styles.css": ("styles.css", "text/css; charset=utf-8")}.get(path)
        if asset:
            payload = (ASSET_ROOT / asset[0]).read_bytes()
            self._send(HTTPStatus.OK, payload, asset[1])
            return
        configured = load_json(CONFIG_PATH)
        routes = {item["path"] for item in configured["dashboard"]["routes"]}
        if path == "/" or path in routes:
            self._send(HTTPStatus.OK, (ASSET_ROOT / "index.html").read_bytes(), "text/html; charset=utf-8")
            return
        self._json(HTTPStatus.NOT_FOUND, {"status": "NOT_FOUND"})

    do_GET = _serve_get
    do_HEAD = _serve_get

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Allow", "GET, HEAD, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _reject_mutation(self) -> None:
        self._json(HTTPStatus.METHOD_NOT_ALLOWED, {"status": "READ_ONLY", "allowedMethods": ["GET", "HEAD", "OPTIONS"]})

    do_POST = _reject_mutation
    do_PUT = _reject_mutation
    do_PATCH = _reject_mutation
    do_DELETE = _reject_mutation
    do_CONNECT = _reject_mutation
    do_TRACE = _reject_mutation

    def log_message(self, fmt: str, *args: Any) -> None:
        # Method/path/status only. Never log headers, query strings, bodies or content.
        safe_path = urlparse(self.path).path[:160]
        print(f"control-centre {self.command} {safe_path} {args[1] if len(args) > 1 else '-'}")


def serve(port: int, online: bool, event_store: Path | None) -> None:
    config = load_json(CONFIG_PATH)
    if not 1024 <= port <= 65535:
        raise ValueError("port must be between 1024 and 65535")
    cache = SnapshotCache(config["dashboard"]["refreshSeconds"], lambda: build_snapshot(online=online, event_store=event_store))
    server = ThreadingHTTPServer(("127.0.0.1", port), ControlCentreHandler)
    server.snapshot_cache = cache  # type: ignore[attr-defined]
    print(f"Doculyra read-only Control Centre: http://127.0.0.1:{port}/overview")
    print("Bound to loopback only. Press Ctrl-C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    sub = result.add_subparsers(dest="command", required=True)
    for command in ("snapshot", "audit"):
        item = sub.add_parser(command)
        item.add_argument("--offline", action="store_true")
        item.add_argument("--store", type=Path)
    trace = sub.add_parser("trace")
    trace.add_argument("id", nargs="?")
    trace.add_argument("--offline", action="store_true")
    trace.add_argument("--store", type=Path)
    serve_parser = sub.add_parser("serve")
    serve_parser.add_argument("--port", type=int, default=load_json(CONFIG_PATH)["dashboard"]["defaultPort"])
    serve_parser.add_argument("--offline", action="store_true")
    serve_parser.add_argument("--store", type=Path)
    return result


def main() -> int:
    args = parser().parse_args()
    try:
        if args.command == "serve":
            serve(args.port, not args.offline, args.store)
            return 0
        snapshot = build_snapshot(online=not args.offline, event_store=args.store)
        if args.command == "snapshot":
            output = snapshot
        elif args.command == "audit":
            output = snapshot["audit"]
        elif args.id:
            output = trace_lookup(snapshot, args.id)
        else:
            output = {
                "status": "AVAILABLE",
                "stableIdCount": snapshot["traceability"]["stableIdCount"],
                "ids": [item["id"] for item in snapshot["traceability"]["records"]],
            }
        print(json.dumps(output, indent=2, sort_keys=True))
        return 0 if output.get("status") not in {"FAIL", "NOT_FOUND"} else 1
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
