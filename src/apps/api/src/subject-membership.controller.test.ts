import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { NestFactory } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";

describe("managed dependant subject HTTP boundary", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "doculyra-subject-controller-"));
    process.env.DM_DATA_DIR = directory;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true });
    delete process.env.DM_DATA_DIR;
  });

  it("creates no fabricated participation and enforces revision and workspace disclosure fences", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    await app.listen(0, "127.0.0.1");
    try {
      const port = (app.getHttpServer().address() as AddressInfo).port;
      const base = `http://127.0.0.1:${port}/api`;
      const origin = "http://localhost:4173";
      const registration = await fetch(`${base}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ displayName: "Subject Synthetic Owner", email: "subject-owner@example.test", password: "synthetic-password" }),
      });
      const firstCookie = registration.headers.get("set-cookie")!.split(";")[0]!;
      const firstCsrf = registration.headers.get("x-csrf-token")!;
      const workspaceResponse = await fetch(`${base}/workspace`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: firstCookie, "X-CSRF-Token": firstCsrf, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": "corr-subject-workspace", "Idempotency-Key": "subject-workspace-create-0001" },
        body: JSON.stringify({ name: "Subject synthetic household", type: "FAMILY" }),
      });
      expect(workspaceResponse.status).toBe(200);
      const workspace = await workspaceResponse.json() as { id: string };
      const cookie = workspaceResponse.headers.get("set-cookie")!.split(";")[0]!;
      const csrf = workspaceResponse.headers.get("x-csrf-token")!;
      const commandHeaders = (idempotencyKey: string, revision?: number): Record<string, string> => ({
        "Content-Type": "application/json", Origin: origin, Cookie: cookie, "X-CSRF-Token": csrf,
        "X-Workspace-Id": workspace.id, "X-Purpose-Id": "PUR-P1-001", "X-Correlation-Id": `corr-${idempotencyKey}`,
        "Idempotency-Key": idempotencyKey, ...(revision ? { "If-Match": `"${revision}"` } : {}),
      });
      const dependantInput = {
        displayName: "HTTP Synthetic Dependant", kind: "DEPENDANT", relationship: "Child", loginEnabled: false,
        role: "MANAGED_DEPENDANT", permissions: { view: false, add: false, edit: false, delete: false },
      };
      const createdResponse = await fetch(`${base}/people`, { method: "POST", headers: commandHeaders("subject-create-0001"), body: JSON.stringify(dependantInput) });
      expect(createdResponse.status).toBe(201);
      expect(createdResponse.headers.get("etag")).toBe('"1"');
      const dependant = await createdResponse.json() as { id: string; revision: number; status: string };
      expect(dependant).toMatchObject({ revision: 1, status: "ACTIVE" });

      let state = JSON.parse(await readFile(join(directory, "state.json"), "utf8")) as { workspaces: Array<{ workspace: { id: string; revision: number }; subjects: Array<{ id: string; status: string; revision: number }>; members: Array<{ id: string; subjectId: string; revision: number }>; subjectIdentityLinks: Array<{ subjectId: string }>; accessGrants: Array<{ resourceIds: string[] }>; audit: Array<{ type: string; outcome?: string; correlationId?: string }> }>; authorityOutbox: Array<{ eventType: string; correlationId: string }> };
      let authority = state.workspaces.find((candidate) => candidate.subjects.some((subject) => subject.id === dependant.id))!;
      expect(authority.members.some((member) => member.subjectId === dependant.id)).toBe(false);
      expect(authority.subjectIdentityLinks.some((link) => link.subjectId === dependant.id)).toBe(false);
      expect(authority.accessGrants.some((grant) => grant.resourceIds.includes(dependant.id))).toBe(false);

      const missingRevision = await fetch(`${base}/people/${dependant.id}`, { method: "PATCH", headers: commandHeaders("subject-update-missing-revision"), body: JSON.stringify({ ...dependantInput, relationship: "Dependant" }) });
      expect(missingRevision.status).toBe(428);
      expect(missingRevision.headers.get("content-type")).toContain("application/problem+json");
      const stale = await fetch(`${base}/people/${dependant.id}`, { method: "PATCH", headers: commandHeaders("subject-update-stale", 99), body: JSON.stringify({ ...dependantInput, relationship: "Stale" }) });
      expect(stale.status).toBe(412);
      expect(await stale.json()).toMatchObject({ code: "PRECONDITION_FAILED", retry_class: "REFRESH_REQUIRED" });
      const updatedResponse = await fetch(`${base}/people/${dependant.id}`, { method: "PATCH", headers: commandHeaders("subject-update-current", 1), body: JSON.stringify({ ...dependantInput, relationship: "Dependant" }) });
      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.headers.get("etag")).toBe('"2"');

      const foreign = await fetch(`${base}/people/subject-from-another-workspace`, { method: "PATCH", headers: commandHeaders("subject-update-foreign", 1), body: JSON.stringify(dependantInput) });
      expect(foreign.status).toBe(404);
      expect(await foreign.json()).toMatchObject({ code: "RESOURCE_NOT_AVAILABLE" });
      const retired = await fetch(`${base}/people/${dependant.id}`, { method: "DELETE", headers: commandHeaders("subject-retire-current", 2) });
      expect(retired.status).toBe(200);

      state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
      authority = state.workspaces.find((candidate) => candidate.subjects.some((subject) => subject.id === dependant.id))!;
      expect(authority.subjects.find((subject) => subject.id === dependant.id)).toMatchObject({ status: "RETIRED", revision: 3 });
      expect(authority.audit.filter((entry) => entry.type === "PERSON_CHANGE_REJECTED")).toHaveLength(2);
      expect(authority.audit.find((entry) => entry.type === "PERSON_CHANGE_REJECTED" && entry.correlationId === "corr-subject-update-stale")).toBeDefined();
      expect(state.authorityOutbox.find((entry) => entry.eventType === "PERSON_CHANGE_REJECTED" && entry.correlationId === "corr-subject-update-stale")).toBeDefined();
      const repeatedRetirement = await fetch(`${base}/people/${dependant.id}`, { method: "DELETE", headers: commandHeaders("subject-retire-repeated", 3) });
      expect(repeatedRetirement.status).toBe(404);
      expect(await repeatedRetirement.json()).toMatchObject({ code: "RESOURCE_NOT_AVAILABLE" });
      state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
      authority = state.workspaces.find((candidate) => candidate.subjects.some((subject) => subject.id === dependant.id))!;
      expect(authority.audit.filter((entry) => entry.type === "PERSON_RETIREMENT_REJECTED" && entry.outcome === "DENIED")).toHaveLength(1);

      const canonicalBase = `${base}/v1/workspaces/${workspace.id}`;
      const canonicalList = await fetch(`${canonicalBase}/subjects`, { headers: commandHeaders("canonical-subject-list") });
      expect(canonicalList.status).toBe(200);
      expect((await canonicalList.json() as { items: unknown[] }).items.length).toBeGreaterThan(0);
      const retiredCanonicalGet = await fetch(`${canonicalBase}/subjects/${dependant.id}`, { headers: commandHeaders("canonical-retired-subject") });
      expect(retiredCanonicalGet.status).toBe(404);
      const canonicalMissingRevision = await fetch(`${canonicalBase}/subjects`, { method: "POST", headers: commandHeaders("canonical-subject-missing-revision"), body: JSON.stringify({ subject_kind: "PERSON", authority_basis_ref: null }) });
      expect(canonicalMissingRevision.status).toBe(428);
      const canonicalInvalid = await fetch(`${canonicalBase}/subjects`, { method: "POST", headers: commandHeaders("canonical-subject-invalid-0001", authority.workspace.revision), body: JSON.stringify({ subject_kind: "PERSON", authority_basis_ref: null, unexpected: true }) });
      expect(canonicalInvalid.status).toBe(422);
      const canonicalCreateHeaders = commandHeaders("canonical-subject-create-0001", authority.workspace.revision);
      const canonicalCreateBody = { subject_kind: "PERSON", authority_basis_ref: "authority-basis-synthetic-001" };
      const canonicalCreate = await fetch(`${canonicalBase}/subjects`, { method: "POST", headers: canonicalCreateHeaders, body: JSON.stringify(canonicalCreateBody) });
      expect(canonicalCreate.status).toBe(201);
      const canonicalSubject = await canonicalCreate.json() as { subject_id: string; identity_link_state: string; revision: number };
      expect(canonicalSubject).toMatchObject({ identity_link_state: "NONE", revision: 1 });
      const canonicalReplay = await fetch(`${canonicalBase}/subjects`, { method: "POST", headers: canonicalCreateHeaders, body: JSON.stringify(canonicalCreateBody) });
      expect(canonicalReplay.status).toBe(201);
      expect((await canonicalReplay.json() as { subject_id: string }).subject_id).toBe(canonicalSubject.subject_id);
      const canonicalConflict = await fetch(`${canonicalBase}/subjects`, { method: "POST", headers: canonicalCreateHeaders, body: JSON.stringify({ ...canonicalCreateBody, authority_basis_ref: "authority-basis-conflict" }) });
      expect(canonicalConflict.status).toBe(409);
      expect(await canonicalConflict.json()).toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
      const subjectPageOne = await fetch(`${canonicalBase}/subjects?page_size=1`, { headers: commandHeaders("canonical-subject-page-one") });
      expect(subjectPageOne.status).toBe(200);
      const subjectPageOneBody = await subjectPageOne.json() as { items: Array<{ subject_id: string }>; page: { next_page_after: string; has_more: boolean; snapshot_ref: string } };
      expect(subjectPageOneBody.items).toHaveLength(1); expect(subjectPageOneBody.page.has_more).toBe(true); expect(subjectPageOneBody.page.next_page_after).toBeTruthy();
      const subjectPageTwo = await fetch(`${canonicalBase}/subjects?page_size=1&page_after=${encodeURIComponent(subjectPageOneBody.page.next_page_after)}`, { headers: commandHeaders("canonical-subject-page-two") });
      const subjectPageTwoBody = await subjectPageTwo.json() as { items: Array<{ subject_id: string }>; page: { next_page_after: null; has_more: boolean; snapshot_ref: string } };
      expect(subjectPageTwo.status).toBe(200); expect(subjectPageTwoBody.items).toHaveLength(1); expect(subjectPageTwoBody.page.has_more).toBe(false); expect(subjectPageTwoBody.page.next_page_after).toBeNull();
      expect(subjectPageTwoBody.items[0]!.subject_id).not.toBe(subjectPageOneBody.items[0]!.subject_id);
      expect(subjectPageTwoBody.page.snapshot_ref).toBe(subjectPageOneBody.page.snapshot_ref);
      const invalidSubjectCursor = await fetch(`${canonicalBase}/subjects?page_size=1&page_after=not-a-valid-cursor`, { headers: commandHeaders("canonical-subject-invalid-cursor") });
      expect(invalidSubjectCursor.status).toBe(400); expect(await invalidSubjectCursor.json()).toMatchObject({ code: "INVALID_PAGE_CURSOR" });
      const invalidPageSize = await fetch(`${canonicalBase}/subjects?page_size=0`, { headers: commandHeaders("canonical-subject-invalid-size") });
      expect(invalidPageSize.status).toBe(422);
      const canonicalGet = await fetch(`${canonicalBase}/subjects/${canonicalSubject.subject_id}`, { headers: commandHeaders("canonical-subject-get") });
      expect(canonicalGet.status).toBe(200);
      const canonicalStalePatch = await fetch(`${canonicalBase}/subjects/${canonicalSubject.subject_id}`, { method: "PATCH", headers: commandHeaders("canonical-subject-patch-stale", 99), body: JSON.stringify({ operation: "PROPOSE_ATTRIBUTE_CORRECTION", protected_change_ref: "protected-change-stale", reason_code: "USER_CORRECTION" }) });
      expect(canonicalStalePatch.status).toBe(412);
      const invalidCorrelationStale = await fetch(`${canonicalBase}/subjects/${canonicalSubject.subject_id}`, { method: "PATCH", headers: { ...commandHeaders("canonical-subject-invalid-correlation", 99), "X-Correlation-Id": "bad" }, body: JSON.stringify({ operation: "PROPOSE_ATTRIBUTE_CORRECTION", protected_change_ref: null, reason_code: "USER_CORRECTION" }) });
      expect(invalidCorrelationStale.status).toBe(412);
      const normalizedDenialCorrelation = (await invalidCorrelationStale.json() as { correlation_id: string }).correlation_id;
      expect(normalizedDenialCorrelation).toMatch(/^[0-9a-f-]{36}$/);
      const canonicalPatch = await fetch(`${canonicalBase}/subjects/${canonicalSubject.subject_id}`, { method: "PATCH", headers: commandHeaders("canonical-subject-patch-0001", 1), body: JSON.stringify({ operation: "PROPOSE_ATTRIBUTE_CORRECTION", protected_change_ref: "protected-change-synthetic-001", reason_code: "USER_CORRECTION" }) });
      expect(canonicalPatch.status).toBe(200);
      expect(canonicalPatch.headers.get("x-correlation-id")).toBe("corr-canonical-subject-patch-0001");
      expect(await canonicalPatch.json()).toMatchObject({ subject_id: canonicalSubject.subject_id, revision: 2 });
      const foreignPath = await fetch(`${base}/v1/workspaces/workspace-foreign/subjects/${canonicalSubject.subject_id}`, { headers: commandHeaders("canonical-subject-foreign") });
      expect(foreignPath.status).toBe(404);
      const unknownSubjectChange = await fetch(`${canonicalBase}/subjects/subject-foreign`, { method: "PATCH", headers: commandHeaders("canonical-subject-unknown-change", 1), body: JSON.stringify({ operation: "PROPOSE_ATTRIBUTE_CORRECTION", protected_change_ref: null, reason_code: "USER_CORRECTION" }) });
      expect(unknownSubjectChange.status).toBe(404);

      state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
      authority = state.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!;
      const membershipBody = { identity_or_audience_ref: "audience-synthetic-001", participation_class: "GUEST", invitation_policy_ref: "invitation-policy-synthetic@0.1" };
      const membershipCreate = await fetch(`${canonicalBase}/memberships`, { method: "POST", headers: commandHeaders("canonical-membership-create-0001", authority.workspace.revision), body: JSON.stringify(membershipBody) });
      expect(membershipCreate.status).toBe(201);
      const membership = await membershipCreate.json() as { membership_id: string; audience_ref: string; identity_id?: string; revision: number };
      expect(membership).toMatchObject({ audience_ref: "audience-synthetic-001", revision: 1 });
      expect(membership.identity_id).toBeUndefined();
      const staleSnapshotCursor = await fetch(`${canonicalBase}/subjects?page_size=1&page_after=${encodeURIComponent(subjectPageOneBody.page.next_page_after)}`, { headers: commandHeaders("canonical-subject-stale-snapshot") });
      expect(staleSnapshotCursor.status).toBe(400);
      const membershipReplay = await fetch(`${canonicalBase}/memberships`, { method: "POST", headers: commandHeaders("canonical-membership-create-0001", authority.workspace.revision), body: JSON.stringify(membershipBody) });
      expect(membershipReplay.status).toBe(201);
      expect((await membershipReplay.json() as { membership_id: string }).membership_id).toBe(membership.membership_id);
      const membershipConflict = await fetch(`${canonicalBase}/memberships`, { method: "POST", headers: commandHeaders("canonical-membership-create-0001", authority.workspace.revision), body: JSON.stringify({ ...membershipBody, identity_or_audience_ref: "audience-conflict" }) });
      expect(membershipConflict.status).toBe(409);
      const membershipList = await fetch(`${canonicalBase}/memberships`, { headers: commandHeaders("canonical-membership-list") });
      expect(membershipList.status).toBe(200);
      expect((await membershipList.json() as { items: Array<{ membership_id: string }> }).items.some((item) => item.membership_id === membership.membership_id)).toBe(true);
      const membershipPageOne = await fetch(`${canonicalBase}/memberships?page_size=1`, { headers: commandHeaders("canonical-membership-page-one") });
      const membershipPageOneBody = await membershipPageOne.json() as { items: Array<{ membership_id: string }>; page: { next_page_after: string; has_more: boolean } };
      expect(membershipPageOne.status).toBe(200); expect(membershipPageOneBody.items).toHaveLength(1); expect(membershipPageOneBody.page.has_more).toBe(true);
      const membershipPageTwo = await fetch(`${canonicalBase}/memberships?page_size=1&page_after=${encodeURIComponent(membershipPageOneBody.page.next_page_after)}`, { headers: commandHeaders("canonical-membership-page-two") });
      const membershipPageTwoBody = await membershipPageTwo.json() as { items: Array<{ membership_id: string }>; page: { next_page_after: null; has_more: boolean } };
      expect(membershipPageTwo.status).toBe(200); expect(membershipPageTwoBody.items).toHaveLength(1); expect(membershipPageTwoBody.page.has_more).toBe(false);
      const crossCollectionCursor = await fetch(`${canonicalBase}/memberships?page_size=1&page_after=${encodeURIComponent(subjectPageOneBody.page.next_page_after)}`, { headers: commandHeaders("canonical-membership-cross-cursor") });
      expect(crossCollectionCursor.status).toBe(400);
      const membershipGet = await fetch(`${canonicalBase}/memberships/${membership.membership_id}`, { headers: commandHeaders("canonical-membership-get") });
      expect(membershipGet.status).toBe(200);
      const membershipStale = await fetch(`${canonicalBase}/memberships/${membership.membership_id}`, { method: "PATCH", headers: commandHeaders("canonical-membership-patch-stale", 99), body: JSON.stringify({ transition: "SUSPEND", reason_code: "USER_REQUEST" }) });
      expect(membershipStale.status).toBe(412);
      const membershipPatch = await fetch(`${canonicalBase}/memberships/${membership.membership_id}`, { method: "PATCH", headers: commandHeaders("canonical-membership-patch-0001", 1), body: JSON.stringify({ transition: "SUSPEND", reason_code: "USER_REQUEST" }) });
      expect(membershipPatch.status).toBe(200);
      expect(await membershipPatch.json()).toMatchObject({ membership_id: membership.membership_id, status: "REVOKED", revision: 2 });
      const membershipPatchReplay = await fetch(`${canonicalBase}/memberships/${membership.membership_id}`, { method: "PATCH", headers: commandHeaders("canonical-membership-patch-0001", 1), body: JSON.stringify({ transition: "SUSPEND", reason_code: "USER_REQUEST" }) });
      expect(membershipPatchReplay.status).toBe(200);
      expect(await membershipPatchReplay.json()).toMatchObject({ membership_id: membership.membership_id, revision: 2 });
      const missingMembership = await fetch(`${canonicalBase}/memberships/membership-foreign`, { headers: commandHeaders("canonical-membership-foreign") });
      expect(missingMembership.status).toBe(404);
      const missingMembershipChange = await fetch(`${canonicalBase}/memberships/membership-foreign`, { method: "PATCH", headers: commandHeaders("canonical-membership-unknown-change", 1), body: JSON.stringify({ transition: "SUSPEND", reason_code: "USER_REQUEST" }) });
      expect(missingMembershipChange.status).toBe(404);

      state = JSON.parse(await readFile(join(directory, "state.json"), "utf8"));
      authority = state.workspaces.find((candidate) => candidate.workspace.id === workspace.id)!;
      expect(authority.audit.find((entry) => entry.type === "SUBJECT_CHANGE_PROPOSED" && entry.correlationId === "corr-canonical-subject-patch-0001")).toBeDefined();
      expect(state.authorityOutbox.find((entry) => entry.eventType === "SUBJECT_CHANGE_PROPOSED" && entry.correlationId === "corr-canonical-subject-patch-0001")).toBeDefined();
      expect(authority.audit.find((entry) => entry.type === "SUBJECT_CHANGE_REJECTED" && entry.correlationId === "corr-canonical-subject-patch-stale")).toBeDefined();
      expect(authority.audit.find((entry) => entry.type === "SUBJECT_CHANGE_REJECTED" && entry.correlationId === normalizedDenialCorrelation)).toBeDefined();
      expect(authority.audit.find((entry) => entry.type === "SUBJECT_CHANGE_REJECTED" && entry.correlationId === "corr-canonical-subject-unknown-change")).toBeDefined();
      expect(state.authorityOutbox.find((entry) => entry.eventType === "MEMBERSHIP_CHANGE_REJECTED" && entry.correlationId === "corr-canonical-membership-patch-stale")).toBeDefined();
      expect(state.authorityOutbox.find((entry) => entry.eventType === "MEMBERSHIP_CHANGE_REJECTED" && entry.correlationId === "corr-canonical-membership-unknown-change")).toBeDefined();
    } finally {
      await app.close();
    }
  });
});
