"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, FileText, Mail, MessageCircle, Send, UserRoundSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CustomerPickerDialog } from "@/components/customers/customer-picker-dialog";
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
import { useCustomerDirectoryRows } from "@/hooks/use-customer-directory-rows";
import { useFleetSessions } from "@/hooks/use-fleet-sessions";
import {
  buildEmptyTalepFormMessage,
  buildEmptyTalepFormUrl,
  buildGenericTalepFormInviteMessage,
  normalizedPhoneForWhatsApp,
} from "@/lib/customer-contact";
import { rentKeys } from "@/lib/rent-query-keys";
import type { CustomerAggregateRow } from "@/lib/rental-metadata";
import {
  fetchRentalRequestContractPdfBlob,
  fetchRentalRequestsFromRentApi,
  generateRentalRequestContractOnRentApi,
  getRentApiErrorMessage,
  updateRentalRequestStatusOnRentApi,
  type RentalRequestDto,
  type RentalRequestStatus,
} from "@/lib/rent-api";

function statusBadge(s: RentalRequestStatus) {
  if (s === "approved") return <Badge variant="success">Onaylandı</Badge>;
  if (s === "rejected") return <Badge variant="destructive">Reddedildi</Badge>;
  return <Badge variant="warning">Beklemede</Badge>;
}

/** Sunucu alanı yoksa (eski API): onaylı ve PDF yoksa oluşturmaya izin ver. */
function canShowGenerateContract(row: RentalRequestDto): boolean {
  if (row.status !== "approved") return false;
  if (Boolean(row.contractPdfPath?.trim())) return false;
  return row.contractGenerationAvailable !== false;
}

type SendWizardStep =
  | "source"
  | "external-channel"
  | "external-wa"
  | "external-mail"
  | "directory-channel"
  | "directory-wa"
  | "directory-mail";

export function RequestsClient() {
  const qc = useQueryClient();
  const { allSessions } = useFleetSessions();
  const directoryRows = useCustomerDirectoryRows(allSessions);

  const [statusMessage, setStatusMessage] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendWizardStep, setSendWizardStep] = useState<SendWizardStep>("source");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAggregateRow | null>(null);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [externalEmail, setExternalEmail] = useState("");

  const { data = [], isPending, error } = useQuery({
    queryKey: rentKeys.rentalRequests(),
    queryFn: fetchRentalRequestsFromRentApi,
  });

  const rows = useMemo(
    () =>
      [...data].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }),
    [data],
  );

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      message,
    }: {
      id: string;
      status: RentalRequestStatus;
      message?: string;
    }) => updateRentalRequestStatusOnRentApi(id, status, message),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: rentKeys.rentalRequests() });
      toast.success("Talep durumu güncellendi.");
    },
    onError: (e) => {
      toast.error(getRentApiErrorMessage(e));
    },
  });

  const generateContractMutation = useMutation({
    mutationFn: (id: string) => generateRentalRequestContractOnRentApi(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: rentKeys.rentalRequests() });
      toast.success("Sözleşme PDF oluşturuldu; indirebilirsiniz.");
    },
    onError: (e) => {
      toast.error(getRentApiErrorMessage(e));
    },
  });

  const downloadContractMutation = useMutation({
    mutationFn: async ({ id, referenceNo }: { id: string; referenceNo: string }) => {
      const blob = await fetchRentalRequestContractPdfBlob(id);
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `sozlesme_${referenceNo.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    onSuccess: () => {
      toast.success("PDF indirildi.");
    },
    onError: (e) => {
      toast.error(getRentApiErrorMessage(e));
    },
  });

  const loadError = error ? getRentApiErrorMessage(error) : null;

  const resetSendDialog = () => {
    setPickerOpen(false);
    setSelectedCustomer(null);
    setSendWizardStep("source");
    setWhatsappInput("");
    setEmailInput("");
    setExternalPhone("");
    setExternalEmail("");
  };

  const openSendDialog = () => {
    resetSendDialog();
    setSendDialogOpen(true);
  };

  useEffect(() => {
    if (selectedCustomer) {
      setWhatsappInput(selectedCustomer.customer.phone?.trim() || "");
      setEmailInput(selectedCustomer.customer.email?.trim() || "");
    }
  }, [selectedCustomer]);

  const applyStatus = async (row: RentalRequestDto, status: RentalRequestStatus) => {
    await updateMutation.mutateAsync({
      id: row.id,
      status,
      message: statusMessage.trim() || undefined,
    });
  };

  const emptyFormUrl = () => buildEmptyTalepFormUrl(typeof window !== "undefined" ? window.location.origin : "");

  const sendGuidedWhatsApp = () => {
    if (!selectedCustomer) return;
    const url = emptyFormUrl();
    if (!url) return;
    const text = buildEmptyTalepFormMessage(selectedCustomer.customer.fullName, url);
    const phone = normalizedPhoneForWhatsApp(whatsappInput);
    if (!phone) {
      toast.error("WhatsApp için geçerli telefon girin.");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp açıldı.");
    setSendDialogOpen(false);
  };

  const sendGuidedMail = () => {
    if (!selectedCustomer) return;
    const url = emptyFormUrl();
    if (!url) return;
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      toast.error("Geçerli e-posta girin.");
      return;
    }
    const subject = encodeURIComponent("Kiralama talep formu");
    const body = encodeURIComponent(buildEmptyTalepFormMessage(selectedCustomer.customer.fullName, url));
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    setSendDialogOpen(false);
  };

  const sendGenericFormInviteWhatsApp = () => {
    const url = emptyFormUrl();
    if (!url) return;
    const text = buildGenericTalepFormInviteMessage(url);
    const phone = normalizedPhoneForWhatsApp(externalPhone);
    if (!phone) {
      toast.error("WhatsApp için geçerli telefon girin.");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp penceresi açıldı.");
    setSendDialogOpen(false);
  };

  const sendGenericFormInviteMail = () => {
    const url = emptyFormUrl();
    if (!url) return;
    const email = externalEmail.trim();
    if (!email || !email.includes("@")) {
      toast.error("Geçerli e-posta girin.");
      return;
    }
    const subject = encodeURIComponent("Kiralama talep formu");
    const body = encodeURIComponent(buildGenericTalepFormInviteMessage(url));
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    setSendDialogOpen(false);
  };

  const copyEmptyFormLink = async (row: RentalRequestDto) => {
    const url = emptyFormUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Boş talep formu bağlantısı kopyalandı.");
    } catch {
      toast.error("Bağlantı kopyalanamadı.");
    }
  };

  const sendEmptyFormMail = (row: RentalRequestDto) => {
    if (!row.customer.email?.trim()) {
      toast.error("Müşteri e-posta adresi yok.");
      return;
    }
    const url = emptyFormUrl();
    if (!url) return;
    const subject = encodeURIComponent("Kiralama talep formu");
    const body = encodeURIComponent(buildEmptyTalepFormMessage(row.customer.fullName, url));
    window.location.href = `mailto:${encodeURIComponent(row.customer.email)}?subject=${subject}&body=${body}`;
  };

  const sendEmptyFormWhatsApp = (row: RentalRequestDto) => {
    const phone = normalizedPhoneForWhatsApp(row.customer.phone);
    if (!phone) {
      toast.error("WhatsApp için geçerli telefon bulunamadı.");
      return;
    }
    const url = emptyFormUrl();
    if (!url) return;
    const text = encodeURIComponent(buildEmptyTalepFormMessage(row.customer.fullName, url));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <CustomerPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        rows={directoryRows}
        title="Talep formunu kime göndereceksiniz?"
        description="Kiralama geçmişinden veya yerel rehberden müşteri seçin."
        onPick={(row) => {
          setSelectedCustomer(row);
          setSendWizardStep("directory-channel");
          setPickerOpen(false);
        }}
      />

      <Dialog
        open={sendDialogOpen}
        onOpenChange={(open) => {
          setSendDialogOpen(open);
          if (!open) resetSendDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Gönder</DialogTitle>
            <DialogDescription className="text-xs">
              {sendWizardStep === "source" &&
                "Müşteriyi rehberden seçin veya rehberde yoksa WhatsApp veya e-posta ile boş form bağlantısını paylaşın."}
              {sendWizardStep === "external-channel" && "Rehberde kayıt yok; formu hangi kanalla ileteceksiniz?"}
              {sendWizardStep === "external-wa" && "Alıcının WhatsApp numarasını girin."}
              {sendWizardStep === "external-mail" && "Alıcının e-posta adresini girin."}
              {sendWizardStep === "directory-channel" && "Seçili müşteriye formu nasıl göndereceksiniz?"}
              {sendWizardStep === "directory-wa" && "WhatsApp numarasını kontrol edin veya düzenleyin."}
              {sendWizardStep === "directory-mail" && "E-posta adresini kontrol edin veya düzenleyin."}
            </DialogDescription>
          </DialogHeader>

          {sendWizardStep === "source" && (
            <div className="space-y-3">
              <Button type="button" className="h-11 w-full gap-2 text-sm" onClick={() => setPickerOpen(true)}>
                <UserRoundSearch className="h-4 w-4" />
                Rehberden seç
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full text-sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setSendWizardStep("external-channel");
                }}
              >
                Rehberde yok
              </Button>
            </div>
          )}

          {sendWizardStep === "external-channel" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="h-auto flex-col gap-2 py-4 text-xs"
                  onClick={() => setSendWizardStep("external-wa")}
                >
                  <MessageCircle className="h-6 w-6" />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-auto flex-col gap-2 py-4 text-xs"
                  onClick={() => setSendWizardStep("external-mail")}
                >
                  <Mail className="h-6 w-6" />
                  E-posta
                </Button>
              </div>
            </div>
          )}

          {sendWizardStep === "external-wa" && (
            <div className="space-y-2">
              <Label className="text-xs">Telefon</Label>
              <Input
                className="h-9 text-sm"
                value={externalPhone}
                onChange={(e) => setExternalPhone(e.target.value)}
                placeholder="+90 5xx..."
              />
            </div>
          )}

          {sendWizardStep === "external-mail" && (
            <div className="space-y-2">
              <Label className="text-xs">E-posta</Label>
              <Input
                className="h-9 text-sm"
                type="email"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
          )}

          {sendWizardStep === "directory-channel" && selectedCustomer && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
                <p className="font-medium text-foreground">{selectedCustomer.customer.fullName}</p>
                <p className="mt-1 text-muted-foreground">Seçili müşteri</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="h-auto flex-col gap-2 py-4 text-xs"
                  onClick={() => setSendWizardStep("directory-wa")}
                >
                  <MessageCircle className="h-6 w-6" />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-auto flex-col gap-2 py-4 text-xs"
                  onClick={() => setSendWizardStep("directory-mail")}
                >
                  <Mail className="h-6 w-6" />
                  E-posta
                </Button>
              </div>
            </div>
          )}

          {sendWizardStep === "directory-wa" && selectedCustomer && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{selectedCustomer.customer.fullName}</span>
              </p>
              <Label className="text-xs">WhatsApp telefonu</Label>
              <Input
                className="h-9 text-sm"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="+90 5xx..."
              />
            </div>
          )}

          {sendWizardStep === "directory-mail" && selectedCustomer && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{selectedCustomer.customer.fullName}</span>
              </p>
              <Label className="text-xs">E-posta</Label>
              <Input
                className="h-9 text-sm"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
          )}

          {sendWizardStep !== "source" && (
            <DialogFooter className="mt-1 flex flex-col gap-2 sm:flex-col">
            {sendWizardStep === "external-channel" && (
              <Button type="button" variant="outline" size="sm" className="h-9 w-full text-xs" onClick={() => setSendWizardStep("source")}>
                Geri
              </Button>
            )}

            {sendWizardStep === "external-wa" && (
              <div className="flex w-full flex-col gap-2">
                <Button type="button" size="sm" className="h-10 w-full gap-2 text-sm font-medium" onClick={sendGenericFormInviteWhatsApp}>
                  <Send className="h-4 w-4" />
                  Gönder
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSendWizardStep("external-channel")}
                >
                  Geri
                </Button>
              </div>
            )}

            {sendWizardStep === "external-mail" && (
              <div className="flex w-full flex-col gap-2">
                <Button type="button" size="sm" className="h-10 w-full gap-2 text-sm font-medium" onClick={sendGenericFormInviteMail}>
                  <Send className="h-4 w-4" />
                  Gönder
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSendWizardStep("external-channel")}
                >
                  Geri
                </Button>
              </div>
            )}

            {sendWizardStep === "directory-channel" && (
              <div className="flex w-full flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full text-xs"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSendWizardStep("source");
                  }}
                >
                  Başka müşteri
                </Button>
              </div>
            )}

            {sendWizardStep === "directory-wa" && (
              <div className="flex w-full flex-col gap-2">
                <Button type="button" size="sm" className="h-10 w-full gap-2 text-sm font-medium" onClick={sendGuidedWhatsApp}>
                  <Send className="h-4 w-4" />
                  Gönder
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSendWizardStep("directory-channel")}
                >
                  Geri
                </Button>
              </div>
            )}

            {sendWizardStep === "directory-mail" && (
              <div className="flex w-full flex-col gap-2">
                <Button type="button" size="sm" className="h-10 w-full gap-2 text-sm font-medium" onClick={sendGuidedMail}>
                  <Send className="h-4 w-4" />
                  Gönder
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSendWizardStep("directory-channel")}
                >
                  Geri
                </Button>
              </div>
            )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Kiralama talepleri</h1>
        <p className="text-xs text-muted-foreground">
          Müşteri taleplerini referans numarasıyla takip edin, onaylayın veya reddedin.
        </p>
      </header>

      <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.07] to-cyan-500/10 shadow-sm">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold tracking-tight">Talep formunu paylaş</p>
            <p className="text-xs text-muted-foreground">
              Boş kiralama talep formu bağlantısını müşteriye iletin: rehberden seçin veya rehberde yoksa WhatsApp / e-posta ile gönderin.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-10 w-full shrink-0 gap-2 px-4 text-xs font-medium shadow-sm sm:h-9 sm:w-auto"
            onClick={openSendDialog}
          >
            <Send className="h-3.5 w-3.5" />
            Gönder
          </Button>
        </CardContent>
      </Card>

      <Card className="glow-card">
        <CardHeader className="space-y-1 py-3">
          <CardTitle className="text-sm">Durum notu (opsiyonel)</CardTitle>
          <CardDescription className="text-xs">
            Durum değişiminde bu not müşteriye bildirimde iletilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Label htmlFor="request-status-message" className="sr-only">
            Durum notu
          </Label>
          <Input
            id="request-status-message"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="Örn: Sözleşmeniz onaylandı, teslim saati için WhatsApp kontrol edin."
          />
        </CardContent>
      </Card>

      <Card className="glow-card">
        <CardHeader className="space-y-1 py-3">
          <CardTitle className="text-sm">Talep listesi</CardTitle>
          <CardDescription className="text-xs">
            {isPending ? "Yükleniyor..." : loadError ? loadError : `${rows.length} talep`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Kayıt bulunamadı.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="rounded-md border border-border/70 bg-background p-3 transition-colors hover:bg-muted/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{row.customer.fullName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{row.referenceNo}</p>
                    </div>
                    <div>{statusBadge(row.status)}</div>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      Tarih: {row.startDate} → {row.endDate}
                    </p>
                    <p>Telefon: {row.customer.phone}</p>
                    <p>E-posta: {row.customer.email}</p>
                    <p>Yeşil sigorta: {row.greenInsuranceFee}</p>
                    {row.statusMessage && <p className="sm:col-span-2">Not: {row.statusMessage}</p>}
                    {row.contractPdfPath && (
                      <p className="sm:col-span-2 break-all font-mono text-[10px] opacity-80">
                        Sözleşme PDF: {row.contractPdfPath}
                      </p>
                    )}
                    {row.whatsappContractSentAt && (
                      <p className="sm:col-span-2 text-xs text-emerald-600 dark:text-emerald-400">
                        Yönetici WhatsApp (PDF bildirimi):{" "}
                        {new Date(row.whatsappContractSentAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}{" "}
                        — gönderim denemesi tamamlandı
                      </p>
                    )}
                    {row.whatsappContractError && (
                      <p className="sm:col-span-2 text-xs text-destructive">WhatsApp / PDF iletim: {row.whatsappContractError}</p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {canShowGenerateContract(row) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-1 text-xs"
                        disabled={generateContractMutation.isPending}
                        onClick={() => void generateContractMutation.mutateAsync(row.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Sözleşme oluştur
                      </Button>
                    )}
                    {Boolean(row.contractPdfPath?.trim()) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs"
                        disabled={downloadContractMutation.isPending}
                        onClick={() =>
                          void downloadContractMutation.mutateAsync({ id: row.id, referenceNo: row.referenceNo })
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF indir
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      disabled={updateMutation.isPending || row.status === "approved"}
                      onClick={() => void applyStatus(row, "approved")}
                    >
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      disabled={updateMutation.isPending || row.status === "rejected"}
                      onClick={() => void applyStatus(row, "rejected")}
                    >
                      Reddet
                    </Button>
                    <span className="hidden h-4 w-px bg-border sm:inline" aria-hidden />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                      onClick={() => void copyEmptyFormLink(row)}
                      title="Ön doldurmasız form bağlantısını kopyala"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Bağlantı
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 gap-1 text-xs"
                      onClick={() => sendEmptyFormMail(row)}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Form e-posta
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 gap-1 text-xs"
                      onClick={() => sendEmptyFormWhatsApp(row)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Form WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
