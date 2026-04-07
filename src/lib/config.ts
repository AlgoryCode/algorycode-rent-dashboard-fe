export const AUTH_BASE =
  process.env.AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  "https://auth.algorycode.com";

/**
 * Rent API kök URL (sonunda / yok). Tüm filo/kiralama/ödeme/kullanıcı istekleri buraya gider.
 *
 * - `next dev`: env boşsa otomatik `http://localhost:8090`
 * - Prod (`next build` / platform): `NEXT_PUBLIC_RENT_API_BASE` veya `.env.production` ile tek değişken
 *
 * Şablon: `.env.local.example` → `.env.local` (lokal), canlıda hosting env veya `.env.production`.
 */
export const RENT_API_BASE = (() => {
  const v = process.env.NEXT_PUBLIC_RENT_API_BASE?.trim();
  if (v) return v.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:8090";
  return "";
})();

export const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;
