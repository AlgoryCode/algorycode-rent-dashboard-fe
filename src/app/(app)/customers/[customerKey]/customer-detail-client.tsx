"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Copy, FileImage, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { useFleetVehicles } from "@/hooks/use-fleet-vehicles";
import { buildRentalRequestMessage, buildRentalRequestUrl, normalizedPhoneForWhatsApp } from "@/lib/customer-contact";
import { findManualCustomer } from "@/lib/manual-customers";
import {
  aggregateCustomersFromSessions,
  resolveCustomerKind,
  sessionCreatedAt,
  vehiclePlate,
  type CustomerAggregateRow,
} from "@/lib/rental-metadata";
import type { RentalSession } from "@/lib/mock-fleet";
import { cn } from "@/lib/utils";

type Props = {
  customerKey: string;
};

function statusBadge(status?: string) {
  if (status === "completed") return <Badge variant="success">Tamamlandı</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">İptal</Badge>;
  if (status === "pending") return <Badge variant="warning">Beklemede</Badge>;
  return <Badge variant="secondary">Aktif</Badge>;
}

function DocumentPreview({ label, url, className }: { label: string; url?: string; className?: string }) {
  if (!url || !url.trim()) {
    return (
      <div
        className={cn(
          "flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <FileImage className="mb-2 h-8 w-8 opacity-40" aria-hidden />
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="mt-1">Yüklenmemiş</span>
      </div>
    );
  }
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border border-border/80 bg-muted/30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="max-h-72 w-full object-contain" />
      </a>
      <p className="text-[10px] text-muted-foreground">Büyük görmek için tıklayın</p>
    </div>
  );
}

function rentalHasDriverDocs(r: RentalSession) {
  return Boolean(r.customer.passportImageDataUrl?.trim() || r.customer.driverLicenseImageDataUrl?.trim());
}

export function CustomerDetailClient({ customerKey }: Props) {
  const { allSessions } = useFleetSessions();
  const { allVehicles } = useFleetVehicles();

  const decodedKey = useMemo(() => {
    try {
      return decodeURIComponent(customerKey);
    } catch {
      return customerKey;
    }
  }, [customerKey]);

  const row = useMemo((): CustomerAggregateRow | null => {
    if (decodedKey.startsWith("manual:")) {
      const m = findManualCustomer(decodedKey);
      if (!m) return null;
      return {
        key: m.key,
        customer: m.customer,
        rentals: [],
        totalRentals: 0,
        lastActivity: m.createdAt,
      };
    }
    const rows = aggregateCustomersFromSessions(allSessions);
    return rows.find((r) => r.key === decodedKey) ?? null;
  }, [allSessions, decodedKey]);

  const vehiclesById = useMemo(() => new Map(allVehicles.map((v) => [v.id, v])), [allVehicles]);

  const rentalRequestUrl = useMemo(() => {
    if (!row) return "";
    if (typeof window === "undefined") return "/rental-request-form";
    return buildRentalRequestUrl(window.location.origin, row.customer);
  }, [row]);

  const copyLink = async () => {
    if (!row || !rentalRequestUrl) return;
    try {
      await navigator.clipboard.writeText(rentalRequestUrl);
      toast.success("Talep formu bağlantısı kopyalandı.");
    } catch {
      toast.error("Bağlantı kopyalanamadı.");
    }
  };

  const sendMail = () => {
    if (!row || !row.customer.email) {
      toast.error("Müşteri e-posta adresi yok.");
      return;
    }
    const subject = encodeURIComponent("Kiralama talep formu bağlantınız");
    const body = encodeURIComponent(buildRentalRequestMessage(row.customer.fullName, rentalRequestUrl));
    window.location.href = `mailto:${encodeURIComponent(row.customer.email)}?subject=${subject}&body=${body}`;
  };

  const sendWhatsApp = () => {
    if (!row) return;
    const phone = normalizedPhoneForWhatsApp(row.customer.phone);
    if (!phone) {
      toast.error("WhatsApp için geçerli telefon bulunamadı.");
      return;
    }
    const text = encodeURIComponent(buildRentalRequestMessage(row.customer.fullName, rentalRequestUrl));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  if (!row) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card className="glow-card">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Müşteri kaydı bulunamadı. Listeyi yenileyip tekrar deneyin.
          </CardContent>
        </Card>
      </div>
    );
  }

  const passport = row.customer.passportImageDataUrl?.trim();
  const license = row.customer.driverLicenseImageDataUrl?.trim();
  const hasAnyMergedDoc = Boolean(passport || license);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Card className="glow-card">
        <CardHeader className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{row.customer.fullName}</CardTitle>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {resolveCustomerKind(row.customer) === "corporate" ? "Kurumsal" : "Bireysel"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {row.totalRentals === 0 && row.key.startsWith("manual:")
              ? "Manuel eklenen müşteri — kiralama geçmişi yok."
              : "Bilgiler, belgeler ve kiralama geçmişi"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-4 grid h-auto w-full grid-cols-3 gap-1 sm:inline-flex sm:w-auto">
              <TabsTrigger value="info" className="text-xs">
                Bilgiler
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">
                Belgeler
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                Kiralama geçmişi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-2 text-xs outline-none">
              <p>
                <span className="text-muted-foreground">TC:</span> {row.customer.nationalId || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Pasaport:</span> {row.customer.passportNo || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Telefon:</span> {row.customer.phone || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">E-posta:</span> {row.customer.email || "—"}
              </p>
              <div className="grid gap-2 pt-2 sm:grid-cols-3">
                <Button className="h-8 gap-1.5 text-xs" onClick={sendMail}>
                  <Mail className="h-3.5 w-3.5" />
                  Mail ile ilet
                </Button>
                <Button className="h-8 gap-1.5 text-xs" variant="secondary" onClick={sendWhatsApp}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp ile ilet
                </Button>
                <Button className="h-8 gap-1.5 text-xs" variant="outline" onClick={() => void copyLink()}>
                  <Copy className="h-3.5 w-3.5" />
                  Link kopyala
                </Button>
              </div>
              <p className="break-all rounded-md border border-border/70 bg-muted/30 px-2 py-1 font-mono text-[11px]">
                {rentalRequestUrl}
              </p>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6 outline-none">
              <div>
                <h3 className="mb-2 text-sm font-medium">Sürücü belgeleri (özet)</h3>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  {row.rentals.length > 0
                    ? "Aşağıdaki görseller, kiralama kayıtlarından birleştirilmiş en güncel pasaport ve ehliyet yüklemeleridir."
                    : "Manuel müşteri — yalnızca kayıtta saklanan belge görselleri."}
                </p>
                {!hasAnyMergedDoc && (
                  <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    Bu müşteri için henüz pasaport veya ehliyet fotoğrafı yok. Kiralama oluştururken yüklenen belgeler burada
                    görünür.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <DocumentPreview label="Pasaport" url={passport} />
                  <DocumentPreview label="Ehliyet" url={license} />
                </div>
              </div>

              {row.rentals.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Kiralama kayıtlarına göre</h3>
                  <div className="space-y-4">
                    {row.rentals.map((r) => (
                      <div key={r.id} className="rounded-lg border border-border/70 bg-muted/10 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium">
                            {vehiclePlate(vehiclesById, r.vehicleId)} · {r.startDate} → {r.endDate}
                          </p>
                          {statusBadge(r.status)}
                        </div>
                        <p className="mb-3 text-[10px] text-muted-foreground">
                          Kayıt: {format(parseISO(sessionCreatedAt(r)), "d MMM yyyy HH:mm", { locale: tr })}
                        </p>
                        {!rentalHasDriverDocs(r) ? (
                          <p className="text-[11px] text-muted-foreground">Bu kiralamada belge görseli yok.</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <DocumentPreview
                              label="Pasaport (bu kiralama)"
                              url={r.customer.passportImageDataUrl?.trim()}
                            />
                            <DocumentPreview
                              label="Ehliyet (bu kiralama)"
                              url={r.customer.driverLicenseImageDataUrl?.trim()}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="outline-none">
              <p className="mb-3 text-[11px] text-muted-foreground">{row.rentals.length} kayıt</p>
              {row.rentals.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Henüz kiralama kaydı yok.</p>
              ) : (
                <div className="space-y-2">
                  {row.rentals.map((r) => (
                    <div key={r.id} className="rounded-md border border-border/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          <Link
                            href={`/rentals/${r.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {vehiclePlate(vehiclesById, r.vehicleId)}
                          </Link>
                          <span className="text-muted-foreground">
                            {" "}
                            · {r.startDate} → {r.endDate}
                          </span>
                        </p>
                        {statusBadge(r.status)}
                      </div>
                      <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>Kayıt: {format(parseISO(sessionCreatedAt(r)), "d MMM yyyy HH:mm", { locale: tr })}</p>
                        <p>
                          Komisyon:{" "}
                          {r.commissionAmount != null ? `${r.commissionAmount} (${r.commissionFlow ?? "-"})` : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
