import type { MeasurementSystemOption, SexOption, ProfessionalTitleOption } from "@/lib/onboarding-content";

export type ProfessionalOnboardingDraftV1 = {
  v: 1;
  savedAt: string;
  currentStep: number;
  expandedNotes: {
    familyHistory: boolean;
    medicationsHistory: boolean;
    allergies: boolean;
  };
  form: {
    title: ProfessionalTitleOption["id"] | "";
    fullName: string;
    specialty: string;
    region: string;
    patientName: string;
    patientAge: string;
    patientSex: SexOption["id"] | "";
    invitePatient: boolean;
    patientEmail: string;
    patientHistory: string;
    attachedHistoryFileName: string;
    familyHistory: string;
    medicationsHistory: string;
    allergies: string;
    measurementSystem: MeasurementSystemOption["id"];
    weight: string;
    heightFeet: string;
    heightInches: string;
    heightCm: string;
    smokingIntensity: string;
    alcoholIntake: string;
    physicalActivity: string;
    dietaryHabits: string;
    sleepPattern: string;
    stressLevel: string;
  };
};

const KEY = "mediai:onboardingProfessionalDraft:v1";
const TTL_MS = 24 * 60 * 60 * 1000;

function safeGet(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function safeSet(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
}

export function clearProfessionalOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

function isDraftExpired(savedAtIso: string): boolean {
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > TTL_MS;
}

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function isBool(x: unknown): x is boolean {
  return typeof x === "boolean";
}

function isNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function normalize(raw: unknown): ProfessionalOnboardingDraftV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1) return null;
  if (!isString(r.savedAt) || isDraftExpired(r.savedAt)) return null;
  if (!isNum(r.currentStep)) return null;
  if (!r.form || typeof r.form !== "object" || Array.isArray(r.form)) return null;

  const f = r.form as Record<string, unknown>;
  const ms = f.measurementSystem === "metric" ? "metric" : "imperial";
  const sex =
    f.patientSex === "male" || f.patientSex === "female" || f.patientSex === "other"
      ? (f.patientSex as "male" | "female" | "other")
      : "";
  const title = isString(f.title) ? (f.title as ProfessionalTitleOption["id"]) : "dr";

  const enRaw = r.expandedNotes;
  const en =
    enRaw && typeof enRaw === "object" && !Array.isArray(enRaw)
      ? (enRaw as Record<string, unknown>)
      : {};

  return {
    v: 1,
    savedAt: r.savedAt,
    currentStep: Math.floor(r.currentStep),
    expandedNotes: {
      familyHistory: isBool(en.familyHistory) ? en.familyHistory : false,
      medicationsHistory: isBool(en.medicationsHistory) ? en.medicationsHistory : false,
      allergies: isBool(en.allergies) ? en.allergies : false,
    },
    form: {
      title,
      fullName: isString(f.fullName) ? f.fullName : "",
      specialty: isString(f.specialty) ? f.specialty : "",
      region: isString(f.region) ? f.region : "",
      patientName: isString(f.patientName) ? f.patientName : "",
      patientAge: isString(f.patientAge) ? f.patientAge : "",
      patientSex: sex,
      invitePatient: isBool(f.invitePatient) ? f.invitePatient : false,
      patientEmail: isString(f.patientEmail) ? f.patientEmail : "",
      patientHistory: isString(f.patientHistory) ? f.patientHistory : "",
      attachedHistoryFileName: isString(f.attachedHistoryFileName) ? f.attachedHistoryFileName : "",
      familyHistory: isString(f.familyHistory) ? f.familyHistory : "",
      medicationsHistory: isString(f.medicationsHistory) ? f.medicationsHistory : "",
      allergies: isString(f.allergies) ? f.allergies : "",
      measurementSystem: ms,
      weight: isString(f.weight) ? f.weight : "",
      heightFeet: isString(f.heightFeet) ? f.heightFeet : "",
      heightInches: isString(f.heightInches) ? f.heightInches : "",
      heightCm: isString(f.heightCm) ? f.heightCm : "",
      smokingIntensity: isString(f.smokingIntensity) ? f.smokingIntensity : "",
      alcoholIntake: isString(f.alcoholIntake) ? f.alcoholIntake : "",
      physicalActivity: isString(f.physicalActivity) ? f.physicalActivity : "",
      dietaryHabits: isString(f.dietaryHabits) ? f.dietaryHabits : "",
      sleepPattern: isString(f.sleepPattern) ? f.sleepPattern : "",
      stressLevel: isString(f.stressLevel) ? f.stressLevel : "",
    },
  };
}

export function loadProfessionalOnboardingDraft(): ProfessionalOnboardingDraftV1 | null {
  const raw = safeGet();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const norm = normalize(parsed);
    if (!norm) {
      clearProfessionalOnboardingDraft();
      return null;
    }
    return norm;
  } catch {
    clearProfessionalOnboardingDraft();
    return null;
  }
}

export function saveProfessionalOnboardingDraft(draft: ProfessionalOnboardingDraftV1): void {
  safeSet(JSON.stringify(draft));
}

