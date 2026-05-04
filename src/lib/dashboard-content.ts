export type MeasurementSystem = "imperial" | "metric";
export type SexAtBirth = "male" | "female" | "other" | null;
export type PreferredFeature =
  | "ai-doctor"
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
export const medicalHistoryStorageKey = "mediai-medical-history";

export type MedicalHistoryData = {
  chronicDiseases: string[];
  chronicDetails: string;
  familyHistory: string[];
  familyHistoryDetails: string;
  allergies: string[];
  allergyDetails: string;
  surgicalHistory: string;
  currentMedications: string;
  pastMedications: string;
  smokingIntensity: string;
  alcoholIntake: string;
  dietaryHabits: string;
  activityLevel: string;
  sleepPattern: string;
  stressLevel: string;
};

export const defaultMedicalHistory: MedicalHistoryData = {
  chronicDiseases: [],
  chronicDetails: "",
  familyHistory: [],
  familyHistoryDetails: "",
  allergies: [],
  allergyDetails: "",
  surgicalHistory: "",
  currentMedications: "",
  pastMedications: "",
  smokingIntensity: "",
  alcoholIntake: "",
  dietaryHabits: "",
  activityLevel: "",
  sleepPattern: "",
  stressLevel: "",
};

export const chronicDiseaseOptions = [
  "Diabetes",
  "Hypertension",
  "Cardiovascular Disease",
  "Thyroid Disorder",
  "Asthma / COPD",
  "Arthritis",
  "Cancer",
  "Kidney Disease",
] as const;

export const familyHistoryOptions = [
  "Heart Disease",
  "Diabetes",
  "Cancer",
  "Osteoporosis",
  "Stroke",
  "Mental Illness",
  "Asthma / Allergies",
] as const;

export const allergyOptions = [
  "Penicillin",
  "Sulfa Drugs",
  "Peanuts",
  "Dairy / Lactose",
  "Shellfish",
  "Pollen",
  "Latex",
  "Insect Stings",
] as const;

export const smokingOptions = [
  "Non-smoker",
  "1-10 Cigarettes/day",
  "About 1 pack/day",
  "More than 1 pack/day",
  "E-Cigarettes / Vaping",
] as const;

export const alcoholOptions = [
  "Non-drinker",
  "1-3 drinks/week",
  "4-7 drinks/week",
  "8-14 drinks/week",
  "15+ drinks/week",
] as const;

export const dietOptions = [
  "Non-specific diet",
  "Balanced Meals",
  "Frequent Fast Food",
  "Vegetarian / Vegan",
  "Specific Diet Plan (keto, high-protein, etc.)",
] as const;

export const activityOptions = [
  "Inactive",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
] as const;

export const sleepOptions = [
  "Less than 6 hours",
  "7-9 hours",
  "More than 9 hours",
  "Varies / Interrupted",
] as const;

export const stressOptions = [
  "Rarely Stressed",
  "Manageable Stress",
  "Regular (daily) Stress",
  "Almost Always Stressed",
] as const;

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
    title: "Messages With Doctors",
    description: "Chat directly with doctors who reach out to you.",
    href: "/dashboard/messages",
    accent: "messages" as const,
  },
  {
    title: "Find Nearby Facilities",
    description: "Locate verified hospitals, clinics, and pharmacies near you.",
    href: "/dashboard/facility-locator",
    accent: "facilities" as const,
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
    accent: "facilities" as const,
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
