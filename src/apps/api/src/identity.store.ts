import { ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { AuthSession, LoginInput, RegisterInput } from "@document-management/contracts";

const scrypt = promisify(scryptCallback);
const IDLE_SESSION_SECONDS = 60 * 30;
const ABSOLUTE_SESSION_SECONDS = 60 * 60 * 24 * 7;
const LOGIN_WINDOW_SECONDS = 60 * 15;
const LOGIN_LOCK_SECONDS = 60 * 15;
const MAX_FAILED_LOGINS = 5;

function signInRateLimit(): HttpException {
  return new HttpException("Sign-in is temporarily unavailable. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
}

interface AccountRecord {
  id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  salt: string;
  passwordVersion: 1;
  securityVersion: number;
  state: "ACTIVE" | "SUSPENDED";
  onboardingComplete: boolean;
  activeWorkspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionRecord {
  id: string;
  tokenHash: string;
  csrfHash: string;
  accountId: string;
  securityVersion: number;
  createdAt: string;
  lastSeenAt: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
  authenticationMethod: "LOCAL_PASSWORD";
  assurance: "SINGLE_FACTOR";
  activeWorkspaceId?: string;
}

interface LoginAttemptRecord {
  keyHash: string;
  failedAt: string[];
  lockUntil?: string;
}

interface IdentityState {
  schemaVersion: 2;
  accounts: AccountRecord[];
  sessions: SessionRecord[];
  loginAttempts: LoginAttemptRecord[];
}

interface PersistedIdentityInput {
  schemaVersion?: number;
  accounts?: Array<Partial<AccountRecord> & Pick<AccountRecord, "id" | "displayName" | "email" | "passwordHash" | "salt" | "onboardingComplete" | "createdAt">>;
  sessions?: Array<Partial<SessionRecord> & { tokenHash: string; accountId: string; expiresAt?: string }>;
  loginAttempts?: LoginAttemptRecord[];
}

export interface SessionCredentials {
  token: string;
  csrfToken: string;
}

export interface AuthenticatedIdentity {
  account: { id: string; displayName: string; email: string };
  onboardingComplete: boolean;
  activeWorkspaceId?: string;
  session: NonNullable<AuthSession["session"]>;
}

export interface IdentityResult {
  identity: AuthenticatedIdentity;
  credentials: SessionCredentials;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function csrfForSessionToken(token: string): string {
  return createHmac("sha256", token).update("doculyra-csrf-v1").digest("base64url");
}

function equalHash(actualValue: string, expectedHash: string): boolean {
  const actual = Buffer.from(hash(actualValue), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function iso(milliseconds: number): string {
  return new Date(milliseconds).toISOString();
}

@Injectable()
export class IdentityStore {
  private readonly path = join(resolve(process.env.DM_DATA_DIR ?? "./local-data"), "identity.json");
  private writeChain: Promise<unknown> = Promise.resolve();

  private normalize(input: PersistedIdentityInput): IdentityState {
    const updatedAt = new Date().toISOString();
    return {
      schemaVersion: 2,
      accounts: (input.accounts ?? []).map((account) => ({
        id: account.id,
        displayName: account.displayName,
        email: account.email,
        passwordHash: account.passwordHash,
        salt: account.salt,
        passwordVersion: 1,
        securityVersion: account.securityVersion ?? 1,
        state: account.state ?? "ACTIVE",
        onboardingComplete: account.onboardingComplete,
        ...(account.activeWorkspaceId ? { activeWorkspaceId: account.activeWorkspaceId } : {}),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt ?? updatedAt,
      })),
      sessions: (input.sessions ?? []).flatMap((session) => {
        // Legacy bearer sessions had no CSRF binding or rotation metadata and are intentionally invalidated.
        if (!session.id || !session.csrfHash || !session.createdAt || !session.lastSeenAt || !session.idleExpiresAt || !session.absoluteExpiresAt || !session.securityVersion) return [];
        return [{
          id: session.id,
          tokenHash: session.tokenHash,
          csrfHash: session.csrfHash,
          accountId: session.accountId,
          securityVersion: session.securityVersion,
          createdAt: session.createdAt,
          lastSeenAt: session.lastSeenAt,
          idleExpiresAt: session.idleExpiresAt,
          absoluteExpiresAt: session.absoluteExpiresAt,
          authenticationMethod: "LOCAL_PASSWORD" as const,
          assurance: "SINGLE_FACTOR" as const,
          ...(session.activeWorkspaceId ? { activeWorkspaceId: session.activeWorkspaceId } : {}),
        }];
      }),
      loginAttempts: input.loginAttempts ?? [],
    };
  }

  private async loadRaw(): Promise<IdentityState> {
    try {
      return this.normalize(JSON.parse(await readFile(this.path, "utf8")) as PersistedIdentityInput);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { schemaVersion: 2, accounts: [], sessions: [], loginAttempts: [] };
    }
  }

  private async saveRaw(state: IdentityState): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
  }

  private async mutate<T>(operation: (state: IdentityState) => Promise<T> | T): Promise<T> {
    const run = this.writeChain.then(async () => {
      const state = await this.loadRaw();
      const result = await operation(state);
      await this.saveRaw(state);
      return result;
    });
    this.writeChain = run.then(() => undefined, () => undefined);
    return run;
  }

  private async passwordDigest(password: string, salt: string): Promise<string> {
    return Buffer.from(await scrypt(password, salt, 64) as Buffer).toString("hex");
  }

  private prune(state: IdentityState, at: number): void {
    state.sessions = state.sessions.filter((session) => new Date(session.idleExpiresAt).getTime() > at && new Date(session.absoluteExpiresAt).getTime() > at);
    state.loginAttempts = state.loginAttempts.flatMap((attempt) => {
      const failedAt = attempt.failedAt.filter((value) => new Date(value).getTime() > at - LOGIN_WINDOW_SECONDS * 1000);
      const lockActive = Boolean(attempt.lockUntil && new Date(attempt.lockUntil).getTime() > at);
      if (!failedAt.length && !lockActive) return [];
      const current: LoginAttemptRecord = { keyHash: attempt.keyHash, failedAt };
      if (lockActive && attempt.lockUntil) current.lockUntil = attempt.lockUntil;
      return [current];
    });
  }

  private issueSession(state: IdentityState, account: AccountRecord, at: number, activeWorkspaceId = account.activeWorkspaceId): IdentityResult {
    const token = randomBytes(32).toString("base64url");
    const csrfToken = csrfForSessionToken(token);
    const createdAt = iso(at);
    const session: SessionRecord = {
      id: randomUUID(), tokenHash: hash(token), csrfHash: hash(csrfToken), accountId: account.id,
      securityVersion: account.securityVersion, createdAt, lastSeenAt: createdAt,
      idleExpiresAt: iso(at + IDLE_SESSION_SECONDS * 1000), absoluteExpiresAt: iso(at + ABSOLUTE_SESSION_SECONDS * 1000),
      authenticationMethod: "LOCAL_PASSWORD", assurance: "SINGLE_FACTOR",
      ...(activeWorkspaceId ? { activeWorkspaceId } : {}),
    };
    state.sessions.push(session);
    return { identity: this.publicIdentity(account, session), credentials: { token, csrfToken } };
  }

  private publicIdentity(account: AccountRecord, session: SessionRecord): AuthenticatedIdentity {
    const activeWorkspaceId = session.activeWorkspaceId ?? account.activeWorkspaceId;
    return {
      account: { id: account.id, displayName: account.displayName, email: account.email },
      onboardingComplete: account.onboardingComplete,
      ...(activeWorkspaceId ? { activeWorkspaceId } : {}),
      session: {
        id: session.id,
        createdAt: session.createdAt,
        idleExpiresAt: session.idleExpiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt,
        authenticationMethod: session.authenticationMethod,
        assurance: session.assurance,
      },
    };
  }

  private attemptKey(email: string, clientFingerprint: string): string {
    return hash(`${email}\u001f${clientFingerprint}`);
  }

  async register(input: RegisterInput, at = Date.now()): Promise<IdentityResult> {
    const salt = randomBytes(16).toString("hex");
    const passwordHash = await this.passwordDigest(input.password, salt);
    return this.mutate((state) => {
      this.prune(state, at);
      if (state.accounts.some((account) => account.email === input.email)) throw new ConflictException("Unable to create an account with those details");
      const createdAt = iso(at);
      const account: AccountRecord = {
        id: randomUUID(), displayName: input.displayName, email: input.email, passwordHash, salt, passwordVersion: 1,
        securityVersion: 1, state: "ACTIVE", onboardingComplete: false, createdAt, updatedAt: createdAt,
      };
      state.accounts.push(account);
      return this.issueSession(state, account, at);
    });
  }

  async login(input: LoginInput, clientFingerprint: string, at = Date.now()): Promise<IdentityResult> {
    const snapshot = await this.loadRaw();
    this.prune(snapshot, at);
    const attemptKey = this.attemptKey(input.email, clientFingerprint);
    const attempt = snapshot.loginAttempts.find((candidate) => candidate.keyHash === attemptKey);
    if (attempt?.lockUntil && new Date(attempt.lockUntil).getTime() > at) throw signInRateLimit();
    const account = snapshot.accounts.find((item) => item.email === input.email && item.state === "ACTIVE");
    const salt = account?.salt ?? "00000000000000000000000000000000";
    const actual = Buffer.from(await this.passwordDigest(input.password, salt), "hex");
    const expected = Buffer.from(account?.passwordHash ?? "00".repeat(64), "hex");
    const validAccountId = account && actual.length === expected.length && timingSafeEqual(actual, expected) ? account.id : undefined;

    const result = await this.mutate((state): { ok: true; value: IdentityResult } | { ok: false; locked: boolean } => {
      this.prune(state, at);
      const currentAttempt = state.loginAttempts.find((candidate) => candidate.keyHash === attemptKey);
      if (currentAttempt?.lockUntil && new Date(currentAttempt.lockUntil).getTime() > at) return { ok: false, locked: true };
      const currentAccount = validAccountId ? state.accounts.find((candidate) => candidate.id === validAccountId && candidate.state === "ACTIVE") : undefined;
      if (!currentAccount) {
        const record = currentAttempt ?? { keyHash: attemptKey, failedAt: [] };
        if (!currentAttempt) state.loginAttempts.push(record);
        record.failedAt.push(iso(at));
        if (record.failedAt.length >= MAX_FAILED_LOGINS) record.lockUntil = iso(at + LOGIN_LOCK_SECONDS * 1000);
        return { ok: false, locked: Boolean(record.lockUntil) };
      }
      state.loginAttempts = state.loginAttempts.filter((candidate) => candidate.keyHash !== attemptKey);
      return { ok: true, value: this.issueSession(state, currentAccount, at) };
    });
    if (!result.ok) {
      if (result.locked) throw signInRateLimit();
      throw new UnauthorizedException("Email or password is incorrect");
    }
    return result.value;
  }

  async session(token?: string, at = Date.now()): Promise<{ identity?: AuthenticatedIdentity; csrfToken?: string }> {
    if (!token) return {};
    return this.mutate((state) => {
      this.prune(state, at);
      const session = state.sessions.find((candidate) => candidate.tokenHash === hash(token));
      const account = session ? state.accounts.find((candidate) => candidate.id === session.accountId && candidate.state === "ACTIVE" && candidate.securityVersion === session.securityVersion) : undefined;
      if (!session || !account) return {};
      const csrfToken = csrfForSessionToken(token);
      session.csrfHash = hash(csrfToken);
      session.lastSeenAt = iso(at);
      session.idleExpiresAt = iso(Math.min(at + IDLE_SESSION_SECONDS * 1000, new Date(session.absoluteExpiresAt).getTime()));
      return { identity: this.publicIdentity(account, session), csrfToken };
    });
  }

  async requireSession(token?: string, csrfToken?: string, requireCsrf = false, at = Date.now()): Promise<AuthenticatedIdentity> {
    if (!token) throw new UnauthorizedException("Sign in required");
    return this.mutate((state) => {
      this.prune(state, at);
      const session = state.sessions.find((candidate) => candidate.tokenHash === hash(token));
      const account = session ? state.accounts.find((candidate) => candidate.id === session.accountId && candidate.state === "ACTIVE" && candidate.securityVersion === session.securityVersion) : undefined;
      if (!session || !account) throw new UnauthorizedException("Sign in required");
      if (requireCsrf && (!csrfToken || !equalHash(csrfToken, session.csrfHash))) throw new ForbiddenException("Request could not be authorized");
      session.lastSeenAt = iso(at);
      session.idleExpiresAt = iso(Math.min(at + IDLE_SESSION_SECONDS * 1000, new Date(session.absoluteExpiresAt).getTime()));
      return this.publicIdentity(account, session);
    });
  }

  async completeOnboarding(accountId: string, currentToken: string, workspaceId: string, at = Date.now()): Promise<IdentityResult> {
    return this.mutate((state) => {
      this.prune(state, at);
      const currentSession = state.sessions.find((candidate) => candidate.tokenHash === hash(currentToken) && candidate.accountId === accountId);
      const account = state.accounts.find((candidate) => candidate.id === accountId && candidate.state === "ACTIVE");
      if (!currentSession || !account) throw new UnauthorizedException("Sign in required");
      account.onboardingComplete = true;
      account.activeWorkspaceId = workspaceId;
      account.securityVersion += 1;
      account.updatedAt = iso(at);
      state.sessions = state.sessions.filter((candidate) => candidate.accountId !== accountId);
      return this.issueSession(state, account, at, workspaceId);
    });
  }

  async selectWorkspace(accountId: string, currentToken: string, workspaceId: string, at = Date.now()): Promise<IdentityResult> {
    return this.mutate((state) => {
      this.prune(state, at);
      const currentSession = state.sessions.find((candidate) => candidate.tokenHash === hash(currentToken) && candidate.accountId === accountId);
      const account = state.accounts.find((candidate) => candidate.id === accountId && candidate.state === "ACTIVE");
      if (!currentSession || !account) throw new UnauthorizedException("Sign in required");
      account.activeWorkspaceId = workspaceId;
      account.updatedAt = iso(at);
      state.sessions = state.sessions.filter((candidate) => candidate.id !== currentSession.id);
      return this.issueSession(state, account, at, workspaceId);
    });
  }

  async listSessions(accountId: string, currentSessionId: string, at = Date.now()): Promise<Array<NonNullable<AuthSession["session"]> & { current: boolean }>> {
    const state = await this.loadRaw();
    this.prune(state, at);
    return state.sessions.filter((session) => session.accountId === accountId).map((session) => ({
      id: session.id, createdAt: session.createdAt, idleExpiresAt: session.idleExpiresAt, absoluteExpiresAt: session.absoluteExpiresAt,
      authenticationMethod: session.authenticationMethod, assurance: session.assurance, current: session.id === currentSessionId,
    }));
  }

  async revokeSession(accountId: string, sessionId: string): Promise<boolean> {
    return this.mutate((state) => {
      const before = state.sessions.length;
      state.sessions = state.sessions.filter((session) => session.accountId !== accountId || session.id !== sessionId);
      return state.sessions.length !== before;
    });
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;
    await this.mutate((state) => {
      state.sessions = state.sessions.filter((session) => session.tokenHash !== hash(token));
    });
  }
}
