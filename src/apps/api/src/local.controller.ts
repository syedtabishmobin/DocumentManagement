import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Inject, NotFoundException, Param, Patch, Post, PreconditionFailedException, Query, Req, Res, UnprocessableEntityException, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createHash } from "node:crypto";
import type { Response } from "express";
import { askQuestionSchema, canonicalCreateAccessGrantSchema, canonicalCreateSubjectSchema, canonicalCreateWorkspaceSchema, canonicalInviteMembershipSchema, canonicalReasonCommandSchema, canonicalUpdateMembershipSchema, canonicalUpdateSubjectSchema, configureWorkspaceSchema, createMemberSchema, createSubjectSchema, createTaskSchema, managePersonSchema, manualDocumentSchema, type AccessGrant, type Member, type SubjectRecord, type Workspace, type WorkspaceAction } from "@document-management/contracts";
import { currentWorkspaceConfiguration, LocalStore, normalizedCorrelationId, type WorkspaceActor } from "./local.store.js";
import { IdentityStore } from "./identity.store.js";
import { actorFor, requestIdentity, sessionToken, setSessionCredentials, type AuthenticatedRequest } from "./auth.controller.js";

@Controller()
export class LocalController {
  private readonly requestCorrelations = new WeakMap<object, string>();
  constructor(@Inject(LocalStore) private readonly store: LocalStore, @Inject(IdentityStore) private readonly identities: IdentityStore) {}

  private requestCorrelation(request: AuthenticatedRequest): string {
    let correlationId = this.requestCorrelations.get(request);
    if (!correlationId) {
      correlationId = normalizedCorrelationId(request.get("x-correlation-id"));
      this.requestCorrelations.set(request, correlationId);
    }
    return correlationId;
  }

  private correlation(request: AuthenticatedRequest, response: Response): string {
    const correlationId = this.requestCorrelation(request);
    response.setHeader("X-Correlation-Id", correlationId);
    return correlationId;
  }

  private workspaceContext(request: AuthenticatedRequest, expectedWorkspaceId?: string): { workspaceId: string; actor: WorkspaceActor } {
    const workspaceId = request.get("x-workspace-id")?.trim();
    if (!workspaceId || request.get("x-purpose-id") !== "PUR-P1-001") throw new BadRequestException("Explicit workspace and purpose context is required");
    const identity = requestIdentity(request);
    if (workspaceId !== identity.activeWorkspaceId || (expectedWorkspaceId && expectedWorkspaceId !== workspaceId)) throw new NotFoundException("Resource not available");
    return { workspaceId, actor: actorFor(identity) };
  }

  private async authorize(request: AuthenticatedRequest, action: WorkspaceAction, resourceKind: "WORKSPACE" | "DOCUMENT" | "SUBJECT" | "TASK", resourceId?: string) {
    const context = this.workspaceContext(request);
    const fence = await this.store.startAuthorization(context.actor, context.workspaceId, action, resourceKind, resourceId, { correlationId: this.requestCorrelation(request) });
    return { ...context, fence };
  }

  private problem(request: AuthenticatedRequest, response: Response, status: number, code: string, title: string, retryClass: "DO_NOT_RETRY" | "REFRESH_REQUIRED"): never {
    const correlationId = this.correlation(request, response);
    response.setHeader("Content-Type", "application/problem+json");
    throw new HttpException({
      type: `urn:doculyra:problem:${code.toLowerCase().replaceAll("_", "-")}`,
      title, status, code, correlation_id: correlationId, retry_class: retryClass, violations: [],
    }, status);
  }

  private expectedRevision(request: AuthenticatedRequest, response: Response): number {
    const value = request.get("if-match")?.trim();
    const match = value?.match(/^"?([1-9][0-9]*)"?$/);
    if (!match) this.problem(request, response, HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "A current resource revision is required", "REFRESH_REQUIRED");
    return Number(match[1]);
  }

  private idempotencyKey(request: AuthenticatedRequest, response: Response): string {
    const value = request.get("idempotency-key")?.trim();
    if (!value || value.length < 16 || value.length > 200) this.problem(request, response, HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_REQUIRED", "A valid Idempotency-Key is required", "DO_NOT_RETRY");
    return value;
  }

  private subjectView(subject: SubjectRecord) {
    return { subject_id: subject.id, workspace_id: subject.workspaceId, subject_kind: "PERSON", status: subject.status, identity_link_state: "NONE", revision: subject.revision };
  }

  private membershipView(member: Member) {
    return { membership_id: member.id, workspace_id: member.workspaceId, ...(member.identityId ? { identity_id: member.identityId } : {}), ...(member.audienceRef ? { audience_ref: member.audienceRef } : {}), participation_class: member.role, status: member.invitationState === "PENDING" ? "PENDING" : member.state, role_assignment_refs: [], revision: member.revision };
  }

  private grantView(grant: AccessGrant) {
    return {
      grant_id: grant.id, workspace_id: grant.workspaceId, grantor_ref: grant.grantorIdentityId, grantee_ref: grant.granteeIdentityId,
      purpose_id: grant.purposeId,
      scope: { resource_refs: grant.resourceIds, field_refs: grant.fieldRefs, edge_refs: grant.edgeRefs, actions: grant.actions, allow_export: grant.exportAllowed, allow_onward_delegation: grant.onwardDelegation },
      valid_from: grant.startsAt, valid_to: grant.expiresAt ?? null, status: grant.state, policy_version: grant.policyVersion, revision: grant.revision,
    };
  }

  private collection(items: Array<Record<string, unknown>>, kind: "subjects" | "memberships" | "grants", workspaceId: string, actorId: string, authority: { policyEpoch: number; grantEquivalence: string; sourceWatermark: string }, pageSizeValue: string | undefined, pageAfter: string | undefined, request: AuthenticatedRequest, response: Response) {
    const pageSize = pageSizeValue === undefined ? 50 : Number(pageSizeValue);
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PAGINATION", "Pagination parameters could not be validated", "DO_NOT_RETRY");
    if (pageAfter !== undefined && (pageAfter.length < 1 || pageAfter.length > 512)) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PAGINATION", "Pagination parameters could not be validated", "DO_NOT_RETRY");
    const idKey = kind === "subjects" ? "subject_id" : kind === "memberships" ? "membership_id" : "grant_id";
    const ordered = [...items].sort((left, right) => String(left[idKey]).localeCompare(String(right[idKey])));
    const snapshot = createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
    const cursor = (offset: number) => createHash("sha256").update(JSON.stringify({ kind, workspaceId, actorId, purposeId: "PUR-P1-001", snapshot, policyEpoch: authority.policyEpoch, grantEquivalence: authority.grantEquivalence, offset })).digest("base64url");
    let start = 0;
    if (pageAfter !== undefined) {
      start = Array.from({ length: ordered.length }, (_, index) => index + 1).find((offset) => cursor(offset) === pageAfter) ?? -1;
      if (start < 0) this.problem(request, response, HttpStatus.BAD_REQUEST, "INVALID_PAGE_CURSOR", "The page cursor is unavailable", "REFRESH_REQUIRED");
    }
    const end = Math.min(start + pageSize, ordered.length);
    const hasMore = end < ordered.length;
    return { items: ordered.slice(start, end), page: { next_page_after: hasMore ? cursor(end) : null, has_more: hasMore, snapshot_ref: `snapshot:${snapshot}` }, coverage: { state: "COMPLETE_AUTHORIZED_VIEW", projection_generation: "authority-v1", source_watermark: authority.sourceWatermark, policy_epoch: `epoch:${authority.policyEpoch}`, deletion_fence_watermark: "current", limitations: [] } };
  }

  private canonicalProblem(error: unknown, request: AuthenticatedRequest, response: Response): never {
    if (error instanceof PreconditionFailedException) this.problem(request, response, HttpStatus.PRECONDITION_FAILED, "PRECONDITION_FAILED", "The resource changed", "REFRESH_REQUIRED");
    if (error instanceof NotFoundException) this.problem(request, response, HttpStatus.NOT_FOUND, "RESOURCE_NOT_AVAILABLE", "Resource not available", "DO_NOT_RETRY");
    if (error instanceof ConflictException) this.problem(request, response, HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", "The command key conflicts with an earlier request", "DO_NOT_RETRY");
    if (error instanceof UnprocessableEntityException) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_GRANT_REQUEST", "Grant request could not be applied", "DO_NOT_RETRY");
    throw error;
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
    const correlationId = this.requestCorrelation(request);
    const containerFence = await this.store.startAuthorization(actor, workspaceId, "workspace.read", "WORKSPACE", workspaceId, { correlationId });
    return this.store.authorizedDashboard(workspaceId, actor, containerFence, correlationId);
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
    const { workspaceId, actor, fence } = await this.authorize(request, "document.create", "WORKSPACE");
    if (!file) throw new BadRequestException("Choose a file to add");
    if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "synthetic-only" && body.syntheticConfirmed !== "true") {
      throw new BadRequestException("This environment accepts synthetic test documents only. Confirm the document is synthetic before adding it.");
    }
    const subjectIds = body.subjectIds ? body.subjectIds.split(",").filter(Boolean) : [];
    const captureRoute = ["FILE", "CAMERA", "BULK"].includes(body.captureRoute ?? "") ? body.captureRoute as "FILE" | "CAMERA" | "BULK" : "FILE";
    return this.store.addDocument(workspaceId, actor, file, subjectIds, captureRoute, fence, this.requestCorrelation(request));
  }

  @Post("documents/manual")
  async manualDocument(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const { workspaceId, actor, fence } = await this.authorize(request, "document.create", "WORKSPACE");
    if ((process.env.DM_CUSTOMER_DATA_POLICY ?? "synthetic-only") === "synthetic-only" && (body as { syntheticConfirmed?: boolean } | null)?.syntheticConfirmed !== true) {
      throw new BadRequestException("This environment accepts synthetic test records only. Confirm the record is synthetic before adding it.");
    }
    return this.store.addManualDocument(workspaceId, actor, manualDocumentSchema.parse(body), fence, this.requestCorrelation(request));
  }

  @Get("documents/:id")
  async documentDetail(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const { workspaceId, actor, fence } = await this.authorize(request, "document.read", "DOCUMENT", id);
    return this.store.documentDetail(workspaceId, id, actor, fence, this.requestCorrelation(request));
  }

  @Get("documents/:id/artifact")
  async documentArtifact(@Param("id") id: string, @Req() request: AuthenticatedRequest, @Res() response: Response) {
    const { workspaceId, actor, fence } = await this.authorize(request, "document.read", "DOCUMENT", id);
    const artifact = await this.store.documentArtifact(workspaceId, id, actor, fence, this.requestCorrelation(request));
    response.setHeader("Content-Type", artifact.mediaType);
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(artifact.name)}`);
    response.setHeader("Cache-Control", "private, no-store");
    response.send(artifact.buffer);
  }

  @Patch("facts/:id/review")
  async reviewFact(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const { workspaceId, actor, fence } = await this.authorize(request, "fact.review", "WORKSPACE");
    return this.store.reviewFact(workspaceId, actor, id, fence, this.requestCorrelation(request));
  }

  @Get("v1/workspaces/:workspaceId/subjects")
  async canonicalSubjects(@Param("workspaceId") workspaceId: string, @Query("page_size") pageSize: string | undefined, @Query("page_after") pageAfter: string | undefined, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = this.workspaceContext(request, workspaceId);
      await this.store.requireAuthorization(context.actor, workspaceId, "subject.read", "WORKSPACE");
      this.correlation(request, response);
      const collection = await this.store.subjectCollection(workspaceId, context.actor.identityId);
      const items = collection.items.map((subject) => this.subjectView(subject));
      response.setHeader("ETag", `\"subjects-${items.map((item) => item.revision).join("-")}\"`);
      return this.collection(items, "subjects", workspaceId, context.actor.identityId, collection, pageSize, pageAfter, request, response);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Post("v1/workspaces/:workspaceId/subjects")
  async canonicalCreateSubject(@Param("workspaceId") workspaceId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalCreateSubjectSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_SUBJECT_REQUEST", "Subject request could not be validated", "DO_NOT_RETRY");
    try {
      const context = this.workspaceContext(request, workspaceId);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "subject.create", "WORKSPACE", undefined, { correlationId: this.requestCorrelation(request) });
      await this.store.requireAuthorization(context.actor, workspaceId, "workspace.admin", "WORKSPACE");
      const subject = await this.store.createCanonicalSubject(workspaceId, context.actor, this.expectedRevision(request, response), this.idempotencyKey(request, response), parsed.data, fence, this.correlation(request, response));
      response.setHeader("ETag", `\"${subject.revision}\"`);
      return this.subjectView(subject);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Get("v1/workspaces/:workspaceId/subjects/:subjectId")
  async canonicalSubject(@Param("workspaceId") workspaceId: string, @Param("subjectId") subjectId: string, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = this.workspaceContext(request, workspaceId);
      await this.store.requireAuthorization(context.actor, workspaceId, "subject.read", "SUBJECT", subjectId);
      const subject = await this.store.getSubject(workspaceId, subjectId);
      this.correlation(request, response); response.setHeader("ETag", `\"${subject.revision}\"`);
      return this.subjectView(subject);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Patch("v1/workspaces/:workspaceId/subjects/:subjectId")
  async canonicalUpdateSubject(@Param("workspaceId") workspaceId: string, @Param("subjectId") subjectId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalUpdateSubjectSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_SUBJECT_REQUEST", "Subject request could not be validated", "DO_NOT_RETRY");
    try {
      const context = this.workspaceContext(request, workspaceId);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "subject.edit", "WORKSPACE", undefined, { correlationId: this.requestCorrelation(request) });
      await this.store.requireAuthorization(context.actor, workspaceId, "workspace.admin", "WORKSPACE");
      const subject = await this.store.proposeCanonicalSubjectChange(workspaceId, context.actor, subjectId, this.expectedRevision(request, response), this.idempotencyKey(request, response), parsed.data, fence, this.correlation(request, response));
      response.setHeader("ETag", `\"${subject.revision}\"`); return this.subjectView(subject);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Get("v1/workspaces/:workspaceId/memberships")
  async canonicalMemberships(@Param("workspaceId") workspaceId: string, @Query("page_size") pageSize: string | undefined, @Query("page_after") pageAfter: string | undefined, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = this.workspaceContext(request, workspaceId);
      await this.store.requireAuthorization(context.actor, workspaceId, "workspace.admin", "WORKSPACE");
      this.correlation(request, response);
      const collection = await this.store.membershipCollection(workspaceId, context.actor.identityId);
      const items = collection.items.map((member) => this.membershipView(member));
      response.setHeader("ETag", `\"memberships-${items.map((item) => item.revision).join("-")}\"`);
      return this.collection(items, "memberships", workspaceId, context.actor.identityId, collection, pageSize, pageAfter, request, response);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Post("v1/workspaces/:workspaceId/memberships")
  async canonicalInviteMembership(@Param("workspaceId") workspaceId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalInviteMembershipSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_MEMBERSHIP_REQUEST", "Membership request could not be validated", "DO_NOT_RETRY");
    try {
      const context = this.workspaceContext(request, workspaceId);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "workspace.admin", "WORKSPACE", undefined, { correlationId: this.requestCorrelation(request) });
      const membership = await this.store.inviteCanonicalMembership(workspaceId, context.actor, this.expectedRevision(request, response), this.idempotencyKey(request, response), parsed.data, fence, this.correlation(request, response));
      response.setHeader("ETag", `\"${membership.revision}\"`); return this.membershipView(membership);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Get("v1/workspaces/:workspaceId/memberships/:membershipId")
  async canonicalMembership(@Param("workspaceId") workspaceId: string, @Param("membershipId") membershipId: string, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = this.workspaceContext(request, workspaceId);
      await this.store.requireAuthorization(context.actor, workspaceId, "workspace.admin", "WORKSPACE");
      const membership = await this.store.getMembership(workspaceId, membershipId);
      this.correlation(request, response); response.setHeader("ETag", `\"${membership.revision}\"`); return this.membershipView(membership);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Patch("v1/workspaces/:workspaceId/memberships/:membershipId")
  async canonicalUpdateMembership(@Param("workspaceId") workspaceId: string, @Param("membershipId") membershipId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalUpdateMembershipSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_MEMBERSHIP_REQUEST", "Membership request could not be validated", "DO_NOT_RETRY");
    try {
      const context = this.workspaceContext(request, workspaceId);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "workspace.admin", "WORKSPACE", undefined, { correlationId: this.requestCorrelation(request) });
      const membership = await this.store.transitionCanonicalMembership(workspaceId, context.actor, membershipId, this.expectedRevision(request, response), this.idempotencyKey(request, response), parsed.data, fence, this.correlation(request, response));
      response.setHeader("ETag", `\"${membership.revision}\"`); return this.membershipView(membership);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Get("v1/workspaces/:workspaceId/access-grants")
  async canonicalAccessGrants(@Param("workspaceId") workspaceId: string, @Query("page_size") pageSize: string | undefined, @Query("page_after") pageAfter: string | undefined, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = this.workspaceContext(request, workspaceId); const correlationId = this.correlation(request, response);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "grant.read", "WORKSPACE", workspaceId, { correlationId });
      const collection = await this.store.accessGrantCollection(workspaceId, context.actor.identityId);
      await this.store.reauthorize(fence, context.actor, "OUTPUT", correlationId);
      const items = collection.items.map((grant) => this.grantView(grant));
      response.setHeader("ETag", `"grants-${items.map((item) => item.revision).join("-")}"`);
      return this.collection(items, "grants", workspaceId, context.actor.identityId, collection, pageSize, pageAfter, request, response);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Post("v1/workspaces/:workspaceId/access-grants")
  async canonicalCreateAccessGrant(@Param("workspaceId") workspaceId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalCreateAccessGrantSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_GRANT_REQUEST", "Grant request could not be validated", "DO_NOT_RETRY");
    try {
      const context = this.workspaceContext(request, workspaceId); const correlationId = this.correlation(request, response);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "grant.create", "WORKSPACE", workspaceId, { correlationId });
      const grant = await this.store.createAccessGrant(workspaceId, context.actor, this.idempotencyKey(request, response), parsed.data, fence, correlationId);
      response.setHeader("ETag", `"${grant.revision}"`); return this.grantView(grant);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Get("v1/workspaces/:workspaceId/access-grants/:grantId")
  async canonicalAccessGrant(@Param("workspaceId") workspaceId: string, @Param("grantId") grantId: string, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = this.workspaceContext(request, workspaceId); const correlationId = this.correlation(request, response);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "grant.read", "WORKSPACE", workspaceId, { correlationId });
      const grant = await this.store.getAccessGrant(workspaceId, grantId, context.actor.identityId);
      await this.store.reauthorize(fence, context.actor, "OUTPUT", correlationId);
      response.setHeader("ETag", `"${grant.revision}"`); return this.grantView(grant);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Post("v1/workspaces/:workspaceId/access-grants/:grantId/revocations")
  @HttpCode(HttpStatus.OK)
  async canonicalRevokeAccessGrant(@Param("workspaceId") workspaceId: string, @Param("grantId") grantId: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = canonicalReasonCommandSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_REASON_COMMAND", "Reason command could not be validated", "DO_NOT_RETRY");
    try {
      const context = this.workspaceContext(request, workspaceId); const correlationId = this.correlation(request, response);
      const fence = await this.store.startAuthorization(context.actor, workspaceId, "grant.revoke", "WORKSPACE", workspaceId, { correlationId });
      const grant = await this.store.revokeAccessGrant(workspaceId, context.actor, grantId, this.expectedRevision(request, response), this.idempotencyKey(request, response), parsed.data.reason_code, fence, correlationId);
      response.setHeader("ETag", `"${grant.revision}"`); return this.grantView(grant);
    } catch (error) { this.canonicalProblem(error, request, response); }
  }

  @Post("subjects")
  async addSubject(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "subject.create", "WORKSPACE");
    return this.store.addSubject(context.workspaceId, context.actor, createSubjectSchema.parse(body), context.fence, this.requestCorrelation(request));
  }

  @Post("people")
  async createPerson(@Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = managePersonSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PERSON_REQUEST", "Person request could not be validated", "DO_NOT_RETRY");
    const input = parsed.data;
    const context = await this.authorize(request, "subject.create", "WORKSPACE");
    if (input.loginEnabled) await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
    const subject = await this.store.createPerson(context.workspaceId, context.actor, input, context.fence, this.correlation(request, response));
    response.setHeader("ETag", `\"${subject.revision}\"`);
    return subject;
  }

  @Patch("people/:id")
  async updatePerson(@Param("id") id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const parsed = managePersonSchema.safeParse(body);
    if (!parsed.success) this.problem(request, response, HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PERSON_REQUEST", "Person request could not be validated", "DO_NOT_RETRY");
    const input = parsed.data;
    try {
      const context = await this.authorize(request, "subject.edit", "WORKSPACE");
      await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
      const subject = await this.store.updatePerson(context.workspaceId, context.actor, id, this.expectedRevision(request, response), input, context.fence, this.correlation(request, response));
      response.setHeader("ETag", `\"${subject.revision}\"`);
      return subject;
    } catch (error) {
      if (error instanceof PreconditionFailedException) this.problem(request, response, HttpStatus.PRECONDITION_FAILED, "PRECONDITION_FAILED", "The resource changed", "REFRESH_REQUIRED");
      if (error instanceof NotFoundException) this.problem(request, response, HttpStatus.NOT_FOUND, "RESOURCE_NOT_AVAILABLE", "Resource not available", "DO_NOT_RETRY");
      throw error;
    }
  }

  @Delete("people/:id")
  async deletePerson(@Param("id") id: string, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      const context = await this.authorize(request, "subject.delete", "WORKSPACE");
      await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
      await this.store.deletePerson(context.workspaceId, context.actor, id, this.expectedRevision(request, response), context.fence, this.correlation(request, response));
      return { deleted: true };
    } catch (error) {
      if (error instanceof PreconditionFailedException) this.problem(request, response, HttpStatus.PRECONDITION_FAILED, "PRECONDITION_FAILED", "The resource changed", "REFRESH_REQUIRED");
      if (error instanceof NotFoundException) this.problem(request, response, HttpStatus.NOT_FOUND, "RESOURCE_NOT_AVAILABLE", "Resource not available", "DO_NOT_RETRY");
      throw error;
    }
  }

  @Get("connectors")
  async connectors(@Req() request: AuthenticatedRequest) {
    await this.authorize(request, "connector.read", "WORKSPACE");
    return this.store.connectorCatalogue();
  }

  @Delete("documents/:id")
  async remove(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "document.delete", "DOCUMENT", id);
    return this.store.deleteDocument(context.workspaceId, context.actor, id, context.fence, this.requestCorrelation(request));
  }

  @Post("documents/:id/restore")
  async restore(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "document.edit", "DOCUMENT", id);
    return { state: "RESTORED", document: await this.store.restoreDocument(context.workspaceId, context.actor, id, context.fence, this.requestCorrelation(request)) };
  }

  @Post("assistant/questions")
  async ask(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = askQuestionSchema.parse(body);
    const context = await this.authorize(request, "document.read", "WORKSPACE");
    return this.store.ask(context.workspaceId, context.actor, context.fence, input.question, input.documentIds, this.requestCorrelation(request));
  }

  @Post("members")
  async addMember(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = createMemberSchema.parse(body);
    const context = await this.authorize(request, "workspace.admin", "WORKSPACE");
    return this.store.addMember(context.workspaceId, context.actor, input.displayName, input.role, context.fence, this.requestCorrelation(request));
  }

  @Post("tasks")
  async addTask(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = createTaskSchema.parse(body);
    const context = await this.authorize(request, "task.create", "WORKSPACE");
    return this.store.addTask(context.workspaceId, context.actor, input, context.fence, this.requestCorrelation(request));
  }

  @Patch("tasks/:id/complete")
  async completeTask(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "task.edit", "TASK", id);
    return this.store.completeTask(context.workspaceId, context.actor, id, context.fence, this.requestCorrelation(request));
  }

  @Get("exports/current")
  async exportWorkspace(@Req() request: AuthenticatedRequest) {
    const context = await this.authorize(request, "export.create", "WORKSPACE");
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE");
    return this.store.exportWorkspace(context.workspaceId, context.actor, context.fence, this.requestCorrelation(request));
  }

  @Post("workspaces/:workspaceId/recovery-cases")
  async recoveryUnavailable(@Param("workspaceId") expectedWorkspaceId: string, @Req() request: AuthenticatedRequest) {
    const context = this.workspaceContext(request, expectedWorkspaceId);
    const fence = await this.store.startAuthorization(context.actor, context.workspaceId, "workspace.read", "WORKSPACE", context.workspaceId, { correlationId: this.requestCorrelation(request) });
    await this.store.requireAuthorization(context.actor, context.workspaceId, "workspace.admin", "WORKSPACE", context.workspaceId);
    return this.store.recordRecoveryBlocked(context.workspaceId, context.actor, fence, this.requestCorrelation(request));
  }
}
