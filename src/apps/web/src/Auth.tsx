import { useState } from "react";
import type { AuthSession } from "@document-management/contracts";
import { Apple, Check, KeyRound, Laptop, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { api } from "./api.js";

export function Startup({ message, retry }: { message: string; retry: () => void }) {
  return <div className="startup"><div className="brand-mark">D</div><h1>DocumentManagement</h1><p>{message}</p><button onClick={retry}>Try again</button></div>;
}

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void | Promise<void> }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      <div className="wordmark inverse"><span className="brand-mark small">D</span><span>DocumentManagement</span></div>
      <div><span className="eyebrow light">Private by default</span><h1>Your family records.<br />One trusted place.</h1><p>Create a household, connect documents to the people they belong to, and get evidence-backed answers without sending files to a cloud service.</p><ul><li><Check /> Local document storage</li><li><Check /> Clear family access boundaries</li><li><Check /> No silent external transfers</li></ul></div>
      <small><ShieldCheck size={15} /> Local development profile</small>
    </section>
    <main className="auth-panel">
      <div className="auth-card">
        <span className="eyebrow">{mode === "register" ? "Create your private vault" : "Welcome back"}</span>
        <h2>{mode === "register" ? "Create an account" : "Sign in"}</h2>
        <p>{mode === "register" ? "Start with a local account. You will create your personal or family workspace next." : "Open your local household workspace."}</p>
        <div className="provider-grid" aria-label="Alternative sign-in options">
          <button disabled title="Requires production identity configuration"><span className="provider-g">G</span> Google</button>
          <button disabled title="Requires production identity configuration"><Apple size={18} /> Apple</button>
          <button disabled title="Requires production identity configuration"><span className="provider-ms">⊞</span> Microsoft</button>
          <button disabled title="Requires device passkey configuration"><KeyRound size={18} /> Passkey</button>
        </div>
        <div className="divider"><span>or use email locally</span></div>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {mode === "register" ? <label>Full name<input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required placeholder="Your name" /></label> : null}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 10 : 1} required placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary wide" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create local account" : "Sign in"}</button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>{mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
        <div className="local-explainer"><LockKeyhole size={18} /><span><strong>Nothing leaves this device.</strong><small>Google, Apple, Microsoft and passkey buttons are product-ready ports. They remain disconnected until you explicitly configure a production identity provider.</small></span></div>
      </div>
    </main>
  </div>;
}

export function Onboarding({ session, onComplete }: { session: AuthSession; onComplete: () => Promise<void> }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"PERSONAL" | "FAMILY">("FAMILY");
  const [name, setName] = useState(`${session.account?.displayName?.split(" ")[0] ?? "My"}'s household`);
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
    <header><div className="wordmark"><span className="brand-mark small">D</span><span>DocumentManagement</span></div><span>Step {step} of 2</span></header>
    <main className="onboarding-card">
      {step === 1 ? <>
        <span className="onboarding-icon"><ShieldCheck /></span><span className="eyebrow">Before you begin</span><h1>Your records stay under your control.</h1><p>In this local profile, uploaded files, extracted text, account credentials and document answers are stored and processed on this machine. External connections are off.</p>
        <div className="principle-grid"><article><Laptop /><strong>Local storage</strong><span>Files are written only to this project’s ignored local-data directory.</span></article><article><LockKeyhole /><strong>Explicit connection</strong><span>Email, cloud drives and external identity require separate configuration and consent.</span></article><article><Mail /><strong>No surprise messages</strong><span>Adding family people locally does not email or invite them.</span></article></div>
        <label className="check-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I understand this is a local development environment and will use synthetic documents for testing.</span></label>
        <div className="onboarding-actions"><button className="primary" disabled={!consent} onClick={() => setStep(2)}>Continue</button></div>
      </> : <form onSubmit={(event) => void finish(event)}>
        <span className="onboarding-icon"><Laptop /></span><span className="eyebrow">Your first workspace</span><h1>Who are you organising for?</h1><p>A personal workspace is just for you. A family workspace lets you add partners, children, dependants and other people, then assign each document to the right person.</p>
        <div className="workspace-options"><label className={type === "PERSONAL" ? "selected" : ""}><input type="radio" name="type" checked={type === "PERSONAL"} onChange={() => setType("PERSONAL")} /><CircleIcon type="personal" /><strong>Just me</strong><span>A private personal vault</span></label><label className={type === "FAMILY" ? "selected" : ""}><input type="radio" name="type" checked={type === "FAMILY"} onChange={() => setType("FAMILY")} /><CircleIcon type="family" /><strong>My family</strong><span>People, relationships and scoped access</span></label></div>
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
