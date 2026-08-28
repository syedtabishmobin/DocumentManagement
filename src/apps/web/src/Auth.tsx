import { useEffect, useState } from "react";
import type { AuthSession } from "@document-management/contracts";
import { Apple, Check, KeyRound, Laptop, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { api } from "./api.js";
import { BrandMark, BrandName } from "./Brand.js";
import { isLocalRuntime } from "./runtime.js";

export function Startup({ message, retry }: { message: string; retry: () => void }) {
  return <div className="startup"><div className="brand-mark"><BrandMark /></div><h1>Doculyra</h1><p>{message}</p><button onClick={retry}>Try again</button></div>;
}

export function AuthScreen({ onAuthenticated, onModeChange, initialMode = "register" }: { onAuthenticated: (session: AuthSession) => void | Promise<void>; onModeChange?: (mode: "register" | "login") => void; initialMode?: "register" | "login" }) {
  const localRuntime = isLocalRuntime();
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const session = mode === "register"
        ? await api.register({ displayName, email, password })
        : await api.login({ email, password });
      await onAuthenticated(session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not sign you in");
    } finally { setBusy(false); }
  }

  return <div className="auth-layout">
    <section className="auth-story">
      <a className="wordmark inverse" href="/"><span className="brand-mark small"><BrandMark /></span><BrandName /></a>
      <div><span className="eyebrow light">Private organisation · grounded intelligence</span><h1>Your records.<br />Clear, connected, understood.</h1><p>Organise important records around the people and things they belong to, then ask questions with evidence—without silently sending files to a cloud service.</p><ul><li><Check /> Local-first document organisation</li><li><Check /> Answers linked to source evidence</li><li><Check /> Clear access and activity history</li></ul></div>
      <small><ShieldCheck size={15} /> {localRuntime ? "Local development profile" : "Azure synthetic preview"}</small>
    </section>
    <main className="auth-panel">
      <div className="auth-card">
        <span className="eyebrow">{mode === "register" ? "Create your private vault" : "Welcome back"}</span>
        <h2>{mode === "register" ? "Create an account" : "Sign in"}</h2>
        <p>{mode === "register" ? `Start with a ${localRuntime ? "local" : "development preview"} account. You will create your personal or family workspace next.` : `Open your ${localRuntime ? "local" : "development preview"} household workspace.`}</p>
        <div className="provider-grid" aria-label="Alternative sign-in options">
          <button disabled title="Available after identity integrations are configured"><span className="provider-g">G</span> Google</button>
          <button disabled title="Available after identity integrations are configured"><Apple size={18} /> Apple</button>
          <button disabled title="Available after identity integrations are configured"><span className="provider-ms">⊞</span> Microsoft</button>
          {mode === "login" ? <button disabled title="Enroll a passkey from account security first"><KeyRound size={18} /> Use a passkey</button> : null}
        </div>
        <p className="integration-note">External identity options are intentionally inactive while the core product experience is being finalised.</p>
        <div className="divider"><span>{localRuntime ? "or use email locally" : "or use preview email sign-in"}</span></div>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {mode === "register" ? <label>Full name<input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required placeholder="Your name" /></label> : null}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 10 : 1} required placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary wide" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? `Create ${localRuntime ? "local" : "preview"} account` : "Sign in"}</button>
        </form>
        <button className="auth-switch" onClick={() => { const next = mode === "register" ? "login" : "register"; setMode(next); onModeChange?.(next); setError(""); }}>{mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
        <div className="local-explainer"><LockKeyhole size={18} /><span><strong>{localRuntime ? "Nothing leaves this device." : "External providers are off."}</strong><small>{localRuntime ? "External identity providers will require configured applications and consent." : "This Azure development preview accepts synthetic test data only. Provider sign-in requires configured applications and consent."} Passkeys are enrolled after account creation and then used to sign in.</small></span></div>
        <a className="back-to-site" href="/">← Back to website</a>
      </div>
    </main>
  </div>;
}

export function Onboarding({ session, onComplete }: { session: AuthSession; onComplete: () => Promise<void> }) {
  const localRuntime = isLocalRuntime();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"PERSONAL" | "FAMILY">("FAMILY");
  const owner = session.account?.displayName?.split(" ")[0] ?? "My";
  const suggestedName = (choice: "PERSONAL" | "FAMILY") => choice === "FAMILY" ? `${owner}'s household` : `${owner}'s private vault`;
  const [name, setName] = useState(suggestedName("FAMILY"));
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function finish(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await api.configureWorkspace({ name, type }); await onComplete(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Workspace setup failed"); }
    finally { setBusy(false); }
  }

  return <div className="onboarding">
    <header><div className="wordmark"><span className="brand-mark small"><BrandMark /></span><BrandName edition="Home" /></div><span>Step {step} of 2</span></header>
    <main className="onboarding-card">
      {step === 1 ? <>
        <span className="onboarding-icon"><ShieldCheck /></span><span className="eyebrow">Before you begin</span><h1>Your records stay under your control.</h1><p>{localRuntime ? "In this local profile, uploaded files, extracted text, account credentials and document answers are stored and processed on this machine." : "In this Azure development preview, uploaded files, extracted text, account credentials and document answers are stored in development resources."} External connections are off.</p>
        <div className="principle-grid"><article><Laptop /><strong>{localRuntime ? "Local storage" : "Synthetic preview storage"}</strong><span>{localRuntime ? "Files are written only to this project’s ignored local-data directory." : "Only synthetic test files may be placed in this development environment."}</span></article><article><LockKeyhole /><strong>Explicit connection</strong><span>Email, cloud drives and external identity require separate configuration and consent.</span></article><article><Mail /><strong>No surprise messages</strong><span>Adding family people does not email or invite them while messaging is inactive.</span></article></div>
        <label className="check-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I understand this is a {localRuntime ? "local" : "hosted"} development environment and will use synthetic documents for testing.</span></label>
        <div className="onboarding-actions"><button className="primary" disabled={!consent} onClick={() => setStep(2)}>Continue</button></div>
      </> : <form onSubmit={(event) => void finish(event)}>
        <span className="onboarding-icon"><Laptop /></span><span className="eyebrow">Your first workspace</span><h1>Who are you organising for?</h1><p>A personal workspace is just for you. A family workspace lets you add partners, children, dependants and other people, then assign each document to the right person.</p>
        <div className="workspace-options"><label className={type === "PERSONAL" ? "selected" : ""}><input type="radio" name="type" checked={type === "PERSONAL"} onChange={() => { setType("PERSONAL"); setName(suggestedName("PERSONAL")); }} /><CircleIcon type="personal" /><strong>Just me</strong><span>A private personal vault</span></label><label className={type === "FAMILY" ? "selected" : ""}><input type="radio" name="type" checked={type === "FAMILY"} onChange={() => { setType("FAMILY"); setName(suggestedName("FAMILY")); }} /><CircleIcon type="family" /><strong>My family</strong><span>People, relationships and scoped access</span></label></div>
        <label className="wide-field">Workspace name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></label>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="onboarding-actions"><button type="button" className="secondary" onClick={() => setStep(1)}>Back</button><button className="primary" disabled={busy}>{busy ? "Creating…" : "Create workspace"}</button></div>
      </form>}
    </main>
  </div>;
}

function CircleIcon({ type }: { type: "personal" | "family" }) {
  return <span className="choice-icon">{type === "personal" ? <Laptop /> : <ShieldCheck />}</span>;
}
