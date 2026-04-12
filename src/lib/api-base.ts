/**
 * Yalnızca Spring Cloud Gateway kökü: auth → `{gateway}/authservice`, rent → `{gateway}/rent`.
 *
 * Tek isteğe bağlı env (ikisi de aynı işi görür, biri yeter):
 * - `NEXT_PUBLIC_GATEWAY_URL`
 * - `NEXT_PUBLIC_BASE_API_URL`
 *
 * Boşsa: `next dev` → `http://localhost:8072`, production → `https://gateway.algorycode.com`
 */

const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

function gatewayOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_API_URL?.trim() ||
    "";
  if (raw) return stripTrailingSlash(raw);
  return process.env.NODE_ENV === "development"
    ? "http://localhost:8072"
    : "https://gateway.algorycode.com";
}

export function resolveBaseApiUrl(): string {
  return gatewayOrigin();
}

export const baseApiUrl = resolveBaseApiUrl();

export function getAuthApiRoot(): string {
  return `${gatewayOrigin()}/authservice`;
}

export function getRentApiRoot(): string {
  return `${gatewayOrigin()}/rent`;
}
