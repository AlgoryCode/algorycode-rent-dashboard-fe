import { RENT_FE_ROLES_COOKIE } from "@/lib/rbac/role-cookie";
import type { RentAppRole } from "@/lib/rbac/rent-roles";
import { parseRentRoleList } from "@/lib/rbac/rent-roles";

function readCookieRaw(name: string, cookieHeader: string): string | null {
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const prefix = `${name}=`;
  for (const p of parts) {
    if (p.startsWith(prefix)) return decodeURIComponent(p.slice(prefix.length));
  }
  return null;
}

export function readRentFeRolesFromDocumentCookie(): RentAppRole[] {
  if (typeof document === "undefined") return [];
  return parseRentRoleList(readCookieRaw(RENT_FE_ROLES_COOKIE, document.cookie) ?? "");
}
