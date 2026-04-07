export const AUTH_BASE =
  process.env.AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  "https://auth.algorycode.com";

/**
 * Rent API kök URL (sonunda / yok). Tüm filo/kiralama/ödeme/kullanıcı istekleri buraya gider.
 *
 * - `next dev`: env boşsa `http://localhost:8090`
 * - Prod: önce `NEXT_PUBLIC_RENT_API_BASE` (hosting paneli veya `.env.production`); yoksa `https://rent-api.algorycode.com`
 *
 * Şablon: `.env.local.example` → `.env.local` (lokal). `.env.production` repoda (git’e ekleyin).
 */
const PROD_RENT_API_DEFAULT = "https://rent-api.algorycode.com";

export const RENT_API_BASE = (() => {
  const v = process.env.NEXT_PUBLIC_RENT_API_BASE?.trim();
  if (v) return v.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:8090";
  // `next build` / hosting: env unutulursa (ör. .env.production deploy’a girmemiş) prod kökü
  return PROD_RENT_API_DEFAULT;
})();

export const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;
