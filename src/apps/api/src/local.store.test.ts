import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStore } from "./local.store.js";

describe("LocalStore", () => {
  let directory: string;
  let store: LocalStore;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "document-management-test-"));
    process.env.DM_DATA_DIR = directory;
    store = new LocalStore();
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("stores, retrieves, cites, and purges a local text document", async () => {
    const text = "Home insurance policy expires on 30 June 2027.\nPolicy number: SYN-12345";
    const uploaded = await store.addDocument({
      fieldname: "file",
      originalname: "home-insurance.txt",
      encoding: "7bit",
      mimetype: "text/plain",
      size: Buffer.byteLength(text),
      buffer: Buffer.from(text),
      stream: undefined,
      destination: undefined,
      filename: undefined,
      path: undefined,
    } as unknown as Express.Multer.File, ["sub_local_owner"], "FILE");

    expect(uploaded.status).toBe("READY");
    expect(uploaded.category).toBe("Insurance");

    const answer = await store.ask("When does the home insurance policy expire?");
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.answer).toContain("30 June 2027");

    let dashboard = await store.dashboard();
    expect(dashboard.documents.find((document) => document.id === uploaded.id)?.extractedText).toBeUndefined();
    expect(dashboard.facts).toEqual(expect.arrayContaining([expect.objectContaining({ documentId: uploaded.id, definitionId: "fact.policy.number", value: "SYN-12345", reviewState: "PROPOSED" })]));
    expect(dashboard.dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({ evidenceDocumentId: uploaded.id, kind: "DOCUMENT_SUBJECT" }),
      expect.objectContaining({ evidenceDocumentId: uploaded.id, kind: "DOCUMENT_CONTAINS_FACT" }),
      expect.objectContaining({ evidenceDocumentId: uploaded.id, kind: "DOCUMENT_CATEGORY" }),
    ]));
    expect(await store.documentDetail(uploaded.id)).toMatchObject({ preview: { kind: "TEXT", text }, facts: [expect.objectContaining({ name: "Expiry date" }), expect.objectContaining({ name: "Policy number" })] });
    expect((await store.documentArtifact(uploaded.id)).buffer.toString("utf8")).toBe(text);
    const reviewed = await store.reviewFact(dashboard.facts.find((fact) => fact.definitionId === "fact.policy.number")!.id);
    expect(reviewed.reviewState).toBe("REVIEWED");
    expect((await store.dashboard()).audit.some((entry) => entry.type === "FACT_REVIEWED")).toBe(true);

    await store.deleteDocument(uploaded.id);
    dashboard = await store.dashboard();
    expect(dashboard.documents.find((document) => document.id === uploaded.id)?.status).toBe("DELETED");
    expect(dashboard.dependencies.some((edge) => edge.evidenceDocumentId === uploaded.id)).toBe(false);
    expect(await store.ask("When does the home insurance policy expire?")).toMatchObject({ confidence: "LOW", citations: [] });
  });

  it("isolates suspected clinical content", async () => {
    const text = "Clinical note: diagnosis and pathology result.";
    const uploaded = await store.addDocument({
      originalname: "record.txt",
      mimetype: "text/plain",
      size: Buffer.byteLength(text),
      buffer: Buffer.from(text),
    } as Express.Multer.File, ["sub_local_owner"], "FILE");
    expect(uploaded.status).toBe("POLICY_HOLD");
    expect((await store.ask("What is the diagnosis?")).citations).toEqual([]);
    await expect(store.documentDetail(uploaded.id)).rejects.toThrow("isolated");
    await expect(store.documentArtifact(uploaded.id)).rejects.toThrow("isolated");
  });

  it("keeps one household person linked to explicit login and file permissions", async () => {
    const person = await store.createPerson({
      displayName: "Synthetic Adult",
      kind: "ADULT",
      relationship: "Partner",
      loginEnabled: true,
      email: "adult@example.test",
      role: "ADULT_MEMBER",
      permissions: { view: true, add: true, edit: false, delete: false },
    });
    let dashboard = await store.dashboard();
    expect(dashboard.members.find((member) => member.subjectId === person.id)).toMatchObject({ invitationState: "PENDING", permissions: { add: true, edit: false } });

    await store.updatePerson(person.id, {
      displayName: "Synthetic Adult Updated",
      kind: "ADULT",
      relationship: "Partner",
      loginEnabled: true,
      mobile: "+61400000000",
      role: "FAMILY_ADMIN",
      permissions: { view: true, add: true, edit: true, delete: true },
    });
    dashboard = await store.dashboard();
    expect(dashboard.subjects.find((item) => item.id === person.id)?.displayName).toBe("Synthetic Adult Updated");
    expect(dashboard.members.find((member) => member.subjectId === person.id)).toMatchObject({ role: "FAMILY_ADMIN", mobile: "+61400000000", permissions: { delete: true } });
    expect(dashboard.audit.some((entry) => entry.type === "PERSON_UPDATED")).toBe(true);
  });

  it("blocks removal while documents are assigned, then records safe removal", async () => {
    const person = await store.createPerson({ displayName: "Synthetic Child", kind: "CHILD", relationship: "Child", loginEnabled: false, role: "ADULT_MEMBER", permissions: { view: true, add: false, edit: false, delete: false } });
    const text = "Synthetic school document.";
    const document = await store.addDocument({ originalname: "school.txt", mimetype: "text/plain", size: Buffer.byteLength(text), buffer: Buffer.from(text) } as Express.Multer.File, [person.id], "FILE");
    await expect(store.deletePerson(person.id)).rejects.toThrow("Reassign or delete");
    await store.deleteDocument(document.id);
    await store.deletePerson(person.id);
    const dashboard = await store.dashboard();
    expect(dashboard.subjects.some((item) => item.id === person.id)).toBe(false);
    expect(dashboard.audit[0]?.type).toBe("PERSON_REMOVED");
  });
});
