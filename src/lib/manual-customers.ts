import type { CustomerInfo } from "@/lib/mock-fleet";
import type { CustomerAggregateRow } from "@/lib/rental-metadata";

const STORAGE_KEY = "algory_manual_customers_v1";

export type ManualCustomerStored = {
  key: string;
  customer: CustomerInfo;
  createdAt: string;
};

function readRaw(): ManualCustomerStored[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ManualCustomerStored =>
        x != null &&
        typeof x === "object" &&
        typeof (x as ManualCustomerStored).key === "string" &&
        typeof (x as ManualCustomerStored).createdAt === "string" &&
        (x as ManualCustomerStored).customer != null,
    );
  } catch {
    return [];
  }
}

function writeRaw(rows: ManualCustomerStored[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function loadManualCustomerRows(): CustomerAggregateRow[] {
  return readRaw().map((m) => ({
    key: m.key,
    customer: m.customer,
    rentals: [],
    totalRentals: 0,
    lastActivity: m.createdAt,
    recordActive: true,
  }));
}

export function mergeSessionAndManualCustomers(
  sessionRows: CustomerAggregateRow[],
  manualRows: CustomerAggregateRow[],
): CustomerAggregateRow[] {
  return [...manualRows, ...sessionRows].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}

export function findManualCustomer(key: string): ManualCustomerStored | null {
  return readRaw().find((m) => m.key === key) ?? null;
}

export function addManualCustomer(customer: CustomerInfo): ManualCustomerStored {
  const rows = readRaw();
  const key = `manual:${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const row: ManualCustomerStored = { key, customer, createdAt };
  rows.push(row);
  writeRaw(rows);
  return row;
}

export function updateManualCustomer(key: string, customer: CustomerInfo): boolean {
  const rows = readRaw();
  const i = rows.findIndex((m) => m.key === key);
  if (i < 0) return false;
  rows[i] = { ...rows[i], customer: { ...rows[i].customer, ...customer } };
  writeRaw(rows);
  return true;
}

export function deleteManualCustomer(key: string): boolean {
  const rows = readRaw();
  const next = rows.filter((m) => m.key !== key);
  if (next.length === rows.length) return false;
  writeRaw(next);
  return true;
}
