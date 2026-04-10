/**
 * Sadece sunucu (Route Handler) tarafından import edin; istemci paketine girmesin.
 * `RENT_API_UPSTREAM` yoksa prod ile uyumlu varsayılan kök kullanılır.
 */
export const DEFAULT_RENT_API_UPSTREAM = "https://rental.algorycode.com";
const DEV_RENT_API_UPSTREAM = "http://localhost:8090";

export function resolveRentApiUpstreamUrl(): string {
  const fromEnv = process.env.RENT_API_UPSTREAM?.trim().replace(/\/$/, "");
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "development") return DEV_RENT_API_UPSTREAM;
  return DEFAULT_RENT_API_UPSTREAM;
}
