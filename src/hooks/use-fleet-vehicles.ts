"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Vehicle } from "@/lib/mock-fleet";
import {
  createVehicleOnRentApi,
  fetchVehiclesFromRentApi,
  getRentApiErrorMessage,
  type CreateVehiclePayload,
} from "@/lib/rent-api";

export function useFleetVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchVehiclesFromRentApi();
      setVehicles(list);
    } catch (e) {
      setError(getRentApiErrorMessage(e));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const addVehicle = useCallback(
    async (payload: CreateVehiclePayload) => {
      const created = await createVehicleOnRentApi(payload);
      setVehicles((prev) => {
        const rest = prev.filter((v) => v.id !== created.id);
        return [created, ...rest];
      });
      return created;
    },
    [],
  );

  const allVehicles = useMemo(() => vehicles, [vehicles]);

  return { allVehicles, addVehicle, ready: !loading, error, refetch };
}
