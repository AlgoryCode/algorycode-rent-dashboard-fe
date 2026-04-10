"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Building2, Plus, Search, User, Users } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import { addManualCustomer, loadManualCustomerRows, mergeSessionAndManualCustomers } from "@/lib/manual-customers";
import type { CustomerKind } from "@/lib/mock-fleet";
import { aggregateCustomersFromSessions, resolveCustomerKind } from "@/lib/rental-metadata";
import { cn } from "@/lib/utils";

type KindTab = "all" | CustomerKind;

const defaultNewForm = {
  fullName: "",
  phone: "",
  email: "",
  nationalId: "",
  passportNo: "",
  birthDate: "",
  driverLicenseNo: "",
  kind: "individual" as CustomerKind,
};

export function CustomersClient() {
  const router = useRouter();
  const { allSessions } = useFleetSessions();
  const [query, setQuery] = useState("");
  const [kindTab, setKindTab] = useState<KindTab>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [manualTick, setManualTick] = useState(0);
  const [nf, setNf] = useState(defaultNewForm);

  const rows = useMemo(() => {
    void manualTick;
    const sessionRows = aggregateCustomersFromSessions(allSessions);
    const manualRows = loadManualCustomerRows();
    return mergeSessionAndManualCustomers(sessionRows, manualRows);
  }, [allSessions, manualTick]);

  const rowsByKind = useMemo(() => {
    if (kindTab === "all") return rows;
    return rows.filter((r) => resolveCustomerKind(r.customer) === kindTab);
  }, [rows, kindTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rowsByKind;
    return rowsByKind.filter(
      ({ customer: c }) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.nationalId ?? "").toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.passportNo.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [rowsByKind, query]);

  const submitNewCustomer = () => {
    if (!nf.fullName.trim() || !nf.phone.trim()) {
      toast.error("Ad soyad ve telefon zorunludur.");
      return;
    }
    addManualCustomer({
      fullName: nf.fullName.trim(),
      phone: nf.phone.trim(),
      email: nf.email.trim() || undefined,
      nationalId: nf.nationalId.trim() || "",
      passportNo: nf.passportNo.trim() || "",
      birthDate: nf.birthDate.trim() || undefined,
      driverLicenseNo: nf.driverLicenseNo.trim() || undefined,
      kind: nf.kind,
    });
    toast.success("Müşteri eklendi.");
    setNewOpen(false);
    setNf({ ...defaultNewForm });
    setManualTick((t) => t + 1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Users className="h-5 w-5 text-primary" />
          Müşteriler
        </h1>
        <p className="text-xs text-muted-foreground">
          Kiralama geçmişinden türetilen kayıtlar ve manuel eklenenler. Bireysel / kurumsal sekmeleriyle süzün.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setNewOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Yeni müşteri
        </Button>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Yeni müşteri</DialogTitle>
            <DialogDescription className="text-xs">
              Manuel kayıt tarayıcıda saklanır; tür seçerek bireysel veya kurumsal olarak ekleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Müşteri türü</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNf((s) => ({ ...s, kind: "individual" }))}
                  className={cn(
                    "flex min-h-[3.25rem] items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    nf.kind === "individual"
                      ? "border-emerald-500/50 bg-emerald-500/10 dark:border-emerald-400/40"
                      : "border-border/80 bg-muted/15 hover:bg-muted/30",
                  )}
                >
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Bireysel
                </button>
                <button
                  type="button"
                  onClick={() => setNf((s) => ({ ...s, kind: "corporate" }))}
                  className={cn(
                    "flex min-h-[3.25rem] items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    nf.kind === "corporate"
                      ? "border-emerald-500/50 bg-emerald-500/10 dark:border-emerald-400/40"
                      : "border-border/80 bg-muted/15 hover:bg-muted/30",
                  )}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Kurumsal
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{nf.kind === "corporate" ? "Firma / unvan *" : "Ad soyad *"}</Label>
                <Input
                  className="h-9 text-sm"
                  value={nf.fullName}
                  onChange={(e) => setNf((s) => ({ ...s, fullName: e.target.value }))}
                  placeholder={nf.kind === "corporate" ? "Örn: ABC Lojistik A.Ş." : "Ad Soyad"}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefon *</Label>
                <Input className="h-9 text-sm" value={nf.phone} onChange={(e) => setNf((s) => ({ ...s, phone: e.target.value }))} placeholder="+90 …" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">E-posta</Label>
                <Input className="h-9 text-sm" type="email" value={nf.email} onChange={(e) => setNf((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">TC / kimlik no</Label>
                <Input className="h-9 text-sm" value={nf.nationalId} onChange={(e) => setNf((s) => ({ ...s, nationalId: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pasaport no</Label>
                <Input className="h-9 text-sm" value={nf.passportNo} onChange={(e) => setNf((s) => ({ ...s, passportNo: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Doğum tarihi</Label>
                <Input className="h-9 text-sm" type="date" value={nf.birthDate} onChange={(e) => setNf((s) => ({ ...s, birthDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ehliyet no</Label>
                <Input className="h-9 text-sm" value={nf.driverLicenseNo} onChange={(e) => setNf((s) => ({ ...s, driverLicenseNo: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" className="h-9 text-xs" onClick={() => setNewOpen(false)}>
              Vazgeç
            </Button>
            <Button type="button" size="sm" className="h-9 text-xs" onClick={submitNewCustomer}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={kindTab} onValueChange={(v) => setKindTab(v as KindTab)} className="w-full">
        <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto sm:w-auto">
          <TabsTrigger value="all" className="text-xs">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-1 text-xs">
            <User className="h-3.5 w-3.5" />
            Bireysel
          </TabsTrigger>
          <TabsTrigger value="corporate" className="gap-1 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Kurumsal
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-3 space-y-3">
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
                {filtered.length} kayıt · toplam {rowsByKind.length} satır (sekme:{" "}
                {kindTab === "all" ? "tümü" : kindTab === "individual" ? "bireysel" : "kurumsal"})
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-3 sm:px-4">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Sonuç yok.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-9 w-[76px] text-xs">Tür</TableHead>
                      <TableHead className="h-9 text-xs">İsim</TableHead>
                      <TableHead className="hidden h-9 w-[120px] text-xs sm:table-cell">TC</TableHead>
                      <TableHead className="hidden h-9 text-xs md:table-cell">Telefon</TableHead>
                      <TableHead className="h-9 w-[52px] text-center text-xs">Kira</TableHead>
                      <TableHead className="hidden h-9 w-[130px] text-xs lg:table-cell">Son işlem</TableHead>
                      <TableHead className="h-9 w-[110px] text-right text-xs">Detay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => {
                      const k = resolveCustomerKind(row.customer);
                      return (
                        <TableRow
                          key={row.key}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer bg-background transition-colors hover:bg-muted/40"
                          onClick={() => router.push(`/customers/${encodeURIComponent(row.key)}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/customers/${encodeURIComponent(row.key)}`);
                            }
                          }}
                        >
                          <TableCell className="py-2">
                            <Badge variant={k === "corporate" ? "secondary" : "outline"} className="text-[10px]">
                              {k === "corporate" ? "Kurumsal" : "Bireysel"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-sm font-medium">{row.customer.fullName}</TableCell>
                          <TableCell className="hidden py-2 font-mono text-xs sm:table-cell">{row.customer.nationalId || "—"}</TableCell>
                          <TableCell className="hidden py-2 text-xs md:table-cell">{row.customer.phone}</TableCell>
                          <TableCell className="py-2 text-center">
                            <Badge variant="secondary" className="tabular-nums">
                              {row.totalRentals}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden py-2 text-xs text-muted-foreground lg:table-cell">
                            {format(parseISO(row.lastActivity), "d MMM yyyy HH:mm", { locale: tr })}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/customers/${encodeURIComponent(row.key)}`);
                              }}
                            >
                              Detay
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
