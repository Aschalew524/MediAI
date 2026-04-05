"use client";

import { useMemo } from "react";

import {
  dashboardProfileStorageKey,
  type DashboardProfile,
} from "@/lib/dashboard-content";
import { useDashboardConfig } from "@/lib/hooks/use-app-config";

export function useDashboardProfile() {
  const { data: config } = useDashboardConfig();

  return useMemo(() => {
    const fallback = config.defaultDashboardProfile;

    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const stored = window.localStorage.getItem(dashboardProfileStorageKey);
      if (!stored) return fallback;

      const parsed = JSON.parse(stored) as Partial<DashboardProfile>;
      return { ...fallback, ...parsed };
    } catch {
      return fallback;
    }
  }, [config.defaultDashboardProfile]);
}
