import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DashboardSnapshot } from "@document-management/contracts";
import { ProfileView } from "./Profile.js";

const snapshot: DashboardSnapshot = {
  workspace: { id: "workspace-synthetic", name: "Synthetic household", type: "FAMILY", createdAt: "2026-08-28T00:00:00.000Z" },
  documents: [{ id: "document-synthetic", workspaceId: "workspace-synthetic", name: "Synthetic policy.txt", mediaType: "text/plain", size: 80, sha256: "abc", status: "READY", category: "Insurance", version: 1, createdAt: "2026-08-28T00:00:00.000Z", updatedAt: "2026-08-28T00:00:00.000Z", subjectIds: ["subject-synthetic"], captureRoute: "MANUAL" }],
  facts: [{ id: "fact-synthetic", workspaceId: "workspace-synthetic", documentId: "document-synthetic", subjectIds: ["subject-synthetic"], definitionId: "fact.policy.number", name: "Policy number", value: "SYN-12345", confidence: 0.94, reviewState: "PROPOSED", evidenceExcerpt: "Policy number: SYN-12345", validFrom: "2026-08-28T00:00:00.000Z", recordedAt: "2026-08-28T00:00:00.000Z" }],
  dependencies: [{ id: "edge-synthetic", workspaceId: "workspace-synthetic", fromType: "SUBJECT", fromId: "subject-synthetic", toType: "DOCUMENT", toId: "document-synthetic", kind: "DOCUMENT_SUBJECT", label: "Document belongs to", evidenceDocumentId: "document-synthetic", createdAt: "2026-08-28T00:00:00.000Z" }],
  subjects: [{ id: "subject-synthetic", workspaceId: "workspace-synthetic", displayName: "Synthetic Person", kind: "OWNER", relationship: "Self", createdAt: "2026-08-28T00:00:00.000Z" }],
  members: [], tasks: [], notifications: [], audit: [], localMode: true, customerDataPolicy: "synthetic-only",
};

describe("personal profile experience", () => {
  it("shows central extracted proposals, category hierarchy and an accessible relationship list", () => {
    const markup = renderToStaticMarkup(<ProfileView data={snapshot} refresh={async () => undefined} />);

    expect(markup).toContain("Extracted information");
    expect(markup).toContain("SYN-12345");
    expect(markup).toContain("Proposed · review needed");
    expect(markup).toContain("Document categories");
    expect(markup).toContain("provides evidence for");
  });
});
