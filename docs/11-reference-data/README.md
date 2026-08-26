# Phase 1 Reference Data

Status: **DRAFT — non-production, provider-neutral, and not launch-enabling**

This directory is the initial machine-readable reference-data seed for the Phase 1 specification. It translates the product, architecture, document-intelligence, AI, security, privacy, audit, and logical-data-model contracts into versioned JSON Schemas and referentially checked JSON catalogues.

The seed is deliberately inert. It does not approve launch coverage, legal authority, a clinical-content disposition, a production role matrix, severity thresholds, operational durations, external delivery channels, processors, or real source endpoints. `DEC-035`, `DEC-036`, and `DEC-037` remain open. Every runtime-affecting seed record is DRAFT and disabled. The Australia entries establish identifiers and synthetic test relationships only; they are not a claim of Australian launch or authority coverage.

## Layout

- `schemas/` contains JSON Schema Draft 2020-12 documents. Every schema declares `x-schema-version` and uses the validator-supported core subset.
- `data/` contains one versioned catalogue for each governed concern.
- `data/common.json` defines shared owners, metadata profiles, identifier conventions, effective-period semantics, privacy classes, and approved-purpose identifiers used by the other catalogues.

Each top-level governed record has a stable `id`, immutable record `version`, `meta_ref`, decision and contract trace, and an additive `retirement` object. The referenced metadata profile supplies schema/data version, effective period, owner, review state, and activation state. State and transition IDs are subordinate members of their immutable state-machine record version and change or retire only through a new machine version. Retirement never reuses or mutates an ID: a retired record names its replacement where one exists, and consumers must continue to resolve retained historical versions.

## Safety fences

- All launch profiles, document types, extraction schemas, monitoring rules, trusted sources, source coverage, roles, severities, AI capabilities, dependency types, requirement profiles, and notification channels/templates are disabled.
- The clinical example is classification-only, marked `CLINICAL_EXCLUDED`, held at `POLICY_HOLD`, and has no extraction, source, monitoring, or notification route.
- Source examples are synthetic, non-production, disabled, and use only `.invalid` hosts. They do not represent a real authority or current coverage.
- No cadence, freshness duration, retry duration, time-to-live, approval lifetime, deletion duration, or delivery objective is supplied.
- Requirement-profile examples are synthetic evaluation fixtures. They do not state that any document is legally required, sufficient, or compliant.
- Severity labels have no numeric rank, threshold, deadline, action, or aggregation weight. `DEC-034` continues to prohibit an aggregate readiness/content-health/compliance/risk score.

## Validation

From the repository root run:

```sh
python3 scripts/validate-reference-data.py
```

The standard-library validator parses every JSON file without accepting duplicate keys; validates data against the local schema subset; resolves local schema references; enforces globally unique stable IDs and internal/external references; verifies record metadata and retirement rules; checks typed status/action/source/document/dependency references; and applies the open-decision safety fences described above.

This pack is a specification input, not deployable runtime configuration. Publication or activation requires the normal configuration review, approval, evaluation, effective-dating, audit, and decision-resolution workflow defined by the repository contracts.
