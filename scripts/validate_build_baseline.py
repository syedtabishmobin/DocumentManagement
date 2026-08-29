#!/usr/bin/env python3
"""Validate the governed Doculyra build baseline and reciprocal product traceability."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from build_dependency_graph import graph, topological_order

ROOT = Path(__file__).resolve().parents[1]
BASELINE_PATH = ROOT / "docs/10-backlog/build-baseline.v1.json"
BASELINE_DOCUMENT_PATH = ROOT / "docs/10-backlog/08-build-baselines/DOCULYRA-BUILD-P1-2026.08.30.1.md"
README_PATH = ROOT / "README.md"
NFR_PATH = ROOT / "docs/02-architecture/05-non-functional-requirements.md"
GOVERNED_AUTHORITY_PATH = ROOT / "docs/10-backlog/07-governed-work/GH-WORK-P1-AUTH-001.md"
FEATURE_PATH = ROOT / "docs/01-product/03-feature-catalogue.md"
METRIC_PATH = ROOT / "docs/01-product/06-scope-and-success-metrics.md"
EPIC_PATH = ROOT / "docs/10-backlog/01-epics.md"
STORY_PATH = ROOT / "docs/10-backlog/02-features-and-stories.md"
TEST_PATH = ROOT / "docs/12-testing/fixtures/test-scenarios.v1.json"
EVIDENCE_PATH = ROOT / "docs/12-testing/fixtures/implementation-evidence.v1.json"

OUTCOME_RE = re.compile(r"OUT-P1-\d{3}")
METRIC_RE = re.compile(r"MET-P1-\d{3}")
FEATURE_RE = re.compile(r"FEAT-P1-\d{3}")
EPIC_RE = re.compile(r"EPIC-P1-\d{3}")
STORY_RE = re.compile(r"STORY-P1-\d{3}")
AC_RE = re.compile(r"AC-STORY-P1-\d{3}-\d{2}")
BASELINE_AC_RE = re.compile(r"^- `(AC-BL-P1-\d{3})`: (.+)$", re.MULTILINE)


def sections(text: str, pattern: re.Pattern[str]) -> dict[str, str]:
    matches = list(pattern.finditer(text))
    result: dict[str, str] = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        result[match.group(1)] = text[match.start():end]
    return result


def exact_set(values: list[str], label: str, errors: list[str]) -> set[str]:
    duplicates = sorted(value for value, count in Counter(values).items() if count > 1)
    if duplicates:
        errors.append(f"{label} contains duplicate IDs: {', '.join(duplicates)}")
    return set(values)


def validate() -> tuple[list[str], dict[str, int]]:
    errors: list[str] = []
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    hierarchy = baseline["approvedHierarchy"]
    expected_outcomes = exact_set(hierarchy["outcomes"], "baseline outcomes", errors)
    expected_metrics = exact_set(hierarchy["metrics"], "baseline metrics", errors)
    expected_features = exact_set(hierarchy["features"], "baseline features", errors)
    expected_epics = exact_set(hierarchy["epics"], "baseline epics", errors)
    expected_stories = exact_set(hierarchy["stories"], "baseline stories", errors)
    expected_baseline_acs = {f"AC-BL-P1-{item:03d}" for item in range(1, 11)}
    criterion_records = baseline.get("baselineAcceptanceCriteria", [])
    if not all(isinstance(item, dict) and {"id", "text", "source"}.issubset(item) for item in criterion_records):
        errors.append("baseline acceptance criteria must contain machine-readable id/text/source records")
        criterion_records = []
    criterion_ids = [item["id"] for item in criterion_records]
    actual_baseline_acs = exact_set(criterion_ids, "baseline acceptance", errors)
    if actual_baseline_acs != expected_baseline_acs:
        errors.append(f"baseline acceptance differs: missing={sorted(expected_baseline_acs-actual_baseline_acs)} unexpected={sorted(actual_baseline_acs-expected_baseline_acs)}")
    baseline_document = BASELINE_DOCUMENT_PATH.read_text(encoding="utf-8")
    document_criteria = dict(BASELINE_AC_RE.findall(baseline_document))
    machine_criteria = {item["id"]: item["text"] for item in criterion_records}
    if document_criteria != machine_criteria:
        missing = sorted(set(machine_criteria) - set(document_criteria))
        unexpected = sorted(set(document_criteria) - set(machine_criteria))
        changed = sorted(key for key in set(machine_criteria) & set(document_criteria) if machine_criteria[key] != document_criteria[key])
        errors.append(f"human/machine baseline criterion divergence: missing={missing} unexpected={unexpected} changed={changed}")
    for item in criterion_records[:9]:
        if item.get("source") != "Issue #32 original criterion":
            errors.append(f"{item.get('id')} does not preserve its original Issue #32 identity")
    amendment = baseline.get("authority", {}).get("acceptanceCriteriaAmendment", "")
    if "issues/32#issuecomment-" not in amendment:
        errors.append("baseline lacks the durable Issue #32 acceptance-criterion amendment")

    readme = README_PATH.read_text(encoding="utf-8")
    for stale in ("100 stable requirements", "48 stories", "All 48 stories"):
        if stale in readme:
            errors.append(f"README retains stale baseline inventory: {stale}")
    for current in ("101 stable requirements", "31 features", "49 stories", "98 exact story acceptance criteria", "104 planned tests"):
        if current not in readme:
            errors.append(f"README omits current baseline inventory: {current}")

    nfr_text = NFR_PATH.read_text(encoding="utf-8")
    for stale in ("`DEC-038` remains blocked", "decision blocked by `DEC-038`", "until `DEC-038` closes"):
        if stale in nfr_text:
            errors.append(f"NFR baseline treats approved DEC-038 as unresolved: {stale}")

    governed_authority = GOVERNED_AUTHORITY_PATH.read_text(encoding="utf-8")
    for stale in ("PR #4 remains blocked", "CI run pending PR", "independent architecture/data review pending", "PR/Issue links pending"):
        if stale in governed_authority:
            errors.append(f"merged Issue #2/PR #4 evidence remains falsely pending: {stale}")
    for final_evidence in ("4bb43cc51cca34751bf2f46f160a2f210728396c", "33246814008", "6c047bd01e73ab321f3234228ca58819c5ea7ca3"):
        if final_evidence not in governed_authority:
            errors.append(f"Issue #2/PR #4 governed record omits final evidence: {final_evidence}")

    feature_text = FEATURE_PATH.read_text(encoding="utf-8")
    feature_sections = sections(feature_text, re.compile(r"^### `(FEAT-P1-\d{3})`", re.MULTILINE))
    actual_features = set(feature_sections)
    if actual_features != expected_features:
        errors.append(f"feature inventory differs: missing={sorted(expected_features-actual_features)} unexpected={sorted(actual_features-expected_features)}")
    feature_outcomes: dict[str, set[str]] = {}
    for feature, section in feature_sections.items():
        row = next((line for line in section.splitlines() if line.startswith("| Outcome |")), "")
        owned = set(OUTCOME_RE.findall(row))
        if not owned:
            errors.append(f"{feature} has no outcome ownership")
        if not owned.issubset(expected_outcomes):
            errors.append(f"{feature} references unknown outcomes: {sorted(owned-expected_outcomes)}")
        feature_outcomes[feature] = owned
    for outcome in expected_outcomes:
        if not any(outcome in owned for owned in feature_outcomes.values()):
            errors.append(f"{outcome} has no feature ownership")

    metric_text = METRIC_PATH.read_text(encoding="utf-8")
    actual_metrics = set(METRIC_RE.findall(metric_text))
    if actual_metrics != expected_metrics:
        errors.append(f"metric inventory differs: missing={sorted(expected_metrics-actual_metrics)} unexpected={sorted(actual_metrics-expected_metrics)}")
    metric_owners: dict[str, set[str]] = defaultdict(set)
    for line in metric_text.splitlines():
        metric = METRIC_RE.search(line)
        if metric and line.startswith("|"):
            for outcome in OUTCOME_RE.findall(line):
                metric_owners[outcome].add(metric.group(0))
            if "All outcomes" in line or "`OUT-P1-001`–`OUT-P1-007`" in line:
                for outcome in expected_outcomes:
                    metric_owners[outcome].add(metric.group(0))
    for outcome in expected_outcomes:
        if not metric_owners[outcome]:
            errors.append(f"{outcome} has no measurable success criterion")
        for universal in ("MET-P1-006", "MET-P1-021"):
            if universal not in metric_owners[outcome]:
                errors.append(f"{outcome} omits universal measure {universal}")

    story_text = STORY_PATH.read_text(encoding="utf-8")
    story_sections = sections(story_text, re.compile(r"^### `(STORY-P1-\d{3})`", re.MULTILINE))
    actual_stories = set(story_sections)
    if actual_stories != expected_stories:
        errors.append(f"story inventory differs: missing={sorted(expected_stories-actual_stories)} unexpected={sorted(actual_stories-expected_stories)}")
    feature_stories: dict[str, set[str]] = defaultdict(set)
    acceptance: set[str] = set()
    for story, section in story_sections.items():
        product = next((line for line in section.splitlines() if line.startswith("| Product |")), "")
        features = set(FEATURE_RE.findall(product))
        outcomes = set(OUTCOME_RE.findall(product))
        if len(features) != 1:
            errors.append(f"{story} must have exactly one governing feature, found {sorted(features)}")
        elif next(iter(features)) in feature_outcomes:
            feature = next(iter(features))
            feature_stories[feature].add(story)
            if outcomes != feature_outcomes[feature]:
                errors.append(f"{story} outcomes {sorted(outcomes)} differ from {feature} {sorted(feature_outcomes[feature])}")
        story_acs = set(AC_RE.findall(section))
        expected_acs = {f"AC-STORY-P1-{story[-3:]}-01", f"AC-STORY-P1-{story[-3:]}-02"}
        if story_acs != expected_acs:
            errors.append(f"{story} acceptance differs: expected={sorted(expected_acs)} actual={sorted(story_acs)}")
        acceptance.update(story_acs)
        state = next((line for line in section.splitlines() if line.startswith("| State / owner |")), "")
        if "BASELINED" not in state or "PLANNED_UNISSUED" not in state:
            errors.append(f"{story} must be BASELINED and PLANNED_UNISSUED before execution")
        if "`DONE" in state or "`COMPLETE" in state:
            errors.append(f"{story} claims completion without release evidence")
    for feature in expected_features:
        if not feature_stories[feature]:
            errors.append(f"{feature} has no story ownership")
    if len(acceptance) != hierarchy["storyAcceptanceCount"]:
        errors.append(f"story acceptance count is {len(acceptance)}, expected {hierarchy['storyAcceptanceCount']}")

    epic_text = EPIC_PATH.read_text(encoding="utf-8")
    actual_epics = set(EPIC_RE.findall(epic_text))
    if not expected_epics.issubset(actual_epics):
        errors.append(f"epic inventory missing {sorted(expected_epics-actual_epics)}")
    ownership = baseline["epicStoryOwnership"]
    owned = [story for stories in ownership.values() for story in stories]
    if set(ownership) != expected_epics or set(owned) != expected_stories:
        errors.append("epicStoryOwnership does not cover the exact epic/story baseline")
    duplicates = sorted(story for story, count in Counter(owned).items() if count > 1)
    if duplicates:
        errors.append(f"stories have multiple primary epics: {', '.join(duplicates)}")

    tests = json.loads(TEST_PATH.read_text(encoding="utf-8"))["tests"]
    if len(tests) != hierarchy["testCount"]:
        errors.append(f"test inventory is {len(tests)}, expected {hierarchy['testCount']}")
    traced_stories: set[str] = set()
    traced_acceptance: set[str] = set()
    for test in tests:
        trace = set(test.get("trace", []))
        traced_stories.update(trace.intersection(expected_stories))
        traced_acceptance.update(trace.intersection(acceptance))
        if test.get("status") != "DRAFT":
            errors.append(f"{test.get('test_id')} falsely claims non-DRAFT product evidence")
    if traced_stories != expected_stories:
        errors.append(f"tests do not reverse-map every story: {sorted(expected_stories-traced_stories)}")
    if traced_acceptance != acceptance:
        errors.append(f"tests do not reverse-map every story AC: {sorted(acceptance-traced_acceptance)}")

    if not EVIDENCE_PATH.is_file():
        errors.append("implementation evidence manifest is missing")
    else:
        evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))
        for item in evidence.get("records", []):
            path = ROOT / item.get("path", "")
            if not path.is_file():
                errors.append(f"implementation evidence path does not exist: {item.get('path')}")

    selected_graph = graph()
    if set(selected_graph) != expected_stories:
        errors.append("dependency graph does not cover the exact story baseline")
    try:
        topological_order(selected_graph)
    except ValueError as exc:
        errors.append(str(exc))

    if baseline["status"] == "BUILD_BASELINE_APPROVED":
        if baseline.get("blockingDecisions"):
            errors.append("approved baseline retains blocking decisions")
        if baseline["reviewEvidence"].get("independentBaselineReview") != "PASS":
            errors.append("approved baseline lacks independent review PASS")
        if baseline.get("candidateRevision") in {"PENDING", "UNAVAILABLE", ""}:
            errors.append("approved baseline lacks an immutable revision")

    counts = {
        "outcomes": len(expected_outcomes), "metrics": len(expected_metrics), "epics": len(expected_epics),
        "features": len(expected_features), "stories": len(expected_stories), "acceptance": len(acceptance), "tests": len(tests)
    }
    return errors, counts


def main() -> int:
    errors, counts = validate()
    if errors:
        print(f"Build baseline validation FAILED with {len(errors)} error(s):", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Build baseline validation passed: " + ", ".join(f"{key}={value}" for key, value in counts.items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
