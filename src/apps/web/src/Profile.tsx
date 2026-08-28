import { useMemo, useState } from "react";
import type { DashboardSnapshot } from "@document-management/contracts";
import { ChevronRight, FileText, FolderKanban, Link2, Network, Sparkles, UserRound, Users } from "lucide-react";
import { DocumentDossier } from "./DocumentDossier.js";

export function ProfileView({ data, refresh }: { data: DashboardSnapshot; refresh: () => Promise<void> }) {
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? "");
  const [documentId, setDocumentId] = useState<string>();
  const subject = data.subjects.find((item) => item.id === subjectId) ?? data.subjects[0];
  const documents = useMemo(() => data.documents.filter((document) => document.status !== "DELETED" && document.status !== "POLICY_HOLD" && document.subjectIds.includes(subjectId)), [data.documents, subjectId]);
  const facts = useMemo(() => data.facts.filter((fact) => fact.subjectIds.includes(subjectId)), [data.facts, subjectId]);
  const categories = [...new Set(documents.map((document) => document.category))].sort();

  return <>
    <div className="page-head"><div><span className="eyebrow">People, information and connections</span><h1>Profile & connections</h1><p>See how authorised documents build an evidence-linked profile and how people, categories and extracted details relate.</p></div><label className="profile-selector"><span>Viewing profile for</span><select value={subject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)}>{data.subjects.map((item) => <option value={item.id} key={item.id}>{item.displayName} · {item.relationship}</option>)}</select></label></div>
    {subject ? <>
      <section className="profile-identity"><span className="profile-avatar"><UserRound /></span><div><span className="eyebrow">{subject.kind.toLowerCase()}</span><h2>{subject.displayName}</h2><p>{subject.relationship}{subject.dateOfBirth ? ` · Date of birth recorded ${formatDate(subject.dateOfBirth)}` : ""}</p></div><div className="profile-metrics"><span><strong>{documents.length}</strong><small>Visible documents</small></span><span><strong>{facts.length}</strong><small>Extracted proposals</small></span><span><strong>{categories.length}</strong><small>Categories</small></span></div></section>

      <section className="profile-grid">
        <div className="profile-panel"><div className="section-title"><div><span className="eyebrow">Central profile</span><h2>Extracted information</h2><p>Evidence-linked proposals are kept separate from reviewed canonical facts.</p></div></div>{facts.length ? <div className="profile-facts">{facts.map((fact) => { const document = data.documents.find((item) => item.id === fact.documentId); return <button key={fact.id} onClick={() => setDocumentId(fact.documentId)}><span><small>{fact.name}</small><strong>{fact.value}</strong><em>{fact.reviewState === "REVIEWED" ? "Reviewed profile detail" : "Proposed · review needed"}</em></span><span><FileText />{document?.name ?? "Source document"}<ChevronRight /></span></button>; })}</div> : <div className="profile-empty"><Sparkles /><strong>No extracted profile details yet</strong><p>Add a synthetic text record containing fields such as an address, expiry date, renewal date, policy number, member number, email or employer.</p></div>}</div>
        <div className="profile-panel"><div className="section-title"><div><span className="eyebrow">Organisation</span><h2>Document categories</h2><p>A category is navigation, not classification truth or permission.</p></div></div>{categories.length ? <div className="category-profile-list">{categories.map((category) => <div key={category}><span><FolderKanban /><strong>{category}</strong></span><small>{documents.filter((document) => document.category === category).length} visible document{documents.filter((document) => document.category === category).length === 1 ? "" : "s"}</small></div>)}</div> : <div className="profile-empty"><FolderKanban /><strong>No visible categories</strong><p>Add a document linked to this person to build their organised view.</p></div>}</div>
      </section>

      <section className="connections-panel"><div className="section-title"><div><span className="eyebrow">Relationship map</span><h2>How the profile is connected</h2><p>The map shows only this profile’s authorised records. The structured list below provides the same relationships without relying on position or colour.</p></div></div>{documents.length ? <>
        <div className="connection-map" aria-hidden="true"><div className="map-person"><Users /><strong>{subject.displayName}</strong><small>Person</small></div><div className="map-column">{documents.slice(0, 4).map((document) => <button key={document.id} onClick={() => setDocumentId(document.id)}><FileText /><span><strong>{document.name}</strong><small>{document.category}</small></span></button>)}</div><div className="map-column facts">{facts.slice(0, 5).map((fact) => <div key={fact.id}><Sparkles /><span><strong>{fact.name}</strong><small>Extracted proposal</small></span></div>)}</div></div>
        <div className="relationship-table" role="list">{documents.flatMap((document) => {
          const documentFacts = facts.filter((fact) => fact.documentId === document.id);
          return [<article role="listitem" key={`${document.id}-subject`}><Link2 /><span><strong>{subject.displayName}</strong><small>person</small></span><b>has document</b><button onClick={() => setDocumentId(document.id)}><strong>{document.name}</strong><small>{document.category}</small></button></article>, ...documentFacts.map((fact) => <article role="listitem" key={fact.id}><Link2 /><span><strong>{document.name}</strong><small>document</small></span><b>provides evidence for</b><span><strong>{fact.name}</strong><small>proposed profile detail</small></span></article>)];
        })}</div>
      </> : <div className="profile-empty"><Network /><strong>No visible connections yet</strong><p>Add a document for this person to create typed document and evidence relationships.</p></div>}</section>
    </> : null}
    {documentId ? <DocumentDossier id={documentId} data={data} onClose={() => setDocumentId(undefined)} onUpdated={refresh} /> : null}
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
