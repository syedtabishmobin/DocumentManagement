import type { DocumentRecord, Member, WorkspaceRole } from "@document-management/contracts";

const clinicalSignals = [
  "medical history",
  "clinical note",
  "diagnosis",
  "pathology",
  "radiology",
  "patient record",
];

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
