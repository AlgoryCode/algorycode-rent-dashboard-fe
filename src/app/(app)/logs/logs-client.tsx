"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RentalLogEntries } from "@/components/rental-logs/rental-log-entries";
import { RentalLogFiltersBar } from "@/components/rental-logs/rental-log-filters-bar";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import {
  emptyRentalLogFilters,
  filterRentalLogSessions,
  sortSessionsByLogTimeDesc,
  type RentalLogFilterValues,
} from "@/lib/rental-log-filters";
import { vehiclePlate } from "@/lib/rental-metadata";

export function RentalLogsClient() {
  const { allSessions } = useFleetSessions();
  const { allVehicles } = useFleetVehicles();
  const [filters, setFilters] = useState<RentalLogFilterValues>(emptyRentalLogFilters);

  const vehiclesById = useMemo(() => new Map(allVehicles.map((v) => [v.id, v])), [allVehicles]);

  const filteredSessions = useMemo(() => {
    let list = allSessions;
    const pq = filters.vehicleQuery?.trim().toUpperCase();
    if (pq) {
      list = list.filter((s) => vehiclePlate(vehiclesById, s.vehicleId).toUpperCase().includes(pq));
    }
    list = filterRentalLogSessions(list, filters);
    return sortSessionsByLogTimeDesc(list);
  }, [allSessions, filters, vehiclesById]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <CalendarDays className="h-5 w-5 text-primary" />
          Kiralamalar
        </h1>
        <p className="text-xs text-muted-foreground">
          Tüm araçlar için kiralama günlük kayıtları. Müşteri veya tarih ile süzebilir, plakaya göre daraltabilirsiniz.
        </p>
      </div>

      <Card className="glow-card">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kiralama günlüğü</CardTitle>
          <CardDescription className="text-xs">
            {filteredSessions.length} kayıt gösteriliyor · toplam {allSessions.length} seans. Müşteri özetleri için{" "}
            <Link href="/customers" className="font-medium text-primary underline-offset-2 hover:underline">
              Customers
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RentalLogFiltersBar values={filters} onChange={setFilters} showVehicleQuery />
          <RentalLogEntries
            sessions={filteredSessions}
            plateOf={(s) => ({ plate: vehiclePlate(vehiclesById, s.vehicleId), vehicleId: s.vehicleId })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
