"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList } from "lucide-react";

import { DashboardBackTitle, DashboardPanel } from "./primitives";
import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";

function useRequireProfessional() {
  const profile = useDashboardProfile();
  const router = useRouter();

  useEffect(() => {
    if (!profile.professionalProfile) {
      router.replace("/dashboard");
    }
  }, [profile.professionalProfile, router]);

  return profile;
}

function PracticePlaceholder({
  icon: Icon,
  title,
  description,
  hint,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <DashboardPanel className="flex min-h-[42vh] flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {hint ? (
          <p className="text-xs text-muted-foreground/90">{hint}</p>
        ) : null}
      </div>
    </DashboardPanel>
  );
}

export function ProfessionalAppointmentsPage() {
  const profile = useRequireProfessional();
  if (!profile.professionalProfile) {
    return null;
  }

  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="space-y-6">
        <DashboardBackTitle
          title="Appointments"
          description="Upcoming video and written consultations with your patients."
        />
        <PracticePlaceholder
          icon={CalendarDays}
          title="No appointments scheduled yet"
          description="When patients book a confirmed consultation with you, the date, type, and patient details will show up here so you can prepare."
          hint="Consultation booking is rolling out alongside Top Doctors payments."
        />
      </div>
    </ProfessionalDashboardShell>
  );
}

export function ProfessionalBookingRequestsPage() {
  const profile = useRequireProfessional();
  if (!profile.professionalProfile) {
    return null;
  }

  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="space-y-6">
        <DashboardBackTitle
          title="Booking requests"
          description="New consultation requests from patients before they are confirmed."
        />
        <PracticePlaceholder
          icon={ClipboardList}
          title="No pending booking requests"
          description="When a patient requests a video or written consultation from your Top Doctors profile, you can review and accept requests here."
          hint="Paid bookings will appear with patient notes and consultation type."
        />
      </div>
    </ProfessionalDashboardShell>
  );
}
