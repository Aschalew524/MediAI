import { NextResponse } from "next/server";

import {
  alcoholIntakeOptions,
  ethiopianRegions,
  featureOptions,
  generalInformationSteps,
  measurementSystemOptions,
  onboardingStepLabels,
  dietaryHabitOptions,
  physicalActivityOptions,
  professionalCompletionItems,
  professionalSpecialtyOptions,
  professionalTitleOptions,
  sleepPatternOptions,
  sexOptions,
  smokingIntensityOptions,
  stressLevelOptions,
  userRoleOptions,
} from "@/lib/onboarding-content";

export async function GET() {
  return NextResponse.json({
    userRoleOptions,
    ethiopianRegions,
    onboardingStepLabels,
    measurementSystemOptions,
    sexOptions,
    featureOptions,
    generalInformationSteps,
    professionalTitleOptions,
    professionalSpecialtyOptions,
    professionalCompletionItems,
    smokingIntensityOptions,
    alcoholIntakeOptions,
    physicalActivityOptions,
    dietaryHabitOptions,
    sleepPatternOptions,
    stressLevelOptions,
  });
}
