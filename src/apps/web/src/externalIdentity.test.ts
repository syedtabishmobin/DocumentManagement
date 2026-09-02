import { describe, expect, it } from "vitest";

import { availabilityByProvider, externalIdentityCallbackNotice, externalIdentityStartPath, parseExternalIdentityAvailability, safeAuthReturnTo, safeExternalAuthorizationUrl } from "./externalIdentity.js";

describe("external identity navigation", () => {
  it("preserves a same-origin return path and rejects external or ambiguous destinations", () => {
    expect(safeAuthReturnTo("/app/documents")).toBe("/app/documents");
    expect(safeAuthReturnTo("/app?view=documents#current")).toBe("/app");
    expect(safeAuthReturnTo("https://attacker.example/collect")).toBe("/app");
    expect(safeAuthReturnTo("//attacker.example/collect")).toBe("/app");
    expect(safeAuthReturnTo("/\\attacker.example/collect")).toBe("/app");
  });

  it("builds only the provider-specific same-origin start endpoint", () => {
    expect(externalIdentityStartPath("GOOGLE", "/app/documents")).toBe("/auth/external/start?provider=GOOGLE&returnPath=%2Fapp%2Fdocuments");
    expect(externalIdentityStartPath("MICROSOFT", "https://attacker.example/collect")).toBe("/auth/external/start?provider=MICROSOFT&returnPath=%2Fapp");
    expect(safeExternalAuthorizationUrl("https://identity.example/authorize?state=opaque")).toBe("https://identity.example/authorize?state=opaque");
    expect(safeExternalAuthorizationUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("maps cancellation and failures without rendering provider payloads", () => {
    const cancelled = externalIdentityCallbackNotice(new URL("https://preview.example/app?external_auth=cancelled&error=access_denied&error_description=owner%40example.test"));
    const failed = externalIdentityCallbackNotice(new URL("https://preview.example/app?external_auth=failed&reason=invalid&error_description=token-secret"));

    expect(cancelled).toEqual({ kind: "cancelled", message: "Sign-in was cancelled. No external account was connected." });
    expect(failed).toEqual({ kind: "failed", message: "That sign-in attempt could not be verified. Start again or use email and password." });
    expect(JSON.stringify([cancelled, failed])).not.toMatch(/owner@example\.test|token-secret/);
  });

  it("does not claim callback success before the session endpoint authenticates", () => {
    expect(externalIdentityCallbackNotice(new URL("https://preview.example/app?external_auth=success"))).toBeUndefined();
  });

  it("fails closed when the availability response omits a provider", () => {
    const providers = availabilityByProvider({ broker: "MICROSOFT_ENTRA_EXTERNAL_ID", providers: [{ provider: "GOOGLE", available: true }] });

    expect(providers.google.available).toBe(true);
    expect(providers.apple).toEqual({ provider: "apple", available: false });
    expect(providers.microsoft.available).toBe(false);
  });

  it("rejects malformed or unsupported availability records instead of enabling a provider", () => {
    expect(() => parseExternalIdentityAvailability({ broker: "OTHER", providers: [] })).toThrow("Provider availability could not be verified");
    expect(() => parseExternalIdentityAvailability({ broker: "MICROSOFT_ENTRA_EXTERNAL_ID", providers: [{ provider: "GOOGLE", available: "yes" }] })).toThrow("Provider availability could not be verified");
  });
});
