#!/usr/bin/env python3
"""Validate Phase 1 OpenAPI and event contracts with the Python standard library."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
OPENAPI = ROOT / "docs/05-api/02-openapi.json"
EVENTS = ROOT / "docs/05-api/events"
CATALOGUE = ROOT / "docs/05-api/03-event-catalogue.md"
STANDARDS = ROOT / "docs/05-api/01-api-standards.md"
PRD = ROOT / "docs/01-product/02-phase-1-prd.md"

METHODS = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}
OP_ID = re.compile(r"^API-P1-([0-9]{3})$")
EVT_ID = re.compile(r"^EVT-P1-([0-9]{3})$")
REQ_ID = re.compile(r"(?<![A-Z0-9-])REQ-P1-[A-Z]+-[0-9]{3}\b")
RULE_ID = re.compile(r"(?<![A-Z0-9-])API-P1-[0-9]{3}\b")
SCHEMA_NAME = re.compile(r"^evt-p1-([0-9]{3})-[a-z0-9-]+\.v1\.schema\.json$")
EXAMPLE_NAME = re.compile(r"^evt-p1-([0-9]{3})-[a-z0-9-]+\.v1\.example\.json$")

EXPECTED_OPERATIONS = set(range(101, 184))
EXPECTED_EVENTS = set(range(1, 33))
CONDITIONAL = {
    "API-P1-121",
    "API-P1-149",
    "API-P1-150",
    "API-P1-151",
    "API-P1-152",
    "API-P1-169",
    "API-P1-170",
    "API-P1-171",
    "API-P1-172",
    "API-P1-173",
    "API-P1-174",
    "API-P1-175",
    "API-P1-177",
    "API-P1-178",
    "API-P1-179",
    "API-P1-180",
    "API-P1-181",
    "API-P1-182",
    "API-P1-183",
}
DISABLED = {
    "API-P1-121",
    "API-P1-169",
    "API-P1-177",
    "API-P1-178",
    "API-P1-179",
    "API-P1-180",
    "API-P1-181",
    "API-P1-182",
    "API-P1-183",
}

JSON_CACHE: dict[Path, Any] = {}


class DuplicateKeyError(ValueError):
    pass


def no_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(f"duplicate object key {key!r}")
        result[key] = value
    return result


def rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path)


def load_json(path: Path, errors: list[str]) -> Any | None:
    path = path.resolve()
    if path in JSON_CACHE:
        return JSON_CACHE[path]
    try:
        value = json.loads(
            path.read_text(encoding="utf-8"), object_pairs_hook=no_duplicate_keys
        )
    except (OSError, UnicodeError, json.JSONDecodeError, DuplicateKeyError) as exc:
        errors.append(f"invalid JSON in {rel(path)}: {exc}")
        return None
    JSON_CACHE[path] = value
    return value


def pointer(document: Any, fragment: str) -> Any:
    if fragment in {"", "#"}:
        return document
    value = document
    raw = fragment[1:] if fragment.startswith("#") else fragment
    if not raw.startswith("/"):
        raise ValueError(f"unsupported fragment {fragment!r}")
    for token in raw[1:].split("/"):
        token = unquote(token).replace("~1", "/").replace("~0", "~")
        if isinstance(value, dict) and token in value:
            value = value[token]
        elif isinstance(value, list):
            try:
                value = value[int(token)]
            except (ValueError, IndexError) as exc:
                raise ValueError(f"unresolved array token {token!r}") from exc
        else:
            raise ValueError(f"unresolved object token {token!r}")
    return value


def resolve(
    reference: str, base: Path, errors: list[str], context: str
) -> tuple[Any | None, Path]:
    parsed = urlparse(reference)
    if parsed.scheme or parsed.netloc:
        errors.append(f"external $ref forbidden at {context}: {reference}")
        return None, base
    raw_path, separator, raw_fragment = reference.partition("#")
    target_path = (
        (base.parent / unquote(raw_path)).resolve() if raw_path else base.resolve()
    )
    try:
        target_path.relative_to(ROOT.resolve())
    except ValueError:
        errors.append(f"$ref escapes repository at {context}: {reference}")
        return None, target_path
    if not target_path.is_file():
        errors.append(f"missing $ref target at {context}: {reference}")
        return None, target_path
    document = load_json(target_path, errors)
    if document is None:
        return None, target_path
    try:
        return pointer(document, f"#{raw_fragment}" if separator else ""), target_path
    except ValueError as exc:
        errors.append(f"unresolved $ref at {context}: {reference} ({exc})")
        return None, target_path


def check_refs(value: Any, base: Path, errors: list[str], context: str) -> None:
    if isinstance(value, dict):
        reference = value.get("$ref")
        if reference is not None:
            if isinstance(reference, str):
                resolve(reference, base, errors, f"{context}/$ref")
            else:
                errors.append(f"non-string $ref at {context}")
        for key, child in value.items():
            check_refs(child, base, errors, f"{context}/{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            check_refs(child, base, errors, f"{context}/{index}")


def matches_type(instance: Any, expected: str) -> bool:
    if expected == "null":
        return instance is None
    if expected == "object":
        return isinstance(instance, dict)
    if expected == "array":
        return isinstance(instance, list)
    if expected == "string":
        return isinstance(instance, str)
    if expected == "boolean":
        return isinstance(instance, bool)
    if expected == "integer":
        return isinstance(instance, int) and not isinstance(instance, bool)
    if expected == "number":
        return isinstance(instance, (int, float)) and not isinstance(instance, bool)
    return True


def validate_schema(
    instance: Any,
    schema: Any,
    base: Path,
    resolver_errors: list[str],
    at: str = "$",
) -> list[str]:
    """Validate the JSON Schema 2020-12 subset present in this contract pack."""
    failures: list[str] = []
    if isinstance(schema, bool):
        return [] if schema else [f"{at}: rejected by false schema"]
    if not isinstance(schema, dict):
        return [f"{at}: schema must be an object or boolean"]

    if "$ref" in schema:
        target, target_path = resolve(
            schema["$ref"], base, resolver_errors, f"validation at {at}"
        )
        if target is None:
            return [f"{at}: unresolved schema reference"]
        failures.extend(validate_schema(instance, target, target_path, resolver_errors, at))

    for child in schema.get("allOf", []):
        failures.extend(validate_schema(instance, child, base, resolver_errors, at))

    if "oneOf" in schema:
        matches = sum(
            not validate_schema(instance, child, base, resolver_errors, at)
            for child in schema["oneOf"]
        )
        if matches != 1:
            failures.append(f"{at}: expected one oneOf match, found {matches}")
    if "anyOf" in schema:
        matches = any(
            not validate_schema(instance, child, base, resolver_errors, at)
            for child in schema["anyOf"]
        )
        if not matches:
            failures.append(f"{at}: no anyOf branch matched")
    if "not" in schema and not validate_schema(
        instance, schema["not"], base, resolver_errors, at
    ):
        failures.append(f"{at}: matched forbidden not schema")
    if "if" in schema:
        condition = not validate_schema(
            instance, schema["if"], base, resolver_errors, at
        )
        selected = schema.get("then") if condition else schema.get("else")
        if selected is not None:
            failures.extend(
                validate_schema(instance, selected, base, resolver_errors, at)
            )

    expected = schema.get("type")
    if expected is not None:
        expected_types = expected if isinstance(expected, list) else [expected]
        if not all(isinstance(item, str) for item in expected_types):
            return failures + [f"{at}: invalid schema type declaration"]
        if not any(matches_type(instance, item) for item in expected_types):
            return failures + [
                f"{at}: expected {expected_types}, got {type(instance).__name__}"
            ]

    if "const" in schema and instance != schema["const"]:
        failures.append(f"{at}: does not equal const {schema['const']!r}")
    if "enum" in schema and instance not in schema["enum"]:
        failures.append(f"{at}: value is outside enum")

    if isinstance(instance, str):
        if len(instance) < schema.get("minLength", 0):
            failures.append(f"{at}: shorter than minLength")
        if "maxLength" in schema and len(instance) > schema["maxLength"]:
            failures.append(f"{at}: longer than maxLength")
        if "pattern" in schema:
            try:
                if re.search(schema["pattern"], instance) is None:
                    failures.append(f"{at}: does not match pattern")
            except re.error as exc:
                resolver_errors.append(f"invalid pattern in {rel(base)}: {exc}")
        if schema.get("format") == "date-time":
            try:
                parsed = datetime.fromisoformat(instance.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    raise ValueError
            except ValueError:
                failures.append(f"{at}: invalid timezone-aware date-time")
        if schema.get("format") == "uri" and not urlparse(instance).scheme:
            failures.append(f"{at}: URI lacks a scheme")

    if isinstance(instance, (int, float)) and not isinstance(instance, bool):
        if "minimum" in schema and instance < schema["minimum"]:
            failures.append(f"{at}: below minimum")
        if "maximum" in schema and instance > schema["maximum"]:
            failures.append(f"{at}: above maximum")

    if isinstance(instance, dict):
        for required in schema.get("required", []):
            if required not in instance:
                failures.append(f"{at}: missing required property {required!r}")
        properties = schema.get("properties", {})
        for name, value in instance.items():
            if name in properties:
                failures.extend(
                    validate_schema(
                        value, properties[name], base, resolver_errors, f"{at}.{name}"
                    )
                )
            elif schema.get("additionalProperties") is False:
                failures.append(f"{at}: additional property {name!r} forbidden")
            elif isinstance(schema.get("additionalProperties"), dict):
                failures.extend(
                    validate_schema(
                        value,
                        schema["additionalProperties"],
                        base,
                        resolver_errors,
                        f"{at}.{name}",
                    )
                )
        if "minProperties" in schema and len(instance) < schema["minProperties"]:
            failures.append(f"{at}: fewer than minProperties")
        if "maxProperties" in schema and len(instance) > schema["maxProperties"]:
            failures.append(f"{at}: more than maxProperties")

    if isinstance(instance, list):
        if "minItems" in schema and len(instance) < schema["minItems"]:
            failures.append(f"{at}: fewer than minItems")
        if "maxItems" in schema and len(instance) > schema["maxItems"]:
            failures.append(f"{at}: more than maxItems")
        if schema.get("uniqueItems"):
            canonical = [json.dumps(value, sort_keys=True) for value in instance]
            if len(canonical) != len(set(canonical)):
                failures.append(f"{at}: items are not unique")
        if "items" in schema:
            for index, value in enumerate(instance):
                failures.extend(
                    validate_schema(
                        value,
                        schema["items"],
                        base,
                        resolver_errors,
                        f"{at}[{index}]",
                    )
                )
    return failures


def dereference_openapi(
    value: Any, document: dict[str, Any], errors: list[str]
) -> Any:
    seen: set[str] = set()
    while isinstance(value, dict) and "$ref" in value:
        reference = value["$ref"]
        if not isinstance(reference, str) or not reference.startswith("#/"):
            errors.append(f"OpenAPI component reference must be local: {reference!r}")
            return {}
        if reference in seen:
            errors.append(f"cyclic OpenAPI component reference: {reference}")
            return {}
        seen.add(reference)
        try:
            value = pointer(document, reference)
        except ValueError as exc:
            errors.append(f"unresolved OpenAPI component {reference}: {exc}")
            return {}
    return value


def parameters(
    path_item: dict[str, Any],
    operation: dict[str, Any],
    document: dict[str, Any],
    errors: list[str],
) -> dict[tuple[str, str], dict[str, Any]]:
    result: dict[tuple[str, str], dict[str, Any]] = {}
    for raw in [*path_item.get("parameters", []), *operation.get("parameters", [])]:
        parameter = dereference_openapi(raw, document, errors)
        if isinstance(parameter, dict):
            name, location = parameter.get("name"), parameter.get("in")
            if isinstance(name, str) and isinstance(location, str):
                result[(location.lower(), name.lower())] = parameter
    return result


def media_examples(media: Any) -> list[tuple[str, Any]]:
    if not isinstance(media, dict):
        return []
    result: list[tuple[str, Any]] = []
    if "example" in media:
        result.append(("example", media["example"]))
    for name, wrapper in media.get("examples", {}).items():
        if isinstance(wrapper, dict) and "value" in wrapper:
            result.append((name, wrapper["value"]))
    return result


def check_media(media: Any, label: str, base: Path, errors: list[str]) -> int:
    examples = media_examples(media)
    if not examples:
        errors.append(f"{label}: missing concrete example")
        return 0
    schema = media.get("schema") if isinstance(media, dict) else None
    if schema is None:
        errors.append(f"{label}: example has no schema")
        return 0
    for name, example in examples:
        for failure in validate_schema(example, schema, base, errors):
            errors.append(f"{label} example {name}: {failure}")
    return len(examples)


def validate_openapi(errors: list[str], counts: dict[str, int]) -> None:
    document = load_json(OPENAPI, errors)
    if not isinstance(document, dict):
        errors.append("OpenAPI document must be a JSON object")
        return
    if not str(document.get("openapi", "")).startswith("3.1."):
        errors.append(f"OpenAPI must be 3.1.x, got {document.get('openapi')!r}")
    if (
        document.get("jsonSchemaDialect")
        != "https://json-schema.org/draft/2020-12/schema"
    ):
        errors.append("OpenAPI jsonSchemaDialect must be JSON Schema 2020-12")
    if document.get("info", {}).get("x-status") != "DRAFT":
        errors.append("OpenAPI info.x-status must be DRAFT")
    servers = document.get("servers", [])
    if not servers or any(urlparse(server.get("url", "")).netloc for server in servers):
        errors.append("OpenAPI servers must be provider-neutral relative URLs")
    check_refs(document, OPENAPI, errors, rel(OPENAPI))

    bearer = (
        document.get("components", {})
        .get("securitySchemes", {})
        .get("bearerAuth", {})
    )
    if bearer.get("type") != "http" or bearer.get("scheme") != "bearer":
        errors.append("bearerAuth must be an HTTP bearer security scheme")

    known_requirements = set(REQ_ID.findall(PRD.read_text(encoding="utf-8")))
    known_rules = set(RULE_ID.findall(STANDARDS.read_text(encoding="utf-8")))
    operations: dict[str, tuple[str, str]] = {}
    conditionals: set[str] = set()
    example_count = 0
    paths = document.get("paths", {})
    if not isinstance(paths, dict) or not paths:
        errors.append("OpenAPI paths must be a non-empty object")
        return

    for path, raw_path_item in paths.items():
        path_item = dereference_openapi(raw_path_item, document, errors)
        if not isinstance(path_item, dict):
            errors.append(f"path item {path} must be an object")
            continue
        for method, raw_operation in path_item.items():
            if method.lower() not in METHODS:
                continue
            operation = dereference_openapi(raw_operation, document, errors)
            operation_id = operation.get("operationId") if isinstance(operation, dict) else None
            base_label = f"{method.upper()} {path}"
            match = OP_ID.fullmatch(operation_id) if isinstance(operation_id, str) else None
            if not match:
                errors.append(f"{base_label}: missing or invalid operationId")
                continue
            label = f"{operation_id} {base_label}"
            if operation_id in operations:
                errors.append(
                    f"duplicate operationId {operation_id}: {operations[operation_id]} and {base_label}"
                )
            operations[operation_id] = (method.upper(), path)

            security = operation.get("security")
            if not isinstance(security, list) or not any(
                isinstance(item, dict) and "bearerAuth" in item for item in security
            ):
                errors.append(f"{label}: explicit bearerAuth security required")
            if operation.get("x-current-authorization-required") is not True:
                errors.append(f"{label}: current authorization must be required")

            requirements = operation.get("x-requirements")
            if not isinstance(requirements, list) or not requirements:
                errors.append(f"{label}: x-requirements must be non-empty")
            elif set(requirements) - known_requirements:
                errors.append(
                    f"{label}: unknown requirements {sorted(set(requirements) - known_requirements)}"
                )
            rules = operation.get("x-rules")
            if not isinstance(rules, list) or not rules:
                errors.append(f"{label}: x-rules must be non-empty")
            elif set(rules) - known_rules:
                errors.append(
                    f"{label}: unknown API rules {sorted(set(rules) - known_rules)}"
                )

            params = parameters(path_item, operation, document, errors)
            if operation.get("x-scope") == "WORKSPACE":
                if "{workspaceId}" not in path:
                    errors.append(f"{label}: workspace path lacks workspaceId")
                for key in (
                    ("path", "workspaceid"),
                    ("header", "x-workspace-id"),
                    ("header", "x-purpose-id"),
                ):
                    if params.get(key, {}).get("required") is not True:
                        errors.append(f"{label}: required {key[0]} {key[1]} missing")
                if operation.get("x-workspace-context") != "PATH_AND_HEADER":
                    errors.append(f"{label}: workspace context must be PATH_AND_HEADER")
            elif operation_id != "API-P1-101":
                errors.append(f"{label}: unexpected non-workspace scope")
            elif params.get(("header", "x-purpose-id"), {}).get("required") is not True:
                errors.append(f"{label}: workspace creation requires X-Purpose-Id")

            command = operation.get("x-command") is True
            idempotent = operation.get("x-idempotency-required") is True
            idem_param = params.get(("header", "idempotency-key"))
            if command and (
                not idempotent or not idem_param or idem_param.get("required") is not True
            ):
                errors.append(f"{label}: command requires Idempotency-Key")
            if not command and (idempotent or idem_param):
                errors.append(f"{label}: query must not claim command idempotency")
            if operation.get("x-concurrency-required") is True and params.get(
                ("header", "if-match"), {}
            ).get("required") is not True:
                errors.append(f"{label}: concurrency guard requires If-Match")

            if operation_id in CONDITIONAL:
                conditionals.add(operation_id)
                fences = operation.get("x-decision-fence")
                states = operation.get("x-decision-state")
                if not isinstance(fences, list) or not fences:
                    errors.append(f"{label}: decision fence required")
                if not isinstance(states, dict) or set(states) != set(fences or []):
                    errors.append(f"{label}: decision states must match fences")
                if not operation.get("x-availability"):
                    errors.append(f"{label}: conditional availability required")
            elif any(
                key in operation
                for key in ("x-decision-fence", "x-decision-state", "x-availability")
            ):
                errors.append(f"{label}: unexpected conditional metadata")
            if (
                operation_id in DISABLED
                and operation.get("x-availability") != "DISABLED_UNTIL_APPROVED"
            ):
                errors.append(f"{label}: unresolved capability must remain disabled")

            if "requestBody" in operation:
                request = dereference_openapi(operation["requestBody"], document, errors)
                if request.get("required") is not True:
                    errors.append(f"{label}: requestBody must be required")
                for content_type, media in request.get("content", {}).items():
                    example_count += check_media(
                        media, f"{label} request {content_type}", OPENAPI, errors
                    )

            responses = operation.get("responses")
            if not isinstance(responses, dict) or not responses:
                errors.append(f"{label}: responses required")
                continue
            if "default" not in responses:
                errors.append(f"{label}: default problem response required")
            else:
                problem = dereference_openapi(responses["default"], document, errors)
                media = problem.get("content", {}).get("application/problem+json")
                example_count += check_media(
                    media, f"{label} default problem response", OPENAPI, errors
                )
            success = False
            for status, raw_response in responses.items():
                if status == "default" or not str(status).startswith("2"):
                    continue
                success = True
                response = dereference_openapi(raw_response, document, errors)
                content = response.get("content", {})
                if content:
                    for content_type, media in content.items():
                        example_count += check_media(
                            media,
                            f"{label} response {status} {content_type}",
                            OPENAPI,
                            errors,
                        )
                elif status != "204":
                    errors.append(f"{label}: success {status} lacks content")
            if not success:
                errors.append(f"{label}: a 2xx response is required")

    numbers = {
        int(match.group(1))
        for operation_id in operations
        if (match := OP_ID.fullmatch(operation_id))
    }
    if numbers != EXPECTED_OPERATIONS:
        errors.append(
            "operation inventory is not API-P1-101..183; "
            f"missing={sorted(EXPECTED_OPERATIONS - numbers) or 'none'}, "
            f"extra={sorted(numbers - EXPECTED_OPERATIONS) or 'none'}"
        )
    if conditionals != CONDITIONAL:
        errors.append(
            f"conditional operation mismatch: missing={sorted(CONDITIONAL - conditionals)}"
        )
    counts["operations"] = len(operations)
    counts["openapi_schemas"] = len(
        document.get("components", {}).get("schemas", {})
    )
    counts["openapi_examples"] = example_count


def consts(schema: Any, property_name: str) -> set[Any]:
    result: set[Any] = set()
    if isinstance(schema, dict):
        properties = schema.get("properties")
        if isinstance(properties, dict):
            candidate = properties.get(property_name)
            if isinstance(candidate, dict) and "const" in candidate:
                result.add(candidate["const"])
        for child in schema.values():
            result.update(consts(child, property_name))
    elif isinstance(schema, list):
        for child in schema:
            result.update(consts(child, property_name))
    return result


def refs(value: Any) -> list[str]:
    result: list[str] = []
    if isinstance(value, dict):
        if isinstance(value.get("$ref"), str):
            result.append(value["$ref"])
        for child in value.values():
            result.extend(refs(child))
    elif isinstance(value, list):
        for child in value:
            result.extend(refs(child))
    return result


def validate_events(errors: list[str], counts: dict[str, int]) -> None:
    if not EVENTS.is_dir():
        errors.append("missing docs/05-api/events")
        return
    all_json = sorted(EVENTS.rglob("*.json"))
    common = EVENTS / "common/event-envelope.v1.schema.json"
    schemas: dict[str, Path] = {}
    examples: dict[str, Path] = {}

    for path in all_json:
        value = load_json(path, errors)
        if path.name.endswith(".schema.json") and isinstance(value, dict):
            if value.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
                errors.append(f"{rel(path)}: JSON Schema dialect must be 2020-12")
            check_refs(value, path, errors, rel(path))

    if not common.is_file():
        errors.append("missing common event envelope")
    schema_files = [
        path
        for path in all_json
        if path.name.endswith(".schema.json") and path.resolve() != common.resolve()
    ]
    example_files = [
        path for path in all_json if path.name.endswith(".example.json")
    ]

    for path in schema_files:
        match = SCHEMA_NAME.fullmatch(path.name)
        if not match:
            errors.append(f"invalid event schema filename: {rel(path)}")
            continue
        event_type = f"EVT-P1-{match.group(1)}"
        schema = load_json(path, errors)
        if not isinstance(schema, dict):
            continue
        if consts(schema, "event_type") != {event_type}:
            errors.append(f"{rel(path)}: event_type const does not match filename")
        if consts(schema, "schema_version") != {"1.0.0"}:
            errors.append(f"{rel(path)}: schema_version const must be 1.0.0")
        if "../common/event-envelope.v1.schema.json" not in refs(schema):
            errors.append(f"{rel(path)}: common envelope is not composed")
        if event_type in schemas:
            errors.append(f"duplicate event schema ID {event_type}")
        schemas[event_type] = path

    for path in example_files:
        match = EXAMPLE_NAME.fullmatch(path.name)
        if not match:
            errors.append(f"invalid event example filename: {rel(path)}")
            continue
        event_type = f"EVT-P1-{match.group(1)}"
        example = load_json(path, errors)
        if not isinstance(example, dict):
            continue
        if example.get("event_type") != event_type:
            errors.append(f"{rel(path)}: event_type does not match filename")
        if example.get("schema_version") != "1.0.0":
            errors.append(f"{rel(path)}: schema_version must be 1.0.0")
        if event_type in examples:
            errors.append(f"duplicate event example ID {event_type}")
        examples[event_type] = path

    if set(schemas) != set(examples):
        errors.append(
            "event schema/example inventory mismatch; "
            f"schemas-only={sorted(set(schemas) - set(examples)) or 'none'}, "
            f"examples-only={sorted(set(examples) - set(schemas)) or 'none'}"
        )
    checked_examples = 0
    for event_type in sorted(set(schemas) & set(examples)):
        schema_path, example_path = schemas[event_type], examples[event_type]
        expected = schema_path.with_name(
            schema_path.name.replace(".schema.json", ".example.json")
        )
        if example_path != expected:
            errors.append(f"{event_type}: schema/example semantic filenames differ")
        schema = load_json(schema_path, errors)
        example = load_json(example_path, errors)
        if schema is None or example is None:
            continue
        for failure in validate_schema(example, schema, schema_path, errors):
            errors.append(f"{event_type} example: {failure}")
        checked_examples += 1
        occurred, recorded = example.get("occurred_at"), example.get("recorded_at")
        if isinstance(occurred, str) and isinstance(recorded, str):
            try:
                if datetime.fromisoformat(recorded.replace("Z", "+00:00")) < datetime.fromisoformat(
                    occurred.replace("Z", "+00:00")
                ):
                    errors.append(f"{event_type}: recorded_at precedes occurred_at")
            except ValueError:
                pass

    numbers = {
        int(match.group(1))
        for event_type in schemas
        if (match := EVT_ID.fullmatch(event_type))
    }
    if numbers != EXPECTED_EVENTS:
        errors.append(
            "event inventory is not EVT-P1-001..032; "
            f"missing={sorted(EXPECTED_EVENTS - numbers) or 'none'}, "
            f"extra={sorted(numbers - EXPECTED_EVENTS) or 'none'}"
        )

    if not CATALOGUE.is_file():
        errors.append("missing event catalogue")
    else:
        text = CATALOGUE.read_text(encoding="utf-8")
        catalogued = set(
            re.findall(r"^\| \x60(EVT-P1-[0-9]{3})\x60 \|", text, re.MULTILINE)
        )
        if catalogued != set(schemas):
            errors.append("event catalogue/schema ID inventory mismatch")
        for event_type, schema_path in schemas.items():
            schema_link = rel(schema_path).removeprefix("docs/05-api/")
            example_link = schema_link.replace(".schema.json", ".example.json")
            if f"]({schema_link})" not in text:
                errors.append(f"catalogue lacks schema link for {event_type}")
            if f"]({example_link})" not in text:
                errors.append(f"catalogue lacks example link for {event_type}")

    counts["event_json"] = len(all_json)
    counts["event_schemas"] = len(schema_files)
    counts["event_examples"] = checked_examples


def main() -> int:
    errors: list[str] = []
    counts: dict[str, int] = {}
    for path in (OPENAPI, CATALOGUE, STANDARDS, PRD):
        if not path.is_file():
            errors.append(f"missing required input: {rel(path)}")
    if OPENAPI.is_file() and STANDARDS.is_file() and PRD.is_file():
        validate_openapi(errors, counts)
    validate_events(errors, counts)
    if errors:
        print("API/event contract validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(
        "API/event contract validation passed: "
        f"{counts.get('operations', 0)} operations, "
        f"{counts.get('openapi_schemas', 0)} OpenAPI schemas, "
        f"{counts.get('openapi_examples', 0)} OpenAPI examples, "
        f"{counts.get('event_schemas', 0)} event schemas, "
        f"{counts.get('event_examples', 0)} event examples, "
        f"{counts.get('event_json', 0)} event JSON files."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
