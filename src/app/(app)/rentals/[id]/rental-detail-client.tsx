"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { fetchRentalByIdFromRentApi, getRentApiErrorMessage } from "@/lib/rent-api";
import { rentKeys } from "@/lib/rent-query-keys";

type Props = { rentalId: string };

export function RentalDetailClient({ rentalId }: Props) {
  const { updateRental } = useFleetSessions();
  const { allVehicles } = useFleetVehicles();
  const [saving, setSaving] = useState(false);

  const { data: rental, isPending, error, refetch } = useQuery({
    queryKey: rentKeys.rental(rentalId),
    queryFn: () => fetchRentalByIdFromRentApi(rentalId),
  });

  const vehicle = useMemo(() => allVehicles.find((v) => v.id === rental?.vehicleId), [allVehicles, rental?.vehicleId]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "pending" | "completed" | "cancelled">("active");

  useEffect(() => {
    if (!rental) return;
    setStartDate(rental.startDate);
    setEndDate(rental.endDate);
    setFullName(rental.customer.fullName);
    setPhone(rental.customer.phone);
    setStatus((rental.status as "active" | "pending" | "completed" | "cancelled") ?? "active");
  }, [rental]);

  const save = async () => {
    if (!rental) return;
    setSaving(true);
    try {
      await updateRental(rental.id, {
        startDate,
        endDate,
        status,
        customer: { fullName, phone },
      });
      await refetch();
      toast.success("Kiralama güncellendi.");
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="outline" size="sm" className="h-8 text-xs">
        <Link href="/logs">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Kiralamalara dön
        </Link>
      </Button>

      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="text-base">Kiralama detayı</CardTitle>
          <CardDescription className="text-xs">
            {vehicle ? `${vehicle.plate} — ${vehicle.brand} ${vehicle.model}` : rentalId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPending ? (
            <p className="text-xs text-muted-foreground">Yükleniyor…</p>
          ) : error ? (
            <p className="text-xs text-destructive">{getRentApiErrorMessage(error)}</p>
          ) : !rental ? (
            <p className="text-xs text-muted-foreground">Kiralama bulunamadı.</p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Başlangıç</Label>
                  <Input type="date" className="h-9 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bitiş</Label>
                  <Input type="date" className="h-9 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Müşteri adı</Label>
                  <Input className="h-9 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefon</Label>
                  <Input className="h-9 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Durum</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "pending" | "completed" | "cancelled")}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Aktif</option>
                    <option value="pending">Beklemede</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>
              </div>
              <Button type="button" className="h-9 gap-2 text-xs" onClick={() => void save()} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
