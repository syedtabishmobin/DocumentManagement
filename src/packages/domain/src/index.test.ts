import { describe, expect, it } from "vitest";
import { classifyDocument, extractProfileFacts, normalizeQuestion } from "./index.js";

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

  it("extracts bounded profile proposals with their evidence line", () => {
    const facts = extractProfileFacts("Policy number: SYN-12345\nRenewal date: 18 September 2027\nAddress: 10 Example Street, Sydney NSW 2000");
    expect(facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ definitionId: "fact.policy.number", value: "SYN-12345", evidenceExcerpt: "Policy number: SYN-12345" }),
      expect.objectContaining({ definitionId: "fact.document.renewal_date", value: "18 September 2027" }),
      expect.objectContaining({ definitionId: "fact.address.home", value: "10 Example Street, Sydney NSW 2000" }),
    ]));
  });
});
