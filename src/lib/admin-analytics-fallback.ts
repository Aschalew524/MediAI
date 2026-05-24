import type { AdminBillingSummary } from "@/lib/admin-subscriptions-api";
import type {
  AdminAnalyticsResponse,
  AdminMonthlyRevenuePoint,
  AdminSummaryResponse,
} from "@/lib/admin-ops-api";

/** Last N calendar months (oldest → newest), short labels e.g. "Mar". */
export function lastMonthLabels(count = 6): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    labels.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return labels;
}

export function revenueSeriesFromBilling(
  billing: AdminBillingSummary | null,
  monthLabels = lastMonthLabels(),
): AdminMonthlyRevenuePoint[] {
  const byMonth = new Map(monthLabels.map((m) => [m, 0]));
  for (const txn of billing?.transactions ?? []) {
    if (txn.status !== "completed") continue;
    const key = new Date(txn.createdAt).toLocaleString("en-US", {
      month: "short",
    });
    if (byMonth.has(key)) {
      byMonth.set(key, (byMonth.get(key) ?? 0) + txn.amountCents);
    }
  }
  return monthLabels.map((month) => ({
    month,
    revenueCents: byMonth.get(month) ?? 0,
  }));
}

/**
 * Used when `GET /admin/analytics` is missing (older API deploy). Still renders charts.
 */
export function buildFallbackAnalytics(
  summary: AdminSummaryResponse | null,
  billing: AdminBillingSummary | null,
): AdminAnalyticsResponse {
  const months = lastMonthLabels();
  const totalUsers = summary?.userCount ?? 0;
  const monthlyUserGrowth = months.map((month, index) => {
    const isLast = index === months.length - 1;
    return {
      month,
      users: isLast ? totalUsers : 0,
      signups: isLast ? summary?.last24hRegistrations ?? 0 : 0,
    };
  });

  return {
    monthlyUserGrowth,
    monthlyRevenue: revenueSeriesFromBilling(billing, months),
    generatedAt: new Date().toISOString(),
  };
}
