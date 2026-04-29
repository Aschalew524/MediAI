"use client";

import { useDashboardMe } from "./dashboard-me-provider";

export function useAIDoctorSetupStatus() {
  const { isMeLoading, aiDoctorSetupCompleted } = useDashboardMe();
  const hasResolved = !isMeLoading;
  return { hasResolved, isSetupComplete: aiDoctorSetupCompleted };
}
