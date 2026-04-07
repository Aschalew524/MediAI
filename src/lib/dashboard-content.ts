export type MeasurementSystem = "imperial" | "metric";
export type SexAtBirth = "male" | "female" | "other" | null;
export type PreferredFeature =
  | "ai-doctor"
  | "lab-test-interpretation"
  | "top-doctors"
  | null;

export type ProfessionalTitle = "dr" | "prof" | "mr" | "ms" | string;

export type ProfessionalProfile = {
  title: ProfessionalTitle;
  fullName: string;
  specialty: string;
  region: string;
  invitePatient?: boolean;
  patientEmail?: string;
  patientHistory?: string;
  familyHistory?: string;
  medicationsHistory?: string;
  allergies?: string;
  smokingIntensity?: string;
  alcoholIntake?: string;
  physicalActivity?: string;
  dietaryHabits?: string;
  sleepPattern?: string;
  stressLevel?: string;
  attachedHistoryFileName?: string;
};

export type DashboardProfile = {
  preferredName: string;
  age: string;
  region: string;
  measurementSystem: MeasurementSystem;
  weight: string;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  sexAtBirth: SexAtBirth;
  preferredFeature: PreferredFeature;
  professionalProfile?: ProfessionalProfile;
};

export const dashboardProfileStorageKey = "mediai-onboarding-profile";
export const aiDoctorSetupStorageKey = "mediai-ai-doctor-setup-completed";

export const defaultDashboardProfile: DashboardProfile = {
  preferredName: "Joe",
  age: "55",
  region: "Addis Ababa",
  measurementSystem: "imperial",
  weight: "77",
  heightFeet: "5",
  heightInches: "6",
  heightCm: "",
  sexAtBirth: "male",
  preferredFeature: "ai-doctor",
};

export const dashboardCards = [
  {
    title: "Chat With AI Doctor",
    description: "",
    href: "/dashboard/ai-doctor",
    accent: "bot" as const,
  },
  {
    title: "Lab Tests & Screening",
    description: "",
    href: "/dashboard/lab-test-interpretation",
    accent: "lab" as const,
  },
  {
    title: "Check Up Plan",
    description: "Coming Soon",
    href: "#",
    accent: "bot" as const,
    muted: true,
  },
  {
    title: "Health Reports",
    description: "Coming Soon",
    href: "#",
    accent: "lab" as const,
    muted: true,
  },
] as const;

export const consultDoctorsCard = {
  title: "Consult Top Doctors",
  description: "Online Consultation with top Doctors from the US and Europe.",
  href: "/dashboard/top-doctors",
};

export const mainHealthInfoSections = [
  "General Information",
  "Medications",
  "Life patterns and Habits",
] as const;

export function getProfileName(profile: DashboardProfile) {
  return profile.preferredName.trim() || "Joe";
}

function getProfessionalTitleLabel(title?: ProfessionalTitle) {
  switch (title) {
    case "dr":
      return "Dr.";
    case "prof":
      return "Prof.";
    case "mr":
      return "Mr.";
    case "ms":
      return "Ms.";
    default:
      return title ?? "";
  }
}

export function getProfessionalName(profile: DashboardProfile) {
  const professional = profile.professionalProfile;
  if (!professional) return getProfileName(profile);

  const title = getProfessionalTitleLabel(professional.title);
  return [title, professional.fullName.trim()].filter(Boolean).join(" ").trim();
}

/** Total inches → centimetres (for imperial → metric display). */
function heightImperialToCm(feet: number, inches: number): number {
  const totalIn = feet * 12 + inches;
  return Math.round(totalIn * 2.54);
}

/** Pounds → kilograms (one decimal) for display. */
function weightLbsToKg(lbs: number): number {
  return Math.round((lbs / 2.2046226218) * 10) / 10;
}

/** General Information always shows metric (cm / kg), converting when needed. */
export function getProfileHeight(profile: DashboardProfile) {
  const cmRaw = profile.heightCm?.trim();
  if (cmRaw && Number(cmRaw) > 0) {
    return `${cmRaw} cm`;
  }

  const feet = Number(profile.heightFeet) || 0;
  const inches = Number(profile.heightInches) || 0;
  if (feet > 0 || inches > 0) {
    return `${heightImperialToCm(feet, inches)} cm`;
  }

  return "170 cm";
}

export function getProfileWeight(profile: DashboardProfile) {
  const raw = profile.weight?.trim() || "0";
  const value = Number(raw) || 0;
  if (value <= 0) {
    return "—";
  }

  if (profile.measurementSystem === "metric") {
    return `${raw} kg`;
  }

  return `${weightLbsToKg(value)} kg`;
}

export function getProfileSex(profile: DashboardProfile) {
  if (!profile.sexAtBirth) return "Male";
  return `${profile.sexAtBirth.charAt(0).toUpperCase()}${profile.sexAtBirth.slice(1)}`;
}
