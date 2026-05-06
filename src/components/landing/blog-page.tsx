"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { getFriendlyAxiosMessage } from "@/lib/axios-error-messages";
import {
  getBlogArticleHref,
  listBlogArticles,
  type BlogArticleDto,
  type BlogArticlesListResponse,
  type BlogHomeDto,
} from "@/lib/blog-api";
import { useLandingConfig } from "@/lib/hooks/use-app-config";

import { Container, LinkButton, SectionShell } from "./primitives";
import { SiteFooter, SiteHeader } from "./sections";

export type BlogCardItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  imageSrc: string;
};

export type BlogPageProps =
  | {
      variant: "ok";
      home: BlogHomeDto;
      articlesById: Record<string, BlogArticleDto>;
      exploreInitial: BlogArticlesListResponse;
    }
  | { variant: "error"; message: string };

function BlogImagePlaceholder({
  className,
  iconClassName = "size-10",
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={
        "flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 via-primary/5 to-primary/15 text-primary/50 " +
        (className ?? "")
      }
      aria-hidden
    >
      <Newspaper className={iconClassName} />
    </div>
  );
}

function articleToCard(a: BlogArticleDto): BlogCardItem {
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    date: a.date,
    readTime: a.readTime,
    imageSrc: a.imageSrc,
  };
}

function cardsForIds(ids: string[], byId: Record<string, BlogArticleDto>): BlogCardItem[] {
  const out: BlogCardItem[] = [];
  for (const id of ids) {
    const a = byId[id];
    if (a) out.push(articleToCard(a));
  }
  return out;
}

export function BlogPage(props: BlogPageProps) {
  const { data } = useLandingConfig();

  if (props.variant === "error") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader navItems={data.navItems} />
        <main>
          <SectionShell className="py-16">
            <Container className="max-w-xl space-y-4 text-center">
              <h1 className="text-2xl font-semibold">Blog temporarily unavailable</h1>
              <p className="text-sm text-muted-foreground">{props.message}</p>
              <Link
                href="/"
                className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to home
              </Link>
            </Container>
          </SectionShell>
        </main>
        <SiteFooter footerColumns={data.footerColumns} />
      </div>
    );
  }

  const { home, articlesById, exploreInitial } = props;

  const featuredArticle = home.featuredArticleId
    ? articlesById[home.featuredArticleId]
    : undefined;
  const popularArticles = cardsForIds(home.popularArticleIds, articlesById);
  const aiHealthcareArticles = cardsForIds(home.aiHealthcareArticleIds, articlesById);
  const secondOpinionArticles = cardsForIds(home.secondOpinionArticleIds, articlesById);
  const companyNewsArticles = cardsForIds(home.companyNewsArticleIds, articlesById);

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

              {featuredArticle ? (
                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <Link
                    href={getBlogArticleHref(featuredArticle.id)}
                    className="block overflow-hidden rounded-[1.3rem] border border-primary/15 bg-white shadow-[0_20px_60px_-40px_rgba(73,96,188,0.3)] transition-transform hover:-translate-y-px"
                  >
                    <div className="aspect-275/171 w-full bg-white">
                      {featuredArticle.imageSrc?.trim() ? (
                        <Image
                          src={featuredArticle.imageSrc}
                          alt={featuredArticle.title}
                          width={275}
                          height={171}
                          className="h-full w-full object-contain object-center"
                          priority
                        />
                      ) : (
                        <BlogImagePlaceholder iconClassName="size-12" />
                      )}
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
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  No featured article is configured. Browse sections below.
                </p>
              )}
            </section>

            {popularArticles.length > 0 ? (
              <BlogSection title="Popular Articles" cards={popularArticles} columns="two" />
            ) : null}

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

            {aiHealthcareArticles.length > 0 ? (
              <BlogSection
                id="ai-in-healthcare"
                title="AI In Healthcare"
                cards={aiHealthcareArticles}
                columns="three"
                moreHref="/blog#explore-more-topics"
                moreLabel="All AI in Healthcare Topics"
              />
            ) : null}

            {secondOpinionArticles.length > 0 ? (
              <BlogSection
                id="medical-second-opinions"
                title="Medical Second Opinions"
                cards={secondOpinionArticles}
                columns="three"
                moreHref="/blog#company-news"
                moreLabel="All Medical Second Opinions Topics"
              />
            ) : null}

            {companyNewsArticles.length > 0 ? (
              <BlogSection
                id="company-news"
                title="Company News"
                cards={companyNewsArticles}
                columns="three"
                moreHref="/blog#explore-more-topics"
                moreLabel="All Company News Topics"
              />
            ) : null}

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

            <BlogExploreSection initial={exploreInitial} />
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

const EXPLORE_PAGE_SIZE = 12;

function BlogExploreSection({ initial }: { initial: BlogArticlesListResponse }) {
  const [items, setItems] = useState<BlogCardItem[]>(() =>
    initial.items.map(articleToCard),
  );
  const [page, setPage] = useState(initial.page);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setLoadError(null);
    try {
      const next = page + 1;
      const res = await listBlogArticles({ page: next, pageSize: EXPLORE_PAGE_SIZE });
      setPage(res.page);
      setTotal(res.total);
      setItems((prev) => [...prev, ...res.items.map(articleToCard)]);
    } catch (e: unknown) {
      setLoadError(getFriendlyAxiosMessage(e, "Could not load more articles."));
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page]);

  return (
    <section id="explore-more-topics" className="space-y-8">
      <h2 className="text-center text-4xl font-semibold tracking-tight">Explore More Topics</h2>
      {loadError ? (
        <p className="text-center text-sm text-destructive">{loadError}</p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((card) => (
          <BlogArticleCard key={card.id} card={card} compact={false} />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
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
      <h2 className="text-center text-4xl font-semibold tracking-tight">{title}</h2>

      <div
        className={
          columns === "two"
            ? "grid gap-6 md:grid-cols-2"
            : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {cards.map((card) => (
          <BlogArticleCard key={`${title}-${card.id}`} card={card} compact />
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

function BlogArticleCard({ card, compact }: { card: BlogCardItem; compact: boolean }) {
  const trimmedSrc = card.imageSrc?.trim() ?? "";
  const hasImage = trimmedSrc.length > 0;
  const isIllustration = trimmedSrc.endsWith(".svg");
  const imgHeightClass = compact ? "h-[230px]" : "h-[280px]";

  return (
    <Link
      href={getBlogArticleHref(card.id)}
      className="block rounded-[1.6rem] border border-primary/35 bg-white p-[30px] shadow-[0_18px_50px_-36px_rgba(73,96,188,0.28)] transition-transform hover:-translate-y-px"
    >
      <div className={`overflow-hidden rounded-[1.2rem] ${imgHeightClass}`}>
        {hasImage ? (
          <Image
            src={trimmedSrc}
            alt={card.title}
            width={420}
            height={280}
            className={
              isIllustration
                ? `${imgHeightClass} w-full object-cover object-center`
                : `${imgHeightClass} w-full object-cover`
            }
          />
        ) : (
          <BlogImagePlaceholder iconClassName="size-14" />
        )}
      </div>

      <div className="space-y-3 pt-5">
        <p className="text-[13px] font-medium underline underline-offset-2">{card.category}</p>
        <h3 className="text-[1.1rem] font-medium leading-8 text-foreground">{card.title}</h3>
        <p className="text-sm text-muted-foreground">
          {card.date} | {card.readTime}
        </p>
      </div>
    </Link>
  );
}
