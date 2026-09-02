import { useEffect, useRef, useState } from "react";
import type { AuthSession } from "@document-management/contracts";
import { Apple, Check, KeyRound, Laptop, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { api } from "./api.js";
import { BrandMark, BrandName } from "./Brand.js";
import { isLocalRuntime } from "./runtime.js";
import { availabilityByProvider, externalIdentityProviderIds, providerName, safeAuthReturnTo, safeExternalAuthorizationUrl, type ExternalIdentityAvailability, type ExternalIdentityCallbackNotice, type ExternalIdentityProviderAvailability, type ExternalIdentityProviderId } from "./externalIdentity.js";

export function Startup({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="startup"><div className="brand-mark"><BrandMark /></div><h1>Doculyra</h1><p>{message}</p>{retry ? <button onClick={retry}>Try again</button> : null}</div>;
}

export function AuthScreen({ onAuthenticated, onModeChange, initialMode = "register", returnTo = "/app", callbackNotice }: { onAuthenticated: (session: AuthSession) => void | Promise<void>; onModeChange?: (mode: "register" | "login") => void; initialMode?: "register" | "login"; returnTo?: string; callbackNotice?: ExternalIdentityCallbackNotice }) {
  const localRuntime = isLocalRuntime();
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [providerState, setProviderState] = useState<{ status: "loading" | "ready" | "failed"; availability?: ExternalIdentityAvailability }>({ status: "loading" });
  const [startingProvider, setStartingProvider] = useState<ExternalIdentityProviderId>();
  const [providerStartError, setProviderStartError] = useState("");
  const callbackNoticeRef = useRef<HTMLDivElement>(null);
  const externalIdentityAvailable = providerState.status === "ready" && providerState.availability?.providers.some((provider) => provider.available) === true;

  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => {
    let active = true;
    void api.externalIdentityProviders().then(
      (availability) => { if (active) setProviderState({ status: "ready", availability }); },
      () => { if (active) setProviderState({ status: "failed" }); },
    );
    return () => { active = false; };
  }, []);
  useEffect(() => { if (callbackNotice) callbackNoticeRef.current?.focus(); }, [callbackNotice]);

  async function startExternalIdentity(provider: ExternalIdentityProviderId) {
    setProviderStartError("");
    setStartingProvider(provider);
    try {
      const result = await api.startExternalIdentity(provider.toUpperCase() as "GOOGLE" | "APPLE" | "MICROSOFT", safeAuthReturnTo(returnTo));
      const authorizationUrl = safeExternalAuthorizationUrl(result.authorizationUrl);
      if (!authorizationUrl) throw new Error("Invalid provider redirect");
      window.location.assign(authorizationUrl);
    } catch {
      setProviderStartError(`${providerName(provider)} sign-in could not be started. Try again or use email and password.`);
      setStartingProvider(undefined);
    }
  }

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
        {callbackNotice ? <div ref={callbackNoticeRef} className={`auth-callback-notice ${callbackNotice.kind}`} role={callbackNotice.kind === "failed" ? "alert" : "status"} tabIndex={-1}>{callbackNotice.message}</div> : null}
        <ExternalIdentityOptions state={providerState} startingProvider={startingProvider} onStart={(provider) => void startExternalIdentity(provider)} />
        {providerStartError ? <p className="auth-callback-notice failed" role="alert">{providerStartError}</p> : null}
        {mode === "login" ? <div className="passkey-option"><button type="button" disabled aria-describedby="passkey-explanation"><KeyRound size={18} /> Use a passkey</button><small id="passkey-explanation">Passkeys require a separate enrolment and authenticator-lifecycle release. They are not a social sign-in provider.</small></div> : null}
        <div className="divider"><span>{localRuntime ? "or use email locally" : "or use preview email sign-in"}</span></div>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {mode === "register" ? <label>Full name<input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required placeholder="Your name" /></label> : null}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 10 : 1} required placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary wide" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? `Create ${localRuntime ? "local" : "preview"} account` : "Sign in"}</button>
        </form>
        <button className="auth-switch" onClick={() => { const next = mode === "register" ? "login" : "register"; setMode(next); onModeChange?.(next); setError(""); setRecoveryOpen(false); }}>{mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
        {mode === "login" ? <div className="recovery-boundary"><strong>Can’t sign in? Account recovery is not available yet.</strong><span>This development preview cannot reset access or transfer a workspace owner.</span><button className="recovery-link" type="button" aria-expanded={recoveryOpen} onClick={() => setRecoveryOpen((open) => !open)}>{recoveryOpen ? "Hide recovery policy" : "Why is recovery unavailable?"}</button>{recoveryOpen ? <span role="status">No recovery case, evidence submission, factor reset, or ownership change has been created under DEC-038. Retry approved sign-in details without sending sensitive evidence.</span> : null}</div> : null}
        <div className="local-explainer"><LockKeyhole size={18} /><span><strong>{localRuntime ? "Nothing leaves this device." : externalIdentityAvailable ? "Configured identity providers are available." : "External identity providers are off."}</strong><small>{localRuntime ? "External identity providers will require configured applications and consent." : externalIdentityAvailable ? "This Azure development preview accepts synthetic test identities only. Each available provider uses explicit consent and a separately governed activation gate." : "This Azure development preview accepts synthetic test data only. Provider sign-in requires configured applications and consent."} Passkeys remain unavailable until enrollment and recovery controls are implemented and verified.</small></span></div>
        <a className="back-to-site" href="/">← Back to website</a>
      </div>
    </main>
  </div>;
}

export function ExternalIdentityOptions({ state, startingProvider, onStart = () => undefined }: { state: { status: "loading" | "ready" | "failed"; availability?: ExternalIdentityAvailability }; startingProvider: ExternalIdentityProviderId | undefined; onStart?: (provider: ExternalIdentityProviderId) => void }) {
  const availability = state.availability ? availabilityByProvider(state.availability) : undefined;
  return <section className="external-identity-options" aria-labelledby="external-identity-heading" aria-busy={state.status === "loading"}>
    <h3 id="external-identity-heading">Continue with an identity provider</h3>
    <div className="provider-grid">
      {externalIdentityProviderIds.map((provider) => <ProviderButton key={provider} provider={provider} status={state.status} availability={availability?.[provider]} starting={startingProvider === provider} onStart={() => onStart(provider)} />)}
    </div>
    {state.status === "loading" ? <p className="integration-note" role="status">Checking provider availability…</p> : null}
    {state.status === "failed" ? <p className="integration-note provider-check-failed" role="alert">Provider availability could not be checked. External sign-in is disabled; email and password still work.</p> : null}
  </section>;
}

function ProviderButton({ provider, status, availability, starting, onStart }: { provider: ExternalIdentityProviderId; status: "loading" | "ready" | "failed"; availability: ExternalIdentityProviderAvailability | undefined; starting: boolean; onStart: () => void }) {
  const name = providerName(provider);
  const enabled = status === "ready" && availability?.available === true && !starting;
  const explanation = status === "loading"
    ? `Checking ${name} availability.`
    : status === "failed"
      ? `${name} sign-in is unavailable because provider status could not be verified.`
      : availability?.available ? `Continue securely to ${name}.` : `${name} sign-in is not enabled in this environment.`;
  const explanationId = `provider-${provider}-explanation`;
  return <div className="provider-option">
    <button type="button" disabled={!enabled} aria-describedby={explanationId} onClick={enabled ? onStart : undefined}>{provider === "google" ? <span className="provider-g" aria-hidden="true">G</span> : provider === "apple" ? <Apple size={18} aria-hidden="true" /> : <span className="provider-ms" aria-hidden="true">⊞</span>} {starting ? `Opening ${name}…` : name}</button>
    <small id={explanationId}>{explanation}</small>
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
        <span className="onboarding-icon"><ShieldCheck /></span><span className="eyebrow">Before you begin</span><h1>Your records stay under your control.</h1><p>{localRuntime ? "In this local profile, uploaded files, extracted text, account credentials and document answers are stored and processed on this machine." : "In this Azure development preview, uploaded files, extracted text, account credentials and document answers are stored in development resources."} Document-provider connections remain off until separately configured and consented.</p>
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
