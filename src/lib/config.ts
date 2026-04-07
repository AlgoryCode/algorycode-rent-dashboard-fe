const trimTrailingSlash = (s: string) => s.replace(/\/$/, "");

const PROD_GATEWAY_DEFAULT = "https://gateway.algorycode.com";

function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function resolveGatewayBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GATEWAY_BASE || process.env.GATEWAY_BASE;
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (isLocalDev()) return "http://localhost:8072";
  return PROD_GATEWAY_DEFAULT;
}

/** AuthService’e giden upstream (gateway `/authservice` veya doğrudan AUTH_UPSTREAM). */
export function getAuthUpstreamUrl(): string {
  const direct = process.env.AUTH_UPSTREAM || process.env.NEXT_PUBLIC_AUTH_UPSTREAM;
  if (direct) return trimTrailingSlash(direct);
  return `${resolveGatewayBase()}/authservice`;
}

export const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;
