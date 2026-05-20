"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { ArrowLeft, Check, Loader2, ShieldCheck, Sparkles, Tag } from "lucide-react";

import { getAccessToken } from "@/lib/auth-storage";
import {
  getMySubscription,
  getSubscriptionPlansPublic,
  initiateSubscriptionPayment,
  userFacingPaymentError,
  type MySubscription,
  type SubscriptionInterval,
  type SubscriptionPlan,
} from "@/lib/payments-api";
import { cn } from "@/lib/utils";

import { Container } from "./primitives";

function MediAiWordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/#hero"
      className={cn("text-3xl font-semibold tracking-tight sm:text-4xl", className)}
    >
      <span className="text-primary">Medi</span>
      <span className="text-foreground">AI</span>
    </Link>
  );
}

function FeatureRow({ label }: { label: string }) {
  return (
    <li className="flex gap-3 text-sm leading-snug text-foreground/90">
      <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
    </li>
  );
}

function formatEndsAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Phase 7 — segmented control to toggle the displayed price between monthly
 * and yearly. The choice only changes which price each card shows; the
 * "Subscribe" handler reads it at click time so the user can flip back and
 * forth without losing their selection.
 */
function IntervalToggle({
  value,
  onChange,
}: {
  value: SubscriptionInterval;
  onChange: (next: SubscriptionInterval) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-primary/20 bg-white p-1 text-sm shadow-sm">
      {(
        [
          { id: "monthly" as const, label: "Monthly" },
          { id: "yearly" as const, label: "Yearly" },
        ] satisfies { id: SubscriptionInterval; label: string }[]
      ).map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PricingCard({
  plan,
  interval,
  subscription,
  loading,
  purchasingPlanId,
  onSubscribe,
}: {
  plan: SubscriptionPlan;
  interval: SubscriptionInterval;
  subscription: MySubscription | null;
  loading: boolean;
  purchasingPlanId: string | null;
  onSubscribe: (planId: string) => void;
}) {
  const priceDisplay =
    interval === "yearly" ? plan.yearlyPriceDisplay : plan.monthlyPriceDisplay;
  const priceCents =
    interval === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
  const isCurrent = Boolean(
    subscription?.active &&
      subscription.planId === plan.id &&
      subscription.interval === interval,
  );
  const isCurrentPlanOtherInterval = Boolean(
    subscription?.active &&
      subscription.planId === plan.id &&
      subscription.interval !== interval,
  );
  const endsAt = formatEndsAt(subscription?.endsAt ?? null);
  const popular = plan.sortOrder === 1; // middle tier
  const ctaLabel = plan.isFree
    ? "Use Free plan"
    : isCurrent
      ? endsAt
        ? `Active until ${endsAt}`
        : "Current plan"
      : isCurrentPlanOtherInterval
        ? `Switch to ${interval}`
        : "Subscribe with Chapa";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-primary/20 bg-[linear-gradient(180deg,rgba(246,248,255,0.92),rgba(250,251,255,0.98))] p-6 shadow-sm",
        popular && "ring-2 ring-primary/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {popular ? (
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        ) : null}
        <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
        {isCurrent ? (
          <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
            Active
          </span>
        ) : popular ? (
          <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
            Popular
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        {plan.isFree ? `${plan.currency} 0.00` : priceDisplay}
      </p>
      <p className="text-xs text-muted-foreground">
        {plan.isFree
          ? "Always free"
          : interval === "yearly"
            ? "Billed once for 12 months"
            : "Billed once for 30 days"}
      </p>
      <p className="mt-3 min-h-10 text-sm text-muted-foreground">
        {plan.description ?? "Personalized AI health support with secure checkout."}
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => onSubscribe(plan.id)}
          disabled={
            loading ||
            isCurrent ||
            purchasingPlanId === plan.id ||
            (!plan.isFree && priceCents <= 0)
          }
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70",
            plan.isFree
              ? "border border-primary/20 bg-muted text-foreground hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
            isCurrent && "border border-border bg-muted text-muted-foreground hover:bg-muted",
          )}
        >
          {purchasingPlanId === plan.id ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {plan.isFree ? "Activating…" : "Redirecting…"}
            </>
          ) : (
            ctaLabel
          )}
        </button>
      </div>

      {plan.features.length > 0 ? (
        <>
          <p className="mt-8 text-sm font-semibold text-foreground">What&apos;s included</p>
          <ul className="mt-4 space-y-3">
            {plan.features.map((feature) => (
              <FeatureRow key={feature} label={feature} />
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}

export function PricingSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [interval, setInterval] = useState<SubscriptionInterval>("monthly");

  const isAuthenticated = useMemo(() => Boolean(getAccessToken()), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [planItems, subscriptionSnapshot] = await Promise.all([
          getSubscriptionPlansPublic(),
          isAuthenticated
            ? getMySubscription().catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPlans(planItems);
        setSubscription(subscriptionSnapshot);
        // If the user already has a yearly subscription, default the toggle
        // to yearly so the "Active" badge ends up on the right card.
        if (subscriptionSnapshot?.interval) {
          setInterval(subscriptionSnapshot.interval);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          userFacingPaymentError(err, "Could not load live pricing right now."),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handleSubscribe(planId: string) {
    if (!isAuthenticated) {
      window.location.assign("/signin");
      return;
    }
    setPurchasingPlanId(planId);
    setError(null);
    try {
      const payment = await initiateSubscriptionPayment(planId, interval);
      if (payment.freeGranted) {
        // No Chapa redirect — the free row is already active. Send the user
        // to their dashboard instead of leaving them on a marketing page.
        window.location.assign("/dashboard/ai-doctor");
        return;
      }
      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }
      setError(
        "The subscription was started but we didn't get a checkout link from the gateway. Please try again.",
      );
    } catch (err: unknown) {
      setError(
        userFacingPaymentError(
          err,
          "We could not start the subscription. Please try again.",
        ),
      );
    } finally {
      setPurchasingPlanId(null);
    }
  }

  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-muted/40 py-10 sm:py-14 lg:py-16"
      aria-label="Plans and pricing"
    >
      <Container className="space-y-10">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
          <MediAiWordmark />
          <div className="w-full text-left">
            <Link
              href="/#hero"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Plans and Pricing
            </h1>
          </div>
        </div>

        <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-primary/90">
          <Tag className="size-4 shrink-0" aria-hidden />
          General AI chat is free. Personalized AI guidance unlocks with Lite or Pro.
        </p>

        <div className="flex justify-center">
          <IntervalToggle value={interval} onChange={setInterval} />
        </div>

        {subscription?.active ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-foreground">
            <div className="flex items-center gap-2 font-medium text-primary">
              <ShieldCheck className="size-4" />
              {subscription.planName ?? "Current plan"} is active
            </div>
            <p className="mt-1 text-muted-foreground">
              {subscription.interval
                ? `Billed ${subscription.interval}. `
                : ""}
              {subscription.endsAt
                ? `Renews / ends on ${formatEndsAt(subscription.endsAt)}.`
                : ""}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading && plans.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-primary/15 bg-white p-8 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 size-5 animate-spin text-primary" />
              Loading plans…
            </div>
          ) : (
            plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                interval={interval}
                subscription={subscription}
                loading={loading}
                purchasingPlanId={purchasingPlanId}
                onSubscribe={handleSubscribe}
              />
            ))
          )}
        </div>
      </Container>
    </section>
  );
}
