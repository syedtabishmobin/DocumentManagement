#!/usr/bin/env python3
"""Validate the Phase 1 machine-readable reference-data seed.

The validator intentionally uses only the Python standard library. It supports
the documented JSON Schema core subset used by docs/11-reference-data/schemas and
adds repository-specific referential-integrity and open-decision safety checks.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
REFERENCE_ROOT = REPOSITORY_ROOT / "docs/11-reference-data"
SCHEMA_ROOT = REFERENCE_ROOT / "schemas"
DATA_ROOT = REFERENCE_ROOT / "data"

EXPECTED_CATALOGUES = {
    "access-control",
    "ai-capabilities",
    "common",
    "dependencies",
    "document-types",
    "extraction-schemas",
    "jurisdictions",
    "monitoring-rules",
    "notifications",
    "requirement-profiles",
    "states-and-severity",
    "trusted-sources",
}

STABLE_ID_RE = re.compile(r"^[A-Za-z][A-Za-z0-9._:-]{2,127}$")
VERSION_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+(?:-draft)?$")
MARKDOWN_ID_RE = re.compile(
    r"\b(?:DEC|GAP|OUT|REQ|FEAT|UC|AC|MET|ARCH|DOM|DATA|DIT|AI|SEC|AUTH|PRIV|AUD|THR)"
    r"(?:-[A-Z0-9]+)+(?:\.[A-Za-z0-9_-]+)?\b"
)

SCHEMA_KEYWORDS = {
    "$schema",
    "$id",
    "$ref",
    "$defs",
    "x-schema-version",
    "title",
    "description",
    "type",
    "required",
    "properties",
    "additionalProperties",
    "items",
    "enum",
    "const",
    "pattern",
    "minLength",
    "minItems",
    "uniqueItems",
    "allOf",
    "anyOf",
    "oneOf",
}

EXPECTED_STATE_CODES = {
    "machine.presence": {
        "ABSENT_NOT_FOUND",
        "EXPLICIT_NONE",
        "NOT_APPLICABLE",
        "AMBIGUOUS",
        "UNREADABLE",
        "RESTRICTED_NOT_PROCESSED",
        "INVALID_PROVIDER_OUTPUT",
        "DELETED",
        "UNAVAILABLE",
    },
    "machine.ingestion-case": {
        "CREATED",
        "RECEIVING",
        "RECEIVED",
        "VALIDATING",
        "SAFETY_CHECKING",
        "QUARANTINED",
        "POLICY_HOLD",
        "PROCESSING",
        "NEEDS_REVIEW",
        "PUBLISHING",
        "READY",
        "FAILED_RETRYABLE",
        "FAILED_TERMINAL",
        "CANCELLING",
        "CANCELLED",
        "DELETION_BLOCKED",
        "PURGE_PENDING",
        "PURGED",
    },
    "machine.ingestion-stage": {
        "PENDING",
        "RUNNING",
        "SUCCEEDED",
        "FAILED_RETRYABLE",
        "FAILED_TERMINAL",
        "CANCELLED",
        "SUPERSEDED",
        "BLOCKED",
    },
    "machine.extraction-review": {
        "PROPOSED",
        "REVIEW_REQUIRED",
        "ACCEPTED_AS_EXTRACTION",
        "CORRECTED",
        "REJECTED",
        "SUPERSEDED",
    },
    "machine.ai-output-status": {
        "VALIDATED_PROPOSAL",
        "REVIEW_REQUIRED",
        "DEGRADED",
        "REFUSED",
        "FAILED_RETRYABLE",
        "FAILED_TERMINAL",
        "CANCELLED",
        "DELETION_BLOCKED",
        "POLICY_BLOCKED",
    },
    "machine.applicability": {
        "APPLICABLE",
        "NON_APPLICABLE",
        "INDETERMINATE",
        "REVIEW_REQUIRED",
        "RESTRICTED",
        "UNAVAILABLE",
    },
    "machine.impact-class": {
        "AUTOMATIC_TECHNICAL_UPDATE_POSSIBLE",
        "USER_ACTION_REQUIRED",
        "EXTERNAL_NOTIFICATION_REQUIRED",
        "REVIEW_REQUIRED",
        "NO_ACTION",
    },
    "machine.comparison": {
        "SUPPORTED_CHANGE",
        "SUPPORTED_NO_CHANGE_WITHIN_SCOPE",
        "INDETERMINATE",
        "REVIEW_REQUIRED",
    },
    "machine.rag-result": {
        "SUPPORTED",
        "CONFLICTING",
        "STALE",
        "INCOMPLETE",
        "INSUFFICIENT",
        "RESTRICTED",
        "UNAVAILABLE",
    },
    "machine.health-signal": {
        "MISSING",
        "POTENTIALLY_EXPIRED",
        "STALE",
        "SUPERSEDED",
        "CONTRADICTORY",
        "INSUFFICIENT",
        "RESTRICTED",
        "SOURCE_OR_RULE_UNAVAILABLE",
    },
    "machine.requirement-disposition": {
        "NO_DISPOSITION",
        "EVIDENCE_ADDED",
        "ALTERNATIVE_SELECTED",
        "WAIVER_REVIEW_REQUESTED",
        "NOT_APPLICABLE_SELECTED",
        "DISMISSED",
        "REMINDER_SET",
    },
    "machine.requirement-fulfilment": {
        "UNASSESSED",
        "UNMET",
        "EVIDENCE_PENDING",
        "VERIFICATION_REQUIRED",
        "FULFILLED_PRIMARY",
        "FULFILLED_ALTERNATIVE",
        "FULFILLED_BY_APPROVED_EXCEPTION",
        "CONFLICTED",
        "RESTRICTED",
        "EXPIRED_OR_REOPENED",
    },
    "machine.source-health": {
        "HEALTHY",
        "DEGRADED",
        "STALE",
        "FAILED_RETRYING",
        "FAILED_EXHAUSTED",
        "PARSER_FAILED",
        "COVERAGE_PARTIAL",
        "SUSPENDED",
        "DISABLED",
        "UNKNOWN",
    },
    "machine.recommendation-decision": {
        "APPROVE_REQUEST",
        "REJECT",
        "EDIT",
        "DEFER",
        "DISMISS",
        "NOT_APPLICABLE",
    },
    "machine.action-execution": {
        "Requested",
        "Blocked",
        "DispatchPending",
        "Dispatched",
        "Acknowledged",
        "OutcomeUnknown",
        "Failed",
        "Succeeded",
        "PartiallySucceeded",
        "ReconciliationPending",
        "RepairPending",
        "EvidencePending",
        "ReversalPending",
        "Reversed",
    },
    "machine.evidence-verification": {
        "VERIFIED",
        "REJECTED",
        "INSUFFICIENT",
        "CONFLICTED",
        "RESTRICTED",
        "EXPIRED",
    },
    "machine.guardrail-gate": {
        "ALLOW_TO_NEXT_GATE",
        "LIMIT",
        "REVIEW_REQUIRED",
        "REFUSE",
        "POLICY_BLOCKED",
        "DELETION_BLOCKED",
        "FAILED_RETRYABLE",
        "FAILED_TERMINAL",
    },
    "machine.tool-call": {
        "PROPOSED_BY_MODEL",
        "POLICY_VALIDATED",
        "AUTHORIZED",
        "DISPATCHED",
        "SUCCEEDED",
        "FAILED_RETRYABLE",
        "FAILED_TERMINAL",
        "CANCELLED",
        "POLICY_BLOCKED",
        "DELETION_BLOCKED",
        "UNKNOWN_OUTCOME_RECONCILING",
    },
}

EXPECTED_ACTION_CODES = {
    "CREATE",
    "READ",
    "EDIT",
    "RESOLVE",
    "COMPARE",
    "SUPERSEDE",
    "SHARE",
    "APPROVE",
    "EXECUTE",
    "VERIFY",
    "EXPORT",
    "TRASH",
    "RESTORE",
    "PURGE",
    "AUDIT_READ",
}
EXPECTED_POLICY_DECISIONS = {"ALLOW", "DENY", "REDACT", "MINIMAL_DISCLOSURE"}
EXPECTED_AUTHORITY_TIERS = {
    "OFFICIAL_PRIMARY",
    "OFFICIAL_DELEGATED",
    "GOVERNED_SECONDARY",
    "GUIDANCE_ONLY",
    "UNAPPROVED_OR_UNKNOWN",
}
EXPECTED_TRIGGER_STRATEGIES = {
    "DATE",
    "PERIODIC",
    "USER_OR_LIFE_EVENT",
    "SOURCE_CHANGE",
    "DEPENDENCY_CHANGE",
    "DOCUMENT_VERSION",
}
EXPECTED_TOOL_CLASSES = {
    "READ_EVIDENCE",
    "READ_DERIVED",
    "EVALUATE_DETERMINISTIC",
    "CREATE_PROPOSAL",
    "PREVIEW_EFFECT",
    "CONSEQUENTIAL_EFFECT",
    "EXTERNAL_RETRIEVAL",
}
EXPECTED_AI_CAPABILITIES = {f"AI-CAP-P1-{number:03d}" for number in range(1, 15)}


class DuplicateJSONKey(ValueError):
    """Raised when a JSON object repeats a key."""


class Validation:
    def __init__(self) -> None:
        self.errors: list[str] = []

    def error(self, location: str, message: str) -> None:
        self.errors.append(f"{location}: {message}")

    def finish(self) -> None:
        if not self.errors:
            return
        print("Reference-data validation failed:", file=sys.stderr)
        for item in self.errors:
            print(f"- {item}", file=sys.stderr)
        raise SystemExit(1)


def reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateJSONKey(f"duplicate object key {key!r}")
        result[key] = value
    return result


def load_json(path: Path, validation: Validation) -> Any | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle, object_pairs_hook=reject_duplicate_pairs)
    except (OSError, json.JSONDecodeError, DuplicateJSONKey) as exc:
        validation.error(str(path.relative_to(REPOSITORY_ROOT)), f"cannot parse JSON: {exc}")
        return None


def json_type_matches(value: Any, type_name: str) -> bool:
    if type_name == "object":
        return isinstance(value, dict)
    if type_name == "array":
        return isinstance(value, list)
    if type_name == "string":
        return isinstance(value, str)
    if type_name == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if type_name == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if type_name == "boolean":
        return isinstance(value, bool)
    if type_name == "null":
        return value is None
    return False


class SchemaEngine:
    def __init__(self, schemas: dict[Path, dict[str, Any]], validation: Validation) -> None:
        self.schemas = schemas
        self.validation = validation

    def resolve_ref(
        self, ref: str, current_schema_path: Path, location: str
    ) -> tuple[dict[str, Any], Path] | None:
        if "://" in ref:
            self.validation.error(location, f"remote $ref is not allowed: {ref}")
            return None
        file_part, separator, fragment = ref.partition("#")
        target_path = (
            current_schema_path
            if not file_part
            else (current_schema_path.parent / file_part).resolve()
        )
        try:
            target_path.relative_to(SCHEMA_ROOT.resolve())
        except ValueError:
            self.validation.error(location, f"$ref escapes schema directory: {ref}")
            return None
        target = self.schemas.get(target_path)
        if target is None:
            self.validation.error(location, f"$ref target does not exist: {ref}")
            return None
        node: Any = target
        if separator and fragment:
            if not fragment.startswith("/"):
                self.validation.error(location, f"unsupported non-pointer $ref fragment: {ref}")
                return None
            for raw_segment in fragment[1:].split("/"):
                segment = raw_segment.replace("~1", "/").replace("~0", "~")
                if not isinstance(node, dict) or segment not in node:
                    self.validation.error(location, f"unresolvable $ref fragment: {ref}")
                    return None
                node = node[segment]
        if not isinstance(node, dict):
            self.validation.error(location, f"$ref does not resolve to a schema object: {ref}")
            return None
        return node, target_path

    def validate(
        self,
        value: Any,
        schema: dict[str, Any],
        schema_path: Path,
        location: str,
    ) -> None:
        if "$ref" in schema:
            resolved = self.resolve_ref(schema["$ref"], schema_path, location)
            if resolved is not None:
                target_schema, target_path = resolved
                self.validate(value, target_schema, target_path, location)
            return

        for branch in schema.get("allOf", []):
            self.validate(value, branch, schema_path, location)

        if "anyOf" in schema:
            matches = sum(self.matches(value, branch, schema_path) for branch in schema["anyOf"])
            if matches == 0:
                self.validation.error(location, "does not match any anyOf branch")
                return

        if "oneOf" in schema:
            matches = sum(self.matches(value, branch, schema_path) for branch in schema["oneOf"])
            if matches != 1:
                self.validation.error(location, f"matches {matches} oneOf branches; expected exactly one")
                return

        expected_type = schema.get("type")
        if expected_type is not None:
            allowed_types = [expected_type] if isinstance(expected_type, str) else expected_type
            if not isinstance(allowed_types, list) or not all(isinstance(item, str) for item in allowed_types):
                self.validation.error(location, "schema has invalid type declaration")
                return
            if not any(json_type_matches(value, item) for item in allowed_types):
                self.validation.error(location, f"expected type {allowed_types}, got {type(value).__name__}")
                return

        if "const" in schema and value != schema["const"]:
            self.validation.error(location, f"expected const {schema['const']!r}, got {value!r}")
        if "enum" in schema and value not in schema["enum"]:
            self.validation.error(location, f"value {value!r} is not in enum {schema['enum']!r}")

        if isinstance(value, str):
            if "minLength" in schema and len(value) < schema["minLength"]:
                self.validation.error(location, f"string is shorter than minLength {schema['minLength']}")
            if "pattern" in schema:
                try:
                    matches = re.search(schema["pattern"], value) is not None
                except re.error as exc:
                    self.validation.error(location, f"schema pattern is invalid: {exc}")
                    matches = True
                if not matches:
                    self.validation.error(location, f"string {value!r} does not match {schema['pattern']!r}")

        if isinstance(value, list):
            if "minItems" in schema and len(value) < schema["minItems"]:
                self.validation.error(location, f"array has fewer than minItems {schema['minItems']}")
            if schema.get("uniqueItems"):
                seen: set[str] = set()
                for index, item in enumerate(value):
                    marker = json.dumps(item, sort_keys=True, separators=(",", ":"))
                    if marker in seen:
                        self.validation.error(f"{location}[{index}]", "duplicate item violates uniqueItems")
                    seen.add(marker)
            item_schema = schema.get("items")
            if isinstance(item_schema, dict):
                for index, item in enumerate(value):
                    self.validate(item, item_schema, schema_path, f"{location}[{index}]")

        if isinstance(value, dict):
            required = schema.get("required", [])
            for key in required:
                if key not in value:
                    self.validation.error(location, f"missing required property {key!r}")
            properties = schema.get("properties", {})
            if isinstance(properties, dict):
                for key, child_schema in properties.items():
                    if key in value:
                        self.validate(value[key], child_schema, schema_path, f"{location}.{key}")
            additional = schema.get("additionalProperties", True)
            unknown = set(value) - set(properties)
            if additional is False:
                for key in sorted(unknown):
                    self.validation.error(f"{location}.{key}", "additional property is not allowed")
            elif isinstance(additional, dict):
                for key in sorted(unknown):
                    self.validate(value[key], additional, schema_path, f"{location}.{key}")

    def matches(self, value: Any, schema: dict[str, Any], schema_path: Path) -> bool:
        temporary = Validation()
        engine = SchemaEngine(self.schemas, temporary)
        engine.validate(value, schema, schema_path, "candidate")
        return not temporary.errors


def check_schema_subset(
    schema: dict[str, Any], schema_path: Path, validation: Validation, location: str = "$"
) -> None:
    unknown = set(schema) - SCHEMA_KEYWORDS
    for key in sorted(unknown):
        validation.error(f"{schema_path.relative_to(REPOSITORY_ROOT)}:{location}", f"unsupported schema keyword {key!r}")

    properties = schema.get("properties")
    if properties is not None:
        if not isinstance(properties, dict):
            validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.properties must be an object")
        else:
            for key, child in properties.items():
                if not isinstance(child, dict):
                    validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.properties.{key} must be a schema object")
                else:
                    check_schema_subset(child, schema_path, validation, f"{location}.properties.{key}")

    definitions = schema.get("$defs")
    if definitions is not None:
        if not isinstance(definitions, dict):
            validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.$defs must be an object")
        else:
            for key, child in definitions.items():
                if not isinstance(child, dict):
                    validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.$defs.{key} must be a schema object")
                else:
                    check_schema_subset(child, schema_path, validation, f"{location}.$defs.{key}")

    for keyword in ("items", "additionalProperties"):
        child = schema.get(keyword)
        if isinstance(child, dict):
            check_schema_subset(child, schema_path, validation, f"{location}.{keyword}")

    for keyword in ("allOf", "anyOf", "oneOf"):
        branches = schema.get(keyword)
        if branches is None:
            continue
        if not isinstance(branches, list) or not branches:
            validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.{keyword} must be a non-empty array")
            continue
        for index, child in enumerate(branches):
            if not isinstance(child, dict):
                validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.{keyword}[{index}] must be a schema object")
            else:
                check_schema_subset(child, schema_path, validation, f"{location}.{keyword}[{index}]")

    if "pattern" in schema:
        try:
            re.compile(schema["pattern"])
        except (TypeError, re.error) as exc:
            validation.error(str(schema_path.relative_to(REPOSITORY_ROOT)), f"{location}.pattern is invalid: {exc}")


def iter_objects(value: Any, location: str) -> Iterable[tuple[dict[str, Any], str]]:
    if isinstance(value, dict):
        yield value, location
        for key, child in value.items():
            yield from iter_objects(child, f"{location}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from iter_objects(child, f"{location}[{index}]")


def collect_markdown_ids() -> set[str]:
    identifiers: set[str] = set()
    backtick_re = re.compile(r"`([^`\n]+)`")
    for path in REPOSITORY_ROOT.rglob("*.md"):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        identifiers.update(MARKDOWN_ID_RE.findall(text))
        for token in backtick_re.findall(text):
            token = token.strip()
            if STABLE_ID_RE.fullmatch(token):
                identifiers.add(token)
    return identifiers


def collect_identifiers_and_collections(
    data_documents: dict[Path, dict[str, Any]], validation: Validation
) -> tuple[dict[str, str], dict[str, set[str]], list[tuple[str, str, str]]]:
    identifiers: dict[str, str] = {}
    collections: dict[str, set[str]] = {}
    references: list[tuple[str, str, str]] = []

    collection_names = {
        "metadata_profiles",
        "owners",
        "identifier_namespaces",
        "effective_period_semantics",
        "privacy_classes",
        "purposes",
        "jurisdictions",
        "content_boundaries",
        "formats",
        "document_types",
        "launch_profiles",
        "field_types",
        "evidence_anchor_types",
        "support_roles",
        "evidence_fields",
        "extraction_schemas",
        "trigger_strategies",
        "monitoring_rules",
        "authority_tiers",
        "freshness_policies",
        "source_definitions",
        "coverage_manifests",
        "endpoints",
        "parsers",
        "actions",
        "policy_decisions",
        "permissions",
        "roles",
        "policies",
        "state_machines",
        "states",
        "transitions",
        "severities",
        "tool_classes",
        "output_contracts",
        "capabilities",
        "node_types",
        "edge_types",
        "evidence_options",
        "alternatives",
        "waiver_policies",
        "fulfilment_policies",
        "requirement_profiles",
        "channels",
        "templates",
    }

    def visit(value: Any, location: str, collection: str | None = None) -> None:
        if isinstance(value, dict):
            identifier = value.get("id")
            if isinstance(identifier, str):
                if not STABLE_ID_RE.fullmatch(identifier):
                    validation.error(f"{location}.id", f"invalid stable ID {identifier!r}")
                if identifier in identifiers:
                    validation.error(f"{location}.id", f"duplicate ID {identifier!r}; first defined at {identifiers[identifier]}")
                else:
                    identifiers[identifier] = location
                if collection is not None:
                    collections.setdefault(collection, set()).add(identifier)
            for key, child in value.items():
                if key == "$schema":
                    continue
                if key.endswith("_ref"):
                    if child is not None:
                        if isinstance(child, str):
                            references.append((child, f"{location}.{key}", key))
                        else:
                            validation.error(f"{location}.{key}", "reference must be a string or null")
                elif key.endswith("_refs"):
                    if not isinstance(child, list):
                        validation.error(f"{location}.{key}", "reference collection must be an array")
                    else:
                        for index, item in enumerate(child):
                            if isinstance(item, str):
                                references.append((item, f"{location}.{key}[{index}]", key))
                            else:
                                validation.error(f"{location}.{key}[{index}]", "reference must be a string")
                next_collection = collection
                if isinstance(child, list) and key in collection_names:
                    next_collection = key
                visit(child, f"{location}.{key}", next_collection)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                visit(child, f"{location}[{index}]", collection)

    for path, document in data_documents.items():
        visit(document, path.name)
    return identifiers, collections, references


REFERENCE_TYPE_COLLECTIONS = {
    "meta_ref": "metadata_profiles",
    "owner_ref": "owners",
    "reviewer_refs": "owners",
    "jurisdiction_refs": "jurisdictions",
    "parent_ref": "jurisdictions",
    "privacy_ref": "privacy_classes",
    "sensitivity_ref": "privacy_classes",
    "content_class_ref": "privacy_classes",
    "purpose_ref": "purposes",
    "content_boundary_ref": "content_boundaries",
    "supported_format_refs": "formats",
    "document_type_refs": "document_types",
    "extraction_schema_refs": "extraction_schemas",
    "field_type_ref": "field_types",
    "evidence_field_refs": "evidence_fields",
    "required_field_refs": "evidence_fields",
    "anchor_type_refs": "evidence_anchor_types",
    "support_role_refs": "support_roles",
    "strategy_ref": "trigger_strategies",
    "monitoring_rule_refs": "monitoring_rules",
    "source_refs": "source_definitions",
    "source_ref": "source_definitions",
    "authority_tier_ref": "authority_tiers",
    "coverage_manifest_ref": "coverage_manifests",
    "coverage_manifest_refs": "coverage_manifests",
    "endpoint_refs": "endpoints",
    "parser_refs": "parsers",
    "freshness_policy_ref": "freshness_policies",
    "action_refs": "actions",
    "allowed_action_refs": "actions",
    "permitted_action_refs": "actions",
    "consequence_action_refs": "actions",
    "approval_action_ref": "actions",
    "decision_ref": "policy_decisions",
    "permission_refs": "permissions",
    "role_refs": "roles",
    "capability_ref": "capabilities",
    "output_contract_ref": "output_contracts",
    "allowed_tool_class_refs": "tool_classes",
    "source_node_type_refs": "node_types",
    "target_node_type_refs": "node_types",
    "dependency_edge_type_refs": "edge_types",
    "evidence_option_ref": "evidence_options",
    "primary_evidence_option_refs": "evidence_options",
    "alternative_refs": "alternatives",
    "waiver_policy_refs": "waiver_policies",
    "fulfilment_policy_ref": "fulfilment_policies",
    "profile_ref": "requirement_profiles",
    "channel_refs": "channels",
}

MACHINE_REFERENCE_KEYS = {
    "applicability_machine_ref",
    "impact_machine_ref",
    "output_status_machine_ref",
    "source_health_machine_ref",
    "verification_machine_ref",
    "fulfilment_machine_ref",
    "health_signal_machine_ref",
}
STATE_REFERENCE_KEYS = {
    "from_ref",
    "to_ref",
    "presence_state_refs",
    "trigger_state_refs",
    "fulfilled_state_refs",
    "approved_effect_state_ref",
}


def check_references(
    identifiers: dict[str, str],
    collections: dict[str, set[str]],
    references: list[tuple[str, str, str]],
    external_ids: set[str],
    validation: Validation,
) -> int:
    count = 0
    state_ids = collections.get("states", set())
    machine_ids = collections.get("state_machines", set())
    for reference, location, key in references:
        count += 1
        if reference not in identifiers and reference not in external_ids:
            validation.error(location, f"dangling reference {reference!r}")
            continue
        expected_collection = REFERENCE_TYPE_COLLECTIONS.get(key)
        if expected_collection is not None and reference not in collections.get(expected_collection, set()):
            validation.error(location, f"reference {reference!r} is not a {expected_collection} ID")
        if key in MACHINE_REFERENCE_KEYS and reference not in machine_ids:
            validation.error(location, f"reference {reference!r} is not a state-machine ID")
        if key in STATE_REFERENCE_KEYS and reference not in state_ids:
            validation.error(location, f"reference {reference!r} is not a state ID")
    return count


def check_metadata_and_retirement(
    data_documents: dict[Path, dict[str, Any]],
    identifiers: dict[str, str],
    collections: dict[str, set[str]],
    validation: Validation,
) -> None:
    common = next((document for path, document in data_documents.items() if path.name == "common.json"), {})
    profiles = {
        item.get("id"): item
        for item in common.get("metadata_profiles", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    for profile_id, profile in profiles.items():
        location = identifiers.get(profile_id, profile_id)
        if profile.get("status") != "DRAFT" or profile.get("enabled") is not False:
            validation.error(location, "metadata profile must remain DRAFT and disabled")
        period = profile.get("effective_period", {})
        if period.get("valid_from") is not None or period.get("valid_to") is not None:
            validation.error(location, "draft metadata profile must not invent an effective interval")
        review = profile.get("review", {})
        if review.get("state") != "DRAFT" or review.get("reviewed_at") is not None:
            validation.error(location, "draft metadata profile must remain unreviewed DRAFT")

    for path, document in data_documents.items():
        for obj, location in iter_objects(document, path.name):
            identifier = obj.get("id")
            if not isinstance(identifier, str):
                continue
            if "version" not in obj:
                # State/transition IDs are subordinate to the immutable parent machine version.
                continue
            version = obj.get("version")
            if not isinstance(version, str) or not VERSION_RE.fullmatch(version):
                validation.error(f"{location}.version", f"invalid record version {version!r}")
            if not isinstance(version, str) or not version.endswith("-draft"):
                validation.error(f"{location}.version", "initial seed records must remain draft versions")
            meta_ref = obj.get("meta_ref")
            if meta_ref not in profiles:
                validation.error(f"{location}.meta_ref", f"unknown metadata profile {meta_ref!r}")
            else:
                profile = profiles[meta_ref]
                if profile.get("status") != "DRAFT" or profile.get("enabled") is not False:
                    validation.error(f"{location}.meta_ref", "record resolves to an active or non-DRAFT metadata profile")
            retirement = obj.get("retirement")
            if not isinstance(retirement, dict):
                validation.error(f"{location}.retirement", "versioned record must declare retirement rules")
                continue
            state = retirement.get("state")
            if state == "ACTIVE_DRAFT":
                if retirement.get("replacement_ref") is not None or retirement.get("retired_at") is not None:
                    validation.error(f"{location}.retirement", "active draft cannot have replacement or retired_at")
            elif state == "RETIRED":
                if retirement.get("retired_at") is None:
                    validation.error(f"{location}.retirement", "retired record must declare retired_at")
            else:
                validation.error(f"{location}.retirement.state", f"unknown retirement state {state!r}")
            for field in ("decision_refs", "contract_refs"):
                if field not in obj or not isinstance(obj[field], list):
                    validation.error(f"{location}.{field}", "versioned record must declare trace references")


def collection_codes(
    collection_name: str, documents: dict[Path, dict[str, Any]]
) -> set[str]:
    result: set[str] = set()
    for document in documents.values():
        for item in document.get(collection_name, []):
            if isinstance(item, dict):
                code = item.get("attributes", {}).get("code")
                if isinstance(code, str):
                    result.add(code)
    return result


def check_exact_vocabularies(
    data_documents: dict[Path, dict[str, Any]], validation: Validation
) -> None:
    machines: dict[str, dict[str, Any]] = {}
    for document in data_documents.values():
        for machine in document.get("state_machines", []):
            if isinstance(machine, dict) and isinstance(machine.get("id"), str):
                machines[machine["id"]] = machine

    for machine_id, expected_codes in EXPECTED_STATE_CODES.items():
        machine = machines.get(machine_id)
        if machine is None:
            validation.error("states-and-severity", f"missing required state machine {machine_id!r}")
            continue
        states = machine.get("attributes", {}).get("states", [])
        actual_codes = {state.get("code") for state in states if isinstance(state, dict)}
        if actual_codes != expected_codes:
            validation.error(
                machine_id,
                f"state-code mismatch; missing={sorted(expected_codes - actual_codes)!r}, extra={sorted(actual_codes - expected_codes)!r}",
            )
        state_ids = {state.get("id") for state in states if isinstance(state, dict)}
        seen_codes: set[str] = set()
        for state in states:
            if not isinstance(state, dict):
                continue
            code = state.get("code")
            if code in seen_codes:
                validation.error(machine_id, f"duplicate state code {code!r}")
            if isinstance(code, str):
                seen_codes.add(code)
        pairs: set[tuple[str, str]] = set()
        for transition in machine.get("attributes", {}).get("transitions", []):
            if not isinstance(transition, dict):
                continue
            source = transition.get("from_ref")
            target = transition.get("to_ref")
            if source not in state_ids or target not in state_ids:
                validation.error(machine_id, f"transition leaves its own state machine: {source!r} -> {target!r}")
            pair = (source, target)
            if pair in pairs:
                validation.error(machine_id, f"duplicate transition pair {source!r} -> {target!r}")
            pairs.add(pair)

    exact_collections = {
        "actions": EXPECTED_ACTION_CODES,
        "policy_decisions": EXPECTED_POLICY_DECISIONS,
        "authority_tiers": EXPECTED_AUTHORITY_TIERS,
        "trigger_strategies": EXPECTED_TRIGGER_STRATEGIES,
        "tool_classes": EXPECTED_TOOL_CLASSES,
    }
    for collection, expected in exact_collections.items():
        actual = collection_codes(collection, data_documents)
        if actual != expected:
            validation.error(collection, f"code mismatch; missing={sorted(expected - actual)!r}, extra={sorted(actual - expected)!r}")

    capability_ids: set[str] = set()
    for document in data_documents.values():
        for capability in document.get("capabilities", []):
            if isinstance(capability, dict) and isinstance(capability.get("id"), str):
                capability_ids.add(capability["id"])
                if capability.get("attributes", {}).get("capability_code") != capability["id"]:
                    validation.error(capability["id"], "capability_code must exactly equal the stable capability ID")
    if capability_ids != EXPECTED_AI_CAPABILITIES:
        validation.error(
            "capabilities",
            f"capability mismatch; missing={sorted(EXPECTED_AI_CAPABILITIES - capability_ids)!r}, extra={sorted(capability_ids - EXPECTED_AI_CAPABILITIES)!r}",
        )


def check_safety_fences(
    data_documents: dict[Path, dict[str, Any]],
    collections: dict[str, set[str]],
    validation: Validation,
) -> None:
    records: dict[str, dict[str, Any]] = {}
    for document in data_documents.values():
        for obj, _ in iter_objects(document, ""):
            if isinstance(obj.get("id"), str):
                records[obj["id"]] = obj

    for path, document in data_documents.items():
        for obj, location in iter_objects(document, path.name):
            attributes = obj.get("attributes")
            if isinstance(attributes, dict):
                if attributes.get("runtime_enabled") is not None and attributes.get("runtime_enabled") is not False:
                    validation.error(f"{location}.attributes.runtime_enabled", "initial seed runtime records must be disabled")
                for field in ("launch_enabled", "clinical_enabled", "aggregate_score_enabled"):
                    if field in attributes and attributes[field] is not False:
                        validation.error(f"{location}.attributes.{field}", f"{field} must remain false")

    document_types: list[dict[str, Any]] = []
    extraction_schemas: list[dict[str, Any]] = []
    sources: list[dict[str, Any]] = []
    endpoints: list[dict[str, Any]] = []
    channels: list[dict[str, Any]] = []
    roles: list[dict[str, Any]] = []
    severities: list[dict[str, Any]] = []
    for document in data_documents.values():
        document_types.extend(document.get("document_types", []))
        extraction_schemas.extend(document.get("extraction_schemas", []))
        sources.extend(document.get("source_definitions", []))
        endpoints.extend(document.get("endpoints", []))
        channels.extend(document.get("channels", []))
        roles.extend(document.get("roles", []))
        severities.extend(document.get("severities", []))

    clinical_ids: set[str] = set()
    for item in document_types:
        attributes = item.get("attributes", {})
        if attributes.get("clinical") is True:
            clinical_ids.add(item.get("id"))
            required = {
                "launch_enabled": False,
                "processing_disposition": "POLICY_HOLD",
                "sensitivity_ref": "privacy.P5-EXCLUDED",
            }
            for key, expected in required.items():
                if attributes.get(key) != expected:
                    validation.error(item.get("id", "clinical-document-type"), f"clinical {key} must be {expected!r}")
            for key in ("supported_format_refs", "extraction_schema_refs", "monitoring_rule_refs", "source_refs"):
                if attributes.get(key) != []:
                    validation.error(item.get("id", "clinical-document-type"), f"clinical {key} must remain empty")
            boundary = records.get(attributes.get("content_boundary_ref"), {}).get("attributes", {})
            if boundary.get("code") != "CLINICAL_EXCLUDED" or boundary.get("ordinary_processing_allowed") is not False:
                validation.error(item.get("id", "clinical-document-type"), "clinical type must resolve to disabled CLINICAL_EXCLUDED boundary")
    for schema in extraction_schemas:
        refs = set(schema.get("attributes", {}).get("document_type_refs", []))
        if refs & clinical_ids or schema.get("attributes", {}).get("clinical_allowed") is not False:
            validation.error(schema.get("id", "extraction-schema"), "extraction schema cannot enable or reference a clinical type")

    for source in sources:
        attributes = source.get("attributes", {})
        if attributes.get("synthetic") is not True or attributes.get("non_production") is not True:
            validation.error(source.get("id", "source"), "seed source must be explicitly synthetic and non-production")
        if attributes.get("runtime_enabled") is not False:
            validation.error(source.get("id", "source"), "synthetic source must be disabled")
        if attributes.get("authority_tier_ref") != "authority-tier.UNAPPROVED_OR_UNKNOWN":
            validation.error(source.get("id", "source"), "synthetic source cannot claim an approved authority tier")
        if attributes.get("arbitrary_web_authority") is not False or attributes.get("production_coverage_claim") is not False:
            validation.error(source.get("id", "source"), "source cannot claim arbitrary-web authority or production coverage")

    for endpoint in endpoints:
        attributes = endpoint.get("attributes", {})
        url = attributes.get("url")
        host = urlparse(url).hostname if isinstance(url, str) else None
        if not host or not host.endswith(".invalid"):
            validation.error(endpoint.get("id", "endpoint"), "source example endpoint must use a .invalid host")
        if attributes.get("synthetic") is not True or attributes.get("non_production") is not True or attributes.get("runtime_enabled") is not False:
            validation.error(endpoint.get("id", "endpoint"), "source endpoint must be synthetic, non-production, and disabled")

    for channel in channels:
        attributes = channel.get("attributes", {})
        if attributes.get("external") is True and attributes.get("runtime_enabled") is not False:
            validation.error(channel.get("id", "channel"), "external channel must remain disabled while DEC-037 is open")
        if attributes.get("retention_policy") != "UNSET" or attributes.get("recipient_policy_defined") is not False:
            validation.error(channel.get("id", "channel"), "notification retention and recipient policy must remain unset")

    for role in roles:
        attributes = role.get("attributes", {})
        if attributes.get("runtime_enabled") is not False or attributes.get("standing_content_access") is not False or attributes.get("break_glass") is not False:
            validation.error(role.get("id", "role"), "draft role must be disabled with no standing or break-glass content access")

    for severity in severities:
        attributes = severity.get("attributes", {})
        if (
            attributes.get("runtime_enabled") is not False
            or attributes.get("numeric_rank") is not None
            or attributes.get("threshold_policy") != "UNSET"
            or attributes.get("consequence_action_refs") != []
        ):
            validation.error(severity.get("id", "severity"), "severity must remain disabled with no rank, threshold, or action")

    prohibited_duration_keys = {
        "duration",
        "duration_seconds",
        "ttl",
        "ttl_seconds",
        "timeout",
        "timeout_seconds",
        "cadence",
        "retry_interval",
        "freshness_days",
        "retention_days",
        "expiry_days",
        "delivery_objective",
    }
    for path, document in data_documents.items():
        for obj, location in iter_objects(document, path.name):
            for key in prohibited_duration_keys & set(obj):
                if obj[key] not in (None, False, "UNSET", "UNSET_NOT_ACTIVATABLE"):
                    validation.error(f"{location}.{key}", "operational duration/objective is not approved in the seed")


def main() -> None:
    validation = Validation()
    if not SCHEMA_ROOT.is_dir() or not DATA_ROOT.is_dir():
        validation.error("docs/11-reference-data", "schemas/ and data/ directories are required")
        validation.finish()

    schema_paths = sorted(SCHEMA_ROOT.glob("*.schema.json"))
    data_paths = sorted(DATA_ROOT.glob("*.json"))
    schema_names = {path.name.removesuffix(".schema.json") for path in schema_paths}
    data_names = {path.stem for path in data_paths}
    for name in sorted(EXPECTED_CATALOGUES - schema_names):
        validation.error("docs/11-reference-data/schemas", f"missing required schema {name}.schema.json")
    for name in sorted(EXPECTED_CATALOGUES - data_names):
        validation.error("docs/11-reference-data/data", f"missing required catalogue {name}.json")
    if schema_names != data_names:
        validation.error("docs/11-reference-data", f"schema/data name mismatch: schemas-only={sorted(schema_names - data_names)!r}, data-only={sorted(data_names - schema_names)!r}")

    schemas: dict[Path, dict[str, Any]] = {}
    data_documents: dict[Path, dict[str, Any]] = {}
    schema_ids: dict[str, Path] = {}

    for path in schema_paths:
        parsed = load_json(path, validation)
        if not isinstance(parsed, dict):
            if parsed is not None:
                validation.error(str(path.relative_to(REPOSITORY_ROOT)), "schema root must be an object")
            continue
        resolved = path.resolve()
        schemas[resolved] = parsed
        schema_id = parsed.get("$id")
        if not isinstance(schema_id, str) or not schema_id.startswith("https://schemas.document-management.example.invalid/reference-data/v1/"):
            validation.error(str(path.relative_to(REPOSITORY_ROOT)), "schema $id must be versioned under the reserved .invalid namespace")
        elif schema_id in schema_ids:
            validation.error(str(path.relative_to(REPOSITORY_ROOT)), f"duplicate schema $id also used by {schema_ids[schema_id]}")
        else:
            schema_ids[schema_id] = path
        version = parsed.get("x-schema-version")
        if not isinstance(version, str) or not VERSION_RE.fullmatch(version):
            validation.error(str(path.relative_to(REPOSITORY_ROOT)), "schema must declare a semantic x-schema-version")
        check_schema_subset(parsed, resolved, validation)

    engine = SchemaEngine(schemas, validation)
    for path in data_paths:
        parsed = load_json(path, validation)
        if not isinstance(parsed, dict):
            if parsed is not None:
                validation.error(str(path.relative_to(REPOSITORY_ROOT)), "catalogue root must be an object")
            continue
        data_documents[path.resolve()] = parsed
        schema_ref = parsed.get("$schema")
        if not isinstance(schema_ref, str):
            validation.error(str(path.relative_to(REPOSITORY_ROOT)), "catalogue must declare a local $schema")
            continue
        schema_path = (path.parent / schema_ref).resolve()
        try:
            schema_path.relative_to(SCHEMA_ROOT.resolve())
        except ValueError:
            validation.error(str(path.relative_to(REPOSITORY_ROOT)), "$schema must resolve inside docs/11-reference-data/schemas")
            continue
        schema = schemas.get(schema_path)
        if schema is None:
            validation.error(str(path.relative_to(REPOSITORY_ROOT)), f"declared schema does not exist: {schema_ref}")
            continue
        engine.validate(parsed, schema, schema_path, path.name)

    # Resolve every schema reference even when a data path did not exercise it.
    for schema_path, schema in schemas.items():
        for obj, location in iter_objects(schema, str(schema_path.relative_to(REPOSITORY_ROOT))):
            if "$ref" in obj and isinstance(obj["$ref"], str):
                engine.resolve_ref(obj["$ref"], schema_path, f"{location}.$ref")

    identifiers, collections, references = collect_identifiers_and_collections(data_documents, validation)
    external_ids = collect_markdown_ids()
    reference_count = check_references(identifiers, collections, references, external_ids, validation)
    check_metadata_and_retirement(data_documents, identifiers, collections, validation)
    check_exact_vocabularies(data_documents, validation)
    check_safety_fences(data_documents, collections, validation)
    validation.finish()

    print(
        "Reference-data validation passed: "
        f"{len(schemas)} schemas, {len(data_documents)} catalogues, "
        f"{len(identifiers)} unique IDs, {reference_count} checked references."
    )


if __name__ == "__main__":
    main()
