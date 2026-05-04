import {
  activityOptions,
  alcoholOptions,
  allergyOptions,
  chronicDiseaseOptions,
  dietOptions,
  familyHistoryOptions,
  sleepOptions,
  smokingOptions,
  stressOptions,
} from "./dashboard-content";

export type MedicalHistoryOption = {
  label: string;
  description?: string;
};

export type MedicalHistoryStep = {
  id: MedicalHistoryStepId;
  title: string;
  description: string;
  sectionTitle?: string;
  stepKind: "yes-no-checklist" | "yes-no-text" | "choice-list";
  placeholder?: string;
  options?: readonly string[];
  choiceOptions?: MedicalHistoryOption[];
};

/**
 * Stable identifiers for the 12 wizard steps. They are the contract between
 * the wizard UI, the backend ai-doctor snapshot, and the
 * `medicalHistoryAnswersToData`/`medicalHistoryDataToAnswers` mappers — every
 * id maps to a specific group of fields on `MedicalHistoryData` so that
 * answers entered in the wizard round-trip cleanly to/from the medical
 * history page.
 */
export type MedicalHistoryStepId =
  | "chronic-past-health-conditions"
  | "family-health-history"
  | "known-allergies"
  | "surgical-history"
  | "current-medications"
  | "medications-history"
  | "daily-smoking-intensity"
  | "weekly-alcohol-intake"
  | "dietary-habits"
  | "weekly-activity-level"
  | "daily-sleep-pattern"
  | "stress-level";

export const aiDoctorBenefits = [
  "Complete your health Profile",
  "Ask any health-related questions",
  "Get actionable insights tailored to your unique health needs",
] as const;

export const medicalHistoryTotalSteps = 12;

const toChoiceOptions = (labels: readonly string[]): MedicalHistoryOption[] =>
  labels.map((label) => ({ label }));

const activityDescriptions: Record<string, string> = {
  Inactive: "No regular physical activity or structured exercise",
  "Lightly Active":
    "Light physical activities such as walking or leisurely cycling",
  "Moderately Active":
    "Regular moderate exercises like running, swimming, or playing sports",
  "Very Active": "Frequent intense exercises and sports training",
};

export const medicalHistorySteps: MedicalHistoryStep[] = [
  {
    id: "chronic-past-health-conditions",
    title: "Chronic and Past Health Conditions",
    description:
      "Include any chronic conditions or medical issues experienced. Essential for understanding health history and personalized care.",
    sectionTitle: "Medical History",
    stepKind: "yes-no-checklist",
    options: chronicDiseaseOptions,
    placeholder: "e.g. diabetes, high blood pressure, heart attack 2 years ago",
  },
  {
    id: "family-health-history",
    title: "Family health history",
    description:
      "List any chronic diseases present in your family history. This will help us indicate the genetic risks.",
    sectionTitle: "Medical History",
    stepKind: "yes-no-checklist",
    options: familyHistoryOptions,
    placeholder:
      "e.g. Mother with diabetes, father had heart disease, sibling with asthma",
  },
  {
    id: "known-allergies",
    title: "Known Allergies",
    description: "List any allergies you have.",
    sectionTitle: "Medical History",
    stepKind: "yes-no-checklist",
    options: allergyOptions,
    placeholder:
      "e.g. Peanut allergy, Penicillin allergy, tree and grass pollen",
  },
  {
    id: "surgical-history",
    title: "Surgical History",
    description: "List any major surgeries you have undergone.",
    sectionTitle: "Medical History",
    stepKind: "yes-no-text",
    placeholder: "e.g. cardiac stenting in 2019, appendectomy in 2003.",
  },
  {
    id: "current-medications",
    title: "Current medications?",
    description: "List any medications you are currently taking.",
    sectionTitle: "Medical History",
    stepKind: "yes-no-text",
    placeholder: "e.g. insulin injections, antibiotics",
  },
  {
    id: "medications-history",
    title: "Medications History (last 6 months)",
    description:
      "List any medications, supplements, or herbal remedies taken in the last 6 months",
    sectionTitle: "Medical History",
    stepKind: "yes-no-text",
    placeholder: "e.g. insulin injections, antibiotics",
  },
  {
    id: "daily-smoking-intensity",
    title: "Daily smoking intensity",
    description: "",
    sectionTitle: "Life Patterns & Habits",
    stepKind: "choice-list",
    choiceOptions: toChoiceOptions(smokingOptions),
  },
  {
    id: "weekly-alcohol-intake",
    title: "Weekly Alcohol intake",
    description:
      "A standard drink is equivalent to a regular can or bottle of beer, a typical serving (glass) of wine, or a shot of distilled spirits.",
    sectionTitle: "Life Patterns & Habits",
    stepKind: "choice-list",
    choiceOptions: toChoiceOptions(alcoholOptions),
  },
  {
    id: "dietary-habits",
    title: "Dietary Habits",
    description: "",
    sectionTitle: "Life Patterns & Habits",
    stepKind: "choice-list",
    choiceOptions: toChoiceOptions(dietOptions),
  },
  {
    id: "weekly-activity-level",
    title: "Weekly Activity Level",
    description: "",
    sectionTitle: "Life Patterns & Habits",
    stepKind: "choice-list",
    choiceOptions: activityOptions.map((label) => ({
      label,
      description: activityDescriptions[label] ?? "",
    })),
  },
  {
    id: "daily-sleep-pattern",
    title: "Daily sleep pattern",
    description: "",
    sectionTitle: "Life Patterns & Habits",
    stepKind: "choice-list",
    choiceOptions: toChoiceOptions(sleepOptions),
  },
  {
    id: "stress-level",
    title: "Stress level",
    description: "",
    sectionTitle: "Life Patterns & Habits",
    stepKind: "choice-list",
    choiceOptions: toChoiceOptions(stressOptions),
  },
];
