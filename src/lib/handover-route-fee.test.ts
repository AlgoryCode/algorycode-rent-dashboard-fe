import { describe, expect, it } from "vitest";

import { resolveHandoverRouteFee } from "@/lib/handover-route-fee";
import type { HandoverRouteRow } from "@/models/vehicle";

const routes: HandoverRouteRow[] = [
  {
    id: "1",
    pickupHandoverLocationId: "10",
    returnHandoverLocationId: "20",
    feeEur: 35,
    active: true,
  },
  {
    id: "2",
    pickupHandoverLocationId: "10",
    returnHandoverLocationId: "21",
    feeEur: 0,
    active: true,
  },
];

describe("resolveHandoverRouteFee", () => {
  it("returns fee when pickup and return match an active route", () => {
    expect(resolveHandoverRouteFee(routes, "10", "20")).toEqual({ feeEur: 35, routeId: "1" });
  });

  it("returns zero fee for free route", () => {
    expect(resolveHandoverRouteFee(routes, "10", "21")).toEqual({ feeEur: 0, routeId: "2" });
  });

  it("returns zero when pair is undefined", () => {
    expect(resolveHandoverRouteFee(routes, "10", "99")).toEqual({ feeEur: 0, routeId: null });
  });
});
