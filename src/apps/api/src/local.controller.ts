import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { askQuestionSchema, configureWorkspaceSchema, createMemberSchema, createSubjectSchema, createTaskSchema, managePersonSchema, manualDocumentSchema } from "@document-management/contracts";
import { LocalStore } from "./local.store.js";
import { IdentityStore } from "./identity.store.js";
import { sessionToken } from "./auth.controller.js";

@Controller()
export class LocalController {
  constructor(@Inject(LocalStore) private readonly store: LocalStore, @Inject(IdentityStore) private readonly identities: IdentityStore) {}

  @Get("health")
  health() {
    return {
      status: "ok",
      profile: process.env.DM_PROFILE ?? "local",
      customerDataPolicy: process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only",
      outboundNetwork: (process.env.DM_OUTBOUND_NETWORK ?? "deny") === "deny" ? "denied" : "configured",
      externalAI: false,
      externalConnectors: false,
    };
  }

  @Get("dashboard")
  async dashboard(@Req() request: Request) {
    await this.identities.requireSession(sessionToken(request));
    return this.store.dashboard();
  }

  @Patch("workspace")
  async configureWorkspace(@Body() body: unknown, @Req() request: Request) {
    const input = configureWorkspaceSchema.parse(body);
    const session = await this.identities.requireSession(sessionToken(request));
    const workspace = await this.store.configureWorkspace(input.name, input.type, session.account.displayName);
    await this.identities.completeOnboarding(session.account.id);
    return workspace;
  }

  @Post("documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() body: { subjectIds?: string; captureRoute?: string; syntheticConfirmed?: string }) {
    if (!file) throw new BadRequestException("Choose a file to add");
    if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "synthetic-only" && body.syntheticConfirmed !== "true") {
      throw new BadRequestException("This environment accepts synthetic test documents only. Confirm the document is synthetic before adding it.");
    }
    const subjectIds = body.subjectIds ? body.subjectIds.split(",").filter(Boolean) : [];
    const captureRoute = ["FILE", "CAMERA", "BULK"].includes(body.captureRoute ?? "") ? body.captureRoute as "FILE" | "CAMERA" | "BULK" : "FILE";
    return this.store.addDocument(file, subjectIds, captureRoute);
  }

  @Post("documents/manual")
  manualDocument(@Body() body: unknown) {
    if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "synthetic-only" && (body as { syntheticConfirmed?: boolean } | null)?.syntheticConfirmed !== true) {
      throw new BadRequestException("This environment accepts synthetic test records only. Confirm the record is synthetic before adding it.");
    }
    return this.store.addManualDocument(manualDocumentSchema.parse(body));
  }

  @Get("documents/:id")
  async documentDetail(@Param("id") id: string, @Req() request: Request) {
    await this.identities.requireSession(sessionToken(request));
    return this.store.documentDetail(id);
  }

  @Get("documents/:id/artifact")
  async documentArtifact(@Param("id") id: string, @Req() request: Request, @Res() response: Response) {
    await this.identities.requireSession(sessionToken(request));
    const artifact = await this.store.documentArtifact(id);
    response.setHeader("Content-Type", artifact.mediaType);
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(artifact.name)}`);
    response.setHeader("Cache-Control", "private, no-store");
    response.send(artifact.buffer);
  }

  @Patch("facts/:id/review")
  async reviewFact(@Param("id") id: string, @Req() request: Request) {
    await this.identities.requireSession(sessionToken(request));
    return this.store.reviewFact(id);
  }

  @Post("subjects")
  addSubject(@Body() body: unknown) { return this.store.addSubject(createSubjectSchema.parse(body)); }

  @Post("people")
  createPerson(@Body() body: unknown) { return this.store.createPerson(managePersonSchema.parse(body)); }

  @Patch("people/:id")
  updatePerson(@Param("id") id: string, @Body() body: unknown) { return this.store.updatePerson(id, managePersonSchema.parse(body)); }

  @Delete("people/:id")
  async deletePerson(@Param("id") id: string) { await this.store.deletePerson(id); return { deleted: true }; }

  @Get("connectors")
  connectors() { return this.store.connectorCatalogue(); }

  @Delete("documents/:id")
  async remove(@Param("id") id: string, @Req() request: Request) {
    await this.identities.requireSession(sessionToken(request));
    return this.store.deleteDocument(id);
  }

  @Post("documents/:id/restore")
  async restore(@Param("id") id: string, @Req() request: Request) {
    await this.identities.requireSession(sessionToken(request));
    return { state: "RESTORED", document: await this.store.restoreDocument(id) };
  }

  @Post("assistant/questions")
  ask(@Body() body: unknown) { const input = askQuestionSchema.parse(body); return this.store.ask(input.question, input.documentIds); }

  @Post("members")
  addMember(@Body() body: unknown) { const input = createMemberSchema.parse(body); return this.store.addMember(input.displayName, input.role); }

  @Post("tasks")
  addTask(@Body() body: unknown) { const input = createTaskSchema.parse(body); return this.store.addTask(input); }

  @Patch("tasks/:id/complete")
  completeTask(@Param("id") id: string) { return this.store.completeTask(id); }

  @Get("exports/current")
  exportWorkspace() { return this.store.exportWorkspace(); }
}
