import { ConflictException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { ExternalIdentityProvider } from "@document-management/contracts";
import { IdentityStore, type IdentityResult } from "./identity.store.js";

const PROVIDERS = ["GOOGLE", "APPLE", "MICROSOFT"] as const;
const REQUIRED_SCOPE = "openid profile email";

interface ExternalIdentityConfiguration {
  authority: URL;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  providers: ReadonlySet<ExternalIdentityProvider>;
}

interface OidcDiscovery { issuer: string; authorizationEndpoint: string; tokenEndpoint: string; jwksUri: string }

export interface ExternalIdentityAvailability {
  broker: "MICROSOFT_ENTRA_EXTERNAL_ID";
  providers: Array<{ provider: ExternalIdentityProvider; available: boolean }>;
}

export type ExternalIdentityCallbackCompletion =
  | { outcome: "SUCCESS"; result: IdentityResult; returnPath: string }
  | { outcome: "CANCELLED" | "FAILED"; reason: "cancelled" | "invalid" | "unavailable"; returnPath: string };

function secureUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV === "test" && url.hostname === "127.0.0.1")) return undefined;
    if (url.username || url.password || url.search || url.hash) return undefined;
    return url;
  } catch { return undefined; }
}

function configuration(): ExternalIdentityConfiguration | undefined {
  if (process.env.DM_EXTERNAL_IDENTITY_ADAPTER !== "enabled") return undefined;
  if (process.env.NODE_ENV !== "test" && (process.env.DM_PROFILE ?? "local") === "local") return undefined;
  const authority = secureUrl(process.env.DM_ENTRA_EXTERNAL_ID_AUTHORITY);
  const callback = secureUrl(process.env.DM_ENTRA_EXTERNAL_ID_CALLBACK_URL);
  const tenantId = process.env.DM_ENTRA_EXTERNAL_ID_TENANT_ID?.trim();
  const clientId = process.env.DM_ENTRA_EXTERNAL_ID_CLIENT_ID?.trim();
  const clientSecret = process.env.DM_ENTRA_EXTERNAL_ID_CLIENT_SECRET;
  const providerValues = (process.env.DM_EXTERNAL_IDENTITY_PROVIDER_ALLOW_LIST ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const providerMap: Record<string, ExternalIdentityProvider> = { google: "GOOGLE", apple: "APPLE", microsoft: "MICROSOFT" };
  const providers = new Set(providerValues.map((value) => providerMap[value]).filter((value): value is ExternalIdentityProvider => Boolean(value)));
  const authorityHostValid = Boolean(authority && (process.env.NODE_ENV === "test" || authority.hostname.endsWith(".ciamlogin.com")));
  if (!authority || !callback || !authorityHostValid || !tenantId || !/^[A-Za-z0-9.-]{1,120}$/.test(tenantId) || !clientId || !clientSecret || process.env.DM_ENTRA_EXTERNAL_ID_CLIENT_SECRET_CONFIGURED !== "true" || providers.size === 0 || providers.size !== providerValues.length) return undefined;
  return { authority, tenantId, clientId, clientSecret, callbackUrl: callback.toString(), providers };
}

function derived(secret: string, purpose: "nonce" | "verifier", state: string): string {
  return createHmac("sha256", secret).update(`doculyra-external-identity-v1\u001f${purpose}\u001f${state}`).digest("base64url");
}
function codeChallenge(verifier: string): string { return createHash("sha256").update(verifier).digest("base64url"); }
function safeDisplayName(value: unknown): string { return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : "Doculyra member"; }
function safeEmail(value: unknown, verified: unknown): string | undefined {
  if (verified !== true || typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return undefined;
  return value.trim().toLowerCase();
}

@Injectable()
export class ExternalIdentityService {
  private discoveryCache?: { value: OidcDiscovery; expiresAt: number };
  constructor(@Inject(IdentityStore) private readonly identities: IdentityStore) {}

  private discoveryUrl(config: ExternalIdentityConfiguration): URL {
    const base = config.authority.toString().endsWith("/") ? config.authority.toString() : `${config.authority.toString()}/`;
    return new URL("v2.0/.well-known/openid-configuration", base);
  }

  private validateDiscovery(config: ExternalIdentityConfiguration, value: unknown): OidcDiscovery {
    if (!value || typeof value !== "object") throw new Error("invalid discovery");
    const record = value as Record<string, unknown>;
    const issuer = secureUrl(typeof record.issuer === "string" ? record.issuer : undefined);
    const authorizationEndpoint = secureUrl(typeof record.authorization_endpoint === "string" ? record.authorization_endpoint : undefined);
    const tokenEndpoint = secureUrl(typeof record.token_endpoint === "string" ? record.token_endpoint : undefined);
    const jwksUri = secureUrl(typeof record.jwks_uri === "string" ? record.jwks_uri : undefined);
    const endpoints = [issuer, authorizationEndpoint, tokenEndpoint, jwksUri];
    const allowedHosts = process.env.NODE_ENV === "test"
      ? new Set([config.authority.hostname])
      : new Set([config.authority.hostname, `${config.tenantId.toLowerCase()}.ciamlogin.com`]);
    if (endpoints.some((endpoint) => !endpoint || !allowedHosts.has(endpoint.hostname) || !endpoint.pathname.toLowerCase().includes(config.tenantId.toLowerCase()))) throw new Error("invalid discovery");
    if (!issuer!.pathname.toLowerCase().endsWith("/v2.0")) throw new Error("invalid discovery");
    return { issuer: issuer!.toString(), authorizationEndpoint: authorizationEndpoint!.toString(), tokenEndpoint: tokenEndpoint!.toString(), jwksUri: jwksUri!.toString() };
  }

  private async discover(config: ExternalIdentityConfiguration, at = Date.now()): Promise<OidcDiscovery> {
    if (this.discoveryCache && this.discoveryCache.expiresAt > at) return this.discoveryCache.value;
    const response = await fetch(this.discoveryUrl(config), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error("discovery unavailable");
    const value = this.validateDiscovery(config, await response.json());
    this.discoveryCache = { value, expiresAt: at + 5 * 60 * 1000 };
    return value;
  }

  async availability(): Promise<ExternalIdentityAvailability> {
    const config = configuration();
    let discovered = false;
    if (config) try { await this.discover(config); discovered = true; } catch { /* Fail closed. */ }
    return { broker: "MICROSOFT_ENTRA_EXTERNAL_ID", providers: PROVIDERS.map((provider) => ({ provider, available: discovered && Boolean(config?.providers.has(provider)) })) };
  }

  async start(provider: ExternalIdentityProvider, returnPath: string, fingerprint: string, at = Date.now()): Promise<{ authorizationUrl: string; expiresIn: number }> {
    const config = configuration();
    if (!config || !config.providers.has(provider)) throw new ServiceUnavailableException("External sign-in is not available");
    let discovery: OidcDiscovery;
    try { discovery = await this.discover(config, at); } catch { throw new ServiceUnavailableException("External sign-in is not available"); }
    const state = randomBytes(32).toString("base64url");
    const nonce = derived(config.clientSecret, "nonce", state);
    const verifier = derived(config.clientSecret, "verifier", state);
    await this.identities.createExternalAuthorization(provider, state, returnPath, fingerprint, at);
    const url = new URL(discovery.authorizationEndpoint);
    for (const [key, value] of Object.entries({ client_id: config.clientId, response_type: "code", redirect_uri: config.callbackUrl, response_mode: "query", scope: REQUIRED_SCOPE, state, nonce, code_challenge: codeChallenge(verifier), code_challenge_method: "S256" })) url.searchParams.set(key, value);
    if (provider === "GOOGLE") url.searchParams.set("domain_hint", "google");
    if (provider === "APPLE") url.searchParams.set("domain_hint", "apple");
    return { authorizationUrl: url.toString(), expiresIn: 600 };
  }

  async callback(input: { state: string; code?: string | undefined; error?: string | undefined }, fingerprint: string, at = Date.now()): Promise<ExternalIdentityCallbackCompletion> {
    const authorization = await this.identities.consumeExternalAuthorization(input.state, fingerprint, at);
    if (input.error || !input.code) {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "CANCELLED", at);
      return { outcome: "CANCELLED", reason: "cancelled", returnPath: authorization.returnPath };
    }
    const config = configuration();
    if (!config) {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "PROVIDER_UNAVAILABLE", at);
      return { outcome: "FAILED", reason: "unavailable", returnPath: authorization.returnPath };
    }
    let discovery: OidcDiscovery;
    try { discovery = await this.discover(config, at); } catch {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "PROVIDER_UNAVAILABLE", at);
      return { outcome: "FAILED", reason: "unavailable", returnPath: authorization.returnPath };
    }
    let tokenResponse: Response;
    try {
      tokenResponse = await fetch(discovery.tokenEndpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: config.clientId, client_secret: config.clientSecret, code: input.code, redirect_uri: config.callbackUrl, code_verifier: derived(config.clientSecret, "verifier", input.state) }), signal: AbortSignal.timeout(8_000) });
    } catch {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "PROVIDER_UNAVAILABLE", at);
      return { outcome: "FAILED", reason: "unavailable", returnPath: authorization.returnPath };
    }
    if (tokenResponse.status >= 500) {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "PROVIDER_UNAVAILABLE", at);
      return { outcome: "FAILED", reason: "unavailable", returnPath: authorization.returnPath };
    }
    if (!tokenResponse.ok) {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "TOKEN_EXCHANGE_REJECTED", at);
      return { outcome: "FAILED", reason: "invalid", returnPath: authorization.returnPath };
    }
    const tokenPayload = await tokenResponse.json().catch(() => undefined) as { id_token?: unknown } | undefined;
    if (typeof tokenPayload?.id_token !== "string" || tokenPayload.id_token.length > 16_384) {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, "TOKEN_INVALID", at);
      return { outcome: "FAILED", reason: "invalid", returnPath: authorization.returnPath };
    }
    try {
      const { payload } = await jwtVerify(tokenPayload.id_token, createRemoteJWKSet(new URL(discovery.jwksUri)), { issuer: discovery.issuer, audience: config.clientId, algorithms: ["RS256", "PS256", "ES256"], requiredClaims: ["sub", "nonce", "iat", "exp"], clockTolerance: 5 });
      if (payload.nonce !== derived(config.clientSecret, "nonce", input.state) || typeof payload.sub !== "string" || payload.sub.length < 1 || payload.sub.length > 255) throw new UnauthorizedException();
      const email = safeEmail(payload.email, payload.email_verified);
      if (!email) throw new UnauthorizedException();
      const result = await this.identities.authenticateExternal({ provider: authorization.provider, issuer: discovery.issuer, subject: payload.sub, email, displayName: safeDisplayName(payload.name) }, at);
      return { outcome: "SUCCESS", result, returnPath: authorization.returnPath };
    } catch (error) {
      await this.identities.recordExternalIdentityOutcome(authorization.provider, error instanceof ConflictException ? "ACCOUNT_COLLISION" : "TOKEN_INVALID", at);
      return { outcome: "FAILED", reason: "invalid", returnPath: authorization.returnPath };
    }
  }
}
