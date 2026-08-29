import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SubjectRecord } from "@document-management/contracts";
import { LocalStore, type WorkspaceActor } from "./local.store.js";

const actor: WorkspaceActor = { identityId: "id_test_owner", displayName: "Synthetic Owner" };

function textFile(text: string, name = "synthetic.txt"): Express.Multer.File {
  return {
    originalname: name,
    mimetype: "text/plain",
    size: Buffer.byteLength(text),
    buffer: Buffer.from(text),
  } as Express.Multer.File;
}

describe("LocalStore", () => {
  let directory: string;
  let store: LocalStore;
  let workspaceId: string;
  let ownerSubjectId: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "document-management-test-"));
    process.env.DM_DATA_DIR = directory;
    store = new LocalStore();
    const workspace = await store.createWorkspace(actor, "Synthetic household", "FAMILY", "workspace-test-key-0001");
    workspaceId = workspace.id;
    ownerSubjectId = (await store.dashboard(workspaceId)).subjects.find((subject) => subject.kind === "OWNER")!.id;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("creates idempotent, isolated workspaces with explicit authority records", async () => {
    const repeated = await store.createWorkspace(actor, "Synthetic household", "FAMILY", "workspace-test-key-0001");
    expect(repeated.id).toBe(workspaceId);
    await expect(store.createWorkspace(actor, "Changed household", "PERSONAL", "workspace-test-key-0001")).rejects.toThrow("already used");

    const otherActor = { identityId: "id_other", displayName: "Other Synthetic Owner" };
    const other = await store.createWorkspace(otherActor, "Other household", "PERSONAL", "workspace-test-key-0002");
    expect((await store.listWorkspaces(actor.identityId)).map((workspace) => workspace.id)).toEqual([workspaceId]);
    expect((await store.listWorkspaces(otherActor.identityId)).map((workspace) => workspace.id)).toEqual([other.id]);
    await expect(store.requireAuthorization(actor, other.id, "workspace.read", "WORKSPACE", other.id)).rejects.toThrow("not available");

    const dashboard = await store.dashboard(workspaceId);
    expect(dashboard.accessGrants).toEqual([expect.objectContaining({ granteeIdentityId: actor.identityId, resourceKind: "WORKSPACE", exportAllowed: true })]);
    expect(dashboard.authorizationEpoch).toMatchObject({ value: 1, cause: "WORKSPACE_CREATED" });
    await expect(store.requireAuthorization(actor, workspaceId, "document.create", "WORKSPACE", workspaceId)).resolves.toBeUndefined();
    const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { schemaVersion: number; authorityOutbox: Array<{ eventType: string; correlationId: string }> };
    expect(persisted.schemaVersion).toBe(3);
    expect(persisted.authorityOutbox).toEqual(expect.arrayContaining([expect.objectContaining({ eventType: "WORKSPACE_CREATED" })]));
    expect(persisted.authorityOutbox.every((event) => Boolean(event.correlationId))).toBe(true);
  });

  it("keeps deferred workspace creation inaccessible until owner activation and replays the final outcome", async () => {
    const correlationId = "corr-story-p1-001-activation";
    const pending = await store.createWorkspace(actor, "Deferred household", "FAMILY", "workspace-deferred-key-0001", {
      purposeId: "PUR-P1-001",
      correlationId,
      jurisdictionPackRef: "jurisdiction.AU",
      residencyPolicyRef: "residency.local.synthetic",
      configurationVersion: "configuration.local.synthetic@0.1",
      activation: "DEFERRED",
    });
    expect(pending).toMatchObject({ status: "PENDING_ACTIVATION", revision: 1 });
    expect((await store.listWorkspaces(actor.identityId)).map((workspace) => workspace.id)).not.toContain(pending.id);
    await expect(store.requireAuthorization(actor, pending.id, "workspace.read", "WORKSPACE", pending.id)).rejects.toThrow("not available");
    await expect(store.activateWorkspace({ identityId: "id_foreign", displayName: "Foreign actor" }, pending.id, correlationId)).rejects.toThrow("not available");

    const activated = await store.activateWorkspace(actor, pending.id, correlationId);
    expect(activated).toMatchObject({ status: "ACTIVE", revision: 2 });
    await expect(store.requireAuthorization(actor, pending.id, "workspace.read", "WORKSPACE", pending.id)).resolves.toBeUndefined();
    await expect(store.createWorkspace(actor, "Deferred household", "FAMILY", "workspace-deferred-key-0001", {
      purposeId: "PUR-P1-001",
      correlationId: "corr-story-p1-001-retry",
      jurisdictionPackRef: "jurisdiction.AU",
      residencyPolicyRef: "residency.local.synthetic",
      configurationVersion: "configuration.local.synthetic@0.1",
      activation: "DEFERRED",
    })).resolves.toMatchObject({ id: pending.id, status: "ACTIVE", revision: 2 });

    const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as {
      workspaces: Array<{ workspace: { id: string }; audit: Array<{ type: string; correlationId: string }> }>;
      authorityOutbox: Array<{ workspaceId: string; eventType: string; correlationId: string }>;
    };
    const state = persisted.workspaces.find((candidate) => candidate.workspace.id === pending.id)!;
    expect(state.audit.map((entry) => [entry.type, entry.correlationId])).toEqual([
      ["WORKSPACE_CREATED", correlationId],
      ["WORKSPACE_ACTIVATED", correlationId],
    ]);
    expect(persisted.authorityOutbox.filter((event) => event.workspaceId === pending.id).map((event) => event.eventType)).toEqual(["WORKSPACE_CREATED", "WORKSPACE_ACTIVATED"]);
  });

  it("rejects stale or unknown workspace configuration before creating authority state", async () => {
    const before = await store.listWorkspaces(actor.identityId);
    await expect(store.createWorkspace(actor, "Unsafe household", "PERSONAL", "workspace-invalid-config-0001", {
      purposeId: "PUR-P1-001",
      correlationId: "corr-story-p1-001-invalid",
      jurisdictionPackRef: "jurisdiction.AU",
      residencyPolicyRef: "residency.local.synthetic",
      configurationVersion: "configuration.unknown@9.9",
      activation: "DEFERRED",
    })).rejects.toThrow("unavailable or no longer current");
    expect(await store.listWorkspaces(actor.identityId)).toEqual(before);
  });

  it("replays compatible legacy creation receipts without weakening current configuration binding", async () => {
    const key = "workspace-legacy-receipt-0001";
    const created = await store.createWorkspace(actor, "Legacy receipt household", "FAMILY", key);
    const path = join(directory, "state.json");
    const database = JSON.parse(await readFile(path, "utf8")) as { workspaceCreationReceipts: Array<{ requestFingerprint: string }> };
    database.workspaceCreationReceipts.at(-1)!.requestFingerprint = createHash("sha256").update(JSON.stringify({ name: "Legacy receipt household", type: "FAMILY" })).digest("hex");
    await writeFile(path, JSON.stringify(database));

    const restarted = new LocalStore();
    await expect(restarted.createWorkspace(actor, "Legacy receipt household", "FAMILY", key)).resolves.toMatchObject({ id: created.id });
    await expect(restarted.createWorkspace(actor, "Changed legacy receipt household", "FAMILY", key)).rejects.toThrow("already used");
  });

  it("claims a legacy single-workspace owner without fabricating a second workspace", async () => {
    const createdAt = "2026-08-28T00:00:00.000Z";
    await writeFile(join(directory, "state.json"), JSON.stringify({
      workspace: { id: "wrk_legacy", name: "Legacy household", type: "FAMILY", createdAt },
      documents: [], facts: [], tasks: [], notifications: [],
      members: [{ id: "mem_legacy", workspaceId: "wrk_legacy", displayName: "Local owner", role: "OWNER", state: "ACTIVE", subjectId: "sub_legacy", invitationState: "ACTIVE", permissions: { view: true, add: true, edit: true, delete: true }, createdAt }],
      subjects: [{ id: "sub_legacy", workspaceId: "wrk_legacy", displayName: "Local owner", kind: "OWNER", relationship: "Self", createdAt }],
      audit: [{ id: "audit_legacy", workspaceId: "wrk_legacy", type: "WORKSPACE_CREATED", resourceType: "WORKSPACE", resourceId: "wrk_legacy", actor: "Local owner", detail: "Created the local workspace", at: createdAt }],
      dependencies: [],
      authorityCommandReceipts: [],
    }));
    const migrated = new LocalStore();
    expect(await migrated.listWorkspaces(actor.identityId)).toEqual([]);
    expect(await migrated.claimLegacyWorkspace(actor)).toMatchObject({ id: "wrk_legacy", name: "Legacy household" });
    expect(await migrated.listWorkspaces(actor.identityId)).toEqual([expect.objectContaining({ id: "wrk_legacy" })]);
    await expect(migrated.requireAuthorization(actor, "wrk_legacy", "workspace.read", "WORKSPACE", "wrk_legacy")).resolves.toBeUndefined();
    expect((await migrated.dashboard("wrk_legacy")).members[0]).toMatchObject({ identityId: actor.identityId, revision: 2 });
  });

  it("stores, retrieves, cites, trashes, restores, and finally purges a local text document", async () => {
    const text = "Home insurance policy expires on 30 June 2027.\nPolicy number: SYN-12345";
    const uploaded = await store.addDocument(workspaceId, actor, textFile(text, "home-insurance.txt"), [ownerSubjectId], "FILE");
    expect(uploaded).toMatchObject({ status: "READY", category: "Insurance", workspaceId });

    const answer = await store.ask(workspaceId, "When does the home insurance policy expire?");
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.answer).toContain("30 June 2027");

    let dashboard = await store.dashboard(workspaceId);
    expect(dashboard.documents.find((document) => document.id === uploaded.id)?.extractedText).toBeUndefined();
    expect(dashboard.facts).toEqual(expect.arrayContaining([expect.objectContaining({ documentId: uploaded.id, definitionId: "fact.policy.number", value: "SYN-12345", reviewState: "PROPOSED" })]));
    expect(dashboard.dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({ evidenceDocumentId: uploaded.id, kind: "DOCUMENT_SUBJECT" }),
      expect.objectContaining({ evidenceDocumentId: uploaded.id, kind: "DOCUMENT_CONTAINS_FACT" }),
      expect.objectContaining({ evidenceDocumentId: uploaded.id, kind: "DOCUMENT_CATEGORY" }),
    ]));
    expect(await store.documentDetail(workspaceId, uploaded.id)).toMatchObject({ preview: { kind: "TEXT", text }, facts: [expect.objectContaining({ name: "Expiry date" }), expect.objectContaining({ name: "Policy number" })] });
    expect((await store.documentArtifact(workspaceId, uploaded.id)).buffer.toString("utf8")).toBe(text);
    const reviewed = await store.reviewFact(workspaceId, actor, dashboard.facts.find((fact) => fact.definitionId === "fact.policy.number")!.id);
    expect(reviewed.reviewState).toBe("REVIEWED");
    expect((await store.dashboard(workspaceId)).audit.some((entry) => entry.type === "FACT_REVIEWED")).toBe(true);

    const deletion = await store.deleteDocument(workspaceId, actor, uploaded.id);
    expect(deletion).toMatchObject({ state: "TRASHED", documentId: uploaded.id });
    dashboard = await store.dashboard(workspaceId);
    expect(dashboard.documents.find((document) => document.id === uploaded.id)?.status).toBe("DELETED");
    expect(dashboard.dependencies.some((edge) => edge.evidenceDocumentId === uploaded.id)).toBe(false);
    expect(await store.ask(workspaceId, "When does the home insurance policy expire?")).toMatchObject({ confidence: "LOW", citations: [] });
    await expect(store.documentArtifact(workspaceId, uploaded.id)).rejects.toThrow("not found");

    const restored = await store.restoreDocument(workspaceId, actor, uploaded.id, new Date(new Date(deletion.deletedAt).getTime() + 1_000).toISOString());
    expect(restored.status).toBe("READY");
    expect((await store.documentArtifact(workspaceId, uploaded.id)).buffer.toString("utf8")).toBe(text);
    expect((await store.ask(workspaceId, "When does the home insurance policy expire?")).citations.length).toBeGreaterThan(0);

    const deletedAgain = await store.deleteDocument(workspaceId, actor, uploaded.id);
    await expect(store.restoreDocument(workspaceId, actor, uploaded.id, deletedAgain.purgeDueAt)).rejects.toThrow("recovery period has ended");
    expect(await store.purgeExpiredDocuments(workspaceId, deletedAgain.purgeDueAt)).toEqual([uploaded.id]);
    expect((await store.dashboard(workspaceId)).documents.some((document) => document.id === uploaded.id)).toBe(false);
    await expect(store.documentArtifact(workspaceId, uploaded.id)).rejects.toThrow("not found");
  });

  it("isolates suspected clinical content", async () => {
    const text = "Clinical note: diagnosis and pathology result.";
    const uploaded = await store.addDocument(workspaceId, actor, textFile(text, "record.txt"), [ownerSubjectId], "FILE");
    expect(uploaded.status).toBe("POLICY_HOLD");
    expect((await store.ask(workspaceId, "What is the diagnosis?")).citations).toEqual([]);
    await expect(store.documentDetail(workspaceId, uploaded.id)).rejects.toThrow("isolated");
    await expect(store.documentArtifact(workspaceId, uploaded.id)).rejects.toThrow("isolated");
  });

  it("keeps one household person linked to explicit prospective login settings without fabricating grants", async () => {
    const person = await store.createPerson(workspaceId, actor, {
      displayName: "Synthetic Adult",
      kind: "ADULT",
      relationship: "Partner",
      loginEnabled: true,
      email: "adult@example.test",
      role: "ADULT_MEMBER",
      permissions: { view: true, add: true, edit: false, delete: false },
    });
    let dashboard = await store.dashboard(workspaceId);
    expect(dashboard.members.find((member) => member.subjectId === person.id)).toMatchObject({ invitationState: "PENDING", permissions: { add: true, edit: false } });
    expect(dashboard.accessGrants.some((grant) => grant.granteeIdentityId !== actor.identityId)).toBe(false);

    await store.updatePerson(workspaceId, actor, person.id, person.revision, {
      displayName: "Synthetic Adult Updated",
      kind: "ADULT",
      relationship: "Partner",
      loginEnabled: true,
      mobile: "+61400000000",
      role: "FAMILY_ADMIN",
      permissions: { view: true, add: true, edit: true, delete: true },
    });
    dashboard = await store.dashboard(workspaceId);
    expect(dashboard.subjects.find((item) => item.id === person.id)?.displayName).toBe("Synthetic Adult Updated");
    expect(dashboard.subjects.find((item) => item.id === person.id)?.history).toHaveLength(1);
    expect(dashboard.members.find((member) => member.subjectId === person.id)).toMatchObject({ role: "FAMILY_ADMIN", mobile: "+61400000000", permissions: { delete: true } });
    expect(dashboard.authorizationEpoch.value).toBeGreaterThan(1);
    expect(dashboard.audit.some((entry) => entry.type === "PERSON_UPDATED")).toBe(true);
  });

  it("represents a managed dependant without fabricating identity, membership or authority and rejects stale or foreign changes", async () => {
    const input = {
      displayName: "Synthetic Dependant", kind: "DEPENDANT" as const, relationship: "Child", loginEnabled: false,
      role: "MANAGED_DEPENDANT" as const, permissions: { view: false, add: false, edit: false, delete: false },
    };
    const dependant = await store.createPerson(workspaceId, actor, input);
    expect(dependant).toMatchObject({ workspaceId, kind: "DEPENDANT", status: "ACTIVE", revision: 1, history: [] });
    let database = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as {
      workspaces: Array<{ workspace: { id: string }; subjects: SubjectRecord[]; members: Array<{ subjectId: string }>; subjectIdentityLinks: Array<{ subjectId: string }>; accessGrants: Array<{ resourceIds: string[] }>; audit: Array<{ type: string; outcome?: string }> }>;
      authorityOutbox: Array<{ eventType: string }>;
    };
    let state = database.workspaces.find((candidate) => candidate.workspace.id === workspaceId)!;
    expect(state.members.some((member) => member.subjectId === dependant.id)).toBe(false);
    expect(state.subjectIdentityLinks.some((link) => link.subjectId === dependant.id)).toBe(false);
    expect(state.accessGrants.some((grant) => grant.resourceIds.includes(dependant.id))).toBe(false);
    expect(state.audit.some((entry) => entry.type === "PERSON_CREATED")).toBe(true);

    const updated = await store.updatePerson(workspaceId, actor, dependant.id, dependant.revision, { ...input, relationship: "Dependant" });
    expect(updated).toMatchObject({ id: dependant.id, relationship: "Dependant", revision: 2, history: [expect.objectContaining({ revision: 1, relationship: "Child" })] });
    await expect(store.updatePerson(workspaceId, actor, dependant.id, 1, { ...input, relationship: "Stale overwrite" })).rejects.toThrow("refresh before retrying");

    const foreignActor = { identityId: "id_foreign_subject_owner", displayName: "Foreign Synthetic Owner" };
    const foreign = await store.createWorkspace(foreignActor, "Foreign subject household", "FAMILY", "foreign-subject-workspace-0001");
    const foreignSubject = await store.createPerson(foreign.id, foreignActor, { ...input, displayName: "Foreign Synthetic Dependant" });
    await expect(store.updatePerson(workspaceId, actor, foreignSubject.id, foreignSubject.revision, input)).rejects.toThrow("Resource not available");

    database = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
    state = database.workspaces.find((candidate) => candidate.workspace.id === workspaceId)!;
    expect(state.subjects.find((subject) => subject.id === dependant.id)).toMatchObject({ relationship: "Dependant", revision: 2 });
    expect(state.members.some((member) => member.subjectId === dependant.id)).toBe(false);
    expect(state.audit.filter((entry) => entry.type === "PERSON_CHANGE_REJECTED")).toHaveLength(2);
    expect(database.authorityOutbox.filter((event) => event.eventType === "PERSON_CHANGE_REJECTED")).toHaveLength(2);
  });

  it("keeps the explicit owner unique and blocks generic ownership-transfer shortcuts", async () => {
    await expect(store.addSubject(workspaceId, actor, { displayName: "Second Owner", kind: "OWNER", relationship: "Self" })).rejects.toThrow("ownership transfer");
    await expect(store.addMember(workspaceId, actor, "Second Owner", "OWNER")).rejects.toThrow("Ownership transfer");
    await expect(store.createPerson(workspaceId, actor, { displayName: "Second Owner", kind: "OWNER", relationship: "Self", loginEnabled: false, role: "FAMILY_ADMIN", permissions: { view: true, add: true, edit: true, delete: true } })).rejects.toThrow("ownership transfer");

    const adult = await store.createPerson(workspaceId, actor, { displayName: "Synthetic Adult", kind: "ADULT", relationship: "Partner", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } });
    await expect(store.updatePerson(workspaceId, actor, adult.id, adult.revision, { displayName: "Synthetic Adult", kind: "OWNER", relationship: "Partner", loginEnabled: true, email: "adult@example.test", role: "FAMILY_ADMIN", permissions: { view: true, add: true, edit: true, delete: true } })).rejects.toThrow("Ownership transfer");
    expect((await store.dashboard(workspaceId)).subjects.filter((subject) => subject.kind === "OWNER")).toHaveLength(1);
  });

  it("blocks removal while documents are assigned, then records safe removal", async () => {
    const person = await store.createPerson(workspaceId, actor, { displayName: "Synthetic Child", kind: "CHILD", relationship: "Child", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } });
    const document = await store.addDocument(workspaceId, actor, textFile("Synthetic school document.", "school.txt"), [person.id], "FILE");
    await expect(store.deletePerson(workspaceId, actor, person.id, person.revision)).rejects.toThrow("Reassign or delete");
    await store.deleteDocument(workspaceId, actor, document.id);
    await store.deletePerson(workspaceId, actor, person.id, person.revision);
    const dashboard = await store.dashboard(workspaceId);
    expect(dashboard.subjects.some((item) => item.id === person.id)).toBe(false);
    expect(dashboard.audit[0]?.type).toBe("PERSON_REMOVED");
    const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ subjects: Array<{ id: string; status: string; history: unknown[] }> }> };
    expect(persisted.workspaces[0]!.subjects.find((item) => item.id === person.id)).toMatchObject({ status: "RETIRED", history: [expect.any(Object)] });
  });

  it("records the approved recovery-unavailable policy boundary", async () => {
    const recoveryCase = await store.recordRecoveryBlocked(workspaceId, actor);
    expect(recoveryCase).toMatchObject({ workspaceId, state: "POLICY_BLOCKED", decisionFence: "DEC-038" });
    expect((await store.dashboard(workspaceId)).audit[0]).toMatchObject({ type: "RECOVERY_POLICY_BLOCKED", actorId: actor.identityId });
  });

  it("distinguishes prepared connector registrations from activated adapters without loading secrets", () => {
    const variables = {
      DM_PUBLIC_BASE_URL: "https://doculyra.example.test",
      DM_GOOGLE_CLIENT_ID: "public-google-client-id",
      DM_GOOGLE_CLIENT_SECRET_CONFIGURED: "true",
      DM_MICROSOFT_CLIENT_ID: "public-microsoft-client-id",
      DM_MICROSOFT_CLIENT_SECRET_CONFIGURED: "true",
      DM_MICROSOFT_TENANT: "test-tenant",
      DM_DROPBOX_APP_KEY: "public-dropbox-app-key",
      DM_DROPBOX_APP_SECRET_CONFIGURED: "true",
      DM_BOX_CLIENT_ID: "public-box-client-id",
      DM_BOX_CLIENT_SECRET_CONFIGURED: "true",
      DM_EXTERNAL_CONNECTORS: "disabled",
      DM_CONNECTOR_ADAPTERS_READY: "false",
    } as const;
    Object.assign(process.env, variables);
    try {
      const connectors = store.connectorCatalogue();
      expect(connectors.filter((connector) => connector.id !== "EMAIL_FORWARDING").every((connector) => connector.status === "CONFIGURED_DISABLED")).toBe(true);
      expect(connectors.find((connector) => connector.id === "GOOGLE_DRIVE")?.callbackUrl).toBe("https://doculyra.example.test/api/connectors/google-drive/callback");
      expect(connectors.find((connector) => connector.id === "ONEDRIVE")?.requiredConfiguration).toContain("microsoft-documents-client-secret");
    } finally {
      for (const variable of Object.keys(variables)) delete process.env[variable];
    }
  });
});
