"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Route } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { AddEntityButton } from "@/components/ui/add-entity-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEur } from "@/lib/format-money";
import {
  createHandoverRouteOnRentApi,
  deleteHandoverRouteOnRentApi,
  fetchHandoverLocationsFromRentApi,
  fetchHandoverRoutesFromRentApi,
  getRentApiErrorMessage,
  updateHandoverRouteOnRentApi,
  type HandoverLocationApiRow,
  type HandoverRouteRow,
} from "@/lib/rent-api";

type FormState = {
  pickupId: string;
  returnId: string;
  feeEur: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  pickupId: "",
  returnId: "",
  feeEur: "0",
  active: true,
});

function parseFeeEur(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "") return 0;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function HandoverRoutesManageClient() {
  const [rows, setRows] = useState<HandoverRouteRow[]>([]);
  const [pickups, setPickups] = useState<HandoverLocationApiRow[]>([]);
  const [returns, setReturns] = useState<HandoverLocationApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [routes, pickupRows, returnRows] = await Promise.all([
        fetchHandoverRoutesFromRentApi({ includeInactive: true }),
        fetchHandoverLocationsFromRentApi("PICKUP", { includeInactive: true }),
        fetchHandoverLocationsFromRentApi("RETURN", { includeInactive: true }),
      ]);
      setRows(routes);
      setPickups(pickupRows.filter((r) => r.active !== false));
      setReturns(returnRows.filter((r) => r.active !== false));
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const pa = (a.pickupName ?? a.pickupHandoverLocationId).localeCompare(
          b.pickupName ?? b.pickupHandoverLocationId,
          "tr",
        );
        if (pa !== 0) return pa;
        return (a.returnName ?? a.returnHandoverLocationId).localeCompare(
          b.returnName ?? b.returnHandoverLocationId,
          "tr",
        );
      }),
    [rows],
  );

  const startCreate = () => {
    setEditingId("new");
    setForm(emptyForm());
  };

  const startEdit = (row: HandoverRouteRow) => {
    setEditingId(row.id);
    setForm({
      pickupId: row.pickupHandoverLocationId,
      returnId: row.returnHandoverLocationId,
      feeEur: String(row.feeEur ?? 0),
      active: row.active !== false,
    });
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const submitForm = async () => {
    if (!form.pickupId || !form.returnId) {
      toast.error("Başlangıç ve bitiş noktası seçin.");
      return;
    }
    if (form.pickupId === form.returnId) {
      toast.error("Başlangıç ve bitiş noktası farklı olmalı.");
      return;
    }
    const fee = parseFeeEur(form.feeEur);
    if (fee === null) {
      toast.error("Ücret geçerli bir sayı olmalı.");
      return;
    }
    if (fee < 0) {
      toast.error("Ücret negatif olamaz.");
      return;
    }
    setSaving(true);
    try {
      if (editingId === "new") {
        await createHandoverRouteOnRentApi({
          pickupHandoverLocationId: form.pickupId,
          returnHandoverLocationId: form.returnId,
          feeEur: fee,
          active: form.active,
        });
        toast.success("Rota eklendi.");
      } else if (editingId) {
        await updateHandoverRouteOnRentApi(editingId, {
          pickupHandoverLocationId: form.pickupId,
          returnHandoverLocationId: form.returnId,
          feeEur: fee,
          active: form.active,
        });
        toast.success("Rota güncellendi.");
      }
      cancelForm();
      await load();
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: string) => {
    if (!window.confirm("Bu rotayı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteHandoverRouteOnRentApi(id);
      toast.success("Rota silindi.");
      await load();
    } catch (e) {
      toast.error(getRentApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Route className="h-5 w-5 text-primary" />
            Kiralama rotaları
          </h1>
          <p className="text-xs text-muted-foreground">
            Alış ve teslim noktası çiftleri için rota ücreti tanımlayın. Ücret 0 ise rota ücretsizdir; kiralama başlatırken
            eşleşen rota tutarı otomatik yansır.
          </p>
        </div>
        <AddEntityButton type="button" onClick={startCreate} disabled={loading || editingId != null}>
          Rota oluştur
        </AddEntityButton>
      </div>

      {editingId != null ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editingId === "new" ? "Yeni rota" : "Rotayı düzenle"}</CardTitle>
            <CardDescription className="text-xs">Başlangıç: alış noktası · Bitiş: teslim noktası</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-1">
              <Label>Başlangıç (alış)</Label>
              <Select value={form.pickupId} onValueChange={(v) => setForm((s) => ({ ...s, pickupId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Alış noktası seçin" />
                </SelectTrigger>
                <SelectContent>
                  {pickups.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-1">
              <Label>Bitiş (teslim)</Label>
              <Select value={form.returnId} onValueChange={(v) => setForm((s) => ({ ...s, returnId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Teslim noktası seçin" />
                </SelectTrigger>
                <SelectContent>
                  {returns.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rota ücreti (EUR)</Label>
              <Input
                value={form.feeEur}
                onChange={(e) => setForm((s) => ({ ...s, feeEur: e.target.value }))}
                placeholder="0 = ücretsiz"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={form.active}
                  onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                />
                Aktif
              </label>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="button" size="sm" onClick={() => void submitForm()} disabled={saving}>
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={cancelForm} disabled={saving}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Ücret</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Yükleniyor…
                  </TableCell>
                </TableRow>
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Henüz rota yok. «Rota oluştur» ile ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.pickupName ?? row.pickupHandoverLocationId}</TableCell>
                    <TableCell>{row.returnName ?? row.returnHandoverLocationId}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.feeEur > 0 ? formatEur(row.feeEur) : <span className="text-muted-foreground">Ücretsiz</span>}
                    </TableCell>
                    <TableCell>
                      {row.active !== false ? (
                        <Badge variant="secondary">Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Pasif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => startEdit(row)}>
                          Düzenle
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => void removeRow(row.id)}>
                          Sil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
