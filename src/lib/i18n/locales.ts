export type AppLocale = "tr" | "en" | "sq";

export const APP_LOCALES: AppLocale[] = ["tr", "en", "sq"];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  tr: "Türkçe",
  en: "English",
  sq: "Shqip",
};

/** Seçicide: küçük bayrak + ülke / dil kısaltması (erişilebilir tam ad için `LOCALE_LABELS`). */
export const LOCALE_TAG: Record<AppLocale, { flag: string; code: string }> = {
  tr: { flag: "🇹🇷", code: "TR" },
  en: { flag: "🇬🇧", code: "EN" },
  sq: { flag: "🇦🇱", code: "AL" },
};

export const LOCALE_STORAGE_KEY = "algoryrent.locale";

export const DEFAULT_LOCALE: AppLocale = "tr";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "tr" || value === "en" || value === "sq";
}

export function parseStoredLocale(raw: string | null | undefined): AppLocale | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return isAppLocale(v) ? v : null;
}

/** Tarayıcı `Accept-Language` / `navigator.language` için kaba eşleme. */
export function localeFromNavigatorLang(lang: string | null | undefined): AppLocale | null {
  if (!lang) return null;
  const l = lang.toLowerCase();
  if (l.startsWith("sq")) return "sq";
  if (l.startsWith("en")) return "en";
  if (l.startsWith("tr")) return "tr";
  return null;
}
