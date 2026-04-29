"use client";

import { useLayoutEffect } from "react";

import { syncAccessTokenToCookie } from "@/lib/auth-storage";

/**
 * Runs on every app load so `middleware` can detect a session on the first
 * request after login (or when `localStorage` was set in a previous tab).
 */
export function SessionCookieSync() {
  useLayoutEffect(() => {
    syncAccessTokenToCookie();
  }, []);
  return null;
}
