"use client";

import { useMemo } from "react";
import type { RentalSession } from "@/lib/mock-fleet";
import { loadManualCustomerRows, mergeSessionAndManualCustomers } from "@/lib/manual-customers";
import {
  aggregateCustomersFromSessions,
  mergeCustomerDirectoryStates,
  type CustomerAggregateRow,
} from "@/lib/rental-metadata";
import type { CustomerRecordStatePayload } from "@/lib/rent-api";

export function useCustomerDirectoryRows(
  allSessions: RentalSession[],
  recordStates?: CustomerRecordStatePayload[],
): CustomerAggregateRow[] {
  return useMemo(() => {
    const sessionRows = aggregateCustomersFromSessions(allSessions);
    const manualRows = loadManualCustomerRows();
    const merged = mergeSessionAndManualCustomers(sessionRows, manualRows);
    return mergeCustomerDirectoryStates(merged, recordStates);
  }, [allSessions, recordStates]);
}
