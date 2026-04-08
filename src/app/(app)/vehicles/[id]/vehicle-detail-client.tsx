"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, addYears, eachDayOfInterval, format, startOfDay, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, CalendarDays, KeyRound, ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VehicleDetailListingGallery } from "@/components/vehicles/vehicle-detail-listing-gallery";
import { RentAvailabilityCalendar } from "@/components/rent-calendar/rent-availability-calendar";
import { RentCalendarLegend } from "@/components/rent-calendar/rent-calendar-legend";
import { RentalLogEntries } from "@/components/rental-logs/rental-log-entries";
import { RentalLogFiltersBar } from "@/components/rental-logs/rental-log-filters-bar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCountries } from "@/hooks/use-countries";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { getRentApiErrorMessage } from "@/lib/rent-api";
import {
  bookedDatesForVehicle,
  dateRangesOverlap,
  formatDay,
  sessionsForVehicle,
  vehicleFleetStatus,
} from "@/lib/fleet-utils";
import {
  emptyRentalLogFilters,
  filterRentalLogSessions,
  sortSessionsByLogTimeDesc,
  type RentalLogFilterValues,
} from "@/lib/rental-log-filters";
import type { RentalSession, Vehicle } from "@/lib/mock-fleet";
import { sessionCreatedAt } from "@/lib/rental-metadata";
import { mergeVehicleImagesWithDemo } from "@/lib/vehicle-images";
import { rentalCountsForCalendar } from "@/lib/rental-status";
import { cn } from "@/lib/utils";

type Props = {
  vehicle: Vehicle;
  /** Kiralamalar sayfasından `?yeniKiralama=1` ile gelindiğinde kiralama iletişim kutusunu açar */
  autoOpenNewRental?: boolean;
};

type AdditionalDriverDraft = {
  fullName: string;
  birthDate: string;
  driverLicenseNo: string;
  passportNo: string;
  driverLicenseImageDataUrl: string;
  passportImageDataUrl: string;
};

type ReportRange = "1w" | "1m" | "6m" | "1y";

function blankAdditionalDriver(): AdditionalDriverDraft {
  return {
    fullName: "",
    birthDate: "",
    driverLicenseNo: "",
    passportNo: "",
    driverLicenseImageDataUrl: "",
    passportImageDataUrl: "",
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

export function VehicleDetailClient({ vehicle, autoOpenNewRental = false }: Props) {
  const router = useRouter();
  const autoOpenedRef = useRef(false);
  const { allSessions, createRental } = useFleetSessions();
  const { countryByCode } = useCountries();
  const today = useMemo(() => new Date(), []);
  const countryMeta = useMemo(() => {
    const cc = vehicle.countryCode?.toUpperCase();
    return cc ? countryByCode.get(cc) : undefined;
  }, [vehicle.countryCode, countryByCode]);
  const status = vehicleFleetStatus(vehicle, allSessions, today);
  const booked = useMemo(() => bookedDatesForVehicle(allSessions, vehicle.id), [allSessions, vehicle.id]);
  const sessions = useMemo(() => sessionsForVehicle(allSessions, vehicle.id), [allSessions, vehicle.id]);
  const rentalLogs = useMemo(
    () => [...sessions].sort((a, b) => sessionCreatedAt(b).localeCompare(sessionCreatedAt(a))),
    [sessions],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickStart, setPickStart] = useState<string>("");
  const [pickEnd, setPickEnd] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionAmount, setCommissionAmount] = useState(vehicle.defaultCommissionAmount ? String(vehicle.defaultCommissionAmount) : "");
  const [commissionFlow, setCommissionFlow] = useState<"collect" | "pay">(vehicle.external ? "pay" : "collect");
  const [commissionCompany, setCommissionCompany] = useState(vehicle.externalCompany ?? "");
  const [additionalDrivers, setAdditionalDrivers] = useState<AdditionalDriverDraft[]>([]);
  const [logFilters, setLogFilters] = useState<RentalLogFilterValues>(emptyRentalLogFilters());
  const [reportRange, setReportRange] = useState<ReportRange>("6m");

  const filteredRentalLogs = useMemo(() => {
    return sortSessionsByLogTimeDesc(filterRentalLogSessions(rentalLogs, logFilters));
  }, [rentalLogs, logFilters]);

  const reportStats = useMemo(() => {
    const nowDay = startOfDay(today);
    const rangeMeta =
      reportRange === "1w"
        ? { daily: true, label: "son 1 hafta", rangeStart: addDays(nowDay, -6) }
        : reportRange === "1m"
          ? { daily: true, label: "son 1 ay", rangeStart: addMonths(nowDay, -1) }
          : reportRange === "1y"
            ? { daily: false, bucketCount: 12, label: "son 1 yıl", rangeStart: addYears(nowDay, -1) }
            : { daily: false, bucketCount: 6, label: "son 6 ay", rangeStart: addMonths(nowDay, -6) };

    const rangeStart = startOfDay(rangeMeta.rangeStart);
    const monthBucketCount: number = rangeMeta.daily ? 0 : (rangeMeta.bucketCount ?? 6);
    const bucketDefs = rangeMeta.daily
      ? eachDayOfInterval({ start: rangeStart, end: nowDay }).map((d) => ({
          key: format(d, "yyyy-MM-dd"),
          label: format(d, "dd MMM", { locale: tr }),
          at: d,
        }))
      : Array.from({ length: monthBucketCount }, (_, idx) => {
          const monthAnchor = startOfMonth(nowDay);
          const d = addMonths(monthAnchor, idx - (monthBucketCount - 1));
          return {
            key: format(d, "yyyy-MM"),
            label: format(d, "MMM yy", { locale: tr }),
            at: d,
          };
        });
    const filtered = sessions.filter((s) => {
      const d = startOfDay(new Date(s.createdAt ?? `${s.startDate}T00:00:00.000Z`));
      return d.getTime() >= rangeStart.getTime();
    });

    const total = filtered.length;
    const completed = filtered.filter((s) => (s.status ?? "active") === "completed").length;
    const cancelled = filtered.filter((s) => (s.status ?? "active") === "cancelled").length;
    const active = filtered.filter((s) => {
      const st = s.status ?? "active";
      return st === "active" || st === "pending";
    }).length;
    const netCommission = filtered.reduce((sum, s) => {
      const amount = Number(s.commissionAmount ?? 0);
      if (!Number.isFinite(amount)) return sum;
      const flow = s.commissionFlow ?? "collect";
      return sum + (flow === "collect" ? amount : -amount);
    }, 0);
    const buckets = new Map<string, { net: number; count: number; collect: number; pay: number }>();
    for (const s of filtered) {
      const amount = Number(s.commissionAmount ?? 0);
      if (!Number.isFinite(amount)) continue;
      const flow = s.commissionFlow ?? "collect";
      const signed = flow === "collect" ? amount : -amount;
      const sourceDate = new Date(s.createdAt ?? `${s.startDate}T00:00:00.000Z`);
      const key = rangeMeta.daily ? format(sourceDate, "yyyy-MM-dd") : format(sourceDate, "yyyy-MM");
      const prev = buckets.get(key) ?? { net: 0, count: 0, collect: 0, pay: 0 };
      buckets.set(key, {
        net: prev.net + signed,
        count: prev.count + 1,
        collect: prev.collect + (flow === "collect" ? amount : 0),
        pay: prev.pay + (flow === "pay" ? amount : 0),
      });
    }
    const monthlyRows = bucketDefs.map((b) => {
      const row = buckets.get(b.key) ?? { net: 0, count: 0, collect: 0, pay: 0 };
      return { key: b.key, label: b.label, ...row };
    });
    const maxNetAbs = Math.max(1, ...monthlyRows.map((r) => Math.abs(r.net)));
    const maxCount = Math.max(1, ...monthlyRows.map((r) => r.count));
    return {
      total,
      completed,
      cancelled,
      active,
      netCommission,
      monthlyRows,
      maxNetAbs,
      maxCount,
      rangeLabel: rangeMeta.label,
    };
  }, [sessions, today, reportRange]);

  const vehicleInfoRows = useMemo(
    () => [
      { label: "Plaka", value: <span className="font-mono font-semibold">{vehicle.plate}</span> },
      { label: "Marka", value: vehicle.brand },
      { label: "Model", value: vehicle.model },
      { label: "Model yılı", value: <span className="tabular-nums">{vehicle.year}</span> },
      {
        label: "Ülke",
        value: countryMeta ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-border/60"
              style={{ backgroundColor: countryMeta.colorCode }}
              aria-hidden
            />
            {countryMeta.name} ({countryMeta.code})
          </span>
        ) : (
          "—"
        ),
      },
      { label: "Araç kayıt no", value: <span className="font-mono text-xs">{vehicle.id}</span> },
      { label: "Bakım", value: vehicle.maintenance ? "Evet — kiralanamaz" : "Hayır" },
      { label: "Bugünkü durum", value: status === "maintenance" ? "Bakımda" : status === "rented" ? "Kirada" : "Müsait" },
      { label: "Harici araç", value: vehicle.external ? "Evet" : "Hayır" },
      { label: "Varsayılan komisyon", value: vehicle.defaultCommissionAmount != null ? `${vehicle.defaultCommissionAmount}` : "—" },
      ...(vehicle.externalCompany ? [{ label: "Harici firma", value: vehicle.externalCompany }] : []),
      { label: "Toplam kiralama", value: <span className="tabular-nums">{sessions.length} kayıt</span> },
    ],
    [vehicle, countryMeta, status, sessions.length],
  );

  const galleryImages = useMemo(() => mergeVehicleImagesWithDemo(vehicle.images, vehicle.id), [vehicle.images, vehicle.id]);

  const openForDay = useCallback(
    (day: Date) => {
      if (vehicle.maintenance) {
        toast.error("Bu araç bakımda; kiralama oluşturulamaz.");
        return;
      }
      const d = formatDay(day);
      setPickStart(d);
      setPickEnd(d);
      setCommissionAmount(vehicle.defaultCommissionAmount != null ? String(vehicle.defaultCommissionAmount) : "");
      setCommissionFlow(vehicle.external ? "pay" : "collect");
      setCommissionCompany(vehicle.externalCompany ?? "");
      setAdditionalDrivers([]);
      setDialogOpen(true);
    },
    [vehicle.maintenance, vehicle.defaultCommissionAmount, vehicle.external, vehicle.externalCompany],
  );

  useEffect(() => {
    if (!autoOpenNewRental || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    if (vehicle.maintenance) {
      toast.error("Bu araç bakımda; kiralama oluşturulamaz.");
      router.replace(`/vehicles/${vehicle.id}`, { scroll: false });
      return;
    }
    openForDay(new Date());
    router.replace(`/vehicles/${vehicle.id}`, { scroll: false });
  }, [autoOpenNewRental, vehicle.id, vehicle.maintenance, openForDay, router]);

  const updateAdditionalDriver = <K extends keyof AdditionalDriverDraft>(idx: number, key: K, value: AdditionalDriverDraft[K]) => {
    setAdditionalDrivers((prev) => prev.map((d, i) => (i === idx ? { ...d, [key]: value } : d)));
  };

  const handleDayClick = (date: Date, modifiers: Record<string, boolean>) => {
    if (vehicle.maintenance) return;
    if (modifiers.booked) {
      toast.message("Bu gün zaten dolu", { description: "Müsait bir güne tıklayın." });
      return;
    }
    openForDay(date);
  };

  const submitRental = async () => {
    const start = pickStart.trim();
    const end = pickEnd.trim();
    if (!fullName.trim() || !nationalId.trim() || !passportNo.trim() || !phone.trim()) {
      toast.error("Tüm alanları doldurun.");
      return;
    }
    if (!start || !end || end < start) {
      toast.error("Bitiş tarihi başlangıçtan önce olamaz.");
      return;
    }
    const commission = Number.parseFloat(commissionAmount.replace(",", "."));
    if (!Number.isFinite(commission) || commission <= 0) {
      toast.error("Komisyon tutarı zorunlu ve sıfırdan büyük olmalı.");
      return;
    }
    if (commissionFlow === "pay" && !commissionCompany.trim()) {
      toast.error("Komisyon ödenecek firmayı girin.");
      return;
    }
    for (const d of additionalDrivers) {
      if (
        !d.fullName.trim() ||
        !d.birthDate ||
        !d.driverLicenseNo.trim() ||
        !d.passportNo.trim() ||
        !d.driverLicenseImageDataUrl ||
        !d.passportImageDataUrl
      ) {
        toast.error("Ek sürücü alanlarının tamamını doldurun ve iki belge fotoğrafını yükleyin.");
        return;
      }
    }
    const conflict = allSessions.find(
      (s) =>
        rentalCountsForCalendar(s) &&
        s.vehicleId === vehicle.id &&
        dateRangesOverlap(start, end, s.startDate, s.endDate),
    );
    if (conflict) {
      toast.error(
        `Bu araç ${conflict.startDate} - ${conflict.endDate} arasında kirada (${conflict.customer.fullName}).`,
      );
      return;
    }
    try {
      await createRental({
        vehicleId: vehicle.id,
        startDate: start,
        endDate: end,
        customer: {
          fullName: fullName.trim(),
          nationalId: nationalId.trim(),
          passportNo: passportNo.trim(),
          phone: phone.trim(),
        },
        commissionAmount: commission,
        commissionFlow,
        commissionCompany: commissionCompany.trim() || undefined,
        additionalDrivers: additionalDrivers.map((d) => ({
          fullName: d.fullName.trim(),
          birthDate: d.birthDate,
          driverLicenseNo: d.driverLicenseNo.trim(),
          passportNo: d.passportNo.trim(),
          driverLicenseImageDataUrl: d.driverLicenseImageDataUrl,
          passportImageDataUrl: d.passportImageDataUrl,
        })),
        status: "active",
      });
      toast.success("Kiralama kaydı oluşturuldu.");
      setDialogOpen(false);
      setFullName("");
      setNationalId("");
      setPassportNo("");
      setPhone("");
      setCommissionAmount(vehicle.defaultCommissionAmount != null ? String(vehicle.defaultCommissionAmount) : "");
      setCommissionFlow(vehicle.external ? "pay" : "collect");
      setCommissionCompany(vehicle.externalCompany ?? "");
      setAdditionalDrivers([]);
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href="/vehicles">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Araçlara dön
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">Araç detayı</h1>
            <p className="text-xs text-muted-foreground">
              {vehicle.brand} {vehicle.model} · <span className="font-mono">{vehicle.plate}</span>
            </p>
          </div>
          {status === "maintenance" ? (
            <Badge variant="muted">Bakım</Badge>
          ) : status === "rented" ? (
            <Badge variant="warning">Bugün kirada</Badge>
          ) : (
            <Badge variant="success">Müsait</Badge>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 w-full shrink-0 gap-1.5 text-xs sm:w-auto"
          disabled={vehicle.maintenance}
          onClick={() => openForDay(new Date())}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Kiralama başlat
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <Card className="glow-card order-1 min-w-0 overflow-hidden">
          <CardHeader className="pb-2 pt-3 sm:pt-4">
            <CardTitle className="text-sm">Görseller</CardTitle>
            <CardDescription className="text-xs">
              İlan görünümü: ortada ana fotoğraf, altta diğer açılar. Küçük resme tıklayarak ana görseli değiştirin.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <VehicleDetailListingGallery key={vehicle.id} images={galleryImages} />
          </CardContent>
        </Card>

        <Card className="glow-card order-2 min-w-0">
          <CardHeader className="py-3 pb-2">
            <CardTitle className="text-sm">Araç bilgileri</CardTitle>
            <CardDescription className="text-xs">Plaka, marka, model ve filo durumu.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {vehicleInfoRows.map((row, idx) => (
                <div
                  key={`vehicle-info-${row.label}`}
                  className={cn(
                    "grid grid-cols-[140px_1fr] items-center gap-3 px-3 py-2 sm:grid-cols-[170px_1fr] sm:px-4",
                    idx % 2 === 0 ? "bg-muted/20" : "bg-background",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{row.label}</p>
                  <div className="text-sm font-medium">{row.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glow-card">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Operasyon sekmeleri</CardTitle>
          <CardDescription className="text-xs">Müsaitlik takvimi, rapor ve kiralama günlüğü.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs defaultValue="availability" className="w-full">
            <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto">
              <TabsTrigger value="availability" className="gap-1 text-xs">
                <CalendarDays className="h-3.5 w-3.5" />
                Müsaitlik takvimi
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Rapor
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1 text-xs">
                <ScrollText className="h-3.5 w-3.5" />
                Kiralama günlüğü
              </TabsTrigger>
            </TabsList>

            <TabsContent value="availability" className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <CardDescription className="text-xs sm:text-sm">
                  Müsait güne tıklayarak kiralama oluşturun. Dar ekranda takvim yatay kaydırılabilir.
                </CardDescription>
                {!vehicle.maintenance && (
                  <Button size="sm" variant="heroOutline" className="h-8 w-full text-xs sm:w-auto" onClick={() => openForDay(new Date())}>
                    Bugün için oluştur
                  </Button>
                )}
              </div>
              <div className="rounded-xl border border-border/70 bg-gradient-to-b from-card to-muted/20 shadow-sm">
                <RentAvailabilityCalendar
                  locale={tr}
                  booked={booked}
                  disabled={vehicle.maintenance ? () => true : undefined}
                  onDayClick={handleDayClick}
                />
                <div className="px-3 sm:px-5">
                  <RentCalendarLegend />
                </div>
              </div>
              {vehicle.maintenance && (
                <p className="text-center text-xs text-destructive sm:text-left">Bakım modunda takvim kilitli.</p>
              )}
            </TabsContent>

            <TabsContent value="report" className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Rapor dönemi</p>
                <Tabs value={reportRange} onValueChange={(v) => setReportRange(v as ReportRange)} className="w-full">
                  <TabsList className="h-8 w-full justify-start gap-1 overflow-x-auto">
                    <TabsTrigger value="1w" className="text-xs">
                      Son 1 hafta
                    </TabsTrigger>
                    <TabsTrigger value="1m" className="text-xs">
                      Son 1 ay
                    </TabsTrigger>
                    <TabsTrigger value="6m" className="text-xs">
                      Son 6 ay
                    </TabsTrigger>
                    <TabsTrigger value="1y" className="text-xs">
                      Son 1 yıl
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="h-8">
                  <TabsTrigger value="summary" className="text-xs">
                    Özet
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs">
                    Aylık trend
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">Özet veriler {reportStats.rangeLabel} için hesaplanır.</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border border-border/70 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Toplam kiralama</p>
                      <p className="mt-1 text-base font-semibold tabular-nums">{reportStats.total}</p>
                    </div>
                    <div className="rounded-md border border-border/70 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Aktif / bekleyen</p>
                      <p className="mt-1 text-base font-semibold tabular-nums">{reportStats.active}</p>
                    </div>
                    <div className="rounded-md border border-border/70 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tamamlanan</p>
                      <p className="mt-1 text-base font-semibold tabular-nums">{reportStats.completed}</p>
                    </div>
                    <div className="rounded-md border border-border/70 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">İptal</p>
                      <p className="mt-1 text-base font-semibold tabular-nums">{reportStats.cancelled}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border/70 p-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net kazanç (komisyon)</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {reportStats.netCommission.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="monthly" className="space-y-3">
                  {reportStats.monthlyRows.length === 0 ? (
                    <p className="py-4 text-xs text-muted-foreground">Henüz aylık trend gösterecek kayıt yok.</p>
                  ) : (
                    <>
                      <div className="rounded-md border border-border/70 p-3">
                        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                          Kiralama adedi ({reportStats.rangeLabel})
                        </p>
                        <div className="overflow-x-auto pb-1">
                          <div style={{ minWidth: `${Math.max(560, reportStats.monthlyRows.length * 28)}px` }}>
                            <div className="flex h-28 items-end gap-1.5">
                              {reportStats.monthlyRows.map((row) => {
                                const h = Math.max(8, Math.round((row.count / reportStats.maxCount) * 88));
                                return (
                                  <div key={`count-${row.key}`} className="flex w-6 shrink-0 flex-col items-center">
                                    <div
                                      className="w-full rounded-t bg-primary/80"
                                      style={{ height: `${h}px` }}
                                      title={`${row.label}: ${row.count} kiralama`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-2 flex gap-1.5 border-t border-border/50 pt-1">
                              {reportStats.monthlyRows.map((row, idx) => {
                                const showLabel =
                                  reportStats.monthlyRows.length <= 14 ||
                                  idx === 0 ||
                                  idx === reportStats.monthlyRows.length - 1 ||
                                  idx % 4 === 0;
                                return (
                                  <div key={`label-${row.key}`} className="flex w-6 shrink-0 justify-center">
                                    <span className="text-[9px] leading-none text-muted-foreground">
                                      {showLabel ? row.label : "·"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border border-border/70 p-3">
                        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                          Net komisyon trendi ({reportStats.rangeLabel}) (tahsilat - ödeme)
                        </p>
                        <div className="space-y-1">
                          {reportStats.monthlyRows.map((row) => {
                            const pct = Math.max(4, Math.round((Math.abs(row.net) / reportStats.maxNetAbs) * 100));
                            const positive = row.net >= 0;
                            return (
                              <div key={`net-${row.key}`} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">{row.label}</span>
                                  <span className="tabular-nums">{row.net.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="h-2 rounded bg-muted/50">
                                  <div
                                    className={cn("h-2 rounded", positive ? "bg-emerald-500" : "bg-rose-500")}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="logs" className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Müşteri özetleri:{" "}
                <Link href="/customers" className="font-medium text-primary underline-offset-2 hover:underline">
                  Customers
                </Link>
                {" · "}
                Tüm kiralamalar:{" "}
                <Link href="/logs" className="font-medium text-primary underline-offset-2 hover:underline">
                  Kiralamalar
                </Link>
              </p>
              {rentalLogs.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Henüz kiralama günlük kaydı yok.</p>
              ) : (
                <>
                  <RentalLogFiltersBar values={logFilters} onChange={setLogFilters} />
                  <RentalLogEntries sessions={filteredRentalLogs} expandableDetails />
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni kiralama</DialogTitle>
            <DialogDescription>
              {vehicle.plate} — {vehicle.brand} {vehicle.model}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="start">Başlangıç</Label>
                <Input id="start" type="date" value={pickStart} onChange={(e) => setPickStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end">Bitiş</Label>
                <Input id="end" type="date" value={pickEnd} onChange={(e) => setPickEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fn">İsim soyisim</Label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tc">Vatandaşlık no (TC)</Label>
              <Input id="tc" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pp">Pasaport no</Label>
              <Input id="pp" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tel">Cep telefonu</Label>
              <Input id="tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 …" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="commission">Komisyon tutarı (zorunlu)</Label>
              <Input
                id="commission"
                type="number"
                min={0}
                step="0.01"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="commission-flow">Komisyon yönü</Label>
              <select
                id="commission-flow"
                value={commissionFlow}
                onChange={(e) => setCommissionFlow(e.target.value as "collect" | "pay")}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="collect">Komisyon alınacak (gelir)</option>
                <option value="pay">Komisyon ödenecek (gider)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="commission-company">Komisyon firması</Label>
              <Input
                id="commission-company"
                value={commissionCompany}
                onChange={(e) => setCommissionCompany(e.target.value)}
                placeholder="Örn: X Rent A Car"
              />
            </div>
            <div className="space-y-2 rounded-md border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">Ek sürücüler</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setAdditionalDrivers((prev) => [...prev, blankAdditionalDriver()])}
                >
                  Ek sürücü ekle
                </Button>
              </div>
              {additionalDrivers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Ek sürücü yok.</p>
              ) : (
                <div className="space-y-3">
                  {additionalDrivers.map((d, idx) => (
                    <div key={`extra-driver-${idx}`} className="rounded-md border border-border/60 p-2">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium">Ek sürücü #{idx + 1}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setAdditionalDrivers((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Kaldır
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <Label>İsim soyisim</Label>
                          <Input value={d.fullName} onChange={(e) => updateAdditionalDriver(idx, "fullName", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Doğum tarihi</Label>
                          <Input type="date" value={d.birthDate} onChange={(e) => updateAdditionalDriver(idx, "birthDate", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Ehliyet no</Label>
                          <Input
                            value={d.driverLicenseNo}
                            onChange={(e) => updateAdditionalDriver(idx, "driverLicenseNo", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Pasaport no</Label>
                          <Input value={d.passportNo} onChange={(e) => updateAdditionalDriver(idx, "passportNo", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Ehliyet foto</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                updateAdditionalDriver(idx, "driverLicenseImageDataUrl", await fileToDataUrl(f));
                              } catch {
                                toast.error("Ehliyet görseli okunamadı.");
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Pasaport foto</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                updateAdditionalDriver(idx, "passportImageDataUrl", await fileToDataUrl(f));
                              } catch {
                                toast.error("Pasaport görseli okunamadı.");
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button size="sm" variant="hero" onClick={submitRental}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
