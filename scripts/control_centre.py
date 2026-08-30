#!/usr/bin/env python3
"""Local/private read-only Doculyra delivery control centre."""

from __future__ import annotations

import argparse
import json
import re
import statistics
import subprocess
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
SHA_PATTERN = re.compile(r"(?<![0-9a-f])([0-9a-f]{40})(?![0-9a-f])", re.I)
ISSUE_URL_PATTERN = re.compile(r"https://github\.com/[^/\s]+/[^/\s]+/issues/([0-9]+)", re.I)
PULL_URL_PATTERN = re.compile(r"https://github\.com/[^/\s]+/[^/\s]+/pull/([0-9]+)", re.I)
WORK_ITEM_PATTERN = re.compile(r"\b(issue|pr)-([0-9]+)\b", re.I)
LABELED_REFERENCE_PATTERN = re.compile(r"\b(issue|pr|pull request)\s*#\s*([0-9]+)\b", re.I)
SHORTHAND_REFERENCE_PATTERN = re.compile(
    r"(?<![A-Za-z0-9])(?<!Issue )(?<!PR )(?<!Pull Request )#([0-9]+)\b",
    re.I,
)
ATTRIBUTION_BLOCK_PATTERN = re.compile(r"<!--\s*doculyra-agent-meta:v2\s*\n(?P<body>.*?)\n-->", re.S)
SAFE_TRACE_ID = re.compile(
    r"^(?:[0-9a-fA-F]{40}|issue-[0-9]+|pr-[0-9]+|[A-Za-z][A-Za-z0-9._:/-]{1,127})$",
    re.I,
)
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE", "CONNECT", "TRACE"}
GITHUB_RETENTION = "GitHub repository retention; deleted or inaccessible artifacts are unavailable."
REPOSITORY_RETENTION = "Reachable local Git history and version-controlled evidence at the observed checkout."
ATTRIBUTION_FIELDS = {
    "display_agent_id", "display_role", "activity", "display_run_id", "runtime_agent_id",
    "runtime_run_id", "parent_display_agent_id", "work_item", "capability_ids", "skill_ids",
    "tool_ids", "commit", "environment",
}


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
                record = records.setdefault(stable_id, {
                    "id": stable_id,
                    "kind": stable_id_kind(stable_id),
                    "state": "CURRENT",
                    "source": {"id": "repository-trace-index", "status": "MEASURED", "freshnessClass": "CURRENT"},
                    "retentionLimit": REPOSITORY_RETENTION,
                    "references": [],
                    "relatedIds": set(),
                    "evidence": [],
                    "unavailable": [],
                })
                reference = {"path": relative, "line": line_number}
                if reference not in record["references"]:
                    record["references"].append(reference)
                record["relatedIds"].update(item for item in ids if item != stable_id)
    for record in records.values():
        record["relatedIds"] = sorted(record["relatedIds"])
        record["references"] = sorted(record["references"], key=lambda item: (item["path"], item["line"]))
    return dict(sorted(records.items()))


def stable_id_kind(stable_id: str) -> str:
    prefixes = {
        "OUT-P1-": "GOAL", "MET-P1-": "SUCCESS_CRITERION", "EPIC-P1-": "EPIC",
        "FEAT-P1-": "FEATURE", "STORY-P1-": "STORY", "AC-": "ACCEPTANCE_CRITERION",
        "REQ-P1-": "REQUIREMENT", "API-P1-": "API_CONTRACT", "EVT-P1-": "EVENT_CONTRACT",
        "TEST-": "TEST", "DIT-": "TEST", "DEC-": "DECISION", "ADR-": "ARCHITECTURE_DECISION",
        "RUN-": "DISPLAY_RUN",
    }
    return next((kind for prefix, kind in prefixes.items() if stable_id.startswith(prefix)), "AGENT_ID")


def _flatten_pages(payload: Any) -> list[dict[str, Any]] | None:
    if not isinstance(payload, list):
        return None
    values = payload
    if values and all(isinstance(item, list) for item in values):
        values = [entry for page in values for entry in page]
    return values if all(isinstance(item, dict) for item in values) else None


def _github_collection(repository: str, endpoint: str, timeout: int) -> list[dict[str, Any]] | None:
    try:
        result = subprocess.run(
            ["gh", "api", "--paginate", "--slurp", f"repos/{repository}/{endpoint}"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
            timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    try:
        return _flatten_pages(json.loads(result.stdout))
    except json.JSONDecodeError:
        return None


def github_delivery_snapshot(config: dict[str, Any], online: bool) -> dict[str, Any]:
    """Read durable GitHub metadata, minimizing bodies/comments before returning."""
    if not online:
        return {
            "availability": "UNAVAILABLE",
            "issues": [],
            "pullRequests": [],
            "comments": [],
            "unavailable": ["Online GitHub history was not requested."],
            "retentionLimit": GITHUB_RETENTION,
        }
    repository = config["repository"]
    timeout = config["dashboard"]["githubTimeoutSeconds"]
    raw_issues = _github_collection(repository, "issues?state=all&per_page=100", timeout)
    raw_pulls = _github_collection(repository, "pulls?state=all&per_page=100", timeout)
    raw_comments = _github_collection(repository, "issues/comments?per_page=100", timeout)
    unavailable = [
        label for label, value in (
            ("GitHub Issue history is unavailable.", raw_issues),
            ("GitHub pull-request history is unavailable.", raw_pulls),
            ("GitHub durable comment evidence is unavailable.", raw_comments),
        ) if value is None
    ]

    issues = []
    for item in raw_issues or []:
        if item.get("pull_request") or not isinstance(item.get("number"), int):
            continue
        issues.append({
            "number": item["number"],
            "title": str(item.get("title") or "")[:240],
            "url": item.get("html_url"),
            "state": str(item.get("state") or "UNKNOWN").upper(),
            "labels": [str(label.get("name")) for label in item.get("labels", []) if isinstance(label, dict) and label.get("name")],
            "body": item.get("body") if isinstance(item.get("body"), str) else "",
        })
    pulls = []
    for item in raw_pulls or []:
        if not isinstance(item.get("number"), int):
            continue
        pulls.append({
            "number": item["number"],
            "title": str(item.get("title") or "")[:240],
            "url": item.get("html_url"),
            "state": "MERGED" if item.get("merged_at") else str(item.get("state") or "UNKNOWN").upper(),
            "branch": (item.get("head") or {}).get("ref"),
            "headCommit": (item.get("head") or {}).get("sha"),
            "mergeCommit": item.get("merge_commit_sha"),
            "body": item.get("body") if isinstance(item.get("body"), str) else "",
        })
    comments = []
    for item in raw_comments or []:
        issue_url = str(item.get("issue_url") or "")
        number_match = re.search(r"/issues/([0-9]+)$", issue_url)
        if not number_match:
            continue
        comments.append({
            "number": int(number_match.group(1)),
            "url": item.get("html_url"),
            "body": item.get("body") if isinstance(item.get("body"), str) else "",
        })
    measured = sum(value is not None for value in (raw_issues, raw_pulls, raw_comments))
    return {
        "availability": "MEASURED" if measured == 3 else "PARTIAL" if measured else "UNAVAILABLE",
        "issues": issues,
        "pullRequests": pulls,
        "comments": comments,
        "unavailable": unavailable,
        "retentionLimit": GITHUB_RETENTION,
    }


def _metadata_values(text: str) -> dict[str, str]:
    match = ATTRIBUTION_BLOCK_PATTERN.search(text)
    if not match:
        return {}
    values: dict[str, str] = {}
    for line in match.group("body").splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key in ATTRIBUTION_FIELDS and re.fullmatch(r"[A-Za-z0-9._:/,# -]{1,512}", value):
            values[key] = value
    return values


def _text_trace_ids(text: str, *, shorthand_kind: str | None = None) -> set[str]:
    result = set(ID_PATTERN.findall(text))
    result.update(match.lower() for match in SHA_PATTERN.findall(text))
    result.update(f"issue-{number}" for number in ISSUE_URL_PATTERN.findall(text))
    result.update(f"pr-{number}" for number in PULL_URL_PATTERN.findall(text))
    result.update(f"{kind.lower()}-{number}" for kind, number in WORK_ITEM_PATTERN.findall(text))
    result.update(
        f"{'pr' if kind.lower() in {'pr', 'pull request'} else 'issue'}-{number}"
        for kind, number in LABELED_REFERENCE_PATTERN.findall(text)
    )
    if shorthand_kind:
        result.update(f"{shorthand_kind}-{number}" for number in SHORTHAND_REFERENCE_PATTERN.findall(text))
    return result


def _evidence_record(text: str, url: str | None) -> dict[str, Any] | None:
    metadata = _metadata_values(text)
    activity = metadata.get("activity", "").lower()
    if not metadata:
        return None
    if "fix-ready" in activity:
        kind = "FIX_READY"
    elif "retest" in activity:
        kind = "INDEPENDENT_RETEST"
    elif metadata.get("display_agent_id", "").startswith(("QA-", "AI-EVAL-")) or "qa" in activity:
        kind = "QA_RESULT"
    elif "defect" in activity:
        kind = "DEFECT_EVIDENCE"
    else:
        kind = "ATTRIBUTED_RECORD"
    outcome_match = re.search(
        r"\b(?:VERDICT|RESULT|STATUS)[*_` ]*:?\s*[*_` ]*(PASS|FAIL|FIX_READY)\b",
        text.upper(),
    )
    activity_outcome = re.search(r"(?:^|[-_])(pass|fail)(?:$|[-_])", activity)
    outcome = outcome_match.group(1) if outcome_match else activity_outcome.group(1).upper() if activity_outcome else "UNAVAILABLE"
    return {
        "kind": kind,
        "url": url,
        "outcome": outcome,
        "attribution": {
            "status": "MEASURED" if metadata.get("display_agent_id") and metadata.get("display_run_id") else "PARTIAL",
            "displayAgentId": metadata.get("display_agent_id"),
            "displayRole": metadata.get("display_role"),
            "activity": metadata.get("activity"),
            "displayRunId": metadata.get("display_run_id"),
            "runtimeAgentId": metadata.get("runtime_agent_id"),
            "runtimeRunId": metadata.get("runtime_run_id"),
            "parentDisplayAgentId": metadata.get("parent_display_agent_id"),
            "environment": metadata.get("environment"),
        },
        "relatedIds": sorted(_text_trace_ids(text)),
    }


def repository_commit_records(repository: str) -> dict[str, dict[str, Any]]:
    try:
        result = subprocess.run(
            ["git", "log", "--all", "--format=%H%x00%s"], cwd=ROOT, text=True,
            capture_output=True, check=False, timeout=20,
        )
    except (OSError, subprocess.TimeoutExpired):
        return {}
    if result.returncode != 0:
        return {}
    records: dict[str, dict[str, Any]] = {}
    for line in result.stdout.splitlines():
        if "\x00" not in line:
            continue
        sha, subject = line.split("\x00", 1)
        if not SHA_PATTERN.fullmatch(sha):
            continue
        related = _text_trace_ids(subject)
        related.update(f"pr-{number}" for number in re.findall(r"\(#([0-9]+)\)", subject))
        records[sha.lower()] = {
            "id": sha.lower(),
            "kind": "GIT_COMMIT",
            "state": "REPOSITORY_HISTORY",
            "url": f"https://github.com/{repository}/commit/{sha.lower()}",
            "source": {"id": "local-git-history", "status": "MEASURED", "freshnessClass": "CURRENT"},
            "retentionLimit": REPOSITORY_RETENTION,
            "relatedIds": sorted(related),
            "evidence": [],
            "unavailable": [],
        }
    return records


def github_trace_records(github: dict[str, Any], repository: str) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    records: dict[str, dict[str, Any]] = {}
    commits = repository_commit_records(repository)
    issue_numbers: set[int] = set()
    pull_numbers: set[int] = set()

    for item in github.get("issues") or []:
        stable_id = f"issue-{item['number']}"
        issue_numbers.add(item["number"])
        labels = item.get("labels", [])
        text = f"{item.get('title', '')}\n{item.get('body', '')}"
        evidence = _evidence_record(item.get("body", ""), item.get("url"))
        records[stable_id] = {
            "id": stable_id,
            "kind": "GITHUB_DEFECT" if "type:defect" in labels else "GITHUB_ISSUE",
            "state": item.get("state", "UNKNOWN"),
            "title": item.get("title"),
            "url": item.get("url"),
            "labels": labels,
            "source": {"id": "github-governed-history", "status": github["availability"], "freshnessClass": "CURRENT"},
            "retentionLimit": github.get("retentionLimit", GITHUB_RETENTION),
            "relatedIds": sorted(_text_trace_ids(text, shorthand_kind="issue") - {stable_id}),
            "evidence": [evidence] if evidence else [],
            "unavailable": list(github.get("unavailable") or []),
        }
    for item in github.get("pullRequests") or []:
        stable_id = f"pr-{item['number']}"
        pull_numbers.add(item["number"])
        text = f"{item.get('title', '')}\n{item.get('body', '')}"
        related = _text_trace_ids(text, shorthand_kind="issue") - {stable_id}
        evidence = _evidence_record(item.get("body", ""), item.get("url"))
        for field in ("headCommit", "mergeCommit"):
            sha = item.get(field)
            if isinstance(sha, str) and SHA_PATTERN.fullmatch(sha):
                sha = sha.lower()
                related.add(sha)
                commit = commits.setdefault(sha, {
                    "id": sha,
                    "kind": "GIT_COMMIT",
                    "state": "GITHUB_HISTORY",
                    "url": f"https://github.com/{repository}/commit/{sha}",
                    "source": {"id": "github-governed-history", "status": github["availability"], "freshnessClass": "CURRENT"},
                    "retentionLimit": github.get("retentionLimit", GITHUB_RETENTION),
                    "relatedIds": [],
                    "evidence": [],
                    "unavailable": list(github.get("unavailable") or []),
                })
                commit["relatedIds"] = sorted(set(commit.get("relatedIds", [])) | {stable_id})
        records[stable_id] = {
            "id": stable_id,
            "kind": "GITHUB_PULL_REQUEST",
            "state": item.get("state", "UNKNOWN"),
            "title": item.get("title"),
            "url": item.get("url"),
            "branch": item.get("branch"),
            "source": {"id": "github-governed-history", "status": github["availability"], "freshnessClass": "CURRENT"},
            "retentionLimit": github.get("retentionLimit", GITHUB_RETENTION),
            "relatedIds": sorted(related),
            "evidence": [evidence] if evidence else [],
            "unavailable": list(github.get("unavailable") or []),
        }
    for comment in github.get("comments") or []:
        number = comment["number"]
        target = f"pr-{number}" if number in pull_numbers else f"issue-{number}" if number in issue_numbers else None
        if not target or target not in records:
            continue
        text = comment.get("body", "")
        records[target]["relatedIds"] = sorted(set(records[target]["relatedIds"]) | (_text_trace_ids(text) - {target}))
        evidence = _evidence_record(text, comment.get("url"))
        if evidence:
            records[target]["evidence"].append(evidence)

    combined = {**records, **commits}
    for record in list(combined.values()):
        for related_id in list(record.get("relatedIds", [])):
            if related_id in combined:
                related = combined[related_id]
                related["relatedIds"] = sorted(set(related.get("relatedIds", [])) | {record["id"]})
    return dict(sorted(records.items())), dict(sorted(commits.items()))


def trace_graph_walk(
    records: dict[str, dict[str, Any]],
    start_id: str,
    *,
    max_depth: int = 4,
    max_records: int = 64,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Walk direct and reverse shared-ID edges, prioritising durable evidence nodes."""
    reverse: dict[str, set[str]] = defaultdict(set)
    for record in records.values():
        for related_id in record.get("relatedIds", []):
            if related_id in records:
                reverse[related_id].add(record["id"])

    def priority(stable_id: str) -> tuple[int, str]:
        kind = records[stable_id].get("kind", "UNAVAILABLE")
        if kind in {"GITHUB_ISSUE", "GITHUB_DEFECT", "GITHUB_PULL_REQUEST", "GIT_COMMIT"}:
            return 0, stable_id
        if kind in {"AGENT_ID", "DISPLAY_RUN"}:
            return 1, stable_id
        return 2, stable_id

    visited: set[str] = set()
    frontier = [(start_id, 0)] if start_id in records else []
    chain: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = []
    evidence_seen: set[tuple[Any, ...]] = set()
    while frontier and len(chain) < max_records:
        current_id, depth = frontier.pop(0)
        if current_id in visited or current_id not in records:
            continue
        visited.add(current_id)
        current = records[current_id]
        chain.append({
            "id": current["id"],
            "kind": current.get("kind", "UNAVAILABLE"),
            "state": current.get("state", "UNAVAILABLE"),
            "url": current.get("url"),
            "source": current.get("source"),
            "depth": depth,
        })
        for item in current.get("evidence", []):
            identity = (
                item.get("kind"), item.get("url"), item.get("outcome"),
                item.get("attribution", {}).get("displayAgentId"),
                item.get("attribution", {}).get("displayRunId"),
            )
            if identity not in evidence_seen:
                evidence_seen.add(identity)
                evidence.append(item)
        if depth < max_depth:
            neighbours = (
                {item for item in current.get("relatedIds", []) if item in records}
                | reverse.get(current_id, set())
            ) - visited
            frontier.extend((item, depth + 1) for item in sorted(neighbours, key=priority))
    return chain, evidence


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
    github_delivery: dict[str, Any],
    github_traces: dict[str, dict[str, Any]],
    commit_traces: dict[str, dict[str, Any]],
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
    static_kinds = {item["kind"] for item in traces.values()}
    issue_states = {item["state"] for item in github_traces.values() if item["kind"] in {"GITHUB_ISSUE", "GITHUB_DEFECT"}}
    defect_states = {item["state"] for item in github_traces.values() if item["kind"] == "GITHUB_DEFECT"}
    pull_states = {item["state"] for item in github_traces.values() if item["kind"] == "GITHUB_PULL_REQUEST"}
    evidence = [entry for item in github_traces.values() for entry in item.get("evidence", [])]
    evidence_kinds = {item["kind"] for item in evidence}
    attributed_evidence = [item for item in evidence if item.get("attribution", {}).get("status") == "MEASURED"]
    all_trace_records = {**traces, **github_traces, **commit_traces}

    def reconstructed(stable_id: str, *, require_qa: bool) -> bool:
        chain, chain_evidence = trace_graph_walk(all_trace_records, stable_id)
        kinds = {item["kind"] for item in chain}
        has_github = bool(kinds & {"GITHUB_ISSUE", "GITHUB_DEFECT", "GITHUB_PULL_REQUEST"})
        has_qa = any(
            item["kind"] in {"QA_RESULT", "INDEPENDENT_RETEST"}
            and item.get("attribution", {}).get("status") == "MEASURED"
            for item in chain_evidence
        )
        return has_github and (has_qa if require_qa else True)

    def complete_chain() -> bool:
        for commit in commit_traces.values():
            for pr_id in commit.get("relatedIds", []):
                pull = github_traces.get(pr_id)
                if not pull or pull["kind"] != "GITHUB_PULL_REQUEST":
                    continue
                issue_ids = [item for item in pull.get("relatedIds", []) if item.startswith("issue-")]
                chain_evidence = list(pull.get("evidence", []))
                chain_evidence.extend(
                    entry for issue_id in issue_ids for entry in github_traces.get(issue_id, {}).get("evidence", [])
                )
                if issue_ids and any(
                    item["kind"] in {"QA_RESULT", "INDEPENDENT_RETEST"}
                    and item.get("attribution", {}).get("status") == "MEASURED"
                    for item in chain_evidence
                ):
                    return True
        return False

    check("CC-AUD-001", project["title"] == "Doculyra Product Delivery" and len(project["fields"]) == 22, "Configured Project title and 22 governed fields")
    check("CC-AUD-002", len(project["views"]) == 10 and len({item["name"] for item in project["views"]}) == 10, "Ten distinct specified Project views")
    check("CC-AUD-003", actual_routes == expected_routes, "All sixteen dashboard routes configured")
    check("CC-AUD-004", config["dashboard"]["readOnly"] is True and set(config["dashboard"]["allowedMethods"]).isdisjoint(MUTATING_METHODS), "Read-only method contract")
    check("CC-AUD-005", config["dashboard"]["bindHost"] == "127.0.0.1" and config["privacy"]["loopbackOnly"] is True, "Loopback-only server binding")
    check("CC-AUD-006", checkpoint["queueState"] == "PAUSED_BY_PRODUCT_AUTHORITY" and checkpoint["dispatchAllowed"] is False, "Durable paused-queue checkpoint")
    check("CC-AUD-007", any(item["displayAgentId"] == "ORCH-010" and item["workItem"] == "issue-61" for item in assignments), "Registered human-readable/runtime identity join")
    check(
        "CC-AUD-008",
        {"GOAL", "FEATURE", "STORY", "ACCEPTANCE_CRITERION", "TEST", "DECISION"}.issubset(static_kinds),
        "Representative goal, feature, story, acceptance, test and decision IDs resolve from repository sources",
    )
    check("CC-AUD-009", notification["operational"] is True, "Product Authority notification adapter remains operational")
    check("CC-AUD-010", status["nativeTelemetry"]["tokenStatus"] in {"MEASURED", "PROVIDER_REPORTED", "ATTRIBUTED", "ESTIMATED", "UNAVAILABLE"}, "Token provenance is explicit")
    check(
        "CC-AUD-011",
        github_delivery["availability"] == "MEASURED" and {"OPEN", "CLOSED"}.issubset(issue_states),
        "Complete current/historical GitHub source with representative open and closed Issues",
    )
    check(
        "CC-AUD-012",
        {"OPEN", "CLOSED"}.issubset(defect_states),
        "Representative open and closed governed defects resolve",
    )
    check(
        "CC-AUD-013",
        {"OPEN", "MERGED"}.issubset(pull_states),
        "Representative open and merged pull requests resolve",
    )
    check(
        "CC-AUD-014",
        bool(commit_traces) and any(any(item.startswith("pr-") for item in record.get("relatedIds", [])) for record in commit_traces.values()),
        "Commit history contains a reverse join to a governed pull request",
    )
    check(
        "CC-AUD-015",
        {"QA_RESULT", "FIX_READY", "INDEPENDENT_RETEST"}.issubset(evidence_kinds) and bool(attributed_evidence),
        "Durable QA, FIX_READY and independent-retest evidence includes measured agent attribution",
    )
    check(
        "CC-AUD-016",
        complete_chain(),
        "Representative commit → pull request → Issue/defect → independent evidence chain resolves end to end",
    )
    check(
        "CC-AUD-017",
        reconstructed("STORY-P1-006", require_qa=True),
        "Representative Story reverse trace reaches authoritative GitHub and independently attributed QA evidence",
    )
    check(
        "CC-AUD-018",
        reconstructed("AC-BL-P1-001", require_qa=False)
        and reconstructed("TEST-SEC-P1-015", require_qa=True)
        and reconstructed("DEC-036", require_qa=True),
        "Representative acceptance, test and decision reverse traces reach applicable GitHub and assurance evidence",
    )
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
    github_delivery = github_delivery_snapshot(config, online)
    github_traces, commit_traces = github_trace_records(github_delivery, config["repository"])
    baseline = load_json(ROOT / "docs/10-backlog/build-baseline.v1.json")
    metric_catalog = load_json(ROOT / ".agents/observability/metric-catalog.json")
    audit = build_audit(config, status, traces, github_delivery, github_traces, commit_traces)
    github_status = status["github"]["availability"]
    sources = [
        source_record("agent-ops-local-store", "LIVE", "AVAILABLE", generated_at, f"{len(events)} validated retained events"),
        source_record("github-control-plane", "CURRENT", github_status, generated_at, "GitHub Issues and pull requests queried on refresh"),
        source_record("approved-build-baseline", "CURRENT", "AVAILABLE", generated_at, baseline["baselineId"]),
        source_record("repository-trace-index", "CURRENT", "AVAILABLE", generated_at, f"{len(traces)} stable IDs indexed"),
        source_record("local-git-history", "CURRENT", "AVAILABLE" if commit_traces else "UNAVAILABLE", generated_at, REPOSITORY_RETENTION),
        source_record("github-governed-history", "CURRENT", github_delivery["availability"], generated_at, github_delivery["retentionLimit"]),
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
            "governedRecordCount": len(github_traces),
            "commitRecordCount": len(commit_traces),
            "records": list(traces.values()),
            "githubRecords": list(github_traces.values()),
            "commitRecords": list(commit_traces.values()),
            "sourceStatus": {
                "repository": "MEASURED",
                "github": github_delivery["availability"],
                "runtimeEvents": "MEASURED" if events else "UNAVAILABLE",
            },
            "retentionLimits": {
                "repository": REPOSITORY_RETENTION,
                "github": github_delivery["retentionLimit"],
                "runtimeEvents": f"{agent_ops.config()['runtimeStore']['retentionDays']} days; expired events are physically pruned.",
            },
            "unavailable": github_delivery["unavailable"],
        },
        "audit": audit,
        "historicalTrends": historical_trends(events),
        "metricCatalog": metric_catalog,
        "routes": config["dashboard"]["routes"],
    }


def trace_lookup(snapshot: dict[str, Any], stable_id: str) -> dict[str, Any]:
    if not SAFE_TRACE_ID.fullmatch(stable_id):
        raise ValueError("trace ID must be a normalized stable identifier")
    normalized = stable_id.lower() if SHA_PATTERN.fullmatch(stable_id) or stable_id.lower().startswith(("issue-", "pr-")) else stable_id.upper()
    records = {item["id"]: item for item in snapshot["traceability"]["records"]}
    records.update({item["id"]: item for item in snapshot["traceability"]["githubRecords"]})
    records.update({item["id"]: item for item in snapshot["traceability"]["commitRecords"]})
    selected = records.get(normalized)
    chain, evidence = trace_graph_walk(records, normalized)
    return {
        "id": normalized,
        "status": "FOUND" if selected else "NOT_FOUND",
        "record": selected,
        "chain": chain,
        "evidence": evidence,
        "sourceStatus": snapshot["traceability"]["sourceStatus"],
        "retentionLimits": snapshot["traceability"]["retentionLimits"],
        "unavailable": snapshot["traceability"]["unavailable"],
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
