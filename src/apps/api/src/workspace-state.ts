import type {
  AccessGrant,
  ArtifactAccessGrantRecord,
  ArtifactRecord,
  AuditRecord,
  AuthorizationEpoch,
  DependencyRecord,
  DocumentRecord,
  DocumentVersionRecord,
  FactRecord,
  IngestionCase,
  Member,
  NotificationRecord,
  SubjectIdentityLink,
  SubjectRecord,
  TaskRecord,
  Workspace,
  WorkspaceOwnerBinding,
} from "@document-management/contracts";

export interface WorkspaceActor {
  identityId: string;
  displayName: string;
}

export interface WorkspaceCreationContext {
  purposeId: "PUR-P1-001";
  correlationId: string;
  jurisdictionPackRef: Workspace["jurisdictionPackRef"];
  residencyPolicyRef: Workspace["residencyPolicyRef"];
  configurationVersion: Workspace["configurationVersion"];
  activation: "IMMEDIATE" | "DEFERRED";
}

export interface WorkspaceState {
  workspace: Workspace;
  ownerBindings: WorkspaceOwnerBinding[];
  documents: DocumentRecord[];
  artifacts: ArtifactRecord[];
  documentVersions: DocumentVersionRecord[];
  artifactAccessGrants: ArtifactAccessGrantRecord[];
  facts: FactRecord[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  members: Member[];
  subjects: SubjectRecord[];
  subjectIdentityLinks: SubjectIdentityLink[];
  accessGrants: AccessGrant[];
  authorizationEpoch: AuthorizationEpoch;
  audit: AuditRecord[];
  dependencies: DependencyRecord[];
  ingestionCases: IngestionCase[];
  policyBlockedCases: PolicyBlockedCaseRecord[];
  authorityCommandReceipts: AuthorityCommandReceipt[];
}

export interface PolicyBlockedCaseRecord {
  id: string;
  workspaceId: string;
  caseKind: "WORKSPACE_RECOVERY";
  requestedScope: "ACCOUNT" | "WORKSPACE_OWNERSHIP";
  state: "POLICY_BLOCKED";
  decisionFence: "DEC-038";
  createdAt: string;
  revision: 1;
}

export interface AuthorityCommandReceipt {
  id: string;
  workspaceId: string;
  actorId: string;
  operationId: "API-P1-105" | "API-P1-107" | "API-P1-109" | "API-P1-111" | "API-P1-113" | "API-P1-115" | "API-P1-116" | "API-P1-117" | "API-P1-119" | "API-P1-120" | "API-P1-124" | "API-P1-127" | "API-P1-128" | "API-P1-143" | "API-P1-181";
  idempotencyKeyHash: string;
  requestFingerprint: string;
  resourceId: string;
  resultRevision: number;
  createdAt: string;
}

export interface WorkspaceCreationReceipt {
  identityId: string;
  idempotencyKeyHash: string;
  requestFingerprint: string;
  workspaceId: string;
  createdAt: string;
}

export interface AuthorityOutboxEvent {
  id: string;
  workspaceId: string;
  aggregateType: "WORKSPACE_AUTHORITY" | "IngestionCase" | "ArtifactRecord" | "LogicalDocument";
  aggregateId: string;
  aggregateRevision: number;
  eventType: string;
  schemaVersion: 1;
  correlationId: string;
  actorId: string;
  resourceType: AuditRecord["resourceType"];
  resourceId?: string;
  policyVersion?: string;
  authorizationEpoch?: number;
  authorizationPhase?: AuditRecord["authorizationPhase"];
  decisionReason?: string;
  eventEnvelope?: Record<string, unknown>;
  occurredAt: string;
}

export interface WorkspaceDatabase {
  schemaVersion: 3;
  workspaces: WorkspaceState[];
  workspaceCreationReceipts: WorkspaceCreationReceipt[];
  authorityOutbox: AuthorityOutboxEvent[];
}

export interface WorkspacePersistence {
  read(): Promise<WorkspaceDatabase>;
  mutate<T>(operation: (database: WorkspaceDatabase) => Promise<T> | T): Promise<T>;
  close?(): Promise<void>;
}

export const WORKSPACE_PERSISTENCE = Symbol("WORKSPACE_PERSISTENCE");

/**
 * Expand authority records written before lifecycle history was introduced.
 * This is deliberately additive: stable IDs and prior authority are preserved,
 * and no identity, membership, or grant is inferred from a subject record.
 */
export function normalizeAuthorityLifecycle(state: WorkspaceState): WorkspaceState {
  state.authorityCommandReceipts ??= [];
  state.policyBlockedCases ??= [];
  state.ingestionCases ??= [];
  state.artifacts ??= [];
  state.documentVersions ??= [];
  state.artifactAccessGrants ??= [];
  for (const ingestionCase of state.ingestionCases) {
    ingestionCase.stageRuns ??= [];
    ingestionCase.stageMessageReceipts ??= [];
    ingestionCase.deadLetters ??= [];
  }
  for (const subject of state.subjects ?? []) {
    subject.status ??= "ACTIVE";
    subject.validFrom ??= subject.createdAt;
    subject.recordedAt ??= subject.createdAt;
    subject.history ??= [];
    subject.revision ??= 1;
  }
  for (const member of state.members ?? []) {
    member.validFrom ??= member.createdAt;
    member.recordedAt ??= member.createdAt;
    member.history ??= [];
    member.revision ??= 1;
  }
  const ownerIdentityId = state.ownerBindings?.find((binding) => binding.state === "ACTIVE")?.ownerIdentityId;
  for (const grant of state.accessGrants ?? []) {
    const provenOwnerGrant = grant.grantorIdentityId === ownerIdentityId && grant.granteeIdentityId === ownerIdentityId;
    grant.fieldRefs ??= provenOwnerGrant ? ["*"] : [];
    grant.edgeRefs ??= provenOwnerGrant ? ["*"] : [];
    grant.effect ??= "ALLOW";
  }
  return state;
}
