import api from "@/lib/axios";
import type {
  BenefitItem,
  FAQItem,
  FooterColumn,
  LandingIconKey,
  NavItem,
  SecurityItem,
  ShowcaseItem,
  Testimonial,
} from "@/lib/landing-content";
import type { DashboardProfile } from "@/lib/dashboard-content";
import type {
  FeatureOption,
  MeasurementSystemOption,
  ProfessionalTitleOption,
  SexOption,
  UserRoleOption,
} from "@/lib/onboarding-content";
import type {
  DoctorTypeOption,
  HistoryItem,
} from "@/lib/chat-content";
import type { ChatMode } from "@/lib/chat-content";
import type {
  MedicalHistoryStep,
} from "@/lib/ai-doctor-content";

export type LandingResponse = {
  navItems: NavItem[];
  heroHighlights: { icon: LandingIconKey; label: string }[];
  benefitItems: BenefitItem[];
  showcaseItems: ShowcaseItem[];
  securityItems: SecurityItem[];
  testimonialItems: Testimonial[];
  faqItems: FAQItem[];
  footerColumns: FooterColumn[];
};

export type OnboardingConfigResponse = {
  userRoleOptions: UserRoleOption[];
  ethiopianRegions: string[];
  onboardingStepLabels: string[];
  measurementSystemOptions: MeasurementSystemOption[];
  sexOptions: SexOption[];
  featureOptions: FeatureOption[];
  generalInformationSteps: string[];
  professionalTitleOptions: ProfessionalTitleOption[];
  professionalSpecialtyOptions: string[];
  professionalCompletionItems: string[];
  smokingIntensityOptions: string[];
  alcoholIntakeOptions: string[];
  physicalActivityOptions: string[];
  dietaryHabitOptions: string[];
  sleepPatternOptions: string[];
  stressLevelOptions: string[];
};

export type DashboardConfigResponse = {
  defaultDashboardProfile: DashboardProfile;
  dashboardCards: {
    title: string;
    description: string;
    href: string;
    accent: "bot" | "lab" | "doctors";
    muted?: boolean;
  }[];
  consultDoctorsCard: {
    title: string;
    description: string;
    href: string;
  };
  mainHealthInfoSections: string[];
};

export type ChatConfigResponse = {
  doctorTypeOptions: DoctorTypeOption[];
  chatHistoryItems: HistoryItem[];
  seededPersonalConversation: {
    role: "user" | "assistant";
    author: string;
    content: string;
  }[];
};

export type AIDoctorConfigResponse = {
  aiDoctorBenefits: string[];
  medicalHistorySteps: MedicalHistoryStep[];
  medicalHistoryTotalSteps: number;
};

let landingCache: LandingResponse | null = null;
let onboardingCache: OnboardingConfigResponse | null = null;
let dashboardCache: DashboardConfigResponse | null = null;
let chatCache: ChatConfigResponse | null = null;
let aiDoctorCache: AIDoctorConfigResponse | null = null;

export async function getLandingContent() {
  if (landingCache) return landingCache;
  const { data } = await api.get<LandingResponse>("/landing");
  landingCache = data;
  return data;
}

export async function getOnboardingConfig() {
  if (onboardingCache) return onboardingCache;
  const { data } = await api.get<OnboardingConfigResponse>("/onboarding/config");
  onboardingCache = data;
  return data;
}

export async function getDashboardConfig() {
  if (dashboardCache) return dashboardCache;
  const { data } = await api.get<DashboardConfigResponse>("/dashboard/config");
  dashboardCache = data;
  return data;
}

export async function getChatConfig() {
  if (chatCache) return chatCache;
  const { data } = await api.get<ChatConfigResponse>("/chat/config");
  chatCache = data;
  return data;
}

export async function getAIDoctorConfig() {
  if (aiDoctorCache) return aiDoctorCache;
  const { data } = await api.get<AIDoctorConfigResponse>("/ai-doctor/config");
  aiDoctorCache = data;
  return data;
}

export async function sendMockChatMessage(mode: ChatMode, message: string) {
  const { data } = await api.post<{ reply: string; author: string }>("/chat/reply", {
    mode,
    message,
  });
  return data;
}

export async function submitMockIssueReport(message: string) {
  const { data } = await api.post<{ success: boolean }>("/chat/report-issue", {
    message,
  });
  return data;
}
