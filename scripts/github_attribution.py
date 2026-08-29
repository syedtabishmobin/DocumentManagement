#!/usr/bin/env python3
"""Render and validate Doculyra's three-level GitHub agent attribution."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / ".agents/project/github-attribution.json"
TEAM = ROOT / ".agents/project/team.json"
CAPABILITIES = ROOT / ".agents/capabilities/registry.json"
TOOLS = ROOT / ".agents/tools/registry.json"
OBSERVABILITY = ROOT / ".agents/project/observability.json"


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _items(value: str, separator: str, field: str) -> list[str]:
    items = value.split(separator)
    if any(not item for item in items):
        raise ValueError(f"{field} must not contain empty list items")
    if len(items) != len(set(items)):
        raise ValueError(f"{field} must not contain duplicate IDs")
    return items


def _assignments(selected: dict[str, Any]) -> list[dict[str, Any]]:
    return _load(ROOT / selected["identityAssignments"]).get("assignments", [])


def _validate_registry_claims(values: dict[str, str], selected: dict[str, Any]) -> None:
    team = _load(TEAM)
    capability_registry = _load(CAPABILITIES)
    tool_registry = _load(TOOLS)
    observability = _load(OBSERVABILITY)
    roles = {item["id"]: item for item in team.get("persistentRoles", [])}
    role = roles.get(values["role_id"])
    if not role:
        raise ValueError(f"role_id is not registered: {values['role_id']}")
    separator = selected["listSeparator"]
    capability_ids = _items(values["capability_ids"], separator, "capability_ids")
    skill_ids = _items(values["skill_ids"], separator, "skill_ids")
    tool_ids = _items(values["tool_ids"], separator, "tool_ids")
    registered_capabilities = {item["id"]: item for item in capability_registry.get("capabilities", [])}
    allowed_role_capabilities = set(role.get("capabilities", []))
    for capability_id in capability_ids:
        if capability_id not in registered_capabilities and capability_id not in allowed_role_capabilities:
            raise ValueError(f"capability_ids contains unregistered ID: {capability_id}")
        if capability_id not in allowed_role_capabilities:
            raise ValueError(f"role_id {values['role_id']} is not authorised for capability {capability_id}")
    external_skills = set(observability.get("attribution", {}).get("externalSkillIds", []))
    local_skills = {path.parent.name for path in (ROOT / ".agents/skills").glob("*/SKILL.md")}
    for skill_id in skill_ids:
        if skill_id not in local_skills and skill_id not in external_skills:
            raise ValueError(f"skill_ids contains unregistered ID: {skill_id}")
        if skill_id in local_skills:
            matching_capabilities = {
                capability_id for capability_id, item in registered_capabilities.items()
                if Path(item.get("skill", "")).parent.name == skill_id
            }
            if not matching_capabilities.intersection(capability_ids):
                raise ValueError(f"skill_id {skill_id} is not matched by capability_ids")
    external_tools = set(observability.get("attribution", {}).get("externalToolIds", []))
    registered_tools = {item["id"] for item in tool_registry.get("tools", [])}
    for tool_id in tool_ids:
        if tool_id not in registered_tools and tool_id not in external_tools:
            raise ValueError(f"tool_ids contains unregistered ID: {tool_id}")


def _validate_identity(values: dict[str, str], selected: dict[str, Any]) -> None:
    if not re.fullmatch(selected["displayAgentIdPattern"], values["display_agent_id"]):
        raise ValueError("display_agent_id is invalid")
    if not re.fullmatch(selected["displayRunIdPattern"], values["display_run_id"]):
        raise ValueError("display_run_id is invalid")
    if not re.fullmatch(selected["activityPattern"], values["activity"]):
        raise ValueError("activity is invalid")
    if not re.fullmatch(selected["commitPattern"], values["commit"]):
        raise ValueError("commit is invalid")
    for field in ("display_role", "work_item_label"):
        if not values[field].strip() or len(values[field]) > 200 or "\n" in values[field] or "\r" in values[field]:
            raise ValueError(f"{field} must be bounded single-line text")
    presentation = next((item for item in selected["rolePresentations"] if item["roleId"] == values["role_id"] and item["displayRole"] == values["display_role"] and re.fullmatch(item["displayIdPattern"], values["display_agent_id"])), None)
    if not presentation:
        raise ValueError("display agent ID and role do not match an approved role presentation")
    assignment = next((item for item in _assignments(selected) if item.get("displayAgentId") == values["display_agent_id"] and item.get("displayRunId") == values["display_run_id"]), None)
    if not assignment:
        raise ValueError("display agent/run identity is not assigned")
    expected = {
        "displayRole": values["display_role"],
        "runtimeAgentId": values["runtime_agent_id"],
        "runtimeRunId": values["runtime_run_id"],
        "roleId": values["role_id"],
        "parentDisplayAgentId": values["parent_display_agent_id"],
        "workItem": values["work_item"],
    }
    for field, expected_value in expected.items():
        if assignment.get(field) != expected_value:
            raise ValueError(f"assigned identity does not match {field}")
    if assignment.get("status") not in {"ACTIVE", "COMPLETED"}:
        raise ValueError("assigned identity status cannot validate material evidence")
    parent = values["parent_display_agent_id"]
    if parent != selected["noParentValue"] and not any(item.get("displayAgentId") == parent for item in _assignments(selected)):
        raise ValueError("parent_display_agent_id is not assigned")


def _validate_values(values: dict[str, str], selected: dict[str, Any]) -> None:
    required = selected["requiredFields"]
    missing = [field for field in required if not values.get(field)]
    if missing:
        raise ValueError(f"missing attribution fields: {', '.join(missing)}")
    unexpected = sorted(set(values) - set(required))
    if unexpected:
        raise ValueError(f"unexpected attribution fields: {', '.join(unexpected)}")
    pattern = re.compile(selected["identifierPattern"])
    free_text_fields = {"display_role", "work_item_label"}
    for field in required:
        if field in free_text_fields:
            continue
        items = _items(values[field], selected["listSeparator"], field) if field in selected["listFields"] else [values[field]]
        if field == "parent_display_agent_id" and values[field] == selected["noParentValue"]:
            continue
        if field in {"display_agent_id", "display_run_id", "activity", "commit"}:
            continue
        if any(not pattern.fullmatch(item) for item in items):
            raise ValueError(f"invalid attribution value for {field}")
    _validate_registry_claims(values, selected)
    _validate_identity(values, selected)


def visible_header(values: dict[str, str]) -> str:
    return f"**🤖 {values['display_role']} · {values['display_agent_id']}**  \n`{values['activity']}` · `{values['display_run_id']}`"


def execution_details(values: dict[str, str], selected: dict[str, Any]) -> str:
    def bullets(field: str) -> str:
        return "\n".join(f"- `{item}`" for item in _items(values[field], selected["listSeparator"], field))

    return "\n".join([
        "<details>",
        "<summary>Agent execution details</summary>",
        "",
        f"Parent: {values['parent_display_agent_id']}",
        f"Work item: {values['work_item_label']}",
        "",
        "Capabilities:",
        bullets("capability_ids"),
        "",
        "Skills:",
        bullets("skill_ids"),
        "",
        "Tools:",
        bullets("tool_ids"),
        "",
        f"Commit: `{values['commit']}`",
        f"Environment: `{values['environment']}`",
        "",
        "</details>",
    ])


def hidden_metadata(values: dict[str, str], selected: dict[str, Any]) -> str:
    body = "\n".join(f"{field}={values[field]}" for field in selected["requiredFields"])
    return f"{selected['markerStart']}\n{body}\n{selected['markerEnd']}"


def render(values: dict[str, str], body: str = "", config: dict[str, Any] | None = None) -> str:
    selected = config or load_config()
    _validate_values(values, selected)
    substantive_body = body.strip()
    if selected.get("substantiveBodyRequired") and not substantive_body:
        raise ValueError("material GitHub evidence requires a substantive body")
    sections = [visible_header(values), execution_details(values, selected), substantive_body]
    sections.append(hidden_metadata(values, selected))
    return "\n\n".join(sections)


def validate(text: str, config: dict[str, Any] | None = None) -> list[str]:
    selected = config or load_config()
    errors: list[str] = []
    normalized = text.rstrip()
    if any(marker in normalized for marker in selected.get("legacyMarkers", [])):
        errors.append("GitHub evidence uses legacy attribution metadata; v2 visible attribution is required")
    if normalized.count(selected["markerStart"]) != 1:
        errors.append("GitHub evidence must contain exactly one v2 agent-meta marker")
        return errors
    before, metadata = normalized.rsplit(selected["markerStart"], 1)
    if not metadata.endswith(selected["markerEnd"]):
        errors.append("GitHub evidence hidden agent metadata must be final")
        return errors
    metadata = metadata[:-len(selected["markerEnd"])].strip()
    values: dict[str, str] = {}
    for line in metadata.splitlines():
        if "=" not in line:
            errors.append("GitHub evidence hidden agent metadata is malformed")
            continue
        key, value = line.split("=", 1)
        if key in values:
            errors.append(f"GitHub evidence hidden agent metadata repeats field {key}")
        values[key] = value
    try:
        _validate_values(values, selected)
    except ValueError as exc:
        errors.append(str(exc))
    else:
        header = visible_header(values)
        details = execution_details(values, selected)
        expected_start = header + "\n\n" + details + "\n\n"
        if not normalized.startswith(expected_start):
            errors.append("GitHub evidence must begin with Level 1 identity immediately followed by Level 2 execution details")
        if before.count(details) != 1:
            errors.append("GitHub evidence must contain exactly one matching execution-details block")
        if selected.get("substantiveBodyRequired"):
            substantive_body = before[len(expected_start):].strip() if before.startswith(expected_start) else ""
            if not substantive_body:
                errors.append("GitHub evidence requires a substantive body between Level 2 execution details and Level 3 hidden metadata")
        expected_metadata = hidden_metadata(values, selected)
        if not text.rstrip().endswith(expected_metadata):
            errors.append("GitHub evidence hidden agent metadata must be the final normalized block")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    render_parser = subparsers.add_parser("render")
    wrap_parser = subparsers.add_parser("wrap")
    for command_parser in (render_parser, wrap_parser):
        for field in load_config()["requiredFields"]:
            command_parser.add_argument(f"--{field.replace('_', '-')}", required=True)
    for command_parser in (render_parser, wrap_parser):
        command_parser.add_argument("--body-file", required=True)
    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("path")
    args = parser.parse_args()
    if args.command in {"render", "wrap"}:
        values = {field: getattr(args, field) for field in load_config()["requiredFields"]}
        body = Path(args.body_file).read_text(encoding="utf-8")
        print(render(values, body))
        return 0
    errors = validate(Path(args.path).read_text(encoding="utf-8"))
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("GitHub agent attribution valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
