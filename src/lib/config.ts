export const AUTH_BASE =
  process.env.AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  "https://auth.algorycode.com";

/**
 * Rent API kök URL (sonunda / yok). Tüm filo/kiralama/ödeme/kullanıcı istekleri buraya gider.
 *
 * - `next dev`: `NEXT_PUBLIC_RENT_API_BASE` boşsa `http://localhost:8090`.
 * - Varsayılan prod: `/api/rent` (BFF proxy).
 * - Prod, doğrudan tarayıcı → API: tam URL (örn. `https://rental.algorycode.com`).
 * - Prod, BFF proxy: `NEXT_PUBLIC_RENT_API_BASE=/api/rent`. Sunucu hedefi için isteğe bağlı
 *   `RENT_API_UPSTREAM`; yoksa `https://rental.algorycode.com` kullanılır.
 *
 * Şablon: `.env.local.example` → `.env.local`. Farklı bir API host’unuz varsa hosting’de
 * `RENT_API_UPSTREAM` verin.
 */
const PROD_RENT_API_DEFAULT = "/api/rent";

export const RENT_API_BASE = (() => {
  const v = process.env.NEXT_PUBLIC_RENT_API_BASE?.trim();
  if (v) return v.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:8090";
  return PROD_RENT_API_DEFAULT;
})();

/**
 * Panelin herkese açık kök URL’si, sonunda `/` yok (örn. `https://panel.ornek.com`).
 *
 * - **Tarayıcıda** paylaşım linki üretirken mümkünse `window.location.origin` kullanın; alan adı
 *   değişse bile o an açık site doğru URL’yi verir.
 * - **SSR / e-posta / boş origin** için yedek: deployment’ta `NEXT_PUBLIC_APP_ORIGIN` güncelleyin;
 *   alan adı taşındığında yalnızca bu env (ve istenirse DNS) değişir, kod sabit kalmaz.
 */
export const PUBLIC_APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "").trim() ?? "";

/** Önce tarayıcı kökü, yoksa `NEXT_PUBLIC_APP_ORIGIN`. */
export function resolvePublicAppOrigin(browserOrigin?: string | null): string {
  const fromBrowser = browserOrigin?.replace(/\/$/, "").trim() ?? "";
  if (fromBrowser.length > 0) return fromBrowser;
  return PUBLIC_APP_ORIGIN;
}

/**
 * Paylaşılabilir tam URL (`path` `/` ile başlamalı).
 * Origin yoksa yalnızca path döner (göreli); WhatsApp için tam link isteniyorsa env ayarlayın.
 */
export function publicAbsoluteUrl(path: string, browserOrigin?: string | null): string {
  const pathClean = path.startsWith("/") ? path : `/${path}`;
  const base = resolvePublicAppOrigin(browserOrigin);
  if (!base) return pathClean;
  return `${base}${pathClean}`;
}

export const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const ACCESS_TOKEN_EXPIRY_MS = 300_000;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MS / 1000;
export const TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_EXPIRY_SECONDS;
