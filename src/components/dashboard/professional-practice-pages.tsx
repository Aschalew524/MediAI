"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Loader2 } from "lucide-react";

import {
  confirmProfessionalBooking,
  listProfessionalAppointments,
  listProfessionalBookingRequests,
  type DoctorAppointment,
  type DoctorBookingRequest,
} from "@/lib/consultations-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";

import { DashboardBackTitle, DashboardPanel } from "./primitives";
import { ProfessionalDashboardShell } from "./professional-shell";
import { useDashboardProfile } from "./use-dashboard-profile";

export function useRequireProfessional() {
  const profile = useDashboardProfile();
  const router = useRouter();

  useEffect(() => {
    if (!profile.professionalProfile) {
      router.replace("/dashboard");
    }
  }, [profile.professionalProfile, router]);

  return profile;
}

function formatSlot(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} – ${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function ProfessionalAppointmentsPage() {
  const profile = useRequireProfessional();
  const [items, setItems] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listProfessionalAppointments());
    } catch (e: unknown) {
      setError(getFriendlyAxiosMessage(e, "Could not load appointments."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!profile.professionalProfile) return null;

  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="space-y-6">
        <DashboardBackTitle
          title="Appointments"
          description="Upcoming confirmed consultations with your patients."
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? (
          <DashboardPanel className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </DashboardPanel>
        ) : items.length === 0 ? (
          <DashboardPanel className="flex min-h-[30vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <CalendarDays className="size-10 text-primary/60" />
            <p className="text-sm text-muted-foreground">
              No upcoming appointments. Confirm booking requests or set availability so patients can book.
            </p>
          </DashboardPanel>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <DashboardPanel className="px-5 py-4">
                  <p className="font-semibold">{item.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.consultationType === "video" ? "Video" : "Written"} ·{" "}
                    {item.status.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-sm">{formatSlot(item.startsAt, item.endsAt)}</p>
                  {item.patientNotes ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                      {item.patientNotes}
                    </p>
                  ) : null}
                </DashboardPanel>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProfessionalDashboardShell>
  );
}

export function ProfessionalBookingRequestsPage() {
  const profile = useRequireProfessional();
  const [items, setItems] = useState<DoctorBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listProfessionalBookingRequests());
    } catch (e: unknown) {
      setError(getFriendlyAxiosMessage(e, "Could not load booking requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleConfirm(id: string) {
    setConfirmingId(id);
    try {
      await confirmProfessionalBooking(id);
      await load();
    } catch (e: unknown) {
      setError(getFriendlyAxiosMessage(e, "Could not confirm booking."));
    } finally {
      setConfirmingId(null);
    }
  }

  if (!profile.professionalProfile) return null;

  return (
    <ProfessionalDashboardShell profile={profile}>
      <div className="space-y-6">
        <DashboardBackTitle
          title="Booking requests"
          description="Review and confirm new consultation requests from patients."
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? (
          <DashboardPanel className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </DashboardPanel>
        ) : items.length === 0 ? (
          <DashboardPanel className="flex min-h-[30vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <ClipboardList className="size-10 text-primary/60" />
            <p className="text-sm text-muted-foreground">No pending booking requests.</p>
          </DashboardPanel>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <DashboardPanel className="space-y-3 px-5 py-4">
                  <div>
                    <p className="font-semibold">{item.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.consultationType === "video" ? "Video" : "Written"} ·{" "}
                      {item.consultationFeeDisplay}
                    </p>
                    <p className="mt-1 text-sm">{formatSlot(item.startsAt, item.endsAt)}</p>
                    {item.patientNotes ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                        {item.patientNotes}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={confirmingId === item.id}
                    onClick={() => void handleConfirm(item.id)}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {confirmingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Confirm appointment"
                    )}
                  </button>
                </DashboardPanel>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProfessionalDashboardShell>
  );
}
