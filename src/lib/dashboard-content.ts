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
export const medicalHistoryStorageKey = "mediai-medical-history";

export type MedicalHistoryData = {
  chronicDiseases: string[];
  chronicDetails: string;
  allergies: string[];
  allergyDetails: string;
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
  allergies: [],
  allergyDetails: "",
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

export type FacilityType = "hospital" | "pharmacy" | "clinic";

export type HealthcareFacility = {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  phone: string;
  rating: number;
  verified: boolean;
  latitude: number;
  longitude: number;
  openNow: boolean;
};

export const healthcareFacilities: HealthcareFacility[] = [
  {
    id: "fac-001",
    name: "Tikur Anbessa Specialized Hospital",
    type: "hospital",
    address: "Churchill Ave, Addis Ababa",
    phone: "+251 11 551 1211",
    rating: 4.2,
    verified: true,
    latitude: 9.0192,
    longitude: 38.7525,
    openNow: true,
  },
  {
    id: "fac-002",
    name: "St. Paul's Hospital Millennium Medical College",
    type: "hospital",
    address: "Swaziland St, Addis Ababa",
    phone: "+251 11 827 5089",
    rating: 4.0,
    verified: true,
    latitude: 9.0408,
    longitude: 38.7468,
    openNow: true,
  },
  {
    id: "fac-003",
    name: "Kenema Pharmacy",
    type: "pharmacy",
    address: "Bole Rd, Addis Ababa",
    phone: "+251 11 661 2345",
    rating: 4.5,
    verified: true,
    latitude: 9.0054,
    longitude: 38.7636,
    openNow: true,
  },
  {
    id: "fac-004",
    name: "Bethzatha General Hospital",
    type: "hospital",
    address: "Kebena, Addis Ababa",
    phone: "+251 11 661 8080",
    rating: 4.3,
    verified: true,
    latitude: 9.0227,
    longitude: 38.7577,
    openNow: false,
  },
  {
    id: "fac-005",
    name: "Gishen Pharmacy",
    type: "pharmacy",
    address: "Meskel Sq, Addis Ababa",
    phone: "+251 11 515 4433",
    rating: 4.1,
    verified: false,
    latitude: 9.0107,
    longitude: 38.7612,
    openNow: true,
  },
  {
    id: "fac-006",
    name: "Hayat General Hospital",
    type: "hospital",
    address: "Haile Gebrselassie Rd, Addis Ababa",
    phone: "+251 11 662 9000",
    rating: 4.6,
    verified: true,
    latitude: 9.0003,
    longitude: 38.7872,
    openNow: true,
  },
  {
    id: "fac-007",
    name: "Ayer Tena Clinic",
    type: "clinic",
    address: "Ayer Tena, Addis Ababa",
    phone: "+251 11 390 1234",
    rating: 3.8,
    verified: true,
    latitude: 8.9826,
    longitude: 38.7235,
    openNow: false,
  },
  {
    id: "fac-008",
    name: "Zewditu Memorial Hospital",
    type: "hospital",
    address: "Ras Desta Damtew Ave, Addis Ababa",
    phone: "+251 11 551 5844",
    rating: 3.9,
    verified: true,
    latitude: 9.0148,
    longitude: 38.7472,
    openNow: true,
  },
  {
    id: "fac-009",
    name: "Bole Medhanealem Pharmacy",
    type: "pharmacy",
    address: "Bole Medhanealem, Addis Ababa",
    phone: "+251 11 662 7788",
    rating: 4.4,
    verified: true,
    latitude: 9.0012,
    longitude: 38.7796,
    openNow: true,
  },
  {
    id: "fac-010",
    name: "Kadisco General Hospital",
    type: "hospital",
    address: "Bisrate Gabriel, Addis Ababa",
    phone: "+251 11 442 1010",
    rating: 4.1,
    verified: true,
    latitude: 8.9942,
    longitude: 38.7402,
    openNow: true,
  },
];

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
