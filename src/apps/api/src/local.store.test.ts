import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  async function ask(question: string) {
    const fence = await store.startAuthorization(actor, workspaceId, "document.read", "WORKSPACE", workspaceId);
    return store.ask(workspaceId, actor, fence, question, undefined, "corr-local-store-ask");
  }

  async function detail(documentId: string) {
    const fence = await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", documentId);
    return store.documentDetail(workspaceId, documentId, actor, fence, "corr-local-store-detail");
  }

  async function artifact(documentId: string) {
    const fence = await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", documentId);
    return store.documentArtifact(workspaceId, documentId, actor, fence, "corr-local-store-artifact");
  }

  async function effect(action: Parameters<LocalStore["startAuthorization"]>[2], resourceKind: Parameters<LocalStore["startAuthorization"]>[3], resourceId?: string, target = { store, actor, workspaceId }) {
    return target.store.startAuthorization(target.actor, target.workspaceId, action, resourceKind, resourceId, { correlationId: `corr-test-${action.replaceAll(".", "-")}` });
  }

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
    expect(state.audit.filter((entry) => entry.type === "WORKSPACE_CREATED" || entry.type === "WORKSPACE_ACTIVATED").map((entry) => [entry.type, entry.correlationId])).toEqual([
      ["WORKSPACE_CREATED", correlationId],
      ["WORKSPACE_ACTIVATED", correlationId],
    ]);
    expect(persisted.authorityOutbox.filter((event) => event.workspaceId === pending.id && (event.eventType === "WORKSPACE_CREATED" || event.eventType === "WORKSPACE_ACTIVATED")).map((event) => event.eventType)).toEqual(["WORKSPACE_CREATED", "WORKSPACE_ACTIVATED"]);
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
    const uploaded = await store.addDocument(workspaceId, actor, textFile(text, "home-insurance.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-test-document-create");
    expect(uploaded).toMatchObject({ status: "READY", category: "Insurance", workspaceId });

    const answer = await ask("When does the home insurance policy expire?");
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
    expect(await detail(uploaded.id)).toMatchObject({ preview: { kind: "TEXT", text }, facts: [expect.objectContaining({ name: "Expiry date" }), expect.objectContaining({ name: "Policy number" })] });
    expect((await artifact(uploaded.id)).buffer.toString("utf8")).toBe(text);
    const reviewed = await store.reviewFact(workspaceId, actor, dashboard.facts.find((fact) => fact.definitionId === "fact.policy.number")!.id, await effect("fact.review", "WORKSPACE"), "corr-test-fact-review");
    expect(reviewed.reviewState).toBe("REVIEWED");
    expect((await store.dashboard(workspaceId)).audit.some((entry) => entry.type === "FACT_REVIEWED")).toBe(true);

    const deletion = await store.deleteDocument(workspaceId, actor, uploaded.id, await effect("document.delete", "DOCUMENT", uploaded.id), "corr-test-document-delete");
    expect(deletion).toMatchObject({ state: "TRASHED", documentId: uploaded.id });
    dashboard = await store.dashboard(workspaceId);
    expect(dashboard.documents.find((document) => document.id === uploaded.id)?.status).toBe("DELETED");
    expect(dashboard.dependencies.some((edge) => edge.evidenceDocumentId === uploaded.id)).toBe(false);
    expect(await ask("When does the home insurance policy expire?")).toMatchObject({ confidence: "LOW", citations: [] });
    await expect(artifact(uploaded.id)).rejects.toThrow("not found");

    const restored = await store.restoreDocument(workspaceId, actor, uploaded.id, await effect("document.edit", "DOCUMENT", uploaded.id), "corr-test-document-restore", new Date(new Date(deletion.deletedAt).getTime() + 1_000).toISOString());
    expect(restored.status).toBe("READY");
    expect((await artifact(uploaded.id)).buffer.toString("utf8")).toBe(text);
    expect((await ask("When does the home insurance policy expire?")).citations.length).toBeGreaterThan(0);

    const deletedAgain = await store.deleteDocument(workspaceId, actor, uploaded.id, await effect("document.delete", "DOCUMENT", uploaded.id), "corr-test-document-delete-again");
    await expect(store.restoreDocument(workspaceId, actor, uploaded.id, await effect("document.edit", "DOCUMENT", uploaded.id), "corr-test-document-restore-expired", deletedAgain.purgeDueAt)).rejects.toThrow("recovery period has ended");
    expect(await store.purgeExpiredDocuments(workspaceId, deletedAgain.purgeDueAt)).toEqual([uploaded.id]);
    expect((await store.dashboard(workspaceId)).documents.some((document) => document.id === uploaded.id)).toBe(false);
    await expect(artifact(uploaded.id)).rejects.toThrow("not found");
  });

  it("keeps artifact bytes immutable and redeems only exact short-lived document-version grants", async () => {
    const bytes = "Synthetic immutable artifact bytes";
    const first = await store.addDocument(workspaceId, actor, textFile(bytes, "first.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-story-007-first");
    const second = await store.addDocument(workspaceId, actor, textFile(bytes, "second.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-story-007-second");
    expect(second.id).not.toBe(first.id);

    const readFence = await effect("document.read", "DOCUMENT", first.id);
    const versions = await store.documentVersions(workspaceId, first.id, actor, readFence, "corr-story-007-versions");
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({ documentId: first.id, versionRelation: "INITIAL", revision: 1 });
    const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ artifacts: Array<{ id: string; contentDigest: string }>; documentVersions: Array<{ documentId: string; artifactId: string }> }> };
    const authority = persisted.workspaces[0]!;
    const firstVersion = authority.documentVersions.find((version) => version.documentId === first.id)!;
    const secondVersion = authority.documentVersions.find((version) => version.documentId === second.id)!;
    expect(firstVersion.artifactId).not.toBe(secondVersion.artifactId);
    expect(authority.artifacts.find((artifact) => artifact.id === firstVersion.artifactId)?.contentDigest).toBe(authority.artifacts.find((artifact) => artifact.id === secondVersion.artifactId)?.contentDigest);

    const issueFence = await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", first.id, { fieldRef: "document.content", correlationId: "corr-story-007-issue-auth" });
    const grant = await store.issueArtifactAccessGrant(workspaceId, first.id, versions[0]!.id, actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-artifact-grant-0001", issueFence, "corr-story-007-issue");
    expect(new Date(grant.expiresAt).getTime() - new Date(grant.createdAt).getTime()).toBe(5 * 60_000);

    const redemptionFence = await effect("document.read", "WORKSPACE", workspaceId);
    const redeemed = await store.redeemArtifactAccessGrant(workspaceId, grant.id, actor, { requested_operation: "VIEW" }, "story-007-redemption-0001", redemptionFence, "corr-story-007-redeem");
    expect(redeemed.buffer.toString("utf8")).toBe(bytes);
    expect(redeemed.digest).toBe(createHash("sha256").update(bytes).digest("hex"));
    expect(redeemed.transferRef).toMatch(/^protected-transfer:/);
    const replayFence = await effect("document.read", "WORKSPACE", workspaceId);
    const replay = await store.redeemArtifactAccessGrant(workspaceId, grant.id, actor, { requested_operation: "VIEW" }, "story-007-redemption-0001", replayFence, "corr-story-007-replay");
    expect(replay.redemptionId).toBe(redeemed.redemptionId);
    expect(replay.buffer.equals(redeemed.buffer)).toBe(true);

    const restarted = new LocalStore();
    const restartFence = await effect("document.read", "WORKSPACE", workspaceId, { store: restarted, actor, workspaceId });
    const afterRestart = await restarted.redeemArtifactAccessGrant(workspaceId, grant.id, actor, { requested_operation: "VIEW" }, "story-007-redemption-0002", restartFence, "corr-story-007-restart");
    expect(afterRestart.buffer.toString("utf8")).toBe(bytes);

    const expiringIssueFence = await restarted.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", first.id, { fieldRef: "document.content" });
    const expiring = await restarted.issueArtifactAccessGrant(workspaceId, first.id, versions[0]!.id, actor, { operation: "DOWNLOAD", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-artifact-grant-0002", expiringIssueFence, "corr-story-007-expiring");
    const expiredFence = await restarted.startAuthorization(actor, workspaceId, "document.read", "WORKSPACE", workspaceId);
    await expect(restarted.redeemArtifactAccessGrant(workspaceId, expiring.id, actor, { requested_operation: "DOWNLOAD" }, "story-007-redemption-expired", expiredFence, "corr-story-007-expired", new Date(new Date(expiring.expiresAt).getTime() + 1).toISOString())).rejects.toThrow("not available");

    const deletionIssueFence = await restarted.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", second.id, { fieldRef: "document.content" });
    const deletionGrant = await restarted.issueArtifactAccessGrant(workspaceId, second.id, (await restarted.documentVersions(workspaceId, second.id, actor, deletionIssueFence, "corr-story-007-second-version"))[0]!.id, actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-artifact-grant-0003", deletionIssueFence, "corr-story-007-delete-grant");
    await restarted.deleteDocument(workspaceId, actor, second.id, await restarted.startAuthorization(actor, workspaceId, "document.delete", "DOCUMENT", second.id), "corr-story-007-delete");
    const deletedFence = await restarted.startAuthorization(actor, workspaceId, "document.read", "WORKSPACE", workspaceId);
    await expect(restarted.redeemArtifactAccessGrant(workspaceId, deletionGrant.id, actor, { requested_operation: "VIEW" }, "story-007-redemption-deleted", deletedFence, "corr-story-007-deleted")).rejects.toThrow("not available");

    const finalState = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ audit: unknown[] }>; authorityOutbox: unknown[] };
    expect(JSON.stringify({ audit: finalState.workspaces[0]!.audit, authorityOutbox: finalState.authorityOutbox })).not.toContain(bytes);
    expect(JSON.stringify(finalState)).toContain("ARTIFACT_ACCESS_REDEMPTION_DENIED");
  });

  it("fails closed for wrong artifact scope, quarantine, integrity, stale policy and revocation", async () => {
    const document = await store.addDocument(workspaceId, actor, textFile("Synthetic negative matrix", "matrix.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-story-007-matrix");
    const versionFence = await effect("document.read", "DOCUMENT", document.id);
    const version = (await store.documentVersions(workspaceId, document.id, actor, versionFence, "corr-story-007-matrix-version"))[0]!;
    await expect(store.issueArtifactAccessGrant(workspaceId, document.id, version.id, actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: "identity-wrong-audience" }, "story-007-wrong-audience-0001", await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id, { fieldRef: "document.content" }), "corr-story-007-wrong-audience")).rejects.toThrow("not available");
    await expect(store.issueArtifactAccessGrant(workspaceId, document.id, "version-wrong-synthetic", actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-wrong-version-0001", await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id, { fieldRef: "document.content" }), "corr-story-007-wrong-version")).rejects.toThrow("not available");

    const contained = await store.addDocument(workspaceId, actor, textFile("Clinical note: synthetic diagnosis", "contained.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-story-007-contained");
    const stateAfterContainment = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ documentVersions: Array<{ id: string; documentId: string }> }> };
    const containedVersion = stateAfterContainment.workspaces[0]!.documentVersions.find((candidate) => candidate.documentId === contained.id)!;
    await expect(store.issueArtifactAccessGrant(workspaceId, contained.id, containedVersion.id, actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-contained-grant-0001", await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", contained.id, { fieldRef: "document.content" }), "corr-story-007-contained-grant")).rejects.toThrow("not available");

    const integrityGrant = await store.issueArtifactAccessGrant(workspaceId, document.id, version.id, actor, { operation: "DOWNLOAD", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-integrity-grant-0001", await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id, { fieldRef: "document.content" }), "corr-story-007-integrity-grant");
    await writeFile(join(directory, "artifacts", workspaceId, version.artifactId), "tampered synthetic bytes");
    await expect(store.redeemArtifactAccessGrant(workspaceId, integrityGrant.id, actor, { requested_operation: "DOWNLOAD" }, "story-007-integrity-redemption-0001", await effect("document.read", "WORKSPACE", workspaceId), "corr-story-007-integrity-redemption")).rejects.toThrow("not available");
    const afterIntegrity = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ artifacts: Array<{ id: string; integrityState: string }>; audit: Array<{ type: string; decisionReason?: string; detail: string }> }> };
    expect(afterIntegrity.workspaces[0]!.artifacts.find((artifact) => artifact.id === version.artifactId)?.integrityState).toBe("FAILED");
    expect(afterIntegrity.workspaces[0]!.audit).toEqual(expect.arrayContaining([expect.objectContaining({ type: "ARTIFACT_ACCESS_REDEMPTION_DENIED", decisionReason: "INTEGRITY_MISMATCH" })]));
    expect(JSON.stringify(afterIntegrity.workspaces[0]!.audit)).not.toContain("tampered synthetic bytes");

    const staleDocument = await store.addDocument(workspaceId, actor, textFile("Synthetic stale policy bytes", "stale.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-story-007-stale");
    const staleVersion = (await store.documentVersions(workspaceId, staleDocument.id, actor, await effect("document.read", "DOCUMENT", staleDocument.id), "corr-story-007-stale-version"))[0]!;
    const staleGrant = await store.issueArtifactAccessGrant(workspaceId, staleDocument.id, staleVersion.id, actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-stale-grant-0001", await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", staleDocument.id, { fieldRef: "document.content" }), "corr-story-007-stale-grant");
    await store.addMember(workspaceId, actor, "Synthetic pending member", "ADULT_MEMBER", await effect("workspace.admin", "WORKSPACE"), "corr-story-007-epoch-change");
    await expect(store.redeemArtifactAccessGrant(workspaceId, staleGrant.id, actor, { requested_operation: "VIEW" }, "story-007-stale-redemption-0001", await effect("document.read", "WORKSPACE", workspaceId), "corr-story-007-stale-redemption")).rejects.toThrow("not available");

    const otherActor = { identityId: "identity-story-007-other", displayName: "Other Synthetic Owner" };
    const otherWorkspace = await store.createWorkspace(otherActor, "Other artifact household", "PERSONAL", "story-007-other-workspace-0001");
    const otherFence = await store.startAuthorization(otherActor, otherWorkspace.id, "document.read", "WORKSPACE", otherWorkspace.id);
    await expect(store.redeemArtifactAccessGrant(workspaceId, staleGrant.id, otherActor, { requested_operation: "VIEW" }, "story-007-wrong-workspace-0001", otherFence, "corr-story-007-wrong-workspace")).rejects.toThrow("not available");

    const ownerGrant = (await store.dashboard(workspaceId)).accessGrants.find((grant) => grant.granteeIdentityId === actor.identityId && grant.resourceKind === "WORKSPACE")!;
    await store.revokeAccessGrant(workspaceId, actor, ownerGrant.id, ownerGrant.revision, "story-007-owner-revoke-0001", "SECURITY_RESPONSE", await effect("grant.revoke", "WORKSPACE", workspaceId), "corr-story-007-owner-revoke");
    await expect(store.startAuthorization(actor, workspaceId, "document.read", "WORKSPACE", workspaceId)).rejects.toThrow("not available");
  });

  it("restores immutable artifact bytes and exact lineage from a sampled local backup", async () => {
    const bytes = "Synthetic backup restore artifact bytes";
    const document = await store.addDocument(workspaceId, actor, textFile(bytes, "backup.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-story-007-backup", "story-007-backup-upload-0001");
    const version = (await store.documentVersions(workspaceId, document.id, actor, await effect("document.read", "DOCUMENT", document.id), "corr-story-007-backup-version"))[0]!;
    const grant = await store.issueArtifactAccessGrant(workspaceId, document.id, version.id, actor, { operation: "VIEW", purpose_id: "PUR-P1-001", audience_ref: actor.identityId }, "story-007-backup-grant-0001", await store.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id, { fieldRef: "document.content" }), "corr-story-007-backup-grant");
    const backupDirectory = await mkdtemp(join(tmpdir(), "document-management-backup-"));
    const restoredDirectory = await mkdtemp(join(tmpdir(), "document-management-restore-"));
    try {
      await mkdir(join(backupDirectory, "artifacts"), { recursive: true });
      await cp(join(directory, "state.json"), join(backupDirectory, "state.json"));
      await cp(join(directory, "artifacts"), join(backupDirectory, "artifacts"), { recursive: true, force: false });
      await cp(join(backupDirectory, "state.json"), join(restoredDirectory, "state.json"));
      await cp(join(backupDirectory, "artifacts"), join(restoredDirectory, "artifacts"), { recursive: true, force: false });
      process.env.DM_DATA_DIR = restoredDirectory;
      const restored = new LocalStore();
      const restoredVersion = (await restored.documentVersions(workspaceId, document.id, actor, await restored.startAuthorization(actor, workspaceId, "document.read", "DOCUMENT", document.id), "corr-story-007-restored-version"))[0]!;
      expect(restoredVersion).toEqual(version);
      const redemption = await restored.redeemArtifactAccessGrant(workspaceId, grant.id, actor, { requested_operation: "VIEW" }, "story-007-backup-redemption-0001", await restored.startAuthorization(actor, workspaceId, "document.read", "WORKSPACE", workspaceId), "corr-story-007-backup-redemption");
      expect(redemption.buffer.toString("utf8")).toBe(bytes);
      expect(redemption.digest).toBe(createHash("sha256").update(bytes).digest("hex"));
    } finally {
      process.env.DM_DATA_DIR = directory;
      await rm(backupDirectory, { recursive: true }); await rm(restoredDirectory, { recursive: true });
    }
  });

  it("isolates suspected clinical content", async () => {
    const text = "Clinical note: diagnosis and pathology result.";
    const uploaded = await store.addDocument(workspaceId, actor, textFile(text, "record.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-test-clinical-create");
    expect(uploaded.status).toBe("POLICY_HOLD");
    expect(uploaded).toMatchObject({ name: "Restricted document", category: "Policy hold", mediaType: "application/octet-stream", size: 0, subjectIds: [], reviewReason: "This item is isolated and unavailable to ordinary preview, extraction, search and connections." });
    expect((await ask("What is the diagnosis?")).citations).toEqual([]);
    await expect(detail(uploaded.id)).rejects.toThrow("not available");
    await expect(artifact(uploaded.id)).rejects.toThrow("not available");
    await expect(store.deleteDocument(workspaceId, actor, uploaded.id, await effect("document.delete", "DOCUMENT", uploaded.id), "corr-test-clinical-delete")).rejects.toThrow("not available");
    const exported = await store.exportWorkspace(workspaceId, actor, await effect("export.create", "WORKSPACE"), "corr-test-workspace-export");
    const exportBody = JSON.stringify(exported);
    expect(exportBody).not.toContain(uploaded.id);
    for (const forbidden of ["Document contained", "item is contained", "CONTENT_CONTAINED", "CONTAINED_CONTENT", "POLICY_HOLD", "Clinical note", "diagnosis", "pathology", "corr-test-clinical"]) expect(exportBody).not.toContain(forbidden);
    const authority = await store.dashboard(workspaceId);
    expect(authority.audit).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "CONTAINED_CONTENT_ACCESS_DENIED", outcome: "DENIED", decisionReason: "CONTENT_CONTAINED" }),
      expect.objectContaining({ type: "CONTAINED_CONTENT_DISPOSITION_DENIED", outcome: "DENIED", decisionReason: "CONTENT_CONTAINED" }),
    ]));
  });

  it("keeps container access usable while sensitive fields and edges fail closed, then invalidates queued output on revoke", async () => {
    const uploaded = await store.addDocument(workspaceId, actor, textFile("Policy number: SYN-RESTRICTED", "restricted.txt"), [ownerSubjectId], "FILE", await effect("document.create", "WORKSPACE"), "corr-test-restricted-create");
    const invited = await store.addMember(workspaceId, actor, "Synthetic Restricted Member", "ADULT_MEMBER", await effect("workspace.admin", "WORKSPACE"), "corr-test-member-add");
    const path = join(directory, "state.json");
    const database = JSON.parse(await readFile(path, "utf8")) as { workspaces: Array<{ workspace: { id: string }; members: Array<{ id: string; identityId?: string; invitationState: string }> }> };
    const member = database.workspaces.find((state) => state.workspace.id === workspaceId)!.members.find((candidate) => candidate.id === invited.id)!;
    member.identityId = "id_restricted"; member.invitationState = "ACTIVE";
    await writeFile(path, JSON.stringify(database));
    const restrictedActor: WorkspaceActor = { identityId: "id_restricted", displayName: "Synthetic Restricted Member" };

    let ownerFence = await store.startAuthorization(actor, workspaceId, "grant.create", "WORKSPACE", workspaceId);
    const restricted = await store.createAccessGrant(workspaceId, actor, "grant-create-restricted-0001", {
      grantee_ref: restrictedActor.identityId, purpose_id: "PUR-P1-001",
      scope: { resource_refs: [uploaded.id], field_refs: [], edge_refs: [], actions: ["document.read"], allow_export: false, allow_onward_delegation: false },
      valid_from: new Date(Date.now() - 60_000).toISOString(), valid_to: null, policy_version: "policy.local-explicit-grant@0.2" as const,
    }, ownerFence, "corr-grant-restricted");

    ownerFence = await store.startAuthorization(actor, workspaceId, "grant.create", "WORKSPACE", workspaceId);
    const workspaceGrant = await store.createAccessGrant(workspaceId, actor, "grant-create-workspace-member-0001", {
      grantee_ref: restrictedActor.identityId, purpose_id: "PUR-P1-001",
      scope: { resource_refs: [workspaceId], field_refs: [], edge_refs: [], actions: ["workspace.read", "grant.create"], allow_export: false, allow_onward_delegation: false },
      valid_from: new Date(Date.now() - 60_000).toISOString(), valid_to: null, policy_version: "policy.local-explicit-grant@0.2",
    }, ownerFence, "corr-grant-workspace-member");
    const dashboardFence = await store.startAuthorization(restrictedActor, workspaceId, "workspace.read", "WORKSPACE", workspaceId);
    const restrictedDashboard = await store.authorizedDashboard(workspaceId, restrictedActor, dashboardFence, "corr-restricted-dashboard");
    expect(restrictedDashboard.workspace.id).toBe(workspaceId);
    expect(restrictedDashboard).toMatchObject({ members: [], subjects: [], audit: [], accessGrants: [] });

    const delegatedCreateFence = await store.startAuthorization(restrictedActor, workspaceId, "grant.create", "WORKSPACE", workspaceId);
    const delegatedInput = {
      grantee_ref: actor.identityId, purpose_id: "PUR-P1-001" as const,
      scope: { resource_refs: [workspaceId], field_refs: [] as string[], edge_refs: [] as string[], actions: ["workspace.read" as const], allow_export: false, allow_onward_delegation: false as const },
      valid_from: new Date(Date.now() - 60_000).toISOString(), valid_to: null, policy_version: "policy.local-explicit-grant@0.2" as const,
    };
    await expect(store.createAccessGrant(workspaceId, restrictedActor, "grant-create-onward-denied-0001", delegatedInput, delegatedCreateFence, "corr-grant-onward-denied")).rejects.toThrow("not available");
    await expect(store.createAccessGrant(workspaceId, restrictedActor, "grant-create-onward-denied-0001", delegatedInput, delegatedCreateFence, "corr-grant-onward-denied-replay")).rejects.toThrow("not available");
    expect((await store.dashboard(workspaceId)).accessGrants.some((grant) => grant.grantorIdentityId === restrictedActor.identityId)).toBe(false);
    const deniedEvidence = JSON.parse(await readFile(path, "utf8")) as { workspaces: Array<{ workspace: { id: string }; audit: Array<{ type: string; outcome?: string; correlationId?: string; decisionReason?: string; authorizationPhase?: string; detail: string }> }>; authorityOutbox: Array<{ eventType: string; correlationId: string; decisionReason?: string; authorizationPhase?: string }> };
    const deniedAudit = deniedEvidence.workspaces.find((state) => state.workspace.id === workspaceId)!.audit.filter((entry) => entry.type === "ACCESS_GRANT_CREATION_DENIED");
    expect(deniedAudit).toEqual(expect.arrayContaining([
      expect.objectContaining({ outcome: "DENIED", correlationId: "corr-grant-onward-denied", decisionReason: "ONWARD_DELEGATION_NOT_PERMITTED", authorizationPhase: "EFFECT" }),
      expect.objectContaining({ outcome: "DENIED", correlationId: "corr-grant-onward-denied-replay", decisionReason: "ONWARD_DELEGATION_NOT_PERMITTED", authorizationPhase: "EFFECT" }),
    ]));
    expect(deniedAudit.every((entry) => !entry.detail.includes(actor.identityId) && !entry.detail.includes(restrictedActor.identityId))).toBe(true);
    expect(deniedEvidence.authorityOutbox).toEqual(expect.arrayContaining([
      expect.objectContaining({ eventType: "ACCESS_GRANT_CREATION_DENIED", correlationId: "corr-grant-onward-denied", decisionReason: "ONWARD_DELEGATION_NOT_PERMITTED", authorizationPhase: "EFFECT" }),
      expect.objectContaining({ eventType: "ACCESS_GRANT_CREATION_DENIED", correlationId: "corr-grant-onward-denied-replay", decisionReason: "ONWARD_DELEGATION_NOT_PERMITTED", authorizationPhase: "EFFECT" }),
    ]));

    let revokeFence = await store.startAuthorization(actor, workspaceId, "grant.revoke", "WORKSPACE", workspaceId);
    await store.revokeAccessGrant(workspaceId, actor, workspaceGrant.id, workspaceGrant.revision, "grant-revoke-workspace-member-0001", "USER_REQUEST", revokeFence, "corr-grant-workspace-member-revoke");
    await expect(store.createAccessGrant(workspaceId, restrictedActor, "grant-create-after-parent-revoke-0001", delegatedInput, delegatedCreateFence, "corr-grant-after-parent-revoke")).rejects.toThrow("not available");
    await expect(store.authorizedDashboard(workspaceId, restrictedActor, dashboardFence, "corr-restricted-dashboard-stale")).rejects.toThrow("not available");

    const restrictedFence = await store.startAuthorization(restrictedActor, workspaceId, "document.read", "DOCUMENT", uploaded.id);
    const restrictedDetail = await store.documentDetail(workspaceId, uploaded.id, restrictedActor, restrictedFence, "corr-restricted-detail");
    expect(restrictedDetail).toMatchObject({ preview: { kind: "UNAVAILABLE" }, facts: [], dependencies: [] });
    await expect(store.documentArtifact(workspaceId, uploaded.id, restrictedActor, restrictedFence, "corr-restricted-artifact")).rejects.toThrow("not available");

    revokeFence = await store.startAuthorization(actor, workspaceId, "grant.revoke", "WORKSPACE", workspaceId);
    await store.revokeAccessGrant(workspaceId, actor, restricted.id, restricted.revision, "grant-revoke-restricted-0001", "SCOPE_REPLACED", revokeFence, "corr-grant-revoke-restricted");
    ownerFence = await store.startAuthorization(actor, workspaceId, "grant.create", "WORKSPACE", workspaceId);
    const broad = await store.createAccessGrant(workspaceId, actor, "grant-create-broad-0001", {
      grantee_ref: restrictedActor.identityId, purpose_id: "PUR-P1-001",
      scope: { resource_refs: [uploaded.id], field_refs: ["document.content", "fact.value", "fact.evidence"], edge_refs: ["dependency.DOCUMENT_SUBJECT", "dependency.DOCUMENT_CONTAINS_FACT", "dependency.DOCUMENT_CATEGORY"], actions: ["document.read"], allow_export: false, allow_onward_delegation: false },
      valid_from: new Date(Date.now() - 60_000).toISOString(), valid_to: null, policy_version: "policy.local-explicit-grant@0.2",
    }, ownerFence, "corr-grant-broad");
    const queuedFence = await store.startAuthorization(restrictedActor, workspaceId, "document.read", "DOCUMENT", uploaded.id);
    expect((await store.documentDetail(workspaceId, uploaded.id, restrictedActor, queuedFence, "corr-broad-detail")).preview.kind).toBe("TEXT");
    revokeFence = await store.startAuthorization(actor, workspaceId, "grant.revoke", "WORKSPACE", workspaceId);
    await store.revokeAccessGrant(workspaceId, actor, broad.id, broad.revision, "grant-revoke-broad-0001", "USER_REQUEST", revokeFence, "corr-grant-revoke-broad");
    await expect(store.reauthorize(queuedFence, restrictedActor, "OUTPUT", "corr-queued-output")).rejects.toThrow("not available");

    const task = await store.addTask(workspaceId, actor, { title: "Synthetic fenced action", severity: "INFO" }, await effect("task.create", "WORKSPACE"), "corr-task-create");
    ownerFence = await store.startAuthorization(actor, workspaceId, "grant.create", "WORKSPACE", workspaceId);
    const actionGrant = await store.createAccessGrant(workspaceId, actor, "grant-create-action-0001", {
      grantee_ref: restrictedActor.identityId, purpose_id: "PUR-P1-001",
      scope: { resource_refs: [task.id], field_refs: [], edge_refs: [], actions: ["task.edit"], allow_export: false, allow_onward_delegation: false },
      valid_from: new Date(Date.now() - 60_000).toISOString(), valid_to: null, policy_version: "policy.local-explicit-grant@0.2",
    }, ownerFence, "corr-grant-action");
    const queuedEffect = await store.startAuthorization(restrictedActor, workspaceId, "task.edit", "TASK", task.id);
    revokeFence = await store.startAuthorization(actor, workspaceId, "grant.revoke", "WORKSPACE", workspaceId);
    await store.revokeAccessGrant(workspaceId, actor, actionGrant.id, actionGrant.revision, "grant-revoke-action-0001", "USER_REQUEST", revokeFence, "corr-grant-revoke-action");
    await expect(store.completeTask(workspaceId, restrictedActor, task.id, queuedEffect, "corr-stale-task-effect")).rejects.toThrow("not available");
    expect((await store.dashboard(workspaceId)).tasks.find((candidate) => candidate.id === task.id)?.state).toBe("OPEN");

    const persisted = JSON.parse(await readFile(path, "utf8")) as { workspaces: Array<{ workspace: { id: string }; audit: Array<{ type: string; decisionReason?: string; authorizationPhase?: string }> }>; authorityOutbox: Array<{ eventType: string; authorizationEpoch?: number }> };
    const authority = persisted.workspaces.find((state) => state.workspace.id === workspaceId)!;
    expect(authority.audit).toEqual(expect.arrayContaining([expect.objectContaining({ type: "AUTHORIZATION_DENIED", decisionReason: "STALE_AUTHORIZATION_EPOCH", authorizationPhase: "OUTPUT" })]));
    expect(persisted.authorityOutbox.filter((event) => event.eventType === "ACCESS_GRANT_REVOKED").every((event) => typeof event.authorizationEpoch === "number")).toBe(true);
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
    }, await effect("subject.create", "WORKSPACE"), "corr-test-person-create");
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
    }, await effect("subject.edit", "WORKSPACE"), "corr-test-person-update");
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
    const dependant = await store.createPerson(workspaceId, actor, input, await effect("subject.create", "WORKSPACE"), "corr-test-dependant-create");
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

    const updated = await store.updatePerson(workspaceId, actor, dependant.id, dependant.revision, { ...input, relationship: "Dependant" }, await effect("subject.edit", "WORKSPACE"), "corr-test-dependant-update");
    expect(updated).toMatchObject({ id: dependant.id, relationship: "Dependant", revision: 2, history: [expect.objectContaining({ revision: 1, relationship: "Child" })] });
    await expect(store.updatePerson(workspaceId, actor, dependant.id, 1, { ...input, relationship: "Stale overwrite" }, await effect("subject.edit", "WORKSPACE"), "corr-test-dependant-stale")).rejects.toThrow("refresh before retrying");

    const foreignActor = { identityId: "id_foreign_subject_owner", displayName: "Foreign Synthetic Owner" };
    const foreign = await store.createWorkspace(foreignActor, "Foreign subject household", "FAMILY", "foreign-subject-workspace-0001");
    const foreignTarget = { store, actor: foreignActor, workspaceId: foreign.id };
    const foreignSubject = await store.createPerson(foreign.id, foreignActor, { ...input, displayName: "Foreign Synthetic Dependant" }, await effect("subject.create", "WORKSPACE", undefined, foreignTarget), "corr-test-foreign-create");
    await expect(store.updatePerson(workspaceId, actor, foreignSubject.id, foreignSubject.revision, input, await effect("subject.edit", "WORKSPACE"), "corr-test-foreign-update")).rejects.toThrow("Resource not available");

    database = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
    state = database.workspaces.find((candidate) => candidate.workspace.id === workspaceId)!;
    expect(state.subjects.find((subject) => subject.id === dependant.id)).toMatchObject({ relationship: "Dependant", revision: 2 });
    expect(state.members.some((member) => member.subjectId === dependant.id)).toBe(false);
    expect(state.audit.filter((entry) => entry.type === "PERSON_CHANGE_REJECTED")).toHaveLength(2);
    expect(database.authorityOutbox.filter((event) => event.eventType === "PERSON_CHANGE_REJECTED")).toHaveLength(2);
  });

  it("keeps the explicit owner unique and blocks generic ownership-transfer shortcuts", async () => {
    await expect(store.addSubject(workspaceId, actor, { displayName: "Second Owner", kind: "OWNER", relationship: "Self" }, await effect("subject.create", "WORKSPACE"), "corr-test-owner-subject")).rejects.toThrow("ownership transfer");
    await expect(store.addMember(workspaceId, actor, "Second Owner", "OWNER", await effect("workspace.admin", "WORKSPACE"), "corr-test-owner-member")).rejects.toThrow("Ownership transfer");
    await expect(store.createPerson(workspaceId, actor, { displayName: "Second Owner", kind: "OWNER", relationship: "Self", loginEnabled: false, role: "FAMILY_ADMIN", permissions: { view: true, add: true, edit: true, delete: true } }, await effect("subject.create", "WORKSPACE"), "corr-test-owner-person")).rejects.toThrow("ownership transfer");

    const adult = await store.createPerson(workspaceId, actor, { displayName: "Synthetic Adult", kind: "ADULT", relationship: "Partner", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } }, await effect("subject.create", "WORKSPACE"), "corr-test-adult-create");
    await expect(store.updatePerson(workspaceId, actor, adult.id, adult.revision, { displayName: "Synthetic Adult", kind: "OWNER", relationship: "Partner", loginEnabled: true, email: "adult@example.test", role: "FAMILY_ADMIN", permissions: { view: true, add: true, edit: true, delete: true } }, await effect("subject.edit", "WORKSPACE"), "corr-test-adult-owner-update")).rejects.toThrow("Ownership transfer");
    expect((await store.dashboard(workspaceId)).subjects.filter((subject) => subject.kind === "OWNER")).toHaveLength(1);
  });

  it("blocks removal while documents are assigned, then records safe removal", async () => {
    const person = await store.createPerson(workspaceId, actor, { displayName: "Synthetic Child", kind: "CHILD", relationship: "Child", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } }, await effect("subject.create", "WORKSPACE"), "corr-test-child-create");
    const document = await store.addDocument(workspaceId, actor, textFile("Synthetic school document.", "school.txt"), [person.id], "FILE", await effect("document.create", "WORKSPACE"), "corr-test-school-create");
    await expect(store.deletePerson(workspaceId, actor, person.id, person.revision, await effect("subject.delete", "WORKSPACE"), "corr-test-child-delete-blocked")).rejects.toThrow("Reassign or delete");
    await store.deleteDocument(workspaceId, actor, document.id, await effect("document.delete", "DOCUMENT", document.id), "corr-test-school-delete");
    await store.deletePerson(workspaceId, actor, person.id, person.revision, await effect("subject.delete", "WORKSPACE"), "corr-test-child-delete");
    const dashboard = await store.dashboard(workspaceId);
    expect(dashboard.subjects.some((item) => item.id === person.id)).toBe(false);
    expect(dashboard.audit[0]?.type).toBe("PERSON_REMOVED");
    const persisted = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ subjects: Array<{ id: string; status: string; history: unknown[] }> }> };
    expect(persisted.workspaces[0]!.subjects.find((item) => item.id === person.id)).toMatchObject({ status: "RETIRED", history: [expect.any(Object)] });
  });

  it("records the approved recovery-unavailable policy boundary", async () => {
    const recoveryCase = await store.recordRecoveryBlocked(workspaceId, actor, await effect("workspace.read", "WORKSPACE", workspaceId), "corr-test-recovery-blocked");
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
