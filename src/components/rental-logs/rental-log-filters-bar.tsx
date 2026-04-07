"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RentalLogFilterValues } from "@/lib/rental-log-filters";
import { emptyRentalLogFilters } from "@/lib/rental-log-filters";
import { RENTAL_STATUS_LABEL, type RentalStatus } from "@/lib/rental-status";

type Props = {
  values: RentalLogFilterValues;
  onChange: (next: RentalLogFilterValues) => void;
  /** Tüm filolar için plaka araması */
  showVehicleQuery?: boolean;
};

export function RentalLogFiltersBar({ values, onChange, showVehicleQuery }: Props) {
  const clear = () => onChange(emptyRentalLogFilters());

  return (
    <div className="space-y-4 border-b border-border/60 pb-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="rlf-customer" className="text-xs">
            Müşteri ara
          </Label>
          <Input
            id="rlf-customer"
            placeholder="İsim veya TC kimlik no"
            className="h-9 text-sm"
            value={values.customerQuery}
            onChange={(e) => onChange({ ...values, customerQuery: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rlf-date" className="text-xs">
            Tarih
          </Label>
          <Input
            id="rlf-date"
            type="date"
            className="h-9 text-sm"
            value={values.anchorDate}
            onChange={(e) => onChange({ ...values, anchorDate: e.target.value })}
          />
          <p className="text-[10px] leading-snug text-muted-foreground">
            Kayıt bu güne denk gelsin veya seçilen gün kiralama aralığına düşsün.
          </p>
        </div>
        {showVehicleQuery && (
          <div className="space-y-1.5">
            <Label htmlFor="rlf-plate" className="text-xs">
              Plaka ara
            </Label>
            <Input
              id="rlf-plate"
              placeholder="Örn. 34 ABC"
              className="h-9 font-mono text-sm"
              value={values.vehicleQuery ?? ""}
              onChange={(e) => onChange({ ...values, vehicleQuery: e.target.value })}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="rlf-status" className="text-xs">
            Statü
          </Label>
          <Select
            value={values.status}
            onValueChange={(v) => onChange({ ...values, status: v as "all" | RentalStatus })}
          >
            <SelectTrigger id="rlf-status" className="h-9 text-xs font-normal">
              <SelectValue placeholder="Statü seçin" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all" className="text-xs">
                Tümü
              </SelectItem>
              {(Object.keys(RENTAL_STATUS_LABEL) as RentalStatus[]).map((k) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {RENTAL_STATUS_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clear}>
        Filtreleri temizle
      </Button>
    </div>
  );
}
