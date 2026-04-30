import type { DashboardProfile, MedicalHistoryData } from "./dashboard-content";

/**
 * Profile / medical-history completion computation.
 *
 * The dashboard surfaces three completion indicators:
 *   1. The ring on the dashboard home (full health profile).
 *   2. The bar at the top of `/dashboard/profile` (full health profile).
 *   3. The ring next to the "Main Health Information" link on
 *      `/dashboard/profile` (medical history only).
 *
 * They all derive from this module so adding/removing a field changes every
 * indicator in lockstep. "Filled" is intentionally lenient: any user-provided
 * value counts. If the user explicitly answered "no" to a wizard question we
 * don't try to recover that signal — the saved medical-history JSON only
 * stores the affirmative data we can use for personalization.
 */

export type CompletionTally = {
  filled: number;
  total: number;
};

const isFilledString = (s: string | null | undefined): boolean =>
  typeof s === "string" && s.trim().length > 0;

const isFilledList = (xs: string[] | null | undefined): boolean =>
  Array.isArray(xs) && xs.length > 0;

/**
 * Demographic fields collected during onboarding. We treat them as the
 * "general information" half of the health profile.
 */
export function generalInformationCompletion(
  profile: DashboardProfile | null | undefined,
): CompletionTally {
  const p = profile;
  const checks: boolean[] = [
    isFilledString(p?.preferredName),
    isFilledString(p?.age),
    isFilledString(p?.region),
    isFilledString(p?.weight),
    isHeightFilled(p),
    p?.sexAtBirth != null,
  ];
  return {
    filled: checks.filter(Boolean).length,
    total: checks.length,
  };
}

function isHeightFilled(p: DashboardProfile | null | undefined): boolean {
  if (!p) return false;
  if (p.measurementSystem === "metric") return isFilledString(p.heightCm);
  return isFilledString(p.heightFeet) && isFilledString(p.heightInches);
}

/**
 * Maps to the 12 wizard steps so the ring matches what the user is shown
 * inside the AI Doctor setup. A step is "filled" when the medical-history
 * JSON contains any user-provided value for it — selections, free-text
 * details, or a chosen single-choice option.
 */
export function medicalHistoryCompletion(
  history: MedicalHistoryData | null | undefined,
): CompletionTally {
  const h = history;
  const checks: boolean[] = [
    isFilledList(h?.chronicDiseases) || isFilledString(h?.chronicDetails),
    isFilledList(h?.familyHistory) || isFilledString(h?.familyHistoryDetails),
    isFilledList(h?.allergies) || isFilledString(h?.allergyDetails),
    isFilledString(h?.surgicalHistory),
    isFilledString(h?.currentMedications),
    isFilledString(h?.pastMedications),
    isFilledString(h?.smokingIntensity),
    isFilledString(h?.alcoholIntake),
    isFilledString(h?.dietaryHabits),
    isFilledString(h?.activityLevel),
    isFilledString(h?.sleepPattern),
    isFilledString(h?.stressLevel),
  ];
  return {
    filled: checks.filter(Boolean).length,
    total: checks.length,
  };
}

const toPercent = ({ filled, total }: CompletionTally): number =>
  total === 0 ? 0 : Math.round((filled / total) * 100);

/**
 * Whole-profile completion as a 0-100 integer. Used by the dashboard home
 * ring and the `/dashboard/profile` completion bar.
 */
export function overallProfileCompletionPercent(
  profile: DashboardProfile | null | undefined,
  history: MedicalHistoryData | null | undefined,
): number {
  const a = generalInformationCompletion(profile);
  const b = medicalHistoryCompletion(history);
  return toPercent({
    filled: a.filled + b.filled,
    total: a.total + b.total,
  });
}

/**
 * Medical-history-only completion as a 0-100 integer. Used by the "Main
 * Health Information" ring on `/dashboard/profile`.
 */
export function mainHealthInformationCompletionPercent(
  history: MedicalHistoryData | null | undefined,
): number {
  return toPercent(medicalHistoryCompletion(history));
}
