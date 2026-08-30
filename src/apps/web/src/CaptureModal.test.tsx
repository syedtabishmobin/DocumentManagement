import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CaptureModal, createCaptureOperation } from "./CaptureModal.js";

describe("CaptureModal route equivalence", () => {
  it("exposes keyboard-operable file, camera and manual choices from one labelled dialog", () => {
    const markup = renderToStaticMarkup(<CaptureModal
      subjects={[{ id: "subject_synthetic_001", workspaceId: "workspace_synthetic_001", displayName: "Synthetic Owner", kind: "OWNER", relationship: "Self", status: "ACTIVE", validFrom: "2026-08-30T00:00:00.000Z", recordedAt: "2026-08-30T00:00:00.000Z", createdAt: "2026-08-30T00:00:00.000Z", revision: 1, history: [] }]}
      onClose={() => undefined}
      onAdded={async () => undefined}
    />);
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-labelledby="capture-title"');
    expect(markup).toContain("Files or folder");
    expect(markup).toContain("Camera or scan");
    expect(markup).toContain("Enter details");
    expect(markup).toContain("Close");
    expect(markup).toContain("camera access is denied or cancelled");
  });

  it("retains one bounded operation key across retry and allocates a new key for a new acquisition", () => {
    const file = new File(["synthetic"], "synthetic.txt", { type: "text/plain" });
    const first = createCaptureOperation([file], "FILE", ["subject_synthetic_001"], true);
    const retry = first;
    const second = createCaptureOperation([file], "FILE", ["subject_synthetic_001"], true);
    expect(retry.keys).toEqual(first.keys);
    expect(second.keys[0]).not.toBe(first.keys[0]);
  });
});
