import type {
  AccessGrant,
  AuditRecord,
  AuthorizationEpoch,
  DependencyRecord,
  DocumentRecord,
  FactRecord,
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
  aggregateType: "WORKSPACE_AUTHORITY";
  aggregateId: string;
  aggregateRevision: number;
  eventType: string;
  schemaVersion: 1;
  correlationId: string;
  actorId: string;
  resourceType: AuditRecord["resourceType"];
  resourceId?: string;
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
