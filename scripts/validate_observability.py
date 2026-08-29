#!/usr/bin/env python3
"""Validate Agent Operations & Observability contracts without third-party packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / ".agents/observability/event-schema.json"
CONFIG_PATH = ROOT / ".agents/project/observability.json"
PROVENANCE = {"MEASURED", "PROVIDER_REPORTED", "ATTRIBUTED", "ESTIMATED", "UNAVAILABLE"}
EVENT_STATE_RULES = {
    "AGENT_STARTED": {"STARTING", "RUNNING", "TESTING"},
    "AGENT_COMPLETED": {"COMPLETED"},
    "AGENT_FAILED": {"FAILED"},
    "AGENT_BLOCKED": {"BLOCKED"},
    "SUBAGENT_SPAWNED": {"STARTING"},
    "HANDOFF_CREATED": {"HANDOFF"},
    "TEST_STARTED": {"TESTING"},
    "TEST_PASSED": {"TESTING", "RUNNING"},
    "TEST_FAILED": {"TESTING", "BLOCKED", "FAILED"},
    "QUALITY_GATE_PASSED": {"TESTING", "RUNNING", "COMPLETED"},
    "QUALITY_GATE_FAILED": {"TESTING", "BLOCKED", "FAILED"},
    "HUMAN_DECISION_REQUIRED": {"BLOCKED"},
    "HUMAN_DECISION_RESOLVED": {"RUNNING", "TESTING"},
    "UAT_READY": {"COMPLETED"},
}
STATE_TRANSITIONS = {
    "STARTING": {"STARTING", "RUNNING", "TESTING", "BLOCKED", "HANDOFF", "FAILED"},
    "RUNNING": {"RUNNING", "TESTING", "BLOCKED", "HANDOFF", "COMPLETED", "FAILED", "IDLE"},
    "TESTING": {"TESTING", "RUNNING", "BLOCKED", "HANDOFF", "COMPLETED", "FAILED"},
    "BLOCKED": {"BLOCKED", "RUNNING", "TESTING", "HANDOFF", "COMPLETED", "FAILED"},
    "HANDOFF": {"HANDOFF", "RUNNING", "TESTING", "BLOCKED", "COMPLETED", "FAILED"},
    "IDLE": {"IDLE", "STARTING", "RUNNING"},
    "COMPLETED": {"COMPLETED"},
    "FAILED": {"FAILED"},
    "NOT_APPLICABLE": {"NOT_APPLICABLE"},
}
FORBIDDEN_KEY_PARTS = {
    "prompt", "credential", "password", "secret", "documentcontent", "document_content",
    "customercontent", "customer_content", "toolinput", "tool_input", "tooloutput", "tool_output",
    "providerpayload", "provider_payload", "rawcontent", "raw_content", "accesstoken", "access_token",
}
FORBIDDEN_VALUE_PATTERNS = (
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", re.I),
    re.compile(r"\b(?:password|client_secret|access_token|authorization)\s*[:=]", re.I),
    re.compile(r"\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{12,}\b"),
    re.compile(r"(?:^|[?&])(?:sig|token|key|secret)=", re.I),
    re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]{8,}", re.I),
    re.compile(r"\b(?:raw|user|system|developer)\s+prompt\s*[:=]", re.I),
    re.compile(r"\b(?:customer|document|raw)\s+content\s*[:=]", re.I),
    re.compile(r"\b(?:tool\s+(?:input|output)|provider\s+payload)\s*[:=]", re.I),
    re.compile(r"\b(?:api[_ -]?key|secret)\s*[:=]\s*\S+", re.I),
)


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def resolve_ref(schema: dict[str, Any], root_schema: dict[str, Any]) -> dict[str, Any]:
    reference = schema.get("$ref")
    if not reference:
        return schema
    if not reference.startswith("#/"):
        raise ValueError(f"unsupported schema reference: {reference}")
    target: Any = root_schema
    for part in reference[2:].split("/"):
        target = target[part.replace("~1", "/").replace("~0", "~")]
    return target


def type_matches(value: Any, expected: str) -> bool:
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "null":
        return value is None
    return True


def validate_schema(value: Any, rule: dict[str, Any], root_schema: dict[str, Any], location: str = "event") -> list[str]:
    rule = resolve_ref(rule, root_schema)
    errors: list[str] = []
    expected = rule.get("type")
    expected_types = expected if isinstance(expected, list) else [expected] if expected else []
    if expected_types and not any(type_matches(value, item) for item in expected_types):
        return [f"{location} must be {expected_types}, got {type(value).__name__}"]
    if "const" in rule and value != rule["const"]:
        errors.append(f"{location} must equal {rule['const']!r}")
    if "enum" in rule and value not in rule["enum"]:
        errors.append(f"{location} has unsupported value {value!r}")
    if isinstance(value, str):
        if len(value) < rule.get("minLength", 0):
            errors.append(f"{location} is shorter than {rule['minLength']}")
        if len(value) > rule.get("maxLength", float("inf")):
            errors.append(f"{location} exceeds maximum length")
        if "pattern" in rule and not re.fullmatch(rule["pattern"], value):
            errors.append(f"{location} does not match its registered pattern")
        if rule.get("format") == "date-time":
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                errors.append(f"{location} is not an ISO 8601 date-time")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in rule and value < rule["minimum"]:
            errors.append(f"{location} is below minimum {rule['minimum']}")
        if "maximum" in rule and value > rule["maximum"]:
            errors.append(f"{location} exceeds maximum {rule['maximum']}")
    if isinstance(value, list):
        if "maxItems" in rule and len(value) > rule["maxItems"]:
            errors.append(f"{location} exceeds maximum item count {rule['maxItems']}")
        if rule.get("uniqueItems") and len({json.dumps(item, sort_keys=True) for item in value}) != len(value):
            errors.append(f"{location} contains duplicate items")
        item_rule = rule.get("items", {})
        for index, item in enumerate(value):
            errors.extend(validate_schema(item, item_rule, root_schema, f"{location}[{index}]"))
    if isinstance(value, dict):
        properties = rule.get("properties", {})
        for required in rule.get("required", []):
            if required not in value:
                errors.append(f"{location} is missing required field '{required}'")
        if rule.get("additionalProperties") is False:
            for key in value:
                if key not in properties:
                    errors.append(f"{location} contains unallowlisted field '{key}'")
        for key, item in value.items():
            if key in properties:
                errors.extend(validate_schema(item, properties[key], root_schema, f"{location}.{key}"))
    return errors


def inspect_privacy(value: Any, location: str = "event") -> list[str]:
    errors: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            normalized = key.lower().replace("-", "_")
            compact = normalized.replace("_", "")
            if any(part in normalized or part.replace("_", "") in compact for part in FORBIDDEN_KEY_PARTS):
                errors.append(f"{location}.{key} is a prohibited telemetry field")
            errors.extend(inspect_privacy(item, f"{location}.{key}"))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            errors.extend(inspect_privacy(item, f"{location}[{index}]"))
    elif isinstance(value, str):
        if "\n" in value or "\r" in value:
            errors.append(f"{location} contains multiline content")
        for pattern in FORBIDDEN_VALUE_PATTERNS:
            if pattern.search(value):
                errors.append(f"{location} resembles a secret or sensitive payload")
                break
    return errors


def validate_url(
    value: str,
    allowed_hosts: set[str],
    allowed_repositories: set[str],
    allowed_route_patterns: tuple[re.Pattern[str], ...],
    location: str,
) -> list[str]:
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.hostname not in allowed_hosts:
        return [f"{location} must use HTTPS on an approved evidence host"]
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        return [f"{location} must not contain credentials, query parameters, or fragments"]
    segments = parsed.path.strip("/").split("/")
    if len(segments) < 3 or "/".join(segments[:2]) not in allowed_repositories:
        return [f"{location} must reference an approved evidence repository"]
    route = "/".join(segments[2:])
    if not any(pattern.fullmatch(route) for pattern in allowed_route_patterns):
        return [f"{location} must use an approved durable evidence route"]
    return []


def metric_semantics(metric: dict[str, Any], location: str) -> list[str]:
    errors: list[str] = []
    provenance = metric.get("provenance")
    value = metric.get("value")
    if provenance not in PROVENANCE:
        errors.append(f"{location}.provenance is invalid")
    if value is None and provenance != "UNAVAILABLE":
        errors.append(f"{location} with null value must be UNAVAILABLE")
    if value is not None and provenance == "UNAVAILABLE":
        errors.append(f"{location} with a value cannot be UNAVAILABLE")
    return errors


def validate_event(event: dict[str, Any], config: dict[str, Any] | None = None) -> list[str]:
    schema = load_json(SCHEMA_PATH)
    config = config or load_json(CONFIG_PATH)
    errors = validate_schema(event, schema, schema)
    if len(json.dumps(event, separators=(",", ":")).encode("utf-8")) > 32768:
        errors.append("event exceeds the 32768-byte size limit")
    errors.extend(inspect_privacy(event))
    if event.get("projectId") != config.get("projectId"):
        errors.append("event.projectId does not match project observability configuration")
    if event.get("parentAgentId") == event.get("agentId"):
        errors.append("an agent cannot be its own parent")
    if event.get("eventType") == "SUBAGENT_SPAWNED" and not event.get("parentAgentId"):
        errors.append("SUBAGENT_SPAWNED requires parentAgentId")
    if event.get("eventType") in {"AGENT_BLOCKED", "HUMAN_DECISION_REQUIRED"} and not event.get("blocker"):
        errors.append(f"{event.get('eventType')} requires blocker details")
    allowed_states = EVENT_STATE_RULES.get(event.get("eventType"))
    if allowed_states and event.get("state") not in allowed_states:
        errors.append(f"{event.get('eventType')} cannot use state {event.get('state')}; expected {sorted(allowed_states)}")
    team = load_json(ROOT / ".agents/project/team.json")
    capabilities = load_json(ROOT / ".agents/capabilities/registry.json")
    tools = load_json(ROOT / ".agents/tools/registry.json")
    allowed_roles = {item["id"] for item in team.get("persistentRoles", [])}
    allowed_capabilities = {item["id"] for item in capabilities.get("capabilities", [])}
    allowed_capabilities.update(capability for role in team.get("persistentRoles", []) for capability in role.get("capabilities", []))
    allowed_skills = {path.parent.name for path in (ROOT / ".agents/skills").glob("*/SKILL.md")}
    allowed_skills.update(config.get("attribution", {}).get("externalSkillIds", []))
    allowed_tools = {item["id"] for item in tools.get("tools", [])}
    allowed_tools.update(config.get("attribution", {}).get("externalToolIds", []))
    allowed_adapters = {item["id"] for item in config.get("adapters", [])}
    if event.get("roleId") and event["roleId"] not in allowed_roles:
        errors.append(f"event.roleId is not registered: {event['roleId']}")
    for field, allowed in (("capabilityIds", allowed_capabilities), ("skillIds", allowed_skills), ("toolIds", allowed_tools), ("adapterIds", allowed_adapters)):
        for item in event.get(field, []):
            if item not in allowed:
                errors.append(f"event.{field} contains unregistered ID: {item}")
    allowed_hosts = set(config.get("privacy", {}).get("evidenceHosts", []))
    allowed_repositories = set(config.get("privacy", {}).get("evidenceRepositories", []))
    try:
        allowed_route_patterns = tuple(re.compile(value) for value in config.get("privacy", {}).get("evidenceRoutePatterns", []))
    except re.error as exc:
        errors.append(f"observability evidence route pattern is invalid: {exc}")
        allowed_route_patterns = ()
    for location, url in (
        ("event.workItem.url", event.get("workItem", {}).get("url")),
        ("event.pullRequest.url", event.get("pullRequest", {}).get("url")),
        ("event.blocker.url", event.get("blocker", {}).get("url")),
        ("event.notification.authoritativeUrl", event.get("notification", {}).get("authoritativeUrl")),
    ):
        if url:
            errors.extend(validate_url(url, allowed_hosts, allowed_repositories, allowed_route_patterns, location))
    for index, url in enumerate(event.get("evidenceUrls", [])):
        errors.extend(validate_url(url, allowed_hosts, allowed_repositories, allowed_route_patterns, f"event.evidenceUrls[{index}]"))
    usage = event.get("usage", {})
    for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens", "credits", "providerCost", "toolCost"):
        if key in usage:
            errors.extend(metric_semantics(usage[key], f"event.usage.{key}"))
    for key, metric in event.get("contextEfficiency", {}).items():
        errors.extend(metric_semantics(metric, f"event.contextEfficiency.{key}"))
    for key in ("providerCost", "toolCost"):
        metric = usage.get(key)
        if metric and ((metric.get("value") is None) != (metric.get("currency") is None)):
            errors.append(f"event.usage.{key} value and currency must both be present or absent")
    return sorted(set(errors))


def validate_event_sequence(events: list[dict[str, Any]]) -> list[str]:
    """Validate per-run lifecycle and parent graph invariants after individual validation."""
    errors: list[str] = []
    for event in events:
        errors.extend(f"{event.get('eventId', 'unknown')}: {error}" for error in validate_event(event))
    ordered = sorted(events, key=lambda event: (datetime.fromisoformat(event["occurredAt"].replace("Z", "+00:00")), event["eventId"]))
    states: dict[tuple[str, str], str] = {}
    parents: dict[tuple[str, str], str | None] = {}
    keys = {(event["runId"], event["agentId"]) for event in ordered}
    for event in ordered:
        key = (event["runId"], event["agentId"])
        parent = event.get("parentAgentId")
        if key in parents and parents[key] != parent:
            errors.append(f"run {event['runId']} agent {event['agentId']} changes parent from {parents[key] or 'ROOT'} to {parent or 'ROOT'}")
        if parent:
            parent_key = (event["runId"], parent)
            if parent_key not in keys:
                errors.append(f"run {event['runId']} agent {event['agentId']} references missing parent {parent}")
            parents[key] = parent
        else:
            parents.setdefault(key, None)
        previous_state = states.get(key)
        state = event["state"]
        if previous_state and state not in STATE_TRANSITIONS[previous_state]:
            errors.append(f"run {event['runId']} agent {event['agentId']} has illegal state transition {previous_state}->{state}")
        states[key] = state

    visiting: set[tuple[str, str]] = set()
    visited: set[tuple[str, str]] = set()

    def visit(key: tuple[str, str]) -> None:
        if key in visiting:
            errors.append(f"run {key[0]} contains a cyclic parent graph at agent {key[1]}")
            return
        if key in visited:
            return
        visiting.add(key)
        parent = parents.get(key)
        if parent:
            visit((key[0], parent))
        visiting.remove(key)
        visited.add(key)

    for key in keys:
        visit(key)
    return sorted(set(errors))


def validate_configuration() -> list[str]:
    errors: list[str] = []
    required_paths = [
        ".agents/framework/operations-observability.md", ".agents/observability/README.md",
        ".agents/observability/event-schema.json", ".agents/observability/metric-catalog.json",
        ".agents/observability/queries/catalog.json", ".agents/observability/privacy-policy.md",
        ".agents/observability/retention-policy.md", ".agents/observability/adapters/codex-otel.md",
        ".agents/project/observability.json", ".agents/skills/observability-status/SKILL.md",
        ".agents/skills/telemetry-validation/SKILL.md", ".agents/skills/cost-performance-analysis/SKILL.md",
        ".agents/bootstrap/discovery-observability-2026-08-29.json",
        ".agents/bootstrap/2026-08-29-observability-readiness-report.md",
    ]
    errors.extend(f"missing observability file: {path}" for path in required_paths if not (ROOT / path).is_file())
    if errors:
        return errors
    config = load_json(CONFIG_PATH)
    if config.get("projectId") != "doculyra":
        errors.append("observability config must bind projectId doculyra")
    store = config.get("runtimeStore", {})
    if store.get("versionControlled") is not False or not str(store.get("path", "")).startswith(".agent-ops/"):
        errors.append("runtime telemetry must use the Git-ignored .agent-ops store")
    if not isinstance(store.get("retentionDays"), int) or not 1 <= store["retentionDays"] <= 90:
        errors.append("local event retention must be an explicit 1-90 days")
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    if "/.agent-ops/" not in gitignore:
        errors.append(".gitignore must exclude the runtime telemetry store")
    adapters = {item.get("id"): item for item in config.get("adapters", [])}
    for adapter in ("agent-ops-local-store", "github-operations-context", "codex-agents-native", "codex-otel", "azure-monitor-agent-operations"):
        if adapter not in adapters:
            errors.append(f"observability config is missing adapter {adapter}")
    native = config.get("nativeTelemetry", {})
    if native.get("tokenStatus") not in {"MEASURED", "PROVIDER_REPORTED", "ATTRIBUTED", "ESTIMATED", "UNAVAILABLE"}:
        errors.append("native token status must use metric provenance")
    if native.get("costStatus") not in {"MEASURED", "PROVIDER_REPORTED", "ATTRIBUTED", "ESTIMATED", "UNAVAILABLE"}:
        errors.append("native cost status must use metric provenance")
    if config.get("privacy", {}).get("rawPromptsAllowed") is not False:
        errors.append("raw prompt persistence must remain disabled")
    privacy = config.get("privacy", {})
    if not privacy.get("evidenceHosts") or not privacy.get("evidenceRepositories") or not privacy.get("evidenceRoutePatterns"):
        errors.append("privacy config must constrain evidence hosts, repositories and durable routes")
    for pattern in privacy.get("evidenceRoutePatterns", []):
        try:
            re.compile(pattern)
        except re.error as exc:
            errors.append(f"invalid evidence route pattern {pattern!r}: {exc}")
    attribution = config.get("attribution", {})
    for field in ("externalSkillIds", "externalToolIds"):
        values = attribution.get(field, [])
        if len(values) != len(set(values)) or any(not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,79}", item) for item in values):
            errors.append(f"observability attribution {field} must contain unique normalized IDs")
    if attribution.get("githubMaterialAttribution") != ".agents/project/github-attribution.json" or attribution.get("displayIdentityAssignments") != ".agents/state/agent-display-assignments.json":
        errors.append("observability attribution must join configured GitHub material records and display identity assignments")
    if attribution.get("displayAndRuntimeIdentitySeparated") is not True:
        errors.append("observability attribution must separate display and runtime identities")
    if config.get("autonomousQueueGate", {}).get("status") != "BLOCKED":
        notifications = load_json(ROOT / ".agents/config/notifications.json").get("adapter", {})
        operational = notifications.get("implementation") == "IMPLEMENTED" and notifications.get("activation") == "ENABLED" and notifications.get("deliveryConformance") == "PASS"
        if not operational:
            errors.append("autonomous queue cannot pass while required email is non-operational")
    schema = load_json(SCHEMA_PATH)
    if schema.get("additionalProperties") is not False:
        errors.append("event schema must reject unknown top-level fields")
    if set(schema.get("$defs", {}).get("provenance", {}).get("enum", [])) != PROVENANCE:
        errors.append("event schema must define the exact provenance vocabulary")
    metric_catalog = load_json(ROOT / ".agents/observability/metric-catalog.json")
    if set(metric_catalog.get("provenance", [])) != PROVENANCE:
        errors.append("metric catalog must define the exact provenance vocabulary")
    if "INCLUSIVE" not in metric_catalog.get("usageRule", "") or "SELF_ONLY" not in metric_catalog.get("usageRule", ""):
        errors.append("metric catalog must document no-double-count aggregation")
    if "currency" not in metric_catalog.get("currencyRule", "").lower():
        errors.append("metric catalog must prohibit mixed-currency aggregation")
    required_event_types = {
        "AGENT_STARTED", "AGENT_COMPLETED", "AGENT_FAILED", "AGENT_BLOCKED", "SUBAGENT_SPAWNED", "HANDOFF_CREATED",
        "WORK_ITEM_STARTED", "WORK_ITEM_COMPLETED", "CAPABILITY_SELECTED", "SKILL_STARTED", "SKILL_COMPLETED", "SKILL_FAILED",
        "TOOL_STARTED", "TOOL_COMPLETED", "TOOL_FAILED", "TEST_STARTED", "TEST_PASSED", "TEST_FAILED", "DEFECT_CREATED",
        "DEFECT_FIX_READY", "DEFECT_RETEST_PASSED", "DEFECT_RETEST_FAILED", "QUALITY_GATE_PASSED", "QUALITY_GATE_FAILED",
        "HUMAN_DECISION_REQUIRED", "HUMAN_DECISION_RESOLVED", "ENVIRONMENT_PROMOTED", "UAT_READY",
    }
    actual_event_types = set(schema.get("properties", {}).get("eventType", {}).get("enum", []))
    missing_event_types = sorted(required_event_types - actual_event_types)
    if missing_event_types:
        errors.append(f"event schema is missing required event types: {', '.join(missing_event_types)}")
    report = (ROOT / ".agents/bootstrap/2026-08-29-observability-readiness-report.md").read_text(encoding="utf-8")
    for marker in ("OBSERVABILITY READINESS REPORT", "## 1. Repository/framework state discovered", "## 12. Recommendation for starting the governed Doculyra work queue", "**PARTIAL**", "04_USING_THIS_REPO_WITH_CODEX.md"):
        if marker not in report:
            errors.append(f"observability readiness report is missing marker: {marker}")
    notification = load_json(ROOT / ".agents/config/notifications.json").get("adapter", {})
    state_line = (
        "Notification state: "
        f"implementation={notification.get('implementation')}; "
        f"activation={notification.get('activation')}; "
        f"deliveryConformance={notification.get('deliveryConformance')}; "
        f"sendAllowed={str(notification.get('sendAllowed')).lower()}."
    )
    for path in (
        ROOT / ".agents/bootstrap/2026-08-29-observability-readiness-report.md",
        ROOT / ".agents/project/current-state.md",
        ROOT / "04_USING_THIS_REPO_WITH_CODEX.md",
    ):
        content = path.read_text(encoding="utf-8")
        if state_line not in content:
            errors.append(f"{path.relative_to(ROOT)} does not match structured notification readiness state")
        if notification.get("implementation") == "IMPLEMENTED" and re.search(r"ACS Email implementation is (?:`?MISSING`?|missing)", content):
            errors.append(f"{path.relative_to(ROOT)} contains stale missing-implementation notification truth")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("event", nargs="?", help="optional event JSON to validate")
    args = parser.parse_args()
    errors = validate_configuration()
    if args.event:
        errors.extend(validate_event(load_json(Path(args.event))))
    if errors:
        for error in sorted(set(errors)):
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Agent Operations & Observability validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
