import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional, UnprocessableEntityException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type {
  Answer,
  AccessGrant,
  AuditRecord,
  AuthorizationEpoch,
  ConnectorDescriptor,
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
import { evaluateAuthorization } from "./authorization.policy.js";
import { PostgresWorkspacePersistence } from "./postgres-workspace.persistence.js";
import {
  WORKSPACE_PERSISTENCE,
  type AuthorityOutboxEvent,
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
const stableId = (prefix: string, ...parts: string[]): string => `${prefix}_${createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 24)}`;
const ownerActions: WorkspaceAction[] = [
  "workspace.read", "workspace.admin", "subject.read", "subject.create", "subject.edit", "subject.delete",
  "document.read", "document.create", "document.edit", "document.delete", "fact.review",
  "task.read", "task.create", "task.edit", "connector.read", "export.create", "audit.read",
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
        createdAt,
        revision: 1,
      },
    ],
    subjects: [
      {
        id: ownerSubjectId,
        workspaceId,
        displayName: actor.displayName,
        kind: "OWNER",
        relationship: "Self",
        createdAt,
        revision: 1,
      },
    ],
    subjectIdentityLinks: [{ id: randomUUID(), workspaceId, subjectId: ownerSubjectId, identityId: actor.identityId, evidenceKind: "WORKSPACE_CREATION", state: "ACTIVE", validFrom: createdAt, recordedAt: createdAt, revision: 1 }],
    accessGrants: [{
      id: ownerGrantId, workspaceId, grantorIdentityId: actor.identityId, granteeIdentityId: actor.identityId,
      purposeId: "PUR-P1-001", resourceKind: "WORKSPACE", resourceIds: [workspaceId], actions: ownerActions,
      startsAt: createdAt, state: "ACTIVE", policyVersion: "policy.local-explicit-grant@0.1", onwardDelegation: false,
      exportAllowed: true, createdAt, revision: 1,
    }],
    authorizationEpoch: { workspaceId, value: 1, cause: "WORKSPACE_CREATED", advancedAt: createdAt },
    audit: [{
      id: randomUUID(), workspaceId, type: "WORKSPACE_CREATED", resourceType: "WORKSPACE", resourceId: workspaceId,
      actor: actor.displayName, actorId: actor.identityId, action: "workspace.create", outcome: "SUCCEEDED",
      policyVersion: "policy.local-explicit-grant@0.1", correlationId: context.correlationId, detail: `Created a ${type.toLowerCase()} workspace`, at: createdAt,
    }],
    dependencies: [],
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
  const state = input;
  state.workspace.status ??= "ACTIVE";
  state.workspace.ownerBindingId ??= randomUUID();
  state.workspace.jurisdictionPackRef ??= "jurisdiction.AU";
  state.workspace.residencyPolicyRef ??= (process.env.DM_PROFILE ?? "local") === "local" ? "residency.local.synthetic" : "residency.azure.au.synthetic-preview";
  state.workspace.configurationVersion ??= "configuration.local.synthetic@0.1";
  state.workspace.revision ??= 1;
  state.subjects ??= [{ id: "sub_local_owner", workspaceId: state.workspace.id, displayName: state.members[0]?.displayName ?? "Local owner", kind: "OWNER", relationship: "Self", createdAt: state.workspace.createdAt, revision: 1 }];
  for (const subject of state.subjects) subject.revision ??= 1;
  for (const member of state.members) {
    const fallbackSubjectId = member.role === "OWNER" ? state.subjects.find((subject) => subject.kind === "OWNER")?.id ?? "sub_local_owner" : `sub_member_${member.id}`;
    member.subjectId ??= fallbackSubjectId;
    member.invitationState ??= member.state === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
    member.permissions ??= defaultPermissions(member.role === "OWNER");
    member.revision ??= 1;
    if (!state.subjects.some((subject) => subject.id === member.subjectId)) state.subjects.push({ id: member.subjectId, workspaceId: state.workspace.id, displayName: member.displayName, kind: member.role === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: member.role === "GUEST" ? "Guest" : "Family member", createdAt: member.createdAt, revision: 1 });
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
): void {
  const audit = auditRecord(state.workspace.id, actor, type, resourceType, detail, resourceId);
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
      candidate.accessGrants.push({ id: randomUUID(), workspaceId: candidate.workspace.id, grantorIdentityId: actor.identityId, granteeIdentityId: actor.identityId, purposeId: "PUR-P1-001", resourceKind: "WORKSPACE", resourceIds: [candidate.workspace.id], actions: ownerActions, startsAt: recordedAt, state: "ACTIVE", policyVersion: "policy.local-explicit-grant@0.1", onwardDelegation: false, exportAllowed: true, createdAt: recordedAt, revision: 1 });
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

  async requireAuthorization(actor: WorkspaceActor, workspaceId: string, action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId?: string): Promise<void> {
    const database = await this.readDatabase();
    const state = this.state(database, workspaceId);
    if (state.workspace.status !== "ACTIVE") throw new NotFoundException("Resource not available");
    const context = { identityId: actor.identityId, workspaceId, purposeId: "PUR-P1-001" as const, action, resourceKind, ...(resourceId ? { resourceId } : {}) };
    const decision = evaluateAuthorization(state, context);
    if (decision.decision !== "ALLOW") throw new NotFoundException("Resource not available");
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
      subjects,
      audit: [...audit].reverse(),
      dependencies: dependencies.filter((edge) => activeIds.has(edge.evidenceDocumentId)),
      accessGrants,
      authorizationEpoch,
      localMode: (process.env.DM_PROFILE ?? "local") === "local",
      customerDataPolicy: (process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "production-gated" ? "production-gated" : "synthetic-only",
    };
  }

  async addDocument(workspaceId: string, actor: WorkspaceActor, file: Express.Multer.File, subjectIds: string[], captureRoute: DocumentRecord["captureRoute"]): Promise<DocumentRecord> {
    return this.mutate(async (database) => {
      const state = this.state(database, workspaceId);
      if (!subjectIds.length || subjectIds.some((subjectId) => !state.subjects.some((subject) => subject.id === subjectId))) {
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

  async documentDetail(workspaceId: string, id: string): Promise<DocumentDetail> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const document = state.documents.find((item) => item.id === id);
    if (!document || document.status === "DELETED") throw new NotFoundException("Document not found");
    if (document.status === "POLICY_HOLD") throw new BadRequestException("This item is isolated and cannot be previewed in the ordinary document view");
    const artifactUrl = `/api/documents/${document.id}/artifact`;
    const preview: DocumentDetail["preview"] = document.extractedText
      ? { kind: "TEXT", text: document.extractedText.slice(0, 100_000), artifactUrl }
      : document.mediaType.startsWith("image/")
        ? { kind: "IMAGE", artifactUrl }
        : document.mediaType === "application/pdf"
          ? { kind: "PDF", artifactUrl }
          : { kind: "UNAVAILABLE", artifactUrl, message: "A safe inline preview is not available for this format. You can open the exact local original." };
    return {
      document: documentSummary(document),
      facts: state.facts.filter((fact) => fact.documentId === document.id),
      dependencies: state.dependencies.filter((edge) => edge.evidenceDocumentId === document.id),
      preview,
    };
  }

  async documentArtifact(workspaceId: string, id: string): Promise<{ buffer: Buffer; mediaType: string; name: string }> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const document = state.documents.find((item) => item.id === id);
    if (!document || document.status === "DELETED") throw new NotFoundException("Document not found");
    if (document.status === "POLICY_HOLD") throw new BadRequestException("This item is isolated and cannot be opened");
    return { buffer: await this.readArtifact(workspaceId, id), mediaType: document.mediaType, name: document.name };
  }

  async reviewFact(workspaceId: string, actor: WorkspaceActor, id: string): Promise<FactRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
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

  async addManualDocument(workspaceId: string, actor: WorkspaceActor, input: { name: string; content: string; subjectIds: string[] }): Promise<DocumentRecord> {
    const buffer = Buffer.from(input.content, "utf8");
    return this.addDocument(workspaceId, actor, { originalname: `${input.name}.txt`, mimetype: "text/plain", size: buffer.byteLength, buffer } as Express.Multer.File, input.subjectIds, "MANUAL");
  }

  async addSubject(workspaceId: string, actor: WorkspaceActor, input: CreateSubjectInput): Promise<SubjectRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      if (input.kind === "OWNER") throw new BadRequestException("Additional owner subjects and ownership transfer are unavailable");
      const subject: SubjectRecord = {
        id: randomUUID(), workspaceId: state.workspace.id, displayName: input.displayName, kind: input.kind,
        relationship: input.relationship, ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}), createdAt: now(), revision: 1,
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

  async ask(workspaceId: string, question: string, documentIds?: string[]): Promise<Answer> {
    const state = this.state(await this.readDatabase(), workspaceId);
    const tokens = normalizeQuestion(question);
    const allowed = state.documents.filter(
      (document) =>
        document.status === "READY" &&
        document.extractedText &&
        (!documentIds || documentIds.length === 0 || documentIds.includes(document.id)),
    );
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
    return {
      answer: `The strongest local evidence says: ${citations.map((citation) => citation.excerpt).join(" ")}`,
      citations,
      confidence: scored[0]!.score >= 3 ? "HIGH" : "MEDIUM",
      mode: "LOCAL_DETERMINISTIC",
    };
  }

  async addMember(workspaceId: string, actor: WorkspaceActor, displayName: string, role: Member["role"]): Promise<Member> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      if (role === "OWNER") throw new BadRequestException("Ownership transfer is unavailable");
      const createdAt = now();
      const subject: SubjectRecord = { id: randomUUID(), workspaceId: state.workspace.id, displayName, kind: role === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: "Family member", createdAt, revision: 1 };
      state.subjects.push(subject);
      const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName, role, state: "ACTIVE", invitationState: "PENDING", permissions: defaultPermissions(), createdAt, revision: 1 };
      state.members.push(member);
      advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "MEMBERSHIP_INVITATION_PREPARED", "MEMBERSHIP", "Prepared membership without fabricating an identity or active resource grant", member.id);
      return member;
    });
  }

  async createPerson(workspaceId: string, actor: WorkspaceActor, input: ManagePersonInput): Promise<SubjectRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      if (input.kind === "OWNER") throw new BadRequestException("Additional owners and ownership transfer are unavailable");
      const createdAt = now();
      const subject: SubjectRecord = { id: randomUUID(), workspaceId: state.workspace.id, displayName: input.displayName, kind: input.kind, relationship: input.relationship, ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}), createdAt, revision: 1 };
      state.subjects.push(subject);
      recordAuthorityTransition(database, state, actor, "PERSON_CREATED", "PERSON", "Added a person to the household", subject.id);
      if (input.loginEnabled) {
        const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName: input.displayName, role: input.role, state: "ACTIVE", invitationState: "PENDING", permissions: input.permissions, ...(input.email ? { email: input.email } : {}), ...(input.mobile ? { mobile: input.mobile } : {}), createdAt, revision: 1 };
        state.members.push(member);
        advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
        recordAuthorityTransition(database, state, actor, "INVITATION_PREPARED", "MEMBERSHIP", "Prepared a membership invitation without creating credentials or a resource grant", member.id);
      }
      return subject;
    });
  }

  async updatePerson(workspaceId: string, actor: WorkspaceActor, id: string, input: ManagePersonInput): Promise<SubjectRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const subject = state.subjects.find((item) => item.id === id);
      if (!subject) throw new NotFoundException("Person not found");
      if (input.kind === "OWNER" && subject.kind !== "OWNER") throw new BadRequestException("Ownership transfer is unavailable");
      if (subject.kind === "OWNER" && input.kind !== "OWNER") throw new BadRequestException("The local owner cannot be changed to another person type");
      subject.displayName = input.displayName; subject.kind = input.kind; subject.relationship = input.relationship; subject.revision += 1;
      if (input.dateOfBirth) subject.dateOfBirth = input.dateOfBirth; else delete subject.dateOfBirth;
      let member = state.members.find((item) => item.subjectId === subject.id);
      if (input.loginEnabled) {
        if (!member) {
          member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName: input.displayName, role: input.role, state: "ACTIVE", invitationState: "PENDING", permissions: input.permissions, createdAt: now(), revision: 1 };
          state.members.push(member);
        }
        member.displayName = input.displayName; member.role = subject.kind === "OWNER" ? "OWNER" : input.role; member.state = "ACTIVE"; member.permissions = subject.kind === "OWNER" ? defaultPermissions(true) : input.permissions; member.revision += 1;
        if (member.invitationState === "SUSPENDED" || member.invitationState === "NOT_INVITED") member.invitationState = "PENDING";
        if (input.email) member.email = input.email; else delete member.email;
        if (input.mobile) member.mobile = input.mobile; else delete member.mobile;
      } else if (member && member.role !== "OWNER") {
        member.state = "REVOKED"; member.invitationState = "SUSPENDED"; member.revision += 1;
      }
      advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "PERSON_UPDATED", "PERSON", input.loginEnabled ? "Updated person and prospective membership settings; resource grants remain separate" : "Updated person details and disabled membership participation", subject.id);
      return subject;
    });
  }

  async deletePerson(workspaceId: string, actor: WorkspaceActor, id: string): Promise<void> {
    await this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const subject = state.subjects.find((item) => item.id === id);
      if (!subject) throw new NotFoundException("Person not found");
      if (subject.kind === "OWNER") throw new BadRequestException("The workspace owner cannot be removed");
      if (state.documents.some((document) => document.status !== "DELETED" && document.subjectIds.includes(id))) throw new BadRequestException("Reassign or delete this person's documents before removing them");
      state.subjects = state.subjects.filter((item) => item.id !== id);
      state.members = state.members.map((member) => member.subjectId === id ? { ...member, state: "REVOKED", invitationState: "SUSPENDED", revision: member.revision + 1 } : member);
      state.subjectIdentityLinks = state.subjectIdentityLinks.map((link) => link.subjectId === id && link.state === "ACTIVE" ? { ...link, state: "REVOKED", revision: link.revision + 1 } : link);
      advanceAuthorizationEpoch(state, "MEMBERSHIP_CHANGED");
      recordAuthorityTransition(database, state, actor, "PERSON_REMOVED", "PERSON", "Removed the active subject view while preserving revoked participation history", id);
    });
  }

  async addTask(workspaceId: string, actor: WorkspaceActor, input: { title: string; severity: TaskRecord["severity"]; dueAt?: string | undefined; documentId?: string | undefined }): Promise<TaskRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const task: TaskRecord = {
        id: randomUUID(), workspaceId: state.workspace.id, title: input.title, severity: input.severity, state: "OPEN", createdAt: now(),
        ...(input.dueAt ? { dueAt: input.dueAt } : {}), ...(input.documentId ? { documentId: input.documentId } : {}),
      };
      state.tasks.unshift(task);
      state.audit.push(auditRecord(state.workspace.id, actor, "TASK_CREATED", "TASK", "Created a household task", task.id));
      return task;
    });
  }

  async completeTask(workspaceId: string, actor: WorkspaceActor, id: string): Promise<TaskRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const task = state.tasks.find((item) => item.id === id);
      if (!task) throw new NotFoundException("Task not found");
      task.state = "DONE";
      state.audit.push(auditRecord(state.workspace.id, actor, "TASK_COMPLETED", "TASK", "Completed a household task", task.id));
      return task;
    });
  }

  async deleteDocument(workspaceId: string, actor: WorkspaceActor, id: string): Promise<{ documentId: string; state: "TRASHED"; deletedAt: string; purgeDueAt: string }> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
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

  async restoreDocument(workspaceId: string, actor: WorkspaceActor, id: string, at = now()): Promise<DocumentRecord> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
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

  async exportWorkspace(workspaceId: string): Promise<WorkspaceState> {
    const state = this.state(await this.readDatabase(), workspaceId);
    return { ...state, documents: state.documents.map(({ extractedText: _content, ...document }) => document) } as WorkspaceState;
  }

  async recordRecoveryBlocked(workspaceId: string, actor: WorkspaceActor): Promise<{ caseId: string; workspaceId: string; caseKind: "WORKSPACE_RECOVERY"; state: "POLICY_BLOCKED"; decisionFence: "DEC-038"; createdAt: string; revision: 1 }> {
    return this.mutate((database) => {
      const state = this.state(database, workspaceId);
      const createdAt = now();
      const caseId = randomUUID();
      recordAuthorityTransition(database, state, actor, "RECOVERY_POLICY_BLOCKED", "WORKSPACE", "Recovery and ownership transfer remain unavailable under DEC-038", workspaceId);
      return { caseId, workspaceId, caseKind: "WORKSPACE_RECOVERY", state: "POLICY_BLOCKED", decisionFence: "DEC-038", createdAt, revision: 1 };
    });
  }
}
