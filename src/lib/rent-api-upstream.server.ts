/**
 * Sadece sunucu (Route Handler) tarafından import edin.
 * Öncelik: `RENT_API_UPSTREAM` → `getRentApiRoot()` (`NEXT_PUBLIC_API_BASE_MODE`, gateway `/rent`, vb.).
 */
import { getRentApiRoot } from "@/lib/api-base";

export function resolveRentApiUpstreamUrl(): string {
  const fromEnv = process.env.RENT_API_UPSTREAM?.trim().replace(/\/$/, "");
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return getRentApiRoot();
}
