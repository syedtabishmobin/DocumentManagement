import { z } from "zod";

export const workspaceRoleSchema = z.enum([
  "OWNER",
  "FAMILY_ADMIN",
  "ADULT_MEMBER",
  "MANAGED_DEPENDANT",
  "GUEST",
]);

export const documentStatusSchema = z.enum([
  "UPLOADING",
  "PROCESSING",
  "READY",
  "NEEDS_REVIEW",
  "POLICY_HOLD",
  "ARCHIVED",
  "DELETED",
]);

export const severitySchema = z.enum(["INFO", "ACTION", "IMPORTANT", "URGENT", "CRITICAL"]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["PERSONAL", "FAMILY"]).default("FAMILY"),
});

export const askQuestionSchema = z.object({
  question: z.string().trim().min(3).max(2_000),
  documentIds: z.array(z.string()).max(50).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(240),
  dueAt: z.string().datetime().optional(),
  severity: severitySchema.default("ACTION"),
  documentId: z.string().optional(),
});

export const createMemberSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  role: workspaceRoleSchema,
});

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export interface Workspace {
  id: string;
  name: string;
  type: "PERSONAL" | "FAMILY";
  createdAt: string;
}

export interface Member {
  id: string;
  workspaceId: string;
  displayName: string;
  role: WorkspaceRole;
  state: "ACTIVE" | "REVOKED";
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  workspaceId: string;
  name: string;
  mediaType: string;
  size: number;
  sha256: string;
  status: DocumentStatus;
  category: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  extractedText?: string;
  reviewReason?: string;
}

export interface FactRecord {
  id: string;
  workspaceId: string;
  documentId: string;
  name: string;
  value: string;
  confidence: number;
  validFrom: string;
  recordedAt: string;
}

export interface TaskRecord {
  id: string;
  workspaceId: string;
  title: string;
  severity: Severity;
  state: "OPEN" | "DONE";
  dueAt?: string;
  documentId?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  workspaceId: string;
  title: string;
  detail: string;
  severity: Severity;
  read: boolean;
  createdAt: string;
}

export interface Citation {
  documentId: string;
  documentName: string;
  excerpt: string;
}

export interface Answer {
  answer: string;
  citations: Citation[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  mode: "LOCAL_DETERMINISTIC" | "LOCAL_MODEL";
}

export interface DashboardSnapshot {
  workspace: Workspace;
  documents: DocumentRecord[];
  facts: FactRecord[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  members: Member[];
  localMode: true;
}
