"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { chapaReturnHasRefQuery } from "@/lib/chapa-return-query";
import { getApiBaseUrl } from "@/lib/api-origin";

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
  const canSync = chapaReturnHasRefQuery(queryString);

  const [state, setState] = useState<SyncState>(() =>
    canSync ? { phase: "syncing" } : { phase: "noop" },
  );

  useEffect(() => {
    if (!canSync) {
      return;
    }

    let cancelled = false;
    const base = getApiBaseUrl().replace(/\/$/, "");
    const url = `${base}/payments/chapa/callback?${queryString}`;

    void (async () => {
      try {
        const res = await fetch(url, { method: "GET", credentials: "omit" });
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
        if (cancelled) return;
        if (res.ok) {
          setState({ phase: "ok" });
        } else {
          setState({
            phase: "error",
            message:
              message ??
              `Verification failed (${res.status}). Try refreshing your dashboard in a moment.`,
          });
        }
      } catch {
        if (cancelled) return;
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
  }, [canSync, queryString]);

  const assistant = kind === "assistant";

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-primary/15 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-primary">Chapa return</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {state.phase === "ok"
          ? assistant
            ? "Assistant payment confirmed"
            : "Consultation payment confirmed"
          : `We’re confirming your ${assistant ? "assistant" : "consultation"} payment`}
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
            href={assistant ? "/pricing" : "/dashboard/top-doctors"}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {assistant ? "Back to pricing" : "Back to top doctors"}
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
