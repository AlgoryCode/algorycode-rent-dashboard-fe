"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { RentalSession } from "@/lib/mock-fleet";
import { seedSessions } from "@/lib/mock-fleet";
import {
  getExtraSessionsSnapshot,
  invalidateExtraSessionsCache,
  mergeSessions,
  saveExtraSessions,
} from "@/lib/fleet-utils";

const EXTRA_STORAGE_KEY = "rent-fe-extra-sessions";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === EXTRA_STORAGE_KEY) {
      invalidateExtraSessionsCache();
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

function getSnapshot() {
  return getExtraSessionsSnapshot();
}

function getServerSnapshot() {
  return [] as RentalSession[];
}

export function useFleetSessions() {
  const extra = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const allSessions = useMemo(() => mergeSessions(seedSessions, extra), [extra]);

  const addSession = useCallback((session: RentalSession) => {
    const next = [...getExtraSessionsSnapshot(), session];
    saveExtraSessions(next);
    emit();
  }, []);

  return { allSessions, addSession, ready: true };
}
