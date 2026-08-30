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
  validFrom: workspace.createdAt,
  recordedAt: workspace.createdAt,
  createdAt: workspace.createdAt,
  revision: 1,
  history: [],
};
const grant: AccessGrant = {
  id: "grt_a",
  workspaceId: workspace.id,
  grantorIdentityId: "id_a",
  granteeIdentityId: "id_a",
  purposeId: "PUR-P1-001",
  resourceKind: "WORKSPACE",
  resourceIds: [workspace.id],
  fieldRefs: ["*"],
  edgeRefs: ["*"],
  actions: ["workspace.read", "document.read", "document.create"],
  startsAt: workspace.createdAt,
  state: "ACTIVE",
  policyVersion: "policy.local-explicit-grant@0.1",
  effect: "ALLOW",
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

  it("denies a current identity whose membership belongs to another workspace", () => {
    expect(evaluateAuthorization({
      ...authority,
      members: [{ ...member, workspaceId: "workspace_foreign" }],
    }, {
      identityId: member.identityId!,
      workspaceId: workspace.id,
      purposeId: "PUR-P1-001",
      action: "workspace.read",
      resourceKind: "WORKSPACE",
      resourceId: workspace.id,
      at: "2026-08-29T00:01:00.000Z",
    })).toMatchObject({ decision: "DENY", reason: "MEMBERSHIP_UNAVAILABLE" });
  });

  it("authorizes resource, sensitive field, edge, and action scopes independently", () => {
    const bounded: WorkspaceAuthority = {
      ...authority,
      accessGrants: [{ ...grant, resourceKind: "DOCUMENT", resourceIds: ["doc_a"], fieldRefs: ["document.metadata"], edgeRefs: ["dependency.DOCUMENT_CATEGORY"], actions: ["document.read"] }],
    };
    expect(evaluateAuthorization(bounded, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a" })).toMatchObject({ decision: "ALLOW" });
    expect(evaluateAuthorization(bounded, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a", fieldRef: "document.content" })).toMatchObject({ decision: "DENY", reason: "FIELD_SCOPE_UNAVAILABLE" });
    expect(evaluateAuthorization(bounded, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a", edgeRef: "dependency.DOCUMENT_SUBJECT" })).toMatchObject({ decision: "DENY", reason: "EDGE_SCOPE_UNAVAILABLE" });
    expect(evaluateAuthorization(bounded, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.delete", resourceKind: "DOCUMENT", resourceId: "doc_a" })).toMatchObject({ decision: "DENY", reason: "NO_CURRENT_GRANT" });
  });

  it("applies explicit deny precedence and fails closed across epoch or participation changes", () => {
    const deny: AccessGrant = { ...grant, id: "grt_deny", effect: "DENY", resourceKind: "DOCUMENT", resourceIds: ["doc_a"], actions: ["document.read"] };
    expect(evaluateAuthorization({ ...authority, accessGrants: [grant, deny] }, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a" })).toMatchObject({ decision: "DENY", reason: "EXPLICIT_DENY" });
    expect(evaluateAuthorization(authority, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a", expectedAuthorizationEpoch: 0, phase: "OUTPUT" })).toMatchObject({ decision: "DENY", reason: "STALE_AUTHORIZATION_EPOCH", phase: "OUTPUT" });
    expect(evaluateAuthorization(authority, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a", expectedAuthorizationEpoch: 1, expectedGrantId: grant.id, expectedGrantRevision: 99, expectedPolicyVersion: grant.policyVersion, phase: "OUTPUT" })).toMatchObject({ decision: "DENY", reason: "STALE_GRANT_OR_POLICY", phase: "OUTPUT" });
    const boundedFenceGrant: AccessGrant = { ...grant, id: "grt_bounded", resourceKind: "DOCUMENT", resourceIds: ["doc_a"], fieldRefs: ["document.metadata"] };
    const broadAlternate: AccessGrant = { ...grant, id: "grt_broad", resourceKind: "DOCUMENT", resourceIds: ["doc_a"] };
    expect(evaluateAuthorization({ ...authority, accessGrants: [boundedFenceGrant, broadAlternate] }, {
      identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a",
      fieldRef: "document.content", expectedAuthorizationEpoch: 1, expectedGrantId: boundedFenceGrant.id,
      expectedGrantRevision: boundedFenceGrant.revision, expectedPolicyVersion: boundedFenceGrant.policyVersion, phase: "OUTPUT",
    })).toMatchObject({ decision: "DENY", reason: "FIELD_SCOPE_UNAVAILABLE", phase: "OUTPUT" });
    expect(evaluateAuthorization({ ...authority, members: [{ ...member, invitationState: "PENDING" }] }, { identityId: "id_a", workspaceId: workspace.id, purposeId: "PUR-P1-001", action: "document.read", resourceKind: "DOCUMENT", resourceId: "doc_a" })).toMatchObject({ decision: "DENY", reason: "MEMBERSHIP_UNAVAILABLE" });
  });
});
