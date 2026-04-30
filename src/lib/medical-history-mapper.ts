import {
  defaultMedicalHistory,
  type MedicalHistoryData,
} from "./dashboard-content";
import type { MedicalHistoryStepId } from "./ai-doctor-content";

/**
 * Per-step state inside the AI Doctor `MedicalHistoryWizard`. Lives next to
 * the mappers because both files speak the same shape.
 */
export type StepAnswer = {
  /** "yes-no-checklist" / "yes-no-text" steps only. */
  choice: "yes" | "no" | null;
  /** Selected chips for "yes-no-checklist" steps. */
  selections: string[];
  /** Free-text input for "yes-no-text" / "yes-no-checklist details". */
  details: string;
  /** Picked button label for "choice-list" steps. */
  selectedOption: string;
};

export type AnswersState = Record<MedicalHistoryStepId, StepAnswer>;

const EMPTY_ANSWER: StepAnswer = {
  choice: null,
  selections: [],
  details: "",
  selectedOption: "",
};

const STEP_IDS: MedicalHistoryStepId[] = [
  "chronic-past-health-conditions",
  "family-health-history",
  "known-allergies",
  "surgical-history",
  "current-medications",
  "medications-history",
  "daily-smoking-intensity",
  "weekly-alcohol-intake",
  "dietary-habits",
  "weekly-activity-level",
  "daily-sleep-pattern",
  "stress-level",
];

export function emptyAnswers(): AnswersState {
  return STEP_IDS.reduce<AnswersState>((acc, id) => {
    acc[id] = { ...EMPTY_ANSWER };
    return acc;
  }, {} as AnswersState);
}

/**
 * `true` once the user has provided enough input for the step's "Next" button
 * to enable. Mirrors the conditions inside `MedicalHistoryWizard.canContinue`
 * so hydration from the medical history JSON pre-fills steps in a way that
 * keeps the wizard consistent.
 */
export function isStepAnswered(
  id: MedicalHistoryStepId,
  answer: StepAnswer,
): boolean {
  switch (id) {
    case "daily-smoking-intensity":
    case "weekly-alcohol-intake":
    case "dietary-habits":
    case "weekly-activity-level":
    case "daily-sleep-pattern":
    case "stress-level":
      return answer.selectedOption.trim().length > 0;
    case "current-medications":
    case "medications-history":
    case "surgical-history":
      if (answer.choice === "no") return true;
      if (answer.choice === "yes") return answer.details.trim().length > 0;
      return false;
    case "chronic-past-health-conditions":
    case "family-health-history":
    case "known-allergies":
      if (answer.choice === "no") return true;
      if (answer.choice === "yes") {
        return (
          answer.selections.length > 0 || answer.details.trim().length > 0
        );
      }
      return false;
    default:
      return false;
  }
}

/** Translate stored medical history into the wizard's per-step answer state. */
export function medicalHistoryToAnswers(
  history: MedicalHistoryData | null | undefined,
): AnswersState {
  const answers = emptyAnswers();
  if (!history) return answers;

  // yes-no-checklist groups -------------------------------------------------
  hydrateChecklist(answers, "chronic-past-health-conditions", {
    selections: history.chronicDiseases,
    details: history.chronicDetails,
  });
  hydrateChecklist(answers, "family-health-history", {
    selections: history.familyHistory,
    details: history.familyHistoryDetails,
  });
  hydrateChecklist(answers, "known-allergies", {
    selections: history.allergies,
    details: history.allergyDetails,
  });

  // yes-no-text groups ------------------------------------------------------
  hydrateText(answers, "surgical-history", history.surgicalHistory);
  hydrateText(answers, "current-medications", history.currentMedications);
  hydrateText(answers, "medications-history", history.pastMedications);

  // single-choice groups ----------------------------------------------------
  answers["daily-smoking-intensity"].selectedOption = history.smokingIntensity;
  answers["weekly-alcohol-intake"].selectedOption = history.alcoholIntake;
  answers["dietary-habits"].selectedOption = history.dietaryHabits;
  answers["weekly-activity-level"].selectedOption = history.activityLevel;
  answers["daily-sleep-pattern"].selectedOption = history.sleepPattern;
  answers["stress-level"].selectedOption = history.stressLevel;

  return answers;
}

function hydrateChecklist(
  answers: AnswersState,
  id: MedicalHistoryStepId,
  source: { selections: string[]; details: string },
) {
  const hasContent =
    (source.selections && source.selections.length > 0) ||
    source.details.trim().length > 0;
  answers[id] = {
    ...answers[id],
    choice: hasContent ? "yes" : null,
    selections: [...(source.selections ?? [])],
    details: source.details ?? "",
  };
}

function hydrateText(
  answers: AnswersState,
  id: MedicalHistoryStepId,
  text: string,
) {
  const hasContent = text.trim().length > 0;
  answers[id] = {
    ...answers[id],
    choice: hasContent ? "yes" : null,
    details: text ?? "",
  };
}

/**
 * Translate the wizard's answer state back into a complete `MedicalHistoryData`
 * payload. Steps that the user explicitly answered "no" to are written as
 * empty values so the medical-history page reflects the user's decision (vs
 * leaving stale prior data).
 *
 * `base` is merged in for any field this function doesn't own (currently
 * none, but the merge keeps us forward-compatible if the schema grows).
 */
export function answersToMedicalHistory(
  answers: AnswersState,
  base: MedicalHistoryData = defaultMedicalHistory,
): MedicalHistoryData {
  const checklist = (id: MedicalHistoryStepId) => {
    const a = answers[id];
    if (a.choice === "no")
      return { selections: [] as string[], details: "" };
    return {
      selections: [...a.selections],
      details: a.details.trim(),
    };
  };
  const text = (id: MedicalHistoryStepId) => {
    const a = answers[id];
    if (a.choice === "no") return "";
    return a.details.trim();
  };

  const chronic = checklist("chronic-past-health-conditions");
  const family = checklist("family-health-history");
  const allergies = checklist("known-allergies");

  return {
    ...base,
    chronicDiseases: chronic.selections,
    chronicDetails: chronic.details,
    familyHistory: family.selections,
    familyHistoryDetails: family.details,
    allergies: allergies.selections,
    allergyDetails: allergies.details,
    surgicalHistory: text("surgical-history"),
    currentMedications: text("current-medications"),
    pastMedications: text("medications-history"),
    smokingIntensity: answers["daily-smoking-intensity"].selectedOption,
    alcoholIntake: answers["weekly-alcohol-intake"].selectedOption,
    dietaryHabits: answers["dietary-habits"].selectedOption,
    activityLevel: answers["weekly-activity-level"].selectedOption,
    sleepPattern: answers["daily-sleep-pattern"].selectedOption,
    stressLevel: answers["stress-level"].selectedOption,
  };
}

export const MEDICAL_HISTORY_STEP_IDS = STEP_IDS;
