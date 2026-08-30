#!/usr/bin/env python3
"""Reconcile the approved Phase 1 hierarchy into the GitHub Product Backlog.

The repository remains the normative contract source. GitHub Project draft items are
the operational planning surface until a story is promoted to an attributed Issue.
Story bodies retain their acceptance criteria and test/evaluation task mapping so the
hierarchy does not become a flat, lossy checklist.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from datetime import date
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = "syedtabishmobin/DocumentManagement"
OWNER = "syedtabishmobin"
PROJECT_NUMBER = 1
BASELINE = "DOCULYRA-BUILD-P1-2026.08.30.1"

SCOPE_PATH = ROOT / "docs/01-product/06-scope-and-success-metrics.md"
EPIC_PATH = ROOT / "docs/10-backlog/01-epics.md"
FEATURE_PATH = ROOT / "docs/01-product/03-feature-catalogue.md"
STORY_PATH = ROOT / "docs/10-backlog/02-features-and-stories.md"
BASELINE_PATH = ROOT / "docs/10-backlog/build-baseline.v1.json"

DISPLAY_AGENT_ID = "BA-002"
DISPLAY_ROLE = "Product Business Analyst"
DISPLAY_RUN_ID = "RUN-20260830-0080"
RUNTIME_AGENT_ID = "codex-01a051b6-7efe-79e2-a09f-2ea895067927"
RUNTIME_RUN_ID = "run-phase1-backlog-reconcile-20260830"


def run_json(args: list[str], *, input_text: str | None = None) -> Any:
    result = subprocess.run(
        args,
        cwd=ROOT,
        input=input_text,
        text=True,
        capture_output=True,
        check=False,
        timeout=90,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "command failed")
    return json.loads(result.stdout)


def table_cells(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def clean_inline(value: str) -> str:
    value = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", value)
    return value.replace("`", "").replace("**", "").strip()


def heading_sections(text: str, pattern: str) -> dict[str, tuple[str, str]]:
    matches = list(re.finditer(pattern, text, flags=re.MULTILINE))
    sections: dict[str, tuple[str, str]] = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections[match.group(1)] = (match.group(2).strip(), text[match.start():end].strip())
    return sections


def contract_fields(section: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for line in section.splitlines():
        if not line.startswith("|"):
            continue
        cells = table_cells(line)
        if len(cells) >= 2 and cells[0] not in {"Field", "---"}:
            fields[clean_inline(cells[0])] = cells[1].strip()
    return fields


def wrap_body(body: str, stable_id: str, commit: str) -> str:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
        handle.write(body.strip() + "\n")
        body_path = handle.name
    try:
        result = subprocess.run(
            [
                "python3", "scripts/github_attribution.py", "wrap",
                "--body-file", body_path,
                "--display-agent-id", DISPLAY_AGENT_ID,
                "--display-role", DISPLAY_ROLE,
                "--activity", "phase1-backlog-reconciliation",
                "--display-run-id", DISPLAY_RUN_ID,
                "--runtime-agent-id", RUNTIME_AGENT_ID,
                "--runtime-run-id", RUNTIME_RUN_ID,
                "--role-id", "product-ba",
                "--parent-display-agent-id", "ORCH-009",
                "--work-item", "issue-32",
                "--work-item-label", f"Issue #32 / {stable_id} backlog item",
                "--capability-ids", "acceptance-test-mapping,github-issue-control-plane",
                "--skill-ids", "acceptance-test-mapping,github-issue-control-plane",
                "--tool-ids", "git,github-issues,github-projects,pnpm-node",
                "--commit", commit,
                "--environment", "agent-local",
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip())
        return result.stdout
    finally:
        Path(body_path).unlink(missing_ok=True)


def build_records(commit: str) -> list[dict[str, Any]]:
    scope = SCOPE_PATH.read_text(encoding="utf-8")
    epics_text = EPIC_PATH.read_text(encoding="utf-8")
    features_text = FEATURE_PATH.read_text(encoding="utf-8")
    stories_text = STORY_PATH.read_text(encoding="utf-8")
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))

    feature_sections = heading_sections(
        features_text, r"^### `((?:FEAT)-P1-\d{3})` — (.+)$"
    )
    story_sections = heading_sections(
        stories_text, r"^### `((?:STORY)-P1-\d{3})` — (.+)$"
    )
    epic_sections = heading_sections(
        epics_text, r"^### `((?:EPIC)-P1-\d{3})` — (.+)$"
    )

    outcome_rows: dict[str, list[str]] = {}
    metric_rows: dict[str, list[str]] = {}
    epic_rows: dict[str, list[str]] = {}
    for line in scope.splitlines():
        cells = table_cells(line) if line.startswith("|") else []
        if cells and re.fullmatch(r"`OUT-P1-\d{3}`", cells[0]):
            outcome_rows[clean_inline(cells[0])] = cells
        if cells and re.fullmatch(r"`MET-P1-\d{3}`", cells[0]):
            metric_rows[clean_inline(cells[0])] = cells
    for line in epics_text.splitlines():
        cells = table_cells(line) if line.startswith("|") else []
        if cells and re.match(r"`EPIC-P1-\d{3}`", cells[0]):
            match = re.search(r"EPIC-P1-\d{3}", cells[0])
            if match:
                epic_rows[match.group()] = cells

    story_to_epic = {
        story: epic
        for epic, stories in baseline["epicStoryOwnership"].items()
        for story in stories
    }
    feature_to_epics: dict[str, list[str]] = {}
    for epic_id, cells in epic_rows.items():
        for feature_id in re.findall(r"FEAT-P1-\d{3}", " ".join(cells)):
            feature_to_epics.setdefault(feature_id, []).append(epic_id)

    feature_outcomes: dict[str, list[str]] = {}
    for feature_id, (_, section) in feature_sections.items():
        fields = contract_fields(section)
        feature_outcomes[feature_id] = re.findall(r"OUT-P1-\d{3}", fields.get("Outcome", ""))

    records: list[dict[str, Any]] = []

    for outcome_id in baseline["approvedHierarchy"]["outcomes"]:
        cells = outcome_rows[outcome_id]
        description = clean_inline(cells[1])
        metrics = [metric_id for metric_id, row in metric_rows.items() if outcome_id in " ".join(row)]
        features = [feature_id for feature_id, outcomes in feature_outcomes.items() if outcome_id in outcomes]
        body = f"""## Approved Phase 1 goal/outcome

**Stable ID:** `{outcome_id}`  
**Vision:** `PROD-VIS-001`  
**Baseline:** `{BASELINE}`  
**Status:** approved build outcome; achievement, Stage, BA, UAT and release evidence remain open.

{description}

## Success criteria and delivery coverage

- Measurement contracts: {', '.join(f'`{item}`' for item in metrics)}
- Governing features: {', '.join(f'`{item}`' for item in features)}
- Numeric metric targets remain provisional until representative calibration and Product Authority approval.
- Outcome completion requires feature success evidence and applicable environment/observation windows; closed stories alone do not complete this outcome.

## Authority

- `docs/01-product/06-scope-and-success-metrics.md`
- `docs/10-backlog/build-baseline.v1.json`
"""
        records.append({
            "id": outcome_id,
            "title": f"[GOAL][{outcome_id}] {description.split('.')[0]}",
            "body": wrap_body(body, outcome_id, commit),
            "fields": {
                "Work Type": "Goal", "Status": "Backlog", "Priority": "P0",
                "Phase": "Phase 1", "Goal": outcome_id, "Parent": "PROD-VIS-001",
                "Baseline": BASELINE, "Agent Role": "Product / Business Analysis",
                "Capability": "outcome-measurement", "Environment": "DEV",
                "Risk": "High", "QA State": "REQUIRED", "UAT State": "NOT_READY",
                "Blocked By": "Feature success and release evidence",
            },
        })

    for metric_id in baseline["approvedHierarchy"]["metrics"]:
        cells = metric_rows[metric_id]
        outcomes = re.findall(r"OUT-P1-\d{3}", " ".join(cells[1:2]))
        measure = clean_inline(cells[2]) if len(cells) > 2 else metric_id
        body = "## Approved outcome success criterion\n\n" + "\n".join(
            [
                f"- **Stable ID:** `{metric_id}`",
                f"- **Outcomes:** {', '.join(f'`{item}`' for item in outcomes) or '`OUT-P1-001`–`OUT-P1-007`'}",
                f"- **Measure:** {measure}",
                f"- **Numerator:** {clean_inline(cells[3]) if len(cells) > 3 else 'See source'}",
                f"- **Denominator:** {clean_inline(cells[4]) if len(cells) > 4 else 'See source'}",
                f"- **Window:** {clean_inline(cells[5]) if len(cells) > 5 else 'See source'}",
                f"- **Provisional target:** {clean_inline(cells[6]) if len(cells) > 6 else 'See source'}",
                f"- **Instrumentation/evidence dependency:** {clean_inline(cells[7]) if len(cells) > 7 else 'See source'}",
                "- **Target status:** PROVISIONAL; this is not current passing evidence.",
                "\nAuthority: `docs/01-product/06-scope-and-success-metrics.md` and the approved build baseline.",
            ]
        )
        records.append({
            "id": metric_id,
            "title": f"[SUCCESS][{metric_id}] {measure}",
            "body": wrap_body(body, metric_id, commit),
            "fields": {
                "Work Type": "Outcome / Success Criterion", "Status": "Backlog", "Priority": "P1",
                "Phase": "Phase 1", "Goal": ", ".join(outcomes) or "OUT-P1-001–007",
                "Parent": ", ".join(outcomes) or "All Phase 1 outcomes", "Baseline": BASELINE,
                "Agent Role": "Product / Business Analysis", "Capability": "outcome-measurement",
                "Environment": "DEV", "Risk": "Medium", "QA State": "REQUIRED",
                "UAT State": "NOT_READY", "Blocked By": "Representative instrumentation and observation window",
            },
        })

    for epic_id in baseline["approvedHierarchy"]["epics"]:
        cells = epic_rows[epic_id]
        title = clean_inline(cells[0]).split(" — ", 1)[1]
        stories = baseline["epicStoryOwnership"][epic_id]
        features = sorted(set(re.findall(r"FEAT-P1-\d{3}", " ".join(cells))))
        outcomes = sorted({outcome for feature in features for outcome in feature_outcomes.get(feature, [])})
        section = epic_sections.get(epic_id, (title, ""))[1]
        body = f"""## Approved Phase 1 epic

{section}

## Exact hierarchy

- Parent vision: `PROD-VIS-001`
- Outcomes: {', '.join(f'`{item}`' for item in outcomes)}
- Features: {', '.join(f'`{item}`' for item in features)}
- Stories: {', '.join(f'`{item}`' for item in stories)}
- Baseline: `{BASELINE}`
"""
        records.append({
            "id": epic_id, "title": f"[EPIC][{epic_id}] {title}",
            "body": wrap_body(body, epic_id, commit),
            "fields": {
                "Work Type": "Epic", "Status": "Backlog", "Priority": "P0", "Phase": "Phase 1",
                "Goal": ", ".join(outcomes), "Parent": "PROD-VIS-001", "Baseline": BASELINE,
                "Agent Role": clean_inline(cells[-1]).split(";", 1)[-1].strip(),
                "Capability": "epic-delivery", "Environment": "DEV", "Risk": "High",
                "QA State": "REQUIRED", "UAT State": "NOT_READY", "Blocked By": "Dependency-aware story completion",
            },
        })

    for feature_id in baseline["approvedHierarchy"]["features"]:
        title, section = feature_sections[feature_id]
        fields = contract_fields(section)
        epics = feature_to_epics.get(feature_id, [])
        outcomes = feature_outcomes.get(feature_id, [])
        body = f"""## Approved Phase 1 feature

{section}

## Operational hierarchy

- Parent epic(s): {', '.join(f'`{item}`' for item in epics)}
- Goal/outcome(s): {', '.join(f'`{item}`' for item in outcomes)}
- Baseline: `{BASELINE}`
- Feature completion requires story acceptance plus measured feature success; story closure alone is insufficient.
"""
        records.append({
            "id": feature_id, "title": f"[FEATURE][{feature_id}] {title}",
            "body": wrap_body(body, feature_id, commit),
            "fields": {
                "Work Type": "Feature", "Status": "Backlog", "Priority": "P1", "Phase": "Phase 1",
                "Goal": ", ".join(outcomes), "Feature": feature_id,
                "Parent": ", ".join(epics), "Baseline": BASELINE,
                "Agent Role": clean_inline(fields.get("Primary users", "Product / Engineering"))[:240],
                "Capability": "feature-delivery", "Environment": "DEV", "Risk": "High",
                "QA State": "REQUIRED", "UAT State": "NOT_READY", "Blocked By": "Governing stories and success evidence",
            },
        })

    for story_id in baseline["approvedHierarchy"]["stories"]:
        title, section = story_sections[story_id]
        fields = contract_fields(section)
        feature_ids = re.findall(r"FEAT-P1-\d{3}", fields.get("Product", ""))
        outcomes = re.findall(r"OUT-P1-\d{3}", fields.get("Product", ""))
        dependencies = re.findall(r"STORY-P1-\d{3}", fields.get("Dependencies / fences", ""))
        epic_id = story_to_epic[story_id]
        body = f"""## Approved Phase 1 story contract

{section}

## GitHub execution policy

- Parent epic: `{epic_id}`
- Parent feature(s): {', '.join(f'`{item}`' for item in feature_ids)}
- Dependency predecessors: {', '.join(f'`{item}`' for item in dependencies) or 'None declared'}
- Both `AC-STORY-*` criteria and every applicable `Future TEST` expectation above are part of Definition of Done.
- Developer evidence does not replace independent exact-candidate QA.
- This draft backlog item MUST be converted to or superseded by one attributed governed Issue before implementation.
"""
        records.append({
            "id": story_id, "title": f"[STORY][{story_id}] {title}",
            "body": wrap_body(body, story_id, commit),
            "fields": {
                "Work Type": "Story", "Status": "Backlog", "Priority": "P1", "Phase": "Phase 1",
                "Goal": ", ".join(outcomes), "Feature": ", ".join(feature_ids),
                "Parent": f"{epic_id}" + (f" / {', '.join(feature_ids)}" if feature_ids else ""),
                "Baseline": BASELINE, "Agent Role": clean_inline(fields.get("State / owner", "Unassigned")).split(";", 1)[-1].strip(),
                "Capability": "governed-story-delivery", "Environment": "DEV", "Risk": "High",
                "QA State": "REQUIRED", "UAT State": "NOT_READY",
                "Blocked By": ", ".join(dependencies) or "Definition of Ready",
            },
        })

    return records


def field_catalog() -> tuple[dict[str, Any], str]:
    config = json.loads((ROOT / ".agents/project/control-centre.json").read_text(encoding="utf-8"))
    project_id = config["githubProject"]["id"]
    result = run_json(["gh", "project", "field-list", str(PROJECT_NUMBER), "--owner", OWNER, "--format", "json"])
    return {item["name"]: item for item in result["fields"]}, project_id


def existing_items() -> dict[str, dict[str, Any]]:
    result = run_json([
        "gh", "project", "item-list", str(PROJECT_NUMBER), "--owner", OWNER,
        "--format", "json", "--limit", "500",
    ])
    found: dict[str, dict[str, Any]] = {}
    for item in result["items"]:
        match = re.search(r"(?:OUT|MET|EPIC|FEAT|STORY)-P1-\d{3}", item.get("title", ""))
        if match:
            found[match.group()] = item
    return found


def graphql(query: str, variables: dict[str, Any]) -> dict[str, Any]:
    payload = json.dumps({"query": query, "variables": variables})
    result = run_json(["gh", "api", "graphql", "--input", "-"], input_text=payload)
    if result.get("errors"):
        raise RuntimeError(json.dumps(result["errors"], sort_keys=True))
    return result["data"]


def create_draft(project_id: str, title: str, body: str) -> str:
    query = """mutation($input:AddProjectV2DraftIssueInput!) {
      addProjectV2DraftIssue(input:$input) { projectItem { id } }
    }"""
    data = graphql(query, {"input": {"projectId": project_id, "title": title, "body": body}})
    return data["addProjectV2DraftIssue"]["projectItem"]["id"]


def update_fields(project_id: str, item_id: str, values: dict[str, str], catalog: dict[str, Any]) -> None:
    updates: list[dict[str, Any]] = []
    for name, value in values.items():
        field = catalog.get(name)
        if not field or not value:
            continue
        if field["type"] == "ProjectV2SingleSelectField":
            option = next((item for item in field.get("options", []) if item["name"] == value), None)
            if not option:
                raise RuntimeError(f"Project field {name} has no option {value}")
            field_value = {"singleSelectOptionId": option["id"]}
        elif field["type"] == "ProjectV2Field":
            field_value = {"text": str(value)[:1024]}
        else:
            continue
        updates.append({"fieldId": field["id"], "value": field_value})
    if not updates:
        return
    declarations = ", ".join(f"$input{i}:UpdateProjectV2ItemFieldValueInput!" for i in range(len(updates)))
    mutations = " ".join(
        f"v{i}:updateProjectV2ItemFieldValue(input:$input{i}) {{ projectV2Item {{ id }} }}"
        for i in range(len(updates))
    )
    variables = {
        f"input{i}": {"projectId": project_id, "itemId": item_id, "fieldId": update["fieldId"], "value": update["value"]}
        for i, update in enumerate(updates)
    }
    graphql(f"mutation({declarations}) {{ {mutations} }}", variables)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Create missing draft items and set governed fields")
    parser.add_argument("--limit", type=int, default=0, help="Apply at most this many missing items; zero means all")
    args = parser.parse_args()

    commit = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, capture_output=True, check=True
    ).stdout.strip()
    records = build_records(commit)
    existing = existing_items()
    missing = [record for record in records if record["id"] not in existing]
    counts = {
        kind: sum(1 for record in records if record["id"].startswith(kind))
        for kind in ["OUT", "MET", "EPIC", "FEAT", "STORY"]
    }
    result: dict[str, Any] = {
        "status": "PLAN" if not args.apply else "APPLYING",
        "baseline": BASELINE,
        "inventory": counts,
        "totalRecords": len(records),
        "existingRecords": len(records) - len(missing),
        "missingRecords": len(missing),
        "missingIds": [record["id"] for record in missing],
        "acceptanceCriteria": 98,
        "testEvaluationTasks": 104,
        "representation": "Acceptance criteria and test/evaluation tasks remain nested in each governing story item.",
    }
    if not args.apply:
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0

    catalog, project_id = field_catalog()
    selected = missing[: args.limit] if args.limit > 0 else missing
    created: list[dict[str, str]] = []
    for record in selected:
        item_id = create_draft(project_id, record["title"], record["body"])
        record["fields"]["Last Agent Update"] = date.today().isoformat()
        update_fields(project_id, item_id, record["fields"], catalog)
        created.append({"id": record["id"], "itemId": item_id})
        print(json.dumps({"created": record["id"], "itemId": item_id}), flush=True)
    result.update({"status": "APPLIED", "created": created, "remaining": len(missing) - len(selected)})
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
