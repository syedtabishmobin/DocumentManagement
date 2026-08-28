import { Body, Controller, Get, Inject, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "@document-management/contracts";
import { IdentityStore } from "./identity.store.js";

export function sessionToken(request: Request): string | undefined {
  const raw = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("dm_session="));
  return raw ? decodeURIComponent(raw.slice("dm_session=".length)) : undefined;
}

function setSessionCookie(response: Response, token: string): void {
  response.setHeader("set-cookie", `dm_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
}

@Controller("auth")
export class AuthController {
  constructor(@Inject(IdentityStore) private readonly identities: IdentityStore) {}

  @Get("session")
  session(@Req() request: Request) { return this.identities.session(sessionToken(request)); }

  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.identities.register(registerSchema.parse(body));
    setSessionCookie(response, result.token);
    return result.session;
  }

  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.identities.login(loginSchema.parse(body));
    setSessionCookie(response, result.token);
    return result.session;
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.identities.logout(sessionToken(request));
    response.setHeader("set-cookie", "dm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    return { signedOut: true };
  }
}
