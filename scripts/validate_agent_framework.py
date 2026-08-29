#!/usr/bin/env python3
"""Validate the repository-local Agent Engineering Framework without third-party packages."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_PATHS = [
    "AGENTS.md", "CODEX.md", "WORKFLOW.md", "04_USING_THIS_REPO_WITH_CODEX.md",
    ".agents/framework-manifest.json", ".agents/framework/constitution.md",
    ".agents/framework/workflow.md", ".agents/framework/quality-release.md",
    ".agents/framework/notification-policy.md", ".agents/project/profile.json",
    ".agents/project/team.json", ".agents/project/source-of-truth.json",
    ".agents/project/environments.json", ".agents/project/github.json",
    ".agents/project/github-labels.json", ".agents/config/contacts.json",
    ".agents/config/notifications.json", ".agents/capabilities/registry.json",
    ".agents/tools/registry.json", ".agents/state/notification-ledger.json",
    ".agents/bootstrap/2026-08-29-bootstrap-report.md", ".github/CODEOWNERS",
    ".github/pull_request_template.md", ".github/ISSUE_TEMPLATE/governed-work.yml",
    ".github/ISSUE_TEMPLATE/defect.yml", ".github/ISSUE_TEMPLATE/decision.yml",
    ".github/ISSUE_TEMPLATE/uat-ready.yml",
]
SCHEMAS = {
    name: f".agents/protocols/{name}.schema.json" for name in (
        "discovery", "work-item", "decision", "defect", "handoff", "release-evidence",
        "contact", "notification-config", "notification-event"
    )
}


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_required(instance: Any, schema: dict[str, Any], location: str = "record") -> list[str]:
    if schema.get("type") == "object" and not isinstance(instance, dict):
        return [f"{location} must be an object"]
    errors: list[str] = []
    if isinstance(instance, dict):
        for key in schema.get("required", []):
            if key not in instance:
                errors.append(f"{location} is missing required field '{key}'")
        for key, value in instance.items():
            rule = schema.get("properties", {}).get(key, {})
            if "enum" in rule and value not in rule["enum"]:
                errors.append(f"{location}.{key} has unsupported value {value!r}")
            if "const" in rule and value != rule["const"]:
                errors.append(f"{location}.{key} must equal {rule['const']!r}")
    return errors


def parse_skill_frontmatter(path: Path) -> tuple[dict[str, str], list[str]]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n") or "\n---\n" not in text[4:]:
        return {}, [f"{path.relative_to(ROOT)} has invalid YAML frontmatter"]
    data: dict[str, str] = {}
    errors: list[str] = []
    for line in text.split("\n---\n", 1)[0][4:].splitlines():
        if ":" not in line:
            errors.append(f"{path.relative_to(ROOT)} has malformed frontmatter line: {line}")
        else:
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data, errors


def validate_framework() -> list[str]:
    errors = [f"missing required file: {path}" for path in REQUIRED_PATHS if not (ROOT / path).is_file()]
    for path in sorted((ROOT / ".agents").rglob("*.json")):
        try:
            load_json(path)
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"invalid JSON {path.relative_to(ROOT)}: {exc}")
    if errors:
        return errors

    manifest = load_json(ROOT / ".agents/framework-manifest.json")
    if manifest.get("framework", {}).get("version") != "1.1.0":
        errors.append("framework manifest must bind reusable framework version 1.1.0")
    if manifest.get("project", {}).get("id") != "doculyra":
        errors.append("framework manifest must bind the Doculyra profile")

    agents_text = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
    for reference in ("CODEX.md", "04_USING_THIS_REPO_WITH_CODEX.md", "WORKFLOW.md", "pnpm verify:framework"):
        if reference not in agents_text:
            errors.append(f"AGENTS.md must reference {reference}")

    guide = (ROOT / "04_USING_THIS_REPO_WITH_CODEX.md").read_text(encoding="utf-8")
    for marker in ("GitHub Issues", ".agents/framework/", ".agents/project/", ".agents/config/",
                   "pnpm verify:framework", "EXTERNAL_ACTION_REQUIRED", "UAT READY",
                   "repository-discovery/SKILL.md", "docs/10-backlog/05-personal-family-implementation-status.md"):
        if marker not in guide:
            errors.append(f"onboarding guide is missing operational marker: {marker}")

    for path in sorted((ROOT / ".agents/framework").glob("*.md")):
        text = path.read_text(encoding="utf-8")
        for project_word in ("Doculyra", "GitHub", "Azure"):
            if project_word in text:
                errors.append(f"reusable policy {path.relative_to(ROOT)} contains project/vendor binding {project_word}")

    for path in sorted((ROOT / ".agents/protocols").glob("*.schema.json")):
        schema_id = load_json(path).get("$id", "")
        if not schema_id.startswith("https://agent-engineering-framework.invalid/protocols/"):
            errors.append(f"reusable protocol {path.relative_to(ROOT)} has a project-bound schema ID")

    source_map = load_json(ROOT / ".agents/project/source-of-truth.json")
    for key in ("decisions", "productBaseline", "implementationStatus", "remainingWork", "traceability", "operations", "tests", "preservedReference"):
        target = source_map.get(key)
        if not isinstance(target, str) or not (ROOT / target).exists():
            errors.append(f"source-of-truth path {key} does not resolve: {target!r}")

    contacts = load_json(ROOT / ".agents/config/contacts.json")
    by_id = {item["id"]: item for item in contacts.get("contacts", []) if "id" in item}
    routing = contacts.get("routing", {})
    try:
        to_address = by_id[routing["toContactId"]]["email"].strip().lower()
        cc_addresses = [by_id[item]["email"].strip().lower() for item in routing["ccContactIds"]]
    except (KeyError, TypeError) as exc:
        errors.append(f"contact routing is invalid: {exc}")
    else:
        resolved = routing.get("resolved", {})
        expected_cc = [address for address in dict.fromkeys(cc_addresses) if address != to_address]
        if resolved.get("to") != [to_address] or resolved.get("cc") != expected_cc:
            errors.append("resolved recipient routing must normalize and deduplicate project/global contacts")
        if set(resolved.get("to", [])) & set(resolved.get("cc", [])):
            errors.append("the same normalized address cannot appear in To and CC")

    notifications = load_json(ROOT / ".agents/config/notifications.json")
    adapter = notifications.get("adapter", {})
    operational = adapter.get("implementation") == "IMPLEMENTED" and adapter.get("activation") == "ENABLED" and adapter.get("deliveryConformance") == "PASS"
    if bool(adapter.get("sendAllowed")) != operational:
        errors.append("notification sendAllowed must exactly reflect implementation, activation, and delivery conformance")
    if set(notifications.get("events", {})) != {"BLOCKING_DECISION", "UAT_READY"}:
        errors.append("notification configuration must define exactly BLOCKING_DECISION and UAT_READY events")

    ledger = load_json(ROOT / ".agents/state/notification-ledger.json")
    keys = [event.get("key") for event in ledger.get("events", [])]
    if None in keys or len(keys) != len(set(keys)):
        errors.append("notification ledger keys must be present and unique")
    for event in ledger.get("events", []):
        if event.get("status") not in {"RESERVED", "SENT", "FAILED", "EXTERNAL_ACTION_REQUIRED"}:
            errors.append(f"notification ledger event {event.get('key')} has invalid status")

    capabilities = load_json(ROOT / ".agents/capabilities/registry.json").get("capabilities", [])
    registered_skills = {item.get("skill") for item in capabilities}
    skill_paths = sorted((ROOT / ".agents/skills").glob("*/SKILL.md"))
    if len(skill_paths) < 5:
        errors.append("at least five small capabilities must be implemented as skills")
    for path in skill_paths:
        relative = str(path.relative_to(ROOT))
        metadata, skill_errors = parse_skill_frontmatter(path)
        errors.extend(skill_errors)
        name = metadata.get("name", "")
        if not re.fullmatch(r"[a-z0-9-]+", name) or name != path.parent.name:
            errors.append(f"{relative} has an invalid or mismatched skill name")
        description = metadata.get("description", "")
        if len(description) < 40 or "Use " not in description:
            errors.append(f"{relative} description must explain capability and trigger")
        if relative not in registered_skills:
            errors.append(f"{relative} is not present in capability registry")

    labels = {item["name"] for item in load_json(ROOT / ".agents/project/github-labels.json").get("labels", [])}
    for required_label in ("type:work", "type:defect", "type:decision", "human-decision-required", "external-action-required", "uat:ready", "qa:required"):
        if required_label not in labels:
            errors.append(f"GitHub label registry is missing {required_label}")

    scripts = load_json(ROOT / "package.json").get("scripts", {})
    expected = "python3 scripts/validate_agent_framework.py && python3 scripts/test_agent_framework.py"
    if scripts.get("verify:framework") != expected:
        errors.append("package.json verify:framework must run framework validation and tests")
    if not scripts.get("verify", "").startswith("pnpm verify:framework"):
        errors.append("pnpm verify must run framework validation first")
    ci = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
    if "pnpm verify" not in ci or "permissions:\n  contents: read" not in ci:
        errors.append("CI must run pnpm verify with read-only contents permission")

    configured_emails = {item.get("email", "").strip().lower() for item in contacts.get("contacts", [])}
    configured_emails.discard("")
    checked_paths = [ROOT / ".agents", ROOT / ".github", ROOT / "scripts", ROOT / "AGENTS.md", ROOT / "WORKFLOW.md", ROOT / "04_USING_THIS_REPO_WITH_CODEX.md"]
    for checked in checked_paths:
        candidates = checked.rglob("*") if checked.is_dir() else [checked]
        for candidate in candidates:
            if candidate.is_file() and candidate != ROOT / ".agents/config/contacts.json":
                try:
                    content = candidate.read_text(encoding="utf-8").lower()
                    if any(email in content for email in configured_emails):
                        errors.append(f"owner email must only exist in structured contacts config, found in {candidate.relative_to(ROOT)}")
                except UnicodeDecodeError:
                    pass

    report = (ROOT / ".agents/bootstrap/2026-08-29-bootstrap-report.md").read_text(encoding="utf-8")
    for marker in ("04_USING_THIS_REPO_WITH_CODEX.md", "Changed files", "External/admin actions", "First governed work queue"):
        if marker not in report:
            errors.append(f"bootstrap report is missing completion marker: {marker}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--record", choices=sorted(SCHEMAS))
    parser.add_argument("path", nargs="?")
    args = parser.parse_args()
    if args.record:
        if not args.path:
            parser.error("--record requires a JSON path")
        record_path = Path(args.path).resolve()
        record = load_json(record_path)
        errors = validate_required(record, load_json(ROOT / SCHEMAS[args.record]), record_path.name)
        if args.record == "release-evidence":
            if record.get("promotionDecision") == "READY_FOR_UAT" and (record.get("qaStatus") != "PASS" or record.get("businessAcceptance") != "PASS"):
                errors.append("READY_FOR_UAT requires PASS independent QA and PASS business acceptance")
            if record.get("environment") == "PROD":
                approval = record.get("productAuthorityApproval", {})
                if approval.get("status") != "APPROVED" or not approval.get("decisionUrl"):
                    errors.append("PROD release evidence requires an approved Product Authority decision URL")
        if errors:
            for error in errors:
                print(f"ERROR: {error}", file=sys.stderr)
            return 1
        print(f"Agent record valid: {record_path}")
        return 0
    errors = validate_framework()
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Agent Engineering Framework validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
