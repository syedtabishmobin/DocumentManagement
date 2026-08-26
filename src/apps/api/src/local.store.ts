import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type {
  Answer,
  DashboardSnapshot,
  DocumentRecord,
  FactRecord,
  Member,
  NotificationRecord,
  TaskRecord,
  Workspace,
} from "@document-management/contracts";
import { classifyDocument, normalizeQuestion } from "@document-management/domain";

interface LocalState {
  workspace: Workspace;
  documents: DocumentRecord[];
  facts: FactRecord[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  members: Member[];
  audit: Array<{ id: string; type: string; resourceId?: string; at: string }>;
}

const now = (): string => new Date().toISOString();

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
        createdAt,
      },
    ],
    audit: [{ id: randomUUID(), type: "WORKSPACE_CREATED", resourceId: workspaceId, at: createdAt }],
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
      return JSON.parse(await readFile(this.statePath, "utf8")) as LocalState;
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
    const { workspace, documents, facts, tasks, notifications, members } = await this.load();
    return { workspace, documents, facts, tasks, notifications, members, localMode: true };
  }

  async addDocument(file: Express.Multer.File): Promise<DocumentRecord> {
    const state = await this.load();
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
      ...(extractedText ? { extractedText } : {}),
      ...(!textual && !classification.policyHold ? { reviewReason: "Local text extraction is not yet available for this format." } : {}),
      ...(classification.policyHold ? { reviewReason: "Suspected clinical content is isolated by policy." } : {}),
    };

    await mkdir(this.artifactRoot, { recursive: true, mode: 0o700 });
    await writeFile(join(this.artifactRoot, id), file.buffer, { mode: 0o600, flag: "wx" });
    state.documents.push(document);
    state.notifications.unshift({
      id: randomUUID(),
      workspaceId: state.workspace.id,
      title: classification.policyHold ? "Document quarantined" : "Document added",
      detail: classification.policyHold ? `${file.originalname} requires review before processing.` : `${file.originalname} is stored locally.`,
      severity: classification.policyHold ? "IMPORTANT" : "INFO",
      read: false,
      createdAt,
    });
    state.audit.push({ id: randomUUID(), type: "DOCUMENT_INGESTED", resourceId: id, at: createdAt });
    await this.save(state);
    return document;
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
    const member: Member = { id: randomUUID(), workspaceId: state.workspace.id, displayName, role, state: "ACTIVE", createdAt: now() };
    state.members.push(member);
    state.audit.push({ id: randomUUID(), type: "MEMBERSHIP_CREATED", resourceId: member.id, at: now() });
    await this.save(state);
    return member;
  }

  async addTask(input: { title: string; severity: TaskRecord["severity"]; dueAt?: string | undefined; documentId?: string | undefined }): Promise<TaskRecord> {
    const state = await this.load();
    const task: TaskRecord = {
      id: randomUUID(), workspaceId: state.workspace.id, title: input.title, severity: input.severity, state: "OPEN", createdAt: now(),
      ...(input.dueAt ? { dueAt: input.dueAt } : {}), ...(input.documentId ? { documentId: input.documentId } : {}),
    };
    state.tasks.unshift(task);
    await this.save(state);
    return task;
  }

  async completeTask(id: string): Promise<TaskRecord> {
    const state = await this.load();
    const task = state.tasks.find((item) => item.id === id);
    if (!task) throw new NotFoundException("Task not found");
    task.state = "DONE";
    await this.save(state);
    return task;
  }

  async deleteDocument(id: string): Promise<void> {
    const state = await this.load();
    const document = state.documents.find((item) => item.id === id);
    if (!document) throw new NotFoundException("Document not found");
    document.status = "DELETED";
    delete document.extractedText;
    document.updatedAt = now();
    state.facts = state.facts.filter((fact) => fact.documentId !== id);
    state.tasks = state.tasks.filter((task) => task.documentId !== id);
    state.audit.push({ id: randomUUID(), type: "DOCUMENT_PURGED", resourceId: id, at: now() });
    try { await unlink(join(this.artifactRoot, id)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    await this.save(state);
  }

  async exportWorkspace(): Promise<LocalState> {
    const state = await this.load();
    return { ...state, documents: state.documents.map(({ extractedText: _content, ...document }) => document) } as LocalState;
  }
}
