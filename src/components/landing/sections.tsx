"use client";

import type { ComponentType } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  ChevronDown,
  CircleUserRound,
  ClipboardPlus,
  FlaskConical,
  Globe2,
  HeartHandshake,
  HeartPulse,
  Languages,
  Menu,
  MoveRight,
  Quote,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  UserRoundSearch,
} from "lucide-react";

import {
  type BenefitItem,
  type FAQItem,
  type FooterColumn,
  type LandingIconKey,
  type NavItem,
  type SecurityItem,
  type ShowcaseItem,
  type Testimonial,
} from "@/lib/landing-content";
import { useLandingConfig } from "@/lib/hooks/use-app-config";
import { cn } from "@/lib/utils";

import {
  Container,
  LinkButton,
  SectionHeading,
  SectionShell,
} from "./primitives";

export function LandingPage() {
  const { data } = useLandingConfig();

  return (
    <div className="bg-background text-foreground">
      <SiteHeader navItems={data.navItems} />
      <main>
        <HeroSection heroHighlights={data.heroHighlights} />
        <BenefitsSection benefitItems={data.benefitItems} />
        <ShowcaseSections showcaseItems={data.showcaseItems} />
        <SecuritySection securityItems={data.securityItems} />
        <TestimonialsSection testimonialItems={data.testimonialItems} />
        <FaqSection faqItems={data.faqItems} />
        <BottomCtaSection />
      </main>
      <SiteFooter footerColumns={data.footerColumns} />
    </div>
  );
}

const iconMap: Record<LandingIconKey, ComponentType<{ className?: string }>> = {
  chevronDown: ChevronDown,
  heartPulse: HeartPulse,
  globe2: Globe2,
  languages: Languages,
  userRoundSearch: UserRoundSearch,
  shieldCheck: ShieldCheck,
  stethoscope: Stethoscope,
  brainCircuit: BrainCircuit,
  flaskConical: FlaskConical,
  heartHandshake: HeartHandshake,
};

function SiteHeader({ navItems }: { navItems: NavItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/90 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link
          href="#hero"
          className="text-3xl font-semibold tracking-tight text-primary"
        >
          MediAI
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] : null;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                <span>{item.label}</span>
                {Icon ? <Icon className="size-4" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/signin"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Sign In
          </Link>
          <LinkButton href="/onboarding" size="lg">
            Get Started For Free
          </LinkButton>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/signin"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Sign In
          </Link>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-white text-foreground shadow-sm"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </Container>
    </header>
  );
}

function HeroSection({
  heroHighlights,
}: {
  heroHighlights: { icon: LandingIconKey; label: string }[];
}) {
  return (
    <SectionShell className="overflow-hidden pb-12 sm:pb-16" >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-152 bg-[radial-gradient(circle_at_top,rgba(111,139,255,0.16),transparent_55%)]" />
      <Container className="space-y-14">
        <div
          id="hero"
          className="mx-auto flex max-w-4xl flex-col items-center space-y-6 pt-8 text-center sm:pt-12"
        >
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-4 py-1 text-sm font-medium text-primary">
            MediAI for Patients
          </span>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your Personal AI Health Assistant
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Experience the power of AI in healthcare. Ask questions, interpret
            test results, get reports, and receive expert insights whenever you
            need them.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {heroHighlights.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-sm text-foreground/80 shadow-sm"
                >
                  <Icon className="size-4 text-primary" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <AssistantDemo />

        <div className="mx-auto max-w-3xl text-center text-sm leading-6 text-muted-foreground">
          <span className="font-semibold text-foreground">Privacy Note:</span>{" "}
          This AI tool is not a substitute for professional medical advice,
          diagnosis, or treatment. Your data is handled with privacy-first
          design and aligned with modern security standards.
        </div>
      </Container>
    </SectionShell>
  );
}

function AssistantDemo() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-primary/10 bg-[linear-gradient(180deg,rgba(241,244,255,0.95),rgba(243,246,255,0.8))] p-6 shadow-[0_35px_90px_-55px_rgba(73,96,188,0.5)] sm:p-8 lg:p-10">
      <div className="space-y-8 rounded-[1.5rem] bg-white/50 p-6 backdrop-blur sm:p-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="relative flex size-28 items-center justify-center">
            <Image src="/bot-logo.png" alt="Assistant Bot" width={112} height={112} className="object-contain" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              I&apos;m here to support your health-related questions.
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              How can I help you?
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-background p-2 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-white px-4 py-4">
            <input
              aria-label="Type your health question"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Type your questions here..."
              readOnly
            />
            <div className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Send className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitsSection({ benefitItems }: { benefitItems: BenefitItem[] }) {
  return (
    <SectionShell id="solutions" className="pt-8 sm:pt-10">
      <Container className="space-y-10">
        <SectionHeading
          title="Benefits of choosing MediAI"
          description="Designed to make healthcare information simpler, faster, and more accessible for patients everywhere."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {benefitItems.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <article
                key={item.title}
                className="rounded-[1.75rem] bg-primary p-6 text-primary-foreground shadow-[0_24px_60px_-32px_rgba(76,104,220,0.85)]"
              >
                <div className="mb-6 inline-flex size-12 items-center justify-center rounded-full bg-white text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-primary-foreground/85">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="text-center">
          <LinkButton href="/onboarding" size="lg">
            Try MediAI For Free
          </LinkButton>
        </div>
      </Container>
    </SectionShell>
  );
}

function ShowcaseSections({ showcaseItems }: { showcaseItems: ShowcaseItem[] }) {
  return (
    <SectionShell>
      <Container className="space-y-20">
        <SectionHeading
          title="Discover what your AI health assistant can do"
          description="MediAI helps patients better understand their health and manage it more effectively."
        />

        <div className="space-y-20">
          {showcaseItems.map((item) => (
            <ShowcaseBlock key={item.key} item={item} />
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}

function ShowcaseBlock({ item }: { item: ShowcaseItem }) {
  const { key: showcaseKey, title, description, ctaLabel, href, reverse } = item;

  return (
    <section
      id={
        showcaseKey === "labs"
          ? "labs"
          : showcaseKey === "symptoms"
            ? "symptoms"
            : showcaseKey === "opinions"
              ? "opinions"
              : undefined
      }
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
        reverse && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1",
      )}
    >
      <div className="space-y-5">
        <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h3>
        <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <LinkButton href={href} size="lg">
          {ctaLabel}
        </LinkButton>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(112,136,255,0.12),transparent_60%)]" />
        {showcaseKey === "insights" ? <InsightsVisual /> : null}
        {showcaseKey === "labs" ? <LabsVisual /> : null}
        {showcaseKey === "symptoms" ? <SymptomsVisual /> : null}
        {showcaseKey === "opinions" ? <OpinionsVisual /> : null}
      </div>
    </section>
  );
}

function InsightsVisual() {
  return (
    <div className="relative mx-auto flex max-w-lg items-center justify-center">
      <div className="absolute inset-6 -z-10 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute left-8 top-10 h-44 w-44 rounded-full bg-primary/6" />
      <div className="relative w-full max-w-sm rounded-[2rem] border border-primary/10 bg-white p-4 shadow-[0_24px_70px_-45px_rgba(73,96,188,0.9)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-8 rounded-full bg-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
          </div>
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="space-y-3 rounded-[1.5rem] bg-[linear-gradient(180deg,#f8faff,#eff3ff)] p-4">
          <ChatBubble align="left">
            I have been experiencing severe stomach pain and nausea for a while.
          </ChatBubble>
          <ChatBubble align="right">
            Do you have the ERCP results available?
          </ChatBubble>
          <div className="inline-flex max-w-[80%] items-center gap-3 rounded-2xl border border-primary/15 bg-white px-4 py-3 shadow-sm">
            <div className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ArrowRight className="size-4 rotate-45" />
            </div>
            <span className="text-sm font-medium text-foreground">
              ERCP Results.pdf
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  align,
  children,
}: {
  align: "left" | "right";
  children: string;
}) {
  return (
    <div
      className={cn("flex", align === "right" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          align === "right"
            ? "bg-primary text-primary-foreground"
            : "border border-primary/10 bg-white text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LabsVisual() {
  const cards = [
    {
      title: "Haemoglobin",
      value: "10.2 g/dL",
      range: "12 - 16 g/dL",
      status: "Normal",
      color: "border-lime-300 shadow-[0_20px_40px_-28px_rgba(155,201,96,0.85)]",
      textColor: "text-lime-600",
    },
    {
      title: "Blood Glucose",
      value: "135 mg/dL",
      range: "70 - 110 mg/dL",
      status: "High",
      color: "border-rose-300 shadow-[0_20px_40px_-28px_rgba(231,102,125,0.8)]",
      textColor: "text-rose-600",
    },
    {
      title: "White Blood Cells",
      value: "13,500 cells/μL",
      range: "4,000 - 11,000",
      status: "High",
      color: "border-rose-300 shadow-[0_20px_40px_-28px_rgba(231,102,125,0.8)]",
      textColor: "text-rose-600",
    },
  ];

  return (
    <div className="relative mx-auto min-h-112 max-w-xl rounded-[2rem] bg-[linear-gradient(180deg,rgba(245,247,255,0.95),rgba(255,255,255,0.95))] p-6">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(111,139,255,0.16),transparent_65%)]" />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className={cn(
              "rounded-[1.5rem] border bg-white p-5",
              card.color,
              index === 2 && "md:col-span-2 md:max-w-[62%]",
            )}
          >
            <h4 className="text-lg font-semibold">{card.title}</h4>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                Test name: <span className="font-medium text-foreground">{card.title}</span>
              </p>
              <p>
                User value: <span className="font-medium text-foreground">{card.value}</span>
              </p>
              <p>
                Normal range:{" "}
                <span className="font-medium text-foreground">{card.range}</span>
              </p>
              <p>
                Status:{" "}
                <span className={cn("font-semibold", card.textColor)}>
                  {card.status}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SymptomsVisual() {
  return (
    <div className="relative mx-auto flex max-w-xl items-end justify-between gap-8 rounded-[2rem] bg-[linear-gradient(180deg,rgba(245,247,255,0.75),rgba(255,255,255,0.95))] px-6 py-10">
      <div className="max-w-xs space-y-3">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ClipboardPlus className="size-6" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Symptom Analysis
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Explain how you feel in natural language and receive structured
            insights for the next conversation with your clinician.
          </p>
        </div>
      </div>

      <div className="relative mx-auto flex h-72 w-56 shrink-0 items-center justify-center rounded-[2rem] border-[5px] border-primary/85 bg-white shadow-[0_24px_80px_-45px_rgba(73,96,188,0.85)]">
        <div className="absolute top-5 h-1.5 w-16 rounded-full bg-muted" />
        <div className="space-y-4">
          <CircleUserRound className="mx-auto size-20 text-primary/80" />
          <div className="space-y-2">
            <div className="h-2 w-24 rounded-full bg-primary/60" />
            <div className="h-2 w-28 rounded-full bg-primary/40" />
            <div className="h-2 w-20 rounded-full bg-primary/60" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-28 rounded-full bg-muted" />
            <div className="h-2 w-24 rounded-full bg-muted" />
            <div className="h-2 w-20 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OpinionsVisual() {
  return (
    <div className="relative mx-auto flex max-w-xl items-center justify-center rounded-[2rem] bg-[linear-gradient(180deg,rgba(245,247,255,0.85),rgba(255,255,255,0.95))] p-8">
      <div className="absolute left-4 top-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </div>
      <div className="absolute right-10 top-20 inline-flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <Shield className="size-5" />
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative h-72 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(121,145,255,0.22),rgba(121,145,255,0.04)_65%,transparent_66%)]">
          <div className="absolute left-10 top-12 flex size-28 items-center justify-center rounded-full bg-white shadow-[0_24px_60px_-35px_rgba(73,96,188,0.9)]">
            <CircleUserRound className="size-16 text-primary/75" />
          </div>
          <div className="absolute left-28 top-24 flex size-28 items-center justify-center rounded-full bg-white shadow-[0_24px_60px_-35px_rgba(73,96,188,0.9)]">
            <CircleUserRound className="size-16 text-primary/55" />
          </div>
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-primary/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Specialist Review
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Connect your AI report with expert review so treatment choices feel
            more grounded and trustworthy.
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <span>Validated expert feedback</span>
            <MoveRight className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySection({ securityItems }: { securityItems: SecurityItem[] }) {
  return (
    <SectionShell>
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground shadow-[0_30px_70px_-40px_rgba(76,104,220,0.85)] sm:px-10 lg:px-14 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div className="flex flex-col items-start justify-center gap-6">
              <div className="relative flex h-64 w-full items-center justify-center rounded-[2rem] bg-white/8">
                <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
                <Shield className="size-32 text-white drop-shadow-[0_18px_30px_rgba(0,0,0,0.22)]" />
                <div className="absolute bottom-10 left-8 rotate-[-5deg] rounded-md bg-white px-4 py-2 text-2xl font-medium text-primary shadow-lg">
                  Your data is secure
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {securityItems.map((item) => {
                const Icon = iconMap[item.icon];

                return (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-5"
                  >
                    <div className="mt-1 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="text-sm leading-6 text-primary-foreground/85">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </SectionShell>
  );
}

function TestimonialsSection({
  testimonialItems,
}: {
  testimonialItems: Testimonial[];
}) {
  return (
    <SectionShell>
      <Container className="space-y-10">
        <SectionHeading
          title="Our users love us"
          description="Discover how MediAI has transformed the way people understand and manage their health."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonialItems.map((item) => (
            <article
              key={item.name + item.role}
              className="rounded-[1.75rem] border border-primary/8 bg-[linear-gradient(180deg,rgba(246,248,255,0.95),rgba(250,251,255,1))] p-8"
            >
              <Quote className="size-8 text-foreground" />
              <p className="mt-6 text-base leading-7 text-foreground/85">
                {item.quote}
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className="size-3 rounded-full bg-primary" />
          <span className="size-3 rounded-full bg-primary/20" />
          <span className="size-3 rounded-full bg-primary/20" />
        </div>
      </Container>
    </SectionShell>
  );
}

function FaqSection({ faqItems }: { faqItems: FAQItem[] }) {
  return (
    <SectionShell className="pt-6">
      <Container className="max-w-4xl space-y-10">
        <SectionHeading
          title="Have questions? Let’s find answers"
          description="Here are some of the most asked questions from our users."
        />

        <div className="space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-border bg-white px-5 py-1 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium">
                <span>{item.question}</span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="pb-5 pr-8 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-sm sm:text-base">
          <p className="font-medium text-foreground">
            Have more questions?{" "}
            <Link href="#contact" className="text-primary underline-offset-4 hover:underline">
              Contact us
            </Link>
          </p>
          <ChevronRight className="size-5 text-muted-foreground" />
        </div>
      </Container>
    </SectionShell>
  );
}

function BottomCtaSection() {
  return (
    <SectionShell id="cta" className="pb-0">
      <section className="bg-primary py-16 text-primary-foreground">
        <Container className="text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Are you ready to take control of your health?
            </h2>
            <div>
              <LinkButton href="/onboarding" size="lg" variant="light">
                Try MediAI For Free
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </SectionShell>
  );
}

function SiteFooter({ footerColumns }: { footerColumns: FooterColumn[] }) {
  const socialLinks = [
    { label: "Twitter", href: "#", icon: Twitter },
    { label: "Facebook", href: "#", icon: Facebook },
    { label: "LinkedIn", href: "#", icon: Linkedin },
    { label: "Instagram", href: "#", icon: Instagram },
  ];

  return (
    <footer id="contact" className="border-t border-primary/8 bg-white">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div className="space-y-5">
          <div>
            <Link href="#hero" className="text-4xl font-semibold text-primary">
              MediAI
            </Link>
          </div>
          <p className="text-lg font-medium text-foreground/85">
            Empowering healthcare with AI.
          </p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            MediAI delivers trusted medical AI tools wherever they&apos;re
            needed most.
          </p>

          <div className="flex items-center gap-4 pt-2">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </footer>
  );
}
