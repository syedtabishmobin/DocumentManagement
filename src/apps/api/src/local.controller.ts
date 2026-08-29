import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Req, Res, UnprocessableEntityException, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { askQuestionSchema, canonicalCreateWorkspaceSchema, configureWorkspaceSchema, createMemberSchema, createSubjectSchema, createTaskSchema, managePersonSchema, manualDocumentSchema, type Workspace, type WorkspaceAction } from "@document-management/contracts";
import { currentWorkspaceConfiguration, LocalStore, normalizedCorrelationId, type WorkspaceActor } from "./local.store.js";
import { IdentityStore } from "./identity.store.js";
import { actorFor, requestIdentity, sessionToken, setSessionCredentials, type AuthenticatedRequest } from "./auth.controller.js";

@Controller()
export class LocalController {
  constructor(@Inject(LocalStore) private readonly store: LocalStore, @Inject(IdentityStore) private readonly identities: IdentityStore) {}

  private workspaceContext(request: AuthenticatedRequest, expectedWorkspaceId?: string): { workspaceId: string; actor: WorkspaceActor } {
    const workspaceId = request.get("x-workspace-id")?.trim();
    if (!workspaceId || request.get("x-purpose-id") !== "PUR-P1-001") throw new BadRequestException("Explicit workspace and purpose context is required");
    const identity = requestIdentity(request);
    if (workspaceId !== identity.activeWorkspaceId || (expectedWorkspaceId && expectedWorkspaceId !== workspaceId)) throw new NotFoundException("Resource not available");
    return { workspaceId, actor: actorFor(identity) };
  }

  private async authorize(request: AuthenticatedRequest, action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId?: string) {
    const context = this.workspaceContext(request);
    await this.store.requireAuthorization(context.actor, context.workspaceId, action, resourceKind, resourceId);
    return context;
  }

  private async createAndBindWorkspace(
    request: AuthenticatedRequest,
    response: Response,
    input: { name: string; type: Workspace["type"]; jurisdictionPackRef: Workspace["jurisdictionPackRef"]; residencyPolicyRef: Workspace["residencyPolicyRef"]; configurationVersion: Workspace["configurationVersion"] },
  ): Promise<Workspace> {
    const identity = requestIdentity(request);
    const token = sessionToken(request);
    if (!token) throw new BadRequestException("Sign in required");
    const purposeId = request.get("x-purpose-id")?.trim();
    if (purposeId !== "PUR-P1-001") throw new BadRequestException("Workspace creation requires an approved explicit purpose");
    const idempotencyKey = request.get("idempotency-key")?.trim();
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 200) throw new BadRequestException("A valid Idempotency-Key is required");
    const correlationId = normalizedCorrelationId(request.get("x-correlation-id"));
    response.setHeader("X-Correlation-Id", correlationId);

    const provisioned = await this.store.createWorkspace(actorFor(identity), input.name, input.type, idempotencyKey, {
      purposeId,
      correlationId,
      jurisdictionPackRef: input.jurisdictionPackRef,
      residencyPolicyRef: input.residencyPolicyRef,
      configurationVersion: input.configurationVersion,
      activation: "DEFERRED",
    });
    if (!identity.onboardingComplete || identity.activeWorkspaceId !== provisioned.id) {
      const result = await this.identities.completeOnboarding(identity.account.id, token, provisioned.id);
      const activated = await this.store.activateWorkspace(actorFor(result.identity), provisioned.id, correlationId);
      setSessionCredentials(response, result.credentials);
      response.setHeader("ETag", `\"${activated.revision}\"`);
      return activated;
    }
    const activated = await this.store.activateWorkspace(actorFor(identity), provisioned.id, correlationId);
    response.setHeader("ETag", `\"${activated.revision}\"`);
    return activated;
  }

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
  async dashboard(@Req() request: AuthenticatedRequest) {
    const { workspaceId, actor } = this.workspaceContext(request);
    for (const action of ["workspace.read", "workspace.admin", "subject.read", "document.read", "task.read", "audit.read"] as const) {
      await this.store.requireAuthorization(actor, workspaceId, action, "WORKSPACE");
    }
    return this.store.dashboard(workspaceId);
  }

  @Patch("workspace")
  async configureWorkspace(@Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const input = configureWorkspaceSchema.parse(body);
    return this.createAndBindWorkspace(request, response, { ...input, ...currentWorkspaceConfiguration() });
  }

  @Post("v1/workspaces")
  async createCanonicalWorkspace(@Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalCreateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      const correlationId = normalizedCorrelationId(request.get("x-correlation-id"));
      response.setHeader("X-Correlation-Id", correlationId);
      response.setHeader("Content-Type", "application/problem+json");
      throw new UnprocessableEntityException({
        type: "urn:doculyra:problem:invalid-workspace-request",
        title: "Workspace request could not be validated",
        status: 422,
        code: "INVALID_WORKSPACE_REQUEST",
        correlation_id: correlationId,
        retry_class: "DO_NOT_RETRY",
        violations: [],
      });
    }
    const input = parsed.data;
    const workspace = await this.createAndBindWorkspace(request, response, {
      name: input.workspace_type === "PERSONAL" ? "Personal workspace" : "Family workspace",
      type: input.workspace_type,
      jurisdictionPackRef: input.jurisdiction_pack_ref as Workspace["jurisdictionPackRef"],
      residencyPolicyRef: input.residency_policy_ref as Workspace["residencyPolicyRef"],
      configurationVersion: input.configuration_version as Workspace["configurationVersion"],
    });
    return {
      workspace_id: workspace.id,
      workspace_type: workspace.type,
      status: workspace.status,
      owner_binding_id: workspace.ownerBindingId,
      jurisdiction_pack_ref: workspace.jurisdictionPackRef,
      residency_policy_ref: workspace.residencyPolicyRef,
      configuration_version: workspace.configurationVersion,
      revision: workspace.revision,
    };
  }

  @Post("documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() body: { subjectIds?: string; captureRoute?: string; syntheticConfirmed?: string }, @Req() request: AuthenticatedRequest) {
    const { workspaceId, actor } = await this.authorize(request, "document.create", "WORKSPACE");
    if (!file) throw new BadRequestException("Choose a file to add");
    if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "synthetic-only" && body.syntheticConfirmed !== "true") {
      throw new BadRequestException("This environment accepts synthetic test documents only. Confirm the document is synthetic before adding it.");
    }
    const subjectIds = body.subjectIds ? body.subjectIds.split(",").filter(Boolean) : [];
    const captureRoute = ["FILE", "CAMERA", "BULK"].includes(body.captureRoute ?? "") ? body.captureRoute as "FILE" | "CAMERA" | "BULK" : "FILE";
    return this.store.addDocument(workspaceId, actor, file, subjectIds, captureRoute);
  }

  @Post("documents/manual")
  async manualDocument(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const { workspaceId, actor } = await this.authorize(request, "document.create", "WORKSPACE");
    if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "synthetic-only" && (body as { syntheticConfirmed?: boolean } | null)?.syntheticConfirmed !== true) {
      throw new BadRequestException("This environment accepts synthetic test records only. Confirm the record is synthetic before adding it.");
    }
    return this.store.addManualDocument(workspaceId, actor, manualDocumentSchema.parse(body));
  }

  @Get("documents/:id")
  async documentDetail(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const { workspaceId } = await this.authorize(request, "document.read", "DOCUMENT", id);
    return this.store.documentDetail(workspaceId, id);
  }

  @Get("documents/:id/artifact")
  async documentArtifact(@Param("id") id: string, @Req() request: AuthenticatedRequest, @Res() response: Response) {
    const { workspaceId } = await this.authorize(request, "document.read", "DOCUMENT", id);
    const artifact = await this.store.documentArtifact(workspaceId, id);
    response.setHeader("Content-Type", artifact.mediaType);
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(artifact.name)}`);
    response.setHeader("Cache-Control", "private, no-store");
    response.send(artifact.buffer);
  }

  @Patch("facts/:id/review")
  async reviewFact(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const { workspaceId, actor } = await this.authorize(request, "fact.review", "WORKSPACE");
    return this.store.reviewFact(workspaceId, actor, id);
  }

  @Post("subjects")
  async addSubject(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "subject.create", "WORKSPACE");
    return this.store.addSubject(context.workspaceId, context.actor, createSubjectSchema.parse(body));
  }

  @Post("people")
  async createPerson(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = managePersonSchema.parse(body);
    const context = await this.authorize(request, "subject.create", "WORKSPACE");
    if (input.loginEnabled) await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
    return this.store.createPerson(context.workspaceId, context.actor, input);
  }

  @Patch("people/:id")
  async updatePerson(@Param("id") id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = managePersonSchema.parse(body);
    const context = await this.authorize(request, "subject.edit", "SUBJECT", id);
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
    return this.store.updatePerson(context.workspaceId, context.actor, id, input);
  }

  @Delete("people/:id")
  async deletePerson(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "subject.delete", "SUBJECT", id);
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
    await this.store.deletePerson(context.workspaceId, context.actor, id);
    return { deleted: true };
  }

  @Get("connectors")
  async connectors(@Req() request: AuthenticatedRequest) {
    await this.authorize(request, "connector.read", "WORKSPACE");
    return this.store.connectorCatalogue();
  }

  @Delete("documents/:id")
  async remove(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "document.delete", "DOCUMENT", id);
    return this.store.deleteDocument(context.workspaceId, context.actor, id);
  }

  @Post("documents/:id/restore")
  async restore(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "document.edit", "DOCUMENT", id);
    return { state: "RESTORED", document: await this.store.restoreDocument(context.workspaceId, context.actor, id) };
  }

  @Post("assistant/questions")
  async ask(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = askQuestionSchema.parse(body);
    const context = await this.authorize(request, "document.read", "WORKSPACE");
    return this.store.ask(context.workspaceId, input.question, input.documentIds);
  }

  @Post("members")
  async addMember(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = createMemberSchema.parse(body);
    const context = await this.authorize(request, "workspace.admin", "WORKSPACE");
    return this.store.addMember(context.workspaceId, context.actor, input.displayName, input.role);
  }

  @Post("tasks")
  async addTask(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = createTaskSchema.parse(body);
    const context = await this.authorize(request, "task.create", "WORKSPACE");
    return this.store.addTask(context.workspaceId, context.actor, input);
  }

  @Patch("tasks/:id/complete")
  async completeTask(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "task.edit", "TASK", id);
    return this.store.completeTask(context.workspaceId, context.actor, id);
  }

  @Get("exports/current")
  async exportWorkspace(@Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "export.create", "WORKSPACE");
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
    return this.store.exportWorkspace(context.workspaceId);
  }

  @Post("workspaces/:workspaceId/recovery-cases")
  async recoveryUnavailable(@Param("workspaceId") expectedWorkspaceId: string, @Req() request: AuthenticatedRequest) {
    const context = this.workspaceContext(request, expectedWorkspaceId);
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.read", "WORKSPACE", context.workspaceId);
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE", context.workspaceId);
    return this.store.recordRecoveryBlocked(context.workspaceId, context.actor);
  }
}
