import { useEffect, useRef, useState } from "react";
import type { SubjectRecord } from "@document-management/contracts";
import { Camera, Cloud, FilePenLine, FolderUp, Mail, ScanLine, ShieldCheck, Upload, X } from "lucide-react";
import { api } from "./api.js";

type Mode = "choose" | "file" | "camera" | "manual" | "connect";

export function CaptureModal({ subjects, onClose, onAdded }: { subjects: SubjectRecord[]; onClose: () => void; onAdded: () => Promise<void> }) {
  const [mode, setMode] = useState<Mode>("choose");
  const [selected, setSelected] = useState<string[]>(subjects[0] ? [subjects[0].id] : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connectors, setConnectors] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [manualName, setManualName] = useState("");
  const [manualContent, setManualContent] = useState("");
  const browser = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  useEffect(() => { if (mode === "connect" && !connectors.length) void api.connectors().then(setConnectors).catch(() => setError("Connector catalogue is unavailable")); }, [mode, connectors.length]);

  function toggleSubject(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  async function addFiles(files: FileList | File[], route: "FILE" | "CAMERA" | "BULK") {
    if (!selected.length) { setError("Choose at least one person for these documents"); return; }
    const list = Array.from(files); if (!list.length) return;
    setBusy(true); setError("");
    try {
      for (const file of list) await api.upload(file, selected, list.length > 1 && route === "FILE" ? "BULK" : route);
      await onAdded(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Document capture failed"); }
    finally { setBusy(false); }
  }

  async function addManual(event: React.FormEvent) {
    event.preventDefault();
    if (!selected.length) { setError("Choose at least one person for this record"); return; }
    setBusy(true); setError("");
    try { await api.manualDocument({ name: manualName, content: manualContent, subjectIds: selected }); await onAdded(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Manual record could not be saved"); }
    finally { setBusy(false); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title">
      <header><div><span className="eyebrow">Secure acquisition</span><h2 id="capture-title">{mode === "choose" ? "How would you like to add it?" : mode === "connect" ? "Connect a source" : "Add documents"}</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><X /></button></header>
      {mode !== "choose" ? <button className="modal-back" onClick={() => { setMode("choose"); setError(""); }}>← All options</button> : null}
      {mode === "choose" ? <>
        <p>Choose a source. Local routes work now; connected services require deliberate configuration.</p>
        <div className="capture-grid">
          <CaptureChoice icon={Upload} title="Files or folder" copy="Browse, drag and drop, or add several files at once" onClick={() => setMode("file")} />
          <CaptureChoice icon={Camera} title="Camera or scan" copy="Photograph a page with your phone or device camera" onClick={() => setMode("camera")} />
          <CaptureChoice icon={FilePenLine} title="Enter details" copy="Create a searchable manual record without a file" onClick={() => setMode("manual")} />
          <CaptureChoice icon={Cloud} title="Email or cloud" copy="Gmail, private email, Drive, OneDrive, Dropbox and Box" onClick={() => setMode("connect")} />
        </div>
      </> : null}
      {mode !== "choose" && mode !== "connect" ? <SubjectPicker subjects={subjects} selected={selected} toggle={toggleSubject} /> : null}
      {mode === "file" ? <div className="capture-body">
        <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files, "FILE"); }}><FolderUp /><h3>Drop documents here</h3><p>PDF, images, text and office files up to 25 MB each</p><button className="secondary" onClick={() => browser.current?.click()}>Browse files</button><input ref={browser} hidden type="file" multiple onChange={(event) => event.target.files && void addFiles(event.target.files, "FILE")} /></div>
        <label className="folder-choice"><FolderUp /><span><strong>Add an entire folder</strong><small>Files are uploaded one-by-one and linked to the selected people.</small></span><input hidden type="file" multiple {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={(event) => event.target.files && void addFiles(event.target.files, "BULK")} /></label>
      </div> : null}
      {mode === "camera" ? <div className="capture-body"><div className="camera-choice"><ScanLine /><h3>Scan a document</h3><p>Your browser opens the device camera when supported. The captured image is stored locally and linked to the selected people.</p><button className="primary" onClick={() => camera.current?.click()}><Camera size={18} /> Open camera</button><input ref={camera} hidden type="file" accept="image/*" capture="environment" onChange={(event) => event.target.files && void addFiles(event.target.files, "CAMERA")} /></div></div> : null}
      {mode === "manual" ? <form className="manual-form" onSubmit={(event) => void addManual(event)}><label>Record name<input value={manualName} onChange={(event) => setManualName(event.target.value)} required placeholder="e.g. Medicare member number" /></label><label>Details<textarea value={manualContent} onChange={(event) => setManualContent(event.target.value)} required rows={8} placeholder="Enter the details you want to store and search…" /></label><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save local record"}</button></form> : null}
      {mode === "connect" ? <div className="connector-body"><div className="connector-note"><ShieldCheck /><span><strong>External connections are off.</strong><small>Nothing will be sent or imported unless you configure credentials and approve the connection. These options are shown now so the product flow is complete.</small></span></div><div className="connector-grid">{connectors.map((connector) => <button key={connector.id} disabled title="Requires explicit connector configuration">{connector.id.includes("MAIL") || connector.id.includes("EMAIL") ? <Mail /> : <Cloud />}<span><strong>{connector.name}</strong><small>Configure in production</small></span></button>)}</div></div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      {busy ? <div className="busy-line">Adding document securely…</div> : null}
    </section>
  </div>;
}

function CaptureChoice({ icon: Icon, title, copy, onClick }: { icon: typeof Upload; title: string; copy: string; onClick: () => void }) {
  return <button className="capture-choice" onClick={onClick}><span><Icon /></span><strong>{title}</strong><small>{copy}</small></button>;
}

function SubjectPicker({ subjects, selected, toggle }: { subjects: SubjectRecord[]; selected: string[]; toggle: (id: string) => void }) {
  return <fieldset className="subject-picker"><legend>Who does this belong to?</legend><p>You can select more than one person.</p><div>{subjects.map((subject) => <label key={subject.id} className={selected.includes(subject.id) ? "selected" : ""}><input type="checkbox" checked={selected.includes(subject.id)} onChange={() => toggle(subject.id)} /><span>{initials(subject.displayName)}</span><strong>{subject.displayName}</strong><small>{subject.relationship}</small></label>)}</div></fieldset>;
}

function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
