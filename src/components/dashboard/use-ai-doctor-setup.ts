"use client";

import { useDashboardMe } from "./dashboard-me-provider";

/**
 * Resolves whether the AI Doctor questionnaire (the 12-question personal
 * medical-history wizard) is "done" for the current user.
 *
 * Important: that wizard is **patient-only**. The professional Clinical
 * Assistant is the same `/dashboard/ai-doctor` route but operates on the
 * doctor's selected patient, so doctors should never be forced through the
 * wizard. We surface that here by treating professionals as already-set-up,
 * which lets every consumer (`AIDoctorEntryPage`, etc.) skip the gate
 * uniformly without sprinkling role checks throughout the UI.
 */
export function useAIDoctorSetupStatus() {
  const { isMeLoading, aiDoctorSetupCompleted, raw } = useDashboardMe();
  const hasResolved = !isMeLoading;
  const isProfessional = !!raw?.profile?.professionalProfile;
  return {
    hasResolved,
    isSetupComplete: isProfessional ? true : aiDoctorSetupCompleted,
  };
}
