import { useMemo, useState } from "react";
import type { AuditRecord, DashboardSnapshot } from "@document-management/contracts";
import { Bell, CheckCircle2, Clock3, FileText, KeyRound, Settings2, UserRound } from "lucide-react";

type Filter = "ALL" | AuditRecord["resourceType"];
const filters: Array<{ id: Filter; label: string }> = [{ id: "ALL", label: "All activity" }, { id: "DOCUMENT", label: "Documents" }, { id: "PERSON", label: "People" }, { id: "MEMBERSHIP", label: "Access" }, { id: "TASK", label: "Tasks" }, { id: "WORKSPACE", label: "Workspace" }];

export function ActivityView({ data }: { data: DashboardSnapshot }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const records = useMemo(() => data.audit.filter((item) => filter === "ALL" || item.resourceType === filter), [data.audit, filter]);
  return <>
    <div className="page-head"><div><span className="eyebrow">Auditable history</span><h1>Activity</h1><p>A detailed, content-minimized record of document, person, access, task and workspace changes.</p></div><div className="activity-total"><Clock3 /><span><strong>{data.audit.length}</strong><small>recorded changes</small></span></div></div>
    <section className="activity-highlights"><article><Bell /><span><strong>{data.notifications.length}</strong><small>In-app notifications</small></span></article><article><FileText /><span><strong>{data.audit.filter((item) => item.resourceType === "DOCUMENT").length}</strong><small>Document events</small></span></article><article><KeyRound /><span><strong>{data.audit.filter((item) => item.resourceType === "MEMBERSHIP").length}</strong><small>Access events</small></span></article></section>
    <div className="activity-filters" role="group" aria-label="Filter activity">{filters.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    {records.length ? <div className="audit-timeline">{records.map((record, index) => <AuditItem key={record.id} record={record} data={data} last={index === records.length - 1} />)}</div> : <div className="empty"><Clock3 /><h3>No matching activity</h3><p>Choose another filter to see recorded changes.</p></div>}
  </>;
}

function AuditItem({ record, data, last }: { record: AuditRecord; data: DashboardSnapshot; last: boolean }) {
  const Icon = record.resourceType === "DOCUMENT" ? FileText : record.resourceType === "PERSON" ? UserRound : record.resourceType === "MEMBERSHIP" ? KeyRound : record.resourceType === "TASK" ? CheckCircle2 : Settings2;
  const resource = resolveResource(record, data);
  return <article className="audit-item"><div className="audit-rail"><span><Icon /></span>{!last ? <i /> : null}</div><div className="audit-content"><div><span className="audit-type">{record.resourceType.toLowerCase()}</span><time dateTime={record.at}>{formatLongDate(record.at)}</time></div><h3>{titleFor(record.type)}</h3><p>{record.detail}</p><footer><span>By {record.actor}</span>{resource ? <b>{resource}</b> : null}<code>{record.type}</code></footer></div></article>;
}

function resolveResource(record: AuditRecord, data: DashboardSnapshot): string | undefined {
  if (!record.resourceId) return undefined;
  if (record.resourceType === "DOCUMENT") return data.documents.find((item) => item.id === record.resourceId)?.name;
  if (record.resourceType === "PERSON") return data.subjects.find((item) => item.id === record.resourceId)?.displayName;
  if (record.resourceType === "MEMBERSHIP") return data.members.find((item) => item.id === record.resourceId)?.displayName;
  if (record.resourceType === "TASK") return data.tasks.find((item) => item.id === record.resourceId)?.title;
  return data.workspace.name;
}

function titleFor(type: string) { return type.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()); }
function formatLongDate(value: string) { return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
