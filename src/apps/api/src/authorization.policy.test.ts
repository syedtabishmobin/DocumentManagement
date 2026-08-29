import { describe, expect, it } from "vitest";
import type { AccessGrant, AuthorizationEpoch, Member, Workspace } from "@document-management/contracts";
import { evaluateAuthorization, type WorkspaceAuthority } from "./authorization.policy.js";

const workspace: Workspace = {
  id: "wrk_a",
  name: "Synthetic household",
  type: "FAMILY",
  status: "ACTIVE",
  ownerBindingId: "own_a",
  jurisdictionPackRef: "jurisdiction.AU",
  residencyPolicyRef: "residency.local.synthetic",
  configurationVersion: "configuration.local.synthetic@0.1",
  revision: 1,
  createdAt: "2026-08-29T00:00:00.000Z",
};
const member: Member = {
  id: "mem_a",
  workspaceId: workspace.id,
  identityId: "id_a",
  displayName: "Synthetic Owner",
  role: "OWNER",
  state: "ACTIVE",
  subjectId: "sub_a",
  invitationState: "ACTIVE",
  permissions: { view: true, add: true, edit: true, delete: true },
  createdAt: workspace.createdAt,
  revision: 1,
};
const grant: AccessGrant = {
  id: "grt_a",
  workspaceId: workspace.id,
  grantorIdentityId: "id_a",
  granteeIdentityId: "id_a",
  purposeId: "PUR-P1-001",
  resourceKind: "WORKSPACE",
  resourceIds: [workspace.id],
  actions: ["workspace.read", "document.read", "document.create"],
  startsAt: workspace.createdAt,
  state: "ACTIVE",
  policyVersion: "policy.local-explicit-grant@0.1",
  onwardDelegation: false,
  exportAllowed: false,
  createdAt: workspace.createdAt,
  revision: 1,
};
const authorizationEpoch: AuthorizationEpoch = { workspaceId: workspace.id, value: 1, cause: "WORKSPACE_CREATED", advancedAt: workspace.createdAt };
const authority: WorkspaceAuthority = { workspace, members: [member], accessGrants: [grant], authorizationEpoch };

describe("evaluateAuthorization", () => {
  it("allows only an explicit current action grant", () => {
    expect(evaluateAuthorization(authority, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a", at: "2026-08-29T00:01:00.000Z" })).toMatchObject({ decision: "ALLOW", grantId: grant.id, authorizationEpoch: 1 });
    expect(evaluateAuthorization(authority, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.delete", resourceKind: "DOCUMENT", resourceId: "doc_a", at: "2026-08-29T00:01:00.000Z" })).toMatchObject({ decision: "DENY", reason: "NO_CURRENT_GRANT" });
    const resourceScoped: WorkspaceAuthority = { ...authority, accessGrants: [{ ...grant, resourceKind: "DOCUMENT", resourceIds: ["doc_a"] }] };
    expect(evaluateAuthorization(resourceScoped, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a" })).toMatchObject({ decision: "ALLOW" });
    expect(evaluateAuthorization(resourceScoped, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_b" })).toMatchObject({ decision: "DENY", reason: "NO_CURRENT_GRANT" });
  });

  it("denies membership, tenant, expiry, and export shortcuts", () => {
    expect(evaluateAuthorization(authority, { identityId: "id_b", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "workspace.read", resourceKind: "WORKSPACE" })).toMatchObject({ decision: "DENY", reason: "MEMBERSHIP_UNAVAILABLE" });
    expect(evaluateAuthorization(authority, { identityId: "id_a", workspaceId: "wrk_b", purposeId: "PUR-P1-001", action: "workspace.read", resourceKind: "WORKSPACE" })).toMatchObject({ decision: "DENY", reason: "WORKSPACE_UNAVAILABLE" });
    const nonExportable: WorkspaceAuthority = { ...authority, accessGrants: [{ ...grant, actions: [...grant.actions, "export.create"], exportAllowed: false }] };
    expect(evaluateAuthorization(nonExportable, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "export.create", resourceKind: "WORKSPACE" })).toMatchObject({ decision: "DENY", reason: "NO_CURRENT_GRANT" });
    const expired: WorkspaceAuthority = { ...authority, accessGrants: [{ ...grant, expiresAt: "2026-08-29T00:00:30.000Z" }] };
    expect(evaluateAuthorization(expired, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a", at: "2026-08-29T00:01:00.000Z" })).toMatchObject({ decision: "DENY", reason: "NO_CURRENT_GRANT" });
  });
});
