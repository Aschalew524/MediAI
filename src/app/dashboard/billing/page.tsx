"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { getMyBilling, type MyBillingResponse } from "@/lib/payments-api";
import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import { DashboardContainer, DashboardPage, DashboardPanel } from "@/components/dashboard/primitives";

export default function DashboardBillingPage() {
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getMyBilling()
      .then((data) => {
        if (!cancelled) setBilling(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(getFriendlyAxiosMessage(e, "Could not load billing."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-6 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Assistant access and recent consultation bookings stay on your account.
          </p>
        </div>

        {loading ? (
          <DashboardPanel className="flex min-h-[20vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </DashboardPanel>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {billing && !loading ? (
          <>
            <DashboardPanel className="space-y-2 px-6 py-5">
              <h2 className="text-lg font-semibold">AI assistant</h2>
              <p className="text-sm text-muted-foreground">
                {billing.assistantAccess.active
                  ? `${billing.assistantAccess.planName ?? "Active plan"}${billing.assistantAccess.endsAt ? ` · ends ${new Date(billing.assistantAccess.endsAt).toLocaleDateString()}` : ""}`
                  : "No paid assistant plan. General chat is still available."}
              </p>
              <Link
                href="/pricing"
                className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View plans on pricing page
              </Link>
            </DashboardPanel>

            <DashboardPanel className="space-y-3 px-6 py-5">
              <h2 className="text-lg font-semibold">Recent consultations</h2>
              {billing.recentConsultations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consultations booked yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {billing.recentConsultations.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-primary/15 px-4 py-3"
                    >
                      <p className="font-medium">{c.topDoctorName}</p>
                      <p className="text-muted-foreground">
                        {c.consultationType} · {c.status.replace(/_/g, " ")} ·{" "}
                        {c.consultationFeeDisplay}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>
          </>
        ) : null}
      </DashboardContainer>
    </DashboardPage>
  );
}
