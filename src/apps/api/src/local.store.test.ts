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
    const text = "Home insurance policy expires on 30 June 2027.";
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
    } as unknown as Express.Multer.File);

    expect(uploaded.status).toBe("READY");
    expect(uploaded.category).toBe("Insurance");

    const answer = await store.ask("When does the home insurance policy expire?");
    expect(answer.citations).toHaveLength(1);
    expect(answer.answer).toContain("30 June 2027");

    await store.deleteDocument(uploaded.id);
    const dashboard = await store.dashboard();
    expect(dashboard.documents.find((document) => document.id === uploaded.id)?.status).toBe("DELETED");
    expect(await store.ask("When does the home insurance policy expire?")).toMatchObject({ confidence: "LOW", citations: [] });
  });

  it("isolates suspected clinical content", async () => {
    const text = "Clinical note: diagnosis and pathology result.";
    const uploaded = await store.addDocument({
      originalname: "record.txt",
      mimetype: "text/plain",
      size: Buffer.byteLength(text),
      buffer: Buffer.from(text),
    } as Express.Multer.File);
    expect(uploaded.status).toBe("POLICY_HOLD");
    expect((await store.ask("What is the diagnosis?")).citations).toEqual([]);
  });
});
