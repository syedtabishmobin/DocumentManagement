import { describe, expect, it } from "vitest";
import { decryptDocument, decryptDocumentWithWrappedKey, encryptDocument, importWrappingKey, rewrapDocumentKey } from "./index.js";

const context = { workspaceId: "wrk_vector_001", documentId: "doc_vector_001", mediaType: "text/plain" };
const fixedWrappingKey = Uint8Array.from({ length: 32 }, (_, index) => index);
const fixedDocumentKey = Uint8Array.from({ length: 32 }, (_, index) => 255 - index);
const fixedDocumentIv = Uint8Array.from({ length: 12 }, (_, index) => index + 1);
const fixedKeyIv = Uint8Array.from({ length: 12 }, (_, index) => index + 21);

describe("customer-controlled document envelope", () => {
  it("round-trips the language-neutral known-answer inputs", async () => {
    const key = await importWrappingKey(fixedWrappingKey);
    const plaintext = new TextEncoder().encode("Synthetic household policy number SYN-1001");
    const envelope = await encryptDocument(plaintext, context, key, "device-vector-001", { documentKey: fixedDocumentKey.slice(), documentIv: fixedDocumentIv, keyIv: fixedKeyIv });
    expect(envelope).toMatchInlineSnapshot(`
      {
        "ciphertext": "vIfDqJpdp0rclFR1G3L+EgqxPVfQfAs9fdovGKLT9ll/cbnx3R+ESSXxzrPQrStAf0QoII13QI81nw==",
        "documentId": "doc_vector_001",
        "iv": "AQIDBAUGBwgJCgsM",
        "key": {
          "ciphertext": "xJdMlFyvm6gGHn398HcQ/QgqegJysaluwAWrCp1ba/mL7mOLVkAKqPhEBSxoiIVE",
          "iv": "FRYXGBkaGxwdHh8g",
          "suite": "DOCULYRA-AES-256-GCM-V1",
          "wrappingKeyId": "device-vector-001",
        },
        "mediaType": "text/plain",
        "suite": "DOCULYRA-AES-256-GCM-V1",
        "workspaceId": "wrk_vector_001",
      }
    `);
    expect(new TextDecoder().decode(await decryptDocument(envelope, context, key))).toBe("Synthetic household policy number SYN-1001");
  });

  it("fails closed for tamper and cross-workspace context", async () => {
    const key = await importWrappingKey(fixedWrappingKey);
    const envelope = await encryptDocument(new TextEncoder().encode("synthetic"), context, key, "device-vector-001");
    const tampered = { ...envelope, ciphertext: `${envelope.ciphertext.slice(0, -2)}AA` };
    await expect(decryptDocument(tampered, context, key)).rejects.toThrow("authentication failed");
    await expect(decryptDocument(envelope, { ...context, workspaceId: "wrk_other" }, key)).rejects.toThrow("context mismatch");
  });

  it("re-wraps the document key for an authorized recipient without changing ciphertext", async () => {
    const ownerKey = await importWrappingKey(fixedWrappingKey);
    const recipientRawKey = Uint8Array.from({ length: 32 }, (_, index) => (index + 71) % 256);
    const recipientKey = await importWrappingKey(recipientRawKey);
    const plaintext = new TextEncoder().encode("Synthetic shared household policy");
    const envelope = await encryptDocument(plaintext, context, ownerKey, "device-owner-001");
    const originalCiphertext = envelope.ciphertext;

    const recipientEnvelope = await rewrapDocumentKey(
      envelope,
      context,
      ownerKey,
      recipientKey,
      "member-recipient-001",
      { keyIv: Uint8Array.from({ length: 12 }, (_, index) => index + 31) },
    );

    expect(envelope.ciphertext).toBe(originalCiphertext);
    expect(recipientEnvelope.wrappingKeyId).toBe("member-recipient-001");
    expect(new TextDecoder().decode(await decryptDocumentWithWrappedKey(envelope, recipientEnvelope, context, recipientKey))).toBe("Synthetic shared household policy");
    await expect(decryptDocumentWithWrappedKey(envelope, recipientEnvelope, context, ownerKey)).rejects.toThrow("authentication failed");
  });
});
