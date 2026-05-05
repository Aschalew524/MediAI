import type { CompleteOnboardingPayload } from "@/lib/me-api";
import type { DashboardProfile } from "@/lib/dashboard-content";
import type { ProfessionalProfile } from "@/lib/dashboard-content";

const DEFAULT_FEATURE: CompleteOnboardingPayload["preferredFeature"] = "ai-doctor";

function parseNumberStrict(value: string): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function assertInRange(label: string, n: number, min: number, max: number): void {
  if (n < min || n > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
}

function validateMeasurements(input: {
  measurementSystem: "imperial" | "metric";
  weight: string;
  heightFeet?: string;
  heightInches?: string;
  heightCm?: string;
}): void {
  if (input.measurementSystem === "metric") {
    const w = parseNumberStrict(input.weight);
    const h = parseNumberStrict(input.heightCm ?? "");
    if (w == null || h == null) {
      throw new Error("Please enter weight and height (cm).");
    }
    assertInRange("Weight (kg)", w, 2, 500);
    assertInRange("Height (cm)", h, 30, 250);
    return;
  }

  const w = parseNumberStrict(input.weight);
  const feet = parseNumberStrict(input.heightFeet ?? "");
  const inches = parseNumberStrict(input.heightInches ?? "");
  if (w == null || feet == null || inches == null) {
    throw new Error("Please enter weight and height.");
  }
  assertInRange("Weight (lb)", w, 5, 1100);
  assertInRange("Height (ft)", feet, 1, 8);
  assertInRange("Height (in)", inches, 0, 11);
}

/**
 * Clamps and parses age for `CompleteOnboardingDto` (1–130).
 */
export function parseOnboardingAge(value: string): number {
  const n = Math.floor(Number.parseInt(String(value).trim(), 10));
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 130) return 130;
  return n;
}

type PersonalFormLike = {
  role: "personal";
  preferredName: string;
  isConfirmedAdult: boolean;
  region: string;
  age: string;
  measurementSystem: "imperial" | "metric" | null;
  weight: string;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  sexAtBirth: "male" | "female" | "other" | null;
  preferredFeature:
    | "ai-doctor"
    | "top-doctors"
    | null;
};

export function buildPersonalOnboardingBody(
  form: PersonalFormLike,
): CompleteOnboardingPayload {
  if (!form.region) {
    throw new Error("Please select your region.");
  }
  if (!form.isConfirmedAdult) {
    throw new Error("Please confirm you are 18+ or a legal guardian.");
  }
  if (!form.sexAtBirth) {
    throw new Error("Please select sex.");
  }
  const ms = form.measurementSystem ?? "imperial";
  validateMeasurements({
    measurementSystem: ms,
    weight: form.weight,
    heightFeet: form.heightFeet,
    heightInches: form.heightInches,
    heightCm: form.heightCm,
  });

  const base: CompleteOnboardingPayload = {
    role: "personal",
    preferredName: form.preferredName.trim(),
    confirmedAdult: form.isConfirmedAdult,
    region: form.region,
    age: parseOnboardingAge(form.age),
    measurementSystem: ms,
    weight: String(form.weight).trim(),
    sexAtBirth: form.sexAtBirth,
    preferredFeature: form.preferredFeature ?? DEFAULT_FEATURE,
  };
  if (ms === "imperial") {
    return {
      ...base,
      heightFeet: String(form.heightFeet).trim(),
      heightInches: String(form.heightInches).trim(),
    };
  }
  return {
    ...base,
    heightCm: String(form.heightCm).trim(),
  };
}

/**
 * When the professional user skips the patient path (dashboard profile uses defaults
 * for health fields), mirror the old localStorage merge of `defaultDashboardProfile`.
 */
export function buildProfessionalSkipOnboardingBody(
  defaults: DashboardProfile,
  region: string,
  preferredNameForGreeting: string,
): CompleteOnboardingPayload {
  if (!region) {
    throw new Error("Please select your region.");
  }
  const ms = defaults.measurementSystem;
  const base: CompleteOnboardingPayload = {
    role: "professional",
    preferredName: preferredNameForGreeting || defaults.preferredName,
    confirmedAdult: true,
    region,
    age: parseOnboardingAge(defaults.age),
    measurementSystem: ms,
    weight: String(defaults.weight).trim(),
    sexAtBirth: (defaults.sexAtBirth as "male" | "female" | "other") || "other",
    preferredFeature: (defaults.preferredFeature as CompleteOnboardingPayload["preferredFeature"]) || DEFAULT_FEATURE,
  };
  if (ms === "imperial") {
    return {
      ...base,
      heightFeet: String(defaults.heightFeet).trim(),
      heightInches: String(defaults.heightInches).trim(),
    };
  }
  return {
    ...base,
    heightCm: String(defaults.heightCm).trim(),
  };
}

export function buildProfessionalWithPatientOnboardingBody(
  defaults: DashboardProfile,
  form: {
    patientName: string;
    patientAge: string;
    patientSex: "male" | "female" | "other" | "";
    measurementSystem: "imperial" | "metric";
    weight: string;
    heightFeet: string;
    heightInches: string;
    heightCm: string;
    region: string;
  },
): CompleteOnboardingPayload {
  if (!form.region) {
    throw new Error("Please select your region.");
  }
  if (!form.patientSex) {
    throw new Error("Please select biological sex for the patient.");
  }
  const ms = form.measurementSystem;
  validateMeasurements({
    measurementSystem: ms,
    weight: form.weight,
    heightFeet: form.heightFeet,
    heightInches: form.heightInches,
    heightCm: form.heightCm,
  });
  const base: CompleteOnboardingPayload = {
    role: "professional",
    preferredName: form.patientName.trim() || defaults.preferredName,
    confirmedAdult: true,
    region: form.region,
    age: parseOnboardingAge(form.patientAge),
    measurementSystem: ms,
    weight: String(form.weight).trim(),
    sexAtBirth: form.patientSex,
    preferredFeature: "ai-doctor",
  };
  if (ms === "imperial") {
    return {
      ...base,
      heightFeet: String(form.heightFeet).trim(),
      heightInches: String(form.heightInches).trim(),
    };
  }
  return {
    ...base,
    heightCm: String(form.heightCm).trim(),
  };
}

export function buildPatchProfessionalFromForm(
  form: {
    title: string;
    fullName: string;
    specialty: string;
    region: string;
    invitePatient: boolean;
    patientEmail: string;
    patientHistory: string;
    familyHistory: string;
    medicationsHistory: string;
    allergies: string;
    smokingIntensity: string;
    alcoholIntake: string;
    physicalActivity: string;
    dietaryHabits: string;
    sleepPattern: string;
    stressLevel: string;
    attachedHistoryFileName: string;
  },
  fullPatientDetails: boolean,
): ProfessionalProfile {
  const base: ProfessionalProfile = {
    title: form.title,
    fullName: form.fullName.trim(),
    specialty: form.specialty,
    region: form.region,
  };
  if (!fullPatientDetails) {
    return base;
  }
  return {
    ...base,
    invitePatient: form.invitePatient,
    patientEmail: form.patientEmail.trim() || undefined,
    patientHistory: form.patientHistory.trim() || undefined,
    familyHistory: form.familyHistory.trim() || undefined,
    medicationsHistory: form.medicationsHistory.trim() || undefined,
    allergies: form.allergies.trim() || undefined,
    smokingIntensity: form.smokingIntensity || undefined,
    alcoholIntake: form.alcoholIntake || undefined,
    physicalActivity: form.physicalActivity || undefined,
    dietaryHabits: form.dietaryHabits || undefined,
    sleepPattern: form.sleepPattern || undefined,
    stressLevel: form.stressLevel || undefined,
    attachedHistoryFileName: form.attachedHistoryFileName || undefined,
  };
}
