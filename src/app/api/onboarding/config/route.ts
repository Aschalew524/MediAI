import { NextResponse } from "next/server";

import {
  ethiopianRegions,
  featureOptions,
  generalInformationSteps,
  measurementSystemOptions,
  onboardingStepLabels,
  sexOptions,
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
  });
}
