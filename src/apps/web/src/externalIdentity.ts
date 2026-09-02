export const externalIdentityProviderIds = ["google", "apple", "microsoft"] as const;

export type ExternalIdentityProviderId = typeof externalIdentityProviderIds[number];
export type ExternalIdentityProviderAvailability = {
  provider: ExternalIdentityProviderId;
  available: boolean;
};

export type ExternalIdentityAvailability = {
  broker: "MICROSOFT_ENTRA_EXTERNAL_ID";
  providers: Array<{ provider: "GOOGLE" | "APPLE" | "MICROSOFT"; available: boolean }>;
};

export type ExternalIdentityCallbackNotice = {
  kind: "cancelled" | "failed";
  message: string;
};

const callbackMessages: Record<string, string> = {
  cancelled: "Sign-in was cancelled. No external account was connected.",
  denied: "Sign-in was not approved. No external account was connected.",
  unavailable: "That sign-in provider is currently unavailable. Try again later or use email and password.",
  expired: "That sign-in attempt expired. Start again or use email and password.",
  invalid: "That sign-in attempt could not be verified. Start again or use email and password.",
  failed: "External sign-in could not be completed. Try again or use email and password.",
};

export function safeAuthReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/app";
  try {
    const candidate = new URL(value, "https://doculyra.invalid");
    if (candidate.origin !== "https://doculyra.invalid") return "/app";
    return /^\/(?!\/)[A-Za-z0-9/_-]*$/.test(candidate.pathname) ? candidate.pathname : "/app";
  } catch {
    return "/app";
  }
}

export function externalIdentityStartPath(provider: "GOOGLE" | "APPLE" | "MICROSOFT", returnTo: string): string {
  return `/auth/external/start?provider=${provider}&returnPath=${encodeURIComponent(safeAuthReturnTo(returnTo))}`;
}

export function safeExternalAuthorizationUrl(value: string): string | undefined {
  try {
    const candidate = new URL(value);
    return candidate.protocol === "https:" ? candidate.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function externalIdentityCallbackNotice(url: URL): ExternalIdentityCallbackNotice | undefined {
  const outcome = url.searchParams.get("external_auth");
  const oauthError = url.searchParams.get("error");
  if (!outcome) return undefined;
  if (outcome === "success" && !oauthError) return undefined;

  if (outcome === "cancelled" || oauthError === "access_denied") {
    return { kind: "cancelled", message: callbackMessages.cancelled! };
  }

  const reason = url.searchParams.get("reason") ?? outcome ?? "failed";
  return { kind: "failed", message: callbackMessages[reason] ?? callbackMessages.failed! };
}

export function availabilityByProvider(response: ExternalIdentityAvailability): Record<ExternalIdentityProviderId, ExternalIdentityProviderAvailability> {
  const fallback = (provider: ExternalIdentityProviderId): ExternalIdentityProviderAvailability => ({ provider, available: false });
  const result = Object.fromEntries(externalIdentityProviderIds.map((provider) => [provider, fallback(provider)])) as Record<ExternalIdentityProviderId, ExternalIdentityProviderAvailability>;
  for (const item of response.providers) {
    const provider = item.provider.toLowerCase() as ExternalIdentityProviderId;
    if (externalIdentityProviderIds.includes(provider)) result[provider] = { provider, available: item.available };
  }
  return result;
}

export function parseExternalIdentityAvailability(value: unknown): ExternalIdentityAvailability {
  if (!value || typeof value !== "object") throw new Error("Provider availability could not be verified");
  const candidate = value as { broker?: unknown; providers?: unknown };
  if (candidate.broker !== "MICROSOFT_ENTRA_EXTERNAL_ID" || !Array.isArray(candidate.providers)) throw new Error("Provider availability could not be verified");
  const providers = candidate.providers.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Provider availability could not be verified");
    const provider = (item as { provider?: unknown }).provider;
    const available = (item as { available?: unknown }).available;
    if ((provider !== "GOOGLE" && provider !== "APPLE" && provider !== "MICROSOFT") || typeof available !== "boolean") throw new Error("Provider availability could not be verified");
    return { provider: provider as "GOOGLE" | "APPLE" | "MICROSOFT", available };
  });
  return { broker: candidate.broker, providers };
}

export function providerName(provider: ExternalIdentityProviderId): string {
  return provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Microsoft";
}
