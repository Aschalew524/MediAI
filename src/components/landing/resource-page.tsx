"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, FileText, LibraryBig, Loader2, Sparkles } from "lucide-react";

import type { EducationResourceDto } from "@/lib/education-api";
import type { EducationSlug } from "@/lib/education-api";
import { getEducationFallback } from "@/lib/education-fallback";
import { useEducationResource } from "@/lib/hooks/use-education-resource";
import { useLandingConfig } from "@/lib/hooks/use-app-config";

import { Container, LinkButton, SectionShell } from "./primitives";
import { SiteFooter, SiteHeader } from "./sections";

const iconMap = {
  blog: FileText,
  "symptom-guide": Sparkles,
  "knowledge-base": LibraryBig,
  glossary: BookOpenText,
} as const;

type IconSlug = keyof typeof iconMap;

function resolveIconSlug(resource: EducationResourceDto): IconSlug {
  const raw = (resource.iconKey ?? resource.slug).trim();
  if (raw in iconMap) {
    return raw as IconSlug;
  }
  return "knowledge-base";
}

export function EducationResourcePage({
  slug,
  resource,
  fallbackMessage,
}: {
  slug: EducationSlug;
  resource?: EducationResourceDto;
  fallbackMessage?: string;
}) {
  const { data } = useLandingConfig();
  const { data: live, loading, error, refetch } = useEducationResource(slug, resource);
  const content = live ?? getEducationFallback(slug);
  const Icon = iconMap[resolveIconSlug(content)];
  const showFallbackBanner = Boolean(fallbackMessage && !live);

  async function handleRetry() {
    try {
      await refetch();
    } catch {
      /* error surfaced via hook */
    }
  }

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

            {showFallbackBanner ? (
              <div
                className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-sm text-amber-950 shadow-sm"
                role="status"
              >
                <p className="font-medium text-amber-950">Static fallback</p>
                <p className="mt-1 leading-6 text-amber-900/90">{fallbackMessage}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleRetry()}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Trying again…
                      </>
                    ) : (
                      "Try again"
                    )}
                  </button>
                  <Link
                    href="/resources"
                    className="text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
                  >
                    Browse all help pages
                  </Link>
                </div>
                {error ? (
                  <p className="mt-3 text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="space-y-7">
                <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-8" />
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    {content.title}
                  </h1>
                  <p className="max-w-3xl whitespace-pre-wrap text-base leading-7 text-muted-foreground sm:text-lg">
                    {content.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {content.bullets.map((item) => (
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
                    Continue to the patient experience, review pricing, or start onboarding from
                    here.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/resources"
                    className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Browse all help pages
                  </Link>
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
