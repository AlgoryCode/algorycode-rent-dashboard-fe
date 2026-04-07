import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getJsonErrorText } from "@/lib/api-error-text";
import { getUserIdFromAccessToken } from "@/lib/auth-user";
import { AUTH_BASE } from "@/lib/config";

type Body = { currentPassword?: string; newPassword?: string };

/** AuthService: POST {AUTH_BASE}/account/change-password — JWT + X-User-Id. */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("algory_access_token")?.value || cookieStore.get("accessToken")?.value;
    if (!accessToken) {
      return NextResponse.json({ message: "Oturum gerekli" }, { status: 401 });
    }

    const userId = getUserIdFromAccessToken(accessToken);
    if (userId == null) {
      return NextResponse.json({ message: "Token'da kullanıcı bilgisi yok" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    if (!body?.currentPassword || !body?.newPassword) {
      return NextResponse.json({ message: "Mevcut şifre ve yeni şifre gerekli" }, { status: 400 });
    }

    const upstream = await fetch(`${AUTH_BASE}/account/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-User-Id": String(userId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      let message = text;
      try {
        message = getJsonErrorText(JSON.parse(text) as unknown) || text;
      } catch {
        /* keep text */
      }
      return NextResponse.json({ message: message || "Şifre değiştirilemedi" }, { status: upstream.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
