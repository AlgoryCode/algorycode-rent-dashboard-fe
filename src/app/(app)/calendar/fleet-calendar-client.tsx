"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { rentalsActiveOnDay } from "@/lib/fleet-utils";
import { rentalCountsForCalendar } from "@/lib/rental-status";
import { cn } from "@/lib/utils";

const MAX_RENTALS_PER_CELL = 3;

function accentForVehicleId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 62% 42%)`;
}

export function FleetCalendarClient() {
  const { allSessions, ready: sessionsReady, error: sessionsError } = useFleetSessions();
  const { allVehicles, ready: vehiclesReady, error: vehiclesError } = useFleetVehicles();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const vehicleById = useMemo(() => new Map(allVehicles.map((v) => [v.id, v])), [allVehicles]);

  const weekdayLabels = useMemo(() => {
    const monday = startOfWeek(new Date(2024, 1, 5), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), "EEE", { locale: tr }));
  }, []);

  const gridDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const from = startOfWeek(start, { weekStartsOn: 1 });
    const to = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: from, end: to });
  }, [month]);

  const ready = sessionsReady && vehiclesReady;
  const error = sessionsError ?? vehiclesError;

  return (
    <div className="mx-auto max-w-[min(100%,88rem)] space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Calendar className="h-5 w-5 text-primary" />
          Takvim
        </h1>
        <p className="text-xs text-muted-foreground">
          Seçili ayda hangi araçların hangi günlerde kirada olduğunu ve kiralama süresini (gün) görüntüleyin. Satıra tıklayarak araç detayına gidebilirsiniz.
        </p>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card className="glow-card">
        <CardHeader className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-sm">Filo kiralama takvimi</CardTitle>
            <CardDescription>
              {!ready ? "Yükleniyor…" : `${allSessions.filter(rentalCountsForCalendar).length} takvimde sayılan kiralama`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Önceki ay"
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[10rem] text-center text-sm font-semibold capitalize tabular-nums">
              {format(month, "LLLL yyyy", { locale: tr })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Sonraki ay"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="sm" className="ml-1 h-9 text-xs" onClick={() => setMonth(startOfMonth(new Date()))}>
              Bugün
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4 pt-0 sm:px-4">
          {!ready ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Takvim yükleniyor…</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="rounded-md bg-muted/50 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs"
                    >
                      {label}
                    </div>
                  ))}
                  {gridDays.map((day) => {
                    const infos = rentalsActiveOnDay(allSessions, day);
                    const inMonth = isSameMonth(day, month);
                    const visible = infos.slice(0, MAX_RENTALS_PER_CELL);
                    const more = infos.length - visible.length;
                    return (
                      <div
                        key={format(day, "yyyy-MM-dd")}
                        className={cn(
                          "flex min-h-[5.5rem] flex-col rounded-lg border border-border/80 bg-card p-1 shadow-sm sm:min-h-[7.5rem] lg:min-h-[9rem]",
                          !inMonth && "opacity-45",
                          isToday(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                      >
                        <div className="flex items-start justify-between gap-1 px-0.5 pt-0.5">
                          <span
                            className={cn(
                              "tabular-nums text-xs font-semibold sm:text-sm",
                              isToday(day) ? "text-primary" : "text-foreground",
                            )}
                          >
                            {format(day, "d")}
                          </span>
                        </div>
                        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                          {visible.map(({ session: s, durationDays }) => {
                            const v = vehicleById.get(s.vehicleId);
                            const plate = v?.plate ?? s.vehicleId.slice(0, 8);
                            const accent = accentForVehicleId(s.vehicleId);
                            return (
                              <Link
                                key={s.id}
                                href={`/vehicles/${s.vehicleId}`}
                                className="block truncate rounded-md border border-border/50 bg-muted/30 px-1 py-0.5 text-left text-[10px] transition-colors hover:bg-muted/60 sm:text-xs"
                                style={{ borderLeftWidth: 3, borderLeftColor: accent }}
                                title={`${plate}: ${s.startDate} → ${s.endDate} (${durationDays} gün)`}
                              >
                                <span className="font-mono font-medium">{plate}</span>
                                <span className="text-muted-foreground"> · {durationDays} gün</span>
                              </Link>
                            );
                          })}
                          {more > 0 && (
                            <p className="truncate px-0.5 text-[10px] text-muted-foreground">+{more} kirada</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
