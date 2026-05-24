import { isAxiosError } from "axios";

import api from "@/lib/axios";
import { messageFromAxiosData } from "@/lib/auth.types";

export type AssistantAccessPlan = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  priceDisplay: string;
  durationDays: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type InitiatePaymentResponse = {
  txRef: string;
  /**
   * Hosted Chapa checkout URL to redirect to. Optional because the Free-plan
   * subscription path (Phase 7) returns no URL — the access is granted
   * server-side and the client just routes back home.
   */
  checkoutUrl?: string;
  accessId?: string;
  bookingId?: string;
  subscriptionId?: string;
  /** Phase 7 — true when the Free plan was selected and no Chapa redirect happens. */
  freeGranted?: boolean;
};

/**
 * Phase 7 — admin-managed subscription tier surfaced on /pricing. Both
 * monthly and yearly prices are returned so the UI can flip between them
 * without a second round-trip.
 */
export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyPriceDisplay: string;
  yearlyPriceDisplay: string;
  currency: string;
  features: string[];
  isFree: boolean;
  sortOrder: number;
};

export type SubscriptionInterval = "monthly" | "yearly";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "expired"
  | "cancelled"
  | "failed";

export type MySubscription = {
  active: boolean;
  status: SubscriptionStatus | null;
  interval: SubscriptionInterval | null;
  planId: string | null;
  planName: string | null;
  priceDisplay: string | null;
  startsAt: string | null;
  endsAt: string | null;
  paidAt: string | null;
};

export type BillingAssistantAccess = {
  active: boolean;
  status: "pending" | "active" | "expired" | "cancelled" | "failed" | null;
  planName: string | null;
  priceDisplay: string | null;
  startsAt: string | null;
  endsAt: string | null;
  paidAt: string | null;
};

/**
 * Mirrors the backend `ConsultationType` enum. Phase 4 added `in_person`
 * and `hybrid`. Older billing rows may only carry video/written values; the
 * union accommodates both.
 */
export type ConsultationKind = "video" | "written" | "in_person" | "hybrid";

export type BillingConsultation = {
  id: string;
  topDoctorId: string;
  topDoctorName: string;
  consultationType: ConsultationKind;
  status:
    | "pending_payment"
    | "paid"
    | "pending_doctor_approval"
    | "approved"
    | "rejected"
    | "completed"
    | "missed"
    | "confirmed"
    | "cancelled"
    | "failed";
  consultationFeeCents: number;
  consultationFeeDisplay: string;
  currency: string;
  paidAt: string | null;
  /** Phase 4 — slot timing, mirrored from the consultation booking. */
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  /**
   * Phase 4 — meeting link the doctor attached (only after approval; the
   * backend nulls it for pending bookings even if a value exists on the
   * row). May be absent on older API responses.
   */
  meetingLink?: string | null;
  meetingLinkSetAt?: string | null;
};

/**
 * Snapshot of the free-trial counter for personalized AI chat.
 *
 * - `enabled`: false when the trial system is turned off entirely
 *   (`ASSISTANT_TRIAL_ENABLED=false` on the backend) — in that case the
 *   only way to use personal chat is via a paid plan.
 * - `limit`: total number of free personal chats the user gets
 *   (typically 3, controlled by `ASSISTANT_TRIAL_LIMIT`).
 * - `used`: trial chats consumed so far (capped at `limit`).
 * - `remaining`: `limit - used` while the trial is active, else 0.
 * - `exhausted`: true once `used >= limit` (or when trial is disabled).
 */
export type BillingPersonalTrial = {
  enabled: boolean;
  limit: number;
  used: number;
  remaining: number;
  exhausted: boolean;
};

export type MyBillingResponse = {
  assistantAccess: BillingAssistantAccess;
  /** Free-trial counter — present whether or not the user is on a paid plan. */
  personalTrial: BillingPersonalTrial;
  /**
   * True when the user may send a personal message right now — either
   * because trial credits remain OR because they hold an active paid
   * subscription / legacy assistant pass.
   */
  personalChatAllowed: boolean;
  /**
   * True when the trial is exhausted and there's no paid pass — the user
   * can still read their conversation history but cannot send.
   */
  personalChatReadOnly: boolean;
  /**
   * True when the user holds an active paid subscription (Lite / Pro) or
   * legacy assistant pass. Lets the UI hide the "X free chats left"
   * badge for users who already pay, regardless of trial state.
   */
  personalChatPaidActive: boolean;
  recentConsultations: BillingConsultation[];
};

export function canSendPersonalChat(billing: MyBillingResponse): boolean {
  return billing.personalChatAllowed && !billing.personalChatReadOnly;
}

export function getAssistantBillingErrorCode(err: unknown): string | undefined {
  if (!isAxiosError(err)) return undefined;
  const data = err.response?.data;
  if (typeof data === "object" && data !== null && "error" in data) {
    const code = (data as { error: unknown }).error;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export type CreateConsultationBookingPayload = {
  topDoctorId: string;
  consultationType: ConsultationKind;
  /** ISO start time of the selected availability slot */
  startsAt: string;
  patientNotes?: string;
};

export type ConsultationBooking = {
  id: string;
  topDoctorId: string;
  topDoctorName: string;
  consultationType: ConsultationKind;
  status: BillingConsultation["status"];
  consultationFeeCents: number;
  consultationFeeDisplay: string;
  currency: string;
  patientNotes: string | null;
  paidAt: string | null;
  chapaTxRef?: string | null;
  /** Phase 3 — scheduled appointment window. Null for legacy/unscheduled rows. */
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number;
  /** Phase 4 — visible to the patient only once the booking is approved. */
  meetingLink?: string | null;
  meetingLinkSetAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAssistantAccessPlans(): Promise<AssistantAccessPlan[]> {
  const { data } = await api.get<{ items: AssistantAccessPlan[] }>(
    "/payments/assistant/plans",
  );
  return data.items;
}

export async function initiateAssistantPayment(
  planId: string,
): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(
    "/payments/assistant/initiate",
    { planId },
  );
  return data;
}

export async function createConsultationBooking(
  payload: CreateConsultationBookingPayload,
): Promise<ConsultationBooking> {
  const { data } = await api.post<ConsultationBooking>("/consultations", payload);
  return data;
}

export async function initiateConsultationPayment(
  bookingId: string,
): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(
    `/payments/consultations/${bookingId}/initiate`,
  );
  return data;
}

export type FinalizeConsultationResponse = {
  ok: true;
  status: string;
  paid: boolean;
};

/**
 * Dev/sandbox fallback: ask the backend to re-verify a booking's stored
 * Chapa tx_ref and advance the lifecycle. In production this code path is
 * usually unnecessary because Chapa fires the server-to-server webhook —
 * but in dev (and any environment where Chapa can't reach our API directly)
 * the return page calls this with the patient's bookingId so the doctor's
 * inbox lights up without waiting for a webhook that will never arrive.
 */
export async function finalizeConsultationPayment(
  bookingId: string,
): Promise<FinalizeConsultationResponse> {
  const { data } = await api.post<FinalizeConsultationResponse>(
    `/payments/consultations/${bookingId}/finalize`,
  );
  return data;
}

export async function getMyBilling(): Promise<MyBillingResponse> {
  const { data } = await api.get<MyBillingResponse>("/me/billing");
  return data;
}

// --- Phase 7: SubscriptionPlan checkout + status ---------------------------

/**
 * Fetch the active SubscriptionPlans visible on /pricing. Returns the same
 * shape (`{ items }`) as the assistant-pass list so existing components can
 * stay symmetric.
 */
export async function getSubscriptionPlansPublic(): Promise<SubscriptionPlan[]> {
  const { data } = await api.get<{ items: SubscriptionPlan[] }>(
    "/payments/subscription/plans",
  );
  return data.items;
}

/**
 * Start a subscription. For paid plans you get a Chapa `checkoutUrl` to
 * redirect to; for the Free plan you get `freeGranted: true` and the row is
 * already active — no redirect, just navigate home.
 */
export async function initiateSubscriptionPayment(
  planId: string,
  interval: SubscriptionInterval,
): Promise<InitiatePaymentResponse> {
  const { data } = await api.post<InitiatePaymentResponse>(
    "/payments/subscription/initiate",
    { planId, interval },
  );
  return data;
}

export async function getMySubscription(): Promise<MySubscription> {
  const { data } = await api.get<MySubscription>("/me/subscription");
  return data;
}

export type FinalizeSubscriptionResponse = {
  ok: true;
  status: SubscriptionStatus;
  active: boolean;
};

/**
 * Dev/sandbox fallback for the Chapa return flow. Mirrors
 * `finalizeConsultationPayment` — call this when the return URL only
 * carries `subscriptionId` (no `tx_ref`), and the backend will verify
 * the stored Chapa tx_ref and flip the subscription to active.
 * Idempotent; safe to call multiple times.
 */
export async function finalizeSubscriptionPayment(
  subscriptionId: string,
): Promise<FinalizeSubscriptionResponse> {
  const { data } = await api.post<FinalizeSubscriptionResponse>(
    `/payments/subscription/${subscriptionId}/finalize`,
  );
  return data;
}

export async function getMyConsultations(): Promise<ConsultationBooking[]> {
  const { data } = await api.get<{ items: ConsultationBooking[] }>(
    "/consultations/my",
  );
  return data.items;
}

export function userFacingPaymentError(
  error: unknown,
  fallback: string,
): string {
  if (!isAxiosError(error)) {
    return fallback;
  }
  const status = error.response?.status;
  if (status === 401) {
    return "Please sign in again to continue.";
  }
  if (status === 403) {
    return (
      messageFromAxiosData(error.response?.data) ??
      "This action is not available for your account."
    );
  }
  if (status === 404) {
    return messageFromAxiosData(error.response?.data) ?? "We could not find that payment item.";
  }
  if (status === 409) {
    return messageFromAxiosData(error.response?.data) ?? "This payment has already been completed.";
  }
  if (status === 502 || status === 503 || status === 504) {
    return (
      messageFromAxiosData(error.response?.data) ??
      "The payment gateway is temporarily unavailable. Please try again."
    );
  }
  return messageFromAxiosData(error.response?.data) ?? fallback;
}
