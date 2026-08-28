import { useEffect, useState } from "react";
import type { Answer, AuthSession, DashboardSnapshot } from "@document-management/contracts";
import { Archive, Bell, Bot, CalendarClock, Check, ChevronRight, Eye, FileLock2, FileText, FolderSearch2, Home, ListChecks, Menu, Network, Plus, RotateCcw, Search, ShieldCheck, Sparkles, Trash2, Upload, Users, X } from "lucide-react";
import { api } from "./api.js";
import { AuthScreen, Onboarding, Startup } from "./Auth.js";
import { CaptureModal } from "./CaptureModal.js";
import { MarketingSite } from "./Marketing.js";
import { FamilyView } from "./Family.js";
import { ActivityView } from "./Activity.js";
import { BrandMark, BrandName } from "./Brand.js";
import { DocumentDossier } from "./DocumentDossier.js";
import { ProfileView } from "./Profile.js";

type View = "home" | "documents" | "profile" | "assistant" | "attention" | "family" | "activity" | "trash";
const nav: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "home", label: "Overview", icon: Home },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "profile", label: "Profile & connections", icon: Network },
  { id: "assistant", label: "Ask your documents", icon: Sparkles },
  { id: "attention", label: "Needs attention", icon: ListChecks },
  { id: "family", label: "Family access", icon: Users },
  { id: "activity", label: "Activity", icon: Bell },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export function App() {
  const [route, setRoute] = useState(() => `${window.location.pathname}${window.location.search}`);
  const [session, setSession] = useState<AuthSession>();
  const [data, setData] = useState<DashboardSnapshot>();
  const [view, setView] = useState<View>("home");
  const [menu, setMenu] = useState(false);
  const [capture, setCapture] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => { const dashboard = await api.dashboard(); setData(dashboard); setError(""); };
  async function loadSession() {
    try {
      const current = await api.session(); setSession(current);
      if (current.authenticated && current.onboardingComplete) await refresh();
    } catch { setError("The workspace API is not available. Try again shortly."); }
  }
  useEffect(() => {
    const updateRoute = () => setRoute(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);
  useEffect(() => { void loadSession(); }, []);

  const routeUrl = new URL(route, window.location.origin);
  if (routeUrl.pathname === "/") return <MarketingSite />;
  if (!session) return <Startup message={error || "Opening your private workspace…"} retry={() => void loadSession()} />;
  if (!session.authenticated) return <AuthScreen initialMode={routeUrl.searchParams.get("mode") === "login" ? "login" : "register"} onModeChange={(mode) => navigate(`/app?mode=${mode}`, true)} onAuthenticated={async (current) => { setSession(current); if (current.onboardingComplete) await refresh(); navigate("/app", true); }} />;
  if (!session.onboardingComplete) return <Onboarding session={session} onComplete={async () => { const current = await api.session(); setSession(current); await refresh(); navigate("/app", true); }} />;
  if (!data) return <Startup message={error || "Opening your household workspace…"} retry={() => void refresh()} />;

  const activeDocuments = data.documents.filter((document) => document.status !== "DELETED");
  const attention = activeDocuments.filter((document) => document.status === "NEEDS_REVIEW" || document.status === "POLICY_HOLD").length + data.tasks.filter((task) => task.state === "OPEN").length;

  return <div className="shell">
    <header className="topbar">
      <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMenu(true)}><Menu /></button>
      <div className="wordmark"><span className="brand-mark small"><BrandMark /></span><BrandName edition="Home" /></div>
      <div className="local-pill"><ShieldCheck size={15} /> {data.localMode ? "Local only" : "Synthetic preview"}</div>
      <button className="avatar" aria-label="Sign out" title="Sign out" onClick={async () => {
        try {
          await api.logout();
          setData(undefined);
          setSession({ authenticated: false, onboardingComplete: false });
          setView("home");
          navigate("/", true);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "We could not sign you out");
        }
      }}>{initials(session.account?.displayName)}</button>
    </header>
    {menu ? <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMenu(false)} /> : null}
    <aside className={menu ? "sidebar open" : "sidebar"}>
      <div className="mobile-menu-head"><strong>Menu</strong><button className="icon-button" onClick={() => setMenu(false)}><X /></button></div>
      <div className="workspace-switch"><span className="workspace-icon"><Home size={18} /></span><span><small>Family workspace</small><strong>{data.workspace.name}</strong></span><ChevronRight size={16} /></div>
      <nav>{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMenu(false); }}><item.icon size={19} /><span>{item.label}</span>{item.id === "attention" && attention > 0 ? <b>{attention}</b> : null}</button>)}</nav>
      <div className="privacy-card"><ShieldCheck /><strong>{data.localMode ? "Your documents stay here" : "Synthetic preview boundary"}</strong><p>{data.localMode ? "Local storage and local assistance are active. Cloud connections are off." : "Azure preview storage is active for synthetic data only. External providers and hosted AI are off."}</p></div>
    </aside>
    <main>
      {error ? <div className="error-banner">{error}<button onClick={() => setError("")}>Dismiss</button></div> : null}
      {view === "home" && <Overview data={data} onUpload={() => setCapture(true)} onNavigate={setView} />}
      {view === "documents" && <Documents data={data} onUpload={() => setCapture(true)} onDelete={async (id) => { if (!confirm("Move this document to Trash? You can restore it for 30 days.")) return; await api.deleteDocument(id); await refresh(); }} />}
      {view === "profile" && <ProfileView data={data} refresh={refresh} />}
      {view === "assistant" && <Assistant documentCount={activeDocuments.filter((document) => document.status === "READY").length} localMode={data.localMode} />}
      {view === "attention" && <Attention data={data} refresh={refresh} />}
      {view === "family" && <FamilyView data={data} refresh={refresh} />}
      {view === "activity" && <ActivityView data={data} />}
      {view === "trash" && <Trash data={data} onRestore={async (id) => { await api.restoreDocument(id); await refresh(); }} />}
    </main>
    {capture ? <CaptureModal subjects={data.subjects} onClose={() => setCapture(false)} onAdded={async () => { await refresh(); setView("documents"); }} /> : null}
  </div>;
}

function PageHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function Overview({ data, onUpload, onNavigate }: { data: DashboardSnapshot; onUpload: () => void; onNavigate: (view: View) => void }) {
  const active = data.documents.filter((document) => document.status !== "DELETED");
  const ready = active.filter((document) => document.status === "READY").length;
  const openTasks = data.tasks.filter((task) => task.state === "OPEN");
  return <>
    <PageHead eyebrow="Good morning" title="Your household, in order." copy="A private view of your documents, deadlines and the details that connect them." action={<button className="primary" onClick={onUpload}><Upload size={18} /> Add document</button>} />
    <section className="hero-grid">
      <article className="hero-card"><div className="hero-copy"><span className="eyebrow light">Household readiness</span><h2>{active.length === 0 ? "Start with one important document" : `${ready} document${ready === 1 ? "" : "s"} ready`}</h2><p>{active.length === 0 ? "Upload a synthetic text document to see classification, search and cited answers in action." : "Readiness is shown as explainable items—never as a legal or risk score."}</p><button onClick={() => onNavigate(active.length ? "documents" : "home")}>{active.length ? "Review documents" : "Learn what to add"}<ChevronRight size={16} /></button></div><div className="orb"><FileLock2 size={40} /></div></article>
      <article className="attention-card"><span className="eyebrow">Next up</span>{openTasks.length ? <><h3>{openTasks[0]!.title}</h3><p>{openTasks.length} open task{openTasks.length === 1 ? "" : "s"} in your household.</p><button className="text-button" onClick={() => onNavigate("attention")}>See all tasks <ChevronRight size={15} /></button></> : <><h3>Nothing urgent</h3><p>Your current task list is clear.</p></>}</article>
    </section>
    <section><div className="section-title"><div><span className="eyebrow">At a glance</span><h2>What your documents know</h2></div></div><div className="stat-grid">
      <Stat icon={FileText} value={active.length} label="Documents" detail={`${ready} ready to search`} />
      <Stat icon={FolderSearch2} value={data.facts.length} label="Extracted details" detail="Proposed for review" />
      <Stat icon={CalendarClock} value={openTasks.length} label="Open actions" detail="Nothing happens silently" />
      <Stat icon={Users} value={data.subjects.length} label="People" detail="Documents stay person-linked" />
    </div></section>
    <section className="split-section"><div><div className="section-title"><div><span className="eyebrow">Recently added</span><h2>Your documents</h2></div><button className="text-button" onClick={() => onNavigate("documents")}>View all</button></div>{active.length ? <div className="mini-list">{active.slice(0, 4).map((document) => <div key={document.id}><span className="file-icon"><FileText /></span><span><strong>{document.name}</strong><small>{document.category} · {document.status.replaceAll("_", " ").toLowerCase()}</small></span><ChevronRight /></div>)}</div> : <Empty icon={Archive} title="Your vault is empty" copy="Add a synthetic document to begin." action={<button className="secondary" onClick={onUpload}><Plus size={17} /> Add document</button>} />}</div><div className="ask-card"><Bot size={24} /><span className="eyebrow light">Private document assistant</span><h2>Ask with evidence.</h2><p>{data.localMode ? "Answers are created locally and cite the document passages used." : "This synthetic preview uses deterministic cited retrieval."} No hosted model is connected.</p><button onClick={() => onNavigate("assistant")}>Ask your documents <ChevronRight size={16} /></button></div></section>
  </>;
}

function Stat({ icon: Icon, value, label, detail }: { icon: typeof Home; value: number; label: string; detail: string }) { return <article className="stat"><Icon /><span><strong>{value}</strong><b>{label}</b><small>{detail}</small></span></article>; }

function Documents({ data, onUpload, onDelete }: { data: DashboardSnapshot; onUpload: () => void; onDelete: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedDocument, setSelectedDocument] = useState<string>();
  const active = data.documents.filter((document) => document.status !== "DELETED");
  const categories = [...new Set(active.map((document) => document.category))].sort();
  const docs = active.filter((document) => (category === "ALL" || document.category === category) && `${document.name} ${document.category}`.toLowerCase().includes(query.toLowerCase()));
  const groups = categories.filter((item) => category === "ALL" || item === category).map((item) => ({ category: item, documents: docs.filter((document) => document.category === item) })).filter((group) => group.documents.length);
  return <><PageHead eyebrow="Secure, organised library" title="Documents" copy="Browse immutable originals by category, person and document. Open a dossier to preview the exact authorised version, extracted proposals and typed connections." action={<button className="primary" onClick={onUpload}><Upload size={18} /> Add document</button>} />
    <div className="library-toolbar"><label className="library-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names and categories" /></label><label className="category-select"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">All categories</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><span>{docs.length} visible item{docs.length === 1 ? "" : "s"}</span></div>
    {docs.length ? <div className="document-library"><aside className="category-tree"><span className="eyebrow">Library hierarchy</span><button className={category === "ALL" ? "active" : ""} onClick={() => setCategory("ALL")}><FolderSearch2 /><span><strong>All documents</strong><small>{active.length} visible</small></span></button>{categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}><FolderSearch2 /><span><strong>{item}</strong><small>{active.filter((document) => document.category === item).length} document{active.filter((document) => document.category === item).length === 1 ? "" : "s"}</small></span></button>)}</aside><div className="category-groups">{groups.map((group) => <section key={group.category}><header><div><span className="eyebrow">Category</span><h2>{group.category}</h2></div><span>{group.documents.length} visible</span></header><div className="document-grid">{group.documents.map((document) => <DocumentCard key={document.id} document={document} data={data} onOpen={() => setSelectedDocument(document.id)} onDelete={onDelete} />)}</div></section>)}</div></div> : <Empty icon={FileText} title="No matching documents" copy="Add a synthetic document or change your search and category filters." action={<button className="secondary" onClick={onUpload}><Upload size={17} /> Add document</button>} />}
    {selectedDocument ? <DocumentDossier id={selectedDocument} data={data} onClose={() => setSelectedDocument(undefined)} /> : null}
  </>;
}

function DocumentCard({ document, data, onOpen, onDelete }: { document: DashboardSnapshot["documents"][number]; data: DashboardSnapshot; onOpen: () => void; onDelete: (id: string) => Promise<void> }) {
  const people = document.subjectIds.map((id) => data.subjects.find((subject) => subject.id === id)?.displayName).filter(Boolean);
  const restricted = document.status === "POLICY_HOLD";
  return <article className="document-card"><div className="doc-top"><span className="file-icon large"><FileText /></span><span className={`status ${document.status.toLowerCase()}`}>{document.status.replaceAll("_", " ")}</span></div><h3>{document.name}</h3><p>{document.category}</p><div className="document-people"><Users size={14} /> {restricted ? "Ordinary relationships unavailable" : people.join(", ") || "Unassigned"}<span>{document.captureRoute.toLowerCase()}</span></div><dl><div><dt>Version</dt><dd>{document.version}</dd></div><div><dt>Size</dt><dd>{formatBytes(document.size)}</dd></div><div><dt>Added</dt><dd>{formatDate(document.createdAt)}</dd></div></dl>{document.reviewReason ? <div className="review-note">{document.reviewReason}</div> : null}<div className="card-actions"><button className="view-document" disabled={restricted} onClick={onOpen}><Eye /> {restricted ? "Preview unavailable" : "View document"}</button><button className="danger-icon" aria-label={`Delete ${document.name}`} onClick={() => void onDelete(document.id)}><Trash2 size={17} /></button></div></article>;
}

function Assistant({ documentCount, localMode }: { documentCount: number; localMode: boolean }) {
  const [question, setQuestion] = useState(""); const [answer, setAnswer] = useState<Answer>(); const [busy, setBusy] = useState(false);
  async function ask() { if (question.trim().length < 3) return; setBusy(true); try { setAnswer(await api.ask(question)); } finally { setBusy(false); } }
  return <><PageHead eyebrow="Evidence-aware retrieval" title="Ask your documents" copy={localMode ? "Search evidence stored on this machine. Answers never silently leave local mode." : "Search evidence in this synthetic workspace. No hosted model or external fallback is connected."} /><div className="assistant-layout"><section className="conversation"><div className="assistant-intro"><span className="spark"><Sparkles /></span><h2>What would you like to know?</h2><p>{documentCount ? `${documentCount} indexed document${documentCount === 1 ? " is" : "s are"} available.` : "Add a text document before asking a question."}</p><div className="suggestions">{["Which documents mention an expiry date?", "What insurance details are available?", "Which documents mention my address?"].map((item) => <button key={item} onClick={() => setQuestion(item)}>{item}</button>)}</div></div>{answer ? <div className="answer"><div className="answer-label"><Bot size={18} /> Cited answer <span>{answer.confidence} confidence</span></div><p>{answer.answer}</p>{answer.citations.length ? <div className="citations"><strong>Evidence</strong>{answer.citations.map((citation, index) => <blockquote key={`${citation.documentId}-${index}`}><b>{citation.documentName}</b><p>{citation.excerpt}</p></blockquote>)}</div> : null}</div> : null}<div className="composer"><textarea aria-label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about your documents…" /><button onClick={() => void ask()} disabled={busy || documentCount === 0}>{busy ? "Searching…" : "Ask"}<Sparkles size={17} /></button><small><ShieldCheck size={13} /> Deterministic cited retrieval · no hosted-model fallback</small></div></section><aside className="evidence-panel"><span className="eyebrow">Trust by design</span><h3>Every answer needs evidence.</h3><ul><li><Check /> Searches only documents you can access</li><li><Check /> Excludes quarantined material</li><li><Check /> Shows when evidence is insufficient</li><li><Check /> Cites the exact source passage</li></ul></aside></div></>;
}

function Attention({ data, refresh }: { data: DashboardSnapshot; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState(""); const tasks = data.tasks;
  return <><PageHead eyebrow="Monitor and close" title="Needs attention" copy="Explainable findings and human-approved actions—without a misleading aggregate score." /><div className="task-create"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a household task" /><button className="primary" onClick={async () => { if (!title.trim()) return; await api.addTask(title); setTitle(""); await refresh(); }}><Plus size={17} /> Add task</button></div><div className="task-list">{tasks.map((task) => <article key={task.id} className={task.state === "DONE" ? "done" : ""}><button aria-label="Complete task" disabled={task.state === "DONE"} onClick={async () => { await api.completeTask(task.id); await refresh(); }}>{task.state === "DONE" ? <Check /> : null}</button><span><strong>{task.title}</strong><small>{task.severity.toLowerCase()} · {task.dueAt ? formatDate(task.dueAt) : "No due date"}</small></span></article>)}</div></>;
}

function Trash({ data, onRestore }: { data: DashboardSnapshot; onRestore: (id: string) => Promise<void> }) {
  const documents = data.documents.filter((document) => document.status === "DELETED").sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
  return <><PageHead eyebrow="30-day recovery" title="Trash" copy="Deleted documents are inaccessible everywhere else. Restore them before the displayed deadline; after that, final purge removes the original and derived data." />
    {documents.length ? <div className="document-grid trash-grid">{documents.map((document) => <article className="document-card trash-card" key={document.id}><div className="doc-top"><span className="file-icon large"><Trash2 /></span><span className="status deleted">TRASHED</span></div><h3>{document.name}</h3><p>{document.category}</p><dl><div><dt>Deleted</dt><dd>{document.deletedAt ? formatDateTime(document.deletedAt) : "Recorded"}</dd></div><div><dt>Final purge</dt><dd>{document.purgeDueAt ? formatDateTime(document.purgeDueAt) : "Pending"}</dd></div></dl><div className="review-note">The original, preview, search, facts, answers and connections are fenced while this item is in Trash.</div><button className="view-document" onClick={() => void onRestore(document.id)}><RotateCcw size={17} /> Restore document</button></article>)}</div> : <Empty icon={Trash2} title="Trash is empty" copy="Documents you delete will be recoverable here for 30 days." />}
  </>;
}

function Empty({ icon: Icon, title, copy, action }: { icon: typeof Home; title: string; copy: string; action?: React.ReactNode }) { return <div className="empty"><Icon /><h3>{title}</h3><p>{copy}</p>{action}</div>; }
function formatBytes(value: number) { return value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value)); }
function initials(value?: string) { return value?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ME"; }
function navigate(href: string, replace = false) {
  window.history[replace ? "replaceState" : "pushState"]({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
