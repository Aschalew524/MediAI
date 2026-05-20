/**
 * Mirrors the backend Prisma `ConsultationType` enum (`video`, `written`,
 * `in_person`, `hybrid` — see Phase 4 migration
 * `20260520000000_consultation_meeting_link`). Keep these two enums in sync.
 */
export type ConsultationType = "video" | "written" | "in_person" | "hybrid";

export type DoctorExperienceItem = {
  title: string;
  subtitle: string;
};

/** Matches Nest `TopDoctorDto` and published doctor payloads. */
export type TopDoctor = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  subSpecialty: string;
  yearsOfExperience: number;
  diseases: string[];
  consultationFees: {
    video: number;
    written: number;
  };
  heroImageUrl: string;
  education: {
    degree: string;
    year: string;
  };
  biography: string[];
  experience: DoctorExperienceItem[];
  affiliations: DoctorExperienceItem[];
  publicationsSummary: string;
  /**
   * Phase 5 — canonical specialty code (used by the matching layer). Null
   * means the doctor's free-text `specialty` hasn't been mapped yet.
   */
  medicalSpecialty?: string | null;
  /** Phase 5 — doctor's region, used by the "in your region" badge. */
  region?: string | null;
  /**
   * Phase 5 — server-computed badges. Omitted when the caller didn't supply
   * enough context (e.g. anonymous list calls).
   */
  inRegion?: boolean;
  matchesConditions?: boolean;
  /**
   * Phase 5 — consultation methods the doctor opted into. Empty = all.
   * Drives the booking modal's method radio defaults.
   */
  acceptedConsultationTypes?: ConsultationType[];
};
