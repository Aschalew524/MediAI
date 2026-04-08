"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, FileText, LibraryBig, Sparkles } from "lucide-react";

import { useLandingConfig } from "@/lib/hooks/use-app-config";

import { Container, LinkButton, SectionShell } from "./primitives";
import { SiteFooter, SiteHeader } from "./sections";

const iconMap = {
  blog: FileText,
  "symptom-guide": Sparkles,
  "knowledge-base": LibraryBig,
  glossary: BookOpenText,
} as const;

export function ResourcePageTemplate({
  slug,
  title,
  description,
  bullets,
}: {
  slug: keyof typeof iconMap;
  title: string;
  description: string;
  bullets: string[];
}) {
  const { data } = useLandingConfig();
  const Icon = iconMap[slug];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navItems={data.navItems} />
      <main>
        <SectionShell className="pb-18 pt-12">
          <Container className="space-y-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Link>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="space-y-7">
                <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-8" />
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {description}
                  </p>
                </div>

                <div className="space-y-4">
                  {bullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-primary/12 bg-white px-5 py-4 text-sm leading-6 text-foreground shadow-[0_18px_40px_-28px_rgba(73,96,188,0.3)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[1.75rem] border border-primary/12 bg-[linear-gradient(180deg,rgba(241,244,255,0.95),rgba(243,246,255,0.8))] p-6 shadow-[0_30px_80px_-50px_rgba(73,96,188,0.45)]">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Explore MediAI</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Continue to the patient experience, review pricing, or start
                    onboarding from here.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <LinkButton href="/onboarding" size="lg">
                    Get Started For Free
                  </LinkButton>
                  <LinkButton href="/pricing" variant="secondary" size="lg">
                    View Pricing
                  </LinkButton>
                </div>
              </aside>
            </div>
          </Container>
        </SectionShell>
      </main>
      <SiteFooter footerColumns={data.footerColumns} />
    </div>
  );
}

