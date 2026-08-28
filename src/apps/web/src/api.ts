import type { Answer, AuthSession, DashboardSnapshot, DocumentRecord, Member, SubjectRecord, TaskRecord, Workspace, WorkspaceRole } from "@document-management/contracts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "same-origin", ...init });
  if (!response.ok) {
    const text = await response.text();
    try { throw new Error((JSON.parse(text) as { message?: string }).message || `Request failed (${response.status})`); }
    catch (error) { if (error instanceof SyntaxError) throw new Error(text || `Request failed (${response.status})`); throw error; }
  }
  return response.json() as Promise<T>;
}

export const api = {
  session: () => request<AuthSession>("/auth/session"),
  register: (input: { displayName: string; email: string; password: string }) => request<AuthSession>("/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<AuthSession>("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  logout: () => request<{ signedOut: true }>("/auth/logout", { method: "POST" }),
  configureWorkspace: (input: { name: string; type: "PERSONAL" | "FAMILY" }) => request<Workspace>("/workspace", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  dashboard: () => request<DashboardSnapshot>("/dashboard"),
  upload: (file: File, subjectIds: string[], captureRoute: "FILE" | "CAMERA" | "BULK") => { const body = new FormData(); body.set("file", file); body.set("subjectIds", subjectIds.join(",")); body.set("captureRoute", captureRoute); return request<DocumentRecord>("/documents", { method: "POST", body }); },
  manualDocument: (input: { name: string; content: string; subjectIds: string[] }) => request<DocumentRecord>("/documents/manual", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  addSubject: (input: { displayName: string; kind: SubjectRecord["kind"]; relationship: string; dateOfBirth?: string }) => request<SubjectRecord>("/subjects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  connectors: () => request<Array<{ id: string; name: string; status: string }>>("/connectors"),
  deleteDocument: (id: string) => request<{ deleted: true }>(`/documents/${id}`, { method: "DELETE" }),
  ask: (question: string) => request<Answer>("/assistant/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) }),
  addMember: (displayName: string, role: WorkspaceRole) => request<Member>("/members", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, role }) }),
  addTask: (title: string) => request<TaskRecord>("/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, severity: "ACTION" }) }),
  completeTask: (id: string) => request<TaskRecord>(`/tasks/${id}/complete`, { method: "PATCH" }),
  exportUrl: "/api/exports/current",
};
