import { useState } from "react";
import type { DashboardSnapshot, ManagePersonInput, Member, SubjectRecord } from "@document-management/contracts";
import { Check, Download, KeyRound, Mail, Pencil, Phone, Plus, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { api } from "./api.js";

export function FamilyView({ data, refresh }: { data: DashboardSnapshot; refresh: () => Promise<void> }) {
  const [editing, setEditing] = useState<SubjectRecord | "new">();
  const [error, setError] = useState("");
  return <>
    <div className="page-head"><div><span className="eyebrow">People and access</span><h1>Your family</h1><p>Manage each person once, then decide whether they need login access and exactly what file actions they may perform.</p></div><div className="head-actions"><a className="secondary button-link" href={api.exportUrl} download="doculyra-export.json"><Download size={17} /> Export</a><button className="primary" onClick={() => setEditing("new")}><UserPlus size={17} /> Add person</button></div></div>
    {error ? <div className="error-banner">{error}<button onClick={() => setError("")}>Dismiss</button></div> : null}
    <section className="people-summary"><div><Users /><span><strong>{data.subjects.length}</strong><small>People organised</small></span></div><div><KeyRound /><span><strong>{data.members.filter((member) => member.state === "ACTIVE").length}</strong><small>With login access</small></span></div><p>A person can have documents without an account. Login and file permissions are explicit and can be changed independently.</p></section>
    <div className="unified-people-list">{data.subjects.map((subject) => {
      const member = data.members.find((item) => item.subjectId === subject.id);
      const documentCount = data.documents.filter((document) => document.status !== "DELETED" && document.subjectIds.includes(subject.id)).length;
      const login = member?.state === "ACTIVE";
      return <article key={subject.id}>
        <span className="person-avatar">{initials(subject.displayName)}</span>
        <div className="person-identity"><strong>{subject.displayName}</strong><small>{subject.relationship} · {subject.kind.toLowerCase()}</small><div><span>{documentCount} document{documentCount === 1 ? "" : "s"}</span>{login ? <span className="access-on"><KeyRound /> Login {member.invitationState.toLowerCase()}</span> : <span className="access-off">No login</span>}</div></div>
        <PermissionSummary member={login ? member : undefined} />
        <button className="edit-person" aria-label={`Edit ${subject.displayName}`} onClick={() => setEditing(subject)}><Pencil size={17} /> Edit</button>
      </article>;
    })}</div>
    <div className="invitation-explainer"><ShieldCheck /><div><strong>Secure invitation flow</strong><p>When delivery is configured, an enabled person receives a short-lived invitation link by email and an optional one-time SMS code. They establish their own password or passkey; reusable passwords are never sent in messages.</p></div></div>
    {editing ? <PersonEditor subject={editing === "new" ? undefined : editing} member={editing === "new" ? undefined : data.members.find((item) => item.subjectId === editing.id)} onClose={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); await refresh(); }} onError={setError} /> : null}
  </>;
}

function PermissionSummary({ member }: { member: Member | undefined }) {
  if (!member) return <div className="permission-summary muted"><span>File access</span><strong>None</strong></div>;
  const allowed = Object.entries(member.permissions).filter(([, value]) => value).map(([key]) => key);
  return <div className="permission-summary"><span>File permissions</span><strong>{allowed.join(" · ") || "None"}</strong>{member.email ? <small><Mail /> {maskEmail(member.email)}</small> : null}{member.mobile ? <small><Phone /> {maskMobile(member.mobile)}</small> : null}</div>;
}

function PersonEditor({ subject, member, onClose, onSaved, onError }: { subject: SubjectRecord | undefined; member: Member | undefined; onClose: () => void; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const owner = subject?.kind === "OWNER";
  const [displayName, setDisplayName] = useState(subject?.displayName ?? "");
  const [kind, setKind] = useState<SubjectRecord["kind"]>(subject?.kind ?? "ADULT");
  const [relationship, setRelationship] = useState(subject?.relationship ?? "Family member");
  const [loginEnabled, setLoginEnabled] = useState(owner || member?.state === "ACTIVE");
  const [email, setEmail] = useState(member?.email ?? "");
  const [mobile, setMobile] = useState(member?.mobile ?? "");
  const [role, setRole] = useState<ManagePersonInput["role"]>(member?.role === "OWNER" ? "FAMILY_ADMIN" : member?.role ?? "ADULT_MEMBER");
  const [permissions, setPermissions] = useState(member?.permissions ?? { view: true, add: false, edit: false, delete: false });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const input: ManagePersonInput = { displayName, kind: owner ? "OWNER" : kind, relationship, loginEnabled, role, permissions, ...(email ? { email } : {}), ...(mobile ? { mobile } : {}) };
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setFormError("");
    try { subject ? await api.updatePerson(subject.id, input) : await api.createPerson(input); await onSaved(); }
    catch (cause) { setFormError(cause instanceof Error ? cause.message : "Person could not be saved"); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!subject || owner || !confirm(`Remove ${subject.displayName}? This is allowed only when no documents remain assigned.`)) return;
    setBusy(true);
    try { await api.deletePerson(subject.id); await onSaved(); }
    catch (cause) { onClose(); onError(cause instanceof Error ? cause.message : "Person could not be removed"); }
    finally { setBusy(false); }
  }

  return <div className="modal-backdrop" role="presentation"><section className="person-editor" role="dialog" aria-modal="true" aria-labelledby="person-editor-title"><header><div><span className="eyebrow">Household person</span><h2 id="person-editor-title">{subject ? `Edit ${subject.displayName}` : "Add a person"}</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><X /></button></header><form onSubmit={(event) => void save(event)}>
    <div className="person-fields"><label>Full name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label><label>Relationship<input value={relationship} onChange={(event) => setRelationship(event.target.value)} required /></label><label>Person type<select value={owner ? "OWNER" : kind} disabled={owner} onChange={(event) => setKind(event.target.value as SubjectRecord["kind"])}><option value="OWNER">Owner</option><option value="ADULT">Adult</option><option value="CHILD">Child</option><option value="DEPENDANT">Dependant</option><option value="OTHER">Other</option></select></label></div>
    <label className="login-toggle"><input type="checkbox" checked={loginEnabled} disabled={owner} onChange={(event) => setLoginEnabled(event.target.checked)} /><span><strong>Allow this person to sign in</strong><small>Creates or suspends a separate workspace membership.</small></span></label>
    {loginEnabled ? <div className="login-settings"><div className="person-fields"><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required={!mobile} placeholder="person@example.com" /></label><label>Mobile number<input value={mobile} onChange={(event) => setMobile(event.target.value)} required={!email} placeholder="+61 …" /></label>{!owner ? <label>Workspace role<select value={role} onChange={(event) => setRole(event.target.value as ManagePersonInput["role"])}><option value="ADULT_MEMBER">Adult member</option><option value="FAMILY_ADMIN">Family administrator</option><option value="MANAGED_DEPENDANT">Managed dependant</option><option value="GUEST">Guest</option></select></label> : null}</div>
      <fieldset className="permission-editor"><legend>Document permissions</legend><p>Choose the actions this person can perform. Resource-level sharing remains separate.</p>{(["view", "add", "edit", "delete"] as const).map((permission) => <label key={permission}><input type="checkbox" checked={owner || permissions[permission]} disabled={owner || permission === "view"} onChange={(event) => setPermissions({ ...permissions, [permission]: event.target.checked })} /><span>{permission === "view" ? "View assigned files" : `${permission[0]!.toUpperCase()}${permission.slice(1)} files`}</span>{owner || permissions[permission] ? <Check /> : null}</label>)}</fieldset>
      {!owner ? <div className="delivery-status"><Mail /><span><strong>{member?.invitationState === "PENDING" ? "Invitation awaiting delivery configuration" : "Invitation will be prepared on save"}</strong><small>Email/SMS dispatch stays off until a provider and sender identity are configured.</small></span></div> : null}
    </div> : null}
    {formError ? <div className="form-error">{formError}</div> : null}
    <footer>{subject && !owner ? <button type="button" className="delete-person" disabled={busy} onClick={() => void remove()}><Trash2 size={16} /> Remove person</button> : <span />}<button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : subject ? "Save changes" : "Add person"}</button></footer>
  </form></section></div>;
}

function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function maskEmail(value: string) { const [name, domain] = value.split("@"); return `${name?.slice(0, 2) ?? ""}•••@${domain ?? ""}`; }
function maskMobile(value: string) { return `${value.slice(0, 3)}••••${value.slice(-2)}`; }
