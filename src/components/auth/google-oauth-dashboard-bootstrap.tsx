"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { setAccessToken } from "@/lib/auth-storage";

const MAX_TOKEN_CHARS = 12_000;

/**
 * Nest `GET /api/auth/google/callback` redirects to `/dashboard?accessToken=<jwt>`.
 * Persists the session (localStorage + cookie) like email login, strips the token from the URL,
 * then refreshes auth so `/auth/me` runs with the new JWT.
 */
export function GoogleOAuthDashboardBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useDashboardAuth();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    const raw = searchParams.get("accessToken");
    if (!raw) return;

    const token = raw.trim();
    if (!token || token.length > MAX_TOKEN_CHARS) {
      router.replace("/signin?error=invalid_token");
      return;
    }

    appliedRef.current = true;
    setAccessToken(token);

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.delete("accessToken");
    const qs = params.toString();
    const nextPath = qs ? `${path}?${qs}` : path;
    router.replace(nextPath);
    void refresh();
  }, [router, searchParams, refresh]);

  return null;
}
