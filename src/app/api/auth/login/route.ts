import { NextResponse } from "next/server";
import {
  COOKIE_MAX_AGE_SECONDS,
  TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS,
  getAuthUpstreamUrl,
} from "@/lib/config";
import { getExpFromAccessToken } from "@/lib/auth-user";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const upstream = await fetch(`${getAuthUpstreamUrl()}/basicauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || "Giriş başarısız" },
        { status: upstream.status || 401 },
      );
    }

    if (data?.requiresTwoFactor === true && data?.twoFactorToken) {
      const response = NextResponse.json(
        {
          requiresTwoFactor: true,
          userId: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        { status: 200 },
      );
      const pendingOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS,
      };
      response.cookies.set("algory_2fa_pending", data.twoFactorToken, pendingOpts);
      return response;
    }

    const accessToken = data?.accessToken || data?.access_token;
    const refreshToken = data?.refreshToken || data?.refresh_token;
    const accessTokenExpiresAt = getExpFromAccessToken(accessToken) ?? undefined;

    const response = NextResponse.json(
      { ...data, accessTokenExpiresAt },
      { status: 200 },
    );

    if (accessToken) {
      const accessCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
      };
      response.cookies.set("algory_access_token", accessToken, accessCookieOptions);
      response.cookies.set("accessToken", accessToken, accessCookieOptions);
    }

    if (refreshToken) {
      const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: COOKIE_MAX_AGE_SECONDS,
      };
      response.cookies.set("algory_refresh_token", refreshToken, refreshCookieOptions);
      response.cookies.set("refreshToken", refreshToken, refreshCookieOptions);
    }

    return response;
  } catch {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}
