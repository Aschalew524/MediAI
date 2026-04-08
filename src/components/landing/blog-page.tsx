"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useLandingConfig } from "@/lib/hooks/use-app-config";
import {
  aiHealthcareArticleIds,
  blogArticles,
  companyNewsArticleIds,
  featuredBlogArticleId,
  getBlogArticleById,
  getBlogArticleHref,
  popularBlogArticleIds,
  secondOpinionArticleIds,
} from "@/lib/blog-content";

import { Container, LinkButton, SectionShell } from "./primitives";
import { SiteFooter, SiteHeader } from "./sections";

type BlogCardItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  imageSrc: string;
};

export function BlogPage() {
  const { data } = useLandingConfig();
  const featuredArticle = getBlogArticleById(featuredBlogArticleId);
  const popularArticles = popularBlogArticleIds
    .map((id) => getBlogArticleById(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));
  const aiHealthcareArticles = aiHealthcareArticleIds
    .map((id) => getBlogArticleById(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));
  const secondOpinionArticles = secondOpinionArticleIds
    .map((id) => getBlogArticleById(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));
  const companyNewsArticles = companyNewsArticleIds
    .map((id) => getBlogArticleById(id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));

  if (!featuredArticle) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navItems={data.navItems} />

      <main>
        <SectionShell className="pb-10 pt-8 sm:pt-10">
          <Container className="space-y-16">
            <section className="space-y-10">
              <div className="mx-auto max-w-4xl space-y-3 text-center">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  <span className="text-primary">Medi</span>
                  <span>AI Blog - Insights Into AI-Powered HealthCare</span>
                </h1>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  Welcome to MediAI Blog, your one-stop source for the latest
                  news, insights, and advancements in AI-powered healthcare.
                </p>
              </div>

              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <Link
                  href={getBlogArticleHref(featuredArticle.id)}
                  className="block overflow-hidden rounded-[1.3rem] border border-primary/15 bg-white shadow-[0_20px_60px_-40px_rgba(73,96,188,0.3)] transition-transform hover:-translate-y-px"
                >
                  <div className="aspect-275/171 w-full bg-white">
                    <Image
                      src={featuredArticle.imageSrc}
                      alt={featuredArticle.title}
                      width={275}
                      height={171}
                      className="h-full w-full object-contain object-center"
                      priority
                    />
                  </div>
                </Link>

                <div className="space-y-5">
                  <Link
                    href={getBlogArticleHref(featuredArticle.id)}
                    className="block max-w-xl text-3xl font-semibold tracking-tight transition-colors hover:text-primary sm:text-4xl"
                  >
                    {featuredArticle.title}
                  </Link>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Author</p>
                    <p className="font-semibold text-foreground underline underline-offset-2">
                      {featuredArticle.author}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {featuredArticle.date} | {featuredArticle.readTime}
                  </p>
                </div>
              </div>
            </section>

            <BlogSection
              title="Popular Articles"
              cards={popularArticles}
              columns="two"
            />

            <section className="rounded-[1.75rem] bg-primary/8 px-8 py-10 sm:px-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
                <div className="space-y-5">
                  <h2 className="max-w-xl text-4xl font-semibold tracking-tight">
                    Make Informed Health Decisions
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-foreground/75">
                    Talk to Docus AI Doctor, generate health reports, get them
                    validated by Top Doctors from the US and Europe.
                  </p>
                  <LinkButton href="/onboarding" size="lg">
                    Try MediAI for Free
                  </LinkButton>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <Image
                    src="/makeinformed.svg"
                    alt="Make informed health decisions"
                    width={320}
                    height={220}
                    className="h-auto w-full max-w-[18rem] object-contain"
                  />
                </div>
              </div>
            </section>

            <BlogSection
              id="ai-in-healthcare"
              title="AI In Healthcare"
              cards={aiHealthcareArticles}
              columns="three"
              moreHref="/blog#explore-more-topics"
              moreLabel="All AI in Healthcare Topics"
            />

            <BlogSection
              id="medical-second-opinions"
              title="Medical Second Opinions"
              cards={secondOpinionArticles}
              columns="three"
              moreHref="/blog#company-news"
              moreLabel="All Medical Second Opinions Topics"
            />

            <BlogSection
              id="company-news"
              title="Company News"
              cards={companyNewsArticles}
              columns="three"
              moreHref="/blog#explore-more-topics"
              moreLabel="All Company News Topics"
            />

            <section className="rounded-[1.75rem] bg-primary/8 px-6 py-7 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <Image
                    src="/bot-logo.png"
                    alt="MediAI Doctor"
                    width={78}
                    height={78}
                    className="size-[78px] object-contain"
                  />
                  <div className="space-y-2">
                    <h2 className="text-4xl font-semibold tracking-tight">
                      Get Your Personal AI Doctor
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-foreground/75">
                      Customize your AI Doctor to ask any health-related
                      questions. Get instant answers and tailored health
                      insights.
                    </p>
                  </div>
                </div>

                <LinkButton href="/dashboard/ai-doctor" size="lg">
                  Go to AI Doctor
                </LinkButton>
              </div>
            </section>

            <section id="explore-more-topics" className="space-y-8">
              <h2 className="text-center text-4xl font-semibold tracking-tight">
                Explore More Topics
              </h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {blogArticles.map((card, index) => (
                  <BlogArticleCard
                    key={`${card.title}-${index}`}
                    card={card}
                    compact={false}
                  />
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
                >
                  Load More
                </button>
              </div>
            </section>
          </Container>
        </SectionShell>

        <section className="bg-primary py-10 text-primary-foreground">
          <Container className="space-y-6 text-center">
            <div className="mx-auto max-w-3xl space-y-4">
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                You&apos;re only one click away from a life-changing journey
              </h2>
              <div>
                <LinkButton href="/onboarding" variant="light" size="lg">
                  Try MediAI For Free
                </LinkButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-primary-foreground/90">
              <span>✓ 350+ world-renowned Doctors</span>
              <span>✓ Virtual health assistant powered by AI</span>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter footerColumns={data.footerColumns} />
    </div>
  );
}

function BlogSection({
  id,
  title,
  cards,
  columns,
  moreHref,
  moreLabel,
}: {
  id?: string;
  title: string;
  cards: BlogCardItem[];
  columns: "two" | "three";
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <section id={id} className="space-y-8">
      <h2 className="text-center text-4xl font-semibold tracking-tight">
        {title}
      </h2>

      <div
        className={
          columns === "two"
            ? "grid gap-6 md:grid-cols-2"
            : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {cards.map((card, index) => (
          <BlogArticleCard key={`${title}-${index}`} card={card} compact />
        ))}
      </div>

      {moreHref && moreLabel ? (
        <div className="flex justify-end">
          <Link
            href={moreHref}
            className="inline-flex items-center gap-2 text-2xl font-medium text-primary underline underline-offset-4 transition-opacity hover:opacity-90"
          >
            <span>{moreLabel}</span>
            <ArrowRight className="size-6" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function BlogArticleCard({
  card,
  compact,
}: {
  card: BlogCardItem;
  compact: boolean;
}) {
  const isIllustration = card.imageSrc.endsWith(".svg");

  return (
    <Link
      href={getBlogArticleHref(card.id)}
      className="block rounded-[1.6rem] border border-primary/35 bg-white p-[30px] shadow-[0_18px_50px_-36px_rgba(73,96,188,0.28)] transition-transform hover:-translate-y-px"
    >
      <div className="overflow-hidden rounded-[1.2rem]">
        <Image
          src={card.imageSrc}
          alt={card.title}
          width={420}
          height={280}
          className={
            isIllustration
              ? compact
                ? "h-[230px] w-full object-cover object-center"
                : "h-[280px] w-full object-cover object-center"
              : compact
                ? "h-[230px] w-full object-cover"
                : "h-[280px] w-full object-cover"
          }
        />
      </div>

      <div className="space-y-3 pt-5">
        <p className="text-[13px] font-medium underline underline-offset-2">
          {card.category}
        </p>
        <h3 className="text-[1.1rem] font-medium leading-8 text-foreground">
          {card.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {card.date} | {card.readTime}
        </p>
      </div>
    </Link>
  );
}

