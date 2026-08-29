#!/usr/bin/env python3
"""Rerun the end-to-end product traceability audit against the durable baseline."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from validate_build_baseline import BASELINE_PATH, validate


def main() -> int:
    errors, counts = validate()
    baseline = json.loads(Path(BASELINE_PATH).read_text(encoding="utf-8"))
    print("READ-ONLY PRODUCT TRACEABILITY RE-AUDIT")
    print("inventory: " + ", ".join(f"{key}={value}" for key, value in counts.items()))
    print(f"baseline: {baseline['baselineId']} ({baseline['status']})")
    print("product completion: 0 stories COMPLETE; Stage/BA/UAT remain NOT_YET_APPLICABLE")
    if errors:
        for error in errors:
            print(f"MISSING_OR_CONFLICT: {error}")
    if baseline["status"] != "BUILD_BASELINE_APPROVED":
        print("MISSING_OR_CONFLICT: build baseline is not independently approved")
        errors.append("baseline approval pending")
    if baseline.get("blockingDecisions"):
        print("MISSING_OR_CONFLICT: blocking decisions=" + ",".join(baseline["blockingDecisions"]))
        errors.append("blocking decision pending")
    if errors:
        print("END_TO_END_TRACEABILITY_INCOMPLETE")
        return 1
    print("END_TO_END_TRACEABILITY_COMPLETE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
