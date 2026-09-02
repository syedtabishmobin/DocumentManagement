import { BadRequestException, Controller, Get, Inject, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { externalIdentityCallbackSchema, externalIdentityStartSchema } from "@document-management/contracts";
import { assertTrustedOrigin, clientFingerprint, setSessionCredentials } from "./auth.controller.js";
import { ExternalIdentityService } from "./external-identity.service.js";

@Controller("auth/external")
export class ExternalIdentityController {
  private redirectUrl(returnPath: string, outcome: "success" | "cancelled" | "failed", reason?: "invalid" | "unavailable"): string {
    const configuredOrigin = process.env.DM_PUBLIC_BASE_URL ?? process.env.DM_WEB_ORIGIN?.split(",")[0]?.trim();
    let origin: URL;
    try {
      origin = new URL(configuredOrigin ?? "http://127.0.0.1:4173");
      if (origin.protocol !== "https:" && !(process.env.NODE_ENV === "test" || (process.env.DM_PROFILE ?? "local") === "local")) throw new Error();
    } catch { throw new BadRequestException("External sign-in response could not be completed"); }
    const target = new URL(returnPath, origin.origin);
    if (target.origin !== origin.origin) throw new BadRequestException("External sign-in response could not be completed");
    target.searchParams.set("external_auth", outcome);
    if (reason) target.searchParams.set("reason", reason);
    return target.toString();
  }

  constructor(@Inject(ExternalIdentityService) private readonly externalIdentity: ExternalIdentityService) {}

  @Get("providers")
  async availability(@Res({ passthrough: true }) response: Response) {
    response.setHeader("Cache-Control", "private, no-store");
    return this.externalIdentity.availability();
  }

  @Get("start")
  async start(@Query() query: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    assertTrustedOrigin(request);
    const parsed = externalIdentityStartSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException("External sign-in request could not be validated");
    response.setHeader("Cache-Control", "private, no-store");
    return this.externalIdentity.start(parsed.data.provider, parsed.data.returnPath, clientFingerprint(request));
  }

  @Get("callback")
  async callback(@Query() query: unknown, @Req() request: Request, @Res() response: Response): Promise<void> {
    const parsed = externalIdentityCallbackSchema.safeParse(query);
    if (!parsed.success) { response.redirect(303, this.redirectUrl("/app", "failed", "invalid")); return; }
    try {
      const completed = await this.externalIdentity.callback(parsed.data, clientFingerprint(request));
      if (completed.outcome === "SUCCESS") {
        setSessionCredentials(response, completed.result.credentials);
        response.redirect(303, this.redirectUrl(completed.returnPath, "success"));
        return;
      }
      response.redirect(303, this.redirectUrl(completed.returnPath, completed.outcome === "CANCELLED" ? "cancelled" : "failed", completed.reason === "cancelled" ? undefined : completed.reason));
    } catch {
      response.redirect(303, this.redirectUrl("/app", "failed", "invalid"));
    }
  }
}
