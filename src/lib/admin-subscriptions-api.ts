/**
 * Nest admin subscription-plans API (`/admin/subscription-plans/*`) plus the
 * billing summary used on `/admin/subscriptions`. All admin endpoints require
 * a JWT whose `appRole === "admin"`.
 *
 * The `getSubscriptionPlans` (no `Admin`) helper hits the *public* endpoint
 * (`/subscription-plans`) — useful from the marketing pricing page.
 */
import api from "@/lib/axios";

/* -------------------------------------------------------------------------- */
/*  Plan shapes                                                               */
/* -------------------------------------------------------------------------- */

/** Mirrors `SubscriptionPlanResponseDto` (public). */
export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency: string;
  monthlyPriceDisplay: string;
  yearlyPriceDisplay: string;
  features: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `SubscriptionPlanAdminResponseDto`. */
export type AdminSubscriptionPlan = SubscriptionPlan & {
  subscriberCount: number;
};

/** Body for create + patch (cents). `currency` defaults to USD on the server. */
export type SubscriptionPlanWritePayload = {
  name: string;
  description?: string | null;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency?: string;
  features?: string[];
  active?: boolean;
  sortOrder?: number;
};

export type SubscriptionPlanPatchPayload = Partial<SubscriptionPlanWritePayload>;

/* -------------------------------------------------------------------------- */
/*  Public read                                                               */
/* -------------------------------------------------------------------------- */

export async function getSubscriptionPlans(options?: {
  signal?: AbortSignal;
}): Promise<{ items: SubscriptionPlan[] }> {
  const { data } = await api.get<{ items: SubscriptionPlan[] }>(
    "/subscription-plans",
    { signal: options?.signal },
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Admin CRUD                                                                */
/* -------------------------------------------------------------------------- */

export async function getAdminSubscriptionPlans(options?: {
  signal?: AbortSignal;
}): Promise<{ items: AdminSubscriptionPlan[] }> {
  const { data } = await api.get<{ items: AdminSubscriptionPlan[] }>(
    "/admin/subscription-plans",
    { signal: options?.signal },
  );
  return data;
}

export async function getAdminSubscriptionPlan(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<AdminSubscriptionPlan> {
  const { data } = await api.get<AdminSubscriptionPlan>(
    `/admin/subscription-plans/${encodeURIComponent(id)}`,
    { signal: options?.signal },
  );
  return data;
}

export async function createAdminSubscriptionPlan(
  body: SubscriptionPlanWritePayload,
  options?: { signal?: AbortSignal },
): Promise<AdminSubscriptionPlan> {
  const { data } = await api.post<AdminSubscriptionPlan>(
    "/admin/subscription-plans",
    body,
    { signal: options?.signal },
  );
  return data;
}

export async function patchAdminSubscriptionPlan(
  id: string,
  body: SubscriptionPlanPatchPayload,
  options?: { signal?: AbortSignal },
): Promise<AdminSubscriptionPlan> {
  const { data } = await api.patch<AdminSubscriptionPlan>(
    `/admin/subscription-plans/${encodeURIComponent(id)}`,
    body,
    { signal: options?.signal },
  );
  return data;
}

export async function deleteAdminSubscriptionPlan(
  id: string,
  options?: { signal?: AbortSignal },
): Promise<void> {
  await api.delete(`/admin/subscription-plans/${encodeURIComponent(id)}`, {
    signal: options?.signal,
  });
}

/* -------------------------------------------------------------------------- */
/*  Billing summary                                                           */
/* -------------------------------------------------------------------------- */

export type AdminBillingTransaction = {
  id: string;
  userEmail: string;
  planName: string;
  amountCents: number;
  amountDisplay: string;
  currency: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
};

/** Mirrors `AdminBillingSummaryResponseDto`. */
export type AdminBillingSummary = {
  totalRevenueCents: number;
  totalRevenueDisplay: string;
  currency: string;
  activeSubscriptions: number;
  monthlyRecurringRevenueCents: number;
  monthlyRecurringRevenueDisplay: string;
  /** Null until enough churn data exists. */
  churnRatePercent: number | null;
  /** False until a payment provider has been integrated. */
  paymentProviderConnected: boolean;
  transactions: AdminBillingTransaction[];
};

export async function getAdminBillingSummary(options?: {
  signal?: AbortSignal;
}): Promise<AdminBillingSummary> {
  const { data } = await api.get<AdminBillingSummary>(
    "/admin/billing-summary",
    { signal: options?.signal },
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Parse a "3.99" / "$3.99" string into integer cents. Returns `null` for
 * empty / non-numeric input. Tolerates leading currency symbols, thousands
 * separators, and surrounding whitespace.
 */
export function priceCentsFromInput(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/[^0-9.\-]/g, "");
  if (trimmed === "" || trimmed === "-" || trimmed === ".") return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

/** Inverse of {@link priceCentsFromInput} — for prefilling the editor input. */
export function priceInputFromCents(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return (cents / 100).toFixed(2);
}
