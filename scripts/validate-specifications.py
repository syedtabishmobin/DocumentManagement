#!/usr/bin/env python3
"""Validate repository-level specification integrity using only the standard library."""

from __future__ import annotations

import hashlib
import re
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_MARKDOWN_FILES = (
    "AGENTS.md",
    "CODEX.md",
    "README.md",
    "SPECIFICATION-READINESS.md",
    "TRACEABILITY.md",
    "docs/README.md",
    "docs/00-context/decision-register.md",
    "docs/00-context/competitive-research-sources.md",
    "docs/01-product/01-product-vision-strategy.md",
    "docs/01-product/02-phase-1-prd.md",
    "docs/01-product/03-feature-catalogue.md",
    "docs/01-product/04-use-case-catalogue.md",
    "docs/01-product/05-personas-and-journeys.md",
    "docs/01-product/06-scope-and-success-metrics.md",
    "docs/01-product/07-competitive-gap-analysis.md",
    "docs/01-product/README.md",
    "docs/02-architecture/01-solution-architecture.md",
    "docs/02-architecture/02-domain-model.md",
    "docs/02-architecture/03-logical-data-model.md",
    "docs/02-architecture/04-workspace-family-membership-model.md",
    "docs/02-architecture/05-non-functional-requirements.md",
    "docs/02-architecture/06-adrs/README.md",
    "docs/02-architecture/06-adrs/ADR-001-bitemporal-fact-and-rule-history.md",
    "docs/02-architecture/06-adrs/ADR-002-immutable-originals-and-rebuildable-derivatives.md",
    "docs/02-architecture/06-adrs/ADR-003-current-authorization-for-derived-projections.md",
    "docs/02-architecture/06-adrs/ADR-004-durable-commands-events-and-eventual-consistency.md",
    "docs/02-architecture/06-adrs/ADR-005-provider-neutral-ports-and-residency-policy.md",
    "docs/02-architecture/06-adrs/ADR-006-phase-1-local-first-typescript-stack.md",
    "docs/02-architecture/README.md",
    "docs/03-document-intelligence/01-document-taxonomy.md",
    "docs/03-document-intelligence/02-ingestion-processing.md",
    "docs/03-document-intelligence/03-extraction-and-evidence.md",
    "docs/03-document-intelligence/04-facts-and-entities.md",
    "docs/03-document-intelligence/05-dependency-graph.md",
    "docs/03-document-intelligence/06-change-monitoring.md",
    "docs/03-document-intelligence/07-impact-analysis-and-actions.md",
    "docs/03-document-intelligence/08-trusted-source-registry.md",
    "docs/03-document-intelligence/09-document-health-and-expected-evidence.md",
    "docs/03-document-intelligence/10-versioning-and-conformed-views.md",
    "docs/03-document-intelligence/README.md",
    "docs/04-ai/01-ai-capability-architecture.md",
    "docs/04-ai/02-rag-and-search-architecture.md",
    "docs/04-ai/03-structured-output-contracts.md",
    "docs/04-ai/04-prompt-and-tool-standards.md",
    "docs/04-ai/05-ai-guardrails.md",
    "docs/04-ai/06-ai-evaluation-framework.md",
    "docs/04-ai/README.md",
    "docs/05-api/01-api-standards.md",
    "docs/05-api/03-event-catalogue.md",
    "docs/05-api/04-connector-contracts.md",
    "docs/05-api/README.md",
    "docs/06-security/01-security-architecture.md",
    "docs/06-security/02-authorization-model.md",
    "docs/06-security/03-privacy-and-data-governance.md",
    "docs/06-security/04-audit-and-provenance.md",
    "docs/06-security/05-threat-model.md",
    "docs/06-security/README.md",
    "docs/07-ux/01-information-architecture.md",
    "docs/07-ux/02-user-flows.md",
    "docs/07-ux/03-screen-specifications.md",
    "docs/07-ux/04-design-system.md",
    "docs/07-ux/05-accessibility.md",
    "docs/07-ux/README.md",
    "docs/08-engineering/01-technology-stack.md",
    "docs/08-engineering/02-repository-structure.md",
    "docs/08-engineering/03-coding-standards.md",
    "docs/08-engineering/04-error-and-resilience-standards.md",
    "docs/08-engineering/05-local-development.md",
    "docs/08-engineering/06-testing-standards.md",
    "docs/08-engineering/README.md",
    "docs/09-devops/01-environments.md",
    "docs/09-devops/02-ci-cd.md",
    "docs/09-devops/03-infrastructure-as-code.md",
    "docs/09-devops/04-secrets-and-configuration.md",
    "docs/09-devops/05-deployment-rollback-and-repair.md",
    "docs/09-devops/06-backup-and-disaster-recovery.md",
    "docs/09-devops/07-observability.md",
    "docs/09-devops/README.md",
    "docs/10-backlog/01-epics.md",
    "docs/10-backlog/02-features-and-stories.md",
    "docs/10-backlog/03-release-plan.md",
    "docs/10-backlog/04-traceability-matrix.md",
    "docs/10-backlog/README.md",
    "docs/11-reference-data/README.md",
    "docs/12-testing/01-test-strategy.md",
    "docs/12-testing/02-ai-evaluation-scenarios.md",
    "docs/12-testing/03-security-tests.md",
    "docs/12-testing/04-integration-and-e2e-scenarios.md",
    "docs/12-testing/05-performance-and-resilience-tests.md",
    "docs/12-testing/fixtures/README.md",
    "docs/12-testing/README.md",
    "scripts/README.md",
)

OWNER_FILES = {
    "DEC": "docs/00-context/decision-register.md",
    "GAP": "docs/01-product/07-competitive-gap-analysis.md",
    "OUT-P1": "docs/01-product/02-phase-1-prd.md",
    "REQ-P1": "docs/01-product/02-phase-1-prd.md",
    "FEAT-P1": "docs/01-product/03-feature-catalogue.md",
    "UC-P1": "docs/01-product/04-use-case-catalogue.md",
    "PER-P1": "docs/01-product/05-personas-and-journeys.md",
    "JRN-P1": "docs/01-product/05-personas-and-journeys.md",
    "MET-P1": "docs/01-product/06-scope-and-success-metrics.md",
    "ARCH-P1": "docs/02-architecture/01-solution-architecture.md",
    "DOM-P1": "docs/02-architecture/02-domain-model.md",
    "DATA-P1": "docs/02-architecture/03-logical-data-model.md",
    "WSP-P1": "docs/02-architecture/04-workspace-family-membership-model.md",
    "NFR-P1": "docs/02-architecture/05-non-functional-requirements.md",
    "ADR-ARCH": "docs/02-architecture/06-adrs/README.md",
    "DIT-TAX-P1": "docs/03-document-intelligence/01-document-taxonomy.md",
    "DIT-ING-P1": "docs/03-document-intelligence/02-ingestion-processing.md",
    "DIT-EXT-P1": "docs/03-document-intelligence/03-extraction-and-evidence.md",
    "DIT-FCT-P1": "docs/03-document-intelligence/04-facts-and-entities.md",
    "DIT-GPH-P1": "docs/03-document-intelligence/05-dependency-graph.md",
    "DIT-MON-P1": "docs/03-document-intelligence/06-change-monitoring.md",
    "DIT-IMP-P1": "docs/03-document-intelligence/07-impact-analysis-and-actions.md",
    "DIT-SRC-P1": "docs/03-document-intelligence/08-trusted-source-registry.md",
    "DIT-HLT-P1": "docs/03-document-intelligence/09-document-health-and-expected-evidence.md",
    "DIT-VER-P1": "docs/03-document-intelligence/10-versioning-and-conformed-views.md",
    "AI-CAP-P1": "docs/04-ai/01-ai-capability-architecture.md",
    "AI-RAG-P1": "docs/04-ai/02-rag-and-search-architecture.md",
    "AI-OUT-P1": "docs/04-ai/03-structured-output-contracts.md",
    "AI-TOOL-P1": "docs/04-ai/04-prompt-and-tool-standards.md",
    "AI-GRD-P1": "docs/04-ai/05-ai-guardrails.md",
    "AI-EVAL-P1": "docs/04-ai/06-ai-evaluation-framework.md",
    "SEC-P1": "docs/06-security/01-security-architecture.md",
    "AUTH-P1": "docs/06-security/02-authorization-model.md",
    "PRIV-P1": "docs/06-security/03-privacy-and-data-governance.md",
    "AUD-P1": "docs/06-security/04-audit-and-provenance.md",
    "THR-P1": "docs/06-security/05-threat-model.md",
    "UX-IA-P1": "docs/07-ux/01-information-architecture.md",
    "UX-FLOW-P1": "docs/07-ux/02-user-flows.md",
    "UX-SCR-P1": "docs/07-ux/03-screen-specifications.md",
    "UX-DS-P1": "docs/07-ux/04-design-system.md",
    "A11Y-P1": "docs/07-ux/05-accessibility.md",
    "ENG-STACK-P1": "docs/08-engineering/01-technology-stack.md",
    "ENG-REP-P1": "docs/08-engineering/02-repository-structure.md",
    "ENG-CODE-P1": "docs/08-engineering/03-coding-standards.md",
    "ENG-ERR-P1": "docs/08-engineering/04-error-and-resilience-standards.md",
    "ENG-DEV-P1": "docs/08-engineering/05-local-development.md",
    "ENG-TST-P1": "docs/08-engineering/06-testing-standards.md",
    "OPS-ENV-P1": "docs/09-devops/01-environments.md",
    "OPS-CICD-P1": "docs/09-devops/02-ci-cd.md",
    "OPS-IAC-P1": "docs/09-devops/03-infrastructure-as-code.md",
    "OPS-SEC-P1": "docs/09-devops/04-secrets-and-configuration.md",
    "OPS-DEP-P1": "docs/09-devops/05-deployment-rollback-and-repair.md",
    "OPS-DR-P1": "docs/09-devops/06-backup-and-disaster-recovery.md",
    "OPS-OBS-P1": "docs/09-devops/07-observability.md",
    "EPIC-P1": "docs/10-backlog/01-epics.md",
    "STORY-P1": "docs/10-backlog/02-features-and-stories.md",
    "AC-STORY-P1": "docs/10-backlog/02-features-and-stories.md",
    "TEST-UNIT-P1": "docs/12-testing/01-test-strategy.md",
    "TEST-CON-P1": "docs/12-testing/01-test-strategy.md",
    "TEST-AI-P1": "docs/12-testing/02-ai-evaluation-scenarios.md",
    "TEST-SEC-P1": "docs/12-testing/03-security-tests.md",
    "TEST-E2E-P1": "docs/12-testing/04-integration-and-e2e-scenarios.md",
    "TEST-PERF-P1": "docs/12-testing/05-performance-and-resilience-tests.md",
    "TEST-DR-P1": "docs/12-testing/05-performance-and-resilience-tests.md",
}

ID_PATTERNS = {
    # The negative lookbehind prevents a shorter namespace from matching
    # inside a longer one, for example OUT-P1-001 inside AI-OUT-P1-001 or
    # UC-P1-001 inside AC-UC-P1-001-01.
    "DEC": re.compile(r"(?<![A-Z0-9-])DEC-\d{3}\b"),
    "GAP": re.compile(r"(?<![A-Z0-9-])GAP-\d{3}\b"),
    "OUT-P1": re.compile(r"(?<![A-Z0-9-])OUT-P1-\d{3}\b"),
    "REQ-P1": re.compile(r"(?<![A-Z0-9-])REQ-P1-[A-Z]+-\d{3}\b"),
    "FEAT-P1": re.compile(r"(?<![A-Z0-9-])FEAT-P1-\d{3}\b"),
    "UC-P1": re.compile(r"(?<![A-Z0-9-])UC-P1-\d{3}\b"),
    "PER-P1": re.compile(r"(?<![A-Z0-9-])PER-P1-\d{3}\b"),
    "JRN-P1": re.compile(r"(?<![A-Z0-9-])JRN-P1-\d{3}\b"),
    "MET-P1": re.compile(r"(?<![A-Z0-9-])MET-P1-\d{3}\b"),
    "ARCH-P1": re.compile(r"(?<![A-Z0-9-])ARCH-P1-\d{3}\b"),
    "DOM-P1": re.compile(r"(?<![A-Z0-9-])DOM-P1-\d{3}\b"),
    "DATA-P1": re.compile(r"(?<![A-Z0-9-])DATA-P1-\d{3}\b"),
    "WSP-P1": re.compile(r"(?<![A-Z0-9-])WSP-P1-\d{3}\b"),
    "NFR-P1": re.compile(r"(?<![A-Z0-9-])NFR-P1-\d{3}\b"),
    "ADR-ARCH": re.compile(r"(?<![A-Z0-9-])ADR-ARCH-\d{3}\b"),
    "DIT-TAX-P1": re.compile(r"(?<![A-Z0-9-])DIT-TAX-P1-\d{3}\b"),
    "DIT-ING-P1": re.compile(r"(?<![A-Z0-9-])DIT-ING-P1-\d{3}\b"),
    "DIT-EXT-P1": re.compile(r"(?<![A-Z0-9-])DIT-EXT-P1-\d{3}\b"),
    "DIT-FCT-P1": re.compile(r"(?<![A-Z0-9-])DIT-FCT-P1-\d{3}\b"),
    "DIT-GPH-P1": re.compile(r"(?<![A-Z0-9-])DIT-GPH-P1-\d{3}\b"),
    "DIT-MON-P1": re.compile(r"(?<![A-Z0-9-])DIT-MON-P1-\d{3}\b"),
    "DIT-IMP-P1": re.compile(r"(?<![A-Z0-9-])DIT-IMP-P1-\d{3}\b"),
    "DIT-SRC-P1": re.compile(r"(?<![A-Z0-9-])DIT-SRC-P1-\d{3}\b"),
    "DIT-HLT-P1": re.compile(r"(?<![A-Z0-9-])DIT-HLT-P1-\d{3}\b"),
    "DIT-VER-P1": re.compile(r"(?<![A-Z0-9-])DIT-VER-P1-\d{3}\b"),
    "AI-CAP-P1": re.compile(r"(?<![A-Z0-9-])AI-CAP-P1-\d{3}\b"),
    "AI-RAG-P1": re.compile(r"(?<![A-Z0-9-])AI-RAG-P1-\d{3}\b"),
    "AI-OUT-P1": re.compile(r"(?<![A-Z0-9-])AI-OUT-P1-\d{3}\b"),
    "AI-TOOL-P1": re.compile(r"(?<![A-Z0-9-])AI-TOOL-P1-\d{3}\b"),
    "AI-GRD-P1": re.compile(r"(?<![A-Z0-9-])AI-GRD-P1-\d{3}\b"),
    "AI-EVAL-P1": re.compile(r"(?<![A-Z0-9-])AI-EVAL-P1-\d{3}\b"),
    "SEC-P1": re.compile(r"(?<![A-Z0-9-])SEC-P1-\d{3}\b"),
    "AUTH-P1": re.compile(r"(?<![A-Z0-9-])AUTH-P1-\d{3}\b"),
    "PRIV-P1": re.compile(r"(?<![A-Z0-9-])PRIV-P1-\d{3}\b"),
    "AUD-P1": re.compile(r"(?<![A-Z0-9-])AUD-P1-\d{3}\b"),
    "THR-P1": re.compile(r"(?<![A-Z0-9-])THR-P1-\d{3}\b"),
    "UX-IA-P1": re.compile(r"(?<![A-Z0-9-])UX-IA-P1-\d{3}\b"),
    "UX-FLOW-P1": re.compile(r"(?<![A-Z0-9-])UX-FLOW-P1-\d{3}\b"),
    "UX-SCR-P1": re.compile(r"(?<![A-Z0-9-])UX-SCR-P1-\d{3}\b"),
    "UX-DS-P1": re.compile(r"(?<![A-Z0-9-])UX-DS-P1-\d{3}\b"),
    "A11Y-P1": re.compile(r"(?<![A-Z0-9-])A11Y-P1-\d{3}\b"),
    "ENG-STACK-P1": re.compile(r"(?<![A-Z0-9-])ENG-STACK-P1-\d{3}\b"),
    "ENG-REP-P1": re.compile(r"(?<![A-Z0-9-])ENG-REP-P1-\d{3}\b"),
    "ENG-CODE-P1": re.compile(r"(?<![A-Z0-9-])ENG-CODE-P1-\d{3}\b"),
    "ENG-ERR-P1": re.compile(r"(?<![A-Z0-9-])ENG-ERR-P1-\d{3}\b"),
    "ENG-DEV-P1": re.compile(r"(?<![A-Z0-9-])ENG-DEV-P1-\d{3}\b"),
    "ENG-TST-P1": re.compile(r"(?<![A-Z0-9-])ENG-TST-P1-\d{3}\b"),
    "OPS-ENV-P1": re.compile(r"(?<![A-Z0-9-])OPS-ENV-P1-\d{3}\b"),
    "OPS-CICD-P1": re.compile(r"(?<![A-Z0-9-])OPS-CICD-P1-\d{3}\b"),
    "OPS-IAC-P1": re.compile(r"(?<![A-Z0-9-])OPS-IAC-P1-\d{3}\b"),
    "OPS-SEC-P1": re.compile(r"(?<![A-Z0-9-])OPS-SEC-P1-\d{3}\b"),
    "OPS-DEP-P1": re.compile(r"(?<![A-Z0-9-])OPS-DEP-P1-\d{3}\b"),
    "OPS-DR-P1": re.compile(r"(?<![A-Z0-9-])OPS-DR-P1-\d{3}\b"),
    "OPS-OBS-P1": re.compile(r"(?<![A-Z0-9-])OPS-OBS-P1-\d{3}\b"),
    "EPIC-P1": re.compile(r"(?<![A-Z0-9-])EPIC-P1-\d{3}\b"),
    "STORY-P1": re.compile(r"(?<![A-Z0-9-])STORY-P1-\d{3}\b"),
    "AC-STORY-P1": re.compile(r"(?<![A-Z0-9-])AC-STORY-P1-\d{3}-\d{2}\b"),
    "TEST-UNIT-P1": re.compile(r"(?<![A-Z0-9-])TEST-UNIT-P1-\d{3}\b"),
    "TEST-CON-P1": re.compile(r"(?<![A-Z0-9-])TEST-CON-P1-\d{3}\b"),
    "TEST-AI-P1": re.compile(r"(?<![A-Z0-9-])TEST-AI-P1-\d{3}\b"),
    "TEST-SEC-P1": re.compile(r"(?<![A-Z0-9-])TEST-SEC-P1-\d{3}\b"),
    "TEST-E2E-P1": re.compile(r"(?<![A-Z0-9-])TEST-E2E-P1-\d{3}\b"),
    "TEST-PERF-P1": re.compile(r"(?<![A-Z0-9-])TEST-PERF-P1-\d{3}\b"),
    "TEST-DR-P1": re.compile(r"(?<![A-Z0-9-])TEST-DR-P1-\d{3}\b"),
}

DOCUMENT_ID = re.compile(r"^\| Document ID \| `([^`]+)` \|$", re.MULTILINE)
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
CHECKSUM_LINE = re.compile(r"^([0-9a-f]{64})  (.+)$")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def markdown_files() -> list[Path]:
    ignored_directories = {".git", "node_modules", "dist", "coverage", ".next", ".vite"}
    return sorted(
        path
        for path in ROOT.rglob("*.md")
        if not ignored_directories.intersection(path.parts)
    )


def check_required_files(errors: list[str]) -> None:
    for relative in REQUIRED_MARKDOWN_FILES:
        if not (ROOT / relative).is_file():
            errors.append(f"missing required specification artifact: {relative}")


def check_document_ids(files: list[Path], errors: list[str]) -> None:
    definitions: dict[str, str] = {}
    for path in files:
        matches = DOCUMENT_ID.findall(read(path))
        if len(matches) > 1:
            errors.append(
                f"{path.relative_to(ROOT)} declares multiple Document IDs: {matches}"
            )
        for document_id in matches:
            relative = str(path.relative_to(ROOT))
            if document_id in definitions:
                errors.append(
                    f"duplicate Document ID {document_id}: "
                    f"{definitions[document_id]} and {relative}"
                )
            definitions[document_id] = relative


def link_target(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<") and value.endswith(">"):
        value = value[1:-1]
    return value.split("#", 1)[0]


def check_local_links(files: list[Path], errors: list[str]) -> None:
    for path in files:
        for raw in MARKDOWN_LINK.findall(read(path)):
            target = link_target(raw)
            if not target or target.startswith(("http://", "https://", "mailto:", "tel:")):
                continue
            if "://" in target:
                continue
            resolved = (path.parent / target).resolve()
            try:
                resolved.relative_to(ROOT.resolve())
            except ValueError:
                errors.append(
                    f"local link escapes repository in {path.relative_to(ROOT)}: {raw}"
                )
                continue
            if not resolved.exists():
                errors.append(
                    f"broken local link in {path.relative_to(ROOT)}: {raw}"
                )


def owner_ids(namespace: str, errors: list[str]) -> set[str]:
    path = ROOT / OWNER_FILES[namespace]
    if not path.is_file():
        errors.append(f"missing ID owner for {namespace}: {path.relative_to(ROOT)}")
        return set()
    return set(ID_PATTERNS[namespace].findall(read(path)))


def check_known_ids(files: list[Path], errors: list[str]) -> None:
    all_text = "\n".join(read(path) for path in files)
    for namespace, pattern in ID_PATTERNS.items():
        declared = owner_ids(namespace, errors)
        referenced = set(pattern.findall(all_text))
        unknown = sorted(referenced - declared)
        if unknown:
            errors.append(
                f"unknown {namespace} references: {', '.join(unknown)}"
            )


def check_numbered_namespace(
    path: str,
    pattern: re.Pattern[str],
    prefix: str,
    expected_start: int,
    errors: list[str],
) -> None:
    values = sorted(set(pattern.findall(read(ROOT / path))))
    numbers = sorted(int(value.rsplit("-", 1)[1]) for value in values)
    if not numbers:
        errors.append(f"no {prefix} IDs found in {path}")
        return
    expected = list(range(expected_start, numbers[-1] + 1))
    if numbers != expected:
        missing = sorted(set(expected) - set(numbers))
        errors.append(
            f"non-contiguous {prefix} IDs in {path}; missing: "
            f"{', '.join(f'{number:03d}' for number in missing) or 'unknown'}"
        )


def check_product_baseline(errors: list[str]) -> None:
    prd = read(ROOT / OWNER_FILES["REQ-P1"])
    requirements = set(ID_PATTERNS["REQ-P1"].findall(prd))
    features = read(ROOT / OWNER_FILES["FEAT-P1"])
    feature_requirements = set(ID_PATTERNS["REQ-P1"].findall(features))
    missing = sorted(requirements - feature_requirements)
    extra = sorted(feature_requirements - requirements)
    if missing:
        errors.append(f"PRD requirements absent from feature catalogue: {', '.join(missing)}")
    if extra:
        errors.append(f"feature catalogue has unknown requirements: {', '.join(extra)}")

    check_numbered_namespace(
        OWNER_FILES["FEAT-P1"], ID_PATTERNS["FEAT-P1"], "FEAT-P1", 1, errors
    )
    check_numbered_namespace(
        OWNER_FILES["UC-P1"], ID_PATTERNS["UC-P1"], "UC-P1", 1, errors
    )
    check_numbered_namespace(
        OWNER_FILES["PER-P1"], ID_PATTERNS["PER-P1"], "PER-P1", 1, errors
    )
    check_numbered_namespace(
        OWNER_FILES["JRN-P1"], ID_PATTERNS["JRN-P1"], "JRN-P1", 1, errors
    )
    check_numbered_namespace(
        OWNER_FILES["MET-P1"], ID_PATTERNS["MET-P1"], "MET-P1", 1, errors
    )

    for namespace in (
        "OUT-P1",
        "ARCH-P1",
        "DOM-P1",
        "DATA-P1",
        "WSP-P1",
        "NFR-P1",
        "ADR-ARCH",
        "DIT-TAX-P1",
        "DIT-ING-P1",
        "DIT-EXT-P1",
        "DIT-FCT-P1",
        "DIT-GPH-P1",
        "DIT-MON-P1",
        "DIT-IMP-P1",
        "DIT-SRC-P1",
        "DIT-HLT-P1",
        "DIT-VER-P1",
        "AI-CAP-P1",
        "AI-RAG-P1",
        "AI-OUT-P1",
        "AI-TOOL-P1",
        "AI-GRD-P1",
        "AI-EVAL-P1",
        "SEC-P1",
        "AUTH-P1",
        "PRIV-P1",
        "AUD-P1",
        "THR-P1",
        "UX-IA-P1",
        "UX-FLOW-P1",
        "UX-SCR-P1",
        "UX-DS-P1",
        "A11Y-P1",
        "ENG-STACK-P1",
        "ENG-REP-P1",
        "ENG-CODE-P1",
        "ENG-ERR-P1",
        "ENG-DEV-P1",
        "ENG-TST-P1",
        "OPS-ENV-P1",
        "OPS-CICD-P1",
        "OPS-IAC-P1",
        "OPS-SEC-P1",
        "OPS-DEP-P1",
        "OPS-DR-P1",
        "OPS-OBS-P1",
        "EPIC-P1",
        "STORY-P1",
        "TEST-UNIT-P1",
        "TEST-CON-P1",
        "TEST-AI-P1",
        "TEST-SEC-P1",
        "TEST-E2E-P1",
        "TEST-PERF-P1",
        "TEST-DR-P1",
    ):
        check_numbered_namespace(
            OWNER_FILES[namespace],
            ID_PATTERNS[namespace],
            namespace,
            1,
            errors,
        )


def check_acceptance_id_duplicates(files: list[Path], errors: list[str]) -> None:
    definition = re.compile(r"^`(AC-(?:UC-)?P1-[A-Z0-9-]+)`\s+—", re.MULTILINE)
    found: list[tuple[str, str]] = []
    for path in files:
        for value in definition.findall(read(path)):
            found.append((value, str(path.relative_to(ROOT))))
    counts = Counter(value for value, _ in found)
    for value, count in sorted(counts.items()):
        if count > 1:
            locations = sorted(path for item, path in found if item == value)
            errors.append(
                f"duplicate acceptance definition {value}: {', '.join(locations)}"
            )


def check_preserved_files(errors: list[str]) -> None:
    manifest = ROOT / "docs/00-context/preserved-files.sha256"
    if not manifest.is_file():
        errors.append("missing preserved-file checksum manifest")
        return
    for number, raw in enumerate(read(manifest).splitlines(), start=1):
        if not raw.strip():
            continue
        match = CHECKSUM_LINE.match(raw)
        if not match:
            errors.append(f"invalid checksum manifest line {number}: {raw}")
            continue
        expected, relative = match.groups()
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"preserved file is missing: {relative}")
            continue
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            errors.append(
                f"preserved file changed: {relative} (expected {expected}, got {actual})"
            )


def main() -> int:
    errors: list[str] = []
    files = markdown_files()
    check_required_files(errors)
    check_document_ids(files, errors)
    check_local_links(files, errors)
    check_known_ids(files, errors)
    check_product_baseline(errors)
    check_acceptance_id_duplicates(files, errors)
    check_preserved_files(errors)

    if errors:
        print("Specification validation FAILED:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "Specification validation passed: "
        f"{len(files)} Markdown files; local links, owned IDs, product coverage, "
        "acceptance IDs, and preserved-file checks are consistent."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
