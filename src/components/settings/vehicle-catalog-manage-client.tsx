"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createVehicleCatalogEntryOnRentApi,
  deleteVehicleCatalogEntryOnRentApi,
  fetchVehicleCatalogFromRentApi,
  getRentApiErrorMessage,
  updateVehicleCatalogEntryOnRentApi,
  type VehicleCatalogKind,
  type VehicleCatalogRow,
} from "@/lib/rent-api";

const TAB_META: { value: VehicleCatalogKind; label: string; hint: string }[] = [
  {
    value: "bodyStyle",
    label: "Araç türü",
    hint: "Sedan, SUV vb. Kodlar büyük harfe normalize edilir (örn. SUV).",
  },
  {
    value: "fuelType",
    label: "Yakıt",
    hint: "Benzin, dizel vb. Kodlar küçük harfe normalize edilir (örn. benzin).",
  },
  {
    value: "transmissionType",
    label: "Vites",
    hint: "Otomatik, manuel vb. Kodlar küçük harfe normalize edilir.",
  },
];

type FormState = { code: string; labelTr: string; sortOrder: string };

const emptyForm = (): FormState => ({ code: "", labelTr: "", sortOrder: "0" });

export function VehicleCatalogManageClient() {
  const [tab, setTab] = useState<VehicleCatalogKind>("bodyStyle");
  const [rows, setRows] = useState<VehicleCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (kind: VehicleCatalogKind) => {
    setRows([]);
    setLoading(true);
    try {
      const list = await fetchVehicleCatalogFromRentApi(kind);
      setRows(list);
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  const startCreate = () => {
    setEditingCode("new");
    setForm(emptyForm());
  };

  const startEdit = (row: VehicleCatalogRow) => {
    setEditingCode(row.code);
    setForm({
      code: row.code,
      labelTr: row.labelTr,
      sortOrder: String(row.sortOrder ?? 0),
    });
  };

  const cancelForm = () => {
    setEditingCode(null);
    setForm(emptyForm());
  };

  const submitForm = async () => {
    const labelTr = form.labelTr.trim();
    if (!labelTr) {
      toast.error("Türkçe etiket zorunludur.");
      return;
    }
    const sortOrder = Number.parseInt(form.sortOrder, 10);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      toast.error("Sıra 0 veya üzeri bir tam sayı olmalıdır.");
      return;
    }
    setSaving(true);
    try {
      if (editingCode === "new") {
        const code = form.code.trim();
        if (!code) {
          toast.error("Kod zorunludur.");
          setSaving(false);
          return;
        }
        await createVehicleCatalogEntryOnRentApi(tab, { code, labelTr, sortOrder });
        toast.success("Kayıt oluşturuldu.");
      } else if (editingCode) {
        await updateVehicleCatalogEntryOnRentApi(tab, editingCode, { labelTr, sortOrder });
        toast.success("Güncellendi.");
      }
      cancelForm();
      await load(tab);
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (code: string) => {
    if (!window.confirm(`“${code}” silinsin mi? Araçlarda kullanılıyorsa sunucu reddeder.`)) {
      return;
    }
    try {
      await deleteVehicleCatalogEntryOnRentApi(tab, code);
      toast.success("Silindi.");
      await load(tab);
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Araç özellikleri kataloğu</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Araç eklerken seçilen <span className="font-medium text-foreground">yakıt</span>,{" "}
          <span className="font-medium text-foreground">vites</span> ve{" "}
          <span className="font-medium text-foreground">araç türü</span> listeleri buradan yönetilir. Silme, ilgili kodu
          kullanan silinmemiş araç varsa engellenir.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as VehicleCatalogKind);
          cancelForm();
        }}
        className="w-full"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          {TAB_META.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_META.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-3 space-y-4">
            {tab === t.value ? (
              <>
                <p className="text-[11px] text-muted-foreground">{t.hint}</p>

                {editingCode ? (
                  <Card className="glow-card border-primary/25">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">{editingCode === "new" ? "Yeni kayıt" : "Düzenle"}</CardTitle>
                      <CardDescription className="text-xs">
                        {editingCode === "new"
                          ? "Kod benzersiz olmalı; yalnız harf, rakam, tire ve alt çizgi (en fazla 32 karakter)."
                          : "Kod değişmez; etiket ve sıra güncellenir."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Kod</Label>
                        <Input
                          className="h-9 text-xs"
                          value={form.code}
                          disabled={editingCode !== "new"}
                          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Türkçe etiket</Label>
                        <Input
                          className="h-9 text-xs"
                          value={form.labelTr}
                          onChange={(e) => setForm((f) => ({ ...f, labelTr: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Sıra</Label>
                        <Input
                          className="h-9 text-xs"
                          inputMode="numeric"
                          value={form.sortOrder}
                          onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" className="h-8 text-xs" disabled={saving} onClick={() => void submitForm()}>
                          {saving ? "Kaydediliyor…" : "Kaydet"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={saving} onClick={cancelForm}>
                          Vazgeç
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={startCreate}>
                    Yeni ekle
                  </Button>
                )}

                <Card className="glow-card">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Kayıtlar</CardTitle>
                    <CardDescription className="text-xs">
                      {loading ? "Yükleniyor…" : `${rows.length} kayıt`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {!loading && rows.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Liste boş.</p>
                    ) : null}
                    {!loading && rows.length > 0 ? (
                      <div className="overflow-x-auto rounded-md border border-border/60">
                        <table className="w-full min-w-[280px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-border/60 bg-muted/40">
                              <th className="px-2 py-2 font-medium">Kod</th>
                              <th className="px-2 py-2 font-medium">Etiket</th>
                              <th className="px-2 py-2 font-medium">Sıra</th>
                              <th className="px-2 py-2 font-medium text-right">İşlem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr key={r.code} className="border-b border-border/40 last:border-0">
                                <td className="px-2 py-2 font-mono text-[11px]">{r.code}</td>
                                <td className="px-2 py-2">{r.labelTr}</td>
                                <td className="px-2 py-2 tabular-nums">{r.sortOrder}</td>
                                <td className="px-2 py-2 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[11px]"
                                      disabled={editingCode != null}
                                      onClick={() => startEdit(r)}
                                    >
                                      Düzenle
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                                      disabled={editingCode != null}
                                      onClick={() => void removeRow(r.code)}
                                    >
                                      Sil
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Link href="/settings/options" className="text-primary underline-offset-2 hover:underline">
          ← Opsiyonlar
        </Link>
        <Link href="/settings" className="text-muted-foreground underline-offset-2 hover:underline">
          Ayarlara dön
        </Link>
      </div>
    </div>
  );
}
