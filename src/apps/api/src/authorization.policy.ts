import type { AccessGrant, AuthorizationEpoch, Member, Workspace, WorkspaceAction } from "@document-management/contracts";

export type AuthorizationPhase = "INPUT" | "CANDIDATE" | "OUTPUT" | "EFFECT";

export interface AuthorizationContext {
  identityId: string;
  workspaceId: string;
  purposeId: "PUR-P1-001";
  action: WorkspaceAction;
  resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK";
  resourceId?: string;
  fieldRef?: string;
  edgeRef?: string;
  expectedAuthorizationEpoch?: number;
  expectedGrantId?: string;
  expectedGrantRevision?: number;
  expectedPolicyVersion?: AccessGrant["policyVersion"];
  phase?: AuthorizationPhase;
  at?: string;
}

export interface WorkspaceAuthority {
  workspace: Workspace;
  members: Member[];
  accessGrants: AccessGrant[];
  authorizationEpoch: AuthorizationEpoch;
}

export type AuthorizationReason =
  | "EXPLICIT_GRANT"
  | "EXPLICIT_DENY"
  | "WORKSPACE_UNAVAILABLE"
  | "MEMBERSHIP_UNAVAILABLE"
  | "STALE_AUTHORIZATION_EPOCH"
  | "STALE_GRANT_OR_POLICY"
  | "NO_CURRENT_GRANT"
  | "FIELD_SCOPE_UNAVAILABLE"
  | "EDGE_SCOPE_UNAVAILABLE";

export interface AuthorizationDecision {
  decision: "ALLOW" | "DENY";
  reason: AuthorizationReason;
  policyVersion: AccessGrant["policyVersion"] | "policy.local-explicit-grant@0.2";
  authorizationEpoch: number;
  phase: AuthorizationPhase;
  grantId?: string;
  grantRevision?: number;
}

export interface AuthorizationFence {
  identityId: string;
  workspaceId: string;
  purposeId: "PUR-P1-001";
  action: WorkspaceAction;
  resourceKind: AuthorizationContext["resourceKind"];
  resourceId?: string;
  fieldRef?: string;
  edgeRef?: string;
  policyVersion: AuthorizationDecision["policyVersion"];
  authorizationEpoch: number;
  grantId: string;
  grantRevision: number;
}

const POLICY_VERSION = "policy.local-explicit-grant@0.2" as const;

function resourceId(context: AuthorizationContext): string | undefined {
  return context.resourceKind === "WORKSPACE" ? context.resourceId ?? context.workspaceId : context.resourceId;
}

function grantCoversResource(grant: AccessGrant, context: AuthorizationContext): boolean {
  const id = resourceId(context);
  if (!id) return false;
  if (grant.resourceKind === "WORKSPACE") return grant.resourceIds.includes(context.workspaceId);
  return grant.resourceKind === context.resourceKind && grant.resourceIds.includes(id);
}

function grantIsCurrent(grant: AccessGrant, context: AuthorizationContext, at: number): boolean {
  return grant.workspaceId === context.workspaceId &&
    grant.granteeIdentityId === context.identityId &&
    grant.purposeId === context.purposeId &&
    grant.state === "ACTIVE" &&
    Number.isFinite(at) &&
    new Date(grant.startsAt).getTime() <= at &&
    (!grant.expiresAt || new Date(grant.expiresAt).getTime() > at) &&
    grant.actions.includes(context.action) &&
    (context.action !== "export.create" || grant.exportAllowed) &&
    grantCoversResource(grant, context);
}

function scopeReason(grant: AccessGrant, context: AuthorizationContext): Exclude<AuthorizationReason, "EXPLICIT_GRANT"> | undefined {
  if (context.fieldRef && !grant.fieldRefs.includes("*") && !grant.fieldRefs.includes(context.fieldRef)) return "FIELD_SCOPE_UNAVAILABLE";
  if (context.edgeRef && !grant.edgeRefs.includes("*") && !grant.edgeRefs.includes(context.edgeRef)) return "EDGE_SCOPE_UNAVAILABLE";
  return undefined;
}

export function decisionFence(context: AuthorizationContext, decision: AuthorizationDecision): AuthorizationFence | undefined {
  if (decision.decision !== "ALLOW" || !decision.grantId || decision.grantRevision === undefined) return undefined;
  return {
    identityId: context.identityId,
    workspaceId: context.workspaceId,
    purposeId: context.purposeId,
    action: context.action,
    resourceKind: context.resourceKind,
    ...(context.resourceId ? { resourceId: context.resourceId } : {}),
    ...(context.fieldRef ? { fieldRef: context.fieldRef } : {}),
    ...(context.edgeRef ? { edgeRef: context.edgeRef } : {}),
    policyVersion: decision.policyVersion,
    authorizationEpoch: decision.authorizationEpoch,
    grantId: decision.grantId,
    grantRevision: decision.grantRevision,
  };
}

export function evaluateAuthorization(authority: WorkspaceAuthority, context: AuthorizationContext): AuthorizationDecision {
  const phase = context.phase ?? "INPUT";
  const denied = (reason: Exclude<AuthorizationReason, "EXPLICIT_GRANT">, policyVersion: AuthorizationDecision["policyVersion"] = POLICY_VERSION): AuthorizationDecision => ({
    decision: "DENY",
    reason,
    policyVersion,
    authorizationEpoch: authority.authorizationEpoch.value,
    phase,
  });

  if (authority.workspace.id !== context.workspaceId || authority.workspace.status !== "ACTIVE") return denied("WORKSPACE_UNAVAILABLE");
  if (context.expectedAuthorizationEpoch !== undefined && context.expectedAuthorizationEpoch !== authority.authorizationEpoch.value) return denied("STALE_AUTHORIZATION_EPOCH");
  const membership = authority.members.find((candidate) =>
    candidate.workspaceId === context.workspaceId &&
    candidate.identityId === context.identityId &&
    candidate.state === "ACTIVE" &&
    candidate.invitationState === "ACTIVE",
  );
  if (!membership) return denied("MEMBERSHIP_UNAVAILABLE");

  const at = new Date(context.at ?? new Date().toISOString()).getTime();
  const applicable = authority.accessGrants.filter((grant) => grantIsCurrent(grant, context, at));
  const explicitDeny = applicable.find((grant) => grant.effect === "DENY" && !scopeReason(grant, context));
  if (explicitDeny) return denied("EXPLICIT_DENY", explicitDeny.policyVersion);
  if (context.expectedGrantId || context.expectedGrantRevision !== undefined || context.expectedPolicyVersion) {
    const fencedGrant = applicable.find((grant) =>
      grant.id === context.expectedGrantId &&
      grant.revision === context.expectedGrantRevision &&
      grant.policyVersion === context.expectedPolicyVersion,
    );
    if (!fencedGrant) return denied("STALE_GRANT_OR_POLICY");
    if (fencedGrant.effect !== "ALLOW") return denied("EXPLICIT_DENY", fencedGrant.policyVersion);
    const missingScope = scopeReason(fencedGrant, context);
    if (missingScope) return denied(missingScope, fencedGrant.policyVersion);
    return {
      decision: "ALLOW", reason: "EXPLICIT_GRANT", policyVersion: fencedGrant.policyVersion,
      authorizationEpoch: authority.authorizationEpoch.value, phase, grantId: fencedGrant.id, grantRevision: fencedGrant.revision,
    };
  }

  let scopedReason: Exclude<AuthorizationReason, "EXPLICIT_GRANT"> | undefined;
  for (const grant of applicable.filter((candidate) => candidate.effect === "ALLOW")) {
    const missingScope = scopeReason(grant, context);
    if (missingScope) {
      scopedReason ??= missingScope;
      continue;
    }
    return {
      decision: "ALLOW",
      reason: "EXPLICIT_GRANT",
      policyVersion: grant.policyVersion,
      authorizationEpoch: authority.authorizationEpoch.value,
      phase,
      grantId: grant.id,
      grantRevision: grant.revision,
    };
  }
  return denied(scopedReason ?? "NO_CURRENT_GRANT");
}
