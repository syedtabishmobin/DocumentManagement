# Document Intelligence Specification Index

| Field | Value |
|---|---|
| Document ID | `DIT-IDX-001` |
| Status | Active navigation aid; all linked contracts remain DRAFT |
| Updated | 26 August 2026 |

## Reading order

1. [`DIT-TAX-001` — Document Taxonomy](01-document-taxonomy.md)
2. [`DIT-ING-001` — Ingestion and Processing](02-ingestion-processing.md)
3. [`DIT-EXT-001` — Extraction and Evidence](03-extraction-and-evidence.md)
4. [`DIT-FCT-001` — Facts and Entities](04-facts-and-entities.md)
5. [`DIT-GPH-001` — Dependency Graph](05-dependency-graph.md)
6. [`DIT-MON-001` — Change Monitoring](06-change-monitoring.md)
7. [`DIT-IMP-001` — Impact Analysis and Actions](07-impact-analysis-and-actions.md)
8. [`DIT-SRC-001` — Trusted Source Registry](08-trusted-source-registry.md)
9. [`DIT-HLT-001` — Document Health and Expected Evidence](09-document-health-and-expected-evidence.md)
10. [`DIT-VER-001` — Versioning and Conformed Views](10-versioning-and-conformed-views.md)

## Rule ownership

| Namespace | Owner | Coverage |
|---|---|---|
| `DIT-TAX-P1-*` | `DIT-TAX-001` | Versioned document-type and launch-profile definitions |
| `DIT-ING-P1-*` | `DIT-ING-001` | Receipt, validation, quarantine, processing, retry, replay, deletion fences, and projections |
| `DIT-EXT-P1-*` | `DIT-EXT-001` | Extraction schemas, evidence anchors, provenance, confidence, review, correction, and reprocessing |
| `DIT-FCT-P1-*` | `DIT-FCT-001` | Immutable occurrences, bitemporal resolution, conflicts, entities, and sensitive fields |
| `DIT-GPH-P1-*` | `DIT-GPH-001` | Typed nodes/edges, version/provenance, traversal, authorization, coverage, cycles, and rebuild |
| `DIT-MON-P1-*` | `DIT-MON-001` | Triggers, subscriptions, rules, scheduling, idempotency, applicability, replay, and degradation |
| `DIT-IMP-P1-*` | `DIT-IMP-001` | Impact paths, dimensions, recommendations, bound approval, action, partial failure, and closure |
| `DIT-SRC-P1-*` | `DIT-SRC-001` | Authority, coverage, snapshots, parsers, freshness, health, publication, and replay |
| `DIT-HLT-P1-*` | `DIT-HLT-001` | Requirement profiles, alternatives, waivers, dispositions, fulfilment, and health signals |
| `DIT-VER-P1-*` | `DIT-VER-001` | Artifact/document/version identity, conformed views, comparisons, lifecycle, and purge |

## Safety boundary

The pack specifies how configured intelligence behaves; it does not approve a public launch profile, a consequential Australian rule, a trusted source, a clinical-record disposition, or a readiness score. `DEC-034`–`DEC-036` remain binding decision fences. Machine-readable definitions must validate against `docs/11-reference-data/` and cannot become active merely because an example exists.
