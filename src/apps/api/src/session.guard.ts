import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { IdentityStore } from "./identity.store.js";
import { assertTrustedOrigin, sessionToken, type AuthenticatedRequest } from "./auth.controller.js";

const publicPaths = new Set(["/api/health", "/api/auth/session", "/api/auth/register", "/api/auth/login", "/api/auth/external/providers", "/api/auth/external/start", "/api/auth/external/callback"]);
const unsafeMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(IdentityStore) private readonly identities: IdentityStore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const unsafe = unsafeMethods.has(request.method.toUpperCase());
    if (unsafe) assertTrustedOrigin(request);
    if (publicPaths.has(request.path)) return true;
    const identity = await this.identities.requireSession(sessionToken(request), request.get("x-csrf-token"), unsafe);
    (request as AuthenticatedRequest).authIdentity = identity;
    context.switchToHttp().getResponse<Response>().setHeader("Cache-Control", "private, no-store");
    return true;
  }
}
