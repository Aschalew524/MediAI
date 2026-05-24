"use client";

import { getApiDirectBaseUrl, isUsingLocalApi } from "@/lib/api-origin";

/**
 * Shown only in dev when the app targets localhost:4000 — reminds you before deploy.
 */
export function DevApiIndicator() {
  if (process.env.NODE_ENV === "production") return null;
  if (!isUsingLocalApi()) return null;

  const api = getApiDirectBaseUrl();

  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800 sm:inline-flex"
      title={`API requests go to ${api}`}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
      Local API
    </span>
  );
}
