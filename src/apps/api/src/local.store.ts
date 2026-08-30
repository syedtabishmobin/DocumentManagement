import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional, PreconditionFailedException, UnprocessableEntityException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type {
  Answer,
  AccessGrant,
  AuditRecord,
  AuthorizationEpoch,
  ConnectorDescriptor,
  CanonicalCreateAccessGrantInput,
  CreateSubjectInput,
  DashboardSnapshot,
  DependencyRecord,
  DocumentDetail,
  DocumentRecord,
  FactRecord,
  FilePermissions,
  ManagePersonInput,
  Member,
  NotificationRecord,
  SubjectRecord,
  SubjectIdentityLink,
  TaskRecord,
  Workspace,
  WorkspaceAction,
  WorkspaceOwnerBinding,
  WorkspaceSummary,
} from "@document-management/contracts";
import { classifyDocument, extractProfileFacts, normalizeQuestion } from "@document-management/domain";
import { decisionFence, evaluateAuthorization, type AuthorizationContext, type AuthorizationDecision, type AuthorizationFence, type AuthorizationPhase } from "./authorization.policy.js";
import { PostgresWorkspacePersistence } from "./postgres-workspace.persistence.js";
import {
  normalizeAuthorityLifecycle,
  WORKSPACE_PERSISTENCE,
  type AuthorityOutboxEvent,
  type AuthorityCommandReceipt,
  type WorkspaceActor,
  type WorkspaceDatabase,
  type WorkspaceCreationContext,
  type WorkspacePersistence,
  type WorkspaceState,
} from "./workspace-state.js";

export type { WorkspaceActor } from "./workspace-state.js";

type LegacyWorkspaceDatabase = {
  schemaVersion: 2;
  workspaces: WorkspaceState[];
  workspaceCreationReceipts?: WorkspaceDatabase["workspaceCreationReceipts"];
};

const now = (): string => new Date().toISOString();
const trashDeadline = (deletedAt: string): string => {
  const deadline = new Date(deletedAt);
  deadline.setUTCDate(deadline.getUTCDate() + 30);
  return deadline.toISOString();
};
const defaultPermissions = (owner = false): FilePermissions => ({ view: owner, add: owner, edit: owner, delete: owner });
const subjectHistory = (subject: SubjectRecord, validTo: string): SubjectRecord["history"][number] => ({
  revision: subject.revision, displayName: subject.displayName, kind: subject.kind, relationship: subject.relationship,
  ...(subject.dateOfBirth ? { dateOfBirth: subject.dateOfBirth } : {}), status: subject.status,
  validFrom: subject.validFrom, validTo, recordedAt: subject.recordedAt,
});
const membershipHistory = (member: Member, validTo: string): Member["history"][number] => ({
  revision: member.revision, role: member.role, state: member.state, invitationState: member.invitationState,
  permissions: { ...member.permissions }, validFrom: member.validFrom, validTo, recordedAt: member.recordedAt,
});
const stableId = (prefix: string, ...parts: string[]): string => `${prefix}_${createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 24)}`;
const commandHash = (value: unknown): string => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
function priorCommandReceipt(state: WorkspaceState, actor: WorkspaceActor, operationId: AuthorityCommandReceipt["operationId"], idempotencyKey: string, input: unknown): AuthorityCommandReceipt | undefined {
  const receipt = state.authorityCommandReceipts.find((candidate) => candidate.actorId === actor.identityId && candidate.operationId === operationId && candidate.idempotencyKeyHash === commandHash(idempotencyKey));
  if (receipt && receipt.requestFingerprint !== commandHash({ operationId, input })) throw new ConflictException("This command key was already used for different input");
  return receipt;
}
function appendCommandReceipt(state: WorkspaceState, actor: WorkspaceActor, operationId: AuthorityCommandReceipt["operationId"], idempotencyKey: string, input: unknown, resourceId: string, resultRevision: number): void {
  state.authorityCommandReceipts.push({ id: randomUUID(), workspaceId: state.workspace.id, actorId: actor.identityId, operationId, idempotencyKeyHash: commandHash(idempotencyKey), requestFingerprint: commandHash({ operationId, input }), resourceId, resultRevision, createdAt: now() });
}
const ownerActions: WorkspaceAction[] = [
  "workspace.read", "workspace.admin", "subject.read", "subject.create", "subject.edit", "subject.delete",
  "document.read", "document.create", "document.edit", "document.delete", "fact.review",
  "task.read", "task.create", "task.edit", "connector.read", "export.create", "audit.read",
  "grant.read", "grant.create", "grant.revoke",
];

export function currentWorkspaceConfiguration(): Pick<WorkspaceCreationContext, "jurisdictionPackRef" | "residencyPolicyRef" | "configurationVersion"> {
  return {
    jurisdictionPackRef: "jurisdiction.AU",
    residencyPolicyRef: (process.env.DM_PROFILE ?? "local") === "local" ? "residency.local.synthetic" : "residency.azure.au.synthetic-preview",
    configurationVersion: "configuration.local.synthetic@0.1",
  };
}

export function normalizedCorrelationId(seed?: string): string {
  const candidate = seed?.trim();
  return candidate && /^[A-Za-z0-9._:-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}

function workspaceCreationContext(input?: Partial<WorkspaceCreationContext>): WorkspaceCreationContext {
  const configured = currentWorkspaceConfiguration();
  const context: WorkspaceCreationContext = {
    purposeId: input?.purposeId ?? "PUR-P1-001",
    correlationId: normalizedCorrelationId(input?.correlationId),
    jurisdictionPackRef: input?.jurisdictionPackRef ?? configured.jurisdictionPackRef,
    residencyPolicyRef: input?.residencyPolicyRef ?? configured.residencyPolicyRef,
    configurationVersion: input?.configurationVersion ?? configured.configurationVersion,
    activation: input?.activation ?? "IMMEDIATE",
  };
  if (context.purposeId !== "PUR-P1-001") throw new BadRequestException("Workspace creation requires an approved explicit purpose");
  if (
    context.jurisdictionPackRef !== configured.jurisdictionPackRef ||
    context.residencyPolicyRef !== configured.residencyPolicyRef ||
    context.configurationVersion !== configured.configurationVersion
  ) throw new UnprocessableEntityException("Workspace configuration is unavailable or no longer current");
  return context;
}

function auditRecord(workspaceId: string, actor: WorkspaceActor, type: string, resourceType: AuditRecord["resourceType"], detail: string, resourceId?: string, correlationId: string = randomUUID()): AuditRecord {
  return {
    id: randomUUID(), workspaceId, type, resourceType, ...(resourceId ? { resourceId } : {}),
    actor: actor.displayName, actorId: actor.identityId, action: type, outcome: "SUCCEEDED",
    policyVersion: "policy.local-explicit-grant@0.1", correlationId, detail, at: now(),
  };
}

function advanceAuthorizationEpoch(state: WorkspaceState, cause: AuthorizationEpoch["cause"]): void {
  state.authorizationEpoch = { workspaceId: state.workspace.id, value: state.authorizationEpoch.value + 1, cause, advancedAt: now() };
}

function initialState(actor: WorkspaceActor, name: string, type: Workspace["type"], context: WorkspaceCreationContext): WorkspaceState {
  const createdAt = now();
  const workspaceId = randomUUID();
  const ownerMembershipId = randomUUID();
  const ownerSubjectId = randomUUID();
  const ownerBindingId = randomUUID();
  const ownerGrantId = randomUUID();
  return {
    workspace: {
      id: workspaceId, name, type, status: context.activation === "IMMEDIATE" ? "ACTIVE" : "PENDING_ACTIVATION", ownerBindingId,
      jurisdictionPackRef: context.jurisdictionPackRef, residencyPolicyRef: context.residencyPolicyRef,
      configurationVersion: context.configurationVersion, revision: 1, createdAt,
    },
    ownerBindings: [{ id: ownerBindingId, workspaceId, ownerIdentityId: actor.identityId, ownerMembershipId, authorityBasis: "WORKSPACE_CREATOR", state: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, revision: 1 }],
    documents: [],
    facts: [],
    tasks: [
      {
        id: randomUUID(),
        workspaceId,
        title: "Add your first synthetic document",
        severity: "ACTION",
        state: "OPEN",
        createdAt,
      },
    ],
    notifications: [],
    members: [
      {
        id: ownerMembershipId,
        workspaceId,
        identityId: actor.identityId,
        displayName: actor.displayName,
        role: "OWNER",
        state: "ACTIVE",
        subjectId: ownerSubjectId,
        invitationState: "ACTIVE",
        permissions: defaultPermissions(true),
        validFrom: createdAt,
        recordedAt: createdAt,
        createdAt,
        revision: 1,
        history: [],
      },
    ],
    subjects: [
      {
        id: ownerSubjectId,
        workspaceId,
        displayName: actor.displayName,
        kind: "OWNER",
        relationship: "Self",
        status: "ACTIVE",
        validFrom: createdAt,
        recordedAt: createdAt,
        createdAt,
        revision: 1,
        history: [],
      },
    ],
    subjectIdentityLinks: [{ id: randomUUID(), workspaceId, subjectId: ownerSubjectId, identityId: actor.identityId, evidenceKind: "WORKSPACE_CREATION", state: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, revision: 1 }],
    accessGrants: [{
      id: ownerGrantId, workspaceId, grantorIdentityId: actor.identityId, granteeIdentityId: actor.identityId,
      purposeId: "PUR-P1-001", resourceKind: "WORKSPACE", resourceIds: [workspaceId], actions: ownerActions,
      fieldRefs: ["*"], edgeRefs: ["*"], startsAt: createdAt, state: "ACTIVE", policyVersion: "policy.local-explicit-grant@0.2", effect: "ALLOW", onwardDelegation: false,
      exportAllowed: true, createdAt, revision: 1,
    }],
    authorizationEpoch: { workspaceId, value: 1, cause: "WORKSPACE_CREATED", advancedAt: createdAt },
    audit: [{
      id: randomUUID(), workspaceId, type: "WORKSPACE_CREATED", resourceType: "WORKSPACE", resourceId: workspaceId,
      actor: actor.displayName, actorId: actor.identityId, action: "workspace.create", outcome: "SUCCEEDED",
      policyVersion: "policy.local-explicit-grant@0.1", correlationId: context.correlationId, detail: `Created a ${type.toLowerCase()} workspace`, at: createdAt,
    }],
    dependencies: [],
    authorityCommandReceipts: [],
  };
}

function ensureDocumentIntelligence(state: WorkspaceState): boolean {
  let changed = false;
  state.facts ??= [];
  state.dependencies ??= [];
  const activeDocuments = state.documents.filter((document) => document.status !== "DELETED" && document.status !== "POLICY_HOLD");

  for (const document of activeDocuments) {
    if (document.status === "READY" && document.extractedText) {
      for (const proposal of extractProfileFacts(document.extractedText)) {
        const id = stableId("fact", document.id, proposal.definitionId, proposal.value);
        if (state.facts.some((fact) => fact.id === id)) continue;
        state.facts.push({
          id,
          workspaceId: state.workspace.id,
          documentId: document.id,
          subjectIds: [...document.subjectIds],
          definitionId: proposal.definitionId,
          name: proposal.name,
          value: proposal.value,
          confidence: proposal.confidence,
          reviewState: "PROPOSED",
          evidenceExcerpt: proposal.evidenceExcerpt,
          validFrom: document.createdAt,
          recordedAt: document.updatedAt,
        });
        changed = true;
      }
    }

    const categoryId = stableId("category", document.category.toLowerCase());
    const categoryEdgeId = stableId("dependency", categoryId, document.id, "DOCUMENT_CATEGORY");
    if (!state.dependencies.some((edge) => edge.id === categoryEdgeId)) {
      state.dependencies.push({ id: categoryEdgeId, workspaceId: state.workspace.id, fromType: "CATEGORY", fromId: categoryId, toType: "DOCUMENT", toId: document.id, kind: "DOCUMENT_CATEGORY", label: `Groups under ${document.category}`, evidenceDocumentId: document.id, createdAt: document.createdAt });
      changed = true;
    }
    for (const subjectId of document.subjectIds) {
      const edgeId = stableId("dependency", subjectId, document.id, "DOCUMENT_SUBJECT");
      if (state.dependencies.some((edge) => edge.id === edgeId)) continue;
      state.dependencies.push({ id: edgeId, workspaceId: state.workspace.id, fromType: "SUBJECT", fromId: subjectId, toType: "DOCUMENT", toId: document.id, kind: "DOCUMENT_SUBJECT", label: "Document belongs to", evidenceDocumentId: document.id, createdAt: document.createdAt });
      changed = true;
    }
  }

  for (const fact of state.facts.filter((item) => activeDocuments.some((document) => document.id === item.documentId))) {
    const edgeId = stableId("dependency", fact.documentId, fact.id, "DOCUMENT_CONTAINS_FACT");
    if (state.dependencies.some((edge) => edge.id === edgeId)) continue;
    state.dependencies.push({ id: edgeId, workspaceId: state.workspace.id, fromType: "DOCUMENT", fromId: fact.documentId, toType: "FACT", toId: fact.id, kind: "DOCUMENT_CONTAINS_FACT", label: "Provides evidence for", evidenceDocumentId: fact.documentId, createdAt: fact.recordedAt });
    changed = true;
  }
  return changed;
}

function documentSummary(document: DocumentRecord): DocumentRecord {
  const { extractedText: _content, ...summary } = document;
  if (document.status !== "POLICY_HOLD") return summary;
  return {
    ...summary,
    name: "Restricted document",
    category: "Policy hold",
    mediaType: "application/octet-stream",
    size: 0,
    sha256: "restricted",
    subjectIds: [],
    reviewReason: "This item is isolated and unavailable to ordinary preview, extraction, search and connections.",
  };
}

function normalizeWorkspaceState(input: WorkspaceState): WorkspaceState {
  const state = normalizeAuthorityLifecycle(input);
  state.workspace.status ??= "ACTIVE";
  state.workspace.ownerBindingId ??= randomUUID();
  state.workspace.jurisdictionPackRef ??= "jurisdiction.AU";
  state.workspace.residencyPolicyRef ??= (process.env.DM_PROFILE ?? "local") === "local" ? "residency.local.synthetic" : "residency.azure.au.synthetic-preview";
  state.workspace.configurationVersion ??= "configuration.local.synthetic@0.1";
  state.workspace.revision ??= 1;
  state.subjects ??= [{ id: "sub_local_owner", workspaceId: state.workspace.id, displayName: state.members[0]?.displayName ?? "Local owner", kind: "OWNER", relationship: "Self", status: "ACTIVE", validFrom: state.workspace.createdAt, recordedAt: state.workspace.createdAt, createdAt: state.workspace.createdAt, revision: 1, history: [] }];
  for (const subject of state.subjects) {
    subject.status ??= "ACTIVE";
    subject.validFrom ??= subject.createdAt;
    subject.recordedAt ??= subject.createdAt;
    subject.history ??= [];
    subject.revision ??= 1;
  }
  for (const member of state.members) {
    const fallbackSubjectId = member.role === "OWNER" ? state.subjects.find((subject) => subject.kind === "OWNER")?.id ?? "sub_local_owner" : `sub_member_${member.id}`;
    member.subjectId ??= fallbackSubjectId;
    member.invitationState ??= member.state === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
    member.permissions ??= defaultPermissions(member.role === "OWNER");
    member.validFrom ??= member.createdAt;
    member.recordedAt ??= member.createdAt;
    member.history ??= [];
    member.revision ??= 1;
    if (!state.subjects.some((subject) => subject.id === member.subjectId)) state.subjects.push({ id: member.subjectId, workspaceId: state.workspace.id, displayName: member.displayName, kind: member.role === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: member.role === "GUEST" ? "Guest" : "Family member", status: "ACTIVE", validFrom: member.createdAt, recordedAt: member.createdAt, createdAt: member.createdAt, revision: 1, history: [] });
  }
  state.ownerBindings ??= [];
  state.subjectIdentityLinks ??= [];
  state.accessGrants ??= [];
  state.authorizationEpoch ??= { workspaceId: state.workspace.id, value: 1, cause: "WORKSPACE_CREATED", advancedAt: state.workspace.createdAt };
  state.documents = state.documents.map((document) => ({
    ...document,
    subjectIds: document.subjectIds?.length ? document.subjectIds : [state.subjects[0]!.id],
    captureRoute: document.captureRoute ?? "FILE",
    ...(document.status === "DELETED" && !document.deletedAt ? { deletedAt: document.updatedAt, purgeDueAt: trashDeadline(document.updatedAt), preDeleteStatus: "NEEDS_REVIEW" as const } : {}),
  }));
  state.facts = (state.facts ?? []).map((fact) => {
    const source = state.documents.find((document) => document.id === fact.documentId);
    return {
      ...fact,
      subjectIds: fact.subjectIds?.length ? fact.subjectIds : source?.subjectIds ?? [],
      definitionId: fact.definitionId ?? `fact.legacy.${fact.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      reviewState: fact.reviewState ?? "PROPOSED",
      evidenceExcerpt: fact.evidenceExcerpt ?? "Legacy extracted proposal; open the source document for evidence.",
    };
  });
  state.audit = state.audit.map((entry) => ({
    ...entry,
    workspaceId: entry.workspaceId ?? state.workspace.id,
    resourceType: entry.resourceType ?? (entry.type.startsWith("DOCUMENT") ? "DOCUMENT" : entry.type.startsWith("MEMBER") ? "MEMBERSHIP" : entry.type.startsWith("SUBJECT") ? "PERSON" : "WORKSPACE"),
    actor: entry.actor ?? "Local owner",
    detail: entry.detail ?? entry.type.replaceAll("_", " ").toLowerCase(),
  }));
  ensureDocumentIntelligence(state);
  return state;
}

export function normalizeWorkspaceDatabase(input: WorkspaceDatabase | LegacyWorkspaceDatabase | WorkspaceState): WorkspaceDatabase {
  if ("schemaVersion" in input && (input.schemaVersion === 2 || input.schemaVersion === 3)) {
    return {
      schemaVersion: 3,
      workspaces: input.workspaces.map(normalizeWorkspaceState),
      workspaceCreationReceipts: input.workspaceCreationReceipts ?? [],
      authorityOutbox: "authorityOutbox" in input ? input.authorityOutbox : [],
    };
  }
  return { schemaVersion: 3, workspaces: [normalizeWorkspaceState(input as WorkspaceState)], workspaceCreationReceipts: [], authorityOutbox: [] };
}

function appendAuthorityOutbox(database: WorkspaceDatabase, state: WorkspaceState, audit: AuditRecord): void {
  if (!audit.correlationId || !audit.actorId) throw new Error("Authority audit requires correlation and actor identity before publication");
  database.authorityOutbox.push({
    id: randomUUID(),
    workspaceId: state.workspace.id,
    aggregateType: "WORKSPACE_AUTHORITY",
    aggregateId: state.workspace.id,
    aggregateRevision: state.authorizationEpoch.value,
    eventType: audit.type,
    schemaVersion: 1,
    correlationId: audit.correlationId,
    actorId: audit.actorId,
    resourceType: audit.resourceType,
    ...(audit.resourceId ? { resourceId: audit.resourceId } : {}),
    ...(audit.policyVersion ? { policyVersion: audit.policyVersion } : {}),
    ...(audit.authorizationEpoch !== undefined ? { authorizationEpoch: audit.authorizationEpoch } : {}),
    ...(audit.authorizationPhase ? { authorizationPhase: audit.authorizationPhase } : {}),
    ...(audit.decisionReason ? { decisionReason: audit.decisionReason } : {}),
    occurredAt: audit.at,
  });
}

function recordAuthorityTransition(
  database: WorkspaceDatabase,
  state: WorkspaceState,
  actor: WorkspaceActor,
  type: string,
  resourceType: AuditRecord["resourceType"],
  detail: string,
  resourceId?: string,
  correlationId?: string,
  authorization?: Pick<AuditRecord, "policyVersion" | "authorizationEpoch" | "authorizationPhase" | "decisionReason">,
): void {
  const audit = auditRecord(state.workspace.id, actor, type, resourceType, detail, resourceId, correlationId);
  if (authorization) Object.assign(audit, authorization);
  state.audit.push(audit);
  appendAuthorityOutbox(database, state, audit);
}

function recordAuthorityDenial(
  database: WorkspaceDatabase,
  state: WorkspaceState,
  actor: WorkspaceActor,
  type: string,
  action: WorkspaceAction,
  detail: string,
  correlationId: string,
  authorization: Pick<AuditRecord, "policyVersion" | "authorizationEpoch" | "authorizationPhase" | "decisionReason">,
): void {
  const audit: AuditRecord = {
    id: randomUUID(), workspaceId: state.workspace.id, type, resourceType: "WORKSPACE", resourceId: state.workspace.id,
    actor: actor.displayName, actorId: actor.identityId, action, outcome: "DENIED", correlationId, detail, at: now(),
    ...authorization,
  };
  state.audit.push(audit);
  appendAuthorityOutbox(database, state, audit);
}

@Injectable()
export class LocalStore {
  private readonly root = resolve(process.env.DM_DATA_DIR ?? "./local-data");
  private readonly statePath = join(this.root, "state.json");
  private readonly artifactRoot = join(this.root, "artifacts");
  private writeChain: Promise<unknown> = Promise.resolve();
  private readonly persistence?: WorkspacePersistence;

  constructor(@Optional() @Inject(WORKSPACE_PERSISTENCE) persistence?: WorkspacePersistence) {
    if (persistence) {
      this.persistence = persistence;
      return;
    }
    const adapter = process.env.DM_AUTHORITY_STORE ?? "file";
    if (adapter === "postgres") this.persistence = PostgresWorkspacePersistence.fromEnvironment();
    else if (adapter !== "file") throw new Error(`Unsupported DM_AUTHORITY_STORE value: ${adapter}`);
  }

  private async loadDatabaseRaw(): Promise<WorkspaceDatabase> {
    try {
      return normalizeWorkspaceDatabase(JSON.parse(await readFile(this.statePath, "utf8")) as WorkspaceDatabase | LegacyWorkspaceDatabase | WorkspaceState);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { schemaVersion: 3, workspaces: [], workspaceCreationReceipts: [], authorityOutbox: [] };
    }
  }

  private async saveDatabaseRaw(database: WorkspaceDatabase): Promise<void> {
    await mkdir(dirname(this.statePath), { recursive: true });
    const temporary = `${this.statePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(database, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.statePath);
  }

  private async readDatabase(): Promise<WorkspaceDatabase> {
    if (this.persistence) return this.persistence.read();
    await this.writeChain;
    return this.loadDatabaseRaw();
  }

  private async mutate<T>(operation: (database: WorkspaceDatabase) => Promise<T> | T): Promise<T> {
    if (this.persistence) return this.persistence.mutate(operation);
    const run = this.writeChain.then(async () => {
      const database = await this.loadDatabaseRaw();
      const result = await operation(database);
      await this.saveDatabaseRaw(database);
      return result;
    });
    this.writeChain = run.then(() => undefined, () => undefined);
    return run;
  }

  private state(database: WorkspaceDatabase, workspaceId: string): WorkspaceState {
    const state = database.workspaces.find((candidate) => candidate.workspace.id === workspaceId);
    if (!state) throw new NotFoundException("Workspace not available");
    return state;
  }

  private scopedArtifactPath(workspaceId: string, documentId: string): string {
    return join(this.artifactRoot, workspaceId, documentId);
  }

  private async readArtifact(workspaceId: string, documentId: string): Promise<Buffer> {
    try {
      return await readFile(this.scopedArtifactPath(workspaceId, documentId));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return readFile(join(this.artifactRoot, documentId));
    }
  }

  async listWorkspaces(identityId: string): Promise<WorkspaceSummary[]> {
    const database = await this.readDatabase();
    return database.workspaces
      .filter((state) => state.workspace.status === "ACTIVE" && state.members.some((member) =>
        member.workspaceId === state.workspace.id &&
        member.identityId === identityId &&
        member.state === "ACTIVE",
      ))
      .map(({ workspace }) => ({ id: workspace.id, name: workspace.name, type: workspace.type, status: workspace.status, revision: workspace.revision }));
  }

  async claimLegacyWorkspace(actor: WorkspaceActor): Promise<WorkspaceSummary | undefined> {
    return this.mutate((database) => {
      const candidate = database.workspaces.find((state) => state.ownerBindings.length === 0 && state.members.filter((member) => member.role === "OWNER" && member.state === "ACTIVE").length === 1);
      if (!candidate) return undefined;
      const owner = candidate.members.find((member) => member.role === "OWNER" && member.state === "ACTIVE")!;
      if (owner.identityId && owner.identityId !== actor.identityId) return undefined;
      const subject = candidate.subjects.find((item) => item.id === owner.subjectId)!;
      owner.identityId = actor.identityId;
      owner.displayName = actor.displayName;
      owner.revision += 1;
      subject.displayName = actor.displayName;
      subject.revision += 1;
      const recordedAt = now();
      const binding: WorkspaceOwnerBinding = { id: candidate.workspace.ownerBindingId, workspaceId: candidate.workspace.id, ownerIdentityId: actor.identityId, ownerMembershipId: owner.id, authorityBasis: "WORKSPACE_CREATOR", state: "ACTIVE", validFrom: candidate.workspace.createdAt, recordedAt, revision: 1 };
      candidate.ownerBindings.push(binding);
      candidate.subjectIdentityLinks.push({ id: randomUUID(), workspaceId: candidate.workspace.id, subjectId: subject.id, identityId: actor.identityId, evidenceKind: "WORKSPACE_CREATION", state: "ACTIVE", validFrom: candidate.workspace.createdAt, recordedAt, revision: 1 });
      candidate.accessGrants.push({ id: randomUUID(), workspaceId: candidate.workspace.id, grantorIdentityId: actor.identityId, granteeIdentityId: actor.identityId, purposeId: "PUR-P1-001", resourceKind: "WORKSPACE", resourceIds: [candidate.workspace.id], fieldRefs: ["*"], edgeRefs: ["*"], actions: ownerActions, startsAt: recordedAt, state: "ACTIVE", policyVersion: "policy.local-explicit-grant@0.2", effect: "ALLOW", onwardDelegation: false, exportAllowed: true, createdAt: recordedAt, revision: 1 });
      candidate.authorizationEpoch = { workspaceId: candidate.workspace.id, value: candidate.authorizationEpoch.value + 1, cause: "SECURITY_CHANGED", advancedAt: recordedAt };
      recordAuthorityTransition(database, candidate, actor, "LEGACY_OWNER_LINKED", "MEMBERSHIP", "Linked the existing local owner to the migrated workspace authority records", owner.id);
      return { id: candidate.workspace.id, name: candidate.workspace.name, type: candidate.workspace.type, status: candidate.workspace.status, revision: candidate.workspace.revision };
    });
  }

  async createWorkspace(actor: WorkspaceActor, name: string, type: Workspace["type"], idempotencyKey: string, inputContext?: Partial<WorkspaceCreationContext>): Promise<Workspace> {
    const context = workspaceCreationContext(inputContext);
    const keyHash = createHash("sha256").update(idempotencyKey).digest("hex");
    const fingerprint = createHash("sha256").update(JSON.stringify({
      operationId: "API-P1-101", name, type, purposeId: context.purposeId,
      jurisdictionPackRef: context.jurisdictionPackRef,
      residencyPolicyRef: context.residencyPolicyRef,
      configurationVersion: context.configurationVersion,
    })).digest("hex");
    return this.mutate((database) => {
      const prior = database.workspaceCreationReceipts.find((receipt) => receipt.identityId === actor.identityId && receipt.idempotencyKeyHash === keyHash);
      if (prior) {
        const priorState = this.state(database, prior.workspaceId);
        const legacyFingerprint = createHash("sha256").update(JSON.stringify({ name, type })).digest("hex");
        const compatibleLegacyReceipt = prior.requestFingerprint === legacyFingerprint &&
          priorState.workspace.jurisdictionPackRef === context.jurisdictionPackRef &&
          priorState.workspace.residencyPolicyRef === context.residencyPolicyRef &&
          priorState.workspace.configurationVersion === context.configurationVersion;
        if (prior.requestFingerprint !== fingerprint && !compatibleLegacyReceipt) throw new ConflictException("This workspace request key was already used for different input");
        return priorState.workspace;
      }
      const state = initialState(actor, name, type, context);
      database.workspaces.push(state);
      database.workspaceCreationReceipts.push({ identityId: actor.identityId, idempotencyKeyHash: keyHash, requestFingerprint: fingerprint, workspaceId: state.workspace.id, createdAt: state.workspace.createdAt });
      appendAuthorityOutbox(database, state, state.audit[0]!);
      return state.workspace;
    });
  }

  async activateWorkspace(actor: WorkspaceActor, workspaceId: string, correlationId?: string): Promise<Workspace> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const binding = state.ownerBindings.find((candidate) => candidate.state === "ACTIVE");
      if (!binding || binding.ownerIdentityId !== actor.identityId) throw new NotFoundException("Workspace not available");
      if (state.workspace.status === "ACTIVE") return state.workspace;
      if (state.workspace.status !== "PENDING_ACTIVATION") throw new ConflictException("Workspace cannot be activated from its current state");
      state.workspace.status = "ACTIVE";
      state.workspace.revision += 1;
      const audit = auditRecord(state.workspace.id, actor, "WORKSPACE_ACTIVATED", "WORKSPACE", "Activated workspace after identity binding", state.workspace.id, normalizedCorrelationId(correlationId));
      state.audit.push(audit);
      appendAuthorityOutbox(database, state, audit);
      return state.workspace;
    });
  }

  private async authorizationDecision(actor: WorkspaceActor, context: Omit<AuthorizationContext, "identityId" | "purposeId">, correlationId: string = randomUUID()): Promise<AuthorizationDecision> {
    try {
      return (await this.authorizationDecisions(actor, [context], correlationId))[0]!;
    } catch {
      throw new NotFoundException("Resource not available");
    }
  }

  private async authorizationDecisions(actor: WorkspaceActor, contexts: Array<Omit<AuthorizationContext, "identityId" | "purposeId">>, correlationId: string): Promise<AuthorizationDecision[]> {
    if (!contexts.length) return [];
    const workspaceId = contexts[0]!.workspaceId;
    if (contexts.some((context) => context.workspaceId !== workspaceId)) throw new NotFoundException("Resource not available");
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      return contexts.map((context) => this.recordAuthorizationDecision(database, state, actor, context, correlationId));
    });
  }

  private recordAuthorizationDecision(database: WorkspaceDatabase, state: WorkspaceState, actor: WorkspaceActor, context: Omit<AuthorizationContext, "identityId" | "purposeId">, correlationId: string): AuthorizationDecision {
    const decision = evaluateAuthorization(state, { ...context, identityId: actor.identityId, purposeId: "PUR-P1-001" });
    const audit: AuditRecord = {
      id: randomUUID(), workspaceId: state.workspace.id, type: decision.decision === "ALLOW" ? "AUTHORIZATION_ALLOWED" : "AUTHORIZATION_DENIED",
      resourceType: context.resourceKind === "SUBJECT" ? "PERSON" : context.resourceKind, ...(context.resourceId ? { resourceId: context.resourceId } : {}),
      actor: actor.displayName, actorId: actor.identityId, action: context.action, outcome: decision.decision === "ALLOW" ? "SUCCEEDED" : "DENIED",
      policyVersion: decision.policyVersion, authorizationEpoch: decision.authorizationEpoch, authorizationPhase: decision.phase,
      decisionReason: decision.reason, correlationId, detail: `Current authorization ${decision.decision.toLowerCase()} at ${decision.phase.toLowerCase()} using ${decision.reason}`,
      at: now(),
    };
    state.audit.push(audit); appendAuthorityOutbox(database, state, audit);
    return decision;
  }

  private effectContext(fence: AuthorizationFence): Omit<AuthorizationContext, "identityId" | "purposeId"> {
    return {
      workspaceId: fence.workspaceId, action: fence.action, resourceKind: fence.resourceKind,
      ...(fence.resourceId ? { resourceId: fence.resourceId } : {}), ...(fence.fieldRef ? { fieldRef: fence.fieldRef } : {}),
      ...(fence.edgeRef ? { edgeRef: fence.edgeRef } : {}), expectedAuthorizationEpoch: fence.authorizationEpoch,
      expectedGrantId: fence.grantId, expectedGrantRevision: fence.grantRevision, expectedPolicyVersion: fence.policyVersion,
      phase: "EFFECT",
    };
  }

  private requireEffectAuthorization(database: WorkspaceDatabase, state: WorkspaceState, actor: WorkspaceActor, fence: AuthorizationFence, expected: { action: WorkspaceAction; resourceKind: AuthorizationContext["resourceKind"]; resourceId?: string }, correlationId: string): void {
    if (
      fence.identityId !== actor.identityId || fence.workspaceId !== state.workspace.id || fence.action !== expected.action ||
      fence.resourceKind !== expected.resourceKind || (expected.resourceId !== undefined && fence.resourceId !== expected.resourceId)
    ) throw new NotFoundException("Resource not available");
    const decision = this.recordAuthorizationDecision(database, state, actor, this.effectContext(fence), correlationId);
    if (decision.decision !== "ALLOW") throw new NotFoundException("Resource not available");
  }

  async checkAuthorization(actor: WorkspaceActor, workspaceId: string, action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId?: string, options: { fieldRef?: string; edgeRef?: string; expectedAuthorizationEpoch?: number; expectedGrantId?: string; expectedGrantRevision?: number; expectedPolicyVersion?: AccessGrant["policyVersion"]; phase?: AuthorizationPhase; correlationId?: string } = {}): Promise<AuthorizationDecision> {
    return this.authorizationDecision(actor, {
      workspaceId, action, resourceKind, ...(resourceId ? { resourceId } : {}),
      ...(options.fieldRef ? { fieldRef: options.fieldRef } : {}), ...(options.edgeRef ? { edgeRef: options.edgeRef } : {}),
      ...(options.expectedAuthorizationEpoch !== undefined ? { expectedAuthorizationEpoch: options.expectedAuthorizationEpoch } : {}),
      ...(options.expectedGrantId ? { expectedGrantId: options.expectedGrantId } : {}), ...(options.expectedGrantRevision !== undefined ? { expectedGrantRevision: options.expectedGrantRevision } : {}), ...(options.expectedPolicyVersion ? { expectedPolicyVersion: options.expectedPolicyVersion } : {}),
      ...(options.phase ? { phase: options.phase } : {}),
    }, options.correlationId);
  }

  async checkAuthorizationBatch(actor: WorkspaceActor, contexts: Array<{ workspaceId: string; action: WorkspaceAction; resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK"; resourceId?: string; fieldRef?: string; edgeRef?: string; expectedAuthorizationEpoch?: number; expectedGrantId?: string; expectedGrantRevision?: number; expectedPolicyVersion?: AccessGrant["policyVersion"]; phase?: AuthorizationPhase }>, correlationId: string): Promise<AuthorizationDecision[]> {
    return this.authorizationDecisions(actor, contexts, correlationId);
  }

  async startAuthorization(actor: WorkspaceActor, workspaceId: string, action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId?: string, options: { fieldRef?: string; edgeRef?: string; expectedAuthorizationEpoch?: number; expectedGrantId?: string; expectedGrantRevision?: number; expectedPolicyVersion?: AccessGrant["policyVersion"]; phase?: AuthorizationPhase; correlationId?: string } = {}): Promise<AuthorizationFence> {
    const context: AuthorizationContext = {
      identityId: actor.identityId, workspaceId, purposeId: "PUR-P1-001", action, resourceKind, ...(resourceId ? { resourceId } : {}),
      ...(options.fieldRef ? { fieldRef: options.fieldRef } : {}), ...(options.edgeRef ? { edgeRef: options.edgeRef } : {}),
      ...(options.expectedAuthorizationEpoch !== undefined ? { expectedAuthorizationEpoch: options.expectedAuthorizationEpoch } : {}),
      ...(options.expectedGrantId ? { expectedGrantId: options.expectedGrantId } : {}), ...(options.expectedGrantRevision !== undefined ? { expectedGrantRevision: options.expectedGrantRevision } : {}), ...(options.expectedPolicyVersion ? { expectedPolicyVersion: options.expectedPolicyVersion } : {}),
      ...(options.phase ? { phase: options.phase } : {}),
    };
    const decision = await this.authorizationDecision(actor, context, options.correlationId);
    const fence = decisionFence(context, decision);
    if (!fence) throw new NotFoundException("Resource not available");
    return fence;
  }

  async requireAuthorization(actor: WorkspaceActor, workspaceId: string, action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId?: string, options: { fieldRef?: string; edgeRef?: string; expectedAuthorizationEpoch?: number; expectedGrantId?: string; expectedGrantRevision?: number; expectedPolicyVersion?: AccessGrant["policyVersion"]; phase?: AuthorizationPhase; correlationId?: string } = {}): Promise<void> {
    await this.startAuthorization(actor, workspaceId, action, resourceKind, resourceId, options);
  }

  async reauthorize(fence: AuthorizationFence, actor: WorkspaceActor, phase: Extract<AuthorizationPhase, "OUTPUT" | "EFFECT">, correlationId?: string): Promise<AuthorizationFence> {
    if (actor.identityId !== fence.identityId) throw new NotFoundException("Resource not available");
    return this.startAuthorization(actor, fence.workspaceId, fence.action, fence.resourceKind, fence.resourceId, {
      ...(fence.fieldRef ? { fieldRef: fence.fieldRef } : {}), ...(fence.edgeRef ? { edgeRef: fence.edgeRef } : {}),
      expectedAuthorizationEpoch: fence.authorizationEpoch, expectedGrantId: fence.grantId, expectedGrantRevision: fence.grantRevision, expectedPolicyVersion: fence.policyVersion,
      phase, ...(correlationId ? { correlationId } : {}),
    });
  }

  async reauthorizeBatch(fences: AuthorizationFence[], actor: WorkspaceActor, phase: Extract<AuthorizationPhase, "OUTPUT" | "EFFECT">, correlationId: string): Promise<AuthorizationFence[]> {
    if (fences.some((fence) => fence.identityId !== actor.identityId)) throw new NotFoundException("Resource not available");
    const decisions = await this.authorizationDecisions(actor, fences.map((fence) => ({
      workspaceId: fence.workspaceId, action: fence.action, resourceKind: fence.resourceKind,
      ...(fence.resourceId ? { resourceId: fence.resourceId } : {}), ...(fence.fieldRef ? { fieldRef: fence.fieldRef } : {}),
      ...(fence.edgeRef ? { edgeRef: fence.edgeRef } : {}), expectedAuthorizationEpoch: fence.authorizationEpoch,
      expectedGrantId: fence.grantId, expectedGrantRevision: fence.grantRevision, expectedPolicyVersion: fence.policyVersion, phase,
    })), correlationId);
    const renewed = decisions.map((decision, index) => decisionFence({
      identityId: actor.identityId, workspaceId: fences[index]!.workspaceId, purposeId: "PUR-P1-001", action: fences[index]!.action,
      resourceKind: fences[index]!.resourceKind, ...(fences[index]!.resourceId ? { resourceId: fences[index]!.resourceId } : {}),
      ...(fences[index]!.fieldRef ? { fieldRef: fences[index]!.fieldRef } : {}), ...(fences[index]!.edgeRef ? { edgeRef: fences[index]!.edgeRef } : {}), phase,
    }, decision));
    if (renewed.some((fence) => !fence)) throw new NotFoundException("Resource not available");
    return renewed as AuthorizationFence[];
  }

  async dashboard(workspaceId: string): Promise<DashboardSnapshot> {
    const { workspace, documents, facts, tasks, notifications, members, subjects, audit, dependencies, accessGrants, authorizationEpoch } = this.state(await this.readDatabase(), workspaceId);
    const activeIds = new Set(documents.filter((document) => document.status !== "DELETED" && document.status !== "POLICY_HOLD").map((document) => document.id));
    return {
      workspace,
      documents: documents.map(documentSummary),
      facts: facts.filter((fact) => activeIds.has(fact.documentId)),
      tasks,
      notifications,
      members,
      subjects: subjects.filter((subject) => subject.status === "ACTIVE"),
      audit: [...audit].reverse(),
      dependencies: dependencies.filter((edge) => activeIds.has(edge.evidenceDocumentId)),
      accessGrants,
      authorizationEpoch,
      localMode: (process.env.DM_PROFILE ?? "local") === "local",
      customerDataPolicy: (process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "production-gated" ? "production-gated" : "synthetic-only",
    };
  }

  async authorizedDashboard(workspaceId: string, actor: WorkspaceActor, containerFence: AuthorizationFence, correlationId: string): Promise<DashboardSnapshot> {
    if (containerFence.workspaceId !== workspaceId || containerFence.action !== "workspace.read" || containerFence.resourceKind !== "WORKSPACE" || containerFence.resourceId !== workspaceId) throw new NotFoundException("Resource not available");
    await this.reauthorize(containerFence, actor, "OUTPUT", correlationId);
    const epoch = containerFence.authorizationEpoch;
    const snapshot = await this.dashboard(workspaceId);
    const request = (action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId: string, fieldRef?: string, edgeRef?: string) => ({ workspaceId, action, resourceKind, resourceId, ...(fieldRef ? { fieldRef } : {}), ...(edgeRef ? { edgeRef } : {}), expectedAuthorizationEpoch: epoch, phase: "OUTPUT" as const });
    const key = (context: ReturnType<typeof request>) => JSON.stringify([context.action, context.resourceKind, context.resourceId, context.fieldRef ?? "", context.edgeRef ?? ""]);
    const evaluateBatch = async (contexts: Array<ReturnType<typeof request>>) => {
      const decisions = await this.checkAuthorizationBatch(actor, contexts, correlationId);
      return new Map(contexts.map((context, index) => [key(context), decisions[index]!.decision === "ALLOW"]));
    };
    const documentRequests = snapshot.documents.map((document) => request("document.read", "DOCUMENT", document.id));
    const documentAllowed = await evaluateBatch(documentRequests);
    const documents = snapshot.documents.filter((document) => documentAllowed.get(key(request("document.read", "DOCUMENT", document.id))));
    const documentIds = new Set(documents.map((document) => document.id));
    const factCandidates = snapshot.facts.filter((fact) => documentIds.has(fact.documentId));
    const dependencyCandidates = snapshot.dependencies.filter((edge) => documentIds.has(edge.evidenceDocumentId));
    const detailRequests = [
      ...factCandidates.flatMap((fact) => [request("document.read", "DOCUMENT", fact.documentId, "fact.value"), request("document.read", "DOCUMENT", fact.documentId, "fact.evidence")]),
      ...dependencyCandidates.map((edge) => request("document.read", "DOCUMENT", edge.evidenceDocumentId, undefined, `dependency.${edge.kind}`)),
      ...snapshot.tasks.map((task) => request("task.read", "TASK", task.id, "task.detail")),
      request("subject.read", "WORKSPACE", workspaceId, "subject.profile"), request("workspace.admin", "WORKSPACE", workspaceId, "membership.profile"),
      request("workspace.read", "WORKSPACE", workspaceId, "notification.detail"), request("audit.read", "WORKSPACE", workspaceId, "audit.detail"), request("grant.read", "WORKSPACE", workspaceId, "grant.scope"),
    ];
    const detailAllowed = await evaluateBatch(detailRequests);
    const isAllowed = (context: ReturnType<typeof request>) => detailAllowed.get(key(context)) === true;
    const facts = factCandidates.filter((fact) => isAllowed(request("document.read", "DOCUMENT", fact.documentId, "fact.value")) && isAllowed(request("document.read", "DOCUMENT", fact.documentId, "fact.evidence")));
    const dependencies = dependencyCandidates.filter((edge) => isAllowed(request("document.read", "DOCUMENT", edge.evidenceDocumentId, undefined, `dependency.${edge.kind}`)));
    const tasks = snapshot.tasks.filter((task) => isAllowed(request("task.read", "TASK", task.id, "task.detail")));
    const subjectsVisible = isAllowed(request("subject.read", "WORKSPACE", workspaceId, "subject.profile"));
    const membersVisible = isAllowed(request("workspace.admin", "WORKSPACE", workspaceId, "membership.profile"));
    const notificationsVisible = isAllowed(request("workspace.read", "WORKSPACE", workspaceId, "notification.detail"));
    const auditVisible = isAllowed(request("audit.read", "WORKSPACE", workspaceId, "audit.detail"));
    const grantsVisible = isAllowed(request("grant.read", "WORKSPACE", workspaceId, "grant.scope"));
    return {
      ...snapshot, documents, facts, dependencies, tasks,
      notifications: notificationsVisible ? snapshot.notifications : [], members: membersVisible ? snapshot.members : [], subjects: subjectsVisible ? snapshot.subjects : [],
      audit: auditVisible ? snapshot.audit : [], accessGrants: grantsVisible ? snapshot.accessGrants : [],
    };
  }

  async addDocument(workspaceId: string, actor: WorkspaceActor, file: Express.Multer.File, subjectIds: string[], captureRoute: DocumentRecord["captureRoute"], fence: AuthorizationFence, correlationId: string): Promise<DocumentRecord> {
    return this.mutate(async (database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "document.create", resourceKind: "WORKSPACE" }, correlationId);
      if (!subjectIds.length || subjectIds.some((subjectId) => !state.subjects.some((subject) => subject.id === subjectId && subject.status === "ACTIVE"))) {
        throw new BadRequestException("Select at least one valid household person for this document");
      }
      const digest = createHash("sha256").update(file.buffer).digest("hex");
      const duplicate = state.documents.find((item) => item.sha256 === digest && item.status !== "DELETED");
      if (duplicate) return duplicate;

      const id = randomUUID();
      const textual = /^(text\/|application\/(json|xml))/.test(file.mimetype);
      const extractedText = textual ? file.buffer.toString("utf8").slice(0, 500_000) : "";
      const classification = classifyDocument(file.originalname, extractedText);
      const createdAt = now();
      const document: DocumentRecord = {
        id,
        workspaceId: state.workspace.id,
        name: file.originalname,
        mediaType: file.mimetype || "application/octet-stream",
        size: file.size,
        sha256: digest,
        status: classification.policyHold ? "POLICY_HOLD" : textual ? "READY" : "NEEDS_REVIEW",
        category: classification.category,
        version: 1,
        createdAt,
        updatedAt: createdAt,
        subjectIds,
        captureRoute,
        ...(extractedText ? { extractedText } : {}),
        ...(!textual && !classification.policyHold ? { reviewReason: "Local text extraction is not yet available for this format." } : {}),
        ...(classification.policyHold ? { reviewReason: "Suspected clinical content is isolated by policy." } : {}),
      };

      const artifactPath = this.scopedArtifactPath(workspaceId, id);
      await mkdir(dirname(artifactPath), { recursive: true, mode: 0o700 });
      await writeFile(artifactPath, file.buffer, { mode: 0o600, flag: "wx" });
      state.documents.push(document);
      ensureDocumentIntelligence(state);
      state.notifications.unshift({
        id: randomUUID(),
        workspaceId: state.workspace.id,
        title: classification.policyHold ? "Document quarantined" : "Document added",
        detail: classification.policyHold ? `${file.originalname} requires review before processing.` : `${file.originalname} is stored locally.`,
        severity: classification.policyHold ? "IMPORTANT" : "INFO",
        read: false,
        createdAt,
      });
      state.audit.push(auditRecord(state.workspace.id, actor, "DOCUMENT_INGESTED", "DOCUMENT", `Added a document using ${captureRoute.toLowerCase()} capture`, id));
      return document;
    });
  }

  async documentDetail(workspaceId: string, id: string, actor: WorkspaceActor, fence: AuthorizationFence, correlationId: string): Promise<DocumentDetail> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const document = state.documents.find((item) => item.id === id);
    if (!document || document.status === "DELETED") throw new NotFoundException("Document not found");
    if (document.status === "POLICY_HOLD") throw new BadRequestException("This item is isolated and cannot be previewed in the ordinary document view");
    await this.reauthorize(fence, actor, "OUTPUT", correlationId);
    const contentDecision = await this.checkAuthorization(actor, workspaceId, "document.read", "DOCUMENT", id, { fieldRef: "document.content", expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "OUTPUT", correlationId });
    const factDecision = await this.checkAuthorization(actor, workspaceId, "document.read", "DOCUMENT", id, { fieldRef: "fact.value", expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "OUTPUT", correlationId });
    const evidenceDecision = await this.checkAuthorization(actor, workspaceId, "document.read", "DOCUMENT", id, { fieldRef: "fact.evidence", expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "OUTPUT", correlationId });
    const artifactUrl = `/api/documents/${document.id}/artifact`;
    const preview: DocumentDetail["preview"] = contentDecision.decision !== "ALLOW"
      ? { kind: "UNAVAILABLE", message: "Preview is unavailable for the current access scope." }
      : document.extractedText
      ? { kind: "TEXT", text: document.extractedText.slice(0, 100_000), artifactUrl }
      : document.mediaType.startsWith("image/")
        ? { kind: "IMAGE", artifactUrl }
        : document.mediaType === "application/pdf"
          ? { kind: "PDF", artifactUrl }
          : { kind: "UNAVAILABLE", artifactUrl, message: "A safe inline preview is not available for this format. You can open the exact local original." };
    return {
      document: documentSummary(document),
      facts: factDecision.decision === "ALLOW" && evidenceDecision.decision === "ALLOW" ? state.facts.filter((fact) => fact.documentId === document.id) : [],
      dependencies: (await Promise.all(state.dependencies.filter((edge) => edge.evidenceDocumentId === document.id).map(async (edge) => ({ edge, decision: await this.checkAuthorization(actor, workspaceId, "document.read", "DOCUMENT", id, { edgeRef: `dependency.${edge.kind}`, expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "OUTPUT", correlationId }) })))).filter(({ decision }) => decision.decision === "ALLOW").map(({ edge }) => edge),
      preview,
    };
  }

  async documentArtifact(workspaceId: string, id: string, actor: WorkspaceActor, fence: AuthorizationFence, correlationId: string): Promise<{ buffer: Buffer; mediaType: string; name: string }> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const document = state.documents.find((item) => item.id === id);
    if (!document || document.status === "DELETED") throw new NotFoundException("Document not found");
    if (document.status === "POLICY_HOLD") throw new BadRequestException("This item is isolated and cannot be opened");
    await this.reauthorize(fence, actor, "OUTPUT", correlationId);
    await this.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", id, { fieldRef: "document.content", expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "OUTPUT", correlationId });
    return { buffer: await this.readArtifact(workspaceId, id), mediaType: document.mediaType, name: document.name };
  }

  async reviewFact(workspaceId: string, actor: WorkspaceActor, id: string, fence: AuthorizationFence, correlationId: string): Promise<FactRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "fact.review", resourceKind: "WORKSPACE" }, correlationId);
      const fact = state.facts.find((item) => item.id === id);
      if (!fact) throw new NotFoundException("Extracted detail not found");
      const document = state.documents.find((item) => item.id === fact.documentId);
      if (!document || document.status !== "READY") throw new BadRequestException("The source document is not available for fact review");
      fact.reviewState = "REVIEWED";
      fact.recordedAt = now();
      state.audit.push(auditRecord(state.workspace.id, actor, "FACT_REVIEWED", "DOCUMENT", "Reviewed an evidence-linked profile detail", fact.documentId));
      return fact;
    });
  }

  async addManualDocument(workspaceId: string, actor: WorkspaceActor, input: { name: string; content: string; subjectIds: string[] }, fence: AuthorizationFence, correlationId: string): Promise<DocumentRecord> {
    const buffer = Buffer.from(input.content, "utf8");
    return this.addDocument(workspaceId, actor, { originalname: `${input.name}.txt`, mimetype: "text/plain", size: buffer.byteLength, buffer } as Express.Multer.File, input.subjectIds, "MANUAL", fence, correlationId);
  }

  async addSubject(workspaceId: string, actor: WorkspaceActor, input: CreateSubjectInput, fence: AuthorizationFence, correlationId: string): Promise<SubjectRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "subject.create", resourceKind: "WORKSPACE" }, correlationId);
      if (input.kind === "OWNER") throw new BadRequestException("Additional owner subjects and ownership transfer are unavailable");
      const createdAt = now();
      const subject: SubjectRecord = {
        id: randomUUID(), workspaceId: state.workspace.id, displayName: input.displayName, kind: input.kind,
        relationship: input.relationship, ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}), status: "ACTIVE",
        validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [],
      };
      state.subjects.push(subject);
      recordAuthorityTransition(database, state, actor, "SUBJECT_CREATED", "PERSON", "Added a person to the household", subject.id);
      return subject;
    });
  }

  connectorCatalogue(): ConnectorDescriptor[] {
    const enabled = process.env.DM_EXTERNAL_CONNECTORS === "enabled" && process.env.DM_CONNECTOR_ADAPTERS_READY === "true";
    const publicBaseUrl = process.env.DM_PUBLIC_BASE_URL?.replace(/\/$/, "");
    const secretConfigured = (secretVariable: string, markerVariable: string) => Boolean(process.env[secretVariable] || process.env[markerVariable] === "true");
    const descriptor = (item: Omit<ConnectorDescriptor, "status">, configured: boolean): ConnectorDescriptor => ({
      ...item,
      status: !configured ? "REQUIRES_CONFIGURATION" : enabled ? "READY_TO_CONNECT" : "CONFIGURED_DISABLED",
    });
    const callback = (path: string) => publicBaseUrl ? `${publicBaseUrl}${path}` : undefined;
    return [
      descriptor({ id: "EMAIL_FORWARDING", name: "Private email address", consentPurpose: "Receive documents sent to a unique household ingestion address.", permissionSummary: "Inbound messages and attachments only; no mailbox access.", requiredConfiguration: ["DM_INBOUND_EMAIL_DOMAIN", "DM_EMAIL_WEBHOOK_SECRET"] }, Boolean(process.env.DM_INBOUND_EMAIL_DOMAIN && process.env.DM_EMAIL_WEBHOOK_SECRET)),
      descriptor({ id: "GMAIL", name: "Gmail", consentPurpose: "Let you select email attachments to import into your household vault.", permissionSummary: "Read-only Gmail access with user selection; no send, edit or delete permission.", requiredConfiguration: ["DM_GOOGLE_CLIENT_ID", "google-documents-client-secret", "DM_PUBLIC_BASE_URL"], callbackUrl: callback("/api/connectors/gmail/callback") }, Boolean(process.env.DM_GOOGLE_CLIENT_ID && secretConfigured("DM_GOOGLE_CLIENT_SECRET", "DM_GOOGLE_CLIENT_SECRET_CONFIGURED") && publicBaseUrl)),
      descriptor({ id: "GOOGLE_DRIVE", name: "Google Drive", consentPurpose: "Let you choose specific Drive files to import.", permissionSummary: "Per-file selection using the narrowest supported Drive scope.", requiredConfiguration: ["DM_GOOGLE_CLIENT_ID", "google-documents-client-secret", "DM_PUBLIC_BASE_URL"], callbackUrl: callback("/api/connectors/google-drive/callback") }, Boolean(process.env.DM_GOOGLE_CLIENT_ID && secretConfigured("DM_GOOGLE_CLIENT_SECRET", "DM_GOOGLE_CLIENT_SECRET_CONFIGURED") && publicBaseUrl)),
      descriptor({ id: "ONEDRIVE", name: "Microsoft OneDrive", consentPurpose: "Let you select OneDrive documents to import.", permissionSummary: "Delegated, read-only file access with explicit Microsoft consent.", requiredConfiguration: ["DM_MICROSOFT_CLIENT_ID", "microsoft-documents-client-secret", "DM_MICROSOFT_TENANT", "DM_PUBLIC_BASE_URL"], callbackUrl: callback("/api/connectors/onedrive/callback") }, Boolean(process.env.DM_MICROSOFT_CLIENT_ID && secretConfigured("DM_MICROSOFT_CLIENT_SECRET", "DM_MICROSOFT_CLIENT_SECRET_CONFIGURED") && process.env.DM_MICROSOFT_TENANT && publicBaseUrl)),
      descriptor({ id: "DROPBOX", name: "Dropbox", consentPurpose: "Let you choose Dropbox files to import.", permissionSummary: "Scoped read access; tokens can be revoked by disconnecting.", requiredConfiguration: ["DM_DROPBOX_APP_KEY", "dropbox-connector-app-secret", "DM_PUBLIC_BASE_URL"], callbackUrl: callback("/api/connectors/dropbox/callback") }, Boolean(process.env.DM_DROPBOX_APP_KEY && secretConfigured("DM_DROPBOX_APP_SECRET", "DM_DROPBOX_APP_SECRET_CONFIGURED") && publicBaseUrl)),
      descriptor({ id: "BOX", name: "Box", consentPurpose: "Let you choose Box files to import.", permissionSummary: "User-authorized read access with an exact callback URL.", requiredConfiguration: ["DM_BOX_CLIENT_ID", "box-connector-client-secret", "DM_PUBLIC_BASE_URL"], callbackUrl: callback("/api/connectors/box/callback") }, Boolean(process.env.DM_BOX_CLIENT_ID && secretConfigured("DM_BOX_CLIENT_SECRET", "DM_BOX_CLIENT_SECRET_CONFIGURED") && publicBaseUrl)),
    ];
  }

  async ask(workspaceId: string, actor: WorkspaceActor, fence: AuthorizationFence, question: string, documentIds?: string[], correlationId: string = randomUUID()): Promise<Answer> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const tokens = normalizeQuestion(question);
    const candidates = state.documents.filter(
      (document) =>
        document.status === "READY" &&
        document.extractedText &&
        (!documentIds || documentIds.length === 0 || documentIds.includes(document.id)),
    );
    const allowed = (await Promise.all(candidates.map(async (document) => {
      const resource = await this.checkAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id, { expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "CANDIDATE", correlationId });
      const content = resource.decision === "ALLOW" ? await this.checkAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id, { fieldRef: "document.content", expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "CANDIDATE", correlationId }) : resource;
      return { document, allowed: resource.decision === "ALLOW" && content.decision === "ALLOW" };
    }))).filter((candidate) => candidate.allowed).map((candidate) => candidate.document);
    const scored = allowed
      .map((document) => {
        const lines = document.extractedText!.split(/\r?\n/).filter(Boolean);
        const matches = lines
          .map((line) => ({ line, score: tokens.filter((token) => line.toLowerCase().includes(token)).length }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);
        return { document, matches, score: matches.reduce((total, entry) => total + entry.score, 0) };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (scored.length === 0) {
      await this.reauthorize(fence, actor, "OUTPUT", correlationId);
      return {
        answer: "I could not find enough evidence in the locally indexed documents to answer that question.",
        citations: [],
        confidence: "LOW",
        mode: "LOCAL_DETERMINISTIC",
      };
    }

    const citations = scored.flatMap(({ document, matches }) =>
      matches.map(({ line }) => ({ documentId: document.id, documentName: document.name, excerpt: line.slice(0, 360) })),
    );
    await this.reauthorize(fence, actor, "OUTPUT", correlationId);
    for (const citation of citations) await this.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", citation.documentId, { fieldRef: "document.content", expectedAuthorizationEpoch: fence.authorizationEpoch, phase: "OUTPUT", correlationId });
    return {
      answer: `The strongest local evidence says: ${citations.map((citation) => citation.excerpt).join(" ")}`,
      citations,
      confidence: scored[0]!.score >= 3 ? "HIGH" : "MEDIUM",
      mode: "LOCAL_DETERMINISTIC",
    };
  }

  async addMember(workspaceId: string, actor: WorkspaceActor, displayName: string, role: Member["role"], fence: AuthorizationFence, correlationId: string): Promise<Member> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "workspace.admin", resourceKind: "WORKSPACE" }, correlationId);
      if (role === "OWNER") throw new BadRequestException("Ownership transfer is unavailable");
      const createdAt = now();
      const subject: SubjectRecord = { id: randomUUID(), workspaceId: state.workspace.id, displayName, kind: role === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: "Family member", status: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
      state.subjects.push(subject);
      const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName, role, state: "ACTIVE", invitationState: "PENDING", permissions: defaultPermissions(), validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
      state.members.push(member);
      advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "MEMBERSHIP_INVITATION_PREPARED", "MEMBERSHIP", "Prepared membership without fabricating an identity or active resource grant", member.id);
      return member;
    });
  }

  async listSubjects(workspaceId: string): Promise<SubjectRecord[]> {
    const state = this.state(await this.readDatabase(), workspaceId);
    return state.subjects.filter((subject) => subject.status === "ACTIVE");
  }

  async subjectCollection(workspaceId: string, actorId: string): Promise<{ items: SubjectRecord[]; policyEpoch: number; grantEquivalence: string; sourceWatermark: string }> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const grants = state.accessGrants.filter((grant) => grant.state === "ACTIVE" && grant.granteeIdentityId === actorId).map((grant) => ({ resourceKind: grant.resourceKind, resourceIds: [...grant.resourceIds].sort(), fieldRefs: [...grant.fieldRefs].sort(), edgeRefs: [...grant.edgeRefs].sort(), actions: [...grant.actions].sort(), purposeId: grant.purposeId, policyVersion: grant.policyVersion, effect: grant.effect, expiresAt: grant.expiresAt ?? null, revision: grant.revision })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    return { items: state.subjects.filter((subject) => subject.status === "ACTIVE"), policyEpoch: state.authorizationEpoch.value, grantEquivalence: commandHash(grants), sourceWatermark: state.audit.at(-1)?.id ?? "workspace-created" };
  }

  async getSubject(workspaceId: string, subjectId: string): Promise<SubjectRecord> {
    const subject = (await this.listSubjects(workspaceId)).find((candidate) => candidate.id === subjectId);
    if (!subject) throw new NotFoundException("Resource not available");
    return subject;
  }

  async listMemberships(workspaceId: string): Promise<Member[]> {
    const state = this.state(await this.readDatabase(), workspaceId);
    return state.members.filter((member) => member.state === "ACTIVE");
  }

  async membershipCollection(workspaceId: string, actorId: string): Promise<{ items: Member[]; policyEpoch: number; grantEquivalence: string; sourceWatermark: string }> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const grants = state.accessGrants.filter((grant) => grant.state === "ACTIVE" && grant.granteeIdentityId === actorId).map((grant) => ({ resourceKind: grant.resourceKind, resourceIds: [...grant.resourceIds].sort(), fieldRefs: [...grant.fieldRefs].sort(), edgeRefs: [...grant.edgeRefs].sort(), actions: [...grant.actions].sort(), purposeId: grant.purposeId, policyVersion: grant.policyVersion, effect: grant.effect, expiresAt: grant.expiresAt ?? null, revision: grant.revision })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    return { items: state.members.filter((member) => member.state === "ACTIVE"), policyEpoch: state.authorizationEpoch.value, grantEquivalence: commandHash(grants), sourceWatermark: state.audit.at(-1)?.id ?? "workspace-created" };
  }

  async accessGrantCollection(workspaceId: string, actorId: string): Promise<{ items: AccessGrant[]; policyEpoch: number; grantEquivalence: string; sourceWatermark: string }> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const visible = state.accessGrants.filter((grant) => grant.grantorIdentityId === actorId || grant.granteeIdentityId === actorId || state.ownerBindings.some((binding) => binding.state === "ACTIVE" && binding.ownerIdentityId === actorId));
    const equivalence = visible.map((grant) => ({ id: grant.id, revision: grant.revision, state: grant.state, policyVersion: grant.policyVersion })).sort((left, right) => left.id.localeCompare(right.id));
    return { items: visible, policyEpoch: state.authorizationEpoch.value, grantEquivalence: commandHash(equivalence), sourceWatermark: state.audit.at(-1)?.id ?? "workspace-created" };
  }

  async getAccessGrant(workspaceId: string, grantId: string, actorId: string): Promise<AccessGrant> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const grant = state.accessGrants.find((candidate) => candidate.id === grantId);
    const visible = grant && (grant.grantorIdentityId === actorId || grant.granteeIdentityId === actorId || state.ownerBindings.some((binding) => binding.state === "ACTIVE" && binding.ownerIdentityId === actorId));
    if (!visible || !grant) throw new NotFoundException("Resource not available");
    return grant;
  }

  private resourceKindForRefs(state: WorkspaceState, refs: string[]): AccessGrant["resourceKind"] | undefined {
    const kinds = new Set(refs.map((ref) => ref === state.workspace.id ? "WORKSPACE" : state.documents.some((item) => item.id === ref && item.status !== "DELETED") ? "DOCUMENT" : state.subjects.some((item) => item.id === ref && item.status === "ACTIVE") ? "SUBJECT" : state.tasks.some((item) => item.id === ref) ? "TASK" : "UNKNOWN"));
    if (kinds.size !== 1 || kinds.has("UNKNOWN")) return undefined;
    return [...kinds][0] as AccessGrant["resourceKind"];
  }

  async createAccessGrant(workspaceId: string, actor: WorkspaceActor, idempotencyKey: string, input: CanonicalCreateAccessGrantInput, fence: AuthorizationFence, correlationId: string): Promise<AccessGrant> {
    const result = await this.mutate((database): AccessGrant | "NOT_AVAILABLE" => {
      const state = this.state(database, workspaceId);
      if (fence.identityId !== actor.identityId || fence.workspaceId !== workspaceId || fence.action !== "grant.create" || fence.resourceKind !== "WORKSPACE") return "NOT_AVAILABLE";
      const effectDecision = this.recordAuthorizationDecision(database, state, actor, this.effectContext(fence), correlationId);
      if (effectDecision.decision !== "ALLOW") return "NOT_AVAILABLE";
      const ownerBinding = state.ownerBindings.find((binding) => binding.state === "ACTIVE" && binding.ownerIdentityId === actor.identityId);
      const authorizingGrant = state.accessGrants.find((grant) => grant.id === fence.grantId && grant.revision === fence.grantRevision && grant.state === "ACTIVE" && grant.policyVersion === fence.policyVersion);
      const ownerAuthoritySource = ownerBinding
        && authorizingGrant?.grantorIdentityId === actor.identityId
        && authorizingGrant.granteeIdentityId === actor.identityId
        && authorizingGrant.resourceKind === "WORKSPACE"
        && authorizingGrant.resourceIds.includes(workspaceId);
      if (!ownerAuthoritySource) {
        recordAuthorityDenial(
          database,
          state,
          actor,
          "ACCESS_GRANT_CREATION_DENIED",
          "grant.create",
          "Denied grant creation because the current Phase 1 authority source does not permit onward delegation",
          correlationId,
          {
            policyVersion: effectDecision.policyVersion,
            authorizationEpoch: effectDecision.authorizationEpoch,
            authorizationPhase: "EFFECT",
            decisionReason: "ONWARD_DELEGATION_NOT_PERMITTED",
          },
        );
        return "NOT_AVAILABLE";
      }
      const receipt = priorCommandReceipt(state, actor, "API-P1-113", idempotencyKey, input);
      if (receipt) return state.accessGrants.find((grant) => grant.id === receipt.resourceId) ?? (() => { throw new ConflictException("The prior command result is unavailable"); })();
      const recipient = state.members.find((member) => member.identityId === input.grantee_ref && member.state === "ACTIVE" && member.invitationState === "ACTIVE");
      const resourceKind = this.resourceKindForRefs(state, input.scope.resource_refs);
      if (!recipient || !resourceKind) throw new UnprocessableEntityException("Grant scope or recipient is unavailable");
      for (const resourceRef of input.scope.resource_refs) {
        for (const action of input.scope.actions) {
          const base = { identityId: actor.identityId, workspaceId, purposeId: "PUR-P1-001" as const, action, resourceKind, resourceId: resourceRef, phase: "EFFECT" as const };
          if (evaluateAuthorization(state, base).decision !== "ALLOW") throw new UnprocessableEntityException("Grant exceeds current issuer authority");
          for (const fieldRef of input.scope.field_refs) if (evaluateAuthorization(state, { ...base, fieldRef }).decision !== "ALLOW") throw new UnprocessableEntityException("Grant exceeds current issuer field authority");
          for (const edgeRef of input.scope.edge_refs) if (evaluateAuthorization(state, { ...base, edgeRef }).decision !== "ALLOW") throw new UnprocessableEntityException("Grant exceeds current issuer edge authority");
        }
      }
      const createdAt = now();
      const grant: AccessGrant = {
        id: randomUUID(), workspaceId, grantorIdentityId: actor.identityId, granteeIdentityId: input.grantee_ref,
        purposeId: input.purpose_id, resourceKind, resourceIds: [...new Set(input.scope.resource_refs)],
        fieldRefs: [...new Set(input.scope.field_refs)], edgeRefs: [...new Set(input.scope.edge_refs)], actions: [...new Set(input.scope.actions)],
        startsAt: input.valid_from, ...(input.valid_to ? { expiresAt: input.valid_to } : {}), state: "ACTIVE",
        policyVersion: input.policy_version, effect: "ALLOW", onwardDelegation: false, exportAllowed: input.scope.allow_export,
        createdAt, revision: 1,
      };
      state.accessGrants.push(grant); advanceAuthorizationEpoch(state, "GRANT_CHANGED"); state.workspace.revision += 1;
      recordAuthorityTransition(database, state, actor, "ACCESS_GRANT_CREATED", "WORKSPACE", "Created a bounded explicit grant after current issuer reauthorization", grant.id, correlationId, { policyVersion: grant.policyVersion, authorizationEpoch: state.authorizationEpoch.value, authorizationPhase: "EFFECT", decisionReason: "EXPLICIT_GRANT" });
      appendCommandReceipt(state, actor, "API-P1-113", idempotencyKey, input, grant.id, grant.revision);
      return grant;
    });
    if (result === "NOT_AVAILABLE") throw new NotFoundException("Resource not available");
    return result;
  }

  async revokeAccessGrant(workspaceId: string, actor: WorkspaceActor, grantId: string, expectedRevision: number, idempotencyKey: string, reasonCode: string, fence: AuthorizationFence, correlationId: string): Promise<AccessGrant> {
    const result = await this.mutate((database): AccessGrant | "NOT_AVAILABLE" | "STALE" => {
      const state = this.state(database, workspaceId);
      const receipt = priorCommandReceipt(state, actor, "API-P1-115", idempotencyKey, { grantId, reasonCode });
      if (receipt) return state.accessGrants.find((grant) => grant.id === receipt.resourceId) ?? "NOT_AVAILABLE";
      if (fence.identityId !== actor.identityId || fence.workspaceId !== workspaceId || fence.action !== "grant.revoke" || fence.resourceKind !== "WORKSPACE") return "NOT_AVAILABLE";
      const effectDecision = this.recordAuthorizationDecision(database, state, actor, this.effectContext(fence), correlationId);
      if (effectDecision.decision !== "ALLOW") return "NOT_AVAILABLE";
      const grant = state.accessGrants.find((candidate) => candidate.id === grantId);
      if (!grant) return "NOT_AVAILABLE";
      if (grant.revision !== expectedRevision) return "STALE";
      const revokedAt = now(); grant.state = "REVOKED"; grant.revokedAt = revokedAt; grant.revision += 1;
      advanceAuthorizationEpoch(state, "GRANT_CHANGED"); state.workspace.revision += 1;
      recordAuthorityTransition(database, state, actor, "ACCESS_GRANT_REVOKED", "WORKSPACE", `Revoked a bounded grant using registered reason ${reasonCode}`, grant.id, correlationId, { policyVersion: grant.policyVersion, authorizationEpoch: state.authorizationEpoch.value, authorizationPhase: "EFFECT", decisionReason: "EXPLICIT_GRANT" });
      appendCommandReceipt(state, actor, "API-P1-115", idempotencyKey, { grantId, reasonCode }, grant.id, grant.revision);
      return grant;
    });
    if (result === "NOT_AVAILABLE") throw new NotFoundException("Resource not available");
    if (result === "STALE") throw new PreconditionFailedException("Resource changed; refresh before retrying");
    return result;
  }

  async getMembership(workspaceId: string, membershipId: string): Promise<Member> {
    const membership = (await this.listMemberships(workspaceId)).find((candidate) => candidate.id === membershipId);
    if (!membership) throw new NotFoundException("Resource not available");
    return membership;
  }

  async createCanonicalSubject(workspaceId: string, actor: WorkspaceActor, expectedWorkspaceRevision: number, idempotencyKey: string, input: { subject_kind: "PERSON"; authority_basis_ref: string | null }, fence: AuthorizationFence, correlationId: string): Promise<SubjectRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const receipt = priorCommandReceipt(state, actor, "API-P1-105", idempotencyKey, input);
      if (receipt) return state.subjects.find((subject) => subject.id === receipt.resourceId) ?? (() => { throw new ConflictException("The prior command result is unavailable"); })();
      this.requireEffectAuthorization(database, state, actor, fence, { action: "subject.create", resourceKind: "WORKSPACE" }, correlationId);
      if (state.workspace.revision !== expectedWorkspaceRevision) throw new PreconditionFailedException("Workspace changed; refresh before retrying");
      const createdAt = now();
      const subject: SubjectRecord = { id: randomUUID(), workspaceId, displayName: "Represented person", kind: "OTHER", relationship: input.authority_basis_ref ? "Authorized representation" : "Household person", status: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
      state.subjects.push(subject);
      state.workspace.revision += 1;
      recordAuthorityTransition(database, state, actor, "SUBJECT_CREATED", "PERSON", "Created a represented subject without identity or participation", subject.id, correlationId);
      appendCommandReceipt(state, actor, "API-P1-105", idempotencyKey, input, subject.id, subject.revision);
      return subject;
    });
  }

  async proposeCanonicalSubjectChange(workspaceId: string, actor: WorkspaceActor, subjectId: string, expectedRevision: number, idempotencyKey: string, input: { operation: "PROPOSE_ATTRIBUTE_CORRECTION"; protected_change_ref: string | null; reason_code: string }, fence: AuthorizationFence, correlationId: string): Promise<SubjectRecord> {
    const result = await this.mutate((database): SubjectRecord | "NOT_AVAILABLE" | "STALE" => {
      const state = this.state(database, workspaceId);
      const receipt = priorCommandReceipt(state, actor, "API-P1-107", idempotencyKey, { subjectId, ...input });
      if (receipt) return state.subjects.find((subject) => subject.id === receipt.resourceId) ?? "NOT_AVAILABLE";
      this.requireEffectAuthorization(database, state, actor, fence, { action: "subject.edit", resourceKind: "WORKSPACE" }, correlationId);
      const subject = state.subjects.find((candidate) => candidate.id === subjectId);
      if (!subject || subject.status !== "ACTIVE") {
        const denial = auditRecord(workspaceId, actor, "SUBJECT_CHANGE_REJECTED", "PERSON", "Rejected a protected subject proposal because the subject was unavailable", undefined, correlationId); denial.outcome = "DENIED";
        state.audit.push(denial); appendAuthorityOutbox(database, state, denial); return "NOT_AVAILABLE";
      }
      if (subject.revision !== expectedRevision) {
        const denial = auditRecord(workspaceId, actor, "SUBJECT_CHANGE_REJECTED", "PERSON", "Rejected a stale protected subject proposal", subject.id, correlationId); denial.outcome = "DENIED";
        state.audit.push(denial); appendAuthorityOutbox(database, state, denial); return "STALE";
      }
      const changedAt = now();
      subject.history.push(subjectHistory(subject, changedAt)); subject.revision += 1; subject.validFrom = changedAt; subject.recordedAt = changedAt;
      state.workspace.revision += 1;
      recordAuthorityTransition(database, state, actor, "SUBJECT_CHANGE_PROPOSED", "PERSON", "Recorded a protected subject change proposal without applying opaque content", subject.id, correlationId);
      appendCommandReceipt(state, actor, "API-P1-107", idempotencyKey, { subjectId, ...input }, subject.id, subject.revision);
      return subject;
    });
    if (result === "NOT_AVAILABLE") throw new NotFoundException("Resource not available");
    if (result === "STALE") throw new PreconditionFailedException("Resource changed; refresh before retrying");
    return result;
  }

  async inviteCanonicalMembership(workspaceId: string, actor: WorkspaceActor, expectedWorkspaceRevision: number, idempotencyKey: string, input: { identity_or_audience_ref: string; participation_class: Exclude<Member["role"], "OWNER" | "FAMILY_ADMIN">; invitation_policy_ref: string }, fence: AuthorizationFence, correlationId: string): Promise<Member> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const receipt = priorCommandReceipt(state, actor, "API-P1-109", idempotencyKey, input);
      if (receipt) return state.members.find((member) => member.id === receipt.resourceId) ?? (() => { throw new ConflictException("The prior command result is unavailable"); })();
      this.requireEffectAuthorization(database, state, actor, fence, { action: "workspace.admin", resourceKind: "WORKSPACE" }, correlationId);
      if (state.workspace.revision !== expectedWorkspaceRevision) throw new PreconditionFailedException("Workspace changed; refresh before retrying");
      const createdAt = now();
      const subject: SubjectRecord = { id: randomUUID(), workspaceId, displayName: "Invited participant", kind: input.participation_class === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: "Invited participant", status: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
      const member: Member = { id: randomUUID(), workspaceId, subjectId: subject.id, audienceRef: input.identity_or_audience_ref, displayName: "Invited participant", role: input.participation_class, state: "ACTIVE", invitationState: "PENDING", permissions: defaultPermissions(), validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
      state.subjects.push(subject); state.members.push(member); state.workspace.revision += 1; advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "MEMBERSHIP_INVITATION_PREPARED", "MEMBERSHIP", "Prepared an audience-bound invitation without fabricating identity or access", member.id, correlationId);
      appendCommandReceipt(state, actor, "API-P1-109", idempotencyKey, input, member.id, member.revision);
      return member;
    });
  }

  async transitionCanonicalMembership(workspaceId: string, actor: WorkspaceActor, membershipId: string, expectedRevision: number, idempotencyKey: string, input: { transition: "SUSPEND" | "REACTIVATE" | "DEPART" | "REMOVE"; reason_code: string }, fence: AuthorizationFence, correlationId: string): Promise<Member> {
    const result = await this.mutate((database): Member | "NOT_AVAILABLE" | "STALE" => {
      const state = this.state(database, workspaceId);
      const receipt = priorCommandReceipt(state, actor, "API-P1-111", idempotencyKey, { membershipId, ...input });
      if (receipt) return state.members.find((member) => member.id === receipt.resourceId) ?? "NOT_AVAILABLE";
      this.requireEffectAuthorization(database, state, actor, fence, { action: "workspace.admin", resourceKind: "WORKSPACE" }, correlationId);
      const member = state.members.find((candidate) => candidate.id === membershipId);
      if (!member) {
        const denial = auditRecord(workspaceId, actor, "MEMBERSHIP_CHANGE_REJECTED", "MEMBERSHIP", "Rejected a membership transition because the record was unavailable", undefined, correlationId); denial.outcome = "DENIED";
        state.audit.push(denial); appendAuthorityOutbox(database, state, denial); return "NOT_AVAILABLE";
      }
      if (member.revision !== expectedRevision) {
        const denial = auditRecord(workspaceId, actor, "MEMBERSHIP_CHANGE_REJECTED", "MEMBERSHIP", "Rejected a stale membership transition", member.id, correlationId); denial.outcome = "DENIED";
        state.audit.push(denial); appendAuthorityOutbox(database, state, denial); return "STALE";
      }
      const changedAt = now(); member.history.push(membershipHistory(member, changedAt));
      if (input.transition === "REACTIVATE") { member.state = "ACTIVE"; member.invitationState = "PENDING"; delete member.validTo; member.validFrom = changedAt; }
      else { member.state = "REVOKED"; member.invitationState = "SUSPENDED"; member.validTo = changedAt; }
      member.recordedAt = changedAt; member.revision += 1; state.workspace.revision += 1; advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "MEMBERSHIP_CHANGED", "MEMBERSHIP", "Applied a revision-guarded participation transition without changing grants", member.id, correlationId);
      appendCommandReceipt(state, actor, "API-P1-111", idempotencyKey, { membershipId, ...input }, member.id, member.revision);
      return member;
    });
    if (result === "NOT_AVAILABLE") throw new NotFoundException("Resource not available");
    if (result === "STALE") throw new PreconditionFailedException("Resource changed; refresh before retrying");
    return result;
  }

  async createPerson(workspaceId: string, actor: WorkspaceActor, input: ManagePersonInput, fence: AuthorizationFence, correlationId: string): Promise<SubjectRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "subject.create", resourceKind: "WORKSPACE" }, correlationId);
      if (input.kind === "OWNER") throw new BadRequestException("Additional owners and ownership transfer are unavailable");
      const createdAt = now();
      const subject: SubjectRecord = { id: randomUUID(), workspaceId: state.workspace.id, displayName: input.displayName, kind: input.kind, relationship: input.relationship, ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}), status: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
      state.subjects.push(subject);
      recordAuthorityTransition(database, state, actor, "PERSON_CREATED", "PERSON", "Added a person to the household", subject.id, correlationId);
      if (input.loginEnabled) {
        const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName: input.displayName, role: input.role, state: "ACTIVE", invitationState: "PENDING", permissions: input.permissions, ...(input.email ? { email: input.email } : {}), ...(input.mobile ? { mobile: input.mobile } : {}), validFrom: createdAt, recordedAt: createdAt, createdAt, revision: 1, history: [] };
        state.members.push(member);
        advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
        recordAuthorityTransition(database, state, actor, "INVITATION_PREPARED", "MEMBERSHIP", "Prepared a membership invitation without creating credentials or a resource grant", member.id, correlationId);
      }
      return subject;
    });
  }

  async updatePerson(workspaceId: string, actor: WorkspaceActor, id: string, expectedRevision: number, input: ManagePersonInput, fence: AuthorizationFence, correlationId: string): Promise<SubjectRecord> {
    const result = await this.mutate((database): { state: "UPDATED"; subject: SubjectRecord } | { state: "NOT_AVAILABLE" } | { state: "STALE" } => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "subject.edit", resourceKind: "WORKSPACE" }, correlationId);
      const subject = state.subjects.find((item) => item.id === id);
      if (!subject || subject.status !== "ACTIVE") {
        const denial = auditRecord(state.workspace.id, actor, "PERSON_CHANGE_REJECTED", "PERSON", "Rejected a person change because the current subject was unavailable", undefined, correlationId);
        denial.outcome = "DENIED";
        state.audit.push(denial); appendAuthorityOutbox(database, state, denial);
        return { state: "NOT_AVAILABLE" };
      }
      if (subject.revision !== expectedRevision) {
        const denial = auditRecord(state.workspace.id, actor, "PERSON_CHANGE_REJECTED", "PERSON", "Rejected a stale person change", subject.id, correlationId);
        denial.outcome = "DENIED";
        state.audit.push(denial); appendAuthorityOutbox(database, state, denial);
        return { state: "STALE" };
      }
      if (input.kind === "OWNER" && subject.kind !== "OWNER") throw new BadRequestException("Ownership transfer is unavailable");
      if (subject.kind === "OWNER" && input.kind !== "OWNER") throw new BadRequestException("The local owner cannot be changed to another person type");
      const changedAt = now();
      subject.history.push(subjectHistory(subject, changedAt));
      subject.displayName = input.displayName; subject.kind = input.kind; subject.relationship = input.relationship; subject.revision += 1;
      subject.validFrom = changedAt; subject.recordedAt = changedAt;
      if (input.dateOfBirth) subject.dateOfBirth = input.dateOfBirth; else delete subject.dateOfBirth;
      let member = state.members.find((item) => item.subjectId === subject.id);
      let authorityChanged = false;
      if (input.loginEnabled) {
        if (!member) {
          member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName: input.displayName, role: input.role, state: "ACTIVE", invitationState: "PENDING", permissions: input.permissions, validFrom: changedAt, recordedAt: changedAt, createdAt: changedAt, revision: 1, history: [] };
          state.members.push(member);
          authorityChanged = true;
        } else {
          member.history.push(membershipHistory(member, changedAt));
          member.displayName = input.displayName; member.role = subject.kind === "OWNER" ? "OWNER" : input.role; member.state = "ACTIVE"; member.permissions = subject.kind === "OWNER" ? defaultPermissions(true) : input.permissions; member.revision += 1;
          member.validFrom = changedAt; member.recordedAt = changedAt; delete member.validTo;
          if (member.invitationState === "SUSPENDED" || member.invitationState === "NOT_INVITED") member.invitationState = "PENDING";
          authorityChanged = true;
        }
        if (input.email) member.email = input.email; else delete member.email;
        if (input.mobile) member.mobile = input.mobile; else delete member.mobile;
      } else if (member && member.role !== "OWNER" && (member.state !== "REVOKED" || member.invitationState !== "SUSPENDED")) {
        member.history.push(membershipHistory(member, changedAt));
        member.state = "REVOKED"; member.invitationState = "SUSPENDED"; member.revision += 1;
        member.validTo = changedAt; member.recordedAt = changedAt;
        authorityChanged = true;
      }
      if (authorityChanged) advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "PERSON_UPDATED", "PERSON", input.loginEnabled ? "Updated person and prospective membership settings; resource grants remain separate" : "Updated person details and disabled membership participation", subject.id, correlationId);
      return { state: "UPDATED", subject };
    });
    if (result.state === "NOT_AVAILABLE") throw new NotFoundException("Resource not available");
    if (result.state === "STALE") throw new PreconditionFailedException("Resource changed; refresh before retrying");
    return result.subject;
  }

  async deletePerson(workspaceId: string, actor: WorkspaceActor, id: string, expectedRevision: number, fence: AuthorizationFence, correlationId: string): Promise<void> {
    const result = await this.mutate((database): "RETIRED" | "NOT_AVAILABLE" | "STALE" => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "subject.delete", resourceKind: "WORKSPACE" }, correlationId);
      const subject = state.subjects.find((item) => item.id === id);
      if (!subject || subject.status !== "ACTIVE") {
        const denial = auditRecord(state.workspace.id, actor, "PERSON_RETIREMENT_REJECTED", "PERSON", "Rejected a person retirement because the current subject was unavailable", undefined, correlationId);
        denial.outcome = "DENIED"; state.audit.push(denial); appendAuthorityOutbox(database, state, denial);
        return "NOT_AVAILABLE";
      }
      if (subject.revision !== expectedRevision) {
        const denial = auditRecord(state.workspace.id, actor, "PERSON_RETIREMENT_REJECTED", "PERSON", "Rejected a stale person retirement", subject.id, correlationId);
        denial.outcome = "DENIED"; state.audit.push(denial); appendAuthorityOutbox(database, state, denial);
        return "STALE";
      }
      if (subject.kind === "OWNER") throw new BadRequestException("The workspace owner cannot be removed");
      if (state.documents.some((document) => document.status !== "DELETED" && document.subjectIds.includes(id))) throw new BadRequestException("Reassign or delete this person's documents before removing them");
      const retiredAt = now();
      subject.history.push(subjectHistory(subject, retiredAt));
      subject.status = "RETIRED"; subject.retiredAt = retiredAt; subject.validFrom = retiredAt; subject.recordedAt = retiredAt; subject.revision += 1;
      state.members = state.members.map((member) => {
        if (member.subjectId !== id || member.state !== "ACTIVE") return member;
        member.history.push(membershipHistory(member, retiredAt));
        return { ...member, state: "REVOKED", invitationState: "SUSPENDED", validTo: retiredAt, recordedAt: retiredAt, revision: member.revision + 1 };
      });
      state.subjectIdentityLinks = state.subjectIdentityLinks.map((link) => link.subjectId === id && link.state === "ACTIVE" ? { ...link, state: "REVOKED", revision: link.revision + 1 } : link);
      advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "PERSON_REMOVED", "PERSON", "Removed the active subject view while preserving revoked participation history", id, correlationId);
      return "RETIRED";
    });
    if (result === "NOT_AVAILABLE") throw new NotFoundException("Resource not available");
    if (result === "STALE") throw new PreconditionFailedException("Resource changed; refresh before retrying");
  }

  async addTask(workspaceId: string, actor: WorkspaceActor, input: { title: string; severity: TaskRecord["severity"]; dueAt?: string | undefined; documentId?: string | undefined }, fence: AuthorizationFence, correlationId: string): Promise<TaskRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "task.create", resourceKind: "WORKSPACE" }, correlationId);
      const task: TaskRecord = {
        id: randomUUID(), workspaceId: state.workspace.id, title: input.title, severity: input.severity, state: "OPEN", createdAt: now(),
        ...(input.dueAt ? { dueAt: input.dueAt } : {}), ...(input.documentId ? { documentId: input.documentId } : {}),
      };
      state.tasks.unshift(task);
      state.audit.push(auditRecord(state.workspace.id, actor, "TASK_CREATED", "TASK", "Created a household task", task.id));
      return task;
    });
  }

  async completeTask(workspaceId: string, actor: WorkspaceActor, id: string, fence: AuthorizationFence, correlationId: string): Promise<TaskRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "task.edit", resourceKind: "TASK", resourceId: id }, correlationId);
      const task = state.tasks.find((item) => item.id === id);
      if (!task) throw new NotFoundException("Task not found");
      task.state = "DONE";
      state.audit.push(auditRecord(state.workspace.id, actor, "TASK_COMPLETED", "TASK", "Completed a household task", task.id));
      return task;
    });
  }

  async deleteDocument(workspaceId: string, actor: WorkspaceActor, id: string, fence: AuthorizationFence, correlationId: string): Promise<{ documentId: string; state: "TRASHED"; deletedAt: string; purgeDueAt: string }> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "document.delete", resourceKind: "DOCUMENT", resourceId: id }, correlationId);
      const document = state.documents.find((item) => item.id === id);
      if (!document) throw new NotFoundException("Document not found");
      if (document.status === "DELETED" && document.deletedAt && document.purgeDueAt) {
        return { documentId: document.id, state: "TRASHED" as const, deletedAt: document.deletedAt, purgeDueAt: document.purgeDueAt };
      }
      const deletedAt = now();
      document.preDeleteStatus = document.status === "DELETED" ? "NEEDS_REVIEW" : document.status;
      document.status = "DELETED";
      document.deletedAt = deletedAt;
      document.purgeDueAt = trashDeadline(deletedAt);
      document.updatedAt = deletedAt;
      state.audit.push(auditRecord(state.workspace.id, actor, "DOCUMENT_TRASHED", "DOCUMENT", "Moved document into the restricted 30-day Trash state", id));
      return { documentId: document.id, state: "TRASHED" as const, deletedAt, purgeDueAt: document.purgeDueAt };
    });
  }

  async restoreDocument(workspaceId: string, actor: WorkspaceActor, id: string, fence: AuthorizationFence, correlationId: string, at = now()): Promise<DocumentRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "document.edit", resourceKind: "DOCUMENT", resourceId: id }, correlationId);
      const document = state.documents.find((item) => item.id === id);
      if (!document || document.status !== "DELETED" || !document.purgeDueAt) throw new NotFoundException("Document is not in Trash");
      if (new Date(at).getTime() >= new Date(document.purgeDueAt).getTime()) throw new BadRequestException("The 30-day recovery period has ended");
      document.status = document.preDeleteStatus ?? (document.extractedText ? "READY" : "NEEDS_REVIEW");
      document.updatedAt = at;
      delete document.deletedAt;
      delete document.purgeDueAt;
      delete document.preDeleteStatus;
      state.audit.push(auditRecord(state.workspace.id, actor, "DOCUMENT_RESTORED", "DOCUMENT", "Restored document from Trash before its purge deadline", id));
      return documentSummary(document);
    });
  }

  async purgeExpiredDocuments(workspaceId: string, at = now()): Promise<string[]> {
    return this.mutate(async (database) => {
      const state = this.state(database, workspaceId);
      const cutoff = new Date(at).getTime();
      const expired = state.documents.filter((document) => document.status === "DELETED" && document.purgeDueAt && new Date(document.purgeDueAt).getTime() <= cutoff);
      const worker = { identityId: "workload.local-purge", displayName: "Local purge worker" };
      for (const document of expired) {
        state.facts = state.facts.filter((fact) => fact.documentId !== document.id);
        state.dependencies = state.dependencies.filter((edge) => edge.evidenceDocumentId !== document.id);
        state.tasks = state.tasks.filter((task) => task.documentId !== document.id);
        state.audit.push(auditRecord(state.workspace.id, worker, "DOCUMENT_PURGED", "DOCUMENT", "Completed final local purge after the Trash period", document.id));
        for (const artifactPath of [this.scopedArtifactPath(workspaceId, document.id), join(this.artifactRoot, document.id)]) {
          try { await unlink(artifactPath); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        }
      }
      if (expired.length) {
        const expiredIds = new Set(expired.map((document) => document.id));
        state.documents = state.documents.filter((document) => !expiredIds.has(document.id));
      }
      return expired.map((document) => document.id);
    });
  }

  async exportWorkspace(workspaceId: string, actor: WorkspaceActor, fence: AuthorizationFence, correlationId: string): Promise<WorkspaceState> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "export.create", resourceKind: "WORKSPACE" }, correlationId);
      return { ...state, documents: state.documents.map(({ extractedText: _content, ...document }) => document) } as WorkspaceState;
    });
  }

  async recordRecoveryBlocked(workspaceId: string, actor: WorkspaceActor, fence: AuthorizationFence, correlationId: string): Promise<{ caseId: string; workspaceId: string; caseKind: "WORKSPACE_RECOVERY"; state: "POLICY_BLOCKED"; decisionFence: "DEC-038"; createdAt: string; revision: 1 }> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      this.requireEffectAuthorization(database, state, actor, fence, { action: "workspace.read", resourceKind: "WORKSPACE", resourceId: workspaceId }, correlationId);
      const createdAt = now();
      const caseId = randomUUID();
      recordAuthorityTransition(database, state, actor, "RECOVERY_POLICY_BLOCKED", "WORKSPACE", "Recovery and ownership transfer remain unavailable under DEC-038", workspaceId);
      return { caseId, workspaceId, caseKind: "WORKSPACE_RECOVERY", state: "POLICY_BLOCKED", decisionFence: "DEC-038", createdAt, revision: 1 };
    });
  }
}
