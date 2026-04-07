import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATH = "/login";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/vehicles") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/logs")
  );
}

function hasAccessToken(req: NextRequest) {
  return Boolean(req.cookies.get("algory_access_token")?.value || req.cookies.get("accessToken")?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = hasAccessToken(req);

  if (pathname === AUTH_PATH) {
    if (authed) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = AUTH_PATH;
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/vehicles",
    "/vehicles/:path*",
    "/customers",
    "/customers/:path*",
    "/logs",
    "/logs/:path*",
  ],
};
