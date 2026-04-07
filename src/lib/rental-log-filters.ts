import { format, parseISO } from "date-fns";

import type { RentalSession } from "@/lib/mock-fleet";
import { sessionCreatedAt } from "@/lib/rental-metadata";

export type RentalLogFilterValues = {
  customerQuery: string;
  /** yyyy-MM-dd; boş = tarih filtresi yok */
  anchorDate: string;
  /** Sadece global log sayfası — plaka parçası */
  vehicleQuery?: string;
};

export const emptyRentalLogFilters = (): RentalLogFilterValues => ({
  customerQuery: "",
  anchorDate: "",
  vehicleQuery: "",
});

/** Müşteri metni + isteğe bağlı gün: kayıt o gün veya kiralama dönemi o günü kapsar. */
export function filterRentalLogSessions(sessions: RentalSession[], f: RentalLogFilterValues): RentalSession[] {
  let out = sessions;
  const q = f.customerQuery.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (s) =>
        s.customer.fullName.toLowerCase().includes(q) ||
        s.customer.nationalId.toLowerCase().includes(q),
    );
  }
  if (f.anchorDate) {
    const d = f.anchorDate;
    out = out.filter((s) => {
      const createdDay = format(parseISO(sessionCreatedAt(s)), "yyyy-MM-dd");
      const inRentalPeriod = d >= s.startDate && d <= s.endDate;
      return inRentalPeriod || createdDay === d;
    });
  }
  return out;
}

export function sortSessionsByLogTimeDesc(sessions: RentalSession[]): RentalSession[] {
  return [...sessions].sort((a, b) => sessionCreatedAt(b).localeCompare(sessionCreatedAt(a)));
}
