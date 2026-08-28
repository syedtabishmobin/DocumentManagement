import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { AuthSession, LoginInput, RegisterInput } from "@document-management/contracts";

const scrypt = promisify(scryptCallback);
const SESSION_SECONDS = 60 * 60 * 24 * 7;

interface AccountRecord {
  id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  salt: string;
  onboardingComplete: boolean;
  createdAt: string;
}

interface SessionRecord {
  tokenHash: string;
  accountId: string;
  expiresAt: string;
}

interface IdentityState {
  accounts: AccountRecord[];
  sessions: SessionRecord[];
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class IdentityStore {
  private readonly path = join(resolve(process.env.DM_DATA_DIR ?? "./local-data"), "identity.json");
  private writeChain: Promise<void> = Promise.resolve();

  private async load(): Promise<IdentityState> {
    try {
      return JSON.parse(await readFile(this.path, "utf8")) as IdentityState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { accounts: [], sessions: [] };
    }
  }

  private async save(state: IdentityState): Promise<void> {
    this.writeChain = this.writeChain.then(async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.${process.pid}.tmp`;
      await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
      await rename(temporary, this.path);
    });
    await this.writeChain;
  }

  private async passwordDigest(password: string, salt: string): Promise<string> {
    return Buffer.from(await scrypt(password, salt, 64) as Buffer).toString("hex");
  }

  private createSession(state: IdentityState, accountId: string): string {
    const token = randomBytes(32).toString("base64url");
    state.sessions = state.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
    state.sessions.push({ tokenHash: tokenHash(token), accountId, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() });
    return token;
  }

  async register(input: RegisterInput): Promise<{ session: AuthSession; token: string }> {
    const state = await this.load();
    if (state.accounts.some((account) => account.email === input.email)) throw new ConflictException("An account with this email already exists");
    if (state.accounts.length > 0) throw new ConflictException("A local owner account already exists on this installation. Sign in with that account.");
    const salt = randomBytes(16).toString("hex");
    const account: AccountRecord = {
      id: randomUUID(),
      displayName: input.displayName,
      email: input.email,
      passwordHash: await this.passwordDigest(input.password, salt),
      salt,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    state.accounts.push(account);
    const token = this.createSession(state, account.id);
    await this.save(state);
    return { session: this.publicSession(account), token };
  }

  async login(input: LoginInput): Promise<{ session: AuthSession; token: string }> {
    const state = await this.load();
    const account = state.accounts.find((item) => item.email === input.email);
    if (!account) throw new UnauthorizedException("Email or password is incorrect");
    const actual = Buffer.from(await this.passwordDigest(input.password, account.salt), "hex");
    const expected = Buffer.from(account.passwordHash, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException("Email or password is incorrect");
    const token = this.createSession(state, account.id);
    await this.save(state);
    return { session: this.publicSession(account), token };
  }

  async session(token?: string): Promise<AuthSession> {
    if (!token) return { authenticated: false, onboardingComplete: false };
    const state = await this.load();
    const session = state.sessions.find((item) => item.tokenHash === tokenHash(token) && new Date(item.expiresAt).getTime() > Date.now());
    const account = session ? state.accounts.find((item) => item.id === session.accountId) : undefined;
    return account ? this.publicSession(account) : { authenticated: false, onboardingComplete: false };
  }

  async requireSession(token?: string): Promise<AuthSession & { account: NonNullable<AuthSession["account"]> }> {
    const session = await this.session(token);
    if (!session.authenticated || !session.account) throw new UnauthorizedException("Sign in required");
    return session as AuthSession & { account: NonNullable<AuthSession["account"]> };
  }

  async completeOnboarding(accountId: string): Promise<void> {
    const state = await this.load();
    const account = state.accounts.find((item) => item.id === accountId);
    if (!account) throw new UnauthorizedException("Sign in required");
    account.onboardingComplete = true;
    await this.save(state);
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;
    const state = await this.load();
    state.sessions = state.sessions.filter((item) => item.tokenHash !== tokenHash(token));
    await this.save(state);
  }

  private publicSession(account: AccountRecord): AuthSession {
    return { authenticated: true, account: { id: account.id, displayName: account.displayName, email: account.email }, onboardingComplete: account.onboardingComplete };
  }
}
