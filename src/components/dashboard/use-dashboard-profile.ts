"use client";

import { useDashboardMe } from "./dashboard-me-provider";
import type { DashboardProfile } from "@/lib/dashboard-content";

/**
 * Returns the current dashboard profile (from `GET /api/me/profile` after the first load).
 */
export function useDashboardProfile(): DashboardProfile {
  const { profile } = useDashboardMe();
  return profile;
}
