"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Vehicle } from "@/lib/mock-fleet";
import { seedVehicles } from "@/lib/mock-fleet";
import {
  getExtraVehiclesSnapshot,
  invalidateExtraVehiclesCache,
  mergeVehicleLists,
  saveExtraVehicles,
  VEHICLES_STORAGE_KEY,
} from "@/lib/fleet-utils";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === VEHICLES_STORAGE_KEY) {
      invalidateExtraVehiclesCache();
      onChange();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function useFleetVehicles() {
  const extra = useSyncExternalStore(
    subscribe,
    () => getExtraVehiclesSnapshot(),
    () => [] as Vehicle[],
  );

  const allVehicles = useMemo(() => mergeVehicleLists(seedVehicles, extra), [extra]);

  const addVehicle = useCallback((vehicle: Vehicle) => {
    const next = [...getExtraVehiclesSnapshot(), vehicle];
    saveExtraVehicles(next);
    emit();
  }, []);

  return { allVehicles, addVehicle, ready: true };
}
