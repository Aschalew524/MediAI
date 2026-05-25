"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useDashboardAuth } from "@/components/auth/dashboard-auth-provider";
import { setAccessToken, setRefreshToken } from "@/lib/auth-storage";

const MAX_TOKEN_CHARS = 12_000;

/**
 * Nest `GET /api/auth/google/callback` redirects to
 * `/dashboard?accessToken=<jwt>&refreshToken=<opaque>`.
 * Persists both tokens (localSto  rage + cookie for access token),
 * strips both from the URL, then refreshes auth so `/auth/me` runs.
 */
export function GoogleOAuthDashboardBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useDashboardAuth();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    const rawAccess = searchParams.get("accessToken");
    if (!rawAccess) return;

    const accessToken = rawAccess.trim();
    if (!accessToken || accessToken.length > MAX_TOKEN_CHARS) {
      router.replace("/signin?error=invalid_token");
      return;
    }

    appliedRef.current = true;
    setAccessToken(accessToken);

    // Persist refresh token if the backend included one
    const rawRefresh = searchParams.get("refreshToken");
    if (rawRefresh) {
      const refreshToken = rawRefresh.trim();
      if (refreshToken && refreshToken.length <= MAX_TOKEN_CHARS) {
        setRefreshToken(refreshToken);
      }
    }

    // Strip both tokens from the URL
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.delete("accessToken");
    params.delete("refreshToken");
    const qs = params.toString();
    const nextPath = qs ? `${path}?${qs}` : path;
    router.replace(nextPath);
    void refresh();
  }, [router, searchParams, refresh]);

  return null;
}
