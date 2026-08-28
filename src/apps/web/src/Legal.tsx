import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { BrandMark, BrandName } from "./Brand.js";

type LegalKind = "privacy" | "terms";

const effectiveDate = "29 August 2026";

export function LegalPage({ kind }: { kind: LegalKind }) {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
  const privacy = kind === "privacy";

  useEffect(() => {
    const previous = document.title;
    document.title = `${privacy ? "Privacy Notice" : "Terms of Use"} — Doculyra`;
    return () => { document.title = previous; };
  }, [privacy]);

  return <div className="legal-site">
    <header className="legal-nav">
      <a className="wordmark" href="/" aria-label="Doculyra home"><BrandMark /><BrandName /></a>
      <a href="/"><ArrowLeft size={16} /> Back to Doculyra</a>
    </header>
    <main className="legal-main">
      <div className="legal-heading">
        <span className="legal-kicker"><ShieldCheck size={15} /> Doculyra development preview</span>
        <h1>{privacy ? "Privacy Notice" : "Terms of Use"}</h1>
        <p>{privacy ? "How the Doculyra development preview handles information and keeps its current limits visible." : "The conditions for using the Doculyra development preview while the production service is being built."}</p>
        <dl><div><dt>Effective</dt><dd>{effectiveDate}</dd></div><div><dt>Applies to</dt><dd>Doculyra Home development preview</dd></div><div><dt>Status</dt><dd>Pre-production · synthetic test data only</dd></div></dl>
      </div>

      {privacy ? <PrivacyContent contactEmail={contactEmail} /> : <TermsContent contactEmail={contactEmail} />}
    </main>
    <footer className="legal-footer">
      <div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/">Home</a></div>
      <small>© {new Date().getFullYear()} Doculyra. This preview is not authorised for real personal documents.</small>
    </footer>
  </div>;
}

function PrivacyContent({ contactEmail }: { contactEmail: string | undefined }) {
  return <article className="legal-copy">
    <LegalNotice />
    <section><h2>1. What this notice covers</h2><p>This notice covers the Doculyra website and development preview. Doculyra is being designed as a personal and family document-organisation and evidence-aware assistance service. The current Azure preview is a pre-production environment and must be used only with synthetic or deliberately fabricated test information.</p></section>
    <section><h2>2. Information the service may handle</h2><p>Depending on the features you use, Doculyra may handle account and session information, workspace and family-member profiles, documents and document metadata, extracted proposals, relationships, questions and cited answers, tasks, permissions, consent choices, integration metadata, and content-minimised security and activity records.</p><p>Do not upload real identity, financial, legal, health, employment, family, or other personal documents to this development preview.</p></section>
    <section><h2>3. Why information is used</h2><p>Information is used to authenticate users, create and protect workspaces, organise records around the right people, preserve document versions, provide search and evidence-linked assistance, manage permissions and invitations, show activity, investigate failures, protect the service, and meet deletion and operational obligations.</p></section>
    <section><h2>4. Storage, processing and AI</h2><p>The current hosted development preview runs in Azure Australia East and is restricted to synthetic test data. External document providers, external notification delivery and hosted AI are not active merely because their development registrations exist. When those capabilities are introduced, their purpose, requested permissions, processing route and consent must be shown before connection.</p><p>The production design requires customer-controlled document encryption and device-local processing for plaintext document intelligence. Those production controls are still being implemented and must not be inferred from this preview.</p></section>
    <section><h2>5. Family workspaces and sharing</h2><p>A person represented in a workspace is not automatically a login user. Household membership does not automatically grant access to every document. Doculyra is designed to apply explicit permissions to documents, fields, relationships and actions, and to record access changes without placing document content in ordinary activity logs.</p></section>
    <section><h2>6. External services</h2><p>Doculyra is preparing optional integrations with Microsoft, Google, Dropbox, Box and Azure Communication Services. A future connection may send the minimum information required to the provider selected by the user and will also be governed by that provider's privacy terms. Connections must be optional, purpose-specific and revocable. The current application adapters are not enabled.</p></section>
    <section><h2>7. Retention and deletion</h2><p>The approved document lifecycle fences a deleted document immediately, keeps it recoverable in Trash for 30 calendar days, and then requires coordinated removal or irrecoverability across registered originals, derived information, indexes, keys and temporary copies. The complete production deletion workflow is not yet certified. Account closure, legal retention and content-minimised audit evidence are separate policies and will be published before production release.</p></section>
    <section><h2>8. Choices and access</h2><p>The production service is intended to provide access, correction, export, sharing controls, connector disconnection, document deletion and Trash recovery. Some of these controls are incomplete in the preview. Where a control is unavailable, the service must say so rather than simulate completion.</p></section>
    <section><h2>9. Dependants and children</h2><p>Family administrators may organise records about dependants without enabling a login. This does not establish guardianship or legal authority. Age, consent, authority, transfer and private-resource rules require further product and legal review before production use.</p></section>
    <section><h2>10. Security and incidents</h2><p>Doculyra applies least-privilege, current-authorization, audit, secure-development and data-minimisation requirements. No system is risk-free. The preview must not be used as a production vault, and security or privacy concerns should be reported using the contact route below.</p></section>
    <section><h2>11. Contact and changes</h2><p>This notice will change as the production operator, domain, processors, support channels and legal terms are finalised. Material changes will receive a new effective date. {contactEmail ? <>Questions can be sent to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</> : <>Until the production support address is published, use the Contact section on the <a href="/#contact">Doculyra home page</a>.</>}</p></section>
  </article>;
}

function TermsContent({ contactEmail }: { contactEmail: string | undefined }) {
  return <article className="legal-copy">
    <LegalNotice />
    <section><h2>1. Development-preview agreement</h2><p>These terms apply to the Doculyra Home development preview. By using the preview, you agree to use it only for evaluation with synthetic or deliberately fabricated test information. It is not a production storage service and is not authorised for real personal documents.</p></section>
    <section><h2>2. Accounts and security</h2><p>You must provide accurate test-account information, protect your credentials and devices, and notify Doculyra of suspected unauthorised access. Do not attempt to bypass authentication, permissions, tenant boundaries, security controls, unavailable capabilities or provider activation gates.</p></section>
    <section><h2>3. Your content</h2><p>You retain responsibility for content you provide and must have the right to use it. For this preview, provide synthetic content only. Do not submit unlawful material, malware, third-party secrets, production credentials, clinical records, or information that could identify or harm a real person.</p></section>
    <section><h2>4. Organisation and assistance</h2><p>Doculyra may classify documents, propose extracted information, connect related records, retrieve passages and produce evidence-linked answers. These outputs may be incomplete or wrong. They are assistance, not approved truth, and must not be treated as legal, financial, tax, insurance, immigration or medical advice.</p></section>
    <section><h2>5. Family access</h2><p>You are responsible for inviting eligible people and assigning appropriate permissions. A family relationship, administrator role or workspace membership does not prove legal authority over another person's information. Do not use the preview to make real access or disclosure decisions.</p></section>
    <section><h2>6. External providers</h2><p>Microsoft, Google, Dropbox, Box, email and other integrations may be offered later. Provider registration does not mean an integration is active. If enabled, separate provider terms may apply, and you must review the displayed purpose and permissions before consenting.</p></section>
    <section><h2>7. Acceptable use</h2><p>Do not misuse the service, interfere with other users, probe or exploit vulnerabilities outside an authorised security process, automate abusive traffic, introduce malicious code, infringe rights, evade usage controls, or use Doculyra to make prohibited high-impact decisions.</p></section>
    <section><h2>8. Availability and changes</h2><p>The preview may change, be reset, become unavailable or lose synthetic test state. Features may be incomplete, disabled or removed. No uptime, backup, recovery, data-retention or fitness commitment is made for the preview.</p></section>
    <section><h2>9. Deletion and termination</h2><p>Document Trash is designed around a 30-calendar-day recovery period followed by coordinated purge. The complete production workflow is not yet certified. Doculyra may suspend preview access needed to protect the service or enforce these terms. Production account closure and statutory-retention terms will be published separately.</p></section>
    <section><h2>10. Preview limitations</h2><p>The preview is provided for evaluation on an as-available basis. To the extent permitted by applicable law, no production warranty or service commitment is made. Nothing in these preview terms excludes rights that cannot lawfully be excluded.</p></section>
    <section><h2>11. Production terms and contact</h2><p>Before public production release, these terms will be reviewed and updated with the operating legal entity, service address, governing-law and dispute provisions, consumer-guarantee treatment, final warranties and liability terms, pricing if applicable, and production support channels. {contactEmail ? <>Questions can be sent to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</> : <>Until the production support address is published, use the Contact section on the <a href="/#contact">Doculyra home page</a>.</>}</p></section>
  </article>;
}

function LegalNotice() {
  return <aside className="legal-notice"><ShieldCheck /><div><strong>Synthetic data only</strong><p>This page describes the current development preview and approved target controls. It is not a claim that unfinished production controls are already operating, and it is not a substitute for final Australian privacy and legal review.</p></div></aside>;
}
