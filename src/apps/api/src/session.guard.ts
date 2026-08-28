import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { IdentityStore } from "./identity.store.js";
import { sessionToken } from "./auth.controller.js";

const publicPaths = new Set(["/api/health", "/api/auth/session", "/api/auth/register", "/api/auth/login", "/api/auth/logout"]);

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(IdentityStore) private readonly identities: IdentityStore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (publicPaths.has(request.path)) return true;
    await this.identities.requireSession(sessionToken(request));
    return true;
  }
}
