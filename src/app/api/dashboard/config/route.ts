import { NextResponse } from "next/server";

import {
  consultDoctorsCard,
  dashboardCards,
  defaultDashboardProfile,
  mainHealthInfoSections,
} from "@/lib/dashboard-content";

export async function GET() {
  return NextResponse.json({
    defaultDashboardProfile,
    dashboardCards,
    consultDoctorsCard,
    mainHealthInfoSections,
  });
}
