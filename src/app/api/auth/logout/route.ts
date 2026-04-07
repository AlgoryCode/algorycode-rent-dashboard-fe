import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { AUTH_BASE } from "@/lib/config";
import { clearAuthCookies } from "@/lib/server/auth-cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken =
      cookieStore.get("algory_refresh_token")?.value || cookieStore.get("refreshToken")?.value;
    if (refreshToken) {
      await fetch(`${AUTH_BASE}/basicauth/logout`, {
        method: "POST",
        headers: { Cookie: `refresh_token=${refreshToken}; refreshToken=${refreshToken}` },
        cache: "no-store",
      }).catch(() => undefined);
    }
  } catch {
    // Best-effort revoke; cookie clear still logs user out locally.
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
