"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** SSR’de false, istemcide true — localStorage ile eşleşen içerik için ilk boyama. */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
