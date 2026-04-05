export type MeasurementSystem = "imperial" | "metric";
export type SexAtBirth = "male" | "female" | "other" | null;
export type PreferredFeature =
  | "ai-doctor"
  | "lab-interpretation"
  | "top-doctors"
  | null;

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
};

export const dashboardProfileStorageKey = "mediai-onboarding-profile";

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
    href: "/dashboard/profile/lab-test-interpretation",
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
    title: "Check Up Plan",
    description: "Coming Soon",
    href: "#",
    accent: "bot" as const,
    muted: true,
  },
] as const;

export const consultDoctorsCard = {
  title: "Consult Top Doctors",
  description: "Online Consultation with top Doctors from the US and Europe.",
  href: "#",
};

export const mainHealthInfoSections = [
  "General Information",
  "Medications",
  "Life patterns and Habits",
] as const;

export const labInterpretationCategories = [
  "Blood",
  "Urine",
  "Pap Smear",
  "Semen Analysis",
  "Stool Test",
  "Swab Test",
] as const;

export const uploadHighlights = [
  "Upload your results",
  "Receive detailed interpretation",
  "Get insights and recommendations",
] as const;

export function getProfileName(profile: DashboardProfile) {
  return profile.preferredName.trim() || "Joe";
}

export function getProfileHeight(profile: DashboardProfile) {
  if (profile.measurementSystem === "metric") {
    return profile.heightCm ? `${profile.heightCm} cm` : "170 cm";
  }

  const feet = profile.heightFeet || "5";
  const inches = profile.heightInches || "6";
  return `${feet}' ${inches}"`;
}

export function getProfileWeight(profile: DashboardProfile) {
  const value = profile.weight || "77";
  return profile.measurementSystem === "metric" ? `${value} kg` : `${value} lbs`;
}

export function getProfileSex(profile: DashboardProfile) {
  if (!profile.sexAtBirth) return "Male";
  return `${profile.sexAtBirth.charAt(0).toUpperCase()}${profile.sexAtBirth.slice(1)}`;
}
