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
  ChatMode,
  DoctorTypeOption,
  HistoryItem,
} from "@/lib/chat-content";
import type {
  MedicalHistoryStep,
} from "@/lib/ai-doctor-content";
import {
  monthlyGrowth as fallbackMonthlyGrowth,
  monthlyRevenue as fallbackMonthlyRevenue,
  type AdminActivity,
  type AdminStatCard,
  type AdminTransaction,
  type AdminUser,
  type MonthlyGrowth,
  type MonthlyRevenue,
  type RevenueSummary,
  type SubscriptionPlan,
} from "@/lib/admin-content";

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
    accent: "bot" | "facilities" | "doctors" | "messages";
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
  /** From Nest: `RAG_ENABLED` — when true, responses may include guideline (RAG) sources */
  ragEnabled?: boolean;
};

export type AIDoctorConfigResponse = {
  aiDoctorBenefits: string[];
  medicalHistorySteps: MedicalHistoryStep[];
  medicalHistoryTotalSteps: number;
};

export type AdminConfigResponse = {
  statCards: AdminStatCard[];
  users: AdminUser[];
  subscriptionPlans: SubscriptionPlan[];
  transactions: AdminTransaction[];
  recentActivity: AdminActivity[];
  monthlyGrowth: MonthlyGrowth[];
  monthlyRevenue: MonthlyRevenue[];
  revenueSummary: RevenueSummary;
};

let landingCache: LandingResponse | null = null;
let onboardingCache: OnboardingConfigResponse | null = null;
let dashboardCache: DashboardConfigResponse | null = null;
let chatCache: ChatConfigResponse | null = null;
let aiDoctorCache: AIDoctorConfigResponse | null = null;
let adminCache: AdminConfigResponse | null = null;

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

function normalizeAdminConfig(data: AdminConfigResponse): AdminConfigResponse {
  return {
    ...data,
    monthlyGrowth: data.monthlyGrowth?.length
      ? data.monthlyGrowth
      : [...fallbackMonthlyGrowth],
    monthlyRevenue: data.monthlyRevenue?.length
      ? data.monthlyRevenue
      : [...fallbackMonthlyRevenue],
  };
}

export async function getAdminConfig() {
  if (adminCache) return normalizeAdminConfig(adminCache);
  const { data } = await api.get<AdminConfigResponse>("/admin/config");
  adminCache = normalizeAdminConfig(data);
  return adminCache;
}

/** Matches Nest `ChatCitationDto` from RAG retrieval (`source` + `excerpt`). */
export type ChatCitation = {
  source: string;
  excerpt: string;
};

export type ChatSendResult = {
  reply: string;
  author: string;
  /** Personal mode only — re-send on the next turn to keep multi-turn memory. */
  conversationId?: string;
  messageId: string;
  citations?: ChatCitation[];
};

export type ChatSendOptions = {
  mode: ChatMode;
  message: string;
  /** Personal mode: re-use the value returned from the previous reply. */
  conversationId?: string;
  /** General mode: client-generated id to keep an anonymous thread across turns. */
  sessionId?: string;
  /**
   * Personal mode (professional callers only): the patient the doctor is
   * asking the assistant about. The backend feeds the patient's profile to
   * the LLM and tags the conversation so the doctor's "Conversation History"
   * groups it under that patient.
   */
  patientUserId?: string;
};

/**
 * Sends a chat message to the real backend.
 * - `personal` → `POST /api/chat/personal/messages` (JWT required, attached by interceptor).
 *   Backend reads the user's profile + medical history server-side; we only send the
 *   user's text and the previous `conversationId` to preserve multi-turn memory.
 * - `general` → `POST /api/chat/general/messages` (JWT optional).
 *   `sessionId` is a client-generated string to keep an anonymous thread cohesive.
 */
export async function sendChatMessage(
  opts: ChatSendOptions,
): Promise<ChatSendResult> {
  if (opts.mode === "personal") {
    const { data } = await api.post<{
      reply: string;
      conversationId: string;
      messageId: string;
      citations?: ChatCitation[];
    }>("/chat/personal/messages", {
      message: opts.message,
      ...(opts.conversationId ? { conversationId: opts.conversationId } : {}),
      ...(opts.patientUserId ? { patientUserId: opts.patientUserId } : {}),
    });
    return {
      reply: data.reply,
      author: "AI Doctor",
      conversationId: data.conversationId,
      messageId: data.messageId,
      citations: data.citations,
    };
  }

  const { data } = await api.post<{
    reply: string;
    messageId: string;
    citations?: ChatCitation[];
  }>("/chat/general/messages", {
    message: opts.message,
    ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
  });
  return {
    reply: data.reply,
    author: "General Chat",
    messageId: data.messageId,
    citations: data.citations,
  };
}

export async function submitIssueReport(message: string) {
  const { data } = await api.post<{ success: boolean }>("/chat/report-issue", {
    message,
  });
  return data;
}

/**
 * One row in the personal AI Doctor chat history.
 * Backend filters to `kind: personal` only, so general/anonymous chats
 * never appear here.
 *
 * `patientUserId` is set for clinical-assistant rows (a doctor asking the
 * assistant about a specific patient) and null for the caller's own profile
 * chats.
 */
export type ApiPersonalConversation = {
  id: string;
  kind: "personal" | "general";
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  patientUserId?: string | null;
};

export type ApiPersonalConversationList = {
  items: ApiPersonalConversation[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiPersonalConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ApiPersonalConversationMessages = {
  items: ApiPersonalConversationMessage[];
  hasMore: boolean;
};

function cleanParams(params: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v as string | number;
  }
  return out;
}

/**
 * GET /api/chat/conversations — newest first.
 *
 * `patientUserId` (professional callers only) scopes the listing to clinical
 * assistant conversations about that one patient. Omit to list every personal
 * conversation the caller owns.
 */
export async function listPersonalConversations(
  params: {
    page?: number;
    pageSize?: number;
    patientUserId?: string;
  } = {},
): Promise<ApiPersonalConversationList> {
  const { data } = await api.get<ApiPersonalConversationList>(
    "/chat/conversations",
    { params: cleanParams(params) },
  );
  return data;
}

/** GET /api/chat/conversations/:id/messages — oldest → newest, cursor on `before`. */
export async function getPersonalConversationMessages(
  conversationId: string,
  params: { limit?: number; before?: string } = {},
): Promise<ApiPersonalConversationMessages> {
  const { data } = await api.get<ApiPersonalConversationMessages>(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { params: cleanParams(params) },
  );
  return data;
}
