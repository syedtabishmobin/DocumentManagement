import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type {
  Answer,
  AuditRecord,
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
  TaskRecord,
  Workspace,
} from "@document-management/contracts";
import { classifyDocument, extractProfileFacts, normalizeQuestion } from "@document-management/domain";

interface LocalState {
  workspace: Workspace;
  documents: DocumentRecord[];
  facts: FactRecord[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  members: Member[];
  subjects: SubjectRecord[];
  audit: AuditRecord[];
  dependencies: DependencyRecord[];
}

const now = (): string => new Date().toISOString();
const trashDeadline = (deletedAt: string): string => {
  const deadline = new Date(deletedAt);
  deadline.setUTCDate(deadline.getUTCDate() + 30);
  return deadline.toISOString();
};
const defaultPermissions = (owner = false): FilePermissions => ({ view: true, add: owner, edit: owner, delete: owner });
const stableId = (prefix: string, ...parts: string[]): string => `${prefix}_${createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 24)}`;

function auditRecord(workspaceId: string, type: string, resourceType: AuditRecord["resourceType"], detail: string, resourceId?: string): AuditRecord {
  return { id: randomUUID(), workspaceId, type, resourceType, ...(resourceId ? { resourceId } : {}), actor: "Local owner", detail, at: now() };
}

function initialState(): LocalState {
  const createdAt = now();
  const workspaceId = "wrk_local_household";
  return {
    workspace: { id: workspaceId, name: "My household", type: "FAMILY", createdAt },
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
        id: "mem_local_owner",
        workspaceId,
        displayName: "Local owner",
        role: "OWNER",
        state: "ACTIVE",
        subjectId: "sub_local_owner",
        invitationState: "ACTIVE",
        permissions: defaultPermissions(true),
        createdAt,
      },
    ],
    subjects: [
      {
        id: "sub_local_owner",
        workspaceId,
        displayName: "Local owner",
        kind: "OWNER",
        relationship: "Self",
        createdAt,
      },
    ],
    audit: [{ id: randomUUID(), workspaceId, type: "WORKSPACE_CREATED", resourceType: "WORKSPACE", resourceId: workspaceId, actor: "Local owner", detail: "Created the local workspace", at: createdAt }],
    dependencies: [],
  };
}

function ensureDocumentIntelligence(state: LocalState): boolean {
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

@Injectable()
export class LocalStore {
  private readonly root = resolve(process.env.DM_DATA_DIR ?? "./local-data");
  private readonly statePath = join(this.root, "state.json");
  private readonly artifactRoot = join(this.root, "artifacts");
  private writeChain: Promise<void> = Promise.resolve();

  private async load(): Promise<LocalState> {
    try {
      const state = JSON.parse(await readFile(this.statePath, "utf8")) as LocalState;
      state.subjects ??= [{ id: "sub_local_owner", workspaceId: state.workspace.id, displayName: state.members[0]?.displayName ?? "Local owner", kind: "OWNER", relationship: "Self", createdAt: state.workspace.createdAt }];
      for (const member of state.members) {
        const fallbackSubjectId = member.role === "OWNER" ? state.subjects.find((subject) => subject.kind === "OWNER")?.id ?? "sub_local_owner" : `sub_member_${member.id}`;
        member.subjectId ??= fallbackSubjectId;
        member.invitationState ??= member.state === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
        member.permissions ??= defaultPermissions(member.role === "OWNER");
        if (!state.subjects.some((subject) => subject.id === member.subjectId)) state.subjects.push({ id: member.subjectId, workspaceId: state.workspace.id, displayName: member.displayName, kind: member.role === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: member.role === "GUEST" ? "Guest" : "Family member", createdAt: member.createdAt });
      }
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
      if (ensureDocumentIntelligence(state)) await this.save(state);
      return state;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const state = initialState();
      await this.save(state);
      return state;
    }
  }

  private async save(state: LocalState): Promise<void> {
    this.writeChain = this.writeChain.then(async () => {
      await mkdir(dirname(this.statePath), { recursive: true });
      const temporary = `${this.statePath}.${process.pid}.tmp`;
      await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
      await rename(temporary, this.statePath);
    });
    await this.writeChain;
  }

  async dashboard(): Promise<DashboardSnapshot> {
    const { workspace, documents, facts, tasks, notifications, members, subjects, audit, dependencies } = await this.load();
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
      localMode: (process.env.DM_PROFILE ?? "local") === "local",
      customerDataPolicy: (process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "production-gated" ? "production-gated" : "synthetic-only",
    };
  }

  async configureWorkspace(name: string, type: Workspace["type"], ownerName: string): Promise<Workspace> {
    const state = await this.load();
    state.workspace.name = name;
    state.workspace.type = type;
    const ownerMember = state.members.find((member) => member.role === "OWNER");
    if (ownerMember) ownerMember.displayName = ownerName;
    const ownerSubject = state.subjects.find((subject) => subject.kind === "OWNER");
    if (ownerSubject) ownerSubject.displayName = ownerName;
    state.audit.push(auditRecord(state.workspace.id, "WORKSPACE_CONFIGURED", "WORKSPACE", `Configured a ${type.toLowerCase()} workspace`, state.workspace.id));
    await this.save(state);
    return state.workspace;
  }

  async addDocument(file: Express.Multer.File, subjectIds: string[], captureRoute: DocumentRecord["captureRoute"]): Promise<DocumentRecord> {
    const state = await this.load();
    if (!subjectIds.length || subjectIds.some((subjectId) => !state.subjects.some((subject) => subject.id === subjectId))) {
      throw new BadRequestException("Select at least one valid household person for this document");
    }
    const id = randomUUID();
    const digest = createHash("sha256").update(file.buffer).digest("hex");
    const duplicate = state.documents.find((item) => item.sha256 === digest && item.status !== "DELETED");
    if (duplicate) return duplicate;

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

    await mkdir(this.artifactRoot, { recursive: true, mode: 0o700 });
    await writeFile(join(this.artifactRoot, id), file.buffer, { mode: 0o600, flag: "wx" });
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
    state.audit.push(auditRecord(state.workspace.id, "DOCUMENT_INGESTED", "DOCUMENT", `Added a document using ${captureRoute.toLowerCase()} capture`, id));
    await this.save(state);
    return document;
  }

  async documentDetail(id: string): Promise<DocumentDetail> {
    const state = await this.load();
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

  async documentArtifact(id: string): Promise<{ buffer: Buffer; mediaType: string; name: string }> {
    const state = await this.load();
    const document = state.documents.find((item) => item.id === id);
    if (!document || document.status === "DELETED") throw new NotFoundException("Document not found");
    if (document.status === "POLICY_HOLD") throw new BadRequestException("This item is isolated and cannot be opened");
    return { buffer: await readFile(join(this.artifactRoot, id)), mediaType: document.mediaType, name: document.name };
  }

  async reviewFact(id: string): Promise<FactRecord> {
    const state = await this.load();
    const fact = state.facts.find((item) => item.id === id);
    if (!fact) throw new NotFoundException("Extracted detail not found");
    const document = state.documents.find((item) => item.id === fact.documentId);
    if (!document || document.status !== "READY") throw new BadRequestException("The source document is not available for fact review");
    fact.reviewState = "REVIEWED";
    fact.recordedAt = now();
    state.audit.push(auditRecord(state.workspace.id, "FACT_REVIEWED", "DOCUMENT", "Reviewed an evidence-linked profile detail", fact.documentId));
    await this.save(state);
    return fact;
  }

  async addManualDocument(input: { name: string; content: string; subjectIds: string[] }): Promise<DocumentRecord> {
    const buffer = Buffer.from(input.content, "utf8");
    return this.addDocument({ originalname: `${input.name}.txt`, mimetype: "text/plain", size: buffer.byteLength, buffer } as Express.Multer.File, input.subjectIds, "MANUAL");
  }

  async addSubject(input: CreateSubjectInput): Promise<SubjectRecord> {
    const state = await this.load();
    const subject: SubjectRecord = {
      id: randomUUID(),
      workspaceId: state.workspace.id,
      displayName: input.displayName,
      kind: input.kind,
      relationship: input.relationship,
      ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}),
      createdAt: now(),
    };
    state.subjects.push(subject);
    state.audit.push(auditRecord(state.workspace.id, "SUBJECT_CREATED", "PERSON", "Added a person to the household", subject.id));
    await this.save(state);
    return subject;
  }

  connectorCatalogue(): ConnectorDescriptor[] {
    const enabled = process.env.DM_EXTERNAL_CONNECTORS === "enabled" && process.env.DM_CONNECTOR_ADAPTERS_READY === "true";
    const descriptor = (item: Omit<ConnectorDescriptor, "status">, configured: boolean): ConnectorDescriptor => ({ ...item, status: enabled && configured ? "READY_TO_CONNECT" : "REQUIRES_CONFIGURATION" });
    return [
      descriptor({ id: "EMAIL_FORWARDING", name: "Private email address", consentPurpose: "Receive documents sent to a unique household ingestion address.", permissionSummary: "Inbound messages and attachments only; no mailbox access.", requiredConfiguration: ["DM_INBOUND_EMAIL_DOMAIN", "DM_EMAIL_WEBHOOK_SECRET"] }, Boolean(process.env.DM_INBOUND_EMAIL_DOMAIN && process.env.DM_EMAIL_WEBHOOK_SECRET)),
      descriptor({ id: "GMAIL", name: "Gmail", consentPurpose: "Let you select email attachments to import into your household vault.", permissionSummary: "Read-only Gmail access with user selection; no send, edit or delete permission.", requiredConfiguration: ["DM_GOOGLE_CLIENT_ID", "DM_GOOGLE_CLIENT_SECRET", "DM_PUBLIC_BASE_URL"] }, Boolean(process.env.DM_GOOGLE_CLIENT_ID && process.env.DM_GOOGLE_CLIENT_SECRET && process.env.DM_PUBLIC_BASE_URL)),
      descriptor({ id: "GOOGLE_DRIVE", name: "Google Drive", consentPurpose: "Let you choose specific Drive files to import.", permissionSummary: "Per-file selection using the narrowest supported Drive scope.", requiredConfiguration: ["DM_GOOGLE_CLIENT_ID", "DM_GOOGLE_CLIENT_SECRET", "DM_PUBLIC_BASE_URL"] }, Boolean(process.env.DM_GOOGLE_CLIENT_ID && process.env.DM_GOOGLE_CLIENT_SECRET && process.env.DM_PUBLIC_BASE_URL)),
      descriptor({ id: "ONEDRIVE", name: "Microsoft OneDrive", consentPurpose: "Let you select OneDrive documents to import.", permissionSummary: "Delegated, read-only file access with explicit Microsoft consent.", requiredConfiguration: ["DM_MICROSOFT_CLIENT_ID", "DM_MICROSOFT_CLIENT_SECRET", "DM_MICROSOFT_TENANT", "DM_PUBLIC_BASE_URL"] }, Boolean(process.env.DM_MICROSOFT_CLIENT_ID && process.env.DM_MICROSOFT_CLIENT_SECRET && process.env.DM_MICROSOFT_TENANT && process.env.DM_PUBLIC_BASE_URL)),
      descriptor({ id: "DROPBOX", name: "Dropbox", consentPurpose: "Let you choose Dropbox files to import.", permissionSummary: "Scoped read access; tokens can be revoked by disconnecting.", requiredConfiguration: ["DM_DROPBOX_APP_KEY", "DM_DROPBOX_APP_SECRET", "DM_PUBLIC_BASE_URL"] }, Boolean(process.env.DM_DROPBOX_APP_KEY && process.env.DM_DROPBOX_APP_SECRET && process.env.DM_PUBLIC_BASE_URL)),
      descriptor({ id: "BOX", name: "Box", consentPurpose: "Let you choose Box files to import.", permissionSummary: "User-authorized read access with an exact callback URL.", requiredConfiguration: ["DM_BOX_CLIENT_ID", "DM_BOX_CLIENT_SECRET", "DM_PUBLIC_BASE_URL"] }, Boolean(process.env.DM_BOX_CLIENT_ID && process.env.DM_BOX_CLIENT_SECRET && process.env.DM_PUBLIC_BASE_URL)),
    ];
  }

  async ask(question: string, documentIds?: string[]): Promise<Answer> {
    const state = await this.load();
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

  async addMember(displayName: string, role: Member["role"]): Promise<Member> {
    const state = await this.load();
    const subject: SubjectRecord = { id: randomUUID(), workspaceId: state.workspace.id, displayName, kind: role === "MANAGED_DEPENDANT" ? "DEPENDANT" : "ADULT", relationship: "Family member", createdAt: now() };
    state.subjects.push(subject);
    const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName, role, state: "ACTIVE", invitationState: "ACTIVE", permissions: defaultPermissions(), createdAt: now() };
    state.members.push(member);
    state.audit.push(auditRecord(state.workspace.id, "MEMBERSHIP_CREATED", "MEMBERSHIP", "Added local workspace access", member.id));
    await this.save(state);
    return member;
  }

  async createPerson(input: ManagePersonInput): Promise<SubjectRecord> {
    const state = await this.load();
    const subject: SubjectRecord = { id: randomUUID(), workspaceId: state.workspace.id, displayName: input.displayName, kind: input.kind, relationship: input.relationship, ...(input.dateOfBirth ? { dateOfBirth: input.dateOfBirth } : {}), createdAt: now() };
    state.subjects.push(subject);
    state.audit.push(auditRecord(state.workspace.id, "PERSON_CREATED", "PERSON", "Added a person to the household", subject.id));
    if (input.loginEnabled) {
      const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName: input.displayName, role: input.role, state: "ACTIVE", invitationState: "PENDING", permissions: input.permissions, ...(input.email ? { email: input.email } : {}), ...(input.mobile ? { mobile: input.mobile } : {}), createdAt: now() };
      state.members.push(member);
      state.audit.push(auditRecord(state.workspace.id, "INVITATION_PREPARED", "MEMBERSHIP", "Prepared a time-limited login invitation; external delivery awaits configuration", member.id));
    }
    await this.save(state);
    return subject;
  }

  async updatePerson(id: string, input: ManagePersonInput): Promise<SubjectRecord> {
    const state = await this.load();
    const subject = state.subjects.find((item) => item.id === id);
    if (!subject) throw new NotFoundException("Person not found");
    if (subject.kind === "OWNER" && input.kind !== "OWNER") throw new BadRequestException("The local owner cannot be changed to another person type");
    subject.displayName = input.displayName; subject.kind = input.kind; subject.relationship = input.relationship;
    if (input.dateOfBirth) subject.dateOfBirth = input.dateOfBirth; else delete subject.dateOfBirth;
    let member = state.members.find((item) => item.subjectId === subject.id);
    if (input.loginEnabled) {
      if (!member) {
        member = { id: randomUUID(), workspaceId: state.workspace.id, subjectId: subject.id, displayName: input.displayName, role: input.role, state: "ACTIVE", invitationState: "PENDING", permissions: input.permissions, createdAt: now() };
        state.members.push(member);
      }
      member.displayName = input.displayName; member.role = subject.kind === "OWNER" ? "OWNER" : input.role; member.state = "ACTIVE"; member.permissions = subject.kind === "OWNER" ? defaultPermissions(true) : input.permissions;
      if (member.invitationState === "SUSPENDED" || member.invitationState === "NOT_INVITED") member.invitationState = "PENDING";
      if (input.email) member.email = input.email; else delete member.email;
      if (input.mobile) member.mobile = input.mobile; else delete member.mobile;
    } else if (member && member.role !== "OWNER") {
      member.state = "REVOKED"; member.invitationState = "SUSPENDED";
    }
    state.audit.push(auditRecord(state.workspace.id, "PERSON_UPDATED", "PERSON", input.loginEnabled ? "Updated person details, login access or file permissions" : "Updated person details and disabled login access", subject.id));
    await this.save(state);
    return subject;
  }

  async deletePerson(id: string): Promise<void> {
    const state = await this.load();
    const subject = state.subjects.find((item) => item.id === id);
    if (!subject) throw new NotFoundException("Person not found");
    if (subject.kind === "OWNER") throw new BadRequestException("The workspace owner cannot be removed");
    if (state.documents.some((document) => document.status !== "DELETED" && document.subjectIds.includes(id))) throw new BadRequestException("Reassign or delete this person's documents before removing them");
    state.subjects = state.subjects.filter((item) => item.id !== id);
    state.members = state.members.filter((item) => item.subjectId !== id);
    state.audit.push(auditRecord(state.workspace.id, "PERSON_REMOVED", "PERSON", "Removed a person with no remaining document assignments", id));
    await this.save(state);
  }

  async addTask(input: { title: string; severity: TaskRecord["severity"]; dueAt?: string | undefined; documentId?: string | undefined }): Promise<TaskRecord> {
    const state = await this.load();
    const task: TaskRecord = {
      id: randomUUID(), workspaceId: state.workspace.id, title: input.title, severity: input.severity, state: "OPEN", createdAt: now(),
      ...(input.dueAt ? { dueAt: input.dueAt } : {}), ...(input.documentId ? { documentId: input.documentId } : {}),
    };
    state.tasks.unshift(task);
    state.audit.push(auditRecord(state.workspace.id, "TASK_CREATED", "TASK", "Created a household task", task.id));
    await this.save(state);
    return task;
  }

  async completeTask(id: string): Promise<TaskRecord> {
    const state = await this.load();
    const task = state.tasks.find((item) => item.id === id);
    if (!task) throw new NotFoundException("Task not found");
    task.state = "DONE";
    state.audit.push(auditRecord(state.workspace.id, "TASK_COMPLETED", "TASK", "Completed a household task", task.id));
    await this.save(state);
    return task;
  }

  async deleteDocument(id: string): Promise<{ documentId: string; state: "TRASHED"; deletedAt: string; purgeDueAt: string }> {
    const state = await this.load();
    const document = state.documents.find((item) => item.id === id);
    if (!document) throw new NotFoundException("Document not found");
    if (document.status === "DELETED" && document.deletedAt && document.purgeDueAt) {
      return { documentId: document.id, state: "TRASHED", deletedAt: document.deletedAt, purgeDueAt: document.purgeDueAt };
    }
    const deletedAt = now();
    document.preDeleteStatus = document.status === "DELETED" ? "NEEDS_REVIEW" : document.status;
    document.status = "DELETED";
    document.deletedAt = deletedAt;
    document.purgeDueAt = trashDeadline(deletedAt);
    document.updatedAt = deletedAt;
    state.audit.push(auditRecord(state.workspace.id, "DOCUMENT_TRASHED", "DOCUMENT", `Moved document to Trash until ${document.purgeDueAt}`, id));
    await this.save(state);
    return { documentId: document.id, state: "TRASHED", deletedAt, purgeDueAt: document.purgeDueAt };
  }

  async restoreDocument(id: string, at = now()): Promise<DocumentRecord> {
    const state = await this.load();
    const document = state.documents.find((item) => item.id === id);
    if (!document || document.status !== "DELETED" || !document.purgeDueAt) throw new NotFoundException("Document is not in Trash");
    if (new Date(at).getTime() >= new Date(document.purgeDueAt).getTime()) throw new BadRequestException("The 30-day recovery period has ended");
    document.status = document.preDeleteStatus ?? (document.extractedText ? "READY" : "NEEDS_REVIEW");
    document.updatedAt = at;
    delete document.deletedAt;
    delete document.purgeDueAt;
    delete document.preDeleteStatus;
    state.audit.push(auditRecord(state.workspace.id, "DOCUMENT_RESTORED", "DOCUMENT", "Restored document from Trash before its purge deadline", id));
    await this.save(state);
    return documentSummary(document);
  }

  async purgeExpiredDocuments(at = now()): Promise<string[]> {
    const state = await this.load();
    const cutoff = new Date(at).getTime();
    const expired = state.documents.filter((document) => document.status === "DELETED" && document.purgeDueAt && new Date(document.purgeDueAt).getTime() <= cutoff);
    for (const document of expired) {
      state.facts = state.facts.filter((fact) => fact.documentId !== document.id);
      state.dependencies = state.dependencies.filter((edge) => edge.evidenceDocumentId !== document.id);
      state.tasks = state.tasks.filter((task) => task.documentId !== document.id);
      state.audit.push(auditRecord(state.workspace.id, "DOCUMENT_PURGED", "DOCUMENT", "Completed final purge after the 30-day Trash period", document.id));
      try { await unlink(join(this.artifactRoot, document.id)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    if (expired.length) {
      const expiredIds = new Set(expired.map((document) => document.id));
      state.documents = state.documents.filter((document) => !expiredIds.has(document.id));
      await this.save(state);
    }
    return expired.map((document) => document.id);
  }

  async exportWorkspace(): Promise<LocalState> {
    const state = await this.load();
    return { ...state, documents: state.documents.map(({ extractedText: _content, ...document }) => document) } as LocalState;
  }
}
