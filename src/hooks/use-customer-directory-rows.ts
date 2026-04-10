"use client";

import { useMemo } from "react";
import type { RentalSession } from "@/lib/mock-fleet";
import { loadManualCustomerRows, mergeSessionAndManualCustomers } from "@/lib/manual-customers";
import { aggregateCustomersFromSessions, type CustomerAggregateRow } from "@/lib/rental-metadata";

export function useCustomerDirectoryRows(allSessions: RentalSession[]): CustomerAggregateRow[] {
  return useMemo(() => {
    const sessionRows = aggregateCustomersFromSessions(allSessions);
    const manualRows = loadManualCustomerRows();
    return mergeSessionAndManualCustomers(sessionRows, manualRows);
  }, [allSessions]);
}
