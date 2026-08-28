export const DOCUMENT_CRYPTO_SUITE = "DOCULYRA-AES-256-GCM-V1" as const;

export interface DocumentCryptoContext {
  workspaceId: string;
  documentId: string;
  mediaType: string;
}

export interface WrappedDocumentKey {
  suite: typeof DOCUMENT_CRYPTO_SUITE;
  wrappingKeyId: string;
  iv: string;
  ciphertext: string;
}

export interface EncryptedDocumentEnvelope extends DocumentCryptoContext {
  suite: typeof DOCUMENT_CRYPTO_SUITE;
  iv: string;
  ciphertext: string;
  key: WrappedDocumentKey;
}

const encoder = new TextEncoder();

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable; document encryption must fail closed");
  return globalThis.crypto;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("Malformed cryptographic envelope");
  }
}

function documentAad(context: DocumentCryptoContext): ArrayBuffer {
  return arrayBuffer(encoder.encode(`${DOCUMENT_CRYPTO_SUITE}\u001fdocument\u001f${context.workspaceId}\u001f${context.documentId}\u001f${context.mediaType}`));
}

function keyAad(context: DocumentCryptoContext, wrappingKeyId: string): ArrayBuffer {
  return arrayBuffer(encoder.encode(`${DOCUMENT_CRYPTO_SUITE}\u001fkey\u001f${context.workspaceId}\u001f${context.documentId}\u001f${wrappingKeyId}`));
}

function assertContext(envelope: EncryptedDocumentEnvelope, expected: DocumentCryptoContext): void {
  if (envelope.suite !== DOCUMENT_CRYPTO_SUITE || envelope.key.suite !== DOCUMENT_CRYPTO_SUITE) throw new Error("Unsupported cryptographic suite");
  if (envelope.workspaceId !== expected.workspaceId || envelope.documentId !== expected.documentId || envelope.mediaType !== expected.mediaType) {
    throw new Error("Cryptographic context mismatch");
  }
}

async function unwrapDocumentKey(
  wrappedKey: WrappedDocumentKey,
  context: DocumentCryptoContext,
  wrappingKey: CryptoKey,
): Promise<Uint8Array> {
  if (wrappedKey.suite !== DOCUMENT_CRYPTO_SUITE) throw new Error("Unsupported cryptographic suite");
  try {
    return new Uint8Array(await webCrypto().subtle.decrypt(
      { name: "AES-GCM", iv: arrayBuffer(fromBase64(wrappedKey.iv)), additionalData: keyAad(context, wrappedKey.wrappingKeyId), tagLength: 128 },
      wrappingKey,
      arrayBuffer(fromBase64(wrappedKey.ciphertext)),
    ));
  } catch {
    throw new Error("Document key authentication failed");
  }
}

async function wrapDocumentKey(
  rawDocumentKey: Uint8Array,
  context: DocumentCryptoContext,
  wrappingKey: CryptoKey,
  wrappingKeyId: string,
  iv: Uint8Array = webCrypto().getRandomValues(new Uint8Array(12)),
): Promise<WrappedDocumentKey> {
  if (!wrappingKeyId || rawDocumentKey.byteLength !== 32 || iv.byteLength !== 12) throw new Error("Invalid document-key envelope context");
  const ciphertext = await webCrypto().subtle.encrypt(
    { name: "AES-GCM", iv: arrayBuffer(iv), additionalData: keyAad(context, wrappingKeyId), tagLength: 128 },
    wrappingKey,
    arrayBuffer(rawDocumentKey),
  );
  return { suite: DOCUMENT_CRYPTO_SUITE, wrappingKeyId, iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

export async function generateWrappingKey(extractable = false): Promise<CryptoKey> {
  return webCrypto().subtle.generateKey({ name: "AES-GCM", length: 256 }, extractable, ["encrypt", "decrypt"]);
}

export async function importWrappingKey(raw: Uint8Array, extractable = false): Promise<CryptoKey> {
  if (raw.byteLength !== 32) throw new Error("Wrapping key must be 256 bits");
  return webCrypto().subtle.importKey("raw", arrayBuffer(raw), { name: "AES-GCM", length: 256 }, extractable, ["encrypt", "decrypt"]);
}

export async function encryptDocument(
  plaintext: Uint8Array,
  context: DocumentCryptoContext,
  wrappingKey: CryptoKey,
  wrappingKeyId: string,
  options: { documentIv?: Uint8Array; keyIv?: Uint8Array; documentKey?: Uint8Array } = {},
): Promise<EncryptedDocumentEnvelope> {
  if (!context.workspaceId || !context.documentId || !context.mediaType || !wrappingKeyId) throw new Error("Complete cryptographic context is required");
  const crypto = webCrypto();
  const rawDocumentKey = options.documentKey ?? crypto.getRandomValues(new Uint8Array(32));
  const documentIv = options.documentIv ?? crypto.getRandomValues(new Uint8Array(12));
  const keyIv = options.keyIv ?? crypto.getRandomValues(new Uint8Array(12));
  if (rawDocumentKey.byteLength !== 32 || documentIv.byteLength !== 12 || keyIv.byteLength !== 12) throw new Error("Invalid cryptographic key or nonce length");
  const documentKey = await crypto.subtle.importKey("raw", arrayBuffer(rawDocumentKey), { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: arrayBuffer(documentIv), additionalData: documentAad(context), tagLength: 128 }, documentKey, arrayBuffer(plaintext));
  const wrappedKey = await wrapDocumentKey(rawDocumentKey, context, wrappingKey, wrappingKeyId, keyIv);
  rawDocumentKey.fill(0);
  return {
    ...context,
    suite: DOCUMENT_CRYPTO_SUITE,
    iv: toBase64(documentIv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    key: wrappedKey,
  };
}

/**
 * Creates a recipient-specific key envelope on an already-authorized client.
 * The server receives only this wrapped value and never the raw document key.
 */
export async function rewrapDocumentKey(
  envelope: EncryptedDocumentEnvelope,
  expected: DocumentCryptoContext,
  currentWrappingKey: CryptoKey,
  recipientWrappingKey: CryptoKey,
  recipientWrappingKeyId: string,
  options: { keyIv?: Uint8Array } = {},
): Promise<WrappedDocumentKey> {
  assertContext(envelope, expected);
  const rawDocumentKey = await unwrapDocumentKey(envelope.key, expected, currentWrappingKey);
  try {
    return await wrapDocumentKey(rawDocumentKey, expected, recipientWrappingKey, recipientWrappingKeyId, options.keyIv);
  } finally {
    rawDocumentKey.fill(0);
  }
}

/** Decrypts with a recipient/device envelope selected after current authorization. */
export async function decryptDocumentWithWrappedKey(
  envelope: EncryptedDocumentEnvelope,
  wrappedKey: WrappedDocumentKey,
  expected: DocumentCryptoContext,
  wrappingKey: CryptoKey,
): Promise<Uint8Array> {
  return decryptDocument({ ...envelope, key: wrappedKey }, expected, wrappingKey);
}

export async function decryptDocument(envelope: EncryptedDocumentEnvelope, expected: DocumentCryptoContext, wrappingKey: CryptoKey): Promise<Uint8Array> {
  assertContext(envelope, expected);
  const crypto = webCrypto();
  try {
    const rawDocumentKey = await unwrapDocumentKey(envelope.key, expected, wrappingKey);
    const documentKey = await crypto.subtle.importKey("raw", arrayBuffer(rawDocumentKey), { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    rawDocumentKey.fill(0);
    return new Uint8Array(await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: arrayBuffer(fromBase64(envelope.iv)), additionalData: documentAad(expected), tagLength: 128 },
      documentKey,
      arrayBuffer(fromBase64(envelope.ciphertext)),
    ));
  } catch (error) {
    if (error instanceof Error && (error.message === "Unsupported cryptographic suite" || error.message === "Cryptographic context mismatch")) throw error;
    throw new Error("Document authentication failed");
  }
}
