import type { RentalSession } from "@/lib/mock-fleet";

export type RentalStatus = "active" | "pending" | "completed" | "cancelled";

export const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  active: "Aktif",
  pending: "Beklemede",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const VALID = new Set<RentalStatus>(["active", "pending", "completed", "cancelled"]);

export function normalizeRentalStatus(raw: unknown): RentalStatus {
  if (typeof raw === "string" && VALID.has(raw as RentalStatus)) return raw as RentalStatus;
  return "active";
}

/** Takvim çakışması ve dolu gün: iptal bu aralığı serbest bırakır. */
export function rentalCountsForCalendar(s: RentalSession): boolean {
  return (s.status ?? "active") !== "cancelled";
}
