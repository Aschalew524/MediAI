"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useLandingConfig } from "@/lib/hooks/use-app-config";

import { Container, LinkButton, SectionShell } from "./primitives";
import { SiteFooter, SiteHeader } from "./sections";

export function BlogArticlePage({
  title,
  category,
  author,
  date,
  readTime,
  imageSrc,
  intro,
  sections,
}: {
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageSrc: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  const { data } = useLandingConfig();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navItems={data.navItems} />

      <main>
        <SectionShell className="pb-14 pt-10">
          <Container className="max-w-5xl space-y-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Blog</span>
            </Link>

            <div className="space-y-6">
              <p className="text-sm font-medium text-primary">{category}</p>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>By {author}</span>
                <span>•</span>
                <span>{date}</span>
                <span>•</span>
                <span>{readTime}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-primary/15 bg-white shadow-[0_25px_70px_-45px_rgba(73,96,188,0.35)]">
              <Image
                src={imageSrc}
                alt={title}
                width={1200}
                height={700}
                className="h-auto w-full object-contain"
                priority
              />
            </div>

            <div className="space-y-8">
              <p className="text-base leading-8 text-foreground/85">{intro}</p>

              {sections.map((section) => (
                <section key={section.title} className="space-y-3">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-base leading-8 text-foreground/80">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            <div className="rounded-[1.75rem] bg-primary/8 px-8 py-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Explore MediAI further
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-foreground/75">
                    Continue browsing articles, try the AI Doctor, or start your
                    onboarding experience.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <LinkButton href="/blog" variant="secondary" size="lg">
                    More Articles
                  </LinkButton>
                  <LinkButton href="/onboarding" size="lg">
                    Get Started
                  </LinkButton>
                </div>
              </div>
            </div>
          </Container>
        </SectionShell>
      </main>

      <SiteFooter footerColumns={data.footerColumns} />
    </div>
  );
}

