import { describe, expect, it } from "vitest";
import { classifyDocument, normalizeQuestion } from "./index.js";

describe("document policies", () => {
  it("quarantines suspected clinical records", () => {
    expect(classifyDocument("patient-record.pdf", "Clinical note and diagnosis").policyHold).toBe(true);
  });

  it("classifies general insurance without clinical quarantine", () => {
    expect(classifyDocument("home-insurance.txt", "Home policy premium")).toEqual({
      category: "Insurance",
      policyHold: false,
    });
  });

  it("normalizes retrieval tokens deterministically", () => {
    expect(normalizeQuestion("When does the policy expire, when?")).toEqual(["when", "does", "the", "policy", "expire"]);
  });
});
