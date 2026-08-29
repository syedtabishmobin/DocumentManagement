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


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def render(values: dict[str, str], config: dict[str, Any] | None = None) -> str:
    selected = config or load_config()
    required = selected["requiredFields"]
    missing = [field for field in required if not values.get(field)]
    if missing:
        raise ValueError(f"missing attribution fields: {', '.join(missing)}")
    pattern = re.compile(selected["identifierPattern"])
    for field in required:
        items = values[field].split(selected["listSeparator"]) if field.endswith("_ids") else [values[field]]
        if any(not pattern.fullmatch(item) for item in items):
            raise ValueError(f"invalid attribution value for {field}")
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
        values[key] = value
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
