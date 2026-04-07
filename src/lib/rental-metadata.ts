import type { CustomerInfo, RentalSession, Vehicle } from "@/lib/mock-fleet";

/** Eski kayıtlarda yoksa başlangıç günü varsayılan saat ile kullanılır. */
export function sessionCreatedAt(s: RentalSession): string {
  if (s.createdAt) return s.createdAt;
  return `${s.startDate}T12:00:00.000Z`;
}

export function customerRecordKey(c: CustomerInfo): string {
  const tc = c.nationalId.trim();
  if (tc) return `tc:${tc}`;
  return `ph:${c.phone.trim()}`;
}

export type CustomerAggregateRow = {
  key: string;
  customer: CustomerInfo;
  rentals: RentalSession[];
  totalRentals: number;
  lastActivity: string;
};

export function aggregateCustomersFromSessions(sessions: RentalSession[]): CustomerAggregateRow[] {
  const map = new Map<string, { customer: CustomerInfo; rentals: RentalSession[] }>();

  for (const s of sessions) {
    const k = customerRecordKey(s.customer);
    const cur = map.get(k);
    if (cur) cur.rentals.push(s);
    else map.set(k, { customer: s.customer, rentals: [s] });
  }

  const rows: CustomerAggregateRow[] = [];

  for (const [key, { customer, rentals }] of map) {
    const sorted = [...rentals].sort((a, b) => sessionCreatedAt(b).localeCompare(sessionCreatedAt(a)));
    const lastActivity = sessionCreatedAt(sorted[0]);
    rows.push({
      key,
      customer,
      rentals: sorted,
      totalRentals: sorted.length,
      lastActivity,
    });
  }

  return rows.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}

export function vehiclePlate(vehiclesById: Map<string, Vehicle>, vehicleId: string): string {
  return vehiclesById.get(vehicleId)?.plate ?? vehicleId;
}
