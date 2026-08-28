import { ArrowRight, BellRing, Camera, Check, Cloud, FileSearch, FolderLock, Menu, MessageCircleQuestion, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["Product", "#product"], ["Features", "#features"], ["Security", "#security"], ["About", "#about"], ["Contact", "#contact"],
] as const;

export function MarketingSite() {
  const [menu, setMenu] = useState(false);
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
  return <div className="marketing-site">
    <header className="marketing-nav">
      <a className="wordmark" href="/"><span className="brand-mark small">D</span><span>DocumentManagement</span></a>
      <nav className={menu ? "marketing-links open" : "marketing-links"}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}</nav>
      <div className="marketing-actions"><a className="nav-signin" href="/app?mode=login">Sign in</a><a className="primary button-link" href="/app?mode=register">Create your vault <ArrowRight size={16} /></a></div>
      <button className="marketing-menu" aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </header>

    <main className="marketing-main">
      <section className="marketing-hero" id="home"><div className="hero-message"><span className="marketing-kicker"><ShieldCheck size={15} /> Built for private family records</span><h1>Your household’s important documents, finally connected.</h1><p>Organise records around the people they belong to, understand what needs attention, and ask questions with evidence—without losing control of where your information goes.</p><div className="hero-actions"><a className="primary button-link" href="/app?mode=register">Start your private vault <ArrowRight size={17} /></a><a className="secondary button-link" href="#product">See how it works</a></div><div className="trust-row"><span><Check /> Person-linked records</span><span><Check /> Evidence-backed answers</span><span><Check /> Explicit sharing and consent</span></div></div>
        <div className="product-preview" aria-label="Product preview"><div className="preview-top"><span className="brand-mark small">D</span><span>My household</span><b>Private</b></div><div className="preview-body"><aside><i /><i /><i /><i /></aside><section><small>HOUSEHOLD READINESS</small><h2>Everything important, in one view.</h2><div className="preview-stats"><span><b>18</b>Documents</span><span><b>3</b>People</span><span><b>2</b>Next actions</span></div><article><span><FolderLock /></span><div><strong>Home insurance</strong><small>Alex & Sam · renewal in 24 days</small></div></article><article><span><FileSearch /></span><div><strong>Passport</strong><small>Maya · verified source</small></div></article></section></div></div>
      </section>

      <section className="marketing-band"><span>One household model</span><span>Clear evidence</span><span>Local-first development</span><span>Production-ready boundaries</span></section>

      <section className="marketing-section product-story" id="product"><div><span className="eyebrow">The product</span><h2>More than a digital filing cabinet.</h2><p>DocumentManagement treats people, documents, facts, deadlines and access as connected—but distinct—records. That means a child can have a passport without needing a login, and a family member can receive exactly the access they need without seeing everything else.</p><a href="/app?mode=register" className="text-button">Create a family workspace <ArrowRight size={15} /></a></div><div className="story-steps"><article><b>01</b><span><strong>Create your household</strong><small>Add people and relationships without fabricating accounts.</small></span></article><article><b>02</b><span><strong>Bring documents together</strong><small>Upload, scan, enter details or connect an approved source.</small></span></article><article><b>03</b><span><strong>Understand and act</strong><small>Search, ask with evidence, and keep a visible history.</small></span></article></div></section>

      <section className="marketing-section" id="features"><div className="marketing-section-head"><span className="eyebrow">Features</span><h2>Designed around real household work.</h2><p>Capture, organise, understand, share and monitor without collapsing privacy boundaries.</p></div><div className="feature-grid"><Feature icon={Camera} title="Capture every way" copy="Drag and drop, multi-file folders, phone camera, manual records, email and cloud sources." /><Feature icon={Users} title="Organise by person" copy="Connect each document to one or more adults, children, dependants or household resources." /><Feature icon={MessageCircleQuestion} title="Ask with evidence" copy="Answers cite the local document passages used and say when evidence is insufficient." /><Feature icon={BellRing} title="See what changed" copy="A detailed activity timeline explains additions, edits, access changes and important actions." /><Feature icon={Cloud} title="Consent-led connections" copy="Every external identity or document source shows its purpose, scope and revocation path first." /><Feature icon={Sparkles} title="Intelligence with limits" copy="Classification and assistance remain reviewable; clinical and unsupported content fails safely." /></div></section>

      <section className="security-section" id="security"><div><span className="eyebrow light">Privacy and security</span><h2>Trust is a product behavior, not a badge.</h2><p>External transfer, login access and document permissions are separate choices. Every meaningful change is attributable and reviewable.</p><ul><li><Check /> Passwords are strongly hashed; raw session tokens are not stored</li><li><Check /> Family relationship never grants automatic document access</li><li><Check /> Connected services use explicit, revocable consent</li><li><Check /> Activity records avoid document content and sensitive values</li></ul></div><div className="security-card"><ShieldCheck /><strong>Your data boundary stays visible.</strong><p>The local development profile uses this machine only. Configured production connections must declare what leaves, why, for how long, and how access is revoked.</p></div></section>

      <section className="marketing-section about-section" id="about"><div><span className="eyebrow">About us</span><h2>Built for the work families quietly carry.</h2></div><p>Important household information is scattered across folders, inboxes, portals and people. DocumentManagement is being built to make that work calmer and safer: a shared source of truth with evidence, clear authority and no hidden automation.</p></section>

      <section className="contact-section" id="contact"><div><span className="eyebrow light">Contact</span><h2>Interested in early access?</h2><p>Talk to us about household use, partnerships, security review or the product roadmap.</p></div>{contactEmail ? <a className="contact-button" href={`mailto:${contactEmail}`}>Contact us <ArrowRight /></a> : <span className="contact-pending">Contact delivery will be enabled with the production email domain.</span>}</section>
    </main>
    <footer className="marketing-footer"><div className="wordmark inverse"><span className="brand-mark small">D</span><span>DocumentManagement</span></div><p>Private family document intelligence with explicit control.</p><div>{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a href="/app?mode=login">Sign in</a></div><small>© {new Date().getFullYear()} DocumentManagement. Production legal and privacy links will be activated before launch.</small></footer>
  </div>;
}

function Feature({ icon: Icon, title, copy }: { icon: typeof Camera; title: string; copy: string }) { return <article><span><Icon /></span><h3>{title}</h3><p>{copy}</p></article>; }
