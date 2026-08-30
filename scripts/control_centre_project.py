#!/usr/bin/env python3
"""Validate Doculyra's persistent GitHub Project control-centre layer."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".agents/project/control-centre.json"
EXPECTED_VIEWS = {
    "Executive": "TABLE_LAYOUT",
    "Delivery Board": "BOARD_LAYOUT",
    "Product Backlog": "TABLE_LAYOUT",
    "Active Work": "BOARD_LAYOUT",
    "QA & Defects": "TABLE_LAYOUT",
    "Human Decisions": "TABLE_LAYOUT",
    "Stage & UAT": "TABLE_LAYOUT",
    "Roadmap": "ROADMAP_LAYOUT",
    "Completed": "TABLE_LAYOUT",
    "Trends": "TABLE_LAYOUT",
}
EXPECTED_VIEW_FILTERS = {
    "Executive": None,
    "Delivery Board": None,
    "Product Backlog": "status:Backlog,Ready",
    "Active Work": 'status:Analysis,Development,QA,"Fix Required"',
    "QA & Defects": '"Work Type":Story,Bug "QA State":REQUIRED,PENDING,FAIL,BLOCKED',
    "Human Decisions": '"Human Decision Required":Yes',
    "Stage & UAT": 'status:Stage,"BA Acceptance","Ready for UAT",UAT',
    "Roadmap": None,
    "Completed": "status:Done",
    "Trends": None,
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def configured_checks(config: dict[str, Any]) -> list[dict[str, str]]:
    project = config["githubProject"]
    fields = project["fields"]
    views = project["views"]
    checks = []

    def add(check_id: str, passed: bool, evidence: str) -> None:
        checks.append({"id": check_id, "status": "PASS" if passed else "FAIL", "evidence": evidence})

    add("CC-PROJ-001", project["title"] == "Doculyra Product Delivery" and project["number"] == 1, "Stable Project title and number")
    add("CC-PROJ-002", len(fields) == 22 and len(set(fields)) == 22, "Twenty-two unique required semantic fields")
    add("CC-PROJ-003", project.get("fieldAliases") == {"Type": "Work Type"}, "Reserved Type compatibility mapping is explicit")
    add("CC-PROJ-004", {item["name"]: item["layout"] for item in views} == EXPECTED_VIEWS, "All ten saved views and layouts")
    add("CC-PROJ-004A", {item["name"]: item.get("filter") for item in views} == EXPECTED_VIEW_FILTERS, "Saved-view filters use governed Status, Work Type, QA and UAT semantics")
    add("CC-PROJ-004B", all(
        (item["layout"] == "ROADMAP_LAYOUT" and not item.get("visibleFields") and item.get("itemMetadataFields"))
        or (item.get("visibleFields") and set(item["visibleFields"]).issubset(set(fields)))
        for item in views
    ), "Every saved view declares supported governed visible or drill-through fields")
    add("CC-PROJ-005", len({item["url"] for item in views}) == 10 and all("/projects/1/views/" in item["url"] for item in views), "Distinct persistent saved-view URLs")
    add("CC-PROJ-006", project["url"] == "https://github.com/users/syedtabishmobin/projects/1", "Persistent Project access URL")
    automation = project.get("automation", {})
    add("CC-PROJ-007", automation.get("provider") == "GITHUB_PROJECTS_BUILT_IN" and automation.get("autoAdd", {}).get("repository") == config["repository"] and automation.get("autoAdd", {}).get("status") == "ENABLED", "Native auto-add automation contract")
    measures = config.get("progressMeasures", [])
    add("CC-PROJ-008", len(measures) == 6 and len({item["id"] for item in measures}) == 6 and all(item.get("formula") and item.get("completionBoundary") for item in measures), "Six non-conflated progress measures")
    return checks


def gh_json(*args: str) -> Any:
    result = subprocess.run(["gh", *args], cwd=ROOT, text=True, capture_output=True, check=False, timeout=30)
    if result.returncode != 0:
        raise ValueError(result.stderr.strip() or "GitHub Project query failed")
    return json.loads(result.stdout)


def project_item_json_key(field_name: str) -> str:
    """Match the stable field-key casing emitted by `gh project item-list`."""
    return field_name[:1].lower() + field_name[1:]


def current_item_metadata_check(config: dict[str, Any], items: list[dict[str, Any]]) -> tuple[bool, str]:
    """Compare governed current-item values, not merely Project item presence."""
    indexed: dict[tuple[str, int], dict[str, Any]] = {}
    for item in items:
        content = item.get("content") or {}
        number = content.get("number")
        kind = content.get("type")
        if isinstance(number, int) and kind in {"Issue", "PullRequest"}:
            indexed[(kind, number)] = item
    differences = []
    for expected in config["githubProject"]["currentItemMetadata"]:
        identity = (expected["kind"], expected["number"])
        actual = indexed.get(identity)
        if actual is None:
            differences.append(f"{identity[0]} #{identity[1]} missing")
            continue
        for field_name, expected_value in expected.items():
            if field_name in {"kind", "number"}:
                continue
            actual_value = actual.get(project_item_json_key(field_name))
            if actual_value != expected_value:
                differences.append(
                    f"{identity[0]} #{identity[1]} {field_name}: expected {expected_value!r}, observed {actual_value!r}"
                )
    if differences:
        return False, "; ".join(differences)
    return True, f"All {len(config['githubProject']['currentItemMetadata'])} governed current items match configured semantic metadata"


def online_checks(config: dict[str, Any]) -> list[dict[str, str]]:
    project = config["githubProject"]
    query = f'''query {{
      user(login:"{project["owner"]}") {{
        projectV2(number:{project["number"]}) {{
          id title url
          items(first:1) {{ totalCount }}
          fields(first:100) {{ nodes {{
            __typename
            ... on ProjectV2Field {{ name }}
            ... on ProjectV2SingleSelectField {{ name options {{ name }} }}
            ... on ProjectV2IterationField {{ name }}
          }} }}
          views(first:50) {{ nodes {{
            number name layout filter
            fields(first:100) {{ nodes {{
              ... on ProjectV2Field {{ name }}
              ... on ProjectV2SingleSelectField {{ name }}
              ... on ProjectV2IterationField {{ name }}
            }} }}
          }} }}
          workflows(first:50) {{ nodes {{ number name enabled }} }}
        }}
      }}
    }}'''
    live = gh_json("api", "graphql", "-f", f"query={query}")["data"]["user"]["projectV2"]
    project_items = gh_json(
        "project", "item-list", str(project["number"]), "--owner", project["owner"],
        "--format", "json", "--limit", "100",
    )["items"]
    views = live["views"]["nodes"]
    workflows = live["workflows"]["nodes"]
    actual_fields = {item.get("name") for item in live["fields"]["nodes"] if item.get("name")}
    actual_options = {
        item["name"]: [option["name"] for option in item.get("options", [])]
        for item in live["fields"]["nodes"] if item.get("options") is not None
    }
    actual_views = {item["name"]: item["layout"] for item in views}
    actual_view_filters = {item["name"]: item.get("filter") for item in views}
    actual_view_fields = {
        item["name"]: {field.get("name") for field in item["fields"]["nodes"] if field.get("name")}
        for item in views
    }
    expected_view_fields = {item["name"]: set(item["visibleFields"]) for item in project["views"] if item["layout"] != "ROADMAP_LAYOUT"}
    required_fields = set(project["fields"])
    workflow_state = {item["name"]: item["enabled"] for item in workflows}
    current_items_pass, current_items_evidence = current_item_metadata_check(config, project_items)
    result = []

    def add(check_id: str, passed: bool, evidence: str) -> None:
        result.append({"id": check_id, "status": "PASS" if passed else "FAIL", "evidence": evidence})

    add("CC-PROJ-ONLINE-001", live["id"] == project["id"] and live["url"] == project["url"] and live["title"] == project["title"], "Live Project identity matches repository configuration")
    add("CC-PROJ-ONLINE-002", required_fields.issubset(actual_fields), f"Live fields include all {len(required_fields)} configured semantic fields")
    add("CC-PROJ-ONLINE-003", actual_views == EXPECTED_VIEWS, "Live saved view names and layouts match configuration")
    add("CC-PROJ-ONLINE-003A", actual_view_filters == EXPECTED_VIEW_FILTERS, "Live saved-view filters match governed semantics")
    add("CC-PROJ-ONLINE-003B", all(expected.issubset(actual_view_fields.get(name, set())) for name, expected in expected_view_fields.items()), "Live views expose all configured management and delivery fields")
    add("CC-PROJ-ONLINE-004", live["items"]["totalCount"] >= 61, f"Live Project contains {live['items']['totalCount']} governed Issue/PR records")
    add("CC-PROJ-ONLINE-004A", current_items_pass, current_items_evidence)
    add("CC-PROJ-ONLINE-005", all(actual_options.get(name) == options for name, options in project["fieldOptions"].items()), "Live Work Type, Status and Priority option contracts match")
    add("CC-PROJ-ONLINE-006", workflow_state.get("Auto-add to project") is True and workflow_state.get("Item closed") is True and workflow_state.get("Pull request merged") is True, "Native auto-add and closure workflows are enabled")
    return result


def report(online: bool) -> dict[str, Any]:
    config = load_json(CONFIG_PATH)
    checks = configured_checks(config)
    online_status = "NOT_QUERIED"
    online_error = None
    if online:
        try:
            checks.extend(online_checks(config))
            online_status = "MEASURED"
        except (OSError, ValueError, json.JSONDecodeError, subprocess.TimeoutExpired) as exc:
            online_status = "UNAVAILABLE"
            online_error = str(exc)
            checks.append({"id": "CC-PROJ-ONLINE", "status": "FAIL", "evidence": online_error})
    project = config["githubProject"]
    return {
        "status": "PASS" if all(item["status"] == "PASS" for item in checks) else "FAIL",
        "onlineStatus": online_status,
        "onlineError": online_error,
        "checks": checks,
        "projectUrl": project["url"],
        "viewUrls": {item["name"]: item["url"] for item in project["views"]},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--online", action="store_true")
    args = parser.parse_args()
    result = report(args.online)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
