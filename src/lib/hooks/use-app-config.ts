"use client";

import { useCallback, useMemo } from "react";

import {
  medicalHistorySteps as fallbackAIDoctorSteps,
  medicalHistoryTotalSteps as fallbackMedicalHistoryTotalSteps,
  aiDoctorBenefits as fallbackAIDoctorBenefits,
} from "@/lib/ai-doctor-content";
import {
  chatHistoryItems as fallbackChatHistoryItems,
  doctorTypeOptions as fallbackDoctorTypeOptions,
  seededPersonalConversation as fallbackSeededPersonalConversation,
} from "@/lib/chat-content";
import {
  consultDoctorsCard as fallbackConsultDoctorsCard,
  dashboardCards as fallbackDashboardCards,
  defaultDashboardProfile as fallbackDefaultDashboardProfile,
  mainHealthInfoSections as fallbackMainHealthInfoSections,
} from "@/lib/dashboard-content";
import {
  benefitItems as fallbackBenefitItems,
  faqItems as fallbackFaqItems,
  footerColumns as fallbackFooterColumns,
  heroHighlights as fallbackHeroHighlights,
  navItems as fallbackNavItems,
  securityItems as fallbackSecurityItems,
  showcaseItems as fallbackShowcaseItems,
  testimonialItems as fallbackTestimonialItems,
} from "@/lib/landing-content";
import {
  ethiopianRegions as fallbackEthiopianRegions,
  featureOptions as fallbackFeatureOptions,
  generalInformationSteps as fallbackGeneralInformationSteps,
  measurementSystemOptions as fallbackMeasurementSystemOptions,
  onboardingStepLabels as fallbackOnboardingStepLabels,
  alcoholIntakeOptions as fallbackAlcoholIntakeOptions,
  dietaryHabitOptions as fallbackDietaryHabitOptions,
  physicalActivityOptions as fallbackPhysicalActivityOptions,
  professionalCompletionItems as fallbackProfessionalCompletionItems,
  professionalSpecialtyOptions as fallbackProfessionalSpecialtyOptions,
  professionalTitleOptions as fallbackProfessionalTitleOptions,
  sleepPatternOptions as fallbackSleepPatternOptions,
  sexOptions as fallbackSexOptions,
  smokingIntensityOptions as fallbackSmokingIntensityOptions,
  stressLevelOptions as fallbackStressLevelOptions,
  userRoleOptions as fallbackUserRoleOptions,
} from "@/lib/onboarding-content";
import {
  getAIDoctorConfig,
  getChatConfig,
  getDashboardConfig,
  getLandingContent,
  getOnboardingConfig,
} from "@/lib/services/app-content";

import { useAsyncData } from "./use-async-data";

export function useLandingConfig() {
  const fallback = useMemo(
    () => ({
      navItems: fallbackNavItems,
      heroHighlights: fallbackHeroHighlights,
      benefitItems: fallbackBenefitItems,
      showcaseItems: fallbackShowcaseItems,
      securityItems: fallbackSecurityItems,
      testimonialItems: fallbackTestimonialItems,
      faqItems: fallbackFaqItems,
      footerColumns: fallbackFooterColumns,
    }),
    [],
  );

  return useAsyncData(useCallback(() => getLandingContent(), []), fallback);
}

export function useOnboardingConfig() {
  const fallback = useMemo(
    () => ({
      userRoleOptions: fallbackUserRoleOptions,
      ethiopianRegions: fallbackEthiopianRegions,
      onboardingStepLabels: [...fallbackOnboardingStepLabels],
      measurementSystemOptions: fallbackMeasurementSystemOptions,
      sexOptions: fallbackSexOptions,
      featureOptions: fallbackFeatureOptions,
      generalInformationSteps: [...fallbackGeneralInformationSteps],
      professionalTitleOptions: fallbackProfessionalTitleOptions,
      professionalSpecialtyOptions: [...fallbackProfessionalSpecialtyOptions],
      professionalCompletionItems: [...fallbackProfessionalCompletionItems],
      smokingIntensityOptions: [...fallbackSmokingIntensityOptions],
      alcoholIntakeOptions: [...fallbackAlcoholIntakeOptions],
      physicalActivityOptions: [...fallbackPhysicalActivityOptions],
      dietaryHabitOptions: [...fallbackDietaryHabitOptions],
      sleepPatternOptions: [...fallbackSleepPatternOptions],
      stressLevelOptions: [...fallbackStressLevelOptions],
    }),
    [],
  );

  return useAsyncData(useCallback(() => getOnboardingConfig(), []), fallback);
}

export function useDashboardConfig() {
  const fallback = useMemo(
    () => ({
      defaultDashboardProfile: fallbackDefaultDashboardProfile,
      dashboardCards: fallbackDashboardCards.map((item) => ({ ...item })),
      consultDoctorsCard: fallbackConsultDoctorsCard,
      mainHealthInfoSections: [...fallbackMainHealthInfoSections],
    }),
    [],
  );

  return useAsyncData(useCallback(() => getDashboardConfig(), []), fallback);
}

export function useChatConfig() {
  const fallback = useMemo(
    () => ({
      doctorTypeOptions: fallbackDoctorTypeOptions,
      chatHistoryItems: fallbackChatHistoryItems,
      seededPersonalConversation: [...fallbackSeededPersonalConversation],
    }),
    [],
  );

  return useAsyncData(useCallback(() => getChatConfig(), []), fallback);
}

export function useAIDoctorConfig() {
  const fallback = useMemo(
    () => ({
      aiDoctorBenefits: [...fallbackAIDoctorBenefits],
      medicalHistorySteps: fallbackAIDoctorSteps,
      medicalHistoryTotalSteps: fallbackMedicalHistoryTotalSteps,
    }),
    [],
  );

  return useAsyncData(useCallback(() => getAIDoctorConfig(), []), fallback);
}
