"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { startOfDay } from "date-fns";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCountries } from "@/hooks/use-countries";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { vehicleFleetStatus, type FleetStatus } from "@/lib/fleet-utils";
import { getRentApiErrorMessage } from "@/lib/rent-api";
import { compactVehicleImages, type VehicleImages } from "@/lib/vehicle-images";
import { VehicleImageSlotsEditor } from "@/components/vehicles/vehicle-image-slots-editor";

function normalizePlate(p: string) {
  return p.replace(/\s+/g, " ").trim().toUpperCase();
}

function statusBadge(status: FleetStatus) {
  switch (status) {
    case "available":
      return <Badge variant="success">Müsait</Badge>;
    case "rented":
      return <Badge variant="warning">Kirada</Badge>;
    case "maintenance":
      return <Badge variant="muted">Bakım</Badge>;
    default:
      return null;
  }
}

const COUNTRY_NONE = "__none__";

export function VehiclesClient() {
  const router = useRouter();
  const { allVehicles, addVehicle, ready, error: fleetError } = useFleetVehicles();
  const { allSessions } = useFleetSessions();
  const { countries, countryByCode } = useCountries();
  const [tab, setTab] = useState<"all" | FleetStatus>("all");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [maintenance, setMaintenance] = useState(false);
  const [externalVehicle, setExternalVehicle] = useState(false);
  const [externalCompany, setExternalCompany] = useState("");
  const [defaultCommissionAmount, setDefaultCommissionAmount] = useState("");
  const [vehicleCountry, setVehicleCountry] = useState<string>(COUNTRY_NONE);
  const [draftImages, setDraftImages] = useState<VehicleImages>({});

  const today = startOfDay(new Date());

  const countriesSorted = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [countries],
  );

  const rows = useMemo(() => {
    return allVehicles.map((v) => {
      const status = vehicleFleetStatus(v, allSessions, today);
      return { v, status };
    });
  }, [allVehicles, allSessions, today]);

  const filteredByTab = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredByTab;
    return filteredByTab.filter(
      ({ v }) =>
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        String(v.year).includes(q),
    );
  }, [filteredByTab, query]);

  const resetForm = () => {
    setPlate("");
    setBrand("");
    setModel("");
    setYear(String(new Date().getFullYear()));
    setMaintenance(false);
    setExternalVehicle(false);
    setExternalCompany("");
    setDefaultCommissionAmount("");
    setVehicleCountry(COUNTRY_NONE);
    setDraftImages({});
  };

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
    const commissionRaw = defaultCommissionAmount.trim();
    const defaultCommission =
      commissionRaw.length > 0 ? Number.parseFloat(commissionRaw.replace(",", ".")) : undefined;
    if (defaultCommission != null && (!Number.isFinite(defaultCommission) || defaultCommission < 0)) {
      toast.error("Komisyon tutarı sayı olmalı ve negatif olamaz.");
      return;
    }
    const images = compactVehicleImages(draftImages);
    try {
      await addVehicle({
        plate: p,
        brand: b,
        model: m,
        year: y,
        maintenance: Boolean(maintenance),
        external: externalVehicle,
        externalCompany: externalVehicle ? externalCompany.trim() : undefined,
        defaultCommissionAmount: defaultCommission,
        countryCode: vehicleCountry !== COUNTRY_NONE ? vehicleCountry : undefined,
        images: images ?? undefined,
      });
      toast.success("Araç kaydedildi");
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Araçlar</h1>
          <p className="text-xs text-muted-foreground">
            Plaka, marka veya model ile arayın; satıra tıklayarak detaya gidin veya yeni araç ekleyin.
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Yeni araç
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ara: plaka, marka, model…"
          className="h-9 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Araç ara"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-8">
          <TabsTrigger value="all" className="px-2.5 text-xs">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="available" className="px-2.5 text-xs">
            Müsait
          </TabsTrigger>
          <TabsTrigger value="rented" className="px-2.5 text-xs">
            Kirada
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="px-2.5 text-xs">
            Bakım
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="glow-card">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Filo listesi</CardTitle>
          <CardDescription>
            {!ready
              ? "Yükleniyor…"
              : fleetError
                ? `Liste yüklenemedi: ${fleetError}`
                : `${filtered.length} araç gösteriliyor (${allVehicles.length} toplam)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-3 sm:px-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Sonuç yok. Aramayı veya filtreyi değiştirin.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 w-[110px] text-xs">Plaka</TableHead>
                  <TableHead className="h-9 w-[88px] text-xs">Ülke</TableHead>
                  <TableHead className="h-9 text-xs">Araç</TableHead>
                  <TableHead className="h-9 w-[64px] text-xs">Yıl</TableHead>
                  <TableHead className="h-9 w-[100px] text-xs">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ v, status }, idx) => {
                  const cc = v.countryCode?.toUpperCase();
                  const countryMeta = cc ? countryByCode.get(cc) : undefined;
                  const rowAccent = countryMeta?.colorCode ?? (cc ? "#94a3b8" : undefined);
                  return (
                    <TableRow
                      key={v.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`${v.plate} ${v.brand} ${v.model}, detay`}
                      className={`cursor-pointer text-sm hover:bg-muted/60 ${idx % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
                      onClick={() => router.push(`/vehicles/${v.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/vehicles/${v.id}`);
                        }
                      }}
                    >
                      <TableCell className="py-2 font-mono text-xs font-medium">{v.plate}</TableCell>
                      <TableCell className="py-2">
                        {cc ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-5 w-5 shrink-0 rounded border border-border/60"
                              style={{ backgroundColor: rowAccent }}
                              title={countryMeta ? `${countryMeta.name} (${cc})` : `Bilinmeyen ülke: ${cc}`}
                              aria-hidden
                            />
                            <span className="font-mono text-xs text-muted-foreground">{cc}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="font-medium">{v.brand}</span>{" "}
                        <span className="text-muted-foreground">{v.model}</span>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{v.year}</TableCell>
                      <TableCell className="py-2">{statusBadge(status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 space-y-1 border-b px-4 pb-3 pt-4 sm:px-6">
            <DialogTitle>Yeni araç</DialogTitle>
            <DialogDescription className="text-xs">
              Plaka benzersiz olmalı. Görseller base64 olarak tarayıcıda saklanır (demo); çok sayıda büyük foto kotayı
              doldurabilir.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
            <div className="grid gap-3">
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
                <div className="space-y-1">
                  <Label htmlFor="nv-external-company">Harici firma adı</Label>
                  <Input
                    id="nv-external-company"
                    value={externalCompany}
                    onChange={(e) => setExternalCompany(e.target.value)}
                    placeholder="Örn: X Rent A Car"
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="nv-default-commission">Varsayılan komisyon (opsiyonel)</Label>
                <Input
                  id="nv-default-commission"
                  type="number"
                  min={0}
                  step="0.01"
                  value={defaultCommissionAmount}
                  onChange={(e) => setDefaultCommissionAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <VehicleImageSlotsEditor value={draftImages} onChange={setDraftImages} />
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-4 py-3 sm:px-6">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button size="sm" variant="hero" onClick={submitNewVehicle}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
