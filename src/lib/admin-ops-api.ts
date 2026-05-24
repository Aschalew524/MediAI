/**
 * Nest admin ops API (`/admin/summary`, `/admin/users`, `/admin/recent-activity`,
 * …). All endpoints require a JWT whose `appRole === "admin"`.
 */
import api from "@/lib/axios";

/** Mirrors `AdminSummaryResponseDto` from MediAI_backend. */
export type AdminSummaryResponse = {
  userCount: number;
  profileCount: number;
  supportReportCount: number;
  adminCount: number;
  last24hRegistrations: number;
};

export async function getAdminSummary(
  options?: { signal?: AbortSignal },
): Promise<AdminSummaryResponse> {
  const { data } = await api.get<AdminSummaryResponse>("/admin/summary", {
    signal: options?.signal,
  });
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Dashboard chart time-series                                               */
/* -------------------------------------------------------------------------- */

/** Must match `ADMIN_ANALYTICS_DEFAULT_MONTHS` on the backend. */
export const ADMIN_CHART_MONTHS = 6;

export type AdminMonthlyGrowthPoint = {
  month: string;
  /** Cumulative users at month-end (all roles). */
  users: number;
  /** New registrations during the month. */
  signups: number;
};

export type AdminMonthlyRevenuePoint = {
  month: string;
  revenueCents: number;
};

/** Mirrors `AdminAnalyticsResponseDto` from MediAI_backend. */
export type AdminAnalyticsResponse = {
  monthlyUserGrowth: AdminMonthlyGrowthPoint[];
  monthlyRevenue: AdminMonthlyRevenuePoint[];
  generatedAt: string;
};

export async function getAdminAnalytics(
  options?: { months?: number; signal?: AbortSignal },
): Promise<AdminAnalyticsResponse> {
  const months = options?.months ?? ADMIN_CHART_MONTHS;
  const { data } = await api.get<AdminAnalyticsResponse>("/admin/analytics", {
    params: { months },
    signal: options?.signal,
  });
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Recent activity feed                                                      */
/* -------------------------------------------------------------------------- */

export type AdminActivityType =
  | "signup"
  | "profile_update"
  | "medical_history_update"
  | "ai_doctor_setup"
  | "data_export"
  | "account_delete"
  | "support_report";

export type AdminActivityItem = {
  id: string;
  type: AdminActivityType;
  description: string;
  /** ISO-8601 timestamp (UTC) — format on the client per the user's locale. */
  createdAt: string;
};

export type AdminRecentActivityResponse = {
  items: AdminActivityItem[];
};

export async function getAdminRecentActivity(
  options?: { limit?: number; signal?: AbortSignal },
): Promise<AdminRecentActivityResponse> {
  const params: Record<string, number> = {};
  if (options?.limit) params.limit = options.limit;
  const { data } = await api.get<AdminRecentActivityResponse>(
    "/admin/recent-activity",
    { params, signal: options?.signal },
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Paginated user list                                                       */
/* -------------------------------------------------------------------------- */

export type AdminUserAppRole = "user" | "admin";
export type AdminUserProfileRole = "personal" | "professional" | null;

/** Mirrors `AdminUserListItemDto` from MediAI_backend. */
export type AdminUserListItem = {
  id: string;
  email: string;
  appRole: AdminUserAppRole;
  /** ISO-8601 — format on the client per the user's locale. */
  createdAt: string;
  /** ISO-8601. */
  updatedAt: string;
  hasProfile: boolean;
  profileRole: AdminUserProfileRole;
  preferredName: string | null;
  specialty: string | null;
};

export type AdminPaginatedUsersResponse = {
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export async function getAdminUsers(options: {
  page?: number;
  pageSize?: number;
  q?: string;
  signal?: AbortSignal;
}): Promise<AdminPaginatedUsersResponse> {
  const params: Record<string, string | number> = {};
  if (options.page) params.page = options.page;
  if (options.pageSize) params.pageSize = options.pageSize;
  const trimmed = options.q?.trim();
  if (trimmed) params.q = trimmed;
  const { data } = await api.get<AdminPaginatedUsersResponse>("/admin/users", {
    params,
    signal: options.signal,
  });
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Doctor verification queue                                                  */
/* -------------------------------------------------------------------------- */

export type AdminVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "blocked";

export type AdminVerificationFilter =
  | "pending"
  | "verified"
  | "rejected"
  | "blocked"
  | "awaiting"
  | "all";

/** Mirrors `AdminProfessionalVerificationItemDto`. */
export type AdminProfessionalVerificationItem = {
  userId: string;
  email: string;
  status: AdminVerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  notes: string | null;
  createdAt: string;
  professionalProfile: Record<string, unknown>;
};

export type AdminProfessionalVerificationsResponse = {
  items: AdminProfessionalVerificationItem[];
  page: number;
  pageSize: number;
  total: number;
};

export async function getAdminProfessionalVerifications(options?: {
  page?: number;
  pageSize?: number;
  status?: AdminVerificationFilter;
  signal?: AbortSignal;
}): Promise<AdminProfessionalVerificationsResponse> {
  const params: Record<string, string | number> = {};
  if (options?.page) params.page = options.page;
  if (options?.pageSize) params.pageSize = options.pageSize;
  if (options?.status) params.status = options.status;
  const { data } = await api.get<AdminProfessionalVerificationsResponse>(
    "/admin/professional-verifications",
    { params, signal: options?.signal },
  );
  return data;
}

export async function approveProfessionalVerification(
  userId: string,
): Promise<void> {
  await api.post(`/admin/professional-verifications/${userId}/approve`);
}

export async function rejectProfessionalVerification(
  userId: string,
  notes: string,
): Promise<void> {
  await api.post(`/admin/professional-verifications/${userId}/reject`, {
    notes,
  });
}

export async function unblockProfessionalVerification(
  userId: string,
): Promise<void> {
  await api.post(`/admin/professional-verifications/${userId}/unblock`);
}

export async function blockProfessionalVerification(
  userId: string,
): Promise<void> {
  await api.post(`/admin/professional-verifications/${userId}/block`);
}

export async function deleteProfessionalVerification(
  userId: string,
): Promise<void> {
  await api.delete(`/admin/professional-verifications/${userId}`);
}
