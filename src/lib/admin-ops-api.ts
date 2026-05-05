/**
 * Nest admin ops API (`/admin/summary`, `/admin/users`, …). Requires JWT with `appRole === "admin"`.
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
