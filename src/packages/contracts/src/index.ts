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
  "grant.read",
  "grant.create",
  "grant.revoke",
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

export const canonicalCreateAccessGrantSchema = z.object({
  grantee_ref: z.string().trim().min(1).max(200),
  purpose_id: z.literal("PUR-P1-001"),
  scope: z.object({
    resource_refs: z.array(z.string().trim().min(1).max(200)).min(1).max(100),
    field_refs: z.array(z.string().trim().min(1).max(200)).max(100),
    edge_refs: z.array(z.string().trim().min(1).max(200)).max(100),
    actions: z.array(workspaceActionSchema).min(1).max(50),
    allow_export: z.boolean(),
    allow_onward_delegation: z.literal(false),
  }).strict(),
  valid_from: z.string().datetime(),
  valid_to: z.string().datetime().nullable(),
  policy_version: z.literal("policy.local-explicit-grant@0.2"),
}).strict().superRefine((value, context) => {
  if (value.valid_to && new Date(value.valid_to).getTime() <= new Date(value.valid_from).getTime()) {
    context.addIssue({ code: "custom", path: ["valid_to"], message: "valid_to must be later than valid_from" });
  }
  if (value.scope.allow_export && !value.scope.actions.includes("export.create")) {
    context.addIssue({ code: "custom", path: ["scope", "actions"], message: "export.create is required when export is allowed" });
  }
});

export const canonicalReasonCommandSchema = z.object({
  reason_code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,79}$/),
}).strict();

export const canonicalCreateIngestionCaseSchema = z.object({
  capture_route: z.enum(["BROWSER_UPLOAD", "PWA_CAMERA_CAPTURE", "MANUAL_RECORD"]),
  format_profile_ref: z.literal("format-profile-synthetic@0.1"),
  source_descriptor_ref: z.string().min(1).max(200).nullable(),
}).strict();

export const canonicalCommitIngestionReceiptSchema = z.object({
  transfer_ref: z.string().min(1).max(200),
  byte_count: z.number().int().min(0).max(25 * 1024 * 1024),
  content_digest_ref: z.string().min(1).max(200),
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
export type CanonicalCreateAccessGrantInput = z.infer<typeof canonicalCreateAccessGrantSchema>;
export type CanonicalReasonCommandInput = z.infer<typeof canonicalReasonCommandSchema>;
export type CanonicalCreateIngestionCaseInput = z.infer<typeof canonicalCreateIngestionCaseSchema>;
export type CanonicalCommitIngestionReceiptInput = z.infer<typeof canonicalCommitIngestionReceiptSchema>;
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
  fieldRefs: string[];
  edgeRefs: string[];
  actions: WorkspaceAction[];
  startsAt: string;
  expiresAt?: string;
  state: "ACTIVE" | "REVOKED" | "EXPIRED";
  policyVersion: "policy.local-explicit-grant@0.1" | "policy.local-explicit-grant@0.2";
  effect: "ALLOW" | "DENY";
  onwardDelegation: boolean;
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

export interface IngestionCase {
  id: string;
  workspaceId: string;
  acquisitionId: string;
  actorId: string;
  captureRoute: "BROWSER_UPLOAD" | "PWA_CAMERA_CAPTURE" | "MANUAL_RECORD";
  formatProfileRef: "format-profile-synthetic@0.1";
  sourceDescriptorRef: string | null;
  state: "CREATED" | "RECEIVING" | "RECEIVED" | "VALIDATING" | "SAFETY_CHECKING" | "QUARANTINED" | "POLICY_HOLD" | "PROCESSING" | "NEEDS_REVIEW" | "PUBLISHING" | "READY" | "FAILED_RETRYABLE" | "FAILED_TERMINAL" | "CANCELLING" | "CANCELLED" | "DELETION_BLOCKED" | "PURGE_PENDING" | "PURGED";
  artifactId: string | null;
  documentId: string | null;
  mandatoryCheckpointState: string;
  degradationCodes: string[];
  attempts: Array<{ id: string; kind: "CREATE" | "RECEIPT_COMMIT" | "SAFETY_CHECK" | "CANCEL"; outcome: "SUCCEEDED"; correlationId: string; recordedAt: string; byteCount?: number; transferRefHash?: string; digestRefHash?: string }>;
  safetyAssessments?: Array<{ id: string; adapterRef: "synthetic-safety-adapter@0.1"; verdict: "CLEAN" | "MALICIOUS" | "INDETERMINATE" | "SUSPECTED_CLINICAL"; integrityState: "VERIFIED" | "INDETERMINATE"; reasonCode: string; digestRefHash: string; recordedAt: string }>;
  stageRuns?: IngestionStageRun[];
  stageMessageReceipts?: IngestionStageMessageReceipt[];
  deadLetters?: IngestionDeadLetter[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export type IngestionStageId = "VALIDATION" | "SAFETY" | "PROCESSING" | "PUBLICATION";
export type IngestionStageRunState = "RUNNING" | "SUCCEEDED" | "FAILED_RETRYABLE" | "FAILED_TERMINAL" | "CANCELLED" | "SUPERSEDED" | "BLOCKED";

export interface IngestionStageRun {
  id: string;
  stageId: IngestionStageId;
  executionKeyHash: string;
  eventId: string;
  contractVersion: string;
  inputGeneration: string;
  configurationVersion: string;
  replayGeneration: number;
  attempt: number;
  state: IngestionStageRunState;
  leaseOwnerHash: string;
  leaseExpiresAt: string;
  correlationId: string;
  reasonCode: string;
  logicalEffectRef?: string;
  startedAt: string;
  completedAt?: string;
}

export interface IngestionStageMessageReceipt {
  eventId: string;
  executionKeyHash: string;
  messageFingerprint: string;
  expectedRevision: number;
  state: "PENDING" | "APPLIED" | "STALE_RECONCILED";
  runId?: string;
  recordedAt: string;
}

export interface IngestionDeadLetter {
  id: string;
  executionKeyHash: string;
  stageId: IngestionStageId;
  reasonCode: string;
  attemptCount: number;
  state: "OPEN" | "REPAIRED";
  correlationId: string;
  createdAt: string;
  repairedAt?: string;
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
  authorizationEpoch?: number;
  authorizationPhase?: "INPUT" | "CANDIDATE" | "OUTPUT" | "EFFECT";
  decisionReason?: string;
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
  documentId?: string;
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
