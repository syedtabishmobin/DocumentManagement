# Competitive and Gap Analysis

| Field | Value |
|---|---|
| Document ID | `PROD-COMP-001` |
| Status | Baseline research complete; refresh before major scope freeze |
| Research date | 26 August 2026 |
| Product phase | Phase 1, with Phase 2 implications |
| Evidence standard | Current official vendor product, help, security, developer, and pricing material |

## 1. Executive conclusion

The market has moved beyond the assumptions in the original handover. Secure vaults, OCR, AI extraction, document question-answering, reminders, missing-document prompts, relationship graphs, cited answers, and human review are already offered by direct or adjacent competitors. Several enterprise platforms now explicitly market knowledge or context graphs.

The product must therefore **not** lead with “AI-native document management,” “knowledge graph,” “missing documents,” or “proactive reminders” as if those phrases alone were unique.

The strongest defensible position is the complete, inspectable lifecycle:

> A living, evidence-backed document intelligence system that reconciles facts, watches authoritative change, explains every downstream impact, and acts only with approval.

The differentiated product promise is:

`Evidence occurrence → canonical fact/rule resolution → change detection → applicability → dependency impact → recommendation → approval → action/evidence → closure and audit`

No product reviewed publicly demonstrates that complete combination across personal and family documents. This is a white-space signal, not proof that no product or private implementation offers it.

## 2. Research method and limitations

This analysis covers representative products across:

1. Consumer and family document/life-administration platforms.
2. Enterprise document, content, legal, and records-management platforms.
3. Contract intelligence, compliance, regulatory change, AI document processing, and renewal tools.

“Verified” means a capability is described in current official material. It is not an independent benchmark or assurance that the capability performs as marketed. A gap means the reviewed official material did not establish the capability; it does not prove that a vendor cannot provide it through configuration, services, private preview, or custom development.

## 3. Direct consumer and family landscape

| Product | Verified strengths | Scoped gap relative to the proposed product | Product implication |
|---|---|---|---|
| [Trustworthy](https://www.trustworthy.com/) | Closest direct competitor. Household Knowledge Graph, AI extraction and summaries, automatic organisation and connections, reminders, household document chat, missing-document questions, Gmail ingestion, granular access, expiring links, offline records, and review of AI suggestions. | Reviewed material does not establish effective-dated canonical fact resolution, authoritative-source snapshots and rules, semantic supersession, deterministic impact propagation, or approval-to-action closure. Its documented export excludes typed fields, notes, and reminders. | Treat graph, AI filing, chat, missing-document prompts, reminders, and human review as parity. Make complete machine-readable portability a requirement. |
| [Quicken LifeHub](https://www.quicken.com/products/lifehub) | Guided household categories, document scanning and extraction, financial/account/property synchronisation, reminders, household roles, after-death access, takeover, and comprehensive export. | US-oriented; no reviewed evidence of cross-domain causal impact, authoritative-rule monitoring, contradiction analysis, or semantic versioning. | Add guided readiness, emergency succession, and high-quality complete export. Do not make the experience feel like an enterprise DMS. |
| [Everplans](https://www.everplans.com/what-is-everplans) | Guided life and legacy planning, encrypted archive, checklists, financial import, and item-level share-now/share-after-death controls. | Stronger at preparedness and legacy than continuous document correctness; no reviewed evidence of advanced extraction, dependencies, or external monitoring. | Add life-event guidance and time-aware access without narrowing the product to estate planning. |
| [GoodTrust](https://mygoodtrust.com/digital-vault) | Estate documents, digital vault, trusted contacts, after-death release, and digital-executor workflows. | US estate-first positioning; no reviewed evidence of broad dependency, monitoring, or contradiction capabilities. | Include digital continuity and emergency-access requirements, but isolate legal templates by jurisdiction. |
| [HomeZada](https://www.homezada.com/) | Strong property dossier: inventory, receipts, warranties, maintenance, insurance evidence, expenses, reminders, OCR/search, reports, and buyer transfer. | Property-specific rather than household-wide document intelligence. | Provide resource-centric dossiers for property, vehicle, person, policy, and provider instead of exposing an abstract graph. |
| [AveryQ](https://www.averyq.com/) | Privacy-focused family vault, structured categories, AI autofill, expiry reminders, revocable sharing, and audit claims. | Emerging product with region/storage constraints; claims require validation. No reviewed evidence of impact propagation or source monitoring. | Make privacy architecture and recovery trade-offs explicit and independently verifiable. |
| [1Password Families](https://support.1password.com/files/) | Highly trusted encrypted vaults, shared/private vaults, secure files, related items, item history, restore, and expiring links. | Credential- and item-centric; limited document lifecycle intelligence and storage. | Security, recovery, sharing, and history expectations are set by mature vault products even when they are not full competitors. |
| [OneDrive Personal Vault](https://support.microsoft.com/en-US/onedrive/protect-your-onedrive-files-in-personal-vault) | Mainstream protected storage, extra identity verification, auto-lock, mobile scanning, and large family storage through Microsoft 365. | Vault items have search, editing, and sharing constraints; no household semantics or lifecycle intelligence. | Storage alone is a commodity. The product must demonstrate meaning, impact, and action while retaining vault-grade protection. |

### 3.1 Consumer parity requirements

The following are mandatory parity capabilities, not primary differentiators:

- Secure personal and family vault with clear privacy boundaries.
- Mobile scan, drag-and-drop, private inbound email, and cloud/email connectors.
- OCR, classification, structured extraction, summaries, and suggested filing.
- Permission-aware document Q&A with exact evidence citations.
- People, property, vehicle, account, provider, policy, and document pages.
- Expiry, renewal, and review reminders with snooze and escalation.
- Contextual missing-document prompts with dismiss and not-applicable controls.
- Granular family/adviser access, temporary links, emergency/after-death continuity, and access logs.
- Human review of AI suggestions.
- Complete export of originals, versions, extracted data, facts, relationships, tasks, reminders, and audit history.

## 4. Enterprise document and content landscape

| Platform | Verified strengths | Scoped gap relative to the proposed product | Phase 1/2 implication |
|---|---|---|---|
| [Microsoft SharePoint document processing](https://learn.microsoft.com/en-us/microsoft-365/documentprocessing/syntex-overview?view=o365-worldwide) and [Purview Records Management](https://learn.microsoft.com/en-us/purview/records-management) | Versioned libraries, content types, OCR/extraction/taxonomy, processing rules, retention, records, events, disposition, and broad identity/compliance integration. | No reviewed evidence of a typed cross-resource dependency graph, effective-dated fact ledger, or authoritative external-change-to-impact chain. | Reserve records and enterprise identity abstractions; keep consumer UX lightweight. |
| [OpenText Core Content Management](https://www.opentext.com/products/core-content-management) | Business workspaces, AI search/summary/analysis/routing, process knowledge graph, integrations, retention, holds, approval, and destruction evidence. | No reviewed evidence of evidence-occurrence resolution into canonical facts or trusted-authority monitoring with downstream applicability and impact. | Support context workspaces, safe agent actions, and mature records extensions. |
| [M-Files](https://www.m-files.com/m-files-platform/) | Closest structural enterprise competitor. Enterprise Knowledge Graph; custom non-file objects; independent object histories; typed relationships to latest or specific versions; hierarchies, inherited permissions, workflows, and external database sync. | Generic objects and relationships are not equivalent to bitemporal fact occurrences, source-of-truth arbitration, contradiction handling, and change propagation. No reviewed authoritative-source monitoring chain. | Specify the fact/evidence model rigorously. “Objects plus relationships” is insufficient differentiation. |
| [Box AI](https://www.box.com/ai) and [Box Governance](https://support.box.com/hc/en-us/articles/360043694374-About-Retention-and-Retention-Policies) | Secure collaboration, metadata, cited Q&A, structured extraction, workflows, APIs, retention, disposition, and legal holds. | Extracted values remain content metadata rather than reconciled canonical facts; no reviewed external-change impact system. | Require provider-neutral extraction and permission-trimmed retrieval; reserve enterprise governance primitives. |
| [Hyland OnBase](https://www.hyland.com/en/solutions/products/onbase?lang=en) / [Alfresco Governance](https://docs.alfresco.com/governance-services/latest/) | Capture, classification, verification, workflow, cases, forms, versions, tasks, audits, retention, security, and destruction. | Case/process context is not documented as a semantic fact/source/impact graph. | Preserve case/workspace extension points and operational workflow patterns. |
| [Laserfiche](https://docs.laserfiche.com/laserfiche/en-us/content/intro-welcome-to-laserfiche.htm) | AI classification/extraction, cited chat, low-code workflow, integrations, records, holds, disposition, and announced context-aware agents. | Repository condition monitoring is not the same as authoritative external-source monitoring and applicability. | Design safe propose/approve/execute actions and repository-health monitoring. |
| [DocuWare](https://start.docuware.com/features-and-capabilities) | Accessible document processing, search, workflow, tasks, versions, checksums, audit, and field-matched document relations. | Field-match relations are not a persisted multi-hop dependency/impact graph. | Demonstrate multi-hop causal impact rather than simple related-document lookup. |
| [iManage Context Fabric](https://imanage.com/resources/resource-center/news/imanage-announces-general-availability-next-generation-platform/) | Mature legal DMS/security, cited AI answers, evidence highlighting, comparison, enrichment, and an announced legal context fabric spanning matters, documents, communications, parties, and relationships. | Full next-generation platform was announced for October 2026 GA; graph remains matter-centric. No reviewed effective-dated fact ledger or authoritative change-impact engine. | Track preview/GA claims carefully; adopt exact evidence highlighting and policy-controlled AI actions. |
| [NetDocuments Legal Context Graph](https://www.netdocuments.com/en-gb/company-news/netdocuments-unveils-context-graph-legal-platform/) | Legal context graph, semantic search, citations, tabular review, passage links, legal workflow apps, and authority/citation links. | Reimagined graph experience was announced in private preview with broader rollout later. Authority linking is not the same as monitored rule change and impact. | Make release-status evidence explicit and build a versioned source/rule/applicability chain. |
| [Egnyte Content Lifecycle](https://www.egnyte.com/products/content-lifecycle-management) | Cross-repository governance, classification, AI Q&A, stale/duplicate/ROT detection, retention, archive/delete, legal hold, and alerts. An official guide also claims regulatory-policy-change notifications. | Reviewed material does not expose source registry, snapshots, parser provenance, applicability, or fact/document impact. | Do not claim monitoring itself is unique; differentiate through transparent provenance, applicability, and downstream closure. |
| [Dropbox Dash](https://dash.dropbox.com/features/universal-search) and [Data Governance](https://help.dropbox.com/plans/data-governance) | Low-friction sync/share, version recovery, permission-aware cross-app search/Q&A, retention, version history, and legal holds. | Collaboration/search/governance rather than semantic lifecycle intelligence. | Match connector usability and permission preservation; compete on meaning and action, not storage. |

### 4.1 Enterprise parity and extension requirements

Phase 1 architecture must not preclude:

- Organisation, business unit, client, matter, project, case, vendor, contract, policy, control, and evidence objects.
- Information barriers, sensitivity labels, DLP, residency policies, and customer-managed keys.
- Records classification, record declaration, file plans, event-based retention, legal holds, custodians, disposition review, and destruction certificates.
- Cross-repository search/governance that preserves source identity, permissions, versions, deletion, and consent revocation.
- Edge- and field-level authorization for graph traversal and retrieval.

These extension points do not require Phase 1 consumer screens or administration for enterprise records management.

## 5. Adjacent capability landscape

| Product/category | Verified strengths | Relevant gap | Capability to adopt |
|---|---|---|---|
| [Icertis Vera Obligations](https://www.icertis.com/products/operate/vera-obligations/) | Obligation discovery/classification, owners, alerts, workflows, fulfilment evidence, audit, and KPIs. | Contract/enterprise-specific; no reviewed household or broad authority-monitoring model. | First-class `Obligation → Owner → Trigger → Fulfilment → Evidence → Status` lifecycle. |
| [Sirion](https://www.sirion.ai/platform/manage/) | Clause-to-obligation traceability, promised-versus-observed validation, amendment conformance, and contextual renewal alerts. | No reviewed cross-domain household fact graph or general trusted-source registry. | Conformed effective-document view and amendment-aware obligation inheritance. |
| [Ironclad AI](https://ironcladapp.com/product/ironclad-ai) | Permission-aware repository Q&A, contextual workflow agents, reminders, routing, approvals, audit, model controls, evaluation, and human review. | Contract-focused; no reviewed durable canonical facts across domains. | Auditable agent actions, explicit approval/override, and evaluation gates. |
| [Vanta](https://www.vanta.com/products/grc) | Requirement/control/test/evidence mappings, policy workflow, approvals, acceptance, evaluation logic, evidence history, and auditor exports. | Organisational security/compliance scope. | First-class `Requirement → Control → Test → Evidence` links and explainable pass/fail logic. |
| [OneTrust AI Policy Management](https://www.onetrust.com/solutions/ai-governance/ai-policy-management/) | Versioned policy objects, applicability, controls, exceptions, links to systems/use cases/jurisdictions/regulations, and material-change revalidation. | Enterprise governance rather than personal documents. | Model actionable rules as versioned objects with applicability, alternatives, exceptions, expiry, and revalidation. |
| [CUBE RegPlatform](https://cube.global/solutions/cube-regplatform/reginsight) | Continuous regulatory capture, ontology/classification, jurisdiction/issuer relevance, mapping, alerts, and workflow. | Financial-services orientation rather than consumer authority monitoring. | Trusted Source Registry with authority tier, jurisdiction, parser version, coverage, health, and downstream mappings. |
| [Compliance.ai](https://www.compliance.ai/solution/regulatory-impact-analysis/) | Regulatory source coverage, extracted obligations, confidence/review, source-to-control/evidence lineage, version/jurisdiction comparison, applicability review, and APIs. | Formal enterprise regulatory-change scope. | Sentence-level provenance, source diffs, calibrated confidence, applicability before publication, and complete audit lineage. |
| [Google Cloud Document AI](https://docs.cloud.google.com/document-ai/docs/overview) | OCR, split/classify/extract processors, layout-aware schemas, field confidence, anchors, training, and evaluation. | Infrastructure, not a lifecycle product. | Provider-neutral processors, per-field confidence and anchors, evaluation datasets, and review thresholds. |
| [Adobe Acrobat AI Assistant](https://helpx.adobe.com/ca/acrobat/desktop/use-acrobat-ai/generative-ai-features/ai-get-answers.html) | Multi-document Q&A, citations, passage navigation/highlighting, and saved chat citations. | Chat/collection-centric rather than a durable fact/obligation system. | Citation-first UX; never promote chat output to canonical state without a governed resolution event. |
| [Expiration Reminder](https://www.expirationreminder.com/features) | Mature type/item schedules, escalation, acknowledgement, attachments, signatures, APIs, reports, AI date scan, and selected source-synchronised dates. | Primarily item/date tracking, not semantic impact. | Inheritable reminder rules and closed renewal workflows with evidence. |
| [TrustLayer](https://www.trustlayer.io/pages/insurance-compliance-verification) | Contextual expected-document profiles, alternatives, exclusions, requests, reminders, requirement-level checks, and human override. | Narrow insurance/vendor compliance domain. | First-class expected-document requirements, accepted alternatives, waivers, expiry, validation, and review. |

## 6. Revised product strategy

### 6.1 Table stakes

- Encrypted storage, versions, permissions, audit, OCR/extraction, metadata, search, workflow, reminders, and export.
- Permission-aware AI answers with page/passage citations.
- Structured extraction with confidence and validation queues.
- Resource/entity pages and relationship views.
- Missing-document suggestions and document-health dashboards.
- Safe, human-reviewed AI suggestions.

### 6.2 Defensible differentiators

1. **Evidence and causality, not a generic graph.** Facts and rules are independent, versioned resolutions over immutable occurrences and snapshots.
2. **Bitemporal canonical truth.** Preserve both valid/effective time and platform-recorded/transaction time, with provenance, confidence, disputes, and supersession.
3. **Authoritative change control plane.** Maintain governed sources, immutable snapshots, parser/rule versions, source health, coverage, jurisdiction, and reliability.
4. **Applicability before impact.** Determine whether a changed rule applies to a subject, jurisdiction, document type, and effective period before recommending action.
5. **Change-once, impact-everywhere.** Propagate a fact, document, event, or rule change across dependencies and classify each outcome as automatic, user action, external notification, review, or no action.
6. **Systematic completeness.** Infer expected evidence from household context and jurisdiction, explain why it is expected, and support alternatives, waivers, not-applicable, dismiss, and remind-later outcomes.
7. **Contradiction and staleness reasoning.** Explain conflicting evidence, authority, recency, resolution state, and downstream risk.
8. **Approval-to-action closure.** Prepare a draft, checklist, form pack, or connector action; obtain approval; capture replacement evidence; and close with audit.
9. **Permission-aware impact.** Reveal that an impact exists without leaking restricted evidence or another family member’s data.
10. **Complete portability.** Export originals plus structured data, facts, relationships, versions, rules, tasks, reminders, and audit history in documented formats.

### 6.3 Recommended positioning

Avoid:

> An AI-native DMS powered by a knowledge graph.

Prefer:

> A living, evidence-backed document intelligence system that reconciles facts, watches authoritative change, explains every downstream impact, and acts only with approval.

Short consumer expression:

> When something changes, know every document and action it affects—and why.

## 7. Specification changes required by the research

The Phase 1 specification shall add or strengthen:

| Change ID | Required change | Affected specifications |
|---|---|---|
| `GAP-001` | Add `ExpectedDocument`, `RequirementProfile`, `Alternative`, `Exception/Waiver`, `Fulfilment`, and `Evidence` entities. | Domain model, data model, missing-document logic, API, UX |
| `GAP-002` | Make fact and rule resolution bitemporal; preserve immutable occurrences/snapshots and resolution decisions. | Facts/entities, trusted sources, domain/data model, audit |
| `GAP-003` | Add field- and passage-level provenance: document version, page, coordinates/span, extractor/model version, confidence, and review state. | Ingestion, extraction contracts, RAG, audit, AI evals |
| `GAP-004` | Separate file received, field extracted, fact accepted, requirement satisfied, action approved, and evidence verified states. | Workflows, status reference data, APIs, UX |
| `GAP-005` | Add conformed effective-document views and amendment/supersession-aware obligation inheritance. | Versioning, obligations, dependency graph, impact |
| `GAP-006` | Give monitoring connectors coverage manifests, freshness, retrieval health, parser version, last success/error, and stale-state behavior. | Trusted sources, monitoring, observability, APIs |
| `GAP-007` | Add time-aware access, emergency succession, curated offline/export packs, and recovery policy. | Family/access model, security, UX, API |
| `GAP-008` | Add content-health/readiness scoring that is explainable and not a legal-compliance score. | PRD, health intelligence, UX, AI guardrails |
| `GAP-009` | Add policy/evaluation gates for agentic actions and bulk operations. | AI architecture, guardrails, authorization, audit, testing |
| `GAP-010` | Reserve records, legal-hold, information-barrier, DLP, and residency abstractions for Phase 2. | Domain/data model, security, architecture |

## 8. Acceptance test for differentiated value

The product strategy is only credible if the following scenario can be demonstrated end to end:

> “I changed one household fact. Show exactly which documents, obligations, providers, and people are affected; why each is affected; what authoritative rule or evidence applies; what action is required; who can see it; whether approval is needed; and whether replacement evidence has arrived.”

Minimum assertions:

1. Every affected item identifies a typed dependency path.
2. Every consequential claim cites a document occurrence or immutable external-source snapshot.
3. Applicability, severity, and confidence are separate values.
4. Restricted evidence is not leaked through the graph or generated answer.
5. The user can approve, reject, edit, dismiss, mark not applicable, or defer the recommendation.
6. An approved action creates or invokes an auditable workflow.
7. Closure requires appropriate replacement or fulfilment evidence.
8. All decisions, models, tools, sources, and state transitions are recorded.

## 9. Risks and anti-patterns

- Do not auto-renew a document merely because a configured interval elapsed; require authoritative refresh, replacement evidence, or explicit acknowledgement.
- Do not hide source-monitor failure. Surface stale data, parser breakage, retry history, and coverage gaps.
- Do not treat OCR extraction as proof that a requirement is satisfied.
- Do not use generated chat as the system of record for facts or obligations.
- Do not allow consequential AI actions without inspectable evidence, policy checks, approval, reversibility, and audit.
- Do not promise that monitoring can “never miss” a change. Publish coverage and reliability instead.
- Do not evaluate permissions only at ingestion/indexing time; enforce current authorization at retrieval, graph traversal, and action time.
- Do not leak enterprise administration complexity into Phase 1 consumer workflows.
- Do not lock facts, taxonomies, rules, extractors, or source monitors to a single vendor.

## 10. Refresh policy

Re-run focused competitive research:

- before the Phase 1 scope is frozen;
- before beta positioning and pricing are approved;
- when Trustworthy, Quicken LifeHub, M-Files, iManage, NetDocuments, Egnyte, Microsoft, or another named watch-list product makes a material graph, monitoring, agent, or family-access release;
- at least every six months while the product remains pre-launch.

Research must retain page title, URL, access date, claim, and whether the claim is verified, vendor-marketed, preview, planned, or inferred.
