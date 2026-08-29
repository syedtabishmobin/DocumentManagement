import { Body, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, Post, Req, Res } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import { loginSchema, registerSchema, selectWorkspaceSchema, type AuthSession, type WorkspaceSummary } from "@document-management/contracts";
import { IdentityStore, type AuthenticatedIdentity, type SessionCredentials } from "./identity.store.js";
import { LocalStore, type WorkspaceActor } from "./local.store.js";

export function sessionToken(request: Request): string | undefined {
  const raw = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("dm_session="));
  return raw ? decodeURIComponent(raw.slice("dm_session=".length)) : undefined;
}

function secureCookieAttribute(): string {
  return (process.env.DM_PROFILE ?? "local") === "local" ? "" : "; Secure";
}

export function setSessionCredentials(response: Response, credentials: SessionCredentials): void {
  response.setHeader("set-cookie", `dm_session=${encodeURIComponent(credentials.token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secureCookieAttribute()}`);
  response.setHeader("X-CSRF-Token", credentials.csrfToken);
  response.setHeader("Cache-Control", "private, no-store");
}

export function clearSessionCookie(response: Response): void {
  response.setHeader("set-cookie", `dm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookieAttribute()}`);
  response.setHeader("Cache-Control", "private, no-store");
}

function configuredOrigins(): Set<string> {
  const values = (process.env.DM_WEB_ORIGIN ?? "http://localhost:4173,http://127.0.0.1:4173").split(",").map((value) => value.trim()).filter(Boolean);
  if (process.env.DM_PUBLIC_BASE_URL) {
    try { values.push(new URL(process.env.DM_PUBLIC_BASE_URL).origin); } catch { /* Startup validation owns malformed deployment configuration. */ }
  }
  return new Set(values);
}

export function assertTrustedOrigin(request: Request): void {
  const origin = request.get("origin");
  if (origin && !configuredOrigins().has(origin)) throw new ForbiddenException("Request could not be authorized");
}

export function clientFingerprint(request: Request): string {
  return createHash("sha256").update(`${request.ip ?? request.socket.remoteAddress ?? "unknown"}\u001f${request.get("user-agent") ?? "unknown"}`).digest("hex");
}

export function actorFor(identity: AuthenticatedIdentity): WorkspaceActor {
  return { identityId: identity.account.id, displayName: identity.account.displayName };
}

export function authSession(identity: AuthenticatedIdentity, workspaces: WorkspaceSummary[]): AuthSession {
  const activeWorkspaceId = identity.activeWorkspaceId && workspaces.some((workspace) => workspace.id === identity.activeWorkspaceId)
    ? identity.activeWorkspaceId
    : undefined;
  return {
    authenticated: true,
    account: identity.account,
    onboardingComplete: identity.onboardingComplete,
    ...(activeWorkspaceId ? { activeWorkspaceId } : {}),
    workspaces,
    session: identity.session,
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(IdentityStore) private readonly identities: IdentityStore,
    @Inject(LocalStore) private readonly workspaces: LocalStore,
  ) {}

  private async enrich(identity: AuthenticatedIdentity): Promise<AuthSession> {
    return authSession(identity, await this.workspaces.listWorkspaces(identity.account.id));
  }

  @Get("session")
  async session(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<AuthSession> {
    const token = sessionToken(request);
    const current = await this.identities.session(token);
    if (!current.identity) {
      response.setHeader("Cache-Control", "private, no-store");
      return { authenticated: false, onboardingComplete: false };
    }

    let identity = current.identity;
    let summaries = await this.workspaces.listWorkspaces(identity.account.id);
    if (identity.onboardingComplete && summaries.length === 0) {
      await this.workspaces.claimLegacyWorkspace(actorFor(identity));
      summaries = await this.workspaces.listWorkspaces(identity.account.id);
    }

    if ((!identity.activeWorkspaceId || !summaries.some((workspace) => workspace.id === identity.activeWorkspaceId)) && summaries.length === 1 && token) {
      const selected = await this.identities.selectWorkspace(identity.account.id, token, summaries[0]!.id);
      identity = selected.identity;
      setSessionCredentials(response, selected.credentials);
    } else if (current.csrfToken) {
      response.setHeader("X-CSRF-Token", current.csrfToken);
      response.setHeader("Cache-Control", "private, no-store");
    }
    return authSession(identity, summaries);
  }

  @Post("register")
  async register(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<AuthSession> {
    assertTrustedOrigin(request);
    const result = await this.identities.register(registerSchema.parse(body));
    setSessionCredentials(response, result.credentials);
    return this.enrich(result.identity);
  }

  @Post("login")
  async login(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<AuthSession> {
    assertTrustedOrigin(request);
    let result = await this.identities.login(loginSchema.parse(body), clientFingerprint(request));
    let summaries = await this.workspaces.listWorkspaces(result.identity.account.id);
    if (result.identity.onboardingComplete && summaries.length === 0) {
      await this.workspaces.claimLegacyWorkspace(actorFor(result.identity));
      summaries = await this.workspaces.listWorkspaces(result.identity.account.id);
    }
    if (!result.identity.activeWorkspaceId && summaries.length === 1) {
      result = await this.identities.selectWorkspace(result.identity.account.id, result.credentials.token, summaries[0]!.id);
    }
    setSessionCredentials(response, result.credentials);
    return authSession(result.identity, summaries);
  }

  @Post("workspace")
  async selectWorkspace(@Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response): Promise<AuthSession> {
    const identity = requestIdentity(request);
    const { workspaceId } = selectWorkspaceSchema.parse(body);
    const summaries = await this.workspaces.listWorkspaces(identity.account.id);
    if (!summaries.some((workspace) => workspace.id === workspaceId)) throw new NotFoundException("Workspace not available");
    await this.workspaces.requireAuthorization(actorFor(identity), workspaceId, "workspace.read", "WORKSPACE", workspaceId);
    const token = sessionToken(request);
    if (!token) throw new NotFoundException("Workspace not available");
    const selected = await this.identities.selectWorkspace(identity.account.id, token, workspaceId);
    setSessionCredentials(response, selected.credentials);
    return authSession(selected.identity, summaries);
  }

  @Get("sessions")
  sessions(@Req() request: AuthenticatedRequest) {
    const identity = requestIdentity(request);
    return this.identities.listSessions(identity.account.id, identity.session.id);
  }

  @Delete("sessions/:id")
  async revokeSession(@Param("id") id: string, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const identity = requestIdentity(request);
    const revoked = await this.identities.revokeSession(identity.account.id, id);
    if (!revoked) throw new NotFoundException("Session not available");
    if (id === identity.session.id) clearSessionCookie(response);
    return { revoked: true };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.identities.logout(sessionToken(request));
    clearSessionCookie(response);
    return { signedOut: true };
  }
}

export type AuthenticatedRequest = Request & { authIdentity?: AuthenticatedIdentity };

export function requestIdentity(request: AuthenticatedRequest): AuthenticatedIdentity {
  if (!request.authIdentity) throw new ForbiddenException("Request could not be authorized");
  return request.authIdentity;
}
