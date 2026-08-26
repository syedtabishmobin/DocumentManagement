import type { Answer, DashboardSnapshot, DocumentRecord, Member, TaskRecord, WorkspaceRole } from "@document-management/contracts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardSnapshot>("/dashboard"),
  upload: (file: File) => { const body = new FormData(); body.set("file", file); return request<DocumentRecord>("/documents", { method: "POST", body }); },
  deleteDocument: (id: string) => request<{ deleted: true }>(`/documents/${id}`, { method: "DELETE" }),
  ask: (question: string) => request<Answer>("/assistant/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) }),
  addMember: (displayName: string, role: WorkspaceRole) => request<Member>("/members", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, role }) }),
  addTask: (title: string) => request<TaskRecord>("/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, severity: "ACTION" }) }),
  completeTask: (id: string) => request<TaskRecord>(`/tasks/${id}/complete`, { method: "PATCH" }),
  exportUrl: "/api/exports/current",
};
