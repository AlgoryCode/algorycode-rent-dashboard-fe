"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountries } from "@/hooks/use-countries";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { getRentApiErrorMessage } from "@/lib/rent-api";
import { compactVehicleImages, type VehicleImages } from "@/lib/vehicle-images";
import { VehicleImageSlotsEditor } from "@/components/vehicles/vehicle-image-slots-editor";

const REQUIRED_VEHICLE_IMAGE_SLOTS: (keyof VehicleImages)[] = [
  "front",
  "rear",
  "left",
  "right",
  "interiorDash",
  "interiorRear",
];

function normalizePlate(p: string) {
  return p.replace(/\s+/g, " ").trim().toUpperCase();
}

const COUNTRY_NONE = "__none__";

export function VehicleNewClient() {
  const router = useRouter();
  const { allVehicles, addVehicle } = useFleetVehicles();
  const { countries } = useCountries();
  const [saving, setSaving] = useState(false);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [maintenance, setMaintenance] = useState(false);
  const [externalVehicle, setExternalVehicle] = useState(false);
  const [externalCompany, setExternalCompany] = useState("");
  const [commissionRatePercent, setCommissionRatePercent] = useState("");
  const [commissionBrokerPhone, setCommissionBrokerPhone] = useState("");
  const [rentalDailyPrice, setRentalDailyPrice] = useState("");
  const [vehicleCountry, setVehicleCountry] = useState<string>(COUNTRY_NONE);
  const [draftImages, setDraftImages] = useState<VehicleImages>({});

  const countriesSorted = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [countries],
  );

  const submitNewVehicle = async () => {
    const p = normalizePlate(plate);
    const b = brand.trim();
    const m = model.trim();
    const y = parseInt(year, 10);
    if (!p || !b || !m || !Number.isFinite(y) || y < 1950 || y > new Date().getFullYear() + 1) {
      toast.error("Plaka, marka, model ve geçerli model yılı gerekli.");
      return;
    }
    const dup = allVehicles.some((v) => normalizePlate(v.plate) === p);
    if (dup) {
      toast.error("Bu plaka zaten kayıtlı.");
      return;
    }
    if (externalVehicle && !externalCompany.trim()) {
      toast.error("Harici araç için firma adı girin.");
      return;
    }
    const rate = externalVehicle ? Number.parseFloat(commissionRatePercent.trim().replace(",", ".")) : undefined;
    if (externalVehicle) {
      if (!Number.isFinite(rate) || (rate ?? 0) <= 0 || (rate ?? 0) > 100) {
        toast.error("Komisyon oranı yüzde olarak 0 ile 100 arasında olmalı.");
        return;
      }
    }
    const rentalPrice = Number.parseFloat(rentalDailyPrice.trim().replace(",", "."));
    if (!Number.isFinite(rentalPrice) || rentalPrice <= 0) {
      toast.error("Günlük kiralama fiyatı zorunlu ve sıfırdan büyük olmalı.");
      return;
    }
    const images = compactVehicleImages(draftImages);
    const missingVehicleImages = REQUIRED_VEHICLE_IMAGE_SLOTS.filter((slot) => !images?.[slot]);
    if (missingVehicleImages.length > 0) {
      toast.error("Araç için ön, arka, sol, sağ, kokpit ve arka koltuk fotoğrafları zorunlu.");
      return;
    }
    setSaving(true);
    try {
      const created = await addVehicle({
        plate: p,
        brand: b,
        model: m,
        year: y,
        maintenance: Boolean(maintenance),
        external: externalVehicle,
        externalCompany: externalVehicle ? externalCompany.trim() : undefined,
        commissionRatePercent: externalVehicle ? rate : undefined,
        commissionBrokerPhone: externalVehicle ? commissionBrokerPhone.trim() : undefined,
        rentalDailyPrice: rentalPrice,
        countryCode: vehicleCountry !== COUNTRY_NONE ? vehicleCountry : undefined,
        images,
      });
      toast.success("Araç kaydedildi");
      router.push(`/vehicles/${created.id}`);
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="glow-card overflow-hidden">
        <CardHeader className="space-y-1 border-b border-border/60 pb-4 pt-5">
          <CardTitle className="text-lg">Yeni araç</CardTitle>
          <CardDescription className="text-xs">
            Plaka benzersiz olmalı. Görseller base64 olarak yüklenir (demo). Tüm açılar zorunludur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 py-4 sm:px-6">
          <div className="space-y-1">
            <Label htmlFor="nv-plate">Plaka</Label>
            <Input id="nv-plate" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="34 ABC 123" className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="nv-brand">Marka</Label>
              <Input id="nv-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nv-model">Model</Label>
              <Input id="nv-model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nv-year">Model yılı</Label>
            <Input
              id="nv-year"
              type="number"
              min={1950}
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nv-country">Ülke</Label>
            <Select value={vehicleCountry} onValueChange={setVehicleCountry}>
              <SelectTrigger id="nv-country" className="w-full">
                <SelectValue placeholder="İsteğe bağlı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COUNTRY_NONE}>Atanmadı</SelectItem>
                {countriesSorted.map((c) => (
                  <SelectItem key={c.id} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-border/60"
                        style={{ backgroundColor: c.colorCode }}
                        aria-hidden
                      />
                      {c.name} ({c.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} className="rounded border-input" />
            Bakımda (kiralanamaz)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={externalVehicle}
              onChange={(e) => setExternalVehicle(e.target.checked)}
              className="rounded border-input"
            />
            Harici araç (başka firmadan)
          </label>
          {externalVehicle && (
            <>
              <div className="space-y-1">
                <Label htmlFor="nv-external-company">Harici firma adı</Label>
                <Input
                  id="nv-external-company"
                  value={externalCompany}
                  onChange={(e) => setExternalCompany(e.target.value)}
                  placeholder="Örn: X Rent A Car"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nv-commission-rate">Komisyon oranı (%)</Label>
                <Input
                  id="nv-commission-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={commissionRatePercent}
                  onChange={(e) => setCommissionRatePercent(e.target.value)}
                  placeholder="Örn: 12.5"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nv-commission-broker-phone">Komisyoncu telefonu (opsiyonel)</Label>
                <Input
                  id="nv-commission-broker-phone"
                  value={commissionBrokerPhone}
                  onChange={(e) => setCommissionBrokerPhone(e.target.value)}
                  placeholder="+90 5xx ..."
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <Label htmlFor="nv-rental-price">Günlük kiralama fiyatı</Label>
            <Input
              id="nv-rental-price"
              type="number"
              min={0}
              step="0.01"
              value={rentalDailyPrice}
              onChange={(e) => setRentalDailyPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <VehicleImageSlotsEditor value={draftImages} onChange={setDraftImages} />
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/10 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" size="sm" className="h-9 w-full text-xs sm:w-auto" asChild>
            <Link href="/vehicles">İptal</Link>
          </Button>
          <Button type="button" size="sm" variant="hero" className="h-9 w-full text-xs sm:w-auto" disabled={saving} onClick={() => void submitNewVehicle()}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
