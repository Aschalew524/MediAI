import type { DashboardProfile, MedicalHistoryData } from "@/lib/dashboard-content";

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
 *
 * Segmented scores (`computeProfileCompletion`) use the same client-side `GET /me`
 * fields (`DashboardProfile` + `MedicalHistoryData`). Personal vs professional
 * general blocks differ; medical uses chronic, allergies, medications, and six
 * lifestyle fields; `mainHealthHub` is the average of general + medical.
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

export type ProfileCompletionSegments = {
  /** 0–100 */
  general: number;
  /** 0–100 */
  medical: number;
  /**
   * 0–100 — readiness of the “Main Health Information” hub (average of general + medical).
   */
  mainHealthHub: number;
};

export type ProfileCompletionResult = {
  /** 0–100 */
  overall: number;
  segments: ProfileCompletionSegments;
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function heightComplete(p: DashboardProfile): boolean {
  if (p.measurementSystem === "metric") {
    return p.heightCm.trim().length > 0;
  }
  return p.heightFeet.trim().length > 0;
}

function generalPersonalCompletion(p: DashboardProfile): number {
  const ageStr = p.age.trim();
  const ageOk = /^\d+$/.test(ageStr) && Number(ageStr) > 0 && Number(ageStr) < 130;
  const checks: boolean[] = [
    p.preferredName.trim().length > 0,
    ageOk,
    p.region.trim().length > 0,
    p.weight.trim().length > 0,
    heightComplete(p),
    p.sexAtBirth !== null && p.sexAtBirth !== undefined,
  ];
  return clampPct((checks.filter(Boolean).length / checks.length) * 100);
}

function generalProfessionalCompletion(p: DashboardProfile): number {
  const pp = p.professionalProfile;
  if (!pp) return 0;
  const checks: boolean[] = [
    String(pp.title ?? "").trim().length > 0,
    pp.fullName.trim().length > 0,
    pp.specialty.trim().length > 0,
    pp.region.trim().length > 0,
  ];
  return clampPct((checks.filter(Boolean).length / checks.length) * 100);
}

function medicalCompletion(m: MedicalHistoryData): number {
  const checks: boolean[] = [
    m.chronicDiseases.length > 0 || m.chronicDetails.trim().length > 0,
    m.allergies.length > 0 || m.allergyDetails.trim().length > 0,
    m.currentMedications.trim().length > 0 || m.pastMedications.trim().length > 0,
    m.smokingIntensity.trim().length > 0,
    m.alcoholIntake.trim().length > 0,
    m.dietaryHabits.trim().length > 0,
    m.activityLevel.trim().length > 0,
    m.sleepPattern.trim().length > 0,
    m.stressLevel.trim().length > 0,
  ];
  return clampPct((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * @param profile Merged dashboard profile (from `useDashboardMe`).
 * @param medicalHistory Merged medical history from the same source.
 */
export function computeProfileCompletion(
  profile: DashboardProfile,
  medicalHistory: MedicalHistoryData,
): ProfileCompletionResult {
  const general = profile.professionalProfile
    ? generalProfessionalCompletion(profile)
    : generalPersonalCompletion(profile);
  const medical = medicalCompletion(medicalHistory);
  const mainHealthHub = clampPct((general + medical) / 2);
  return {
    overall: mainHealthHub,
    segments: { general, medical, mainHealthHub },
  };
}
