import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

    await store.updatePerson(workspaceId, actor, person.id, {
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
    expect(dashboard.members.find((member) => member.subjectId === person.id)).toMatchObject({ role: "FAMILY_ADMIN", mobile: "+61400000000", permissions: { delete: true } });
    expect(dashboard.authorizationEpoch.value).toBeGreaterThan(1);
    expect(dashboard.audit.some((entry) => entry.type === "PERSON_UPDATED")).toBe(true);
  });

  it("keeps the explicit owner unique and blocks generic ownership-transfer shortcuts", async () => {
    await expect(store.addSubject(workspaceId, actor, { displayName: "Second Owner", kind: "OWNER", relationship: "Self" })).rejects.toThrow("ownership transfer");
    await expect(store.addMember(workspaceId, actor, "Second Owner", "OWNER")).rejects.toThrow("Ownership transfer");
    await expect(store.createPerson(workspaceId, actor, { displayName: "Second Owner", kind: "OWNER", relationship: "Self", loginEnabled: false, role: "FAMILY_ADMIN", permissions: { view: true, add: true, edit: true, delete: true } })).rejects.toThrow("ownership transfer");

    const adult = await store.createPerson(workspaceId, actor, { displayName: "Synthetic Adult", kind: "ADULT", relationship: "Partner", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } });
    await expect(store.updatePerson(workspaceId, actor, adult.id, { displayName: "Synthetic Adult", kind: "OWNER", relationship: "Partner", loginEnabled: true, email: "adult@example.test", role: "FAMILY_ADMIN", permissions: { view: true, add: true, edit: true, delete: true } })).rejects.toThrow("Ownership transfer");
    expect((await store.dashboard(workspaceId)).subjects.filter((subject) => subject.kind === "OWNER")).toHaveLength(1);
  });

  it("blocks removal while documents are assigned, then records safe removal", async () => {
    const person = await store.createPerson(workspaceId, actor, { displayName: "Synthetic Child", kind: "CHILD", relationship: "Child", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } });
    const document = await store.addDocument(workspaceId, actor, textFile("Synthetic school document.", "school.txt"), [person.id], "FILE");
    await expect(store.deletePerson(workspaceId, actor, person.id)).rejects.toThrow("Reassign or delete");
    await store.deleteDocument(workspaceId, actor, document.id);
    await store.deletePerson(workspaceId, actor, person.id);
    const dashboard = await store.dashboard(workspaceId);
    expect(dashboard.subjects.some((item) => item.id === person.id)).toBe(false);
    expect(dashboard.audit[0]?.type).toBe("PERSON_REMOVED");
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
