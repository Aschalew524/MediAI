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
  id: "ai-doctor" | "lab-test-interpretation" | "top-doctors";
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
    id: "lab-test-interpretation",
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

export type ProfessionalTitleOption = {
  id: "dr" | "prof" | "mr" | "ms";
  label: string;
};

export const professionalTitleOptions: ProfessionalTitleOption[] = [
  { id: "dr", label: "Dr." },
  { id: "prof", label: "Prof." },
  { id: "mr", label: "Mr." },
  { id: "ms", label: "Ms." },
];

export const professionalSpecialtyOptions = [
  "Dermatology",
  "Oncology",
  "Neurosurgery",
  "Cardiology",
  "Pediatrics",
  "Internal Medicine",
  "General Surgery",
  "Obstetrics and Gynecology",
] as const;

export const professionalCompletionItems = [
  "Brainstorm with your AI assistant",
  "Get clinical insights and suggestions",
  "Upload lab results in seconds",
  "Receive AI Powered interpretations",
] as const;

export const smokingIntensityOptions = [
  "Non-smoker",
  "1-10 cigarettes",
  "About 1 pack",
  "More than 1 pack",
  "Electronic cigarettes/vaping",
] as const;

export const alcoholIntakeOptions = [
  "None",
  "Occasionally",
  "1-2 days per week",
  "3-5 days per week",
  "Daily",
] as const;

export const physicalActivityOptions = [
  "Inactive",
  "Lightly active",
  "Moderately active",
  "Very active",
] as const;

export const dietaryHabitOptions = [
  "Non-specific diet",
  "Balanced meals",
  "Frequent Fast Food",
  "Specific diet plan",
] as const;

export const sleepPatternOptions = [
  "7-9 hours",
  "Less than 6 hours",
  "More than 9 hours",
  "Varies significantly or interrupted sleep",
] as const;

export const stressLevelOptions = [
  "Rarely stressed",
  "Manageable stress",
  "Regular (daily) stress",
  "Almost always stressed",
] as const;
