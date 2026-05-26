import type { HandoverRouteRow } from "@/models/vehicle";

export type HandoverRouteFeeMatch = {
  feeEur: number;
  routeId: string | null;
};

export function resolveHandoverRouteFee(
  routes: readonly HandoverRouteRow[],
  pickupHandoverLocationId: string | null | undefined,
  returnHandoverLocationId: string | null | undefined,
): HandoverRouteFeeMatch {
  const pickup = pickupHandoverLocationId?.trim();
  const ret = returnHandoverLocationId?.trim();
  if (!pickup || !ret) return { feeEur: 0, routeId: null };
  const hit = routes.find(
    (r) =>
      r.active !== false &&
      String(r.pickupHandoverLocationId) === pickup &&
      String(r.returnHandoverLocationId) === ret,
  );
  if (!hit) return { feeEur: 0, routeId: null };
  const fee = Number(hit.feeEur);
  return { feeEur: Number.isFinite(fee) && fee > 0 ? fee : 0, routeId: hit.id };
}
