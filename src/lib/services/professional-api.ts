import api from "@/lib/axios";
import type {
  DashboardProfile,
  MedicalHistoryData,
} from "@/lib/dashboard-content";

/** A patient row as exposed to a logged-in doctor. */
export type ApiPatientSummary = {
  id: string;
  preferredName: string;
  email: string;
  age: string;
  sexAtBirth: "male" | "female" | "other";
  region?: string;
  hasMedicalHistory: boolean;
  registeredAt: string;
  lastActivityAt: string | null;
};

export type ApiPatientList = {
  items: ApiPatientSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiPatientDetail = {
  id: string;
  email: string;
  profile: DashboardProfile;
  medicalHistory: Record<string, unknown> | null;
  registeredAt: string;
  /** ISO timestamp of the last write to the patient's profile/medical history. */
  lastUpdatedAt: string;
};

/**
 * Fields a doctor is allowed to patch on a patient. Mirrors the backend
 * `PatchMeProfileDto` minus identity-only fields (`professionalProfile`,
 * `preferredFeature`) which the server strips anyway.
 */
export type PatchPatientProfileBody = Partial<
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
  >
>;

export type ApiPatientMessage = {
  id: string;
  threadId: string;
  sender: "doctor" | "patient";
  senderUserId: string;
  body: string;
  createdAt: string;
};

export type ApiPatientMessageThread = {
  threadId: string;
  patientId: string;
  patientName: string;
  messages: ApiPatientMessage[];
  /**
   * Phase 4 — ISO timestamp at which the chat window closes for this
   * doctor↔patient pair. Null when no booking is currently active; the
   * doctor's composer is disabled in that case until the patient books a
   * follow-up.
   */
  chatWindowEndsAt: string | null;
};

export type ListPatientsParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

function clean(params: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v as string | number;
  }
  return out;
}

export async function listProfessionalPatients(
  params: ListPatientsParams = {},
): Promise<ApiPatientList> {
  const { data } = await api.get<ApiPatientList>("/professional/patients", {
    params: clean(params),
  });
  return data;
}

export async function getProfessionalPatient(
  patientId: string,
): Promise<ApiPatientDetail> {
  const { data } = await api.get<ApiPatientDetail>(
    `/professional/patients/${encodeURIComponent(patientId)}`,
  );
  return data;
}

export async function listProfessionalPatientMessages(
  patientId: string,
  limit?: number,
): Promise<ApiPatientMessageThread> {
  const { data } = await api.get<ApiPatientMessageThread>(
    `/professional/patients/${encodeURIComponent(patientId)}/messages`,
    { params: clean({ limit }) },
  );
  // Backend marks patient → doctor messages as read on this fetch, so let the
  // navbar's unread-badge refresh instead of waiting for its 30s poll.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mediai:messages-changed"));
  }
  return data;
}

export async function sendProfessionalPatientMessage(
  patientId: string,
  body: string,
): Promise<ApiPatientMessage> {
  const { data } = await api.post<ApiPatientMessage>(
    `/professional/patients/${encodeURIComponent(patientId)}/messages`,
    { body },
  );
  return data;
}

/**
 * Patch identifying / vital fields on the patient's profile. Returns the
 * fresh `ApiPatientDetail` so the caller can rerender from the canonical
 * server snapshot (including `lastUpdatedAt`) without an extra GET round-trip.
 */
export async function patchProfessionalPatientProfile(
  patientId: string,
  body: PatchPatientProfileBody,
): Promise<ApiPatientDetail> {
  const { data } = await api.patch<ApiPatientDetail>(
    `/professional/patients/${encodeURIComponent(patientId)}/profile`,
    body,
  );
  return data;
}

/**
 * Replace the patient's `medicalHistory` JSON. The body must be a complete
 * `MedicalHistoryData` payload — partials get rejected by the validator.
 */
export async function putProfessionalPatientMedicalHistory(
  patientId: string,
  body: MedicalHistoryData,
): Promise<ApiPatientDetail> {
  const { data } = await api.put<ApiPatientDetail>(
    `/professional/patients/${encodeURIComponent(patientId)}/medical-history`,
    body,
  );
  return data;
}
