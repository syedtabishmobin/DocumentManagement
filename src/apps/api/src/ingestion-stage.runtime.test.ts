import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStore, type SyntheticStageMessage, type WorkspaceActor } from "./local.store.js";

const actor: WorkspaceActor = { identityId: "identity_stage_owner", displayName: "Synthetic Stage Owner" };
const worker: WorkspaceActor = { identityId: "workload_stage_runner", displayName: "Synthetic Stage Runner" };
const withoutFault = (message: SyntheticStageMessage): SyntheticStageMessage => {
  const { fault: _fault, ...rest } = message;
  return rest;
};

describe("durable provider-neutral ingestion stage runtime", () => {
  let directory: string;
  let store: LocalStore;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-stage-runtime-"));
    process.env.DM_DATA_DIR = directory;
    store = new LocalStore();
  });
  afterEach(async () => { await rm(directory, { recursive: true }); delete process.env.DM_DATA_DIR; });

  async function receivedCase(key: string) {
    const workspace = await store.createWorkspace(actor, `Stage household ${key}`, "FAMILY", `stage-workspace-${key}-0001`);
    let fence = await store.startAuthorization(actor, workspace.id, "document.create", "WORKSPACE", workspace.id, { correlationId: `corr-stage-create-${key}` });
    const created = await store.createIngestionCase(workspace.id, actor, `stage-create-${key}-0001`, { capture_route: "BROWSER_UPLOAD", format_profile_ref: "format-profile-synthetic@0.1", source_descriptor_ref: null }, fence, `corr-stage-create-${key}`);
    fence = await store.startAuthorization(actor, workspace.id, "document.create", "WORKSPACE", workspace.id, { correlationId: `corr-stage-receipt-${key}` });
    const received = await store.commitIngestionReceipt(workspace.id, actor, created.id, 1, `stage-receipt-${key}-0001`, { transfer_ref: `transfer-${key}`, byte_count: 64, content_digest_ref: `digest-${key}` }, fence, `corr-stage-receipt-${key}`);
    return { workspace, ingestionCase: received };
  }

  function message(ingestionCaseId: string, expectedRevision: number, stageId: SyntheticStageMessage["stageId"], eventId: string, overrides: Partial<SyntheticStageMessage> = {}): SyntheticStageMessage {
    return {
      eventId, ingestionCaseId, expectedRevision, stageId, contractVersion: "ingestion-stage@1.0",
      inputGeneration: "input-generation-001", configurationVersion: "configuration.local.synthetic@0.1",
      replayGeneration: 0, leaseOwner: "worker-a", leaseDurationSeconds: 10,
      outcome: "SUCCEEDED", reasonCode: "STAGE_COMPLETED", ...overrides,
    };
  }

  it("converges duplicate, delayed, out-of-order and both crash-window deliveries without duplicate logical effects", async () => {
    const { workspace, ingestionCase } = await receivedCase("convergence");
    const validation = message(ingestionCase.id, 2, "VALIDATION", "event-validation-0001");
    const first = await store.processIngestionStageMessage(workspace.id, worker, validation, "2026-08-30T00:00:00.000Z");
    expect(first).toMatchObject({ disposition: "APPLIED", ingestionCase: { state: "SAFETY_CHECKING", revision: 4 }, run: { state: "SUCCEEDED", attempt: 1 } });
    expect((await store.processIngestionStageMessage(workspace.id, worker, validation, "2026-08-30T00:00:01.000Z")).disposition).toBe("DUPLICATE");
    await expect(store.processIngestionStageMessage(workspace.id, worker, { ...validation, reasonCode: "ALTERED_EVENT" }, "2026-08-30T00:00:01.500Z")).rejects.toThrow("reused for different immutable semantics");

    const future = message(ingestionCase.id, 7, "PROCESSING", "event-processing-future-0001");
    expect((await store.processIngestionStageMessage(workspace.id, worker, future, "2026-08-30T00:00:02.000Z")).disposition).toBe("PENDING_ORDER");

    const safety = message(ingestionCase.id, 4, "SAFETY", "event-safety-crash-0001", { fault: "AFTER_LEASE_COMMIT" });
    await expect(store.processIngestionStageMessage(workspace.id, worker, safety, "2026-08-30T00:00:03.000Z")).rejects.toThrow("after stage lease commit");
    const held = await store.processIngestionStageMessage(workspace.id, worker, { ...withoutFault(safety), leaseOwner: "worker-b" }, "2026-08-30T00:00:04.000Z");
    expect(held.disposition).toBe("LEASE_HELD");
    const takeover = await store.processIngestionStageMessage(workspace.id, worker, { ...withoutFault(safety), leaseOwner: "worker-b" }, "2026-08-30T00:00:14.000Z");
    expect(takeover).toMatchObject({ disposition: "APPLIED", ingestionCase: { state: "PROCESSING", revision: 7 }, run: { state: "SUCCEEDED", attempt: 2 } });
    expect(takeover.ingestionCase.stageRuns?.filter((run) => run.stageId === "SAFETY").map((run) => run.state)).toEqual(["SUPERSEDED", "SUCCEEDED"]);

    const processing = { ...future, fault: "AFTER_EFFECT_COMMIT" as const };
    await expect(store.processIngestionStageMessage(workspace.id, worker, processing, "2026-08-30T00:00:15.000Z")).rejects.toThrow("after stage effect commit");
    const replay = await store.processIngestionStageMessage(workspace.id, worker, withoutFault(processing), "2026-08-30T00:00:16.000Z");
    expect(replay).toMatchObject({ disposition: "DUPLICATE", ingestionCase: { state: "NEEDS_REVIEW", revision: 9 } });
    const effects = replay.ingestionCase.stageRuns?.filter((run) => run.logicalEffectRef);
    expect(effects).toHaveLength(3);
    expect(new Set(effects?.map((run) => run.logicalEffectRef)).size).toBe(3);

    const restarted = new LocalStore();
    const readFence = await restarted.startAuthorization(actor, workspace.id, "document.read", "WORKSPACE", workspace.id, { correlationId: "corr-stage-restart" });
    const persisted = await restarted.getIngestionCase(workspace.id, actor, ingestionCase.id, readFence, "corr-stage-restart");
    expect(persisted).toMatchObject({ state: "NEEDS_REVIEW", revision: 9 });
    expect(JSON.stringify(persisted)).not.toContain("worker-a");
    expect(JSON.stringify(persisted)).not.toContain("worker-b");
    const database = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { authorityOutbox: Array<{ aggregateId: string; aggregateRevision: number; eventType: string; eventEnvelope?: Record<string, unknown> }> };
    const stageEvents = database.authorityOutbox.filter((event) => event.aggregateId === ingestionCase.id && event.eventType === "EVT-P1-006").slice(2).map((event) => event.eventEnvelope!);
    expect(stageEvents).toHaveLength(7);
    expect(stageEvents.map((event) => event.aggregate_revision)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(stageEvents.map((event) => event.attempt)).toEqual([1, 1, 1, 2, 2, 1, 1]);
    for (const event of stageEvents) expect(event).toEqual(expect.objectContaining({ event_type: "EVT-P1-006", schema_version: "1.0.0", aggregate_type: "IngestionCase", actor: { actor_id: worker.identityId, actor_class: "SERVICE" }, authorization: expect.objectContaining({ decision: "ALLOW" }), classification: expect.objectContaining({ purpose_id: "PUR-P1-001" }), deletion_fence: { state: "NOT_FENCED", generation: 0 }, payload: expect.objectContaining({ stage_id: expect.stringMatching(/^(VALIDATION|SAFETY|PROCESSING)$/), attempt: expect.any(Number) }) }));
    expect(new Set(stageEvents.map((event) => event.event_id)).size).toBe(stageEvents.length);
  });

  it("bounds retry exhaustion, records one dead letter and repairs through a new replay generation", async () => {
    const { workspace, ingestionCase } = await receivedCase("retry");
    let revision = ingestionCase.revision;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await store.processIngestionStageMessage(workspace.id, worker, message(ingestionCase.id, revision, "VALIDATION", `event-retry-000${attempt}`, { outcome: "FAILED_RETRYABLE", reasonCode: "DEPENDENCY_TIMEOUT" }), `2026-08-30T00:01:0${attempt}.000Z`);
      revision = result.ingestionCase.revision;
      expect(result.run?.attempt).toBe(attempt);
    }
    const readFence = await store.startAuthorization(actor, workspace.id, "document.read", "WORKSPACE", workspace.id, { correlationId: "corr-stage-retry-read" });
    let persisted = await store.getIngestionCase(workspace.id, actor, ingestionCase.id, readFence, "corr-stage-retry-read");
    expect(persisted).toMatchObject({ state: "FAILED_TERMINAL", deadLetters: [expect.objectContaining({ state: "OPEN", attemptCount: 3, reasonCode: "RETRY_BUDGET_EXHAUSTED" })] });

    const repaired = await store.processIngestionStageMessage(workspace.id, worker, message(ingestionCase.id, revision, "VALIDATION", "event-repair-0001", { replayGeneration: 1 }), "2026-08-30T00:02:00.000Z");
    expect(repaired).toMatchObject({ ingestionCase: { state: "SAFETY_CHECKING" }, run: { state: "SUCCEEDED", replayGeneration: 1, attempt: 1 } });
    persisted = repaired.ingestionCase;
    expect(persisted.deadLetters).toEqual([expect.objectContaining({ state: "REPAIRED", repairedAt: "2026-08-30T00:02:00.000Z" })]);
  });

  it("fails closed for contained state, ineligible route, cost policy and current authorization revocation", async () => {
    for (const [index, blocked] of [
      { routeEligible: false, reason: "PROCESSING_ROUTE_INELIGIBLE" },
      { costAllowed: false, reason: "COST_POLICY_BLOCKED" },
    ].entries()) {
      const { workspace, ingestionCase } = await receivedCase(`policy-${index}`);
      const result = await store.processIngestionStageMessage(workspace.id, worker, message(ingestionCase.id, 2, "VALIDATION", `event-policy-${index}-0001`, blocked), `2026-08-30T00:03:0${index}.000Z`);
      expect(result).toMatchObject({ ingestionCase: { state: "FAILED_TERMINAL", mandatoryCheckpointState: "BLOCKED" }, run: { state: "BLOCKED", reasonCode: blocked.reason } });
      expect(result.ingestionCase.deadLetters).toEqual([expect.objectContaining({ state: "OPEN", reasonCode: blocked.reason })]);
      const repair = await store.processIngestionStageMessage(workspace.id, worker, message(ingestionCase.id, result.ingestionCase.revision, "VALIDATION", `event-policy-repair-${index}-0001`, { replayGeneration: 1 }), `2026-08-30T00:03:1${index}.000Z`);
      expect(repair).toMatchObject({ ingestionCase: { state: "SAFETY_CHECKING", deadLetters: [expect.objectContaining({ state: "REPAIRED" })] }, run: { state: "SUCCEEDED", replayGeneration: 1 } });
    }

    const { workspace, ingestionCase } = await receivedCase("revoked");
    const crashing = message(ingestionCase.id, 2, "VALIDATION", "event-revoked-0001", { fault: "AFTER_LEASE_COMMIT" });
    await expect(store.processIngestionStageMessage(workspace.id, worker, crashing, "2026-08-30T00:04:00.000Z")).rejects.toThrow();
    const database = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string }; accessGrants: Array<{ id: string; revision: number }> }> };
    const ownerGrant = database.workspaces.find((state) => state.workspace.id === workspace.id)!.accessGrants[0]!;
    const revokeFence = await store.startAuthorization(actor, workspace.id, "grant.revoke", "WORKSPACE", workspace.id, { correlationId: "corr-stage-revoke" });
    await store.revokeAccessGrant(workspace.id, actor, ownerGrant.id, ownerGrant.revision, "stage-revoke-owner-0001", "SECURITY_RESPONSE", revokeFence, "corr-stage-revoke");
    const denied = await store.processIngestionStageMessage(workspace.id, worker, { ...withoutFault(crashing), leaseOwner: "worker-b" }, "2026-08-30T00:04:20.000Z");
    expect(denied).toMatchObject({ ingestionCase: { state: "FAILED_TERMINAL", mandatoryCheckpointState: "BLOCKED" }, run: { state: "BLOCKED", reasonCode: "CURRENT_AUTHORIZATION_DENIED" } });
  });

  it("prevents contained and deleted documents from advancing across a committed lease", async () => {
    const workspace = await store.createWorkspace(actor, "Stage fence household", "FAMILY", "stage-fence-workspace-0001");
    const state = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string }; subjects: Array<{ id: string; kind: string }> }> };
    const subjectId = state.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!.subjects.find((subject) => subject.kind === "OWNER")!.id;

    let fence = await store.startAuthorization(actor, workspace.id, "document.create", "WORKSPACE", workspace.id, { correlationId: "corr-stage-contained-create" });
    const contained = await store.addDocument(workspace.id, actor, { originalname: "synthetic-malware.txt", mimetype: "text/plain", size: 34, buffer: Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE") } as Express.Multer.File, [subjectId], "FILE", fence, "corr-stage-contained-create", "stage-contained-create-0001");
    let stored = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string }; ingestionCases: Array<{ id: string; documentId: string | null; revision: number }> }> };
    const containedCase = stored.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!.ingestionCases.find((candidate) => candidate.documentId === contained.id)!;
    const containedResult = await store.processIngestionStageMessage(workspace.id, worker, message(containedCase.id, containedCase.revision, "PROCESSING", "event-contained-stage-0001"), "2026-08-30T00:05:00.000Z");
    expect(containedResult).toMatchObject({ ingestionCase: { state: "QUARANTINED", mandatoryCheckpointState: "BLOCKED" }, run: { state: "BLOCKED", reasonCode: "CONTENT_CONTAINED" } });

    fence = await store.startAuthorization(actor, workspace.id, "document.create", "WORKSPACE", workspace.id, { correlationId: "corr-stage-delete-create" });
    const clean = await store.addDocument(workspace.id, actor, { originalname: "synthetic-clean.txt", mimetype: "text/plain", size: 23, buffer: Buffer.from("Synthetic clean document") } as Express.Multer.File, [subjectId], "FILE", fence, "corr-stage-delete-create", "stage-delete-create-0001");
    stored = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as typeof stored;
    const cleanCase = stored.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!.ingestionCases.find((candidate) => candidate.documentId === clean.id)!;
    const crashing = message(cleanCase.id, cleanCase.revision, "PROCESSING", "event-delete-stage-0001", { fault: "AFTER_LEASE_COMMIT" });
    await expect(store.processIngestionStageMessage(workspace.id, worker, crashing, "2026-08-30T00:06:00.000Z")).rejects.toThrow();
    const deleteFence = await store.startAuthorization(actor, workspace.id, "document.delete", "DOCUMENT", clean.id, { correlationId: "corr-stage-delete-fence" });
    await store.deleteDocument(workspace.id, actor, clean.id, deleteFence, "corr-stage-delete-fence");
    const deleted = await store.processIngestionStageMessage(workspace.id, worker, { ...withoutFault(crashing), leaseOwner: "worker-b" }, "2026-08-30T00:06:20.000Z");
    expect(deleted).toMatchObject({ ingestionCase: { state: "DELETION_BLOCKED", mandatoryCheckpointState: "BLOCKED" }, run: { state: "BLOCKED", reasonCode: "DELETION_FENCE_ACTIVE" } });
    const fencedState = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { authorityOutbox: Array<{ aggregateId: string; eventType: string; eventEnvelope?: { deletion_fence?: Record<string, unknown>; payload?: Record<string, unknown> } }> };
    const fencedEvent = fencedState.authorityOutbox.filter((event) => event.aggregateId === cleanCase.id && event.eventType === "EVT-P1-006").at(-1)?.eventEnvelope;
    expect(fencedEvent).toEqual(expect.objectContaining({ deletion_fence: { state: "FENCED", generation: 1, deletion_case_id: expect.any(String) }, payload: expect.objectContaining({ to_state: "DELETION_BLOCKED", reason_code: "DELETION_FENCE_ACTIVE" }) }));
  });
});
