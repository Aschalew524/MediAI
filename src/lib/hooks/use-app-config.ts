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
  adminStatCards as fallbackAdminStatCards,
  adminTransactions as fallbackAdminTransactions,
  adminUsers as fallbackAdminUsers,
  monthlyGrowth as fallbackMonthlyGrowth,
  monthlyRevenue as fallbackMonthlyRevenue,
  recentActivity as fallbackRecentActivity,
  revenueSummary as fallbackRevenueSummary,
  subscriptionPlans as fallbackSubscriptionPlans,
} from "@/lib/admin-content";
import {
  getAdminConfig,
  getAIDoctorConfig,
  getChatConfig,
  getDashboardConfig,
  getLandingContent,
  getOnboardingConfig,
  type DashboardConfigResponse,
} from "@/lib/services/app-content";

import { useAsyncData } from "./use-async-data";

/**
 * Remote `/dashboard/config` (or a stale client cache) may omit newer cards.
 * Reconcile with the bundled fallback so order and entries like Health Blog
 * stay in sync with the app while still allowing the API to override fields
 * per `href`.
 */
function mergeDashboardConfigWithFallback(
  api: DashboardConfigResponse,
  fb: DashboardConfigResponse,
): DashboardConfigResponse {
  const apiByHref = new Map(api.dashboardCards.map((c) => [c.href, c]));
  const dashboardCards = fb.dashboardCards.map((item) => {
    const hit = apiByHref.get(item.href);
    return hit ? { ...item, ...hit } : item;
  });
  const fbHrefs = new Set(fb.dashboardCards.map((c) => c.href));
  const extras = api.dashboardCards.filter((c) => !fbHrefs.has(c.href));
  return {
    ...api,
    dashboardCards: [...dashboardCards, ...extras],
    consultDoctorsCard: api.consultDoctorsCard ?? fb.consultDoctorsCard,
    mainHealthInfoSections:
      api.mainHealthInfoSections.length > 0
        ? api.mainHealthInfoSections
        : fb.mainHealthInfoSections,
    defaultDashboardProfile:
      api.defaultDashboardProfile ?? fb.defaultDashboardProfile,
  };
}

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
      consultDoctorsCard: { ...fallbackConsultDoctorsCard },
      mainHealthInfoSections: [...fallbackMainHealthInfoSections],
    }),
    [],
  );

  const loader = useCallback(async () => {
    const api = await getDashboardConfig();
    return mergeDashboardConfigWithFallback(api, fallback);
  }, [fallback]);

  return useAsyncData(loader, fallback);
}

export function useChatConfig() {
  const fallback = useMemo(
    () => ({
      doctorTypeOptions: fallbackDoctorTypeOptions,
      chatHistoryItems: fallbackChatHistoryItems,
      seededPersonalConversation: [...fallbackSeededPersonalConversation],
      ragEnabled: false,
      assistantTrial: { enabled: true, limit: 3 },
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

export function useAdminConfig() {
  const fallback = useMemo(
    () => ({
      statCards: [...fallbackAdminStatCards],
      users: [...fallbackAdminUsers],
      subscriptionPlans: [...fallbackSubscriptionPlans],
      transactions: [...fallbackAdminTransactions],
      recentActivity: [...fallbackRecentActivity],
      monthlyGrowth: [...fallbackMonthlyGrowth],
      monthlyRevenue: [...fallbackMonthlyRevenue],
      revenueSummary: { ...fallbackRevenueSummary },
    }),
    [],
  );

  return useAsyncData(useCallback(() => getAdminConfig(), []), fallback);
}

export { useEducationResource } from "./use-education-resource";
