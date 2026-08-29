import type { AccessGrant, AuthorizationEpoch, Member, Workspace, WorkspaceAction } from "@document-management/contracts";

export interface AuthorizationContext {
  identityId: string;
  workspaceId: string;
  purposeId: "PUR-P1-001";
  action: WorkspaceAction;
  resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK";
  resourceId?: string;
  at?: string;
}
export interface WorkspaceAuthority {
  workspace: Workspace;
  members: Member[];
  accessGrants: AccessGrant[];
  authorizationEpoch: AuthorizationEpoch;
}

export interface AuthorizationDecision {
  decision: "ALLOW" | "DENY";
  reason: "EXPLICIT_GRANT" | "WORKSPACE_UNAVAILABLE" | "MEMBERSHIP_UNAVAILABLE" | "NO_CURRENT_GRANT";
  policyVersion: "policy.local-explicit-grant@0.1";
  authorizationEpoch: number;
  grantId?: string;
}

const POLICY_VERSION = "policy.local-explicit-grant@0.1" as const;

function grantCoversResource(grant: AccessGrant, context: AuthorizationContext): boolean {
  if (grant.resourceKind === "WORKSPACE") return grant.resourceIds.includes(context.workspaceId);
  return grant.resourceKind === context.resourceKind && Boolean(context.resourceId && grant.resourceIds.includes(context.resourceId));
}

export function evaluateAuthorization(authority: WorkspaceAuthority, context: AuthorizationContext): AuthorizationDecision {
  const denied = (reason: Exclude<AuthorizationDecision["reason"], "EXPLICIT_GRANT">): AuthorizationDecision => ({
    decision: "DENY",
    reason,
    policyVersion: POLICY_VERSION,
    authorizationEpoch: authority.authorizationEpoch.value,
  });

  if (authority.workspace.id !== context.workspaceId || authority.workspace.status !== "ACTIVE") return denied("WORKSPACE_UNAVAILABLE");
  const membership = authority.members.find((candidate) => candidate.identityId === context.identityId && candidate.state === "ACTIVE");
  if (!membership) return denied("MEMBERSHIP_UNAVAILABLE");

  const at = new Date(context.at ?? new Date().toISOString()).getTime();
  const grant = authority.accessGrants.find((candidate) =>
    candidate.workspaceId === context.workspaceId &&
    candidate.granteeIdentityId === context.identityId &&
    candidate.purposeId === context.purposeId &&
    candidate.state === "ACTIVE" &&
    new Date(candidate.startsAt).getTime() <= at &&
    (!candidate.expiresAt || new Date(candidate.expiresAt).getTime() > at) &&
    candidate.actions.includes(context.action) &&
    (context.action !== "export.create" || candidate.exportAllowed) &&
    grantCoversResource(candidate, context),
  );
  if (!grant) return denied("NO_CURRENT_GRANT");
  return {
    decision: "ALLOW",
    reason: "EXPLICIT_GRANT",
    policyVersion: POLICY_VERSION,
    authorizationEpoch: authority.authorizationEpoch.value,
    grantId: grant.id,
  };
}
