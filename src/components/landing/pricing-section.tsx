import Link from "next/link";

import { ArrowLeft, Check, Sparkles, Tag, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Container, LinkButton } from "./primitives";

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

type PlanFeature = { label: string; included: boolean };

type PlanCard = {
  name: string;
  badge?: "current" | "popular";
  sparkles?: number;
  priceLine: string;
  subLine: string;
  tierLine: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  features: PlanFeature[];
};

const plans: PlanCard[] = [
  {
    name: "Free",
    badge: "current",
    priceLine: "$0/Forever",
    subLine: "No credit card required",
    tierLine: "Manage 1 Patient",
    ctaLabel: "Current plan",
    ctaDisabled: true,
    features: [
      { label: "Unlimited AI Medical Assistant", included: true },
      { label: "Unlimited Lab Test Interpretation", included: true },
      { label: "Unlimited AI generated notes (SOAP) and Reports", included: true },
      {
        label: "Unlimited Patient Messaging with AI Auto-Complete",
        included: true,
      },
      { label: "Context-Aware AI Memory", included: true },
      { label: "Research Support", included: false },
      { label: "Lab System Integration (LIS)", included: false },
      { label: "Premium Support", included: false },
    ],
  },
  {
    name: "Starter",
    badge: "popular",
    sparkles: 2,
    priceLine: "$25/month",
    subLine: "Billed annually $300. Cancel anytime.",
    tierLine: "Manage up to 50 patients",
    ctaLabel: "Choose Plan",
    ctaHref: "/onboarding",
    features: [
      { label: "Unlimited AI Medical Assistant", included: true },
      { label: "Unlimited Research Assistant", included: true },
      { label: "Unlimited Lab Test Interpretation", included: true },
      {
        label: "Unlimited AI-generated Notes (SOAP) & Reports",
        included: true,
      },
      {
        label: "Unlimited Patient Messaging with AI Auto-Complete",
        included: true,
      },
      { label: "Context-Aware AI Memory", included: true },
      { label: "Lab System Integration (LIS)", included: true },
      { label: "Premium Support", included: false },
    ],
  },
  {
    name: "Pro",
    priceLine: "$50/month",
    subLine: "Billed annually $600. Cancel anytime.",
    tierLine: "Manage up to 500 patients",
    ctaLabel: "Choose Plan",
    ctaHref: "/onboarding",
    features: [
      { label: "Unlimited AI Medical Assistant", included: true },
      { label: "Unlimited Research Assistant", included: true },
      { label: "Unlimited Lab Test Interpretation", included: true },
      {
        label: "Unlimited AI-generated Notes (SOAP) & Reports",
        included: true,
      },
      {
        label: "Unlimited Patient Messaging with AI Auto-Complete",
        included: true,
      },
      { label: "Context-Aware AI Memory", included: true },
      { label: "Lab System Integration (LIS)", included: true },
      { label: "Premium Support", included: true },
    ],
  },
  {
    name: "Ultimate",
    priceLine: "$100/mo",
    subLine: "Billed annually $1200. Cancel anytime.",
    tierLine: "Manage up to 2000 patients",
    ctaLabel: "Choose Plan",
    ctaHref: "/onboarding",
    features: [
      { label: "Unlimited AI Medical Assistant", included: true },
      { label: "Unlimited Research Assistant", included: true },
      { label: "Unlimited Lab Test Interpretation", included: true },
      {
        label: "Unlimited AI-generated Notes (SOAP) & Reports",
        included: true,
      },
      {
        label: "Unlimited Patient Messaging with AI Auto-Complete",
        included: true,
      },
      { label: "Context-Aware AI Memory", included: true },
      { label: "Lab System Integration (LIS)", included: true },
      { label: "Premium Support", included: true },
    ],
  },
];

function FeatureRow({ label, included }: PlanFeature) {
  const Icon = included ? Check : X;
  return (
    <li className="flex gap-3 text-sm leading-snug text-foreground/90">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          included ? "text-primary" : "text-primary/75",
        )}
        strokeWidth={2.5}
        aria-hidden
      />
      <span>{label}</span>
    </li>
  );
}

function PricingCard({ plan }: { plan: PlanCard }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-primary/20 bg-[linear-gradient(180deg,rgba(246,248,255,0.92),rgba(250,251,255,0.98))] p-6 shadow-sm",
        plan.badge === "popular" && "ring-2 ring-primary/20",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {plan.sparkles
          ? Array.from({ length: plan.sparkles }).map((_, i) => (
              <Sparkles
                key={i}
                className="size-4 shrink-0 text-primary"
                aria-hidden
              />
            ))
          : null}
        <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
        {plan.badge === "current" ? (
          <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
            Current Plan
          </span>
        ) : null}
        {plan.badge === "popular" ? (
          <span className="rounded-full border border-primary/35 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
            Popular
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        {plan.priceLine}
      </p>
      <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
        {plan.subLine}
      </p>

      <div className="mt-6">
        {plan.ctaDisabled ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-muted text-sm font-medium text-muted-foreground"
          >
            {plan.ctaLabel}
          </button>
        ) : (
          <LinkButton href={plan.ctaHref ?? "/onboarding"} size="lg" className="w-full">
            {plan.ctaLabel}
          </LinkButton>
        )}
      </div>

      <p className="mt-8 text-sm font-semibold text-foreground">{plan.tierLine}</p>
      <ul className="mt-4 space-y-3">
        {plan.features.map((f) => (
          <FeatureRow key={f.label} {...f} />
        ))}
      </ul>
    </article>
  );
}

export function PricingSection() {
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
          Save up to 50% with Yearly!
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
