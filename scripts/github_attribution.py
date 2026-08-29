#!/usr/bin/env python3
"""Render and validate the Doculyra GitHub agent-attribution footer."""

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


def render(values: dict[str, str], config: dict[str, Any] | None = None) -> str:
    selected = config or load_config()
    required = selected["requiredFields"]
    missing = [field for field in required if not values.get(field)]
    if missing:
        raise ValueError(f"missing attribution fields: {', '.join(missing)}")
    pattern = re.compile(selected["identifierPattern"])
    for field in required:
        items = _items(values[field], selected["listSeparator"], field) if field.endswith("_ids") else [values[field]]
        if any(not pattern.fullmatch(item) for item in items):
            raise ValueError(f"invalid attribution value for {field}")
    _validate_registry_claims(values, selected)
    fields = "; ".join(f"{field}={values[field]}" for field in required)
    return f"{selected['marker']}\n{selected['footerPrefix']} {fields}"


def validate(text: str, config: dict[str, Any] | None = None) -> list[str]:
    selected = config or load_config()
    errors: list[str] = []
    if text.count(selected["marker"]) != 1:
        errors.append("GitHub evidence must contain exactly one attribution marker")
        return errors
    footer = text.split(selected["marker"], 1)[1].strip()
    if not footer.startswith(selected["footerPrefix"]):
        errors.append("GitHub evidence attribution footer has an invalid prefix")
        return errors
    values: dict[str, str] = {}
    for part in footer[len(selected["footerPrefix"]):].strip().split("; "):
        if "=" not in part:
            errors.append("GitHub evidence attribution footer is malformed")
            continue
        key, value = part.split("=", 1)
        if key in values:
            errors.append(f"GitHub evidence attribution repeats field {key}")
        values[key] = value
    unexpected = sorted(set(values) - set(selected["requiredFields"]))
    if unexpected:
        errors.append(f"GitHub evidence attribution contains unexpected fields: {', '.join(unexpected)}")
    try:
        expected = render(values, selected)
    except ValueError as exc:
        errors.append(str(exc))
    else:
        if not text.rstrip().endswith(expected):
            errors.append("GitHub evidence attribution must be the final normalized footer")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    render_parser = subparsers.add_parser("render")
    for field in load_config()["requiredFields"]:
        render_parser.add_argument(f"--{field.replace('_', '-')}", required=True)
    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("path")
    args = parser.parse_args()
    if args.command == "render":
        values = {field: getattr(args, field) for field in load_config()["requiredFields"]}
        print(render(values))
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
