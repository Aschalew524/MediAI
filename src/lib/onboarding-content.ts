export type UserRoleOption = {
  id: "personal" | "professional";
  title: string;
  description: string;
};

export const userRoleOptions: UserRoleOption[] = [
  {
    id: "personal",
    title: "For Personal Health",
    description:
      "To understand and manage my or my family member's health conditions.",
  },
  {
    id: "professional",
    title: "As a Health Professional",
    description:
      "To streamline workflows, save time, improve patient interaction and outcomes.",
  },
];

export const ethiopianRegions = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Jimma",
  "Bahir Dar",
  "Mekelle",
  "Hawassa",
  "Oromia",
  "Sidama",
  "Somali",
  "South West Ethiopia",
  "Southern Nations, Nationalities, and Peoples",
  "Tigray",
];

export const onboardingStepLabels = [
  "Use Case",
  "Greeting",
  "Region",
  "Welcome",
  "General Information",
] as const;

export type MeasurementSystemOption = {
  id: "imperial" | "metric";
  title: string;
};

export const measurementSystemOptions: MeasurementSystemOption[] = [
  {
    id: "imperial",
    title: "lbs/ft/in",
  },
  {
    id: "metric",
    title: "kg/cm",
  },
];

export type SexOption = {
  id: "male" | "female" | "other";
  title: string;
};

export const sexOptions: SexOption[] = [
  { id: "male", title: "Male" },
  { id: "female", title: "Female" },
  { id: "other", title: "Other" },
];

export type FeatureOption = {
  id: "ai-doctor" | "lab-interpretation" | "top-doctors";
  title: string;
  description: string;
};

export const featureOptions: FeatureOption[] = [
  {
    id: "ai-doctor",
    title: "Personal AI Doctor",
    description: "Ask any health questions and get tailored insights.",
  },
  {
    id: "lab-interpretation",
    title: "Lab Test Interpretation",
    description: "Easily understand and interpret your lab test results.",
  },
  {
    id: "top-doctors",
    title: "Consultation with Top Doctors",
    description: "Access 350+ top doctors from the US and Ethiopia.",
  },
];

export const generalInformationSteps = [
  "Age",
  "Measurement system",
  "Sex assigned at birth",
] as const;
