"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, LibraryBig, Sparkles } from "lucide-react";

import type { EducationResourceDto } from "@/lib/education-api";
import type { EducationSlug } from "@/lib/education-api";
import { isEducationSlug } from "@/lib/education-api";
import { useLandingConfig } from "@/lib/hooks/use-app-config";

import { Container, LinkButton, SectionShell } from "./primitives";
import { SiteFooter, SiteHeader } from "./sections";

function excerpt(description: string, max = 140): string {
  const t = description.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function hrefForSlug(slug: string): string {
  return isEducationSlug(slug) ? `/${slug}` : "/resources";
}

const iconForSlug: Record<EducationSlug, typeof Sparkles> = {
  "symptom-guide": Sparkles,
  glossary: BookOpenText,
  "knowledge-base": LibraryBig,
};

export function HelpResourcesIndexPage({
  items,
  loadError,
}: {
  items: EducationResourceDto[];
  loadError?: boolean;
}) {
  const { data } = useLandingConfig();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navItems={data.navItems} />
      <main>
        <SectionShell className="pb-18 pt-12">
          <Container className="space-y-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Link>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Help resources</h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Guides and reference material published from the MediAI CMS.
              </p>
            </div>

            {loadError ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                We couldn&apos;t load the list from the server. You can still open individual pages
                from the footer or try again later.
              </p>
            ) : null}

            {items.length === 0 ? (
              <div className="rounded-2xl border border-primary/12 bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-base font-medium text-foreground">No published help pages yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask an admin to publish content, or return home while we finish setup.
                </p>
                <LinkButton href="/" variant="secondary" className="mt-8" size="lg">
                  Back to home
                </LinkButton>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const slug = item.slug;
                  const Icon = isEducationSlug(slug) ? iconForSlug[slug] : LibraryBig;
                  return (
                    <Link
                      key={slug}
                      href={hrefForSlug(slug)}
                      className="group flex flex-col rounded-2xl border border-primary/12 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(73,96,188,0.25)] transition-colors hover:border-primary/25 hover:shadow-md"
                    >
                      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-6" />
                      </div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                        {item.title}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                        {excerpt(item.description)}
                      </p>
                      <span className="mt-4 text-sm font-semibold text-primary">Open →</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Container>
        </SectionShell>
      </main>
      <SiteFooter footerColumns={data.footerColumns} />
    </div>
  );
}
