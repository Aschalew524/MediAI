"use client";

import { useEffect, useState } from "react";

import {
  dashboardProfileStorageKey,
  type DashboardProfile,
} from "@/lib/dashboard-content";
import { useDashboardConfig } from "@/lib/hooks/use-app-config";

export function useDashboardProfile() {
  const { data: config } = useDashboardConfig();
  const fallback = config.defaultDashboardProfile;
  const [profile, setProfile] = useState<DashboardProfile>(fallback);

  useEffect(() => {
    setProfile(fallback);
  }, [fallback]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(dashboardProfileStorageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored) as Partial<DashboardProfile>;
      setProfile({ ...fallback, ...parsed });
    } catch {
      setProfile(fallback);
    }
  }, [fallback]);

  return profile;
}
