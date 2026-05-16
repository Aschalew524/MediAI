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
  checkoutUrl: string;
  accessId?: string;
  bookingId?: string;
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

export type BillingConsultation = {
  id: string;
  topDoctorId: string;
  topDoctorName: string;
  consultationType: "video" | "written";
  status: "pending_payment" | "paid" | "confirmed" | "cancelled" | "failed";
  consultationFeeCents: number;
  consultationFeeDisplay: string;
  currency: string;
  paidAt: string | null;
  createdAt: string;
};

export type MyBillingResponse = {
  assistantAccess: BillingAssistantAccess;
  recentConsultations: BillingConsultation[];
};

export type CreateConsultationBookingPayload = {
  topDoctorId: string;
  consultationType: "video" | "written";
  patientNotes?: string;
};

export type ConsultationBooking = {
  id: string;
  topDoctorId: string;
  topDoctorName: string;
  consultationType: "video" | "written";
  status: "pending_payment" | "paid" | "confirmed" | "cancelled" | "failed";
  consultationFeeCents: number;
  consultationFeeDisplay: string;
  currency: string;
  patientNotes: string | null;
  paidAt: string | null;
  chapaTxRef?: string | null;
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

export async function getMyBilling(): Promise<MyBillingResponse> {
  const { data } = await api.get<MyBillingResponse>("/me/billing");
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
