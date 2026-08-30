#!/usr/bin/env python3
"""Idempotently reconcile Doculyra's governed GitHub Project configuration."""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".agents/project/control-centre.json"

OPTION_COLORS = ["GRAY", "BLUE", "GREEN", "YELLOW", "ORANGE", "RED", "PINK", "PURPLE"]
OPTION_ALIASES = {
    "Status": {"Backlog": "Todo", "Development": "In Progress"},
    "Work Type": {"Bug": "Defect"},
}


def load_config() -> dict[str, Any]:
    with CONFIG_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def graphql(query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = {"query": query, "variables": variables or {}}
    result = subprocess.run(
        ["gh", "api", "graphql", "--input", "-"],
        cwd=ROOT,
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=False,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "GitHub GraphQL request failed")
    response = json.loads(result.stdout)
    if response.get("errors"):
        raise RuntimeError(json.dumps(response["errors"], sort_keys=True))
    return response["data"]


def build_plan(config: dict[str, Any]) -> dict[str, Any]:
    project = config["githubProject"]
    return {
        "project": project["url"],
        "fieldOptionSets": sorted(project["fieldOptions"]),
        "views": [item["name"] for item in project["views"]],
        "currentItems": [f'{item["kind"]} #{item["number"]}' for item in project["currentItemMetadata"]],
        "autoAdd": {
            "provider": project["automation"]["provider"],
            "repository": project["automation"]["autoAdd"]["repository"],
            "filter": project["automation"]["autoAdd"]["filter"],
            "managedByThisScript": False,
        },
        "qualityGateBoundary": project["automation"]["qualityGateBoundary"],
    }


def query_project(config: dict[str, Any]) -> dict[str, Any]:
    project = config["githubProject"]
    query = f'''query {{
      user(login:"{project["owner"]}") {{
        projectV2(number:{project["number"]}) {{
          id title url
          fields(first:100) {{ nodes {{
            __typename
            ... on ProjectV2Field {{ id name dataType }}
            ... on ProjectV2SingleSelectField {{ id name dataType options {{ id name color description }} }}
            ... on ProjectV2IterationField {{ id name dataType }}
          }} }}
          views(first:50) {{ nodes {{ id number name layout filter }} }}
          items(first:100) {{ nodes {{
            id
            workType: fieldValueByName(name:"Work Type") {{
              ... on ProjectV2ItemFieldSingleSelectValue {{ name }}
            }}
            statusValue: fieldValueByName(name:"Status") {{
              ... on ProjectV2ItemFieldSingleSelectValue {{ name }}
            }}
            content {{
              __typename
              ... on Issue {{ number }}
              ... on PullRequest {{ number }}
            }}
          }} }}
        }}
      }}
    }}'''
    live = graphql(query)["user"]["projectV2"]
    if live["id"] != project["id"] or live["url"] != project["url"]:
        raise RuntimeError("live Project identity does not match repository configuration")
    return live


def reconcile_options(config: dict[str, Any], live: dict[str, Any]) -> list[str]:
    fields = {item.get("name"): item for item in live["fields"]["nodes"] if item.get("name")}
    applied = []
    mutation = '''mutation($input:UpdateProjectV2FieldInput!) {
      updateProjectV2Field(input:$input) {
        projectV2Field { ... on ProjectV2SingleSelectField { id name options { id name } } }
      }
    }'''
    for field_name, expected_names in config["githubProject"]["fieldOptions"].items():
        field = fields.get(field_name)
        if not field or field["__typename"] != "ProjectV2SingleSelectField":
            raise RuntimeError(f"required single-select field unavailable: {field_name}")
        current = {item["name"]: item for item in field["options"]}
        usage_key = {"Work Type": "workType", "Status": "statusValue"}.get(field_name)
        used_names = {
            item[usage_key]["name"]
            for item in live["items"]["nodes"]
            if usage_key and item.get(usage_key) and item[usage_key].get("name")
        }
        permitted_alias_sources = set(OPTION_ALIASES.get(field_name, {}).values())
        removed_in_use = used_names - set(expected_names) - permitted_alias_sources
        if removed_in_use:
            raise RuntimeError(f"field {field_name} has in-use options without a governed migration: {sorted(removed_in_use)}")
        options = []
        for index, name in enumerate(expected_names):
            old_name = OPTION_ALIASES.get(field_name, {}).get(name, name)
            existing = current.get(name) or current.get(old_name)
            option = {
                "name": name,
                "color": existing["color"] if existing else OPTION_COLORS[index % len(OPTION_COLORS)],
                "description": existing.get("description", "") if existing else "",
            }
            if existing:
                option["id"] = existing["id"]
            options.append(option)
        if [item["name"] for item in field["options"]] != expected_names:
            graphql(mutation, {"input": {"fieldId": field["id"], "singleSelectOptions": options}})
            applied.append(f"field-options:{field_name}")
    return applied


def reconcile_views(config: dict[str, Any], live: dict[str, Any]) -> list[str]:
    fields = {item.get("name"): item for item in live["fields"]["nodes"] if item.get("name")}
    views = {item["name"]: item for item in live["views"]["nodes"]}
    mutation = '''mutation($input:UpdateProjectV2ViewInput!) {
      updateProjectV2View(input:$input) { projectV2View { id name layout filter } }
    }'''
    applied = []
    for expected in config["githubProject"]["views"]:
        view = views.get(expected["name"])
        if not view:
            raise RuntimeError(f"required Project view unavailable: {expected['name']}")
        update_input: dict[str, Any] = {
            "viewId": view["id"],
            "layout": expected["layout"],
        }
        if expected["layout"] != "ROADMAP_LAYOUT":
            visible_ids = []
            for field_name in expected["visibleFields"]:
                field = fields.get(field_name)
                if not field:
                    raise RuntimeError(f"view {expected['name']} references unavailable field {field_name}")
                visible_ids.append(field["id"])
            update_input["configuration"] = {"visibleFieldIds": visible_ids}
        if expected["filter"] is not None:
            update_input["filter"] = expected["filter"]
        graphql(mutation, {"input": update_input})
        applied.append(f"view:{expected['name']}")
    return applied


def set_item_values(project_id: str, item_id: str, values: list[dict[str, Any]]) -> None:
    declarations = ", ".join(f"$input{index}:UpdateProjectV2ItemFieldValueInput!" for index in range(len(values)))
    mutations = " ".join(
        f'v{index}:updateProjectV2ItemFieldValue(input:$input{index}) {{ projectV2Item {{ id }} }}'
        for index in range(len(values))
    )
    query = f"mutation({declarations}) {{ {mutations} }}"
    variables = {
        f"input{index}": {"projectId": project_id, "itemId": item_id, **value}
        for index, value in enumerate(values)
    }
    graphql(query, variables)


def reconcile_items(config: dict[str, Any], live: dict[str, Any]) -> list[str]:
    project = config["githubProject"]
    fields = {item.get("name"): item for item in live["fields"]["nodes"] if item.get("name")}
    items: dict[tuple[str, int], str] = {}
    for item in live["items"]["nodes"]:
        content = item.get("content")
        if not content or content.get("number") is None:
            continue
        kind = content.get("__typename")
        if kind in {"Issue", "PullRequest"}:
            items[(kind, content["number"])] = item["id"]
    observed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    applied = []
    for record in project["currentItemMetadata"]:
        item_id = items.get((record["kind"], record["number"]))
        if not item_id:
            raise RuntimeError(f"Project item unavailable: {record['kind']} #{record['number']}")
        desired = {key: value for key, value in record.items() if key not in {"kind", "number"}}
        desired["Last Agent Update"] = observed_at
        updates = []
        for field_name, value in desired.items():
            field = fields.get(field_name)
            if not field:
                raise RuntimeError(f"current item metadata references unavailable field {field_name}")
            if field["__typename"] == "ProjectV2SingleSelectField":
                option = next((item for item in field["options"] if item["name"] == value), None)
                if not option:
                    raise RuntimeError(f"field {field_name} has no option {value}")
                field_value = {"singleSelectOptionId": option["id"]}
            elif field.get("dataType") == "TEXT":
                field_value = {"text": str(value)}
            elif field.get("dataType") == "DATE" and field_name == "Last Agent Update":
                field_value = {"date": observed_at[:10]}
            else:
                raise RuntimeError(f"unsupported current metadata field type: {field_name} ({field.get('dataType')})")
            updates.append({"fieldId": field["id"], "value": field_value})
        set_item_values(project["id"], item_id, updates)
        applied.append(f'{record["kind"]} #{record["number"]}')
    return applied


def apply(config: dict[str, Any]) -> dict[str, Any]:
    live = query_project(config)
    operations = reconcile_options(config, live)
    # Refresh option identities after preserving/renaming and creating options.
    live = query_project(config)
    operations.extend(reconcile_views(config, live))
    operations.extend(f"item:{item}" for item in reconcile_items(config, live))
    return {"status": "APPLIED", "operations": operations, "project": config["githubProject"]["url"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Apply the versioned Project contract; default is dry-run.")
    args = parser.parse_args()
    config = load_config()
    result = apply(config) if args.apply else {"status": "DRY_RUN", **build_plan(config)}
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
