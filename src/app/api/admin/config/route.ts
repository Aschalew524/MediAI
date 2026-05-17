import { NextResponse } from "next/server";

import {
  adminStatCards,
  adminTransactions,
  adminUsers,
  monthlyGrowth,
  monthlyRevenue,
  recentActivity,
  revenueSummary,
  subscriptionPlans,
} from "@/lib/admin-content";

export async function GET() {
  return NextResponse.json({
    statCards: adminStatCards,
    users: adminUsers,
    subscriptionPlans,
    transactions: adminTransactions,
    recentActivity,
    monthlyGrowth,
    monthlyRevenue,
    revenueSummary,
  });
}
