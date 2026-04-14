"use client";

import { useLocale } from "@/components/locale-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOCALES, LOCALE_LABELS, LOCALE_TAG, type AppLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

function LocaleTagLine({ locale: loc, compact }: { locale: AppLocale; compact?: boolean }) {
  const { flag, code } = LOCALE_TAG[loc];
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className={cn("leading-none", compact ? "text-[11px]" : "text-[13px]")} aria-hidden>
        {flag}
      </span>
      <span className="font-semibold tabular-nums tracking-tight">{code}</span>
    </span>
  );
}

type LanguageSelectProps = {
  /** header: üst çubuk / giriş köşesi; compact: dar mobil */
  variant?: "header" | "compact";
  className?: string;
};

export function LanguageSelect({ variant = "header", className }: LanguageSelectProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as AppLocale)}>
      <SelectTrigger
        aria-label={`${t("lang.section")}: ${LOCALE_LABELS[locale]}`}
        className={cn(
          "shadow-sm",
          variant === "header" && "h-8 w-[4.75rem] shrink-0 justify-center gap-0 px-1.5 text-xs",
          variant === "compact" && "h-8 w-[4.25rem] shrink-0 justify-center gap-0 px-1 text-[11px]",
          className,
        )}
      >
        <SelectValue>
          <LocaleTagLine locale={locale} compact={variant === "compact"} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="z-[200]">
        {APP_LOCALES.map((code) => (
          <SelectItem
            key={code}
            value={code}
            className="text-xs"
            title={LOCALE_LABELS[code]}
            textValue={`${LOCALE_LABELS[code]} ${LOCALE_TAG[code].code}`}
          >
            <LocaleTagLine locale={code} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
