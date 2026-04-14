import type { RentAppRole } from "@/lib/rbac/rent-roles";
import { hasRentManagerAccess } from "@/lib/rbac/rent-roles";

export type RentRouteAccess = "public" | "rent_manager";

export type RentRouteRule = {
  pathPrefix: string;
  access: RentRouteAccess;
  showInManagerNav?: boolean;
  navLabel?: string;
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const noQuery = pathname.split("?")[0] ?? pathname;
  return noQuery.endsWith("/") && noQuery.length > 1 ? noQuery.slice(0, -1) : noQuery;
}

/** Panel: RENT_USER bu path’lere giremez (middleware + menü). */
export const RENT_ROUTE_RULES: RentRouteRule[] = [
  { pathPrefix: "/payments", access: "rent_manager", showInManagerNav: true, navLabel: "Ödemeler" },
  { pathPrefix: "/users", access: "rent_manager", showInManagerNav: true, navLabel: "Kullanıcılar" },
];

export function matchRentRouteRule(pathname: string): RentRouteRule | null {
  const path = normalizePath(pathname);
  let best: RentRouteRule | null = null;
  let bestLen = -1;
  for (const rule of RENT_ROUTE_RULES) {
    const prefix = normalizePath(rule.pathPrefix);
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      if (prefix.length > bestLen) {
        best = rule;
        bestLen = prefix.length;
      }
    }
  }
  return best;
}

export function rentRouteAccessForPath(pathname: string): RentRouteAccess {
  return matchRentRouteRule(pathname)?.access ?? "public";
}

export function requiresRentManagerForPath(pathname: string): boolean {
  return rentRouteAccessForPath(pathname) === "rent_manager";
}

export function canAccessRentPath(roles: readonly RentAppRole[], pathname: string): boolean {
  const access = rentRouteAccessForPath(pathname);
  if (access === "public") return true;
  if (access === "rent_manager") return hasRentManagerAccess(roles);
  return true;
}

/** Sol menü / arama: yöneticiye özel linkler (tek kaynak). */
export function getRentManagerNavLinks(): { href: string; label: string }[] {
  return RENT_ROUTE_RULES.filter((r) => r.showInManagerNav && r.navLabel).map((r) => ({
    href: normalizePath(r.pathPrefix),
    label: r.navLabel as string,
  }));
}

/** Örn. `/users` veya `/payments` — navigasyon satırı için. */
export function hrefRequiresRentManager(href: string): boolean {
  const path = normalizePath(href.split("?")[0] || href);
  return requiresRentManagerForPath(path);
}
