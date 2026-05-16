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

export type DoctorAppointment = {
  id: string;
  patientUserId: string;
  patientName: string;
  consultationType: "video" | "written";
  status: string;
  startsAt: string;
  endsAt: string;
  patientNotes: string | null;
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

export async function confirmProfessionalBooking(bookingId: string): Promise<void> {
  await api.post(`/professional/booking-requests/${encodeURIComponent(bookingId)}/confirm`);
}

export function formatMinutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
