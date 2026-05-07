import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

import { DashboardContainer, DashboardPage } from "@/components/dashboard/primitives";

export default function LabTestInterpretationPage() {
  return (
    <DashboardPage>
      <DashboardContainer className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex size-10 items-center justify-center rounded-full border border-primary/15 text-foreground/80 transition-colors hover:bg-muted hover:text-primary"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Lab test interpretation
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
          <div className="mb-6 rounded-full bg-primary/5 p-6">
            <FlaskConical className="size-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Not available in v1
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Guided lab result interpretation is planned for a later release. You can still use your
            AI Doctor for general questions, or browse help resources from the dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/ai-doctor"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              Open AI Doctor
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/25 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </DashboardContainer>
    </DashboardPage>
  );
}
