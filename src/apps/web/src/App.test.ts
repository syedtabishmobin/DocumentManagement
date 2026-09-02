import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { authModeForRoute, containedDocumentMessage } from "./App";
import { AuthScreen, Startup } from "./Auth";

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
