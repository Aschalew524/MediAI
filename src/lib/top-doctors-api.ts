import { isAxiosError } from "axios";

import api from "@/lib/axios";
import type { TopDoctor } from "@/lib/top-doctors-content";

export type TopDoctorsListResponse = {
  items: TopDoctor[];
  page: number;
  pageSize: number;
  total: number;
};

/**
 * Phase 5 — canonical condition / specialty enums. Kept as string literal
 * unions (rather than imported from the backend) so the frontend stays
 * decoupled. The actual values are sourced from `/top-doctors/match-options`
 * at runtime; the literals here are just for type-safety in code that
 * hardcodes labels.
 */
export type ConditionCategory =
  | "general_wellness"
  | "heart_circulation"
  | "skin"
  | "digestive_stomach"
  | "diabetes_hormones"
  | "mental_health"
  | "womens_health"
  | "childrens_health"
  | "bones_joints"
  | "eyes"
  | "ear_nose_throat"
  | "lungs_breathing"
  | "kidney_urinary"
  | "allergies"
  | "cancer_oncology"
  | "neurological"
  | "dental"
  | "reproductive_health"
  | "other";

export type MedicalSpecialty =
  | "general_practice"
  | "internal_medicine"
  | "cardiology"
  | "dermatology"
  | "endocrinology"
  | "gastroenterology"
  | "gynecology_obstetrics"
  | "hematology"
  | "infectious_disease"
  | "neurology"
  | "oncology"
  | "ophthalmology"
  | "orthopedics"
  | "ent_otolaryngology"
  | "pediatrics"
  | "psychiatry"
  | "pulmonology"
  | "rheumatology"
  | "urology"
  | "nephrology"
  | "general_surgery"
  | "neurosurgery"
  | "dentistry"
  | "allergology"
  | "plastic_surgery"
  | "other";

export type EnumOption<T extends string = string> = {
  value: T;
  label: string;
};

export type TopDoctorMatchOptions = {
  conditionCategories: EnumOption<ConditionCategory>[];
  medicalSpecialties: EnumOption<MedicalSpecialty>[];
};

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidTopDoctorId(id: string): boolean {
  return UUID_V4_RE.test(id);
}

export type ListTopDoctorsParams = {
  page?: number;
  pageSize?: number;
  specialty?: string;
  q?: string;
  /** Phase 5 — patient-facing condition categories (CSV joined client-side). */
  conditions?: ConditionCategory[];
  /** Phase 5 — escape hatch for direct specialty filter (CSV joined). */
  medicalSpecialties?: MedicalSpecialty[];
  /** Phase 5 — for ranking only; pass the patient's region or override. */
  region?: string;
  /** Phase 5 — boost doctors who explicitly accept this consultation type. */
  consultationType?: "video" | "written" | "in_person" | "hybrid";
};

function listQueryParams(
  params: ListTopDoctorsParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };
  if (params.specialty && params.specialty !== "all") {
    out.specialty = params.specialty;
  }
  if (params.q?.trim()) {
    out.q = params.q.trim().slice(0, 120);
  }
  if (params.conditions && params.conditions.length > 0) {
    // Backend accepts CSV or repeated query params. CSV keeps the URL short.
    out.conditions = params.conditions.join(",");
  }
  if (params.medicalSpecialties && params.medicalSpecialties.length > 0) {
    out.medicalSpecialties = params.medicalSpecialties.join(",");
  }
  if (params.region?.trim()) {
    out.region = params.region.trim().slice(0, 60);
  }
  if (params.consultationType) {
    out.consultationType = params.consultationType;
  }
  return out;
}

export async function getTopDoctorSpecialties(): Promise<string[]> {
  const { data } = await api.get<{ specialties: string[] }>("/top-doctors/specialties");
  return data.specialties;
}

/**
 * Phase 5 — single source of truth for the patient's condition picker + the
 * doctor's canonical specialty dropdown. Safe to cache for the duration of
 * the session; the lists only change between deploys.
 */
export async function getTopDoctorMatchOptions(): Promise<TopDoctorMatchOptions> {
  const { data } = await api.get<TopDoctorMatchOptions>(
    "/top-doctors/match-options",
  );
  return data;
}

export async function listTopDoctors(
  params: ListTopDoctorsParams,
): Promise<TopDoctorsListResponse> {
  const { data } = await api.get<TopDoctorsListResponse>("/top-doctors", {
    params: listQueryParams(params),
  });
  return data;
}

export async function getTopDoctorById(id: string): Promise<TopDoctor> {
  const { data } = await api.get<TopDoctor>(`/top-doctors/${id}`);
  return data;
}

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

export function isBadRequestError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 400;
}
