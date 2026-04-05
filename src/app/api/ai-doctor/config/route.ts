import { NextResponse } from "next/server";

import {
  aiDoctorBenefits,
  medicalHistorySteps,
  medicalHistoryTotalSteps,
} from "@/lib/ai-doctor-content";

export async function GET() {
  return NextResponse.json({
    aiDoctorBenefits,
    medicalHistorySteps,
    medicalHistoryTotalSteps,
  });
}
