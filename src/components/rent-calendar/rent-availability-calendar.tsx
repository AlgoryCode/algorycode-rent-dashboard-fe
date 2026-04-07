"use client";

import * as React from "react";
import { DayPicker, type Matcher } from "react-day-picker";
import type { Locale } from "date-fns";

import { cn } from "@/lib/utils";

import "react-day-picker/style.css";
import "./rent-calendar.css";

export type RentAvailabilityCalendarProps = {
  booked: Date[];
  onDayClick: (date: Date, modifiers: Record<string, boolean>) => void;
  disabled?: Matcher;
  locale?: Locale;
  className?: string;
};

export function RentAvailabilityCalendar({ booked, onDayClick, disabled, locale, className }: RentAvailabilityCalendarProps) {
  return (
    <div className={cn("rent-calendar-scroll w-full", className)}>
      <DayPicker
        locale={locale}
        showOutsideDays
        navLayout="around"
        className="rent-calendar-skin"
        modifiers={{ booked }}
        modifiersClassNames={{ booked: "rent-cal-booked" }}
        disabled={disabled}
        onDayClick={onDayClick}
        classNames={{
          caption_label:
            "select-none text-base font-semibold tracking-tight text-foreground sm:text-lg lg:text-xl",
        }}
      />
    </div>
  );
}
