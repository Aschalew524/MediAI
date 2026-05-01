/**
 * Profile completion (v1) — computed only on the client from `GET /me` fields already exposed
 * via `useDashboardMe` (`DashboardProfile` + `MedicalHistoryData`). No Nest change required for v1.
 *
 * v1 rules:
 * - Personal: "general" = name, age, region, weight, height (by measurement system), sex at birth.
 * - Professional: "general" = title, full name, specialty, region on `professionalProfile`.
 * - "medical" = chronic block, allergies block, medications block, and six lifestyle text fields.
 * - "mainHealthHub" = average of general + medical (the Main Health hub links to both areas).
 * - "overall" = same as mainHealthHub for a single headline score.
 *
 * v2 ideas: server-side `profileCompletion` DTO, file uploads, vitals, AI-doctor setup weighting, per-route checklists.
 */
import type { DashboardProfile, MedicalHistoryData } from "@/lib/dashboard-content";

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
