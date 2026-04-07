import { cn } from "@/lib/utils";

export function RentCalendarLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "m-0 list-none flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/50 pt-4 text-[11px] text-muted-foreground sm:justify-start sm:gap-x-8 sm:text-xs",
        className,
      )}
      aria-label="Takvim renkleri"
    >
      <li className="inline-flex items-center gap-2">
        <span className="h-7 w-7 shrink-0 rounded-lg border border-border/90 bg-card shadow-sm sm:h-8 sm:w-8" aria-hidden />
        Müsait
      </li>
      <li className="inline-flex items-center gap-2">
        <span className="h-7 w-7 shrink-0 rounded-lg border border-destructive/35 bg-destructive/15 sm:h-8 sm:w-8" aria-hidden />
        Kirada / dolu
      </li>
      <li className="inline-flex items-center gap-2">
        <span className="h-7 w-7 shrink-0 rounded-lg border-2 border-ring bg-card shadow-sm sm:h-8 sm:w-8" aria-hidden />
        Bugün
      </li>
    </ul>
  );
}
