import { type NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_KEY } from "@/lib/auth-constants";

const AUTH_LANDING = "/signin";
const SIGNED_IN_HOME = "/dashboard";

const authPathPrefixes = ["/signin", "/signup"];

function isAuthPath(path: string) {
  return authPathPrefixes.some(
    (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
  );
}

function hasAccessCookie(request: NextRequest) {
  return Boolean(request.cookies.get(ACCESS_TOKEN_KEY)?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAccessCookie(request);

  if (pathname === "/onboarding" || !pathname.startsWith("/dashboard")) {
    if (isAuthPath(pathname) && hasSession) {
      return NextResponse.redirect(new URL(SIGNED_IN_HOME, request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const to = new URL(AUTH_LANDING, request.url);
    to.searchParams.set("from", pathname);
    return NextResponse.redirect(to);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup/:path*"],
};
