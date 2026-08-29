import { z } from "zod";

export const workspaceRoleSchema = z.enum([
  "OWNER",
  "FAMILY_ADMIN",
  "ADULT_MEMBER",
  "MANAGED_DEPENDANT",
  "GUEST",
]);

export const workspaceActionSchema = z.enum([
  "workspace.read",
  "workspace.admin",
  "subject.read",
  "subject.create",
  "subject.edit",
  "subject.delete",
  "document.read",
  "document.create",
  "document.edit",
  "document.delete",
  "fact.review",
  "task.read",
  "task.create",
  "task.edit",
  "connector.read",
  "export.create",
  "audit.read",
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
  role: workspaceRoleSchema.exclude(["OWNER"]),
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

export const canonicalCreateWorkspaceSchema = z.object({
  workspace_type: z.enum(["PERSONAL", "FAMILY"]),
  jurisdiction_pack_ref: z.string().trim().min(1).max(200),
  residency_policy_ref: z.string().trim().min(1).max(200),
  configuration_version: z.string().trim().min(1).max(200),
}).strict();

export const canonicalCreateSubjectSchema = z.object({
  subject_kind: z.literal("PERSON"),
  authority_basis_ref: z.string().trim().min(1).max(200).nullable(),
}).strict();

export const canonicalUpdateSubjectSchema = z.object({
  operation: z.literal("PROPOSE_ATTRIBUTE_CORRECTION"),
  protected_change_ref: z.string().trim().min(1).max(200).nullable(),
  reason_code: z.string().trim().min(1).max(80),
}).strict();

export const canonicalInviteMembershipSchema = z.object({
  identity_or_audience_ref: z.string().trim().min(1).max(200),
  participation_class: workspaceRoleSchema.exclude(["OWNER", "FAMILY_ADMIN"]),
  invitation_policy_ref: z.string().trim().min(1).max(200),
}).strict();

export const canonicalUpdateMembershipSchema = z.object({
  transition: z.enum(["SUSPEND", "REACTIVATE", "DEPART", "REMOVE"]),
  reason_code: z.string().trim().min(1).max(80),
}).strict();

export const selectWorkspaceSchema = z.object({
  workspaceId: z.string().trim().min(1).max(200),
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
export type WorkspaceAction = z.infer<typeof workspaceActionSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ConfigureWorkspaceInput = z.infer<typeof configureWorkspaceSchema>;
export type CanonicalCreateWorkspaceInput = z.infer<typeof canonicalCreateWorkspaceSchema>;
export type CanonicalCreateSubjectInput = z.infer<typeof canonicalCreateSubjectSchema>;
export type CanonicalUpdateSubjectInput = z.infer<typeof canonicalUpdateSubjectSchema>;
export type CanonicalInviteMembershipInput = z.infer<typeof canonicalInviteMembershipSchema>;
export type CanonicalUpdateMembershipInput = z.infer<typeof canonicalUpdateMembershipSchema>;
export type SelectWorkspaceInput = z.infer<typeof selectWorkspaceSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type FilePermissions = z.infer<typeof filePermissionsSchema>;
export type ManagePersonInput = z.infer<typeof managePersonSchema>;
export type ManualDocumentInput = z.infer<typeof manualDocumentSchema>;

export interface AuthSession {
  authenticated: boolean;
  account?: { id: string; displayName: string; email: string };
  onboardingComplete: boolean;
  activeWorkspaceId?: string;
  workspaces?: WorkspaceSummary[];
  session?: {
    id: string;
    createdAt: string;
    idleExpiresAt: string;
    absoluteExpiresAt: string;
    authenticationMethod: "LOCAL_PASSWORD" | "PASSKEY" | "EXTERNAL_IDENTITY";
    assurance: "SINGLE_FACTOR" | "MULTI_FACTOR" | "PHISHING_RESISTANT";
  };
}

export interface Workspace {
  id: string;
  name: string;
  type: "PERSONAL" | "FAMILY";
  status: "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED";
  ownerBindingId: string;
  jurisdictionPackRef: string;
  residencyPolicyRef: string;
  configurationVersion: string;
  revision: number;
  createdAt: string;
}

export type WorkspaceSummary = Pick<Workspace, "id" | "name" | "type" | "status" | "revision">;

export interface WorkspaceOwnerBinding {
  id: string;
  workspaceId: string;
  ownerIdentityId: string;
  ownerMembershipId: string;
  authorityBasis: "WORKSPACE_CREATOR";
  state: "ACTIVE";
  validFrom: string;
  recordedAt: string;
  revision: number;
}

export interface Member {
  id: string;
  workspaceId: string;
  identityId?: string;
  audienceRef?: string;
  displayName: string;
  role: WorkspaceRole;
  state: "ACTIVE" | "REVOKED";
  subjectId: string;
  invitationState: "NOT_INVITED" | "PENDING" | "ACTIVE" | "SUSPENDED";
  permissions: FilePermissions;
  email?: string;
  mobile?: string;
  validFrom: string;
  validTo?: string;
  recordedAt: string;
  createdAt: string;
  revision: number;
  history: MembershipHistoryEntry[];
}

export interface MembershipHistoryEntry {
  revision: number;
  role: WorkspaceRole;
  state: Member["state"];
  invitationState: Member["invitationState"];
  permissions: FilePermissions;
  validFrom: string;
  validTo: string;
  recordedAt: string;
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
  deletedAt?: string;
  purgeDueAt?: string;
  preDeleteStatus?: Exclude<DocumentStatus, "DELETED">;
  extractedText?: string;
  reviewReason?: string;
}

export interface DocumentDeletionResult {
  documentId: string;
  state: "TRASHED";
  deletedAt: string;
  purgeDueAt: string;
}

export interface DocumentRestoreResult {
  document: DocumentRecord;
  state: "RESTORED";
}

export interface SubjectRecord {
  id: string;
  workspaceId: string;
  displayName: string;
  kind: "OWNER" | "ADULT" | "CHILD" | "DEPENDANT" | "OTHER";
  relationship: string;
  dateOfBirth?: string;
  status: "ACTIVE" | "RETIRED";
  validFrom: string;
  recordedAt: string;
  retiredAt?: string;
  createdAt: string;
  revision: number;
  history: SubjectHistoryEntry[];
}

export interface SubjectHistoryEntry {
  revision: number;
  displayName: string;
  kind: SubjectRecord["kind"];
  relationship: string;
  dateOfBirth?: string;
  status: SubjectRecord["status"];
  validFrom: string;
  validTo: string;
  recordedAt: string;
}

export interface SubjectIdentityLink {
  id: string;
  workspaceId: string;
  subjectId: string;
  identityId: string;
  evidenceKind: "WORKSPACE_CREATION" | "INVITATION_REDEMPTION";
  state: "ACTIVE" | "REVOKED";
  validFrom: string;
  recordedAt: string;
  revision: number;
}

export interface AccessGrant {
  id: string;
  workspaceId: string;
  grantorIdentityId: string;
  granteeIdentityId: string;
  purposeId: "PUR-P1-001";
  resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK";
  resourceIds: string[];
  actions: WorkspaceAction[];
  startsAt: string;
  expiresAt?: string;
  state: "ACTIVE" | "REVOKED" | "EXPIRED";
  policyVersion: "policy.local-explicit-grant@0.1";
  onwardDelegation: false;
  exportAllowed: boolean;
  createdAt: string;
  revokedAt?: string;
  revision: number;
}

export interface AuthorizationEpoch {
  workspaceId: string;
  value: number;
  cause: "WORKSPACE_CREATED" | "MEMBERSHIP_CHANGED" | "GRANT_CHANGED" | "SECURITY_CHANGED";
  advancedAt: string;
}

export interface AuditRecord {
  id: string;
  workspaceId: string;
  type: string;
  resourceType: "WORKSPACE" | "PERSON" | "MEMBERSHIP" | "DOCUMENT" | "TASK" | "CONNECTOR";
  resourceId?: string;
  actor: string;
  actorId?: string;
  action?: string;
  outcome?: "SUCCEEDED" | "DENIED" | "FAILED";
  policyVersion?: string;
  correlationId?: string;
  detail: string;
  at: string;
}

export interface ConnectorDescriptor {
  id: "EMAIL_FORWARDING" | "GMAIL" | "GOOGLE_DRIVE" | "ONEDRIVE" | "DROPBOX" | "BOX";
  name: string;
  status: "REQUIRES_CONFIGURATION" | "CONFIGURED_DISABLED" | "READY_TO_CONNECT";
  consentPurpose: string;
  permissionSummary: string;
  requiredConfiguration: string[];
  callbackUrl?: string | undefined;
}

export interface FactRecord {
  id: string;
  workspaceId: string;
  documentId: string;
  subjectIds: string[];
  definitionId: string;
  name: string;
  value: string;
  confidence: number;
  reviewState: "PROPOSED" | "REVIEWED" | "CONFLICT";
  evidenceExcerpt: string;
  validFrom: string;
  recordedAt: string;
}

export interface DependencyRecord {
  id: string;
  workspaceId: string;
  fromType: "SUBJECT" | "DOCUMENT" | "FACT" | "CATEGORY";
  fromId: string;
  toType: "SUBJECT" | "DOCUMENT" | "FACT" | "CATEGORY";
  toId: string;
  kind: "DOCUMENT_SUBJECT" | "DOCUMENT_CONTAINS_FACT" | "DOCUMENT_CATEGORY";
  label: string;
  evidenceDocumentId: string;
  createdAt: string;
}

export interface DocumentDetail {
  document: DocumentRecord;
  facts: FactRecord[];
  dependencies: DependencyRecord[];
  preview: {
    kind: "TEXT" | "IMAGE" | "PDF" | "UNAVAILABLE";
    text?: string;
    artifactUrl?: string;
    message?: string;
  };
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
  dependencies: DependencyRecord[];
  accessGrants: AccessGrant[];
  authorizationEpoch: AuthorizationEpoch;
  localMode: boolean;
  customerDataPolicy: "synthetic-only" | "production-gated";
}
