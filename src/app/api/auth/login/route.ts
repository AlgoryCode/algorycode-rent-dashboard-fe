import { NextResponse } from "next/server";

import { getExpFromAccessToken } from "@/lib/auth-user";
import { postAuthServiceBasicLogin } from "@/lib/auth-upstream-login";
import {
  COOKIE_MAX_AGE_SECONDS,
  TWO_FACTOR_PENDING_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/config";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ message: "E-posta ve şifre gerekli" }, { status: 400 });
    }

    const upstream = await postAuthServiceBasicLogin({ email, password });
    const data = upstream.data as Record<string, unknown> & {
      message?: string;
      requiresTwoFactor?: boolean;
      twoFactorToken?: string;
      userId?: number;
      email?: string;
      firstName?: string;
      lastName?: string;
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
    };

    if (upstream.status < 200 || upstream.status >= 300) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Giriş başarısız" },
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
    const accessTokenExpiresAt = getExpFromAccessToken(
      typeof accessToken === "string" ? accessToken : undefined,
    ) ?? undefined;

    const response = NextResponse.json({ ...data, accessTokenExpiresAt }, { status: 200 });

    if (accessToken && typeof accessToken === "string") {
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

    if (refreshToken && typeof refreshToken === "string") {
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
