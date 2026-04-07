"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RentalSession } from "@/lib/mock-fleet";
import {
  createRentalOnRentApi,
  fetchRentalsFromRentApi,
  getRentApiErrorMessage,
  type CreateRentalPayload,
} from "@/lib/rent-api";

export function useFleetSessions() {
  const [sessions, setSessions] = useState<RentalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRentalsFromRentApi();
      setSessions(list);
    } catch (e) {
      setError(getRentApiErrorMessage(e));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createRental = useCallback(async (payload: CreateRentalPayload) => {
    const created = await createRentalOnRentApi(payload);
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== created.id);
      return [created, ...rest];
    });
    return created;
  }, []);

  const allSessions = useMemo(() => sessions, [sessions]);

  return { allSessions, createRental, ready: !loading, error, refetch };
}
