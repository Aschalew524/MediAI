import { NextResponse } from "next/server";

import {
  consultDoctorsCard,
  dashboardCards,
  defaultDashboardProfile,
  labInterpretationCategories,
  mainHealthInfoSections,
  uploadHighlights,
} from "@/lib/dashboard-content";

export async function GET() {
  return NextResponse.json({
    defaultDashboardProfile,
    dashboardCards,
    consultDoctorsCard,
    mainHealthInfoSections,
    labInterpretationCategories,
    uploadHighlights,
  });
}
