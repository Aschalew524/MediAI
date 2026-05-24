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
  const revenueMonths = revenueSeriesFromBilling(billing, months);
  const signupsFromRevenue = revenueMonths.map((_, index) => {
    if (index === months.length - 1) {
      return summary?.last24hRegistrations ?? 0;
    }
    return 0;
  });
  const signupsTotal = signupsFromRevenue.reduce((s, n) => s + n, 0);
  const baselineUsers = Math.max(0, totalUsers - signupsTotal);

  const monthlyUserGrowth = months.map((month, index) => {
    const signupsThroughMonth = signupsFromRevenue
      .slice(0, index + 1)
      .reduce((s, n) => s + n, 0);
    return {
      month,
      users: baselineUsers + signupsThroughMonth,
      signups: signupsFromRevenue[index] ?? 0,
    };
  });

  return {
    monthlyUserGrowth,
    monthlyRevenue: revenueMonths,
    generatedAt: new Date().toISOString(),
  };
}
