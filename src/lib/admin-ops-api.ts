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
