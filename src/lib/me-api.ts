import { isAxiosError } from "axios";

import { messageFromAxiosData } from "@/lib/auth.types";
import type { DashboardProfile, MedicalHistoryData } from "@/lib/dashboard-content";
import { defaultMedicalHistory } from "@/lib/dashboard-content";
import api from "@/lib/axios";

export const DASHBOARD_ME_EVENT = "mediai:me-refresh";

export function dispatchMeRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DASHBOARD_ME_EVENT));
  }
}

/**
 * `POST /onboarding/complete` body (matches Nest `CompleteOnboardingDto`).
 */
export type CompleteOnboardingPayload = {
  role: "personal" | "professional";
  preferredName: string;
  confirmedAdult: boolean;
  region: string;
  age: number;
  measurementSystem: "imperial" | "metric";
  weight: string;
  heightFeet?: string;
  heightInches?: string;
  heightCm?: string;
  sexAtBirth: "male" | "female" | "other";
  preferredFeature:
    | "ai-doctor"
    | "top-doctors";
};

export type GetMeProfileResponse = {
  profile: DashboardProfile | null;
  medicalHistory: MedicalHistoryData | null;
  aiDoctorSetupCompleted: boolean;
};

export function userFacingMeError(
  err: unknown,
  fallback: string,
): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  const status = err.response?.status;
  if (status === 400) {
    return messageFromAxiosData(err.response?.data) ?? "Please check your input";
  }
  if (status === 403) {
    return messageFromAxiosData(err.response?.data) ?? "This action is not allowed for your account";
  }
  if (status === 404) {
    return messageFromAxiosData(err.response?.data) ?? "No profile found. Complete onboarding first.";
  }
  return messageFromAxiosData(err.response?.data) ?? fallback;
}

export type MeProfileApi = {
  preferredName: string;
  age: string;
  region: string;
  measurementSystem: string;
  weight: string;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  sexAtBirth: "male" | "female" | "other" | null;
  preferredFeature: string;
  professionalProfile?: unknown;
};

function toProfessional(
  raw: unknown,
): DashboardProfile["professionalProfile"] | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  return raw as DashboardProfile["professionalProfile"];
}

export function mapMeProfileToDashboard(
  p: MeProfileApi,
): DashboardProfile {
  const pf = p.preferredFeature as DashboardProfile["preferredFeature"];
  return {
    preferredName: p.preferredName,
    age: p.age,
    region: p.region,
    measurementSystem: p.measurementSystem as DashboardProfile["measurementSystem"],
    weight: p.weight,
    heightFeet: p.heightFeet,
    heightInches: p.heightInches,
    heightCm: p.heightCm,
    sexAtBirth: p.sexAtBirth,
    preferredFeature: pf,
    professionalProfile: toProfessional(p.professionalProfile),
  };
}

function normalizeMedicalHistory(
  raw: Record<string, unknown> | null,
): MedicalHistoryData {
  if (!raw || typeof raw !== "object") {
    return { ...defaultMedicalHistory };
  }
  const a = (x: unknown): string[] =>
    Array.isArray(x) && x.every((e) => typeof e === "string")
      ? (x as string[])
      : [];
  const s = (x: unknown): string => (typeof x === "string" ? x : "");
  return {
    chronicDiseases: a(raw.chronicDiseases),
    chronicDetails: s(raw.chronicDetails),
    familyHistory: a(raw.familyHistory),
    familyHistoryDetails: s(raw.familyHistoryDetails),
    allergies: a(raw.allergies),
    allergyDetails: s(raw.allergyDetails),
    surgicalHistory: s(raw.surgicalHistory),
    currentMedications: s(raw.currentMedications),
    pastMedications: s(raw.pastMedications),
    smokingIntensity: s(raw.smokingIntensity),
    alcoholIntake: s(raw.alcoholIntake),
    dietaryHabits: s(raw.dietaryHabits),
    activityLevel: s(raw.activityLevel),
    sleepPattern: s(raw.sleepPattern),
    stressLevel: s(raw.stressLevel),
  };
}

export async function getMeProfile(): Promise<GetMeProfileResponse> {
  const { data } = await api.get<{
    profile: MeProfileApi | null;
    medicalHistory: Record<string, unknown> | null;
    aiDoctorSetupCompleted: boolean;
  }>("/me/profile");
  if (!data.profile) {
    return {
      profile: null,
      medicalHistory: data.medicalHistory
        ? normalizeMedicalHistory(data.medicalHistory)
        : null,
      aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
    };
  }
  return {
    profile: mapMeProfileToDashboard(data.profile),
    medicalHistory: data.medicalHistory
      ? normalizeMedicalHistory(data.medicalHistory)
      : null,
    aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
  };
}

export async function postOnboardingComplete(
  body: CompleteOnboardingPayload,
) {
  await api.post("/onboarding/complete", body);
}

export type PatchMeProfileBody = {
  professionalProfile?: Record<string, unknown>;
} & Partial<
  Pick<
    DashboardProfile,
    | "preferredName"
    | "age"
    | "region"
    | "measurementSystem"
    | "weight"
    | "heightFeet"
    | "heightInches"
    | "heightCm"
    | "sexAtBirth"
    | "preferredFeature"
  >
>;

/**
 * Map a full dashboard profile to a PATCH /me/profile body (never sends `role`).
 */
export function profileToPatchBody(
  p: DashboardProfile,
): PatchMeProfileBody {
  return {
    preferredName: p.preferredName,
    age: p.age,
    region: p.region,
    measurementSystem: p.measurementSystem,
    weight: p.weight,
    heightFeet: p.heightFeet,
    heightInches: p.heightInches,
    heightCm: p.heightCm,
    sexAtBirth: p.sexAtBirth === null ? undefined : p.sexAtBirth,
    preferredFeature: p.preferredFeature ?? undefined,
    professionalProfile: p.professionalProfile
      ? ({ ...p.professionalProfile } as Record<string, unknown>)
      : undefined,
  };
}

export async function patchMeProfile(
  body: PatchMeProfileBody,
): Promise<GetMeProfileResponse> {
  const { data } = await api.patch<{
    profile: MeProfileApi | null;
    medicalHistory: Record<string, unknown> | null;
    aiDoctorSetupCompleted: boolean;
  }>("/me/profile", {
    ...body,
    sexAtBirth:
      body.sexAtBirth === null
        ? undefined
        : body.sexAtBirth,
  });
  if (!data.profile) {
    return {
      profile: null,
      medicalHistory: data.medicalHistory
        ? normalizeMedicalHistory(data.medicalHistory)
        : null,
      aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
    };
  }
  return {
    profile: mapMeProfileToDashboard(data.profile),
    medicalHistory: data.medicalHistory
      ? normalizeMedicalHistory(data.medicalHistory)
      : null,
    aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
  };
}

export async function putMedicalHistory(
  body: MedicalHistoryData,
): Promise<GetMeProfileResponse> {
  const { data } = await api.put<{
    profile: MeProfileApi | null;
    medicalHistory: Record<string, unknown> | null;
    aiDoctorSetupCompleted: boolean;
  }>("/me/medical-history", body);
  if (!data.profile) {
    return {
      profile: null,
      medicalHistory: data.medicalHistory
        ? normalizeMedicalHistory(data.medicalHistory)
        : null,
      aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
    };
  }
  return {
    profile: mapMeProfileToDashboard(data.profile),
    medicalHistory: data.medicalHistory
      ? normalizeMedicalHistory(data.medicalHistory)
      : null,
    aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
  };
}

/**
 * `DELETE /me/account` — email users send `password`; Google-only may send `confirm: "DELETE"`.
 */
export async function deleteMeAccount(
  body: { password?: string; confirm?: "DELETE" },
): Promise<void> {
  await api.delete("/me/account", { data: body });
}

export async function patchAiDoctorSetup(
  completed: boolean,
): Promise<GetMeProfileResponse> {
  const { data } = await api.patch<{
    profile: MeProfileApi | null;
    medicalHistory: Record<string, unknown> | null;
    aiDoctorSetupCompleted: boolean;
  }>("/me/ai-doctor/setup", { completed });
  if (!data.profile) {
    return {
      profile: null,
      medicalHistory: data.medicalHistory
        ? normalizeMedicalHistory(data.medicalHistory)
        : null,
      aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
    };
  }
  return {
    profile: mapMeProfileToDashboard(data.profile),
    medicalHistory: data.medicalHistory
      ? normalizeMedicalHistory(data.medicalHistory)
      : null,
    aiDoctorSetupCompleted: data.aiDoctorSetupCompleted,
  };
}

