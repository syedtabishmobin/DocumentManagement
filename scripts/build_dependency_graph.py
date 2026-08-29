#!/usr/bin/env python3
"""Generate the deterministic Doculyra story dependency graph."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORIES = ROOT / "docs/10-backlog/02-features-and-stories.md"
STORY_RE = re.compile(r"^### `(STORY-P1-\d{3})`", re.MULTILINE)
REF_RE = re.compile(r"STORY-P1-(\d{3})")
CODE_RE = re.compile(r"`([^`]+)`")


def dependency_refs(row: str) -> list[str]:
    """Parse only the explicit 'Depends on' clause, including shorthand/ranges."""
    if "Depends on " not in row:
        return []
    clause = row.split("Depends on ", 1)[1].split(";", 1)[0]
    tokens = CODE_RE.findall(clause)
    result: set[str] = set()
    previous: int | None = None
    pending_range = False
    cursor = 0
    for match in CODE_RE.finditer(clause):
        between = clause[cursor:match.start()]
        pending_range = "–" in between or "-" in between
        token = match.group(1)
        full = REF_RE.fullmatch(token)
        if full:
            value = int(full.group(1))
        elif re.fullmatch(r"\d{3}", token) and previous is not None:
            value = int(token)
        else:
            cursor = match.end()
            continue
        if pending_range and previous is not None:
            low, high = sorted((previous, value))
            result.update(f"STORY-P1-{item:03d}" for item in range(low, high + 1))
        else:
            result.add(f"STORY-P1-{value:03d}")
        previous = value
        cursor = match.end()
    return sorted(result)


def graph() -> dict[str, list[str]]:
    text = STORIES.read_text(encoding="utf-8")
    matches = list(STORY_RE.finditer(text))
    result: dict[str, list[str]] = {}
    for index, match in enumerate(matches):
        story = match.group(1)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        section = text[match.start():end]
        row = next((line for line in section.splitlines() if line.startswith("| Dependencies / fences |")), "")
        result[story] = sorted(set(dependency_refs(row)) - {story})
    return dict(sorted(result.items()))


def topological_order(selected: dict[str, list[str]]) -> list[str]:
    known = set(selected)
    dangling = sorted({item for values in selected.values() for item in values if item not in known})
    if dangling:
        raise ValueError(f"dangling story dependencies: {', '.join(dangling)}")
    incoming = {story: set(dependencies) for story, dependencies in selected.items()}
    order: list[str] = []
    ready = sorted(story for story, dependencies in incoming.items() if not dependencies)
    while ready:
        story = ready.pop(0)
        order.append(story)
        for candidate in sorted(incoming):
            if story in incoming[candidate]:
                incoming[candidate].remove(story)
                if not incoming[candidate] and candidate not in order and candidate not in ready:
                    ready.append(candidate)
                    ready.sort()
    unresolved = sorted(story for story, dependencies in incoming.items() if dependencies)
    if unresolved:
        raise ValueError(f"cyclic story dependencies: {', '.join(unresolved)}")
    return order


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--format", choices=("text", "json", "dot"), default="text")
    args = parser.parse_args()
    selected = graph()
    order = topological_order(selected)
    if args.format == "json":
        print(json.dumps({"stories": selected, "topologicalOrder": order}, indent=2))
    elif args.format == "dot":
        print("digraph doculyra_phase1 {")
        for story in sorted(selected):
            if not selected[story]:
                print(f'  "{story}";')
            for dependency in selected[story]:
                print(f'  "{dependency}" -> "{story}";')
        print("}")
    else:
        for position, story in enumerate(order, start=1):
            dependencies = ", ".join(selected[story]) or "NONE"
            print(f"{position:02d}. {story} <- {dependencies}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
