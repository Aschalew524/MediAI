export type ConsultationType = "video" | "written";

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
};
