#!/usr/bin/env python3
"""Validate the Phase 1 synthetic test manifests and upstream traceability.

Standard library only. Run from any working directory.
"""

from __future__ import annotations

import ipaddress
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
TEST_ROOT = ROOT / "docs/12-testing"
FIXTURE_ROOT = TEST_ROOT / "fixtures"

MANIFEST_PATHS = {
    "tests": FIXTURE_ROOT / "test-scenarios.v1.json",
    "fixtures": FIXTURE_ROOT / "synthetic-fixtures.v1.json",
    "datasets": FIXTURE_ROOT / "ai-evaluation-datasets.v1.json",
    "profiles": FIXTURE_ROOT / "workload-and-fault-profiles.v1.json",
}

TEST_ID_RE = re.compile(r"^TEST-(UNIT|CON|AI|SEC|E2E|PERF|DR)-P1-(\d{3})$")
FIXTURE_ID_RE = re.compile(r"^FIX-P1-\d{3}$")
DATASET_ID_RE = re.compile(r"^DATASET-P1-\d{3}$")
WORKLOAD_ID_RE = re.compile(r"^WORK-P1-\d{3}$")
FAULT_ID_RE = re.compile(r"^FAULT-P1-\d{3}$")
TRACE_TOKEN_RE = re.compile(
    r"(?<![A-Z0-9-])(?:[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*)-P1"
    r"(?:-[A-Z0-9]+)*-\d{3}(?:-\d{2})?(?![A-Z0-9-])"
)
DECISION_RE = re.compile(r"\bDEC-\d{3}\b")
URL_RE = re.compile(r"https?://[^\s\"'<>]+", re.IGNORECASE)
EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b", re.IGNORECASE)
IPV4_RE = re.compile(r"(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)")
AU_PHONE_RE = re.compile(r"(?<!\d)(?:\+?61[ -]?|0)[2-478](?:[ -]?\d){8}(?!\d)")
AWS_KEY_RE = re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")
JWT_RE = re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b")
AUTH_VALUE_RE = re.compile(r"\b(?:Bearer|Basic)\s+[A-Za-z0-9+/_.=-]{12,}\b", re.IGNORECASE)
PRIVATE_KEY_RE = re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")
DIGIT_RUN_RE = re.compile(r"(?<!\d)\d{13,19}(?!\d)")

EXPECTED_TEST_RANGES = {
    "UNIT": (1, 10),
    "CON": (1, 12),
    "AI": (1, 15),
    "SEC": (1, 15),
    "E2E": (1, 20),
    "PERF": (1, 10),
    "DR": (1, 8),
}

SUITE_BY_NAMESPACE = {
    "UNIT": "UNIT",
    "CON": "CONTRACT",
    "AI": "AI",
    "SEC": "SECURITY",
    "E2E": "E2E",
    "PERF": "PERFORMANCE",
    "DR": "DISASTER_RECOVERY",
}

OWNER_BY_NAMESPACE = {
    "UNIT": "Domain/Data Quality",
    "CON": "Contract Quality",
    "AI": "AI Evaluation",
    "SEC": "Security and Privacy Quality",
    "E2E": "Product Quality",
    "PERF": "Performance and Capacity Quality",
    "DR": "Resilience and Operations Quality",
}

OWNER_DOCUMENTS = {
    "UNIT": TEST_ROOT / "01-test-strategy.md",
    "CON": TEST_ROOT / "01-test-strategy.md",
    "AI": TEST_ROOT / "02-ai-evaluation-scenarios.md",
    "SEC": TEST_ROOT / "03-security-tests.md",
    "E2E": TEST_ROOT / "04-integration-and-e2e-scenarios.md",
    "PERF": TEST_ROOT / "05-performance-and-resilience-tests.md",
    "DR": TEST_ROOT / "05-performance-and-resilience-tests.md",
}

UPSTREAM_DIRS = [
    ROOT / "docs/01-product",
    ROOT / "docs/02-architecture",
    ROOT / "docs/03-document-intelligence",
    ROOT / "docs/04-ai",
    ROOT / "docs/05-api",
    ROOT / "docs/06-security",
    ROOT / "docs/07-ux",
    ROOT / "docs/08-engineering",
    ROOT / "docs/09-devops",
    ROOT / "docs/10-backlog",
    ROOT / "docs/11-reference-data",
]


class DuplicateKeyError(ValueError):
    pass


def no_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def load_json(path: Path, errors: list[str]) -> Any:
    if not path.is_file():
        errors.append(f"missing required manifest: {path.relative_to(ROOT)}")
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=no_duplicate_pairs)
    except (OSError, UnicodeError, json.JSONDecodeError, DuplicateKeyError) as exc:
        errors.append(f"cannot parse {path.relative_to(ROOT)}: {exc}")
        return {}


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def strings_with_paths(value: Any, path: str = "$") -> Iterable[tuple[str, str]]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield from strings_with_paths(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from strings_with_paths(child, f"{path}[{index}]")
    elif isinstance(value, str):
        yield path, value


def keyed_values(value: Any, path: str = "$") -> Iterable[tuple[str, str, Any]]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield path, key, child
            yield from keyed_values(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from keyed_values(child, f"{path}[{index}]")


def luhn_valid(value: str) -> bool:
    digits = [int(char) for char in value]
    checksum = 0
    parity = len(digits) % 2
    for index, digit in enumerate(digits):
        if index % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def scan_privacy(path: Path, data: Any, errors: list[str]) -> None:
    rel = path.relative_to(ROOT)
    prohibited_personal_keys = {
        "first_name", "last_name", "full_name", "date_of_birth", "dob",
        "email", "email_address", "phone", "phone_number", "street_address",
        "postal_address", "account_number", "government_id", "passport_number",
        "driver_licence_number", "medicare_number",
    }
    prohibited_secret_keys = {
        "password", "secret", "api_key", "access_token", "refresh_token",
        "private_key", "client_secret", "credential_value",
    }
    allowed_placeholder_values = {None, "", "NONE", "NULL", "REDACTED", "PLACEHOLDER", "DISABLED"}

    for parent_path, key, value in keyed_values(data):
        normalized = key.lower()
        if normalized in prohibited_personal_keys:
            errors.append(f"{rel}:{parent_path}.{key}: prohibited personal-data field")
        if normalized in prohibited_secret_keys and value not in allowed_placeholder_values:
            errors.append(f"{rel}:{parent_path}.{key}: credential/secret value is prohibited")
        if key == "enabled" and value is True:
            errors.append(f"{rel}:{parent_path}.{key}: enabled test fixture/configuration is prohibited in version 0.1")

    for scalar_path, text in strings_with_paths(data):
        for match in EMAIL_RE.finditer(text):
            if not match.group(1).lower().endswith(".invalid"):
                errors.append(f"{rel}:{scalar_path}: real-looking email address is prohibited")
        for match in URL_RE.finditer(text):
            host = (urlsplit(match.group(0)).hostname or "").lower()
            if not (host.endswith(".invalid") or host in {"localhost", "127.0.0.1", "::1"}):
                errors.append(f"{rel}:{scalar_path}: endpoint host {host!r} is not reserved .invalid/localhost")
        for match in IPV4_RE.finditer(text):
            try:
                address = ipaddress.ip_address(match.group(0))
            except ValueError:
                continue
            if not (address.is_private or address.is_loopback or address.is_reserved):
                errors.append(f"{rel}:{scalar_path}: public IP address is prohibited")
        if AU_PHONE_RE.search(text):
            errors.append(f"{rel}:{scalar_path}: real-looking telephone number is prohibited")
        if AWS_KEY_RE.search(text) or JWT_RE.search(text) or AUTH_VALUE_RE.search(text) or PRIVATE_KEY_RE.search(text):
            errors.append(f"{rel}:{scalar_path}: credential/private-key pattern is prohibited")
        for match in DIGIT_RUN_RE.finditer(text):
            if luhn_valid(match.group(0)):
                errors.append(f"{rel}:{scalar_path}: payment-card-like number is prohibited")


def markdown_json_files(directory: Path) -> Iterable[Path]:
    if not directory.is_dir():
        return []
    return sorted(
        path for path in directory.rglob("*")
        if path.is_file() and path.suffix.lower() in {".md", ".json", ".yaml", ".yml"}
    )


def tokens_in_paths(paths: Iterable[Path], pattern: re.Pattern[str] = TRACE_TOKEN_RE) -> set[str]:
    tokens: set[str] = set()
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            continue
        tokens.update(pattern.findall(text))
    return tokens


def exact_tokens(paths: Iterable[Path], regex: str) -> set[str]:
    pattern = re.compile(regex)
    result: set[str] = set()
    for path in paths:
        if not path.is_file():
            continue
        result.update(pattern.findall(path.read_text(encoding="utf-8")))
    return result


def check_common_manifest(name: str, data: Any, errors: list[str]) -> None:
    require(isinstance(data, dict), f"{name}: manifest root must be an object", errors)
    if not isinstance(data, dict):
        return
    for key in ("manifest_id", "version", "status", "effective_from", "owner", "synthetic_only", "privacy_class"):
        require(key in data, f"{name}: missing top-level {key}", errors)
    require(data.get("status") == "DRAFT", f"{name}: status must remain DRAFT", errors)
    require(data.get("synthetic_only") is True, f"{name}: synthetic_only must be true", errors)
    require(data.get("privacy_class") == "P1-SYNTHETIC-NONPERSONAL", f"{name}: unexpected privacy_class", errors)
    require(isinstance(data.get("review"), dict) and data["review"].get("state") == "REQUIRED", f"{name}: review.state must be REQUIRED", errors)


def ids_from_owner_doc(namespace: str, errors: list[str]) -> set[str]:
    path = OWNER_DOCUMENTS[namespace]
    if not path.is_file():
        errors.append(f"missing owner document for {namespace}: {path.relative_to(ROOT)}")
        return set()
    pattern = re.compile(rf"\| `(TEST-{namespace}-P1-\d{{3}})` \|")
    found = pattern.findall(path.read_text(encoding="utf-8"))
    duplicates = sorted(item for item, count in Counter(found).items() if count > 1)
    if duplicates:
        errors.append(f"{path.relative_to(ROOT)}: duplicate owned test definitions: {', '.join(duplicates)}")
    return set(found)


def validate() -> tuple[list[str], list[str]]:
    errors: list[str] = []
    reports: list[str] = []
    manifests = {name: load_json(path, errors) for name, path in MANIFEST_PATHS.items()}
    if errors:
        return errors, reports

    for name, data in manifests.items():
        check_common_manifest(name, data, errors)
        scan_privacy(MANIFEST_PATHS[name], data, errors)

    test_manifest = manifests["tests"]
    fixture_manifest = manifests["fixtures"]
    dataset_manifest = manifests["datasets"]
    profile_manifest = manifests["profiles"]

    tests = test_manifest.get("tests", [])
    fixtures = fixture_manifest.get("fixtures", [])
    datasets = dataset_manifest.get("datasets", [])
    workloads = profile_manifest.get("workloads", [])
    faults = profile_manifest.get("fault_profiles", [])
    for label, value in (("tests", tests), ("fixtures", fixtures), ("datasets", datasets), ("workloads", workloads), ("fault_profiles", faults)):
        require(isinstance(value, list) and bool(value), f"{label}: expected non-empty list", errors)

    registries: dict[str, set[str]] = {}
    registry_specs = {
        "test": (tests, "test_id", TEST_ID_RE),
        "fixture": (fixtures, "fixture_id", FIXTURE_ID_RE),
        "dataset": (datasets, "dataset_id", DATASET_ID_RE),
        "workload": (workloads, "workload_id", WORKLOAD_ID_RE),
        "fault": (faults, "fault_id", FAULT_ID_RE),
    }
    all_registered: set[str] = set()
    for kind, (items, key, pattern) in registry_specs.items():
        found: list[str] = []
        for index, item in enumerate(items if isinstance(items, list) else []):
            require(isinstance(item, dict), f"{kind}[{index}] must be an object", errors)
            if not isinstance(item, dict):
                continue
            value = item.get(key)
            require(isinstance(value, str) and bool(pattern.fullmatch(value)), f"{kind}[{index}]: invalid {key} {value!r}", errors)
            if isinstance(value, str):
                found.append(value)
            require(item.get("version") == "0.1.0-draft", f"{value or kind}: version must be 0.1.0-draft", errors)
            require(item.get("status") == "DRAFT", f"{value or kind}: status must remain DRAFT", errors)
        duplicate_ids = sorted(item for item, count in Counter(found).items() if count > 1)
        if duplicate_ids:
            errors.append(f"duplicate {kind} IDs: {', '.join(duplicate_ids)}")
        registries[kind] = set(found)
        overlap = all_registered.intersection(found)
        if overlap:
            errors.append(f"stable IDs reused across registries: {', '.join(sorted(overlap))}")
        all_registered.update(found)

    test_by_id = {item.get("test_id"): item for item in tests if isinstance(item, dict) and isinstance(item.get("test_id"), str)}
    for namespace, (first, last) in EXPECTED_TEST_RANGES.items():
        expected = {f"TEST-{namespace}-P1-{number:03d}" for number in range(first, last + 1)}
        actual = {test_id for test_id in registries["test"] if test_id.startswith(f"TEST-{namespace}-P1-")}
        if actual != expected:
            errors.append(
                f"{namespace} inventory mismatch: missing={sorted(expected-actual)} unexpected={sorted(actual-expected)}"
            )
        documented = ids_from_owner_doc(namespace, errors)
        if documented != expected:
            errors.append(
                f"{OWNER_DOCUMENTS[namespace].relative_to(ROOT)} {namespace} definitions mismatch: "
                f"missing={sorted(expected-documented)} unexpected={sorted(documented-expected)}"
            )

    known_decisions = set()
    decision_path = ROOT / "docs/00-context" / "decision-register.md"
    if decision_path.is_file():
        known_decisions.update(DECISION_RE.findall(decision_path.read_text(encoding="utf-8")))

    all_traces: set[str] = set()
    for test_id, item in sorted(test_by_id.items()):
        match = TEST_ID_RE.fullmatch(test_id)
        if not match:
            continue
        namespace = match.group(1)
        require(item.get("suite") == SUITE_BY_NAMESPACE[namespace], f"{test_id}: suite does not match namespace owner", errors)
        require(item.get("owner") == OWNER_BY_NAMESPACE[namespace], f"{test_id}: owner does not match namespace register", errors)
        require(item.get("risk") in {"LOW", "MODERATE", "HIGH", "CRITICAL"}, f"{test_id}: invalid risk", errors)
        require(item.get("automation") in {"PLANNED", "AUTOMATED", "MANUAL"}, f"{test_id}: invalid automation", errors)
        require(item.get("environment_class") == "ISOLATED_SYNTHETIC", f"{test_id}: environment must remain isolated synthetic", errors)
        for key in ("fixture_refs", "dataset_refs", "workload_refs", "fault_refs", "trace", "decision_fences", "preconditions", "action", "oracle", "prohibited_observations", "cleanup"):
            require(isinstance(item.get(key), list), f"{test_id}: {key} must be a list", errors)
        for key in ("fixture_refs", "trace", "preconditions", "action", "oracle", "prohibited_observations", "cleanup"):
            require(bool(item.get(key)), f"{test_id}: {key} must not be empty", errors)
        trace = item.get("trace", [])
        if isinstance(trace, list):
            require(all(isinstance(value, str) for value in trace), f"{test_id}: trace values must be strings", errors)
            duplicate_trace = sorted(value for value, count in Counter(trace).items() if count > 1)
            if duplicate_trace:
                errors.append(f"{test_id}: duplicate trace IDs: {', '.join(duplicate_trace)}")
            all_traces.update(value for value in trace if isinstance(value, str))
        for decision in item.get("decision_fences", []):
            if decision not in known_decisions:
                errors.append(f"{test_id}: unknown decision fence {decision}")

    reference_fields = {
        "fixture_refs": registries["fixture"],
        "dataset_refs": registries["dataset"],
        "workload_refs": registries["workload"],
        "fault_refs": registries["fault"],
    }
    for test_id, item in sorted(test_by_id.items()):
        for field, known in reference_fields.items():
            refs = item.get(field, [])
            if isinstance(refs, list):
                dangling = sorted(set(refs) - known)
                if dangling:
                    errors.append(f"{test_id}: dangling {field}: {', '.join(dangling)}")

    for item in fixtures:
        if not isinstance(item, dict):
            continue
        fixture_id = item.get("fixture_id", "fixture")
        require(item.get("synthetic") is True, f"{fixture_id}: synthetic must be true", errors)
        require(item.get("contains_personal_data") is False, f"{fixture_id}: contains_personal_data must be false", errors)
        require(item.get("credential_mode") == "NONE", f"{fixture_id}: credential_mode must be NONE", errors)
        for key in ("generator", "seed", "classification", "purpose", "cleanup", "limitations"):
            require(bool(item.get(key)), f"{fixture_id}: missing {key}", errors)

    for item in datasets:
        if not isinstance(item, dict):
            continue
        dataset_id = item.get("dataset_id", "dataset")
        require(item.get("synthetic") is True, f"{dataset_id}: synthetic must be true", errors)
        require(item.get("privacy_class") == "P1-SYNTHETIC-NONPERSONAL", f"{dataset_id}: unexpected privacy class", errors)
        for key in ("generator", "seed", "slices", "gold_contract", "sample_status", "limitations"):
            require(bool(item.get(key)), f"{dataset_id}: missing {key}", errors)
        refs = item.get("fixture_refs", [])
        require(isinstance(refs, list) and bool(refs), f"{dataset_id}: fixture_refs must be non-empty", errors)
        dangling = sorted(set(refs if isinstance(refs, list) else []) - registries["fixture"])
        if dangling:
            errors.append(f"{dataset_id}: dangling fixture_refs: {', '.join(dangling)}")

    for item in workloads:
        if not isinstance(item, dict):
            continue
        workload_id = item.get("workload_id", "workload")
        require(item.get("representative") is False, f"{workload_id}: version 0.1 workload must be non-representative", errors)
        for key in ("seed", "population", "operations", "limitations"):
            require(bool(item.get(key)), f"{workload_id}: missing {key}", errors)
        refs = item.get("fixture_refs", [])
        require(isinstance(refs, list) and bool(refs), f"{workload_id}: fixture_refs must be non-empty", errors)
        dangling = sorted(set(refs if isinstance(refs, list) else []) - registries["fixture"])
        if dangling:
            errors.append(f"{workload_id}: dangling fixture_refs: {', '.join(dangling)}")

    for item in faults:
        if not isinstance(item, dict):
            continue
        fault_id = item.get("fault_id", "fault")
        for key in ("deterministic_trigger", "expected_class"):
            require(bool(item.get(key)), f"{fault_id}: missing {key}", errors)
        require(isinstance(item.get("external_effect_possible"), bool), f"{fault_id}: external_effect_possible must be boolean", errors)

    # Any TEST-* string anywhere in the manifests must resolve to the stable inventory.
    referenced_test_ids: set[str] = set()
    for data in manifests.values():
        for _, text in strings_with_paths(data):
            if TEST_ID_RE.fullmatch(text):
                referenced_test_ids.add(text)
    dangling_test_ids = sorted(referenced_test_ids - registries["test"])
    if dangling_test_ids:
        errors.append(f"dangling TEST IDs: {', '.join(dangling_test_ids)}")

    upstream_paths = [path for directory in UPSTREAM_DIRS for path in markdown_json_files(directory)]
    known_upstream = tokens_in_paths(upstream_paths)
    unknown_trace = sorted(value for value in all_traces if value not in known_upstream)
    if unknown_trace:
        errors.append(f"unknown upstream trace IDs: {', '.join(unknown_trace)}")

    product_paths = list(markdown_json_files(ROOT / "docs/01-product"))
    nfr_paths = [ROOT / "docs/02-architecture" / "05-non-functional-requirements.md"]
    security_paths = list(markdown_json_files(ROOT / "docs/06-security"))
    dit_paths = list(markdown_json_files(ROOT / "docs/03-document-intelligence"))
    ai_paths = list(markdown_json_files(ROOT / "docs/04-ai"))
    api_paths = list(markdown_json_files(ROOT / "docs/05-api"))
    ux_paths = list(markdown_json_files(ROOT / "docs/07-ux"))
    backlog_paths = list(markdown_json_files(ROOT / "docs/10-backlog"))

    coverage_groups: list[tuple[str, set[str]]] = [
        ("requirements", exact_tokens([ROOT / "docs/01-product" / "02-phase-1-prd.md"], r"\bREQ-P1-[A-Z]+-\d{3}\b")),
        ("use cases", exact_tokens(product_paths, r"\bUC-P1-\d{3}\b")),
        ("product acceptance", exact_tokens(product_paths, r"\b(?:AC-P1-[A-Z0-9]+-\d{3}|AC-UC-P1-\d{3}-\d{2})\b")),
        ("NFRs", exact_tokens(nfr_paths, r"\bNFR-P1-\d{3}\b")),
        ("security rules", exact_tokens(security_paths, r"\b(?:SEC|AUTH|PRIV|AUD|THR)-P1-\d{3}\b")),
        ("document-intelligence rules", exact_tokens(dit_paths, r"\bDIT-[A-Z]+-P1-\d{3}\b")),
        ("AI rules", exact_tokens(ai_paths, r"\bAI-[A-Z]+-P1-\d{3}\b")),
        ("API rules and operations", exact_tokens(api_paths, r"\bAPI-P1-\d{3}\b")),
        ("events", exact_tokens(api_paths, r"\bEVT-P1-\d{3}\b")),
        ("UX and accessibility", exact_tokens(ux_paths, r"\b(?:UX-(?:IA|FLOW|SCR|DS)|A11Y)-P1-\d{3}\b")),
    ]

    backlog_exists = (ROOT / "docs/10-backlog" / "02-features-and-stories.md").is_file()
    if backlog_exists:
        coverage_groups.extend([
            ("backlog stories", exact_tokens(backlog_paths, r"\bSTORY-P1-\d{3}\b")),
            ("backlog story acceptance", exact_tokens(backlog_paths, r"\bAC-STORY-P1-\d{3}-\d{2}\b")),
        ])
    else:
        reports.append("Backlog coverage: NOT_AVAILABLE — docs/10-backlog/02-features-and-stories.md has not landed")

    for label, expected in coverage_groups:
        covered = expected.intersection(all_traces)
        uncovered = sorted(expected - all_traces)
        reports.append(f"{label}: {len(covered)}/{len(expected)} covered")
        if not expected:
            errors.append(f"{label}: no upstream IDs discovered; source contract may be missing")
        elif uncovered:
            errors.append(f"{label}: uncovered IDs: {', '.join(uncovered)}")

    return errors, reports


def main() -> int:
    errors, reports = validate()
    for report in reports:
        print(f"Coverage: {report}")
    if errors:
        print(f"Test traceability validation FAILED with {len(errors)} error(s):", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Test traceability validation passed: 90 stable tests; synthetic fixture references and all current upstream coverage are complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
