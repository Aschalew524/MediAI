"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { Check, Loader2, Sparkles } from "lucide-react";

import {
  getAssistantAccessPlans,
  getMyBilling,
  initiateAssistantPayment,
  userFacingPaymentError,
  type AssistantAccessPlan,
  type MyBillingResponse,
} from "@/lib/payments-api";
import { rememberPendingChapaTxRef } from "@/lib/chapa-pending-tx";
import { cn } from "@/lib/utils";

import { DashboardPanel } from "./primitives";

type Props = {
  className?: string;
  variant?: "compact" | "full";
  onAccessActive?: () => void;
};

export function AssistantPaywallPanel({
  className,
  variant = "full",
  onAccessActive,
}: Props) {
  const [plans, setPlans] = useState<AssistantAccessPlan[]>([]);
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const onAccessActiveRef = useRef(onAccessActive);
  onAccessActiveRef.current = onAccessActive;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [planItems, billingSnapshot] = await Promise.all([
          getAssistantAccessPlans(),
          getMyBilling(),
        ]);
        if (cancelled) return;
        setPlans(planItems);
        setBilling(billingSnapshot);
        if (billingSnapshot.assistantAccess.active) {
          onAccessActiveRef.current?.();
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError(userFacingPaymentError(err, "Could not load assistant plans."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePurchase(planId: string) {
    setPurchasingPlanId(planId);
    setError(null);
    try {
      const payment = await initiateAssistantPayment(planId);
      if (!payment.checkoutUrl) {
        throw new Error("Checkout URL missing from payment response.");
      }
      rememberPendingChapaTxRef(payment.txRef);
      window.location.assign(payment.checkoutUrl);
    } catch (err: unknown) {
      setError(
        userFacingPaymentError(err, "We could not start the payment. Please try again."),
      );
    } finally {
      setPurchasingPlanId(null);
    }
  }

  if (loading) {
    return (
      <DashboardPanel
        className={cn(
          "flex min-h-[12rem] items-center justify-center",
          className,
        )}
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading plans" />
      </DashboardPanel>
    );
  }

  if (billing?.assistantAccess.active) {
    return null;
  }

  const compact = variant === "compact";

  return (
    <DashboardPanel
      className={cn(
        "border-primary/20 bg-gradient-to-b from-primary/[0.06] to-white",
        compact ? "px-5 py-6" : "px-6 py-8",
        className,
      )}
    >
      <div className={cn("text-center", !compact && "mx-auto max-w-xl")}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="size-3.5" aria-hidden />
          Premium
        </span>
        <h2
          className={cn(
            "mt-3 font-semibold tracking-tight text-foreground",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          Unlock personalized AI Doctor
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Personalized chat uses your saved health profile for tailored answers. Choose a
          pass — access starts after Chapa payment is verified.
        </p>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {plans.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Plans are not available right now.{" "}
          <Link
            href="/pricing"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Open pricing
          </Link>
        </p>
      ) : (
        <ul
          className={cn(
            "mt-6 grid gap-4",
            compact ? "sm:grid-cols-2" : "md:grid-cols-2",
          )}
        >
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanCard
                plan={plan}
                purchasing={purchasingPlanId === plan.id}
                disabled={Boolean(purchasingPlanId)}
                onPurchase={() => void handlePurchase(plan.id)}
                compact={compact}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link
          href="/dashboard/ai-doctor/general"
          className="text-primary underline-offset-4 hover:underline"
        >
          General chat
        </Link>{" "}
        is free and does not use your saved health profile.
      </p>
    </DashboardPanel>
  );
}

function PlanCard({
  plan,
  purchasing,
  disabled,
  onPurchase,
  compact,
}: {
  plan: AssistantAccessPlan;
  purchasing: boolean;
  disabled: boolean;
  onPurchase: () => void;
  compact: boolean;
}) {
  const popular = plan.sortOrder === 0;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-primary/20 bg-white p-4 shadow-sm",
        popular && "ring-2 ring-primary/15",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
        {popular ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Popular
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{plan.priceDisplay}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {plan.durationDays} days · secure Chapa checkout
      </p>
      {!compact ? (
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Uses your MediAI health profile
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Multi-turn chat history
          </li>
        </ul>
      ) : null}
      <button
        type="button"
        onClick={onPurchase}
        disabled={disabled}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {purchasing ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          "Pay with Chapa"
        )}
      </button>
    </article>
  );
}
