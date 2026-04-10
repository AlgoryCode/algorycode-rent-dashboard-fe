"use client";

import * as React from "react";
import { isSameDay } from "date-fns";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import type { Locale } from "date-fns";

import { cn } from "@/lib/utils";

import "react-day-picker/style.css";
import "./rent-calendar.css";

export type RentAvailabilityCalendarProps = {
  booked: Date[];
  locale?: Locale;
  className?: string;
  disabled?: Matcher;
  defaultMonth?: Date;
  /** Varsayılan `single`: araç detayı gibi güne tıklama. `range`: tarih aralığı seçimi (talep formu vb.). */
  mode?: "single" | "range";
  /** `mode="range"` iken seçili aralık */
  selected?: DateRange;
  /** `mode="range"` iken aralık değişimi */
  onSelect?: (range: DateRange | undefined) => void;
  /** `mode="single"` veya belirtilmemiş iken */
  onDayClick?: (date: Date, modifiers: Record<string, boolean>) => void;
};

function matcherHits(m: Matcher | undefined, date: Date): boolean {
  if (m == null) return false;
  if (typeof m === "function") return Boolean(m(date));
  if (m instanceof Date) return isSameDay(m, date);
  if (Array.isArray(m)) return m.some((x) => matcherHits(x, date));
  if (typeof m === "boolean") return m;
  if (typeof m === "string") return false;
  if (typeof m === "number") return false;
  if (m && typeof m === "object" && "from" in m && "to" in m) {
    const r = m as { from?: Date; to?: Date };
    if (r.from && r.to) {
      const t = date.getTime();
      return t >= r.from.getTime() && t <= r.to.getTime();
    }
  }
  return false;
}

export function RentAvailabilityCalendar({
  booked,
  locale,
  className,
  disabled,
  defaultMonth,
  mode = "single",
  selected,
  onSelect,
  onDayClick,
}: RentAvailabilityCalendarProps) {
  const bookedDisabled = React.useCallback((d: Date) => booked.some((b) => isSameDay(b, d)), [booked]);

  const mergedDisabled = React.useMemo<Matcher | undefined>(() => {
    if (mode !== "range") return disabled;
    if (!disabled) return bookedDisabled;
    return (date: Date) => bookedDisabled(date) || matcherHits(disabled, date);
  }, [mode, disabled, bookedDisabled]);

  const captionClass =
    "select-none text-base font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl";

  if (mode === "range") {
    return (
      <div className={cn("rent-calendar-scroll w-full", className)}>
        <DayPicker
          mode="range"
          locale={locale}
          selected={selected}
          onSelect={onSelect}
          defaultMonth={defaultMonth}
          showOutsideDays
          navLayout="around"
          className="rent-calendar-skin"
          modifiers={{ booked }}
          modifiersClassNames={{ booked: "rent-cal-booked" }}
          disabled={mergedDisabled}
          classNames={{
            caption_label: captionClass,
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("rent-calendar-scroll w-full", className)}>
      <DayPicker
        locale={locale}
        showOutsideDays
        navLayout="around"
        defaultMonth={defaultMonth}
        className="rent-calendar-skin"
        modifiers={{ booked }}
        modifiersClassNames={{ booked: "rent-cal-booked" }}
        disabled={disabled}
        onDayClick={onDayClick}
        classNames={{
          caption_label: captionClass,
        }}
      />
    </div>
  );
}
