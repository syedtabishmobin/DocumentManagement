import { describe, expect, it } from "vitest";

import { containedDocumentMessage } from "./App";

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
