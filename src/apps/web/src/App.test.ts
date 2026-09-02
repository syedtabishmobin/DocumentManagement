import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { authModeForRoute, authReturnToForRoute, containedDocumentMessage } from "./App";
import { AuthScreen, ExternalIdentityOptions, Startup } from "./Auth";

describe("bounded application startup", () => {
  it("does not offer retry while the initial session request is ordinarily loading", () => {
    const markup = renderToStaticMarkup(createElement(Startup, { message: "Opening your private workspace…" }));

    expect(markup).toContain("Opening your private workspace…");
    expect(markup).not.toContain("Try again");
  });

  it("shows profile-neutral actionable text and retry only after failure", () => {
    const markup = renderToStaticMarkup(createElement(Startup, { message: "Doculyra took too long to start. Try again.", retry: () => undefined }));

    expect(markup).toContain("Doculyra took too long to start");
    expect(markup).not.toMatch(/API service|development preview|local profile/i);
    expect(markup).toContain("Try again");
  });

  it("preserves the requested anonymous login or registration mode", () => {
    const loginMode = authModeForRoute(new URL("https://preview.example/app?mode=login"));
    const registerMode = authModeForRoute(new URL("https://preview.example/app?mode=register"));

    expect(renderToStaticMarkup(createElement(AuthScreen, { initialMode: loginMode, onAuthenticated: () => undefined }))).toContain("Sign in");
    expect(renderToStaticMarkup(createElement(AuthScreen, { initialMode: registerMode, onAuthenticated: () => undefined }))).toContain("Create an account");
  });

  it("preserves only a same-origin post-authentication destination", () => {
    expect(authReturnToForRoute(new URL("https://preview.example/app?mode=login&return_to=%2Fapp%2Fdocuments"))).toBe("/app/documents");
    expect(authReturnToForRoute(new URL("https://preview.example/app?return_to=https%3A%2F%2Fattacker.example"))).toBe("/app");
  });

  it("renders provider loading as disabled and avoids a premature retry or success claim", () => {
    const markup = renderToStaticMarkup(createElement(ExternalIdentityOptions, { state: { status: "loading" }, startingProvider: undefined }));

    expect(markup).toContain("Checking provider availability");
    expect(markup.match(/disabled=""/g)).toHaveLength(3);
    expect(markup).not.toMatch(/connected|signed in|success/i);
  });

  it("enables only available providers and gives each unavailable provider a visible explanation", () => {
    const markup = renderToStaticMarkup(createElement(ExternalIdentityOptions, {
      state: {
        status: "ready",
        availability: {
          broker: "MICROSOFT_ENTRA_EXTERNAL_ID",
          providers: [
            { provider: "GOOGLE", available: true },
            { provider: "APPLE", available: false },
            { provider: "MICROSOFT", available: false },
          ],
        },
      },
      startingProvider: undefined,
      onStart: () => undefined,
    }));

    expect(markup).toMatch(/<button[^>]*>.*Google<\/button>/);
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>.*Apple<\/button>/);
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>.*Microsoft<\/button>/);
    expect(markup).toContain("Apple sign-in is not enabled in this environment.");
    expect(markup).toContain("Microsoft sign-in is not enabled in this environment.");
    expect(markup).toContain('aria-describedby="provider-apple-explanation"');
  });

  it("keeps passkeys separate and preserves local credentials and the DEC-038 boundary", () => {
    const markup = renderToStaticMarkup(createElement(AuthScreen, { initialMode: "login", onAuthenticated: () => undefined }));

    expect(markup).toContain("Use a passkey");
    expect(markup).toContain("They are not a social sign-in provider");
    expect(markup).toContain("Email address");
    expect(markup).toContain("Password");
    expect(markup).toContain("Account recovery is not available yet");
    expect(markup).not.toMatch(/forgot password|reset password/i);
  });

  it("renders privacy-safe callback cancellation and failure announcements", () => {
    const cancelled = renderToStaticMarkup(createElement(AuthScreen, { callbackNotice: { kind: "cancelled", message: "Sign-in was cancelled. No external account was connected." }, onAuthenticated: () => undefined }));
    const failed = renderToStaticMarkup(createElement(AuthScreen, { callbackNotice: { kind: "failed", message: "External sign-in could not be completed. Try again or use email and password." }, onAuthenticated: () => undefined }));

    expect(cancelled).toContain('role="status"');
    expect(cancelled).toContain('tabindex="-1"');
    expect(failed).toContain('role="alert"');
  });
});

describe("contained document presentation", () => {
  it("uses a generic fail-closed message without promising a disposition", () => {
    const message = containedDocumentMessage("POLICY_HOLD");
    expect(message).toBe("Contained; action unavailable under current policy.");
    expect(message).not.toMatch(/release|approve|override|safe|malware|clinical/i);
  });

  it("does not label ordinary documents as contained", () => {
    expect(containedDocumentMessage("NEEDS_REVIEW")).toBe("");
  });
});
