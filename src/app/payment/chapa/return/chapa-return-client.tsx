"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";

import {
  chapaReturnBookingId,
  chapaReturnHasRefQuery,
  chapaReturnSubscriptionId,
} from "@/lib/chapa-return-query";
import { getApiBaseUrl } from "@/lib/api-origin";
import {
  finalizeConsultationPayment,
  finalizeSubscriptionPayment,
} from "@/lib/payments-api";
import { messageFromAxiosData } from "@/lib/auth.types";

type SyncState =
  | { phase: "syncing" }
  | { phase: "ok" }
  | { phase: "noop" }
  | { phase: "error"; message: string };

export function ChapaReturnClient({
  kind,
  queryString,
}: {
  kind: string;
  queryString: string;
}) {
  const hasTxRef = chapaReturnHasRefQuery(queryString);
  const bookingId = chapaReturnBookingId(queryString);
  const subscriptionId = chapaReturnSubscriptionId(queryString);
  // Either path can drive verification: the public callback (when Chapa
  // included a tx_ref on the redirect) or the authenticated finalize
  // route (when only our own id is in the URL, which is the common
  // dev/sandbox case). Subscriptions take precedence for the explicit
  // id check because the Chapa `return_url` carries both `kind=` and
  // either `subscriptionId=` or `bookingId=`.
  const canSync = hasTxRef || Boolean(bookingId || subscriptionId);

  const [state, setState] = useState<SyncState>(() =>
    canSync ? { phase: "syncing" } : { phase: "noop" },
  );

  useEffect(() => {
    if (!canSync) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (hasTxRef) {
          // Chapa gave us a tx_ref — go through the public callback endpoint
          // (works for both assistant and consultation flows, no auth needed).
          const base = getApiBaseUrl().replace(/\/$/, "");
          const url = `${base}/payments/chapa/callback?${queryString}`;
          const res = await fetch(url, {
            method: "GET",
            credentials: "omit",
          });
          if (cancelled) return;
          if (res.ok) {
            setState({ phase: "ok" });
            return;
          }
          const text = await res.text();
          let message: string | null = null;
          try {
            const parsed = JSON.parse(text) as { message?: unknown };
            if (typeof parsed.message === "string" && parsed.message) {
              message = parsed.message;
            }
          } catch {
            if (text.trim()) message = text.trim().slice(0, 500);
          }
          setState({
            phase: "error",
            message:
              message ??
              `Verification failed (${res.status}). Try refreshing your dashboard in a moment.`,
          });
          return;
        }

        // No tx_ref on the URL — Chapa sandbox usually omits it. Use the
        // id we stashed in the return URL and ask the API to verify
        // against the txRef we already stored when initiate ran.
        if (subscriptionId) {
          await finalizeSubscriptionPayment(subscriptionId);
          if (cancelled) return;
          setState({ phase: "ok" });
          return;
        }
        if (bookingId) {
          await finalizeConsultationPayment(bookingId);
          if (cancelled) return;
          setState({ phase: "ok" });
        }
      } catch (error: unknown) {
        if (cancelled) return;
        if (isAxiosError(error)) {
          setState({
            phase: "error",
            message:
              messageFromAxiosData(error.response?.data) ??
              `Verification failed (${error.response?.status ?? "network"}). Try refreshing your dashboard in a moment.`,
          });
          return;
        }
        setState({
          phase: "error",
          message:
            "Could not reach the payment server. Check that the API is running and NEXT_PUBLIC_API_URL is correct.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canSync, hasTxRef, bookingId, subscriptionId, queryString]);

  // The Chapa return URL stamps `?kind=` so we can pick the right copy /
  // primary CTA. `subscription` was added in Phase 7; both `assistant` and
  // `subscription` route back to /pricing on success, while consultations
  // go to /dashboard/top-doctors.
  const subscription = kind === "subscription";
  const assistant = kind === "assistant";
  const planFlow = subscription || assistant;
  const flowLabel = subscription
    ? "subscription"
    : assistant
      ? "assistant"
      : "consultation";

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-primary/15 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-primary">Chapa return</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {state.phase === "ok"
          ? subscription
            ? "Subscription payment confirmed"
            : assistant
              ? "Assistant payment confirmed"
              : "Consultation payment confirmed"
          : `We’re confirming your ${flowLabel} payment`}
      </h1>

      {state.phase === "syncing" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Contacting MediAI to verify this payment with Chapa…
        </p>
      ) : null}

      {state.phase === "ok" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Your payment was verified. You can open your dashboard or billing page; personalized access
          or your consultation should show as active shortly.
        </p>
      ) : null}

      {state.phase === "noop" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          We did not receive a payment reference in the URL (for example{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">trx_ref</code> or{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">tx_ref</code>
          ). If you already paid, wait a moment and refresh your dashboard or billing page, or
          contact support with your Chapa receipt.
        </p>
      ) : null}

      {state.phase === "error" ? (
        <p className="mt-4 text-sm leading-6 text-destructive">{state.message}</p>
      ) : null}

      {state.phase !== "syncing" ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={planFlow ? "/pricing" : "/dashboard/top-doctors"}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {planFlow ? "Back to pricing" : "Back to top doctors"}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Open dashboard
          </Link>
        </div>
      ) : null}
    </div>
  );
}
