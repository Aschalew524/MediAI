"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { ArrowLeft, Check, Loader2, ShieldCheck, Sparkles, Tag } from "lucide-react";

import { getAccessToken } from "@/lib/auth-storage";
import {
  getAssistantAccessPlans,
  getMyBilling,
  initiateAssistantPayment,
  userFacingPaymentError,
  type AssistantAccessPlan,
  type MyBillingResponse,
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

type PlanFeature = { label: string };

function FeatureRow({ label }: PlanFeature) {
  return (
    <li className="flex gap-3 text-sm leading-snug text-foreground/90">
      <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
    </li>
  );
}

function staticFeatures(plan: AssistantAccessPlan): PlanFeature[] {
  return [
    { label: "General AI chat remains free for everyone" },
    { label: "Personalized assistant uses your saved health context" },
    { label: `${plan.durationDays}-day access starts after verified payment` },
    { label: "Secure server-side payment verification with Chapa" },
  ];
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

function PricingCard({
  plan,
  billing,
  loading,
  purchasingPlanId,
  onPurchase,
}: {
  plan: AssistantAccessPlan;
  billing: MyBillingResponse | null;
  loading: boolean;
  purchasingPlanId: string | null;
  onPurchase: (planId: string) => void;
}) {
  const activePlan = billing?.assistantAccess.active ? billing.assistantAccess.planName : null;
  const endsAt = formatEndsAt(billing?.assistantAccess.endsAt ?? null);
  const isCurrent = Boolean(activePlan && activePlan === plan.name);
  const badge = isCurrent ? "current" : plan.sortOrder === 0 ? "popular" : null;
  const features = staticFeatures(plan);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-primary/20 bg-[linear-gradient(180deg,rgba(246,248,255,0.92),rgba(250,251,255,0.98))] p-6 shadow-sm",
        badge === "popular" && "ring-2 ring-primary/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {badge === "popular" ? <Sparkles className="size-4 shrink-0 text-primary" aria-hidden /> : null}
        <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
        {badge === "current" ? (
          <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
            Active
          </span>
        ) : null}
        {badge === "popular" ? (
          <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
            Popular
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        {plan.priceDisplay}
      </p>
      <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
        {plan.description ?? "Personalized AI health support with secure checkout."}
      </p>

      <div className="mt-6">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-muted text-sm font-medium text-muted-foreground"
          >
            {endsAt ? `Active until ${endsAt}` : "Current access"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onPurchase(plan.id)}
            disabled={loading || purchasingPlanId === plan.id}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {purchasingPlanId === plan.id ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              "Pay with Chapa"
            )}
          </button>
        )}
      </div>

      <p className="mt-8 text-sm font-semibold text-foreground">
        Personalized assistant for {plan.durationDays} days
      </p>
      <ul className="mt-4 space-y-3">
        {features.map((f) => (
          <FeatureRow key={f.label} {...f} />
        ))}
      </ul>
    </article>
  );
}

export function PricingSection() {
  const [plans, setPlans] = useState<AssistantAccessPlan[]>([]);
  const [billing, setBilling] = useState<MyBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => Boolean(getAccessToken()), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [planItems, billingSnapshot] = await Promise.all([
          getAssistantAccessPlans(),
          isAuthenticated ? getMyBilling().catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPlans(planItems);
        setBilling(billingSnapshot);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(userFacingPaymentError(err, "Could not load live pricing right now."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handlePurchase(planId: string) {
    if (!isAuthenticated) {
      window.location.assign("/signin");
      return;
    }
    setPurchasingPlanId(planId);
    setError(null);
    try {
      const payment = await initiateAssistantPayment(planId);
      window.location.assign(payment.checkoutUrl);
    } catch (err: unknown) {
      setError(
        userFacingPaymentError(
          err,
          "We could not start the payment. Please try again.",
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
          General AI chat is free. Personalized AI guidance unlocks after payment.
        </p>

        {billing?.assistantAccess.active ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-foreground">
            <div className="flex items-center gap-2 font-medium text-primary">
              <ShieldCheck className="size-4" />
              Personalized assistant access is active
            </div>
            <p className="mt-1 text-muted-foreground">
              {billing.assistantAccess.planName ?? "Current pass"}
              {billing.assistantAccess.endsAt
                ? ` expires on ${formatEndsAt(billing.assistantAccess.endsAt)}.`
                : "."}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <article className="flex h-full flex-col rounded-2xl border border-primary/20 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Free General Chat</h2>
              <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
                Included
              </span>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">ETB 0.00</p>
            <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
              Ask general health questions without linking your personal medical history.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/ai-doctor/general"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-primary/20 bg-muted text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Open general chat
              </Link>
            </div>
            <p className="mt-8 text-sm font-semibold text-foreground">Best for quick health questions</p>
            <ul className="mt-4 space-y-3">
              <FeatureRow label="No payment required" />
              <FeatureRow label="No saved health-context personalization" />
              <FeatureRow label="Great for discovery before upgrading" />
            </ul>
          </article>

          {loading && plans.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-primary/15 bg-white p-8 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 size-5 animate-spin text-primary" />
              Loading assistant plans…
            </div>
          ) : (
            plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billing={billing}
                loading={loading}
                purchasingPlanId={purchasingPlanId}
                onPurchase={handlePurchase}
              />
            ))
          )}
        </div>
      </Container>
    </section>
  );
}
