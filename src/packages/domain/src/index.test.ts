import { describe, expect, it } from "vitest";
import { assessSyntheticSafety, classifyDocument, extractProfileFacts, normalizeQuestion } from "./index.js";

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

  it("contains synthetic malware, scanner uncertainty and suspected clinical bytes before ordinary processing", () => {
    expect(assessSyntheticSafety("clean.txt", "text/plain", Buffer.from("Synthetic household record"))).toMatchObject({ verdict: "CLEAN", integrityState: "VERIFIED" });
    expect(assessSyntheticSafety("malicious.txt", "text/plain", Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"))).toMatchObject({ verdict: "MALICIOUS", reasonCode: "SYNTHETIC_MALWARE_SIGNATURE" });
    expect(assessSyntheticSafety("scan.txt", "text/plain", Buffer.from("SYNTHETIC-SCANNER-UNAVAILABLE"))).toMatchObject({ verdict: "INDETERMINATE", integrityState: "INDETERMINATE" });
    expect(assessSyntheticSafety("record.txt", "text/plain", Buffer.from("Clinical note: synthetic diagnosis"))).toMatchObject({ verdict: "SUSPECTED_CLINICAL", reasonCode: "POLICY_PENDING_CONTENT" });
    expect(assessSyntheticSafety("polyglot.pdf", "application/pdf", Buffer.from("%PDF-1.7 <script>synthetic</script>"))).toMatchObject({ verdict: "MALICIOUS" });
    expect(assessSyntheticSafety("archive.zip", "application/zip", Buffer.from("synthetic archive"))).toMatchObject({ verdict: "INDETERMINATE" });
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
