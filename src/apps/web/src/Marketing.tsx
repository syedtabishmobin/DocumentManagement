import { ArrowRight, BrainCircuit, Building2, Camera, Check, FileSearch, Fingerprint, FolderKanban, Menu, MessageCircleQuestion, Network, SearchCheck, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark, BrandName } from "./Brand.js";

const links = [
  ["Product", "#product"], ["Intelligence", "#intelligence"], ["Features", "#features"], ["Security", "#security"], ["Company", "#company"], ["Contact", "#contact"],
] as const;

export function MarketingSite() {
  const [menu, setMenu] = useState(false);
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

  useEffect(() => {
    if (!menu) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [menu]);

  return <div className="marketing-site">
    <header className="marketing-nav">
      <a className="wordmark" href="/" aria-label="Doculyra home"><BrandMark /><BrandName /></a>
      <nav className="marketing-links" aria-label="Primary navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="marketing-actions"><a className="nav-signin" href="/app?mode=login">Sign in</a><a className="primary button-link" href="/app?mode=register">Create your workspace <ArrowRight size={16} /></a></div>
      <button className="marketing-menu" type="button" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="mobile-navigation" onClick={() => setMenu((open) => !open)}>{menu ? <X /> : <Menu />}</button>
    </header>

    {menu ? <div className="mobile-nav-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenu(false); }}>
      <nav className="mobile-nav-sheet" id="mobile-navigation" aria-label="Mobile navigation">
        <div className="mobile-nav-heading"><span>Explore Doculyra</span></div>
        {links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}<ArrowRight /></a>)}
        <div className="mobile-nav-actions"><a href="/app?mode=login">Sign in</a><a className="primary" href="/app?mode=register">Create your workspace</a></div>
      </nav>
    </div> : null}

    <main className="marketing-main">
      <section className="marketing-hero" id="home">
        <div className="hero-message">
          <span className="marketing-kicker"><Sparkles size={15} /> Private organisation. Evidence-aware AI.</span>
          <h1>Everything important.<br />Clearly connected.</h1>
          <p>Doculyra turns scattered household records into an organised, searchable workspace—then helps you understand them with answers grounded in the documents you control.</p>
          <div className="hero-actions"><a className="primary button-link" href="/app?mode=register">Start privately <ArrowRight size={17} /></a><a className="secondary button-link" href="#product">Explore the product</a></div>
          <div className="trust-row"><span><Check /> Organised around people</span><span><Check /> Answers with evidence</span><span><Check /> Explicit access control</span></div>
        </div>
        <ProductPreview />
      </section>

      <section className="marketing-band" aria-label="Product principles"><span>One connected workspace</span><span>Human-controlled intelligence</span><span>Visible evidence</span><span>Private local testing</span></section>

      <section className="marketing-section product-story" id="product">
        <div><span className="eyebrow">From files to organised knowledge</span><h2>A calm system for the records behind everyday life.</h2><p>Doculyra keeps people, documents, facts, dates, permissions and activity connected without treating them as the same thing. A document can belong to a child who has no login. A family member can receive specific access without seeing the entire household.</p><a href="/app?mode=register" className="text-button">Create a household workspace <ArrowRight size={15} /></a></div>
        <div className="story-steps"><article><b>01</b><span><strong>Capture</strong><small>Add files, folders, camera scans or a structured manual record.</small></span></article><article><b>02</b><span><strong>Organise</strong><small>Connect each record to people, categories, dates and the right access.</small></span></article><article><b>03</b><span><strong>Understand</strong><small>Search, ask questions with evidence and see what may need attention.</small></span></article></div>
      </section>

      <section className="intelligence-section" id="intelligence">
        <div className="intelligence-copy"><span className="eyebrow light">Document intelligence</span><h2>AI that shows its work.</h2><p>Doculyra is designed to help classify records, retrieve relevant passages and answer questions without turning model output into unquestioned truth. Important answers carry evidence and limitations; consequential changes remain yours to approve.</p><ul><li><SearchCheck /> Searches the records available to you</li><li><Fingerprint /> Keeps the source and version attached</li><li><BrainCircuit /> Separates assistance from authority</li></ul></div>
        <div className="answer-preview"><div className="answer-preview-head"><span><Sparkles /> Ask Doculyra</span><small>LOCAL ASSISTANCE</small></div><p className="sample-question">When does our home insurance renew?</p><div className="sample-answer"><strong>Renewal is listed for 18 September.</strong><p>The current policy schedule contains that date. Review the policy directly before acting.</p><blockquote><FileSearch /><span><b>Home insurance schedule</b><small>Page 2 · Current local version</small></span></blockquote></div><footer><ShieldCheck /> Evidence shown before action</footer></div>
      </section>

      <section className="marketing-section" id="features"><div className="marketing-section-head"><span className="eyebrow">Features</span><h2>Organisation you can see. Intelligence you can inspect.</h2><p>Bring records together, connect them to the right context and keep every meaningful change understandable.</p></div><div className="feature-grid"><Feature icon={Camera} title="Capture every way" copy="Browse, drag and drop, add multiple files, use a phone camera or create a manual record." /><Feature icon={FolderKanban} title="Build an organised record" copy="Use people, categories, dates, document states and tasks instead of relying on folders alone." /><Feature icon={MessageCircleQuestion} title="Ask with evidence" copy="Answers point back to the document passages used and say when evidence is insufficient." /><Feature icon={Users} title="Control family access" copy="Keep household subjects separate from logins and assign explicit document capabilities." /><Feature icon={Network} title="Connect related information" copy="Understand how records, people, facts and next actions relate without flattening their meaning." /><Feature icon={Fingerprint} title="Keep a trustworthy history" copy="Review additions, edits, access changes and important actions in a content-minimised timeline." /></div></section>

      <section className="security-section" id="security"><div><span className="eyebrow light">Privacy and security</span><h2>Private by default. Connected only by choice.</h2><p>The local development profile stores and processes synthetic documents on this machine. Future identity and cloud services stay inactive until their purpose, scope, consent, protection and revocation behavior are configured.</p><ul><li><Check /> Passwords are strongly hashed; raw session tokens are not stored</li><li><Check /> Family relationship never grants automatic document access</li><li><Check /> AI assistance cannot approve its own consequential action</li><li><Check /> Activity records avoid document content and sensitive values</li></ul></div><div className="security-card"><ShieldCheck /><strong>Your data boundary stays visible.</strong><p>Doculyra distinguishes local processing, configured connections and unavailable capabilities instead of presenting a simulated success.</p></div></section>

      <section className="marketing-section scale-section" id="company"><div className="scale-visual"><span><BrandMark /><b>Doculyra Home</b></span><i /><span><Building2 /><b>Doculyra Business</b><small>Future edition</small></span></div><div><span className="eyebrow">Designed to grow</span><h2>Start with a household. Keep the foundation.</h2><p>Phase 1 is focused on personal and family workspaces. The underlying model reserves organisation workspaces, memberships and controlled access so a future business edition can grow from the same principles without turning family records into an enterprise afterthought.</p></div></section>

      <section className="marketing-section about-section" id="about"><div><span className="eyebrow">About Doculyra</span><h2>Built for the work people quietly carry.</h2></div><p>Important information is scattered across folders, inboxes, portals and people. Doculyra is being built to make that work calmer and safer: organised records, useful assistance, visible evidence and no hidden authority.</p></section>

      <section className="contact-section" id="contact"><div><span className="eyebrow light">Contact</span><h2>Interested in early access?</h2><p>Talk to us about household use, future business workspaces, security review or the product roadmap.</p></div>{contactEmail ? <a className="contact-button" href={`mailto:${contactEmail}`}>Contact us <ArrowRight /></a> : <span className="contact-pending">Contact delivery will be enabled with the production Doculyra email domain.</span>}</section>
    </main>
    <footer className="marketing-footer"><div className="wordmark inverse"><BrandMark /><BrandName /></div><p>Organised records. Evidence-aware intelligence. Explicit control.</p><div>{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a href="/app?mode=login">Sign in</a></div><small>© {new Date().getFullYear()} Doculyra. Production legal and privacy links will be activated before launch.</small></footer>
  </div>;
}

function ProductPreview() {
  return <div className="product-preview" aria-label="Doculyra product preview"><div className="preview-top"><span><BrandMark /><b>My household</b></span><em>Private workspace</em></div><div className="preview-body"><aside><i className="active" /><i /><i /><i /><i /></aside><section><small>WORKSPACE OVERVIEW</small><h2>Your records, in order.</h2><div className="preview-stats"><span><b>18</b>Documents</span><span><b>3</b>People</span><span><b>2</b>Next actions</span></div><article><span><FolderKanban /></span><div><strong>Home insurance</strong><small>Alex & Sam · renewal in 24 days</small></div><em>Organised</em></article><article><span><Sparkles /></span><div><strong>Ask Doculyra</strong><small>Evidence available from 12 local records</small></div><em>Local</em></article></section></div></div>;
}

function Feature({ icon: Icon, title, copy }: { icon: typeof Camera; title: string; copy: string }) { return <article><span><Icon /></span><h3>{title}</h3><p>{copy}</p></article>; }
