"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  localeFromNavigatorLang,
  parseStoredLocale,
} from "@/lib/i18n/locales";
import { type MessageKey, translate } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readInitialLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = parseStoredLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  if (stored) return stored;
  return localeFromNavigatorLang(window.navigator.language) ?? DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLocaleState(readInitialLocale());
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || typeof document === "undefined") return;
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* private mode */
    }
  }, [locale, ready]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

/** Dil seçicisi gibi; tüm uygulama metinleri için `useLocale` tercih edin. */
export function useLocaleOptional(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
