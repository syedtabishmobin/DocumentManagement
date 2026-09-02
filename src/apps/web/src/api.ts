import type { Answer, AuthSession, ConnectorDescriptor, DashboardSnapshot, DocumentDeletionResult, DocumentDetail, DocumentRecord, DocumentRestoreResult, FactRecord, ManagePersonInput, Member, SubjectRecord, TaskRecord, Workspace, WorkspaceRole } from "@document-management/contracts";

let csrfToken: string | undefined;
let activeWorkspaceId: string | undefined;
let workspaceCreationKey = crypto.randomUUID();
let sessionRequestInFlight: Promise<AuthSession> | undefined;

export const SESSION_REQUEST_TIMEOUT_MS = 8_000;

function requestHeaders(path: string, init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? "GET").toUpperCase();
  const unsafe = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  if (unsafe && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  if (!path.startsWith("/auth/")) headers.set("X-Purpose-Id", "PUR-P1-001");
  if (activeWorkspaceId && path !== "/workspace") {
    headers.set("X-Workspace-Id", activeWorkspaceId);
  }
  if (unsafe && !headers.has("Idempotency-Key")) headers.set("Idempotency-Key", crypto.randomUUID());
  headers.set("X-Correlation-Id", crypto.randomUUID());
  return headers;
}

function captureResponseContext(response: Response): void {
  csrfToken = response.headers.get("X-CSRF-Token") ?? csrfToken;
}

function captureAuthContext(value: unknown): void {
  if (!value || typeof value !== "object" || !("authenticated" in value)) return;
  const session = value as AuthSession;
  if (!session.authenticated) {
    csrfToken = undefined;
    activeWorkspaceId = undefined;
    return;
  }
  activeWorkspaceId = session.activeWorkspaceId;
}

async function errorFor(response: Response): Promise<Error> {
  const text = await response.text();
  try {
    const message = (JSON.parse(text) as { message?: string | string[] }).message;
    return new Error(Array.isArray(message) ? message.join(". ") : message || `Request failed (${response.status})`);
  } catch {
    return new Error(text || `Request failed (${response.status})`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "same-origin", ...init, headers: requestHeaders(path, init) });
  captureResponseContext(response);
  if (!response.ok) throw await errorFor(response);
  const value = await response.json() as T;
  captureAuthContext(value);
  return value;
}

async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(`/api${path}`, { credentials: "same-origin", headers: requestHeaders(path) });
  captureResponseContext(response);
  if (!response.ok) throw await errorFor(response);
  return response.blob();
}

function requestSession(timeoutMs: number): Promise<AuthSession> {
  if (sessionRequestInFlight) return sessionRequestInFlight;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  const operation = request<AuthSession>("/auth/session", { signal: controller.signal })
    .catch((cause: unknown) => {
      if (controller.signal.aborted) {
        throw new Error("Doculyra took too long to respond.");
      }
      throw cause;
    })
    .finally(() => {
      globalThis.clearTimeout(timeout);
      if (sessionRequestInFlight === operation) sessionRequestInFlight = undefined;
    });
  sessionRequestInFlight = operation;
  return operation;
}

export const api = {
  session: ({ timeoutMs = SESSION_REQUEST_TIMEOUT_MS }: { timeoutMs?: number } = {}) => requestSession(timeoutMs),
  register: (input: { displayName: string; email: string; password: string }) => request<AuthSession>("/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<AuthSession>("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  logout: async () => {
    const result = await request<{ signedOut: true }>("/auth/logout", { method: "POST" });
    csrfToken = undefined;
    activeWorkspaceId = undefined;
    return result;
  },
  selectWorkspace: (workspaceId: string) => request<AuthSession>("/auth/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId }) }),
  configureWorkspace: async (input: { name: string; type: "PERSONAL" | "FAMILY" }) => {
    const workspace = await request<Workspace>("/workspace", { method: "PATCH", headers: { "content-type": "application/json", "Idempotency-Key": workspaceCreationKey }, body: JSON.stringify(input) });
    activeWorkspaceId = workspace.id;
    workspaceCreationKey = crypto.randomUUID();
    return workspace;
  },
  dashboard: () => request<DashboardSnapshot>("/dashboard"),
  upload: (file: File, subjectIds: string[], captureRoute: "FILE" | "CAMERA" | "BULK", syntheticConfirmed: boolean, idempotencyKey: string) => {
    const body = new FormData();
    body.set("file", file);
    body.set("subjectIds", subjectIds.join(","));
    body.set("captureRoute", captureRoute);
    body.set("syntheticConfirmed", String(syntheticConfirmed));
    return request<DocumentRecord>("/documents", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body });
  },
  manualDocument: (input: { name: string; content: string; subjectIds: string[]; syntheticConfirmed: boolean }) => request<DocumentRecord>("/documents/manual", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  documentDetail: (id: string) => request<DocumentDetail>(`/documents/${id}`),
  documentArtifact: (id: string) => requestBlob(`/documents/${id}/artifact`),
  reviewFact: (id: string) => request<FactRecord>(`/facts/${id}/review`, { method: "PATCH" }),
  addSubject: (input: { displayName: string; kind: SubjectRecord["kind"]; relationship: string; dateOfBirth?: string }) => request<SubjectRecord>("/subjects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  createPerson: (input: ManagePersonInput) => request<SubjectRecord>("/people", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  updatePerson: (id: string, revision: number, input: ManagePersonInput) => request<SubjectRecord>(`/people/${id}`, { method: "PATCH", headers: { "content-type": "application/json", "If-Match": `"${revision}"` }, body: JSON.stringify(input) }),
  deletePerson: (id: string, revision: number) => request<{ deleted: true }>(`/people/${id}`, { method: "DELETE", headers: { "If-Match": `"${revision}"` } }),
  connectors: () => request<ConnectorDescriptor[]>("/connectors"),
  deleteDocument: (id: string) => request<DocumentDeletionResult>(`/documents/${id}`, { method: "DELETE" }),
  restoreDocument: (id: string) => request<DocumentRestoreResult>(`/documents/${id}/restore`, { method: "POST" }),
  ask: (question: string) => request<Answer>("/assistant/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) }),
  addMember: (displayName: string, role: Exclude<WorkspaceRole, "OWNER">) => request<Member>("/members", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, role }) }),
  addTask: (title: string) => request<TaskRecord>("/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, severity: "ACTION" }) }),
  completeTask: (id: string) => request<TaskRecord>(`/tasks/${id}/complete`, { method: "PATCH" }),
  exportWorkspace: () => requestBlob("/exports/current"),
  recordRecoveryUnavailable: () => {
    if (!activeWorkspaceId) throw new Error("Select a workspace before requesting recovery support");
    return request<{ caseId: string; state: "POLICY_BLOCKED"; decisionFence: "DEC-038" }>(`/workspaces/${activeWorkspaceId}/recovery-cases`, { method: "POST" });
  },
};
