import { type NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_KEY } from "@/lib/auth-constants";

const AUTH_LANDING = "/signin";
const SIGNED_IN_HOME = "/dashboard";

function hasAccessCookie(request: NextRequest) {
  return Boolean(request.cookies.get(ACCESS_TOKEN_KEY)?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAccessCookie(request);

  if (pathname === "/onboarding" || !pathname.startsWith("/dashboard")) {
    // Allow /signin and /signup even when a session cookie exists so users can
    // enter credentials or switch accounts (the sign-in page handles "already
    // signed in" in the client).
    return NextResponse.next();
  }

  if (!hasSession) {
    /** Google OAuth returns JWT in query before client can mirror it to cookie (`setAccessToken`). */
    if (request.nextUrl.searchParams.has("accessToken")) {
      return NextResponse.next();
    }
    const to = new URL(AUTH_LANDING, request.url);
    to.searchParams.set("from", pathname);
    return NextResponse.redirect(to);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup/:path*"],
};
