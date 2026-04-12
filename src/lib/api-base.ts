/**
 * BFF upstream ve istemci kökleri için tek kaynak.
 *
 * **Sunucu:** `AUTH_BASE`, `RENT_API_UPSTREAM` gibi env’ler hâlâ önceliklidir.
 * **Tarayıcı:** `NEXT_PUBLIC_BASE_API_URL` veya `NEXT_PUBLIC_API_BASE_MODE` ile seçilir.
 *
 * Modlar: `prod-gateway` | `prod-direct` | `local` | `local-gateway`
 * (varsayılan: geliştirme `local`, üretim `prod-gateway`).
 */

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

export const baseProdGatewayUrl = "https://gateway.algorycode.com";
export const baseProdUrl = "https://rental.algorycode.com";
export const baseProdDirectAuthUrl = "https://auth.algorycode.com";
export const baseLocalUrl = "http://localhost:8090";
export const baseLocalAuthUrl = "http://localhost:8099";
export const baseLocalGatewayUrl = "http://localhost:8072";

export type ApiBaseMode = "prod-gateway" | "prod-direct" | "local" | "local-gateway";

function resolveMode(): ApiBaseMode {
  const raw = process.env.NEXT_PUBLIC_API_BASE_MODE?.trim().toLowerCase();
  if (raw === "prod-gateway" || raw === "prod-direct" || raw === "local" || raw === "local-gateway") {
    return raw;
  }
  return process.env.NODE_ENV === "development" ? "local" : "prod-gateway";
}

export function resolveBaseApiUrl(): string {
  const override = process.env.NEXT_PUBLIC_BASE_API_URL?.trim();
  if (override) return stripTrailingSlash(override);
  const mode = resolveMode();
  switch (mode) {
    case "prod-gateway":
      return stripTrailingSlash(baseProdGatewayUrl);
    case "prod-direct":
      return stripTrailingSlash(baseProdUrl);
    case "local":
      return stripTrailingSlash(baseLocalUrl);
    case "local-gateway":
      return stripTrailingSlash(baseLocalGatewayUrl);
    default:
      return stripTrailingSlash(baseProdGatewayUrl);
  }
}

export const baseApiUrl = resolveBaseApiUrl();

export function getAuthApiRoot(): string {
  const server = process.env.AUTH_BASE?.trim();
  if (server) return stripTrailingSlash(server);
  const pub = process.env.NEXT_PUBLIC_AUTH_BASE?.trim();
  if (pub) return stripTrailingSlash(pub);
  const mode = resolveMode();
  if (mode === "prod-gateway" || mode === "local-gateway") {
    return `${resolveBaseApiUrl()}/authservice`;
  }
  if (mode === "prod-direct") return stripTrailingSlash(baseProdDirectAuthUrl);
  return stripTrailingSlash(baseLocalAuthUrl);
}

export function getRentApiRoot(): string {
  const upstream = process.env.RENT_API_UPSTREAM?.trim();
  if (upstream) return stripTrailingSlash(upstream);
  const pub = process.env.NEXT_PUBLIC_RENT_API_BASE?.trim();
  if (pub && !pub.startsWith("/")) return stripTrailingSlash(pub);
  const mode = resolveMode();
  if (mode === "prod-gateway" || mode === "local-gateway") {
    return `${resolveBaseApiUrl()}/rent`;
  }
  return resolveBaseApiUrl();
}
