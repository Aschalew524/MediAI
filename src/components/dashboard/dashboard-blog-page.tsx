import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Newspaper } from "lucide-react";

import {
  getBlogArticleHref,
  type BlogArticleDto,
  type BlogArticlesListResponse,
} from "@/lib/blog-api";
import { cn } from "@/lib/utils";

import {
  DashboardBackLink,
  DashboardContainer,
  DashboardPage,
  DashboardPanel,
} from "./primitives";

export function DashboardBlogList({
  initial,
  error,
}: {
  initial: BlogArticlesListResponse | null;
  error?: string | null;
}) {
  const items = initial?.items ?? [];
  const total = initial?.total ?? 0;

  return (
    <DashboardPage>
      <DashboardContainer className="space-y-10 pb-12">
        <DashboardBackLink href="/dashboard" ariaLabel="Back to dashboard" />
        <div className="relative overflow-hidden rounded-3xl border border-primary/12 bg-linear-to-br from-primary/[0.07] via-background to-background px-6 py-8 shadow-[0_28px_80px_-50px_rgba(76,104,220,0.45)] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
                <BookOpen className="size-3.5" aria-hidden />
                MediAI blog
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Health articles &amp; updates
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Curated posts on AI-assisted care, wellness, and what is new in
                MediAI. Each card opens the full article.
              </p>
            </div>
            {initial ? (
              <div className="shrink-0 rounded-2xl border border-primary/10 bg-background/70 px-4 py-3 text-sm backdrop-blur-sm">
                <p className="font-medium text-foreground">{total}</p>
                <p className="text-muted-foreground">
                  article{total === 1 ? "" : "s"} available
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <DashboardPanel className="border-destructive/25 bg-destructive/5 px-6 py-10 text-center">
            <p className="font-medium text-destructive">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try again in a moment or open the public blog from the marketing
              site.
            </p>
          </DashboardPanel>
        ) : items.length === 0 ? (
          <DashboardPanel className="flex flex-col items-center gap-4 px-8 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Newspaper className="size-8" aria-hidden />
            </div>
            <p className="text-lg font-semibold text-foreground">No posts yet</p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              When articles are published from the admin blog, they will show up
              here for signed-in users.
            </p>
          </DashboardPanel>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((article) => (
              <DashboardBlogArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </DashboardContainer>
    </DashboardPage>
  );
}

function DashboardBlogArticleCard({ article }: { article: BlogArticleDto }) {
  const trimmedSrc = article.imageSrc?.trim() ?? "";
  const hasImage = trimmedSrc.length > 0;
  const isIllustration = trimmedSrc.endsWith(".svg");

  return (
    <Link
      href={getBlogArticleHref(article.id)}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-primary/12 bg-white shadow-[0_22px_70px_-48px_rgba(76,104,220,0.38)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_28px_80px_-44px_rgba(76,104,220,0.45)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
        {hasImage ? (
          <Image
            src={trimmedSrc}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className={cn(
              "object-cover transition duration-500 group-hover:scale-[1.03]",
              isIllustration && "object-center",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/12 via-primary/5 to-primary/10 text-primary/35">
            <Newspaper className="size-14" aria-hidden />
          </div>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-sm">
          Read
          <ArrowUpRight className="size-3.5 opacity-80" aria-hidden />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {article.category}
        </p>
        <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {article.title}
        </h2>
        <p className="mt-auto line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {article.intro}
        </p>
        <p className="text-xs text-muted-foreground">
          {article.date}
          <span className="mx-1.5 text-primary/30">·</span>
          {article.readTime}
        </p>
      </div>
    </Link>
  );
}
