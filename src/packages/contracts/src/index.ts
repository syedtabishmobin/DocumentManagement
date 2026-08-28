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

export const registerSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export const configureWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["PERSONAL", "FAMILY"]),
});

export const createSubjectSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  kind: z.enum(["OWNER", "ADULT", "CHILD", "DEPENDANT", "OTHER"]),
  relationship: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().date().optional(),
});

export const filePermissionsSchema = z.object({
  view: z.boolean().default(true),
  add: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
});

export const managePersonSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  kind: z.enum(["OWNER", "ADULT", "CHILD", "DEPENDANT", "OTHER"]),
  relationship: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().date().optional(),
  loginEnabled: z.boolean().default(false),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  mobile: z.string().trim().min(7).max(32).optional(),
  role: workspaceRoleSchema.exclude(["OWNER"]).default("ADULT_MEMBER"),
  permissions: filePermissionsSchema.default({ view: true, add: false, edit: false, delete: false }),
}).superRefine((value, context) => {
  if (value.loginEnabled && !value.email && !value.mobile) context.addIssue({ code: "custom", path: ["email"], message: "An email address or mobile number is required when login is enabled" });
});

export const manualDocumentSchema = z.object({
  name: z.string().trim().min(1).max(240),
  content: z.string().trim().min(1).max(500_000),
  category: z.string().trim().min(1).max(120).optional(),
  subjectIds: z.array(z.string()).min(1).max(20),
});

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfigureWorkspaceInput = z.infer<typeof configureWorkspaceSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type FilePermissions = z.infer<typeof filePermissionsSchema>;
export type ManagePersonInput = z.infer<typeof managePersonSchema>;
export type ManualDocumentInput = z.infer<typeof manualDocumentSchema>;

export interface AuthSession {
  authenticated: boolean;
  account?: { id: string; displayName: string; email: string };
  onboardingComplete: boolean;
}

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
  subjectId: string;
  invitationState: "NOT_INVITED" | "PENDING" | "ACTIVE" | "SUSPENDED";
  permissions: FilePermissions;
  email?: string;
  mobile?: string;
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
  subjectIds: string[];
  captureRoute: "FILE" | "CAMERA" | "MANUAL" | "BULK" | "CONNECTOR";
  extractedText?: string;
  reviewReason?: string;
}

export interface SubjectRecord {
  id: string;
  workspaceId: string;
  displayName: string;
  kind: "OWNER" | "ADULT" | "CHILD" | "DEPENDANT" | "OTHER";
  relationship: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  workspaceId: string;
  type: string;
  resourceType: "WORKSPACE" | "PERSON" | "MEMBERSHIP" | "DOCUMENT" | "TASK" | "CONNECTOR";
  resourceId?: string;
  actor: string;
  detail: string;
  at: string;
}

export interface ConnectorDescriptor {
  id: "EMAIL_FORWARDING" | "GMAIL" | "GOOGLE_DRIVE" | "ONEDRIVE" | "DROPBOX" | "BOX";
  name: string;
  status: "REQUIRES_CONFIGURATION" | "READY_TO_CONNECT";
  consentPurpose: string;
  permissionSummary: string;
  requiredConfiguration: string[];
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
  subjects: SubjectRecord[];
  audit: AuditRecord[];
  localMode: true;
}
