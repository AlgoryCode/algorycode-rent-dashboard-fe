"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCustomerRecordStatesFromRentApi } from "@/lib/rent-api";
import { rentKeys } from "@/lib/rent-query-keys";

export function useCustomerRecordStates() {
  return useQuery({
    queryKey: rentKeys.customerRecords(),
    queryFn: fetchCustomerRecordStatesFromRentApi,
    staleTime: 20_000,
  });
}
