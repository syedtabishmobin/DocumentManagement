import { useEffect, useState } from "react";
import type { DashboardSnapshot, DocumentDetail } from "@document-management/contracts";
import { Download, ExternalLink, FileSearch, FileText, Fingerprint, Link2, Network, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { api } from "./api.js";

export function DocumentDossier({ id, data, onClose, onUpdated }: { id: string; data: DashboardSnapshot; onClose: () => void; onUpdated?: () => Promise<void> }) {
  const [detail, setDetail] = useState<DocumentDetail>();
  const [error, setError] = useState("");
  const [artifactUrl, setArtifactUrl] = useState<string>();
  const [artifactError, setArtifactError] = useState("");
  const [section, setSection] = useState<"preview" | "details" | "connections">("preview");

  useEffect(() => {
    let disposed = false;
    let objectUrl: string | undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    setDetail(undefined); setArtifactUrl(undefined); setError(""); setArtifactError("");
    void api.documentDetail(id).then((value) => { if (!disposed) setDetail(value); }).catch((cause) => { if (!disposed) setError(cause instanceof Error ? cause.message : "Document details are unavailable"); });
    void api.documentArtifact(id).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (disposed) URL.revokeObjectURL(objectUrl);
      else setArtifactUrl(objectUrl);
    }).catch((cause) => { if (!disposed) setArtifactError(cause instanceof Error ? cause.message : "The authorised original is unavailable"); });
    return () => {
      disposed = true;
      document.removeEventListener("keydown", closeOnEscape);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, onClose]);

  return <div className="modal-backdrop dossier-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="document-dossier" role="dialog" aria-modal="true" aria-labelledby="document-dossier-title">
      <header>
        <div><span className="eyebrow">Document dossier</span><h2 id="document-dossier-title">{detail?.document.name ?? "Opening document…"}</h2>{detail ? <p>{detail.document.category} · Version {detail.document.version}</p> : null}</div>
        <button className="icon-button" aria-label="Close document" onClick={onClose}><X /></button>
      </header>
      {error ? <div className="form-error">{error}</div> : null}
      {!detail && !error ? <div className="dossier-loading">Loading the authorised version…</div> : null}
      {detail ? <>
        <div className="document-state-row" aria-label="Document states">
          <span><small>Processing</small><strong>{humanState(detail.document.status)}</strong></span>
          <span><small>Availability</small><strong>Authorised original available</strong></span>
          <span><small>Review</small><strong>{detail.facts.length ? "Extracted details proposed" : "No extracted proposals"}</strong></span>
          <span><small>Version</small><strong>Version {detail.document.version} · immutable</strong></span>
        </div>
        <nav className="dossier-tabs" aria-label="Document sections">
          <button className={section === "preview" ? "active" : ""} onClick={() => setSection("preview")}><FileSearch /> Preview</button>
          <button className={section === "details" ? "active" : ""} onClick={() => setSection("details")}><Sparkles /> Extracted details <b>{detail.facts.length}</b></button>
          <button className={section === "connections" ? "active" : ""} onClick={() => setSection("connections")}><Network /> Connections <b>{detail.dependencies.length}</b></button>
        </nav>
        {section === "preview" ? <section className="dossier-section">
          <div className="section-title"><div><span className="eyebrow">Exact authorised version</span><h3>Document preview</h3></div>{artifactUrl ? <a className="secondary button-link" href={artifactUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open original</a> : <button className="secondary" disabled><ExternalLink size={16} /> Opening securely…</button>}</div>
          <Preview detail={detail} artifactUrl={artifactUrl} artifactError={artifactError} />
          <div className="integrity-strip"><Fingerprint /><span><strong>Immutable authorised original</strong><small>SHA-256 {detail.document.sha256.slice(0, 16)}… · {formatBytes(detail.document.size)} · added {formatDate(detail.document.createdAt)}</small></span></div>
        </section> : null}
        {section === "details" ? <section className="dossier-section">
          <div className="section-title"><div><span className="eyebrow">Evidence-linked proposals</span><h3>Extracted details</h3><p>These details build the profile only as proposals. Review is required before treating them as canonical information.</p></div></div>
          {detail.facts.length ? <div className="extracted-fact-list">{detail.facts.map((fact) => <article key={fact.id}><div><span>{fact.name}</span><strong>{fact.value}</strong></div><span className="proposal-pill">{fact.reviewState === "REVIEWED" ? "Reviewed" : "Review needed"}</span><blockquote><FileText /><span><small>Evidence from this version</small>{fact.evidenceExcerpt}</span></blockquote>{fact.reviewState !== "REVIEWED" ? <button className="review-fact" onClick={async () => { const reviewed = await api.reviewFact(fact.id); setDetail({ ...detail, facts: detail.facts.map((item) => item.id === reviewed.id ? reviewed : item) }); await onUpdated?.(); }}>Accept as reviewed profile detail</button> : <div className="reviewed-fact"><ShieldCheck /> Reviewed against this source version</div>}</article>)}</div> : <div className="dossier-empty"><Sparkles /><strong>No structured details were proposed</strong><p>The original remains viewable. This bounded development extractor currently recognises a limited set of common profile fields in text records.</p></div>}
        </section> : null}
        {section === "connections" ? <section className="dossier-section">
          <div className="section-title"><div><span className="eyebrow">Typed relationships</span><h3>Where this document connects</h3><p>This list is the accessible equivalent of the relationship map. Every connection remains tied to this document.</p></div></div>
          <div className="connection-list">{detail.dependencies.map((edge) => <article key={edge.id}><Link2 /><span><strong>{edge.label}</strong><small>{connectionTarget(edge, data)}</small></span><code>{edge.kind.replaceAll("_", " → ").toLowerCase()}</code></article>)}</div>
        </section> : null}
        <footer><span><ShieldCheck /> {data.localMode ? "Stored and processed in the local development profile" : "Stored in the synthetic Azure development preview"}</span>{artifactUrl ? <a href={artifactUrl} download={detail.document.name}><Download /> Download exact original</a> : <span><Download /> Original loading</span>}</footer>
      </> : null}
    </section>
  </div>;
}

function Preview({ detail, artifactUrl, artifactError }: { detail: DocumentDetail; artifactUrl: string | undefined; artifactError: string }) {
  if (detail.preview.kind === "TEXT") return <pre className="text-preview">{detail.preview.text}</pre>;
  if (artifactError) return <div className="dossier-empty"><FileText /><strong>Authorised original unavailable</strong><p>{artifactError}</p></div>;
  if (!artifactUrl) return <div className="dossier-loading">Loading the authorised original…</div>;
  if (detail.preview.kind === "IMAGE") return <div className="media-preview"><img src={artifactUrl} alt={"Preview of " + detail.document.name} /></div>;
  if (detail.preview.kind === "PDF") return <iframe className="pdf-preview" src={artifactUrl} title={"Preview of " + detail.document.name} />;
  return <div className="dossier-empty"><FileText /><strong>Inline preview unavailable</strong><p>{detail.preview.message}</p><a className="secondary button-link" href={artifactUrl} target="_blank" rel="noreferrer">Open exact original</a></div>;
}

function connectionTarget(edge: DocumentDetail["dependencies"][number], data: DashboardSnapshot) {
  if (edge.fromType === "SUBJECT") return data.subjects.find((subject) => subject.id === edge.fromId)?.displayName ?? "Authorized person";
  if (edge.fromType === "CATEGORY") return data.documents.find((document) => document.id === edge.toId)?.category ?? "Document category";
  if (edge.toType === "FACT") return data.facts.find((fact) => fact.id === edge.toId)?.name ?? "Extracted detail";
  return "Current document";
}

function humanState(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()); }
function formatBytes(value: number) { return value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
