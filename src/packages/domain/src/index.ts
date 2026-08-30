import type { DocumentRecord, Member, WorkspaceRole } from "@document-management/contracts";

const clinicalSignals = [
  "medical history",
  "clinical note",
  "diagnosis",
  "pathology",
  "radiology",
  "patient record",
];

export type SyntheticSafetyVerdict = "CLEAN" | "MALICIOUS" | "INDETERMINATE" | "SUSPECTED_CLINICAL";

export interface SyntheticSafetyAssessment {
  verdict: SyntheticSafetyVerdict;
  integrityState: "VERIFIED" | "INDETERMINATE";
  reasonCode: "SYNTHETIC_SAFETY_CLEARED" | "SYNTHETIC_MALWARE_SIGNATURE" | "SCANNER_INDETERMINATE" | "POLICY_PENDING_CONTENT";
}

function hasExpectedSignature(mediaType: string, bytes: Uint8Array): boolean {
  if (mediaType.startsWith("text/") || mediaType === "application/json" || mediaType === "application/xml") return bytes.length > 0 && !bytes.includes(0);
  if (mediaType === "application/pdf") return bytes.length >= 5 && [0x25, 0x50, 0x44, 0x46, 0x2d].every((value, index) => bytes[index] === value);
  if (mediaType === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (mediaType === "image/jpeg") return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

export function assessSyntheticSafety(name: string, mediaType: string, bytes: Uint8Array): SyntheticSafetyAssessment {
  const sample = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, 500_000))).toLowerCase();
  const label = `${name} ${sample}`.toLowerCase();
  if (sample.includes("eicar-standard-antivirus-test-file") || sample.includes("synthetic-malware-signature") || (sample.includes("%pdf-") && sample.includes("<script"))) {
    return { verdict: "MALICIOUS", integrityState: "VERIFIED", reasonCode: "SYNTHETIC_MALWARE_SIGNATURE" };
  }
  if (clinicalSignals.some((signal) => label.includes(signal))) {
    return { verdict: "SUSPECTED_CLINICAL", integrityState: "VERIFIED", reasonCode: "POLICY_PENDING_CONTENT" };
  }
  if (sample.includes("synthetic-scanner-unavailable") || /\.(zip|7z|rar|tar|gz)$/i.test(name) || !hasExpectedSignature(mediaType, bytes)) {
    return { verdict: "INDETERMINATE", integrityState: "INDETERMINATE", reasonCode: "SCANNER_INDETERMINATE" };
  }
  return { verdict: "CLEAN", integrityState: "VERIFIED", reasonCode: "SYNTHETIC_SAFETY_CLEARED" };
}

export function classifyDocument(name: string, extractedText: string): { category: string; policyHold: boolean } {
  const haystack = `${name} ${extractedText}`.toLowerCase();
  const policyHold = clinicalSignals.some((signal) => haystack.includes(signal));
  if (policyHold) return { category: "Excluded clinical record", policyHold: true };
  if (/passport|licen[cs]e|birth certificate|citizenship/.test(haystack)) return { category: "Identity", policyHold: false };
  if (/insurance|policy|cover|premium/.test(haystack)) return { category: "Insurance", policyHold: false };
  if (/lease|mortgage|property|strata/.test(haystack)) return { category: "Property", policyHold: false };
  if (/tax|assessment|deduction/.test(haystack)) return { category: "Tax", policyHold: false };
  if (/employment|contract|payslip|employer/.test(haystack)) return { category: "Employment", policyHold: false };
  if (/vehicle|registration|roadside/.test(haystack)) return { category: "Vehicles", policyHold: false };
  if (/degree|certificate|training|university|school/.test(haystack)) return { category: "Education", policyHold: false };
  return { category: "Household", policyHold: false };
}

export function mayManageWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "FAMILY_ADMIN";
}

export function mayReadDocument(member: Member, document: DocumentRecord): boolean {
  return member.workspaceId === document.workspaceId && member.state === "ACTIVE" && document.status !== "DELETED";
}

export function assertWorkspaceScope(workspaceId: string, resourceWorkspaceId: string): void {
  if (workspaceId !== resourceWorkspaceId) throw new Error("WORKSPACE_SCOPE_DENIED");
}

export function normalizeQuestion(value: string): string[] {
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter((token) => token.length > 2);
}

export interface ExtractedProfileFact {
  definitionId: string;
  name: string;
  value: string;
  evidenceExcerpt: string;
  confidence: number;
}

const factPatterns: Array<{ definitionId: string; name: string; expression: RegExp; confidence: number }> = [
  { definitionId: "fact.contact.email", name: "Email address", expression: /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i, confidence: 0.98 },
  { definitionId: "fact.identity.date_of_birth", name: "Date of birth", expression: /(?:date of birth|dob)\s*[:\-]?\s*([^\n,;]{4,32})/i, confidence: 0.9 },
  { definitionId: "fact.address.home", name: "Address", expression: /(?:home address|residential address|address)\s*[:\-]?\s*([^\n]{5,140})/i, confidence: 0.86 },
  { definitionId: "fact.document.expiry_date", name: "Expiry date", expression: /(?:expiry(?: date)?|expires?)\s*(?:on|:|\-)?\s*([^\n,;]{4,42})/i, confidence: 0.88 },
  { definitionId: "fact.document.renewal_date", name: "Renewal date", expression: /(?:renewal(?: date)?|renews?)\s*(?:on|:|\-)?\s*([^\n,;]{4,42})/i, confidence: 0.88 },
  { definitionId: "fact.policy.number", name: "Policy number", expression: /(?:policy number|policy no\.?|policy #)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/ ]{3,40})/i, confidence: 0.94 },
  { definitionId: "fact.membership.number", name: "Member number", expression: /(?:member number|membership number|member no\.?)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/ ]{3,40})/i, confidence: 0.92 },
  { definitionId: "fact.vehicle.registration", name: "Vehicle registration", expression: /(?:registration|rego)\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\- ]{2,16})/i, confidence: 0.88 },
  { definitionId: "fact.employment.employer", name: "Employer", expression: /(?:employer|company)\s*[:\-]?\s*([^\n,;]{2,100})/i, confidence: 0.82 },
];

export function extractProfileFacts(text: string): ExtractedProfileFact[] {
  const results: ExtractedProfileFact[] = [];
  for (const pattern of factPatterns) {
    const match = pattern.expression.exec(text);
    if (!match?.[1]) continue;
    const value = match[1].trim().replace(/[.]+$/, "");
    if (!value) continue;
    const line = text.split(/\r?\n/).find((candidate) => candidate.includes(match[0])) ?? match[0];
    results.push({ definitionId: pattern.definitionId, name: pattern.name, confidence: pattern.confidence, value: value.slice(0, 180), evidenceExcerpt: line.trim().slice(0, 280) });
  }
  return results;
}
