"use client";

import Link from "next/link";
import { startOfDay } from "date-fns";
import { ArrowRight, CarFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { vehicleFleetStatus } from "@/lib/fleet-utils";

export default function DashboardPage() {
  const { allVehicles } = useFleetVehicles();
  const { allSessions } = useFleetSessions();
  const today = startOfDay(new Date());

  let available = 0;
  let rented = 0;
  let maintenance = 0;
  for (const v of allVehicles) {
    const s = vehicleFleetStatus(v, allSessions, today);
    if (s === "available") available++;
    else if (s === "rented") rented++;
    else maintenance++;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Özet</h1>
        <p className="text-xs text-muted-foreground">Filo durumu — bugünün tarihine göre.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="glow-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Toplam araç</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{allVehicles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glow-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Müsait</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-emerald-700 dark:text-emerald-400">{available}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glow-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Kirada / bakım</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              <span className="text-amber-700 dark:text-amber-400">{rented}</span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span className="text-muted-foreground">{maintenance}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="glow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CarFront className="h-4 w-4" />
              Araçlar
            </CardTitle>
            <CardDescription className="text-xs">Listeyi görüntüleyin, arayın veya yeni araç ekleyin.</CardDescription>
          </div>
          <Button size="sm" className="h-8 gap-1 text-xs" asChild>
            <Link href="/vehicles">
              Araçlara git
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Aktif kiralama kaydı: <span className="font-mono text-foreground">{allSessions.length}</span> seans (örnek + yerel).
        </CardContent>
      </Card>
    </div>
  );
}
