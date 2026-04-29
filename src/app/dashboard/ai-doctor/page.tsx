import { Suspense } from "react";

import { AIDoctorEntryPage } from "@/components/dashboard/ai-doctor";

export default function AIDoctorRoute() {
  return (
    <Suspense fallback={null}>
      <AIDoctorEntryPage />
    </Suspense>
  );
}
