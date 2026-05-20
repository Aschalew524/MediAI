"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Link2,
  Loader2,
} from "lucide-react";

import {
  confirmProfessionalBooking,
  consultationTypeLabel,
  listProfessionalAppointments,
  listProfessionalBookingRequests,
  markBookingComplete,
  setBookingMeetingLink,
  type ConsultationType,
  type DoctorAppointment,
  type DoctorBookingRequest,
} from "@/lib/consultations-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { cn } from "@/lib/utils";

/**
 * Phase 4 — only video / hybrid consults need a meeting link; for written
 * (async) and in-person visits the field is a no-op (and we hide the input).
 */
function consultationNeedsMeetingLink(type: ConsultationType): boolean {
  return type === "video" || type === "hybrid";
}

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
                <AppointmentCard item={item} onUpdated={load} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProfessionalDashboardShell>
  );
}

function AppointmentCard({
  item,
  onUpdated,
}: {
  item: DoctorAppointment;
  onUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [linkDraft, setLinkDraft] = useState(item.meetingLink ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Two-step confirm for Mark Complete — completing a consultation kicks
  // off the 24h chat-grace countdown, so we don't want a stray click to
  // trigger it.
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  const needsLink = consultationNeedsMeetingLink(item.consultationType);
  // Only show "Mark complete" for live appointments. Completed/missed are
  // terminal; the backend would 409 anyway.
  const canMarkComplete =
    item.status === "approved" || item.status === "confirmed";

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await setBookingMeetingLink(item.id, linkDraft.trim());
      setEditing(false);
      await onUpdated();
    } catch (e: unknown) {
      setErr(getFriendlyAxiosMessage(e, "Could not update meeting link."));
    } finally {
      setSaving(false);
    }
  }

  async function complete() {
    setCompleting(true);
    setErr(null);
    try {
      await markBookingComplete(item.id);
      setConfirmingComplete(false);
      await onUpdated();
    } catch (e: unknown) {
      setErr(getFriendlyAxiosMessage(e, "Could not mark this consultation complete."));
    } finally {
      setCompleting(false);
    }
  }

  return (
    <DashboardPanel className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{item.patientName}</p>
          <p className="text-sm text-muted-foreground">
            {consultationTypeLabel(item.consultationType)}
          </p>
          <p className="mt-1 text-sm">{formatSlot(item.startsAt, item.endsAt)}</p>
          {item.patientNotes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
              {item.patientNotes}
            </p>
          ) : null}
        </div>
        <AppointmentStatusBadge status={item.status} />
      </div>

      {needsLink ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          {editing ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Meeting link (Google Meet / Zoom / WhereBy)
              </label>
              <input
                type="url"
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="https://meet.example.com/abc-defg-hij"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-3 animate-spin" /> : "Save link"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setLinkDraft(item.meetingLink ?? "");
                    setErr(null);
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
              {err ? <p className="text-xs text-destructive">{err}</p> : null}
            </div>
          ) : item.meetingLink ? (
            <div className="flex items-center justify-between gap-3">
              <a
                href={item.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Link2 className="size-4" />
                Open meeting link
              </a>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Link2 className="size-4" />
              Add meeting link
            </button>
          )}
        </div>
      ) : null}

      {canMarkComplete ? (
        <div className="border-t border-border pt-3">
          {confirmingComplete ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Marking this consultation complete starts a 24-hour grace
                window during which the patient can still ask follow-up
                questions in chat. After that, both sides need to wait for a
                new booking before messaging.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={completing}
                  onClick={() => void complete()}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {completing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Yes, mark complete
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={completing}
                  onClick={() => setConfirmingComplete(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingComplete(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
            >
              <CheckCircle2 className="size-4" />
              Mark consultation complete
            </button>
          )}
          {err && !confirmingComplete ? (
            <p className="mt-1 text-xs text-destructive">{err}</p>
          ) : null}
        </div>
      ) : null}
    </DashboardPanel>
  );
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "confirmed"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "completed"
        ? "border-emerald-400/40 bg-emerald-50 text-emerald-700"
        : status === "missed"
          ? "border-rose-400/40 bg-rose-50 text-rose-700"
          : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ProfessionalBookingRequestsPage() {
  const profile = useRequireProfessional();
  const [items, setItems] = useState<DoctorBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // Per-row draft of the meeting link the doctor types before pressing
  // "Confirm appointment". Keyed by bookingId so multiple rows can be in
  // draft state simultaneously.
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});

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

  async function handleConfirm(item: DoctorBookingRequest) {
    setConfirmingId(item.id);
    try {
      const linkDraft = linkDrafts[item.id]?.trim();
      await confirmProfessionalBooking(item.id, {
        meetingLink: linkDraft || undefined,
      });
      setLinkDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
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
            {items.map((item) => {
              const needsLink = consultationNeedsMeetingLink(item.consultationType);
              const draft = linkDrafts[item.id] ?? "";
              return (
                <li key={item.id}>
                  <DashboardPanel className="space-y-3 px-5 py-4">
                    <div>
                      <p className="font-semibold">{item.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {consultationTypeLabel(item.consultationType)} ·{" "}
                        {item.consultationFeeDisplay}
                      </p>
                      <p className="mt-1 text-sm">{formatSlot(item.startsAt, item.endsAt)}</p>
                      {item.patientNotes ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                          {item.patientNotes}
                        </p>
                      ) : null}
                    </div>

                    {needsLink ? (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Meeting link (optional — you can add or change it later)
                        </label>
                        <input
                          type="url"
                          value={draft}
                          onChange={(e) =>
                            setLinkDrafts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="https://meet.example.com/abc-defg-hij"
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={confirmingId === item.id}
                      onClick={() => void handleConfirm(item)}
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
              );
            })}
          </ul>
        )}
      </div>
    </ProfessionalDashboardShell>
  );
}
