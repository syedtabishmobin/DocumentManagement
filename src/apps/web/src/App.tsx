import { useEffect, useState } from "react";
import type { Answer, AuthSession, DashboardSnapshot, SubjectRecord, WorkspaceRole } from "@document-management/contracts";
import { Archive, Bell, Bot, CalendarClock, Check, ChevronRight, CircleUserRound, Download, FileLock2, FileText, FolderSearch2, Home, ListChecks, Menu, Plus, Search, ShieldCheck, Sparkles, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { api } from "./api.js";
import { AuthScreen, Onboarding, Startup } from "./Auth.js";
import { CaptureModal } from "./CaptureModal.js";

type View = "home" | "documents" | "assistant" | "attention" | "family" | "activity";
const nav: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "home", label: "Overview", icon: Home },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "assistant", label: "Ask your documents", icon: Sparkles },
  { id: "attention", label: "Needs attention", icon: ListChecks },
  { id: "family", label: "Family access", icon: Users },
  { id: "activity", label: "Activity", icon: Bell },
];

export function App() {
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
    } catch { setError("The local API is not available. Start it with pnpm dev."); }
  }
  useEffect(() => { void loadSession(); }, []);

  if (!session) return <Startup message={error || "Opening your private workspace…"} retry={() => void loadSession()} />;
  if (!session.authenticated) return <AuthScreen onAuthenticated={async (current) => { setSession(current); if (current.onboardingComplete) await refresh(); }} />;
  if (!session.onboardingComplete) return <Onboarding session={session} onComplete={async () => { const current = await api.session(); setSession(current); await refresh(); }} />;
  if (!data) return <Startup message={error || "Opening your household workspace…"} retry={() => void refresh()} />;

  const activeDocuments = data.documents.filter((document) => document.status !== "DELETED");
  const attention = activeDocuments.filter((document) => document.status === "NEEDS_REVIEW" || document.status === "POLICY_HOLD").length + data.tasks.filter((task) => task.state === "OPEN").length;

  return <div className="shell">
    <header className="topbar">
      <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMenu(true)}><Menu /></button>
      <div className="wordmark"><span className="brand-mark small">D</span><span>DocumentManagement</span></div>
      <div className="local-pill"><ShieldCheck size={15} /> Local only</div>
      <button className="avatar" aria-label="Sign out" title="Sign out" onClick={async () => { await api.logout(); setData(undefined); setSession({ authenticated: false, onboardingComplete: false }); }}>LO</button>
    </header>
    <aside className={menu ? "sidebar open" : "sidebar"}>
      <div className="mobile-menu-head"><strong>Menu</strong><button className="icon-button" onClick={() => setMenu(false)}><X /></button></div>
      <div className="workspace-switch"><span className="workspace-icon"><Home size={18} /></span><span><small>Family workspace</small><strong>{data.workspace.name}</strong></span><ChevronRight size={16} /></div>
      <nav>{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMenu(false); }}><item.icon size={19} /><span>{item.label}</span>{item.id === "attention" && attention > 0 ? <b>{attention}</b> : null}</button>)}</nav>
      <div className="privacy-card"><ShieldCheck /><strong>Your documents stay here</strong><p>Local storage and local assistance are active. Cloud connections are off.</p></div>
    </aside>
    <main>
      {error ? <div className="error-banner">{error}<button onClick={() => setError("")}>Dismiss</button></div> : null}
      {view === "home" && <Overview data={data} onUpload={() => setCapture(true)} onNavigate={setView} />}
      {view === "documents" && <Documents data={data} onUpload={() => setCapture(true)} onDelete={async (id) => { if (!confirm("Delete this local document and its derived content?")) return; await api.deleteDocument(id); await refresh(); }} />}
      {view === "assistant" && <Assistant documentCount={activeDocuments.filter((document) => document.status === "READY").length} />}
      {view === "attention" && <Attention data={data} refresh={refresh} />}
      {view === "family" && <Family data={data} refresh={refresh} />}
      {view === "activity" && <Activity data={data} />}
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
      <article className="hero-card"><div className="hero-copy"><span className="eyebrow light">Household readiness</span><h2>{active.length === 0 ? "Start with one important document" : `${ready} document${ready === 1 ? "" : "s"} ready`}</h2><p>{active.length === 0 ? "Upload a synthetic text document to see local classification, search and cited answers in action." : "Readiness is shown as explainable items—never as a legal or risk score."}</p><button onClick={() => onNavigate(active.length ? "documents" : "home")}>{active.length ? "Review documents" : "Learn what to add"}<ChevronRight size={16} /></button></div><div className="orb"><FileLock2 size={40} /></div></article>
      <article className="attention-card"><span className="eyebrow">Next up</span>{openTasks.length ? <><h3>{openTasks[0]!.title}</h3><p>{openTasks.length} open task{openTasks.length === 1 ? "" : "s"} in your household.</p><button className="text-button" onClick={() => onNavigate("attention")}>See all tasks <ChevronRight size={15} /></button></> : <><h3>Nothing urgent</h3><p>Your current task list is clear.</p></>}</article>
    </section>
    <section><div className="section-title"><div><span className="eyebrow">At a glance</span><h2>What your documents know</h2></div></div><div className="stat-grid">
      <Stat icon={FileText} value={active.length} label="Documents" detail={`${ready} ready to search`} />
      <Stat icon={FolderSearch2} value={data.facts.length} label="Known facts" detail="Evidence-linked only" />
      <Stat icon={CalendarClock} value={openTasks.length} label="Open actions" detail="Nothing happens silently" />
      <Stat icon={Users} value={data.subjects.length} label="People" detail="Documents stay person-linked" />
    </div></section>
    <section className="split-section"><div><div className="section-title"><div><span className="eyebrow">Recently added</span><h2>Your documents</h2></div><button className="text-button" onClick={() => onNavigate("documents")}>View all</button></div>{active.length ? <div className="mini-list">{active.slice(0, 4).map((document) => <div key={document.id}><span className="file-icon"><FileText /></span><span><strong>{document.name}</strong><small>{document.category} · {document.status.replaceAll("_", " ").toLowerCase()}</small></span><ChevronRight /></div>)}</div> : <Empty icon={Archive} title="Your vault is empty" copy="Add a synthetic document to begin." action={<button className="secondary" onClick={onUpload}><Plus size={17} /> Add document</button>} />}</div><div className="ask-card"><Bot size={24} /><span className="eyebrow light">Private document assistant</span><h2>Ask with evidence.</h2><p>Answers are created locally and cite the document passages used. No cloud model is connected.</p><button onClick={() => onNavigate("assistant")}>Ask your documents <ChevronRight size={16} /></button></div></section>
  </>;
}

function Stat({ icon: Icon, value, label, detail }: { icon: typeof Home; value: number; label: string; detail: string }) { return <article className="stat"><Icon /><span><strong>{value}</strong><b>{label}</b><small>{detail}</small></span></article>; }

function Documents({ data, onUpload, onDelete }: { data: DashboardSnapshot; onUpload: () => void; onDelete: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const docs = data.documents.filter((document) => document.status !== "DELETED" && `${document.name} ${document.category}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHead eyebrow="Secure vault" title="Documents" copy="Immutable originals, clear processing states and documents connected to the people they belong to." action={<button className="primary" onClick={onUpload}><Upload size={18} /> Add document</button>} /><div className="toolbar"><label><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names and categories" /></label><span>{docs.length} item{docs.length === 1 ? "" : "s"}</span></div>{docs.length ? <div className="document-grid">{docs.map((document) => { const people = document.subjectIds.map((id) => data.subjects.find((subject) => subject.id === id)?.displayName).filter(Boolean); return <article className="document-card" key={document.id}><div className="doc-top"><span className="file-icon large"><FileText /></span><span className={`status ${document.status.toLowerCase()}`}>{document.status.replaceAll("_", " ")}</span></div><h3>{document.name}</h3><p>{document.category}</p><div className="document-people"><Users size={14} /> {people.join(", ") || "Unassigned"}<span>{document.captureRoute.toLowerCase()}</span></div><dl><div><dt>Version</dt><dd>{document.version}</dd></div><div><dt>Size</dt><dd>{formatBytes(document.size)}</dd></div><div><dt>Added</dt><dd>{formatDate(document.createdAt)}</dd></div></dl>{document.reviewReason ? <div className="review-note">{document.reviewReason}</div> : null}<div className="card-actions"><button className="text-button" onClick={() => navigator.clipboard.writeText(document.sha256)}>Copy integrity hash</button><button className="danger-icon" aria-label={`Delete ${document.name}`} onClick={() => void onDelete(document.id)}><Trash2 size={17} /></button></div></article>; })}</div> : <Empty icon={FileText} title="No matching documents" copy="Add a local document or change your search." action={<button className="secondary" onClick={onUpload}><Upload size={17} /> Add document</button>} />}</>;
}

function Assistant({ documentCount }: { documentCount: number }) {
  const [question, setQuestion] = useState(""); const [answer, setAnswer] = useState<Answer>(); const [busy, setBusy] = useState(false);
  async function ask() { if (question.trim().length < 3) return; setBusy(true); try { setAnswer(await api.ask(question)); } finally { setBusy(false); } }
  return <><PageHead eyebrow="Local AI" title="Ask your documents" copy="Search the evidence stored on this machine. Answers never silently leave local mode." /><div className="assistant-layout"><section className="conversation"><div className="assistant-intro"><span className="spark"><Sparkles /></span><h2>What would you like to know?</h2><p>{documentCount ? `${documentCount} locally indexed document${documentCount === 1 ? " is" : "s are"} available.` : "Add a text document before asking a question."}</p><div className="suggestions">{["Which documents mention an expiry date?", "What insurance details are available?", "Which documents mention my address?"].map((item) => <button key={item} onClick={() => setQuestion(item)}>{item}</button>)}</div></div>{answer ? <div className="answer"><div className="answer-label"><Bot size={18} /> Local answer <span>{answer.confidence} confidence</span></div><p>{answer.answer}</p>{answer.citations.length ? <div className="citations"><strong>Evidence</strong>{answer.citations.map((citation, index) => <blockquote key={`${citation.documentId}-${index}`}><b>{citation.documentName}</b><p>{citation.excerpt}</p></blockquote>)}</div> : null}</div> : null}<div className="composer"><textarea aria-label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about your documents…" /><button onClick={() => void ask()} disabled={busy || documentCount === 0}>{busy ? "Searching…" : "Ask"}<Sparkles size={17} /></button><small><ShieldCheck size={13} /> Local deterministic retrieval · no cloud fallback</small></div></section><aside className="evidence-panel"><span className="eyebrow">Trust by design</span><h3>Every answer needs evidence.</h3><ul><li><Check /> Searches only documents you can access</li><li><Check /> Excludes quarantined material</li><li><Check /> Shows when evidence is insufficient</li><li><Check /> Cites the exact source passage</li></ul></aside></div></>;
}

function Attention({ data, refresh }: { data: DashboardSnapshot; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState(""); const tasks = data.tasks;
  return <><PageHead eyebrow="Monitor and close" title="Needs attention" copy="Explainable findings and human-approved actions—without a misleading aggregate score." /><div className="task-create"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a household task" /><button className="primary" onClick={async () => { if (!title.trim()) return; await api.addTask(title); setTitle(""); await refresh(); }}><Plus size={17} /> Add task</button></div><div className="task-list">{tasks.map((task) => <article key={task.id} className={task.state === "DONE" ? "done" : ""}><button aria-label="Complete task" disabled={task.state === "DONE"} onClick={async () => { await api.completeTask(task.id); await refresh(); }}>{task.state === "DONE" ? <Check /> : null}</button><span><strong>{task.title}</strong><small>{task.severity.toLowerCase()} · {task.dueAt ? formatDate(task.dueAt) : "No due date"}</small></span></article>)}</div></>;
}

function Family({ data, refresh }: { data: DashboardSnapshot; refresh: () => Promise<void> }) {
  const [subjectName, setSubjectName] = useState("");
  const [kind, setKind] = useState<SubjectRecord["kind"]>("ADULT");
  const [relationship, setRelationship] = useState("Partner");
  const [memberName, setMemberName] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("ADULT_MEMBER");
  return <><PageHead eyebrow="People and access" title="Your family" copy="First add the people whose records you manage. Login access is separate and can be granted only when someone needs it." action={<a className="secondary button-link" href={api.exportUrl} download="document-management-export.json"><Download size={17} /> Export workspace</a>} />
    <div className="people-columns">
      <section className="people-panel"><div className="section-title"><div><span className="eyebrow">Document subjects</span><h2>People you organise for</h2></div><span className="document-count">{data.subjects.length}</span></div><p className="section-copy">Children and dependants can have documents without having a login.</p><div className="subject-list">{data.subjects.map((subject) => { const count = data.documents.filter((document) => document.status !== "DELETED" && document.subjectIds.includes(subject.id)).length; return <article key={subject.id}><span className="person">{initials(subject.displayName)}</span><span><strong>{subject.displayName}</strong><small>{subject.relationship} · {subject.kind.toLowerCase()}</small></span><b>{count} document{count === 1 ? "" : "s"}</b></article>; })}</div>
        <form className="inline-form" onSubmit={(event) => { event.preventDefault(); void (async () => { await api.addSubject({ displayName: subjectName, kind, relationship }); setSubjectName(""); await refresh(); })(); }}><h3><UserPlus size={18} /> Add a person</h3><input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} required placeholder="Full name" /><select value={kind} onChange={(event) => setKind(event.target.value as SubjectRecord["kind"])}><option value="ADULT">Adult</option><option value="CHILD">Child</option><option value="DEPENDANT">Dependant</option><option value="OTHER">Other</option></select><input value={relationship} onChange={(event) => setRelationship(event.target.value)} required placeholder="Relationship, e.g. daughter" /><button className="primary"><Plus size={17} /> Add person</button></form>
      </section>
      <section className="people-panel"><div className="section-title"><div><span className="eyebrow">Workspace access</span><h2>People who can sign in</h2></div><span className="document-count">{data.members.length}</span></div><p className="section-copy">Membership never means unrestricted access to every document.</p><div className="member-list">{data.members.map((member) => <article key={member.id}><span className="person"><CircleUserRound /></span><span><strong>{member.displayName}</strong><small>{member.role.replaceAll("_", " ").toLowerCase()}</small></span><span className="status ready">{member.state}</span></article>)}</div>
        <form className="inline-form" onSubmit={(event) => { event.preventDefault(); void (async () => { await api.addMember(memberName, role); setMemberName(""); await refresh(); })(); }}><h3><Users size={18} /> Add local access fixture</h3><p>This does not send an invitation yet.</p><input value={memberName} onChange={(event) => setMemberName(event.target.value)} required placeholder="Display name" /><select value={role} onChange={(event) => setRole(event.target.value as WorkspaceRole)}><option value="ADULT_MEMBER">Adult member</option><option value="FAMILY_ADMIN">Family administrator</option><option value="MANAGED_DEPENDANT">Managed dependant</option><option value="GUEST">Guest</option></select><button className="secondary"><Plus size={17} /> Add locally</button></form>
      </section>
    </div>
  </>;
}

function Activity({ data }: { data: DashboardSnapshot }) { return <><PageHead eyebrow="In-app notifications" title="Activity" copy="Local, content-minimized updates about your workspace." />{data.notifications.length ? <div className="notification-list">{data.notifications.map((item) => <article key={item.id}><span className={`notice-dot ${item.severity.toLowerCase()}`} /><span><strong>{item.title}</strong><p>{item.detail}</p><small>{formatDate(item.createdAt)}</small></span></article>)}</div> : <Empty icon={Bell} title="No activity yet" copy="Document and task activity will appear here." />}</>; }

function Empty({ icon: Icon, title, copy, action }: { icon: typeof Home; title: string; copy: string; action?: React.ReactNode }) { return <div className="empty"><Icon /><h3>{title}</h3><p>{copy}</p>{action}</div>; }
function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function formatBytes(value: number) { return value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
