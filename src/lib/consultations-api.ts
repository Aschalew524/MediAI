import api from "@/lib/axios";

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
};

export type WeeklyAvailabilityItem = {
  id?: string;
  dayOfWeek: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  slotDurationMinutes: number;
  timezone: string;
};

/**
 * Mirrors `ConsultationType` in the backend Prisma enum. Phase 4 added
 * `in_person` and `hybrid`; the existing two values stay as-is so older
 * patient records and admin queries don't break.
 */
export type ConsultationType = "video" | "written" | "in_person" | "hybrid";

export const CONSULTATION_TYPE_OPTIONS: {
  value: ConsultationType;
  label: string;
  description: string;
}[] = [
  {
    value: "video",
    label: "Video call",
    description: "Live appointment over Google Meet / Zoom / WhereBy.",
  },
  {
    value: "written",
    label: "Written / async",
    description: "Doctor replies in writing within the booked slot.",
  },
  {
    value: "in_person",
    label: "In-person visit",
    description: "Patient travels to the doctor's clinic.",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Video first, with an optional in-person follow-up.",
  },
];

export type DoctorAppointment = {
  id: string;
  patientUserId: string;
  patientName: string;
  consultationType: ConsultationType;
  status: string;
  startsAt: string;
  endsAt: string;
  patientNotes: string | null;
  meetingLink: string | null;
  meetingLinkSetAt: string | null;
};

export type DoctorBookingRequest = DoctorAppointment & {
  consultationFeeDisplay: string;
  createdAt: string;
};

export async function listDoctorAvailabilitySlots(
  doctorUserId: string,
  from?: string,
  days = 14,
): Promise<AvailabilitySlot[]> {
  const { data } = await api.get<{ items: AvailabilitySlot[] }>(
    `/doctors/${encodeURIComponent(doctorUserId)}/availability/slots`,
    { params: { from, days } },
  );
  return data.items;
}

export async function getProfessionalAvailability(): Promise<WeeklyAvailabilityItem[]> {
  const { data } = await api.get<{ items: WeeklyAvailabilityItem[] }>(
    "/professional/availability",
  );
  return data.items;
}

export async function saveProfessionalAvailability(
  items: Omit<WeeklyAvailabilityItem, "id">[],
): Promise<WeeklyAvailabilityItem[]> {
  const { data } = await api.put<{ items: WeeklyAvailabilityItem[] }>(
    "/professional/availability",
    { items },
  );
  return data.items;
}

export async function listProfessionalAppointments(): Promise<DoctorAppointment[]> {
  const { data } = await api.get<{ items: DoctorAppointment[] }>(
    "/professional/appointments",
  );
  return data.items;
}

export async function listProfessionalBookingRequests(): Promise<DoctorBookingRequest[]> {
  const { data } = await api.get<{ items: DoctorBookingRequest[] }>(
    "/professional/booking-requests",
  );
  return data.items;
}

export async function confirmProfessionalBooking(
  bookingId: string,
  options: { meetingLink?: string } = {},
): Promise<void> {
  // Phase 4 — the doctor can optionally include a meeting link with the
  // approval; the backend persists it and surfaces it to the patient.
  const body = options.meetingLink
    ? { meetingLink: options.meetingLink }
    : {};
  await api.post(
    `/professional/booking-requests/${encodeURIComponent(bookingId)}/confirm`,
    body,
  );
}

export async function setBookingMeetingLink(
  bookingId: string,
  meetingLink: string,
): Promise<void> {
  await api.patch(
    `/professional/bookings/${encodeURIComponent(bookingId)}/meeting-link`,
    { meetingLink },
  );
}

/**
 * Doctor presses "Mark complete" on an approved booking — formally closes
 * the consultation. After this, the chat enters its 24-hour post-completion
 * grace window (see backend `POST_COMPLETION_GRACE_MS`); after the grace
 * expires both sides are locked out of `sendMessage` until the patient
 * books a follow-up.
 */
export async function markBookingComplete(bookingId: string): Promise<void> {
  await api.post(
    `/professional/bookings/${encodeURIComponent(bookingId)}/complete`,
  );
}

export function consultationTypeLabel(value: ConsultationType): string {
  const match = CONSULTATION_TYPE_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

export function formatMinutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
