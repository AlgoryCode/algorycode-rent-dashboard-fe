"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { aggregateCustomersFromSessions, sessionCreatedAt, vehiclePlate } from "@/lib/rental-metadata";
import type { CustomerAggregateRow } from "@/lib/rental-metadata";

export function CustomersClient() {
  const { allSessions } = useFleetSessions();
  const { allVehicles } = useFleetVehicles();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CustomerAggregateRow | null>(null);

  const vehiclesById = useMemo(() => new Map(allVehicles.map((v) => [v.id, v])), [allVehicles]);

  const rows = useMemo(() => aggregateCustomersFromSessions(allSessions), [allSessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      ({ customer: c }) =>
        c.fullName.toLowerCase().includes(q) ||
        c.nationalId.includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.passportNo.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Users className="h-5 w-5 text-primary" />
          Customers
        </h1>
        <p className="text-xs text-muted-foreground">
          Kiralama geçmişinden türetilen müşteri kayıtları. Yeni kiralama ekledikçe liste güncellenir (demo: tarayıcıda saklanan
          seanslar).
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="İsim, TC, telefon veya pasaport ara…"
          className="h-9 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Müşteri ara"
        />
      </div>

      <Card className="glow-card">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kayıtlı müşteriler</CardTitle>
          <CardDescription>
            {filtered.length} kayıt · toplam {rows.length} benzersiz müşteri
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-3 sm:px-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Sonuç yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 text-xs">İsim</TableHead>
                  <TableHead className="hidden h-9 w-[120px] text-xs sm:table-cell">TC</TableHead>
                  <TableHead className="hidden h-9 text-xs md:table-cell">Telefon</TableHead>
                  <TableHead className="h-9 w-[52px] text-center text-xs">Kira</TableHead>
                  <TableHead className="hidden h-9 w-[130px] text-xs lg:table-cell">Son işlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.key}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => setSelected(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(row);
                      }
                    }}
                  >
                    <TableCell className="py-2 text-sm font-medium">{row.customer.fullName}</TableCell>
                    <TableCell className="hidden py-2 font-mono text-xs sm:table-cell">{row.customer.nationalId}</TableCell>
                    <TableCell className="hidden py-2 text-xs md:table-cell">{row.customer.phone}</TableCell>
                    <TableCell className="py-2 text-center">
                      <Badge variant="secondary" className="tabular-nums">
                        {row.totalRentals}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden py-2 text-xs text-muted-foreground lg:table-cell">
                      {format(parseISO(row.lastActivity), "d MMM yyyy HH:mm", { locale: tr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={selected != null} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected.customer.fullName}</DialogTitle>
              <DialogDescription className="space-y-1 text-left font-mono text-xs">
                <div>TC: {selected.customer.nationalId}</div>
                <div>Pasaport: {selected.customer.passportNo}</div>
                <div>Tel: {selected.customer.phone}</div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Kiralama geçmişi ({selected.rentals.length})</p>
              <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                {selected.rentals.map((r) => (
                  <li key={r.id} className="rounded-lg border bg-card px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-mono font-medium">{vehiclePlate(vehiclesById, r.vehicleId)}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {r.startDate} → {r.endDate}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Kayıt: {format(parseISO(sessionCreatedAt(r)), "d MMM yyyy HH:mm", { locale: tr })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setSelected(null)}>
              Kapat
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
