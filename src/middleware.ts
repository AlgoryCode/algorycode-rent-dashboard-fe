import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATH = "/login";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/vehicles") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/countries") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/rentals") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings")
  );
}

function hasAccessToken(req: NextRequest) {
  return Boolean(req.cookies.get("algory_access_token")?.value || req.cookies.get("accessToken")?.value);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/talep/p" || pathname.startsWith("/talep/p/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/rental-request-form";
    return NextResponse.redirect(url);
  }
  if (pathname === "/rental-request-form/kiosk" || pathname.startsWith("/rental-request-form/kiosk/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/rental-request-form";
    return NextResponse.redirect(url);
  }
  if (pathname === "/talep") {
    const url = req.nextUrl.clone();
    url.pathname = "/rental-request-form";
    return NextResponse.redirect(url);
  }

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
