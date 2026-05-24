"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Hourglass,
  Link2,
  Loader2,
  MessageSquare,
  Stethoscope,
  XCircle,
} from "lucide-react";

import {
  getMyConsultations,
  type ConsultationBooking,
} from "@/lib/payments-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { cn } from "@/lib/utils";

import {
  DashboardBackTitle,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

// Phase 4 — must match backend constants in
// `src/consultations/booking-statuses.ts`. Centralised so the UI can render
// the same "Chat closes in Xh Ym" countdown the server enforces.
const SLOT_END_GRACE_MS = 30 * 60 * 1000;
const POST_COMPLETION_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * Friendly label for the Prisma `ConsultationType` enum. Keeps the legacy
 * `video` / `written` strings as plain words; the Phase 4 additions
 * (`in_person`, `hybrid`) get a more descriptive copy.
 */
function consultationKindLabel(value: string): string {
  switch (value) {
    case "video":
      return "Video";
    case "written":
      return "Written";
    case "in_person":
      return "In-person";
    case "hybrid":
      return "Hybrid";
    default:
      return value;
  }
}

/**
 * Maps `ConsultationBookingStatus` to a patient-facing copy + colour. We
 * deliberately avoid the raw enum strings (`pending_doctor_approval`,
 * `pending_payment`, etc.) because they leak engineering jargon.
 */
function statusBadge(status: ConsultationBooking["status"]): {
  label: string;
  tone: "info" | "success" | "warning" | "danger" | "muted";
  hint: string;
} {
  switch (status) {
    case "pending_payment":
      return {
        label: "Payment incomplete",
        tone: "warning",
        hint: "Finish payment to send this request to the doctor.",
      };
    case "paid":
      return {
        label: "Payment received",
        tone: "info",
        hint: "We're forwarding your request to the doctor. Refresh in a few seconds.",
      };
    case "pending_doctor_approval":
      return {
        label: "Awaiting doctor's decision",
        tone: "info",
        hint: "The doctor has your request and will approve or decline shortly.",
      };
    case "approved":
      return {
        label: "Approved",
        tone: "success",
        hint: "Your consultation is confirmed. The meeting link (if any) appears below.",
      };
    case "completed":
      return { label: "Completed", tone: "success", hint: "Consultation finished." };
    case "missed":
      return {
        label: "Missed",
        tone: "danger",
        hint: "The appointment time passed without the consultation taking place.",
      };
    case "rejected":
      return {
        label: "Declined by doctor",
        tone: "danger",
        hint: "Your refund (if applicable) is being processed.",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        tone: "muted",
        hint: "This booking has been cancelled.",
      };
    case "failed":
      return {
        label: "Payment failed",
        tone: "danger",
        hint: "Try booking again from the doctor's page.",
      };
    case "confirmed":
      // Legacy pre-Phase-3 status — render the same way as approved.
      return {
        label: "Confirmed",
        tone: "success",
        hint: "Your consultation is confirmed.",
      };
    default:
      return { label: status, tone: "muted", hint: "" };
  }
}

const TONE_CLASSES: Record<
  ReturnType<typeof statusBadge>["tone"],
  string
> = {
  info: "border-primary/30 bg-primary/10 text-primary",
  success: "border-emerald-400/40 bg-emerald-50 text-emerald-700",
  warning: "border-amber-400/40 bg-amber-50 text-amber-800",
  danger: "border-rose-400/40 bg-rose-50 text-rose-700",
  muted: "border-border bg-muted text-muted-foreground",
};

function formatSlot(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): string | null {
  if (!startsAt) return null;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const datePart = start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endsAt) return datePart;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return datePart;
  const endPart = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} – ${endPart}`;
}

/**
 * Patient-facing list of every consultation booking the calling user has
 * created. Phase 4 makes this the canonical place the patient finds:
 *   * the current status of each request (awaiting doctor / approved / etc.)
 *   * the doctor's meeting link, once the doctor approves
 *   * the scheduled slot and fee
 *
 * Powered by `GET /consultations/my`, which already returns `meetingLink`
 * gated by the same approve-or-later rule as `BillingConsultationSummaryDto`.
 */
export default function PatientConsultationsPage() {
  const [items, setItems] = useState<ConsultationBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await getMyConsultations();
      // Most useful order: upcoming/active first, then everything else by
      // creation time descending. We sort client-side so the UI stays
      // responsive even if the API switches order later.
      rows.sort((a, b) => {
        const aTime = a.startsAt
          ? new Date(a.startsAt).getTime()
          : new Date(a.createdAt).getTime();
        const bTime = b.startsAt
          ? new Date(b.startsAt).getTime()
          : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
      setItems(rows);
    } catch (e: unknown) {
      setError(getFriendlyAxiosMessage(e, "Could not load your consultations."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      (items ?? []).filter((b) =>
        ["approved", "confirmed", "pending_doctor_approval", "paid", "pending_payment"].includes(
          b.status,
        ),
      ),
    [items],
  );
  const past = useMemo(
    () =>
      (items ?? []).filter((b) =>
        ["completed", "missed", "rejected", "cancelled", "failed"].includes(
          b.status,
        ),
      ),
    [items],
  );

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6">
        <DashboardBackTitle
          title="My consultations"
          description="Every consultation request you've made. The doctor's meeting link shows up here as soon as they approve."
        />

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {items === null ? (
          <DashboardPanel className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </DashboardPanel>
        ) : items.length === 0 ? (
          <DashboardPanel className="flex min-h-[30vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Stethoscope className="size-10 text-primary/60" />
            <p className="text-sm text-muted-foreground">
              You haven&apos;t booked any consultations yet.
            </p>
            <Link
              href="/dashboard/top-doctors"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Browse top doctors
            </Link>
          </DashboardPanel>
        ) : (
          <div className="space-y-8">
            <BookingSection
              heading="Active & upcoming"
              icon={<CalendarClock className="size-4" />}
              items={upcoming}
              emptyLabel="No active bookings — once you book a consultation it appears here."
            />
            <BookingSection
              heading="Past"
              icon={<Clock className="size-4" />}
              items={past}
              emptyLabel="No past consultations yet."
            />
          </div>
        )}
      </DashboardContainer>
    </DashboardPage>
  );
}

function BookingSection({
  heading,
  icon,
  items,
  emptyLabel,
}: {
  heading: string;
  icon: React.ReactNode;
  items: ConsultationBooking[];
  emptyLabel: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{heading}</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Pure helper: replicate `bookingChatWindowEndsAt` from the backend so the
 * patient's "My consultations" page can show countdowns / "chat closed"
 * states without an extra round-trip per card.
 */
function bookingChatWindowEndsAt(booking: ConsultationBooking): Date | null {
  const created = new Date(booking.createdAt);
  switch (booking.status) {
    case "approved":
    case "confirmed": {
      if (booking.startsAt && booking.endsAt) {
        const slotEnd = new Date(booking.endsAt);
        if (!Number.isNaN(slotEnd.getTime())) {
          return new Date(slotEnd.getTime() + SLOT_END_GRACE_MS);
        }
      }
      return new Date(created.getTime() + POST_COMPLETION_GRACE_MS);
    }
    case "completed": {
      // We don't yet have `completedAt` exposed in the API — fall back to
      // `updatedAt` which is the next-best proxy.
      const anchor = new Date(booking.updatedAt ?? booking.createdAt);
      return new Date(anchor.getTime() + POST_COMPLETION_GRACE_MS);
    }
    default:
      return null;
  }
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "now";
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

function BookingCard({ booking }: { booking: ConsultationBooking }) {
  const status = statusBadge(booking.status);
  const slotLabel = formatSlot(booking.startsAt, booking.endsAt);
  const showMeetingLink = Boolean(booking.meetingLink);

  // Window-aware chat state, derived client-side. The backend stays the
  // source of truth (it'll 403 a `sendMessage` no matter what we render
  // here), this is purely for surfacing the right CTA.
  const windowEndsAt = bookingChatWindowEndsAt(booking);
  const now = Date.now();
  const chatIsOpen =
    windowEndsAt !== null && windowEndsAt.getTime() > now;
  const chatJustClosed =
    windowEndsAt !== null &&
    windowEndsAt.getTime() <= now &&
    (booking.status === "completed" ||
      booking.status === "approved" ||
      booking.status === "confirmed");

  return (
    <DashboardPanel className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">{booking.topDoctorName}</p>
          <p className="text-sm text-muted-foreground">
            {consultationKindLabel(booking.consultationType)} consultation ·{" "}
            {booking.consultationFeeDisplay}
          </p>
          {slotLabel ? (
            <p className="mt-1 text-sm text-foreground/90">{slotLabel}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              No scheduled slot — legacy booking.
            </p>
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            TONE_CLASSES[status.tone],
          )}
        >
          {status.tone === "success" ? (
            <CheckCircle2 className="size-3.5" />
          ) : status.tone === "danger" ? (
            <XCircle className="size-3.5" />
          ) : null}
          {status.label}
        </span>
      </div>

      {status.hint ? (
        <p className="text-xs text-muted-foreground">{status.hint}</p>
      ) : null}

      {showMeetingLink ? (
        <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Meeting link from {booking.topDoctorName}
          </p>
          <a
            href={booking.meetingLink ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Link2 className="size-4" />
            Open meeting
          </a>
          {booking.meetingLinkSetAt ? (
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              Shared {new Date(booking.meetingLinkSetAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {chatIsOpen && windowEndsAt ? (
        <ChatOpenSection
          booking={booking}
          windowEndsAt={windowEndsAt}
          remainingMs={windowEndsAt.getTime() - now}
        />
      ) : chatJustClosed ? (
        <ChatClosedSection booking={booking} />
      ) : null}

      {booking.patientNotes ? (
        <details className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Your notes to the doctor
          </summary>
          <p className="mt-1 whitespace-pre-wrap text-sm">{booking.patientNotes}</p>
        </details>
      ) : null}
    </DashboardPanel>
  );
}

/**
 * Shown inside an active consultation window. For written-style
 * consultations (`written` / `hybrid`) this is the *primary* CTA — that
 * IS where the consultation happens. For video / in-person bookings it
 * just acts as a side channel for follow-up questions.
 */
function ChatOpenSection({
  booking,
  windowEndsAt,
  remainingMs,
}: {
  booking: ConsultationBooking;
  windowEndsAt: Date;
  remainingMs: number;
}) {
  const isWrittenStyle =
    booking.consultationType === "written" ||
    booking.consultationType === "hybrid";
  const showCountdown = remainingMs < 6 * 60 * 60 * 1000;
  const completedGraceCopy =
    booking.status === "completed"
      ? "Your consultation is wrapped up. You can still reply for a short follow-up window."
      : null;

  return (
    <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/60 px-4 py-3">
      <div className="flex items-start gap-2">
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-emerald-700" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            {isWrittenStyle
              ? "Continue your written consultation"
              : "Chat with your doctor"}
          </p>
          {completedGraceCopy ? (
            <p className="mt-0.5 text-xs text-emerald-800/80">
              {completedGraceCopy}
            </p>
          ) : null}
          {showCountdown ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-amber-800">
              <Hourglass className="size-3" />
              Chat closes in {formatRemaining(remainingMs)} (
              {windowEndsAt.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
              )
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link
          href="/dashboard/messages"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-95"
        >
          <MessageSquare className="size-3.5" />
          {isWrittenStyle ? "Open chat" : "Reply in chat"}
        </Link>
      </div>
    </div>
  );
}

function ChatClosedSection({ booking }: { booking: ConsultationBooking }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="text-sm font-medium text-foreground">
        Chat closed
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        This consultation has ended. Book a follow-up consultation with{" "}
        {booking.topDoctorName} to keep messaging.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/top-doctors/${encodeURIComponent(booking.topDoctorId)}`}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-95"
        >
          Book follow-up
        </Link>
        <Link
          href="/dashboard/messages"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
        >
          View chat history
        </Link>
      </div>
    </div>
  );
}
